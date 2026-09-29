import { getActiveArticles, insertArticles } from '../server/db.js';
import { getAppwriteClient } from '../server/appwrite.js';
import { formatIST } from '../server/aggregator.js';

/**
 * Vercel Serverless Function: /api/articles
 * Allows Author publishing with:
 * - 24-Hour expiration policy in IST
 * - Appwrite Cloud persistence with server credentials
 * - SQLite / memory cache storage
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-user-role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const active = getActiveArticles(new Date());
      const blogs = active.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
      return res.json({ success: true, count: blogs.length, articles: blogs });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const userRole = req.headers['x-user-role'] || req.body.userRole || req.body.role;
    if (userRole === 'reader') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Readers are not authorized to publish. Please switch your account role to Author.'
      });
    }

    const { title, summary, content, categoryId, authorName, imageUrl, sourceType, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const now = new Date();
    // 24-Hour Expiration (1-Day retention) in IST
    const retentionMs = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + retentionMs).toISOString();
    const id = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanTitle = title.trim();
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) + '-' + id.slice(-5);

    const newArticle = {
      id,
      externalId: id,
      external_id: id,
      providerId: 'community_author',
      sourceType: sourceType || 'community_blog',
      contentType: 'blog',
      title: cleanTitle,
      slug,
      summary: (summary || content.slice(0, 250)).trim(),
      description: (summary || content.slice(0, 250)).trim(),
      content: content.trim(),
      imageUrl: imageUrl || '',
      image_url: imageUrl || '',
      thumbnail_url: imageUrl || '',
      sourceName: authorName ? `${authorName} (NewsAxis Author)` : 'Community Author',
      source_name: authorName ? `${authorName} (NewsAxis Author)` : 'Community Author',
      sourceUrl: '',
      source_url: '',
      authorName: authorName || 'Author',
      author: authorName || 'Author',
      categoryId: categoryId || 'blogs',
      categorySlug: categoryId || 'blogs',
      category: categoryId || 'blogs',
      sub_category: 'Community Authors',
      language: 'en',
      country: 'in',
      tags: Array.isArray(tags) ? tags : [categoryId || 'blogs', 'author_blog'],
      publishedAt: now.toISOString(),
      published_at: now.toISOString(),
      publishedAtIST: formatIST(now),
      createdAt: now.toISOString(),
      fetched_at: now.toISOString(),
      expiresAt, // Strictly 24 hours (1 day)
      isBreaking: false,
      isFeatured: false,
      views: 1,
      readingTime: Math.max(2, Math.ceil(content.split(/\s+/).length / 60))
    };

    try {
      insertArticles([newArticle], `author_${Date.now()}`);
    } catch (e) {
      console.warn('[Vercel /api/articles] DB insert note:', e.message);
    }

    // Attempt cloud database sync via Appwrite
    const { databases, isConfigured, databaseId } = getAppwriteClient();
    if (isConfigured && databases) {
      try {
        await databases.createDocument(databaseId, 'articles', id, {
          title: newArticle.title,
          slug: newArticle.slug,
          summary: newArticle.summary,
          content: newArticle.content,
          imageUrl: newArticle.imageUrl,
          sourceName: newArticle.sourceName,
          sourceUrl: newArticle.sourceUrl,
          authorName: newArticle.authorName,
          categoryId: newArticle.categoryId,
          contentType: newArticle.contentType,
          sourceType: newArticle.sourceType,
          tags: JSON.stringify(newArticle.tags),
          publishedAt: newArticle.publishedAt,
          createdAt: newArticle.createdAt,
          expiresAt: newArticle.expiresAt,
          isBreaking: false,
          isFeatured: false,
          views: 1,
          readingTime: newArticle.readingTime
        });
      } catch (err) {
        console.warn('[Vercel /api/articles] Appwrite sync note:', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Article published successfully with 24-hour expiration policy.',
      article: newArticle
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
