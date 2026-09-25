import { databases, isConfigured } from './appwriteClient';
import { APP_CONFIG } from '../config/appConfig';
import { normalizeArticle, deduplicateArticles, calculateTrendingScore } from '../utils/normalizeArticle';
import { providerRegistry } from '../providers';
import { SEED_ARTICLES } from '../constants/seedData';

const LOCAL_STORAGE_ARTICLES_KEY = 'newsaxis_local_articles';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'newsaxis_local_bookmarks';
const LOCAL_STORAGE_REACTIONS_KEY = 'newsaxis_local_reactions';
const LOCAL_STORAGE_SYNC_KEY = 'newsaxis_last_sync_time';

/**
 * Core Article and Feed Service
 * Connects to the 30-minute Database Server (/api) when running,
 * and maintains resilient client-side storage, 30-minute auto-purge, and fallback aggregation.
 */
class ArticleService {
  constructor() {
    this.memoryArticles = new Map();
    this.lastSyncTime = Date.now();
    this.initLocalStore();
  }

  initLocalStore() {
    // Seed initial articles into memory with 30-min expiration if unexpired
    const now = Date.now();
    SEED_ARTICLES.forEach(art => {
      const artWithExpiry = {
        ...art,
        expiresAt: art.expiresAt || new Date(now + (APP_CONFIG.RETENTION_MINUTES * 60 * 1000)).toISOString()
      };
      if (!this.isExpired(artWithExpiry)) {
        this.memoryArticles.set(artWithExpiry.id, artWithExpiry);
      }
    });

    // Load saved articles from local storage
    if (typeof window !== 'undefined') {
      try {
        const savedSync = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY);
        if (savedSync) this.lastSyncTime = parseInt(savedSync, 10);

        const saved = localStorage.getItem(LOCAL_STORAGE_ARTICLES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.forEach(art => {
            // Strictly enforce 30-minute expiration
            if (this.isExpired(art)) return;
            this.memoryArticles.set(art.id, art);
          });
        }
      } catch (err) {
        console.warn('Local storage article load skipped', err);
      }
    }
  }

  isExpired(article) {
    if (!article.expiresAt) return false;
    return new Date(article.expiresAt).getTime() <= Date.now();
  }

  persistLocalArticles() {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.memoryArticles.values()).filter(a => !this.isExpired(a));
      localStorage.setItem(LOCAL_STORAGE_ARTICLES_KEY, JSON.stringify(arr));
      localStorage.setItem(LOCAL_STORAGE_SYNC_KEY, String(this.lastSyncTime));
    } catch (e) {
      console.warn('Failed to persist articles to localStorage', e);
    }
  }

  /**
   * Fetches home feed: queries database server first (/api/news),
   * falls back to direct provider aggregation if backend is not running.
   */
  async getHomeFeed() {
    // Clean up expired items prior to serving feed
    this.cleanupExpired();

    // 1. Try fetching from Backend Database Server
    try {
      const res = await fetch('/api/news', { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.all) && data.all.length > 0) {
          // Synchronize local memory with database server articles
          data.all.forEach(art => {
            if (!this.isExpired(art)) {
              this.memoryArticles.set(art.id, art);
            }
          });
          this.lastSyncTime = Date.now();
          this.persistLocalArticles();

          return {
            breaking: data.breaking || [],
            featured: data.featured || data.all[0] || null,
            latest: data.latest || data.all.slice(0, 20),
            trending: data.trending || [],
            communityBlogs: data.communityBlogs || [],
            all: data.all,
            total: data.total,
            isFromDatabaseServer: true
          };
        }
      }
    } catch (serverErr) {
      // Backend not running; proceed with client fallback
    }

    // 2. Client-side Fallback Aggregation
    let externalItems = [];
    try {
      externalItems = await providerRegistry.aggregateAll({ limit: 40 });
      // Attach 30-min expiration
      const now = Date.now();
      const expiresAt = new Date(now + (APP_CONFIG.RETENTION_MINUTES * 60 * 1000)).toISOString();
      externalItems = externalItems.map(item => ({
        ...item,
        expiresAt: item.expiresAt || expiresAt
      }));
    } catch (e) {
      console.warn('Provider aggregation fallback', e);
    }

    // 3. Combine with memory/local/Appwrite articles
    const internalArticles = Array.from(this.memoryArticles.values()).filter(a => !this.isExpired(a));
    const combined = deduplicateArticles([...internalArticles, ...externalItems]);

    // Save to memory
    combined.forEach(art => this.memoryArticles.set(art.id, art));
    this.persistLocalArticles();

    // Partition sections
    const breaking = combined.filter(a => a.isBreaking);
    const featured = combined.find(a => a.isFeatured) || combined[0] || null;
    const latest = [...combined].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    const trending = [...combined]
      .map(a => ({ ...a, trendingScore: calculateTrendingScore(a) }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);
    const communityBlogs = combined.filter(a => 
      a.contentType === 'blog' || 
      a.sourceType === 'community_blog' || 
      a.sourceType === 'external_blog'
    );

    return {
      breaking,
      featured,
      latest: latest.slice(0, 20),
      trending,
      communityBlogs,
      all: combined,
      total: combined.length,
      isFromDatabaseServer: false
    };
  }

  /**
   * Fetches articles by category
   */
  async getByCategory(categorySlug, { page = 1, limit = 12 } = {}) {
    const feed = await this.getHomeFeed();
    const filtered = feed.all.filter(a => 
      a.categorySlug?.toLowerCase() === categorySlug.toLowerCase() || 
      a.categoryId?.toLowerCase() === categorySlug.toLowerCase()
    );

    const start = (page - 1) * limit;
    return {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      hasMore: start + limit < filtered.length
    };
  }

  /**
   * Search Articles: queries server first, falls back to memory search with multi-token relevance scoring
   */
  async searchArticles(query = '', { category = 'all', type = 'all' } = {}) {
    if (!query || !query.trim()) return [];

    // 1. Try server search
    try {
      const url = new URL('/api/news', window.location.origin);
      url.searchParams.set('search', query.trim());
      if (category && category !== 'all') url.searchParams.set('category', category);
      if (type && type !== 'all') url.searchParams.set('type', type);

      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          return data.articles;
        }
      }
    } catch {
      // Backend unavailable, fallback to local memory search
    }

    // 2. Client-side memory fallback with relevance scoring
    const feed = await this.getHomeFeed();
    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(t => t.length > 1);

    const scored = feed.all.map(a => {
      let score = 0;
      const titleLower = (a.title || '').toLowerCase();
      const summaryLower = (a.summary || '').toLowerCase();
      const contentLower = (a.content || '').toLowerCase();
      const authorLower = (a.authorName || '').toLowerCase();
      const sourceLower = (a.sourceName || '').toLowerCase();
      const catLower = (a.categoryId || a.categorySlug || '').toLowerCase();
      const tagsLower = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';

      if (titleLower === q) score += 200;
      else if (titleLower.includes(q)) score += 100;

      if (summaryLower.includes(q)) score += 50;
      if (catLower === q || tagsLower.includes(q)) score += 40;
      if (sourceLower.includes(q) || authorLower.includes(q)) score += 30;

      for (const token of tokens) {
        if (titleLower.includes(token)) score += 25;
        if (summaryLower.includes(token)) score += 15;
        if (catLower.includes(token) || tagsLower.includes(token)) score += 10;
        if (contentLower.includes(token)) score += 5;
      }

      return { article: a, score };
    });

    let results = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.article.publishedAt) - new Date(a.article.publishedAt))
      .map(item => item.article);

    if (category && category !== 'all') {
      results = results.filter(a => a.categoryId === category || a.categorySlug === category);
    }
    if (type === 'blogs') {
      results = results.filter(a => a.contentType === 'blog' || a.sourceType.includes('blog'));
    } else if (type === 'news') {
      results = results.filter(a => a.contentType === 'news' || a.sourceType.includes('news'));
    }

    return results;
  }

  /**
   * Fetches nearby news & community blogs based on user geolocation
   */
  async getNearbyFeed(location = {}) {
    const feed = await this.getHomeFeed();
    const city = (location.city || '').toLowerCase();
    const region = (location.region || '').toLowerCase();

    const regional = feed.all.filter(a => {
      const text = `${a.title || ''} ${a.summary || ''} ${a.content || ''} ${a.categorySlug || ''}`.toLowerCase();
      if (region && text.includes(region)) return true;
      if (city && text.includes(city)) return true;
      if (a.categorySlug === 'india' || a.categorySlug === 'tamil-nadu') return true;
      return false;
    });

    const nearbyBlogs = feed.communityBlogs.filter(b => {
      const text = `${b.title || ''} ${b.summary || ''} ${b.content || ''}`.toLowerCase();
      if (region && text.includes(region)) return true;
      if (city && text.includes(city)) return true;
      return true;
    });

    return {
      location,
      articles: regional.length > 0 ? regional.slice(0, 8) : feed.all.slice(0, 8),
      blogs: nearbyBlogs.slice(0, 4)
    };
  }

  /**
   * Fetches single article by slug
   */
  async getBySlug(slug) {
    // 1. Try server endpoint
    try {
      const res = await fetch(`/api/news/${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.article) {
          this.memoryArticles.set(data.article.id, data.article);
          return data.article;
        }
      }
    } catch {
      // fallback
    }

    // 2. Check in memory
    for (const art of this.memoryArticles.values()) {
      if (art.slug === slug) {
        if (this.isExpired(art)) {
          throw new Error('CONTENT_EXPIRED');
        }
        return art;
      }
    }

    // 3. Fallback search
    const external = await providerRegistry.aggregateAll({ limit: 50 });
    const found = external.find(a => a.slug === slug);
    if (found) {
      this.memoryArticles.set(found.id, found);
      return found;
    }

    throw new Error('ARTICLE_NOT_FOUND');
  }

  /**
   * Creates or Submits a user community article
   * Enforces 1-Day (24-Hour) retention ceiling (auto-deleted after 1 day)
   */
  async createCommunityArticle(data, author) {
    const now = new Date();
    // 1-Day (24 hours) retention for user uploaded news and blogs
    const retentionMs = (APP_CONFIG.USER_POST_RETENTION_HOURS || 24) * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + retentionMs).toISOString();

    const normalized = normalizeArticle({
      ...data,
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      authorId: author?.id || author?.$id || 'guest_user',
      authorName: author?.name || 'Community Contributor',
      authorUrl: author?.username ? `/author/${author.username}` : '',
      sourceType: data.sourceType || 'community_blog',
      sourceName: 'NewsAxis Community',
      createdAt: now.toISOString(),
      publishedAt: now.toISOString(),
      expiresAt, // Strictly 1 day (24 hours) for user uploads
      status: 'published',
      views: 1,
      uniqueViews: 1
    });

    // Try sending to backend server
    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized)
      });
    } catch {
      // server offline, persist locally
    }

    // Save to Appwrite if configured
    if (isConfigured) {
      try {
        await databases.createDocument(
          APP_CONFIG.appwrite.databaseId,
          APP_CONFIG.appwrite.collections.articles,
          normalized.id,
          normalized
        );
      } catch (err) {
        console.warn('Appwrite document creation skipped or failed, using local store', err);
      }
    }

    this.memoryArticles.set(normalized.id, normalized);
    this.persistLocalArticles();
    return normalized;
  }

  /**
   * Performs 30-minute cleanup: deletes all expired articles locally
   */
  cleanupExpired() {
    let deletedCount = 0;
    for (const [id, art] of this.memoryArticles.entries()) {
      if (this.isExpired(art)) {
        this.memoryArticles.delete(id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.persistLocalArticles();
    }
    return { deletedCount };
  }

  /**
   * Retrieves Sync Radar Status from database server or computes client-side
   */
  async getSyncStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // server offline
    }

    const cycleMs = APP_CONFIG.SYNC_INTERVAL_MS;
    const elapsed = Date.now() - this.lastSyncTime;
    const secondsUntilNext = Math.max(0, Math.floor((cycleMs - (elapsed % cycleMs)) / 1000));
    const active = Array.from(this.memoryArticles.values()).filter(a => !this.isExpired(a)).length;

    return {
      status: 'client_active',
      isSyncing: false,
      cycleMinutes: APP_CONFIG.RETENTION_MINUTES,
      secondsUntilNextSync: secondsUntilNext,
      lastSyncAt: new Date(this.lastSyncTime).toISOString(),
      nextSyncAt: new Date(this.lastSyncTime + cycleMs).toISOString(),
      activeArticles: active,
      totalPurgedHistorical: 0,
      database: 'Client IndexedDB / LocalStorage'
    };
  }

  /**
   * Manually trigger an immediate 30-min cycle refresh
   */
  async triggerManualSync() {
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        this.lastSyncTime = Date.now();
        return data;
      }
    } catch {
      // server offline
    }

    this.cleanupExpired();
    this.lastSyncTime = Date.now();
    return await this.getHomeFeed();
  }

  /**
   * Bookmarks management
   */
  getBookmarks() {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  toggleBookmark(article) {
    const current = this.getBookmarks();
    const index = current.findIndex(b => b.id === article.id);
    let updated;
    let isBookmarked;

    if (index >= 0) {
      updated = current.filter(b => b.id !== article.id);
      isBookmarked = false;
    } else {
      updated = [
        {
          id: article.id,
          title: article.title,
          slug: article.slug,
          imageUrl: article.imageUrl,
          sourceName: article.sourceName,
          categorySlug: article.categorySlug || article.categoryId,
          publishedAt: article.publishedAt,
          readingTime: article.readingTime,
          savedAt: new Date().toISOString()
        },
        ...current
      ];
      isBookmarked = true;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
    }
    return { isBookmarked, bookmarks: updated };
  }

  isBookmarked(articleId) {
    return this.getBookmarks().some(b => b.id === articleId);
  }

  /**
   * Reactions management
   */
  getReaction(articleId) {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REACTIONS_KEY);
      const map = saved ? JSON.parse(saved) : {};
      return map[articleId] || null;
    } catch {
      return null;
    }
  }

  setReaction(articleId, reactionType) {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REACTIONS_KEY);
      const map = saved ? JSON.parse(saved) : {};
      if (map[articleId] === reactionType) {
        delete map[articleId];
      } else {
        map[articleId] = reactionType;
      }
      localStorage.setItem(LOCAL_STORAGE_REACTIONS_KEY, JSON.stringify(map));
      return map[articleId] || null;
    } catch {
      return null;
    }
  }
}

export const articleService = new ArticleService();
export default articleService;
