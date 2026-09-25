import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Bookmark, Share2, ShieldCheck, 
  ExternalLink, Volume2, VolumeX, Printer, MessageSquare, 
  ArrowLeft, Heart, ThumbsUp, Sparkles, AlertCircle 
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { articleService } from '../services/articleService';
import { Badge, Button } from '../components/common/UIComponents';

export function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [reactions, setReactions] = useState({ like: 0, helpful: 0, interesting: 0, insightful: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      setError(null);
      try {
        const item = await articleService.getBySlug(slug);
        setArticle(item);
        setIsBookmarked(articleService.isBookmarked(item.id));
        setCurrentReaction(articleService.getReaction(item.id));
        setReactions(item.reactions || { like: 12, helpful: 4, interesting: 7, insightful: 2 });
      } catch (err) {
        setError(err.message === 'CONTENT_EXPIRED' ? 'This post has reached its expiration window (30 minutes for real-time news, 24 hours for author blogs) and has been purged.' : 'Article not found');
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleBookmarkToggle = () => {
    if (!article) return;
    const res = articleService.toggleBookmark(article);
    setIsBookmarked(res.isBookmarked);
  };

  const handleReaction = (type) => {
    if (!article) return;
    const active = articleService.setReaction(article.id, type);
    setCurrentReaction(active);
    setReactions(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + (active === type ? 1 : -1)
    }));
  };

  // Web Speech API Text-to-Speech (Rule 104)
  const toggleTTS = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = `${article.title}. ${article.summary}. ${article.content.replace(/<[^>]*>?/gm, '')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const c = {
      id: `comm_${Date.now()}`,
      authorName: 'You (Reader)',
      content: newComment.trim(),
      createdAt: new Date().toISOString()
    };
    setComments([c, ...comments]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Content Unavailable</h2>
        <p className="text-slate-600 dark:text-slate-400">{error || 'The requested article could not be located.'}</p>
        <Link to="/" className="inline-block pt-2">
          <Button variant="primary">Return to Homepage</Button>
        </Link>
      </div>
    );
  }

  // 30-Minute Cycle Expiration Display
  let expirationString = null;
  if (article.expiresAt) {
    const msLeft = new Date(article.expiresAt).getTime() - Date.now();
    if (msLeft > 0) {
      const m = Math.floor(msLeft / (1000 * 60));
      const s = Math.floor((msLeft % (1000 * 60)) / 1000);
      expirationString = `${m} minutes ${s} seconds`;
    } else {
      expirationString = 'Purging in next cycle';
    }
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back Link */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Headlines
      </Link>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
            {article.categorySlug || article.categoryId || 'NEWS'}
          </span>
          {article.isBreaking && <Badge variant="breaking">Breaking News</Badge>}
          {article.sourceType === 'external_blog' && (
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded">
              Tech Blog
            </span>
          )}
          <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold font-mono px-2 py-0.5 rounded">
            30-Min Cycle
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-serif leading-relaxed">
            {article.subtitle}
          </p>
        )}

        {/* 30-Min Expiration Banner */}
        {expirationString && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>30-Minute Lifecycle: This article auto-purges from the database server in <strong>{expirationString}</strong> when new real-world updates arrive.</span>
            </span>
            <Link to="/" className="underline font-bold text-amber-800 dark:text-amber-200">Live Wire</Link>
          </div>
        )}

        {/* Byline & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-slate-200 dark:border-slate-800 py-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{article.authorName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{article.sourceName}</span>
                <span>•</span>
                <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>{article.readingTime || 4} min read</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTTS}
              title={isSpeaking ? "Stop Reading" : "Listen to Article"}
              className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isSpeaking ? 'text-sky-600' : ''}`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-sky-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleBookmarkToggle}
              title={isBookmarked ? "Remove Bookmark" : "Save Article"}
              className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isBookmarked ? 'text-sky-600' : ''}`}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              title={copied ? "Link Copied!" : "Share"}
              className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
            <button
              onClick={() => window.print()}
              title="Print Article"
              className="hidden sm:inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Cover Image */}
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
        <img
          src={article.imageUrl}
          alt={article.imageAlt || article.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'; }}
        />
      </div>

      {/* Main Body Content with DOMPurify sanitization */}
      <div 
        className="prose dark:prose-invert prose-lg max-w-none font-serif leading-relaxed text-slate-800 dark:text-slate-200"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || article.summary) }}
      />

      {/* External Attribution / Original Source Link (Rule 4) */}
      {article.isExternal && article.sourceUrl && (
        <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-500" /> Source Attribution
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              This report was aggregated from <strong>{article.sourceName}</strong> under permitted fair distribution standards.
            </p>
          </div>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors"
          >
            <span>Read Original at {article.sourceName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Reaction Bar (Rule 40) */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Reactions:</span>
        <button
          onClick={() => handleReaction('like')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
            currentReaction === 'like' ? 'bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <Heart className="w-3.5 h-3.5" fill={currentReaction === 'like' ? "currentColor" : "none"} />
          <span>Like ({reactions.like || 0})</span>
        </button>

        <button
          onClick={() => handleReaction('helpful')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
            currentReaction === 'helpful' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Helpful ({reactions.helpful || 0})</span>
        </button>

        <button
          onClick={() => handleReaction('insightful')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
            currentReaction === 'insightful' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Insightful ({reactions.insightful || 0})</span>
        </button>
      </div>

      {/* Comments Section */}
      <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-500" />
          <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
            Discussion ({comments.length})
          </h3>
        </div>

        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your perspective (respectful community discourse only)..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button type="submit" size="sm" variant="primary">Post Comment</Button>
        </form>

        <div className="space-y-3 pt-2">
          {comments.map(c => (
            <div key={c.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{c.authorName}</span>
                <span className="text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
