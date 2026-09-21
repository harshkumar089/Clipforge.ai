import React from 'react';
import { Sliders, Sun, Contrast, Droplets, Flame, CircleDot, RotateCcw, Sparkles, Check } from 'lucide-react';
import { ColorAdjustments } from '../../types/index.js';

interface AdjustToolProps {
  adjustments: ColorAdjustments;
  onChange: (adjustments: ColorAdjustments) => void;
  onDone?: () => void;
}

export const defaultAdjustments: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  vignette: 0,
};

const presets = [
  {
    name: 'Natural',
    values: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 },
  },
  {
    name: 'Auto Enhance',
    values: { brightness: 10, contrast: 15, saturation: 15, warmth: 0, vignette: 0 },
  },
  {
    name: 'Golden Hour',
    values: { brightness: 5, contrast: 10, saturation: 15, warmth: 25, vignette: 10 },
  },
  {
    name: 'Moody Film',
    values: { brightness: -5, contrast: 25, saturation: -10, warmth: 10, vignette: 25 },
  },
  {
    name: 'Clean Studio',
    values: { brightness: 15, contrast: 10, saturation: 5, warmth: -5, vignette: 0 },
  },
  {
    name: 'Vibrant Pop',
    values: { brightness: 5, contrast: 15, saturation: 35, warmth: 5, vignette: 0 },
  },
];

export const AdjustTool: React.FC<AdjustToolProps> = ({ adjustments, onChange, onDone }) => {
  const current = adjustments || defaultAdjustments;

  const updateParam = (key: keyof ColorAdjustments, value: number) => {
    onChange({
      ...current,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange(defaultAdjustments);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Color Grading</h3>
            <p className="text-[11px] text-slate-500">Fine-tune exposure and color balance</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-[11px] font-medium text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-purple-50"
          title="Reset all adjustments"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Quick Color Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          Pro Grading Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.values)}
              className="px-2 py-2 rounded-xl text-center border border-purple-100/90 bg-purple-50/20 hover:bg-purple-100/50 hover:border-purple-300 text-slate-700 hover:text-purple-800 text-xs font-medium transition-all"
            >
              <div className="font-semibold truncate">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Group */}
      <div className="space-y-4">
        {/* Brightness */}
        <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/25 border border-purple-100/70">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Brightness</span>
            </div>
            <span className="font-mono text-purple-700 font-bold text-[11px]">
              {current.brightness > 0 ? `+${current.brightness}` : current.brightness}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={current.brightness}
            onChange={(e) => updateParam('brightness', Number(e.target.value))}
            className="w-full h-1.5 bg-purple-100 rounded-lg accent-purple-600 cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/25 border border-purple-100/70">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Contrast className="w-3.5 h-3.5 text-indigo-500" />
              <span>Contrast</span>
            </div>
            <span className="font-mono text-purple-700 font-bold text-[11px]">
              {current.contrast > 0 ? `+${current.contrast}` : current.contrast}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={current.contrast}
            onChange={(e) => updateParam('contrast', Number(e.target.value))}
            className="w-full h-1.5 bg-purple-100 rounded-lg accent-purple-600 cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/25 border border-purple-100/70">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Droplets className="w-3.5 h-3.5 text-purple-500" />
              <span>Saturation</span>
            </div>
            <span className="font-mono text-purple-700 font-bold text-[11px]">
              {current.saturation > 0 ? `+${current.saturation}` : current.saturation}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={current.saturation}
            onChange={(e) => updateParam('saturation', Number(e.target.value))}
            className="w-full h-1.5 bg-purple-100 rounded-lg accent-purple-600 cursor-pointer"
          />
        </div>

        {/* Warmth / Temperature */}
        <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/25 border border-purple-100/70">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Warmth</span>
            </div>
            <span className="font-mono text-purple-700 font-bold text-[11px]">
              {current.warmth > 0 ? `+${current.warmth}` : current.warmth}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={current.warmth}
            onChange={(e) => updateParam('warmth', Number(e.target.value))}
            className="w-full h-1.5 bg-purple-100 rounded-lg accent-purple-600 cursor-pointer"
          />
        </div>

        {/* Vignette */}
        <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/25 border border-purple-100/70">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <CircleDot className="w-3.5 h-3.5 text-slate-700" />
              <span>Vignette</span>
            </div>
            <span className="font-mono text-purple-700 font-bold text-[11px]">
              {current.vignette}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={current.vignette}
            onChange={(e) => updateParam('vignette', Number(e.target.value))}
            className="w-full h-1.5 bg-purple-100 rounded-lg accent-purple-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Done / Confirm Adjustments Action */}
      {onDone && (
        <div className="pt-2">
          <button
            onClick={onDone}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done with Adjustments</span>
          </button>
        </div>
      )}
    </div>
  );
};
