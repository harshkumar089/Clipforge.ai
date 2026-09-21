import React, { useState } from 'react';
import {
  Volume2,
  Play,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Zap,
  Bell,
  Camera,
  Flame,
  Bomb,
  Radio,
  PartyPopper,
} from 'lucide-react';
import { SoundEffectItem, SfxType } from '../../types/index.js';
import { soundEffects } from '../../services/soundEffects.js';

interface SfxToolProps {
  items: SoundEffectItem[];
  onChange: (items: SoundEffectItem[]) => void;
  currentTime: number;
}

interface SfxDefinition {
  type: SfxType;
  name: string;
  category: 'transition' | 'reaction' | 'meme' | 'impact';
  icon: any;
  desc: string;
}

const SFX_CATALOG: SfxDefinition[] = [
  { type: 'whoosh', name: 'Fast Whoosh', category: 'transition', icon: Zap, desc: 'Dynamic motion swipe' },
  { type: 'ding', name: 'Crystal Ding', category: 'reaction', icon: Bell, desc: 'Notification chime' },
  { type: 'pop', name: 'Bubble Pop', category: 'reaction', icon: Sparkles, desc: 'Snappy cute bubble' },
  { type: 'shutter', name: 'Camera Shutter', category: 'impact', icon: Camera, desc: 'Double-click snapshot' },
  { type: 'thud', name: 'Vine Boom 808', category: 'meme', icon: Bomb, desc: 'Dramatic viral bass drop' },
  { type: 'airhorn', name: 'Trap Airhorn', category: 'meme', icon: Flame, desc: 'Celebratory triple blast' },
  { type: 'glitch', name: 'Digital Glitch', category: 'transition', icon: Radio, desc: 'Cyber static jitter' },
  { type: 'cheer', name: 'Crowd Cheer', category: 'reaction', icon: PartyPopper, desc: 'Applause & cheering' },
];

export const SfxTool: React.FC<SfxToolProps> = ({ items, onChange, currentTime }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [playingSfx, setPlayingSfx] = useState<string | null>(null);

  const filteredCatalog = SFX_CATALOG.filter(
    (sfx) => activeCategory === 'all' || sfx.category === activeCategory
  );

  const handleAudition = (type: SfxType) => {
    setPlayingSfx(type);
    soundEffects.play(type, 1.0);
    setTimeout(() => setPlayingSfx(null), 800);
  };

  const handleAddAtPlayhead = (def: SfxDefinition) => {
    const newItem: SoundEffectItem = {
      id: `sfx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: def.name,
      type: def.type,
      category: def.category,
      time: parseFloat(currentTime.toFixed(2)),
      volume: 100,
    };
    onChange([...items, newItem]);
    soundEffects.play(def.type, 1.0);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleVolumeChange = (id: string, vol: number) => {
    onChange(items.map((item) => (item.id === id ? { ...item, volume: vol } : item)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Sound Effects (SFX)
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Add viral sound effects, drops, and whooshes synced to your timeline.
        </p>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        {['all', 'transition', 'reaction', 'meme', 'impact'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg capitalize text-xs font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-slate-600 hover:bg-purple-100/70 border border-purple-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SFX Catalog */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
        {filteredCatalog.map((sfx) => {
          const Icon = sfx.icon;
          const isAuditioning = playingSfx === sfx.type;
          return (
            <div
              key={sfx.type}
              className="p-2 rounded-xl border border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/20 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => handleAudition(sfx.type)}
                  title="Audition Sound"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                    isAuditioning
                      ? 'bg-purple-600 text-white animate-pulse'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{sfx.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{sfx.desc}</div>
                </div>
              </div>

              {/* Add at Playhead Button */}
              <button
                onClick={() => handleAddAtPlayhead(sfx)}
                title={`Add at ${formatTime(currentTime)}`}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-medium flex items-center gap-1 border border-purple-200/80 transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Add @ {formatTime(currentTime)}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Placed Timeline SFX List */}
      <div className="pt-2 border-t border-purple-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Placed SFX ({items.length})</span>
          {items.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-[10px] text-rose-500 hover:text-rose-700"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-4 text-center rounded-xl bg-purple-50/30 border border-dashed border-purple-200 text-xs text-slate-400">
            No SFX placed yet. Click "+ Add @" to drop sounds at the playhead!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                      {formatTime(item.time)}
                    </span>
                  </div>
                  {/* Volume Slider */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">Vol:</span>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={item.volume}
                      onChange={(e) => handleVolumeChange(item.id, parseInt(e.target.value))}
                      className="w-20 accent-purple-600 h-1 bg-purple-200 rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-purple-700">{item.volume}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => soundEffects.play(item.type, item.volume / 100)}
                    className="p-1 rounded hover:bg-purple-100 text-purple-600"
                    title="Audition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
