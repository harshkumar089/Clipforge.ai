import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Upload,
  Volume2,
  VolumeX,
  Repeat,
  Trash2,
  Play,
  Pause,
  Sparkles,
  Loader2,
  Disc3,
  Sliders,
  Check,
} from 'lucide-react';
import { OverlayMusic } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

interface MusicToolProps {
  overlayMusic?: OverlayMusic;
  onChange: (music?: OverlayMusic) => void;
  videoVolume: number;
  onVideoVolumeChange: (vol: number) => void;
}

interface AudioPreset {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  fileName: string;
  url: string;
  tag: string;
}

export const MusicTool: React.FC<MusicToolProps> = ({
  overlayMusic,
  onChange,
  videoVolume,
  onVideoVolumeChange,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [presets, setPresets] = useState<AudioPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Standalone audition audio
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoadingPresets(true);
        const res = await api.getAudioPresets();
        if (res.success && res.presets) {
          setPresets(res.presets);
        }
      } catch (err) {
        console.warn('Could not load audio presets:', err);
      } finally {
        setLoadingPresets(false);
      }
    };
    fetchPresets();
  }, []);

  const handleTogglePreview = (url: string) => {
    if (previewingUrl === url) {
      previewAudioRef.current?.pause();
      setPreviewingUrl(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.volume = 0.7;
      audio.onended = () => setPreviewingUrl(null);
      audio.play().catch(() => {});
      previewAudioRef.current = audio;
      setPreviewingUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('Audio file exceeds 50MB limit.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('audio', file);

      const res = await api.uploadAudio(formData);
      if (res.success && res.audio) {
        onChange({
          url: res.audio.url,
          fileName: res.audio.fileName,
          name: file.name.replace(/\.[^/.]+$/, ''),
          originalName: res.audio.originalName,
          volume: overlayMusic?.volume !== undefined ? overlayMusic.volume : 50,
          loop: overlayMusic?.loop !== false,
          startTime: 0,
          duration: res.audio.duration,
        });
        showToast('Audio track imported.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload audio file.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: AudioPreset) => {
    onChange({
      url: preset.url,
      fileName: preset.fileName,
      name: preset.title,
      artist: preset.artist,
      volume: overlayMusic?.volume !== undefined ? overlayMusic.volume : 50,
      loop: true,
      startTime: 0,
      duration: preset.duration,
    });
    showToast(`Applied preset: ${preset.title}`, 'success');
  };

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
            <Music className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase font-mono">
            Background Music
          </span>
        </div>
      </div>

      {/* Upload Zone / Active Track */}
      {!overlayMusic ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-400 bg-purple-100/50'
              : 'border-purple-200 bg-purple-50/30 hover:border-purple-300 hover:bg-purple-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-9 h-9 rounded-lg bg-purple-100/70 border border-purple-200 flex items-center justify-center mx-auto mb-2 text-purple-600">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>

          <p className="text-xs font-semibold text-slate-800">
            {isUploading ? 'Importing audio...' : 'Import Audio File'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            MP3, WAV, M4A up to 50MB
          </p>
        </div>
      ) : (
        /* Active Track Minimalist Card */
        <div className="p-3.5 rounded-xl border border-purple-100 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Disc3 className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-800 truncate" title={overlayMusic.name}>
                  {overlayMusic.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <span>Track Loaded</span>
                  {overlayMusic.duration && (
                    <>
                      <span>•</span>
                      <span>{Math.round(overlayMusic.duration)}s</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleTogglePreview(overlayMusic.url)}
                className="p-1.5 rounded-md hover:bg-purple-50 text-slate-500 hover:text-purple-700 transition-colors"
                title="Preview"
              >
                {previewingUrl === overlayMusic.url ? (
                  <Pause className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  if (previewingUrl === overlayMusic.url) {
                    previewAudioRef.current?.pause();
                    setPreviewingUrl(null);
                  }
                  onChange(undefined);
                  showToast('Track removed.', 'info');
                }}
                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Remove track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-purple-100 text-[10px] text-slate-500">
            <span>Replace track:</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-700 hover:text-purple-900 font-medium transition-colors"
            >
              Browse file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Sliders & Mixing (Visible when music is loaded) */}
      {overlayMusic && (
        <div className="space-y-3 pt-1">
          <span className="text-[11px] font-medium text-slate-600 block">Mix Balance</span>

          {/* Music Volume */}
          <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 text-[11px]">Music Level</span>
              <span className="font-mono font-bold text-purple-700 text-[11px]">{overlayMusic.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={overlayMusic.volume}
              onChange={(e) =>
                onChange({
                  ...overlayMusic,
                  volume: parseInt(e.target.value),
                })
              }
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>

          {/* Video Dialogue Volume */}
          <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 text-[11px]">Original Dialogue</span>
              <span className="font-mono font-bold text-purple-700 text-[11px]">{videoVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={videoVolume}
              onChange={(e) => onVideoVolumeChange(parseInt(e.target.value))}
              className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
            />
          </div>

          {/* CapCut Audio Fade In & Fade Out */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 text-[11px]">Fade In</span>
                <span className="font-mono font-bold text-purple-700 text-[11px]">
                  {overlayMusic.fadeIn ?? 0}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={overlayMusic.fadeIn ?? 0}
                onChange={(e) =>
                  onChange({
                    ...overlayMusic,
                    fadeIn: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 text-[11px]">Fade Out</span>
                <span className="font-mono font-bold text-purple-700 text-[11px]">
                  {overlayMusic.fadeOut ?? 0}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={overlayMusic.fadeOut ?? 0}
                onChange={(e) =>
                  onChange({
                    ...overlayMusic,
                    fadeOut: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Loop Toggle */}
          <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs text-slate-800">Loop across clip</span>
            </div>
            <button
              onClick={() =>
                onChange({
                  ...overlayMusic,
                  loop: !overlayMusic.loop,
                })
              }
              className={`w-8 h-4.5 rounded-full transition-colors relative ${
                overlayMusic.loop ? 'bg-purple-600' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  overlayMusic.loop ? 'bg-white translate-x-3.5' : 'bg-white translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Preset Tracks */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-medium text-slate-600 block">Royalty-Free Ambient Tracks</span>

        {loadingPresets ? (
          <div className="py-4 text-center text-slate-400 text-xs">Loading tracks...</div>
        ) : (
          <div className="space-y-1.5">
            {presets.map((preset) => {
              const isSelected = overlayMusic?.fileName === preset.fileName;
              const isPreviewing = previewingUrl === preset.url;

              return (
                <div
                  key={preset.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-purple-300 bg-purple-50/80 shadow-xs ring-1 ring-purple-300/60'
                      : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleTogglePreview(preset.url)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isPreviewing
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                      }`}
                      title="Audition"
                    >
                      {isPreviewing ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-purple-600/80 font-mono">
                        {preset.genre}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    {isSelected ? 'Applied' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
