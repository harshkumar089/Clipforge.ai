import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  Scissors,
  Calendar,
  Clock,
  Trash2,
  Sparkles,
  Plus,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Video } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';

export const MyVideosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.getVideos();
      if (res.success) {
        setVideos(res.videos);
      }
    } catch (err: any) {
      showToast('Failed to load videos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this video and all associated clips?')) {
      return;
    }
    try {
      await api.deleteVideo(id);
      showToast('Video deleted successfully.', 'info');
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete video.', 'error');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [searchFilter, setSearchFilter] = useState('');

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Uploaded Videos</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-purple-300/70 mt-1">
            Browse source videos and view AI extracted highlight clips.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Search filter input */}
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter videos..."
              className="w-40 sm:w-56 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-purple-100 placeholder-purple-400/70 dark:placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-xs transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/25 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Upload Video
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl border border-dashed border-purple-200 dark:border-purple-800/60 bg-white/70 dark:bg-[#120a26]/70 backdrop-blur-md text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 mx-auto">
            <Film className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchFilter ? 'No matching videos' : 'No videos yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 max-w-sm mx-auto">
              {searchFilter
                ? `No videos matched "${searchFilter}". Try a different keyword.`
                : 'Upload a long-form video to let ClipForge extract viral moments.'}
            </p>
          </div>
          {!searchFilter && (
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="glass-card rounded-2xl border border-purple-100/90 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/90 shadow-sm shadow-purple-500/5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-[0_0_28px_rgba(168,85,247,0.25)] transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-purple-50 dark:bg-purple-950/50 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-300">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-semibold text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    {formatDuration(video.duration)}
                  </div>

                  <div className="absolute top-2 left-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        video.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : video.status === 'analyzing'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                      }`}
                    >
                      {video.status}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{video.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-purple-300/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-purple-400" />
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-500 dark:text-purple-300/70">
                      {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-purple-50/40 dark:bg-purple-950/40 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/clips?videoId=${video.id}`)}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  View Clips ({video.clipCount})
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => handleDelete(e, video.id)}
                  title="Delete Video"
                  className="p-1.5 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
