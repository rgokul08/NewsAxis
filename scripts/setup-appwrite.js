// scripts/setup-appwrite.js
import { Client, Databases, Storage, Permission, Role, IndexType } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'newsaxis-main';
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'newsaxis-media';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureDb() {
  try { await databases.get(DATABASE_ID); }
  catch { await databases.create(DATABASE_ID, 'NewsAxis Main Database'); }
}

async function ensureCollection(id, name, perms) {
  try { await databases.getCollection(DATABASE_ID, id); }
  catch {
    await databases.createCollection(DATABASE_ID, id, name, perms);
    await sleep(800);
  }
}

async function str(col, key, size, required = false, def) {
  try { await databases.createStringAttribute(DATABASE_ID, col, key, size, required, def); await sleep(500); } catch {}
}
async function bool(col, key, required = false, def = false) {
  try { await databases.createBooleanAttribute(DATABASE_ID, col, key, required, def); await sleep(500); } catch {}
}
async function int(col, key, required = false, min, max, def) {
  try { await databases.createIntegerAttribute(DATABASE_ID, col, key, required, min, max, def); await sleep(500); } catch {}
}
async function index(col, key, type, attrs) {
  try { await databases.createIndex(DATABASE_ID, col, key, type, attrs); await sleep(500); } catch {}
}

async function run() {
  await ensureDb();

  // ARTICLES
  await ensureCollection('articles', 'Articles', [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ]);
  await str('articles', 'title', 255, true);
  await str('articles', 'slug', 150, true);
  await str('articles', 'summary', 1000);
  await str('articles', 'content', 50000);
  await str('articles', 'imageUrl', 1000);
  await str('articles', 'sourceName', 100, false, 'NewsAxis');
  await str('articles', 'sourceUrl', 1000);
  await str('articles', 'authorName', 100, false, 'Staff');
  await str('articles', 'authorId', 100);
  await str('articles', 'categoryId', 50, false, 'world');
  await str('articles', 'contentType', 20, false, 'news');
  await str('articles', 'sourceType', 50, false, 'external_news');
  await str('articles', 'tags', 2000);              // JSON string
  await str('articles', 'publishedAt', 50);
  await str('articles', 'createdAt', 50);
  await str('articles', 'expiresAt', 50, true);      // required — every doc must expire
  await bool('articles', 'isBreaking', false, false);
  await bool('articles', 'isFeatured', false, false);
  await int('articles', 'views', false, 0, 100000000, 1);
  await int('articles', 'readingTime', false, 1, 60, 3);

  await index('articles', 'idx_slug', IndexType.Unique, ['slug']);
  await index('articles', 'idx_expires', IndexType.Key, ['expiresAt']);
  await index('articles', 'idx_category', IndexType.Key, ['categoryId']);
  await index('articles', 'idx_published', IndexType.Key, ['publishedAt']);
  await index('articles', 'idx_title_fulltext', IndexType.Fulltext, ['title']); // needed for Query.search('title', ...)

  // PROFILES
  await ensureCollection('profiles', 'Profiles', [
    Permission.read(Role.any()), Permission.create(Role.users()),
    Permission.update(Role.users()), Permission.delete(Role.users()),
  ]);
  await str('profiles', 'userId', 100, true);
  await str('profiles', 'name', 100, true);
  await str('profiles', 'username', 50, true);
  await str('profiles', 'email', 150);
  await str('profiles', 'bio', 500);
  await str('profiles', 'avatarUrl', 1000);
  await str('profiles', 'role', 20, false, 'reader');

  // BUCKET
  try { await storage.getBucket(BUCKET_ID); }
  catch {
    await storage.createBucket(BUCKET_ID, 'NewsAxis Media', [
      Permission.read(Role.any()), Permission.create(Role.users()),
      Permission.update(Role.users()), Permission.delete(Role.users()),
    ], false, true, 10 * 1024 * 1024, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
  }

  console.log('✅ Appwrite schema ready.');
}

run().catch(e => { console.error(e); process.exit(1); });
