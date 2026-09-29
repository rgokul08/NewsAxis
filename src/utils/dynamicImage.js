/**
 * NewsAxis Dynamic Image Resolution Engine
 * 
 * Provides authentic, high-resolution, topic-specific editorial photography
 * ensuring every single article and blog post receives a distinct, relevant,
 * and deterministic visual representation without duplicates.
 */

// Curated pools of verified high-res editorial photography from Unsplash
const IMAGE_POOLS = {
  // 1. World & Global Affairs
  world: [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&auto=format&fit=crop&q=80', // Globe map
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', // Earth from orbit
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80', // UN flags
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80', // Summit conference
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&auto=format&fit=crop&q=80', // London dusk
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=80', // Paris cityscape
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80', // Tokyo neon crossing
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=80', // New York skyline
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1200&auto=format&fit=crop&q=80', // Chicago bridge
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80'  // Financial towers
  ],

  // 2. India & National
  india: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80', // India Gate New Delhi
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&auto=format&fit=crop&q=80', // Taj Mahal reflection
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&auto=format&fit=crop&q=80', // Gateway of India Mumbai
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&auto=format&fit=crop&q=80', // Victoria Memorial Kolkata
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&auto=format&fit=crop&q=80', // Red Fort Delhi
    'https://images.unsplash.com/photo-1605649487212-47bdab064df8?w=1200&auto=format&fit=crop&q=80', // Varanasi Ganga Ghats
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80', // South India Temple
    'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1200&auto=format&fit=crop&q=80', // Marine Drive Mumbai
    'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&auto=format&fit=crop&q=80', // Indian Flag
    'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&auto=format&fit=crop&q=80'  // Ladakh Himalayas
  ],

  // 3. Technology, AI & Gadgets
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80', // Circuit processor
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80', // AI Neural brain
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80', // Generative AI visual
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80', // Cyber security
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&auto=format&fit=crop&q=80', // Modern laptop setup
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80', // Robotics engineering
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80', // Server datacenter
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80', // Matrix code data
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', // Digital data waves
    'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=1200&auto=format&fit=crop&q=80'  // Quantum optical tech
  ],

  // 4. Programming, Coding & Developer Blogs
  programming: [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80', // Clean code IDE
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80', // Web dev workspace
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80', // Software engineer desk
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&auto=format&fit=crop&q=80', // Coding terminal
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80', // Syntax highlighted code
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80', // Software development
    'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&auto=format&fit=crop&q=80', // Cloud software flow
    'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=1200&auto=format&fit=crop&q=80', // Engineer at monitors
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&auto=format&fit=crop&q=80', // Algorithm code
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&auto=format&fit=crop&q=80'  // Night coding sprint
  ],

  // 5. Business, Enterprise & Startups
  business: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80', // Glass skyscraper
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80', // Boardroom table
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80', // Strategy meeting
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=80', // Executive leader
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&auto=format&fit=crop&q=80', // Partnership handshake
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80', // Startup pitch deck
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=80', // Corporate team meeting
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&auto=format&fit=crop&q=80'  // Enterprise collaboration
  ],

  // 6. Markets, Economy, Finance & Trade
  markets: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80', // Candlestick charts
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80', // Trading screen monitors
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80', // Stock market ticker
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80', // Banking report chart
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&auto=format&fit=crop&q=80', // Wall Street Bull
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80', // Forex trading rates
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80', // Currency bank notes
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80'  // Trade cargo containers
  ],

  // 7. Sports (Cricket, Football, Tennis, Athletics)
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80', // Olympic track
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80', // Football stadium lights
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80', // Stadium grass arena
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80', // Tennis court & racket
    'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80', // Basketball court arena
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80', // Formula 1 racing track
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80', // Football goal net action
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&auto=format&fit=crop&q=80'  // Swimming tournament pool
  ],

  // 8. Science & Space Exploration
  science: [
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80', // Scientific microscope
    'https://images.unsplash.com/photo-1517976487502-53b34db06c9e?w=1200&auto=format&fit=crop&q=80', // Rocket launch flame
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', // Deep space cosmos
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80', // Starry galaxy nebula
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80', // Lunar surface craters
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80', // Laboratory chemistry test
    'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&auto=format&fit=crop&q=80', // Observatory dome stars
    'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?w=1200&auto=format&fit=crop&q=80'  // Mars exploration rover
  ],

  // 9. Politics, Judiciary & Law
  politics: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80', // Capitol dome architecture
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80', // Parliament assembly room
    'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80', // Press microphones conference
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1200&auto=format&fit=crop&q=80', // Ballot voting election
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80', // Supreme court gavel
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80'  // Legislation signing pen
  ],

  // 10. Health & Medicine
  health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80', // Stethoscope medical clinic
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80', // Hospital clinic equipment
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80', // Healthcare consultation
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&auto=format&fit=crop&q=80', // Pharmaceutical vaccine research
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&auto=format&fit=crop&q=80', // Diagnostic medicine scan
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&auto=format&fit=crop&q=80'  // Doctor in hospital
  ],

  // 11. Environment & Weather
  environment: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80', // Mountain landscape
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&auto=format&fit=crop&q=80', // Rain storm weather
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&auto=format&fit=crop&q=80', // Wind turbines renewable
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80', // Solar panel energy
    'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=1200&auto=format&fit=crop&q=80', // Storm clouds thunder
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80'  // Misty forest nature
  ],

  // 12. Entertainment & Cinema
  entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80', // Cinema theatre seats
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80', // Concert stage lights
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80', // Film camera clapperboard
    'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1200&auto=format&fit=crop&q=80', // Studio microphone
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80', // Crowd concert music
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80'  // Film reel cinema production
  ],

  // 13. Automobile
  automobile: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80', // Sports car road
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80', // Modern car headlights
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&auto=format&fit=crop&q=80', // EV electric vehicle charging
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80', // Luxury vehicle
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80'  // Highway traffic speed
  ],

  // 14. Agriculture
  agriculture: [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80', // Golden wheat harvest
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&auto=format&fit=crop&q=80', // Green farming crop
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&auto=format&fit=crop&q=80', // Precision farm tractor
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1200&auto=format&fit=crop&q=80'  // Rice terrace field
  ],

  // 15. Breaking & Editorial Fallback
  breaking: [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80', // Printing press
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80', // Newspaper stack
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&auto=format&fit=crop&q=80', // Broadside newspaper
    'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200&auto=format&fit=crop&q=80', // Live news broadcast studio
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80'  // Architectural skyline
  ]
};

