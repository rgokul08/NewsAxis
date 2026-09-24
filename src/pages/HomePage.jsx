import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Sparkles, Flame, Clock, Compass, 
  ArrowRight, ShieldCheck, Mail, CheckCircle2, ChevronRight, Bookmark
} from 'lucide-react';
import { articleService } from '../services/articleService';
import { BreakingTicker } from '../components/news/BreakingTicker';
import { ArticleCard } from '../components/article/ArticleCard';
import { CATEGORIES } from '../constants/categories';

export function HomePage() {
  const [feed, setFeed] = useState({
    breaking: [],
    featured: null,
    latest: [],
    trending: [],
    communityBlogs: [],
    all: []
  });
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await articleService.getHomeFeed();
        setFeed(res);
      } catch (err) {
        console.error('Home feed loading failure', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const leadStory = feed.featured || feed.all[0];
  const sideStories = feed.latest.slice(0, 4);
  const secondaryStories = feed.all.slice(1, 4);
  const indiaStories = feed.all.filter(a => a.categoryId === 'india' || a.categoryId === 'tamil-nadu').slice(0, 4);
  const worldStories = feed.all.filter(a => a.categoryId === 'world').slice(0, 4);
  const techStories = feed.all.filter(a => a.categoryId === 'technology' || a.categoryId === 'artificial-intelligence').slice(0, 4);

  return (
    <div className="bg-[#fcfcfc] dark:bg-[#0d1117] min-h-screen text-[#111827] dark:text-[#f0f6fc] transition-colors pb-16">
      {/* 1. Breaking News Strip */}
      <BreakingTicker items={feed.breaking} />

      {/* Main Newspaper Broadside Container */}
      <main className="max-w-[1240px] mx-auto px-4 pt-4 space-y-8">
        
        {/* Breadcrumb / Section Header Line like "NEWS / INDIA / WORLD / STATES / CITIES" */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] dark:border-[#30363d] pb-2 text-[11px] font-sans-clean font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#8b949e]">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-slate-900 dark:text-white">NEWS</Link>
            <span>/</span>
            <Link to="/category/india" className="text-[#a91b0d] hover:underline">INDIA</Link>
            <span>/</span>
            <Link to="/category/world" className="hover:underline">WORLD</Link>
            <span>/</span>
            <Link to="/category/tamil-nadu" className="hover:underline">TAMIL NADU</Link>
            <span>/</span>
            <Link to="/category/technology" className="hover:underline">TECH & AI</Link>
          </div>
          <span className="hidden sm:inline text-[#a91b0d] font-bold">
            NEWSAXIS DIGITAL EDITION
          </span>
        </div>

        {/* 2. THE HINDU 3-COLUMN LEAD EDITORIAL GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
          {/* Column 1: Left Wire Stories (3 Cols) */}
          <div className="lg:col-span-3 space-y-4 border-b lg:border-b-0 lg:border-r border-[#e5e7eb] dark:border-[#30363d] pr-0 lg:pr-6">
            <h3 className="text-xs font-sans-clean font-black uppercase tracking-wider text-[#a91b0d] pb-1 border-b border-[#a91b0d]">
              Top Dispatches
            </h3>
            <div className="divide-y divide-[#e5e7eb] dark:divide-[#30363d]">
              {sideStories.map(story => (
                <ArticleCard key={story.id} article={story} compact />
              ))}
            </div>
          </div>

          {/* Column 2: Center Big Lead Headline (6 Cols) */}
          <div className="lg:col-span-6">
            {leadStory ? (
              <ArticleCard article={leadStory} lead />
            ) : (
              <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse" />
            )}
          </div>

          {/* Column 3: Right Opinion & Visual Spot (3 Cols) */}
          <div className="lg:col-span-3 space-y-4 border-t lg:border-t-0 lg:border-l border-[#e5e7eb] dark:border-[#30363d] pl-0 lg:pl-6">
            <div className="bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] p-4 text-center space-y-2">
              <span className="text-[10px] font-sans-clean font-bold tracking-widest text-[#a91b0d] uppercase">
                EDITORIAL DIGEST
              </span>
              <h4 className="font-headline font-bold text-base text-[#111827] dark:text-[#f0f6fc] leading-snug">
                NewsAxis Briefing: Independent Journalism & Attributed Feeds
              </h4>
              <p className="font-body-serif text-xs text-[#4b5563] dark:text-[#8b949e]">
                Real-time reports aggregated from over 10 global partners alongside community perspectives.
              </p>
            </div>

            <div className="divide-y divide-[#e5e7eb] dark:divide-[#30363d]">
              {secondaryStories.map(story => (
                <ArticleCard key={story.id} article={story} compact />
              ))}
            </div>
          </div>
        </section>

        {/* 3. INDIA COVERAGE BANNER (THE HINDU EMBLEMATIC SECTION) */}
        <section className="space-y-4 pt-4 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
          <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
            <div className="flex items-center gap-3">
              <span className="font-headline text-2xl font-black text-[#a91b0d] dark:text-rose-400">
                India
              </span>
              <span className="text-xs font-sans-clean text-[#6b7280] hidden sm:inline">
                National news, governance, Parliament, and policy decisions
              </span>
            </div>
            <Link to="/category/india" className="text-xs font-sans-clean font-bold text-[#a91b0d] hover:underline flex items-center gap-1">
              More in India <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {indiaStories.map(story => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>

        {/* 4. WORLD & GLOBAL AFFAIRS SECTION */}
        <section className="space-y-4 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
          <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
            <span className="font-headline text-2xl font-black text-[#111827] dark:text-[#f0f6fc]">
              World
            </span>
            <Link to="/category/world" className="text-xs font-sans-clean font-bold text-[#a91b0d] hover:underline flex items-center gap-1">
              More in World <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {worldStories.map(story => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>

        {/* 5. 72-HOUR COMMUNITY DISPATCHES SECTION */}
        <section className="bg-[#f8f9fa] dark:bg-[#161b22] border-t-2 border-b-2 border-[#a91b0d] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb] dark:border-[#30363d] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#a91b0d] text-white text-[10px] font-sans-clean font-black uppercase tracking-wider px-2 py-0.5">
                  COMMUNITY VOICES
                </span>
                <span className="text-xs font-sans-clean text-slate-500">
                  Strict 72-Hour Ephemeral Retention Policy
                </span>
              </div>
              <h3 className="font-headline text-2xl font-bold text-[#111827] dark:text-[#f0f6fc] mt-1">
                Stories Authored by NewsAxis Contributors
              </h3>
            </div>
            <Link
              to="/write"
              className="text-xs font-sans-clean font-bold px-3 py-1.5 bg-[#a91b0d] hover:bg-[#8e1509] text-white uppercase tracking-wider rounded"
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

        {/* 6. TECHNOLOGY & ARTIFICIAL INTELLIGENCE SECTION */}
        <section className="space-y-4 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
          <div className="flex items-center justify-between border-b-2 border-[#111827] dark:border-[#30363d] pb-2">
            <span className="font-headline text-2xl font-black text-[#111827] dark:text-[#f0f6fc]">
              Science & Technology
            </span>
            <Link to="/category/technology" className="text-xs font-sans-clean font-bold text-[#a91b0d] hover:underline flex items-center gap-1">
              More Science & Tech <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStories.map(story => (
              <ArticleCard key={story.id} article={story} />
            ))}
          </div>
        </section>

        {/* 7. CLASSIC EDITORIAL NEWSLETTER SIGNUP */}
        <section className="border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-8 text-center max-w-2xl mx-auto shadow-sm">
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
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold font-sans-clean">
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
                className="px-5 py-2 bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold uppercase tracking-wider rounded"
              >
                SUBSCRIBE
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
