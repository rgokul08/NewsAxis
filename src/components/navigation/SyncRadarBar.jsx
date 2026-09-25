import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, Radio, CheckCircle, Sparkles } from 'lucide-react';
import { articleService } from '../../services/articleService';

export function SyncRadarBar({ onManualSync }) {
  const [syncStatus, setSyncStatus] = useState({
    secondsUntilNextSync: 1800,
    activeArticles: 0,
    cycleMinutes: 30,
    database: 'SQLite',
    isSyncing: false
  });
  const [refreshing, setRefreshing] = useState(false);
  const [justSyncedToast, setJustSyncedToast] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const status = await articleService.getSyncStatus();
        if (mounted && status) {
          setSyncStatus(prev => ({
            ...prev,
            secondsUntilNextSync: status.secondsUntilNextSync ?? prev.secondsUntilNextSync,
            activeArticles: status.activeArticles ?? prev.activeArticles,
            cycleMinutes: status.cycleMinutes ?? 30,
            database: status.database || 'Database Server'
          }));
        }
      } catch (e) {
        // quiet fallback
      }
    }

    checkStatus();
    const pollInterval = setInterval(checkStatus, 10000);

    // Second-by-second local countdown
    const secondTimer = setInterval(() => {
      setSyncStatus(prev => {
        if (prev.secondsUntilNextSync <= 1) {
          // Trigger sync reload when countdown hits zero
          checkStatus();
          return { ...prev, secondsUntilNextSync: 1800 };
        }
        return { ...prev, secondsUntilNextSync: prev.secondsUntilNextSync - 1 };
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      clearInterval(secondTimer);
    };
  }, []);

  const handleForceSync = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await articleService.triggerManualSync();
      const status = await articleService.getSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        secondsUntilNextSync: status?.secondsUntilNextSync ?? 1800,
        activeArticles: status?.activeArticles ?? prev.activeArticles
      }));
      setJustSyncedToast(true);
      setTimeout(() => setJustSyncedToast(false), 4000);
      if (onManualSync) onManualSync();
    } catch (err) {
      console.warn('Manual sync error', err);
    } finally {
      setRefreshing(false);
    }
  };

  const minutes = Math.floor(syncStatus.secondsUntilNextSync / 60);
  const seconds = syncStatus.secondsUntilNextSync % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-1.5 px-4 font-sans-clean select-none">
      <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Live Feed & Database Pulse */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3" /> Live 30-Min Cycle
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Database stats */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Database:</span>
            <span className="font-semibold text-white">
              {syncStatus.activeArticles > 0 ? `${syncStatus.activeArticles} Articles Active` : 'Synchronized'}
            </span>
            <span className="text-[10px] text-slate-400">({syncStatus.database})</span>
          </div>
        </div>

        {/* Center: Notice on 30m Auto-Purge */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Articles auto-purge & refresh every 30 minutes from real-world feeds</span>
        </div>

        {/* Right: Countdown & Sync Now Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <span className="text-[11px] text-slate-400">Next Sync:</span>
            <span className="font-mono font-bold text-amber-400 text-xs">{timeFormatted}</span>
          </div>

          <button
            onClick={handleForceSync}
            disabled={refreshing}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Fetch new news & blogs and purge older items right now"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {justSyncedToast && (
            <span className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400 animate-fade-in font-medium">
              <CheckCircle className="w-3 h-3" /> Updated!
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
