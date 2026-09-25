import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to load environment variables from .env.local or .env
try {
  const envLocal = path.resolve(__dirname, '../.env.local');
  const envMain = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envLocal) && process.loadEnvFile) {
    process.loadEnvFile(envLocal);
  } else if (fs.existsSync(envMain) && process.loadEnvFile) {
    process.loadEnvFile(envMain);
  }
} catch (e) {
  // Continue
}

const cliProjectId = process.argv[2];
const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = cliProjectId || process.env.APPWRITE_PROJECT_ID || (process.env.VITE_APPWRITE_PROJECT_ID !== 'newsaxis-prod' ? process.env.VITE_APPWRITE_PROJECT_ID : null);
const API_KEY = process.env.APPWRITE_API_KEY || 'standard_8d908df942748395872387098595c63acf0c28d30f846fb749285c398d63595a6e3362097e8d7870c13ee7fcfae4f1e8fbdded73e5afb31dc5cd3c9a409696f4439bb4040cf0c426a1d5411361745933485d020a42071d677e23f95a72bc9e6f88ea42cbe60883c8fdf477595a0595a83394cb2cf5d3d0aeb65688bb8b71a3eb';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || 'newsaxis-main';
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || process.env.VITE_APPWRITE_BUCKET_ID || 'newsaxis-media';

// If project ID was provided on CLI, persist it to .env.local
if (cliProjectId) {
  try {
    const envLocalPath = path.resolve(__dirname, '../.env.local');
    let content = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
    if (content.includes('VITE_APPWRITE_PROJECT_ID=')) {
      content = content.replace(/VITE_APPWRITE_PROJECT_ID=.*/g, `VITE_APPWRITE_PROJECT_ID=${cliProjectId}`);
    } else {
      content += `\nVITE_APPWRITE_PROJECT_ID=${cliProjectId}\n`;
    }
    fs.writeFileSync(envLocalPath, content, 'utf8');
    console.log(`Saved VITE_APPWRITE_PROJECT_ID=${cliProjectId} to .env.local.`);
  } catch (err) {
    // Ignore error
  }
}

console.log('\n========================================================');
console.log('       NEWSAXIS APPWRITE DATABASE & STORAGE SETUP       ');
console.log('========================================================\n');

