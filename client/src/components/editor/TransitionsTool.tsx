import React from 'react';
import {
  Layers,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  ArrowLeft,
  Flame,
  SunMedium,
  Check,
  RotateCcw,
} from 'lucide-react';
import { VideoTransition, TransitionType } from '../../types/index.js';

interface TransitionsToolProps {
  transition: VideoTransition;
  onChange: (transition: VideoTransition) => void;
  onPreviewTransition?: (type: TransitionType) => void;
  onDone?: () => void;
}

interface TransitionCard {
  id: TransitionType;
  label: string;
  category: 'Popular' | 'Movement' | 'Effects';
  icon: any;
  previewBg: string;
}

const TRANSITIONS: TransitionCard[] = [
  { id: 'none', label: 'None', category: 'Popular', icon: RotateCcw, previewBg: 'bg-slate-100' },
  { id: 'flash_white', label: 'White Flash', category: 'Popular', icon: SunMedium, previewBg: 'bg-amber-100 text-amber-600' },
  { id: 'fade', label: 'Dissolve', category: 'Popular', icon: Layers, previewBg: 'bg-purple-100 text-purple-600' },
  { id: 'flash_black', label: 'Black Flash', category: 'Popular', icon: Sparkles, previewBg: 'bg-slate-900 text-white' },
  { id: 'zoom_in', label: 'Zoom In', category: 'Movement', icon: ZoomIn, previewBg: 'bg-indigo-100 text-indigo-600' },
  { id: 'zoom_out', label: 'Zoom Out', category: 'Movement', icon: ZoomOut, previewBg: 'bg-blue-100 text-blue-600' },
  { id: 'slide_left', label: 'Slide Left', category: 'Movement', icon: ArrowLeft, previewBg: 'bg-teal-100 text-teal-600' },
  { id: 'slide_right', label: 'Slide Right', category: 'Movement', icon: ArrowRight, previewBg: 'bg-cyan-100 text-cyan-600' },
  { id: 'glitch', label: 'Glitch Warp', category: 'Effects', icon: Zap, previewBg: 'bg-rose-100 text-rose-600' },
  { id: 'blur', label: 'Motion Blur', category: 'Effects', icon: Flame, previewBg: 'bg-fuchsia-100 text-fuchsia-600' },
];

export const TransitionsTool: React.FC<TransitionsToolProps> = ({
  transition,
  onChange,
  onPreviewTransition,
  onDone,
}) => {
  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Transitions
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Add dynamic cinematic cuts between clips or clip boundaries.
        </p>
      </div>

      {/* Grid of Transition Cards */}
      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.map((t) => {
          const isSelected = transition.type === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                onChange({
                  ...transition,
                  type: t.id,
                });
                onPreviewTransition?.(t.id);
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all relative group ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-400/40 shadow-xs font-semibold'
                  : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 text-slate-700'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${t.previewBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{t.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{t.category}</div>
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

      {/* Parameters (When a transition is active) */}
      {transition.type !== 'none' && (
        <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-3.5 shadow-2xs">
          {/* Duration Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Transition Duration</span>
              <span className="font-mono font-bold text-purple-700 text-xs">
                {transition.duration.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={transition.duration}
              onChange={(e) =>
                onChange({
                  ...transition,
                  duration: parseFloat(e.target.value),
                })
              }
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>0.2s (Fast)</span>
              <span>1.0s (Smooth)</span>
              <span>2.0s (Slow)</span>
            </div>
          </div>

          {/* Placement Selector */}
          <div className="space-y-1.5">
            <span className="text-slate-600 font-medium text-xs block">Apply Location</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'start' as const, label: 'Clip Start' },
                { id: 'end' as const, label: 'Clip End' },
                { id: 'both' as const, label: 'Both' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() =>
                    onChange({
                      ...transition,
                      position: pos.id,
                    })
                  }
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                    transition.position === pos.id
                      ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                      : 'bg-white border border-purple-100 text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Done / Confirm Transition Action */}
      {onDone && (
        <div className="pt-2">
          <button
            onClick={onDone}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done with Transitions</span>
          </button>
        </div>
      )}
    </div>
  );
};
