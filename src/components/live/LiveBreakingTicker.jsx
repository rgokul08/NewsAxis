import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Flame, ExternalLink, ChevronRight, Zap } from 'lucide-react';

/**
 * Real-Time Live Breaking News Ticker
 * Displays streaming verified headlines with direct links
 */
export function LiveBreakingTicker({ articles = [], onOpenLiveStream }) {
  const breakingList = (articles || []).filter(a => a.isBreaking || a.views > 20).slice(0, 10);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (breakingList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [breakingList.length]);

  if (breakingList.length === 0) return null;

  const current = breakingList[currentIndex];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white py-2 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 shrink-0 bg-red-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            BREAKING
          </div>

          {/* Headline */}
          <div className="truncate flex-1">
            <Link
              to={`/article/${current.slug}`}
              className="text-slate-200 hover:text-white font-medium hover:underline flex items-center gap-2 truncate transition-colors"
            >
              <span className="text-red-400 font-bold shrink-0">[{current.sourceName || 'Verified'}]:</span>
              <span className="truncate">{current.title}</span>
            </Link>
          </div>
        </div>

        {/* Live Stream Trigger Button */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={onOpenLiveStream}
            className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Watch Live TV</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
