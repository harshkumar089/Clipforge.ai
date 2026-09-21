import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  Zap,
  Flame,
  Film,
  Smile,
  Type,
  Shield,
  Smartphone,
  Sliders,
  Download,
  Layers,
  Wand2,
} from 'lucide-react';
import {
  VideoFilterType,
  VideoTransition,
  VideoEffect,
  ColorAdjustments,
} from '../../types/index.js';

export interface ViralPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: any;
  gradient: string;
  filter: VideoFilterType;
  filterIntensity: number;
  adjustments: ColorAdjustments;
  transition: VideoTransition;
  effect: VideoEffect;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
}

interface ExtraFeaturesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: ViralPreset) => void;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  onAspectRatioChange: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | 'original') => void;
  showSafeZone: boolean;
  onToggleSafeZone: () => void;
  showPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onOpenExport: () => void;
}

export const ExtraFeaturesSidebar: React.FC<ExtraFeaturesSidebarProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  aspectRatio,
  onAspectRatioChange,
  showSafeZone,
  onToggleSafeZone,
  showPhoneFrame,
  onTogglePhoneFrame,
  onOpenExport,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'ambience' | 'formats'>('presets');
  const [confirmed, setConfirmed] = useState(false);

  const presets: ViralPreset[] = [
    {
      id: 'tiktok_hook',
      name: 'TikTok Viral Hook',
      badge: 'High CTR',
      description: 'Punchy Teal/Orange grading with dynamic zoom transition and high visual contrast.',
      icon: Flame,
      gradient: 'from-amber-500 to-rose-600',
      filter: 'cinematic',
      filterIntensity: 100,
      adjustments: { brightness: 5, contrast: 15, saturation: 20, warmth: 10, vignette: 15 },
      transition: { type: 'zoom_in', duration: 0.5, position: 'start' },
      effect: { type: 'none', intensity: 75, speed: 1.0 },
      aspectRatio: '9:16',
    },
    {
      id: 'cinematic_reel',
      name: 'Cinematic Master',
      badge: '4K Film',
      description: 'Film-look subtle warm grade, smooth dissolve transition, and moody vignette.',
      icon: Film,
      gradient: 'from-purple-600 to-indigo-700',
      filter: 'dramatic',
      filterIntensity: 85,
      adjustments: { brightness: -2, contrast: 20, saturation: -5, warmth: 15, vignette: 25 },
      transition: { type: 'fade', duration: 0.8, position: 'both' },
      effect: { type: 'rgb_split', intensity: 30, speed: 0.8 },
      aspectRatio: '9:16',
    },
    {
      id: 'vlog_energy',
      name: 'Vlog Pop & Energy',
      badge: 'Trending',
      description: 'Bright saturated pop styling designed for lifestyle creators and quick clips.',
      icon: Zap,
      gradient: 'from-pink-500 to-amber-400',
      filter: 'vibrant',
      filterIntensity: 95,
      adjustments: { brightness: 10, contrast: 10, saturation: 25, warmth: 5, vignette: 0 },
      transition: { type: 'flash_white', duration: 0.4, position: 'start' },
      effect: { type: 'neon_glow', intensity: 45, speed: 1.0 },
      aspectRatio: '9:16',
    },
    {
      id: 'cyber_phonk',
      name: 'Cyberpunk Phonk',
      badge: 'Viral Edits',
      description: 'Neon synthwave colors, glitch warp transition, and high-frequency edge pop.',
      icon: Sparkles,
      gradient: 'from-cyan-500 to-fuchsia-600',
      filter: 'cyberpunk',
      filterIntensity: 100,
      adjustments: { brightness: 0, contrast: 30, saturation: 35, warmth: -15, vignette: 30 },
      transition: { type: 'glitch', duration: 0.5, position: 'both' },
      effect: { type: 'shake', intensity: 60, speed: 1.2 },
      aspectRatio: '9:16',
    },
    {
      id: 'clean_nordic',
      name: 'Nordic Clean',
      badge: 'Minimalist',
      description: 'Muted, cool minimalist aesthetic popular in tech and educational shorts.',
      icon: Sliders,
      gradient: 'from-sky-500 to-teal-600',
      filter: 'cool',
      filterIntensity: 80,
      adjustments: { brightness: 5, contrast: 5, saturation: -10, warmth: -20, vignette: 5 },
      transition: { type: 'slide_left', duration: 0.6, position: 'start' },
      effect: { type: 'none', intensity: 0, speed: 1.0 },
      aspectRatio: '9:16',
    },
  ];

  const handleSelectPreset = (p: ViralPreset) => {
    setSelectedPresetId(p.id);
    onApplyPreset(p);
  };

  const handleDone = () => {
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 400);
  };

  return (
    <>
      {/* Off-canvas Backdrop for mobile/tablet */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] md:w-[400px] bg-white dark:bg-[#0c071d] border-l border-purple-100 dark:border-purple-900/60 shadow-[-8px_0_35px_rgba(168,85,247,0.22)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0f0924]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/30">
              <Wand2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Extra Features
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                  PRO
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/60">
                1-Click styles & video optimization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-transparent hover:border-purple-200 dark:hover:border-purple-800/60 transition-all cursor-pointer"
            aria-label="Close features sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/30 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white dark:bg-[#130b2b] border border-purple-200/70 dark:border-purple-800/60">
            <button
              onClick={() => setActiveTab('presets')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
            <button
              onClick={() => setActiveTab('ambience')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ambience'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setActiveTab('formats')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'formats'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-5 space-y-5 custom-scrollbar touch-scroll">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    1-Click Viral Style Packs
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-purple-300/60 mt-0.5">
                    Instantly syncs filters, transitions & visual energy.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/60 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-400'
                          : 'border-purple-100 dark:border-purple-900/50 bg-white dark:bg-[#120a28]/70 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${preset.gradient} flex items-center justify-center text-white shadow-md`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {preset.name}
                              </h5>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                {preset.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-1 leading-relaxed">
                              {preset.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-purple-300 dark:border-purple-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'ambience' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Canvas & Safe Zones
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-purple-300/60 mt-0.5">
                  Optimize your clip framing for TikTok, Reels, and Shorts algorithms.
                </p>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-white dark:bg-[#120a28]/70 space-y-3">
                <label className="text-xs font-semibold text-slate-800 dark:text-purple-200 block">
                  Target Canvas Format
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['9:16', '1:1', '4:5', '16:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => onAspectRatioChange(ratio)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                        aspectRatio === ratio
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                          : 'bg-purple-50/60 dark:bg-purple-950/40 text-slate-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100/60'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safe Zone Toggle Card */}
              <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-white dark:bg-[#120a28]/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">UI Safe Zone Overlay</h5>
                    <p className="text-[11px] text-slate-500 dark:text-purple-300/60">Shows TikTok & Reels button boundaries</p>
                  </div>
                </div>

                <button
                  onClick={onToggleSafeZone}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    showSafeZone ? 'bg-purple-600' : 'bg-slate-200 dark:bg-purple-950'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      showSafeZone ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Phone Frame Toggle Card */}
              <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-white dark:bg-[#120a28]/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Realistic Phone Mockup</h5>
                    <p className="text-[11px] text-slate-500 dark:text-purple-300/60">Bezel frame with device proportions</p>
                  </div>
                </div>

                <button
                  onClick={onTogglePhoneFrame}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    showPhoneFrame ? 'bg-purple-600' : 'bg-slate-200 dark:bg-purple-950'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      showPhoneFrame ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'formats' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Quick Export Presets
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-purple-300/60 mt-0.5">
                  Pre-configured export targets for major social algorithms.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'TikTok & Reels Master',
                    dim: '1080 × 1920 (9:16)',
                    fps: '60 FPS Ultra HD',
                    recommended: true,
                  },
                  {
                    title: 'YouTube Shorts High-Bitrate',
                    dim: '1080 × 1920 (9:16)',
                    fps: '30 FPS Crisp Codec',
                    recommended: false,
                  },
                  {
                    title: 'Instagram Square Grid',
                    dim: '1080 × 1080 (1:1)',
                    fps: '30 FPS Feed Format',
                    recommended: false,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-white dark:bg-[#120a28]/70 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        {item.recommended && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-purple-300/60 mt-1 font-mono">
                        {item.dim} • {item.fps}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenExport();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Export
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Universal Sticky "Done / Confirm Effect" Footer */}
        <div className="p-4 border-t border-purple-100 dark:border-purple-900/50 bg-white/95 dark:bg-[#0c071d]/95 backdrop-blur-md shrink-0 flex items-center gap-3 shadow-lg">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDone}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              confirmed
                ? 'bg-emerald-600 shadow-emerald-500/30 scale-[1.02]'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{confirmed ? 'Changes Confirmed!' : 'Done / Confirm Effect'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
