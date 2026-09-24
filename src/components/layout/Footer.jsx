import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShieldCheck, Globe, Share2, Mail } from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';

export function Footer() {
  return (
    <footer className="w-full border-t-2 border-[#111827] dark:border-[#30363d] bg-[#f8f9fa] dark:bg-[#161b22] text-[#111827] dark:text-[#f0f6fc] transition-colors pt-10 pb-8 mt-auto font-sans-clean">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-8 border-b border-[#e5e7eb] dark:border-[#30363d]">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-block">
              <span className="font-masthead text-2xl font-black tracking-tight text-[#111827] dark:text-white uppercase">
                NEWSAXIS
              </span>
              <p className="text-[10px] tracking-widest text-[#a91b0d] font-bold uppercase mt-0.5">
                DISCOVER WHAT MATTERS
              </p>
            </Link>
            <p className="text-xs text-[#4b5563] dark:text-[#8b949e] max-w-sm leading-relaxed font-body-serif">
              A serious, independent digital newspaper combining live external wire dispatches with an ephemeral 72-hour community publishing model.
            </p>

            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a href="https://newsaxis.media" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-800 hover:text-white hover:bg-slate-700 transition-colors" title="Global Network">
                <Globe className="w-4 h-4" />
              </a>
              <a href="mailto:editor@newsaxis.media" className="p-2 rounded-lg bg-slate-800 hover:text-white hover:bg-slate-700 transition-colors" title="Contact Editorial">
                <Mail className="w-4 h-4" />
              </a>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="p-2 rounded-lg bg-slate-800 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer" title="Share Portal">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Popular Beats</h4>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.slice(0, 6).map(c => (
                <li key={c.id}>
                  <Link to={`/category/${c.slug}`} className="hover:text-sky-400 transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Publishing & Community */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/write" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Write Story
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="hover:text-sky-400 transition-colors">
                  Community Blogs
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="hover:text-sky-400 transition-colors">
                  Publishing Guidelines
                </Link>
              </li>
              <li>
                <Link to="/sources" className="hover:text-sky-400 transition-colors">
                  Source Attribution Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-sky-400 transition-colors">About NewsAxis</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-sky-400 transition-colors">Contact Editorial</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-sky-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-sky-400 transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 72-Hour Retention & Attribution Notice */}
        <div className="py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 inline" />
            <span>Community posts are protected by our strict 72-Hour Retention Policy. Third-party news items belong to their original publishers.</span>
          </p>
          <p>© {new Date().getFullYear()} NewsAxis Media Network. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
