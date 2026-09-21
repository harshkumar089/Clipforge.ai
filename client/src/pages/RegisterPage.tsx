import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({ name, email, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        showToast('Account created successfully!', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create your creator account</h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-purple-300/70">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 w-full">
        <div className="glass-panel py-8 px-5 sm:px-10 rounded-2xl border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#120a26] shadow-xl shadow-purple-500/5">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => { window.location.href = '/api/auth/google'; }}
            className="w-full py-2.5 px-4 mb-2 rounded-xl border border-slate-200 dark:border-purple-800/80 bg-white dark:bg-[#1a1033] hover:bg-slate-50 dark:hover:bg-[#221544] text-slate-700 dark:text-purple-100 font-medium text-sm shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] cursor-pointer"
          >
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
            <span>Continue with Google</span>
          </button>

          {/* Quick 1-Click Google Sign-In */}
          <button
            type="button"
            onClick={() => { window.location.href = '/api/auth/google?auto=true'; }}
            className="w-full py-1.5 px-3 mb-5 rounded-lg text-[11px] font-medium text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>⚡ 1-Click Instant Sign-In as Ashme (Google)</span>
          </button>

          <div className="relative mb-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-purple-800/60" />
            </div>
            <span className="relative bg-white dark:bg-[#120a26] px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-purple-300/60 font-semibold">
              or create with email
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="mt-1.5 w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@creator.com"
                className="mt-1.5 w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5 w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
