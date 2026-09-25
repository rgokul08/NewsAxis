import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';

export function LatestPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const feed = await articleService.getHomeFeed();
        setArticles(feed.latest);
      } catch (err) {
        console.error('Latest load error', err);
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
          <Clock className="w-6 h-6 text-sky-500" /> Latest Dispatches
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Chronological stream of breaking headlines and reports aggregated across verified global and domestic feeds.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(story => (
            <ArticleCard key={story.id} article={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500">No active news items in the current 30-minute radar.</p>
        </div>
      )}
    </div>
  );
}
