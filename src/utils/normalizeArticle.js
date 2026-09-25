/**
 * Normalizes any external item or user submission to the canonical NewsAxis content model.
 */
export function normalizeArticle(raw = {}) {
  const now = new Date().toISOString();
  
  // Clean slug generation
  const slug = raw.slug || generateSlug(raw.title || 'untitled-story');
  
  // Calculate reading time (~200 words per min)
  const fullText = (raw.content || raw.summary || raw.excerpt || '').replace(/<[^>]*>?/gm, '');
  const words = fullText.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Determine expiration date (community posts strictly expire at createdAt + 24 hours / 1 day)
  const isCommunity = raw.sourceType === 'community_blog' || raw.sourceType === 'community_report';
  let expiresAt = raw.expiresAt;
  if (!expiresAt && isCommunity) {
    const createdTime = raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now();
    expiresAt = new Date(createdTime + (24 * 60 * 60 * 1000)).toISOString();
  }

  // Keyword-based Category Fallback
  const detectedCategory = inferCategoryClient(raw.title, raw.summary || raw.content, raw.categoryId || raw.categorySlug || 'world');

  return {
    id: raw.id || raw.$id || `art_${Math.random().toString(36).substring(2, 11)}`,
    externalId: raw.externalId || null,
    providerId: raw.providerId || (isCommunity ? 'newsaxis_community' : 'newsaxis_editorial'),
    sourceType: raw.sourceType || 'external_news',
    contentType: raw.contentType || 'news',
    title: (raw.title || '').trim(),
    slug,
    subtitle: raw.subtitle || '',
    summary: raw.summary || raw.excerpt || '',
    excerpt: raw.excerpt || (raw.summary ? raw.summary.slice(0, 160) + '...' : ''),
    content: raw.content || raw.summary || '',
    imageUrl: raw.imageUrl || raw.coverImageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
    imageAlt: raw.imageAlt || raw.title || 'News cover image',
    sourceName: raw.sourceName || (isCommunity ? 'NewsAxis Community' : 'NewsAxis Desk'),
    sourceUrl: raw.sourceUrl || '',
    authorName: raw.authorName || 'NewsAxis Contributor',
    authorUrl: raw.authorUrl || '',
    authorId: raw.authorId || null,
    categoryId: detectedCategory,
    categorySlug: detectedCategory,
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : [detectedCategory, raw.contentType || 'news'],
    language: raw.language || 'en',
    country: raw.country || 'us',
    createdAt: raw.createdAt || raw.$createdAt || now,
    publishedAt: raw.publishedAt || raw.createdAt || now,
    updatedAt: raw.updatedAt || raw.$updatedAt || now,
    fetchedAt: raw.fetchedAt || now,
    expiresAt: expiresAt || null,
    status: raw.status || 'published',
    isExternal: Boolean(raw.isExternal ?? (raw.sourceType?.startsWith('external'))),
    isFeatured: Boolean(raw.isFeatured),
    isBreaking: Boolean(raw.isBreaking),
    isTrending: Boolean(raw.isTrending),
    views: Number(raw.views || 0),
    uniqueViews: Number(raw.uniqueViews || 0),
    readingTime: Number(raw.readingTime || readingTime),
    reactions: raw.reactions || { like: 0, helpful: 0, interesting: 0, insightful: 0 },
    commentsCount: Number(raw.commentsCount || 0),
    bookmarksCount: Number(raw.bookmarksCount || 0),
  };
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) + '-' + Math.random().toString(36).substring(2, 6);
}

/**
 * Deduplicates articles by externalId, normalized canonical URL, or title similarity
 */
