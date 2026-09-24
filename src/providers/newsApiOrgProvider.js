import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * NewsAPI.org Provider Adapter (https://newsapi.org/)
 * Top breaking headlines from 80,000+ worldwide sources and blogs
 */
export class NewsApiOrgProvider extends BaseProvider {
  constructor() {
    const key = import.meta.env.VITE_NEWSAPI_KEY || import.meta.env.VITE_NEWS_API_ORG_KEY || '';
    super({
      id: 'newsapi_org',
      name: 'NewsAPI.org',
      type: 'news',
      enabled: Boolean(key),
      priority: 1,
      requestsPerMinute: 20,
      cacheMinutes: 45
    });
    this.apiKey = key;
    this.endpoint = 'https://newsapi.org/v2/top-headlines';
  }

  async fetchLatest({ country = 'in', category = 'general', pageSize = 12 } = {}) {
    if (!this.apiKey) {
      return { 
        success: false, 
        provider: this.id, 
        items: [], 
        error: { code: 'NO_API_KEY', message: 'NewsAPI.org API key not configured' } 
      };
    }

    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('apiKey', this.apiKey);
      url.searchParams.set('pageSize', pageSize);
      if (country) url.searchParams.set('country', country);
      if (category && category !== 'general') url.searchParams.set('category', category);

      const res = await fetch(url.toString());
      if (res.status === 429) {
        this.status = 'rate_limited';
        throw new Error('NewsAPI.org rate limit reached');
      }
      if (!res.ok) throw new Error(`NewsAPI.org HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== 'ok') {
        throw new Error(data.message || 'NewsAPI.org error response');
      }

      this.status = 'healthy';
      const items = (data.articles || [])
        .filter(a => a.title && a.title !== '[Removed]')
        .map(a => this.normalize(a));

      return {
        success: true,
        provider: this.id,
        fetchedAt: new Date().toISOString(),
        items
      };
    } catch (err) {
      this.status = this.status === 'rate_limited' ? 'rate_limited' : 'failed';
      return { 
        success: false, 
        provider: this.id, 
        items: [], 
        error: { code: 'PROVIDER_ERROR', message: err.message } 
      };
    }
  }

  normalize(raw) {
    return normalizeArticle({
      externalId: raw.url,
      providerId: this.id,
      sourceType: 'external_news',
      title: raw.title,
      summary: raw.description,
      content: raw.content || raw.description,
      imageUrl: raw.urlToImage,
      sourceName: raw.source?.name || 'NewsAPI.org',
      sourceUrl: raw.url,
      authorName: raw.author || raw.source?.name,
      categorySlug: 'india',
      publishedAt: raw.publishedAt,
      createdAt: raw.publishedAt,
      isExternal: true
    });
  }
}
