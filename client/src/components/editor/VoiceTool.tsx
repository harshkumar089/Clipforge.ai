import React from 'react';
import {
  Mic,
  Radio,
  Sparkles,
  Bot,
  Flame,
  Volume2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { VoiceEffect, VoiceEffectType } from '../../types/index.js';

interface VoiceToolProps {
  voiceEffect: VoiceEffect;
  onChange: (voiceEffect: VoiceEffect) => void;
}

interface VoiceOption {
  id: VoiceEffectType;
  name: string;
  desc: string;
  icon: any;
  badge: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'none', name: 'Original Voice', desc: 'Natural recorded dialogue', icon: RotateCcw, badge: 'Default' },
  { id: 'deep', name: 'Deep Bass', desc: 'Low-frequency radio voice', icon: Volume2, badge: 'Popular' },
  { id: 'chipmunk', name: 'Chipmunk', desc: 'High-pitch helium effect', icon: Sparkles, badge: 'Funny' },
  { id: 'robot', name: 'Robotic Vocoder', desc: 'Metallic mechanical tone', icon: Bot, badge: 'Sci-Fi' },
  { id: 'echo', name: 'Hall Echo', desc: 'Large arena reverb & delay', icon: Flame, badge: 'Space' },
  { id: 'telephone', name: 'Telephone / Radio', desc: 'Bandpass vintage lo-fi filter', icon: Radio, badge: 'Lo-Fi' },
];

export const VoiceTool: React.FC<VoiceToolProps> = ({ voiceEffect, onChange }) => {
  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Voice Effects
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Transform speech with CapCut voice changers, pitch shifters, and radio filters.
        </p>
      </div>

      {/* Voice Options Grid */}
      <div className="space-y-1.5">
        {VOICE_OPTIONS.map((opt) => {
          const isSelected = voiceEffect.type === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() =>
                onChange({
                  ...voiceEffect,
                  type: opt.id,
                  intensity: voiceEffect.intensity || 80,
                })
              }
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                isSelected
                  ? 'border-purple-400 bg-purple-50/80 text-purple-900 ring-2 ring-purple-300 shadow-xs font-semibold'
                  : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{opt.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{opt.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100/60 text-purple-700 font-medium">
                  {opt.badge}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Intensity Slider if not 'none' */}
      {voiceEffect.type !== 'none' && (
        <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Effect Strength</span>
            <span className="font-mono font-bold text-purple-700 text-xs">
              {voiceEffect.intensity}%
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={voiceEffect.intensity}
            onChange={(e) =>
              onChange({
                ...voiceEffect,
                intensity: parseInt(e.target.value),
              })
            }
            className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
