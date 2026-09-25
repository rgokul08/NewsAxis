import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'newsaxis.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;
  
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    external_id TEXT,
    provider_id TEXT,
    source_type TEXT,
    content_type TEXT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT,
    image_url TEXT,
    source_name TEXT,
    source_url TEXT,
    author_name TEXT,
    category_id TEXT,
    tags TEXT,
    published_at TEXT,
    created_at TEXT,
    expires_at TEXT NOT NULL,
    batch_id TEXT,
    is_breaking INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 3
  );

  CREATE INDEX IF NOT EXISTS idx_articles_expires_at ON articles(expires_at);
  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
  CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
  CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);

  CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    articles_fetched INTEGER DEFAULT 0,
    articles_inserted INTEGER DEFAULT 0,
    articles_purged INTEGER DEFAULT 0,
    status TEXT,
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS meta_stats (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Prepared statements
const stmtInsertArticle = db.prepare(`
  INSERT OR REPLACE INTO articles (
    id, external_id, provider_id, source_type, content_type,
    title, slug, summary, content, image_url, source_name, source_url,
    author_name, category_id, tags, published_at, created_at,
    expires_at, batch_id, is_breaking, is_featured, views, reading_time
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?
  )
`);

const stmtDeleteExpired = db.prepare(`
  DELETE FROM articles WHERE expires_at <= ?
`);

const stmtGetAllActive = db.prepare(`
  SELECT * FROM articles 
  WHERE expires_at > ? 
  ORDER BY published_at DESC
`);

const stmtGetBySlug = db.prepare(`
  SELECT * FROM articles 
  WHERE slug = ? AND expires_at > ?
`);

const stmtLogSync = db.prepare(`
  INSERT INTO sync_logs (
    timestamp, articles_fetched, articles_inserted, articles_purged, status, details
  ) VALUES (?, ?, ?, ?, ?, ?)
`);

const stmtGetActiveCount = db.prepare(`
  SELECT COUNT(*) as count FROM articles WHERE expires_at > ?
`);

const stmtGetLastSync = db.prepare(`
  SELECT * FROM sync_logs ORDER BY id DESC LIMIT 1
`);

export function getDb() {
  return db;
}

/**
 * Purge articles whose 30-minute expiration window has elapsed
 */
export function purgeExpiredArticles(now = new Date()) {
  const nowIso = now.toISOString();
  
  // Count how many will be deleted
  const countBefore = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE expires_at <= ?`).get(nowIso);
  const toDelete = countBefore?.count || 0;
  
  stmtDeleteExpired.run(nowIso);

  // Update cumulative purged count in meta_stats
  const currentTotal = getMetaStat('total_purged') || '0';
  const newTotal = parseInt(currentTotal, 10) + toDelete;
  setMetaStat('total_purged', newTotal.toString());

  return toDelete;
}

/**
 * Bulk insert fresh articles from the 30-minute fetch cycle
 */
export function insertArticles(articles, batchId) {
  let inserted = 0;
  for (const art of articles) {
    try {
      stmtInsertArticle.run(
        art.id,
        art.externalId || null,
        art.providerId || 'newsaxis',
        art.sourceType || 'external_news',
        art.contentType || 'news',
        art.title,
        art.slug,
        art.summary || '',
        art.content || '',
        art.imageUrl || '',
        art.sourceName || 'NewsAxis Partner',
        art.sourceUrl || '',
        art.authorName || 'News Desk',
        art.categoryId || 'world',
        JSON.stringify(art.tags || []),
        art.publishedAt || new Date().toISOString(),
        art.createdAt || new Date().toISOString(),
        art.expiresAt,
        batchId,
        art.isBreaking ? 1 : 0,
        art.isFeatured ? 1 : 0,
        art.views || 0,
        art.readingTime || 3
      );
      inserted++;
    } catch (err) {
      console.warn(`Failed to insert article: ${art.title}`, err.message);
    }
  }
  return inserted;
}

/**
 * Fetch all active articles (still within the 30-minute window)
 */
export function getActiveArticles(now = new Date()) {
  const rows = stmtGetAllActive.all(now.toISOString());
  return rows.map(formatRowToArticle);
}

export function getArticleBySlug(slug, now = new Date()) {
  const row = stmtGetBySlug.get(slug, now.toISOString());
  return row ? formatRowToArticle(row) : null;
}

export function recordSyncLog(log) {
  stmtLogSync.run(
    log.timestamp || new Date().toISOString(),
    log.articlesFetched || 0,
    log.articlesInserted || 0,
    log.articlesPurged || 0,
    log.status || 'OK',
    log.details || ''
  );
}

export function getStats(now = new Date()) {
  const active = stmtGetActiveCount.get(now.toISOString());
  const lastSync = stmtGetLastSync.get();
  const totalPurged = parseInt(getMetaStat('total_purged') || '0', 10);

  return {
    activeArticles: active?.count || 0,
    totalPurgedHistorical: totalPurged,
    lastSync: lastSync || null,
    dbPath: DB_PATH
  };
}

export function setMetaStat(key, value) {
  const stmt = db.prepare(`
    INSERT INTO meta_stats (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run(key, value);
}

export function getMetaStat(key) {
  const row = db.prepare(`SELECT value FROM meta_stats WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function formatRowToArticle(row) {
  return {
    id: row.id,
    externalId: row.external_id,
    providerId: row.provider_id,
    sourceType: row.source_type,
    contentType: row.content_type,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    imageUrl: row.image_url,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    authorName: row.author_name,
    categoryId: row.category_id,
    categorySlug: row.category_id,
    tags: (() => {
      try {
        return JSON.parse(row.tags || '[]');
      } catch {
        return [];
      }
    })(),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    batchId: row.batch_id,
    isBreaking: Boolean(row.is_breaking),
    isFeatured: Boolean(row.is_featured),
    views: row.views,
    readingTime: row.reading_time
  };
}
