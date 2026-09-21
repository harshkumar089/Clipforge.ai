import React, { useRef } from 'react';
import {
  Image,
  Upload,
  Type,
  Maximize2,
  Eye,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';
import { WatermarkPip } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

interface PipToolProps {
  watermark: WatermarkPip;
  onChange: (watermark: WatermarkPip) => void;
}

export const PipTool: React.FC<PipToolProps> = ({ watermark, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file exceeds 10MB limit.', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          ...watermark,
          enabled: true,
          url: reader.result as string,
        });
        showToast('Logo/Watermark imported.', 'success');
      };
      reader.readAsDataURL(file);
    } catch {
      showToast('Failed to load image.', 'error');
    }
  };

  const handleSetPosition = (x: number, y: number) => {
    onChange({
      ...watermark,
      x,
      y,
    });
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Image className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            PIP & Watermark
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Add custom logos, brand watermarks, or picture-in-picture badges.
        </p>
      </div>

      {/* Enable Toggle Card */}
      <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-slate-800">Show Watermark Overlay</span>
        </div>
        <button
          onClick={() => onChange({ ...watermark, enabled: !watermark.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${
            watermark.enabled ? 'bg-purple-600' : 'bg-slate-200'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
              watermark.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {watermark.enabled && (
        <div className="space-y-3.5">
          {/* Logo Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/40 rounded-xl cursor-pointer text-center transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {watermark.url ? (
              <div className="flex items-center justify-center gap-3">
                <img
                  src={watermark.url}
                  alt="Watermark"
                  className="max-h-12 max-w-[100px] object-contain rounded border border-purple-100 shadow-xs"
                />
                <div className="text-left text-xs">
                  <div className="font-semibold text-purple-900">Custom Logo Active</div>
                  <div className="text-[10px] text-purple-600">Click to replace image</div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mx-auto text-purple-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-700">Upload Logo (PNG / JPG)</div>
                <div className="text-[10px] text-slate-400">Transparent PNG recommended</div>
              </div>
            )}
          </div>

          {/* Text Watermark Fallback / Custom Handle */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">Or Watermark Text / Handle</label>
            <input
              type="text"
              placeholder="@yourhandle"
              value={watermark.text || ''}
              onChange={(e) => onChange({ ...watermark, text: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-purple-100 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />
          </div>

          {/* Position Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-600 block">Position Anchor</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { label: 'Top Left', x: 10, y: 10 },
                { label: 'Top Right', x: 90, y: 10 },
                { label: 'Center', x: 50, y: 50 },
                { label: 'Bottom Left', x: 10, y: 88 },
                { label: 'Bottom Right', x: 90, y: 88 },
              ].map((pos) => {
                const isSelected = watermark.x === pos.x && watermark.y === pos.y;
                return (
                  <button
                    key={pos.label}
                    onClick={() => handleSetPosition(pos.x, pos.y)}
                    className={`py-1.5 rounded-lg border transition-colors text-center ${
                      isSelected
                        ? 'border-purple-400 bg-purple-100/80 text-purple-900 font-semibold shadow-2xs'
                        : 'border-purple-100 bg-white hover:bg-purple-50 text-slate-600'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scale Slider */}
          <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/20 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Scale</span>
              <span className="font-mono font-bold text-purple-700 text-xs">
                {(watermark.scale || 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.0"
              step="0.1"
              value={watermark.scale || 1.0}
              onChange={(e) => onChange({ ...watermark, scale: parseFloat(e.target.value) })}
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>

          {/* Opacity Slider */}
          <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/20 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Opacity</span>
              <span className="font-mono font-bold text-purple-700 text-xs">
                {watermark.opacity || 80}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={watermark.opacity || 80}
              onChange={(e) => onChange({ ...watermark, opacity: parseInt(e.target.value) })}
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
