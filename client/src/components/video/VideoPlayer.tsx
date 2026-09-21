import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Move,
  Sparkles,
} from 'lucide-react';
import {
  TextOverlay,
  VideoFilterType,
  OverlayMusic,
  ColorAdjustments,
  StickerOverlay,
  VideoTransition,
  VideoEffect,
  SoundEffectItem,
  WatermarkPip,
  SpeedCurve,
} from '../../types/index.js';
import { loadGoogleFont } from '../../utils/fonts.js';
import { hexToRgba, computeTextShadow } from '../../utils/colorPresets.js';
import { SafeZoneGuide } from './SafeZoneGuide.js';
import { soundEffects as sfxService } from '../../services/soundEffects.js';
import { BadgeRenderer } from '../editor/BadgeRenderer.js';
import { KineticText } from './KineticText.js';

interface VideoPlayerProps {
  src: string;
  filter?: VideoFilterType;
  filterIntensity?: number;
  adjustments?: ColorAdjustments;
  speed?: number;
  volume?: number;
  overlayMusic?: OverlayMusic;
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  textOverlays?: TextOverlay[];
  onUpdateTextOverlay?: (id: string, updates: Partial<TextOverlay>) => void;
  stickers?: StickerOverlay[];
  onUpdateSticker?: (id: string, updates: Partial<StickerOverlay>) => void;
  selectedStickerId?: string | null;
  onSelectSticker?: (id: string | null) => void;
  showSafeZone?: boolean;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  isPlaying?: boolean;
  onPlayChange?: (playing: boolean) => void;
  activeTool?: string;
  autoPlay?: boolean;
  loop?: boolean;
  startTrim?: number;
  endTrim?: number;
  transition?: VideoTransition;
  effect?: VideoEffect;
  soundEffects?: SoundEffectItem[];
  watermark?: WatermarkPip;
  speedCurve?: SpeedCurve;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  filter = 'normal',
  filterIntensity = 100,
  adjustments,
  speed = 1.0,
  volume = 100,
  overlayMusic,
  aspectRatio = '9:16',
  textOverlays = [],
  onUpdateTextOverlay,
  stickers = [],
  onUpdateSticker,
  selectedStickerId = null,
  onSelectSticker,
  showSafeZone = false,
  currentTime: externalTime,
  onTimeUpdate,
  onDurationChange,
  isPlaying: externalIsPlaying,
  onPlayChange,
  activeTool,
  autoPlay = false,
  loop = true,
  startTrim,
  endTrim,
  transition,
  effect,
  soundEffects = [],
  watermark,
  speedCurve,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const framingRef = useRef<HTMLDivElement>(null);

  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const firedSfxRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [playPulse, setPlayPulse] = useState<'play' | 'pause' | null>(null);

