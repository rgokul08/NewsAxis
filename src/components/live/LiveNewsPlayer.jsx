import React, { useState } from 'react';
import { Radio, X, Volume2, Maximize2, Tv, ExternalLink, Play, ChevronRight, ShieldCheck } from 'lucide-react';

/**
 * Free Real-World Live News Broadcast Channels
 * Officially provided free live streams from globally recognized news networks
 */
export const LIVE_NEWS_CHANNELS = [
  {
    id: 'sky_news',
    name: 'Sky News',
    country: 'Global / UK',
    description: '24/7 Live International Breaking News & Special Reports',
    embedUrl: 'https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1',
    logo: '🔴 Sky News Live',
    category: 'World'
  },
  {
    id: 'dw_news',
    name: 'DW News',
    country: 'Germany / Global',
    description: 'Deutsche Welle International News & In-Depth Analysis',
    embedUrl: 'https://www.youtube-nocookie.com/embed/lu_Z_zFqF2c?autoplay=1&mute=1',
    logo: '🌐 DW News Live',
    category: 'World'
  },
  {
    id: 'france24',
    name: 'France 24',
    country: 'France / Global',
    description: 'International News 24/7 in English from Paris',
    embedUrl: 'https://www.youtube-nocookie.com/embed/h3MuI4GFacQ?autoplay=1&mute=1',
    logo: '🇫🇷 France 24 Live',
    category: 'World'
  },
  {
    id: 'al_jazeera',
    name: 'Al Jazeera',
    country: 'Middle East / Global',
    description: 'Global News, In-Depth Documentaries and Live Updates',
    embedUrl: 'https://www.youtube-nocookie.com/embed/gCNeDWCI0vo?autoplay=1&mute=1',
    logo: '🌍 Al Jazeera English',
    category: 'World'
  },
  {
    id: 'nbc_news',
    name: 'NBC News NOW',
    country: 'USA / Americas',
    description: 'Free 24/7 Streaming News Network from NBC News',
    embedUrl: 'https://www.youtube-nocookie.com/embed/1vPsm3rR5j8?autoplay=1&mute=1',
    logo: '🇺🇸 NBC News NOW',
    category: 'Americas'
  },
  {
    id: 'india_today',
    name: 'India Today Live',
    country: 'India / Asia',
    description: 'Real-time Breaking News, Politics and National Bulletins',
    embedUrl: 'https://www.youtube-nocookie.com/embed/8vX2K7W0u8s?autoplay=1&mute=1',
    logo: '🇮🇳 India Today Live',
    category: 'India'
  }
];

export function LiveNewsModal({ isOpen, onClose, initialChannelId = 'sky_news' }) {
  const [activeChannelId, setActiveChannelId] = useState(initialChannelId);

  if (!isOpen) return null;

  const currentChannel = LIVE_NEWS_CHANNELS.find(c => c.id === activeChannelId) || LIVE_NEWS_CHANNELS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              Live Broadcast
            </span>
            <div className="flex items-center gap-2 text-white">
              <Tv className="w-4 h-4 text-sky-400" />
              <h2 className="font-sans font-bold text-sm sm:text-base tracking-tight">
                {currentChannel.name} • {currentChannel.country}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Free Verified Stream
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Stream"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            key={currentChannel.id}
            src={currentChannel.embedUrl}
            title={currentChannel.name}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Channel Selector Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
              Select Feed:
            </span>
            {LIVE_NEWS_CHANNELS.map(ch => {
              const isSelected = ch.id === currentChannel.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                  {ch.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating / Embedded Live Broadcast Launcher Widget
 */
export function LiveNewsLauncherButton({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-mono text-xs font-bold shadow-md shadow-red-600/20 hover:shadow-red-600/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
      title="Stream Free 24/7 Live World News"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      <span>LIVE TV</span>
    </button>
  );
}