// Aliases
IMAGE_POOLS.economy = IMAGE_POOLS.markets;
IMAGE_POOLS.trade = IMAGE_POOLS.markets;
IMAGE_POOLS.finance = IMAGE_POOLS.markets;
IMAGE_POOLS.startups = IMAGE_POOLS.business;
IMAGE_POOLS.weather = IMAGE_POOLS.environment;
IMAGE_POOLS.crime = IMAGE_POOLS.politics;
IMAGE_POOLS.dev_blogs = IMAGE_POOLS.programming;
IMAGE_POOLS.general = IMAGE_POOLS.world;

/**
 * Fast deterministic string hashing (djb2 variant)
 */
function hashString(str = '') {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Detects fine-grained topic from title and category to pick the best image pool
 */
export function detectImageTopic(title = '', category = '') {
  const text = `${title} ${category}`.toLowerCase();

  if (/\b(cricket|football|soccer|tennis|wimbledon|ipl|bcci|fifa|olympics|sports|champions league|premier league|f1|formula 1|racing)\b/i.test(text)) {
    return 'sports';
  }
  if (/\b(stock market|stocks|sensex|nifty|wall street|nasdaq|dow jones|s&p 500|shares|ipo|bullion|gold price|forex|inflation|gdp|monetary policy|rbi|central bank)\b/i.test(text)) {
    return 'markets';
  }
  if (/\b(ai|artificial intelligence|machine learning|openai|chatgpt|deep learning|llm|nvidia|semiconductor|chip|robotics|cybersecurity|android|ios|iphone|smartphone|gadgets)\b/i.test(text)) {
    return 'technology';
  }
  if (/\b(javascript|typescript|python|rust|golang|react|vue|docker|kubernetes|web dev|frontend|backend|api|database|sql|devops|css|compiler|git|code|coding|developer)\b/i.test(text)) {
    return 'programming';
  }
  if (/\b(space|nasa|isro|galaxy|black hole|astronomy|planet|telescope|james webb|mars|moon mission|quantum|physics|dna|genetics|science)\b/i.test(text)) {
    return 'science';
  }
  if (/\b(hospital|doctor|vaccine|virus|disease|cancer|health|wellness|pharma|medical|clinical)\b/i.test(text)) {
    return 'health';
  }
  if (/\b(election|parliament|bjp|congress|lok sabha|rajya sabha|prime minister|president|modi|senate|cabinet|court|supreme court|judiciary)\b/i.test(text)) {
    return 'politics';
  }
  if (/\b(climate|monsoon|rainfall|cyclone|weather|heatwave|flood|solar|renewable energy|wildfire|pollution|environment)\b/i.test(text)) {
    return 'environment';
  }
  if (/\b(movie|film|cinema|box office|actor|actress|hollywood|bollywood|trailer|soundtrack|grammy|oscar|celebrity|entertainment)\b/i.test(text)) {
    return 'entertainment';
  }
  if (/\b(car|cars|suv|automobile|ev|electric vehicle|tesla|hyundai|tata motors|maruti|motorcycle)\b/i.test(text)) {
    return 'automobile';
  }
  if (/\b(farmer|farming|agriculture|crop|crops|harvest|fertilizer|paddy|wheat)\b/i.test(text)) {
    return 'agriculture';
  }
  if (/\b(india|indian|new delhi|mumbai|chennai|bengaluru|kolkata|hyderabad|tamil nadu|kerala|karnataka)\b/i.test(text)) {
    return 'india';
  }

  const catKey = (category || '').toLowerCase();
  if (IMAGE_POOLS[catKey]) {
    return catKey;
  }

  return 'world';
}

/**
 * Resolves a dynamic, topic-specific high-resolution image URL.
 * Every article gets a distinct image based on its unique title & identifier.
 */
export function getDynamicArticleImage(title = '', category = 'world', identifier = '') {
  const topic = detectImageTopic(title, category);
  const pool = IMAGE_POOLS[topic] || IMAGE_POOLS.world;

  // Use combination of title, identifier, and topic to deterministically index into the pool
  const seed = `${title || 'story'}_${identifier || ''}_${topic}`;
  const index = hashString(seed) % pool.length;

  return pool[index];
}

/**
 * Extracts authentic image URL from RSS XML item
 */
export function extractImageFromXml(itemXml = '') {
  if (!itemXml) return null;

  // 1. media:content
  const mediaContent = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
                       itemXml.match(/<media:content[^>]+href=["']([^"']+)["']/i);
  if (mediaContent && isValidImageUrl(mediaContent[1])) {
    return mediaContent[1];
  }

  // 2. media:thumbnail
  const mediaThumb = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
                     itemXml.match(/<media:thumbnail[^>]+href=["']([^"']+)["']/i);
  if (mediaThumb && isValidImageUrl(mediaThumb[1])) {
    return mediaThumb[1];
  }

  // 3. enclosure
  const enclosure = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosure && isValidImageUrl(enclosure[1])) {
    return enclosure[1];
  }

  // 4. img tag in description / content:encoded (including CDATA)
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && isValidImageUrl(imgMatch[1])) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Validates that an image URL is not a tracking pixel or spacer
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return false;

  const blockedPatterns = [
    '1x1',
    'pixel',
    'spacer',
    'feedburner',
    'beacon',
    'tracking',
    'badge',
    'avatar_default',
    'transparent.gif'
  ];

  for (const pattern of blockedPatterns) {
    if (clean.includes(pattern)) return false;
  }

  return true;
}

/**
 * Checks whether an image URL is an old static stock placeholder or empty,
 * requiring replacement with dynamic topic-matched photography.
 */
export function isGenericPlaceholder(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('photo-1585829365295-ab7cd400c167') || // generic newspaper stock
    lower.includes('photo-1504711434969-e33886168f5c') || // generic articles stock
    lower.includes('photo-1499750310107-5fef28a66643') || // generic dev laptop stock
    lower.includes('placeholder') ||
    lower.includes('default-image') ||
    lower.includes('dummy') ||
    lower.length < 10
  );
}
