import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Scissors,
  Play,
  Edit3,
  Download,
  Trash2,
  Calendar,
  Clock,
  Smartphone,
  Sparkles,
  Loader2,
  X,
  Check,
  Film,
  FileArchive,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Clip } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { PhoneFrame } from '../components/video/PhoneFrame.js';
import { BatchExportModal } from '../components/editor/BatchExportModal.js';

export const MyClipsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoIdFilter = searchParams.get('videoId');
  const { showToast } = useToast();

  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  // Preview Modal State
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);

  // Rename State
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Batch Export State
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const toggleSelectClip = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    setSelectedClipIds((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  };

  const handleSelectAllClips = () => {
    if (selectedClipIds.length === clips.length) {
      setSelectedClipIds([]);
    } else {
      setSelectedClipIds(clips.map((c) => c.id));
    }
  };

  const handleOpenBatchExport = () => {
    setIsBatchModalOpen(true);
  };

  const handleExportSingleClip = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    setSelectedClipIds([clipId]);
    setIsBatchModalOpen(true);
  };

  const fetchClips = async () => {
    try {
      setLoading(true);
      const res = await api.getClips({
        status: activeFilter !== 'all' ? activeFilter : undefined,
        videoId: videoIdFilter || undefined,
      });
      if (res.success) {
        setClips(res.clips);
      }
    } catch (err: any) {
      showToast('Failed to load clips.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [activeFilter, videoIdFilter]);

  const handleDelete = async (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this clip?')) return;

    try {
      await api.deleteClip(clipId);
      showToast('Clip deleted.', 'info');
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete clip.', 'error');
    }
  };

  const handleSaveRename = async (clipId: string) => {
    if (!newTitle.trim()) {
      setEditingClipId(null);
      return;
    }
    try {
      await api.updateClip(clipId, { title: newTitle.trim() });
      setClips((prev) =>
        prev.map((c) => (c.id === clipId ? { ...c, title: newTitle.trim() } : c))
      );
      setEditingClipId(null);
      showToast('Clip renamed.', 'success');
    } catch (err: any) {
      showToast('Failed to rename clip.', 'error');
    }
  };

  const handleDirectDownload = async (clip: Clip) => {
    const rawUrl = clip.clipUrl || clip.videoUrl;
    if (!rawUrl) {
      showToast('Video file not available for download.', 'error');
      return;
    }
    const fileName = rawUrl.split('/').pop()?.split('?')[0];
    const downloadUrl = fileName ? `/api/export/download/${fileName}` : rawUrl;

    try {
      showToast('Preparing download...', 'info');
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanTitle = (clip.title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      link.download = `clipforge-${cleanTitle}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      showToast('Download started.', 'success');
    } catch {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${clip.title.replace(/\s+/g, '-').toLowerCase()}.mp4`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Clip Library</h2>
            {videoIdFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-[11px] font-medium text-brand-300">
                Filtered by video
                <button
                  onClick={() => navigate('/clips')}
                  className="hover:text-white ml-0.5"
                  title="Clear video filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-purple-300/70 mt-1">
            {videoIdFilter
              ? 'Showing clips generated from selected video. Click the "X" above to view all clips.'
              : 'All AI-generated social clips ready for preview, editing, and export.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 self-start sm:self-auto max-w-full overflow-x-auto no-scrollbar">
          {(['all', 'completed', 'processing', 'failed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-purple-300/70 hover:text-purple-700 dark:hover:text-white hover:bg-purple-100/60 dark:hover:bg-purple-900/40'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Operations Section */}
      {clips.length > 0 && (
        <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-pink-50/50 dark:from-[#150c2f] dark:via-[#130b2a] dark:to-[#170c32] backdrop-blur-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllClips}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-semibold text-slate-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedClipIds.length === clips.length && clips.length > 0
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-slate-300 dark:border-purple-600'
                }`}
              >
                {selectedClipIds.length === clips.length && clips.length > 0 && (
                  <Check className="w-3 h-3 stroke-[3]" />
                )}
              </span>
              <span>{selectedClipIds.length === clips.length ? 'Deselect All' : 'Select All'}</span>
            </button>

            <span className="text-xs text-slate-600 dark:text-purple-300/80 font-medium">
              {selectedClipIds.length > 0 ? (
                <span>
                  <strong className="text-purple-600 dark:text-purple-400 font-bold">
                    {selectedClipIds.length}
                  </strong>{' '}
                  of {clips.length} clip(s) selected
                </span>
              ) : (
                <span>Select clips to batch export or export all at once</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenBatchExport}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>
                {selectedClipIds.length > 0
                  ? `Batch Export Selected (${selectedClipIds.length})`
                  : `Batch Export All Clips (${clips.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : clips.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-purple-200 dark:border-purple-800/60 bg-white/70 dark:bg-[#120a26]/70 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 mx-auto">
            <Scissors className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No clips found</h3>
            <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 max-w-sm mx-auto">
              {activeFilter !== 'all'
                ? `No clips matching "${activeFilter}" filter.`
                : 'Upload a video to automatically generate short clips.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Create Clips
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {clips.map((clip) => {
            const isSelected = selectedClipIds.includes(clip.id);
            return (
              <div
                key={clip.id}
                className={`glass-card rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group ${
                  isSelected
                    ? 'border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/50 bg-purple-50/30 dark:bg-purple-950/30 shadow-md shadow-purple-500/10'
                    : 'border-purple-100/90 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/90 shadow-sm shadow-purple-500/5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-[0_0_28px_rgba(168,85,247,0.25)]'
                }`}
              >
                <div>
                  {/* Thumbnail & Badges */}
                  <div
                    onClick={() => setPreviewClip(clip)}
                    className="relative aspect-[9/14] sm:aspect-[9/12] w-full bg-purple-50 dark:bg-purple-950/50 overflow-hidden cursor-pointer group/thumb"
                  >
                    {clip.thumbnailUrl ? (
                      <img
                        src={clip.thumbnailUrl}
                        alt={clip.title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-300">
                        <Scissors className="w-8 h-8" />
                      </div>
                    )}

                    {/* Batch Selection Checkbox */}
                    <button
                      onClick={(e) => toggleSelectClip(e, clip.id)}
                      className={`absolute top-2 left-2 z-20 p-1.5 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-white/80'
                          : 'bg-black/55 text-white/70 hover:bg-black/80 hover:text-white border border-white/20'
                      }`}
                      title={isSelected ? 'Deselect for batch export' : 'Select for batch export'}
                    >
                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-[3px] border border-white/70" />
                        )}
                      </div>
                    </button>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover/thumb:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Aspect Ratio Badge (Bottom Left) */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] font-bold text-purple-300 border border-purple-400/30 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      {clip.aspectRatio}
                    </div>

                    {/* Duration Pill (Bottom Right) */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-semibold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {clip.duration.toFixed(1)}s
                    </div>

                    {/* Score Pill (Top Right) */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-600/90 text-[10px] font-mono font-bold text-white shadow">
                      {Math.round(clip.score * 100)}% Match
                    </div>
                  </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  {editingClipId === clip.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="flex-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-400 dark:border-purple-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(clip.id)}
                        className="p-1 text-emerald-600 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingClipId(null)}
                        className="p-1 text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1">{clip.title}</h4>
                      <button
                        onClick={() => {
                          setEditingClipId(clip.id);
                          setNewTitle(clip.title);
                        }}
                        title="Rename"
                        className="text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 p-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-purple-300/60 line-clamp-1">{clip.reason}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-purple-50/40 dark:bg-purple-950/40 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between gap-1">
                <button
                  onClick={() => navigate(`/editor/${clip.id}`)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>

                <button
                  onClick={(e) => handleExportSingleClip(e, clip.id)}
                  title="Export this clip with adjustments"
                  className="p-2 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDirectDownload(clip)}
                  title="Download MP4"
                  className="p-2 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleDelete(e, clip.id)}
                  title="Delete Clip"
                  className="p-2 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal with Phone Frame option */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm sm:max-w-md my-auto max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewClip(null)}
              className="absolute -top-3 right-0 sm:top-2 sm:right-2 z-40 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer border border-white/20"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden">
              <PhoneFrame active={true}>
                <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
                  {/* Blurred Background Video */}
                  <video
                    src={previewClip.clipUrl || previewClip.videoUrl || ''}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-60 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                  {/* Centered Main Video */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                    <video
                      src={previewClip.clipUrl || previewClip.videoUrl || ''}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                    />
                  </div>
                </div>
              </PhoneFrame>
            </div>

            <div className="text-center mt-3 max-w-full px-2">
              <h3 className="text-sm font-bold text-white truncate">{previewClip.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{previewClip.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Batch Export Modal */}
      <BatchExportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        clips={clips}
        initialSelectedIds={selectedClipIds}
        onComplete={fetchClips}
      />
    </div>
  );
};
