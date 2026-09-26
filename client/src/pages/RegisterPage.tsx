import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowRight, Loader2, Eye, EyeOff, LogIn, X } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Modal for entering Google Account credentials when live Google Cloud keys are not in .env
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [modalGoogleEmail, setModalGoogleEmail] = useState('');
  const [modalGooglePassword, setModalGooglePassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [modalGoogleName, setModalGoogleName] = useState('');

  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Handle standard registration (Name + Email + Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast('Please fill in your name, email, and password.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({ name: name.trim(), email: email.trim(), password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        showToast('Account created successfully! Welcome to ClipForge.', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed. This email may already be in use.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Direct Sign in / Sign up with Google
  const handleGoogleSignUpClick = async () => {
    try {
      setGoogleLoading(true);
      const status = await api.getAuthStatus().catch(() => ({ hasLiveGoogleAuth: false }));

      if (status.hasLiveGoogleAuth) {
        window.location.href = '/api/auth/google';
        return;
      }

      // If no live keys in .env, open the Google Account prompt modal
      setShowGoogleModal(true);
    } catch (err: any) {
      showToast('Failed to initialize Google Sign-Up.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Complete Google Sign-Up with user's personal Google email & name
  const handleModalGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGoogleEmail || !modalGooglePassword) {
      showToast('Please enter your Google email and a password.', 'error');
      return;
    }
    if (modalGooglePassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setGoogleLoading(true);
      const res = await api.googleSignIn({
        email: modalGoogleEmail,
        password: modalGooglePassword,
        name: modalGoogleName || modalGoogleEmail.split('@')[0],
      });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        setShowGoogleModal(false);
        showToast(`Signed up successfully with Google (${res.user.email})!`, 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign-up failed.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9fe] dark:bg-[#090514] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-300/30 dark:bg-purple-900/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ClipForge</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Your Account</h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-purple-300/70">
          Enter your details or continue with your Google account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 w-full">
        <div className="glass-panel py-8 px-5 sm:px-10 rounded-2xl border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#120a26] shadow-xl shadow-purple-500/5">

          {/* 1. Direct Sign up with Google */}
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={handleGoogleSignUpClick}
            className="w-full py-2.5 px-4 mb-5 rounded-xl border border-slate-200 dark:border-purple-800/80 bg-white dark:bg-[#1a1033] hover:bg-slate-50 dark:hover:bg-[#221544] text-slate-700 dark:text-purple-100 font-medium text-sm shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-60"
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
            <span>{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative mb-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-purple-800/60" />
            </div>
            <span className="relative bg-white dark:bg-[#120a26] px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-purple-300/60 font-semibold">
              or create with email
            </span>
          </div>

          {/* 2. Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 dark:text-purple-200">
                Full Name
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="mt-1.5 w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 dark:text-purple-200">
                Email Address
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@domain.com"
                className="mt-1.5 w-full bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/50 focus:outline-none focus:bg-white dark:focus:bg-[#180e33] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 dark:text-purple-200">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 3. Link back to Sign In */}
          <div className="mt-6 pt-5 border-t border-purple-100 dark:border-purple-900/40 text-center">
            <p className="text-xs text-slate-500 dark:text-purple-300/80 mb-3">
              Already have an account?
            </p>
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <LogIn className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Sign In to Existing Account</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Personal Google ID Sign-Up Modal (when live Google Cloud keys are not set in .env) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#160d30] border border-purple-200 dark:border-purple-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Sign Up with Google</h3>
                <p className="text-[11px] text-slate-500 dark:text-purple-300/70">Enter your Google account details</p>
              </div>
            </div>

            <form onSubmit={handleModalGoogleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={modalGoogleEmail}
                  onChange={(e) => setModalGoogleEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={modalGooglePassword}
                    onChange={(e) => setModalGooglePassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 p-0.5"
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Your Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={modalGoogleName}
                  onChange={(e) => setModalGoogleName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={googleLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
