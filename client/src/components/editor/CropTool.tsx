import React from 'react';
import { Smartphone, Monitor, Square, Minimize2, Eye } from 'lucide-react';

interface CropToolProps {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  onChange: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | 'original') => void;
  showPhoneFrame: boolean;
  onTogglePhoneFrame: (show: boolean) => void;
}

export const CropTool: React.FC<CropToolProps> = ({
  aspectRatio,
  onChange,
  showPhoneFrame,
  onTogglePhoneFrame,
}) => {
  const formats = [
    {
      id: '9:16' as const,
      label: '9:16',
      subtitle: 'Reels / TikTok',
      icon: Smartphone,
      aspectPreview: 'w-4 h-7',
    },
    {
      id: '4:5' as const,
      label: '4:5',
      subtitle: 'Instagram Portrait',
      icon: Smartphone,
      aspectPreview: 'w-4.5 h-6',
    },
    {
      id: '1:1' as const,
      label: '1:1',
      subtitle: 'Square Post',
      icon: Square,
      aspectPreview: 'w-5 h-5',
    },
    {
      id: '16:9' as const,
      label: '16:9',
      subtitle: 'YouTube / Web',
      icon: Monitor,
      aspectPreview: 'w-7 h-4',
    },
    {
      id: 'original' as const,
      label: 'Original',
      subtitle: 'Source Size',
      icon: Minimize2,
      aspectPreview: 'w-6 h-5 border-dashed',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Aspect Ratio & Canvas
          </span>
        </div>
      </div>

      {/* 2x2 Format Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium text-slate-600 block">Canvas Dimensions</span>
        <div className="grid grid-cols-2 gap-2">
          {formats.map((fmt) => {
            const isSelected = aspectRatio === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => onChange(fmt.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-purple-300 bg-purple-50/80 shadow-xs ring-1 ring-purple-300/60'
                    : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                }`}
              >
                {/* Visual Ratio Box Wireframe */}
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-purple-100/60 flex items-center justify-center">
                    <div
                      className={`border rounded-sm ${fmt.aspectPreview} ${
                        isSelected ? 'border-purple-600 bg-purple-200/50' : 'border-purple-400/80'
                      }`}
                    />
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
                  )}
                </div>

                <div>
                  <span className={`text-xs font-bold block ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{fmt.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone Frame Toggle (for 9:16) */}
      {aspectRatio === '9:16' && (
        <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100/70 flex items-center justify-center text-purple-600">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-800 block">Device Mockup Preview</span>
              <span className="text-[10px] text-slate-500">Show smartphone bezel in workspace</span>
            </div>
          </div>
          <button
            onClick={() => onTogglePhoneFrame(!showPhoneFrame)}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              showPhoneFrame ? 'bg-purple-600' : 'bg-slate-200'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full transition-transform ${
                showPhoneFrame ? 'bg-white translate-x-4.5' : 'bg-white translate-x-0.5'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
