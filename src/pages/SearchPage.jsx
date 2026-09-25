import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Sparkles, BookOpen, Clock, X, TrendingUp } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    async function executeSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const matches = await articleService.searchArticles(query, {
          category: activeCategory,
          type: activeType
        });
        setResults(matches);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [query, activeCategory, activeType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchParams({});
    setResults([]);
  };

  const searchSuggestions = [
    'Cricket', 'Artificial Intelligence', 'Space & NASA', 
    'India', 'Stock Market', 'DEV Community', 'World News'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header and Input */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-sans-clean font-bold uppercase tracking-widest text-[#a91b0d] dark:text-rose-400">
            Real-Time Archive Search
          </span>
          <h1 className="font-serif text-3xl font-black text-slate-900 dark:text-white">
            Search NewsAxis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search 450+ live-synced global news articles, dev blogs, and community dispatches.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search breaking stories, technology, authors, or beats..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-24 py-3.5 text-base text-slate-900 dark:text-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#a91b0d] transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
          
          <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Trending topics:</span>
          {searchSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchTerm(tag);
                setSearchParams({ q: tag });
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#a91b0d] hover:text-white dark:hover:bg-[#a91b0d] text-[11px] font-medium transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results and Category Filter Bar */}
      <div>
        {query && (
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Results for "{query}" ({results.length} matches)
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
              {[
                { id: 'all', label: 'All Beats' },
                { id: 'sports', label: '⚽ Sports' },
                { id: 'technology', label: '💻 Tech & AI' },
                { id: 'programming', label: '👨‍💻 Dev Blogs' },
                { id: 'india', label: '🇮🇳 India' },
                { id: 'world', label: '🌍 World' },
                { id: 'business', label: '📈 Business' },
                { id: 'science', label: '🔬 Science' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(item => (
              <ArticleCard key={item.id} article={item} showExpiration />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20 space-y-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 max-w-xl mx-auto shadow-xs">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
              No matching dispatches found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We couldn't find any articles matching "<strong>{query}</strong>" in the active 30-minute sync radar.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSearchParams({ q: 'news' })}
                className="text-xs font-bold text-[#a91b0d] dark:text-rose-400 hover:underline cursor-pointer"
              >
                Browse top headlines instead &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            Enter a keyword above to search through real-world dispatches.
          </div>
        )}
      </div>
    </div>
  );
}
