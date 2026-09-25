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

// Load environment variables from .env.local or .env if present
try {
  const envLocal = path.resolve(__dirname, '../.env.local');
  const envMain = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envLocal) && process.loadEnvFile) {
    process.loadEnvFile(envLocal);
  } else if (fs.existsSync(envMain) && process.loadEnvFile) {
    process.loadEnvFile(envMain);
  }
} catch (e) {
  // Silent fallback
}

const app = express();
const PORT = process.env.PORT || 3001;

// 30-Minute Cycle Duration
const RETENTION_MINUTES = 30;
const CYCLE_MS = RETENTION_MINUTES * 60 * 1000; // 1,800,000 ms
const USER_POST_RETENTION_HOURS = 24; // 1-Day retention for user uploaded news & blogs

let lastSyncTime = Date.now();
let nextSyncTime = Date.now() + CYCLE_MS;
let isSyncing = false;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Execute 30-Minute Sync Cycle:
 * 1. Purge expired articles (> 30 mins old)
 * 2. Fetch fresh real-world news and blogs
 * 3. Save into SQLite database with 30-minute expiration
 * 4. Update sync schedule
 */
async function executeSyncCycle(triggerReason = 'scheduled_30min_interval') {
  if (isSyncing) {
    console.log('[Scheduler] Sync already in progress, skipping overlapping call.');
    return { success: false, message: 'Sync in progress' };
  }

  isSyncing = true;
  const cycleStart = Date.now();
  console.log(`\n========================================`);
  console.log(`[Scheduler] 30-MIN CYCLE TRIGGERED (${triggerReason})`);
  console.log(`[Time: ${new Date().toISOString()}]`);
  console.log(`========================================`);

  try {
    // 1. Purge items where expires_at <= now (both SQLite & Appwrite)
    const purgedCount = purgeExpiredArticles(new Date());
    await purgeExpiredFromAppwrite(new Date()).catch(() => 0);
    console.log(`[Database] Auto-purged ${purgedCount} expired articles (> 30 mins old).`);

    // 2. Fetch fresh news & blogs from real-world feeds
    const { articles, batchId, expiresAt } = await aggregateRealWorldContent(RETENTION_MINUTES);

    // 3. Insert into SQLite Database
    const insertedCount = insertArticles(articles, batchId);
    console.log(`[Database] Successfully inserted ${insertedCount} fresh articles [Batch: ${batchId}].`);

    // 4. Sync into Appwrite Database (if configured)
    syncArticlesToAppwrite(articles, batchId).catch(err => {
      console.warn(`[Appwrite Sync] Background sync note: ${err.message}`);
    });

    lastSyncTime = Date.now();
    nextSyncTime = lastSyncTime + CYCLE_MS;

    recordSyncLog({
      timestamp: new Date().toISOString(),
      articlesFetched: articles.length,
      articlesInserted: insertedCount,
      articlesPurged: purgedCount,
      status: 'SUCCESS',
      details: `Trigger: ${triggerReason} | Batch: ${batchId} | Expires: ${expiresAt}`
    });

    console.log(`[Scheduler] Cycle complete in ${Date.now() - cycleStart}ms. Next auto-refresh in 30 minutes.`);
    return {
      success: true,
      purgedCount,
      insertedCount,
      totalActive: articles.length,
      nextSyncAt: new Date(nextSyncTime).toISOString()
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
 * Returns sync radar info, countdown, active article count, and purge logs
 */
app.get('/api/status', (req, res) => {
  const stats = getStats(new Date());
  const now = Date.now();
  const secondsLeft = Math.max(0, Math.floor((nextSyncTime - now) / 1000));

  res.json({
    status: 'online',
    isSyncing,
    cycleMinutes: RETENTION_MINUTES,
    secondsUntilNextSync: secondsLeft,
    lastSyncAt: new Date(lastSyncTime).toISOString(),
    nextSyncAt: new Date(nextSyncTime).toISOString(),
    activeArticles: stats.activeArticles,
    totalPurgedHistorical: stats.totalPurgedHistorical,
    lastSyncLog: stats.lastSync,
    database: 'SQLite (WAL mode)',
    appwrite: getAppwriteStatus()
  });
});

/**
 * POST /api/sync
 * Manually trigger an immediate 30-minute sync & purge cycle
 */
app.post('/api/sync', async (req, res) => {
  const result = await executeSyncCycle('manual_user_trigger');
  res.json(result);
});

/**
 * GET /api/news
 * Returns all active 30-minute news & blogs
 */
app.get('/api/news', (req, res) => {
  try {
    const active = getActiveArticles(new Date());

    // Filter by category or source type if specified
    const { category, type, search } = req.query;
    let filtered = active;

    if (category && category !== 'all') {
      filtered = filtered.filter(a => 
        a.categoryId?.toLowerCase() === category.toLowerCase() ||
        a.categorySlug?.toLowerCase() === category.toLowerCase()
      );
    }

    if (type === 'blogs') {
      filtered = filtered.filter(a => a.contentType === 'blog' || a.sourceType.includes('blog'));
    } else if (type === 'news') {
      filtered = filtered.filter(a => a.contentType === 'news' || a.sourceType.includes('news'));
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.summary && a.summary.toLowerCase().includes(q))
      );
    }

    // Partition sections
    const breaking = active.filter(a => a.isBreaking).slice(0, 10);
    const featured = active.find(a => a.isFeatured) || active[0] || null;
    const latest = [...active].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 20);
    const blogs = active.filter(a => a.contentType === 'blog' || a.sourceType.includes('blog'));
    const trending = [...active].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

    res.json({
      success: true,
      total: active.length,
      filteredTotal: filtered.length,
      breaking,
      featured,
      latest,
      trending,
      communityBlogs: blogs,
      articles: filtered,
      all: active
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/news/:slug
 * Fetch a single article by slug
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
 * POST /api/articles
 * Allows posting community articles/blogs that save to database and automatically delete after 1 day (24 hours)
 */
app.post('/api/articles', (req, res) => {
  try {
    const { title, summary, content, categoryId, authorName, authorUrl, imageUrl, sourceType } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const now = new Date();
    // User-uploaded news and blogs automatically delete in 1 day (24 hours)
    const expiresAt = new Date(now.getTime() + (USER_POST_RETENTION_HOURS * 60 * 60 * 1000)).toISOString();
    const id = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = generateSlug(title, id);

    const newArticle = {
      id,
      externalId: id,
      providerId: 'community',
      sourceType: sourceType || 'community_blog',
      contentType: 'blog',
      title,
      slug,
      summary: summary || content.slice(0, 250),
      content,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
      sourceName: 'Community Voice',
      sourceUrl: '',
      authorName: authorName || 'Anonymous Writer',
      categoryId: categoryId || 'world',
      tags: [categoryId || 'world', 'community'],
      publishedAt: now.toISOString(),
      createdAt: now.toISOString(),
      expiresAt, // Strictly 1 day (24 hours)
      isBreaking: false,
      isFeatured: false,
      views: 1,
      readingTime: Math.max(2, Math.ceil(content.split(/\s+/).length / 60))
    };

    insertArticles([newArticle], `user_${Date.now()}`);

    // Mirror to Appwrite Database if configured
    saveUserArticleToAppwrite(newArticle).catch(err => {
      console.warn(`[Appwrite User Sync] Note: ${err.message}`);
    });

    res.status(201).json({ success: true, article: newArticle, retentionHours: USER_POST_RETENTION_HOURS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
  console.log(`  Auto-Update Schedule: Every ${RETENTION_MINUTES} minutes`);
  console.log(`  Database: SQLite (Data directory: server/../data)`);
  console.log(`======================================================\n`);

  // Initial sync immediately upon start
  await executeSyncCycle('server_startup');

  // Recurring 30-Minute Schedule
  setInterval(() => {
    executeSyncCycle('scheduled_30min_interval');
  }, CYCLE_MS);
});
