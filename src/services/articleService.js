import { Query } from 'appwrite';
import { databases, isConfigured } from './appwriteClient';
import { APP_CONFIG } from '../config/appConfig';
import { calculateTrendingScore } from '../utils/normalizeArticle';

const ARTICLES_COLLECTION = APP_CONFIG.appwrite.collections.articles;
const LOCAL_STORAGE_BOOKMARKS_KEY = 'newsaxis_local_bookmarks';
const LOCAL_STORAGE_REACTIONS_KEY = 'newsaxis_local_reactions';

/**
 * ArticleService — READS ONLY FROM APPWRITE.
 *
 * The site never calls external news/blog APIs directly. All external
 * ingestion happens server-side (server/index.js or the Appwrite Function
 * in appwrite/functions/sync-news) on a 30-minute IST schedule, which writes
 * normalized, categorized, deduplicated articles into the Appwrite
 * `articles` collection. This service only queries that collection.
 */
class ArticleService {
  mapDoc(doc) {
    return {
      id: doc.$id,
      externalId: doc.externalId || doc.external_id || null,
      providerId: doc.providerId,
      sourceType: doc.sourceType,
      contentType: doc.contentType,
      title: doc.title,
      slug: doc.slug,
      summary: doc.summary,
      content: doc.content,
      imageUrl: doc.imageUrl,
      sourceName: doc.sourceName,
      sourceUrl: doc.sourceUrl,
      authorName: doc.authorName,
      categoryId: doc.categoryId,
      categorySlug: doc.categoryId,
      tags: (() => {
        try { return JSON.parse(doc.tags || '[]'); } catch { return []; }
      })(),
      publishedAt: doc.publishedAt,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      isBreaking: Boolean(doc.isBreaking),
      isFeatured: Boolean(doc.isFeatured),
      views: doc.views || 0,
      readingTime: doc.readingTime || 3,
      reactions: { like: 0, helpful: 0, interesting: 0, insightful: 0 }
    };
  }

  async listActive({ limit = 60, offset = 0, category = null, contentType = null } = {}) {
    if (!isConfigured) {
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

    const res = await databases.listDocuments(
      APP_CONFIG.appwrite.databaseId,
      ARTICLES_COLLECTION,
      queries
    );
    return { items: res.documents.map(this.mapDoc), total: res.total };
  }

  async getHomeFeed({ limit = 100 } = {}) {
    const { items: all } = await this.listActive({ limit });

    const breaking = all.filter(a => a.isBreaking).slice(0, 10);
    const featured = all.find(a => a.isFeatured) || all[0] || null;
    const latest = [...all].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 20);
    const trending = [...all]
      .map(a => ({ ...a, trendingScore: calculateTrendingScore(a) }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);
    const communityBlogs = all.filter(a =>
      a.contentType === 'blog' || a.sourceType === 'community_blog' || a.sourceType === 'external_blog'
    );

    return { breaking, featured, latest, trending, communityBlogs, all, total: all.length };
  }

  async getByCategory(categorySlug, { page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;
    const { items, total } = await this.listActive({ limit, offset, category: categorySlug });
    return { items, total, page, hasMore: offset + limit < total };
  }

  async searchArticles(query = '', { category = 'all', type = 'all' } = {}) {
    if (!query.trim() || !isConfigured) return [];
    const nowIso = new Date().toISOString();
    const queries = [
      Query.greaterThan('expiresAt', nowIso),
      Query.orderDesc('publishedAt'),
      Query.limit(100),
      Query.search('title', query.trim())
    ];
    if (category && category !== 'all') queries.push(Query.equal('categoryId', category));
    if (type && type !== 'all') queries.push(Query.equal('contentType', type === 'blogs' ? 'blog' : 'news'));

    const res = await databases.listDocuments(
      APP_CONFIG.appwrite.databaseId,
      ARTICLES_COLLECTION,
      queries
    );
    return res.documents.map(this.mapDoc);
    // NOTE: Query.search requires a fulltext index on `title` in the Appwrite
    // console (Indexes tab). Add a similar index on `summary` for broader matches.
  }

  async getBySlug(slug) {
    if (!isConfigured) throw new Error('ARTICLE_NOT_FOUND');
    const res = await databases.listDocuments(
      APP_CONFIG.appwrite.databaseId,
      ARTICLES_COLLECTION,
      [Query.equal('slug', slug), Query.limit(1)]
    );
    if (res.documents.length === 0) throw new Error('ARTICLE_NOT_FOUND');
    const doc = res.documents[0];
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now()) {
      throw new Error('CONTENT_EXPIRED');
    }
    return this.mapDoc(doc);
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
   * Author-submitted content still writes to Appwrite directly from the
   * client, tagged with a 24h expiresAt; the scheduled cleanup function
   * purges it like everything else.
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
    return this.mapDoc({ $id: id, ...doc });
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

  // Kept as no-ops for compatibility with components that still call these;
  // purging is now done server-side only.
  cleanupExpired() { return { deletedCount: 0 }; }
  async getSyncStatus() {
    return { status: 'appwrite_backed', database: 'Appwrite (server-side 30-min cron)' };
  }
  async triggerManualSync() {
    // No client-triggerable sync anymore — updates come from the scheduled
    // server job only, per the "no browser-based timer" requirement.
    return this.getHomeFeed();
  }
}

export const articleService = new ArticleService();
export default articleService;
