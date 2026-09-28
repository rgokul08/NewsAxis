/**
 * Real-World News & Blog Multi-Source Aggregator
 * Pulls live data from actual RSS feeds and public APIs with zero authentication needed.
 * Strictly uses real-world data only (NO demo/mock data).
 */
import crypto from 'node:crypto';
import { getDynamicArticleImage, extractImageFromXml } from '../src/utils/dynamicImage.js';

export { getDynamicArticleImage };


const FEEDS = [
  // 1. Breaking News Feeds
  {
    id: 'google_news_breaking',
    name: 'Google Breaking Top Stories',
    url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    category: 'breaking',
    type: 'news'
  },
  // 2. Global & World News
  {
    id: 'bbc_world',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    type: 'news'
  },
  {
    id: 'google_news_world',
    name: 'Google News World',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
    category: 'world',
    type: 'news'
  },
  // 3. India & National
  {
    id: 'the_hindu',
    name: 'The Hindu',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    category: 'india',
    type: 'news'
  },
  {
    id: 'google_news_india',
    name: 'Google News India',
    url: 'https://news.google.com/rss/headlines/section/geo/India?hl=en-IN&gl=IN&ceid=IN:en',
    category: 'india',
    type: 'news'
  },
  // 4. Politics
  {
    id: 'bbc_politics',
    name: 'BBC Politics',
    url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
    category: 'politics',
    type: 'news'
  },
  // 5. Business, Economy, Markets & Trade
  {
    id: 'google_news_business',
    name: 'Google Business News',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
    category: 'business',
    type: 'news'
  },
  {
    id: 'mint_economy',
    name: 'Mint Economy & Policy',
    url: 'https://www.livemint.com/rss/economy',
    category: 'economy',
    type: 'news'
  },
  {
    id: 'cnbc_markets',
    name: 'CNBC Global Markets',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=markets&sort=date&type=rss',
    category: 'markets',
    type: 'news'
  },
  {
    id: 'mint_trade',
    name: 'Mint Companies & Trade',
    url: 'https://www.livemint.com/rss/companies',
    category: 'trade',
    type: 'news'
  },
  // 6. Technology & AI
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'technology',
    type: 'news'
  },
  {
    id: 'google_news_tech',
    name: 'Google Tech News',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
    category: 'technology',
    type: 'news'
  },
  {
    id: 'wired_rss',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'technology',
    type: 'news'
  },
  // 7. Startups & Venture Capital
  {
    id: 'yourstory_feed',
    name: 'YourStory Startups',
    url: 'https://yourstory.com/feed',
    category: 'startups',
    type: 'news'
  },
  // 8. Science & Environment
  {
    id: 'google_news_science',
    name: 'Google Science News',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
    category: 'science',
    type: 'news'
  },
  {
    id: 'bbc_science_env',
    name: 'BBC Science & Climate',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'science',
    type: 'news'
  },
  // 9. Health & Medicine
  {
    id: 'bbc_health',
    name: 'BBC Health',
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    category: 'health',
    type: 'news'
  },
  // 10. Education
  {
    id: 'the_hindu_education',
    name: 'The Hindu Education',
    url: 'https://www.thehindu.com/education/feeder/default.rss',
    category: 'education',
    type: 'news'
  },
  // 11. Sports
  {
    id: 'bbc_sport',
    name: 'BBC Sport',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    category: 'sports',
    type: 'news'
  },
  {
    id: 'espn_news',
    name: 'ESPN Sports',
    url: 'https://www.espn.com/espn/rss/news',
    category: 'sports',
    type: 'news'
  },
  {
    id: 'the_hindu_sport',
    name: 'The Hindu Sport',
    url: 'https://www.thehindu.com/sport/feeder/default.rss',
    category: 'sports',
    type: 'news'
  },
  {
    id: 'google_news_sports',
    name: 'Google News Sports',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
    category: 'sports',
    type: 'news'
  },
  // 12. Entertainment
  {
    id: 'bbc_entertainment',
    name: 'BBC Entertainment & Arts',
    url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    category: 'entertainment',
    type: 'news'
  },
  // 13. Lifestyle & Culture
  {
    id: 'ndtv_lifestyle',
    name: 'NDTV Lifestyle',
    url: 'https://feeds.feedburner.com/ndtvcooks-lifestyle',
    category: 'lifestyle',
    type: 'news'
  },
  // 14. Automobile & Mobility
  {
    id: 'autocar_india',
    name: 'Autocar Automotive',
    url: 'https://www.autocarindia.com/rss/news',
    category: 'automobile',
    type: 'news'
  },
  // 15. Agriculture & Agritech
  {
    id: 'the_hindu_agri',
    name: 'The Hindu Agriculture',
    url: 'https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss',
    category: 'agriculture',
    type: 'news'
  },
  // 16. Opinion & Thought Leadership
  {
    id: 'the_hindu_opinion',
    name: 'The Hindu Opinion',
    url: 'https://www.thehindu.com/opinion/feeder/default.rss',
    category: 'opinion',
    type: 'news'
  },
  // 17. Developer Blogs (Medium Programming & Technology)
  {
    id: 'medium_programming',
    name: 'Medium Engineering',
    url: 'https://medium.com/feed/tag/programming',
    category: 'programming',
    type: 'blog'
  },
  {
    id: 'medium_technology',
    name: 'Medium Tech & AI',
    url: 'https://medium.com/feed/tag/technology',
    category: 'technology',
    type: 'blog'
  }
];

