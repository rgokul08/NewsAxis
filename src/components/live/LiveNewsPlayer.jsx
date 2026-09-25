import React, { useState } from 'react';
import { 
  Radio, X, Volume2, Maximize2, Tv, ExternalLink, 
  Play, ChevronRight, ShieldCheck, Globe, Flag 
} from 'lucide-react';

/**
 * Free Real-World Live News Broadcast Channels
 * Officially provided free 24/7 legal streams from globally recognized news networks
 */
export const LIVE_NEWS_CHANNELS = [
  // Global / World News Channels
  {
    id: 'bbc_news',
    name: 'BBC News',
    country: 'United Kingdom',
    region: 'world',
    description: 'BBC World News 24/7 International Coverage, Reports & In-Depth Analysis',
    embedUrl: 'https://www.youtube-nocookie.com/embed/wb4s0eS5n3s?autoplay=1&mute=1',
    badge: '🇬🇧 BBC News Live',
    category: 'World'
  },
  {
    id: 'sky_news',
    name: 'Sky News Live',
    country: 'Global / UK',
    region: 'world',
    description: '24/7 Live International Breaking News & Special Reports',
    embedUrl: 'https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1',
    badge: '🔴 Sky News Live',
    category: 'World'
  },
  {
    id: 'dw_news',
    name: 'DW News',
    country: 'Germany / Global',
    region: 'world',
    description: 'Deutsche Welle International News & In-Depth Investigative Analysis',
    embedUrl: 'https://www.youtube-nocookie.com/embed/lu_Z_zFqF2c?autoplay=1&mute=1',
    badge: '🌐 DW News Live',
    category: 'World'
  },
  {
    id: 'france24',
    name: 'France 24',
    country: 'France / Global',
    region: 'world',
    description: 'International News 24/7 in English from Paris',
    embedUrl: 'https://www.youtube-nocookie.com/embed/h3MuI4GFacQ?autoplay=1&mute=1',
    badge: '🇫🇷 France 24 Live',
    category: 'World'
  },
  {
    id: 'al_jazeera',
    name: 'Al Jazeera English',
    country: 'Global / Middle East',
    region: 'world',
    description: 'Global News, In-Depth Documentaries and Live Updates',
    embedUrl: 'https://www.youtube-nocookie.com/embed/gCNeDWCI0vo?autoplay=1&mute=1',
    badge: '🌍 Al Jazeera English',
    category: 'World'
  },
  {
    id: 'nbc_news',
    name: 'NBC News NOW',
    country: 'USA / Americas',
    region: 'world',
    description: 'Free 24/7 Streaming News Network from NBC News',
    embedUrl: 'https://www.youtube-nocookie.com/embed/1vPsm3rR5j8?autoplay=1&mute=1',
    badge: '🇺🇸 NBC News NOW',
    category: 'Americas'
  },
  {
    id: 'abc_news',
    name: 'ABC News Live',
    country: 'USA / Global',
    region: 'world',
    description: '24/7 Live Breaking News Bulletins & Interviews from ABC News',
    embedUrl: 'https://www.youtube-nocookie.com/embed/w_Ma8oQLmSM?autoplay=1&mute=1',
    badge: '🇺🇸 ABC News Live',
    category: 'Americas'
  },

  // India Live News Channels
  {
    id: 'india_today',
    name: 'India Today Live',
    country: 'India',
    region: 'india',
    description: 'Real-time Breaking News, Politics and National Bulletins across India',
    embedUrl: 'https://www.youtube-nocookie.com/embed/8vX2K7W0u8s?autoplay=1&mute=1',
    badge: '🇮🇳 India Today Live',
    category: 'India'
  },
  {
    id: 'ndtv_24x7',
    name: 'NDTV 24x7',
    country: 'India',
    region: 'india',
    description: 'Trusted National News, Primetime Debates, and Ground Dispatches from New Delhi',
    embedUrl: 'https://www.youtube-nocookie.com/embed/1yZ4jV8v0y4?autoplay=1&mute=1',
    badge: '🇮🇳 NDTV 24x7',
    category: 'India'
  },
  {
    id: 'wion_news',
    name: 'WION Live',
    country: 'India / Global',
    region: 'india',
    description: 'World Is One News - Global Issues from a South Asian Perspective',
    embedUrl: 'https://www.youtube-nocookie.com/embed/d3_D_uEaE-s?autoplay=1&mute=1',
    badge: '🇮🇳 WION Global',
    category: 'India'
  },
  {
    id: 'dd_news',
    name: 'DD News Official',
    country: 'India',
    region: 'india',
    description: 'Doordarshan Official 24/7 National Public Service News Network',
    embedUrl: 'https://www.youtube-nocookie.com/embed/6iQfXmY8uX8?autoplay=1&mute=1',
    badge: '🇮🇳 DD News',
    category: 'India'
  }
];

export function LiveNewsModal({ 
  isOpen, 
  onClose, 
  initialChannelId = 'bbc_news',
  initialRegion = 'all' 
}) {
  const [activeChannelId, setActiveChannelId] = useState(initialChannelId);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  if (!isOpen) return null;

  // Filter channels by region tab
  const displayedChannels = LIVE_NEWS_CHANNELS.filter(c => {
    if (selectedRegion === 'world') return c.region === 'world';
    if (selectedRegion === 'india') return c.region === 'india';
    return true;
  });

  const currentChannel = LIVE_NEWS_CHANNELS.find(c => c.id === activeChannelId) || displayedChannels[0] || LIVE_NEWS_CHANNELS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0b0f19] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              LIVE BROADCAST
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

        {/* Region Filter Tabs */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                selectedRegion === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Feeds ({LIVE_NEWS_CHANNELS.length})
            </button>
            <button
              onClick={() => {
                setSelectedRegion('world');
                if (currentChannel.region !== 'world') setActiveChannelId('bbc_news');
              }}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedRegion === 'world'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌍 Global / World News (BBC, Sky, DW)</span>
            </button>
            <button
              onClick={() => {
                setSelectedRegion('india');
                if (currentChannel.region !== 'india') setActiveChannelId('india_today');
              }}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedRegion === 'india'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>🇮🇳 India News (India Today, NDTV, DD)</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline">
            Free Public Broadcast
          </span>
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
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
              Channel:
            </span>
            {displayedChannels.map(ch => {
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
export function LiveNewsLauncherButton({ onOpen, label = "LIVE TV" }) {
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-mono text-xs font-bold shadow-md shadow-red-600/20 hover:shadow-red-600/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
      title="Stream Free 24/7 Live World and India News"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      <span>{label}</span>
    </button>
  );
}
