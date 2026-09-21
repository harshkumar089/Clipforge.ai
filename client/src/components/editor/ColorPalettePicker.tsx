import React from 'react';
import { Sparkles, Palette, Eye, Sun, Shield } from 'lucide-react';
import { CREATOR_PALETTES, POPULAR_COLORS, ColorPalette } from '../../utils/colorPresets.js';

interface ColorStylingProps {
  color: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowStyle?: 'none' | 'soft' | 'hard' | 'glow';
  shadowColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  isUppercase?: boolean;
  letterSpacing?: number;
  onChange: (updates: {
    color?: string;
    outlineColor?: string;
    outlineWidth?: number;
    shadowStyle?: 'none' | 'soft' | 'hard' | 'glow';
    shadowColor?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    isUppercase?: boolean;
    letterSpacing?: number;
  }) => void;
}

export const ColorPalettePicker: React.FC<ColorStylingProps> = ({
  color,
  outlineColor = '#000000',
  outlineWidth = 0,
  shadowStyle = 'soft',
  shadowColor = '#000000',
  backgroundColor = '#000000',
  backgroundOpacity = 0.5,
  isUppercase = false,
  letterSpacing = 0,
  onChange,
}) => {
  const applyPalette = (p: ColorPalette) => {
    onChange({
      color: p.textColor,
      outlineColor: p.outlineColor,
      outlineWidth: p.outlineWidth,
      shadowStyle: p.shadowStyle,
      shadowColor: p.shadowColor,
      backgroundColor: p.backgroundColor,
      backgroundOpacity: p.backgroundOpacity,
    });
  };

  return (
    <div className="space-y-4 pt-1">
      {/* 1-Click Creator Trending Presets */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          Trending Creator Palettes
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CREATOR_PALETTES.map((p) => {
            const isMatch = color.toLowerCase() === p.textColor.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPalette(p)}
                className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  isMatch
                    ? 'border-purple-400 bg-purple-50/80 shadow-xs ring-1 ring-purple-300'
                    : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: p.textColor }}
                  />
                  <span className="text-[10px] font-bold text-slate-800 truncate">{p.name}</span>
                </div>
                <span className="text-[9px] text-slate-500 truncate">{p.creator}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Text Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium text-slate-700">Text Color</span>
          <span className="font-mono text-xs text-purple-700 font-bold uppercase">{color}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ color: c })}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-lg border shrink-0 transition-transform ${
                  color.toLowerCase() === c.toLowerCase()
                    ? 'scale-110 border-white ring-2 ring-purple-500 shadow-md'
                    : 'border-slate-300 hover:scale-105'
                }`}
              />
            ))}
          </div>
          <input
            type="color"
            value={color.startsWith('#') ? color : '#ffffff'}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-8 h-8 rounded-lg bg-transparent border border-purple-200 cursor-pointer shrink-0"
            title="Custom Text Color"
          />
        </div>
      </div>



      {/* Stroke / Outline Customization */}
      <div className="p-3 bg-purple-50/30 rounded-xl border border-purple-100 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-700">
          <span className="font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            Text Stroke / Outline
          </span>
          <span className="font-mono text-purple-700 font-bold text-xs">{outlineWidth}px</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={outlineWidth}
            onChange={(e) => onChange({ outlineWidth: parseInt(e.target.value) })}
            className="flex-1 accent-purple-600 h-1.5 bg-purple-200 rounded-lg cursor-pointer"
          />
          <input
            type="color"
            value={outlineColor.startsWith('#') ? outlineColor : '#000000'}
            onChange={(e) => onChange({ outlineColor: e.target.value })}
            className="w-7 h-7 rounded-lg bg-transparent border border-purple-200 cursor-pointer shrink-0"
            title="Outline Color"
          />
        </div>
      </div>

      {/* Shadow & Glow Styles */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-slate-600">Shadow / Glow Effect</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'none' as const, label: 'None' },
            { id: 'soft' as const, label: 'Soft Shadow' },
            { id: 'hard' as const, label: 'Hard Edge' },
            { id: 'glow' as const, label: 'Neon Glow' },
          ].map((s) => {
            const isSelected = shadowStyle === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ shadowStyle: s.id })}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center transition-all ${
                  isSelected
                    ? 'border-purple-300 bg-purple-100 text-purple-800 font-bold shadow-xs'
                    : 'border-purple-100 bg-white text-slate-600 hover:text-slate-900 hover:bg-purple-50/40'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Badge & Opacity */}
      <div className="p-3 bg-purple-50/30 rounded-xl border border-purple-100 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-700">
          <span className="font-medium">Background Box / Pill</span>
          <span className="font-mono text-purple-700 font-bold text-xs">{Math.round(backgroundOpacity * 100)}%</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(backgroundOpacity * 100)}
            onChange={(e) => onChange({ backgroundOpacity: parseInt(e.target.value) / 100 })}
            className="flex-1 accent-purple-600 h-1.5 bg-purple-200 rounded-lg cursor-pointer"
          />
          <input
            type="color"
            value={backgroundColor.startsWith('#') ? backgroundColor : '#000000'}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="w-7 h-7 rounded-lg bg-transparent border border-purple-200 cursor-pointer shrink-0"
            title="Box Background Color"
          />
        </div>
      </div>

      {/* Typography Formatting: Uppercase & Letter Spacing */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange({ isUppercase: !isUppercase })}
          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isUppercase
              ? 'border-purple-300 bg-purple-100 text-purple-800 font-bold shadow-xs'
              : 'border-purple-100 bg-white text-slate-600 hover:text-slate-900 hover:bg-purple-50/40'
          }`}
        >
          <span className="font-mono font-black text-sm">TT</span>
          <span>UPPERCASE</span>
        </button>

        <div className="flex items-center gap-2 bg-purple-50/30 px-3 py-1.5 rounded-xl border border-purple-100 shadow-xs">
          <div className="flex-1 space-y-0.5">
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Spacing</span>
              <span className="font-mono text-purple-700 font-bold">{letterSpacing}px</span>
            </div>
            <input
              type="range"
              min="-2"
              max="8"
              step="1"
              value={letterSpacing}
              onChange={(e) => onChange({ letterSpacing: parseInt(e.target.value) })}
              className="w-full accent-purple-600 h-1 bg-purple-200 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
