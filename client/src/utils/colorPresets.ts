export interface ColorPalette {
  id: string;
  name: string;
  creator: string;
  textColor: string;
  outlineColor: string;
  outlineWidth: number;
  shadowStyle: 'none' | 'soft' | 'hard' | 'glow';
  shadowColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  highlightColor: string;
}

export const CREATOR_PALETTES: ColorPalette[] = [
  {
    id: 'mrbeast',
    name: 'MrBeast Viral',
    creator: 'High CTR Yellow & Black',
    textColor: '#FFE600',
    outlineColor: '#000000',
    outlineWidth: 3,
    shadowStyle: 'hard',
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.75,
    highlightColor: '#FFE600',
  },
  {
    id: 'hormozi',
    name: 'Hormozi Electric',
    creator: 'Neon Lime & Black',
    textColor: '#22C55E',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowStyle: 'hard',
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.85,
    highlightColor: '#FACC15',
  },
  {
    id: 'tiktok-clean',
    name: 'TikTok Clean',
    creator: 'Crisp White & Dark Blur',
    textColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 1,
    shadowStyle: 'soft',
    shadowColor: 'rgba(0,0,0,0.8)',
    backgroundColor: '#18181B',
    backgroundOpacity: 0.65,
    highlightColor: '#38BDF8',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    creator: 'Cyan Glow & Magenta',
    textColor: '#06B6D4',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowStyle: 'glow',
    shadowColor: '#EC4899',
    backgroundColor: '#09090B',
    backgroundOpacity: 0.8,
    highlightColor: '#F43F5E',
  },
  {
    id: 'aesthetic-gold',
    name: 'Luxury Champagne',
    creator: 'Aesthetic Gold & Deep Black',
    textColor: '#F59E0B',
    outlineColor: '#78350F',
    outlineWidth: 1,
    shadowStyle: 'soft',
    shadowColor: 'rgba(0,0,0,0.9)',
    backgroundColor: '#1C1917',
    backgroundOpacity: 0.75,
    highlightColor: '#FCD34D',
  },
  {
    id: 'fire-red',
    name: 'Urgent Red',
    creator: 'High Contrast Red & White',
    textColor: '#EF4444',
    outlineColor: '#000000',
    outlineWidth: 3,
    shadowStyle: 'hard',
    shadowColor: '#000000',
    backgroundColor: '#000000',
    backgroundOpacity: 0.8,
    highlightColor: '#FFFFFF',
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    creator: 'Soft Aesthetic Purple',
    textColor: '#C084FC',
    outlineColor: '#3B0764',
    outlineWidth: 1,
    shadowStyle: 'glow',
    shadowColor: '#A855F7',
    backgroundColor: '#1E1B4B',
    backgroundOpacity: 0.65,
    highlightColor: '#F472B6',
  },
  {
    id: 'slate-minimal',
    name: 'Minimalist Clean',
    creator: 'Monochrome Documentary',
    textColor: '#F8FAFC',
    outlineColor: '#334155',
    outlineWidth: 1,
    shadowStyle: 'soft',
    shadowColor: 'rgba(0,0,0,0.6)',
    backgroundColor: '#0F172A',
    backgroundOpacity: 0.5,
    highlightColor: '#94A3B8',
  },
];

export const POPULAR_COLORS = [
  '#FFFFFF',
  '#FFE600',
  '#22C55E',
  '#06B6D4',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#A855F7',
  '#3B82F6',
  '#000000',
];

/**
 * Converts hex color string (#RRGGBB or #RGB) and opacity (0-1) to an rgba string.
 */
export const hexToRgba = (hex: string, opacity: number = 1): string => {
  if (!hex) return `rgba(0, 0, 0, ${opacity})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;

  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0, 0, 0, ${opacity})`;

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`;
};

/**
 * Computes CSS textShadow based on shadow style and shadow color.
 */
export const computeTextShadow = (style?: 'none' | 'soft' | 'hard' | 'glow', color: string = '#000000'): string => {
  switch (style) {
    case 'soft':
      return `0 4px 12px ${color}, 0 1px 3px rgba(0,0,0,0.8)`;
    case 'hard':
      return `3px 3px 0px ${color}, -2px -2px 0px ${color}, 2px -2px 0px ${color}, -2px 2px 0px ${color}`;
    case 'glow':
      return `0 0 10px ${color}, 0 0 20px ${color}, 0 0 35px ${color}`;
    case 'none':
    default:
      return 'none';
  }
};
