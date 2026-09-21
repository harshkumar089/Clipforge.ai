import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Trash2,
  Plus,
  Upload,
  RotateCcw,
  Copy,
  Layers,
  Sparkles,
  Move,
  Clock,
  Eye,
  Sliders,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { StickerOverlay } from '../../types/index.js';
import { SOCIAL_BADGES, BadgeRenderer } from './BadgeRenderer.js';
import { useToast } from '../../context/ToastContext.js';

interface StickerToolProps {
  stickers: StickerOverlay[];
  onChange: (stickers: StickerOverlay[]) => void;
  selectedStickerId: string | null;
  onSelectSticker: (id: string | null) => void;
  clipDuration?: number;
  currentTime?: number;
}

const EMOJI_CATEGORIES = [
  {
    name: '🔥 Hype & Viral',
    emojis: ['🔥', '💯', '⚡', '🤯', '🚨', '💥', '🚀', '👀', '😱', '💰', '🏆', '🎉'],
  },
  {
    name: '👉 Pointers & Callouts',
    emojis: ['👇', '👉', '👆', '👈', '🎯', '💡', '🤫', '👑', '⚠️', '⭐', '✨', '💎'],
  },
  {
    name: '😂 Reactions',
    emojis: ['😂', '🤣', '💀', '🤡', '🤔', '😎', '🤩', '🥳', '🥶', '🥵', '🤑', '🤐'],
  },
];

const ALIGNMENT_PRESETS = [
  { label: 'TL', x: 20, y: 20, title: 'Top-Left' },
  { label: 'TC', x: 50, y: 20, title: 'Top-Center' },
  { label: 'TR', x: 80, y: 20, title: 'Top-Right' },
  { label: 'CL', x: 20, y: 50, title: 'Center-Left' },
  { label: 'C', x: 50, y: 50, title: 'Center' },
  { label: 'CR', x: 80, y: 50, title: 'Center-Right' },
  { label: 'BL', x: 20, y: 80, title: 'Bottom-Left' },
  { label: 'BC', x: 50, y: 80, title: 'Bottom-Center' },
  { label: 'BR', x: 80, y: 80, title: 'Bottom-Right' },
];

