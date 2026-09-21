import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  Scissors,
  HardDrive,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  Trash2,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { api } from '../services/api.js';
import { Video, Clip } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, cRes, pRes] = await Promise.all([
        api.getVideos(),
        api.getClips(),
        api.projects.getProjects().catch(() => ({ success: false, projects: [] })),
      ]);
      if (vRes.success) setVideos(vRes.videos);
      if (cRes.success) setClips(cRes.clips);
      if (pRes.success) setProjects(pRes.projects);
    } catch (err: any) {
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStorageBytes = videos.reduce((acc, v) => acc + (v.fileSize || 0), 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);
  const processingCount = videos.filter((v) => v.status === 'analyzing').length;

  const handleDeleteVideo = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this video and all its generated clips?')) {
      return;
    }
    try {
      await api.deleteVideo(id);
      showToast('Video deleted.', 'info');
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setClips((prev) => prev.filter((c) => c.videoId !== id));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete video.', 'error');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-purple-100/90 via-violet-50/70 to-white dark:from-[#1c0e3a] dark:via-[#130b28] dark:to-[#0d071e] border border-purple-200/80 dark:border-purple-800/60 shadow-[0_0_30px_rgba(168,85,247,0.18)] dark:shadow-[0_0_40px_rgba(168,85,247,0.28)] transition-all">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-200/60 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-purple-300/60 dark:border-purple-700/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
            AI Clip Studio Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
            Ready to generate your next viral reel?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-purple-200/70 leading-relaxed transition-colors">
            Upload long-form podcasts, webinars, and recordings. ClipForge automatically surfaces high-activity moments and extracts vertical 9:16 clips with customizable text overlays and effects.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload New Video
            </button>
            <button
              onClick={() => navigate('/clips')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-purple-950/40 hover:bg-purple-50/70 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-slate-700 dark:text-purple-200 text-xs font-medium shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all cursor-pointer"
            >
              Browse Clips ({clips.length})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Videos Uploaded"
          value={videos.length}
          subtitle="Long-form media files"
          icon={Film}
        />
        <StatCard
          title="Clips Created"
          value={clips.length}
          subtitle="10–30s social shorts"
          icon={Scissors}
        />
        <StatCard
          title="In Processing"
          value={processingCount}
          subtitle="Active render & analysis"
          icon={Activity}
          trend={processingCount > 0 ? 'Active jobs' : 'All clear'}
        />
        <StatCard
          title="Storage Used"
          value={`${totalStorageMB} MB`}
          subtitle="Local disk media assets"
          icon={HardDrive}
        />
      </div>

      {/* Recent Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Recent Videos</h3>
            <p className="text-xs text-slate-500 dark:text-purple-300/60 transition-colors">Manage uploaded source media and generate short clips</p>
          </div>
          <button
            onClick={() => navigate('/videos')}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            View all videos
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-purple-200 dark:border-purple-800/60 bg-white/70 dark:bg-[#120a26]/60 text-center space-y-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 mx-auto shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No videos uploaded yet</h4>
              <p className="text-xs text-slate-500 dark:text-purple-300/60 mt-1 max-w-sm mx-auto">
                Drop an MP4, MOV, or WebM video up to 5 minutes to start generating automatic short clips.
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.slice(0, 6).map((video) => (
              <div
                key={video.id}
                onClick={() => navigate(`/videos`)}
                className="glass-card rounded-2xl border border-purple-100/90 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/90 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-[0_0_30px_rgba(168,85,247,0.28)] transition-all overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video w-full bg-purple-50 dark:bg-purple-950/40 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-300 dark:text-purple-600">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-semibold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {formatDuration(video.duration)}
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          video.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : video.status === 'analyzing'
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                            : 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                        }`}
                      >
                        {video.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-purple-300/60 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-purple-400/60" />
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-medium">
                        <Scissors className="w-3 h-3" />
                        {video.clipCount} {video.clipCount === 1 ? 'clip' : 'clips'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-4 py-3 bg-purple-50/40 dark:bg-purple-950/30 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Inspect Clips
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <button
                    onClick={(e) => handleDeleteVideo(e, video.id)}
                    title="Delete video"
                    className="p-1.5 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Projects / Work in Progress */}
      {projects.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                Recent Projects & Autosaves
              </h3>
              <p className="text-xs text-slate-500 dark:text-purple-300/60 transition-colors">
                Pick up right where you left off in the studio editor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.slice(0, 6).map((proj) => {
              const clipObj = proj.clipId;
              const clipTitle = proj.name || clipObj?.title || 'Clip Project';
              const targetClipId = clipObj?._id || proj.clipId;

              return (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/editor/${targetClipId}`)}
                  className="glass-card rounded-2xl border border-purple-100/90 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/90 p-5 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-[0_0_30px_rgba(168,85,247,0.28)] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 font-medium">
                        {proj.edits?.aspectRatio || '9:16'}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-purple-300/50">
                        {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {clipTitle}
                    </h4>

                    <div className="mt-2 text-xs text-slate-500 dark:text-purple-300/70 space-y-1">
                      {proj.edits?.textOverlays?.length > 0 && (
                        <div>• {proj.edits.textOverlays.length} text overlays configured</div>
                      )}
                      {proj.edits?.filter && proj.edits.filter !== 'normal' && (
                        <div>• Filter: {proj.edits.filter}</div>
                      )}
                      {proj.edits?.overlayMusic && (
                        <div>• Background music attached</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-100/80 dark:border-purple-900/40 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-300">
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Continue Editing
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
