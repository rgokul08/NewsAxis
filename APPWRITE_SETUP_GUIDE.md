# NewsAxis • Complete Appwrite Setup Guide

This guide gives you the complete instructions and code to set up your **Appwrite Cloud** or **Self-Hosted Appwrite** database, collections, attributes, indexes, and media storage for NewsAxis.

---

## 🏗️ Architecture Overview

- **Real-World News & Blogs**: Refetched every **30 minutes** from verified global sources and news APIs. Stored in Appwrite `articles` collection and SQLite cache. Auto-purged every 30 minutes when fresh news arrives.
- **User-Uploaded News & Community Blogs**: Saved to Appwrite `articles` collection and storage. Retained for **1 day (24 hours)** and automatically deleted after 24 hours.
- **Media Storage**: Hosted in Appwrite Storage bucket `newsaxis-media`.
- **Live News Streams**: Free 24/7 live video news streams (Sky News, DW News, France 24, NBC News, India Today).

---

## ⚡ Option 1: Automated 1-Command Setup (Recommended)

NewsAxis includes an automated setup script that creates the database, all collections, all attributes, and the storage bucket automatically.

### Step 1: Create an Appwrite Account & Project
1. Log in to [Appwrite Cloud](https://cloud.appwrite.io) (or your self-hosted console).
2. Click **Create Project** and name it `NewsAxis`.
3. Note your **Project ID** from the Project Settings.

### Step 2: Create an API Key in Appwrite
1. Go to **Project Settings** > **API Keys** > **Create API Key**.
2. Name it `NewsAxis Server Key`.
3. Grant the following scopes:
   - `databases.read`, `databases.write`
   - `collections.read`, `collections.write`
   - `attributes.read`, `attributes.write`
   - `indexes.read`, `indexes.write`
   - `documents.read`, `documents.write`
   - `files.read`, `files.write`
   - `buckets.read`, `buckets.write`
   - `users.read`, `users.write`
4. Copy the secret API key.

### Step 3: Configure `.env.local`
Create a `.env.local` file in the root of the project with:

```env
# Appwrite Public Variables (Browser)
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=newsaxis-main
VITE_APPWRITE_BUCKET_ID=newsaxis-media

# Appwrite Server Admin Key (for automated setup and server-side news syncing)
APPWRITE_API_KEY=your_secret_api_key_here
APPWRITE_DATABASE_ID=newsaxis-main
APPWRITE_BUCKET_ID=newsaxis-media

# Real-World News API Keys (Optional, add any you have)
VITE_GNEWS_API_KEY=
VITE_NEWSDATA_API_KEY=
VITE_NEWSAPI_KEY=
VITE_MEDIASTACK_API_KEY=
VITE_THENEWSAPI_KEY=
```

### Step 4: Run the Setup Script
Run:
```bash
npm run setup:appwrite
```

The script will automatically:
- Create database `newsaxis-main`
- Create collections: `articles`, `profiles`, `comments`, `bookmarks`
- Create all string, boolean, integer attributes
- Create storage bucket `newsaxis-media` (10MB limit, image types, public read)

---

## 📋 Option 2: Manual Console Setup (Step-by-Step)

If you prefer to configure Appwrite manually in the web console, follow these steps:

### Step 1: Create Database
1. In the Appwrite console, navigate to **Databases** > **Create Database**.
2. Set **Database ID** to: `newsaxis-main`.
3. Set **Name** to: `NewsAxis Main Database`.

---

### Step 2: Create Collection `articles`
1. Inside database `newsaxis-main`, click **Create Collection**.
2. **Collection ID**: `articles`
3. **Name**: `News & Blog Articles`
4. In **Settings** > **Permissions**, add:
   - `Any` -> Read
   - `Users` -> Create, Update, Delete
   - `Any` -> Create (optional for guest submissions)

#### Attributes for `articles`:

| Key | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| `title` | String | 255 | Yes | - | Headline of article |
| `slug` | String | 150 | Yes | - | URL slug |
| `summary` | String | 1000 | No | - | Brief summary |
| `content` | String | 50000 | No | - | Body content (Markdown/HTML) |
| `imageUrl` | String | 1000 | No | - | High-res cover image URL |
| `sourceName` | String | 100 | No | NewsAxis | Name of publication |
| `sourceUrl` | String | 1000 | No | - | Original canonical URL |
| `authorName` | String | 100 | No | Staff | Journalist / Author name |
| `authorId` | String | 100 | No | - | User ID or guest |
| `categoryId` | String | 50 | No | world | e.g. world, india, technology |
| `contentType` | String | 20 | No | news | news or blog |
| `sourceType` | String | 50 | No | external_news | external_news, external_blog, community_blog |
| `publishedAt` | String | 50 | No | - | ISO publication time |
| `createdAt` | String | 50 | No | - | ISO creation time |
| `expiresAt` | String | 50 | No | - | Expiration ISO time (30m for news, 24h for user posts) |
| `isBreaking` | Boolean | - | No | false | True if breaking dispatch |
| `isFeatured` | Boolean | - | No | false | True if top lead story |
| `views` | Integer | - | No | 1 | View counter |
| `readingTime` | Integer | - | No | 3 | Estimated minutes |

#### Indexes for `articles`:
1. `idx_slug`: Type `unique`, Attributes `slug`
2. `idx_expires`: Type `key`, Attributes `expiresAt` (used by 30-min auto-cleanup)
3. `idx_category`: Type `key`, Attributes `categoryId`

---

### Step 3: Create Collection `profiles`
1. Click **Create Collection**.
2. **Collection ID**: `profiles`
3. **Permissions**: Read: `Any`, Create/Update/Delete: `Users`.

#### Attributes for `profiles`:
| Key | Type | Size | Required | Default |
|---|---|---|---|---|
| `userId` | String | 100 | Yes | - |
| `name` | String | 100 | Yes | - |
| `username` | String | 50 | Yes | - |
| `email` | String | 150 | No | - |
| `bio` | String | 500 | No | - |
| `avatarUrl` | String | 1000 | No | - |
| `role` | String | 20 | No | author |

---

### Step 4: Create Collection `comments`
1. Click **Create Collection**.
2. **Collection ID**: `comments`
3. **Permissions**: Read: `Any`, Create/Update/Delete: `Users`.

#### Attributes for `comments`:
| Key | Type | Size | Required |
|---|---|---|---|
| `articleId` | String | 100 | Yes |
| `userId` | String | 100 | Yes |
| `userName` | String | 100 | No |
| `content` | String | 2000 | Yes |
| `createdAt` | String | 50 | No |

---

### Step 5: Create Storage Bucket `newsaxis-media`
1. In the Appwrite console, go to **Storage** > **Create Bucket**.
2. **Bucket ID**: `newsaxis-media`
3. **Name**: `NewsAxis Media Assets`
4. **Settings**:
   - **File Size Limit**: `10MB`
   - **Allowed Extensions**: `jpg`, `jpeg`, `png`, `webp`, `gif`, `svg`
   - **File Security**: Disabled (allows public reading of images)
   - **Permissions**:
     - `Any` -> Read
     - `Users` -> Create, Update, Delete

---

## 🚀 Running the App

To run both the 30-minute real-world news ingestion server and the frontend together:

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Database Server: `http://localhost:3001`
- Server Status: `http://localhost:3001/api/status`
- News API Payload: `http://localhost:3001/api/news`

### What happens automatically:
1. **Startup**: The server fetches ~400+ real-world news items from BBC, The Hindu, Google News, TechCrunch, Wired, DEV.to, HackerNews, and any configured API keys.
2. **30-Minute Cycle**: Every 30 minutes, expired news (>30m) is automatically purged and fresh articles are ingested into the database and Appwrite.
3. **User Uploads**: Community stories published through `/write` are saved to the database and Appwrite with an expiration of **1 day (24 hours)**.
4. **Live Broadcasts**: Users can stream free live 24/7 world news directly by clicking **LIVE TV**.
