import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
let ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
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

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

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

async function setup() {
  await verifyScopes();

  // 1. Create or verify database
  console.log(`\n[Step 1/5] Checking Database "${DATABASE_ID}"...`);
  try {
    await databases.get(DATABASE_ID);
    console.log(`  ✓ Database "${DATABASE_ID}" exists and is ready.`);
  } catch (e) {
    if (e.code === 404) {
      console.log(`  + Creating Database "${DATABASE_ID}"...`);
      await databases.create(DATABASE_ID, 'NewsAxis Main Database');
      console.log(`  ✓ Database "${DATABASE_ID}" created successfully.`);
    } else {
      throw e;
    }
  }

  // Helper to ensure collection exists
  async function ensureCollection(colId, colName, permissions = []) {
    try {
      await databases.getCollection(DATABASE_ID, colId);
      console.log(`  ✓ Collection "${colId}" exists.`);
    } catch (e) {
      if (e.code === 404) {
        console.log(`  + Creating Collection "${colId}" (${colName})...`);
        await databases.createCollection(
          DATABASE_ID,
          colId,
          colName,
          permissions.length > 0 ? permissions : [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        console.log(`  ✓ Collection "${colId}" created.`);
        await sleep(800);
      } else {
        throw e;
      }
    }
  }

  // Helper to ensure string attribute
  async function ensureStringAttr(colId, key, size, required = false, defaultValue = undefined) {
    try {
      await databases.createStringAttribute(DATABASE_ID, colId, key, size, required, defaultValue);
      console.log(`    + Created string attribute: ${key} (max ${size})`);
      await sleep(600);
    } catch (e) {
      // Attribute might already exist
    }
  }

  // Helper to ensure boolean attribute
  async function ensureBoolAttr(colId, key, required = false, defaultValue = false) {
    try {
      await databases.createBooleanAttribute(DATABASE_ID, colId, key, required, defaultValue);
      console.log(`    + Created boolean attribute: ${key}`);
      await sleep(600);
    } catch (e) {
      // Already exists
    }
  }

  // Helper to ensure integer attribute
  async function ensureIntAttr(colId, key, required = false, min = undefined, max = undefined, defaultValue = undefined) {
    try {
      await databases.createIntegerAttribute(DATABASE_ID, colId, key, required, min, max, defaultValue);
      console.log(`    + Created integer attribute: ${key}`);
      await sleep(600);
    } catch (e) {
      // Already exists
    }
  }

  // Helper to ensure index
  async function ensureIndex(colId, key, type, attributes, orders = []) {
    try {
      await databases.createIndex(DATABASE_ID, colId, key, type, attributes, orders);
      console.log(`    + Created index: ${key} on [${attributes.join(', ')}]`);
      await sleep(800);
    } catch (e) {
      // Index might already exist
    }
  }

  // 2. Setup Articles Collection
  console.log(`\n[Step 2/5] Configuring "articles" Collection & Attributes...`);
  await ensureCollection('articles', 'News & Blog Articles', [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
  ]);

  await ensureStringAttr('articles', 'title', 500, true);
  await ensureStringAttr('articles', 'slug', 255, true);
  await ensureStringAttr('articles', 'description', 2000, false);
  await ensureStringAttr('articles', 'summary', 2000, false);
  await ensureStringAttr('articles', 'content', 10000, false);
  await ensureStringAttr('articles', 'imageUrl', 1000, false);
  await ensureStringAttr('articles', 'source', 150, false, 'NewsAxis');
  await ensureStringAttr('articles', 'sourceName', 150, false, 'NewsAxis');
  await ensureStringAttr('articles', 'sourceUrl', 1000, false);
  await ensureStringAttr('articles', 'url', 1000, false);
  await ensureStringAttr('articles', 'author', 150, false, 'Staff');
  await ensureStringAttr('articles', 'authorName', 150, false, 'Staff');
  await ensureStringAttr('articles', 'authorId', 100, false);
  await ensureStringAttr('articles', 'category', 100, false, 'world');
  await ensureStringAttr('articles', 'categoryId', 100, false, 'world');
  await ensureStringAttr('articles', 'provider', 100, false, 'rss');
  await ensureStringAttr('articles', 'language', 20, false, 'en');
  await ensureStringAttr('articles', 'contentType', 50, false, 'news');
  await ensureStringAttr('articles', 'sourceType', 50, false, 'external_news');
  await ensureStringAttr('articles', 'publishedAt', 100, false);
  await ensureStringAttr('articles', 'createdAt', 100, false);
  await ensureStringAttr('articles', 'expiresAt', 100, false);
  await ensureBoolAttr('articles', 'isBreaking', false, false);
  await ensureBoolAttr('articles', 'isFeatured', false, false);
  await ensureIntAttr('articles', 'views', false, 0, 10000000, 1);
  await ensureIntAttr('articles', 'readingTime', false, 1, 60, 3);

  console.log('  Configuring "articles" Indexes...');
  await ensureIndex('articles', 'idx_slug', 'key', ['slug']);
  await ensureIndex('articles', 'idx_category', 'key', ['categoryId']);
  await ensureIndex('articles', 'idx_published', 'key', ['publishedAt']);
  await ensureIndex('articles', 'idx_expires', 'key', ['expiresAt']);

  // 3. Setup Profiles, Comments, Bookmarks Collections
  console.log(`\n[Step 3/5] Configuring Supporting Collections (profiles, comments, bookmarks)...`);
  await ensureCollection('profiles', 'User Profiles', [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);
  await ensureStringAttr('profiles', 'userId', 100, true);
  await ensureStringAttr('profiles', 'name', 100, true);
  await ensureStringAttr('profiles', 'username', 50, true);
  await ensureStringAttr('profiles', 'email', 150, false);
  await ensureStringAttr('profiles', 'bio', 500, false);
  await ensureStringAttr('profiles', 'avatarUrl', 1000, false);
  await ensureStringAttr('profiles', 'role', 20, false, 'author');

  await ensureCollection('comments', 'Article Comments', [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);
  await ensureStringAttr('comments', 'articleId', 100, true);
  await ensureStringAttr('comments', 'userId', 100, true);
  await ensureStringAttr('comments', 'userName', 100, false);
  await ensureStringAttr('comments', 'content', 2000, true);
  await ensureStringAttr('comments', 'createdAt', 50, false);

  await ensureCollection('bookmarks', 'User Bookmarks', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);
  await ensureStringAttr('bookmarks', 'userId', 100, true);
  await ensureStringAttr('bookmarks', 'articleId', 100, true);
  await ensureStringAttr('bookmarks', 'createdAt', 50, false);

  // 4. Setup Storage Bucket
  console.log(`\n[Step 4/5] Configuring Storage Bucket "${BUCKET_ID}"...`);
  try {
    await storage.getBucket(BUCKET_ID);
    console.log(`  ✓ Bucket "${BUCKET_ID}" exists.`);
  } catch (e) {
    if (e.code === 404) {
      console.log(`  + Creating Bucket "${BUCKET_ID}"...`);
      await storage.createBucket(
        BUCKET_ID,
        'NewsAxis Media Assets',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ],
        false, // fileSecurity false allows public image preview
        true,  // enabled
        10 * 1024 * 1024,
        ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
      );
      console.log(`  ✓ Bucket "${BUCKET_ID}" created successfully.`);
    } else {
      console.warn(`  Bucket warning: ${e.message}`);
    }
  }

  // 5. Test Live Document Write & Read
  console.log(`\n[Step 5/5] Performing Live Verification Write & Read...`);
  try {
    const testDocId = 'test_init_' + Date.now().toString(36);
    const testDoc = await databases.createDocument(
      DATABASE_ID,
      'articles',
      testDocId,
      {
        title: 'NewsAxis Pipeline Operational Test',
        slug: 'newsaxis-pipeline-operational-test',
        description: 'Verification article confirming Appwrite write/read access.',
        summary: 'Verification article confirming Appwrite write/read access.',
        content: 'Pipeline active. Real-world news will sync on next 30-min cycle.',
        sourceName: 'NewsAxis System',
        authorName: 'System Diagnostic',
        categoryId: 'technology',
        publishedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isBreaking: false,
        views: 1,
        readingTime: 1
      }
    );
    console.log(`  ✓ Document write verified (ID: ${testDoc.$id})`);
    
    // Clean up test document
    await databases.deleteDocument(DATABASE_ID, 'articles', testDocId);
    console.log(`  ✓ Document delete verified.`);
  } catch (writeErr) {
    console.warn(`  ⚠️ Note during write verification: ${writeErr.message}`);
  }

  console.log('\n========================================================');
  console.log('  🎉 APPWRITE DATABASE & STORAGE SETUP COMPLETE!         ');
  console.log('========================================================');
  console.log('\nYour Appwrite database is configured and ready to receive news.');
  console.log('Run `npm run server` or trigger `/api/sync` to populate real news!\n');
}

setup().catch(err => {
  console.error('\n❌ Setup error:', err.message);
  process.exit(1);
});
