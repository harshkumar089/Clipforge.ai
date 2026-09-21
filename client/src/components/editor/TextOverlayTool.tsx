import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Type,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Check,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Move,
  Clock,
  ZoomIn,
  Zap,
  Sliders,
  Flame,
  Maximize2,
} from 'lucide-react';
import { TextOverlay, TextAnimationType } from '../../types/index.js';
import { FONTS_CATALOG, FONT_CATEGORIES, CURATED_SHORT_FORM_FONTS, loadGoogleFont } from '../../utils/fonts.js';
import { CREATOR_PALETTES, POPULAR_COLORS } from '../../utils/colorPresets.js';
import { KINETIC_PRESETS } from '../../utils/kineticPresets.js';
import { KineticText } from '../video/KineticText.js';
import { FontPickerModal } from './FontPickerModal.js';

interface TextOverlayToolProps {
  overlays: TextOverlay[];
  onChange: (overlays: TextOverlay[]) => void;
  clipDuration: number;
}

// ─── Premium Style Templates with Kinetic Typography ─────────────────────────
const TEXT_STYLE_TEMPLATES = [
  {
    id: 'bold-hook',
    label: 'Bold Hook',
    emoji: '🔥',
    fontFamily: 'Bebas Neue',
    fontSize: 38,
    color: '#FFE600',
    outlineColor: '#000000',
    outlineWidth: 3,
    shadowStyle: 'hard' as const,
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.0,
    isBold: false,
    isUppercase: true,
    letterSpacing: 3,
    animation: 'punch' as TextAnimationType,
    animationDuration: 0.5,
    animationDelay: 0,
    animationIntensity: 85,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  {
    id: 'viral-white',
    label: 'Viral White',
    emoji: '⚡',
    fontFamily: 'Montserrat',
    fontSize: 30,
    color: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowStyle: 'soft' as const,
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.55,
    isBold: true,
    isUppercase: false,
    letterSpacing: 0,
    animation: 'pop' as TextAnimationType,
    animationDuration: 0.55,
    animationDelay: 0,
    animationIntensity: 80,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  {
    id: 'neon-glow',
    label: 'Neon Glow',
    emoji: '💜',
    fontFamily: 'Space Grotesk',
    fontSize: 28,
    color: '#E040FB',
    outlineColor: '#7B1FA2',
    outlineWidth: 1,
    shadowStyle: 'glow' as const,
    shadowColor: '#E040FB',
    backgroundColor: '#000000',
    backgroundOpacity: 0.0,
    isBold: true,
    isUppercase: true,
    letterSpacing: 3,
    animation: 'glitch' as TextAnimationType,
    animationDuration: 0.6,
    animationDelay: 0,
    animationIntensity: 75,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  {
    id: 'cinema',
    label: 'Cinema',
    emoji: '🎬',
    fontFamily: 'Playfair Display',
    fontSize: 28,
    color: '#F5F0E8',
    outlineColor: '#000000',
    outlineWidth: 0,
    shadowStyle: 'soft' as const,
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.0,
    isBold: false,
    isUppercase: false,
    letterSpacing: 2,
    animation: 'fade_up' as TextAnimationType,
    animationDuration: 0.7,
    animationDelay: 0,
    animationIntensity: 70,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  {
    id: 'pop-title',
    label: 'Pop Title',
    emoji: '💬',
    fontFamily: 'Poppins',
    fontSize: 26,
    color: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowStyle: 'none' as const,
    shadowColor: '#000000',
    backgroundColor: '#6366F1',
    backgroundOpacity: 0.90,
    isBold: true,
    isUppercase: false,
    letterSpacing: 0,
    animation: 'bounce' as TextAnimationType,
    animationDuration: 0.7,
    animationDelay: 0,
    animationIntensity: 75,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  {
    id: 'hype-red',
    label: 'Hype Red',
    emoji: '🔴',
    fontFamily: 'Anton',
    fontSize: 36,
    color: '#FFFFFF',
    outlineColor: '#CC0000',
    outlineWidth: 3,
    shadowStyle: 'hard' as const,
    shadowColor: '#660000',
    backgroundColor: '#CC0000',
    backgroundOpacity: 0.0,
    isBold: false,
    isUppercase: true,
    letterSpacing: 2,
    animation: 'scale_in' as TextAnimationType,
    animationDuration: 0.5,
    animationDelay: 0,
    animationIntensity: 85,
    fontWeight: 800,
    lineHeight: 1.0,
  },
  {
    id: 'minimal-clean',
    label: 'Minimal',
    emoji: '✨',
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 0,
    shadowStyle: 'soft' as const,
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.0,
    isBold: false,
    isUppercase: false,
    letterSpacing: 0,
    animation: 'typewriter' as TextAnimationType,
    animationDuration: 0.9,
    animationDelay: 0,
    animationIntensity: 65,
    fontWeight: 600,
    lineHeight: 1.25,
  },
  {
    id: 'ultra-impact',
    label: 'Ultra Impact',
    emoji: '💥',
    fontFamily: 'Archivo Black',
    fontSize: 34,
    color: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowStyle: 'hard' as const,
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.0,
    isBold: false,
    isUppercase: true,
    letterSpacing: 1,
    animation: 'punch' as TextAnimationType,
    animationDuration: 0.45,
    animationDelay: 0,
    animationIntensity: 90,
    fontWeight: 900,
    lineHeight: 1.1,
  },
];

// ─── 12 Kinetic Typography Presets ───────────────────────────────────────────
const KINETIC_ANIMATIONS: {
  value: TextAnimationType;
  label: string;
  icon: string;
  category: string;
  description: string;
}[] = [
  { value: 'pop', label: 'Pop', icon: '💥', category: 'Spring', description: 'Elastic overshoot bounce' },
  { value: 'punch', label: 'Punch', icon: '🥊', category: 'Impact', description: 'Snappy heavy punch and instant settle' },
  { value: 'scale_in', label: 'Scale In', icon: '🔍', category: 'Entrance', description: 'Explosive zoom from center' },
  { value: 'bounce', label: 'Bounce', icon: '🏀', category: 'Spring', description: 'Elastic vertical drop with rebound' },
  { value: 'slide_up', label: 'Slide Up', icon: '🚀', category: 'Entrance', description: 'Fast upward momentum entrance' },
  { value: 'fade_up', label: 'Fade Up', icon: '⬆️', category: 'Entrance', description: 'Smooth upward drift with soft fade' },
  { value: 'glitch', label: 'Glitch', icon: '⚡', category: 'Stylized', description: 'Cyber RGB chromatic displacement' },
  { value: 'typewriter', label: 'Typewriter', icon: '⌨️', category: 'Reveal', description: 'Letter-by-letter reveal with cursor' },
  { value: 'character_reveal', label: 'Char Reveal', icon: '🔤', category: 'Reveal', description: 'Cascading character entrance' },
  { value: 'word_highlight', label: 'Highlight', icon: '💡', category: 'Reveal', description: 'Sequential word glow accent' },
  { value: 'karaoke', label: 'Karaoke', icon: '🎤', category: 'Reveal', description: 'Continuous progressive color wipe' },
  { value: 'smooth_tracking', label: 'Tracking', icon: '🌊', category: 'Stylized', description: 'Expanding letter-spacing drift' },
  { value: 'none', label: 'Static', icon: '⏸️', category: 'Basic', description: 'Clean static text with zero motion' },
];

// ─── Kinetic Live Mini-Preview Component ─────────────────────────────────────
const KineticMiniPreview: React.FC<{ overlay: TextOverlay }> = ({ overlay }) => {
  const [localTime, setLocalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = overlay.animationDuration || 0.6;
  const delay = overlay.animationDelay || 0;
  const totalCycle = Math.max(1.8, duration + delay + 1.2);

  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let startTimestamp: number | null = null;

    const step = (now: number) => {
      if (startTimestamp === null) startTimestamp = now;
      const elapsed = (now - startTimestamp) / 1000;
      const cycleTime = elapsed % totalCycle;
      setLocalTime(cycleTime);
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [totalCycle, isPlaying, overlay.animation, overlay.animationDuration, overlay.animationDelay, overlay.animationIntensity]);

  return (
    <div className="relative w-full h-24 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-xl overflow-hidden border border-purple-500/25 shadow-inner flex flex-col justify-between p-2.5">
      {/* Top Header */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 z-10 select-none">
        <span className="flex items-center gap-1 font-mono text-purple-300 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Motion · {localTime.toFixed(2)}s
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLocalTime(0);
            setIsPlaying(true);
          }}
          className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[9px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Replay
        </button>
      </div>

      {/* Render text with KineticText */}
      <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none overflow-hidden">
        <KineticText
          overlay={{
            ...overlay,
            fontSize: Math.min(overlay.fontSize || 28, 20),
            position: 'center',
            xPercent: 50,
            yPercent: 50,
            startTime: 0,
            endTime: 99,
          }}
          currentTime={localTime}
          scaleFactor={0.75}
        />
      </div>

      {/* Progress loop bar */}
      <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden z-10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-75"
          style={{ width: `${Math.min(100, (localTime / totalCycle) * 100)}%` }}
        />
      </div>
    </div>
  );
};

// ─── Inline Font Picker ───────────────────────────────────────────────────────
const InlineFontPicker: React.FC<{
  currentFont: string;
  previewText: string;
  onSelect: (font: string) => void;
  onClose: () => void;
}> = ({ currentFont, previewText, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    FONTS_CATALOG.slice(0, 24).forEach((f) => loadGoogleFont(f.family));
  }, []);

  const filtered = useMemo(() => {
    return FONTS_CATALOG.filter((f) => {
      const matchesCat = activeCategory === 'all' || f.category === activeCategory;
      const matchesQ = f.name.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQ;
    });
  }, [query, activeCategory]);

  useEffect(() => {
    filtered.slice(0, 32).forEach((f) => loadGoogleFont(f.family));
  }, [filtered]);

  const cats = [
    { id: 'all', label: 'All' },
    { id: 'viral', label: '🔥 Viral' },
    { id: 'sans', label: 'Modern' },
    { id: 'serif', label: 'Luxury' },
    { id: 'handwriting', label: '✍️ Script' },
    { id: 'gaming', label: '🎮 Gaming' },
    { id: 'retro', label: 'Retro' },
    { id: 'mono', label: 'Mono' },
  ];

  return (
    <div className="absolute left-0 top-full mt-1 z-50 w-full bg-white border border-purple-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      style={{ maxHeight: '380px' }}>
      {/* Search */}
      <div className="p-2.5 border-b border-purple-100 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 110+ fonts..."
            className="w-full pl-8 pr-8 py-1.5 text-xs border border-purple-200 rounded-xl focus:outline-none focus:border-purple-400 bg-purple-50/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Category pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                activeCategory === c.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-slate-600 hover:bg-purple-100 border border-purple-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font list */}
      <div className="flex-1 overflow-y-auto divide-y divide-purple-50">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No fonts found</div>
        ) : (
          filtered.map((font) => {
            const isSelected = currentFont.toLowerCase() === font.family.toLowerCase();
            return (
              <button
                key={font.id}
                onClick={() => { onSelect(font.family); onClose(); }}
                onMouseEnter={() => loadGoogleFont(font.family)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all ${
                  isSelected ? 'bg-purple-50' : 'hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    style={{ fontFamily: `${font.family}, sans-serif` }}
                    className="text-base text-slate-900 leading-none shrink-0"
                  >
                    {previewText.slice(0, 16) || font.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {font.popular && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-semibold">
                      ★
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-mono">{font.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-purple-600" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-purple-100 flex items-center justify-between bg-purple-50/30">
        <span className="text-[10px] text-slate-500">{filtered.length} fonts available</span>
        <button onClick={onClose} className="text-[11px] text-purple-700 font-semibold hover:underline">
          Close
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TextOverlayTool: React.FC<TextOverlayToolProps> = ({
  overlays,
  onChange,
  clipDuration,
}) => {
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [fontPickerOpenId, setFontPickerOpenId] = useState<string | null>(null);
  const [fontModalOpen, setFontModalOpen] = useState(false);
  const [stylesOpenId, setStylesOpenId] = useState<string | null>(null);
  const [timingOpenId, setTimingOpenId] = useState<string | null>(null);

  const addOverlay = (template?: typeof TEXT_STYLE_TEMPLATES[0]) => {
    const base = template || TEXT_STYLE_TEMPLATES[0];
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: 'YOUR TEXT HERE',
      fontFamily: base.fontFamily,
      fontSize: base.fontSize,
      color: base.color,
      outlineColor: base.outlineColor,
      outlineWidth: base.outlineWidth,
      shadowStyle: base.shadowStyle,
      shadowColor: base.shadowColor,
      backgroundColor: base.backgroundColor,
      backgroundOpacity: base.backgroundOpacity,
      position: 'custom',
      xPercent: 50,
      yPercent: 20,
      isBold: base.isBold,
      isUppercase: base.isUppercase,
      letterSpacing: base.letterSpacing,
      alignment: 'center',
      startTime: 0,
      endTime: clipDuration,
      animation: base.animation || 'pop',
      animationDuration: base.animationDuration || 0.6,
      animationDelay: base.animationDelay || 0,
      animationIntensity: base.animationIntensity || 80,
      fontWeight: base.fontWeight || 700,
      lineHeight: base.lineHeight || 1.2,
    };
    const updated = [...overlays, newOverlay];
    onChange(updated);
    setActiveLayerId(newOverlay.id);
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    onChange(overlays.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeOverlay = (id: string) => {
    onChange(overlays.filter((item) => item.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  const applyTemplate = (id: string, template: typeof TEXT_STYLE_TEMPLATES[0]) => {
    updateOverlay(id, {
      fontFamily: template.fontFamily,
      fontSize: template.fontSize,
      color: template.color,
      outlineColor: template.outlineColor,
      outlineWidth: template.outlineWidth,
      shadowStyle: template.shadowStyle,
      shadowColor: template.shadowColor,
      backgroundColor: template.backgroundColor,
      backgroundOpacity: template.backgroundOpacity,
      isBold: template.isBold,
      isUppercase: template.isUppercase,
      letterSpacing: template.letterSpacing,
      animation: template.animation || 'pop',
      animationDuration: template.animationDuration || 0.6,
      animationDelay: template.animationDelay || 0,
      animationIntensity: template.animationIntensity || 80,
      fontWeight: template.fontWeight || 700,
      lineHeight: template.lineHeight || 1.2,
    });
  };

  return (
    <div className="space-y-4" onClick={() => setFontPickerOpenId(null)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Type className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Text & Titles</span>
            {overlays.length > 0 && (
              <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {overlays.length}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => addOverlay()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Text
        </button>
      </div>

      {/* ── Style Template Cards ── */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-500" />
          Quick Style Templates
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {TEXT_STYLE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() =>
                activeLayerId ? applyTemplate(activeLayerId, tmpl) : addOverlay(tmpl)
              }
              className="group relative flex flex-col items-center gap-1 p-2 rounded-xl border border-purple-100 bg-white hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-md transition-all active:scale-95"
              title={`${activeLayerId ? 'Apply' : 'Add'}: ${tmpl.label}`}
            >
              {/* Mini styled preview */}
              <div
                className="w-full h-8 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: tmpl.backgroundOpacity > 0.05
                    ? `${tmpl.backgroundColor}${Math.round(tmpl.backgroundOpacity * 255).toString(16).padStart(2, '0')}`
                    : '#1a1a2e',
                }}
              >
                <span
                  style={{
                    fontFamily: `${tmpl.fontFamily}, sans-serif`,
                    color: tmpl.color,
                    fontSize: '10px',
                    fontWeight: tmpl.isBold ? '700' : '400',
                    letterSpacing: `${Math.min(tmpl.letterSpacing, 2)}px`,
                    textTransform: tmpl.isUppercase ? 'uppercase' : 'none',
                    WebkitTextStroke: tmpl.outlineWidth > 0 ? `0.5px ${tmpl.outlineColor}` : 'none',
                    textShadow:
                      tmpl.shadowStyle === 'glow'
                        ? `0 0 6px ${tmpl.shadowColor}`
                        : tmpl.shadowStyle !== 'none'
                        ? `1px 1px 2px ${tmpl.shadowColor}`
                        : 'none',
                  }}
                  className="text-center truncate px-1"
                >
                  {tmpl.emoji} Aa
                </span>
              </div>
              <span className="text-[9px] text-slate-600 font-medium truncate w-full text-center">
                {tmpl.label}
              </span>
            </button>
          ))}
        </div>
        {activeLayerId && (
          <p className="text-[10px] text-purple-600 mt-1.5 text-center font-medium">
            ↑ Tap a style to apply to selected layer
          </p>
        )}
      </div>

      {/* ── Empty State ── */}
      {overlays.length === 0 ? (
        <div className="p-8 rounded-2xl border-2 border-dashed border-purple-200 text-center bg-purple-50/20">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
            <Type className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No text layers yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Pick a style template above or add a blank text layer
          </p>
          <button
            onClick={() => addOverlay()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Text Layer
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {overlays.map((item, idx) => {
            const isActive = activeLayerId === item.id;
            const isStyleOpen = stylesOpenId === item.id;
            const isTimingOpen = timingOpenId === item.id;
            const isFontOpen = fontPickerOpenId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all overflow-visible ${
                  isActive
                    ? 'border-purple-400 bg-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-300/40'
                    : 'border-purple-100 bg-white hover:border-purple-200 shadow-sm'
                }`}
              >
                {/* ── Layer Header ── */}
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer"
                  onClick={() => setActiveLayerId(isActive ? null : item.id)}
                >
                  {/* Layer number badge */}
                  <span
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Mini live preview of styled text */}
                  <div className="flex-1 min-w-0">
                    <span
                      style={{
                        fontFamily: `${item.fontFamily || 'Bebas Neue'}, sans-serif`,
                        color: item.color || '#ffffff',
                        fontWeight: item.isBold ? '700' : '400',
                        textTransform: item.isUppercase ? 'uppercase' : 'none',
                        fontSize: '13px',
                        letterSpacing: `${Math.min(item.letterSpacing || 0, 3)}px`,
                        textShadow:
                          item.shadowStyle === 'glow'
                            ? `0 0 8px ${item.shadowColor || '#000'}`
                            : item.shadowStyle && item.shadowStyle !== 'none'
                            ? `1px 1px 3px ${item.shadowColor || '#000'}`
                            : 'none',
                        WebkitTextStroke:
                          (item.outlineWidth || 0) > 0
                            ? `${Math.min(item.outlineWidth || 0, 1)}px ${item.outlineColor || '#000'}`
                            : 'none',
                      }}
                      className="block truncate leading-tight font-medium"
                    >
                      {item.text || 'Untitled Text'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.fontFamily || 'Bebas Neue'} · {item.fontSize}px · {item.animation && item.animation !== 'none' ? `✨ ${item.animation}` : 'Static'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isActive ? <ChevronUp className="w-3.5 h-3.5 text-purple-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeOverlay(item.id); }}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Expanded Editor ── */}
                {isActive && (
                  <div className="px-3.5 pb-3.5 space-y-3 border-t border-purple-100/60 pt-3" onClick={(e) => e.stopPropagation()}>

                    {/* Text content textarea */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Content</label>
                      <textarea
                        value={item.text}
                        onChange={(e) => updateOverlay(item.id, { text: e.target.value })}
                        placeholder="Your headline text..."
                        rows={2}
                        className="w-full bg-slate-50 border border-purple-200/80 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 resize-none transition-all"
                        style={{
                          fontFamily: `${item.fontFamily || 'Bebas Neue'}, sans-serif`,
                          color: item.color || '#ffffff',
                          backgroundColor: item.backgroundOpacity && item.backgroundOpacity > 0.1 ? '#1a1a2e' : undefined,
                          fontWeight: item.isBold ? '700' : '400',
                          textTransform: item.isUppercase ? 'uppercase' : 'none',
                          letterSpacing: `${item.letterSpacing || 0}px`,
                        }}
                      />
                    </div>

                    {/* ── Font Picker ── */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Font Family
                        </label>
                        <button
                          type="button"
                          onClick={() => setFontModalOpen(true)}
                          className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                          Browse 110+ Fonts
                        </button>
                      </div>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setFontPickerOpenId(isFontOpen ? null : item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                            isFontOpen
                              ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-300/40'
                              : 'border-purple-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              style={{ fontFamily: `${item.fontFamily || 'Bebas Neue'}, sans-serif` }}
                              className="text-base text-slate-900 font-medium leading-none"
                            >
                              {(item.text || 'Aa').slice(0, 12)}
                            </span>
                            <span className="text-xs text-slate-600 font-medium">
                              {item.fontFamily || 'Bebas Neue'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-mono font-semibold">
                              110+
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFontOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {isFontOpen && (
                          <InlineFontPicker
                            currentFont={item.fontFamily || 'Bebas Neue'}
                            previewText={item.text || 'Aa'}
                            onSelect={(font) => {
                              loadGoogleFont(font);
                              updateOverlay(item.id, { fontFamily: font });
                            }}
                            onClose={() => setFontPickerOpenId(null)}
                          />
                        )}
                      </div>

                      {/* Curated Top 10 Fonts Quick Strip */}
                      <div className="mt-2 pt-2 border-t border-purple-100/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-0.5 shrink-0">
                          <Flame className="w-2.5 h-2.5 text-amber-500" />
                          Top 10:
                        </span>
                        {CURATED_SHORT_FORM_FONTS.map((cf) => {
                          const isSel = (item.fontFamily || 'Bebas Neue').toLowerCase() === cf.family.toLowerCase();
                          return (
                            <button
                              key={cf.id}
                              type="button"
                              onClick={() => {
                                loadGoogleFont(cf.family);
                                updateOverlay(item.id, { fontFamily: cf.family });
                              }}
                              title={`${cf.name} — ${cf.bestFor}`}
                              className={`px-2 py-1 rounded-lg text-xs shrink-0 transition-all cursor-pointer border ${
                                isSel
                                  ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-purple-100 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                              style={{ fontFamily: `${cf.family}, sans-serif` }}
                            >
                              {cf.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Font Size & Weight Row ── */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Font size */}
                      <div className="bg-slate-50 border border-purple-100 rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Size</span>
                          <span className="font-mono text-xs font-bold text-purple-700">{item.fontSize || 28}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="80"
                          value={item.fontSize || 28}
                          onChange={(e) => updateOverlay(item.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded-full cursor-pointer"
                        />
                      </div>

                      {/* Font Weight */}
                      <div className="bg-slate-50 border border-purple-100 rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Weight</span>
                          <span className="font-mono text-[10px] font-bold text-purple-700">
                            {item.fontWeight || (item.isBold ? 700 : 400)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[
                            { weight: 400, label: 'Reg' },
                            { weight: 600, label: 'Semi' },
                            { weight: 700, label: 'Bold' },
                            { weight: 800, label: 'Extra' },
                            { weight: 900, label: 'Black' },
                          ].map(({ weight, label }) => {
                            const curWeight = item.fontWeight || (item.isBold ? 700 : 400);
                            const isCur = curWeight === weight;
                            return (
                              <button
                                key={weight}
                                type="button"
                                onClick={() => updateOverlay(item.id, { fontWeight: weight, isBold: weight >= 700 })}
                                className={`flex-1 py-1 rounded-md text-[9px] font-semibold transition-all cursor-pointer ${
                                  isCur
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'bg-white border border-purple-200 text-slate-600 hover:border-purple-300'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── Line Height & Formatting Row ── */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Line Height */}
                      <div className="bg-slate-50 border border-purple-100 rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Line Height</span>
                          <span className="font-mono text-xs font-bold text-purple-700">
                            {(item.lineHeight || 1.2).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.9"
                          max="2.2"
                          step="0.05"
                          value={item.lineHeight || 1.2}
                          onChange={(e) => updateOverlay(item.id, { lineHeight: parseFloat(e.target.value) })}
                          className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded-full cursor-pointer"
                        />
                      </div>

                      {/* Formatting buttons */}
                      <div className="bg-slate-50 border border-purple-100 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Format</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateOverlay(item.id, { isBold: !item.isBold, fontWeight: !item.isBold ? 700 : 400 })}
                            title="Bold"
                            className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              item.isBold || (item.fontWeight !== undefined && Number(item.fontWeight) >= 700)
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white border border-purple-200 text-slate-600 hover:border-purple-300'
                            }`}
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateOverlay(item.id, { isUppercase: !item.isUppercase })}
                            title="Uppercase"
                            className={`flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all cursor-pointer ${
                              item.isUppercase
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white border border-purple-200 text-slate-600 hover:border-purple-300'
                            }`}
                          >
                            TT
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Text Alignment ── */}
                    <div className="bg-slate-50 border border-purple-100 rounded-xl px-3 py-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Alignment & Position</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-1">
                          {[
                            { icon: <AlignLeft className="w-3.5 h-3.5" />, value: 'left' as const },
                            { icon: <AlignCenter className="w-3.5 h-3.5" />, value: 'center' as const },
                            { icon: <AlignRight className="w-3.5 h-3.5" />, value: 'right' as const },
                          ].map((btn) => (
                            <button
                              key={btn.value}
                              onClick={() => updateOverlay(item.id, { alignment: btn.value })}
                              className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${
                                item.alignment === btn.value
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'bg-white border border-purple-200 text-slate-500 hover:border-purple-300'
                              }`}
                            >
                              {btn.icon}
                            </button>
                          ))}
                        </div>
                        <select
                          value={item.position}
                          onChange={(e) => {
                            const pos = e.target.value as any;
                            const u: Partial<TextOverlay> = { position: pos };
                            if (pos === 'custom') { u.xPercent = 50; u.yPercent = 20; }
                            updateOverlay(item.id, u);
                          }}
                          className="bg-white border border-purple-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-400 flex-1"
                        >
                          <option value="custom">Free Drag</option>
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </div>
                    </div>

                    {/* ── ⚡ Kinetic Typography & Animations Suite ── */}
                    <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/50 border border-purple-200/90 rounded-2xl p-3 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-xs">
                            <Zap className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 tracking-wide block">
                              Kinetic Motion & Animation
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold uppercase">
                          {item.animation || 'pop'}
                        </span>
                      </div>

                      {/* Live Mini Motion Preview */}
                      <KineticMiniPreview overlay={item} />

                      {/* Preset Cards Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            12 Kinetic Presets
                          </span>
                          <span className="text-[9px] text-purple-600 font-medium">Reels & TikTok Ready</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                          {KINETIC_ANIMATIONS.map((anim) => {
                            const isSelected = (item.animation || 'none') === anim.value;
                            return (
                              <button
                                key={anim.value}
                                type="button"
                                onClick={() => {
                                  const presetMeta = KINETIC_PRESETS[anim.value];
                                  updateOverlay(item.id, {
                                    animation: anim.value,
                                    animationDuration: presetMeta ? presetMeta.defaultDuration : item.animationDuration || 0.6,
                                    animationDelay: presetMeta ? presetMeta.defaultDelay : item.animationDelay || 0,
                                    animationIntensity: presetMeta ? presetMeta.defaultIntensity : item.animationIntensity || 80,
                                  });
                                }}
                                title={`${anim.label} (${anim.category}): ${anim.description}`}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer min-h-[50px] ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                                    : 'border-purple-100 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                                }`}
                              >
                                <span className="text-base leading-none mb-0.5">{anim.icon}</span>
                                <span className="text-[10px] font-bold leading-tight truncate w-full">
                                  {anim.label}
                                </span>
                                <span
                                  className={`text-[8px] font-mono leading-none mt-0.5 ${
                                    isSelected ? 'text-purple-200' : 'text-slate-400'
                                  }`}
                                >
                                  {anim.category}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Animation Parameters Controls (Speed, Delay, Intensity) */}
                      {item.animation && item.animation !== 'none' && (
                        <div className="pt-2 border-t border-purple-100/70 space-y-2">
                          {/* Speed / Duration Slider */}
                          <div className="bg-white border border-purple-100 rounded-xl p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-purple-500" />
                                Animation Speed / Duration
                              </span>
                              <span className="text-[10px] font-mono font-bold text-purple-700">
                                {(item.animationDuration || 0.6).toFixed(2)}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="2.5"
                              step="0.05"
                              value={item.animationDuration || 0.6}
                              onChange={(e) => updateOverlay(item.id, { animationDuration: parseFloat(e.target.value) })}
                              className="w-full accent-purple-600 h-1 bg-purple-100 rounded cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>Snappy (0.2s)</span>
                              <span>Standard (0.6s)</span>
                              <span>Slow (2.5s)</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Delay Slider */}
                            <div className="bg-white border border-purple-100 rounded-xl p-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-semibold text-slate-600">Start Delay</span>
                                <span className="text-[9px] font-mono font-bold text-purple-700">
                                  {(item.animationDelay || 0).toFixed(1)}s
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.0"
                                max="3.0"
                                step="0.1"
                                value={item.animationDelay || 0}
                                onChange={(e) => updateOverlay(item.id, { animationDelay: parseFloat(e.target.value) })}
                                className="w-full accent-purple-600 h-1 bg-purple-100 rounded cursor-pointer"
                              />
                            </div>

                            {/* Intensity Slider */}
                            <div className="bg-white border border-purple-100 rounded-xl p-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-semibold text-slate-600">Motion Intensity</span>
                                <span className="text-[9px] font-mono font-bold text-purple-700">
                                  {item.animationIntensity || 80}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={item.animationIntensity || 80}
                                onChange={(e) => updateOverlay(item.id, { animationIntensity: parseInt(e.target.value) })}
                                className="w-full accent-purple-600 h-1 bg-purple-100 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Colors & Style Accordion ── */}
                    <div className="border border-purple-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setStylesOpenId(isStyleOpen ? null : item.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-purple-50/40 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Palette className="w-3.5 h-3.5 text-purple-500" />
                          Colors & Styling
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Color preview dots */}
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: item.color || '#fff' }} />
                            {(item.outlineWidth || 0) > 0 && (
                              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: item.outlineColor || '#000' }} />
                            )}
                            {(item.backgroundOpacity || 0) > 0.05 && (
                              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: item.backgroundColor || '#000' }} />
                            )}
                          </div>
                          {isStyleOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                      </button>

                      {isStyleOpen && (
                        <div className="p-3 space-y-3 bg-white border-t border-purple-100">
                          {/* Creator palette presets */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                              Creator Palettes
                            </label>
                            <div className="grid grid-cols-4 gap-1">
                              {CREATOR_PALETTES.slice(0, 8).map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => updateOverlay(item.id, {
                                    color: p.textColor,
                                    outlineColor: p.outlineColor,
                                    outlineWidth: p.outlineWidth,
                                    shadowStyle: p.shadowStyle,
                                    shadowColor: p.shadowColor,
                                    backgroundColor: p.backgroundColor,
                                    backgroundOpacity: p.backgroundOpacity,
                                  })}
                                  className={`p-1.5 rounded-xl border flex flex-col gap-1 transition-all ${
                                    item.color?.toLowerCase() === p.textColor.toLowerCase()
                                      ? 'border-purple-400 bg-purple-50 shadow-sm ring-1 ring-purple-300/40'
                                      : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: p.textColor }} />
                                    <span className="text-[8px] font-bold text-slate-700 truncate">{p.name}</span>
                                  </div>
                                  <span className="text-[7px] text-slate-400 truncate">{p.creator}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Text Color row */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Text Color</label>
                              <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">{item.color || '#ffffff'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                {POPULAR_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => updateOverlay(item.id, { color: c })}
                                    style={{ backgroundColor: c }}
                                    className={`w-6 h-6 rounded-lg border shrink-0 transition-transform ${
                                      (item.color || '').toLowerCase() === c.toLowerCase()
                                        ? 'scale-110 border-white ring-2 ring-purple-500 shadow-md'
                                        : 'border-slate-300 hover:scale-105'
                                    }`}
                                  />
                                ))}
                              </div>
                              <input
                                type="color"
                                value={item.color?.startsWith('#') ? item.color : '#ffffff'}
                                onChange={(e) => updateOverlay(item.id, { color: e.target.value })}
                                className="w-8 h-8 rounded-lg bg-transparent border border-purple-200 cursor-pointer shrink-0"
                              />
                            </div>
                          </div>

                          {/* Outline & Shadow row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 rounded-xl border border-purple-100 px-2.5 py-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-500">Stroke</span>
                                <span className="text-[10px] font-mono text-purple-700 font-bold">{item.outlineWidth || 0}px</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="range" min="0" max="8" step="1"
                                  value={item.outlineWidth || 0}
                                  onChange={(e) => updateOverlay(item.id, { outlineWidth: parseInt(e.target.value) })}
                                  className="flex-1 accent-purple-600 h-1 rounded cursor-pointer"
                                />
                                <input
                                  type="color"
                                  value={item.outlineColor?.startsWith('#') ? item.outlineColor : '#000000'}
                                  onChange={(e) => updateOverlay(item.id, { outlineColor: e.target.value })}
                                  className="w-6 h-6 rounded-lg border border-purple-200 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-purple-100 px-2.5 py-2 space-y-1.5">
                              <span className="text-[10px] font-semibold text-slate-500 block">Shadow / Glow</span>
                              <div className="flex items-center gap-1">
                                {(['none', 'soft', 'hard', 'glow'] as const).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateOverlay(item.id, { shadowStyle: s })}
                                    className={`flex-1 py-1 rounded-lg text-[8px] font-medium border text-center transition-all ${
                                      (item.shadowStyle || 'none') === s
                                        ? 'border-purple-400 bg-purple-100 text-purple-800'
                                        : 'border-purple-100 bg-white text-slate-500 hover:bg-purple-50'
                                    }`}
                                  >
                                    {s === 'none' ? '–' : s === 'soft' ? 'Soft' : s === 'hard' ? 'Hard' : 'Glow'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Background */}
                          <div className="bg-slate-50 rounded-xl border border-purple-100 px-2.5 py-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500">Background Box</span>
                              <span className="text-[10px] font-mono text-purple-700 font-bold">{Math.round((item.backgroundOpacity || 0) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range" min="0" max="100" step="5"
                                value={Math.round((item.backgroundOpacity || 0) * 100)}
                                onChange={(e) => updateOverlay(item.id, { backgroundOpacity: parseInt(e.target.value) / 100 })}
                                className="flex-1 accent-purple-600 h-1 rounded cursor-pointer"
                              />
                              <input
                                type="color"
                                value={item.backgroundColor?.startsWith('#') ? item.backgroundColor : '#000000'}
                                onChange={(e) => updateOverlay(item.id, { backgroundColor: e.target.value })}
                                className="w-7 h-7 rounded-lg border border-purple-200 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Letter Spacing */}
                          <div className="bg-slate-50 rounded-xl border border-purple-100 px-2.5 py-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500">Letter Spacing</span>
                              <span className="text-[10px] font-mono text-purple-700 font-bold">{item.letterSpacing || 0}px</span>
                            </div>
                            <input
                              type="range" min="-2" max="12" step="1"
                              value={item.letterSpacing || 0}
                              onChange={(e) => updateOverlay(item.id, { letterSpacing: parseInt(e.target.value) })}
                              className="w-full accent-purple-600 h-1 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Timing Accordion ── */}
                    <div className="border border-purple-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setTimingOpenId(isTimingOpen ? null : item.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-purple-50/40 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          Timing & Duration
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            {(item.startTime || 0).toFixed(1)}s — {(item.endTime || clipDuration).toFixed(1)}s
                          </span>
                          {isTimingOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                      </button>

                      {isTimingOpen && (
                        <div className="p-3 space-y-3 bg-white border-t border-purple-100">
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'Start Time', key: 'startTime' as const, min: 0, max: item.endTime || clipDuration },
                              { label: 'End Time', key: 'endTime' as const, min: item.startTime || 0, max: clipDuration },
                            ].map(({ label, key, min, max }) => (
                              <div key={key} className="bg-slate-50 border border-purple-100 rounded-xl px-2.5 py-2 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                                  <span className="text-[10px] font-mono text-purple-700 font-bold">{(item[key] || 0).toFixed(1)}s</span>
                                </div>
                                <input
                                  type="range"
                                  min={min}
                                  max={max}
                                  step="0.1"
                                  value={item[key] || 0}
                                  onChange={(e) => updateOverlay(item.id, { [key]: parseFloat(e.target.value) })}
                                  className="w-full accent-purple-600 h-1 rounded cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => updateOverlay(item.id, { startTime: 0, endTime: clipDuration })}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-purple-200 text-xs text-purple-700 hover:bg-purple-50 transition-colors font-medium"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset to Full Duration
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Typography Browser Modal ── */}
      {fontModalOpen && (
        <FontPickerModal
          isOpen={fontModalOpen}
          onClose={() => setFontModalOpen(false)}
          currentFont={
            activeLayerId
              ? overlays.find((o) => o.id === activeLayerId)?.fontFamily || 'Inter'
              : 'Inter'
          }
          previewText={
            activeLayerId
              ? overlays.find((o) => o.id === activeLayerId)?.text || 'VIRAL HOOK'
              : 'VIRAL HOOK'
          }
          onSelectFont={(fontFamily) => {
            if (activeLayerId) {
              loadGoogleFont(fontFamily);
              updateOverlay(activeLayerId, { fontFamily });
            }
          }}
        />
      )}
    </div>
  );
};
