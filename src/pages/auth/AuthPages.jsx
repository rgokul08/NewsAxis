import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Lock, Mail, User, ArrowRight,
  CheckCircle2, AlertCircle, ShieldCheck, KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/UIComponents';

/** Shared 6-digit OTP entry screen used by both Login and Signup flows */
function OtpStep({ email, onBack }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(code.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await resendOtp();
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#a91b0d] text-white flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-black text-slate-900 dark:text-white">Enter Verification Code</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          We sent a 6-digit code to <strong>{email}</strong>. It expires shortly, so enter it soon.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}
      {resent && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> A new code has been sent.
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full text-center tracking-[0.6em] font-mono text-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
        />
        <Button type="submit" variant="primary" size="md" loading={loading} className="w-full bg-[#a91b0d] hover:bg-[#8e1509] text-white py-2.5 rounded-xl font-bold text-sm">
          Verify & Continue
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-slate-500 hover:underline">← Back</button>
        <button onClick={handleResend} className="text-[#a91b0d] dark:text-rose-400 font-bold hover:underline">Resend code</button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const { startLogin, directLocalLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await startLogin(email);
      if (res && res.needsOtp) {
        setShowOtp(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <OtpStep email={email} onBack={() => setShowOtp(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#a91b0d] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-red-500/20">N</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sign In to NewsAxis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sign in securely with email verification or instant direct session.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
            {/fetch/i.test(error) && (
              <button
                type="button"
                onClick={() => {
                  directLocalLogin('author');
                  navigate('/');
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#a91b0d] text-white text-xs font-bold hover:bg-[#8e1509] transition-colors cursor-pointer"
              >
                Continue with Direct Session &rarr;
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full bg-[#a91b0d] hover:bg-[#8e1509] text-white py-2.5 rounded-xl font-bold text-sm">
            Send Verification Code
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-mono">Or Instant Access</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <button
            type="button"
            onClick={() => {
              directLocalLogin('author');
              navigate('/write');
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ⚡ 1-Click Author Access (Write & Publish)
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          New to NewsAxis? <Link to="/signup" className="text-[#a91b0d] dark:text-rose-400 font-bold hover:underline">Create an Account</Link>
        </p>
      </div>
    </div>
  );
}

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('author');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const { startSignup, directLocalLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await startSignup({ name, email, password, role });
      if (res && res.needsOtp) {
        setShowOtp(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <OtpStep email={email} onBack={() => setShowOtp(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#a91b0d] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-red-500/20">N</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create NewsAxis Account</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Join as an Author to write and publish news and blogs, or as a Reader.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
            {/fetch/i.test(error) && (
              <button
                type="button"
                onClick={() => {
                  directLocalLogin(role);
                  navigate('/');
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#a91b0d] text-white text-xs font-bold hover:bg-[#8e1509] transition-colors cursor-pointer"
              >
                Continue with Direct Session &rarr;
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Password (Min 8 Characters)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
            <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a91b0d]" />
          </div>

          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Select Your Role *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('reader')}
                className={`p-3 rounded-xl border text-left transition-all ${role === 'reader' ? 'border-[#a91b0d] bg-red-50/50 dark:bg-red-950/20 ring-2 ring-[#a91b0d]' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-70 hover:opacity-100'}`}>
                <span className="font-bold text-xs text-slate-900 dark:text-white">📖 Reader</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">Browse, search, and bookmark stories.</p>
              </button>
              <button type="button" onClick={() => setRole('author')}
                className={`p-3 rounded-xl border text-left transition-all ${role === 'author' ? 'border-[#a91b0d] bg-red-50/50 dark:bg-red-950/20 ring-2 ring-[#a91b0d]' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-70 hover:opacity-100'}`}>
                <span className="font-bold text-xs text-slate-900 dark:text-white">✍️ Author</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">Write and publish blogs.</p>
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" loading={loading}
            className="w-full bg-[#a91b0d] hover:bg-[#8e1509] text-white py-2.5 rounded-xl font-bold text-sm shadow-md cursor-pointer mt-2">
            Create Account & Send Code
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-mono">Or Instant Access</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <button
            type="button"
            onClick={() => {
              directLocalLogin(role);
              navigate('/write');
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ⚡ 1-Click Author Access (Start Writing Immediately)
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account? <Link to="/login" className="text-[#a91b0d] dark:text-rose-400 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
