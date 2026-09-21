import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      data-theme-toggle="true"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      onClick={(e) => toggleTheme(e)}
      title={isDark ? 'Switch to Light Mode (Sun)' : 'Switch to Dark Mode (Moon)'}
      className={`relative inline-flex items-center select-none rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 cursor-pointer group ${
        isDark
          ? 'bg-[#1a1233] border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
          : 'bg-[#f3e8ff]/80 border border-purple-200/90 shadow-[0_0_12px_rgba(147,51,234,0.18)] hover:border-purple-300'
      } ${
        isSmall
          ? 'w-13 h-7 p-0.5'
          : 'w-16 h-8.5 p-1'
      } ${className}`}
    >
      {/* Background Starlets / Sky Ambiance */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {/* Dark Mode Stars */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 flex items-center justify-between px-2 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-300 animate-pulse" />
          <span className="w-1 h-1 rounded-full bg-indigo-300/80"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-200"></span>
        </div>

        {/* Light Mode Soft Glow Waves */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-amber-100/30 via-purple-100/40 to-indigo-100/30 transition-opacity duration-300 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>

      {/* Floating Animated Sliding Knob */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
          isSmall ? 'w-6 h-6' : 'w-6.5 h-6.5'
        } ${
          isDark
            ? 'translate-x-[26px] bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.7)]'
            : 'translate-x-0.5 bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
        }`}
      >
        {isDark ? (
          <Moon
            className={`${
              isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'
            } text-purple-100 transform transition-transform duration-300 rotate-0`}
          />
        ) : (
          <Sun
            className={`${
              isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'
            } text-amber-900 transform transition-transform duration-300 rotate-0 group-hover:rotate-45`}
          />
        )}
      </div>

      {/* Subtle indicator label for screen readers */}
      <span className="sr-only">
        {isDark ? 'Current theme: Dark' : 'Current theme: Light'}
      </span>
    </button>
  );
};
