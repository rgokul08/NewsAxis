import { describe, test, expect } from 'vitest';
import { DevToProvider } from '../../src/providers/devProvider.js';
import { HashnodeProvider } from '../../src/providers/hashnodeProvider.js';
import { PublicFeedProvider } from '../../src/providers/publicFeedProvider.js';
import { providerRegistry } from '../../src/providers/index.js';

import { TheNewsApiProvider } from '../../src/providers/theNewsApiProvider.js';
import { NewsDataProvider } from '../../src/providers/newsDataProvider.js';
import { MediaStackProvider } from '../../src/providers/mediaStackProvider.js';
import { NewsApiOrgProvider } from '../../src/providers/newsApiOrgProvider.js';
import { GNewsProvider } from '../../src/providers/gNewsProvider.js';

describe('NewsAxis Provider Adapters Suite', () => {
  test('DevToProvider normalizes articles accurately', () => {
    const provider = new DevToProvider();
    const rawDevItem = {
      id: 994821,
      title: 'Deep dive into Service Workers',
      description: 'Understanding offline sync with modern web APIs.',
      body_markdown: 'Full body content here...',
      url: 'https://dev.to/user/sw-guide',
      published_at: '2026-09-24T00:00:00Z',
      user: { name: 'Kavitha Dev', username: 'kavithadev' },
      tag_list: ['javascript', 'webdev'],
      positive_reactions_count: 42
    };

    const normalized = provider.normalize(rawDevItem);
    expect(normalized.externalId).toBe('994821');
    expect(normalized.providerId).toBe('dev_to');
    expect(normalized.sourceType).toBe('external_blog');
    expect(normalized.title).toBe('Deep dive into Service Workers');
    expect(normalized.sourceName).toBe('DEV Community');
    expect(normalized.isExternal).toBe(true);
  });

  test('PublicFeedProvider extracts content and assigns source beats', () => {
    const feed = new PublicFeedProvider({
      id: 'bbc_world',
      name: 'BBC World News',
      feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      defaultCategory: 'world'
    });

    const rawRssItem = {
      guid: 'https://bbc.com/news/12345',
      title: 'Global Climate Summit Concludes',
      description: '<p>World leaders agree on new grid resilience measures.</p>',
      link: 'https://bbc.com/news/12345',
      pubDate: '2026-09-24T05:00:00Z',
      author: 'BBC Diplomatic Desk'
    };

    const normalized = feed.normalize(rawRssItem);
    expect(normalized.externalId).toBe('https://bbc.com/news/12345');
    expect(normalized.sourceName).toBe('BBC World News');
    expect(normalized.categorySlug).toBe('world');
    expect(normalized.summary).toContain('World leaders agree on new grid resilience measures');
  });

  test('TheNewsApiProvider normalizes items correctly', () => {
    const provider = new TheNewsApiProvider();
    const sample = {
      uuid: 'news_uuid_001',
      title: 'Global Markets Rally on Tech Surge',
      description: 'Indices advance across Asian and European bourses.',
      snippet: 'Indices advance across Asian and European bourses...',
      url: 'https://example.com/markets-rally',
      image_url: 'https://example.com/image.jpg',
      source: 'reuters.com',
      categories: ['business'],
      published_at: '2026-09-24T04:00:00Z'
    };
    const normalized = provider.normalize(sample);
    expect(normalized.externalId).toBe('news_uuid_001');
    expect(normalized.providerId).toBe('thenewsapi');
    expect(normalized.sourceName).toBe('reuters.com');
    expect(normalized.categorySlug).toBe('business');
  });

  test('NewsDataProvider normalizes items correctly', () => {
    const provider = new NewsDataProvider();
    const sample = {
      article_id: 'newsdata_123',
      title: 'ISRO Unveils Deep Space Exploration Plan',
      description: 'Mission blueprints for upcoming lunar station.',
      link: 'https://example.com/isro-update',
      image_url: 'https://example.com/isro.jpg',
      source_id: 'thehindu',
      creator: ['Science Correspondent'],
      category: ['science'],
      pubDate: '2026-09-24 07:00:00'
    };
    const normalized = provider.normalize(sample);
    expect(normalized.externalId).toBe('newsdata_123');
    expect(normalized.providerId).toBe('newsdata');
    expect(normalized.sourceName).toBe('THEHINDU');
    expect(normalized.categorySlug).toBe('science');
  });

  test('MediaStackProvider normalizes items correctly', () => {
    const provider = new MediaStackProvider();
    const sample = {
      title: 'Breakthrough in Quantum Computing Architecture',
      description: 'Researchers demonstrate room-temperature coherence.',
      url: 'https://example.com/quantum-news',
      image: 'https://example.com/quantum.jpg',
      source: 'Ars Technica',
      author: 'Tech Reporter',
      category: 'technology',
      published_at: '2026-09-24T03:00:00Z'
    };
    const normalized = provider.normalize(sample);
    expect(normalized.externalId).toBe('https://example.com/quantum-news');
    expect(normalized.providerId).toBe('mediastack');
    expect(normalized.sourceName).toBe('Ars Technica');
    expect(normalized.categorySlug).toBe('technology');
  });

  test('NewsApiOrgProvider normalizes items correctly', () => {
    const provider = new NewsApiOrgProvider();
    const sample = {
      source: { id: 'the-hindu', name: 'The Hindu' },
      author: 'Editorial Desk',
      title: 'Parliament Debates New Digital Data Framework',
      description: 'Key provisions for data sovereignty discussed.',
      url: 'https://example.com/data-framework',
      urlToImage: 'https://example.com/parliament.jpg',
      publishedAt: '2026-09-24T05:30:00Z'
    };
    const normalized = provider.normalize(sample);
    expect(normalized.externalId).toBe('https://example.com/data-framework');
    expect(normalized.providerId).toBe('newsapi_org');
    expect(normalized.sourceName).toBe('The Hindu');
  });

  test('ProviderRegistry contains at least 14 content providers including all 5 APIs', () => {
    const allProviders = providerRegistry.getAll();
    expect(allProviders.length).toBeGreaterThanOrEqual(14);

    expect(providerRegistry.get('thenewsapi')).toBeDefined();
    expect(providerRegistry.get('gnews')).toBeDefined();
    expect(providerRegistry.get('newsdata')).toBeDefined();
    expect(providerRegistry.get('mediastack')).toBeDefined();
    expect(providerRegistry.get('newsapi_org')).toBeDefined();
    expect(providerRegistry.get('dev_to')).toBeDefined();
    expect(providerRegistry.get('the_hindu_india')).toBeDefined();
  });
});
