import { Client, Databases, Query, ID } from 'node-appwrite';

/**
 * Appwrite Function: sync-news
 * Schedule (set in Appwrite console → Functions → sync-news → Settings →
 * Schedule, CRON, timezone Asia/Kolkata): "*\/30 * * * *"
 *
 * This runs on Appwrite's infrastructure on a fixed schedule — NOT triggered
 * by website visits, not dependent on any browser tab, and keeps running
 * 24/7 whether or not anyone opens the site.
 *
 * Each run:
 *  1. Fetches from every configured external API/feed in parallel.
 *  2. Normalizes + classifies each item into a fixed category taxonomy.
 *  3. Writes to Appwrite using a deterministic document ID derived from the
 *     canonical source URL (or provider+externalId), so re-running never
 *     creates duplicates — it just updates the existing doc.
 *  4. Deletes documents whose expiresAt has passed.
 */

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'newsaxis-main';
const ARTICLES_COLLECTION = 'articles';
const RETENTION_MINUTES = Number(process.env.NEWS_RETENTION_MINUTES || 30);

const CATEGORY_RULES = [
  ['sports', /\b(cricket|football|soccer|tennis|fifa|ipl|olympics|nba|nfl|premier league|champions league|formula 1|f1|wimbledon)\b/i],
  ['markets', /\b(stock market|stocks|sensex|nifty|wall street|nasdaq|dow jones|s&p 500|shares|equities|ipo|bse|nse|nyse)\b/i],
  ['finance', /\b(banking|bank|fintech|cryptocurrency|bitcoin|ethereum|mutual fund|insurance|income tax|loan|interest rate)\b/i],
  ['politics', /\b(parliament|election|bjp|congress|lok sabha|rajya sabha|prime minister|president|senate|cabinet|minister|diplomacy)\b/i],
  ['business', /\b(business|corporate|merger|acquisition|earnings|revenue|startup funding|ipo|enterprise|ceo)\b/i],
  ['technology', /\b(ai|artificial intelligence|machine learning|openai|chatgpt|semiconductor|robotics|cybersecurity|smartphone|software|cloud computing)\b/i],
  ['science', /\b(nasa|isro|space|galaxy|astronomy|planet|telescope|quantum|physics|genetics|biotechnology)\b/i],
  ['health', /\b(health|hospital|doctor|vaccine|disease|cancer|mental health|pharma|pandemic|who|fda)\b/i],
  ['education', /\b(education|university|college|school|student|exam|curriculum|admissions)\b/i],
  ['entertainment', /\b(movie|film|cinema|box office|actor|actress|hollywood|bollywood|netflix|celebrity|music)\b/i],
  ['travel', /\b(travel|tourism|tourist|hotel|flight|airline|destination|vacation)\b/i],
  ['lifestyle', /\b(lifestyle|fashion|culture|cuisine|recipes|wellness)\b/i],
  ['world', /\b(global|international|world|geopolitic|united nations)\b/i],
  ['india', /\b(india|indian|new delhi|mumbai|chennai|bengaluru|kolkata|hyderabad|tamil nadu)\b/i]
];

function classify(title = '', description = '', fallback = 'world') {
  const text = `${title} ${description}`;
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return fallback;
}

function crc32(str) {
  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ ((crc ^ str.charCodeAt(i)) & 0xff);
  }
  return (crc ^ -1) >>> 0;
}

function docIdFor(item) {
  const key = item.sourceUrl || `${item.providerId}:${item.externalId || item.title}`;
  return `art_${Math.abs(crc32(key)).toString(36)}`.slice(0, 36);
}

function slugFor(title, id) {
  const base = (title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return `${base}-${id.slice(-6)}`;
}

// --- Source fetchers -------------------------------------------------

async function fetchDevTo() {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=20&top=3');
    if (!res.ok) return [];
    const items = await res.json();
    return items.map(a => ({
      title: a.title, description: a.description || '', content: a.body_markdown || a.description || '',
      sourceUrl: a.url, imageUrl: a.cover_image || a.social_image, sourceName: 'DEV Community',
      authorName: a.user?.name || 'DEV Author', publishedAt: a.published_at || a.created_at,
      providerId: 'dev_to', externalId: String(a.id), contentType: 'blog', sourceType: 'external_blog',
      defaultCategory: 'programming'
    }));
  } catch { return []; }
}

async function fetchHackerNews() {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!idsRes.ok) return [];
    const ids = (await idsRes.json()).slice(0, 10);
    const stories = await Promise.all(ids.map(async id => {
      try {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return r.ok ? r.json() : null;
      } catch { return null; }
    }));
    return stories.filter(s => s?.title && s?.url).map(s => ({
      title: s.title, description: `${s.score || 0} points, ${s.descendants || 0} comments on Hacker News.`,
      content: s.title, sourceUrl: s.url, imageUrl: '', sourceName: 'Hacker News', authorName: s.by || 'HN',
      publishedAt: new Date((s.time || Date.now() / 1000) * 1000).toISOString(),
      providerId: 'hacker_news', externalId: String(s.id), contentType: 'news', sourceType: 'external_news',
      defaultCategory: 'technology'
    }));
  } catch { return []; }
}

