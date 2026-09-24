import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * DEV.to / Forem API Provider (Live public developer articles)
 */
export class DevToProvider extends BaseProvider {
  constructor() {
    super({
      id: 'dev_to',
      name: 'DEV Community',
      type: 'blog',
      enabled: true,
      priority: 1,
      requestsPerMinute: 60,
      cacheMinutes: 20
    });
    this.endpoint = 'https://dev.to/api/articles';
  }

  async fetchLatest({ tag = '', perPage = 15 } = {}) {
    const start = Date.now();
    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('per_page', perPage);
      if (tag) url.searchParams.set('tag', tag);

      const res = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });

      this.latencyMs = Date.now() - start;
      if (!res.ok) {
        if (res.status === 429) this.status = 'rate_limited';
        throw new Error(`DEV API HTTP ${res.status}`);
      }

      const items = await res.json();
      this.status = 'healthy';
      return {
        success: true,
        provider: this.id,
        fetchedAt: new Date().toISOString(),
        items: items.map(item => this.normalize(item))
      };
    } catch (err) {
      return {
        success: false,
        provider: this.id,
        items: [],
        error: { code: 'PROVIDER_ERROR', message: err.message }
      };
    }
  }

  async search(query) {
    return this.fetchLatest({ tag: query });
  }

  normalize(raw) {
    return normalizeArticle({
      externalId: String(raw.id),
      providerId: this.id,
      sourceType: 'external_blog',
      contentType: 'blog',
      title: raw.title,
      summary: raw.description,
      content: raw.body_markdown || raw.description,
      imageUrl: raw.cover_image || raw.social_image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      sourceName: 'DEV Community',
      sourceUrl: raw.url,
      authorName: raw.user?.name || 'DEV Author',
      authorUrl: raw.user?.website_url || `https://dev.to/${raw.user?.username}`,
      categoryId: 'programming',
      tags: raw.tag_list || ['programming', 'technology'],
      createdAt: raw.published_at || raw.created_at,
      publishedAt: raw.published_at,
      views: raw.positive_reactions_count || 12,
      reactions: {
        like: raw.positive_reactions_count || 0,
        helpful: raw.comments_count || 0,
        interesting: 0,
        insightful: 0
      }
    });
  }
}
