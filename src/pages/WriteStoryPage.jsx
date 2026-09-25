import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Send, Eye, ShieldAlert, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { articleService } from '../services/articleService';
import { CATEGORIES } from '../constants/categories';
import { Button } from '../components/common/UIComponents';

export function WriteStoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('technology');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceType, setSourceType] = useState('community_blog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a title and article body content.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await articleService.createCommunityArticle({
        title: title.trim(),
        subtitle: subtitle.trim(),
        summary: summary.trim() || content.slice(0, 160) + '...',
        content: content.trim(),
        categoryId,
        categorySlug: categoryId,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
        sourceType
      }, user);

      navigate(`/article/${created.slug}`);
    } catch (err) {
      setError(err.message || 'Submission error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 1-Day (24-Hour) Expiration Banner */}
      <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-sm">1-Day Community Retention Policy (24 Hours)</p>
          <p>
            All user-uploaded community news and blogs are saved directly to our database and Appwrite storage. To keep content fresh, posts automatically delete after <strong>1 day (24 hours)</strong>.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-700 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Write Community Story
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Publishing as <strong>{user?.name || 'Guest Contributor'}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSourceType('community_blog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${sourceType === 'community_blog' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              Blog Post
            </button>
            <button
              type="button"
              onClick={() => setSourceType('community_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${sourceType === 'community_report' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              Community Report
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Gen Web Assembly Workloads in Modern Browsers"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Add key context or summary angle..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Category & Cover Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category Beat
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Cover Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Body Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Article Content (Supports Markdown & HTML) *
            </label>
            <textarea
              rows={12}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your story here... HTML formatting like <p>, <h3>, <blockquote>, and <ul> will be sanitized before rendering."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400">
              Word count: {content.trim().split(/\s+/).filter(Boolean).length}
            </span>
            <Button type="submit" variant="primary" size="md" loading={loading} icon={Send}>
              Publish to Database (1-Day Lifecycle)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
