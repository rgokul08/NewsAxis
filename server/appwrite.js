import { Client, Databases, Storage, ID, Query } from 'node-appwrite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load environment variables from .env.local or .env
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

let client = null;
let databases = null;
let storage = null;
let isConfigured = false;
let resolvedEndpoint = 'https://cloud.appwrite.io/v1';
let projectId = '';
let databaseId = 'newsaxis-main';
let bucketId = 'newsaxis-media';
let lastSyncError = null;

export function getAppwriteClient() {
  if (client) return { client, databases, storage, isConfigured, databaseId, bucketId };

  projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || 'newsaxis-main';
  bucketId = process.env.APPWRITE_BUCKET_ID || process.env.VITE_APPWRITE_BUCKET_ID || 'newsaxis-media';
  
  const envEndpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
  resolvedEndpoint = envEndpoint && !envEndpoint.includes('cloud.appwrite.io/v1') 
    ? envEndpoint 
    : (projectId === '6a854c5d0026a9224d01' ? 'https://sgp.cloud.appwrite.io/v1' : 'https://cloud.appwrite.io/v1');

  if (projectId && apiKey) {
    try {
      client = new Client()
        .setEndpoint(resolvedEndpoint)
        .setProject(projectId)
        .setKey(apiKey);

      databases = new Databases(client);
      storage = new Storage(client);
      isConfigured = true;
      console.log(`[Appwrite] Connector initialized for Project ${projectId} on ${resolvedEndpoint}`);
    } catch (err) {
      console.warn(`[Appwrite] Connector init error: ${err.message}`);
      isConfigured = false;
    }
  }

  return { client, databases, storage, isConfigured, databaseId, bucketId };
}

// Auto-initialize
getAppwriteClient();

export const ARTICLES_COLLECTION_ID = 'articles';

/**
 * Generate a safe 36-char Appwrite Document ID
 * Format: "art_" + 32-hex-char md5 of URL/ID
 * Guaranteed to start with 'a' and only contain [a-z0-9_], max 36 chars.
 */
export function getSafeDocId(article) {
  const seed = article.sourceUrl || article.url || article.link || article.id || article.title;
  const hash = crypto.createHash('md5').update(String(seed)).digest('hex');
  return `art_${hash}`;
}

/**
 * Normalizes article data to conform with Appwrite attributes
 */
export function formatArticleForAppwrite(art) {
  const now = new Date().toISOString();
  const tagsStr = typeof art.tags === 'string'
    ? art.tags.slice(0, 2000)
    : JSON.stringify(Array.isArray(art.tags) ? art.tags : [art.categoryId || 'world']).slice(0, 2000);

  return {
    title: (art.title || 'Untitled News').trim().slice(0, 255),
    slug: (art.slug || `news-${Date.now()}`).trim().slice(0, 150),
    summary: (art.summary || art.description || '').trim().slice(0, 1000),
    content: (art.content || art.summary || art.description || '').trim().slice(0, 50000),
    imageUrl: (art.imageUrl || art.image_url || '').slice(0, 1000),
    sourceName: (art.sourceName || art.source || 'NewsAxis').slice(0, 100),
    sourceUrl: (art.sourceUrl || art.url || '').slice(0, 1000),
    authorName: (art.authorName || art.author || 'Staff').slice(0, 100),
    authorId: (art.authorId || '').slice(0, 100),
    categoryId: (art.categoryId || art.category || 'world').slice(0, 50),
    contentType: (art.contentType || 'news').slice(0, 20),
    sourceType: (art.sourceType || 'external_news').slice(0, 50),
    tags: tagsStr,
    publishedAt: (art.publishedAt || art.published_at || now).slice(0, 50),
    createdAt: (art.createdAt || now).slice(0, 50),
    expiresAt: (art.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString()).slice(0, 50),
    isBreaking: Boolean(art.isBreaking),
    isFeatured: Boolean(art.isFeatured),
    views: Number(art.views || 1),
    readingTime: Number(art.readingTime || 3)
  };
}

/**
 * Sync fresh articles to Appwrite Database
 */
