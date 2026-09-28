import { Query } from 'appwrite';
import { databases, isConfigured } from './appwriteClient';
import { APP_CONFIG } from '../config/appConfig';
import { calculateTrendingScore, deduplicateArticles } from '../utils/normalizeArticle';
import { formatIST } from '../utils/istDate';

const ARTICLES_COLLECTION = APP_CONFIG.appwrite.collections.articles;
const LOCAL_STORAGE_BOOKMARKS_KEY = 'newsaxis_local_bookmarks';
const LOCAL_STORAGE_REACTIONS_KEY = 'newsaxis_local_reactions';

/**
 * ArticleService — READS ONLY FROM APPWRITE & RESILIENT BACKEND PIPELINE.
 *
 * The site never calls external news/blog APIs directly from the browser.
 * All external ingestion happens server-side (server/index.js, Vercel cron,
 * or Appwrite Function in appwrite/functions/sync-news) on a 30-minute IST schedule,
 * which writes normalized, categorized, deduplicated articles into the Appwrite
 * `articles` collection. This service queries that collection directly with
 * seamless fallback to /api/news.
 */
class ArticleService {
  constructor() {
    this.memoryArticles = new Map();
    this.lastSyncTime = Date.now();
  }

  mapDoc = (doc) => {
    const pubDate = doc.publishedAt || doc.createdAt || doc.$createdAt || new Date().toISOString();
    return {
      id: doc.$id || doc.id,
      externalId: doc.externalId || doc.external_id || null,
      providerId: doc.providerId || doc.provider || 'appwrite',
      sourceType: doc.sourceType || 'external_news',
      contentType: doc.contentType || 'news',
      title: doc.title || '',
      slug: doc.slug || '',
      summary: doc.summary || doc.description || '',
      description: doc.description || doc.summary || '',
      content: doc.content || doc.summary || '',
      imageUrl: doc.imageUrl || '',
      sourceName: doc.sourceName || doc.source || 'NewsAxis',
      sourceUrl: doc.sourceUrl || doc.url || '',
      url: doc.sourceUrl || doc.url || '',
      authorName: doc.authorName || doc.author || 'Staff',
      categoryId: doc.categoryId || doc.category || 'world',
      categorySlug: doc.categoryId || doc.category || 'world',
      tags: (() => {
        try {
          return typeof doc.tags === 'string' ? JSON.parse(doc.tags) : (Array.isArray(doc.tags) ? doc.tags : []);
        } catch {
          return [];
        }
      })(),
      publishedAt: pubDate,
      publishedAtIST: formatIST(pubDate),
      createdAt: doc.createdAt || doc.$createdAt || pubDate,
      expiresAt: doc.expiresAt,
      isBreaking: Boolean(doc.isBreaking),
      isFeatured: Boolean(doc.isFeatured),
      views: doc.views || 0,
      readingTime: doc.readingTime || 3,
      reactions: doc.reactions || { like: 0, helpful: 0, interesting: 0, insightful: 0 }
    };
  };

  async listActive({ limit = 60, offset = 0, category = null, contentType = null } = {}) {
    if (!isConfigured || !databases) {
      return { items: [], total: 0 };
    }
    const nowIso = new Date().toISOString();
    const queries = [
      Query.greaterThan('expiresAt', nowIso),
      Query.orderDesc('publishedAt'),
      Query.limit(limit),
      Query.offset(offset)
    ];
    if (category) queries.push(Query.equal('categoryId', category));
    if (contentType) queries.push(Query.equal('contentType', contentType));

    try {
      let res = await databases.listDocuments(
        APP_CONFIG.appwrite.databaseId,
        ARTICLES_COLLECTION,
        queries
      );

      // If strict expiresAt filter returned 0, query latest without expiresAt constraint
      if (res.documents.length === 0) {
        const fallbackQueries = [
          Query.orderDesc('publishedAt'),
          Query.limit(limit),
          Query.offset(offset)
        ];
        if (category) fallbackQueries.push(Query.equal('categoryId', category));
        if (contentType) fallbackQueries.push(Query.equal('contentType', contentType));
        res = await databases.listDocuments(
          APP_CONFIG.appwrite.databaseId,
          ARTICLES_COLLECTION,
          fallbackQueries
        );
      }

      return { items: res.documents.map(this.mapDoc), total: res.total };
    } catch (err) {
      console.warn('[ArticleService] listActive Appwrite error:', err.message);
      return { items: [], total: 0 };
    }
  }

