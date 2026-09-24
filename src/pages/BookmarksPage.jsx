import React, { useEffect, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { articleService } from '../services/articleService';
import { ArticleCard } from '../components/article/ArticleCard';

export function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    setBookmarks(articleService.getBookmarks());
  }, []);

  const clearAll = () => {
    localStorage.removeItem('newsaxis_local_bookmarks');
    setBookmarks([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-serif text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-sky-500" /> Saved Articles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal reading list saved locally on your device.
          </p>
        </div>

        {bookmarks.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map(story => (
            <ArticleCard key={story.id} article={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-2">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No saved stories yet</p>
          <p className="text-xs text-slate-500">Tap the bookmark icon on any headline card to save it for offline reading.</p>
        </div>
      )}
    </div>
  );
}
