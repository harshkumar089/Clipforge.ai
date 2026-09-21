import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeToolProps {
  volume: number; // 0 - 200%
  onChange: (volume: number) => void;
}

export const VolumeTool: React.FC<VolumeToolProps> = ({ volume, onChange }) => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Audio Gain
          </span>
        </div>
      </div>

      {/* Main Volume Slider Card */}
      <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            {volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span className="text-[11px] font-medium text-slate-600">Master Level</span>
          </div>
          <span className="font-mono font-bold text-purple-700 text-xs">{volume}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={volume}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0%</span>
          <span>100% (Default)</span>
          <span>200% (Boost)</span>
        </div>
      </div>

      {/* Quick Level Presets */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-purple-50/50 border border-purple-100">
        {[0, 50, 100, 150].map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`py-1.5 rounded-lg text-xs font-mono transition-all ${
              volume === level
                ? 'bg-white text-purple-700 font-semibold shadow-xs border border-purple-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-purple-100/40'
            }`}
          >
            {level === 0 ? 'Mute' : `${level}%`}
          </button>
        ))}
      </div>
    </div>
  );
};
