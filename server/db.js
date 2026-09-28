import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let stmtInsertArticle = null;
let stmtDeleteExpired = null;
let stmtGetAllActive = null;
let stmtGetBySlug = null;
let stmtLogSync = null;
let stmtGetActiveCount = null;
let stmtGetLastSync = null;
let DB_PATH = ':memory:';

// In-memory fallback stores if SQLite is unavailable in serverless environment
const memoryArticles = new Map();
const memoryLogs = [];
const memoryMeta = new Map();

try {
  const sqlite = await import('node:sqlite');
  if (sqlite && sqlite.DatabaseSync) {
    const isVercel = Boolean(process.env.VERCEL);
    const DATA_DIR = isVercel ? '/tmp' : path.resolve(__dirname, '../data');
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    DB_PATH = path.join(DATA_DIR, 'newsaxis.db');
    try {
      db = new sqlite.DatabaseSync(DB_PATH);
    } catch {
      db = new sqlite.DatabaseSync(':memory:');
    }
  }
} catch {
  // node:sqlite not supported in this Node version; fallback store is active
}

if (db) {
  try {
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

    stmtInsertArticle = db.prepare(`
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

    stmtDeleteExpired = db.prepare(`
      DELETE FROM articles WHERE expires_at <= ?
    `);

    stmtGetAllActive = db.prepare(`
      SELECT * FROM articles 
      WHERE expires_at > ? 
      ORDER BY published_at DESC
    `);

    stmtGetBySlug = db.prepare(`
      SELECT * FROM articles 
      WHERE slug = ? AND expires_at > ?
    `);

    stmtLogSync = db.prepare(`
      INSERT INTO sync_logs (
        timestamp, articles_fetched, articles_inserted, articles_purged, status, details
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmtGetActiveCount = db.prepare(`
      SELECT COUNT(*) as count FROM articles WHERE expires_at > ?
    `);

    stmtGetLastSync = db.prepare(`
      SELECT * FROM sync_logs ORDER BY id DESC LIMIT 1
    `);
  } catch (err) {
    console.warn('[Database] SQLite initialization warning:', err.message);
    db = null;
  }
}

export function getDb() {
  return db;
}

/**
 * Purge articles whose 30-minute expiration window has elapsed
 */
export function purgeExpiredArticles(now = new Date()) {
  const nowIso = now.toISOString();
  
  if (db && stmtDeleteExpired) {
    try {
      const countBefore = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE expires_at <= ?`).get(nowIso);
      const toDelete = countBefore?.count || 0;
      stmtDeleteExpired.run(nowIso);

      const currentTotal = getMetaStat('total_purged') || '0';
      const newTotal = parseInt(currentTotal, 10) + toDelete;
      setMetaStat('total_purged', newTotal.toString());
      return toDelete;
    } catch (e) {
      console.warn('[Database] Purge error:', e.message);
    }
  }

  // Memory fallback
  let deleted = 0;
  for (const [id, art] of memoryArticles.entries()) {
    if (art.expiresAt && new Date(art.expiresAt).getTime() <= now.getTime()) {
      memoryArticles.delete(id);
      deleted++;
    }
  }
  return deleted;
}

/**
 * Bulk insert fresh articles from the 30-minute fetch cycle
 */
export function insertArticles(articles, batchId) {
  let inserted = 0;

  for (const art of articles) {
    if (db && stmtInsertArticle) {
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
        continue;
      } catch (err) {
        console.warn(`Failed to insert article into SQLite: ${art.title}`, err.message);
      }
    }

    // Memory fallback
    memoryArticles.set(art.id, art);
    inserted++;
  }

  return inserted;
}

/**
 * Fetch all active articles (still within the 30-minute window)
 */
export function getActiveArticles(now = new Date()) {
  if (db && stmtGetAllActive) {
    try {
      const rows = stmtGetAllActive.all(now.toISOString());
      return rows.map(formatRowToArticle);
    } catch (e) {
      console.warn('[Database] getActiveArticles query warning:', e.message);
    }
  }

  // Memory fallback
  const nowMs = now.getTime();
  return Array.from(memoryArticles.values())
    .filter(a => !a.expiresAt || new Date(a.expiresAt).getTime() > nowMs)
    .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
}

export function getArticleBySlug(slug, now = new Date()) {
  if (db && stmtGetBySlug) {
    try {
      const row = stmtGetBySlug.get(slug, now.toISOString());
      return row ? formatRowToArticle(row) : null;
    } catch {
      // quiet
    }
  }

  for (const art of memoryArticles.values()) {
    if (art.slug === slug) {
      if (art.expiresAt && new Date(art.expiresAt).getTime() <= now.getTime()) {
        return null;
      }
      return art;
    }
  }
  return null;
}

export function recordSyncLog(log) {
  if (db && stmtLogSync) {
    try {
      stmtLogSync.run(
        log.timestamp || new Date().toISOString(),
        log.articlesFetched || 0,
        log.articlesInserted || 0,
        log.articlesPurged || 0,
        log.status || 'OK',
        log.details || ''
      );
      return;
    } catch {
      // quiet
    }
  }

  memoryLogs.unshift(log);
  if (memoryLogs.length > 50) memoryLogs.pop();
}

export function getStats(now = new Date()) {
  let activeCount = 0;
  let lastSync = null;
  let totalPurged = 0;

  if (db && stmtGetActiveCount) {
    try {
      const active = stmtGetActiveCount.get(now.toISOString());
      activeCount = active?.count || 0;
      lastSync = stmtGetLastSync.get();
      totalPurged = parseInt(getMetaStat('total_purged') || '0', 10);
    } catch {
      // fallback
    }
  } else {
    activeCount = memoryArticles.size;
    lastSync = memoryLogs[0] || null;
  }

  return {
    activeArticles: activeCount,
    totalPurgedHistorical: totalPurged,
    lastSync: lastSync || null,
    dbPath: DB_PATH
  };
}

export function setMetaStat(key, value) {
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO meta_stats (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);
      stmt.run(key, value);
      return;
    } catch {
      // quiet
    }
  }
  memoryMeta.set(key, value);
}

export function getMetaStat(key) {
  if (db) {
    try {
      const row = db.prepare(`SELECT value FROM meta_stats WHERE key = ?`).get(key);
      return row ? row.value : null;
    } catch {
      // quiet
    }
  }
  return memoryMeta.get(key) || null;
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
