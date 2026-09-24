import React, { useEffect, useState } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';

export function TrendingPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const feed = await articleService.getHomeFeed();
        setArticles(feed.trending);
      } catch (err) {
        console.error('Trending load error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-serif text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-500" /> Trending Intelligence
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ranked using NewsAxis dynamic gravity decay formula incorporating verified reader engagement, bookmarks, reactions, and story recency.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((story, i) => (
            <div key={story.id} className="relative">
              <span className="absolute -top-3 -left-2 z-10 w-7 h-7 rounded-full bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white dark:border-slate-900">
                #{i + 1}
              </span>
              <ArticleCard article={story} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