  async getHomeFeed({ limit = 100, forceFresh = false } = {}) {
    let all = [];

    if (!forceFresh) {
      // 1. Primary: Read from Appwrite
      const res = await this.listActive({ limit });
      all = res.items || [];

      // Check if data from Appwrite is stale (>20m old)
      if (all.length > 0) {
        const newestPub = new Date(all[0].publishedAt || all[0].createdAt).getTime();
        const ageMinutes = (Date.now() - newestPub) / (60 * 1000);
        if (ageMinutes > 20) {
          // Stale news in database: trigger background refresh from live feeds
          fetch(`/api/news?refresh=true&_t=${Date.now()}`, { cache: 'no-store' }).catch(() => {});
        }
      }
    }

    // 2. If forced fresh or Appwrite returned 0 items, query /api/news
    if (all.length === 0 || forceFresh) {
      try {
        const refreshParam = forceFresh ? 'refresh=true&' : '';
        const res = await fetch(`/api/news?${refreshParam}_t=${Date.now()}`, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.all) && data.all.length > 0) {
            all = data.all.map(this.mapDoc);
          }
        }
      } catch {
        // Quiet
      }
    }

    // 3. Fallback: Trigger on-demand sync (/api/sync) if still empty
    if (all.length === 0) {
      try {
        const syncRes = await fetch(`/api/sync?trigger=on_demand&_t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.articles && syncData.articles.length > 0) {
            all = syncData.articles.map(this.mapDoc);
          }
        }
      } catch {
        // Quiet
      }
    }

    // Sort by publishedAt DESC to ensure newest news is always on top
    all.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

    const breaking = all.filter(a => a.isBreaking).slice(0, 10);
    const featured = all.find(a => a.isFeatured) || all[0] || null;
    const latest = [...all].slice(0, 20);
    const trending = [...all]
      .map(a => ({ ...a, trendingScore: calculateTrendingScore(a) }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);
    const communityBlogs = all.filter(a =>
      a.contentType === 'blog' || a.sourceType === 'community_blog' || a.sourceType === 'external_blog'
    );

    all.forEach(art => this.memoryArticles.set(art.id, art));
    this.lastSyncTime = Date.now();

    return {
      breaking,
      featured,
      latest,
      trending,
      communityBlogs,
      all,
      total: all.length,
      lastSyncIST: formatIST(new Date())
    };
  }

  async getByCategory(categorySlug, { page = 1, limit = 12, forceFresh = false } = {}) {
    const offset = (page - 1) * limit;
    let { items, total } = await this.listActive({ limit, offset, category: categorySlug });

    if (items.length === 0 || forceFresh) {
      // Fallback via /api/news
      try {
        const res = await fetch(`/api/news?category=${encodeURIComponent(categorySlug)}&page=${page}&limit=${limit}&_t=${Date.now()}`, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
            return {
              items: data.articles.map(this.mapDoc),
              total: data.total,
              page,
              hasMore: data.hasMore
            };
          }
        }
      } catch {
        // Quiet
      }
    }

    return { items, total, page, hasMore: offset + limit < total };
  }

  async searchArticles(query = '', { category = 'all', type = 'all' } = {}) {
    if (!query.trim()) return [];

    if (isConfigured && databases) {
      const nowIso = new Date().toISOString();
      const queries = [
        Query.greaterThan('expiresAt', nowIso),
        Query.orderDesc('publishedAt'),
        Query.limit(100),
        Query.search('title', query.trim())
      ];
      if (category && category !== 'all') queries.push(Query.equal('categoryId', category));
      if (type && type !== 'all') queries.push(Query.equal('contentType', type === 'blogs' ? 'blog' : 'news'));

      try {
        const res = await databases.listDocuments(
          APP_CONFIG.appwrite.databaseId,
          ARTICLES_COLLECTION,
          queries
        );
        return res.documents.map(this.mapDoc);
      } catch (err) {
        console.warn('[ArticleService] Search index error, falling back:', err.message);
      }
    }

    // Fallback: /api/news search
    try {
      const url = new URL('/api/news', window.location.origin);
      url.searchParams.set('search', query.trim());
      if (category && category !== 'all') url.searchParams.set('category', category);
      if (type && type !== 'all') url.searchParams.set('type', type);

      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          return data.articles.map(this.mapDoc);
        }
      }
    } catch {
      // Quiet
    }

    // Memory search fallback
    const feed = await this.getHomeFeed();
    const q = query.trim().toLowerCase();
    return feed.all.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q)
    );
  }

  async getBySlug(slug) {
    if (isConfigured && databases) {
      try {
        const res = await databases.listDocuments(
          APP_CONFIG.appwrite.databaseId,
          ARTICLES_COLLECTION,
          [Query.equal('slug', slug), Query.limit(1)]
        );
        if (res.documents.length > 0) {
          const doc = res.documents[0];
          if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now()) {
            throw new Error('CONTENT_EXPIRED');
          }
          return this.mapDoc(doc);
        }
      } catch (err) {
        if (err.message === 'CONTENT_EXPIRED') throw err;
      }
    }

    // Check memory
    for (const art of this.memoryArticles.values()) {
      if (art.slug === slug) {
        if (art.expiresAt && new Date(art.expiresAt).getTime() <= Date.now()) {
          throw new Error('CONTENT_EXPIRED');
        }
        return art;
      }
    }

    // Fallback search
    try {
      const res = await fetch(`/api/news?search=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          const match = data.articles.find(a => a.slug === slug);
          if (match) return this.mapDoc(match);
        }
      }
    } catch {
      // Quiet
    }

    throw new Error('ARTICLE_NOT_FOUND');
  }

  async getNearbyFeed(location = {}) {
    const feed = await this.getHomeFeed();
    const city = (location.city || '').toLowerCase();
    const region = (location.region || '').toLowerCase();

    const regional = feed.all.filter(a => {
      const text = `${a.title || ''} ${a.summary || ''} ${a.categorySlug || ''}`.toLowerCase();
      if (region && text.includes(region)) return true;
      if (city && text.includes(city)) return true;
      return a.categorySlug === 'india' || a.categorySlug === 'tamil-nadu';
    });

    return {
      location,
      articles: regional.length > 0 ? regional.slice(0, 8) : feed.all.slice(0, 8),
      blogs: feed.communityBlogs.slice(0, 4)
    };
  }

  /**
   * Author-submitted content writes to Appwrite directly from client
   * tagged with 24h expiresAt ceiling.
   */
  async createCommunityArticle(data, author) {
    if (author?.role === 'reader') {
      throw new Error('Readers are not authorized to publish stories. Please switch your account role to Author.');
    }
    if (!isConfigured) throw new Error('Appwrite is not configured.');

    const now = new Date();
    const retentionMs = (APP_CONFIG.USER_POST_RETENTION_HOURS || 24) * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + retentionMs).toISOString();
    const id = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const slug = (data.title || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) + '-' + id.slice(-6);

    const doc = {
      title: data.title,
      slug,
      summary: data.summary,
      content: data.content,
      imageUrl: data.imageUrl,
      sourceName: author?.name ? `${author.name} (NewsAxis Author)` : 'Community Author',
      sourceUrl: '',
      authorName: author?.name || 'Author',
      categoryId: data.categoryId || 'blogs',
      contentType: 'blog',
      sourceType: data.sourceType || 'community_blog',
      tags: JSON.stringify(data.tags || [data.categoryId || 'blogs']),
      publishedAt: now.toISOString(),
      createdAt: now.toISOString(),
      expiresAt,
      isBreaking: false,
      isFeatured: false,
      views: 1,
      readingTime: Math.max(2, Math.ceil((data.content || '').split(/\s+/).length / 60))
    };

    await databases.createDocument(APP_CONFIG.appwrite.databaseId, ARTICLES_COLLECTION, id, doc);
    const mapped = this.mapDoc({ $id: id, ...doc });
    this.memoryArticles.set(id, mapped);
    return mapped;
  }

  // ---- Client-only conveniences (bookmarks / reactions), not article data ----

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
    let updated, isBookmarked;
    if (index >= 0) {
      updated = current.filter(b => b.id !== article.id);
      isBookmarked = false;
    } else {
      updated = [{
        id: article.id, title: article.title, slug: article.slug, imageUrl: article.imageUrl,
        sourceName: article.sourceName, categorySlug: article.categorySlug || article.categoryId,
        publishedAt: article.publishedAt, readingTime: article.readingTime, savedAt: new Date().toISOString()
      }, ...current];
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

  getReaction(articleId) {
    if (typeof window === 'undefined') return null;
    try {
      const map = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REACTIONS_KEY) || '{}');
      return map[articleId] || null;
    } catch {
      return null;
    }
  }

  setReaction(articleId, reactionType) {
    if (typeof window === 'undefined') return null;
    try {
      const map = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REACTIONS_KEY) || '{}');
      if (map[articleId] === reactionType) delete map[articleId];
      else map[articleId] = reactionType;
      localStorage.setItem(LOCAL_STORAGE_REACTIONS_KEY, JSON.stringify(map));
      return map[articleId] || null;
    } catch {
      return null;
    }
  }

  cleanupExpired() { return { deletedCount: 0 }; }
  async getSyncStatus() {
    return { status: 'appwrite_backed', database: 'Appwrite (server-side 30-min cron)' };
  }
  async triggerManualSync() {
    this.memoryArticles.clear();
    try {
      const res = await fetch(`/api/sync?trigger=manual_refresh&_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        this.lastSyncTime = Date.now();
        if (data.articles && data.articles.length > 0) {
          const fresh = data.articles.map(this.mapDoc);
          fresh.forEach(a => this.memoryArticles.set(a.id, a));
          return this.getHomeFeed({ forceFresh: true });
        }
      }
    } catch (e) {
      console.warn('[ArticleService] manual sync note:', e.message);
    }
    return this.getHomeFeed({ forceFresh: true });
  }
}

export const articleService = new ArticleService();
export default articleService;
