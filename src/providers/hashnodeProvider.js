import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * Hashnode GraphQL Provider (Technology, AI, and Software Engineering)
 */
export class HashnodeProvider extends BaseProvider {
  constructor() {
    super({
      id: 'hashnode',
      name: 'Hashnode',
      type: 'blog',
      enabled: true,
      priority: 2,
      requestsPerMinute: 30,
      cacheMinutes: 30
    });
    this.endpoint = 'https://gql.hashnode.com';
  }

  async fetchLatest({ first = 10 } = {}) {
    const query = `
      query GetFeed {
        feed(first: ${first}, filter: { type: FEATURED }) {
          edges {
            node {
              id
              title
              brief
              url
              coverImage { url }
              author { name username profilePicture }
              publishedAt
              tags { name slug }
              readTimeInMinutes
              reactionCount
            }
          }
        }
      }
    `;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) throw new Error(`Hashnode API HTTP ${res.status}`);
      const json = await res.json();
      const edges = json.data?.feed?.edges || [];

      this.status = 'healthy';
      return {
        success: true,
        provider: this.id,
        fetchedAt: new Date().toISOString(),
        items: edges.map(e => this.normalize(e.node))
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

  normalize(raw) {
    return normalizeArticle({
      externalId: String(raw.id),
      providerId: this.id,
      sourceType: 'external_blog',
      contentType: 'blog',
      title: raw.title,
      summary: raw.brief,
      imageUrl: raw.coverImage?.url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      sourceName: 'Hashnode',
      sourceUrl: raw.url,
      authorName: raw.author?.name || 'Hashnode Writer',
      authorUrl: `https://hashnode.com/@${raw.author?.username || ''}`,
      categoryId: 'technology',
      tags: raw.tags?.map(t => t.slug) || ['tech', 'development'],
      createdAt: raw.publishedAt,
      publishedAt: raw.publishedAt,
      readingTime: raw.readTimeInMinutes || 4,
      reactions: { like: raw.reactionCount || 5, helpful: 2, interesting: 1, insightful: 0 }
    });
  }
}
