import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, PenSquare, Clock, Code2, Sparkles, RefreshCw } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';
import { Button } from '../components/common/UIComponents';

export function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const feed = await articleService.getHomeFeed();
        setBlogs(feed.communityBlogs);
      } catch (err) {
        console.error('Community blogs load error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredBlogs = blogs.filter(b => {
    if (filter === 'dev') return b.providerId === 'dev_to' || b.sourceName?.includes('DEV');
    if (filter === 'hashnode') return b.providerId === 'hashnode' || b.sourceName?.includes('Hashnode');
    if (filter === 'community') return b.sourceType === 'community_blog';
    return true;
  });

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 space-y-7 font-sans-clean">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" /> Real-World Engineering & Tech Blogs
            </span>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
              30-MIN CYCLE
            </span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
            Developer Blogs & Perspectives
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Live technical articles streamed from DEV.to, Hashnode, and independent contributors. In accordance with our real-time policy, content auto-updates and rotates every 30 minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/write">
            <Button variant="primary" icon={PenSquare}>Submit Blog</Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
        {[
          { id: 'all', label: `All Blogs (${blogs.length})` },
          { id: 'dev', label: 'DEV Community' },
          { id: 'hashnode', label: 'Hashnode' },
          { id: 'community', label: 'Community Authors' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      ) : filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map(post => (
            <ArticleCard key={post.id} article={post} showExpiration />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          <Flame className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No blogs currently in this category</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            New blogs are fetched continuously from real-world APIs and updated every 30 minutes.
          </p>
          <Link to="/write">
            <Button variant="primary">Write First Story</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