async function fetchRss(url, name, providerId, defaultCategory) {
  try {
    const proxied = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok) return [];
    const json = await res.json();
    if (json.status !== 'ok') return [];
    return (json.items || []).slice(0, 15).map(it => ({
      title: it.title, description: (it.description || '').replace(/<[^>]+>/g, '').slice(0, 300),
      content: (it.description || '').replace(/<[^>]+>/g, ''), sourceUrl: it.link,
      imageUrl: it.thumbnail || '', sourceName: name, authorName: it.author || name,
      publishedAt: it.pubDate, providerId, externalId: it.guid || it.link,
      contentType: 'news', sourceType: 'external_news', defaultCategory
    }));
  } catch { return []; }
}

async function fetchAllSources() {
  const feeds = [
    ['https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC News', 'bbc_world', 'world'],
    ['https://www.thehindu.com/news/national/feeder/default.rss', 'The Hindu', 'the_hindu', 'india'],
    ['https://feeds.bbci.co.uk/sport/rss.xml', 'BBC Sport', 'bbc_sport', 'sports'],
    ['https://techcrunch.com/feed/', 'TechCrunch', 'techcrunch', 'technology'],
    ['https://feeds.bbci.co.uk/news/business/rss.xml', 'BBC Business', 'bbc_business', 'business'],
    ['https://feeds.bbci.co.uk/news/health/rss.xml', 'BBC Health', 'bbc_health', 'health'],
    ['https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 'BBC Science', 'bbc_science', 'science'],
    ['https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', 'BBC Entertainment', 'bbc_entertainment', 'entertainment']
  ];
  const results = await Promise.allSettled([
    fetchDevTo(),
    fetchHackerNews(),
    ...feeds.map(([url, name, id, cat]) => fetchRss(url, name, id, cat))
  ]);
  const all = [];
  for (const r of results) if (r.status === 'fulfilled') all.push(...r.value);
  return all;
}

// --- Main entrypoint ---------------------------------------------------

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    log('Missing APPWRITE_PROJECT_ID / APPWRITE_API_KEY env vars.');
    return res.json({ success: false, error: 'Not configured' }, 500);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  let fetched = 0, upserted = 0, purged = 0, failures = 0;

  try {
    const rawItems = await fetchAllSources();
    fetched = rawItems.length;

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + RETENTION_MINUTES * 60 * 1000).toISOString();

    const seen = new Set();
    for (const item of rawItems) {
      if (!item.title || !item.sourceUrl) continue;
      const dupKey = item.sourceUrl.split('?')[0].toLowerCase();
      if (seen.has(dupKey)) continue;
      seen.add(dupKey);

      const category = classify(item.title, item.description, item.defaultCategory);
      const id = docIdFor(item);
      const slug = slugFor(item.title, id);

      const doc = {
        title: item.title.slice(0, 255),
        slug: slug.slice(0, 120),
        summary: (item.description || '').slice(0, 1000),
        content: (item.content || item.description || '').slice(0, 5000),
        imageUrl: item.imageUrl || '',
        sourceName: item.sourceName || 'NewsAxis',
        sourceUrl: item.sourceUrl,
        authorName: item.authorName || 'Staff',
        categoryId: category,
        contentType: item.contentType || 'news',
        sourceType: item.sourceType || 'external_news',
        tags: JSON.stringify([category, item.contentType || 'news']),
        publishedAt: item.publishedAt || nowIso,
        createdAt: nowIso,
        expiresAt,
        isBreaking: category === 'world' || category === 'india',
        isFeatured: false,
        views: 1,
        readingTime: Math.max(1, Math.ceil((item.content || '').split(/\s+/).length / 200))
      };

      try {
        try {
          await databases.updateDocument(DATABASE_ID, ARTICLES_COLLECTION, id, doc);
        } catch (updateErr) {
          await databases.createDocument(DATABASE_ID, ARTICLES_COLLECTION, id, doc);
        }
        upserted++;
      } catch (err) {
        failures++;
        error(`Failed to upsert "${item.title}": ${err.message}`);
      }
    }

    // Purge expired documents (both stale news and expired community posts)
    const expiredList = await databases.listDocuments(DATABASE_ID, ARTICLES_COLLECTION, [
      Query.lessThanEqual('expiresAt', nowIso),
      Query.limit(100)
    ]);
    for (const doc of expiredList.documents) {
      try {
        await databases.deleteDocument(DATABASE_ID, ARTICLES_COLLECTION, doc.$id);
        purged++;
      } catch { /* continue */ }
    }

    log(`sync-news: fetched=${fetched} upserted=${upserted} purged=${purged} failures=${failures}`);
    return res.json({ success: true, fetched, upserted, purged, failures });
  } catch (err) {
    error(`sync-news fatal error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
