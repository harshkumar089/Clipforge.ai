import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sliders,
  Palette,
  FileArchive,
  Volume2,
  VolumeX,
  Zap,
  Check,
  RefreshCw,
  Film,
  Type,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  Smile,
  Trash2,
  Plus,
  ArrowDown,
  Bell,
  Flame,
  Heart,
  Upload,
  Image as ImageIcon,
  Move,
  Crosshair,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Clip, VideoFilterType, StickerOverlay } from '../../types/index.js';
import { SOCIAL_BADGES } from './BadgeRenderer.js';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: Clip[];
  initialSelectedIds?: string[];
  onComplete?: () => void;
}

const FILTER_PRESETS: { id: VideoFilterType; name: string; gradient: string; css: string }[] = [
  { id: 'normal', name: 'Original', gradient: 'from-zinc-500 to-zinc-700', css: '' },
  { id: 'vibrant', name: 'Vibrant Pop', gradient: 'from-amber-400 to-rose-500', css: 'saturate(1.4) contrast(1.1) brightness(1.05)' },
  { id: 'cinematic', name: 'Cinematic', gradient: 'from-teal-500 to-indigo-700', css: 'contrast(1.2) saturate(0.9) hue-rotate(-10deg)' },
  { id: 'warm', name: 'Warm Sunset', gradient: 'from-amber-500 to-orange-600', css: 'sepia(0.25) saturate(1.25) brightness(1.02)' },
  { id: 'cool', name: 'Cool Nordic', gradient: 'from-cyan-400 to-blue-600', css: 'hue-rotate(15deg) saturate(1.1) brightness(0.98)' },
  { id: 'vintage', name: 'Vintage 90s', gradient: 'from-yellow-600 to-stone-700', css: 'sepia(0.4) contrast(1.1) brightness(0.95)' },
  { id: 'dramatic', name: 'Noir Film', gradient: 'from-purple-900 to-black', css: 'contrast(1.35) brightness(0.9) saturate(1.1)' },
  { id: 'cyberpunk', name: 'Cyberpunk', gradient: 'from-fuchsia-500 to-cyan-500', css: 'contrast(1.3) saturate(1.6) hue-rotate(-20deg)' },
  { id: 'grayscale', name: 'Black & White', gradient: 'from-gray-300 to-gray-800', css: 'grayscale(1) contrast(1.1)' },
];

