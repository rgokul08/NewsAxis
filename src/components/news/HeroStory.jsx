import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bookmark, Share2, ArrowRight } from 'lucide-react';
import { Badge } from '../common/UIComponents';
import { articleService } from '../../services/articleService';

export function HeroStory({ article }) {
  if (!article) return null;

  return (
    <section className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-white shadow-xl group">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left Editorial Content */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between z-10 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-sky-600 text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
                {article.categorySlug || 'Lead Story'}
              </span>
              {article.isBreaking && (
                <Badge variant="breaking">Breaking Alert</Badge>
              )}
              <span className="text-xs text-slate-400 font-medium">
                {article.sourceName}
              </span>
            </div>

            <Link to={`/article/${article.slug}`}>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-white group-hover:text-sky-400 transition-colors leading-tight mb-4">
                {article.title}
              </h1>
            </Link>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
              {article.summary || article.excerpt}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-bold text-white">{article.authorName}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {article.readingTime || 4} min read
                  </span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Link
              to={`/article/${article.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-sky-600/30"
            >
              <span>Read Full Story</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right High-Impact Cover Image */}
        <div className="lg:col-span-6 relative h-64 lg:h-auto overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 lg:hidden" />
        </div>
      </div>
    </section>
  );
}
