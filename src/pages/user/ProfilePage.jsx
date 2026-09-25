import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Clock, BookOpen, PenSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const { user, switchRole } = useAuth();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-500">Please sign in to view your profile.</p>
        <Link to="/login" className="inline-block px-5 py-2.5 bg-[#a91b0d] text-white rounded-xl text-xs font-bold shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  const isAuthor = user.role === 'author' || user.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
          alt={user.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700 shadow-md"
        />

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {user.name}
            </h1>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-[#a91b0d] dark:bg-red-950/60 dark:text-rose-400 w-fit mx-auto sm:mx-0">
              Role: {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username} • {user.email}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
            {user.bio || (isAuthor ? 'Verified NewsAxis author and community contributor.' : 'NewsAxis subscriber and avid reader.')}
          </p>

          {/* Role Switcher Action */}
          <div className="pt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            {isAuthor ? (
              <button
                onClick={() => switchRole('reader')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold underline cursor-pointer"
              >
                Switch role to Reader
              </button>
            ) : (
              <button
                onClick={() => switchRole('author')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Upgrade to Author (Publish Blogs)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isAuthor && (
          <Link
            to="/write"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            <PenSquare className="w-3.5 h-3.5" /> Open Author Studio
          </Link>
        )}
      </div>

      {/* Account Info Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Account Status</span>
          <p className="text-lg font-black text-slate-900 dark:text-white capitalize">{user.role} Member</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Community Blogs</span>
          <p className="text-lg font-black text-emerald-600">24-Hour Expiration</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Live News Radar</span>
          <p className="text-lg font-black text-sky-600">30-Min IST Refresh</p>
        </div>
      </div>
    </div>
  );
}
