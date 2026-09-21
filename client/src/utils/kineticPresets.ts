import { TextAnimationType } from '../types/index.js';

export interface KineticPresetMeta {
  id: TextAnimationType;
  name: string;
  badge: string;
  description: string;
  defaultDuration: number; // in seconds (speed)
  defaultDelay: number;    // in seconds
  defaultIntensity: number;// 10 - 100
  category: 'spring' | 'entrance' | 'reveal' | 'impact' | 'stylized';
  previewStyle: {
    transform?: string;
    opacity?: number;
    letterSpacing?: string;
  };
}

export const KINETIC_PRESETS: Record<TextAnimationType, KineticPresetMeta> = {
  none: {
    id: 'none',
    name: 'Static / None',
    badge: '⏸',
    description: 'Clean static typography with zero motion',
    defaultDuration: 0.5,
    defaultDelay: 0,
    defaultIntensity: 50,
    category: 'entrance',
    previewStyle: {},
  },
  pop: {
    id: 'pop',
    name: 'Pop',
    badge: '💥',
    description: 'Energetic spring bounce with scale overshoot',
    defaultDuration: 0.55,
    defaultDelay: 0,
    defaultIntensity: 80,
    category: 'spring',
    previewStyle: { transform: 'scale(1.15)' },
  },
  bounce: {
    id: 'bounce',
    name: 'Bounce',
    badge: '🏀',
    description: 'Playful vertical drop with elastic ground rebound',
    defaultDuration: 0.7,
    defaultDelay: 0,
    defaultIntensity: 75,
    category: 'spring',
    previewStyle: { transform: 'translateY(-8px)' },
  },
  typewriter: {
    id: 'typewriter',
    name: 'Typewriter',
    badge: '⌨️',
    description: 'Mechanical letter-by-letter reveal with pulsing cursor',
    defaultDuration: 0.9,
    defaultDelay: 0,
    defaultIntensity: 60,
    category: 'reveal',
    previewStyle: {},
  },
  fade_up: {
    id: 'fade_up',
    name: 'Fade Up',
    badge: '⬆️',
    description: 'Silky smooth upward drift with soft opacity bloom',
    defaultDuration: 0.6,
    defaultDelay: 0,
    defaultIntensity: 70,
    category: 'entrance',
    previewStyle: { transform: 'translateY(-4px)', opacity: 0.9 },
  },
  slide_up: {
    id: 'slide_up',
    name: 'Slide Up',
    badge: '🚀',
    description: 'Snappy upward entrance from bottom with cubic momentum',
    defaultDuration: 0.5,
    defaultDelay: 0,
    defaultIntensity: 85,
    category: 'entrance',
    previewStyle: { transform: 'translateY(-6px)' },
  },
  scale_in: {
    id: 'scale_in',
    name: 'Scale In',
    badge: '🔍',
    description: 'Clean modern zoom from center into crisp focus',
    defaultDuration: 0.5,
    defaultDelay: 0,
    defaultIntensity: 75,
    category: 'entrance',
    previewStyle: { transform: 'scale(1.08)' },
  },
  word_highlight: {
    id: 'word_highlight',
    name: 'Word Highlight',
    badge: '✨',
    description: 'Dynamic word emphasis pulse for viral hooks',
    defaultDuration: 0.8,
    defaultDelay: 0,
    defaultIntensity: 85,
    category: 'reveal',
    previewStyle: {},
  },
  character_reveal: {
    id: 'character_reveal',
    name: 'Character Reveal',
    badge: '🔤',
    description: 'Staggered cascading typography drop per character',
    defaultDuration: 0.85,
    defaultDelay: 0,
    defaultIntensity: 80,
    category: 'reveal',
    previewStyle: {},
  },
  glitch: {
    id: 'glitch',
    name: 'Glitch',
    badge: '⚡',
    description: 'Cyberpunk RGB chromatic distortion & position jitter',
    defaultDuration: 0.45,
    defaultDelay: 0,
    defaultIntensity: 90,
    category: 'stylized',
    previewStyle: { transform: 'translate(2px, -1px)' },
  },
  punch: {
    id: 'punch',
    name: 'Punch / Impact',
    badge: '🥊',
    description: 'Aggressive camera slam with recoil shockwave',
    defaultDuration: 0.45,
    defaultDelay: 0,
    defaultIntensity: 95,
    category: 'impact',
    previewStyle: { transform: 'scale(1.2)' },
  },
  karaoke: {
    id: 'karaoke',
    name: 'Karaoke',
    badge: '🎤',
    description: 'Synchronized progressive gradient highlight sweep',
    defaultDuration: 1.2,
    defaultDelay: 0,
    defaultIntensity: 70,
    category: 'reveal',
    previewStyle: {},
  },
  smooth_tracking: {
    id: 'smooth_tracking',
    name: 'Smooth Tracking',
    badge: '↔️',
    description: 'Cinematic wide letter-spacing compressing into place',
    defaultDuration: 0.75,
    defaultDelay: 0,
    defaultIntensity: 80,
    category: 'stylized',
    previewStyle: { letterSpacing: '4px' },
  },
  fade_in: {
    id: 'fade_in',
    name: 'Fade Up',
    badge: '⬆️',
    description: 'Alias for Fade Up',
    defaultDuration: 0.6,
    defaultDelay: 0,
    defaultIntensity: 70,
    category: 'entrance',
    previewStyle: { opacity: 0.9 },
  },
};

export const KINETIC_PRESETS_LIST = Object.values(KINETIC_PRESETS).filter(
  (p) => p.id !== 'fade_in' && p.id !== 'none'
);
