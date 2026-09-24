import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Clock, BookOpen, PenSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-500">Please sign in to view your profile.</p>
        <Link to="/login" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
          alt={user.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-sky-500/20 shadow-md"
        />

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {user.name}
            </h1>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 w-fit mx-auto sm:mx-0">
              Role: {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username} • {user.email}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
            {user.bio || 'Technology enthusiast, developer, and NewsAxis community reporter.'}
          </p>
        </div>

        <Link
          to="/write"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <PenSquare className="w-3.5 h-3.5" /> Submit Story
        </Link>
      </div>

      {/* Account Info Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Published Stories</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">Active in 72h window</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Reputation</span>
          <p className="text-xl font-black text-emerald-600">Verified Contributor</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Retention Policy</span>
          <p className="text-xl font-black text-sky-600">72-Hour Ephemeral</p>
        </div>
      </div>
    </div>
  );
}
