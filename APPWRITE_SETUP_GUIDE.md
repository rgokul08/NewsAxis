# NewsAxis • Complete Appwrite & Live News Pipeline Setup Guide

This guide details the exact architecture, root-cause diagnosis, and step-by-step configuration for the **NewsAxis** live news and blog system.

---

## 🔍 Root Cause Analysis: Why Appwrite Had 0 News Documents

During end-to-end debugging, three critical root causes were identified:

1. **Appwrite Server API Key Missing Required Scopes (401 Unauthorized Scope)**:
   - When the backend tried to sync news to Appwrite or run setup scripts, Appwrite Cloud rejected every operation with:
     ```
     app.6a854c5d... missing scopes (["documents.write"]) code: 401 type: general_unauthorized_scope
     missing scopes (["collections.write"]) code: 401
     ```
   - In Appwrite Console, when an API Key is generated, scopes are **not enabled by default**. Without `documents.write`, `collections.write`, `attributes.write`, etc., all writes fail.
   - In the legacy code, these errors were caught with `catch { skipped++; }` without logging, making it look as though sync ran while 0 documents were written.

2. **Collection `articles` Did Not Exist in Database**:
   - Because `collections.write` was missing, `setup-appwrite.js` could not create the collection.
   - When the frontend Web SDK attempted to list documents, Appwrite returned:
     ```
     Collection with the requested ID 'articles' could not be found. 404 collection_not_found
     ```

3. **Frontend / Vercel Disconnect & Infinite "Refresh Live Reader"**:
   - The frontend was relying solely on `fetch('/api/news')` instead of directly loading from Appwrite.
   - On Vercel, `server/index.js` (Express) does not run as a persistent server. Because there were no Vercel serverless function files in `api/`, `vercel.json` rewrote `/api/news` to `/index.html`.
   - The browser then received HTML instead of JSON, triggering client-side RSS fallbacks that were blocked by browser **CORS**.
   - With 0 articles, the UI fell into the empty state and endlessly prompted "Refresh Live Reader", calling the failing `/api/sync` endpoint in a loop.

---

## 🛠️ Complete Step-by-Step Appwrite Setup