// Helper to strip HTML tags and decode basic XML entities
function cleanText(text = '') {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format IST timestamp
 */
export function formatIST(date = new Date()) {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d) + ' IST';
  } catch {
    return '';
  }
}

// Generate URL slug from title
export function generateSlug(title = '', id = '') {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const hash = Math.abs(crc32(id || title || String(Date.now()))).toString(36).slice(0, 6);
  return `${base || 'article'}-${hash}`;
}

function crc32(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ ((crc ^ str.charCodeAt(i)) & 0xFF);
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Intelligent Keyword-Based Category Resolver
 * Maps incoming news stories and blogs strictly to their required beats
 */
export function inferCategory(title = '', description = '', defaultCat = 'world') {
  if (defaultCat && defaultCat !== 'world' && defaultCat !== 'general' && defaultCat !== 'news') {
    return defaultCat;
  }
  const text = `${title} ${description}`.toLowerCase();
  
  // Sports indicators
  if (/\b(cricket|football|soccer|tennis|fifa|ipl|bcci|icc|test match|odi|t20|wimbledon|olympics|nba|nfl|premier league|champions league|formula 1|f1|racing|messi|ronaldo|kohli|rohit sharma|wicket|goal|grand slam|athletics|badminton|kabaddi|chelsea|arsenal|liverpool|real madrid|barcelona|manchester united|manchester city)\b/i.test(text)) {
    return 'sports';
  }
  // Markets & Stock Market
  if (/\b(stock market|stocks|sensex|nifty|wall street|nasdaq|dow jones|s&p 500|shares|equities|bull market|bear market|ipo|bse|nse|nyse|bond yields|forex)\b/i.test(text)) {
    return 'markets';
  }
  // Trade & Global Commerce
  if (/\b(exports|imports|tariff|tariffs|free trade|customs duty|wto|trade deficit|trade agreement|supply chain|bilateral trade)\b/i.test(text)) {
    return 'trade';
  }
  // Economy & Fiscal
  if (/\b(gdp|inflation|fiscal|monetary policy|recession|deficit|central bank|federal reserve|rbi|treasury|interest rate)\b/i.test(text)) {
    return 'economy';
  }
  // Business & Enterprise
  if (/\b(business|corporate|revenue|quarterly profit|merger|acquisition|ceo|earnings|conglomerate|valuation)\b/i.test(text)) {
    return 'business';
  }
  // Finance & Banking
  if (/\b(banking|bank|fintech|personal finance|cryptocurrency|bitcoin|ethereum|mutual fund|insurance|taxation|income tax|loan|credit card)\b/i.test(text)) {
    return 'finance';
  }
  // Politics & Governance
  if (/\b(parliament|election|elections|bjp|congress|lok sabha|rajya sabha|prime minister|president|modi|rahul gandhi|democrat|republican|senate|congressional|cabinet|legislation|minister|diplomacy|summit)\b/i.test(text)) {
    return 'politics';
  }
  // Crime, Courts & Judiciary
  if (/\b(supreme court|high court|judiciary|verdict|bail|fir|police|arrest|arrested|cbi|ed|probe|murder|robbery|scam|fraud|investigation|prison|jail|accused|convicted|trial)\b/i.test(text)) {
    return 'crime';
  }
  // Startups & Venture Capital
  if (/\b(startup|startups|venture capital|vc|seed funding|series a|series b|angel investor|unicorn|founder|founding|pitch deck|y combinator|accelerator)\b/i.test(text)) {
    return 'startups';
  }
  // Automobile
  if (/\b(automobile|automotive|electric vehicle|ev|car|cars|suv|sedan|motorcycle|bike|tesla|tata motors|maruti|hyundai|toyota|mahindra|bmw|mercedes|engine|mileage|gearbox)\b/i.test(text)) {
    return 'automobile';
  }
  // Agriculture & Farming
  if (/\b(agriculture|farming|farmer|farmers|crop|crops|monsoon|kharif|rabi|msp|harvest|fertilizer|agritech|paddy|wheat|irrigation|soil)\b/i.test(text)) {
    return 'agriculture';
  }
  // Health & Medicine
  if (/\b(health|hospital|doctor|vaccine|virus|disease|cancer|mental health|cardiology|surgery|wellness|pharma|pharmaceutical|epidemic|pandemic|nutrition|clinical trial|who|fda)\b/i.test(text)) {
    return 'health';
  }
  // Education & Academia
  if (/\b(education|university|college|school|student|students|exam|cbse|icse|ugc|neet|jee|syllabus|admissions|curriculum|degree|campus|faculty)\b/i.test(text)) {
    return 'education';
  }
  // Environment & Weather
  if (/\b(climate change|global warming|carbon emissions|renewable energy|cyclone|rainfall|monsoon weather|heatwave|flood|drought|weather forecast|wildfire|ecology|pollution|air quality|aqi)\b/i.test(text)) {
    return text.includes('weather') || text.includes('temperature') || text.includes('forecast') ? 'weather' : 'environment';
  }
  // Travel & Lifestyle
  if (/\b(travel|tourism|tourist|hotel|flight|airline|destination|vacation|itinerary|resort|lifestyle|fashion|culture|cuisine|recipes)\b/i.test(text)) {
    return text.includes('hotel') || text.includes('flight') || text.includes('travel') || text.includes('tourism') ? 'travel' : 'lifestyle';
  }
  // Technology & AI
  if (/\b(ai|artificial intelligence|machine learning|openai|chatgpt|deep learning|llm|nvidia|semiconductor|microchip|robotics|cybersecurity|android|ios|iphone|smartphone|software engineer|github|cloud computing|tech|gadgets)\b/i.test(text)) {
    return 'technology';
  }
  // Programming & Dev Blogs
  if (/\b(javascript|typescript|python|rust|golang|react|vue|angular|docker|kubernetes|web development|frontend|backend|api|database|sql|devops|css|html|compiler|git)\b/i.test(text)) {
    return 'programming';
  }
  // Science & Space
  if (/\b(nasa|isro|space|galaxy|black hole|astronomy|planet|telescope|james webb|mars|moon mission|quantum|physics|fossil|species|dna|genetics|biotechnology|solar system)\b/i.test(text)) {
    return 'science';
  }
  // Entertainment & Cinema
  if (/\b(movie|film|cinema|box office|actor|actress|hollywood|bollywood|trailer|soundtrack|grammy|oscar|emmy|netflix|streaming series|celebrity)\b/i.test(text)) {
    return 'entertainment';
  }
  // Opinion & Editorial
  if (/\b(opinion|editorial|column|commentary|analysis|perspective|viewpoint|op-ed)\b/i.test(text)) {
    return 'opinion';
  }
  // India specific
  if (/\b(india|indian|new delhi|mumbai|chennai|bengaluru|kolkata|hyderabad|tamil nadu|kerala|karnataka)\b/i.test(text)) {
    if (defaultCat === 'world' || defaultCat === 'general') return 'india';
  }

  return defaultCat || 'world';
}

// Simple XML parser extracting <item> tags
function parseRssXml(xml, feedConfig) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const getTag = (tag) => {
      const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = regex.exec(itemXml);
      return m ? cleanText(m[1]) : '';
    };

    const getAttr = (tag, attr) => {
      const regex = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']*)["']`, 'i');
      const m = regex.exec(itemXml);
      return m ? m[1] : '';
    };

    const title = getTag('title');
    const link = getTag('link') || getAttr('link', 'href');
    const description = getTag('description') || getTag('summary');
    const content = getTag('content:encoded') || description;
    const pubDateStr = getTag('pubDate') || getTag('dc:date') || new Date().toISOString();
    const author = getTag('dc:creator') || getTag('author') || feedConfig.name;

    // Dynamic Image extraction
    let imageUrl = extractImageFromXml(itemXml);
    if (!imageUrl) {
      imageUrl = getDynamicArticleImage(title, feedConfig.category, link || title);
    }

    if (title && (link || description)) {
      items.push({
        title,
        link,
        description: description.slice(0, 350),
        content: content.slice(0, 3000),
        pubDate: new Date(pubDateStr).toISOString(),
        author,
        imageUrl,
        category: feedConfig.category,
        feedId: feedConfig.id,
        feedName: feedConfig.name,
        type: feedConfig.type
      });
    }
  }

  return items;
}

// Fetch single RSS feed with timeout & User-Agent
async function fetchRssFeed(feedConfig) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(feedConfig.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssXml(xml, feedConfig);
  } catch (err) {
    return [];
  }
}

// Fetch DEV.to Articles API (Real developer posts)
async function fetchDevToBlogs() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://dev.to/api/articles?per_page=30&top=7', {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'NewsAxis-Aggregator/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`DEV.to HTTP ${res.status}`);
    const articles = await res.json();

    return articles.map(a => ({
      title: a.title,
      link: a.url,
      description: a.description || a.title,
      content: a.readable_publish_date ? `${a.description}\n\nTags: ${a.tag_list?.join(', ')}` : a.description,
      pubDate: a.published_at || new Date().toISOString(),
      author: a.user?.name || 'DEV Contributor',
      imageUrl: a.cover_image || a.social_image || getDynamicArticleImage(a.title, 'programming', a.url || String(a.id)),
      category: 'programming',
      feedId: 'dev_to',
      feedName: 'DEV Community',
      type: 'blog',
      readingTime: a.reading_time_minutes || 4,
      reactions: a.positive_reactions_count || 15
    }));
  } catch (err) {
    console.warn(`[Aggregator] DEV.to fetch note: ${err.message}`);
    return [];
  }
}

// Fetch HackerNews Top Tech Stories
async function fetchHackerNews() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=15&orderBy="$key"', {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HackerNews HTTP ${res.status}`);
    const ids = await res.json();
    if (!Array.isArray(ids)) return [];

    const storyPromises = ids.slice(0, 10).map(async id => {
      try {
        const sRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return sRes.ok ? await sRes.json() : null;
      } catch {
        return null;
      }
    });

    const stories = (await Promise.all(storyPromises)).filter(s => s && s.title && s.url);

    return stories.map(s => ({
      title: s.title,
      link: s.url,
      description: `Hacker News discussion with ${s.score || 0} points and ${s.descendants || 0} comments.`,
      content: `Hacker News discussion: ${s.title}. Read the full article at the source URL.`,
      pubDate: new Date((s.time || Date.now() / 1000) * 1000).toISOString(),
      author: s.by || 'HackerNews',
      imageUrl: getDynamicArticleImage(s.title, 'technology', s.url || String(s.id)),
      category: 'technology',
      feedId: 'hacker_news',
      feedName: 'Hacker News',
      type: 'news',
      readingTime: 3,
      reactions: s.score || 25
    }));
  } catch (err) {
    console.warn(`[Aggregator] HackerNews fetch note: ${err.message}`);
    return [];
  }
}

