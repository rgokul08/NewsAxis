import { getAppwriteStatus } from '../server/appwrite.js';
import { formatIST } from '../server/aggregator.js';
import { getStats } from '../server/db.js';

/**
 * Vercel Serverless Function: /api/status
 * Health & monitoring endpoint
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = new Date();
  let dbStats = { activeArticles: 0, totalPurgedHistorical: 0 };
  try {
    dbStats = getStats(now);
  } catch (e) {
    // quiet
  }

  return res.status(200).json({
    status: 'online',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Express',
    timezone: 'Asia/Kolkata (IST, UTC+05:30)',
    currentTimeIST: formatIST(now),
    timestamp: now.toISOString(),
    cycleMinutes: 30,
    database: 'Appwrite Cloud + SQLite Cache',
    appwrite: getAppwriteStatus(),
    localCache: dbStats
  });
}