  const effectiveIsPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  // Sync external isPlaying prop with video element and overlay audio
  useEffect(() => {
    if (!videoRef.current) return;
    if (effectiveIsPlaying && videoRef.current.paused) {
      if (endTrim !== undefined && videoRef.current.currentTime >= endTrim) {
        const resetTime = startTrim || 0;
        videoRef.current.currentTime = resetTime;
        if (bgVideoRef.current) bgVideoRef.current.currentTime = resetTime;
        if (audioRef.current && overlayMusic?.url) {
          audioRef.current.currentTime = resetTime + (overlayMusic.startTime || 0);
        }
      }
      videoRef.current.play().catch(() => {});
      bgVideoRef.current?.play().catch(() => {});
      if (audioRef.current && overlayMusic?.url) {
        audioRef.current.play().catch(() => {});
      }
    } else if (!effectiveIsPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
      bgVideoRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [effectiveIsPlaying, startTrim, endTrim, overlayMusic?.url]);

  // Sync playback speed and dynamic CapCut Velocity Curves
  useEffect(() => {
    if (!speedCurve || speedCurve.mode === 'constant') {
      if (videoRef.current) videoRef.current.playbackRate = speed;
      if (bgVideoRef.current) bgVideoRef.current.playbackRate = speed;
      return;
    }

    const start = startTrim || 0;
    const end = endTrim || duration || 15;
    const clipDur = Math.max(0.1, end - start);
    const progress = Math.max(0, Math.min(1, (internalTime - start) / clipDur));

    let targetRate = speed;
    if (speedCurve.mode === 'montage') {
      targetRate = 0.6 + Math.sin(progress * Math.PI) * 1.4;
    } else if (speedCurve.mode === 'bullet') {
      targetRate = progress > 0.35 && progress < 0.65 ? 0.35 : 1.3;
    } else if (speedCurve.mode === 'flash_in') {
      targetRate = progress < 0.25 ? 2.5 - progress * 4 : 1.0;
    } else if (speedCurve.mode === 'jump_cut') {
      targetRate = Math.floor(progress * 8) % 2 === 0 ? 1.6 : 0.7;
    }

    const safeRate = Math.max(0.25, Math.min(3.0, targetRate));
    if (videoRef.current) videoRef.current.playbackRate = safeRate;
    if (bgVideoRef.current) bgVideoRef.current.playbackRate = safeRate;
  }, [speed, speedCurve, internalTime, startTrim, endTrim, duration]);

  // Synchronize and trigger placed Sound Effects (SFX)
  useEffect(() => {
    if (Math.abs(internalTime - lastTimeRef.current) > 1.0) {
      firedSfxRef.current.clear();
    }
    lastTimeRef.current = internalTime;

    if (effectiveIsPlaying && soundEffects && soundEffects.length > 0) {
      for (const sfx of soundEffects) {
        if (Math.abs(internalTime - sfx.time) < 0.25 && !firedSfxRef.current.has(sfx.id)) {
          firedSfxRef.current.add(sfx.id);
          sfxService.play(sfx.type, (sfx.volume ?? 100) / 100);
        }
      }
    }
  }, [internalTime, effectiveIsPlaying, soundEffects]);

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : Math.min(1.0, Math.max(0, volume / 100));
    }
  }, [volume, isMuted]);

  // Sync overlay music volume
  useEffect(() => {
    if (audioRef.current && overlayMusic) {
      const vol = isMuted ? 0 : Math.min(1.0, Math.max(0, (overlayMusic.volume ?? 50) / 100));
      audioRef.current.volume = vol;
    }
  }, [overlayMusic?.volume, isMuted]);

  // Sync external seek time
  useEffect(() => {
    if (externalTime !== undefined && videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - externalTime) > 0.15) {
        videoRef.current.currentTime = externalTime;
        if (bgVideoRef.current) bgVideoRef.current.currentTime = externalTime;
        setInternalTime(externalTime);
        if (audioRef.current && overlayMusic?.url) {
          const musicStart = overlayMusic.startTime ?? 0;
          const musicEnd = overlayMusic.endTime;
          if (externalTime < musicStart || (musicEnd !== undefined && externalTime > musicEnd)) {
            audioRef.current.pause();
          } else {
            const targetMusicTime = externalTime - musicStart;
            if (audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
              audioRef.current.currentTime = Math.max(0, targetMusicTime % audioRef.current.duration);
            } else {
              audioRef.current.currentTime = Math.max(0, targetMusicTime);
            }
            if (effectiveIsPlaying) audioRef.current.play().catch(() => {});
          }
        }
      }
    }
  }, [externalTime, overlayMusic?.url, overlayMusic?.startTime, overlayMusic?.endTime, effectiveIsPlaying]);

  // Dynamically load any active custom fonts for text overlays
  useEffect(() => {
    textOverlays.forEach((t) => {
      if (t.fontFamily) loadGoogleFont(t.fontFamily);
    });
  }, [textOverlays]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setInternalTime(time);
    if (onTimeUpdate) onTimeUpdate(time);

    // Keep background blur video in sync
    if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - time) > 0.25) {
      bgVideoRef.current.currentTime = time;
    }

    // Keep overlay audio in sync if drifted and respect trimmed audio start/end
    if (audioRef.current && overlayMusic?.url) {
      const musicStart = overlayMusic.startTime ?? 0;
      const musicEnd = overlayMusic.endTime;
      if (time < musicStart || (musicEnd !== undefined && time > musicEnd)) {
        if (!audioRef.current.paused) audioRef.current.pause();
      } else {
        if (effectiveIsPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
        if (audioRef.current.duration) {
          const expectedTime = Math.max(0, (time - musicStart) % audioRef.current.duration);
          if (Math.abs(audioRef.current.currentTime - expectedTime) > 0.4) {
            audioRef.current.currentTime = expectedTime;
          }
        }
      }
    }

    // Enforce trim loop window
    if (endTrim !== undefined && time >= endTrim) {
      if (loop) {
        const loopTo = startTrim !== undefined ? startTrim : 0;
        videoRef.current.currentTime = loopTo;
        if (bgVideoRef.current) bgVideoRef.current.currentTime = loopTo;
        if (audioRef.current && overlayMusic?.url) {
          const targetMusicTime = loopTo + (overlayMusic.startTime || 0);
          if (audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
            audioRef.current.currentTime = targetMusicTime % audioRef.current.duration;
          } else {
            audioRef.current.currentTime = 0;
          }
          if (effectiveIsPlaying) audioRef.current.play().catch(() => {});
        }
      } else {
        videoRef.current.pause();
        bgVideoRef.current?.pause();
        if (audioRef.current) audioRef.current.pause();
        setInternalIsPlaying(false);
        onPlayChange?.(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    if (onDurationChange) onDurationChange(dur);
    if (startTrim !== undefined && startTrim > 0) {
      videoRef.current.currentTime = startTrim;
      if (bgVideoRef.current) bgVideoRef.current.currentTime = startTrim;
    }
    if (autoPlay) {
      videoRef.current.play().then(() => {
        setInternalIsPlaying(true);
        onPlayChange?.(true);
        bgVideoRef.current?.play().catch(() => {});
      }).catch(() => {});
    }
  };

  const triggerPulse = (type: 'play' | 'pause') => {
    setPlayPulse(type);
    setTimeout(() => setPlayPulse(null), 500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (effectiveIsPlaying) {
      videoRef.current.pause();
      bgVideoRef.current?.pause();
      setInternalIsPlaying(false);
      onPlayChange?.(false);
      triggerPulse('pause');
    } else {
      if (endTrim !== undefined && videoRef.current.currentTime >= endTrim) {
        videoRef.current.currentTime = startTrim || 0;
        if (bgVideoRef.current) bgVideoRef.current.currentTime = startTrim || 0;
      }
      videoRef.current.play().catch(() => {});
      bgVideoRef.current?.play().catch(() => {});
      setInternalIsPlaying(true);
      onPlayChange?.(true);
      triggerPulse('play');
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if effect is actively within its trimmed timeline range
  const isEffectActive = Boolean(
    effect &&
    effect.type !== 'none' &&
    (effect.startTime === undefined || internalTime >= effect.startTime) &&
    (effect.endTime === undefined || internalTime <= effect.endTime)
  );

  // Compute CSS filter string with Intensity scaling and fine-tuning color adjustments
  const getFilterStyle = () => {
    const intensity = Math.max(0, Math.min(100, filterIntensity !== undefined ? filterIntensity : 100));
    const factor = intensity / 100;

    let baseFilter = '';
    if (factor > 0 && filter !== 'normal') {
      switch (filter) {
        case 'bright':
          baseFilter = `brightness(${1 + 0.18 * factor}) contrast(${1 + 0.15 * factor}) saturate(${1 + 0.2 * factor})`;
          break;
        case 'contrast':
          baseFilter = `contrast(${1 + 0.45 * factor}) saturate(${1 + 0.25 * factor})`;
          break;
        case 'cinematic':
          baseFilter = `contrast(${1 + 0.25 * factor}) saturate(${1 + 0.2 * factor}) hue-rotate(${-8 * factor}deg) sepia(${18 * factor}%)`;
          break;
        case 'warm':
          baseFilter = `sepia(${35 * factor}%) saturate(${1 + 0.3 * factor}) brightness(${1 + 0.05 * factor})`;
          break;
        case 'cool':
          baseFilter = `hue-rotate(${180 * factor * 0.08}deg) saturate(${1 + 0.12 * factor}) contrast(${1 + 0.15 * factor}) brightness(${1 + 0.04 * factor})`;
          break;
        case 'vibrant':
          baseFilter = `saturate(${1 + 0.75 * factor}) contrast(${1 + 0.15 * factor})`;
          break;
        case 'vintage':
          baseFilter = `sepia(${50 * factor}%) contrast(${1 + 0.18 * factor}) brightness(${1 - 0.05 * factor}) saturate(${1 - 0.15 * factor})`;
          break;
        case 'faded':
          baseFilter = `contrast(${1 - 0.15 * factor}) brightness(${1 + 0.1 * factor}) saturate(${1 - 0.25 * factor})`;
          break;
        case 'dramatic':
          baseFilter = `contrast(${1 + 0.55 * factor}) brightness(${1 - 0.08 * factor}) grayscale(${100 * factor}%)`;
          break;
        case 'cyberpunk':
          baseFilter = `contrast(${1 + 0.35 * factor}) saturate(${1 + 0.6 * factor}) hue-rotate(${25 * factor}deg)`;
          break;
        case 'grayscale':
          baseFilter = `grayscale(${100 * factor}%) contrast(${1 + 0.1 * factor})`;
          break;
      }
    }

    // Apply fine-tuning color adjustments
    const b = 1 + (adjustments?.brightness || 0) / 100;
    const c = 1 + (adjustments?.contrast || 0) / 100;
    const s = 1 + (adjustments?.saturation || 0) / 100;
    const warmth = adjustments?.warmth || 0;
    const warmthFilter = warmth > 0 ? `sepia(${warmth * 0.4}%)` : warmth < 0 ? `hue-rotate(${warmth * 0.3}deg)` : '';

    const adjFilter = `brightness(${b}) contrast(${c}) saturate(${s}) ${warmthFilter}`.trim();

    // CapCut Visual FX Filters (neon_glow, rgb_split)
    let fxFilter = '';
    if (isEffectActive && effect && effect.type !== 'none') {
      if (effect.type === 'neon_glow') {
        const glowFactor = (effect.intensity || 75) / 100;
        fxFilter = `drop-shadow(0 0 ${12 * glowFactor}px rgba(34,211,238,0.7)) contrast(1.15)`;
      } else if (effect.type === 'rgb_split') {
        const splitFactor = (effect.intensity || 75) / 100;
        fxFilter = `drop-shadow(-${3 * splitFactor}px 0 0 rgba(255,0,0,0.5)) drop-shadow(${3 * splitFactor}px 0 0 rgba(0,255,255,0.5))`;
      }
    }

    return `${baseFilter} ${adjFilter} ${fxFilter}`.trim() || 'none';
  };

  const getPositionStyles = (item: TextOverlay): React.CSSProperties => {
    if (item.position === 'custom') {
      return {
        position: 'absolute',
        left: `${item.xPercent ?? 50}%`,
        top: `${item.yPercent ?? 50}%`,
        transform: 'translate(-50%, -50%)',
      };
    }
    let top = '50%';
    if (item.position === 'top') top = '14%';
    if (item.position === 'bottom') top = '82%';

    let left = '50%';
    let transform = 'translate(-50%, -50%)';
    if (item.alignment === 'left') {
      left = '8%';
      transform = 'translate(0, -50%)';
    } else if (item.alignment === 'right') {
      left = '92%';
      transform = 'translate(-100%, -50%)';
    }

    return {
      position: 'absolute',
      left,
      top,
      transform,
    };
  };

  const handleOverlayPointerDown = (
    e: React.PointerEvent<any>,
    item: TextOverlay
  ) => {
    if (!onUpdateTextOverlay) return;
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
    setDraggingOverlayId(item.id);

    const calculateAndApply = (clientX: number, clientY: number) => {
      if (!framingRef.current) return;
      const rect = framingRef.current.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      const xPercent = Math.round(Math.max(5, Math.min(95, rawX)));
      const yPercent = Math.round(Math.max(5, Math.min(95, rawY)));

      onUpdateTextOverlay(item.id, {
        position: 'custom',
        xPercent,
        yPercent,
      });
    };

    calculateAndApply(e.clientX, e.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => {
      calculateAndApply(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      try {
        target.releasePointerCapture(upEvent.pointerId);
      } catch {}
      setDraggingOverlayId(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: StickerOverlay
  ) => {
    if (!onUpdateSticker) return;
    e.stopPropagation();
    e.preventDefault();

    onSelectSticker?.(item.id);
    setDraggingStickerId(item.id);

    const calculateAndApply = (clientX: number, clientY: number) => {
      if (!framingRef.current) return;
      const rect = framingRef.current.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      const xPercent = Math.round(Math.max(5, Math.min(95, rawX)));
      const yPercent = Math.round(Math.max(5, Math.min(95, rawY)));

      onUpdateSticker(item.id, {
        x: xPercent,
        y: yPercent,
      });
    };

    calculateAndApply(e.clientX, e.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => {
      calculateAndApply(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = () => {
      setDraggingStickerId(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };



  // CapCut Transition Calculations
  const transitionDuration = transition?.duration || 0.6;
  const inStartTrans = transition?.position !== 'end' && (startTrim !== undefined ? internalTime - startTrim : internalTime) < transitionDuration;
  const inEndTrans = transition?.position !== 'start' && endTrim !== undefined && (endTrim - internalTime) < transitionDuration;
  const isTransitioning = transition && transition.type !== 'none' && (inStartTrans || inEndTrans);

  // CapCut Slow Zoom progressive scale
  const slowZoomScale = isEffectActive && effect?.type === 'slow_zoom'
    ? 1 + ((internalTime - (effect.startTime ?? startTrim ?? 0)) / Math.max(1, (effect.endTime ?? endTrim ?? duration) - (effect.startTime ?? startTrim ?? 0))) * 0.15 * ((effect.intensity || 75) / 100)
    : 1;

  // CapCut Mirror transform
  const mirrorStyle = isEffectActive && effect?.type === 'mirror' ? 'scaleX(-1)' : '';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none group"
    >
      {/* Video Framing Container based on Aspect Ratio */}
      <div
        ref={framingRef}
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
          aspectRatio === '9:16'
            ? 'h-full aspect-[9/16] bg-zinc-950 shadow-2xl'
            : aspectRatio === '4:5'
            ? 'h-full aspect-[4/5] bg-zinc-950 shadow-2xl'
            : aspectRatio === '1:1'
            ? 'h-full max-w-full aspect-square bg-zinc-950 shadow-2xl'
            : aspectRatio === '16:9'
            ? 'w-full aspect-video bg-zinc-950 shadow-2xl'
            : 'w-full h-full bg-zinc-950'
        }`}
      >
        {/* Ambient Blurred Background Video (for 9:16, 4:5 and 1:1 format) */}
        {(aspectRatio === '9:16' || aspectRatio === '4:5' || aspectRatio === '1:1') && (
          <video
            ref={bgVideoRef}
            src={src}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-125 pointer-events-none"
          />
        )}

        {/* Foreground Main Video */}
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => {
            setInternalIsPlaying(true);
            onPlayChange?.(true);
            bgVideoRef.current?.play().catch(() => {});
          }}
          onPause={() => {
            setInternalIsPlaying(false);
            onPlayChange?.(false);
            bgVideoRef.current?.pause();
          }}
          onClick={togglePlay}
          playsInline
          style={{
            filter: getFilterStyle(),
            transform: `scale(${slowZoomScale}) ${mirrorStyle}`.trim() || undefined,
            animation: isEffectActive && effect?.type === 'shake' ? 'capcut-shake 0.12s infinite' : undefined,
          }}
          className={`relative z-10 cursor-pointer transition-all duration-200 ${
            aspectRatio === '9:16'
              ? 'max-h-full max-w-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)]'
              : aspectRatio === '4:5'
              ? 'max-h-full max-w-full object-contain drop-shadow-2xl'
              : aspectRatio === '1:1'
              ? 'max-h-full max-w-full object-contain drop-shadow-2xl'
              : aspectRatio === '16:9'
              ? 'w-full h-full object-contain'
              : 'max-h-full max-w-full object-contain'
          }`}
        />

        {/* Global Keyframes for CapCut Shake, Strobe & Glitch */}
        <style>{`
          @keyframes capcut-shake {
            0% { transform: translate(0, 0) scale(${slowZoomScale}); }
            20% { transform: translate(-3px, 2px) scale(${slowZoomScale}); }
            40% { transform: translate(3px, -2px) scale(${slowZoomScale}); }
            60% { transform: translate(-2px, -3px) scale(${slowZoomScale}); }
            80% { transform: translate(3px, 3px) scale(${slowZoomScale}); }
            100% { transform: translate(0, 0) scale(${slowZoomScale}); }
          }
          @keyframes capcut-strobe {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.85; }
          }
        `}</style>

        {/* CapCut FX: VHS 90s Camcorder Overlay */}
        {isEffectActive && effect?.type === 'vhs' && (
          <div className="absolute inset-0 pointer-events-none z-25 flex flex-col justify-between p-4 font-mono text-emerald-400 text-xs select-none">
            <div className="flex justify-between items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              <span className="flex items-center gap-1.5 font-bold tracking-wider text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" /> REC
              </span>
              <span className="text-[10px] tracking-widest border border-emerald-400 px-1 rounded text-emerald-300">
                SP 1080
              </span>
            </div>
            {/* Scanline pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
                backgroundSize: '100% 4px',
              }}
            />
            <div className="flex justify-between items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] text-[10px]">
              <span className="text-emerald-300">AUTO TRACKING</span>
              <span className="font-bold tracking-widest">
                00:{formatTime(internalTime)}:00
              </span>
            </div>
          </div>
        )}

        {/* CapCut FX: Beat Flash Strobe */}
        {isEffectActive && effect?.type === 'flash' && (
          <div
            className="absolute inset-0 bg-white pointer-events-none z-25"
            style={{ animation: 'capcut-strobe 0.22s infinite' }}
          />
        )}

        {/* CapCut FX: Film Grain Overlay */}
        {isEffectActive && effect?.type === 'film_grain' && (
          <div
            className="absolute inset-0 pointer-events-none z-25 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.25) 1px, transparent 1px)',
              backgroundSize: '4px 4px',
              backgroundPosition: '0 0, 2px 2px',
            }}
          />
        )}

        {/* CapCut Transitions Overlays */}
        {isTransitioning && transition?.type === 'flash_white' && (
          <div className="absolute inset-0 bg-white pointer-events-none z-35 animate-pulse transition-opacity duration-200" />
        )}
        {isTransitioning && transition?.type === 'flash_black' && (
          <div className="absolute inset-0 bg-black pointer-events-none z-35 animate-pulse transition-opacity duration-200" />
        )}
        {isTransitioning && transition?.type === 'fade' && (
          <div className="absolute inset-0 bg-black/80 pointer-events-none z-35 transition-opacity duration-300" />
        )}

        {/* CapCut Picture-in-Picture (PIP) & Watermark Overlay */}
        {watermark?.enabled && (
          <div
            className="absolute select-none pointer-events-none z-24 transition-all"
            style={{
              left: `${watermark.x}%`,
              top: `${watermark.y}%`,
              transform: `translate(-50%, -50%) scale(${watermark.scale || 1})`,
              opacity: (watermark.opacity || 80) / 100,
            }}
          >
            {watermark.url ? (
              <img
                src={watermark.url}
                alt="Watermark"
                className="max-h-16 max-w-[140px] object-contain drop-shadow-md"
              />
            ) : watermark.text ? (
              <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/20 text-white font-mono text-xs font-semibold drop-shadow-md">
                {watermark.text}
              </div>
            ) : null}
          </div>
        )}

        {/* Vignette Shadow Overlay (from adjustments) */}
        {adjustments?.vignette !== undefined && adjustments.vignette > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-15"
            style={{
              background: `radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, ${(adjustments.vignette / 100) * 0.85}) 100%)`,
            }}
          />
        )}

        {/* CapCut TikTok & Reels Safe Zone Guide Overlay */}
        <SafeZoneGuide visible={!!showSafeZone} aspectRatio={aspectRatio} />

        {/* Synchronized Overlay Background Music */}
        {overlayMusic?.url && (
          <audio
            ref={audioRef}
            src={overlayMusic.url}
            loop={overlayMusic.loop !== false}
            preload="auto"
          />
        )}

        {/* Central Play/Pause Flash Pulse */}
        {playPulse && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center animate-ping">
              {playPulse === 'play' ? (
                <Play className="w-8 h-8 fill-white ml-1" />
              ) : (
                <Pause className="w-8 h-8 fill-white" />
              )}
            </div>
          </div>
        )}

        {/* Real-time Draggable Kinetic Typography Overlays */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {textOverlays.map((item) => {
            const isDragging = draggingOverlayId === item.id;
            const posStyle = getPositionStyles(item);

            return (
              <div
                key={item.id}
                style={posStyle}
                className="select-none"
              >
                {/* Live Coordinates Pill while Dragging */}
                {isDragging && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-white/20 text-[10px] font-mono font-medium text-white shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1.5 z-40">
                    <Move className="w-2.5 h-2.5 text-zinc-400" />
                    <span>
                      X: {item.xPercent ?? 50}% · Y: {item.yPercent ?? 50}%
                    </span>
                  </div>
                )}
                {/* Subtle drag affordance indicator on hover */}
                {onUpdateTextOverlay && !isDragging && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center opacity-0 group-hover/overlay:opacity-100 transition-opacity shadow-md pointer-events-none z-30">
                    <Move className="w-3 h-3" />
                  </div>
                )}
                <KineticText
                  overlay={item}
                  currentTime={internalTime}
                  isDragging={isDragging}
                  onPointerDown={
                    onUpdateTextOverlay
                      ? (e) => handleOverlayPointerDown(e, item)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>

        {/* CapCut Draggable Interactive Stickers & Badges */}
        <div className="absolute inset-0 pointer-events-none z-22">
          {stickers.map((st) => {
            const isSelected = selectedStickerId === st.id;
            const isDragging = draggingStickerId === st.id;
            const opacity = st.opacity !== undefined ? st.opacity : 1.0;

            // Enforce timing window if defined (always show if currently selected for editing)
            if (!isSelected && st.startTime !== undefined && st.endTime !== undefined) {
              if (internalTime < st.startTime || internalTime > st.endTime) {
                return null;
              }
            }

            return (
              <div
                key={st.id}
                onPointerDown={(e) => handleStickerPointerDown(e, st)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSticker?.(st.id);
                }}
                className={`absolute select-none pointer-events-auto cursor-grab active:cursor-grabbing transition-[shadow,ring] ${
                  isDragging ? 'opacity-95 scale-105 ring-2 ring-purple-400 rounded-2xl shadow-2xl z-30' : ''
                } ${
                  isSelected && !isDragging
                    ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent rounded-2xl shadow-xl z-25'
                    : ''
                }`}
                style={{
                  left: `${st.x}%`,
                  top: `${st.y}%`,
                  transform: `translate(-50%, -50%) rotate(${st.rotation || 0}deg) scale(${st.scale || 1})`,
                  transformOrigin: 'center center',
                  opacity,
                }}
              >
                {/* Live Coordinates Pill while Dragging */}
                {isDragging && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-white/20 text-[10px] font-mono font-medium text-white shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1.5 z-40 backdrop-blur-xs">
                    <Move className="w-2.5 h-2.5 text-zinc-400" />
                    <span>
                      X: {st.x}% · Y: {st.y}%
                    </span>
                  </div>
                )}

                {/* Sticker Content Rendering by Type */}
                {st.type === 'emoji' ? (
                  <span className="text-5xl drop-shadow-2xl select-none leading-none filter">
                    {st.content}
                  </span>
                ) : st.type === 'image' ? (
                  <img
                    src={st.content}
                    alt={st.label || 'Sticker'}
                    className="max-w-[220px] max-h-[220px] w-auto h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
                    draggable={false}
                  />
                ) : (
                  <BadgeRenderer badgeKey={st.content} label={st.label} />
                )}

                {/* Selection Label Pill */}
                {isSelected && !isDragging && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-600 text-[9px] font-bold text-white shadow whitespace-nowrap pointer-events-none">
                    {st.label || 'Sticker'}
                  </div>
                )}
              </div>
            );
          })}
        </div>



        {/* On-Video Quick Floating Controls Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-200 flex items-center justify-between text-xs text-white ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              {effectiveIsPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = startTrim || 0;
                  if (bgVideoRef.current) bgVideoRef.current.currentTime = startTrim || 0;
                  videoRef.current.play().catch(() => {});
                  bgVideoRef.current?.play().catch(() => {});
                  setInternalIsPlaying(true);
                  onPlayChange?.(true);
                }
              }}
              title="Restart segment"
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[10px] text-zinc-300">
              {formatTime(internalTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1 text-zinc-300 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1 text-zinc-300 hover:text-white transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
