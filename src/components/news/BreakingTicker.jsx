import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Pause, Play, ChevronRight } from 'lucide-react';

export function BreakingTicker({ items = [] }) {
  const [isPaused, setIsPaused] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full bg-[#111827] text-white border-b border-black overflow-hidden flex items-center">
      {/* Static Label */}
      <div className="shrink-0 flex items-center gap-2 bg-[#a91b0d] px-3 sm:px-4 py-1.5 text-[11px] font-sans-clean font-black tracking-wider uppercase z-10">
        <Radio className="w-3 h-3 animate-pulse" />
        <span>BREAKING</span>
      </div>


      {/* Marquee Content */}
      <div 
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className="animate-ticker flex items-center gap-8 py-2 text-xs font-medium"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {/* Double items array for continuous ticker loop */}
          {[...items, ...items].map((story, idx) => (
            <Link
              key={`${story.id}-${idx}`}
              to={`/article/${story.slug}`}
              className="inline-flex items-center gap-2 hover:underline whitespace-nowrap opacity-95 hover:opacity-100 transition-opacity"
            >
              <span className="font-bold bg-black/20 px-1.5 py-0.5 rounded text-[10px] uppercase">
                {story.categorySlug || 'Alert'}
              </span>
              <span>{story.title}</span>
              <span className="opacity-60 text-[10px]">({story.sourceName})</span>
              <ChevronRight className="w-3 h-3 opacity-60 inline" />
            </Link>
          ))}
        </div>
      </div>

      {/* Pause/Play Toggle Button for Accessibility (WCAG Rule 61) */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        title={isPaused ? "Resume Ticker" : "Pause Ticker"}
        className="shrink-0 px-2 sm:px-3 py-2 bg-rose-700/80 hover:bg-rose-700 text-white text-xs flex items-center justify-center transition-colors"
        aria-label={isPaused ? "Resume news ticker animation" : "Pause news ticker animation"}
      >
        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