export async function syncArticlesToAppwrite(articles = [], batchId = '') {
  const { databases, isConfigured, databaseId } = getAppwriteClient();
  if (!isConfigured || !databases) {
    const msg = 'Appwrite not configured or missing APPWRITE_API_KEY';
    console.warn(`[Appwrite Sync] ${msg}`);
    return { success: false, reason: msg };
  }

  console.log(`[Appwrite] Syncing ${articles.length} real-world articles to Appwrite database (${databaseId}/${ARTICLES_COLLECTION_ID})...`);
  let synced = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  const chunkSize = 5;
  const itemsToSync = articles.slice(0, 50);

  for (let i = 0; i < itemsToSync.length; i += chunkSize) {
    const chunk = itemsToSync.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (art) => {
        const docId = getSafeDocId(art);
        const data = formatArticleForAppwrite(art);

        try {
          try {
            await databases.createDocument(databaseId, ARTICLES_COLLECTION_ID, docId, data);
            synced++;
          } catch (createErr) {
            if (createErr.code === 409) {
              await databases.updateDocument(databaseId, ARTICLES_COLLECTION_ID, docId, data);
              updated++;
            } else {
              throw createErr;
            }
          }
        } catch (err) {
          skipped++;
          lastSyncError = `${err.code || 500}: ${err.message}`;
          if (errors.length < 5) {
            errors.push({ docId, error: err.message, code: err.code });
          }
          if (err.message && err.message.includes('missing scopes')) {
            console.error(`[Appwrite Scope Error] API Key missing scopes: ${err.message}`);
          } else if (err.code === 404) {
            console.error(`[Appwrite Error] Collection "${ARTICLES_COLLECTION_ID}" not found in database "${databaseId}". Run setup:appwrite first.`);
          } else {
            console.warn(`[Appwrite Sync Error] Doc ${docId}: ${err.message}`);
          }
        }
      })
    );
  }

  const success = (synced + updated) > 0 || skipped === 0;
  console.log(`[Appwrite] Sync complete: ${synced} created, ${updated} updated, ${skipped} skipped.`);
  return { success, synced, updated, skipped, errors };
}

/**
 * Query articles directly from Appwrite Server-Side
 */
export async function getArticlesFromAppwrite({ category = 'all', type = 'all', limit = 50, page = 1 } = {}) {
  const { databases, isConfigured, databaseId } = getAppwriteClient();
  if (!isConfigured || !databases) return null;

  try {
    const queries = [
      Query.orderDesc('publishedAt'),
      Query.limit(Math.min(limit, 100)),
      Query.offset((page - 1) * limit)
    ];

    if (category && category !== 'all') {
      queries.push(Query.equal('categoryId', category.toLowerCase()));
    }

    if (type === 'blogs') {
      queries.push(Query.equal('contentType', 'blog'));
    } else if (type === 'news') {
      queries.push(Query.equal('contentType', 'news'));
    }

    const res = await databases.listDocuments(databaseId, ARTICLES_COLLECTION_ID, queries);
    return res.documents;
  } catch (err) {
    console.warn(`[Appwrite Query Note] ${err.message}`);
    return null;
  }
}

/**
 * Purge expired articles from Appwrite Database
 */
export async function purgeExpiredFromAppwrite(now = new Date()) {
  const { databases, isConfigured, databaseId } = getAppwriteClient();
  if (!isConfigured || !databases) return 0;

  try {
    const nowIso = now.toISOString();
    const expired = await databases.listDocuments(databaseId, ARTICLES_COLLECTION_ID, [
      Query.lessThanEqual('expiresAt', nowIso),
      Query.limit(50)
    ]);

    let deleted = 0;
    for (const doc of expired.documents) {
      try {
        await databases.deleteDocument(databaseId, ARTICLES_COLLECTION_ID, doc.$id);
        deleted++;
      } catch {
        // quiet
      }
    }
    if (deleted > 0) {
      console.log(`[Appwrite Cleanup] Purged ${deleted} expired documents.`);
    }
    return deleted;
  } catch (err) {
    console.warn(`[Appwrite Cleanup Note] ${err.message}`);
    return 0;
  }
}

/**
 * Save user created article to Appwrite
 */
export async function saveUserArticleToAppwrite(articleData) {
  const { databases, isConfigured, databaseId } = getAppwriteClient();
  if (!isConfigured || !databases) return null;

  const docId = getSafeDocId(articleData);
  const data = formatArticleForAppwrite(articleData);

  try {
    const doc = await databases.createDocument(databaseId, ARTICLES_COLLECTION_ID, docId, data);
    return doc;
  } catch (err) {
    console.warn(`[Appwrite User Article] ${err.message}`);
    return null;
  }
}

export function getAppwriteStatus() {
  return {
    isConfigured,
    endpoint: resolvedEndpoint,
    projectId: projectId || 'Not configured',
    databaseId: databaseId || 'newsaxis-main',
    bucketId: bucketId || 'newsaxis-media',
    lastSyncError
  };
}
