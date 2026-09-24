import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * TheNewsAPI Adapter (https://www.thenewsapi.com/)
 * Delivers top global headlines and categorised news dispatches
 */
export class TheNewsApiProvider extends BaseProvider {
  constructor() {
    const key = import.meta.env.VITE_THENEWSAPI_KEY || import.meta.env.VITE_THE_NEWS_API_KEY || '';
    super({
      id: 'thenewsapi',
      name: 'TheNewsAPI',
      type: 'news',
      enabled: Boolean(key),
      priority: 1,
      requestsPerMinute: 20,
      cacheMinutes: 45
    });
    this.apiKey = key;
    this.endpoint = 'https://api.thenewsapi.com/v1/news/top';
  }

  async fetchLatest({ categories = 'general,tech,business,science', language = 'en', limit = 10 } = {}) {
    if (!this.apiKey) {
      return { 
        success: false, 
        provider: this.id, 
        items: [], 
        error: { code: 'NO_API_KEY', message: 'TheNewsAPI API key not configured' } 
      };
    }

    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('api_token', this.apiKey);
      url.searchParams.set('language', language);
      url.searchParams.set('limit', limit);
      if (categories) {
        url.searchParams.set('categories', categories);
      }

      const res = await fetch(url.toString());
      if (res.status === 429) {
        this.status = 'rate_limited';
        throw new Error('TheNewsAPI rate limit exceeded');
      }
      if (!res.ok) throw new Error(`TheNewsAPI HTTP ${res.status}`);

      const data = await res.json();
      this.status = 'healthy';

      const items = (data.data || []).map(item => this.normalize(item));
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
    const categorySlug = Array.isArray(raw.categories) && raw.categories.length > 0 
      ? raw.categories[0].toLowerCase() 
      : 'world';

    return normalizeArticle({
      externalId: raw.uuid || raw.url,
      providerId: this.id,
      sourceType: 'external_news',
      title: raw.title,
      summary: raw.description || raw.snippet,
      content: raw.snippet || raw.description,
      imageUrl: raw.image_url,
      sourceName: raw.source || 'TheNewsAPI',
      sourceUrl: raw.url,
      categorySlug,
      publishedAt: raw.published_at,
      createdAt: raw.published_at,
      isExternal: true
    });
  }
}
