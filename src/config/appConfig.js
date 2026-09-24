/**
 * NewsAxis Global App Configuration
 */

export const APP_CONFIG = {
  name: 'NewsAxis',
  tagline: 'Discover What Matters.',
  version: '1.0.0',
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://newsaxis.vercel.app',
  apiTimeout: 12000,
  
  // Mandatory 72-Hour Retention for Community User Content
  USER_POST_RETENTION_HOURS: 72,
  
  // Default cache TTL for External Normalized News
  EXTERNAL_CACHE_HOURS: 48,
  
  // Pagination limits
  DEFAULT_PAGE_SIZE: 12,
  ADMIN_PAGE_SIZE: 15,
  
  // Content Length Limits
  MAX_TITLE_LENGTH: 150,
  MAX_SUMMARY_LENGTH: 350,
  MIN_CONTENT_LENGTH: 120,
  MAX_CONTENT_LENGTH: 50000,
  
  // Breaking News ticker auto-rotation ms
  BREAKING_NEWS_INTERVAL_MS: 6000,

  // Appwrite Config
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'newsaxis-prod',
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'newsaxis-main',
    storageBucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID || 'newsaxis-media',
    collections: {
      profiles: 'profiles',
      articles: 'articles',
      categories: 'categories',
      tags: 'tags',
      article_tags: 'article_tags',
      comments: 'comments',
      reactions: 'reactions',
      bookmarks: 'bookmarks',
      follows: 'follows',
      notifications: 'notifications',
      reports: 'reports',
      media_assets: 'media_assets',
      article_revisions: 'article_revisions',
      providers: 'providers',
      provider_logs: 'provider_logs',
      analytics_events: 'analytics_events',
      newsletter_subscribers: 'newsletter_subscribers',
      contact_messages: 'contact_messages',
      audit_logs: 'audit_logs',
      feature_flags: 'feature_flags',
      site_settings: 'site_settings'
    }
  },

  // Fallback demo mode flag if Appwrite keys are unconfigured
  isDemoMode: import.meta.env.VITE_USE_DEMO_DATA === 'true' || !import.meta.env.VITE_APPWRITE_PROJECT_ID,
};

export const FEATURE_FLAGS = {
  ENABLE_COMMENTS: true,
  ENABLE_REACTIONS: true,
  ENABLE_NEWSLETTER: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_PWA: true,
  ENABLE_EXTERNAL_BLOGS: true,
  ENABLE_BREAKING_NEWS: true,
  ENABLE_GOOGLE_AUTH: true,
  ENABLE_GITHUB_AUTH: true,
  ENABLE_DAILY_DIGEST: true,
  ENABLE_TEXT_TO_SPEECH: true,
};
