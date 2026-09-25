import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, Flame, ExternalLink, Sparkles } from 'lucide-react';
import { articleService } from '../../services/articleService';

export function ArticleCard({ article, compact = false, showExpiration = true, lead = false }) {
  const [isBookmarked, setIsBookmarked] = useState(() => articleService.isBookmarked(article?.id));

  if (!article) return null;

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = articleService.toggleBookmark(article);
    setIsBookmarked(res.isBookmarked);
  };

  const articleLink = `/article/${article.slug}`;

  // 30-Minute Cycle Expiration Badge
  let expirationBadge = null;
  if (article.expiresAt) {
    const msLeft = new Date(article.expiresAt).getTime() - Date.now();
    if (msLeft > 0) {
      const m = Math.floor(msLeft / (1000 * 60));
      const s = Math.floor((msLeft % (1000 * 60)) / 1000);
      if (m < 5) {
        expirationBadge = { text: `${m}m ${s}s left`, urgent: true };
      } else {
        expirationBadge = { text: `${m}m left`, urgent: false };
      }
    } else {
      expirationBadge = { text: 'Purging soon', urgent: true };
    }
  }

  // Publication time relative
  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const timeAgo = getTimeAgo(article.publishedAt || article.createdAt);
  const isDevBlog = article.sourceType === 'external_blog' || article.contentType === 'blog';

  // 1. Compact Sidebar Article
  if (compact) {
    return (
      <article className="group py-3 border-b border-[#e5e7eb] dark:border-[#30363d] last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1.5 -mx-1.5 rounded transition-colors">
        <div className="flex items-center justify-between gap-1 text-[11px] font-sans-clean font-bold uppercase tracking-wider text-[#a91b0d] dark:text-rose-400 mb-1">
          <span className="truncate max-w-[120px]">{article.categorySlug || article.categoryId || 'NEWS'}</span>
          {expirationBadge && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
              expirationBadge.urgent 
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {expirationBadge.text}
            </span>
          )}
        </div>
        <Link to={articleLink}>
          <h4 className="font-headline font-bold text-sm leading-snug text-[#111827] dark:text-[#f0f6fc] group-hover:text-[#a91b0d] dark:group-hover:text-rose-400 transition-colors line-clamp-2">
            {article.title}
          </h4>
        </Link>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6b7280] dark:text-[#8b949e] font-sans-clean">
          <span className="uppercase text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
            {article.sourceName}
          </span>
          <div className="flex items-center gap-2 text-slate-400">
            {timeAgo && <span>{timeAgo}</span>}
            <span>•</span>
            <span>{article.readingTime || 3}m</span>
          </div>
        </div>
      </article>
    );
  }

  // 2. Lead Headline Column (Featured Big Story)
  if (lead) {
    return (
      <article className="group space-y-3.5 pb-6 border-b lg:border-b-0 lg:border-r border-[#e5e7eb] dark:border-[#30363d] pr-0 lg:pr-6">
        <div className="flex items-center justify-between text-xs font-sans-clean">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[#a91b0d] dark:text-rose-400">
              {article.categorySlug || 'LEAD REPORT'}
            </span>
            {isDevBlog && (
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                DEV BLOG
              </span>
            )}
            {expirationBadge && (
              <span className="bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> 30m Cycle: {expirationBadge.text}
              </span>
            )}
          </div>
          <button
            onClick={handleBookmarkToggle}
            className="p-1 text-slate-400 hover:text-[#a91b0d] transition-colors cursor-pointer"
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
          <Link to={articleLink} className="block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-sm my-3 shadow-xs">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&q=80'; }}
            />
          </Link>
        )}

        <p className="font-body-serif text-sm sm:text-base text-[#374151] dark:text-[#c9d1d9] leading-relaxed line-clamp-3">
          {article.summary || article.excerpt}
        </p>

        <div className="pt-2.5 flex items-center justify-between text-xs text-[#6b7280] dark:text-[#8b949e] font-sans-clean border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
            <span className="font-bold text-[#a91b0d] dark:text-rose-400">{article.sourceName}</span>
            <span>•</span>
            <span>By {article.authorName}</span>
          </span>
          <div className="flex items-center gap-2 text-slate-500">
            {timeAgo && <span>{timeAgo}</span>}
            <span>•</span>
            <span>{article.readingTime || 3} min read</span>
          </div>
        </div>
      </article>
    );
  }

  // 3. Standard Hindu Newspaper & Magazine Grid Card
  return (
    <article className="group flex flex-col justify-between h-full pb-4 border-b border-[#e5e7eb] dark:border-[#30363d] hover:bg-slate-50/40 dark:hover:bg-slate-900/30 p-2 -m-2 rounded transition-all">
      <div className="space-y-2">
        {article.imageUrl && (
          <Link to={articleLink} className="block aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-sm mb-2 shadow-2xs">
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80'; }}
            />
          </Link>
        )}

        <div className="flex items-center justify-between text-[11px] font-sans-clean">
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[#a91b0d] dark:text-rose-400">
              {article.categorySlug || article.categoryId || 'NEWS'}
            </span>
            {isDevBlog && (
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded">
                BLOG
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {expirationBadge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                expirationBadge.urgent 
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {expirationBadge.text}
              </span>
            )}
            <button
              onClick={handleBookmarkToggle}
              className="text-slate-400 hover:text-[#a91b0d] transition-colors cursor-pointer"
              title="Bookmark"
            >
              <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>
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

      <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#6b7280] dark:text-[#8b949e] font-sans-clean">
        <span className="truncate max-w-[130px] uppercase text-[10px] font-bold text-slate-700 dark:text-slate-300">
          {article.sourceName}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          {timeAgo && <span>{timeAgo}</span>}
          <span>•</span>
          <span>{article.readingTime || 3}m read</span>
        </div>
      </div>
    </article>
  );
}
