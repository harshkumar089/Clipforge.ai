import React from 'react';
import { Scissors, RotateCcw, Clock } from 'lucide-react';

interface TrimToolProps {
  startTime: number;
  endTime: number;
  maxDuration: number;
  onStartTimeChange: (val: number) => void;
  onEndTimeChange: (val: number) => void;
  onReset: () => void;
  onSeek?: (val: number) => void;
}

export const TrimTool: React.FC<TrimToolProps> = ({
  startTime,
  endTime,
  maxDuration,
  onStartTimeChange,
  onEndTimeChange,
  onReset,
  onSeek,
}) => {
  const currentDuration = Math.max(0, endTime - startTime);
  const percentOfTotal = maxDuration > 0 ? Math.min(100, Math.round((currentDuration / maxDuration) * 100)) : 100;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">Trim Boundaries</span>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-slate-400 hover:text-purple-700 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-purple-50"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Duration Hero Card */}
      <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3 shadow-xs">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Selected Duration</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {currentDuration.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-purple-600 font-medium">sec</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Original Video</span>
            <span className="text-xs font-mono text-slate-600 font-medium">{maxDuration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Minimalist Progress Meter */}
        <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-200"
            style={{ width: `${percentOfTotal}%` }}
          />
        </div>
      </div>

      {/* Quick Length Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium text-slate-600 block">Duration Targets</span>
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-purple-50/50 border border-purple-100">
          {[10, 15, 20, 30].map((preset) => {
            const isMatch = Math.round(currentDuration) === preset;
            return (
              <button
                key={preset}
                onClick={() => {
                  const newEnd = Math.min(maxDuration, startTime + preset);
                  onEndTimeChange(newEnd);
                }}
                className={`py-1.5 rounded-md text-xs font-mono transition-all ${
                  isMatch
                    ? 'bg-white text-purple-700 font-semibold shadow-xs border border-purple-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-purple-100/40'
                }`}
              >
                {preset}s
              </button>
            );
          })}
        </div>
      </div>

      {/* Start and End Inputs */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-medium text-slate-600 block">Precise Seconds</span>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/30 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all">
            <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Start</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max={endTime - 0.5}
                value={startTime}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  onStartTimeChange(val);
                  onSeek?.(val);
                }}
                className="w-full bg-transparent text-sm text-slate-900 font-mono font-medium focus:outline-none"
              />
              <span className="text-xs font-mono text-purple-600">s</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/30 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all">
            <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">End</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.5"
                min={startTime + 0.5}
                max={maxDuration}
                value={endTime}
                onChange={(e) => {
                  const val = Math.min(maxDuration, parseFloat(e.target.value) || 0);
                  onEndTimeChange(val);
                  onSeek?.(val);
                }}
                className="w-full bg-transparent text-sm text-slate-900 font-mono font-medium focus:outline-none"
              />
              <span className="text-xs font-mono text-purple-600">s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
