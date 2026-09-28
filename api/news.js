import { getActiveArticles } from '../server/db.js';
import { getArticlesFromAppwrite, getAppwriteClient, syncArticlesToAppwrite } from '../server/appwrite.js';
import { aggregateRealWorldContent, formatIST } from '../server/aggregator.js';

/**
 * Vercel Serverless Function: /api/news
 * Core news API endpoint: returns active real-world articles.
 * Queries Appwrite first; falls back to SQLite cache;
 * auto-triggers ingestion if database has 0 items so visitors never see blank screens.
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { category, type, search, limit = 50, page = 1 } = req.query;
  const numLimit = parseInt(limit, 10) || 50;
  const numPage = parseInt(page, 10) || 1;
  const now = new Date();

  try {
    let articles = [];

    // 1. Try querying Appwrite Cloud first
    try {
      const appwriteDocs = await getArticlesFromAppwrite({
        category,
        type,
        limit: numLimit,
        page: numPage
      });

      if (appwriteDocs && appwriteDocs.length > 0) {
        articles = appwriteDocs.map(d => ({
          id: d.$id || d.id,
          title: d.title,
          slug: d.slug,
          summary: d.summary || d.description,
          description: d.description || d.summary,
          content: d.content,
          imageUrl: d.imageUrl,
          sourceName: d.sourceName || d.source,
          sourceUrl: d.sourceUrl || d.url,
          authorName: d.authorName || d.author,
          categoryId: d.categoryId || d.category,
          categorySlug: d.categoryId || d.category,
          providerId: d.provider,
          language: d.language || 'en',
          contentType: d.contentType || 'news',
          sourceType: d.sourceType || 'external_news',
          publishedAt: d.publishedAt,
          publishedAtIST: d.publishedAtIST || formatIST(d.publishedAt),
          expiresAt: d.expiresAt,
          isBreaking: Boolean(d.isBreaking),
          isFeatured: Boolean(d.isFeatured),
          views: Number(d.views || 1),
          readingTime: Number(d.readingTime || 3)
        }));
      }
    } catch (e) {
      console.warn('[Vercel /api/news] Appwrite fetch note:', e.message);
    }

    // 2. If Appwrite had 0 items, check SQLite cache
    if (articles.length === 0) {
      try {
        const localActive = getActiveArticles(now);
        if (localActive && localActive.length > 0) {
          articles = localActive;
        }
      } catch (e) {
        console.warn('[Vercel /api/news] SQLite fetch note:', e.message);
      }
    }

    // 3. If STILL 0 items (first deployment or expired), trigger immediate on-demand aggregation!
    if (articles.length === 0) {
      console.log('[Vercel /api/news] Database empty, triggering on-demand aggregation...');
      const aggResult = await aggregateRealWorldContent(30);
      articles = aggResult.articles;

      // Sync to Appwrite in background
      syncArticlesToAppwrite(articles, aggResult.batchId).catch(err => {
        console.warn('[Vercel /api/news] Background Appwrite sync note:', err.message);
      });
    }

    // Filter by category if requested
    let filtered = articles;
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(a =>
        (a.categoryId || '').toLowerCase() === catLower ||
        (a.categorySlug || '').toLowerCase() === catLower
      );
    }

    // Filter by type
    if (type === 'blogs') {
      filtered = filtered.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
    } else if (type === 'news') {
      filtered = filtered.filter(a => a.contentType === 'news' || (a.sourceType && a.sourceType.includes('news')));
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q) ||
        (a.sourceName || '').toLowerCase().includes(q) ||
        (a.authorName || '').toLowerCase().includes(q)
      );
    }

    // Section partitioning
    const breaking = filtered.filter(a => a.isBreaking);
    const featured = filtered.find(a => a.isFeatured) || filtered[0] || null;
    const latest = [...filtered].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 20);
    const trending = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
    const communityBlogs = filtered.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));

    // Pagination
    const startIndex = (numPage - 1) * numLimit;
    const paginated = filtered.slice(startIndex, startIndex + numLimit);

    return res.status(200).json({
      success: true,
      articles: paginated,
      all: filtered,
      breaking,
      featured,
      latest,
      trending,
      communityBlogs,
      total: filtered.length,
      page: numPage,
      limit: numLimit,
      hasMore: startIndex + numLimit < filtered.length,
      timestamp: now.toISOString(),
      istTime: formatIST(now)
    });
  } catch (err) {
    console.error('[Vercel /api/news Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      all: [],
      breaking: [],
      featured: null,
      latest: [],
      trending: [],
      communityBlogs: []
    });
  }
}
