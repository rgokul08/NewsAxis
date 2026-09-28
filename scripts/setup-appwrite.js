// scripts/setup-appwrite.js
import { Client, Databases, Storage, Permission, Role, IndexType } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse .env file
function loadEnvManual(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

try {
  loadEnvManual(path.resolve(__dirname, '../.env.local'));
  loadEnvManual(path.resolve(__dirname, '../.env'));
} catch (e) {
  // Continue
}

const cliProjectId = process.argv[2];
let ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = cliProjectId || process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || 'newsaxis-main';
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || process.env.VITE_APPWRITE_BUCKET_ID || 'newsaxis-media';

console.log('\n========================================================');
console.log('       NEWSAXIS APPWRITE DATABASE & STORAGE SETUP       ');
console.log('========================================================\n');

if (!PROJECT_ID) {
  console.error('❌ Error: APPWRITE_PROJECT_ID is not configured in .env or .env.local.');
  console.log('Usage: node scripts/setup-appwrite.js <YOUR_APPWRITE_PROJECT_ID>\n');
  process.exit(1);
}

if (!API_KEY) {
  console.error('❌ Error: APPWRITE_API_KEY is not configured in .env or .env.local.');
  console.log('\nTo generate an API Key:');
  console.log('1. Go to Appwrite Console -> Project Settings -> API Keys -> Create API Key');
  console.log('2. Name: "NewsAxis Server Key"');
  console.log('3. Grant scopes: databases.*, collections.*, attributes.*, indexes.*, documents.*, files.*, buckets.*');
  console.log('4. Add APPWRITE_API_KEY=your_key to your .env / .env.local file.\n');
  process.exit(1);
}

// Ensure correct regional endpoint
if (PROJECT_ID === '6a854c5d0026a9224d01' && !ENDPOINT.includes('sgp.')) {
  ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function verifyScopes() {
  console.log('[Step 0/5] Pre-flight Scope Verification...');
  console.log(`  Endpoint:   ${ENDPOINT}`);
  console.log(`  Project:    ${PROJECT_ID}`);
  console.log(`  Database:   ${DATABASE_ID}`);
  console.log(`  Bucket:     ${BUCKET_ID}`);

  try {
    await databases.list();
    console.log('  ✓ API key verified: databases.read scope active.');
  } catch (err) {
    if (err.message && err.message.includes('missing scopes')) {
      console.error('\n❌ CRITICAL ERROR: Appwrite API Key lacks required scopes!');
      console.error(`Details: ${err.message}`);
      console.log('\n👉 HOW TO FIX THIS:');
      console.log('1. Open your Appwrite Console (https://cloud.appwrite.io)');
      console.log(`2. Open Project: "${PROJECT_ID}"`);
      console.log('3. Go to "Project Settings" -> "API Keys"');
      console.log('4. Edit or create your API Key and check all of the following:');
      console.log('   - Databases: Read & Write');
      console.log('   - Collections: Read & Write');
      console.log('   - Attributes: Read & Write');
      console.log('   - Indexes: Read & Write');
      console.log('   - Documents: Read & Write');
      console.log('   - Files: Read & Write');
      console.log('   - Buckets: Read & Write');
      console.log('5. Save and copy the secret key into APPWRITE_API_KEY in your .env or .env.local file.\n');
      process.exit(1);
    } else {
      console.warn(`  ⚠️ Pre-flight note: ${err.message}`);
    }
  }
}

async function ensureDb() {
  try {
    await databases.get(DATABASE_ID);
    console.log(`  ✓ Database "${DATABASE_ID}" exists.`);
  } catch {
    console.log(`  + Creating Database "${DATABASE_ID}"...`);
    await databases.create(DATABASE_ID, 'NewsAxis Main Database');
    console.log(`  ✓ Database "${DATABASE_ID}" created.`);
  }
}

async function ensureCollection(id, name, perms) {
  try {
    await databases.getCollection(DATABASE_ID, id);
    console.log(`  ✓ Collection "${id}" exists.`);
  } catch {
    console.log(`  + Creating Collection "${id}" (${name})...`);
    await databases.createCollection(DATABASE_ID, id, name, perms);
    await sleep(800);
    console.log(`  ✓ Collection "${id}" created.`);
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
  await verifyScopes();

  // 1. DATABASE
  console.log(`\n[Step 1/5] Checking Database "${DATABASE_ID}"...`);
  await ensureDb();

  // 2. ARTICLES
  console.log(`\n[Step 2/5] Configuring "articles" Collection & Attributes...`);
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

  console.log('  Configuring "articles" Indexes...');
  await index('articles', 'idx_slug', IndexType.Unique, ['slug']);
  await index('articles', 'idx_expires', IndexType.Key, ['expiresAt']);
  await index('articles', 'idx_category', IndexType.Key, ['categoryId']);
  await index('articles', 'idx_published', IndexType.Key, ['publishedAt']);
  await index('articles', 'idx_title_fulltext', IndexType.Fulltext, ['title']); // needed for Query.search('title', ...)

  // 3. PROFILES, COMMENTS, BOOKMARKS
  console.log(`\n[Step 3/5] Configuring Supporting Collections...`);
  await ensureCollection('profiles', 'Profiles', [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ]);
  await str('profiles', 'userId', 100, true);
  await str('profiles', 'name', 100, true);
  await str('profiles', 'username', 50, true);
  await str('profiles', 'email', 150);
  await str('profiles', 'bio', 500);
  await str('profiles', 'avatarUrl', 1000);
  await str('profiles', 'role', 20, false, 'reader');

  await ensureCollection('comments', 'Comments', [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ]);
  await str('comments', 'articleId', 100, true);
  await str('comments', 'userId', 100, true);
  await str('comments', 'userName', 100, false);
  await str('comments', 'content', 2000, true);
  await str('comments', 'createdAt', 50, false);

  await ensureCollection('bookmarks', 'Bookmarks', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ]);
  await str('bookmarks', 'userId', 100, true);
  await str('bookmarks', 'articleId', 100, true);
  await str('bookmarks', 'createdAt', 50, false);

  // 4. BUCKET
  console.log(`\n[Step 4/5] Configuring Storage Bucket "${BUCKET_ID}"...`);
  try {
    await storage.getBucket(BUCKET_ID);
    console.log(`  ✓ Bucket "${BUCKET_ID}" exists.`);
  } catch {
    console.log(`  + Creating Bucket "${BUCKET_ID}"...`);
    await storage.createBucket(
      BUCKET_ID,
      'NewsAxis Media',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false, // fileSecurity false allows public preview
      true,
      10 * 1024 * 1024,
      ['jpg', 'jpeg', 'png', 'webp', 'gif']
    );
    console.log(`  ✓ Bucket "${BUCKET_ID}" created.`);
  }

  // 5. TEST WRITE & READ
  console.log(`\n[Step 5/5] Performing Live Verification Write & Read...`);
  try {
    const testDocId = 'test_init_' + Date.now().toString(36);
    const testDoc = await databases.createDocument(
      DATABASE_ID,
      'articles',
      testDocId,
      {
        title: 'NewsAxis Pipeline Operational Test',
        slug: 'newsaxis-pipeline-operational-test-' + Date.now().toString(36),
        summary: 'Verification article confirming Appwrite write/read access.',
        content: 'Pipeline active. Real-world news will sync on next 30-min cycle.',
        imageUrl: '',
        sourceName: 'NewsAxis System',
        sourceUrl: 'https://newsaxis.local',
        authorName: 'System Diagnostic',
        authorId: 'system',
        categoryId: 'technology',
        contentType: 'news',
        sourceType: 'external_news',
        tags: JSON.stringify(['technology', 'system']),
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isBreaking: false,
        isFeatured: false,
        views: 1,
        readingTime: 1
      }
    );
    console.log(`  ✓ Document write verified (ID: ${testDoc.$id})`);
    await databases.deleteDocument(DATABASE_ID, 'articles', testDocId);
    console.log(`  ✓ Document delete verified.`);
  } catch (writeErr) {
    console.warn(`  ⚠️ Note during write verification: ${writeErr.message}`);
  }

  console.log('\n========================================================');
  console.log('  🎉 APPWRITE DATABASE & STORAGE SETUP COMPLETE!         ');
  console.log('========================================================\n');
}

run().catch(e => {
  console.error('\n❌ Setup error:', e.message);
  process.exit(1);
});
