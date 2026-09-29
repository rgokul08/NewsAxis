import { getActiveArticles, insertArticles } from '../server/db.js';
import { getArticlesFromAppwrite, syncArticlesToAppwrite } from '../server/appwrite.js';
import { aggregateRealWorldContent, formatIST } from '../server/aggregator.js';

/**
 * Vercel Serverless Function: /api/news
 * Core news API endpoint: returns active real-world articles from database.
 * Supports forced refresh (?refresh=true) and auto-detects stale content (>20m)
 * to guarantee that reloading or refreshing always presents the newest news.
 */
export default async function handler(req, res) {
  // Set CORS and Anti-Cache headers so browsers always get fresh news on reload
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { category, type, search, limit = 50, page = 1, refresh } = req.query;
  const numLimit = parseInt(limit, 10) || 50;
  const numPage = parseInt(page, 10) || 1;
  const shouldRefresh = refresh === 'true' || req.query.force === 'true';
  const now = new Date();

  try {
    let articles = [];

    // If explicit refresh requested, immediately aggregate live feeds
    if (shouldRefresh) {
      console.log('[Vercel /api/news] Explicit refresh requested, pulling fresh news...');
      try {
        const aggResult = await aggregateRealWorldContent(30);
        if (aggResult && aggResult.articles && aggResult.articles.length > 0) {
          articles = aggResult.articles;
          try { insertArticles(articles, aggResult.batchId); } catch {}
          syncArticlesToAppwrite(articles, aggResult.batchId).catch(() => {});
        }
      } catch (err) {
        console.warn('[Vercel /api/news] Explicit refresh error:', err.message);
      }
    }

    // 1. Try querying Appwrite Cloud if not already populated
    if (articles.length === 0) {
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
    }

    // 2. If Appwrite had 0 items, check SQLite/memory cache
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

    // 3. Staleness check: if the latest article is older than 20 minutes or list is empty, refresh
    const newestTime = articles.length > 0 && articles[0].publishedAt ? new Date(articles[0].publishedAt).getTime() : 0;
    const isStale = articles.length === 0 || (Date.now() - newestTime > 20 * 60 * 1000);

    if (isStale) {
      console.log(`[Vercel /api/news] Articles are stale or empty (count=${articles.length}, newestAgeMin=${Math.round((Date.now() - newestTime) / 60000)}m), aggregating fresh news...`);
      try {
        const aggResult = await aggregateRealWorldContent(30);
        if (aggResult && aggResult.articles && aggResult.articles.length > 0) {
          articles = aggResult.articles;
          try { insertArticles(articles, aggResult.batchId); } catch {}
          syncArticlesToAppwrite(articles, aggResult.batchId).catch(err => {
            console.warn('[Vercel /api/news] Background Appwrite sync note:', err.message);
          });
        }
      } catch (err) {
        console.warn('[Vercel /api/news] Fresh aggregation error:', err.message);
      }
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
