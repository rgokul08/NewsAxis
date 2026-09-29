import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ChevronRight, MapPin,
  RefreshCw, Radio, Code2, CheckCircle2
} from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';
import { useGeolocation } from '../hooks/useGeolocation';
import { LiveBreakingTicker } from '../components/live/LiveBreakingTicker';
import { LiveNewsModal, LiveNewsSection } from '../components/live/LiveNewsPlayer';
import { formatIST } from '../utils/istDate';

export function HomePage() {
  const { location } = useGeolocation();
  const [feed, setFeed] = useState({
    breaking: [],
    featured: null,
    latest: [],
    trending: [],
    communityBlogs: [],
    all: [],
    lastSyncIST: ''
  });
  const [nearbyFeed, setNearbyFeed] = useState({ articles: [], blogs: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [liveStreamOpen, setLiveStreamOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState('sky_news');

  const openLiveStream = (channelId = 'sky_news') => {
    setSelectedChannelId(channelId);
    setLiveStreamOpen(true);
  };

  const loadFeed = async (forceServer = false) => {
    try {
      if (forceServer) setRefreshing(true);
      const res = await articleService.getHomeFeed({ forceFresh: forceServer });
      setFeed(res);
    } catch (err) {
      console.error('Home feed loading failure', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();

    // Auto-refresh feed every 30 minutes in browser
    const cycleInterval = setInterval(() => {
      loadFeed();
    }, 30 * 60 * 1000);

    return () => clearInterval(cycleInterval);
  }, []);

  useEffect(() => {
    async function loadNearby() {
      try {
        const res = await articleService.getNearbyFeed(location);
        setNearbyFeed(res);
      } catch (err) {
        console.warn('Failed to load nearby feed', err);
      }
    }
    loadNearby();
  }, [location.city, location.region]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setSyncNotice('');
    try {
      const freshFeed = await articleService.triggerManualSync();
      if (freshFeed && Array.isArray(freshFeed.all)) {
        setFeed(freshFeed);
      } else {
        await loadFeed(true);
      }
      setSyncNotice('✓ Fresh news updated from live feeds & database');
      setTimeout(() => setSyncNotice(''), 4000);
    } catch (err) {
      console.error('Manual refresh failure', err);
      setSyncNotice('Refresh failed. Please check connection.');
      setTimeout(() => setSyncNotice(''), 4000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  // Comprehensive Category Filter Pills
  const filterTabs = [
    { id: 'all', label: 'All Stories' },
    { id: 'live', label: '🔴 Live TV' },
    { id: 'breaking', label: '⚡ Breaking' },
    { id: 'india', label: 'India' },
    { id: 'world', label: 'World' },
    { id: 'politics', label: 'Politics' },
    { id: 'business', label: 'Business' },
    { id: 'markets', label: 'Markets' },
    { id: 'trade', label: 'Trade' },
    { id: 'tech', label: 'Technology & AI' },
    { id: 'sports', label: 'Sports' },
    { id: 'health', label: 'Health' },
    { id: 'science', label: 'Science' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'education', label: 'Education' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'blogs', label: '💻 Dev Blogs' }
  ];

  // Filtered stories based on active pill
  const getFilteredStories = () => {
    if (activeFilter === 'breaking') return feed.all.filter(a => a.isBreaking || a.categoryId === 'breaking');
    if (activeFilter === 'blogs') return feed.all.filter(a => a.contentType === 'blog' || (a.sourceType && a.sourceType.includes('blog')));
    if (activeFilter === 'tech') return feed.all.filter(a => a.categoryId === 'technology' || a.categoryId === 'programming');
    if (activeFilter === 'world') return feed.all.filter(a => a.categoryId === 'world');
    if (activeFilter === 'india') return feed.all.filter(a => a.categoryId === 'india' || a.categoryId === 'tamil-nadu');
    if (activeFilter === 'politics') return feed.all.filter(a => a.categoryId === 'politics');
    if (activeFilter === 'business') return feed.all.filter(a => a.categoryId === 'business' || a.categoryId === 'economy');
    if (activeFilter === 'markets') return feed.all.filter(a => a.categoryId === 'markets' || a.categoryId === 'finance');
    if (activeFilter === 'trade') return feed.all.filter(a => a.categoryId === 'trade');
    if (activeFilter === 'sports') return feed.all.filter(a => a.categoryId === 'sports');
    if (activeFilter === 'health') return feed.all.filter(a => a.categoryId === 'health');
    if (activeFilter === 'science') return feed.all.filter(a => a.categoryId === 'science' || a.categoryId === 'environment');
    if (activeFilter === 'entertainment') return feed.all.filter(a => a.categoryId === 'entertainment');
    if (activeFilter === 'education') return feed.all.filter(a => a.categoryId === 'education');
    if (activeFilter === 'lifestyle') return feed.all.filter(a => a.categoryId === 'lifestyle' || a.categoryId === 'travel');
    return feed.all;
  };

  const filteredItems = getFilteredStories();
  const leadStory = feed.all[0] || feed.featured || null;
  const sideStories = feed.latest.slice(0, 4);
  const secondaryStories = feed.all.slice(1, 4);
  const devBlogs = feed.all.filter(a => a.contentType === 'blog' || a.sourceType.includes('blog')).slice(0, 6);
  const indiaStories = feed.all.filter(a => a.categoryId === 'india' || a.categoryId === 'tamil-nadu').slice(0, 4);
  const worldStories = feed.all.filter(a => a.categoryId === 'world').slice(0, 4);
  const techStories = feed.all.filter(a => a.categoryId === 'technology').slice(0, 4);

  return (
    <div className="bg-[#fcfcfc] dark:bg-[#0d1117] min-h-screen text-[#111827] dark:text-[#f0f6fc] transition-colors pb-16">
      
      {/* 1. Live Breaking News Ticker Strip & Broadcast Bar */}
      <LiveBreakingTicker articles={feed.all} onOpenLiveStream={() => openLiveStream('sky_news')} />

      {/* Main Newspaper Broadside Container */}
      <main className="max-w-[1240px] mx-auto px-4 pt-4 space-y-7">
        
        {/* Modern Breadcrumb / 30-Min Pulse Status Line */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#e5e7eb] dark:border-[#30363d] pb-2.5 text-[11px] font-sans-clean font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#8b949e] gap-2">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              EDITION 30-MIN IST
            </Link>
            <span>/</span>
            <Link to="/category/india" className="text-[#a91b0d] dark:text-rose-400 hover:underline">INDIA</Link>
            <span>/</span>
            <Link to="/category/world" className="hover:underline">WORLD</Link>
            <span>/</span>
            <button onClick={() => openLiveStream('sky_news')} className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-bold cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              LIVE TV
            </button>
            <span>/</span>
            <Link to="/blogs" className="text-[#a91b0d] dark:text-rose-400 hover:underline">DEV BLOGS</Link>
            <span>/</span>
            <Link to="/category/technology" className="hover:underline">TECH & AI</Link>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {syncNotice && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {syncNotice}
              </span>
            )}
            <span className="text-slate-500 hidden sm:inline">
              Updated: {feed.lastSyncIST || formatIST(new Date())}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="text-[#a91b0d] dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              title="Refresh latest news from Appwrite"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 1.5 Interactive Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-sans-clean text-xs">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* When activeFilter is 'live', render dedicated Live Television Section with side channel menu bar */}
        {activeFilter === 'live' ? (
          <LiveNewsSection 
            initialChannelId={selectedChannelId || 'sky_news'}
            onBackToHome={() => setActiveFilter('all')} 
          />
        ) : activeFilter !== 'all' ? (
          <section className="space-y-4 pt-2 pb-8">
            <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">
                {activeFilter.toUpperCase()} ({filteredItems.length} items active)
              </h2>
              <button 
                onClick={() => setActiveFilter('all')}
                className="text-xs text-[#a91b0d] dark:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                Back to Front Page &rarr;
              </button>
            </div>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <ArticleCard key={item.id} article={item} showExpiration />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <p>No active stories currently under {activeFilter}.</p>
                <button 
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="text-xs font-bold text-[#a91b0d] hover:underline cursor-pointer"
                >
                  Sync Latest News &rarr;
                </button>
              </div>
            )}
          </section>
        ) : loading ? (
          <div className="space-y-6 animate-pulse py-8">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded md:col-span-2" />
              <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ) : feed.all.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#a91b0d]/10 text-[#a91b0d] dark:text-rose-400 flex items-center justify-center mx-auto">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="font-serif text-2xl font-black text-slate-900 dark:text-white">
              Appwrite Live News Pipeline Ready
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The live news pipeline is configured. Click below to fetch real-world news from verified global sources (BBC, The Hindu, Google News, DEV.to, TechCrunch), normalize the content, and store it in your Appwrite database.
            </p>
            <div className="pt-2">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#a91b0d] hover:bg-[#8e1509] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Syncing Real News to Appwrite...' : 'Fetch Live News & Store to Appwrite'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 2. THE HINDU 3-COLUMN LEAD EDITORIAL GRID */}
            <section className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 pt-2 pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
              {/* Column 1: Left Wire Stories (3 Cols on desktop, 6 Cols on tablet) */}
              <div className="col-span-1 md:col-span-6 lg:col-span-3 space-y-4 border-b md:border-b-0 md:border-r border-[#e5e7eb] dark:border-[#30363d] pr-0 md:pr-4 lg:pr-6 order-2 lg:order-1">
                <div className="flex items-center justify-between border-b border-[#a91b0d] pb-1">
                  <h3 className="text-xs font-sans-clean font-black uppercase tracking-wider text-[#a91b0d] dark:text-rose-400">
                    Live Wire Dispatches
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">30M CYCLE</span>
                </div>
                <div className="divide-y divide-[#e5e7eb] dark:divide-[#30363d]">
                  {sideStories.map(story => (
                    <ArticleCard key={story.id} article={story} compact showExpiration />
                  ))}
                </div>
              </div>

              {/* Column 2: Center Big Lead Headline (6 Cols on desktop, 12 Cols on tablet, top on mobile) */}
              <div className="col-span-1 md:col-span-12 lg:col-span-6 order-1 lg:order-2">
                {leadStory ? (
                  <ArticleCard article={leadStory} lead showExpiration />
                ) : (
                  <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                )}
              </div>

              {/* Column 3: Right Opinion & Visual Spot (3 Cols on desktop, 6 Cols on tablet) */}
              <div className="col-span-1 md:col-span-6 lg:col-span-3 space-y-4 border-t md:border-t-0 md:border-l lg:border-l border-[#e5e7eb] dark:border-[#30363d] pl-0 md:pl-4 lg:pl-6 order-3 lg:order-3">
                <div className="bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] p-4 text-center space-y-2 rounded-sm">
                  <span className="text-[10px] font-sans-clean font-bold tracking-widest text-[#a91b0d] dark:text-rose-400 uppercase flex items-center justify-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> 30-MIN APPWRITE SNAPSHOT
                  </span>
                  <h4 className="font-headline font-bold text-base text-[#111827] dark:text-[#f0f6fc] leading-snug">
                    NewsAxis Live Wire: BBC, The Hindu, DEV & Google News
                  </h4>
                  <p className="font-body-serif text-xs text-[#4b5563] dark:text-[#8b949e]">
                    Every 30 minutes, real-world dispatches are fetched, normalized, and updated in Appwrite Cloud.
                  </p>
                </div>

                <div className="divide-y divide-[#e5e7eb] dark:divide-[#30363d]">
                  {secondaryStories.map(story => (
                    <ArticleCard key={story.id} article={story} compact showExpiration />
                  ))}
                </div>
              </div>
            </section>

            {/* 3. DEDICATED REAL-WORLD DEVELOPER BLOGS SECTION */}
            <section className="space-y-4 pt-3 pb-6 border-b border-[#e5e7eb] dark:border-[#30363d] bg-slate-50/50 dark:bg-[#161b22]/40 p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2.5 gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#a91b0d] dark:text-rose-400">
                    <Code2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-xl sm:text-2xl font-black text-[#111827] dark:text-white leading-tight">
                        Developer & Tech Blogs
                      </h3>
                      <span className="bg-[#a91b0d]/10 dark:bg-rose-950/60 text-[#a91b0d] dark:text-rose-300 border border-[#a91b0d]/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans-clean">
                        Real-World API
                      </span>
                    </div>
                    <p className="text-[11px] font-sans-clean text-slate-500 dark:text-slate-400 mt-0.5">
                      Live dispatches streamed from <strong>DEV Community</strong>, <strong>Medium Tech</strong>, & <strong>Hacker News</strong>
                    </p>
                  </div>
                </div>

                <Link
                  to="/blogs"
                  className="inline-flex items-center gap-1.5 text-xs font-sans-clean font-bold text-[#a91b0d] dark:text-rose-400 hover:underline transition-colors"
                >
                  <span>Explore All Blogs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {devBlogs.map(blog => (
                  <ArticleCard key={blog.id} article={blog} showExpiration />
                ))}
              </div>
            </section>

            {/* 4. NEARBY NEWS & REGIONAL BLOGS (GEOLOCATION POWERED) */}
            <section className="space-y-4 pt-2 pb-6 border-b border-[#e5e7eb] dark:border-[#30363d] bg-slate-50/60 dark:bg-[#161b22]/50 p-4 sm:p-5 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#a91b0d] dark:text-rose-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-headline text-xl sm:text-2xl font-black text-[#111827] dark:text-white leading-tight">
                      Nearby News & Regional Dispatches
                    </h3>
                    <span className="text-[11px] font-sans-clean text-slate-500 dark:text-slate-400">
                      Targeted edition: <strong>{location.city}, {location.region}</strong> ({location.country || 'India'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    to="/category/tamil-nadu" 
                    className="text-xs font-sans-clean font-bold text-[#a91b0d] dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    All Regional Dispatches <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {nearbyFeed.articles.slice(0, 4).map(story => (
                  <ArticleCard key={story.id} article={story} showExpiration />
                ))}
              </div>
            </section>

            {/* 5. INDIA COVERAGE SECTION */}
            <section className="space-y-4 pt-2 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
              <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-headline text-2xl font-black text-[#a91b0d] dark:text-rose-400">
                    India
                  </span>
                  <span className="text-xs font-sans-clean text-[#6b7280] hidden sm:inline">
                    National news, governance, Parliament, and policy decisions
                  </span>
                </div>
                <Link to="/category/india" className="text-xs font-sans-clean font-bold text-[#a91b0d] dark:text-rose-400 hover:underline flex items-center gap-1">
                  More in India <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {indiaStories.map(story => (
                  <ArticleCard key={story.id} article={story} showExpiration />
                ))}
              </div>
            </section>

            {/* 6. WORLD & GLOBAL AFFAIRS SECTION */}
            <section className="space-y-4 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
              <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
                <span className="font-headline text-2xl font-black text-[#111827] dark:text-[#f0f6fc]">
                  World News
                </span>
                <Link to="/category/world" className="text-xs font-sans-clean font-bold text-[#a91b0d] dark:text-rose-400 hover:underline flex items-center gap-1">
                  More in World <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {worldStories.map(story => (
                  <ArticleCard key={story.id} article={story} showExpiration />
                ))}
              </div>
            </section>

            {/* 7. SCIENCE & TECHNOLOGY SECTION */}
            <section className="space-y-4 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
              <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
                <span className="font-headline text-2xl font-black text-[#111827] dark:text-[#f0f6fc]">
                  Science & Technology
                </span>
                <Link to="/category/technology" className="text-xs font-sans-clean font-bold text-[#a91b0d] dark:text-rose-400 hover:underline flex items-center gap-1">
                  More Science & Tech <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {techStories.map(story => (
                  <ArticleCard key={story.id} article={story} showExpiration />
                ))}
              </div>
            </section>

            {/* 8. COMMUNITY DISPATCHES SECTION */}
            <section className="bg-[#f8f9fa] dark:bg-[#161b22] border-t-2 border-b-2 border-[#a91b0d] p-6 space-y-4 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb] dark:border-[#30363d] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#a91b0d] text-white text-[10px] font-sans-clean font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      COMMUNITY VOICES
                    </span>
                    <span className="text-xs font-sans-clean text-slate-500">
                      24-Hour Expiration Lifecycle
                    </span>
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-[#111827] dark:text-[#f0f6fc] mt-1">
                    Stories Authored by NewsAxis Contributors
                  </h3>
                </div>
                <Link
                  to="/write"
                  className="text-xs font-sans-clean font-bold px-3 py-1.5 bg-[#a91b0d] hover:bg-[#8e1509] text-white uppercase tracking-wider rounded transition-colors"
                >
                  Submit Your Story
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {feed.communityBlogs.slice(0, 3).map(post => (
                  <ArticleCard key={post.id} article={post} showExpiration />
                ))}
              </div>
            </section>

            {/* 9. CLASSIC EDITORIAL NEWSLETTER SIGNUP */}
            <section className="border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-8 text-center max-w-2xl mx-auto shadow-sm rounded-sm">
              <span className="text-[11px] font-sans-clean font-black tracking-widest text-[#a91b0d] uppercase">
                DAILY NEWSLETTER
              </span>
              <h3 className="font-headline text-2xl font-bold text-[#111827] dark:text-[#f0f6fc] mt-1 mb-2">
                The NewsAxis Morning Dispatch
              </h3>
              <p className="font-body-serif text-xs text-[#4b5563] dark:text-[#8b949e] max-w-md mx-auto mb-6">
                Start your morning with our essential curated summary of global headlines, policy changes, and technology breakthroughs.
              </p>

              {subscribed ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold font-sans-clean rounded">
                  ✓ You are subscribed to The NewsAxis Morning Dispatch.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto font-sans-clean">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0d1117] px-3 py-2 text-xs rounded focus:outline-none focus:border-[#a91b0d]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    SUBSCRIBE
                  </button>
                </form>
              )}
            </section>
          </>
        )}

      </main>

      {/* Free 24/7 Live World News Streaming Modal */}
      <LiveNewsModal 
        isOpen={liveStreamOpen} 
        onClose={() => setLiveStreamOpen(false)} 
        initialChannelId={selectedChannelId} 
      />
    </div>
  );
}
