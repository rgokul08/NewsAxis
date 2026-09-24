import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants/categories';

export function CategoriesIndexPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-serif text-3xl font-black text-slate-900 dark:text-white">
          All NewsAxis Coverage Beats
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore specialized dispatches categorized by domain and region.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className="group p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 shadow-sm hover:shadow-md transition-all space-y-2 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {cat.description}
              </p>
            </div>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Browse Beat →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
