import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scissors,
  Sparkles,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
  Zap,
  Video,
  Layers,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ThemeToggle } from './ThemeToggle.js';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'How It Works', href: '#how-it-works', icon: Zap },
    { name: 'Features', href: '#features', icon: Video },
    { name: 'Formats', href: '#formats', icon: Layers },
    { name: 'Pricing', href: '#pricing', icon: CreditCard },
    { name: 'FAQ', href: '#faq', icon: HelpCircle },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-100/90 dark:border-purple-900/50 bg-white/85 dark:bg-[#0c071d]/90 backdrop-blur-md shadow-[0_4px_25px_-3px_rgba(168,85,247,0.12)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Icon */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300 ring-2 ring-purple-400/25">
            <Scissors className="w-5 h-5 text-white transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors">
            ClipForge
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              AI
            </span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-purple-200/80 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right: Actions, Primary CTA & Theme Toggle */}
        <div className="flex items-center">
          {user ? (
            <Link
              to="/dashboard"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all hover:scale-[1.02] cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-200 group-hover:text-white transition-colors" />
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline">Start Clipping</span>
                <span className="sm:hidden">Start</span>
              </Link>
            </div>
          )}

          {/* Dedicated Spacious Island for Theme Toggle - Completely Uncongested */}
          <div className="flex items-center ml-3 sm:ml-5 pl-3 sm:pl-5 border-l border-purple-200/80 dark:border-purple-800/60">
            <ThemeToggle size="sm" />
          </div>

          {/* Mobile Menu Icon Button with Comfortable Spacing */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-3 p-2 rounded-xl text-slate-600 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/50 transition-all cursor-pointer focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-600 dark:text-purple-300" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-purple-100 dark:border-purple-900/50 bg-white/95 dark:bg-[#0c071d]/95 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>

          {/* Mobile Actions Drawer Footer */}
          {!user && (
            <div className="pt-3 mt-2 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800 text-sm font-medium text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-center"
              >
                <LogIn className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-purple-500/20 text-center"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Start Clipping</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
