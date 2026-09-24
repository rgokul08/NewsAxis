import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, ExternalLink } from 'lucide-react';
import { articleService } from '../../services/articleService';

export function ArticleCard({ article, compact = false, showExpiration = false, lead = false }) {
  const [isBookmarked, setIsBookmarked] = useState(() => articleService.isBookmarked(article?.id));

  if (!article) return null;

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = articleService.toggleBookmark(article);
    setIsBookmarked(res.isBookmarked);
  };

  const articleLink = `/article/${article.slug}`;

  // Expiration for 72-hour community articles
  let expirationBadge = null;
  if (showExpiration || article.sourceType?.startsWith('community')) {
    if (article.expiresAt) {
      const msLeft = new Date(article.expiresAt).getTime() - Date.now();
      if (msLeft > 0) {
        const h = Math.floor(msLeft / (1000 * 60 * 60));
        const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        expirationBadge = `${h}h ${m}m left`;
      } else {
        expirationBadge = 'Expired';
      }
    }
  }

  // 1. Compact Sidebar Article (Classic The Hindu 2-column or list view)
  if (compact) {
    return (
      <article className="group py-3 border-b border-[#e5e7eb] dark:border-[#30363d] last:border-b-0">
        <div className="flex items-center gap-1.5 text-[11px] font-sans-clean font-bold uppercase tracking-wider text-[#a91b0d] dark:text-rose-400 mb-1">
          <span>{article.categorySlug || 'NEWS'}</span>
          {expirationBadge && (
            <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 px-1 rounded">
              {expirationBadge}
            </span>
          )}
        </div>
        <Link to={articleLink}>
          <h4 className="font-headline font-bold text-sm sm:text-[15px] leading-snug text-[#111827] dark:text-[#f0f6fc] group-hover:text-[#a91b0d] dark:group-hover:text-rose-400 transition-colors line-clamp-3">
            {article.title}
          </h4>
        </Link>
        <div className="mt-1 flex items-center justify-between text-[11px] text-[#6b7280] dark:text-[#8b949e] font-sans-clean">
          <span className="uppercase text-[10px] font-semibold text-slate-500">{article.sourceName}</span>
          <span>{article.readingTime || 3}m read</span>
        </div>
      </article>
    );
  }

  // 2. Lead Headline Column (Dominant Editorial Masthead story)
  if (lead) {
    return (
      <article className="group space-y-3 pb-6 border-b lg:border-b-0 lg:border-r border-[#e5e7eb] dark:border-[#30363d] pr-0 lg:pr-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans-clean font-bold uppercase tracking-wider text-[#a91b0d] dark:text-rose-400">
            {article.categorySlug || 'LEAD REPORT'}
          </span>
          <button
            onClick={handleBookmarkToggle}
            className="text-slate-400 hover:text-[#a91b0d] transition-colors"
            title="Bookmark"
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        <Link to={articleLink}>
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl text-[#111827] dark:text-[#f0f6fc] group-hover:text-[#a91b0d] dark:group-hover:text-rose-400 transition-colors leading-[1.18]">
            {article.title}
          </h2>
        </Link>

        {article.imageUrl && (
          <Link to={articleLink} className="block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800 my-3">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&q=80'; }}
            />
          </Link>
        )}

        <p className="font-body-serif text-sm sm:text-base text-[#374151] dark:text-[#c9d1d9] leading-relaxed line-clamp-3">
          {article.summary || article.excerpt}
        </p>

        <div className="pt-2 flex items-center justify-between text-xs text-[#6b7280] dark:text-[#8b949e] font-sans-clean border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-800 dark:text-slate-300 uppercase text-[11px]">
            {article.sourceName} • By {article.authorName}
          </span>
          {expirationBadge && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
              {expirationBadge}
            </span>
          )}
        </div>
      </article>
    );
  }

  // 3. Standard Hindu Newspaper Grid Card (Clean serif, crisp hairline dividers)
  return (
    <article className="group flex flex-col justify-between h-full pb-4 border-b border-[#e5e7eb] dark:border-[#30363d]">
      <div className="space-y-2">
        {article.imageUrl && (
          <Link to={articleLink} className="block aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80'; }}
            />
          </Link>
        )}

        <div className="flex items-center justify-between text-[11px] font-sans-clean">
          <span className="font-bold uppercase tracking-wider text-[#a91b0d] dark:text-rose-400">
            {article.categorySlug || 'NEWS'}
          </span>
          <button
            onClick={handleBookmarkToggle}
            className="text-slate-400 hover:text-[#a91b0d] transition-colors"
            title="Bookmark"
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        <Link to={articleLink}>
          <h3 className="font-headline font-bold text-base sm:text-lg leading-snug text-[#111827] dark:text-[#f0f6fc] group-hover:text-[#a91b0d] dark:group-hover:text-rose-400 transition-colors line-clamp-3">
            {article.title}
          </h3>
        </Link>

        <p className="font-body-serif text-xs text-[#4b5563] dark:text-[#8b949e] line-clamp-2 leading-relaxed">
          {article.summary || article.excerpt}
        </p>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#6b7280] dark:text-[#8b949e] font-sans-clean">
        <span className="truncate max-w-[140px] uppercase text-[10px] font-bold text-slate-700 dark:text-slate-300">
          {article.sourceName}
        </span>
        {expirationBadge ? (
          <span className="font-bold text-amber-700 dark:text-amber-400 text-[10px]">
            {expirationBadge}
          </span>
        ) : (
          <span>{article.readingTime || 3} min read</span>
        )}
      </div>
    </article>
  );
}
