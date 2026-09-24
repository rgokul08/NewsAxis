import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * GNews API Provider Adapter (Handles API key, rate limits, and fallback)
 */
export class GNewsProvider extends BaseProvider {
  constructor() {
    super({
      id: 'gnews',
      name: 'GNews',
      type: 'news',
      enabled: Boolean(import.meta.env.VITE_GNEWS_API_KEY),
      priority: 1,
      requestsPerMinute: 10,
      cacheMinutes: 60
    });
    this.apiKey = import.meta.env.VITE_GNEWS_API_KEY || '';
    this.endpoint = 'https://gnews.io/api/v4/top-headlines';
  }

  async fetchLatest({ category = 'general', lang = 'en', max = 10 } = {}) {
    if (!this.apiKey) {
      return { success: false, provider: this.id, items: [], error: { code: 'NO_API_KEY', message: 'GNews API key not configured' } };
    }

    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('category', category);
      url.searchParams.set('lang', lang);
      url.searchParams.set('max', max);
      url.searchParams.set('apikey', this.apiKey);

      const res = await fetch(url.toString());
      if (res.status === 429) {
        this.status = 'rate_limited';
        throw new Error('GNews Rate limit reached');
      }
      if (!res.ok) throw new Error(`GNews HTTP ${res.status}`);

      const data = await res.json();
      this.status = 'healthy';

      return {
        success: true,
        provider: this.id,
        fetchedAt: new Date().toISOString(),
        items: (data.articles || []).map(a => this.normalize(a))
      };
    } catch (err) {
      return { success: false, provider: this.id, items: [], error: { code: 'PROVIDER_ERROR', message: err.message } };
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
      imageUrl: raw.image,
      sourceName: raw.source?.name || 'GNews',
      sourceUrl: raw.url,
      authorName: raw.source?.name,
      publishedAt: raw.publishedAt,
      createdAt: raw.publishedAt,
      isExternal: true
    });
  }
}
