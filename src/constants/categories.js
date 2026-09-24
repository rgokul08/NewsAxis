/**
 * NewsAxis Content Taxonomy and Categories
 */

export const USER_ROLES = {
  VISITOR: 'visitor',
  USER: 'user',
  AUTHOR: 'author',
  EDITOR: 'editor',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
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
  CHANGES_REQUESTED: 'changes_requested',
  REJECTED: 'rejected',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  ARCHIVED: 'archived'
};

export const CATEGORIES = [
  { id: 'world', slug: 'world', name: 'World', icon: 'Globe', description: 'International geopolitical events, diplomacy, and global affairs' },
  { id: 'india', slug: 'india', name: 'India', icon: 'Flag', description: 'National coverage, policy announcements, states and union affairs' },
  { id: 'tamil-nadu', slug: 'tamil-nadu', name: 'Tamil Nadu', icon: 'MapPin', description: 'Regional developments, Chennai metro, state culture & industry' },
  { id: 'technology', slug: 'technology', name: 'Technology', icon: 'Cpu', description: 'Computing, cybersecurity, semiconductors, cloud infrastructure' },
  { id: 'artificial-intelligence', slug: 'artificial-intelligence', name: 'Artificial Intelligence', icon: 'Sparkles', description: 'LLMs, generative models, robotics, AI ethics and frontiers' },
  { id: 'business', slug: 'business', name: 'Business', icon: 'TrendingUp', description: 'Markets, macroeconomics, trade policy, earnings, and capital' },
  { id: 'startups', slug: 'startups', name: 'Startups', icon: 'Rocket', description: 'Venture funding, unicorns, founding teams, product launches' },
  { id: 'education', slug: 'education', name: 'Education', icon: 'GraduationCap', description: 'Academia, edtech, competitive exams, curriculum shifts' },
  { id: 'science', slug: 'science', name: 'Science', icon: 'Atom', description: 'Space exploration, biotechnology, climate research, physics' },
  { id: 'sports', slug: 'sports', name: 'Sports', icon: 'Trophy', description: 'Cricket, Football, Olympics, Formula 1, tennis championships' },
  { id: 'entertainment', slug: 'entertainment', name: 'Entertainment', icon: 'Film', description: 'Cinema, streaming, pop culture, music releases, box office' },
  { id: 'gaming', slug: 'gaming', name: 'Gaming', icon: 'Gamepad2', description: 'Consoles, esports, game engines, game studio releases' },
  { id: 'programming', slug: 'programming', name: 'Programming', icon: 'Code', description: 'Software engineering, open-source, architecture, dev tools' },
  { id: 'lifestyle', slug: 'lifestyle', name: 'Lifestyle', icon: 'HeartPulse', description: 'Wellness, travel, work-life balance, design, culture' },
  { id: 'opinion', slug: 'opinion', name: 'Opinion', icon: 'MessageSquare', description: 'Thought leadership, verified analysis, expert columns' },
  { id: 'community', slug: 'community', name: 'Community', icon: 'Users', description: 'Stories and perspectives directly from NewsAxis creators' }
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
