import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  CheckCircle2,
  Loader2,
  X,
  Play,
  Share2,
  Film,
  Sparkles,
  ArrowRight,
  Scissors,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { VideoFilterType, OverlayMusic } from '../../types/index.js';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipId: string;
  clipTitle: string;
  currentSettings: {
    startTime: number;
    endTime: number;
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
    filter: VideoFilterType;
    filterIntensity?: number;
    adjustments?: any;
    stickers?: any[];
    transition?: any;
    effect?: any;
    soundEffects?: any[];
    voiceEffect?: any;
    watermark?: any;
    speedCurve?: any;
    speed: number;
    volume: number;
    overlayMusic?: OverlayMusic;
    textOverlays: any[];
  };
  onExportAnother?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clipId,
  clipTitle,
  currentSettings,
  onExportAnother,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '4:5' | '1:1' | '16:9'>(
    currentSettings.aspectRatio === 'original' ? '9:16' : (currentSettings.aspectRatio as any)
  );

  // Export progress states: 'idle' | 'rendering' | 'completed' | 'failed'
  const [status, setStatus] = useState<'idle' | 'rendering' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      setStatus('rendering');
      setProgress(5);
      setStatusMessage('Rendering your clip...');

      const res = await api.exportClip(clipId, {
        ...currentSettings,
        resolution,
        aspectRatio,
      });

      const jobId = res.jobId;

      // Poll export status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.getExportStatus(jobId);

          if (statusRes.progress) {
            setProgress(statusRes.progress);
          }
          if (statusRes.message) {
            setStatusMessage(statusRes.message);
          }

          if (statusRes.status === 'completed') {
            clearInterval(pollInterval);
            setStatus('completed');
            setProgress(100);
            setStatusMessage('Your clip is ready! Downloading to your device...');
            const finalDownload = statusRes.result?.downloadUrl || `/api/export/download/${statusRes.result?.fileName}`;
            setDownloadUrl(finalDownload);
            setOutputUrl(statusRes.result?.outputUrl);
            showToast('Clip ready! Downloading directly to your device...', 'success');

            // Directly trigger download to user's device
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = finalDownload;
              const cleanName = (clipTitle || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
              link.setAttribute('download', `clipforge-${cleanName}.mp4`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, 300);
          } else if (statusRes.status === 'failed') {
            clearInterval(pollInterval);
            setStatus('failed');
            setStatusMessage(statusRes.error || 'Export rendering failed.');
            showToast('Rendering failed. Please try again.', 'error');
          }
        } catch (err: any) {
          clearInterval(pollInterval);
          setStatus('failed');
          setStatusMessage(err.message || 'Connection lost.');
        }
      }, 1000);
    } catch (err: any) {
      setStatus('failed');
      setStatusMessage(err.message || 'Failed to start export.');
      showToast(err.message || 'Failed to start export.', 'error');
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      setIsDownloading(true);
      showToast('Downloading video...', 'info');

      // Fetch as blob for guaranteed native download in all browsers
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = (clipTitle || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      link.download = `clipforge-${cleanName}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      showToast('Download started!', 'success');
    } catch (err: any) {
      console.warn('Blob download fallback:', err);
      // Fallback: direct anchor with download attribute
      const fallbackLink = document.createElement('a');
      fallbackLink.href = downloadUrl;
      const cleanName = (clipTitle || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      fallbackLink.setAttribute('download', `clipforge-${cleanName}.mp4`);
      fallbackLink.target = '_blank';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 dark:bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-purple-200/90 dark:border-purple-800/80 bg-white dark:bg-[#120a26] p-6 shadow-[0_0_50px_rgba(168,85,247,0.35)] dark:shadow-[0_0_60px_rgba(168,85,247,0.5)] relative overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white transition-colors">Export & Render Clip</h3>
              <p className="text-xs text-slate-500 dark:text-purple-300/60 transition-colors">{clipTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-purple-300/70 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-6">
          {status === 'idle' && (
            <div className="space-y-5">
              {/* Resolution selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-purple-200">Resolution Quality</label>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {resolution === '4k' ? '3840 × 2160 (Ultra HD)' : resolution === '1080p' ? '1920 × 1080 (Full HD)' : '1280 × 720 (HD)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: '1080p', label: '1080p', badge: 'Standard', desc: 'Full HD' },
                      { id: '4k', label: '4K Ultra', badge: 'Cinema', desc: '2160p Master' },
                      { id: '720p', label: '720p', badge: null, desc: 'Compact HD' },
                    ] as const
                  ).map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setResolution(res.id)}
                      className={`p-2.5 rounded-xl border text-center font-medium text-xs transition-all relative cursor-pointer ${
                        resolution === res.id
                          ? 'border-purple-500 bg-purple-50/90 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 font-bold ring-2 ring-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                          : 'border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/30 text-slate-600 dark:text-purple-200/70 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50'
                      }`}
                    >
                      {res.badge && (
                        <span
                          className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase shadow-xs ${
                            res.id === '4k'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                              : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                          }`}
                        >
                          {res.badge}
                        </span>
                      )}
                      <div className="text-sm text-slate-900 dark:text-white font-bold mt-0.5">{res.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-purple-300/60 mt-0.5">{res.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-purple-200">Export Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['9:16', '4:5', '1:1', '16:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`p-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                        aspectRatio === ratio
                          ? 'border-purple-400 dark:border-purple-500 bg-purple-50/80 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 font-bold ring-1 ring-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/30 text-slate-600 dark:text-purple-200/70 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white">{ratio}</div>
                      <div className="text-[9px] text-slate-500 dark:text-purple-300/60 mt-0.5">
                        {ratio === '9:16' ? 'Vertical' : ratio === '4:5' ? 'Portrait' : ratio === '1:1' ? 'Square' : 'Wide'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format pill */}
              <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-purple-300/80">Container Format:</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700/60 px-2.5 py-1 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                  MP4 (H.264 / AAC)
                </span>
              </div>

              {/* Start render button */}
              <button
                onClick={handleStartExport}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-500/25 dark:shadow-[0_0_24px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                Render & Export Final MP4
              </button>
            </div>
          )}

          {status === 'rendering' && (
            <div className="py-8 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                <span className="absolute text-xs font-mono font-bold text-purple-900">{progress}%</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{statusMessage}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Applying filters, cropping aspect ratio, and encoding with FFmpeg...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-purple-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="py-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Your clip is ready!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Rendered in {resolution === '4k' ? '4K Ultra HD (2160p)' : resolution} with all edits, filters, and {aspectRatio} aspect ratio.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Generated and saved to My Clips library
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-75 disabled:pointer-events-none"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Downloading Video...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Final MP4</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onClose();
                    navigate('/clips');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  View in My Clips
                </button>

                {outputUrl && (
                  <a
                    href={outputUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-purple-800 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 text-purple-600" />
                    Preview in New Tab
                  </a>
                )}

                <button
                  onClick={() => {
                    setStatus('idle');
                    if (onExportAnother) onExportAnother();
                  }}
                  className="w-full py-2 text-xs text-slate-500 hover:text-purple-700 transition-colors font-medium"
                >
                  Create Another Clip
                </button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="py-6 text-center space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {statusMessage}
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
