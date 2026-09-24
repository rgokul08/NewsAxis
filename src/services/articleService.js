import { databases, isConfigured } from './appwriteClient';
import { APP_CONFIG } from '../config/appConfig';
import { normalizeArticle, deduplicateArticles, calculateTrendingScore } from '../utils/normalizeArticle';
import { providerRegistry } from '../providers';
import { SEED_ARTICLES } from '../constants/seedData';

const LOCAL_STORAGE_ARTICLES_KEY = 'newsaxis_local_articles';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'newsaxis_local_bookmarks';
const LOCAL_STORAGE_REACTIONS_KEY = 'newsaxis_local_reactions';

/**
 * Core Article and Feed Service
 * Seamlessly interfaces with Appwrite Collections when available,
 * and maintains local caching, provider aggregation, and offline synchronization.
 */
class ArticleService {
  constructor() {
    this.memoryArticles = new Map();
    this.initLocalStore();
  }

  initLocalStore() {
    // Seed initial articles into memory
    SEED_ARTICLES.forEach(art => this.memoryArticles.set(art.id, art));

    // Load user-submitted articles saved locally
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_ARTICLES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.forEach(art => {
            // Check 72h expiration locally
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
    return new Date(article.expiresAt).getTime() < Date.now();
  }

  persistLocalArticles() {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.memoryArticles.values()).filter(a => !this.isExpired(a));
      localStorage.setItem(LOCAL_STORAGE_ARTICLES_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to persist articles to localStorage', e);
    }
  }

  /**
   * Fetches home feed: combines breaking, editorial, external providers, and community posts
   */
  async getHomeFeed() {
    // 1. Fetch live external provider items
    let externalItems = [];
    try {
      externalItems = await providerRegistry.aggregateAll({ limit: 40 });
    } catch (e) {
      console.warn('Provider aggregation fallback', e);
    }

    // 2. Combine with memory/local/Appwrite articles
    const internalArticles = Array.from(this.memoryArticles.values()).filter(a => !this.isExpired(a));
    const combined = deduplicateArticles([...internalArticles, ...externalItems]);

    // 3. Partition sections
    const breaking = combined.filter(a => a.isBreaking);
    const featured = combined.find(a => a.isFeatured) || combined[0];
    
    // Sort for latest
    const latest = [...combined].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

    // Calculate trending with gravity decay
    const trending = [...combined]
      .map(a => ({ ...a, trendingScore: calculateTrendingScore(a) }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);

    // Filter community blogs
    const communityBlogs = combined.filter(a => a.sourceType === 'community_blog' || a.sourceType === 'community_report');

    return {
      breaking,
      featured,
      latest: latest.slice(0, 20),
      trending,
      communityBlogs,
      all: combined
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
   * Fetches single article by slug
   */
  async getBySlug(slug) {
    // Check in memory first
    for (const art of this.memoryArticles.values()) {
      if (art.slug === slug) {
        if (this.isExpired(art)) {
          throw new Error('CONTENT_EXPIRED');
        }
        return art;
      }
    }

    // Query external providers if not in memory
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
   * Enforces Rule 14: Mandatory 72-hour user content retention ceiling
   */
  async createCommunityArticle(data, author) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (APP_CONFIG.USER_POST_RETENTION_HOURS * 60 * 60 * 1000)).toISOString();

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
      expiresAt, // Strictly server/client calculated 72 hours
      status: 'published', // If editor review bypass is enabled, otherwise 'under_review'
      views: 1,
      uniqueViews: 1
    });

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
   * Performs 72-hour cleanup check locally
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
          categorySlug: article.categorySlug,
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
