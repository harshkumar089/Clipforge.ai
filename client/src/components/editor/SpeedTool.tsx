import React, { useState } from 'react';
import { Gauge, Zap, TrendingUp, Activity, Check } from 'lucide-react';
import { SpeedCurve, SpeedCurveMode } from '../../types/index.js';

interface SpeedToolProps {
  speed: number;
  onChange: (speed: number) => void;
  speedCurve?: SpeedCurve;
  onSpeedCurveChange?: (curve: SpeedCurve) => void;
}

interface CurvePreset {
  id: SpeedCurveMode;
  name: string;
  desc: string;
  points: number[]; // 5 sample points along the clip
}

const CURVE_PRESETS: CurvePreset[] = [
  {
    id: 'constant',
    name: 'Standard Speed',
    desc: 'Linear constant speed across clip',
    points: [1, 1, 1, 1, 1],
  },
  {
    id: 'montage',
    name: 'Hero Montage',
    desc: 'Slow intro, high-speed rush, slow landing',
    points: [0.6, 1.8, 2.0, 1.6, 0.6],
  },
  {
    id: 'bullet',
    name: 'Bullet Time',
    desc: 'Normal speed with sudden matrix super-slow-mo',
    points: [1.2, 0.3, 0.3, 0.4, 1.2],
  },
  {
    id: 'flash_in',
    name: 'Flash In',
    desc: 'Hyper-speed acceleration into steady rhythm',
    points: [2.5, 2.0, 1.2, 1.0, 1.0],
  },
  {
    id: 'jump_cut',
    name: 'Jump Velocity',
    desc: 'Rhythmic speed jumps for viral beat syncing',
    points: [1.5, 0.6, 1.8, 0.5, 1.4],
  },
];

export const SpeedTool: React.FC<SpeedToolProps> = ({
  speed,
  onChange,
  speedCurve = { mode: 'constant' },
  onSpeedCurveChange,
}) => {
  const [activeTab, setActiveTab] = useState<'normal' | 'curve'>('normal');
  const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

  const currentCurve = CURVE_PRESETS.find((c) => c.id === speedCurve.mode) || CURVE_PRESETS[0];

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Speed & Velocity
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Adjust playback rate or apply CapCut viral velocity curves.
        </p>
      </div>

      {/* Mode Switcher: Normal vs Curve */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-purple-50/60 border border-purple-100 rounded-xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('normal')}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === 'normal'
              ? 'bg-white text-purple-900 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Normal Speed
        </button>
        <button
          onClick={() => setActiveTab('curve')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'curve'
              ? 'bg-white text-purple-900 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
          <span>Speed Curve (Velocity)</span>
        </button>
      </div>

      {activeTab === 'normal' ? (
        <div className="space-y-4">
          {/* Rate Pills */}
          <div className="grid grid-cols-4 gap-1.5">
            {speeds.map((s) => {
              const isSelected = speed === s;
              return (
                <button
                  key={s}
                  onClick={() => onChange(s)}
                  className={`py-2 rounded-lg font-mono text-xs transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white font-bold shadow-2xs'
                      : 'bg-white border border-purple-100 text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  {s}x
                </button>
              );
            })}
          </div>

          {/* Continuous Speed Slider */}
          <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Custom Rate</span>
              <span className="font-mono font-bold text-purple-700 text-xs">
                {speed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={speed}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>
        </div>
      ) : (
        /* CapCut Speed Curves / Velocity Mode */
        <div className="space-y-3.5">
          {/* Velocity Graph Visualizer */}
          <div className="p-3 rounded-xl border border-purple-100 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">Velocity Graph</span>
              <span className="font-mono text-purple-600 font-medium">{currentCurve.name}</span>
            </div>

            {/* SVG Speed Curve */}
            <div className="h-20 w-full bg-purple-50/40 rounded-lg p-2 relative overflow-hidden flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Baseline 1.0x */}
                <line x1="0" y1="20" x2="100" y2="20" stroke="#d8b4fe" strokeDasharray="2 2" strokeWidth="0.8" />
                {/* Curve Polygon Fill */}
                <polygon
                  fill="url(#curveGrad)"
                  points={`0,40 ${currentCurve.points
                    .map((p, i) => `${(i / (currentCurve.points.length - 1)) * 100},${40 - Math.min(38, p * 12)}`)
                    .join(' ')} 100,40`}
                />
                {/* Curve Polyline */}
                <polyline
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={currentCurve.points
                    .map((p, i) => `${(i / (currentCurve.points.length - 1)) * 100},${40 - Math.min(38, p * 12)}`)
                    .join(' ')}
                />
              </svg>
            </div>
          </div>

          {/* Curve Presets Cards */}
          <div className="space-y-1.5">
            {CURVE_PRESETS.map((preset) => {
              const isSelected = speedCurve.mode === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSpeedCurveChange?.({ mode: preset.id })}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-purple-400 bg-purple-50/80 text-purple-900 ring-2 ring-purple-300 shadow-2xs font-semibold'
                      : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{preset.desc}</div>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio Pitch Correction Tag */}
      <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 text-xs text-slate-600 flex items-center justify-between shadow-2xs">
        <span className="text-[11px] text-slate-500">Audio Pitch</span>
        <span className="text-[11px] text-purple-700 font-semibold font-mono">
          Auto Corrected (atempo)
        </span>
      </div>
    </div>
  );
};
