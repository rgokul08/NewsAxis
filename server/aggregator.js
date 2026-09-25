/**
 * Real-World News & Blog Multi-Source Aggregator
 * Pulls live data from actual RSS feeds and public APIs with zero authentication needed.
 */

// Category default fallback images
const CATEGORY_IMAGES = {
  world: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&auto=format&fit=crop&q=80',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  programming: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
  business: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
  economy: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
  markets: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80',
  trade: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
  politics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
  startups: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
  science: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
  health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80',
  education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
  india: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
  lifestyle: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=1200&auto=format&fit=crop&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80',
  environment: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
  weather: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&auto=format&fit=crop&q=80',
  finance: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
  automobile: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
  agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
  crime: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
  opinion: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80'
};

const FEEDS = [
  // Global & World News
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
  // India & National
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
  // Politics
  {
    id: 'bbc_politics',
    name: 'BBC Politics',
    url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
    category: 'politics',
    type: 'news'
  },
  // Business, Economy & Markets
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
  // Technology
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
  // Startups & Venture Capital
  {
    id: 'yourstory_feed',
    name: 'YourStory Startups',
    url: 'https://yourstory.com/feed',
    category: 'startups',
    type: 'news'
  },
  // Science & Environment
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
    category: 'environment',
    type: 'news'
  },
  // Health
  {
    id: 'bbc_health',
    name: 'BBC Health',
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    category: 'health',
    type: 'news'
  },
  // Education
  {
    id: 'the_hindu_education',
    name: 'The Hindu Education',
    url: 'https://www.thehindu.com/education/feeder/default.rss',
    category: 'education',
    type: 'news'
  },
  // Sports
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
  // Entertainment & Arts
  {
    id: 'bbc_entertainment',
    name: 'BBC Entertainment & Arts',
    url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    category: 'entertainment',
    type: 'news'
  },
  // Automobile
  {
    id: 'autocar_india',
    name: 'Autocar Automotive',
    url: 'https://www.autocarindia.com/rss/news',
    category: 'automobile',
    type: 'news'
  },
  // Agriculture
  {
    id: 'the_hindu_agri',
    name: 'The Hindu Agriculture',
    url: 'https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss',
    category: 'agriculture',
    type: 'news'
  },
  // Opinion & Editorial
  {
    id: 'the_hindu_opinion',
    name: 'The Hindu Opinion',
    url: 'https://www.thehindu.com/opinion/feeder/default.rss',
    category: 'opinion',
    type: 'news'
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
  const text = `${title} ${description}`.toLowerCase();
  
  // Sports indicators
  if (/\b(cricket|football|soccer|tennis|fifa|ipl|bcci|icc|test match|odi|t20|wimbledon|olympics|nba|nfl|premier league|champions league|formula 1|f1|racing|messi|ronaldo|kohli|rohit sharma|wicket|goal|grand slam|athletics|badminton|kabaddi|chelsea|arsenal|liverpool|real madrid|barcelona|manchester united|manchester city|bundesliga|serie a|la liga)\b/i.test(text)) {
    return 'sports';
  }
  // Markets & Stock Market
  if (/\b(stock market|stocks|sensex|nifty|wall street|nasdaq|dow jones|s&p 500|shares|equities|bull market|bear market|ipo|bse|nse|nyse|bond yields|forex)\b/i.test(text)) {
    return 'markets';
  }
  // Economy & Trade
  if (/\b(gdp|inflation|fiscal|monetary policy|recession|deficit|central bank|federal reserve|rbi|trade deficit|exports|imports|tariff|free trade|customs duty|wto)\b/i.test(text)) {
    return text.includes('export') || text.includes('import') || text.includes('trade') ? 'trade' : 'economy';
  }
  // Finance & Banking
  if (/\b(banking|bank|fintech|personal finance|cryptocurrency|bitcoin|ethereum|mutual fund|insurance|taxation|income tax|loan|credit card|interest rate)\b/i.test(text)) {
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

    // Image extraction
    let imageUrl = getAttr('media:content', 'url') || 
                   getAttr('media:thumbnail', 'url') || 
                   getAttr('enclosure', 'url');

    if (!imageUrl) {
      const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    if (!imageUrl || imageUrl.includes('feedburner') || imageUrl.includes('1x1')) {
      imageUrl = CATEGORY_IMAGES[feedConfig.category] || CATEGORY_IMAGES.default;
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

// Fetch single RSS feed with timeout
async function fetchRssFeed(feed) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NewsAxis-Aggregator/2.0 (+https://newsaxis.local)'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssXml(xml, feed);
  } catch (err) {
    console.warn(`[Aggregator] RSS Feed failed (${feed.name}): ${err.message}`);
    return [];
  }
}

// Fetch Developer & Tech Blogs from DEV.to API
async function fetchDevToBlogs() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://dev.to/api/articles?per_page=20&top=7', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NewsAxis-Aggregator/2.0'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`DEV.to HTTP ${res.status}`);
    const articles = await res.json();

    return articles.map(art => ({
      title: art.title,
      link: art.url,
      description: art.description || '',
      content: art.body_markdown || art.description || '',
      pubDate: art.published_at || art.created_at || new Date().toISOString(),
      author: art.user?.name || 'DEV Contributor',
      imageUrl: art.cover_image || art.social_image || CATEGORY_IMAGES.programming,
      category: 'programming',
      feedId: 'dev_to',
      feedName: 'DEV Community',
      type: 'blog',
      readingTime: art.reading_time_minutes || 4,
      reactions: art.positive_reactions_count || 15
    }));
  } catch (err) {
    console.warn(`[Aggregator] DEV.to fetch failed: ${err.message}`);
    return [];
  }
}

// Fetch Tech Blogs from Hashnode API
async function fetchHashnodeBlogs() {
  const query = `
    query GetTopPosts {
      feed(first: 12, filter: { type: FEATURED }) {
        edges {
          node {
            id
            title
            brief
            url
            coverImage { url }
            author { name username }
            publishedAt
            readTimeInMinutes
            reactionCount
          }
        }
      }
    }
  `;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://gql.hashnode.com', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({ query }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Hashnode HTTP ${res.status}`);
    const json = await res.json();
    const edges = json.data?.feed?.edges || [];

    return edges.map(({ node }) => ({
      title: node.title,
      link: node.url,
      description: node.brief || '',
      content: node.brief || '',
      pubDate: node.publishedAt || new Date().toISOString(),
      author: node.author?.name || 'Hashnode Author',
      imageUrl: node.coverImage?.url || CATEGORY_IMAGES.technology,
      category: 'technology',
      feedId: 'hashnode',
      feedName: 'Hashnode Engineering',
      type: 'blog',
      readingTime: node.readTimeInMinutes || 5,
      reactions: node.reactionCount || 10
    }));
  } catch (err) {
    console.warn(`[Aggregator] Hashnode fetch failed: ${err.message}`);
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
      imageUrl: CATEGORY_IMAGES.technology,
      category: 'technology',
      feedId: 'hacker_news',
      feedName: 'Hacker News',
      type: 'news',
      readingTime: 3,
      reactions: s.score || 25
    }));
  } catch (err) {
    console.warn(`[Aggregator] HackerNews fetch failed: ${err.message}`);
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
      imageUrl: a.image || CATEGORY_IMAGES.world,
      category: 'world',
      feedId: 'gnews',
      feedName: a.source?.name || 'GNews Verified',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] GNews error: ${err.message}`);
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
      imageUrl: a.image_url || CATEGORY_IMAGES.world,
      category: (a.category && a.category[0]) || 'world',
      feedId: 'newsdata',
      feedName: a.source_id ? `${a.source_id.toUpperCase()} (NewsData)` : 'NewsData Live',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] NewsData error: ${err.message}`);
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
      imageUrl: a.urlToImage || CATEGORY_IMAGES.world,
      category: 'world',
      feedId: 'newsapi_org',
      feedName: a.source?.name || 'NewsAPI Global',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] NewsAPI.org error: ${err.message}`);
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
      imageUrl: a.image_url || CATEGORY_IMAGES.world,
      category: (a.categories && a.categories[0]) || 'world',
      feedId: 'thenewsapi',
      feedName: a.source || 'TheNewsAPI',
      type: 'news'
    }));
  } catch (err) {
    console.warn(`[Aggregator] TheNewsAPI error: ${err.message}`);
    return [];
  }
}

/**
 * Main Aggregator Function
 * Executes concurrent fetches, dedupes titles, normalizes articles,
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
    fetchHashnodeBlogs(),
    fetchHackerNews(),
    fetchGNews(),
    fetchNewsData(),
    fetchNewsApiOrg(),
    fetchTheNewsApi()
  ];

  const results = await Promise.allSettled(fetchPromises);
  const rawList = [];

  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      rawList.push(...r.value);
    }
  }

  // Deduplicate by title similarity
  const seenTitles = new Set();
  const deduplicated = [];

  for (const item of rawList) {
    const cleanKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (!cleanKey || seenTitles.has(cleanKey)) continue;
    seenTitles.add(cleanKey);

    const articleId = `${item.feedId}_${Math.abs(crc32(item.link || item.title))}`;
    const slug = generateSlug(item.title, articleId);

    // Calculate reading time
    const words = `${item.title} ${item.description}`.split(/\s+/).length;
    const readingTime = item.readingTime || Math.max(2, Math.ceil(words / 60));

    const inferredCat = inferCategory(item.title, item.description, item.category);

    deduplicated.push({
      id: articleId,
      externalId: item.link || articleId,
      external_id: item.link || articleId,
      providerId: item.feedId,
      sourceType: item.type === 'blog' ? 'external_blog' : 'external_news',
      contentType: item.type || 'news',
      title: item.title,
      slug,
      summary: item.description,
      description: item.description,
      content: item.content || item.description,
      imageUrl: item.imageUrl,
      image_url: item.imageUrl,
      thumbnail_url: item.imageUrl,
      sourceName: item.feedName,
      source_name: item.feedName,
      sourceUrl: item.link,
      source_url: item.link,
      authorName: item.author,
      author: item.author,
      categoryId: inferredCat,
      categorySlug: inferredCat,
      category: inferredCat,
      sub_category: item.feedName,
      language: 'en',
      country: item.category === 'india' ? 'in' : 'global',
      tags: [inferredCat, item.type, item.feedName.toLowerCase()],
      publishedAt: item.pubDate,
      published_at: item.pubDate,
      createdAt: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      expiresAt, // Strictly 30 minutes from ingestion
      batchId,
      isBreaking: item.category === 'world' || item.category === 'india' || item.title.toLowerCase().includes('breaking'),
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
