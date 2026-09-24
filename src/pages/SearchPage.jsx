import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function executeSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const feed = await articleService.getHomeFeed();
        const q = query.toLowerCase();
        const matches = feed.all.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q) ||
          a.authorName?.toLowerCase().includes(q) ||
          a.categorySlug?.toLowerCase().includes(q) ||
          a.sourceName?.toLowerCase().includes(q)
        );
        setResults(matches);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news, topics, authors, beats..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-12 pr-6 py-3.5 text-base text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
        </form>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          {query ? `Search results for "${query}" (${results.length})` : 'Type a query to search NewsAxis'}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(item => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-16 text-slate-500">
            No matching dispatches found for "{query}". Try a different keyword or topic.
          </div>
        ) : null}
      </div>
    </div>
  );
}