export const StickerTool: React.FC<StickerToolProps> = ({
  stickers,
  onChange,
  selectedStickerId,
  onSelectSticker,
  clipDuration = 15,
  currentTime = 0,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'badges' | 'emojis'>('badges');
  const [savedCustomStickers, setSavedCustomStickers] = useState<
    Array<{ id: string; url: string; name: string }>
  >(() => {
    try {
      const stored = localStorage.getItem('clipforge_custom_stickers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save imported custom stickers to localStorage
  const persistCustomSticker = (url: string, name: string) => {
    const updated = [{ id: `custom-${Date.now()}`, url, name }, ...savedCustomStickers.slice(0, 19)];
    setSavedCustomStickers(updated);
    try {
      localStorage.setItem('clipforge_custom_stickers', JSON.stringify(updated));
    } catch {}
  };

  const deleteCustomSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomStickers.filter((s) => s.id !== id);
    setSavedCustomStickers(updated);
    try {
      localStorage.setItem('clipforge_custom_stickers', JSON.stringify(updated));
    } catch {}
    showToast('Removed from imported library.', 'info');
  };

  // Handle local file import (PNG, JPG, WebP, SVG, GIF)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF, SVG).', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Sticker image must be under 15MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 20);
      const newSticker: StickerOverlay = {
        id: `sticker-img-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'image',
        content: dataUrl,
        label: cleanName,
        x: 50,
        y: 50,
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        startTime: 0,
        endTime: clipDuration,
      };

      onChange([...stickers, newSticker]);
      onSelectSticker(newSticker.id);
      persistCustomSticker(dataUrl, cleanName);
      showToast(`Imported "${cleanName}" sticker! Drag to position on video.`, 'success');
    };

    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };

    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddBadge = (badge: (typeof SOCIAL_BADGES)[0]) => {
    const newSticker: StickerOverlay = {
      id: `sticker-badge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'badge',
      content: badge.key,
      label: badge.label,
      x: 50,
      y: 50,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      startTime: 0,
      endTime: clipDuration,
    };
    onChange([...stickers, newSticker]);
    onSelectSticker(newSticker.id);
    showToast(`Added ${badge.label} badge!`, 'success');
  };

  const handleAddEmoji = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: `sticker-emoji-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'emoji',
      content: emoji,
      label: emoji,
      x: 50,
      y: 50,
      scale: 1.2,
      rotation: 0,
      opacity: 1.0,
      startTime: 0,
      endTime: clipDuration,
    };
    onChange([...stickers, newSticker]);
    onSelectSticker(newSticker.id);
  };

  const handleAddSavedSticker = (item: { url: string; name: string }) => {
    const newSticker: StickerOverlay = {
      id: `sticker-img-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'image',
      content: item.url,
      label: item.name,
      x: 50,
      y: 50,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      startTime: 0,
      endTime: clipDuration,
    };
    onChange([...stickers, newSticker]);
    onSelectSticker(newSticker.id);
    showToast(`Added ${item.name}!`, 'success');
  };

  const handleRemoveSticker = (id: string) => {
    onChange(stickers.filter((s) => s.id !== id));
    if (selectedStickerId === id) {
      onSelectSticker(null);
    }
  };

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);

  const updateSelectedSticker = (updates: Partial<StickerOverlay>) => {
    if (!selectedStickerId) return;
    onChange(
      stickers.map((s) => (s.id === selectedStickerId ? { ...s, ...updates } : s))
    );
  };

  const handleDuplicateSelected = () => {
    if (!selectedSticker) return;
    const duplicated: StickerOverlay = {
      ...selectedSticker,
      id: `sticker-dup-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      x: Math.min(90, selectedSticker.x + 5),
      y: Math.min(90, selectedSticker.y + 5),
    };
    onChange([...stickers, duplicated]);
    onSelectSticker(duplicated.id);
    showToast('Sticker duplicated.', 'info');
  };

  return (
    <div className="space-y-4 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Header with Direct Import Button */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Smile className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase font-mono">
              Stickers & Badges ({stickers.length})
            </h3>
          </div>
        </div>

        {/* Quick Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          title="Import sticker from local computer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 rounded-xl bg-purple-50/60 p-1 border border-purple-200/60 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('import')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === 'import'
              ? 'bg-white text-purple-700 shadow-xs border border-purple-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-3 h-3" />
          <span>Import</span>
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === 'badges'
              ? 'bg-white text-purple-700 shadow-xs border border-purple-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Badges
        </button>
        <button
          onClick={() => setActiveTab('emojis')}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === 'emojis'
              ? 'bg-white text-purple-700 shadow-xs border border-purple-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Emojis
        </button>
      </div>

      {/* TAB 1: Local Device Importer */}
      {activeTab === 'import' && (
        <div className="space-y-3">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="p-5 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/60 text-center cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 text-purple-700 flex items-center justify-center mx-auto mb-2 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Import from Local Device
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Drag & drop PNG, JPG, GIF, WebP, SVG or click to browse
            </p>
            <span className="inline-block mt-2.5 px-3 py-1 rounded-lg bg-white border border-purple-200 text-[10px] font-mono font-semibold text-purple-700 shadow-2xs">
              Transparent PNG supported
            </span>
          </div>

          {/* Saved Stickers Library */}
          {savedCustomStickers.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">My Imported Library</span>
                <span className="text-[10px] text-purple-600 font-mono">
                  {savedCustomStickers.length} saved
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                {savedCustomStickers.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAddSavedSticker(item)}
                    className="relative group p-1.5 rounded-xl border border-purple-100 bg-white hover:border-purple-300 hover:bg-purple-50/40 cursor-pointer flex flex-col items-center gap-1 transition-all shadow-2xs"
                    title={`Add "${item.name}"`}
                  >
                    <div className="w-full h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden p-1">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain pointer-events-none"
                      />
                    </div>
                    <span className="text-[9px] text-slate-600 truncate w-full text-center font-medium">
                      {item.name}
                    </span>
                    <button
                      onClick={(e) => deleteCustomSticker(item.id, e)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Delete from library"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Viral Badges Grid */}
      {activeTab === 'badges' && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-600 block">
            Click to add callout badge to video:
          </span>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
            {SOCIAL_BADGES.map((badge) => (
              <button
                key={badge.key}
                onClick={() => handleAddBadge(badge)}
                className="p-1 rounded-xl hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center"
              >
                <BadgeRenderer badgeKey={badge.key} label={badge.label} className="w-full justify-center" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Emojis Grid */}
      {activeTab === 'emojis' && (
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar p-0.5">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <div key={i} className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {cat.name}
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddEmoji(emoji)}
                    className="w-9 h-9 rounded-xl bg-purple-50/40 hover:bg-purple-100 border border-purple-100 flex items-center justify-center text-xl hover:scale-115 active:scale-95 transition-all shadow-2xs"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Sticker Controls Inspector */}
      {selectedSticker && (
        <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-purple-200 shadow-md shadow-purple-500/5 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-xs">
                {selectedSticker.type === 'emoji' ? (
                  selectedSticker.content
                ) : selectedSticker.type === 'image' ? (
                  <img
                    src={selectedSticker.content}
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  '🏷️'
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                {selectedSticker.label || 'Sticker'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleDuplicateSelected}
                className="p-1 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                title="Duplicate sticker"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRemoveSticker(selectedSticker.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Delete sticker"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Alignment 9-Grid Snapping */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-semibold uppercase tracking-wide">Position Snapping</span>
              <span className="font-mono font-bold text-purple-700">
                X:{selectedSticker.x}% · Y:{selectedSticker.y}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-purple-50/40 p-1.5 rounded-xl border border-purple-100">
              {ALIGNMENT_PRESETS.map((p) => {
                const isMatch =
                  Math.abs(selectedSticker.x - p.x) < 8 &&
                  Math.abs(selectedSticker.y - p.y) < 8;
                return (
                  <button
                    key={p.label}
                    onClick={() => updateSelectedSticker({ x: p.x, y: p.y })}
                    className={`py-1 rounded-md text-[10px] font-bold transition-all ${
                      isMatch
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white hover:bg-purple-100 text-slate-600 border border-purple-100'
                    }`}
                    title={p.title}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size & Opacity Sliders */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-purple-50/30 p-2 rounded-xl border border-purple-100 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span>Scale</span>
                <span className="font-mono font-bold text-purple-700">
                  {selectedSticker.scale.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.8"
                step="0.1"
                value={selectedSticker.scale}
                onChange={(e) => updateSelectedSticker({ scale: Number(e.target.value) })}
                className="w-full h-1 bg-purple-200 rounded accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="bg-purple-50/30 p-2 rounded-xl border border-purple-100 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span>Opacity</span>
                <span className="font-mono font-bold text-purple-700">
                  {Math.round((selectedSticker.opacity !== undefined ? selectedSticker.opacity : 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={selectedSticker.opacity !== undefined ? selectedSticker.opacity : 1.0}
                onChange={(e) => updateSelectedSticker({ opacity: Number(e.target.value) })}
                className="w-full h-1 bg-purple-200 rounded accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Rotation Slider with 0° Reset */}
          <div className="bg-purple-50/30 p-2 rounded-xl border border-purple-100 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>Rotation</span>
                {selectedSticker.rotation !== 0 && (
                  <button
                    onClick={() => updateSelectedSticker({ rotation: 0 })}
                    className="text-[9px] text-purple-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset 0°
                  </button>
                )}
              </div>
              <span className="font-mono font-bold text-purple-700">
                {selectedSticker.rotation}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={selectedSticker.rotation}
              onChange={(e) => updateSelectedSticker({ rotation: Number(e.target.value) })}
              className="w-full h-1 bg-purple-200 rounded accent-purple-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Placed Stickers List */}
      {stickers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-purple-100">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Active Canvas Stickers ({stickers.length})
            </label>
            <button
              onClick={() => onChange([])}
              className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
            {stickers.map((st) => {
              const isSelected = selectedStickerId === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => onSelectSticker(st.id)}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-400 bg-purple-50/80 font-bold text-purple-900 shadow-2xs ring-1 ring-purple-300'
                      : 'border-purple-100 bg-white hover:border-purple-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-xs shrink-0">
                      {st.type === 'emoji' ? (
                        st.content
                      ) : st.type === 'image' ? (
                        <img src={st.content} alt="" className="w-3.5 h-3.5 object-contain" />
                      ) : (
                        '🏷️'
                      )}
                    </span>
                    <span className="truncate">{st.label || 'Sticker'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[9px] text-slate-400 mr-1">
                      {st.x}%·{st.y}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSticker(st.id);
                      }}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
