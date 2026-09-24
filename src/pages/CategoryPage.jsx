import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';
import { CATEGORIES } from '../constants/categories';

export function CategoryPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
