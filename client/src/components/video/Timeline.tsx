import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Repeat,
  Volume2,
  VolumeX,
  Gauge,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Type,
  Film,
  Music,
  Wand2,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  TextOverlay,
  OverlayMusic,
  VideoTransition,
  VideoEffect,
  SoundEffectItem,
  KeyframePoint,
} from '../../types/index.js';

export interface TimelineProps {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  isLooping: boolean;
  onLoopToggle: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onSeek: (time: number) => void;
  textOverlays?: TextOverlay[];
  onSelectTextOverlay?: (id: string) => void;
  onUpdateTextOverlay?: (id: string, updates: Partial<TextOverlay>) => void;
  selectedTextId?: string | null;
  overlayMusic?: OverlayMusic | null;
  onOverlayMusicChange?: (music: OverlayMusic) => void;
  transition?: VideoTransition;
  effect?: VideoEffect;
  onEffectChange?: (effect: VideoEffect) => void;
  soundEffects?: SoundEffectItem[];
  onSoundEffectsChange?: (sfxs: SoundEffectItem[]) => void;
  keyframes?: KeyframePoint[];
  onAddKeyframe?: (time: number) => void;
  onSplit?: (splitTime: number) => void;
  onDeleteSelected?: () => void;
  onOpenTool?: (tool: string) => void;
}

