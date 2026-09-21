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
  | 'fade_in';

export interface KineticPresetMeta {
  id: TextAnimationType;
  name: string;
  defaultDuration: number;
  defaultDelay: number;
  defaultIntensity: number;
}

export const KINETIC_PRESETS: Record<string, KineticPresetMeta> = {
  none: { id: 'none', name: 'Static', defaultDuration: 0.5, defaultDelay: 0, defaultIntensity: 50 },
  pop: { id: 'pop', name: 'Pop', defaultDuration: 0.55, defaultDelay: 0, defaultIntensity: 80 },
  bounce: { id: 'bounce', name: 'Bounce', defaultDuration: 0.7, defaultDelay: 0, defaultIntensity: 75 },
  typewriter: { id: 'typewriter', name: 'Typewriter', defaultDuration: 0.9, defaultDelay: 0, defaultIntensity: 60 },
  fade_up: { id: 'fade_up', name: 'Fade Up', defaultDuration: 0.6, defaultDelay: 0, defaultIntensity: 70 },
  slide_up: { id: 'slide_up', name: 'Slide Up', defaultDuration: 0.5, defaultDelay: 0, defaultIntensity: 85 },
  scale_in: { id: 'scale_in', name: 'Scale In', defaultDuration: 0.5, defaultDelay: 0, defaultIntensity: 75 },
  word_highlight: { id: 'word_highlight', name: 'Word Highlight', defaultDuration: 0.8, defaultDelay: 0, defaultIntensity: 85 },
  character_reveal: { id: 'character_reveal', name: 'Character Reveal', defaultDuration: 0.85, defaultDelay: 0, defaultIntensity: 80 },
  glitch: { id: 'glitch', name: 'Glitch', defaultDuration: 0.45, defaultDelay: 0, defaultIntensity: 90 },
  punch: { id: 'punch', name: 'Punch / Impact', defaultDuration: 0.45, defaultDelay: 0, defaultIntensity: 95 },
  karaoke: { id: 'karaoke', name: 'Karaoke', defaultDuration: 1.2, defaultDelay: 0, defaultIntensity: 70 },
  smooth_tracking: { id: 'smooth_tracking', name: 'Smooth Tracking', defaultDuration: 0.75, defaultDelay: 0, defaultIntensity: 80 },
  fade_in: { id: 'fade_in', name: 'Fade Up', defaultDuration: 0.6, defaultDelay: 0, defaultIntensity: 70 },
};