const VIRAL_EMOJIS = [
  '🔥', '💯', '⚡', '🤯', '🚨', '💥', '🚀', '👀',
  '😱', '💰', '👇', '🎯', '💡', '👑', '⭐', '✨'
];

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  clips,
  initialSelectedIds,
  onComplete,
}) => {
  const { showToast } = useToast();

  // User-controlled selected clip IDs
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);

  // Speed & Quality Preset
  const [speedPreset, setSpeedPreset] = useState<'ultrafast' | 'veryfast' | 'fast'>('ultrafast');

  // Universal Basic Editing States
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '4:5' | '16:9' | 'original'>('9:16');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [filter, setFilter] = useState<VideoFilterType>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);

  // Color Adjustments
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    vignette: 0,
  });

  // Universal Stickers State
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);
  const [stickerTab, setStickerTab] = useState<'import' | 'badges' | 'emojis' | 'custom'>('import');
  const [customStickerText, setCustomStickerText] = useState('');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live 9:16 Preview Player States
  const [previewClipIndex, setPreviewClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Saved Custom Stickers in LocalStorage
  const [savedCustomStickers, setSavedCustomStickers] = useState<
    Array<{ id: string; url: string; name: string }>
  >(() => {
    try {
      const stored = localStorage.getItem('clipforge_custom_stickers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persistCustomSticker = (url: string, name: string) => {
    const updated = [{ id: `custom-${Date.now()}`, url, name }, ...savedCustomStickers.slice(0, 19)];
    setSavedCustomStickers(updated);
    try {
      localStorage.setItem('clipforge_custom_stickers', JSON.stringify(updated));
    } catch {}
  };

  const deleteCustomSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomStickers.filter((s) => s.id !== id);
    setSavedCustomStickers(updated);
    try {
      localStorage.setItem('clipforge_custom_stickers', JSON.stringify(updated));
    } catch {}
    showToast('Removed from imported library.', 'info');
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF, SVG).', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Sticker image must be under 15MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 20);
      const newSticker: StickerOverlay = {
        id: `sticker-img-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'image',
        content: dataUrl,
        label: cleanName,
        x: 50,
        y: 50,
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
      };

      setStickers((prev) => [...prev, newSticker]);
      setSelectedStickerId(newSticker.id);
      persistCustomSticker(dataUrl, cleanName);
      showToast(`Imported "${cleanName}" sticker! Placed on 9:16 preview.`, 'success');
    };

    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };

    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addSavedImageSticker = (item: { url: string; name: string }) => {
    const newSticker: StickerOverlay = {
      id: `sticker-img-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'image',
      content: item.url,
      label: item.name,
      x: 50,
      y: 50,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    showToast(`Added "${item.name}" sticker to all clips!`, 'success');
  };

  // Watermark
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('@clipforge');
  const [watermarkPosition, setWatermarkPosition] = useState<
    'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  >('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(80);

  // Transitions & Speed
  const [transitionType, setTransitionType] = useState<'none' | 'fade' | 'zoom_in' | 'white_flash'>('none');
  const [speed, setSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(100);

  // Accordion Toggles
  const [showStickersAccordion, setShowStickersAccordion] = useState(true);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showMotion, setShowMotion] = useState(false);

  // Batch Job State
  const [status, setStatus] = useState<'idle' | 'rendering' | 'completed' | 'failed'>('idle');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [clipStatuses, setClipStatuses] = useState<
    Array<{
      clipId: string;
      title: string;
      duration?: number;
      status: 'queued' | 'processing' | 'completed' | 'failed';
      progress: number;
      result?: { outputUrl: string; downloadUrl: string; fileName: string };
      error?: string;
    }>
  >([]);

  // Initialize selected clips when modal opens
  useEffect(() => {
    if (isOpen && clips.length > 0) {
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        const validIds = initialSelectedIds.filter((id) => clips.some((c) => c.id === id));
        setSelectedClipIds(validIds.length > 0 ? validIds : [clips[0].id]);
      } else {
        setSelectedClipIds([clips[0].id]);
      }
      setPreviewClipIndex(0);
      setStatus('idle');
      setOverallProgress(0);
      setStatusMessage('');
      setBatchId(null);
    }
  }, [isOpen, clips, initialSelectedIds]);

  // Selected clips collection
  const selectedClips = useMemo(() => {
    return clips.filter((c) => selectedClipIds.includes(c.id));
  }, [clips, selectedClipIds]);

  const totalDuration = useMemo(() => {
    return selectedClips.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  }, [selectedClips]);

  // Active clip for the 9:16 live preview
  const activePreviewClip = useMemo(() => {
    if (selectedClips.length === 0) return clips[0] || null;
    const safeIdx = Math.min(previewClipIndex, selectedClips.length - 1);
    return selectedClips[safeIdx] || selectedClips[0] || clips[0] || null;
  }, [selectedClips, previewClipIndex, clips]);

  const activeVideoUrl = activePreviewClip?.clipUrl || activePreviewClip?.videoUrl || '';

  // Dynamic live CSS filter computation
  const liveFilterCss = useMemo(() => {
    const preset = FILTER_PRESETS.find((f) => f.id === filter);
    const baseCss = preset?.css || '';

    const adj: string[] = [];
    if (adjustments.brightness !== 0) adj.push(`brightness(${1 + adjustments.brightness / 100})`);
    if (adjustments.contrast !== 0) adj.push(`contrast(${1 + adjustments.contrast / 100})`);
    if (adjustments.saturation !== 0) adj.push(`saturate(${1 + adjustments.saturation / 100})`);
    if (adjustments.warmth > 0) adj.push(`sepia(${adjustments.warmth / 140})`);

    return `${baseCss} ${adj.join(' ')}`.trim();
  }, [filter, adjustments]);

  // Sync foreground and background videos when active video URL changes
  useEffect(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = 0;
      if (isPlaying) previewVideoRef.current.play().catch(() => {});
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.currentTime = 0;
      if (isPlaying) bgVideoRef.current.play().catch(() => {});
    }
  }, [activeVideoUrl]);

  // Video play/pause toggle for both foreground and background videos
  const togglePlayPause = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play().catch(() => {});
      bgVideoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    } else {
      previewVideoRef.current.pause();
      bgVideoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  // Sync background video time with main video
  const handlePreviewTimeUpdate = () => {
    if (previewVideoRef.current && bgVideoRef.current) {
      if (Math.abs(previewVideoRef.current.currentTime - bgVideoRef.current.currentTime) > 0.25) {
        bgVideoRef.current.currentTime = previewVideoRef.current.currentTime;
      }
    }
  };

  const toggleMute = () => {
    if (!previewVideoRef.current) return;
    previewVideoRef.current.muted = !previewVideoRef.current.muted;
    setIsMuted(previewVideoRef.current.muted);
  };

  const nextPreviewClip = () => {
    if (selectedClips.length <= 1) return;
    setPreviewClipIndex((prev) => (prev + 1) % selectedClips.length);
  };

  const prevPreviewClip = () => {
    if (selectedClips.length <= 1) return;
    setPreviewClipIndex((prev) => (prev - 1 + selectedClips.length) % selectedClips.length);
  };

  if (!isOpen) return null;

  const toggleClipSelection = (clipId: string) => {
    setSelectedClipIds((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClipIds(clips.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedClipIds([]);
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      vignette: 0,
    });
  };

  // Sticker Handlers
  const addBadgeSticker = (badge: { key: string; label: string }) => {
    const newSticker: StickerOverlay = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'badge',
      content: badge.key,
      label: badge.label,
      x: 50,
      y: 82,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    showToast(`Added [${badge.label}] badge! Drag anywhere on the 9:16 screen.`, 'success');
  };

  const addEmojiSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'emoji',
      content: emoji,
      label: emoji,
      x: 50,
      y: 22,
      scale: 1.2,
      rotation: 0,
      opacity: 1.0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    showToast(`Added ${emoji} sticker! Drag anywhere on the 9:16 screen.`, 'success');
  };

  const addCustomSticker = () => {
    if (!customStickerText.trim()) return;
    const newSticker: StickerOverlay = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'badge',
      content: 'custom',
      label: customStickerText.trim().toUpperCase(),
      x: 50,
      y: 50,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setCustomStickerText('');
    showToast(`Added custom sticker! Drag anywhere on screen.`, 'success');
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) {
      setSelectedStickerId(null);
    }
  };

  const updateStickerPosition = (id: string, x: number, y: number) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const updateStickerScale = (id: string, scale: number) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, scale } : s)));
  };

  const currentSelectedSticker =
    stickers.find((s) => s.id === selectedStickerId) || stickers[0];

  // Dragging sticker anywhere on the 9:16 screen
  const handlePreviewCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewCanvasRef.current || stickers.length === 0) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const rawX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const rawY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const clampedX = Math.max(5, Math.min(95, rawX));
    const clampedY = Math.max(5, Math.min(95, rawY));

    const activeId = selectedStickerId || stickers[0]?.id;
    if (activeId) {
      updateStickerPosition(activeId, clampedX, clampedY);
    }
  };

  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    st: StickerOverlay
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStickerId(st.id);
    setDraggingStickerId(st.id);

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    const calculateAndApply = (clientX: number, clientY: number) => {
      if (!previewCanvasRef.current) return;
      const rect = previewCanvasRef.current.getBoundingClientRect();
      const rawX = Math.round(((clientX - rect.left) / rect.width) * 100);
      const rawY = Math.round(((clientY - rect.top) / rect.height) * 100);
      const clampedX = Math.max(5, Math.min(95, rawX));
      const clampedY = Math.max(5, Math.min(95, rawY));
      updateStickerPosition(st.id, clampedX, clampedY);
    };

    calculateAndApply(e.clientX, e.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => {
      calculateAndApply(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      try {
        target.releasePointerCapture(upEvent.pointerId);
      } catch {}
      setDraggingStickerId(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // ROBUST ZIP DOWNLOAD (Blob + Direct link to bypass popup blockers)
  const triggerDirectDownloadZip = async (currentBatchId: string) => {
    try {
      setIsDownloadingZip(true);
      showToast('Packaging and downloading ZIP file to your device...', 'info');
      const zipUrl = `/api/export/batch/${currentBatchId}/zip`;
      const token = localStorage.getItem('token') || localStorage.getItem('clipforge_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(zipUrl, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `ZIP download failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded ZIP archive is empty.');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `clipforge-batch-${currentBatchId.slice(0, 8)}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);

      showToast('ZIP file downloaded successfully to your device!', 'success');
    } catch (err: any) {
      console.error('Direct ZIP download error:', err);
      showToast(err.message || 'ZIP download failed. Opening direct link...', 'error');
      // Direct link fallback
      const link = document.createElement('a');
      link.href = `/api/export/batch/${currentBatchId}/zip`;
      link.setAttribute('download', `clipforge-batch-${currentBatchId.slice(0, 8)}.zip`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // ROBUST SINGLE CLIP MP4 DOWNLOAD
  const triggerDirectDownloadFile = async (url: string, fileName?: string) => {
    try {
      const cleanFileName = fileName || 'clip.mp4';
      showToast(`Downloading ${cleanFileName}...`, 'info');
      const token = localStorage.getItem('token') || localStorage.getItem('clipforge_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', cleanFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
      showToast(`Downloaded ${cleanFileName}!`, 'success');
    } catch (err) {
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'clip.mp4');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStartBatchExport = async () => {
    if (selectedClipIds.length === 0) {
      showToast('Please select at least 1 clip to export.', 'info');
      return;
    }

    try {
      setStatus('rendering');
      setOverallProgress(5);
      setStatusMessage(`Initiating accelerated export for ${selectedClipIds.length} clip(s)...`);

      // Initialize clip tracking list
      const initialStatuses = selectedClips.map((c) => ({
        clipId: c.id,
        title: c.title,
        duration: c.duration,
        status: 'queued' as const,
        progress: 0,
      }));
      setClipStatuses(initialStatuses);

      // Build common universal editing options with fast preset and stickers
      const commonEdits: any = {
        aspectRatio,
        resolution,
        filter,
        filterIntensity,
        adjustments,
        stickers,
        speed,
        volume,
        preset: speedPreset,
      };

      if (enableWatermark && watermarkText.trim()) {
        commonEdits.watermark = {
          text: watermarkText.trim(),
          position: watermarkPosition,
          opacity: watermarkOpacity / 100,
          scale: 1.0,
          color: '#ffffff',
        };
      }

      if (transitionType !== 'none') {
        commonEdits.transition = {
          type: transitionType,
          duration: 0.5,
        };
      }

      const res = await api.batchExport(selectedClipIds, commonEdits);

      if (!res.success || !res.batchId) {
        throw new Error(res.message || 'Failed to start batch export.');
      }

      const createdBatchId = res.batchId;
      setBatchId(createdBatchId);

      // Polling batch job status
      const pollTimer = setInterval(async () => {
        try {
          const pollRes = await api.getBatchExportStatus(createdBatchId);
          if (pollRes.progress !== undefined) {
            setOverallProgress(pollRes.progress);
          }
          if (pollRes.message) {
            setStatusMessage(pollRes.message);
          }
          if (pollRes.clips && Array.isArray(pollRes.clips)) {
            setClipStatuses(pollRes.clips);
          }

          if (pollRes.status === 'completed') {
            clearInterval(pollTimer);
            setStatus('completed');
            setOverallProgress(100);
            setStatusMessage('Export completed! Direct download started to your device.');
            showToast('Export ready! Downloading directly to your device...', 'success');
            if (onComplete) onComplete();

            // Direct download trigger
            setTimeout(() => {
              if (selectedClipIds.length === 1) {
                const completedItem =
                  pollRes.clips?.find((c: any) => c.status === 'completed') || pollRes.clips?.[0];
                const dlUrl = completedItem?.result?.downloadUrl || completedItem?.result?.outputUrl;
                if (dlUrl) {
                  triggerDirectDownloadFile(dlUrl, completedItem?.result?.fileName || `${completedItem.title}.mp4`);
                } else {
                  triggerDirectDownloadZip(createdBatchId);
                }
              } else {
                triggerDirectDownloadZip(createdBatchId);
              }
            }, 400);
          } else if (pollRes.status === 'failed') {
            clearInterval(pollTimer);
            setStatus('failed');
            setStatusMessage(pollRes.error || pollRes.message || 'Export failed.');
            showToast('Export failed.', 'error');
          }
        } catch (pollErr: any) {
          // Continue polling
        }
      }, 1000);
    } catch (err: any) {
      setStatus('failed');
      setStatusMessage(err.message || 'Failed to initiate export.');
      showToast(err.message || 'Failed to initiate export.', 'error');
    }
  };

  const handleDownloadZip = () => {
    if (!batchId) return;
    triggerDirectDownloadZip(batchId);
  };

  const handleDownloadSingleClip = (clipItem: any) => {
    const downloadUrl = clipItem.result?.downloadUrl || clipItem.result?.outputUrl;
    if (!downloadUrl) return;
    triggerDirectDownloadFile(downloadUrl, clipItem.result?.fileName || `${clipItem.title}.mp4`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white dark:bg-[#110924] border border-purple-100 dark:border-purple-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Export All Clips & Universal 9:16 Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  {selectedClipIds.length} of {clips.length} clip(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-purple-300/70">
                Live 9:16 vertical video preview • Universal stickers & filters • Direct ZIP download to device
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={status === 'rendering'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-purple-300/60 dark:hover:text-white hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {status === 'rendering' || status === 'completed' || status === 'failed' ? (
            /* Progress & Results View */
            <div className="space-y-6 py-2">
              {/* Overall Progress Banner */}
              <div className="p-6 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status === 'rendering' ? (
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    ) : status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    )}
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {status === 'rendering'
                          ? `Fast Multi-Core Rendering in Progress (${overallProgress}%)`
                          : status === 'completed'
                          ? '🎉 Export Finished & Direct Download Started!'
                          : 'Export Error'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-0.5">
                        {statusMessage || 'Processing clips with hardware acceleration...'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400">
                    {overallProgress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3.5 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 rounded-full transition-all duration-300 relative"
                    style={{ width: `${overallProgress}%` }}
                  >
                    {status === 'rendering' && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                  </div>
                </div>

                {status === 'completed' && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleDownloadZip}
                      disabled={isDownloadingZip}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isDownloadingZip ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{isDownloadingZip ? 'Packaging ZIP...' : 'Download ZIP Bundle'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setStatus('idle');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-xs hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                    >
                      Re-export with Adjustments
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-purple-900/50 text-slate-700 dark:text-purple-200 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-purple-800/60 transition-colors cursor-pointer"
                    >
                      Done (View in Library)
                    </button>
                  </div>
                )}
              </div>

              {/* Per-Clip Status Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-purple-300/60">
                    Exported Clips ({clipStatuses.filter((c) => c.status === 'completed').length}/{clipStatuses.length} Ready)
                  </h5>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Saved to your library & ready for direct download
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {clipStatuses.map((item, idx) => (
                    <div
                      key={item.clipId || idx}
                      className="p-3 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-white dark:bg-[#160d30] flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : item.status === 'processing' ? (
                            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                          ) : item.status === 'failed' ? (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Film className="w-4 h-4 text-slate-400 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-purple-300/60 capitalize">
                            {item.status === 'processing'
                              ? `Rendering (${item.progress || 0}%)...`
                              : item.status}
                          </p>
                        </div>
                      </div>

                      {item.status === 'completed' && item.result && (
                        <button
                          onClick={() => handleDownloadSingleClip(item)}
                          title="Download individual clip MP4 again"
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>MP4</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CONFIGURE STUDIO VIEW: Responsive 2-Column Split (Controls Left, 9:16 Live Preview Right) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Controls & Settings (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. CLIPS SELECTION STRIP */}
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        Select Clips to Batch Export
                      </span>
                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                        {selectedClipIds.length}/{clips.length} selected ({totalDuration.toFixed(1)}s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-purple-900">•</span>
                      <button
                        onClick={handleDeselectAll}
                        className="text-xs font-semibold text-slate-500 dark:text-purple-400/70 hover:underline cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Strip of Clips */}
                  <div className="flex gap-2.5 overflow-x-auto pb-1 max-h-36">
                    {clips.map((c) => {
                      const isSelected = selectedClipIds.includes(c.id);
                      const isCurrentlyPreviewed = activePreviewClip?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleClipSelection(c.id)}
                          className={`flex-shrink-0 w-48 p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shadow-sm ${
                            isSelected
                              ? 'border-purple-600 bg-purple-100/60 dark:bg-purple-900/40 shadow-purple-500/10'
                              : 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-[#160d30] opacity-60 hover:opacity-100'
                          } ${isCurrentlyPreviewed ? 'ring-2 ring-purple-400' : ''}`}
                        >
                          <div className="relative w-11 h-14 rounded-lg bg-black overflow-hidden shrink-0 border border-purple-200/50 dark:border-purple-800/50">
                            {c.thumbnailUrl ? (
                              <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-400">
                                <Film className="w-4 h-4" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {c.title}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-purple-300/60 mt-0.5">
                              {c.duration.toFixed(1)}s • {c.aspectRatio}
                            </p>
                            {isCurrentlyPreviewed && (
                              <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase">
                                Previewing
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. EXPORT SPEED PRESET */}
                <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Hardware Export Preset
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      ⚡ Direct Device Download Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {[
                      {
                        id: 'ultrafast',
                        title: '⚡ Ultra Fast',
                        desc: '5x Faster • Best for quick export',
                      },
                      {
                        id: 'veryfast',
                        title: '🚀 High Speed',
                        desc: '3x Faster • Balanced crispness',
                      },
                      {
                        id: 'fast',
                        title: '💎 Standard Quality',
                        desc: 'Standard speed • Full depth',
                      },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSpeedPreset(p.id as any)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          speedPreset === p.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-[#160d30] border-emerald-200/60 dark:border-emerald-900/50 text-slate-700 dark:text-emerald-200 hover:border-emerald-400'
                        }`}
                      >
                        <p className="text-xs font-bold">{p.title}</p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            speedPreset === p.id ? 'text-emerald-100' : 'text-slate-500 dark:text-emerald-300/60'
                          }`}
                        >
                          {p.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. UNIVERSAL ASPECT RATIO & RESOLUTION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aspect Ratio */}
                  <div className="p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-purple-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                        Universal Aspect Ratio
                      </label>
                      {aspectRatio === '9:16' && (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                          ★ Recommended for Shorts
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                      {(['9:16', '1:1', '4:5', '16:9'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            aspectRatio === ratio
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-400'
                              : 'bg-white dark:bg-[#1a0f37] border border-purple-100 dark:border-purple-900/40 text-slate-700 dark:text-purple-300 hover:border-purple-400'
                          }`}
                        >
                          <span>{ratio}</span>
                          <span className="text-[9px] opacity-75">
                            {ratio === '9:16'
                              ? 'Shorts/Reels'
                              : ratio === '1:1'
                              ? 'Square'
                              : ratio === '4:5'
                              ? 'Portrait'
                              : 'Landscape'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className="p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-purple-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      Output Resolution
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {[
                        { id: '1080p', label: '1080p', badge: 'Recommended' },
                        { id: '720p', label: '720p', badge: 'Fastest' },
                        { id: '4k', label: '4K', badge: 'Ultra HD' },
                      ].map((res) => (
                        <button
                          key={res.id}
                          onClick={() => setResolution(res.id as any)}
                          className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            resolution === res.id
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-white dark:bg-[#1a0f37] border border-purple-100 dark:border-purple-900/40 text-slate-700 dark:text-purple-300 hover:border-purple-400'
                          }`}
                        >
                          <span>{res.label}</span>
                          <span className="text-[9px] opacity-75">{res.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. UNIVERSAL STICKERS & BADGES STUDIO */}
                <div className="rounded-2xl border border-purple-200/90 dark:border-purple-800/80 bg-purple-50/30 dark:bg-purple-950/30 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowStickersAccordion(!showStickersAccordion)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-purple-50/60 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smile className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Universal Stickers & Overlay Library
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                          {stickers.length} Active on Screen
                        </span>
                      </div>
                    </div>
                    {showStickersAccordion ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showStickersAccordion && (
                    <div className="p-4 pt-1 border-t border-purple-100 dark:border-purple-900/40 space-y-4">
                      {/* Sub-tabs: Import vs Badges vs Emojis vs Custom */}
                      <div className="flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/40 pb-2 overflow-x-auto">
                        <button
                          onClick={() => setStickerTab('import')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            stickerTab === 'import'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Import Sticker Image</span>
                        </button>
                        <button
                          onClick={() => setStickerTab('badges')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            stickerTab === 'badges'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          Social Badges
                        </button>
                        <button
                          onClick={() => setStickerTab('emojis')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            stickerTab === 'emojis'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          Viral Emojis
                        </button>
                        <button
                          onClick={() => setStickerTab('custom')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            stickerTab === 'custom'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          Custom Text Label
                        </button>
                      </div>

                      {/* Tab 0: Import Custom Sticker */}
                      {stickerTab === 'import' && (
                        <div className="space-y-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 hover:border-purple-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-800 dark:text-white">
                                Click to Upload Custom Sticker / Logo / PNG Overlay
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-purple-300/60 mt-0.5">
                                Transparent PNG, JPG, WebP, SVG, GIF (up to 15MB) • Draggable directly on 9:16 preview
                              </p>
                            </div>
                          </div>

                          {savedCustomStickers.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-purple-300">
                                  Saved Imported Library ({savedCustomStickers.length}):
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-purple-400">
                                  Click to stamp onto all clips
                                </span>
                              </div>

                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto pr-1">
                                {savedCustomStickers.map((s) => (
                                  <div
                                    key={s.id}
                                    onClick={() => addSavedImageSticker(s)}
                                    className="group relative p-2 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-[#180e35] hover:border-purple-400 hover:scale-[1.03] transition-all cursor-pointer flex flex-col items-center gap-1.5 shadow-sm"
                                  >
                                    <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center overflow-hidden border border-purple-100 dark:border-purple-900/40">
                                      <img src={s.url} alt={s.name} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-700 dark:text-purple-200 truncate w-full text-center">
                                      {s.name}
                                    </span>
                                    <button
                                      onClick={(e) => deleteCustomSticker(s.id, e)}
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-opacity cursor-pointer"
                                      title="Delete from saved library"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 1: Badges */}
                      {stickerTab === 'badges' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {SOCIAL_BADGES.slice(0, 8).map((b) => (
                            <button
                              key={b.key}
                              onClick={() => addBadgeSticker(b)}
                              className="p-2.5 rounded-xl border border-purple-200/80 dark:border-purple-800/60 bg-white dark:bg-[#180e35] hover:border-purple-400 dark:hover:border-purple-500 hover:scale-[1.02] transition-all flex items-center justify-between gap-1.5 text-left cursor-pointer shadow-sm"
                            >
                              <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                                {b.label}
                              </span>
                              <span className="text-xs shrink-0">{b.subLabel || '⚡'}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tab 2: Emojis */}
                      {stickerTab === 'emojis' && (
                        <div className="grid grid-cols-8 gap-2">
                          {VIRAL_EMOJIS.map((em, idx) => (
                            <button
                              key={idx}
                              onClick={() => addEmojiSticker(em)}
                              className="w-10 h-10 rounded-xl border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#180e35] hover:border-purple-400 dark:hover:border-purple-500 hover:scale-110 transition-all flex items-center justify-center text-xl cursor-pointer shadow-sm"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tab 3: Custom Text */}
                      {stickerTab === 'custom' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customStickerText}
                            onChange={(e) => setCustomStickerText(e.target.value)}
                            placeholder="e.g. WAIT FOR THE END!, PART 2..."
                            className="flex-1 bg-white dark:bg-[#180e35] border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addCustomSticker();
                            }}
                          />
                          <button
                            onClick={addCustomSticker}
                            disabled={!customStickerText.trim()}
                            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      )}

                      {/* Active Stickers Controls */}
                      {stickers.length > 0 && currentSelectedSticker && (
                        <div className="p-3 bg-white dark:bg-[#160d30] rounded-2xl border border-purple-200 dark:border-purple-800/80 space-y-3">
                          <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-purple-300">
                                Selected:
                              </span>
                              <span className="text-xs font-bold text-purple-700 dark:text-purple-200 truncate">
                                {currentSelectedSticker.label || currentSelectedSticker.content}
                              </span>
                            </div>
                            <button
                              onClick={() => removeSticker(currentSelectedSticker.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>

                          {/* Quick Snap Alignment Buttons */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-purple-300 uppercase">
                              Quick Snap Positions:
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: 'Top Left', x: 20, y: 15 },
                                { label: 'Top Center', x: 50, y: 15 },
                                { label: 'Top Right', x: 80, y: 15 },
                                { label: 'Center Left', x: 20, y: 50 },
                                { label: 'Center', x: 50, y: 50 },
                                { label: 'Center Right', x: 80, y: 50 },
                                { label: 'Bottom Left', x: 20, y: 82 },
                                { label: 'Bottom Center', x: 50, y: 82 },
                                { label: 'Bottom Right', x: 80, y: 82 },
                              ].map((pos) => (
                                <button
                                  key={pos.label}
                                  onClick={() => updateStickerPosition(currentSelectedSticker.id, pos.x, pos.y)}
                                  className={`py-1 px-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer truncate ${
                                    currentSelectedSticker.x === pos.x && currentSelectedSticker.y === pos.y
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                      : 'bg-purple-50/50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/60 text-slate-700 dark:text-purple-300 hover:border-purple-400'
                                  }`}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Scale Slider */}
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500 dark:text-purple-300 font-medium">Sticker Scale:</span>
                              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{currentSelectedSticker.scale}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2.5"
                              step="0.1"
                              value={currentSelectedSticker.scale}
                              onChange={(e) => updateStickerScale(currentSelectedSticker.id, Number(e.target.value))}
                              className="w-full accent-purple-600 h-1 bg-purple-200 dark:bg-purple-800 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. VISUAL FILTER PRESET */}
                <div className="p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-purple-200 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-purple-500" />
                      Universal Visual Filter
                    </label>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                      Applies live to 9:16 preview
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                    {FILTER_PRESETS.map((f) => {
                      const isSelected = filter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`p-1.5 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-purple-600 bg-purple-100 dark:bg-purple-900/50 shadow-sm'
                              : 'hover:bg-purple-100/50 dark:hover:bg-purple-900/20'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${f.gradient} shadow-inner flex items-center justify-center text-white text-[10px] font-bold`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 drop-shadow" />}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-700 dark:text-purple-200 truncate w-full text-center">
                            {f.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. FINE COLOR ADJUSTMENTS ACCORDION */}
                <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20 overflow-hidden">
                  <button
                    onClick={() => setShowAdjustments(!showAdjustments)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        Color Adjustments (Brightness, Contrast, Saturation)
                      </span>
                    </div>
                    {showAdjustments ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showAdjustments && (
                    <div className="p-4 pt-1 border-t border-purple-100 dark:border-purple-900/40 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
                          { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
                          { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                          { key: 'warmth', label: 'Warmth', min: -100, max: 100 },
                        ].map((item) => (
                          <div key={item.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600 dark:text-purple-300">
                                {item.label}
                              </span>
                              <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                                {(adjustments as any)[item.key]}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={item.min}
                              max={item.max}
                              value={(adjustments as any)[item.key]}
                              onChange={(e) =>
                                setAdjustments((prev) => ({
                                  ...prev,
                                  [item.key]: Number(e.target.value),
                                }))
                              }
                              className="w-full accent-purple-600 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={resetAdjustments}
                          className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 text-[11px] font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer"
                        >
                          Reset Adjustments
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. WATERMARK ACCORDION */}
                <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20 overflow-hidden">
                  <button
                    onClick={() => setShowWatermark(!showWatermark)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        Brand Watermark ({enableWatermark ? 'Active' : 'Disabled'})
                      </span>
                    </div>
                    {showWatermark ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showWatermark && (
                    <div className="p-4 pt-1 border-t border-purple-100 dark:border-purple-900/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 dark:text-purple-200">
                          Stamp watermark on exported clips & live preview
                        </span>
                        <button
                          onClick={() => setEnableWatermark(!enableWatermark)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            enableWatermark
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-200 dark:bg-purple-900/60 text-slate-700 dark:text-purple-300'
                          }`}
                        >
                          {enableWatermark ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      {enableWatermark && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-purple-300">
                              Watermark Text
                            </label>
                            <input
                              type="text"
                              value={watermarkText}
                              onChange={(e) => setWatermarkText(e.target.value)}
                              placeholder="@yourbrand"
                              className="w-full bg-white dark:bg-[#160d30] border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-purple-300">
                              Position
                            </label>
                            <select
                              value={watermarkPosition}
                              onChange={(e) => setWatermarkPosition(e.target.value as any)}
                              className="w-full bg-white dark:bg-[#160d30] border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                            >
                              <option value="bottom-right">Bottom Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="top-left">Top Left</option>
                              <option value="center">Center</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 dark:text-purple-300">Opacity</span>
                              <span className="font-mono text-purple-600">{watermarkOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="100"
                              value={watermarkOpacity}
                              onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                              className="w-full accent-purple-600 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 8. TRANSITIONS & PLAYBACK SPEED */}
                <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20 overflow-hidden">
                  <button
                    onClick={() => setShowMotion(!showMotion)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        Universal Transitions & Speed ({speed}x)
                      </span>
                    </div>
                    {showMotion ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showMotion && (
                    <div className="p-4 pt-1 border-t border-purple-100 dark:border-purple-900/40 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-purple-300">
                            Intro/Outro Transition
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { id: 'none', label: 'None' },
                              { id: 'fade', label: 'Fade' },
                              { id: 'zoom_in', label: 'Zoom In' },
                              { id: 'white_flash', label: 'Flash' },
                            ].map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setTransitionType(t.id as any)}
                                className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                                  transitionType === t.id
                                    ? 'bg-purple-600 text-white'
                                    : 'border border-purple-100 dark:border-purple-800 bg-white dark:bg-[#160d30] text-slate-700 dark:text-purple-300'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-purple-300">
                            Playback Speed: {speed}x
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[0.8, 1.0, 1.25, 1.5].map((s) => (
                              <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                                  speed === s
                                    ? 'bg-purple-600 text-white'
                                    : 'border border-purple-100 dark:border-purple-800 bg-white dark:bg-[#160d30] text-slate-700 dark:text-purple-300'
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: DEDICATED 9:16 LIVE SMARTPHONE VIDEO PREVIEW (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-start lg:sticky lg:top-0 space-y-3">
                {/* 9:16 Header Bar & Clip Selector */}
                <div className="w-full flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Live 9:16 Video Preview
                    </span>
                  </div>

                  {selectedClips.length > 1 && (
                    <div className="flex items-center gap-1 bg-purple-100/70 dark:bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/50">
                      <button
                        onClick={prevPreviewClip}
                        className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 cursor-pointer"
                        title="Previous Clip"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 px-1">
                        {previewClipIndex + 1}/{selectedClips.length}
                      </span>
                      <button
                        onClick={nextPreviewClip}
                        className="p-0.5 rounded hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 cursor-pointer"
                        title="Next Clip"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* SMARTPHONE FRAME CONTAINER */}
                <div className="relative rounded-[38px] p-3 bg-slate-900 dark:bg-black border-4 border-slate-700/80 dark:border-purple-800/80 shadow-2xl shadow-purple-950/40 flex flex-col items-center">
                  {/* Phone Dynamic Island / Speaker Pill */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center pointer-events-none shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
                    <div className="w-2 h-2 rounded-full bg-blue-900/60" />
                  </div>

                  {/* Screen Display Viewport (Adapts to 9:16, 1:1, 4:5, 16:9) */}
                  <div
                    ref={previewCanvasRef}
                    onPointerDown={handlePreviewCanvasPointerDown}
                    className={`relative overflow-hidden rounded-[28px] bg-slate-950 shadow-inner select-none touch-none cursor-crosshair group ${
                      aspectRatio === '9:16'
                        ? 'w-[250px] sm:w-[270px] aspect-[9/16]'
                        : aspectRatio === '1:1'
                        ? 'w-[250px] sm:w-[270px] aspect-square'
                        : aspectRatio === '4:5'
                        ? 'w-[250px] sm:w-[270px] aspect-[4/5]'
                        : 'w-[280px] sm:w-[310px] aspect-video'
                    }`}
                  >
                    {/* Clipping-Oriented Video: Centered Sharp Video + Running Blurred Background Video */}
                    {activeVideoUrl ? (
                      <>
                        {/* 1. Ambient Blurred Video Running in Background */}
                        <video
                          ref={bgVideoRef}
                          src={activeVideoUrl}
                          playsInline
                          loop
                          muted
                          autoPlay
                          style={{ filter: `${liveFilterCss} blur(24px)` }}
                          className="absolute inset-0 w-full h-full object-cover scale-125 opacity-60 pointer-events-none select-none"
                        />
                        {/* Dark backdrop tint to ensure centered video pops */}
                        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                        {/* 2. Foreground Main Video Aligned in the Center */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-2 pointer-events-none select-none">
                          <video
                            ref={previewVideoRef}
                            src={activeVideoUrl}
                            playsInline
                            loop
                            muted={isMuted}
                            autoPlay
                            onTimeUpdate={handlePreviewTimeUpdate}
                            onPlay={() => {
                              setIsPlaying(true);
                              bgVideoRef.current?.play().catch(() => {});
                            }}
                            onPause={() => {
                              setIsPlaying(false);
                              bgVideoRef.current?.pause();
                            }}
                            style={{ filter: liveFilterCss }}
                            className="max-h-full max-w-full object-contain rounded-xl shadow-[0_12px_35px_rgba(0,0,0,0.9)] border border-white/10"
                          />
                        </div>
                      </>
                    ) : activePreviewClip?.thumbnailUrl ? (
                      <>
                        {/* Ambient Blurred Background Thumbnail */}
                        <img
                          src={activePreviewClip.thumbnailUrl}
                          alt="Blurred background"
                          style={{ filter: `${liveFilterCss} blur(24px)` }}
                          className="absolute inset-0 w-full h-full object-cover scale-125 opacity-60 pointer-events-none select-none"
                        />
                        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                        {/* Foreground Centered Thumbnail */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-2 pointer-events-none select-none">
                          <img
                            src={activePreviewClip.thumbnailUrl}
                            alt="Preview frame centered"
                            style={{ filter: liveFilterCss }}
                            className="max-h-full max-w-full object-contain rounded-xl shadow-[0_12px_35px_rgba(0,0,0,0.9)] border border-white/10"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-purple-300 p-4 text-center">
                        <Film className="w-10 h-10 mb-2 opacity-50 animate-pulse" />
                        <p className="text-xs font-semibold">9:16 Vertical Video Frame</p>
                      </div>
                    )}

                    {/* Reels / TikTok Vertical Safe Zones Overlay */}
                    {showSafeZones && aspectRatio === '9:16' && (
                      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none">
                        {/* Top Reels header zone */}
                        <div className="pt-4 flex items-center justify-between text-[9px] font-mono text-white/50 tracking-wider">
                          <span>Reels/Shorts Area</span>
                          <span className="bg-black/40 px-1.5 py-0.5 rounded text-[8px]">SAFE</span>
                        </div>

                        {/* Right sidebar UI zone (like buttons, comment) */}
                        <div className="self-end flex flex-col items-center gap-2 opacity-40 pr-0.5">
                          <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                            <Heart className="w-3 h-3 text-white" />
                          </div>
                          <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <div className="w-4 h-4 rounded-full bg-white/30" />
                        </div>

                        {/* Bottom caption safe zone */}
                        <div className="bg-gradient-to-t from-black/70 to-transparent pt-3 pb-0.5 text-[9px] text-white/60 truncate font-sans">
                          🎵 Audio & caption safe zone
                        </div>
                      </div>
                    )}

                    {/* Watermark Overlay Preview */}
                    {enableWatermark && watermarkText && (
                      <div
                        className={`absolute z-20 pointer-events-none font-semibold text-[11px] text-white/90 drop-shadow-md px-2 py-0.5 rounded ${
                          watermarkPosition === 'bottom-right'
                            ? 'bottom-4 right-3'
                            : watermarkPosition === 'bottom-left'
                            ? 'bottom-4 left-3'
                            : watermarkPosition === 'top-right'
                            ? 'top-8 right-3'
                            : watermarkPosition === 'top-left'
                            ? 'top-8 left-3'
                            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                        }`}
                        style={{ opacity: watermarkOpacity / 100 }}
                      >
                        {watermarkText}
                      </div>
                    )}

                    {/* Draggable Active Stickers on the Screen */}
                    {stickers.map((st) => {
                      const isSelected = (selectedStickerId || stickers[0]?.id) === st.id;
                      const isDragging = draggingStickerId === st.id;
                      const scale = st.scale !== undefined ? st.scale : 1.0;

                      return (
                        <div
                          key={st.id}
                          onPointerDown={(e) => handleStickerPointerDown(e, st)}
                          className={`absolute cursor-grab active:cursor-grabbing transition-transform touch-none select-none ${
                            isSelected
                              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black/70 rounded-xl z-30 scale-105'
                              : 'hover:ring-1 hover:ring-white/70 rounded-xl z-25'
                          }`}
                          style={{
                            left: `${st.x}%`,
                            top: `${st.y}%`,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            transformOrigin: 'center center',
                          }}
                        >
                          {/* Live Coordinates Pill while Dragging */}
                          {isDragging && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-purple-400 text-[9px] font-mono text-white whitespace-nowrap shadow-lg flex items-center gap-1 pointer-events-none z-30">
                              <Move className="w-2.5 h-2.5 text-purple-400" />
                              <span>X: {st.x}% · Y: {st.y}%</span>
                            </div>
                          )}

                          {/* Sticker Graphic */}
                          {st.type === 'image' ? (
                            <img
                              src={st.content}
                              alt={st.label || 'Sticker'}
                              className="max-w-[76px] max-h-[76px] w-auto h-auto object-contain pointer-events-none select-none drop-shadow-2xl"
                              draggable={false}
                            />
                          ) : st.type === 'emoji' ? (
                            <span className="text-3xl select-none pointer-events-none drop-shadow-2xl leading-none">
                              {st.content}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[10px] whitespace-nowrap shadow-xl border border-purple-400/50 drop-shadow">
                              {st.label || st.content}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Phone Bottom Controls Bar */}
                  <div className="w-full mt-2.5 flex items-center justify-between px-2 text-slate-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayPause}
                        className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setShowSafeZones(!showSafeZones)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                          showSafeZones ? 'bg-purple-600 text-white' : 'bg-white/10 text-slate-400'
                        }`}
                        title="Toggle Social UI Safe Zones"
                      >
                        <Shield className="w-2.5 h-2.5" />
                        <span>Safe Zones</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-purple-400 font-bold">
                      {aspectRatio} • {resolution}
                    </span>
                  </div>
                </div>

                {/* Subtitle / Tip below phone preview */}
                <div className="text-center px-3">
                  <p className="text-[11px] text-slate-500 dark:text-purple-300/70">
                    💡 Click or drag anywhere on the phone screen to reposition active stickers!
                  </p>
                  {activePreviewClip && (
                    <p className="text-[10px] font-medium text-slate-400 dark:text-purple-400/60 mt-0.5 truncate max-w-[280px]">
                      Current Clip: {activePreviewClip.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/30 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={status === 'rendering'}
            className="px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800 text-slate-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {status === 'completed' ? 'Done' : 'Cancel'}
          </button>

          {status !== 'rendering' && status !== 'completed' && (
            <button
              onClick={handleStartBatchExport}
              disabled={selectedClipIds.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Download className="w-4 h-4" />
              <span>
                {selectedClipIds.length === 0
                  ? 'Select Clips to Export'
                  : selectedClipIds.length === 1
                  ? 'Export & Download 1 Clip ⚡'
                  : `Export & Download ${selectedClipIds.length} Clips (ZIP) ⚡`}
              </span>
            </button>
          )}

          {status === 'completed' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isDownloadingZip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloadingZip ? 'Packaging ZIP...' : 'Download ZIP Bundle'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
