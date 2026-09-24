import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * Mediastack Provider Adapter (https://mediastack.com/)
 * Real-time global live news data REST API
 */
export class MediaStackProvider extends BaseProvider {
  constructor() {
    const key = import.meta.env.VITE_MEDIASTACK_API_KEY || import.meta.env.VITE_MEDIASTACK_KEY || '';
    super({
      id: 'mediastack',
      name: 'Mediastack',
      type: 'news',
      enabled: Boolean(key),
      priority: 2,
      requestsPerMinute: 20,
      cacheMinutes: 60
    });
    this.apiKey = key;
    this.endpoint = 'https://api.mediastack.com/v1/news';
  }

  async fetchLatest({ categories = 'general,technology,business,sports', languages = 'en', limit = 10 } = {}) {
    if (!this.apiKey) {
      return { 
        success: false, 
        provider: this.id, 
        items: [], 
        error: { code: 'NO_API_KEY', message: 'Mediastack API key not configured' } 
      };
    }

    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('access_key', this.apiKey);
      url.searchParams.set('languages', languages);
      url.searchParams.set('limit', limit);
      if (categories) url.searchParams.set('categories', categories);

      const res = await fetch(url.toString());
      if (res.status === 429) {
        this.status = 'rate_limited';
        throw new Error('Mediastack rate limit exceeded');
      }
      if (!res.ok) throw new Error(`Mediastack HTTP ${res.status}`);

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || 'Mediastack error');
      }

      this.status = 'healthy';
      const items = (data.data || []).map(r => this.normalize(r));

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
      content: raw.description,
      imageUrl: raw.image,
      sourceName: raw.source || 'Mediastack',
      sourceUrl: raw.url,
      authorName: raw.author || raw.source,
      categorySlug: raw.category || 'world',
      publishedAt: raw.published_at,
      createdAt: raw.published_at,
      isExternal: true
    });
  }
}
