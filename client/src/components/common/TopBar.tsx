import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  Sparkles,
  Film,
  Scissors,
  UploadCloud,
  LayoutDashboard,
  Settings,
  LogOut,
  CheckCheck,
  X,
  Command,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { ThemeToggle } from './ThemeToggle.js';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onOpenSidebar?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, onOpenSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'AI Virality Analysis Ready',
      desc: '3 viral segments extracted with 90+ score.',
      time: '5m ago',
      unread: true,
    },
    {
      id: '2',
      title: 'Batch Export Ready',
      desc: 'All 9:16 vertical clips rendered successfully.',
      time: '1h ago',
      unread: true,
    },
    {
      id: '3',
      title: 'New Feature: Canvas Stickers',
      desc: 'Drag, drop, and resize interactive stickers anywhere.',
      time: '1d ago',
      unread: false,
    },
  ]);

  // Profile menu state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotifOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const commandItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Upload Video', path: '/upload', icon: UploadCloud, category: 'Actions' },
    { label: 'My Videos', path: '/videos', icon: Film, category: 'Navigation' },
    { label: 'My Clips', path: '/clips', icon: Scissors, category: 'Navigation' },
    { label: 'Account Settings', path: '/settings', icon: Settings, category: 'Preferences' },
  ];

  const filteredCommands = commandItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCommandSelect = (path: string) => {
    setCommandPaletteOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  return (
    <>
      <header className="h-16 border-b border-purple-100/90 dark:border-purple-900/50 bg-white/85 dark:bg-[#0d0820]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_-3px_rgba(168,85,247,0.08)] transition-colors duration-300">
        {/* Left side: Hamburger menu (mobile), Theme Toggle, and Title */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/50 transition-colors cursor-pointer shrink-0"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Animated Dark / Light Mode Switch */}
          <div className="flex items-center shrink-0">
            <ThemeToggle size="sm" />
          </div>

          {/* Vertical divider */}
          <div className="h-5 w-px bg-purple-200/80 dark:bg-purple-800/60 hidden sm:block shrink-0" />

          <div className="min-w-0">
            {title && (
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight transition-colors truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-purple-300/70 transition-colors hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Search, Upload CTA, Notifications, Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Command Palette Search Button */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-slate-500 dark:text-purple-300/80 hover:text-purple-700 dark:hover:text-purple-100 hover:border-purple-300 dark:hover:border-purple-700 text-xs transition-all shadow-xs cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Quick search or jump...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700/60 rounded text-purple-700 dark:text-purple-300 shadow-xs">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* New Clip / Upload CTA */}
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 dark:shadow-[0_0_18px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Video</span>
          </button>

          {/* Notifications Popover Container */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              title="Notifications"
              className="relative p-2 rounded-xl text-slate-500 dark:text-purple-300/80 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-transparent hover:border-purple-200 dark:hover:border-purple-800/60 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 ring-2 ring-white dark:ring-[#0d0820] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white dark:bg-[#120a26] border border-purple-200 dark:border-purple-800/80 shadow-2xl shadow-purple-950/20 z-50 animate-scale-in overflow-hidden">
                <div className="p-3.5 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-purple-100/60 dark:divide-purple-900/40 max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs transition-colors hover:bg-purple-50/50 dark:hover:bg-purple-950/30 ${
                        item.unread ? 'bg-purple-50/30 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800 dark:text-purple-100">{item.title}</span>
                        <span className="text-[10px] text-slate-400 dark:text-purple-400/60 shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-purple-200/80 dark:bg-purple-800/60 mx-0.5" />

          {/* Profile Menu Container */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm cursor-pointer ring-2 ring-purple-200 dark:ring-purple-800/70 shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform shrink-0 overflow-hidden"
              aria-label="User profile menu"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#120a26] border border-purple-200 dark:border-purple-800/80 shadow-2xl shadow-purple-950/20 z-50 animate-scale-in overflow-hidden">
                <div className="p-3 border-b border-purple-100 dark:border-purple-900/50 flex items-center gap-2.5">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {user?.name || 'Creator'}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-purple-300/60 truncate">
                      {user?.email || 'user@clipforge.io'}
                    </div>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-purple-500" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette Dialog (Ctrl+K / ⌘K) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#120a26] border border-purple-200 dark:border-purple-800/80 shadow-2xl shadow-purple-950/40 overflow-hidden animate-scale-in">
            {/* Search input header */}
            <div className="p-3.5 border-b border-purple-100 dark:border-purple-900/50 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-purple-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command or jump to page..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-400/50 focus:outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-purple-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Command items list */}
            <div className="p-2 max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-purple-300/60">
                  No commands or pages found for "{searchQuery}".
                </div>
              ) : (
                filteredCommands.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleCommandSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs text-slate-700 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-white transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:scale-105 transition-transform">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-slate-800 dark:text-purple-100">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-purple-500/70 font-mono uppercase tracking-wider">
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal footer hints */}
            <div className="px-4 py-2 border-t border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/30 flex items-center justify-between text-[11px] text-slate-400 dark:text-purple-300/60">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                Navigate instantly with ClipForge Command
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-purple-900/60 text-[10px] font-mono border border-purple-200 dark:border-purple-700">
                ESC to close
              </kbd>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

