import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * NewsAxis local dev server.
 *
 * IMPORTANT: This file is NOT used in production on Vercel. vercel.json
 * rewrites every route to /index.html (a static SPA build), so nothing here
 * ever executes on news-axis.vercel.app. It exists only to make local
 * `npm run dev:all` convenient.
 *
 * All real news/blog ingestion now happens in the Appwrite Function at
 * appwrite/functions/sync-news, on a 30-minute Asia/Kolkata CRON schedule
 * configured in the Appwrite console. That function writes directly to the
 * Appwrite `articles` collection, and the React app (src/services/articleService.js)
 * reads only from Appwrite. This server does not fetch external APIs, does
 * not run SQLite, and does not need to stay running for data to update.
 */

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
            if (!process.env[key]) process.env[key] = val;
          }
        }
      });
    }
  }
}
loadEnv();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mode: 'dev-only',
    note: 'Production reads/writes go through Appwrite directly. See appwrite/functions/sync-news for the scheduled ingestion job.',
    appwriteConfigured: Boolean(process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY)
  });
});

// Serve the built frontend if present (mirrors what Vercel does)
const DIST_PATH = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_PATH, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NewsAxis Dev Server</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0d1117; color: #f0f6fc; padding: 40px; line-height: 1.6; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 24px; max-width: 640px; margin: 0 auto; }
            h1 { color: #38bdf8; margin-top: 0; }
            code { background: #21262d; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
            a { color: #38bdf8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>NewsAxis Dev Server</h1>
            <p>This is a local convenience server only. It is <strong>not</strong> deployed to Vercel.</p>
            <p>News ingestion runs as a scheduled Appwrite Function (<code>appwrite/functions/sync-news</code>), independent of this process and of the website being open.</p>
            <p>Frontend: run <code>npm run dev</code> and open <a href="http://localhost:5173">http://localhost:5173</a>.</p>
            <p>Build the SPA with <code>npm run build</code> to have this server also serve it at <a href="/">/</a>.</p>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(PORT, () => {
  console.log(`\nNewsAxis dev server listening on http://localhost:${PORT}`);
  console.log('This server does not run on Vercel and does not perform news ingestion.');
  console.log('Ingestion is handled by the Appwrite Function: appwrite/functions/sync-news\n');
});
