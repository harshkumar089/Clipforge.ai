export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
}

export interface Video {
  id: string;
  title: string;
  originalFileName: string;
  duration: number; // in seconds
  fileSize: number;
  thumbnailUrl: string | null;
  videoUrl?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  clipCount: number;
  metadata?: {
    width?: number;
    height?: number;
    codec?: string;
    fps?: number;
    bitrate?: number;
    hasAudio?: boolean;
  };
  createdAt: string;
}

export interface Clip {
  id: string;
  videoId: string;
  videoTitle?: string;
  videoUrl?: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  reason: string;
  thumbnailUrl: string | null;
  clipUrl: string | null;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export type TextAnimationType =
  | 'none'
  | 'pop'
  | 'bounce'
  | 'typewriter'
  | 'fade_up'
  | 'slide_up'
  | 'scale_in'
  | 'word_highlight'
  | 'character_reveal'
  | 'glitch'
  | 'punch'
  | 'karaoke'
  | 'smooth_tracking'
  | 'fade_in'; // legacy compatibility alias for fade_up

export interface TextOverlay {
  id: string;
  text: string;
  fontSize: number;
  fontWeight?: number | string; // 400, 600, 700, 800, 900
  lineHeight?: number; // e.g. 1.0 to 2.2
  color: string;
  position: 'top' | 'center' | 'bottom' | 'custom';
  xPercent?: number;
  yPercent?: number;
  isBold: boolean;
  alignment: 'left' | 'center' | 'right';
  startTime: number;
  endTime: number;
  fontFamily?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowStyle?: 'none' | 'soft' | 'hard' | 'glow';
  shadowColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  isUppercase?: boolean;
  letterSpacing?: number;
  animation?: TextAnimationType;
  animationDuration?: number; // 0.2 to 2.5s (Speed)
  animationDelay?: number;    // 0.0 to 3.0s (Delay)
  animationIntensity?: number;// 10 to 100 (Intensity / Spring force)
}

export type VideoFilterType =
  | 'normal'
  | 'bright'
  | 'contrast'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'vibrant'
  | 'vintage'
  | 'faded'
  | 'dramatic'
  | 'cyberpunk'
  | 'grayscale';

export interface ColorAdjustments {
  brightness: number; // -50 to 50, default 0
  contrast: number;   // -50 to 50, default 0
  saturation: number; // -50 to 50, default 0
  warmth: number;     // -50 to 50, default 0
  vignette: number;   // 0 to 100, default 0
}

export interface StickerOverlay {
  id: string;
  type: 'badge' | 'emoji' | 'callout' | 'arrow' | 'image';
  content: string; // emoji char, badge key, or image data-url / URL
  label?: string;
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  scale: number; // 0.5 to 2.5
  rotation: number; // -180 to 180
  opacity?: number; // 0.1 to 1.0
  animation?: 'none' | 'pop' | 'pulse' | 'bounce' | 'float';
  startTime?: number;
  endTime?: number;
}

export interface OverlayMusic {
  url: string;
  fileName?: string;
  name: string;
  originalName?: string;
  volume: number; // 0 to 150 (%)
  loop: boolean;
  startTime?: number; // start time on timeline or offset
  endTime?: number;   // end time on timeline
  duration?: number;
  artist?: string;
  fadeIn?: number; // seconds (0 to 5)
  fadeOut?: number; // seconds (0 to 5)
}

// CapCut Video Transitions
export type TransitionType =
  | 'none'
  | 'fade'
  | 'flash_white'
  | 'flash_black'
  | 'zoom_in'
  | 'zoom_out'
  | 'slide_left'
  | 'slide_right'
  | 'glitch'
  | 'blur';

export interface VideoTransition {
  type: TransitionType;
  duration: number; // 0.2 to 2.0s
  position: 'start' | 'end' | 'both';
}

// CapCut Visual Effects (FX)
export type EffectType =
  | 'none'
  | 'shake'
  | 'rgb_split'
  | 'flash'
  | 'vhs'
  | 'slow_zoom'
  | 'neon_glow'
  | 'film_grain'
  | 'mirror';

export interface VideoEffect {
  type: EffectType;
  intensity: number; // 0 to 100
  speed: number;     // 0.5 to 2.0
  startTime?: number; // start time on timeline
  endTime?: number;   // end time on timeline
}

// CapCut Speed Curves & Velocity
export type SpeedCurveMode = 'constant' | 'montage' | 'bullet' | 'flash_in' | 'jump_cut';

export interface SpeedCurve {
  mode: SpeedCurveMode;
  curvePoints?: Array<{ progress: number; speed: number }>;
}

// CapCut Viral Sound Effects (SFX)
export type SfxType =
  | 'whoosh'
  | 'ding'
  | 'pop'
  | 'shutter'
  | 'thud'
  | 'glitch'
  | 'cheer'
  | 'airhorn';

export interface SoundEffectItem {
  id: string;
  name: string;
  category: 'transition' | 'reaction' | 'meme' | 'impact';
  time: number; // timestamp in seconds where SFX triggers
  volume: number; // 0 to 150 (%)
  type: SfxType;
}

// CapCut Voice Effects / Audio Modifiers
export type VoiceEffectType = 'none' | 'deep' | 'chipmunk' | 'robot' | 'echo' | 'telephone';

export interface VoiceEffect {
  type: VoiceEffectType;
  intensity: number; // 0 to 100
}

// CapCut Picture-in-Picture (PIP) & Watermark Overlay
export interface WatermarkPip {
  enabled: boolean;
  url?: string;
  text?: string;
  x: number; // 0 to 100%
  y: number; // 0 to 100%
  scale: number; // 0.2 to 2.0
  opacity: number; // 0 to 100%
}

// CapCut Keyframe Point
export interface KeyframePoint {
  id: string;
  time: number;
  scale?: number;
  x?: number;
  y?: number;
  opacity?: number;
}

export interface ProjectEdits {
  startTime: number;
  endTime: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  filter: VideoFilterType;
  filterIntensity?: number;
  speed: number;
  speedCurve?: SpeedCurve;
  volume: number;
  overlayMusic?: OverlayMusic;
  textOverlays: TextOverlay[];
  adjustments?: ColorAdjustments;
  stickers?: StickerOverlay[];
  transition?: VideoTransition;
  effect?: VideoEffect;
  soundEffects?: SoundEffectItem[];
  voiceEffect?: VoiceEffect;
  watermark?: WatermarkPip;
  keyframes?: KeyframePoint[];
}

export interface Project {
  id: string;
  edits: ProjectEdits;
  exportSettings: {
    resolution: '720p' | '1080p' | '4k';
    format: 'mp4';
    fps: number;
  };
}
