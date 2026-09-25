import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Sparkles, Flame, 
  ArrowRight, ShieldCheck, Mail, ChevronRight, MapPin,
  Clock, RefreshCw, Radio, Layers, BookOpen, Code2
} from 'lucide-react';
import { articleService } from '../services/articleService';
import { BreakingTicker } from '../components/news/BreakingTicker';
import { ArticleCard } from '../components/article/ArticleCard';
import { useGeolocation } from '../hooks/useGeolocation';
import { LiveBreakingTicker } from '../components/live/LiveBreakingTicker';
import { LiveNewsModal, LIVE_NEWS_CHANNELS } from '../components/live/LiveNewsPlayer';

export function HomePage() {
  const { location } = useGeolocation();
  const [feed, setFeed] = useState({
    breaking: [],
    featured: null,
    latest: [],
    trending: [],
    communityBlogs: [],
    all: []
  });
  const [nearbyFeed, setNearbyFeed] = useState({ articles: [], blogs: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const res = await articleService.getHomeFeed();
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
    await articleService.triggerManualSync();
    await loadFeed(true);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  // Filtered stories based on active pill
  const getFilteredStories = () => {
    if (activeFilter === 'breaking') return feed.all.filter(a => a.isBreaking);
    if (activeFilter === 'blogs') return feed.all.filter(a => a.contentType === 'blog' || a.sourceType.includes('blog'));
    if (activeFilter === 'tech') return feed.all.filter(a => a.categoryId === 'technology' || a.categoryId === 'programming');
    if (activeFilter === 'world') return feed.all.filter(a => a.categoryId === 'world');
    if (activeFilter === 'india') return feed.all.filter(a => a.categoryId === 'india' || a.categoryId === 'tamil-nadu');
    if (activeFilter === 'business') return feed.all.filter(a => a.categoryId === 'business');
    return feed.all;
  };

  const filteredItems = getFilteredStories();
  const leadStory = feed.featured || feed.all[0];
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
              EDITION 30-MIN
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
            <Link to="/blogs" className="text-emerald-600 dark:text-emerald-400 hover:underline">DEV BLOGS</Link>
            <span>/</span>
            <Link to="/category/technology" className="hover:underline">TECH & AI</Link>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium normal-case flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-purges & syncs every 30m</span>
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="text-[#a91b0d] dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 1.5 Interactive Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-sans-clean text-xs">
          {[
            { id: 'all', label: 'All Stories' },
            { id: 'live', label: '🔴 Live Broadcasts (Free)' },
            { id: 'breaking', label: '⚡ Breaking' },
            { id: 'blogs', label: '💻 Dev Blogs (DEV & Hashnode)' },
            { id: 'tech', label: 'AI & Technology' },
            { id: 'world', label: 'World News' },
            { id: 'india', label: 'India Edition' },
            { id: 'business', label: 'Business & Markets' }
          ].map(tab => (
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

        {/* When activeFilter is 'live', render dedicated Live News Broadcast Gallery */}
        {activeFilter === 'live' ? (
          <section className="space-y-6 pt-2 pb-8">
            <div className="flex items-center justify-between border-b-2 border-red-600 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-red-600 dark:text-red-400">
                  Free 24/7 Real-World Live News Broadcasts
                </h2>
              </div>
              <button 
                onClick={() => setActiveFilter('all')}
                className="text-xs text-[#a91b0d] dark:text-rose-400 font-bold hover:underline"
              >
                Back to Front Page &rarr;
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Watch real-time live television broadcasts directly from world-renowned news agencies. Zero cost, no sign-up needed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LIVE_NEWS_CHANNELS.map(channel => (
                <div 
                  key={channel.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        LIVE STREAM
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{channel.country}</span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                      {channel.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {channel.description}
                    </p>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => openLiveStream(channel.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Watch Live Broadcast</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : activeFilter !== 'all' ? (
          <section className="space-y-4 pt-2 pb-8">
            <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">
                {activeFilter.toUpperCase()} ({filteredItems.length} items active)
              </h2>
              <button 
                onClick={() => setActiveFilter('all')}
                className="text-xs text-[#a91b0d] dark:text-rose-400 font-bold hover:underline"
              >
                Back to Front Page &rarr;
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <ArticleCard key={item.id} article={item} showExpiration />
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* 2. THE HINDU 3-COLUMN LEAD EDITORIAL GRID */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
              {/* Column 1: Left Wire Stories (3 Cols) */}
              <div className="lg:col-span-3 space-y-4 border-b lg:border-b-0 lg:border-r border-[#e5e7eb] dark:border-[#30363d] pr-0 lg:pr-6">
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

              {/* Column 2: Center Big Lead Headline (6 Cols) */}
              <div className="lg:col-span-6">
                {leadStory ? (
                  <ArticleCard article={leadStory} lead showExpiration />
                ) : (
                  <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                )}
              </div>

              {/* Column 3: Right Opinion & Visual Spot (3 Cols) */}
              <div className="lg:col-span-3 space-y-4 border-t lg:border-t-0 lg:border-l border-[#e5e7eb] dark:border-[#30363d] pl-0 lg:pl-6">
                <div className="bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] p-4 text-center space-y-2 rounded-sm">
                  <span className="text-[10px] font-sans-clean font-bold tracking-widest text-[#a91b0d] dark:text-rose-400 uppercase flex items-center justify-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> 30-MIN DATABASE SNAPSHOT
                  </span>
                  <h4 className="font-headline font-bold text-base text-[#111827] dark:text-[#f0f6fc] leading-snug">
                    NewsAxis Live Wire: BBC, The Hindu, DEV & Google News
                  </h4>
                  <p className="font-body-serif text-xs text-[#4b5563] dark:text-[#8b949e]">
                    Every 30 minutes, old news & blogs are purged from database servers and replaced with fresh real-world dispatches.
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
            <section className="bg-slate-900 text-white rounded-lg p-6 sm:p-7 space-y-5 border border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Code2 className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-2xl font-black text-white">
                        Developer & Tech Blogs
                      </h3>
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans-clean">
                        Real-World API
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans-clean mt-0.5">
                      Live posts streamed from <strong>DEV Community</strong>, <strong>Hashnode</strong>, & <strong>Hacker News</strong>
                    </p>
                  </div>
                </div>

                <Link
                  to="/blogs"
                  className="inline-flex items-center gap-1.5 text-xs font-sans-clean font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
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

            {/* 8. COMMUNITY DISPATCHES SECTION (30-MIN RETENTION) */}
            <section className="bg-[#f8f9fa] dark:bg-[#161b22] border-t-2 border-b-2 border-[#a91b0d] p-6 space-y-4 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb] dark:border-[#30363d] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#a91b0d] text-white text-[10px] font-sans-clean font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      COMMUNITY VOICES
                    </span>
                    <span className="text-xs font-sans-clean text-slate-500">
                      Strict 30-Minute Ephemeral Lifecycle
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
