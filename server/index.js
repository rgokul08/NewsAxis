import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { 
  purgeExpiredArticles, 
  insertArticles, 
  getActiveArticles, 
  getArticleBySlug, 
  recordSyncLog, 
  getStats 
} from './db.js';
import { aggregateRealWorldContent, generateSlug } from './aggregator.js';
import { 
  syncArticlesToAppwrite, 
  purgeExpiredFromAppwrite, 
  saveUserArticleToAppwrite, 
  getAppwriteStatus 
} from './appwrite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust Environment Loader
function loadEnv() {
  const envFiles = [path.resolve(__dirname, '../.env.local'), path.resolve(__dirname, '../.env')];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}
loadEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Retention & Expiration Policies
const NEWS_RETENTION_MINUTES = 30; // Real-world news refreshed & purged every 30m
const USER_POST_RETENTION_HOURS = 24; // Author blogs automatically expire in 24 hours (1 day)

let lastSyncTime = Date.now();
let nextSyncTime = Date.now() + NEWS_RETENTION_MINUTES * 60 * 1000;
let isSyncing = false;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// INDIAN STANDARD TIME (IST) HELPERS (Asia/Kolkata, UTC+05:30)
// -------------------------------------------------------------
export function formatIST(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date) + ' IST';
}

export function getISTDate(date = new Date()) {
  const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

/**
 * Calculates milliseconds remaining until the next :00 or :30 boundary in Indian Standard Time (IST)
 * Examples:
 * 12:00 IST -> 12:30 IST
 * 12:30 IST -> 13:00 IST
 */
export function getMsUntilNextISTBoundary(now = new Date()) {
  const ist = getISTDate(now);
  const minutes = ist.getMinutes();
  const seconds = ist.getSeconds();
  const ms = ist.getMilliseconds();

  const nextMinute = minutes < 30 ? 30 : 60;
  const minutesRemaining = nextMinute - minutes;
  const totalMsRemaining = (minutesRemaining * 60 * 1000) - (seconds * 1000) - ms;
  return Math.max(1000, totalMsRemaining);
}

/**
 * Execute 30-Minute Ingestion & Purge Cycle:
 * 1. Purge expired aggregated news (> 30 mins old)
 * 2. Purge expired author blogs (> 24 hours old)
 * 3. Fetch fresh real-world news from legitimate verified feeds & APIs
 * 4. Deduplicate and normalize
 * 5. Store into SQLite and Appwrite database
 */
async function executeSyncCycle(triggerReason = 'scheduled_ist_boundary') {
  if (isSyncing) {
    console.log('[Scheduler] Sync already in progress, skipping overlapping call.');
    return { success: false, message: 'Sync in progress' };
  }

  isSyncing = true;
  const cycleStart = Date.now();
  const now = new Date();
  console.log(`\n======================================================`);
  console.log(`[Scheduler] 30-MIN DATA REFRESH TRIGGERED (${triggerReason})`);
  console.log(`[Indian Standard Time: ${formatIST(now)}]`);
  console.log(`======================================================`);

  try {
    // 1. Purge expired items (both SQLite & Appwrite)
    const purgedCount = purgeExpiredArticles(now);
    await purgeExpiredFromAppwrite(now).catch(() => 0);
    console.log(`[Data Cleanup] Purged ${purgedCount} expired items (news >30m, author posts >24h).`);

    // 2. Fetch fresh news & blogs from real-world sources
    const { articles, batchId, expiresAt } = await aggregateRealWorldContent(NEWS_RETENTION_MINUTES);

    // 3. Insert into SQLite Database
    const insertedCount = insertArticles(articles, batchId);
    console.log(`[Database] Inserted ${insertedCount} fresh articles [Batch: ${batchId}].`);

    // 4. Sync into Appwrite Database
    syncArticlesToAppwrite(articles, batchId).catch(err => {
      console.warn(`[Appwrite Sync] Background note: ${err.message}`);
    });

    lastSyncTime = Date.now();
    const delayMs = getMsUntilNextISTBoundary(new Date());
    nextSyncTime = lastSyncTime + delayMs;

    recordSyncLog({
      timestamp: new Date().toISOString(),
      articlesFetched: articles.length,
      articlesInserted: insertedCount,
      articlesPurged: purgedCount,
      status: 'SUCCESS',
      details: `Trigger: ${triggerReason} | IST: ${formatIST(now)} | Expires: ${expiresAt}`
    });

    console.log(`[Scheduler] Cycle complete in ${Date.now() - cycleStart}ms.`);
    console.log(`[Scheduler] Next IST cycle scheduled at: ${formatIST(new Date(nextSyncTime))}`);

    return {
      success: true,
      purgedCount,
      insertedCount,
      totalActive: articles.length,
      lastSyncIST: formatIST(new Date(lastSyncTime)),
      nextSyncIST: formatIST(new Date(nextSyncTime))
    };
  } catch (err) {
    console.error(`[Scheduler] Error in 30-min sync cycle:`, err);
    recordSyncLog({
      timestamp: new Date().toISOString(),
      articlesFetched: 0,
      articlesInserted: 0,
      articlesPurged: 0,
      status: 'FAILED',
      details: err.message
    });
    return { success: false, error: err.message };
  } finally {
    isSyncing = false;
  }
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

/**
 * GET /api/status
 * Dev & Admin monitoring dashboard endpoint
 */
app.get('/api/status', (req, res) => {
  const stats = getStats(new Date());
  const now = Date.now();
  const secondsLeft = Math.max(0, Math.floor((nextSyncTime - now) / 1000));

  res.json({
    status: 'online',
    isSyncing,
    timezone: 'Asia/Kolkata (IST, UTC+05:30)',
    currentTimeIST: formatIST(new Date()),
    cycleMinutes: NEWS_RETENTION_MINUTES,
    secondsUntilNextSync: secondsLeft,
    lastSyncIST: formatIST(new Date(lastSyncTime)),
    nextSyncIST: formatIST(new Date(nextSyncTime)),
    activeArticles: stats.activeArticles,
    totalPurgedHistorical: stats.totalPurgedHistorical,
    lastSyncLog: stats.lastSync,
    database: 'SQLite (WAL mode)',
    appwrite: getAppwriteStatus()
  });
});

/**
 * POST /api/sync
 * Manually trigger an immediate sync & purge cycle
 */
app.post('/api/sync', async (req, res) => {
  const result = await executeSyncCycle('manual_user_trigger');
  res.json(result);
});

/**
 * GET /api/news
 * Core news endpoint: supports category, type, search, pagination
 */
app.get('/api/news', (req, res) => {
  try {
    const active = getActiveArticles(new Date());
    const { category, type, search, limit = 50, page = 1 } = req.query;
    let filtered = active;

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(a => 
        (a.categoryId || '').toLowerCase() === catLower ||
        (a.categorySlug || '').toLowerCase() === catLower ||
        (a.category || '').toLowerCase() === catLower
      );
    }

    if (type === 'blogs') {
      filtered = filtered.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
    } else if (type === 'news') {
      filtered = filtered.filter(a => a.contentType === 'news' || (a.sourceType && a.sourceType.includes('news')));
    }

    if (search) {
      const q = search.trim().toLowerCase();
      const tokens = q.split(/\s+/).filter(t => t.length > 1);

      const scored = filtered.map(a => {
        let score = 0;
        const titleLower = (a.title || '').toLowerCase();
        const summaryLower = (a.summary || a.description || '').toLowerCase();
        const contentLower = (a.content || '').toLowerCase();
        const authorLower = (a.authorName || a.author || '').toLowerCase();
        const sourceLower = (a.sourceName || a.source_name || '').toLowerCase();
        const catLower = (a.categoryId || a.categorySlug || a.category || '').toLowerCase();
        const tagsLower = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';

        // Exact query boosts
        if (titleLower === q) score += 200;
        else if (titleLower.includes(q)) score += 100;

        if (summaryLower.includes(q)) score += 50;
        if (catLower === q || tagsLower.includes(q)) score += 40;
        if (sourceLower.includes(q) || authorLower.includes(q)) score += 30;

        // Multi-token related matching
        for (const token of tokens) {
          if (titleLower.includes(token)) score += 25;
          if (summaryLower.includes(token)) score += 15;
          if (catLower.includes(token) || tagsLower.includes(token)) score += 10;
          if (contentLower.includes(token)) score += 5;
        }

        return { article: a, score };
      });

      filtered = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.article.publishedAt) - new Date(a.article.publishedAt))
        .map(item => item.article);
    }

    // Partition sections
    const breaking = active.filter(a => a.isBreaking).slice(0, 10);
    const featured = active.find(a => a.isFeatured) || active[0] || null;
    const latest = [...active].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 20);
    const blogs = active.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
    const trending = [...active].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

    const pageSize = parseInt(limit, 10) || 50;
    const pageNum = parseInt(page, 10) || 1;
    const paginated = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.json({
      success: true,
      total: active.length,
      filteredTotal: filtered.length,
      page: pageNum,
      pageSize,
      breaking,
      featured,
      latest,
      trending,
      communityBlogs: blogs,
      articles: paginated,
      all: active
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/news/latest
 */
app.get('/api/news/latest', (req, res) => {
  try {
    const active = getActiveArticles(new Date());
    const latest = [...active].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 30);
    res.json({ success: true, count: latest.length, articles: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/news/category/:category
 */
app.get('/api/news/category/:category', (req, res) => {
  try {
    const active = getActiveArticles(new Date());
    const cat = req.params.category.toLowerCase();
    const filtered = active.filter(a => 
      (a.categoryId || '').toLowerCase() === cat || 
      (a.categorySlug || '').toLowerCase() === cat ||
      (a.category || '').toLowerCase() === cat
    );
    res.json({ success: true, category: cat, count: filtered.length, articles: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/news/:slug
 */
app.get('/api/news/:slug', (req, res) => {
  try {
    const article = getArticleBySlug(req.params.slug, new Date());
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found or expired after 30 minutes.' 
      });
    }
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/search?q=...
 */
app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || req.query.search || '').trim().toLowerCase();
    const active = getActiveArticles(new Date());

    if (!q) {
      return res.json({ success: true, count: 0, articles: [] });
    }

    const tokens = q.split(/\s+/).filter(t => t.length > 1);
    const scored = active.map(a => {
      let score = 0;
      const titleLower = (a.title || '').toLowerCase();
      const summaryLower = (a.summary || a.description || '').toLowerCase();
      const contentLower = (a.content || '').toLowerCase();
      const authorLower = (a.authorName || a.author || '').toLowerCase();
      const sourceLower = (a.sourceName || a.source_name || '').toLowerCase();
      const catLower = (a.categoryId || a.categorySlug || a.category || '').toLowerCase();
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

    const results = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.article.publishedAt) - new Date(a.article.publishedAt))
      .map(item => item.article);

    res.json({
      success: true,
      query: q,
      count: results.length,
      articles: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/blogs
 */
app.get('/api/blogs', (req, res) => {
  try {
    const active = getActiveArticles(new Date());
    const blogs = active.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
    res.json({ success: true, count: blogs.length, articles: blogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/articles & POST /api/blogs
 * Allows Author publishing with:
 * - Backend role authorization (rejects readers)
 * - IST publication timestamp
 * - 24-Hour expiration policy
 */
const handlePublish = (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || req.body.userRole || req.body.role;
    if (userRole === 'reader') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Readers are not authorized to publish. Please register or update your account to Author.'
      });
    }

    const { title, summary, content, categoryId, authorName, authorUrl, imageUrl, sourceType, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const now = new Date();
    // 24-Hour Expiration (1-Day retention) in IST
    const expiresAt = new Date(now.getTime() + (USER_POST_RETENTION_HOURS * 60 * 60 * 1000)).toISOString();
    const id = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = generateSlug(title, id);

    const newArticle = {
      id,
      externalId: id,
      external_id: id,
      providerId: 'community_author',
      sourceType: sourceType || 'community_blog',
      contentType: 'blog',
      title: title.trim(),
      slug,
      summary: (summary || content.slice(0, 250)).trim(),
      description: (summary || content.slice(0, 250)).trim(),
      content: content.trim(),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
      image_url: imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
      thumbnail_url: imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
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
      createdAt: now.toISOString(),
      fetched_at: now.toISOString(),
      expiresAt, // Strictly 24 hours (1 day)
      isBreaking: false,
      isFeatured: false,
      views: 1,
      readingTime: Math.max(2, Math.ceil(content.split(/\s+/).length / 60))
    };

    insertArticles([newArticle], `author_${Date.now()}`);

    // Sync to Appwrite Cloud
    saveUserArticleToAppwrite(newArticle).catch(err => {
      console.warn(`[Appwrite Author Sync] Note: ${err.message}`);
    });

    console.log(`[Author Published] Post "${newArticle.title}" created. Expires in 24 hours (${newArticle.expiresAt}).`);
    res.status(201).json({ 
      success: true, 
      article: newArticle, 
      retentionHours: USER_POST_RETENTION_HOURS,
      expiresAtIST: formatIST(new Date(expiresAt))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.post('/api/articles', handlePublish);
app.post('/api/blogs', handlePublish);

// Serve frontend in production build if dist folder exists, otherwise provide API dashboard
const DIST_PATH = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_PATH, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NewsAxis Server & Database Engine</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0d1117; color: #f0f6fc; padding: 40px; line-height: 1.6; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 24px; max-width: 640px; margin: 0 auto; }
            h1 { color: #38bdf8; margin-top: 0; }
            .badge { background: #10b981; color: #022c22; font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            a { color: #38bdf8; text-decoration: none; }
            a:hover { text-decoration: underline; }
            code { background: #21262d; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>NewsAxis Backend Server <span class="badge">ONLINE</span></h1>
            <p>The 30-Minute Real-World Ingestion Engine & Database Server is active on port 3001.</p>
            <ul>
              <li><strong>Vite Frontend Server:</strong> Open <a href="http://localhost:5173">http://localhost:5173</a> (run <code>npm run dev</code> or <code>npm run dev:all</code>)</li>
              <li><strong>API Status Endpoint:</strong> <a href="/api/status">/api/status</a></li>
              <li><strong>API News Payload:</strong> <a href="/api/news">/api/news</a></li>
            </ul>
            <p><em>Tip: To serve the full React web application directly on port 3001, run <code>npm run build</code> first.</em></p>
          </div>
        </body>
      </html>
    `);
  });
}

// Start Server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`  NewsAxis Backend Server & 30-Min Ingestion Engine`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Timezone: Indian Standard Time (IST, Asia/Kolkata)`);
  console.log(`  Schedule: 30-Minute IST Boundaries (:00 & :30)`);
  console.log(`  Current IST Time: ${formatIST(new Date())}`);
  console.log(`======================================================\n`);

  // Initial sync immediately upon start
  await executeSyncCycle('server_startup');

  // Align recurring scheduler to IST 30-minute boundaries (:00 and :30)
  function scheduleNextISTCycle() {
    const delayMs = getMsUntilNextISTBoundary(new Date());
    nextSyncTime = Date.now() + delayMs;
    console.log(`[Scheduler] Next IST cycle scheduled at: ${formatIST(new Date(nextSyncTime))} (in ${Math.round(delayMs / 1000 / 60)} mins)`);

    setTimeout(async () => {
      await executeSyncCycle('scheduled_ist_half_hour_boundary');
      scheduleNextISTCycle();
    }, delayMs);
  }

  scheduleNextISTCycle();
});
