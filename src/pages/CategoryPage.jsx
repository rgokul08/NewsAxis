import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Radio, Tv } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';
import { CATEGORIES } from '../constants/categories';
import { LiveNewsModal } from '../components/live/LiveNewsPlayer';

export function CategoryPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveOpen, setLiveOpen] = useState(false);

  const category = CATEGORIES.find(c => c.slug === slug) || {
    name: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Category',
    description: 'Latest dispatches and reported articles.'
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await articleService.getByCategory(slug);
        setArticles(res.items);
      } catch (e) {
        console.error('Category load error', e);
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  const isWorld = slug === 'world';
  const isIndia = slug === 'india' || slug === 'tamil-nadu';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Category Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs uppercase font-bold tracking-widest text-sky-600 dark:text-sky-400">
          NewsAxis Beat Coverage
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
          {category.name}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
          {category.description}
        </p>
      </div>

      {/* Live Stream Banner for World News */}
      {isWorld && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/10 via-red-600/5 to-transparent border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping shrink-0" />
            <div>
              <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Live World News Broadcasts</span>
                <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded font-bold">BBC • Sky News • DW News</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stream 24/7 global breaking reports, press briefings, and ground dispatches free.</p>
            </div>
          </div>
          <button
            onClick={() => setLiveOpen(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Watch BBC & World Live TV</span>
          </button>
        </div>
      )}

      {/* Live Stream Banner for India News */}
      {isIndia && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600/10 via-orange-600/5 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-600 animate-ping shrink-0" />
            <div>
              <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Live India National Broadcasts</span>
                <span className="text-[10px] bg-orange-600 text-white font-mono px-2 py-0.5 rounded font-bold">India Today • NDTV • DD News</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stream real-time national bulletins, parliamentary sessions, and breaking regional updates free.</p>
            </div>
          </div>
          <button
            onClick={() => setLiveOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Watch India Live TV</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(story => (
            <ArticleCard key={story.id} article={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500">No stories currently filed under {category.name}.</p>
          <Link to="/" className="text-sky-600 dark:text-sky-400 font-bold hover:underline text-sm">
            Return to Top Stories
          </Link>
        </div>
      )}

      {/* Free Live News Modal */}
      <LiveNewsModal
        isOpen={liveOpen}
        onClose={() => setLiveOpen(false)}
        initialRegion={isIndia ? 'india' : 'world'}
        initialChannelId={isIndia ? 'india_today' : 'bbc_news'}
      />
    </div>
  );
}