// Fetch from GNews API (if API Key is configured)
async function fetchGNews() {
  const apiKey = process.env.GNEWS_API_KEY || process.env.VITE_GNEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=10&apikey=${apiKey}`, {
      headers: { 'User-Agent': 'NewsAxis-Server/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map(a => ({
      title: a.title,
      link: a.url,
      description: a.description || '',
      content: a.content || a.description || '',
      pubDate: a.publishedAt || new Date().toISOString(),
      author: a.source?.name || 'GNews',
      imageUrl: a.image || getDynamicArticleImage(a.title, 'world', a.url),
      category: 'world',
      feedId: 'gnews',
      feedName: a.source?.name || 'GNews Verified',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] GNews note: ${err.message}`);
    return [];
  }
}

// Fetch from NewsData.io API (if API Key is configured)
async function fetchNewsData() {
  const apiKey = process.env.NEWSDATA_API_KEY || process.env.VITE_NEWSDATA_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://newsdata.io/api/1/latest?language=en&apikey=${apiKey}`, {
      headers: { 'User-Agent': 'NewsAxis-Server/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(a => ({
      title: a.title,
      link: a.link,
      description: a.description || '',
      content: a.content || a.description || '',
      pubDate: a.pubDate || new Date().toISOString(),
      author: (a.creator && a.creator[0]) || a.source_id || 'NewsData.io',
      imageUrl: a.image_url || getDynamicArticleImage(a.title, (a.category && a.category[0]) || 'world', a.link),
      category: (a.category && a.category[0]) || 'world',
      feedId: 'newsdata',
      feedName: a.source_id ? `${a.source_id.toUpperCase()} (NewsData)` : 'NewsData Live',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] NewsData note: ${err.message}`);
    return [];
  }
}

// Fetch from NewsAPI.org (if API Key is configured)
async function fetchNewsApiOrg() {
  const apiKey = process.env.NEWSAPI_KEY || process.env.VITE_NEWSAPI_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?language=en&pageSize=15&apiKey=${apiKey}`, {
      headers: { 'User-Agent': 'NewsAxis-Server/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).filter(a => a.title && !a.title.includes('[Removed]')).map(a => ({
      title: a.title,
      link: a.url,
      description: a.description || '',
      content: a.content || a.description || '',
      pubDate: a.publishedAt || new Date().toISOString(),
      author: a.author || a.source?.name || 'NewsAPI',
      imageUrl: a.urlToImage || getDynamicArticleImage(a.title, 'world', a.url),
      category: 'world',
      feedId: 'newsapi_org',
      feedName: a.source?.name || 'NewsAPI Global',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] NewsAPI.org note: ${err.message}`);
    return [];
  }
}

// Fetch from TheNewsAPI (if API Key is configured)
async function fetchTheNewsApi() {
  const apiKey = process.env.THENEWSAPI_KEY || process.env.VITE_THENEWSAPI_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://api.thenewsapi.com/v1/news/top?api_token=${apiKey}&language=en&limit=10`, {
      headers: { 'User-Agent': 'NewsAxis-Server/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map(a => ({
      title: a.title,
      link: a.url,
      description: a.description || a.snippet || '',
      content: a.description || a.snippet || '',
      pubDate: a.published_at || new Date().toISOString(),
      author: a.source || 'TheNewsAPI',
      imageUrl: a.image_url || getDynamicArticleImage(a.title, (a.categories && a.categories[0]) || 'world', a.url),
      category: (a.categories && a.categories[0]) || 'world',
      feedId: 'thenewsapi',
      feedName: a.source || 'TheNewsAPI',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] TheNewsAPI note: ${err.message}`);
    return [];
  }
}

// Fetch from Mediastack API (if API Key is configured)
async function fetchMediaStack() {
  const apiKey = process.env.MEDIASTACK_API_KEY || process.env.VITE_MEDIASTACK_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`http://api.mediastack.com/v1/news?access_key=${apiKey}&languages=en&limit=15`, {
      headers: { 'User-Agent': 'NewsAxis-Server/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter(a => a.title).map(a => ({
      title: a.title,
      link: a.url,
      description: a.description || '',
      content: a.description || '',
      pubDate: a.published_at || new Date().toISOString(),
      author: a.author || a.source || 'Mediastack Live',
      imageUrl: a.image || getDynamicArticleImage(a.title, a.category || 'world', a.url),
      category: a.category || 'world',
      feedId: 'mediastack',
      feedName: a.source || 'Mediastack Verified',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] Mediastack note: ${err.message}`);
    return [];
  }
}

/**
 * Main Aggregator Function
 * Executes concurrent fetches, dedupes titles & URLs, normalizes articles,
 * and sets strict 30-minute expiration timestamps.
 */
export async function aggregateRealWorldContent(retentionMinutes = 30) {
  const startTime = Date.now();
  const expiresAt = new Date(Date.now() + (retentionMinutes * 60 * 1000)).toISOString();
  const batchId = `cycle_${Math.floor(Date.now() / (retentionMinutes * 60 * 1000))}`;

  console.log(`[Aggregator] Starting 30-minute fetch cycle [${batchId}]...`);

  // Run all feed & API fetches in parallel
  const fetchPromises = [
    ...FEEDS.map(f => fetchRssFeed(f)),
    fetchDevToBlogs(),
    fetchHackerNews(),
    fetchGNews(),
    fetchNewsData(),
    fetchNewsApiOrg(),
    fetchTheNewsApi(),
    fetchMediaStack()
  ];

  const results = await Promise.allSettled(fetchPromises);
  const rawList = [];

  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      rawList.push(...r.value);
    }
  }

  // Deduplicate by clean canonical URL and title similarity
  const seenUrls = new Set();
  const seenTitles = new Set();
  const deduplicated = [];

  for (const item of rawList) {
    if (!item.title) continue;

    // Check URL deduplication
    if (item.link) {
      const cleanUrl = item.link.split('?')[0].toLowerCase();
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
    }

    // Check Title deduplication
    const cleanKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45);
    if (!cleanKey || seenTitles.has(cleanKey)) continue;
    seenTitles.add(cleanKey);

    // Generate safe deterministic hash ID: "art_" + md5(url || title) (36 chars total)
    const urlHash = crypto.createHash('md5').update(item.link || item.title).digest('hex');
    const articleId = `art_${urlHash}`;
    const slug = generateSlug(item.title, articleId);

    // Calculate reading time
    const words = `${item.title} ${item.description}`.split(/\s+/).length;
    const readingTime = item.readingTime || Math.max(2, Math.ceil(words / 60));

    const inferredCat = inferCategory(item.title, item.description, item.category);
    const pubDate = item.pubDate || new Date().toISOString();

    deduplicated.push({
      id: articleId,
      externalId: item.link || articleId,
      external_id: item.link || articleId,
      providerId: item.feedId,
      provider: item.feedId,
      sourceType: item.type === 'blog' ? 'external_blog' : 'external_news',
      contentType: item.type || 'news',
      title: item.title.slice(0, 500),
      slug: slug.slice(0, 255),
      summary: (item.description || '').slice(0, 2000),
      description: (item.description || '').slice(0, 2000),
      content: (item.content || item.description || '').slice(0, 10000),
      imageUrl: item.imageUrl || getDynamicArticleImage(item.title, inferredCat, articleId),
      image_url: item.imageUrl || getDynamicArticleImage(item.title, inferredCat, articleId),
      source: item.feedName || 'NewsAxis',
      sourceName: item.feedName || 'NewsAxis',
      source_name: item.feedName || 'NewsAxis',
      sourceUrl: item.link || '',
      source_url: item.link || '',
      url: item.link || '',
      author: item.author || 'NewsAxis Desk',
      authorName: item.author || 'NewsAxis Desk',
      author_name: item.author || 'NewsAxis Desk',
      categoryId: inferredCat,
      category: inferredCat,
      categorySlug: inferredCat,
      language: 'en',
      country: inferredCat === 'india' ? 'in' : 'global',
      tags: [inferredCat, item.type, item.feedName.toLowerCase()],
      publishedAt: pubDate,
      published_at: pubDate,
      publishedAtIST: formatIST(pubDate),
      createdAt: new Date().toISOString(),
      expiresAt, // Strictly 30 minutes from ingestion
      batchId,
      isBreaking: inferredCat === 'breaking' || inferredCat === 'world' || inferredCat === 'india' || item.title.toLowerCase().includes('breaking'),
      isFeatured: false,
      views: item.reactions || Math.floor(Math.random() * 50) + 10,
      readingTime
    });
  }

  // Mark top 2 as featured
  if (deduplicated.length > 0) deduplicated[0].isFeatured = true;
  if (deduplicated.length > 1) deduplicated[1].isFeatured = true;

  console.log(`[Aggregator] Fetched ${rawList.length} items, normalized to ${deduplicated.length} fresh articles in ${Date.now() - startTime}ms.`);

  return {
    batchId,
    expiresAt,
    articles: deduplicated
  };
}
