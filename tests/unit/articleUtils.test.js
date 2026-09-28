import { describe, test, expect } from 'vitest';
import { normalizeArticle, deduplicateArticles, calculateTrendingScore } from '../../src/utils/normalizeArticle.js';

describe('NewsAxis Article Utilities & Policies', () => {
  test('normalizeArticle enforces 24-hour expiration for community content', () => {
    const raw = {
      title: 'Community Web Security Review',
      content: 'Important security considerations for client side state.',
      sourceType: 'community_blog'
    };

    const normalized = normalizeArticle(raw);
    expect(normalized.expiresAt).toBeDefined();

    const createdTime = new Date(normalized.createdAt).getTime();
    const expiryTime = new Date(normalized.expiresAt).getTime();
    const diffHours = (expiryTime - createdTime) / (1000 * 60 * 60);

    expect(Math.round(diffHours)).toBe(24);
  });

  test('deduplicateArticles eliminates duplicated canonical URLs and provider IDs', () => {
    const articles = [
      { id: '1', providerId: 'gnews', externalId: 'ext_1', title: 'Tech Breakthrough', sourceUrl: 'https://tech.com/a' },
      { id: '2', providerId: 'gnews', externalId: 'ext_1', title: 'Tech Breakthrough Duplicate', sourceUrl: 'https://tech.com/a' },
      { id: '3', providerId: 'dev_to', externalId: 'ext_2', title: 'Different Article', sourceUrl: 'https://dev.to/b' }
    ];

    const deduplicated = deduplicateArticles(articles);
    expect(deduplicated.length).toBe(2);
    expect(deduplicated[0].id).toBe('1');
    expect(deduplicated[1].id).toBe('3');
  });

  test('calculateTrendingScore applies time decay', () => {
    const freshArticle = {
      views: 100,
      bookmarksCount: 10,
      commentsCount: 5,
      reactions: { like: 20 },
      publishedAt: new Date().toISOString()
    };

    const oldArticle = {
      ...freshArticle,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 48h old
    };

    const freshScore = calculateTrendingScore(freshArticle);
    const oldScore = calculateTrendingScore(oldArticle);

    expect(freshScore).toBeGreaterThan(oldScore);
  });
});
