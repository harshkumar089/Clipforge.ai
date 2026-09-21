import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Film,
  Scissors,
  Settings,
  LogOut,
  Zap,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload Video', icon: UploadCloud },
    { to: '/videos', label: 'My Videos', icon: Film },
    { to: '/clips', label: 'My Clips', icon: Scissors },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  const handleItemClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 border-r border-purple-100/90 dark:border-purple-900/50 bg-white/95 dark:bg-[#0c071d]/95 backdrop-blur-md flex flex-col h-screen shrink-0 select-none shadow-[4px_0_24px_-4px_rgba(168,85,247,0.12)] transition-all duration-300 z-50 fixed inset-y-0 left-0 md:static ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 sm:p-6 border-b border-purple-100/80 dark:border-purple-900/40 flex items-center justify-between">
          <NavLink to="/dashboard" onClick={handleItemClick} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25 ring-2 ring-purple-400/20">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors">
              ClipForge
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                AI
              </span>
            </span>
          </NavLink>

          {/* Close Button on Mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-purple-300/50 uppercase tracking-wider px-3 mb-2">
            Studio
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.4)] font-semibold'
                      : 'text-slate-600 dark:text-purple-200/70 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50/80 dark:hover:bg-purple-900/30'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Usage Plan Box with Purple Ambient Glow */}
        <div className="p-4 mx-4 mb-4 rounded-xl border border-purple-200/80 dark:border-purple-800/50 bg-gradient-to-b from-purple-50/70 to-purple-100/30 dark:from-purple-950/40 dark:to-[#170e30] shadow-[0_0_20px_rgba(168,85,247,0.12)]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-800 dark:text-purple-100 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Creator Plan
            </span>
            <span className="text-purple-700 dark:text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100/80 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700/60 shadow-[0_0_8px_rgba(168,85,247,0.2)]">Active</span>
          </div>
          <div className="w-full bg-purple-200/60 dark:bg-purple-950/80 rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-1.5 rounded-full w-2/5 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-purple-300/60 flex justify-between">
            <span>Up to 4K & Long-form</span>
            <span>Unlimited clips</span>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-purple-100/80 dark:border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm ring-2 ring-purple-300/40 dark:ring-purple-700/50 overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold text-slate-900 dark:text-purple-100 truncate">{user?.name || 'Creator'}</div>
              <div className="text-xs text-slate-400 dark:text-purple-300/50 truncate">{user?.email || 'user@clipforge.io'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
