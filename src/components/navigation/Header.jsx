import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Moon, Sun, Bookmark, PenSquare, 
  Menu, X, Shield, User, LogOut, ChevronDown, BookOpen, CloudSun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES } from '../../constants/categories';

export function Header() {
  const { user, logout, switchRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="w-full bg-white dark:bg-[#0d1117] border-b border-[#e5e7eb] dark:border-[#30363d] transition-colors">
      {/* 1. The Hindu Style Top Utility Bar */}
      <div className="max-w-[1240px] mx-auto px-4 py-2 border-b border-[#e5e7eb] dark:border-[#30363d] flex items-center justify-between text-xs text-[#4b5563] dark:text-[#8b949e]">
        {/* Left: Location, Weather & Date */}
        <div className="flex items-center gap-3 font-sans-clean">
          <span className="font-semibold text-[#111827] dark:text-[#f0f6fc] flex items-center gap-1">
            <span>New Delhi</span>
            <CloudSun className="w-3.5 h-3.5 text-amber-500 inline" />
            <span>32°C</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Weather News</span>
          <span className="text-slate-300 dark:text-slate-600 hidden md:inline">|</span>
          <span className="font-medium text-[#111827] dark:text-[#f0f6fc]">{currentDate}</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <Link to="/latest" className="text-[#a91b0d] dark:text-rose-400 font-bold hover:underline hidden sm:inline">
            e-Paper
          </Link>
        </div>

        {/* Right: eBooks, Subscribe & Login state */}
        <div className="flex items-center gap-4 font-sans-clean">
          <Link to="/blogs" className="hidden md:flex items-center gap-1 hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Community</span>
          </Link>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Light Mode" : "Dark Mode"}
            className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Login or User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#a91b0d]" />
                <span className="max-w-[100px] truncate">{user.name}</span>
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
              className="flex items-center gap-1 font-bold text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>LOGIN</span>
            </Link>
          )}

          {/* Subscribe Call to Action button */}
          <Link
            to="/signup"
            className="px-3 py-1 rounded bg-[#a91b0d] hover:bg-[#8e1509] text-white font-bold tracking-wider text-[11px] uppercase transition-colors"
          >
            SUBSCRIBE
          </Link>
        </div>
      </div>

      {/* 2. Main Centered Masthead Header (The Hindu Iconic Style) */}
      <div className="max-w-[1240px] mx-auto px-4 py-4 sm:py-5 flex items-center justify-between">
        <div className="w-24 hidden md:block">
          {/* Left Balance Spacer */}
          <Link to="/write" className="text-xs font-serif font-bold text-[#a91b0d] hover:underline flex items-center gap-1">
            <PenSquare className="w-3 h-3" /> Community
          </Link>
        </div>

        {/* Center Masthead */}
        <Link to="/" className="text-center group flex flex-col items-center mx-auto">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <span className="font-masthead text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111827] dark:text-[#f0f6fc] uppercase select-none">
              NEWSAXIS
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-[1px] w-12 bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] sm:text-xs tracking-[0.25em] font-serif uppercase text-[#4b5563] dark:text-[#8b949e]">
              DISCOVER WHAT MATTERS
            </span>
            <div className="h-[1px] w-12 bg-slate-300 dark:bg-slate-700" />
          </div>
        </Link>

        {/* Right Search & Bookmark Icons */}
        <div className="flex items-center gap-2 w-24 justify-end">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-[#a91b0d] transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <Link
            to="/bookmarks"
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-[#a91b0d] transition-colors"
            title="Saved Articles"
          >
            <Bookmark className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-700 dark:text-slate-300 hover:text-[#a91b0d]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div className="border-t border-b border-[#e5e7eb] dark:border-[#30363d] bg-slate-50 dark:bg-[#161b22] px-4 py-3">
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

      {/* 3. The Hindu Primary Navigation Bar (Double Lines, Serif/Sans clean) */}
      <nav className="border-t border-b border-[#111827] dark:border-[#30363d] py-1 bg-white dark:bg-[#0d1117] shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 flex items-center justify-between font-headline text-sm font-bold tracking-tight overflow-x-auto scrollbar-none whitespace-nowrap gap-4 sm:gap-6">
          <div className="flex items-center gap-5 sm:gap-7">
            <Link to="/" className="text-[#a91b0d] hover:text-[#8e1509] transition-colors py-1">
              Home
            </Link>
            <Link to="/category/india" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              India
            </Link>
            <Link to="/category/world" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              World
            </Link>
            <Link to="/category/sports" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Sport
            </Link>
            <Link to="/category/business" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Business
            </Link>
            <Link to="/category/opinion" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Opinion
            </Link>
            <Link to="/category/science" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Science
            </Link>
            <Link to="/category/technology" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Technology
            </Link>
            <Link to="/category/tamil-nadu" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Tamil Nadu
            </Link>
            <Link to="/blogs" className="text-[#111827] dark:text-[#f0f6fc] hover:text-[#a91b0d] dark:hover:text-rose-400 transition-colors py-1">
              Community (72h)
            </Link>
          </div>

          <Link
            to="/categories"
            className="text-xs font-sans-clean font-bold text-[#a91b0d] hover:underline"
          >
            More Beats +
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 font-headline text-sm font-semibold">
          <div className="flex flex-col space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-1 text-[#a91b0d]">Home</Link>
            <Link to="/category/india" onClick={() => setMobileMenuOpen(false)} className="py-1">India News</Link>
            <Link to="/category/world" onClick={() => setMobileMenuOpen(false)} className="py-1">World News</Link>
            <Link to="/category/business" onClick={() => setMobileMenuOpen(false)} className="py-1">Business</Link>
            <Link to="/category/technology" onClick={() => setMobileMenuOpen(false)} className="py-1">Technology & AI</Link>
            <Link to="/category/sports" onClick={() => setMobileMenuOpen(false)} className="py-1">Sports</Link>
            <Link to="/category/tamil-nadu" onClick={() => setMobileMenuOpen(false)} className="py-1">Tamil Nadu</Link>
            <Link to="/blogs" onClick={() => setMobileMenuOpen(false)} className="py-1">Community Blogs (72h)</Link>
            <Link to="/latest" onClick={() => setMobileMenuOpen(false)} className="py-1">Latest Dispatches</Link>
            <Link to="/trending" onClick={() => setMobileMenuOpen(false)} className="py-1">Trending Stories</Link>
            <Link to="/write" onClick={() => setMobileMenuOpen(false)} className="py-1 text-[#a91b0d]">Write Community Story</Link>
          </div>
        </div>
      )}
    </header>
  );
}
