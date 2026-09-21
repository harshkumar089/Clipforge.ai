import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Scissors,
  Smartphone,
  Type,
  Sliders,
  Gauge,
  Volume2,
  ArrowLeft,
  Sparkles,
  Download,
  Loader2,
  Undo2,
  Music,
  Smile,
  Shield,
  Layers,
  Wand2,
  Mic,
  Image,
  X,
  Check,
} from 'lucide-react';
import { api } from '../services/api.js';
import {
  Clip,
  TextOverlay,
  VideoFilterType,
  OverlayMusic,
  ColorAdjustments,
  StickerOverlay,
  VideoTransition,
  VideoEffect,
  SoundEffectItem,
  VoiceEffect,
  WatermarkPip,
  SpeedCurve,
  KeyframePoint,
} from '../types/index.js';
import { VideoPlayer } from '../components/video/VideoPlayer.js';
import { PhoneFrame } from '../components/video/PhoneFrame.js';
import { Timeline } from '../components/video/Timeline.js';
import { TrimTool } from '../components/editor/TrimTool.js';
import { CropTool } from '../components/editor/CropTool.js';
import { TextOverlayTool } from '../components/editor/TextOverlayTool.js';
import { MusicTool } from '../components/editor/MusicTool.js';
import { FilterTool } from '../components/editor/FilterTool.js';
import { AdjustTool } from '../components/editor/AdjustTool.js';
import { StickerTool } from '../components/editor/StickerTool.js';
import { SpeedTool } from '../components/editor/SpeedTool.js';
import { VolumeTool } from '../components/editor/VolumeTool.js';
import { TransitionsTool } from '../components/editor/TransitionsTool.js';
import { EffectsTool } from '../components/editor/EffectsTool.js';
import { SfxTool } from '../components/editor/SfxTool.js';
import { VoiceTool } from '../components/editor/VoiceTool.js';
import { PipTool } from '../components/editor/PipTool.js';
import { ExportModal } from '../components/editor/ExportModal.js';
import { ExtraFeaturesSidebar, ViralPreset } from '../components/editor/ExtraFeaturesSidebar.js';
import { useToast } from '../context/ToastContext.js';
import { ThemeToggle } from '../components/common/ThemeToggle.js';

type ActiveTool =
  | 'trim'
  | 'crop'
  | 'transitions'
  | 'effects'
  | 'text'
  | 'stickers'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'pip'
  | 'filters'
  | 'adjust'
  | 'speed'
  | 'volume';

