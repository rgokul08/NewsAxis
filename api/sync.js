import { aggregateRealWorldContent, formatIST } from '../server/aggregator.js';
import { syncArticlesToAppwrite, purgeExpiredFromAppwrite, getAppwriteStatus } from '../server/appwrite.js';
import { insertArticles, purgeExpiredArticles, recordSyncLog } from '../server/db.js';

/**
 * Vercel Serverless Function & Scheduled Cron Handler: /api/sync
 * Triggered automatically every 30 minutes via vercel.json cron,
 * or manually via POST/GET from the NewsAxis frontend "Refresh" button.
 */
export default async function handler(req, res) {
  // Set CORS and Anti-Cache headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const trigger = req.query.trigger || (req.headers['x-vercel-cron'] ? 'vercel_cron_30m' : 'manual_request');
  const now = new Date();
  console.log(`[Vercel /api/sync] Triggered (${trigger}) at ${formatIST(now)}`);

  try {
    // 1. Purge expired articles (>30 mins old)
    const dbPurged = purgeExpiredArticles(now);
    const appwritePurged = await purgeExpiredFromAppwrite(now).catch(() => 0);

    // 2. Fetch fresh real-world news from all verified feeds and APIs
    const { articles, batchId, expiresAt } = await aggregateRealWorldContent(30);

    // 3. Cache into SQLite (ephemeral in serverless, persistent in VPS)
    let inserted = 0;
    try {
      inserted = insertArticles(articles, batchId);
    } catch (e) {
      console.warn('[Vercel /api/sync] SQLite cache note:', e.message);
    }

    // 4. Sync articles to Appwrite Cloud Database
    const appwriteResult = await syncArticlesToAppwrite(articles, batchId);

    try {
      recordSyncLog({
        timestamp: new Date().toISOString(),
        articlesFetched: articles.length,
        articlesInserted: inserted,
        articlesPurged: dbPurged,
        status: appwriteResult.success ? 'SUCCESS' : 'PARTIAL_APPWRITE',
        details: `Trigger: ${trigger} | IST: ${formatIST(now)} | Appwrite: ${appwriteResult.synced || 0} synced, ${appwriteResult.skipped || 0} skipped`
      });
    } catch {
      // quiet
    }

    return res.status(200).json({
      success: true,
      message: 'NewsAxis 30-minute sync completed successfully',
      trigger,
      timestamp: now.toISOString(),
      istTime: formatIST(now),
      articlesFetched: articles.length,
      articlesStoredLocal: inserted,
      purgedCount: dbPurged + appwritePurged,
      appwrite: {
        ...getAppwriteStatus(),
        ...appwriteResult
      },
      // Return top articles to immediately feed frontend if needed
      sampleCount: articles.length,
      articles: articles.slice(0, 30)
    });
  } catch (err) {
    console.error('[Vercel /api/sync Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      istTime: formatIST(now),
      appwrite: getAppwriteStatus()
    });
  }
}
