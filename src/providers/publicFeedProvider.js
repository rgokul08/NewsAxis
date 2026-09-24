import { BaseProvider } from './baseProvider';
import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * Public RSS Feed to JSON Provider (Google News, Medium, TechCrunch, BBC, The Hindu)
 */
export class PublicFeedProvider extends BaseProvider {
  constructor({ id, name, feedUrl, defaultCategory = 'world', priority = 3 }) {
    super({
      id: id || 'public_feed',
      name: name || 'Public News Feed',
      type: 'news',
      enabled: true,
      priority,
      cacheMinutes: 15
    });
    this.feedUrl = feedUrl;
    this.defaultCategory = defaultCategory;
    // Uses standard RSS-to-JSON worker proxy for zero-credential CORS-safe browser/server fetching
    this.apiConverter = 'https://api.rss2json.com/v1/api.json?rss_url=';
  }

  async fetchLatest() {
    try {
      const url = `${this.apiConverter}${encodeURIComponent(this.feedUrl)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Feed converter HTTP ${res.status}`);

      const json = await res.json();
      if (json.status !== 'ok') throw new Error(json.message || 'RSS parsing failed');

      this.status = 'healthy';
      const items = (json.items || []).map(item => this.normalize(item));

      return {
        success: true,
        provider: this.id,
        fetchedAt: new Date().toISOString(),
        items
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
    // Extract image if thumbnail is available or inside description HTML
    let img = raw.thumbnail;
    if (!img && raw.enclosure?.link) img = raw.enclosure.link;
    if (!img && raw.description) {
      const match = raw.description.match(/<img[^>]+src="([^">]+)"/);
      if (match) img = match[1];
    }

    // Strip HTML from description for summary
    const cleanSummary = (raw.description || '').replace(/<[^>]*>?/gm, '').trim();

    return normalizeArticle({
      externalId: raw.guid || raw.link,
      providerId: this.id,
      sourceType: 'external_news',
      contentType: 'news',
      title: raw.title,
      summary: cleanSummary.slice(0, 320),
      content: cleanSummary,
      imageUrl: img || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
      sourceName: this.name,
      sourceUrl: raw.link,
      authorName: raw.author || this.name,
      categoryId: this.defaultCategory,
      tags: raw.categories || [this.defaultCategory, 'news'],
      createdAt: raw.pubDate,
      publishedAt: raw.pubDate,
      status: 'published',
      isExternal: true
    });
  }
}