type DragTarget =
  | { type: 'scrub' }
  | { type: 'video_start' }
  | { type: 'video_end' }
  | { type: 'video_slip'; initialStartTime: number; initialEndTime: number; initialClickTime: number }
  | { type: 'audio_start'; initialEnd: number }
  | { type: 'audio_end'; initialStart: number }
  | { type: 'audio_slip'; initialStart: number; initialEnd: number; initialClickTime: number }
  | { type: 'fx_start'; initialEnd: number }
  | { type: 'fx_end'; initialStart: number }
  | { type: 'fx_slip'; initialStart: number; initialEnd: number; initialClickTime: number }
  | { type: 'text_start'; textId: string; initialEnd: number }
  | { type: 'text_end'; textId: string; initialStart: number }
  | { type: 'text_slip'; textId: string; initialStart: number; initialEnd: number; initialClickTime: number }
  | { type: 'sfx_drag'; sfxId: string };

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  onPlayToggle,
  isLooping,
  onLoopToggle,
  speed,
  onSpeedChange,
  volume,
  onVolumeChange,
  onStartTimeChange,
  onEndTimeChange,
  onSeek,
  textOverlays = [],
  onSelectTextOverlay,
  onUpdateTextOverlay,
  selectedTextId,
  overlayMusic,
  onOverlayMusicChange,
  transition,
  effect,
  onEffectChange,
  soundEffects = [],
  onSoundEffectsChange,
  keyframes = [],
  onAddKeyframe,
  onSplit,
  onDeleteSelected,
  onOpenTool,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tracksAreaRef = useRef<HTMLDivElement>(null);

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [magneticSnap, setMagneticSnap] = useState(true);
  const [splitCutPoints, setSplitCutPoints] = useState<number[]>([]);
  const [activeDrag, setActiveDrag] = useState<DragTarget | null>(null);

  const totalDuration = Math.max(0.1, duration);
  const clipDuration = Math.max(0, endTime - startTime);

  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Keep latest mutable props in ref to avoid stale closures in event listeners
  const propsRef = useRef({
    startTime,
    endTime,
    totalDuration,
    overlayMusic,
    effect,
    soundEffects,
    textOverlays,
  });
  useEffect(() => {
    propsRef.current = {
      startTime,
      endTime,
      totalDuration,
      overlayMusic,
      effect,
      soundEffects,
      textOverlays,
    };
  });

  // Convert client coordinate into time taking scroll and zoom into account
  const getTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!tracksAreaRef.current) return 0;
      const rect = tracksAreaRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      let time = ratio * totalDuration;

      if (magneticSnap) {
        const snapThreshold = 0.35 * (1 / zoomLevel);
        if (Math.abs(time - startTime) < snapThreshold) time = startTime;
        else if (Math.abs(time - endTime) < snapThreshold) time = endTime;
        else {
          for (const pt of splitCutPoints) {
            if (Math.abs(time - pt) < snapThreshold) {
              time = pt;
              break;
            }
          }
        }
      }

      return time;
    },
    [totalDuration, magneticSnap, startTime, endTime, splitCutPoints, zoomLevel]
  );

  // Unified Mouse & Touch Drag Initiator
  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    dragTarget: DragTarget
  ) => {
    e.stopPropagation();
    if ('cancelable' in e && e.cancelable) {
      e.preventDefault();
    }

    setActiveDrag(dragTarget);

    const getClientX = (ev: MouseEvent | TouchEvent): number => {
      if ('touches' in ev && ev.touches.length > 0) {
        return ev.touches[0].clientX;
      }
      if ('changedTouches' in ev && ev.changedTouches.length > 0) {
        return ev.changedTouches[0].clientX;
      }
      return (ev as MouseEvent).clientX;
    };

    // Immediate seek if scrubbing
    if (dragTarget.type === 'scrub') {
      const initX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      onSeek(getTimeFromEvent(initX));
    }

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      if ('cancelable' in moveEv && moveEv.cancelable) {
        moveEv.preventDefault();
      }
      const clientX = getClientX(moveEv);
      const time = getTimeFromEvent(clientX);
      const cur = propsRef.current;

      switch (dragTarget.type) {
        case 'scrub': {
          onSeek(time);
          break;
        }
        case 'video_start': {
          const newStart = Math.max(0, Math.min(cur.endTime - 0.5, time));
          onStartTimeChange(parseFloat(newStart.toFixed(1)));
          onSeek(newStart);
          break;
        }
        case 'video_end': {
          const newEnd = Math.max(cur.startTime + 0.5, Math.min(cur.totalDuration, time));
          onEndTimeChange(parseFloat(newEnd.toFixed(1)));
          onSeek(newEnd);
          break;
        }
        case 'video_slip': {
          const clipLen = dragTarget.initialEndTime - dragTarget.initialStartTime;
          const delta = time - dragTarget.initialClickTime;
          let s = dragTarget.initialStartTime + delta;
          let e = s + clipLen;
          if (s < 0) {
            s = 0;
            e = Math.min(cur.totalDuration, clipLen);
          } else if (e > cur.totalDuration) {
            e = cur.totalDuration;
            s = Math.max(0, cur.totalDuration - clipLen);
          }
          onStartTimeChange(parseFloat(s.toFixed(1)));
          onEndTimeChange(parseFloat(e.toFixed(1)));
          onSeek(s);
          break;
        }
        case 'audio_start': {
          if (cur.overlayMusic) {
            const end = dragTarget.initialEnd;
            const newStart = Math.max(0, Math.min(end - 0.5, time));
            onOverlayMusicChange?.({ ...cur.overlayMusic, startTime: parseFloat(newStart.toFixed(1)) });
            onSeek(newStart);
          }
          break;
        }
        case 'audio_end': {
          if (cur.overlayMusic) {
            const start = dragTarget.initialStart;
            const newEnd = Math.max(start + 0.5, Math.min(cur.totalDuration, time));
            onOverlayMusicChange?.({ ...cur.overlayMusic, endTime: parseFloat(newEnd.toFixed(1)) });
            onSeek(newEnd);
          }
          break;
        }
        case 'audio_slip': {
          if (cur.overlayMusic) {
            const len = dragTarget.initialEnd - dragTarget.initialStart;
            const delta = time - dragTarget.initialClickTime;
            let s = dragTarget.initialStart + delta;
            let e = s + len;
            if (s < 0) {
              s = 0;
              e = Math.min(cur.totalDuration, len);
            } else if (e > cur.totalDuration) {
              e = cur.totalDuration;
              s = Math.max(0, cur.totalDuration - len);
            }
            onOverlayMusicChange?.({
              ...cur.overlayMusic,
              startTime: parseFloat(s.toFixed(1)),
              endTime: parseFloat(e.toFixed(1)),
            });
            onSeek(s);
          }
          break;
        }
        case 'fx_start': {
          if (cur.effect) {
            const end = dragTarget.initialEnd;
            const newStart = Math.max(0, Math.min(end - 0.5, time));
            onEffectChange?.({ ...cur.effect, startTime: parseFloat(newStart.toFixed(1)) });
            onSeek(newStart);
          }
          break;
        }
        case 'fx_end': {
          if (cur.effect) {
            const start = dragTarget.initialStart;
            const newEnd = Math.max(start + 0.5, Math.min(cur.totalDuration, time));
            onEffectChange?.({ ...cur.effect, endTime: parseFloat(newEnd.toFixed(1)) });
            onSeek(newEnd);
          }
          break;
        }
        case 'fx_slip': {
          if (cur.effect) {
            const len = dragTarget.initialEnd - dragTarget.initialStart;
            const delta = time - dragTarget.initialClickTime;
            let s = dragTarget.initialStart + delta;
            let e = s + len;
            if (s < 0) {
              s = 0;
              e = Math.min(cur.totalDuration, len);
            } else if (e > cur.totalDuration) {
              e = cur.totalDuration;
              s = Math.max(0, cur.totalDuration - len);
            }
            onEffectChange?.({
              ...cur.effect,
              startTime: parseFloat(s.toFixed(1)),
              endTime: parseFloat(e.toFixed(1)),
            });
            onSeek(s);
          }
          break;
        }
        case 'text_start': {
          const end = dragTarget.initialEnd;
          const newStart = Math.max(0, Math.min(end - 0.3, time));
          onUpdateTextOverlay?.(dragTarget.textId, { startTime: parseFloat(newStart.toFixed(1)) });
          onSeek(newStart);
          break;
        }
        case 'text_end': {
          const start = dragTarget.initialStart;
          const newEnd = Math.max(start + 0.3, Math.min(cur.totalDuration, time));
          onUpdateTextOverlay?.(dragTarget.textId, { endTime: parseFloat(newEnd.toFixed(1)) });
          onSeek(newEnd);
          break;
        }
        case 'text_slip': {
          const len = dragTarget.initialEnd - dragTarget.initialStart;
          const delta = time - dragTarget.initialClickTime;
          let s = dragTarget.initialStart + delta;
          let e = s + len;
          if (s < 0) {
            s = 0;
            e = Math.min(cur.totalDuration, len);
          } else if (e > cur.totalDuration) {
            e = cur.totalDuration;
            s = Math.max(0, cur.totalDuration - len);
          }
          onUpdateTextOverlay?.(dragTarget.textId, {
            startTime: parseFloat(s.toFixed(1)),
            endTime: parseFloat(e.toFixed(1)),
          });
          onSeek(s);
          break;
        }
        case 'sfx_drag': {
          const newTime = Math.max(0, Math.min(cur.totalDuration, time));
          onSoundEffectsChange?.(
            cur.soundEffects.map((s) =>
              s.id === dragTarget.sfxId ? { ...s, time: parseFloat(newTime.toFixed(1)) } : s
            )
          );
          onSeek(newTime);
          break;
        }
      }
    };

    const onEnd = () => {
      setActiveDrag(null);
      window.removeEventListener('mousemove', onMove as any);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };

    window.addEventListener('mousemove', onMove as any);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove as any, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoverTime(getTimeFromEvent(e.clientX));
  };

  const handleMouseLeave = () => setHoverTime(null);

  const handleSplitAtPlayhead = () => {
    const cut = parseFloat(currentTime.toFixed(2));
    if (cut > 0.1 && cut < totalDuration - 0.1) {
      if (!splitCutPoints.includes(cut)) {
        setSplitCutPoints((prev) => [...prev, cut].sort((a, b) => a - b));
      }
      onSplit?.(cut);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleSplitAtPlayhead();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, totalDuration]);

  const handleJumpToStart = () => onSeek(startTime);
  const handleJumpToEnd = () => onSeek(endTime);
  const handleStep = (seconds: number) => {
    onSeek(Math.max(0, Math.min(totalDuration, currentTime + seconds)));
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onSpeedChange(speeds[nextIndex]);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, Math.round((z + 0.5) * 10) / 10));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10));

  useEffect(() => {
    if (isPlaying && zoomLevel > 1 && scrollContainerRef.current && tracksAreaRef.current) {
      const container = scrollContainerRef.current;
      const playheadX = (currentTime / totalDuration) * tracksAreaRef.current.scrollWidth;
      const targetScroll = playheadX - container.clientWidth / 2;
      container.scrollLeft = targetScroll;
    }
  }, [currentTime, isPlaying, zoomLevel, totalDuration]);

  const baseTicks = Math.min(30, Math.max(6, Math.floor(totalDuration / 2)));
  const tickCount = Math.round(baseTicks * zoomLevel);

  return (
    <div className="w-full bg-white/95 dark:bg-[#0c071d]/95 backdrop-blur-md border-t border-purple-100 dark:border-purple-900/50 select-none px-3.5 py-2 space-y-1.5 shadow-[0_-4px_24px_-4px_rgba(168,85,247,0.14)] transition-colors duration-300">
      {/* 1. CapCut Studio Timeline Toolbar - Structured & Responsive */}
      <div className="pb-1.5 border-b border-purple-100/70 dark:border-purple-900/40 space-y-1.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Left Actions: Split, Keyframe, Delete, Magnet, Loop */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* CapCut Split Tool Button */}
            <button
              onClick={handleSplitAtPlayhead}
              title="Split Clip at Playhead (Ctrl+B)"
              className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/60 text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0"
            >
              <Scissors className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-mono text-xs">Split</span>
            </button>

            {/* CapCut Keyframe Diamond Button */}
            <button
              onClick={() => onAddKeyframe?.(currentTime)}
              title="Add Keyframe at Playhead"
              className="px-2 py-1 rounded-lg bg-white dark:bg-purple-950/40 hover:bg-purple-50 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-200 text-xs font-medium flex items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0"
            >
              <span className="text-amber-500 font-bold leading-none">◆+</span>
              <span className="hidden sm:inline text-[11px]">Keyframe</span>
            </button>

            {/* Delete Selection */}
            {onDeleteSelected && (
              <button
                onClick={onDeleteSelected}
                title="Delete Selected Item"
                className="p-1.5 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Magnetic Snapping Toggle */}
            <button
              onClick={() => setMagneticSnap(!magneticSnap)}
              title={magneticSnap ? 'Magnetic Snapping: Enabled' : 'Magnetic Snapping: Disabled'}
              className={`p-1.5 rounded-lg text-xs transition-colors border cursor-pointer shrink-0 ${
                magneticSnap
                  ? 'bg-purple-100/90 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 font-semibold shadow-2xs'
                  : 'text-slate-400 dark:text-purple-300/60 hover:text-slate-600 dark:hover:text-white border-transparent hover:bg-purple-50 dark:hover:bg-purple-900/30'
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>

            {/* Loop Trim Segment Button */}
            <button
              onClick={onLoopToggle}
              title={isLooping ? 'Loop Segment: ON' : 'Loop Segment: OFF'}
              className={`p-1.5 rounded-lg text-xs transition-colors border cursor-pointer shrink-0 ${
                isLooping
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-700 font-medium'
                  : 'text-slate-400 dark:text-purple-300/60 hover:text-slate-600 dark:hover:text-white border-transparent hover:bg-purple-50 dark:hover:bg-purple-900/30'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Trim info pill */}
            <div className="hidden lg:flex items-center gap-1.5 ml-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/70 dark:border-purple-800/60 text-[11px] text-purple-800 dark:text-purple-300 shrink-0">
              <span className="text-purple-600 dark:text-purple-400 font-medium">Trim:</span>
              <span className="font-mono text-purple-900 dark:text-purple-200 font-semibold">{clipDuration.toFixed(1)}s</span>
              <span className="text-[10px] text-purple-500 dark:text-purple-400/60 font-mono">
                ({formatTime(startTime)} - {formatTime(endTime)})
              </span>
            </div>
          </div>

          {/* Center: Main Transport Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mx-auto">
            <button
              onClick={handleJumpToStart}
              title="Snap to In Point (Start)"
              className="p-1 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleStep(-1)}
              title="Step Back 1s"
              className="p-1 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors flex items-center cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[9px] font-mono -ml-0.5">1s</span>
            </button>

            {/* Central Play/Pause button */}
            <button
              onClick={onPlayToggle}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 shadow-md shadow-purple-600/30 dark:shadow-[0_0_18px_rgba(168,85,247,0.5)] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer ${
                isPlaying ? 'ring-2 ring-purple-400/50' : 'pl-0.5'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>

            <button
              onClick={() => handleStep(1)}
              title="Step Forward 1s"
              className="p-1 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors flex items-center cursor-pointer"
            >
              <span className="text-[9px] font-mono -mr-0.5">1s</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleJumpToEnd}
              title="Snap to Out Point (End)"
              className="p-1 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right side: Timecode Display, Zoom controls, Volume, Speed */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
            {/* Timecode display */}
            <div className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-purple-50/60 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/60 shrink-0">
              <span className="font-semibold text-slate-900 dark:text-purple-100">{formatTime(currentTime)}</span>
              <span className="text-purple-300 dark:text-purple-600">/</span>
              <span className="text-slate-500 dark:text-purple-300/60 text-[11px]">{formatTime(totalDuration)}</span>
            </div>

            {/* Timeline Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/60 shrink-0">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                title="Zoom Out Timeline"
                className="p-1 text-slate-500 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 font-semibold px-0.5">
                {zoomLevel.toFixed(1)}x
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                title="Zoom In Timeline"
                className="p-1 text-slate-500 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Speed Toggle */}
            <button
              onClick={cycleSpeed}
              title="Playback Speed"
              className="px-2 py-1 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white text-xs font-mono font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <Gauge className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>{speed}x</span>
            </button>

            {/* Volume Control */}
            <div className="relative shrink-0">
              <button
                onClick={() => onVolumeChange(volume === 0 ? 100 : 0)}
                onMouseEnter={() => setShowVolumePopup(true)}
                title={volume === 0 ? 'Unmute' : 'Mute'}
                className="p-1.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                {volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                )}
                <span className="font-mono text-[10px] text-slate-600 dark:text-purple-300/70">{volume}%</span>
              </button>

              {showVolumePopup && (
                <div
                  onMouseLeave={() => setShowVolumePopup(false)}
                  className="absolute bottom-full right-0 mb-2 p-3 bg-white dark:bg-[#150d2e] border border-purple-200 dark:border-purple-800 rounded-xl shadow-xl z-50 flex flex-col items-center gap-2"
                >
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-24 accent-purple-600 cursor-pointer h-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-slate-600 dark:text-purple-300/80">{volume}% Vol</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CapCut 4-Track Editing Container */}
      <div className="flex border border-purple-200/90 dark:border-purple-800/60 rounded-xl bg-purple-50/30 dark:bg-[#110924]/50 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.1)]">
        {/* Left Track Headers Dock */}
        <div className="w-20 sm:w-28 md:w-32 bg-white/95 dark:bg-[#0e0822]/95 border-r border-purple-100 dark:border-purple-900/50 flex flex-col shrink-0 select-none z-10">
          {/* Ruler Header */}
          <div className="h-5 px-2.5 flex items-center justify-between border-b border-purple-100 dark:border-purple-900/50 text-[9.5px] font-mono font-semibold text-purple-900 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/40">
            <span>TRACKS</span>
          </div>

          {/* Track 1: Text Overlays Header */}
          <div
            onClick={() => onOpenTool?.('text')}
            className="h-8 px-2 flex items-center gap-1.5 border-b border-purple-100 dark:border-purple-900/40 hover:bg-purple-50/60 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
            title="Text Overlays Track"
          >
            <div className="w-3.5 h-3.5 rounded bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Type className="w-2 h-2" />
            </div>
            <span className="text-[10px] font-medium text-slate-700 dark:text-purple-200 truncate">Text</span>
          </div>

          {/* Track 2: Main Video & Transitions Header */}
          <div
            onClick={() => onOpenTool?.('trim')}
            className="h-12 px-2 flex items-center gap-1.5 border-b border-purple-100 dark:border-purple-900/40 hover:bg-purple-50/60 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
            title="Main Video Track"
          >
            <div className="w-3.5 h-3.5 rounded bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Film className="w-2 h-2" />
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-semibold text-purple-950 dark:text-purple-200 block truncate">Video 1</span>
              <span className="text-[8.5px] font-mono text-purple-600/70 dark:text-purple-400/70 block">Main Film</span>
            </div>
          </div>

          {/* Track 3: Visual Effects (FX) Header */}
          <div
            onClick={() => onOpenTool?.('effects')}
            className="h-7 px-2 flex items-center gap-1.5 border-b border-purple-100 dark:border-purple-900/40 hover:bg-purple-50/60 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
            title="Effects Track"
          >
            <div className="w-3.5 h-3.5 rounded bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Wand2 className="w-2 h-2" />
            </div>
            <span className="text-[10px] font-medium text-slate-700 dark:text-purple-200 truncate">Visual FX</span>
          </div>

          {/* Track 4: Audio & SFX Header */}
          <div
            onClick={() => onOpenTool?.('music')}
            className="h-8 px-2 flex items-center gap-1.5 hover:bg-purple-50/60 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
            title="Audio Track"
          >
            <div className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Music className="w-2 h-2" />
            </div>
            <span className="text-[10px] font-medium text-slate-700 dark:text-purple-200 truncate">Audio / SFX</span>
          </div>
        </div>

        {/* Right Scrollable 4-Track Content Area */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
          style={{ cursor: 'pointer' }}
        >
          <div
            ref={tracksAreaRef}
            onMouseDown={(e) => startDrag(e, { type: 'scrub' })}
            onTouchStart={(e) => startDrag(e, { type: 'scrub' })}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-full select-none touch-none cursor-pointer"
            style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}
          >
            {/* Top Seconds Ruler */}
            <div className="h-5 flex justify-between px-2 text-[8.5px] font-mono text-slate-400 border-b border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-[#0e0822]/80 relative">
              {Array.from({ length: tickCount + 1 }).map((_, i) => {
                const sec = (i / tickCount) * totalDuration;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span className="select-none text-[8px] text-slate-500 dark:text-purple-300/60 font-mono">
                      {sec.toFixed(0)}s
                    </span>
                    <div className="w-[1px] h-1 bg-purple-200 dark:bg-purple-800" />
                  </div>
                );
              })}

              {/* Keyframe Diamond Markers on Ruler */}
              {keyframes.map((kf) => (
                <div
                  key={kf.id}
                  className="absolute top-1 text-amber-500 text-[10px] -translate-x-1/2 pointer-events-none drop-shadow"
                  style={{ left: `${(kf.time / totalDuration) * 100}%` }}
                >
                  ◆
                </div>
              ))}
            </div>

            {/* TRACK 1: Text Overlays (Height: 34px) */}
            <div className="h-9 sm:h-8 relative border-b border-purple-100 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20 px-1 py-0.5 flex items-center overflow-hidden">
              {textOverlays.length === 0 ? (
                <div
                  onClick={() => onOpenTool?.('text')}
                  className="px-2 text-[9.5px] text-purple-400 dark:text-purple-400/60 font-mono italic hover:text-purple-600 transition-colors cursor-pointer"
                >
                  + Add Text Overlays
                </div>
              ) : (
                <>
                  {textOverlays.map((item) => {
                    const isSelected = selectedTextId === item.id;
                    const itemStart = Math.max(0, Math.min(totalDuration - 0.2, item.startTime ?? 0));
                    const itemEnd = Math.max(itemStart + 0.2, Math.min(totalDuration, item.endTime ?? totalDuration));
                    const leftPct = (itemStart / totalDuration) * 100;
                    const widthPct = Math.max(2.5, ((itemEnd - itemStart) / totalDuration) * 100);

                    return (
                      <div
                        key={item.id}
                        className={`absolute top-1 bottom-1 rounded-md flex items-center shadow-xs transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-400 ring-offset-1 z-25'
                            : 'bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700 z-20'
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
                        {/* Left Trim Handle for selected text */}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => startDrag(e, { type: 'text_start', textId: item.id, initialEnd: itemEnd })}
                            onTouchStart={(e) => startDrag(e, { type: 'text_start', textId: item.id, initialEnd: itemEnd })}
                            className="absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-ew-resize touch-none flex items-center justify-center z-30"
                            title="Trim Text Start"
                          >
                            <div className="w-1.5 h-3 bg-white rounded-full shadow" />
                          </div>
                        )}

                        {/* Draggable text center */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTextOverlay?.(item.id);
                            onOpenTool?.('text');
                          }}
                          onMouseDown={(e) => {
                            if (isSelected) {
                              startDrag(e, {
                                type: 'text_slip',
                                textId: item.id,
                                initialStart: itemStart,
                                initialEnd: itemEnd,
                                initialClickTime: getTimeFromEvent(e.clientX),
                              });
                            }
                          }}
                          onTouchStart={(e) => {
                            if (isSelected) {
                              startDrag(e, {
                                type: 'text_slip',
                                textId: item.id,
                                initialStart: itemStart,
                                initialEnd: itemEnd,
                                initialClickTime: getTimeFromEvent(e.touches[0].clientX),
                              });
                            }
                          }}
                          className="flex-1 px-1.5 flex items-center text-[9.5px] font-semibold truncate cursor-grab active:cursor-grabbing"
                          title={`Text: "${item.text}"`}
                        >
                          <Type className="w-2.5 h-2.5 mr-1 shrink-0 opacity-70" />
                          <span className="truncate">{item.text}</span>
                          {item.animation && item.animation !== 'none' && (
                            <Sparkles className="w-2 h-2 ml-1 text-amber-300 shrink-0" />
                          )}
                        </div>

                        {/* Right Trim Handle for selected text */}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => startDrag(e, { type: 'text_end', textId: item.id, initialStart: itemStart })}
                            onTouchStart={(e) => startDrag(e, { type: 'text_end', textId: item.id, initialStart: itemStart })}
                            className="absolute right-0 top-0 bottom-0 w-4 -mr-2 cursor-ew-resize touch-none flex items-center justify-center z-30"
                            title="Trim Text End"
                          >
                            <div className="w-1.5 h-3 bg-white rounded-full shadow" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* TRACK 2: Main Video Filmstrip, Split Cuts & Trimming (Height: 52px) */}
            <div className="h-13 sm:h-12 relative border-b border-purple-100 dark:border-purple-900/40 bg-purple-100/30 dark:bg-purple-950/30 overflow-hidden">
              {/* Filmstrip Frame Thumbnails */}
              <div className="absolute inset-0 flex items-center justify-between opacity-35 px-1 pointer-events-none">
                {Array.from({ length: Math.round(24 * zoomLevel) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-9 border border-purple-300/40 dark:border-purple-700/40 rounded bg-purple-200/40 dark:bg-purple-900/40 shadow-xs"
                  />
                ))}
              </div>

              {/* Inactive Head Dimming */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-slate-950/45 pointer-events-none z-10"
                style={{ width: `${(startTime / totalDuration) * 100}%` }}
              />

              {/* Inactive Tail Dimming */}
              <div
                className="absolute top-0 bottom-0 right-0 bg-slate-950/45 pointer-events-none z-10"
                style={{ width: `${((totalDuration - endTime) / totalDuration) * 100}%` }}
              />

              {/* Active Trim Segment Box (Draggable slip window) */}
              <div
                onMouseDown={(e) =>
                  startDrag(e, {
                    type: 'video_slip',
                    initialStartTime: startTime,
                    initialEndTime: endTime,
                    initialClickTime: getTimeFromEvent(e.clientX),
                  })
                }
                onTouchStart={(e) =>
                  startDrag(e, {
                    type: 'video_slip',
                    initialStartTime: startTime,
                    initialEndTime: endTime,
                    initialClickTime: getTimeFromEvent(e.touches[0].clientX),
                  })
                }
                className="absolute top-0 bottom-0 bg-purple-500/20 dark:bg-purple-600/25 border-t-2 border-b-2 border-purple-600 dark:border-purple-500 z-15 cursor-grab active:cursor-grabbing touch-none"
                style={{
                  left: `${(startTime / totalDuration) * 100}%`,
                  width: `${((endTime - startTime) / totalDuration) * 100}%`,
                }}
                title="Drag to slip / reposition trimmed video segment"
              />

              {/* CapCut Transition Badges */}
              {transition && transition.type !== 'none' && (
                <div
                  onClick={() => onOpenTool?.('transitions')}
                  className="absolute top-1 bottom-1 px-1.5 rounded bg-purple-700 text-white text-[9px] font-mono flex items-center gap-1 z-25 shadow-xs cursor-pointer hover:bg-purple-800 transition-colors"
                  style={{ left: `${(startTime / totalDuration) * 100 + 1}%` }}
                  title={`Transition: ${transition.type}`}
                >
                  <Layers className="w-2.5 h-2.5 text-amber-300" />
                  <span className="uppercase tracking-wider">{transition.type.replace('_', ' ')}</span>
                </div>
              )}

              {/* CapCut Split Cut Markers */}
              {splitCutPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-25 pointer-events-none shadow"
                  style={{ left: `${(pt / totalDuration) * 100}%` }}
                >
                  <div className="w-2 h-2 -ml-[3px] bg-amber-400 rotate-45" />
                </div>
              ))}

              {/* Video Start Trim Handle (Generous touch target + visual handle) */}
              <div
                className="absolute top-0 bottom-0 w-7 -ml-3.5 z-30 flex items-center justify-center cursor-ew-resize touch-none group"
                style={{ left: `${(startTime / totalDuration) * 100}%` }}
                onMouseDown={(e) => startDrag(e, { type: 'video_start' })}
                onTouchStart={(e) => startDrag(e, { type: 'video_start' })}
                title={`Video In: ${formatTime(startTime)} (Drag to Trim)`}
              >
                <div className="w-4 h-full bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-700 rounded-l-lg border border-white/50 dark:border-purple-400/50 shadow-md flex items-center justify-center transition-transform group-hover:scale-105 active:scale-110">
                  <div className="flex flex-col gap-0.5">
                    <div className="w-[1.5px] h-3 bg-white rounded-full" />
                    <div className="w-[1.5px] h-3 bg-white rounded-full" />
                  </div>
                </div>
                {/* Float Timestamp Indicator */}
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[8px] opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow z-40">
                  {formatTime(startTime)}
                </span>
              </div>

              {/* Video End Trim Handle (Generous touch target + visual handle) */}
              <div
                className="absolute top-0 bottom-0 w-7 -ml-3.5 z-30 flex items-center justify-center cursor-ew-resize touch-none group"
                style={{ left: `${(endTime / totalDuration) * 100}%` }}
                onMouseDown={(e) => startDrag(e, { type: 'video_end' })}
                onTouchStart={(e) => startDrag(e, { type: 'video_end' })}
                title={`Video Out: ${formatTime(endTime)} (Drag to Trim)`}
              >
                <div className="w-4 h-full bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-700 rounded-r-lg border border-white/50 dark:border-purple-400/50 shadow-md flex items-center justify-center transition-transform group-hover:scale-105 active:scale-110">
                  <div className="flex flex-col gap-0.5">
                    <div className="w-[1.5px] h-3 bg-white rounded-full" />
                    <div className="w-[1.5px] h-3 bg-white rounded-full" />
                  </div>
                </div>
                {/* Float Timestamp Indicator */}
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[8px] opacity-0 group-hover:opacity-100 group-active:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow z-40">
                  {formatTime(endTime)}
                </span>
              </div>
            </div>

            {/* TRACK 3: Visual Effects (FX) Track (Height: 32px) - Touch & Mouse Trimmable */}
            <div className="h-8 relative border-b border-purple-100 dark:border-purple-900/40 bg-amber-50/20 dark:bg-amber-950/20 px-1 py-0.5 flex items-center overflow-hidden">
              {effect && effect.type !== 'none' ? (
                (() => {
                  const fxStart = Math.max(0, Math.min(totalDuration - 0.5, effect.startTime ?? 0));
                  const fxEnd = Math.max(fxStart + 0.5, Math.min(totalDuration, effect.endTime ?? totalDuration));
                  const fxLeft = (fxStart / totalDuration) * 100;
                  const fxWidth = Math.max(3, ((fxEnd - fxStart) / totalDuration) * 100);

                  return (
                    <div
                      className="absolute inset-y-1 rounded-md bg-gradient-to-r from-amber-500/25 via-orange-500/30 to-amber-500/25 border border-amber-400/70 dark:border-amber-500/70 flex items-center shadow-xs group z-20"
                      style={{
                        left: `${fxLeft}%`,
                        width: `${fxWidth}%`,
                      }}
                    >
                      {/* Left FX Trim Handle */}
                      <div
                        onMouseDown={(e) => startDrag(e, { type: 'fx_start', initialEnd: fxEnd })}
                        onTouchStart={(e) => startDrag(e, { type: 'fx_start', initialEnd: fxEnd })}
                        className="absolute left-0 top-0 bottom-0 w-5 -ml-2.5 cursor-ew-resize touch-none flex items-center justify-center z-30"
                        title="Trim Effect Start"
                      >
                        <div className="w-2 h-full bg-amber-500 rounded-l-md border border-white/60 shadow flex items-center justify-center">
                          <div className="w-[1.5px] h-2.5 bg-white rounded-full" />
                        </div>
                      </div>

                      {/* Middle FX Slip & Click Area */}
                      <div
                        onClick={() => onOpenTool?.('effects')}
                        onMouseDown={(e) =>
                          startDrag(e, {
                            type: 'fx_slip',
                            initialStart: fxStart,
                            initialEnd: fxEnd,
                            initialClickTime: getTimeFromEvent(e.clientX),
                          })
                        }
                        onTouchStart={(e) =>
                          startDrag(e, {
                            type: 'fx_slip',
                            initialStart: fxStart,
                            initialEnd: fxEnd,
                            initialClickTime: getTimeFromEvent(e.touches[0].clientX),
                          })
                        }
                        className="flex-1 h-full px-2 flex items-center gap-1.5 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                        title="Drag to reposition effect / Click to customize"
                      >
                        <Wand2 className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-[9.5px] font-semibold text-amber-900 dark:text-amber-200 truncate">
                          FX: {effect.type.replace('_', ' ').toUpperCase()} ({formatTime(fxStart)} - {formatTime(fxEnd)})
                        </span>
                      </div>

                      {/* Right FX Trim Handle */}
                      <div
                        onMouseDown={(e) => startDrag(e, { type: 'fx_end', initialStart: fxStart })}
                        onTouchStart={(e) => startDrag(e, { type: 'fx_end', initialStart: fxStart })}
                        className="absolute right-0 top-0 bottom-0 w-5 -mr-2.5 cursor-ew-resize touch-none flex items-center justify-center z-30"
                        title="Trim Effect End"
                      >
                        <div className="w-2 h-full bg-amber-500 rounded-r-md border border-white/60 shadow flex items-center justify-center">
                          <div className="w-[1.5px] h-2.5 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  onClick={() => onOpenTool?.('effects')}
                  className="px-2 text-[9.5px] text-amber-600/70 dark:text-amber-400/70 font-mono italic hover:text-amber-800 transition-colors cursor-pointer"
                >
                  + Add Visual FX (Shake, VHS, Glitch)
                </div>
              )}
            </div>

            {/* TRACK 4: Audio & SFX Track (Height: 34px) - Touch & Mouse Trimmable */}
            <div className="h-9 relative bg-emerald-50/20 dark:bg-emerald-950/20 px-1 py-0.5 flex items-center overflow-hidden">
              {overlayMusic?.url ? (
                (() => {
                  const audioStart = Math.max(0, Math.min(totalDuration - 0.5, overlayMusic.startTime ?? 0));
                  const audioEnd = Math.max(audioStart + 0.5, Math.min(totalDuration, overlayMusic.endTime ?? totalDuration));
                  const audioLeft = (audioStart / totalDuration) * 100;
                  const audioWidth = Math.max(3, ((audioEnd - audioStart) / totalDuration) * 100);

                  return (
                    <div
                      className="absolute inset-y-1 rounded-md bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-500/25 border border-emerald-400/70 dark:border-emerald-500/70 flex items-center shadow-xs group z-20"
                      style={{
                        left: `${audioLeft}%`,
                        width: `${audioWidth}%`,
                      }}
                    >
                      {/* Left Audio Trim Handle */}
                      <div
                        onMouseDown={(e) => startDrag(e, { type: 'audio_start', initialEnd: audioEnd })}
                        onTouchStart={(e) => startDrag(e, { type: 'audio_start', initialEnd: audioEnd })}
                        className="absolute left-0 top-0 bottom-0 w-5 -ml-2.5 cursor-ew-resize touch-none flex items-center justify-center z-30"
                        title="Trim Audio Start"
                      >
                        <div className="w-2 h-full bg-emerald-600 rounded-l-md border border-white/60 shadow flex items-center justify-center">
                          <div className="w-[1.5px] h-2.5 bg-white rounded-full" />
                        </div>
                      </div>

                      {/* Middle Audio Slip & Click Area */}
                      <div
                        onClick={() => onOpenTool?.('music')}
                        onMouseDown={(e) =>
                          startDrag(e, {
                            type: 'audio_slip',
                            initialStart: audioStart,
                            initialEnd: audioEnd,
                            initialClickTime: getTimeFromEvent(e.clientX),
                          })
                        }
                        onTouchStart={(e) =>
                          startDrag(e, {
                            type: 'audio_slip',
                            initialStart: audioStart,
                            initialEnd: audioEnd,
                            initialClickTime: getTimeFromEvent(e.touches[0].clientX),
                          })
                        }
                        className="flex-1 h-full px-2 flex items-center gap-1.5 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                        title="Drag to slip / reposition audio on timeline"
                      >
                        <Music className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="text-[9.5px] font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                          {overlayMusic.name} ({formatTime(audioStart)} - {formatTime(audioEnd)})
                        </span>

                        {/* Waveform graphic */}
                        <div className="flex items-center gap-[2px] ml-auto opacity-60">
                          {Array.from({ length: 18 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-[2px] bg-emerald-600 dark:bg-emerald-400 rounded-full"
                              style={{ height: `${5 + ((i * 7) % 11)}px` }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right Audio Trim Handle */}
                      <div
                        onMouseDown={(e) => startDrag(e, { type: 'audio_end', initialStart: audioStart })}
                        onTouchStart={(e) => startDrag(e, { type: 'audio_end', initialStart: audioStart })}
                        className="absolute right-0 top-0 bottom-0 w-5 -mr-2.5 cursor-ew-resize touch-none flex items-center justify-center z-30"
                        title="Trim Audio End"
                      >
                        <div className="w-2 h-full bg-emerald-600 rounded-r-md border border-white/60 shadow flex items-center justify-center">
                          <div className="w-[1.5px] h-2.5 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  onClick={() => onOpenTool?.('music')}
                  className="px-2 text-[9.5px] text-emerald-600/70 dark:text-emerald-400/70 font-mono italic hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  + Add Music / Audio Track
                </div>
              )}

              {/* Placed SFX Markers on Audio Track (Touch Draggable) */}
              {soundEffects.map((sfx) => (
                <div
                  key={sfx.id}
                  onMouseDown={(e) => startDrag(e, { type: 'sfx_drag', sfxId: sfx.id })}
                  onTouchStart={(e) => startDrag(e, { type: 'sfx_drag', sfxId: sfx.id })}
                  className="absolute top-1 bottom-1 px-1.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-[8.5px] font-mono font-bold flex items-center gap-1 shadow-md z-25 transition-transform hover:scale-105 cursor-grab active:cursor-grabbing -translate-x-1/2 touch-none"
                  style={{ left: `${(sfx.time / totalDuration) * 100}%` }}
                  title={`SFX: ${sfx.name} at ${formatTime(sfx.time)} (Drag to move)`}
                >
                  <Zap className="w-2 h-2 text-amber-300" />
                  <span className="truncate max-w-[50px]">{sfx.name}</span>
                </div>
              ))}
            </div>

            {/* Hover Indicator Line & Bubble */}
            {hoverTime !== null && (
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-purple-500/70 pointer-events-none z-35"
                style={{ left: `${(hoverTime / totalDuration) * 100}%` }}
              >
                <span className="absolute -top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[8.5px] font-mono whitespace-nowrap shadow-md">
                  {formatTime(hoverTime)}
                </span>
              </div>
            )}

            {/* UNIFIED FULL-HEIGHT PLAYHEAD NEEDLE & TOUCH THUMB */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-purple-600 dark:bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)] z-40 pointer-events-none"
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            >
              <div
                onMouseDown={(e) => startDrag(e, { type: 'scrub' })}
                onTouchStart={(e) => startDrag(e, { type: 'scrub' })}
                className="w-5 h-5 sm:w-4.5 sm:h-4.5 bg-gradient-to-b from-purple-500 to-indigo-700 border-2 border-white dark:border-purple-200 rounded-full -ml-[9px] sm:-ml-[8px] -mt-1.5 shadow-xl flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 active:scale-125 transition-transform touch-none"
                title={`Playhead: ${formatTime(currentTime)} (Drag to scrub)`}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
