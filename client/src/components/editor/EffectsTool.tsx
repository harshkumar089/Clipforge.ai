import React from 'react';
import {
  Wand2,
  Activity,
  Zap,
  Radio,
  Tv,
  Maximize2,
  Sparkles,
  Film,
  RotateCcw,
  Check,
  SplitSquareVertical,
} from 'lucide-react';
import { VideoEffect, EffectType } from '../../types/index.js';

interface EffectsToolProps {
  effect: VideoEffect;
  onChange: (effect: VideoEffect) => void;
  onDone?: () => void;
}

interface EffectOption {
  id: EffectType;
  title: string;
  category: string;
  icon: any;
  previewBg: string;
  description: string;
}

const EFFECTS: EffectOption[] = [
  {
    id: 'none',
    title: 'No Effect',
    category: 'Off',
    icon: RotateCcw,
    previewBg: 'bg-slate-100 text-slate-500',
    description: 'Clean video with no overlays',
  },
  {
    id: 'shake',
    title: 'Camera Shake',
    category: 'Trending',
    icon: Activity,
    previewBg: 'bg-purple-100 text-purple-600',
    description: 'Rhythmic tremor for viral drops',
  },
  {
    id: 'rgb_split',
    title: 'RGB Glitch',
    category: 'Trending',
    icon: Zap,
    previewBg: 'bg-rose-100 text-rose-600',
    description: 'Chromatic 3D displacement',
  },
  {
    id: 'flash',
    title: 'Beat Flash',
    category: 'Atmosphere',
    icon: Sparkles,
    previewBg: 'bg-amber-100 text-amber-600',
    description: 'Dynamic strobe pulse effect',
  },
  {
    id: 'vhs',
    title: '90s VHS Cam',
    category: 'Retro',
    icon: Tv,
    previewBg: 'bg-emerald-100 text-emerald-600',
    description: 'Tape scanlines & REC timestamp',
  },
  {
    id: 'slow_zoom',
    title: 'Dramatic Zoom',
    category: 'Cinema',
    icon: Maximize2,
    previewBg: 'bg-blue-100 text-blue-600',
    description: 'Ken Burns slow push-in zoom',
  },
  {
    id: 'neon_glow',
    title: 'Neon Outline',
    category: 'Cyber',
    icon: Radio,
    previewBg: 'bg-cyan-100 text-cyan-600',
    description: 'Vibrant edge glow & contrast',
  },
  {
    id: 'film_grain',
    title: 'Film Dust',
    category: 'Retro',
    icon: Film,
    previewBg: 'bg-orange-100 text-orange-600',
    description: 'Vintage 35mm film grain & grit',
  },
  {
    id: 'mirror',
    title: 'Mirror Split',
    category: 'Fun',
    icon: SplitSquareVertical,
    previewBg: 'bg-indigo-100 text-indigo-600',
    description: 'Symmetrical kaleidoscope reflections',
  },
];

export const EffectsTool: React.FC<EffectsToolProps> = ({ effect, onChange, onDone }) => {
  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Visual Effects (FX)
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Apply viral visual effects, camera shakes, and retro overlays.
        </p>
      </div>

      {/* FX Grid */}
      <div className="grid grid-cols-2 gap-2">
        {EFFECTS.map((fx) => {
          const isSelected = effect.type === fx.id;
          const Icon = fx.icon;
          return (
            <button
              key={fx.id}
              onClick={() => {
                onChange({
                  ...effect,
                  type: fx.id,
                  intensity: effect.intensity || 75,
                });
              }}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all relative group ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-400/40 shadow-xs font-semibold'
                  : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 text-slate-700'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105 ${fx.previewBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{fx.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{fx.description}</div>
              </div>
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Adjust Intensity & Speed if an effect is active */}
      {effect.type !== 'none' && (
        <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-3.5 shadow-2xs">
          {/* Intensity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Effect Intensity</span>
              <span className="font-mono font-bold text-purple-700 text-xs">
                {effect.intensity}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={effect.intensity}
              onChange={(e) =>
                onChange({
                  ...effect,
                  intensity: parseInt(e.target.value),
                })
              }
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>

          {/* Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Effect Speed / Frequency</span>
              <span className="font-mono font-bold text-purple-700 text-xs">
                {(effect.speed || 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={effect.speed || 1.0}
              onChange={(e) =>
                onChange({
                  ...effect,
                  speed: parseFloat(e.target.value),
                })
              }
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Done / Confirm Effect Action */}
      {onDone && (
        <div className="pt-2">
          <button
            onClick={onDone}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done with Effects</span>
          </button>
        </div>
      )}
    </div>
  );
};
