import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * NewsData.io Provider Adapter (https://newsdata.io/)
 * Fetches real-time multi-national breaking news & regional dispatches
 */
export class NewsDataProvider extends BaseProvider {
  constructor() {
    const key = import.meta.env.VITE_NEWSDATA_API_KEY || import.meta.env.VITE_NEWSDATA_KEY || '';
    super({
      id: 'newsdata',
      name: 'NewsData.io',
      type: 'news',
      enabled: Boolean(key),
      priority: 1,
      requestsPerMinute: 15,
      cacheMinutes: 45
    });
    this.apiKey = key;
    this.endpoint = 'https://newsdata.io/api/1/latest';
  }

  async fetchLatest({ country = 'in,us', language = 'en', category = 'top,technology,business' } = {}) {
    if (!this.apiKey) {
      return { 
        success: false, 
        provider: this.id, 
        items: [], 
        error: { code: 'NO_API_KEY', message: 'NewsData.io API key not configured' } 
      };
    }

    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('apikey', this.apiKey);
      url.searchParams.set('language', language);
      if (country) url.searchParams.set('country', country);
      if (category) url.searchParams.set('category', category);

      const res = await fetch(url.toString());
      if (res.status === 429) {
        this.status = 'rate_limited';
        throw new Error('NewsData.io rate limit reached');
      }
      if (!res.ok) throw new Error(`NewsData.io HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== 'success') {
        throw new Error(data.results?.message || 'NewsData.io returned error status');
      }

      this.status = 'healthy';
      const items = (data.results || []).map(r => this.normalize(r));

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
    const categorySlug = Array.isArray(raw.category) && raw.category.length > 0
      ? raw.category[0].toLowerCase()
      : 'india';

    const authorName = Array.isArray(raw.creator) && raw.creator.length > 0
      ? raw.creator.join(', ')
      : (raw.source_id || 'NewsData.io');

    return normalizeArticle({
      externalId: raw.article_id || raw.link,
      providerId: this.id,
      sourceType: 'external_news',
      title: raw.title,
      summary: raw.description,
      content: raw.content || raw.description,
      imageUrl: raw.image_url,
      sourceName: raw.source_id ? raw.source_id.toUpperCase() : 'NewsData.io',
      sourceUrl: raw.link,
      authorName,
      categorySlug,
      publishedAt: raw.pubDate,
      createdAt: raw.pubDate,
      isExternal: true
    });
  }
}
