/**
 * NewsAxis Content Taxonomy and Categories
 */

export const USER_ROLES = {
  READER: 'reader',
  AUTHOR: 'author',
  EDITOR: 'editor',
  ADMIN: 'admin'
};

export const SOURCE_TYPES = {
  EXTERNAL_NEWS: 'external_news',
  EXTERNAL_BLOG: 'external_blog',
  COMMUNITY_REPORT: 'community_report',
  COMMUNITY_BLOG: 'community_blog',
  EDITORIAL: 'editorial',
  OPINION: 'opinion'
};

export const CONTENT_TYPES = {
  NEWS: 'news',
  BLOG: 'blog',
  STORY: 'story'
};

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  ARCHIVED: 'archived'
};

export const CATEGORIES = [
  { id: 'breaking', slug: 'breaking', name: 'Breaking News', icon: 'Zap', description: 'Urgent dispatches and real-time breaking bulletins' },
  { id: 'latest', slug: 'latest', name: 'Latest News', icon: 'Clock', description: 'Up-to-the-minute reports from around the world' },
  { id: 'india', slug: 'india', name: 'India', icon: 'Flag', description: 'National coverage, policy announcements, states and union affairs' },
  { id: 'world', slug: 'world', name: 'Global / World', icon: 'Globe', description: 'International geopolitical events, diplomacy, and global affairs' },
  { id: 'politics', slug: 'politics', name: 'Politics', icon: 'Landmark', description: 'Governance, parliament, elections, political affairs and policy' },
  { id: 'business', slug: 'business', name: 'Business', icon: 'TrendingUp', description: 'Corporate earnings, enterprise, commerce, and leadership' },
  { id: 'economy', slug: 'economy', name: 'Economy', icon: 'Coins', description: 'Macroeconomics, inflation, GDP, central bank rates and fiscal policy' },
  { id: 'markets', slug: 'markets', name: 'Stock Market & Markets', icon: 'LineChart', description: 'BSE Sensex, Nifty, Wall Street, equities, indices and currencies' },
  { id: 'trade', slug: 'trade', name: 'Trade', icon: 'ArrowLeftRight', description: 'Global exports, imports, supply chain, free trade agreements' },
  { id: 'technology', slug: 'technology', name: 'Technology', icon: 'Cpu', description: 'Computing, cybersecurity, semiconductors, cloud infrastructure' },
  { id: 'startups', slug: 'startups', name: 'Startups', icon: 'Rocket', description: 'Venture funding, unicorns, founding teams, product launches' },
  { id: 'science', slug: 'science', name: 'Science', icon: 'Atom', description: 'Space exploration, astrophysics, biotechnology, physics' },
  { id: 'health', slug: 'health', name: 'Health', icon: 'Activity', description: 'Public health, medical research, wellness, epidemiology' },
  { id: 'education', slug: 'education', name: 'Education', icon: 'GraduationCap', description: 'Academia, universities, competitive exams, curriculum shifts' },
  { id: 'sports', slug: 'sports', name: 'Sports', icon: 'Trophy', description: 'Cricket, Football, Olympics, Formula 1, tennis championships' },
  { id: 'entertainment', slug: 'entertainment', name: 'Entertainment', icon: 'Film', description: 'Cinema, streaming, pop culture, music releases, box office' },
  { id: 'lifestyle', slug: 'lifestyle', name: 'Lifestyle', icon: 'Sparkles', description: 'Culture, design, cuisine, living, and personal growth' },
  { id: 'travel', slug: 'travel', name: 'Travel', icon: 'Compass', description: 'Destinations, ecotourism, travel advisories, heritage journeys' },
  { id: 'environment', slug: 'environment', name: 'Environment', icon: 'Leaf', description: 'Climate action, renewable energy, ecology, conservation' },
  { id: 'weather', slug: 'weather', name: 'Weather', icon: 'CloudSun', description: 'Meteorological alerts, monsoon radars, climate patterns' },
  { id: 'finance', slug: 'finance', name: 'Finance', icon: 'DollarSign', description: 'Banking, fintech, personal finance, taxation and assets' },
  { id: 'automobile', slug: 'automobile', name: 'Automobile', icon: 'Car', description: 'EVs, automotive engineering, motorsport, auto market' },
  { id: 'agriculture', slug: 'agriculture', name: 'Agriculture', icon: 'Wheat', description: 'Farming innovation, agritech, crop yields, rural economy' },
  { id: 'crime', slug: 'crime', name: 'Crime & Courts', icon: 'Scale', description: 'Judiciary rulings, legal trials, investigative crime reporting' },
  { id: 'blogs', slug: 'blogs', name: 'Blogs', icon: 'BookOpen', description: 'Engineering blogs, creator articles, and deep-dive essays' },
  { id: 'opinion', slug: 'opinion', name: 'Opinion', icon: 'MessageSquare', description: 'Thought leadership, verified analysis, expert columns' }
];

export const REACTIONS = {
  LIKE: 'like',
  HELPFUL: 'helpful',
  INTERESTING: 'interesting',
  INSIGHTFUL: 'insightful'
};

export const REPORT_REASONS = [
  'spam',
  'abuse',
  'harassment',
  'copyright_concern',
  'inappropriate_content',
  'misinformation_concern',
  'impersonation',
  'other'
];
