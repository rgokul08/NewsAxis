import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Clock, Send, Eye, ShieldAlert, Sparkles, Image as ImageIcon, 
  Save, Trash2, CheckCircle2, AlertCircle, PenSquare, ArrowRight,
  BookOpen, ShieldCheck, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { articleService } from '../services/articleService';
import { CATEGORIES } from '../constants/categories';
import { Button } from '../components/common/UIComponents';

const LOCAL_DRAFT_KEY = 'newsaxis_author_draft';

export function WriteStoryPage() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('technology');
  const [tags, setTags] = useState('tech, ai, programming');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceType, setSourceType] = useState('community_blog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [draftLoadedNotice, setDraftLoadedNotice] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.subtitle) setSubtitle(d.subtitle);
        if (d.summary) setSummary(d.summary);
        if (d.content) setContent(d.content);
        if (d.categoryId) setCategoryId(d.categoryId);
        if (d.tags) setTags(d.tags);
        if (d.imageUrl) setImageUrl(d.imageUrl);
        if (d.sourceType) setSourceType(d.sourceType);
        setDraftLoadedNotice(true);
      }
    } catch {
      // quiet fallback
    }
  }, []);

  const handleSaveDraft = () => {
    try {
      const draftData = {
        title,
        subtitle,
        summary,
        content,
        categoryId,
        tags,
        imageUrl,
        sourceType,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draftData));
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 3000);
    } catch (e) {
      console.warn('Failed to save draft to localStorage', e);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    setTitle('');
    setSubtitle('');
    setSummary('');
    setContent('');
    setImageUrl('');
    setDraftLoadedNotice(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a headline and article body content.');
      return;
    }

    if (content.trim().length < 50) {
      setError('Article content should be at least 50 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const created = await articleService.createCommunityArticle({
        title: title.trim(),
        subtitle: subtitle.trim(),
        summary: summary.trim() || content.slice(0, 160) + '...',
        content: content.trim(),
        categoryId,
        categorySlug: categoryId,
        tags: parsedTags.length > 0 ? parsedTags : [categoryId, 'author_blog'],
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
        sourceType
      }, user);

      // Clean up saved draft
      localStorage.removeItem(LOCAL_DRAFT_KEY);

      navigate(`/article/${created.slug}`);
    } catch (err) {
      setError(err.message || 'Submission error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Case 1: Unauthenticated Visitor
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <PenSquare className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          NewsAxis Author Studio
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in or create an author account to publish articles, save drafts locally, and broadcast your blogs for 24 hours.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-5 py-2.5 bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Sign In to Publish
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Create Author Account
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: User is logged in as a Reader
  if (user.role === 'reader') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-in fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Reader Account Detected
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Author Privileges Required
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
              Your account is currently set to <strong>Reader</strong>. Readers can read, search, browse all categories, and bookmark stories.
              To create and publish community blogs that remain live for 24 hours across NewsAxis, activate Author status.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> What Authors can do:
            </div>
            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
              <li>Write and publish articles to the NewsAxis database.</li>
              <li>Save local browser drafts without losing edits.</li>
              <li>Have your blogs appear in search, category pages, and home feeds for 24 hours.</li>
            </ul>
          </div>

          <button
            onClick={() => switchRole('author')}
            className="w-full sm:w-auto px-6 py-3 bg-[#a91b0d] hover:bg-[#8e1509] text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>Switch Role to Author & Start Writing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Authorized Author / Admin
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in">
      
      {/* 24-Hour Expiration Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-sm">Author Blog 24-Hour (1-Day) Retention Policy</p>
          <p>
            When published, your blog is saved to the Appwrite database & storage. It will remain publicly readable across all pages, search, and category feeds for <strong>24 hours</strong> before automatic deletion.
          </p>
        </div>
      </div>

      {/* Restored Draft Notice */}
      {draftLoadedNotice && (
        <div className="mb-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-200 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
            Unpublished draft restored from your browser localStorage.
          </span>
          <button
            onClick={handleDiscardDraft}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Discard
          </button>
        </div>
      )}

      {/* Save Draft Toast */}
      {draftSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          Draft saved to browser storage!
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-700 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Author Studio & Editor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Author: <strong>{user?.name}</strong> • Role: <span className="uppercase text-[#a91b0d] font-bold">{user?.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Save draft locally"
            >
              <Save className="w-3.5 h-3.5 text-sky-500" />
              <span>Save Draft</span>
            </button>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700/60 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSourceType('community_blog')}
                className={`px-3 py-1 rounded-lg transition-all ${sourceType === 'community_blog' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                Blog Post
              </button>
              <button
                type="button"
                onClick={() => setSourceType('community_report')}
                className={`px-3 py-1 rounded-lg transition-all ${sourceType === 'community_report' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                News Dispatch
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Headline / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Building Resilient Cloud Edge Systems with Distributed Caches"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
            />
          </div>

          {/* Subtitle / Key Takeaway */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Brief secondary angle or summary bullet..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
            />
          </div>

          {/* Category Beat & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category Beat *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Tags (Comma Separated)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="technology, artificial-intelligence, react"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
                />
              </div>
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Cover Image URL (Real Photo / Unsplash)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
              />
            </div>
            {imageUrl && (
              <div className="mt-2 relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Body Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Article Body *
            </label>
            <textarea
              rows={12}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your story, technical analysis, or report... You can use Markdown or standard paragraphs."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-sans text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d] leading-relaxed"
            />
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 gap-3">
            <span className="text-xs text-slate-500">
              Word count: {content.trim().split(/\s+/).filter(Boolean).length} words • Draft saved locally
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Save Local Draft
              </button>

              <Button 
                type="submit" 
                variant="primary" 
                size="md" 
                loading={loading} 
                icon={Send}
                className="bg-[#a91b0d] hover:bg-[#8e1509] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Publish Blog (24-Hour Retention)
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
