import { DevToProvider } from './devProvider';
import { HashnodeProvider } from './hashnodeProvider';
import { PublicFeedProvider } from './publicFeedProvider';
import { GNewsProvider } from './gNewsProvider';
import { deduplicateArticles } from '../utils/normalizeArticle';

/**
 * Registry of 8+ real-world verified external feeds and API providers
 */
class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.cache = new Map(); // In-memory runtime TTL cache
    this.initProviders();
  }

  initProviders() {
    // 1. DEV.to API (Developer, Coding, Career)
    this.register(new DevToProvider());

    // 2. Hashnode GraphQL API (Tech, AI, Software Engineering)
    this.register(new HashnodeProvider());

    // 3. Google News RSS - World
    this.register(new PublicFeedProvider({
      id: 'google_news_world',
      name: 'Google News World',
      feedUrl: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
      defaultCategory: 'world',
      priority: 1
    }));

    // 4. Google News RSS - Technology & AI
    this.register(new PublicFeedProvider({
      id: 'google_news_tech',
      name: 'Google News Tech',
      feedUrl: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
      defaultCategory: 'technology',
      priority: 2
    }));

    // 5. The Hindu / India National News Feed
    this.register(new PublicFeedProvider({
      id: 'the_hindu_india',
      name: 'The Hindu',
      feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
      defaultCategory: 'india',
      priority: 2
    }));

    // 6. BBC World News
    this.register(new PublicFeedProvider({
      id: 'bbc_world',
      name: 'BBC World News',
      feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      defaultCategory: 'world',
      priority: 2
    }));

    // 7. TechCrunch (Startups, Funding, AI)
    this.register(new PublicFeedProvider({
      id: 'techcrunch',
      name: 'TechCrunch',
      feedUrl: 'https://techcrunch.com/feed/',
      defaultCategory: 'startups',
      priority: 3
    }));

    // 8. Wired Science & Technology
    this.register(new PublicFeedProvider({
      id: 'wired_science',
      name: 'Wired',
      feedUrl: 'https://www.wired.com/feed/category/science/latest/rss',
      defaultCategory: 'science',
      priority: 3
    }));

    // 9. Medium RSS - Technology Stories
    this.register(new PublicFeedProvider({
      id: 'medium_tech',
      name: 'Medium Tech',
      feedUrl: 'https://medium.com/feed/tag/technology',
      defaultCategory: 'technology',
      priority: 4
    }));

    // 10. GNews Adapter (Configured if API key provided)
    this.register(new GNewsProvider());
  }

  register(provider) {
    this.providers.set(provider.id, provider);
  }

  get(id) {
    return this.providers.get(id);
  }

  getAll() {
    return Array.from(this.providers.values());
  }

  getEnabled() {
    return this.getAll().filter(p => p.enabled);
  }

  /**
   * Fetches latest stories from all enabled providers with deduplication and caching
   */
  async aggregateAll({ limit = 30 } = {}) {
    const cacheKey = `aggregate_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 10) {
      return cached.data;
    }

    const enabled = this.getEnabled();
    const fetchPromises = enabled.map(async p => {
      try {
        const res = await p.fetchLatest();
        return res.success ? res.items : [];
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    let allArticles = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        allArticles.push(...r.value);
      }
    }

    // Sort by publication time
    allArticles.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

    // Deduplicate
    const cleanArticles = deduplicateArticles(allArticles).slice(0, limit);

    // Save to memory cache
    this.cache.set(cacheKey, { timestamp: Date.now(), data: cleanArticles });

    return cleanArticles;
  }

  /**
   * Health checks for all providers
   */
  async checkAllHealth() {
    const reports = [];
    for (const p of this.getAll()) {
      const res = await p.healthCheck();
      reports.push({
        id: p.id,
        name: p.name,
        type: p.type,
        enabled: p.enabled,
        status: p.status,
        latencyMs: p.latencyMs || 0,
        lastHealthCheck: p.lastHealthCheck
      });
    }
    return reports;
  }
}

export const providerRegistry = new ProviderRegistry();
export default providerRegistry;