export function deduplicateArticles(articles = []) {
  const seenIds = new Set();
  const seenUrls = new Set();
  const seenTitles = new Set();
  const results = [];

  for (const article of articles) {
    if (!article || !article.title) continue;

    // Check 1: Provider + ExternalID
    if (article.externalId && article.providerId) {
      const key = `${article.providerId}:${article.externalId}`;
      if (seenIds.has(key)) continue;
      seenIds.add(key);
    }

    // Check 2: Normalized Canonical URL
    if (article.sourceUrl) {
      const cleanUrl = article.sourceUrl.split('?')[0].toLowerCase();
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
    }

    // Check 3: Normalized Title Hash
    const cleanTitle = article.title.toLowerCase().replace(/[^\w]/g, '');
    if (cleanTitle.length > 15) {
      if (seenTitles.has(cleanTitle)) continue;
      seenTitles.add(cleanTitle);
    }

    results.push(article);
  }

  return results;
}

/**
 * Calculates trending score with time decay
 */
export function calculateTrendingScore(article) {
  const views = article.views || 0;
  const bookmarks = (article.bookmarksCount || 0) * 3;
  const comments = (article.commentsCount || 0) * 2;
  const reactions = Object.values(article.reactions || {}).reduce((a, b) => a + b, 0) * 2;
  
  const rawEngagement = views + bookmarks + comments + reactions;
  
  // Time decay: calculate age in hours
  const publishedDate = new Date(article.publishedAt || article.createdAt).getTime();
  const ageHours = Math.max(0.5, (Date.now() - publishedDate) / (1000 * 60 * 60));
  
  // Gravity decay formula: Score / (Hours + 2)^1.5
  return rawEngagement / Math.pow(ageHours + 2, 1.5);
}

/**
 * Client-Side Intelligent Category Inference
 */
export function inferCategoryClient(title = '', description = '', defaultCat = 'world') {
  const text = `${title} ${description}`.toLowerCase();
  
  // Sports indicators (Cricket, Football, Tennis, F1, Olympics, etc.)
  if (/\b(cricket|football|soccer|tennis|fifa|ipl|bcci|icc|test match|odi|t20|wimbledon|olympics|nba|nfl|premier league|champions league|formula 1|f1|racing|messi|ronaldo|kohli|rohit sharma|wicket|goal|grand slam|athletics|badminton|kabaddi|chelsea|arsenal|liverpool|real madrid|barcelona|manchester united)\b/i.test(text)) {
    return 'sports';
  }
  // Technology & AI indicators
  if (/\b(ai|artificial intelligence|machine learning|openai|chatgpt|deep learning|llm|nvidia|semiconductor|microchip|robotics|cybersecurity|android|ios|iphone|smartphone|software engineer|github|cloud computing|tech|gadgets)\b/i.test(text)) {
    return 'technology';
  }
  // Programming & Dev Blog indicators
  if (/\b(javascript|typescript|python|rust|golang|react|vue|angular|docker|kubernetes|web development|frontend|backend|api|database|sql|devops|css|html|compiler|git)\b/i.test(text)) {
    return 'programming';
  }
  // Business, Economy & Finance indicators
  if (/\b(stock market|stocks|shares|sensex|nifty|wall street|nasdaq|dow jones|s&p 500|inflation|gdp|recession|central bank|federal reserve|rbi|treasury|interest rate|earnings|revenue|quarterly profit|merger|ipo|cryptocurrency|bitcoin|ethereum|forex)\b/i.test(text)) {
    return 'business';
  }
  // Science & Space exploration
  if (/\b(nasa|isro|space|galaxy|black hole|astronomy|planet|telescope|james webb|mars|moon mission|quantum|physics|fossil|species|dna|genetics|biotechnology|solar system)\b/i.test(text)) {
    return 'science';
  }
  // Entertainment & Cinema
  if (/\b(movie|film|cinema|box office|actor|actress|hollywood|bollywood|trailer|soundtrack|grammy|oscar|emmy|netflix|streaming series|celebrity)\b/i.test(text)) {
    return 'entertainment';
  }
  // India specific
  if (/\b(india|indian|new delhi|mumbai|chennai|bengaluru|kolkata|hyderabad|tamil nadu|kerala|karnataka|bjp|congress|lok sabha|rajya sabha|supreme court of india|modi)\b/i.test(text)) {
    if (defaultCat === 'world' || defaultCat === 'general') return 'india';
  }

  return defaultCat || 'world';
}
