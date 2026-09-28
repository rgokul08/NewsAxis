import { Query } from 'appwrite';
import { databases, isConfigured } from './appwriteClient';
import { APP_CONFIG } from '../config/appConfig';
import { normalizeArticle, deduplicateArticles, calculateTrendingScore } from '../utils/normalizeArticle';
import { formatIST } from '../utils/istDate';

const LOCAL_STORAGE_ARTICLES_KEY = 'newsaxis_local_articles';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'newsaxis_local_bookmarks';
const LOCAL_STORAGE_REACTIONS_KEY = 'newsaxis_local_reactions';
const LOCAL_STORAGE_SYNC_KEY = 'newsaxis_last_sync_time';

/**
 * Core Article and Feed Service
 * Primary source of truth: Appwrite Cloud Database (`articles` collection).
 * High-performance fallbacks: /api/news (serverless/server endpoint) and resilient local caching.
 * Strictly uses real-world news only (zero mock/demo data).
 */
class ArticleService {
  constructor() {
    this.memoryArticles = new Map();
    this.lastSyncTime = Date.now();
    this.initLocalStore();
  }

  initLocalStore() {
    if (typeof window !== 'undefined') {
      try {
        const savedSync = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY);
        if (savedSync) this.lastSyncTime = parseInt(savedSync, 10);

        const saved = localStorage.getItem(LOCAL_STORAGE_ARTICLES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.forEach(art => {
            if (this.isExpired(art)) return;
            this.memoryArticles.set(art.id, art);
          });
        }
      } catch (err) {
        console.warn('[ArticleService] Local storage load skipped', err);
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
      console.warn('[ArticleService] Failed to persist articles to localStorage', e);
    }
  }

  mapAppwriteDoc(doc) {
    const pubDate = doc.publishedAt || doc.$createdAt || new Date().toISOString();
    return {
      id: doc.$id || doc.id,
      title: doc.title,
      slug: doc.slug,
      summary: doc.summary || doc.description || '',
      description: doc.description || doc.summary || '',
      content: doc.content || doc.summary || '',
      imageUrl: doc.imageUrl || '',
      sourceName: doc.sourceName || doc.source || 'NewsAxis',
      sourceUrl: doc.sourceUrl || doc.url || '',
      url: doc.sourceUrl || doc.url || '',
      authorName: doc.authorName || doc.author || 'NewsAxis Desk',
      categoryId: doc.categoryId || doc.category || 'world',
      categorySlug: doc.categoryId || doc.category || 'world',
      providerId: doc.provider || 'appwrite',
      language: doc.language || 'en',
      contentType: doc.contentType || 'news',
      sourceType: doc.sourceType || 'external_news',
      publishedAt: pubDate,
      publishedAtIST: formatIST(pubDate),
      createdAt: doc.createdAt || doc.$createdAt,
      expiresAt: doc.expiresAt,
      isBreaking: Boolean(doc.isBreaking),
      isFeatured: Boolean(doc.isFeatured),
      views: Number(doc.views || 1),
      readingTime: Number(doc.readingTime || 3)
    };
  }

