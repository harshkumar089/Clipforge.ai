import React, { useState } from 'react';
import { User, Mail, Shield, Save, CheckCircle2, HardDrive, Cpu, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateProfile({ name });
      if (res.success && res.user) {
        updateUser(res.user);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your creator profile and processing preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-100 dark:border-purple-800/60 bg-white/95 dark:bg-[#120a26]/90 shadow-sm shadow-purple-900/5 space-y-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Personal Information
          </h3>

          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Creator Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full bg-purple-50/40 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1.5 w-full bg-slate-100/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl px-3.5 py-2 text-sm text-slate-500 dark:text-purple-300/60 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 dark:text-purple-300/60 mt-1 block">
                Contact support to modify your primary email address.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Processing Engine Info */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-100 dark:border-purple-800/60 bg-white/95 dark:bg-[#120a26]/90 shadow-sm shadow-purple-900/5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Video Processing Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/40 border border-purple-100/80 dark:border-purple-800/60 space-y-1">
              <div className="text-slate-500 dark:text-purple-300/70 font-medium">Renderer</div>
              <div className="text-slate-800 dark:text-purple-100 font-bold font-mono">FFmpeg 9.0.1 H.264/AAC</div>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/40 border border-purple-100/80 dark:border-purple-800/60 space-y-1">
              <div className="text-slate-500 dark:text-purple-300/70 font-medium">Metadata Inspector</div>
              <div className="text-slate-800 dark:text-purple-100 font-bold font-mono">FFprobe JSON Streamer</div>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/40 border border-purple-100/80 dark:border-purple-800/60 space-y-1">
              <div className="text-slate-500 dark:text-purple-300/70 font-medium">Auto-Clip Engine</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">ClipAnalyzer v1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
