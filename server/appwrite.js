import { Client, Databases, Storage, ID, Query } from 'node-appwrite';

/**
 * Server-Side Appwrite Connector
 * Integrates real-time news storage, 30-min auto-cleanup, and 24-hr community post persistence.
 */

// Load environment variables if available
const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || 'newsaxis-main';
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || process.env.VITE_APPWRITE_BUCKET_ID || 'newsaxis-media';
const ARTICLES_COLLECTION_ID = 'articles';

let isConfigured = Boolean(PROJECT_ID && API_KEY);
let client = null;
let databases = null;
let storage = null;

if (isConfigured) {
  try {
    client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    databases = new Databases(client);
    storage = new Storage(client);
    console.log(`[Appwrite] Initialized for project: ${PROJECT_ID} at ${ENDPOINT}`);
  } catch (err) {
    console.warn(`[Appwrite] Initialization warning: ${err.message}`);
    isConfigured = false;
  }
} else {
  console.log(`[Appwrite] Running in Local Database Mode. (Set APPWRITE_PROJECT_ID and APPWRITE_API_KEY in .env.local to sync directly with Appwrite Cloud)`);
}

/**
 * Sync an array of fresh articles to Appwrite Database
 */
export async function syncArticlesToAppwrite(articles = [], batchId = '') {
  if (!isConfigured || !databases) {
    return { success: false, reason: 'Appwrite not configured with API key' };
  }

  console.log(`[Appwrite] Syncing ${articles.length} real-world articles to Appwrite database (${DATABASE_ID}/${ARTICLES_COLLECTION_ID})...`);
  let synced = 0;
  let errors = 0;

  // Sync articles in chunks of 5 to respect Appwrite rate limits
  const chunkSize = 5;
  for (let i = 0; i < articles.length; i += chunkSize) {
    const chunk = articles.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (art) => {
        try {
          const docId = art.id.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
          const data = {
            title: art.title.slice(0, 255),
            slug: art.slug.slice(0, 120),
            summary: (art.summary || '').slice(0, 1000),
            content: (art.content || art.summary || '').slice(0, 5000),
            imageUrl: art.imageUrl || '',
            sourceName: (art.sourceName || 'NewsAxis').slice(0, 100),
            sourceUrl: (art.sourceUrl || '').slice(0, 500),
            authorName: (art.authorName || 'Staff').slice(0, 100),
            categoryId: (art.categoryId || 'world').slice(0, 50),
            contentType: (art.contentType || 'news').slice(0, 20),
            sourceType: (art.sourceType || 'external_news').slice(0, 30),
            publishedAt: art.publishedAt || new Date().toISOString(),
            createdAt: art.createdAt || new Date().toISOString(),
            expiresAt: art.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            isBreaking: Boolean(art.isBreaking),
            isFeatured: Boolean(art.isFeatured),
            views: Number(art.views || 1),
            readingTime: Number(art.readingTime || 3)
          };

          try {
            // Try updating existing
            await databases.updateDocument(DATABASE_ID, ARTICLES_COLLECTION_ID, docId, data);
            synced++;
          } catch (updateErr) {
            if (updateErr.code === 404) {
              // Create new
              await databases.createDocument(DATABASE_ID, ARTICLES_COLLECTION_ID, docId, data);
              synced++;
            } else {
              throw updateErr;
            }
          }
        } catch (err) {
          errors++;
          // Fail silently on single document without halting the full batch
        }
      })
    );
  }

  console.log(`[Appwrite] Synced ${synced} documents (${errors} errors/skipped).`);
  return { success: true, synced, errors };
}

/**
 * Purge expired articles from Appwrite Database:
 * 1. 30-min external news (expiresAt <= now)
 * 2. 1-day community blogs (expiresAt <= now)
 */
export async function purgeExpiredFromAppwrite(now = new Date()) {
  if (!isConfigured || !databases) return 0;

  try {
    const nowIso = now.toISOString();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ARTICLES_COLLECTION_ID,
      [
        Query.lessThanEqual('expiresAt', nowIso),
        Query.limit(100)
      ]
    );

    let purged = 0;
    for (const doc of response.documents) {
      try {
        await databases.deleteDocument(DATABASE_ID, ARTICLES_COLLECTION_ID, doc.$id);
        purged++;
      } catch (delErr) {
        console.warn(`[Appwrite] Could not delete doc ${doc.$id}: ${delErr.message}`);
      }
    }

    if (purged > 0) {
      console.log(`[Appwrite] Successfully deleted ${purged} expired documents.`);
    }
    return purged;
  } catch (err) {
    console.warn(`[Appwrite] Expired purge check: ${err.message}`);
    return 0;
  }
}

/**
 * Save user-uploaded article to Appwrite
 */
export async function saveUserArticleToAppwrite(article) {
  if (!isConfigured || !databases) return null;

  try {
    const docId = article.id.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
    const data = {
      title: article.title.slice(0, 255),
      slug: article.slug.slice(0, 120),
      summary: (article.summary || '').slice(0, 1000),
      content: (article.content || '').slice(0, 10000),
      imageUrl: article.imageUrl || '',
      sourceName: article.sourceName || 'Community Contributor',
      sourceUrl: article.sourceUrl || '',
      authorName: article.authorName || 'Community Contributor',
      categoryId: article.categoryId || 'world',
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

    const doc = await databases.createDocument(DATABASE_ID, ARTICLES_COLLECTION_ID, docId, data);
    console.log(`[Appwrite] Saved community post ${doc.$id} with 24-hour expiration.`);
    return doc;
  } catch (err) {
    console.warn(`[Appwrite] Failed to save user article: ${err.message}`);
    return null;
  }
}

/**
 * Returns current Appwrite configuration status
 */
export function getAppwriteStatus() {
  return {
    isConfigured,
    endpoint: ENDPOINT,
    projectId: PROJECT_ID ? `${PROJECT_ID.slice(0, 6)}...` : null,
    databaseId: DATABASE_ID,
    bucketId: BUCKET_ID,
    mode: isConfigured ? 'Appwrite Cloud Connected' : 'Local SQLite Fallback (Ready for Appwrite)'
  };
}
