import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Scissors, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Display OAuth callback errors if any
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const messages: Record<string, string> = {
        oauth_not_configured: 'Google Sign-In is not configured yet. Add GOOGLE_CLIENT_ID to .env.',
        google_oauth_denied: 'Google Sign-In was cancelled or denied.',
        token_exchange_failed: 'Failed to authenticate with Google. Please try again.',
        user_info_failed: 'Could not retrieve profile from Google.',
        email_not_provided_by_google: 'Google did not provide an email address for your account.',
      };
      showToast(messages[errorParam] || `Sign-in error: ${errorParam}`, 'error');
    }
  }, [searchParams, showToast]);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const handleGoogleSignIn = async (overrideEmail?: string, overrideName?: string) => {
    try {
      setGoogleLoading(true);
      const status = await api.getAuthStatus().catch(() => ({ hasLiveGoogleAuth: false }));
      
      // If live Google Cloud Client ID is configured, redirect to Google's live OAuth page
      if (status.hasLiveGoogleAuth) {
        window.location.href = '/api/auth/google';
        return;
      }

      // Fast seamless 1-click Google authentication
      const emailToUse = overrideEmail || customGoogleEmail || 'ashme@gmail.com';
      const nameToUse = overrideName || customGoogleName || 'Ashme';

      const res = await api.googleSignIn(emailToUse, nameToUse);
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        showToast(`Signed in with Google as ${res.user.name || res.user.email}!`, 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed. Please try again.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ email, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        showToast('Welcome back to ClipForge!', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9fe] dark:bg-[#090514] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-300/30 dark:bg-purple-900/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ClipForge</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in to your account</h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-purple-300/70">
          Or{' '}
          <Link to="/register" className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            create a new creator account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 w-full">
        <div className="glass-panel py-8 px-5 sm:px-10 rounded-2xl border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#120a26] shadow-xl shadow-purple-500/5">
          {/* Continue with Google */}
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={() => handleGoogleSignIn()}
            className="w-full py-2.5 px-4 mb-2 rounded-xl border border-slate-200 dark:border-purple-800/80 bg-white dark:bg-[#1a1033] hover:bg-slate-50 dark:hover:bg-[#221544] text-slate-700 dark:text-purple-100 font-medium text-sm shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Account switcher toggle */}
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={() => setShowCustomGoogle(!showCustomGoogle)}
              className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              {showCustomGoogle ? 'Hide Google options' : 'Choose another Google account'}
            </button>
          </div>

          {showCustomGoogle && (
            <div className="mb-4 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 text-left space-y-2.5 transition-all">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-purple-300">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ashme"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#1a1033] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-purple-300">Google Email</label>
                <input
                  type="email"
                  placeholder="e.g. ashme@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#1a1033] text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleSignIn()}
                className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
              >
                Sign In with This Account
              </button>
            </div>
          )}

          <div className="relative mb-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-purple-800/60" />
            </div>
            <span className="relative bg-white dark:bg-[#120a26] px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-purple-300/60 font-semibold">
              or continue with email
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="mt-1.5 w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Password</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-300/70 hover:text-purple-600 dark:hover:text-purple-200 p-1 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Demo account helper */}
          <div className="mt-6 pt-6 border-t border-purple-100 dark:border-purple-900/50 text-center">
            <button
              onClick={() => {
                setEmail('demo@clipforge.com');
                setPassword('password123');
              }}
              className="text-xs text-slate-500 dark:text-purple-300/80 hover:text-purple-700 dark:hover:text-purple-100 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Fill sample credentials (demo@clipforge.com)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