export const EditorPage: React.FC = () => {
  const { clipId } = useParams<{ clipId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [clip, setClip] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ActiveTool>('trim');

  // Video playback & trim state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(15);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(15);

  // Edit settings
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5' | 'original'>('9:16');
  const [showPhoneFrame, setShowPhoneFrame] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [filter, setFilter] = useState<VideoFilterType>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);
  const [adjustments, setAdjustments] = useState<ColorAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    vignette: 0,
  });
  const [speed, setSpeed] = useState<number>(1.0);
  const [speedCurve, setSpeedCurve] = useState<SpeedCurve>({ mode: 'constant' });
  const [volume, setVolume] = useState<number>(100);
  const [overlayMusic, setOverlayMusic] = useState<OverlayMusic | undefined>(undefined);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // CapCut Pro Suite State
  const [transition, setTransition] = useState<VideoTransition>({
    type: 'none',
    duration: 0.6,
    position: 'start',
  });
  const [effect, setEffect] = useState<VideoEffect>({
    type: 'none',
    intensity: 75,
    speed: 1.0,
  });
  const [soundEffects, setSoundEffects] = useState<SoundEffectItem[]>([]);
  const [voiceEffect, setVoiceEffect] = useState<VoiceEffect>({
    type: 'none',
    intensity: 80,
  });
  const [watermark, setWatermark] = useState<WatermarkPip>({
    enabled: false,
    x: 90,
    y: 10,
    scale: 1.0,
    opacity: 80,
  });
  const [keyframes, setKeyframes] = useState<KeyframePoint[]>([]);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [isExtraFeaturesOpen, setIsExtraFeaturesOpen] = useState(false);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Apply viral preset from ExtraFeaturesSidebar
  const handleApplyPreset = (preset: ViralPreset) => {
    setFilter(preset.filter);
    setFilterIntensity(preset.filterIntensity);
    setAdjustments(preset.adjustments);
    setTransition(preset.transition);
    setEffect(preset.effect);
    setAspectRatio(preset.aspectRatio);
    showToast(`Applied preset: ${preset.name}!`, 'success');
  };

  // Universal Done / Confirm Handler
  const handleConfirmDone = () => {
    showToast(`${activeTool.toUpperCase()} changes confirmed!`, 'success');
    setMobileInspectorOpen(false);
  };

  // Update specific text overlay
  const handleUpdateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Update specific sticker
  const handleUpdateSticker = (id: string, updates: Partial<StickerOverlay>) => {
    setStickers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Add keyframe at playhead
  const handleAddKeyframe = (time: number) => {
    const newKf: KeyframePoint = {
      id: Math.random().toString(36).substring(2, 9),
      time: parseFloat(time.toFixed(2)),
      scale: 1.0,
    };
    setKeyframes((prev) => [...prev, newKf]);
    showToast(`Keyframe placed at ${time.toFixed(1)}s`, 'success');
  };

  // Delete selected item (text overlay or sticker)
  const handleDeleteSelected = () => {
    if (selectedTextId) {
      setTextOverlays((prev) => prev.filter((t) => t.id !== selectedTextId));
      setSelectedTextId(null);
      showToast('Text overlay deleted.', 'info');
    } else if (selectedStickerId) {
      setStickers((prev) => prev.filter((s) => s.id !== selectedStickerId));
      setSelectedStickerId(null);
      showToast('Sticker deleted.', 'info');
    }
  };

  // Reset all edits
  const handleResetEdits = () => {
    setFilter('normal');
    setFilterIntensity(100);
    setAdjustments({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 });
    setSpeed(1.0);
    setSpeedCurve({ mode: 'constant' });
    setVolume(100);
    setOverlayMusic(undefined);
    setTextOverlays([]);
    setStickers([]);
    setTransition({ type: 'none', duration: 0.6, position: 'start' });
    setEffect({ type: 'none', intensity: 75, speed: 1.0 });
    setSoundEffects([]);
    setVoiceEffect({ type: 'none', intensity: 80 });
    setWatermark({ enabled: false, x: 90, y: 10, scale: 1.0, opacity: 80 });
    setKeyframes([]);
    setSelectedTextId(null);
    setSelectedStickerId(null);
    showToast('Edits reset to defaults.', 'info');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        setCurrentTime((prev) => Math.max(0, parseFloat((prev - step).toFixed(1))));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        setCurrentTime((prev) => Math.min(totalDuration, parseFloat((prev + step).toFixed(1))));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setVolume((prev) => (prev === 0 ? 100 : 0));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTextId || selectedStickerId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalDuration, selectedTextId, selectedStickerId]);

  useEffect(() => {
    if (!clipId) return;

    const fetchClipData = async () => {
      try {
        setLoading(true);
        const res = await api.getClipById(clipId);
        if (res.success && res.clip) {
          setClip(res.clip);
          const dur = res.clip.duration || 15;
          setTotalDuration(dur);
          setStartTime(0);
          setEndTime(dur);
          setAspectRatio(res.clip.aspectRatio || '9:16');

          if (res.project?.edits) {
            const ed = res.project.edits;
            if (ed.filter) setFilter(ed.filter);
            if (ed.filterIntensity !== undefined) setFilterIntensity(ed.filterIntensity);
            if (ed.adjustments) setAdjustments(ed.adjustments);
            if (ed.stickers) setStickers(ed.stickers);
            if (ed.speed) setSpeed(ed.speed);
            if (ed.speedCurve) setSpeedCurve(ed.speedCurve);
            if (ed.volume !== undefined) setVolume(ed.volume);
            if (ed.overlayMusic) setOverlayMusic(ed.overlayMusic);
            if (ed.textOverlays) setTextOverlays(ed.textOverlays);
            if (ed.transition) setTransition(ed.transition);
            if (ed.effect) setEffect(ed.effect);
            if (ed.soundEffects) setSoundEffects(ed.soundEffects);
            if (ed.voiceEffect) setVoiceEffect(ed.voiceEffect);
            if (ed.watermark) setWatermark(ed.watermark);
            if (ed.keyframes) setKeyframes(ed.keyframes);
          }
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load clip.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchClipData();
  }, [clipId]);

  // Project Autosave state (debounced 750ms)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Prevent autosaving defaults over saved settings during initial load
    if (loading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!clipId || !clip) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await api.projects.saveProject({
          clipId,
          name: clip.title,
          edits: {
            startTime,
            endTime,
            aspectRatio,
            filter,
            filterIntensity,
            adjustments,
            speed,
            speedCurve,
            volume,
            overlayMusic,
            textOverlays,
            stickers,
            transition,
            effect,
            soundEffects,
            voiceEffect,
            watermark,
            keyframes,
          },
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [
    startTime,
    endTime,
    aspectRatio,
    filter,
    filterIntensity,
    adjustments,
    speed,
    speedCurve,
    volume,
    overlayMusic,
    textOverlays,
    stickers,
    transition,
    effect,
    soundEffects,
    voiceEffect,
    watermark,
    keyframes,
    clipId,
    clip,
    loading,
  ]);

  if (loading) {
    return (
      <div className="h-screen bg-[#faf9fe] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-xs text-purple-800 font-medium">Loading ClipForge CapCut Studio...</span>
        </div>
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Clip not found.</p>
        <button
          onClick={() => navigate('/clips')}
          className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs"
        >
          Back to Clips
        </button>
      </div>
    );
  }

  const toolTabs: Array<{ id: ActiveTool; label: string; icon: any }> = [
    { id: 'trim', label: 'Trim', icon: Scissors },
    { id: 'crop', label: 'Canvas', icon: Smartphone },
    { id: 'transitions', label: 'Transitions', icon: Layers },
    { id: 'effects', label: 'Effects', icon: Wand2 },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'stickers', label: 'Stickers', icon: Smile },
    { id: 'music', label: 'Audio', icon: Music },
    { id: 'sfx', label: 'SFX', icon: Volume2 },
    { id: 'voice', label: 'Voice FX', icon: Mic },
    { id: 'pip', label: 'PIP / Logo', icon: Image },
    { id: 'filters', label: 'Filters', icon: Sparkles },
    { id: 'adjust', label: 'Adjust', icon: Sliders },
    { id: 'speed', label: 'Speed', icon: Gauge },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-[#faf9fe] dark:bg-[#090514] text-slate-900 dark:text-purple-100 flex flex-col select-none overflow-hidden transition-colors duration-300">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-purple-100 dark:border-purple-900/50 bg-white/95 dark:bg-[#0c071d]/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-[0_4px_25px_-3px_rgba(168,85,247,0.14)] transition-colors duration-300">
        {/* Left Side: Back button, Theme Toggle (placed far to the left away from Export), Title & Aspect badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate('/clips')}
            className="p-1.5 rounded-lg text-slate-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors cursor-pointer shrink-0"
            title="Back to Clips"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Animated Theme Switch - Positioned far on the left, completely separated from the Export button */}
          <div className="flex items-center shrink-0">
            <ThemeToggle size="sm" />
          </div>

          <div className="h-4 w-px bg-purple-200/80 dark:bg-purple-800/60 hidden sm:block shrink-0" />

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xs text-slate-400 dark:text-purple-400/60 font-medium hidden sm:inline">Clips</span>
            <span className="text-slate-300 dark:text-purple-900 text-xs hidden sm:inline">/</span>
            <h1 className="text-xs font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 max-w-[85px] sm:max-w-xs md:max-w-md truncate">
              {clip.title}
            </h1>
            <span className="text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 font-medium shadow-[0_0_8px_rgba(168,85,247,0.2)] shrink-0">
              {aspectRatio}
            </span>
          </div>
        </div>

        {/* Center/Right: Autosave Badge and Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Autosave Status Badge */}
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 px-2.5 py-0.5 rounded-full shadow-xs">
                <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full shadow-xs">
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline">Saved ✓</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="hidden sm:inline">Autosave failed</span>
                <span className="sm:hidden">Error</span>
              </span>
            )}
          </div>

          <button
            onClick={handleResetEdits}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/70 text-slate-600 dark:text-purple-200 hover:text-slate-900 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 text-xs font-medium transition-all cursor-pointer"
            title="Reset All Adjustments & Overlays"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Export Button - Positioned isolated at far right */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-500/25 dark:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Clip</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Tool Dock */}
        <aside className="w-14 sm:w-16 md:w-[72px] h-full border-r border-purple-100 dark:border-purple-900/50 bg-white/95 dark:bg-[#0c071d]/90 backdrop-blur-xl flex flex-col items-center py-2 pb-8 space-y-1 shrink-0 z-10 shadow-[4px_0_24px_-4px_rgba(168,85,247,0.12)] overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar touch-scroll transition-colors duration-300">
          {toolTabs.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setMobileInspectorOpen(true);
                }}
                className={`w-11 sm:w-13 h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] border border-purple-200 dark:border-purple-700/60 font-semibold'
                    : 'text-slate-400 dark:text-purple-300/50 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50/70 dark:hover:bg-purple-900/20 border border-transparent'
                }`}
                title={tool.label}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-purple-600 dark:bg-purple-400 rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-purple-600 dark:text-purple-300' : 'text-slate-400 dark:text-purple-300/50 group-hover:text-purple-600 dark:group-hover:text-purple-300'
                  }`}
                />
                <span className="text-[9px] sm:text-[9.5px] tracking-tight">{tool.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Center Stage Video Canvas */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#faf9fe] via-[#f4effc] to-[#ebe3f8] dark:from-[#0c071d] dark:via-[#130b2a] dark:to-[#190f36] relative overflow-hidden transition-colors duration-300">
          {/* Top Canvas Action Bar - Structured & Non-colliding */}
          <div className="h-11 px-3 sm:px-4 flex items-center justify-between border-b border-purple-100/80 dark:border-purple-900/50 bg-white/60 dark:bg-[#0f0924]/80 backdrop-blur-md shrink-0 z-10 shadow-[0_2px_15px_rgba(168,85,247,0.08)] overflow-x-auto no-scrollbar gap-2">
            {/* Quick Aspect Ratio Pills */}
            <div className="flex items-center gap-1 text-[11px] font-mono shrink-0 bg-purple-100/60 dark:bg-purple-950/60 p-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/60">
              {(['9:16', '4:5', '1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-purple-300/70 hover:text-purple-700 dark:hover:text-white hover:bg-purple-100/60 dark:hover:bg-purple-900/40'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Extra Features Sidebar Button + Canvas Toggles + Mobile Inspector */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Extra Features Sidebar Trigger */}
              <button
                onClick={() => setIsExtraFeaturesOpen(true)}
                title="Open AI Magic & Extra Features Sidebar"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-pink-600/15 hover:from-purple-600/25 hover:to-indigo-600/25 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-700/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden xs:inline">Extra Features</span>
                <span className="xs:hidden">Features</span>
              </button>

              {aspectRatio === '9:16' && (
                <button
                  onClick={() => setShowSafeZone((prev) => !prev)}
                  title="Toggle TikTok / Instagram Reels UI Safe Zones"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                    showSafeZone
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Safe Zone</span>
                </button>
              )}

              {aspectRatio === '9:16' && (
                <button
                  onClick={() => setShowPhoneFrame((prev) => !prev)}
                  title="Toggle Mobile Device Frame"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                    showPhoneFrame
                      ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 shadow-2xs'
                      : 'bg-white/80 dark:bg-purple-950/40 text-slate-500 dark:text-purple-300/70 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Phone Frame</span>
                </button>
              )}

              {/* Mobile Inspector Drawer Toggle */}
              <button
                onClick={() => setMobileInspectorOpen(!mobileInspectorOpen)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                title="Toggle Tool Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="capitalize">{activeTool}</span>
              </button>
            </div>
          </div>

          {/* Central Video Viewport */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-200/35 via-purple-100/15 to-transparent" />

            {aspectRatio === '9:16' && showPhoneFrame ? (
              <PhoneFrame active={true}>
                <VideoPlayer
                  src={clip.clipUrl || clip.videoUrl || ''}
                  aspectRatio={aspectRatio}
                  filter={filter}
                  filterIntensity={filterIntensity}
                  adjustments={adjustments}
                  speed={speed}
                  volume={volume}
                  overlayMusic={overlayMusic}
                  textOverlays={textOverlays}
                  onUpdateTextOverlay={handleUpdateTextOverlay}
                  stickers={stickers}
                  onUpdateSticker={handleUpdateSticker}
                  selectedStickerId={selectedStickerId}
                  onSelectSticker={(id) => {
                    setSelectedStickerId(id);
                    if (id) setActiveTool('stickers');
                  }}
                  showSafeZone={showSafeZone}
                  currentTime={currentTime}
                  startTrim={startTime}
                  endTrim={endTime}
                  isPlaying={isPlaying}
                  onPlayChange={setIsPlaying}
                  loop={isLooping}
                  activeTool={activeTool}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={(dur) => {
                    setTotalDuration(dur);
                    if (endTime === 0 || endTime > dur) {
                      setEndTime(dur);
                    }
                  }}
                  transition={transition}
                  effect={effect}
                  soundEffects={soundEffects}
                  watermark={watermark}
                  speedCurve={speedCurve}
                />
              </PhoneFrame>
            ) : (
              <div className="w-full h-full max-w-4xl max-h-[66vh] flex items-center justify-center">
                <VideoPlayer
                  src={clip.clipUrl || clip.videoUrl || ''}
                  aspectRatio={aspectRatio}
                  filter={filter}
                  filterIntensity={filterIntensity}
                  adjustments={adjustments}
                  speed={speed}
                  volume={volume}
                  overlayMusic={overlayMusic}
                  textOverlays={textOverlays}
                  onUpdateTextOverlay={handleUpdateTextOverlay}
                  stickers={stickers}
                  onUpdateSticker={handleUpdateSticker}
                  selectedStickerId={selectedStickerId}
                  onSelectSticker={(id) => {
                    setSelectedStickerId(id);
                    if (id) setActiveTool('stickers');
                  }}
                  showSafeZone={showSafeZone}
                  currentTime={currentTime}
                  startTrim={startTime}
                  endTrim={endTime}
                  isPlaying={isPlaying}
                  onPlayChange={setIsPlaying}
                  loop={isLooping}
                  activeTool={activeTool}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={(dur) => {
                    setTotalDuration(dur);
                    if (endTime === 0 || endTime > dur) {
                      setEndTime(dur);
                    }
                  }}
                  transition={transition}
                  effect={effect}
                  soundEffects={soundEffects}
                  watermark={watermark}
                  speedCurve={speedCurve}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Inspector Drawer Backdrop */}
        {mobileInspectorOpen && (
          <div
            onClick={() => setMobileInspectorOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Right Inspector Panel for Active Tool */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] lg:w-[340px] xl:w-[360px] lg:static lg:inset-auto lg:z-auto lg:h-full border-l border-purple-100 dark:border-purple-900/50 bg-white/95 dark:bg-[#0c071d]/95 backdrop-blur-xl shrink-0 flex flex-col shadow-[-4px_0_24px_-4px_rgba(168,85,247,0.12)] transition-transform duration-300 ease-in-out ${
            mobileInspectorOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Header */}
          <div className="h-14 px-4 sm:px-5 border-b border-purple-100/80 dark:border-purple-900/40 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0f0924]/80 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                <Sliders className="w-3.5 h-3.5" />
              </span>
              {activeTool} Settings
            </span>
            <button
              onClick={() => setMobileInspectorOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
              aria-label="Close inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Tool Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 custom-scrollbar touch-scroll space-y-4">

            {activeTool === 'trim' && (
              <TrimTool
                startTime={startTime}
                endTime={endTime}
                maxDuration={totalDuration}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onReset={() => {
                  setStartTime(0);
                  setEndTime(totalDuration);
                  setCurrentTime(0);
                }}
                onSeek={setCurrentTime}
              />
            )}

            {activeTool === 'crop' && (
              <CropTool
                aspectRatio={aspectRatio}
                onChange={setAspectRatio}
                showPhoneFrame={showPhoneFrame}
                onTogglePhoneFrame={setShowPhoneFrame}
              />
            )}

            {activeTool === 'transitions' && (
              <TransitionsTool
                transition={transition}
                onChange={setTransition}
                onPreviewTransition={(t) => showToast(`Applied ${t} transition`, 'success')}
                onDone={handleConfirmDone}
              />
            )}

            {activeTool === 'effects' && (
              <EffectsTool
                effect={effect}
                onChange={setEffect}
                onDone={handleConfirmDone}
              />
            )}

            {activeTool === 'text' && (
              <TextOverlayTool
                overlays={textOverlays}
                onChange={setTextOverlays}
                clipDuration={totalDuration}
              />
            )}

            {activeTool === 'stickers' && (
              <StickerTool
                stickers={stickers}
                onChange={setStickers}
                selectedStickerId={selectedStickerId}
                onSelectSticker={setSelectedStickerId}
                clipDuration={totalDuration}
                currentTime={currentTime}
              />
            )}

            {activeTool === 'music' && (
              <MusicTool
                overlayMusic={overlayMusic}
                onChange={setOverlayMusic}
                videoVolume={volume}
                onVideoVolumeChange={setVolume}
              />
            )}

            {activeTool === 'sfx' && (
              <SfxTool
                items={soundEffects}
                onChange={setSoundEffects}
                currentTime={currentTime}
              />
            )}

            {activeTool === 'voice' && (
              <VoiceTool
                voiceEffect={voiceEffect}
                onChange={setVoiceEffect}
              />
            )}

            {activeTool === 'pip' && (
              <PipTool
                watermark={watermark}
                onChange={setWatermark}
              />
            )}

            {activeTool === 'filters' && (
              <FilterTool
                filter={filter}
                filterIntensity={filterIntensity}
                onChange={setFilter}
                onIntensityChange={setFilterIntensity}
                onDone={handleConfirmDone}
              />
            )}

            {activeTool === 'adjust' && (
              <AdjustTool
                adjustments={adjustments}
                onChange={setAdjustments}
                onDone={handleConfirmDone}
              />
            )}

            {activeTool === 'speed' && (
              <SpeedTool
                speed={speed}
                onChange={setSpeed}
                speedCurve={speedCurve}
                onSpeedCurveChange={setSpeedCurve}
              />
            )}

            {activeTool === 'volume' && (
              <VolumeTool
                volume={volume}
                onChange={setVolume}
              />
            )}
          </div>

          {/* Universal Bottom Done / Confirm Effect Bar */}
          <div className="shrink-0 p-3.5 sm:p-4 bg-white/95 dark:bg-[#0c071d]/95 border-t border-purple-100 dark:border-purple-900/60 backdrop-blur-md flex items-center gap-2.5 z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.25)]">
            <button
              onClick={handleConfirmDone}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span className="capitalize">Done / Confirm {activeTool}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* CapCut Studio 4-Track Timeline */}
      <Timeline
        duration={totalDuration}
        currentTime={currentTime}
        startTime={startTime}
        endTime={endTime}
        isPlaying={isPlaying}
        onPlayToggle={() => setIsPlaying((prev) => !prev)}
        isLooping={isLooping}
        onLoopToggle={() => setIsLooping((prev) => !prev)}
        speed={speed}
        onSpeedChange={setSpeed}
        volume={volume}
        onVolumeChange={setVolume}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onSeek={setCurrentTime}
        textOverlays={textOverlays}
        onSelectTextOverlay={(id) => {
          setSelectedTextId(id);
          setActiveTool('text');
        }}
        onUpdateTextOverlay={handleUpdateTextOverlay}
        selectedTextId={selectedTextId}
        overlayMusic={overlayMusic}
        onOverlayMusicChange={setOverlayMusic}
        transition={transition}
        effect={effect}
        onEffectChange={setEffect}
        soundEffects={soundEffects}
        onSoundEffectsChange={setSoundEffects}
        keyframes={keyframes}
        onAddKeyframe={handleAddKeyframe}
        onSplit={(cutTime) => {
          showToast(`Clip split at ${cutTime}s`, 'success');
        }}
        onDeleteSelected={handleDeleteSelected}
        onOpenTool={(tool) => setActiveTool(tool as ActiveTool)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        clipId={clip.id}
        clipTitle={clip.title}
        currentSettings={{
          startTime,
          endTime,
          aspectRatio,
          filter,
          filterIntensity,
          adjustments,
          stickers,
          transition,
          effect,
          soundEffects,
          voiceEffect,
          watermark,
          speedCurve,
          speed,
          volume,
          overlayMusic,
          textOverlays,
        }}
      />

      {/* Extra Features & AI Magic Sidebar */}
      <ExtraFeaturesSidebar
        isOpen={isExtraFeaturesOpen}
        onClose={() => setIsExtraFeaturesOpen(false)}
        onApplyPreset={handleApplyPreset}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        showSafeZone={showSafeZone}
        onToggleSafeZone={() => setShowSafeZone((prev) => !prev)}
        showPhoneFrame={showPhoneFrame}
        onTogglePhoneFrame={() => setShowPhoneFrame((prev) => !prev)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />
    </div>
  );
};
