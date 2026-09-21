import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Scissors,
  Sparkles,
  Loader2,
  ArrowRight,
  RefreshCw,
  Download,
  Play,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configuration settings
  const [clipLength, setClipLength] = useState<number>(15);
  const [clipCount, setClipCount] = useState<number>(3);

  // Upload and processing pipeline states
  // 'idle' | 'uploading' | 'analyzing' | 'completed'
  const [pipelineState, setPipelineState] = useState<'idle' | 'uploading' | 'analyzing' | 'completed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState('');
  const [processStage, setProcessStage] = useState('Analyzing your video...');
  const [processProgress, setProcessProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [generatedClips, setGeneratedClips] = useState<any[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.ts', '.flv', '.wmv', '.3gp'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    const isVideoMime = file.type.startsWith('video/');

    if (!hasValidExt && !isVideoMime) {
      setError('Unsupported format. Please upload an MP4, MOV, WebM, AVI, or MKV file.');
      showToast('Unsupported format.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024 * 1024) {
      setError('File exceeds the 5GB upload limit.');
      showToast('File too large (max 5GB).', 'error');
      return;
    }

    // Inspect duration using temporary browser video element with non-blocking fallback
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        // Even if browser metadata is slow or codec is exotic, allow file selection
        setSelectedFile(file);
        setVideoPreviewUrl(objectUrl);
      }
    }, 2000);

    tempVideo.onloadedmetadata = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      const dur = tempVideo.duration;
      setDuration(dur);

      if (dur > 14400) {
        setError('Maximum video duration is 4 hours.');
        showToast('Maximum video duration is 4 hours.', 'error');
        URL.revokeObjectURL(objectUrl);
        setSelectedFile(null);
        setVideoPreviewUrl(null);
        return;
      }

      setSelectedFile(file);
      setVideoPreviewUrl(objectUrl);
    };

    tempVideo.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      // Browser cannot natively preview this codec (e.g. AVI, MKV, ProRes), but backend FFmpeg can process it!
      setSelectedFile(file);
      setVideoPreviewUrl(null);
      setDuration(null);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    try {
      setPipelineState('uploading');
      setUploadProgress(0);
      setUploadStats('');

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''));

      const uploadRes = await api.uploadVideo(formData, (percent, loaded, total) => {
        setUploadProgress(percent);
        setUploadStats(`${formatFileSize(loaded)} of ${formatFileSize(total)}`);
      });
      setUploadProgress(100);
      setUploadStats('Upload complete');

      const videoId = uploadRes.video.id;
      setUploadedVideoId(videoId);

      // Trigger automatic clip generation
      setPipelineState('analyzing');
      setProcessStage('Analyzing your video...');
      setProcessProgress(15);

      const genRes = await api.generateClips(videoId, {
        targetClipDuration: clipLength,
        numberOfClips: clipCount,
      });

      const jobId = genRes.jobId;

      // Poll processing status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.getProcessingStatus(jobId);

          if (statusRes.progress) {
            setProcessProgress(statusRes.progress);
          }
          if (statusRes.message) {
            setProcessStage(statusRes.message);
          }

          if (statusRes.status === 'completed') {
            clearInterval(pollInterval);
            setProcessProgress(100);
            setProcessStage('Your clips are ready!');
            setPipelineState('completed');
            showToast('Clips generated successfully!', 'success');

            // Fetch newly generated clips to show them immediately
            try {
              const clipsRes = await api.getClips({ videoId });
              if (clipsRes.success && clipsRes.clips) {
                setGeneratedClips(clipsRes.clips);
              }
            } catch (fetchErr) {
              console.error('Failed to load generated clips:', fetchErr);
            }
          } else if (statusRes.status === 'failed') {
            clearInterval(pollInterval);
            setError(statusRes.error || 'Video processing failed.');
            setPipelineState('idle');
            showToast('Processing failed. Please try again.', 'error');
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setError(pollErr.message || 'Error checking processing status.');
          setPipelineState('idle');
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
      setPipelineState('idle');
      showToast(err.message || 'Upload failed.', 'error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setDuration(null);
    setError(null);
    setPipelineState('idle');
    setUploadProgress(0);
    setUploadStats('');
    setProcessProgress(0);
    setUploadedVideoId(null);
    setGeneratedClips([]);
  };

  const handleDownloadClip = async (e: React.MouseEvent, clip: any) => {
    e.stopPropagation();
    const rawUrl = clip.videoUrl || clip.clipUrl;
    if (!rawUrl) return;
    const fileName = rawUrl.split('/').pop()?.split('?')[0];
    const downloadUrl = fileName ? `/api/export/download/${fileName}` : rawUrl;

    try {
      showToast('Downloading clip...', 'info');
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
      link.setAttribute('download', `${(clip.title || 'clip').replace(/\s+/g, '-').toLowerCase()}.mp4`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Upload & Clip Video</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-purple-300/70 mt-1">
          Upload any video up to 4 hours (max 5GB). Our AI analyzer identifies dynamic moments and generates 10–30s reels.
        </p>
      </div>

      {/* Main Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#120a26] shadow-xl shadow-purple-500/5 space-y-6">
        {/* State: Idle & Selected */}
        {pipelineState === 'idle' && (
          <>
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-900/40 scale-[1.01]'
                    : 'border-purple-200 dark:border-purple-800/60 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50/25 dark:bg-purple-950/20 hover:bg-purple-50/50 dark:hover:bg-purple-900/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.mov,.webm,.avi,.mkv,.m4v,.ts,.flv,.wmv,.3gp,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Drag and drop your video here, or <span className="text-purple-600 dark:text-purple-400 underline underline-offset-4">browse files</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-purple-300/60 max-w-sm mx-auto">
                  Supports MP4, MOV, WebM, AVI, and MKV up to 4 hours (max 5GB).
                </p>

                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-purple-300/60 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Max 4 hours
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Up to 5GB
                  </span>
                </div>
              </div>
            ) : (
              /* Selected Video File Preview */
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                  <div className="relative w-48 aspect-video rounded-xl overflow-hidden bg-purple-50 dark:bg-purple-950/50 shrink-0 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center">
                    {videoPreviewUrl ? (
                      <video
                        src={videoPreviewUrl}
                        className="w-full h-full object-cover"
                        muted
                        controls={false}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-purple-100/40 text-purple-600 dark:text-purple-300">
                        <FileVideo className="w-8 h-8 mb-1 text-purple-600 dark:text-purple-400" />
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-purple-300/60 uppercase tracking-wider">Video File Ready</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid video file verified
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-purple-300/60 font-mono">
                      <span>Size: {formatFileSize(selectedFile.size)}</span>
                      <span>•</span>
                      <span>Duration: {duration ? formatTime(duration) : 'Checking...'}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white px-3.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors shrink-0 shadow-sm cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>

                {/* Configuration: Clip Length & Number of clips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl bg-purple-50/30 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-purple-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Target Clip Duration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 15, 20, 30].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setClipLength(sec)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            clipLength === sec
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                              : 'bg-white dark:bg-purple-950/40 text-slate-700 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-purple-300/60">Duration of each extracted clip</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-purple-200 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Number of Clips to Generate
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 5, 10].map((count) => (
                        <button
                          key={count}
                          onClick={() => setClipCount(count)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            clipCount === count
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                              : 'bg-white dark:bg-purple-950/40 text-slate-700 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-purple-300/60">Top ranked highlight segments</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleStartProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Start Auto-Clipping Video</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}
          </>
        )}

        {/* State: Uploading */}
        {pipelineState === 'uploading' && (
          <div className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-300 shadow-sm animate-bounce">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Uploading video to server...</h3>
              <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 font-mono">
                {uploadProgress}% completed {uploadStats ? `• ${uploadStats}` : ''}
              </p>
            </div>
            <div className="max-w-md mx-auto bg-purple-100 dark:bg-purple-950/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* State: Analyzing & Processing Steps */}
        {pipelineState === 'analyzing' && (
          <div className="py-12 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-purple-400 dark:text-purple-300 absolute" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{processStage}</h3>
              <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1">
                Evaluating scene shifts, audio density, and speech boundaries
              </p>
            </div>

            {/* Step Sequence Indicators */}
            <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-[11px] font-semibold">
              <div
                className={`p-2 rounded-lg border text-center ${
                  processProgress >= 15
                    ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'border-purple-100 dark:border-purple-900/40 text-slate-400 dark:text-purple-400/50'
                }`}
              >
                1. Analyzing
              </div>
              <div
                className={`p-2 rounded-lg border text-center ${
                  processProgress >= 45
                    ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'border-purple-100 dark:border-purple-900/40 text-slate-400 dark:text-purple-400/50'
                }`}
              >
                2. Peak Moments
              </div>
              <div
                className={`p-2 rounded-lg border text-center ${
                  processProgress >= 70
                    ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'border-purple-100 dark:border-purple-900/40 text-slate-400 dark:text-purple-400/50'
                }`}
              >
                3. Trimming Clips
              </div>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto bg-purple-100 dark:bg-purple-950/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${processProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* State: Completed */}
        {pipelineState === 'completed' && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Your clips are ready!</h3>
              <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1">
                We generated {generatedClips.length || clipCount} social shorts from your video. Preview and customize them in the editor.
              </p>
            </div>

            {/* Generated clips gallery */}
            {generatedClips.length > 0 && (
              <div className="text-left space-y-4 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-purple-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Generated Clips ({generatedClips.length})
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-purple-300/60">Click any clip to edit or export</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedClips.map((clip, index) => {
                    const clipId = clip.id || clip._id;
                    const durationSec = Math.round(clip.duration || (clip.endTime - clip.startTime) || 0);
                    return (
                      <div
                        key={clipId || index}
                        className="group relative bg-white dark:bg-[#120a26] border border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="aspect-[9/16] max-h-52 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                          {clip.thumbnailUrl ? (
                            <img
                              src={clip.thumbnailUrl}
                              alt={clip.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <FileVideo className="w-12 h-12 text-slate-600" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300 backdrop-blur-sm">
                            {durationSec}s
                          </span>
                          {clip.score && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-purple-600 text-[10px] font-semibold text-white backdrop-blur-sm shadow">
                              Score: {Math.round(clip.score)}
                            </span>
                          )}
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                              {clip.title || `Clip #${index + 1}`}
                            </h5>
                            {clip.summary && (
                              <p className="text-xs text-slate-500 dark:text-purple-300/70 line-clamp-2 mt-0.5">
                                {clip.summary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/40">
                            <button
                              onClick={() => navigate(`/editor/${clipId}`)}
                              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                              Edit & Export
                            </button>
                            {(clip.videoUrl || clip.clipUrl) && (
                              <button
                                onClick={(e) => handleDownloadClip(e, clip)}
                                className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 transition-colors"
                                title="Download MP4"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/clips')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Scissors className="w-4 h-4" />
                View All in My Clips
              </button>

              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-purple-50/70 border border-purple-200 text-slate-700 text-xs font-medium shadow-sm transition-all"
              >
                Upload Another Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
