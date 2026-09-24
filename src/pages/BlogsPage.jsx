import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, PenSquare, Clock } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';
import { Button } from '../components/common/UIComponents';

export function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
            NewsAxis Community
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
            Community Blogs & Stories
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Perspectives, engineering tutorials, and member dispatches. In accordance with our safety rules, user stories remain active for 72 hours.
          </p>
        </div>

        <Link to="/write">
          <Button variant="primary" icon={PenSquare}>Submit Story</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(post => (
            <ArticleCard key={post.id} article={post} showExpiration />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-3">
          <Flame className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Be the first to publish a community story</p>
          <Link to="/write">
            <Button variant="primary">Start Writing</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
