import React, { useEffect, useState } from 'react';
import { 
  Shield, Users, FileText, Activity, AlertTriangle, 
  Trash2, RefreshCw, CheckCircle2, Radio, Server, Database 
} from 'lucide-react';
import { articleService } from '../../services/articleService';
import { providerRegistry } from '../../providers';
import { Button, Badge } from '../../components/common/UIComponents';

export function AdminDashboardPage() {
  const [articles, setArticles] = useState([]);
  const [providerStatuses, setProviderStatuses] = useState([]);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'providers' | 'articles'

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const feed = await articleService.getHomeFeed();
    setArticles(feed.all);
    const health = await providerRegistry.checkAllHealth();
    setProviderStatuses(health);
  }

  const handleManualCleanup = () => {
    setCleaning(true);
    setTimeout(() => {
      const res = articleService.cleanupExpired();
      setCleanupResult(res);
      setCleaning(false);
      loadData();
    }, 600);
  };

  const communityArticles = articles.filter(a => a.sourceType?.startsWith('community'));
  const expiredCount = communityArticles.filter(a => {
    if (!a.expiresAt) return false;
    return new Date(a.expiresAt).getTime() < Date.now();
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              NewsAxis Editorial & Systems CMS
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoring Appwrite backend collections, 72-hour community retention cycles, and external provider feeds.
          </p>
        </div>

        {/* Manual Cleanup Action */}
        <Button
          onClick={handleManualCleanup}
          variant="outline"
          size="sm"
          loading={cleaning}
          icon={Trash2}
          className="border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          Run 72-Hour Lifecycle Cleanup
        </Button>
      </div>

      {cleanupResult && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>72-Hour Cleanup completed: <strong>{cleanupResult.deletedCount}</strong> expired community records pruned.</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider">
            <span>Aggregated Articles</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{articles.length}</p>
          <p className="text-[11px] text-slate-400">Total active in-memory & database items</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider">
            <span>Community Posts</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{communityArticles.length}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Strict 72-hour lifetime ceiling</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider">
            <span>Connected Providers</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{providerStatuses.length}</p>
          <p className="text-[11px] text-slate-400">Google News, BBC, DEV, Hashnode, etc.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider">
            <span>Retention Health</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {expiredCount === 0 ? 'Optimal' : `${expiredCount} Pending Clean`}
          </p>
          <p className="text-[11px] text-slate-400">Scheduled task runs every 15 min</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Content Records ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'providers' ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Provider Adapters & Health ({providerStatuses.length})
        </button>
      </div>

      {/* Tab: Content Records */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Headline</th>
                  <th className="px-4 py-3">Source Beat</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">Retention / Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {articles.slice(0, 15).map(art => (
                  <tr key={art.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {art.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{art.sourceName}</span>
                    </td>
                    <td className="px-4 py-3 uppercase tracking-wider text-[11px] font-bold text-sky-600">
                      {art.categorySlug}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{art.authorName}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(art.publishedAt || art.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {art.expiresAt ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          72h Ceiling ({new Date(art.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      ) : (
                        <span className="text-slate-400">External Permanent/48h</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Provider Health Status (Rule 51 & 52) */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerStatuses.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  p.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {p.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>Type: <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">{p.type}</span></p>
                <p>Latency: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.latencyMs} ms</span></p>
                <p>Adapter Status: <span className="text-emerald-600 font-medium">Verified Active</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
