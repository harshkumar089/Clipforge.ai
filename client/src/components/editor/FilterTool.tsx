import React from 'react';
import { Sliders, Check, RotateCcw, Sparkles } from 'lucide-react';
import { VideoFilterType } from '../../types/index.js';

interface FilterToolProps {
  filter: VideoFilterType;
  filterIntensity?: number;
  onChange: (filter: VideoFilterType) => void;
  onIntensityChange?: (intensity: number) => void;
  onDone?: () => void;
}

export const FilterTool: React.FC<FilterToolProps> = ({
  filter,
  filterIntensity = 100,
  onChange,
  onIntensityChange,
  onDone,
}) => {
  const filterList: Array<{
    id: VideoFilterType;
    name: string;
    swatchClass: string;
  }> = [
    {
      id: 'normal',
      name: 'Original',
      swatchClass: 'bg-zinc-800',
    },
    {
      id: 'cinematic',
      name: 'Teal/Orange',
      swatchClass: 'bg-gradient-to-tr from-cyan-600 via-amber-500 to-orange-500',
    },
    {
      id: 'bright',
      name: 'Bright',
      swatchClass: 'bg-gradient-to-tr from-amber-200 to-yellow-400',
    },
    {
      id: 'warm',
      name: 'Golden',
      swatchClass: 'bg-gradient-to-tr from-amber-600 to-orange-400',
    },
    {
      id: 'cool',
      name: 'Nordic',
      swatchClass: 'bg-gradient-to-tr from-sky-600 to-teal-400',
    },
    {
      id: 'contrast',
      name: 'Contrast',
      swatchClass: 'bg-gradient-to-tr from-zinc-950 via-zinc-600 to-white',
    },
    {
      id: 'vibrant',
      name: 'Pop',
      swatchClass: 'bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-400',
    },
    {
      id: 'vintage',
      name: 'Vintage',
      swatchClass: 'bg-gradient-to-tr from-amber-800 to-yellow-700',
    },
    {
      id: 'faded',
      name: 'Matte',
      swatchClass: 'bg-gradient-to-tr from-zinc-500 via-stone-400 to-zinc-300',
    },
    {
      id: 'dramatic',
      name: 'Noir',
      swatchClass: 'bg-gradient-to-tr from-black via-zinc-800 to-zinc-400',
    },
    {
      id: 'cyberpunk',
      name: 'Cyber',
      swatchClass: 'bg-gradient-to-tr from-fuchsia-600 via-indigo-600 to-cyan-400',
    },
    {
      id: 'grayscale',
      name: 'Mono',
      swatchClass: 'bg-gradient-to-tr from-zinc-900 to-zinc-300',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Color Grading
          </span>
        </div>
        {filter !== 'normal' && (
          <button
            onClick={() => {
              onChange('normal');
              onIntensityChange?.(100);
            }}
            className="text-[11px] text-slate-400 hover:text-purple-700 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-purple-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Intensity Slider Card (Visible when a filter is applied) */}
      {filter !== 'normal' && onIntensityChange && (
        <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-700">Filter Strength</span>
            <span className="text-xs font-mono font-bold text-purple-700">{filterIntensity}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={filterIntensity}
            onChange={(e) => onIntensityChange(parseInt(e.target.value))}
            className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
          />

          <div className="grid grid-cols-4 gap-1 pt-1">
            {[25, 50, 75, 100].map((level) => (
              <button
                key={level}
                onClick={() => onIntensityChange(level)}
                className={`py-1 rounded text-[10px] font-mono transition-all ${
                  filterIntensity === level
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-purple-100/50'
                }`}
              >
                {level}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Visual Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium text-slate-600 block">Presets</span>
        <div className="grid grid-cols-3 gap-2">
          {filterList.map((item) => {
            const isSelected = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id);
                  if (item.id !== 'normal' && filterIntensity === 0) {
                    onIntensityChange?.(100);
                  }
                }}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-2 group ${
                  isSelected
                    ? 'border-purple-300 bg-purple-50/80 shadow-xs ring-1 ring-purple-300/60'
                    : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                }`}
              >
                {/* Visual Gradient Swatch */}
                <div
                  className={`w-full aspect-video rounded-lg ${item.swatchClass} relative overflow-hidden flex items-center justify-center transition-transform group-hover:scale-[1.02] shadow-xs`}
                >
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <span
                  className={`text-[11px] font-medium truncate block w-full ${
                    isSelected ? 'text-purple-900 font-semibold' : 'text-slate-600 group-hover:text-slate-900'
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Done / Confirm Filter Action */}
      {onDone && (
        <div className="pt-2">
          <button
            onClick={onDone}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done with Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