if (!PROJECT_ID) {
  console.log('ℹ️ Usage: node scripts/setup-appwrite.js <YOUR_APPWRITE_PROJECT_ID>');
  console.log('   Example: node scripts/setup-appwrite.js 672e819b001a4bc2014d\n');
  console.log('You can find your Project ID in the Appwrite Console under Project Settings.\n');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// Helper for waiting between attribute creation steps
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function setup() {
  console.log(`Connecting to Appwrite: ${ENDPOINT}`);
  console.log(`Target Project ID: ${PROJECT_ID}`);
  console.log(`Target Database ID: ${DATABASE_ID}`);
  console.log(`Target Storage Bucket: ${BUCKET_ID}\n`);

  // 1. Create Database if not exists
  try {
    console.log(`[1/6] Checking Database "${DATABASE_ID}"...`);
    try {
      await databases.get(DATABASE_ID);
      console.log(`  ✓ Database "${DATABASE_ID}" already exists.`);
    } catch (e) {
      console.log(`  + Creating Database "${DATABASE_ID}"...`);
      await databases.create(DATABASE_ID, 'NewsAxis Main Database');
      console.log(`  ✓ Database "${DATABASE_ID}" created successfully.`);
    }
  } catch (err) {
    console.error(`❌ Failed database check/creation: ${err.message}`);
    process.exit(1);
  }

  // Helper to ensure collection exists
  async function ensureCollection(colId, colName, permissions = []) {
    try {
      await databases.getCollection(DATABASE_ID, colId);
      console.log(`  ✓ Collection "${colId}" exists.`);
    } catch (e) {
      console.log(`  + Creating Collection "${colId}" (${colName})...`);
      await databases.createCollection(
        DATABASE_ID, 
        colId, 
        colName, 
        permissions.length > 0 ? permissions : [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log(`  ✓ Collection "${colId}" created.`);
      await sleep(1000);
    }
  }

  // Helper to ensure string attribute
  async function ensureStringAttr(colId, key, size, required = false, defaultValue = undefined) {
    try {
      await databases.createStringAttribute(DATABASE_ID, colId, key, size, required, defaultValue);
      console.log(`    + Created string attribute: ${key} (${size})`);
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
      // Ignore existing
    }
  }

  // Helper to ensure integer attribute
  async function ensureIntAttr(colId, key, required = false, min = undefined, max = undefined, defaultValue = undefined) {
    try {
      await databases.createIntegerAttribute(DATABASE_ID, colId, key, required, min, max, defaultValue);
      console.log(`    + Created integer attribute: ${key}`);
      await sleep(600);
    } catch (e) {
      // Ignore existing
    }
  }

  // 2. Setup Articles Collection
  console.log(`\n[2/6] Configuring "articles" Collection & Attributes...`);
  await ensureCollection('articles', 'News & Blog Articles', [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
  ]);

  await ensureStringAttr('articles', 'title', 255, true);
  await ensureStringAttr('articles', 'slug', 150, true);
  await ensureStringAttr('articles', 'summary', 1000, false);
  await ensureStringAttr('articles', 'content', 50000, false);
  await ensureStringAttr('articles', 'imageUrl', 1000, false);
  await ensureStringAttr('articles', 'sourceName', 100, false, 'NewsAxis');
  await ensureStringAttr('articles', 'sourceUrl', 1000, false);
  await ensureStringAttr('articles', 'authorName', 100, false, 'Staff');
  await ensureStringAttr('articles', 'authorId', 100, false);
  await ensureStringAttr('articles', 'categoryId', 50, false, 'world');
  await ensureStringAttr('articles', 'contentType', 20, false, 'news');
  await ensureStringAttr('articles', 'sourceType', 50, false, 'external_news');
  await ensureStringAttr('articles', 'publishedAt', 50, false);
  await ensureStringAttr('articles', 'createdAt', 50, false);
  await ensureStringAttr('articles', 'expiresAt', 50, false);
  await ensureBoolAttr('articles', 'isBreaking', false, false);
  await ensureBoolAttr('articles', 'isFeatured', false, false);
  await ensureIntAttr('articles', 'views', false, 0, 10000000, 1);
  await ensureIntAttr('articles', 'readingTime', false, 1, 60, 3);

  // 3. Setup Profiles Collection
  console.log(`\n[3/6] Configuring "profiles" Collection...`);
  await ensureCollection('profiles', 'User Profiles');
  await ensureStringAttr('profiles', 'userId', 100, true);
  await ensureStringAttr('profiles', 'name', 100, true);
  await ensureStringAttr('profiles', 'username', 50, true);
  await ensureStringAttr('profiles', 'email', 150, false);
  await ensureStringAttr('profiles', 'bio', 500, false);
  await ensureStringAttr('profiles', 'avatarUrl', 1000, false);
  await ensureStringAttr('profiles', 'role', 20, false, 'author');

  // 4. Setup Comments Collection
  console.log(`\n[4/6] Configuring "comments" Collection...`);
  await ensureCollection('comments', 'Article Comments');
  await ensureStringAttr('comments', 'articleId', 100, true);
  await ensureStringAttr('comments', 'userId', 100, true);
  await ensureStringAttr('comments', 'userName', 100, false);
  await ensureStringAttr('comments', 'content', 2000, true);
  await ensureStringAttr('comments', 'createdAt', 50, false);

  // 5. Setup Bookmarks Collection
  console.log(`\n[5/6] Configuring "bookmarks" Collection...`);
  await ensureCollection('bookmarks', 'User Bookmarks');
  await ensureStringAttr('bookmarks', 'userId', 100, true);
  await ensureStringAttr('bookmarks', 'articleId', 100, true);
  await ensureStringAttr('bookmarks', 'createdAt', 50, false);

  // 6. Setup Storage Bucket
  console.log(`\n[6/6] Configuring Storage Bucket "${BUCKET_ID}"...`);
  try {
    await storage.getBucket(BUCKET_ID);
    console.log(`  ✓ Bucket "${BUCKET_ID}" already exists.`);
  } catch (e) {
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
      false, // fileSecurity
      true,  // enabled
      10 * 1024 * 1024, // 10MB maximum file size
      ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
    );
    console.log(`  ✓ Storage Bucket "${BUCKET_ID}" created successfully.`);
  }

  console.log('\n========================================================');
  console.log('  🎉 APPWRITE DATABASE & STORAGE INITIALIZATION COMPLETE!');
  console.log('========================================================');
  console.log('\nNext Steps:');
  console.log('1. Ensure your .env.local has:');
  console.log(`   VITE_APPWRITE_PROJECT_ID=${PROJECT_ID}`);
  console.log(`   VITE_APPWRITE_DATABASE_ID=${DATABASE_ID}`);
  console.log(`   VITE_APPWRITE_BUCKET_ID=${BUCKET_ID}`);
  console.log(`   APPWRITE_API_KEY=${API_KEY.slice(0, 8)}...`);
  console.log('2. Start the server & frontend:');
  console.log('   npm run dev:all');
  console.log('   (Your news will refetch every 30 mins and sync to Appwrite!)\n');
}

setup().catch(err => {
  console.error('\n❌ Setup script encountered an error:', err.message);
  process.exit(1);
});
