import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Moon, Sun, Bookmark, PenSquare, 
  Menu, X, User, ChevronDown, BookOpen, MapPin, 
  Sparkles, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { SyncRadarBar } from './SyncRadarBar';
import { LiveNewsModal, LiveNewsLauncherButton } from '../live/LiveNewsPlayer';

export function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, logoSrc } = useTheme();
  const { location, detecting, requestDetection, manualSetLocation } = useGeolocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [liveStreamOpen, setLiveStreamOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const popularRegions = [
    { city: 'Chennai', region: 'Tamil Nadu' },
    { city: 'New Delhi', region: 'Delhi' },
    { city: 'Bengaluru', region: 'Karnataka' },
    { city: 'Mumbai', region: 'Maharashtra' },
    { city: 'Kolkata', region: 'West Bengal' },
    { city: 'Hyderabad', region: 'Telangana' },
    { city: 'Kochi', region: 'Kerala' }
  ];

  return (
    <header className="w-full bg-white dark:bg-[#0d1117] border-b border-[#e5e7eb] dark:border-[#30363d] transition-colors shadow-xs">
      
      {/* 0. LIVE 30-MIN DATABASE SYNC RADAR */}
      <SyncRadarBar />

      {/* 1. THE HINDU STYLE MASTHEAD ROW */}
      <div className="max-w-[1280px] mx-auto px-4 py-3 sm:py-4">
        <div className="grid grid-cols-12 items-center gap-2">
          
          {/* Left Column: Date, e-Paper, Geolocation */}
          <div className="col-span-12 md:col-span-3 flex flex-wrap items-center gap-2.5 text-xs text-[#111827] dark:text-[#f0f6fc] font-sans-clean order-2 md:order-1 justify-between md:justify-start">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentDate}
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <Link 
              to="/latest" 
              className="text-[#a91b0d] dark:text-rose-500 font-bold hover:underline"
            >
              e-Paper
            </Link>

            {/* Geolocation Chip */}
            <div className="relative">
              <button
                onClick={() => setLocationPickerOpen(!locationPickerOpen)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Click to detect or change nearby news location"
              >
                <MapPin className="w-3 h-3 text-[#a91b0d] dark:text-rose-500 shrink-0" />
                <span className="font-bold truncate max-w-[130px]">{location.city || 'Nearby'}</span>
                <span className="text-[10px] text-slate-400">({location.temperature || '32°C'})</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {locationPickerOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] shadow-xl rounded-lg p-3 z-50 text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#a91b0d]" /> Nearby Edition
                    </span>
                    <button
                      onClick={requestDetection}
                      disabled={detecting}
                      className="text-[11px] font-semibold text-[#a91b0d] dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${detecting ? 'animate-spin' : ''}`} />
                      <span>{detecting ? 'Detecting...' : 'Auto-Detect'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Select your city to tailor the front page with regional breaking dispatches & blogs:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {popularRegions.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          manualSetLocation(r.city, r.region);
                          setLocationPickerOpen(false);
                        }}
                        className={`px-2 py-1 rounded text-[11px] transition-colors ${
                          location.city === r.city 
                            ? 'bg-[#a91b0d] text-white font-bold' 
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {r.city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Grand The Hindu Style Masthead (Widened & Prominent) */}
          <div className="col-span-12 md:col-span-6 flex justify-center order-1 md:order-2">
            <Link to="/" className="inline-block group text-center py-1">
              <img
                src={logoSrc}
                alt="NewsAxis — Discover What Matters"
                className="w-full max-w-[340px] sm:max-w-[440px] md:max-w-[560px] lg:max-w-[680px] h-auto max-h-24 sm:max-h-28 md:max-h-32 object-contain mx-auto select-none transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </Link>
          </div>

          {/* Right Column: Login, eBooks, Theme Toggle, Subscribe */}
          <div className="col-span-12 md:col-span-3 flex flex-col items-end gap-2 text-xs font-sans-clean order-3">
            
            {/* Top Right: Login state */}
            <div>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#a91b0d]" />
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      onClick={() => setUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] shadow-lg rounded py-1.5 z-50 text-xs"
                    >
                      <div className="px-3 py-1.5 border-b border-[#e5e7eb] dark:border-[#30363d]">
                        <p className="font-bold text-[#111827] dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </div>
                      <Link to="/profile" className="block px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Profile</Link>
                      <Link to="/write" className="block px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-[#a91b0d]">Write Story</Link>
                      <Link to="/bookmarks" className="block px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Bookmarks</Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-amber-600">Admin CMS</Link>
                      )}
                      <button onClick={logout} className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-t border-[#e5e7eb] dark:border-[#30363d]">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors uppercase tracking-wider text-[11px]"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>LOGIN</span>
                </Link>
              )}
            </div>

            {/* Bottom Right: eBooks, Theme, Subscribe Button */}
            <div className="flex items-center gap-3">
              <Link 
                to="/blogs" 
                className="hidden sm:flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors text-[11px]"
                title="Community Blogs & eBooks"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>eBooks</span>
              </Link>

              {/* Theme Switcher Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle visual theme"
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-[#a91b0d] dark:hover:text-white transition-colors"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Free 24/7 Live News Stream Launcher */}
              <LiveNewsLauncherButton onOpen={() => setLiveStreamOpen(true)} />

              {/* Crimson Subscribe Button */}
              <Link
                to="/signup"
                className="px-3.5 py-1.5 rounded-sm bg-[#a91b0d] hover:bg-[#8e1509] text-white font-bold tracking-wider text-[11px] uppercase transition-colors shadow-xs"
              >
                SUBSCRIBE
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* 2. THE HINDU PRIMARY TWO-TIER NAVIGATION BAR (Matching image.png) */}
      <nav className="border-t border-b border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#0d1117] py-1.5 px-4 shadow-xs sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4 font-headline text-sm font-bold tracking-tight">
          
          {/* Left Controls: Hamburger + Search */}
          <div className="flex items-center gap-3 shrink-0 font-sans-clean">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-slate-800 dark:text-slate-200 hover:text-[#a91b0d] transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-[#a91b0d] transition-colors cursor-pointer"
              title="Search NewsAxis"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Center Category Links */}
          <div className="flex items-center gap-5 sm:gap-6 lg:gap-7 overflow-x-auto scrollbar-none whitespace-nowrap text-[13px] sm:text-[14px] font-medium">
            <Link to="/category/india" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
              India
            </Link>
            <Link to="/category/world" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
              World
            </Link>
            <Link to="/category/technology" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors font-semibold">
              Tech & AI
            </Link>
            {/* Free Real-World Live News Stream Link */}
            <button
              type="button"
              onClick={() => setLiveStreamOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 dark:bg-red-950/40 hover:bg-red-600 hover:text-white transition-all cursor-pointer font-bold text-xs"
              title="Watch 24/7 Free Live World News"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              <span>LIVE TV</span>
            </button>
            <Link to="/blogs" className="text-emerald-700 dark:text-emerald-400 hover:underline transition-colors flex items-center gap-1 font-bold">
              <span>Dev Blogs</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 px-1 py-0.2 rounded text-emerald-800 dark:text-emerald-300">LIVE</span>
            </Link>
            <Link to="/category/business" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
              Business
            </Link>
            <Link to="/category/science" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
              Science
            </Link>
            <Link to="/category/sports" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
              Sport
            </Link>
            <Link to="/trending" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
              Trending
            </Link>
          </div>

          {/* Right Action: More Beats / Bookmarks */}
          <div className="flex items-center gap-3 shrink-0 font-sans-clean text-xs">
            <Link
              to="/bookmarks"
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-[#a91b0d] transition-colors hidden sm:block"
              title="Saved Articles"
            >
              <Bookmark className="w-4 h-4" />
            </Link>
            <Link
              to="/categories"
              className="font-bold text-[#a91b0d] dark:text-rose-400 hover:underline whitespace-nowrap"
            >
              More Beats +
            </Link>
          </div>

        </div>
      </nav>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div className="border-b border-[#e5e7eb] dark:border-[#30363d] bg-slate-50 dark:bg-[#161b22] px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by topic, headline, or keywords..."
              className="flex-1 bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm rounded font-sans-clean focus:outline-none focus:border-[#a91b0d]"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold uppercase rounded font-sans-clean"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs ml-1"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 font-headline text-sm font-semibold">
          <div className="flex flex-col space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-1 text-[#a91b0d]">Front Page</Link>
            <Link to="/category/india" onClick={() => setMobileMenuOpen(false)} className="py-1">India News</Link>
            <Link to="/category/world" onClick={() => setMobileMenuOpen(false)} className="py-1">World News</Link>
            <Link to="/category/sports" onClick={() => setMobileMenuOpen(false)} className="py-1">Sports & Asian Games</Link>
            <Link to="/category/business" onClick={() => setMobileMenuOpen(false)} className="py-1">Business</Link>
            <Link to="/category/technology" onClick={() => setMobileMenuOpen(false)} className="py-1">Technology & AI</Link>
            <Link to="/category/tamil-nadu" onClick={() => setMobileMenuOpen(false)} className="py-1">Tamil Nadu / South</Link>
            <button 
              type="button"
              onClick={() => { setMobileMenuOpen(false); setLiveStreamOpen(true); }}
              className="py-1 text-left text-red-600 font-bold flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>Watch Live TV Broadcast</span>
            </button>
            <Link to="/blogs" onClick={() => setMobileMenuOpen(false)} className="py-1 text-slate-800 dark:text-slate-200">Community Blogs (1-Day)</Link>
            <Link to="/latest" onClick={() => setMobileMenuOpen(false)} className="py-1">Latest Dispatches</Link>
            <Link to="/trending" onClick={() => setMobileMenuOpen(false)} className="py-1">Trending Stories</Link>
            <Link to="/write" onClick={() => setMobileMenuOpen(false)} className="py-1 text-[#a91b0d] font-bold">Write Story (24h Retention)</Link>
          </div>
        </div>
      )}

      {/* Free 24/7 Verified Live News Broadcast Player Modal */}
      <LiveNewsModal 
        isOpen={liveStreamOpen} 
        onClose={() => setLiveStreamOpen(false)} 
      />
    </header>
  );
}