  buildFeedPayload(articles = [], sourceName = 'database') {
    const combined = deduplicateArticles(articles);
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
      source: sourceName,
      isFromDatabase: true,
      lastSyncIST: formatIST(new Date(this.lastSyncTime))
    };
  }

  /**
   * Fetches home feed:
   * 1. Reads directly from Appwrite Cloud (`articles` collection) for instant load.
   * 2. If empty or collection unconfigured, queries /api/news.
   * 3. Falls back to persisted local cache.
   * 4. Triggers automatic on-demand sync (/api/sync) if all stores are empty.
   */
  async getHomeFeed() {
    this.cleanupExpired();

    // 1. Direct Appwrite Database Query (Immediate loading from Appwrite)
    if (isConfigured && databases) {
      try {
        const dbId = APP_CONFIG.appwrite.databaseId;
        const colId = APP_CONFIG.appwrite.collections.articles || 'articles';
        const res = await databases.listDocuments(dbId, colId, [
          Query.orderDesc('publishedAt'),
          Query.limit(50)
        ]);

        if (res && Array.isArray(res.documents) && res.documents.length > 0) {
          const appwriteArticles = res.documents
            .map(doc => this.mapAppwriteDoc(doc))
            .filter(a => !this.isExpired(a));

          if (appwriteArticles.length > 0) {
            appwriteArticles.forEach(art => this.memoryArticles.set(art.id, art));
            this.lastSyncTime = Date.now();
            this.persistLocalArticles();
            return this.buildFeedPayload(appwriteArticles, 'appwrite_cloud');
          }
        }
      } catch (appwriteErr) {
        console.warn('[ArticleService] Direct Appwrite query note:', appwriteErr.message);
      }
    }

    // 2. Query /api/news backend/serverless endpoint
    try {
      const res = await fetch('/api/news', { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.all) && data.all.length > 0) {
            data.all.forEach(art => {
              if (!this.isExpired(art)) this.memoryArticles.set(art.id, art);
            });
            this.lastSyncTime = Date.now();
            this.persistLocalArticles();
            return {
              ...data,
              source: 'api_server',
              isFromDatabase: true,
              lastSyncIST: formatIST(new Date(this.lastSyncTime))
            };
          }
        }
      }
    } catch (serverErr) {
      console.warn('[ArticleService] API /api/news note:', serverErr.message);
    }

    // 3. Fallback to persisted local memory articles
    const localArticles = Array.from(this.memoryArticles.values()).filter(a => !this.isExpired(a));
    if (localArticles.length > 0) {
      return this.buildFeedPayload(localArticles, 'local_cache');
    }

    // 4. Trigger on-demand sync (/api/sync) if completely empty
    try {
      const syncRes = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.articles && syncData.articles.length > 0) {
          syncData.articles.forEach(art => {
            if (!this.isExpired(art)) this.memoryArticles.set(art.id, art);
          });
          this.lastSyncTime = Date.now();
          this.persistLocalArticles();
          return this.buildFeedPayload(syncData.articles, 'on_demand_sync');
        }
      }
    } catch {
      // quiet fallback
    }

    return {
      breaking: [],
      featured: null,
      latest: [],
      trending: [],
      communityBlogs: [],
      all: [],
      total: 0,
      isEmpty: true,
      lastSyncIST: formatIST(new Date(this.lastSyncTime))
    };
  }

  /**
   * Fetches articles by category
   */
  async getByCategory(categorySlug, { page = 1, limit = 12 } = {}) {
    const slugLower = (categorySlug || '').toLowerCase();

    // 1. Try querying Appwrite directly
    if (isConfigured && databases) {
      try {
        const dbId = APP_CONFIG.appwrite.databaseId;
        const colId = APP_CONFIG.appwrite.collections.articles || 'articles';
        const res = await databases.listDocuments(dbId, colId, [
          Query.equal('categoryId', slugLower),
          Query.orderDesc('publishedAt'),
          Query.limit(limit),
          Query.offset((page - 1) * limit)
        ]);

        if (res && res.documents.length > 0) {
          const items = res.documents.map(d => this.mapAppwriteDoc(d));
          return {
            items,
            total: res.total,
            page,
            hasMore: page * limit < res.total
          };
        }
      } catch {
        // quiet fallback
      }
    }

    // 2. Try server endpoint
    try {
      const res = await fetch(`/api/news?category=${encodeURIComponent(slugLower)}&page=${page}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          return {
            items: data.articles,
            total: data.total,
            page,
            hasMore: data.hasMore
          };
        }
      }
    } catch {
      // quiet fallback
    }

    // 3. Fallback to memory articles
    const feed = await this.getHomeFeed();
    const filtered = feed.all.filter(a =>
      (a.categorySlug || '').toLowerCase() === slugLower ||
      (a.categoryId || '').toLowerCase() === slugLower
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
   * Search Articles
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
      // Fallback to local memory search
    }

    // 2. Client-side memory fallback with relevance scoring
    const feed = await this.getHomeFeed();
    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(t => t.length > 1);

    const scored = feed.all.map(a => {
      let score = 0;
      const titleLower = (a.title || '').toLowerCase();
      const summaryLower = (a.summary || a.description || '').toLowerCase();
      const contentLower = (a.content || '').toLowerCase();
      const authorLower = (a.authorName || a.author || '').toLowerCase();
      const sourceLower = (a.sourceName || a.source || '').toLowerCase();
      const catLower = (a.categoryId || a.categorySlug || '').toLowerCase();

      if (titleLower === q) score += 200;
      else if (titleLower.includes(q)) score += 100;

      if (summaryLower.includes(q)) score += 50;
      if (catLower === q) score += 40;
      if (sourceLower.includes(q) || authorLower.includes(q)) score += 30;

      for (const token of tokens) {
        if (titleLower.includes(token)) score += 25;
        if (summaryLower.includes(token)) score += 15;
        if (catLower.includes(token)) score += 10;
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
      results = results.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
    } else if (type === 'news') {
      results = results.filter(a => a.contentType === 'news' || (a.sourceType && a.sourceType.includes('news')));
    }

    return results;
  }

  /**
   * Fetches single article by slug
   */
  async getBySlug(slug) {
    // 1. Try Appwrite directly
    if (isConfigured && databases) {
      try {
        const dbId = APP_CONFIG.appwrite.databaseId;
        const colId = APP_CONFIG.appwrite.collections.articles || 'articles';
        const res = await databases.listDocuments(dbId, colId, [
          Query.equal('slug', slug),
          Query.limit(1)
        ]);

        if (res && res.documents.length > 0) {
          const art = this.mapAppwriteDoc(res.documents[0]);
          this.memoryArticles.set(art.id, art);
          return art;
        }
      } catch {
        // quiet
      }
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

    // 3. Query server endpoint
    try {
      const res = await fetch(`/api/news?search=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          const match = data.articles.find(a => a.slug === slug);
          if (match) {
            this.memoryArticles.set(match.id, match);
            return match;
          }
        }
      }
    } catch {
      // quiet
    }

    throw new Error('ARTICLE_NOT_FOUND');
  }

  /**
   * Creates or Submits a user community article
   * Enforces 1-Day (24-Hour) retention ceiling
   */
  async createCommunityArticle(data, author) {
    if (author?.role === 'reader') {
      throw new Error('Readers are not authorized to publish stories. Please switch your account role to Author.');
    }

    const now = new Date();
    const retentionMs = (APP_CONFIG.USER_POST_RETENTION_HOURS || 24) * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + retentionMs).toISOString();

    const normalized = normalizeArticle({
      ...data,
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      authorId: author?.id || author?.$id || 'author',
      authorName: author?.name || 'Community Author',
      authorUrl: author?.username ? `/author/${author.username}` : '',
      sourceType: data.sourceType || 'community_blog',
      sourceName: author?.name ? `${author.name} (NewsAxis Author)` : 'Community Author',
      createdAt: now.toISOString(),
      publishedAt: now.toISOString(),
      expiresAt,
      status: 'published',
      views: 1,
      uniqueViews: 1
    });

    // Save to Appwrite if configured
    if (isConfigured && databases) {
      try {
        await databases.createDocument(
          APP_CONFIG.appwrite.databaseId,
          APP_CONFIG.appwrite.collections.articles,
          normalized.id,
          {
            title: normalized.title.slice(0, 500),
            slug: normalized.slug.slice(0, 255),
            summary: (normalized.summary || '').slice(0, 2000),
            description: (normalized.description || '').slice(0, 2000),
            content: (normalized.content || '').slice(0, 10000),
            imageUrl: normalized.imageUrl || '',
            sourceName: normalized.sourceName || 'NewsAxis Community',
            authorName: normalized.authorName || 'Author',
            categoryId: normalized.categoryId || 'world',
            publishedAt: normalized.publishedAt,
            createdAt: normalized.createdAt,
            expiresAt: normalized.expiresAt,
            isBreaking: false,
            isFeatured: false,
            views: 1,
            readingTime: normalized.readingTime || 3
          }
        );
      } catch (err) {
        console.warn('[ArticleService] Appwrite creation note:', err.message);
      }
    }

    this.memoryArticles.set(normalized.id, normalized);
    this.persistLocalArticles();
    return normalized;
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
        if (data.articles && data.articles.length > 0) {
          data.articles.forEach(art => {
            if (!this.isExpired(art)) this.memoryArticles.set(art.id, art);
          });
          this.persistLocalArticles();
        }
        return data;
      }
    } catch {
      // quiet fallback
    }

    this.cleanupExpired();
    this.lastSyncTime = Date.now();
    return await this.getHomeFeed();
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
   * Nearby feed based on geolocation
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
