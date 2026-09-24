import { describe, test, expect } from 'vitest';
import { DevToProvider } from '../../src/providers/devProvider.js';
import { HashnodeProvider } from '../../src/providers/hashnodeProvider.js';
import { PublicFeedProvider } from '../../src/providers/publicFeedProvider.js';
import { providerRegistry } from '../../src/providers/index.js';

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

  test('ProviderRegistry contains at least 8 enabled content providers', () => {
    const allProviders = providerRegistry.getAll();
    expect(allProviders.length).toBeGreaterThanOrEqual(8);

    const devProvider = providerRegistry.get('dev_to');
    expect(devProvider).toBeDefined();

    const techcrunch = providerRegistry.get('techcrunch');
    expect(techcrunch).toBeDefined();
  });
});