### Step 1: Create or Open Your Appwrite Project
1. Log in to [Appwrite Cloud](https://cloud.appwrite.io).
2. Select or create your project:
   - **Project Name**: `NewsAxis`
   - **Project ID**: Note your Project ID (e.g. `6a854c5d0026a9224d01`).
   - **Endpoint**: Note your regional endpoint (e.g., `https://sgp.cloud.appwrite.io/v1` for Singapore or `https://cloud.appwrite.io/v1` for global).

---

### Step 2: Create Server API Key with Mandatory Scopes
> [!IMPORTANT]
> This is the single most common reason why documents do not reach Appwrite. You must grant the scopes listed below.

1. In the Appwrite Console, go to **Project Settings** (gear icon) > **API Keys**.
2. Click **Create API Key**.
3. Name: `NewsAxis Server Key`.
4. Set **Expiration**: Desired expiration (or never for persistent sync).
5. Enable all the following scopes:
   - **Databases**: `databases.read`, `databases.write`
   - **Collections**: `collections.read`, `collections.write`
   - **Attributes**: `attributes.read`, `attributes.write`
   - **Indexes**: `indexes.read`, `indexes.write`
   - **Documents**: `documents.read`, `documents.write`
   - **Files**: `files.read`, `files.write`
   - **Buckets**: `buckets.read`, `buckets.write`
   - **Users**: `users.read`, `users.write`
6. Click **Create** and copy the secret key.

---

### Step 3: Run the Automated Setup Script
In your terminal, run:
```bash
npm run setup:appwrite
```
The script will:
- Check and validate that your API key has all required scopes.
- Create Database `newsaxis-main` (or your configured `APPWRITE_DATABASE_ID`).
- Create Collection `articles` with proper permissions (`read: any`, `create: any`, `update: users`, `delete: users`).
- Create all 24 typed attributes on `articles` with safe size limits.
- Create indexes on `slug`, `categoryId`, `publishedAt`, and `expiresAt`.
- Create Storage Bucket `newsaxis-media` with public read access.
- Execute a live write and read test to confirm end-to-end functionality.

---

### Step 4: Manual Appwrite Console Setup (Alternative)

If you prefer to configure manually in the Appwrite Console:

#### 1. Database:
- **Database ID**: `newsaxis-main`
- **Name**: `NewsAxis Main Database`

#### 2. Collection `articles`:
- **Collection ID**: `articles`
- **Name**: `News & Blog Articles`
- **Permissions**:
  - `Any` -> Read
  - `Any` -> Create
  - `Users` -> Update, Delete

#### Attributes for `articles`:
| Key | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| `title` | String | 500 | Yes | - | Article headline |
| `slug` | String | 255 | Yes | - | URL slug |
| `description` | String | 2000 | No | - | Excerpt or brief summary |
| `summary` | String | 2000 | No | - | Full summary text |
| `content` | String | 10000 | No | - | Article body / excerpt |
| `imageUrl` | String | 1000 | No | - | High-res image URL |
| `source` | String | 150 | No | NewsAxis | News agency / publication |
| `sourceName` | String | 150 | No | NewsAxis | News agency / publication |
| `sourceUrl` | String | 1000 | No | - | Canonical source link |
| `url` | String | 1000 | No | - | Canonical source link |
| `author` | String | 150 | No | Staff | Journalist / Author name |
| `authorName` | String | 150 | No | Staff | Journalist / Author name |
| `authorId` | String | 100 | No | - | User ID if authored |
| `category` | String | 100 | No | world | e.g. breaking, india, world, politics, business |
| `categoryId` | String | 100 | No | world | Category slug identifier |
| `provider` | String | 100 | No | rss | Provider source (bbc, gnews, dev_to, etc.) |
| `language` | String | 20 | No | en | Language code |
| `contentType` | String | 50 | No | news | news or blog |
| `sourceType` | String | 50 | No | external_news | external_news, external_blog, community_blog |
| `publishedAt` | String | 100 | No | - | UTC ISO timestamp |
| `createdAt` | String | 100 | No | - | UTC ISO timestamp |
| `expiresAt` | String | 100 | No | - | Expiration ISO (30m for news, 24h for user posts) |
| `isBreaking` | Boolean | - | No | false | True if urgent breaking dispatch |
| `isFeatured` | Boolean | - | No | false | True if featured lead story |
| `views` | Integer | - | No | 1 | View counter |
| `readingTime` | Integer | - | No | 3 | Estimated read time in minutes |

#### Indexes for `articles`:
1. `idx_slug`: Key on `slug`
2. `idx_category`: Key on `categoryId`
3. `idx_published`: Key on `publishedAt`
4. `idx_expires`: Key on `expiresAt`

#### 3. Storage Bucket `newsaxis-media`:
- **Bucket ID**: `newsaxis-media`
- **Name**: `NewsAxis Media Assets`
- **File Size Limit**: `10MB`
- **Allowed Extensions**: `jpg`, `jpeg`, `png`, `webp`, `gif`, `svg`
- **File Security**: Disabled (allows public reading of images)
- **Permissions**:
  - `Any` -> Read
  - `Users` -> Create, Update, Delete

---

## 🔐 Environment Variables (.env / Vercel)

Configure the following variables in your `.env` (or `.env.local` for development and Vercel Project Settings for production):

```env
# ==============================================================================
# 1. APPWRITE CLIENT CONFIGURATION (Browser / Frontend)
# ==============================================================================
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=6a854c5d0026a9224d01
VITE_APPWRITE_DATABASE_ID=6ab613fc0006b9fedac1
VITE_APPWRITE_BUCKET_ID=6ab614cc0022aa43fab8

# Collection IDs
VITE_APPWRITE_COLLECTION_ARTICLES=articles
VITE_APPWRITE_COLLECTION_PROFILES=profiles
VITE_APPWRITE_COLLECTION_COMMENTS=comments
VITE_APPWRITE_COLLECTION_BOOKMARKS=bookmarks

# ==============================================================================
# 2. APPWRITE SERVER & API KEY (Backend Server & Vercel Functions ONLY)
# ==============================================================================
# IMPORTANT: Must have databases, collections, attributes, indexes, documents, files scopes
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=6a854c5d0026a9224d01
APPWRITE_API_KEY=your_secret_api_key_with_all_scopes_here
APPWRITE_DATABASE_ID=6ab613fc0006b9fedac1
APPWRITE_BUCKET_ID=6ab614cc0022aa43fab8

# ==============================================================================
# 3. NEWS PROVIDER KEYS (Optional, free public RSS feeds work automatically)
# ==============================================================================
GNEWS_API_KEY=
NEWSDATA_API_KEY=
NEWS_API_KEY=
THENEWS_API_KEY=
MEDIASTACK_API_KEY=
CURRENTS_API_KEY=

# ==============================================================================
# 4. RETENTION POLICIES
# ==============================================================================
NEWS_RETENTION_MINUTES=30
USER_POST_RETENTION_HOURS=24
```

> [!CAUTION]
> Never expose `APPWRITE_API_KEY` with `VITE_` prefix. Only public IDs and endpoints should use `VITE_`.

---

## ⚡ 30-Minute Automatic Refresh Pipeline

1. **Vercel Serverless & Cron**:
   - `vercel.json` schedules `*/30 * * * *` targeting `/api/sync`.
   - Vercel automatically runs `/api/sync` every 30 minutes.
   - The handler pulls fresh news from BBC, The Hindu, Google News, DEV.to, Medium, HackerNews, and configured APIs, deduplicates by URL and title hash, and upserts them directly to Appwrite `articles`.
   - Articles older than 30 minutes are automatically purged from Appwrite.

2. **Frontend Immediate Appwrite Loading**:
   - When a user visits NewsAxis, the browser immediately queries Appwrite Database `articles` collection via the Appwrite Client SDK.
   - Articles render instantly (sub-50ms) without waiting for background server tasks.

3. **Manual Refresh**:
   - Clicking **Refresh** in the header or edition bar triggers `POST /api/sync`.
   - The backend runs an immediate sync cycle, updates Appwrite, and refreshes the feed with a confirmation toast.

---

## ✅ Verification Checklist

1. **Verify Appwrite Scopes**:
   ```bash
   node -e "import('./server/appwrite.js').then(m => console.log(m.getAppwriteStatus()));"
   ```
2. **Run Setup Script**:
   ```bash
   npm run setup:appwrite
   ```
   Confirm all attributes and bucket are created.
3. **Trigger News Aggregation & Appwrite Sync**:
   ```bash
   node -e "import('./server/index.js'); import('./server/aggregator.js').then(async a => { const r = await a.aggregateRealWorldContent(30); const ap = await import('./server/appwrite.js'); await ap.syncArticlesToAppwrite(r.articles, r.batchId); console.log('Done!'); process.exit(0); });"
   ```
4. **Confirm Documents Appear in Appwrite Console**:
   - Open Appwrite Console > Databases > `newsaxis-main` > `articles`.
   - Confirm 30+ real articles exist with title, summary, source, category, and IST timestamps.
5. **Start Frontend & Server**:
   ```bash
   npm run dev:all
   ```
   Open `http://localhost:5173` and confirm the homepage loads with real news, live breaking ticker, and category filters.
