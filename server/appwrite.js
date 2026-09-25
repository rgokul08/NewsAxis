import { Client, Databases, Storage, ID, Query } from 'node-appwrite';
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
let databaseId = '6ab613fc0006b9fedac1';
let bucketId = '6ab614cc0022aa43fab8';

export function getAppwriteClient() {
  if (client) return { client, databases, storage, isConfigured };

  projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '6a854c5d0026a9224d01';
  const apiKey = process.env.APPWRITE_API_KEY || 'standard_8d908df942748395872387098595c63acf0c28d30f846fb749285c398d63595a6e3362097e8d7870c13ee7fcfae4f1e8fbdded73e5afb31dc5cd3c9a409696f4439bb4040cf0c426a1d5411361745933485d020a42071d677e23f95a72bc9e6f88ea42cbe60883c8fdf477595a0595a83394cb2cf5d3d0aeb65688bb8b71a3eb';
  databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || '6ab613fc0006b9fedac1';
  bucketId = process.env.APPWRITE_BUCKET_ID || process.env.VITE_APPWRITE_BUCKET_ID || '6ab614cc0022aa43fab8';
  
  // Use SGP region for this project
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

  return { client, databases, storage, isConfigured };
}

// Auto-initialize
getAppwriteClient();

const ARTICLES_COLLECTION_ID = 'articles';

/**
 * Sync fresh articles to Appwrite Database
 */
export async function syncArticlesToAppwrite(articles = [], batchId = '') {
  const { databases, isConfigured } = getAppwriteClient();
  if (!isConfigured || !databases) {
    return { success: false, reason: 'Appwrite not configured with API key' };
  }

  console.log(`[Appwrite] Syncing ${articles.length} real-world articles to Appwrite database (${databaseId}/${ARTICLES_COLLECTION_ID})...`);
  let synced = 0;
  let skipped = 0;

  const chunkSize = 5;
  for (let i = 0; i < Math.min(articles.length, 30); i += chunkSize) {
    const chunk = articles.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (art) => {
        try {
          const docId = art.id.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
          const data = {
            title: (art.title || '').slice(0, 255),
            slug: (art.slug || '').slice(0, 120),
            summary: (art.summary || art.description || '').slice(0, 1000),
            content: (art.content || art.summary || '').slice(0, 5000),
            imageUrl: art.imageUrl || art.image_url || '',
            sourceName: (art.sourceName || art.source_name || 'NewsAxis').slice(0, 100),
            sourceUrl: (art.sourceUrl || art.source_url || '').slice(0, 500),
            authorName: (art.authorName || art.author || 'Staff').slice(0, 100),
            categoryId: (art.categoryId || art.category || 'world').slice(0, 50),
            contentType: (art.contentType || 'news').slice(0, 20),
            sourceType: (art.sourceType || 'external_news').slice(0, 30),
            publishedAt: art.publishedAt || art.published_at || new Date().toISOString(),
            createdAt: art.createdAt || new Date().toISOString(),
            expiresAt: art.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            isBreaking: Boolean(art.isBreaking),
            isFeatured: Boolean(art.isFeatured),
            views: Number(art.views || 1),
            readingTime: Number(art.readingTime || 3)
          };

          try {
            await databases.updateDocument(databaseId, ARTICLES_COLLECTION_ID, docId, data);
            synced++;
          } catch (updateErr) {
            if (updateErr.code === 404) {
              await databases.createDocument(databaseId, ARTICLES_COLLECTION_ID, docId, data);
              synced++;
            } else {
              skipped++;
            }
          }
        } catch {
          skipped++;
        }
      })
    );
  }

  if (synced > 0) {
    console.log(`[Appwrite] Successfully updated ${synced} documents in Appwrite Cloud.`);
  }
  return { success: true, synced, skipped };
}

/**
 * Purge expired articles from Appwrite Database
 */
export async function purgeExpiredFromAppwrite(now = new Date()) {
  const { databases, isConfigured } = getAppwriteClient();
  if (!isConfigured || !databases) return 0;

  try {
    const nowIso = now.toISOString();
    const response = await databases.listDocuments(
      databaseId,
      ARTICLES_COLLECTION_ID,
      [
        Query.lessThanEqual('expiresAt', nowIso),
        Query.limit(50)
      ]
    );

    let purged = 0;
    for (const doc of response.documents) {
      try {
        await databases.deleteDocument(databaseId, ARTICLES_COLLECTION_ID, doc.$id);
        purged++;
      } catch {
        // Continue
      }
    }

    if (purged > 0) {
      console.log(`[Appwrite] Successfully deleted ${purged} expired documents.`);
    }
    return purged;
  } catch {
    return 0;
  }
}

/**
 * Save user-uploaded author article to Appwrite
 */
export async function saveUserArticleToAppwrite(article) {
  const { databases, isConfigured } = getAppwriteClient();
  if (!isConfigured || !databases) return null;

  try {
    const docId = article.id.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
    const data = {
      title: article.title.slice(0, 255),
      slug: article.slug.slice(0, 120),
      summary: (article.summary || '').slice(0, 1000),
      content: (article.content || '').slice(0, 10000),
      imageUrl: article.imageUrl || '',
      sourceName: article.sourceName || 'Community Author',
      sourceUrl: article.sourceUrl || '',
      authorName: article.authorName || 'Author',
      categoryId: article.categoryId || 'blogs',
      contentType: 'blog',
      sourceType: article.sourceType || 'community_blog',
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      expiresAt: article.expiresAt, // 1 Day (24 hours)
      isBreaking: false,
      isFeatured: false,
      views: 1,
      readingTime: article.readingTime || 3
    };

    const doc = await databases.createDocument(databaseId, ARTICLES_COLLECTION_ID, docId, data);
    console.log(`[Appwrite] Saved author post ${doc.$id} with 24-hour expiration.`);
    return doc;
  } catch (err) {
    console.warn(`[Appwrite] User article sync note: ${err.message}`);
    return null;
  }
}

export function getAppwriteStatus() {
  const { isConfigured } = getAppwriteClient();
  return {
    isConfigured,
    endpoint: resolvedEndpoint,
    projectId: projectId ? `${projectId.slice(0, 8)}...` : null,
    databaseId,
    bucketId,
    mode: isConfigured ? 'Appwrite Cloud Connected' : 'Local SQLite Storage Engine'
  };
}
