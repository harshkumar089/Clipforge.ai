export interface FontItem {
  id: string;
  name: string;
  family: string;
  category: 'viral' | 'sans' | 'serif' | 'handwriting' | 'gaming' | 'retro' | 'mono';
  popular?: boolean;
}

export interface CuratedShortFormFont {
  id: string;
  name: string;
  family: string;
  category: string;
  bestFor: string;
}

/**
 * Curated Top 10 High-Quality Fonts recommended specifically for Reels, Shorts, and TikTok
 */
export const CURATED_SHORT_FORM_FONTS: CuratedShortFormFont[] = [
  { id: 'inter', name: 'Inter', family: 'Inter', category: 'Clean Sans', bestFor: 'Captions & Tech' },
  { id: 'poppins', name: 'Poppins', family: 'Poppins', category: 'Geometric Sans', bestFor: 'Viral Reels' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat', category: 'Bold Display', bestFor: 'Impact Hooks' },
  { id: 'bebas-neue', name: 'Bebas Neue', family: 'Bebas Neue', category: 'Condensed Sans', bestFor: 'TikTok Titles' },
  { id: 'anton', name: 'Anton', family: 'Anton', category: 'Heavy Sans', bestFor: 'Urgent Headlines' },
  { id: 'oswald', name: 'Oswald', family: 'Oswald', category: 'Narrow Sans', bestFor: 'Shorts Hooks' },
  { id: 'dm-sans', name: 'DM Sans', family: 'DM Sans', category: 'Modern Sans', bestFor: 'Subtitles & Story' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: 'Space Grotesk', category: 'Neo-Grotesque', bestFor: 'Aesthetic / Gen-Z' },
  { id: 'archivo-black', name: 'Archivo Black', family: 'Archivo Black', category: 'Ultra Black', bestFor: 'High Contrast' },
  { id: 'plus-jakarta-sans', name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', category: 'Modern Sans', bestFor: 'Podcasts & Vlog' },
];

export const FONT_CATEGORIES = [
  { id: 'curated', label: '⭐ Top Reels & Shorts (10)' },
  { id: 'all', label: 'All Fonts (110)' },
  { id: 'viral', label: '🔥 Viral & Display' },
  { id: 'sans', label: 'Modern Sans' },
  { id: 'serif', label: 'Luxury Serif' },
  { id: 'handwriting', label: 'Handwriting & Brush' },
  { id: 'gaming', label: 'Gaming & Impact' },
  { id: 'retro', label: 'Retro & Vintage' },
  { id: 'mono', label: 'Tech & Mono' },
] as const;

export const FONTS_CATALOG: FontItem[] = [
  // --- 🔥 Viral & Bold Display (18) ---
  { id: 'bebas-neue', name: 'Bebas Neue', family: 'Bebas Neue', category: 'viral', popular: true },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat', category: 'viral', popular: true },
  { id: 'anton', name: 'Anton', family: 'Anton', category: 'viral', popular: true },
  { id: 'archivo-black', name: 'Archivo Black', family: 'Archivo Black', category: 'viral', popular: true },
  { id: 'poppins', name: 'Poppins', family: 'Poppins', category: 'viral', popular: true },
  { id: 'oswald', name: 'Oswald', family: 'Oswald', category: 'viral', popular: true },
  { id: 'rubik', name: 'Rubik', family: 'Rubik', category: 'viral', popular: true },
  { id: 'syne', name: 'Syne', family: 'Syne', category: 'viral', popular: true },
  { id: 'kanit', name: 'Kanit', family: 'Kanit', category: 'viral' },
  { id: 'barlow', name: 'Barlow', family: 'Barlow', category: 'viral' },
  { id: 'unbounded', name: 'Unbounded', family: 'Unbounded', category: 'viral', popular: true },
  { id: 'figtree', name: 'Figtree', family: 'Figtree', category: 'viral' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: 'Space Grotesk', category: 'viral' },
  { id: 'chivo', name: 'Chivo', family: 'Chivo', category: 'viral' },
  { id: 'sora', name: 'Sora', family: 'Sora', category: 'viral' },
  { id: 'lexend', name: 'Lexend', family: 'Lexend', category: 'viral' },
  { id: 'urbanist', name: 'Urbanist', family: 'Urbanist', category: 'viral', popular: true },
  { id: 'outfit', name: 'Outfit', family: 'Outfit', category: 'viral', popular: true },

  // --- Modern Sans-Serif (16) ---
  { id: 'inter', name: 'Inter', family: 'Inter', category: 'sans', popular: true },
  { id: 'roboto', name: 'Roboto', family: 'Roboto', category: 'sans' },
  { id: 'work-sans', name: 'Work Sans', family: 'Work Sans', category: 'sans' },
  { id: 'raleway', name: 'Raleway', family: 'Raleway', category: 'sans' },
  { id: 'dm-sans', name: 'DM Sans', family: 'DM Sans', category: 'sans', popular: true },
  { id: 'plus-jakarta-sans', name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', category: 'sans', popular: true },
  { id: 'cabin', name: 'Cabin', family: 'Cabin', category: 'sans' },
  { id: 'nunito', name: 'Nunito', family: 'Nunito', category: 'sans' },
  { id: 'albert-sans', name: 'Albert Sans', family: 'Albert Sans', category: 'sans' },
  { id: 'public-sans', name: 'Public Sans', family: 'Public Sans', category: 'sans' },
  { id: 'manrope', name: 'Manrope', family: 'Manrope', category: 'sans' },
  { id: 'heebo', name: 'Heebo', family: 'Heebo', category: 'sans' },
  { id: 'prompt', name: 'Prompt', family: 'Prompt', category: 'sans' },
  { id: 'red-hat-display', name: 'Red Hat Display', family: 'Red Hat Display', category: 'sans' },
  { id: 'quicksand', name: 'Quicksand', family: 'Quicksand', category: 'sans' },
  { id: 'karla', name: 'Karla', family: 'Karla', category: 'sans' },

  // --- Luxury & Editorial Serif (16) ---
  { id: 'playfair-display', name: 'Playfair Display', family: 'Playfair Display', category: 'serif', popular: true },
  { id: 'cinzel', name: 'Cinzel', family: 'Cinzel', category: 'serif', popular: true },
  { id: 'merriweather', name: 'Merriweather', family: 'Merriweather', category: 'serif' },
  { id: 'lora', name: 'Lora', family: 'Lora', category: 'serif' },
  { id: 'cormorant-garamond', name: 'Cormorant Garamond', family: 'Cormorant Garamond', category: 'serif', popular: true },
  { id: 'bodoni-moda', name: 'Bodoni Moda', family: 'Bodoni Moda', category: 'serif' },
  { id: 'prata', name: 'Prata', family: 'Prata', category: 'serif' },
  { id: 'abril-fatface', name: 'Abril Fatface', family: 'Abril Fatface', category: 'serif', popular: true },
  { id: 'dm-serif-display', name: 'DM Serif Display', family: 'DM Serif Display', category: 'serif' },
  { id: 'fraunces', name: 'Fraunces', family: 'Fraunces', category: 'serif' },
  { id: 'castoro', name: 'Castoro', family: 'Castoro', category: 'serif' },
  { id: 'spectral', name: 'Spectral', family: 'Spectral', category: 'serif' },
  { id: 'cardo', name: 'Cardo', family: 'Cardo', category: 'serif' },
  { id: 'cinzel-decorative', name: 'Cinzel Decorative', family: 'Cinzel Decorative', category: 'serif' },
  { id: 'marcellus', name: 'Marcellus', family: 'Marcellus', category: 'serif' },
  { id: 'italiana', name: 'Italiana', family: 'Italiana', category: 'serif' },

  // --- Handwriting & Brush (16) ---
  { id: 'pacifico', name: 'Pacifico', family: 'Pacifico', category: 'handwriting', popular: true },
  { id: 'caveat', name: 'Caveat', family: 'Caveat', category: 'handwriting', popular: true },
  { id: 'dancing-script', name: 'Dancing Script', family: 'Dancing Script', category: 'handwriting', popular: true },
  { id: 'satisfy', name: 'Satisfy', family: 'Satisfy', category: 'handwriting' },
  { id: 'kalam', name: 'Kalam', family: 'Kalam', category: 'handwriting' },
  { id: 'shadows-into-light', name: 'Shadows Into Light', family: 'Shadows Into Light', category: 'handwriting' },
  { id: 'indie-flower', name: 'Indie Flower', family: 'Indie Flower', category: 'handwriting' },
  { id: 'great-vibes', name: 'Great Vibes', family: 'Great Vibes', category: 'handwriting' },
  { id: 'sacramento', name: 'Sacramento', family: 'Sacramento', category: 'handwriting' },
  { id: 'yellowtail', name: 'Yellowtail', family: 'Yellowtail', category: 'handwriting' },
  { id: 'marck-script', name: 'Marck Script', family: 'Marck Script', category: 'handwriting' },
  { id: 'gochi-hand', name: 'Gochi Hand', family: 'Gochi Hand', category: 'handwriting' },
  { id: 'patrick-hand', name: 'Patrick Hand', family: 'Patrick Hand', category: 'handwriting' },
  { id: 'courgette', name: 'Courgette', family: 'Courgette', category: 'handwriting' },
  { id: 'gloria-hallelujah', name: 'Gloria Hallelujah', family: 'Gloria Hallelujah', category: 'handwriting' },
  { id: 'alex-brush', name: 'Alex Brush', family: 'Alex Brush', category: 'handwriting' },

  // --- Gaming, Meme & Impact (15) ---
  { id: 'bangers', name: 'Bangers', family: 'Bangers', category: 'gaming', popular: true },
  { id: 'luckiest-guy', name: 'Luckiest Guy', family: 'Luckiest Guy', category: 'gaming', popular: true },
  { id: 'permanent-marker', name: 'Permanent Marker', family: 'Permanent Marker', category: 'gaming', popular: true },
  { id: 'bungee', name: 'Bungee', family: 'Bungee', category: 'gaming', popular: true },
  { id: 'black-han-sans', name: 'Black Han Sans', family: 'Black Han Sans', category: 'gaming' },
  { id: 'titan-one', name: 'Titan One', family: 'Titan One', category: 'gaming', popular: true },
  { id: 'righteous', name: 'Righteous', family: 'Righteous', category: 'gaming' },
  { id: 'russo-one', name: 'Russo One', family: 'Russo One', category: 'gaming' },
  { id: 'press-start-2p', name: 'Press Start 2P', family: '"Press Start 2P"', category: 'gaming', popular: true },
  { id: 'silkscreen', name: 'Silkscreen', family: 'Silkscreen', category: 'gaming' },
  { id: 'audiowide', name: 'Audiowide', family: 'Audiowide', category: 'gaming' },
  { id: 'orbitron', name: 'Orbitron', family: 'Orbitron', category: 'gaming', popular: true },
  { id: 'exo-2', name: 'Exo 2', family: 'Exo 2', category: 'gaming' },
  { id: 'bungee-shade', name: 'Bungee Shade', family: 'Bungee Shade', category: 'gaming' },
  { id: 'faster-one', name: 'Faster One', family: 'Faster One', category: 'gaming' },

  // --- Retro, Vintage & Western (15) ---
  { id: 'rye', name: 'Rye', family: 'Rye', category: 'retro', popular: true },
  { id: 'sancreek', name: 'Sancreek', family: 'Sancreek', category: 'retro' },
  { id: 'creepster', name: 'Creepster', family: 'Creepster', category: 'retro' },
  { id: 'special-elite', name: 'Special Elite', family: 'Special Elite', category: 'retro', popular: true },
  { id: 'monoton', name: 'Monoton', family: 'Monoton', category: 'retro', popular: true },
  { id: 'vast-shadow', name: 'Vast Shadow', family: 'Vast Shadow', category: 'retro' },
  { id: 'alfa-slab-one', name: 'Alfa Slab One', family: 'Alfa Slab One', category: 'retro', popular: true },
  { id: 'shrikhand', name: 'Shrikhand', family: 'Shrikhand', category: 'retro' },
  { id: 'smokum', name: 'Smokum', family: 'Smokum', category: 'retro' },
  { id: 'fredericka-the-great', name: 'Fredericka the Great', family: 'Fredericka the Great', category: 'retro' },
  { id: 'ultra', name: 'Ultra', family: 'Ultra', category: 'retro' },
  { id: 'limelight', name: 'Limelight', family: 'Limelight', category: 'retro' },
  { id: 'bungee-inline', name: 'Bungee Inline', family: 'Bungee Inline', category: 'retro' },
  { id: 'ribeye', name: 'Ribeye', family: 'Ribeye', category: 'retro' },
  { id: 'kelly-slab', name: 'Kelly Slab', family: 'Kelly Slab', category: 'retro' },

  // --- Tech & Monospace (14) ---
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: 'JetBrains Mono', category: 'mono', popular: true },
  { id: 'fira-code', name: 'Fira Code', family: 'Fira Code', category: 'mono', popular: true },
  { id: 'space-mono', name: 'Space Mono', family: 'Space Mono', category: 'mono', popular: true },
  { id: 'roboto-mono', name: 'Roboto Mono', family: 'Roboto Mono', category: 'mono' },
  { id: 'share-tech-mono', name: 'Share Tech Mono', family: 'Share Tech Mono', category: 'mono' },
  { id: 'inconsolata', name: 'Inconsolata', family: 'Inconsolata', category: 'mono' },
  { id: 'source-code-pro', name: 'Source Code Pro', family: 'Source Code Pro', category: 'mono' },
  { id: 'vt323', name: 'VT323', family: 'VT323', category: 'mono', popular: true },
  { id: 'major-mono-display', name: 'Major Mono Display', family: 'Major Mono Display', category: 'mono' },
  { id: 'nova-mono', name: 'Nova Mono', family: 'Nova Mono', category: 'mono' },
  { id: 'courier-prime', name: 'Courier Prime', family: 'Courier Prime', category: 'mono' },
  { id: 'overpass-mono', name: 'Overpass Mono', family: 'Overpass Mono', category: 'mono' },
  { id: 'anonymous-pro', name: 'Anonymous Pro', family: 'Anonymous Pro', category: 'mono' },
  { id: 'cutive-mono', name: 'Cutive Mono', family: 'Cutive Mono', category: 'mono' },
];

// Cache of loaded fonts
const loadedFontsSet = new Set<string>();

/**
 * Dynamically loads a Google Font by family name on demand into document.head.
 * Only loads requested weights to minimize network payload.
 */
export const loadGoogleFont = (fontFamily: string, weights: number[] = [400, 700, 800]) => {
  if (!fontFamily || typeof document === 'undefined') return;

  // Clean up font family name
  const cleanFamily = fontFamily.replace(/['"]/g, '').trim();
  if (!cleanFamily || loadedFontsSet.has(cleanFamily)) return;

  const fontId = `gfont-${cleanFamily.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId)) {
    loadedFontsSet.add(cleanFamily);
    return;
  }

  const weightStr = weights.join(';');
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFamily)}:wght@${weightStr}&display=swap`;
  document.head.appendChild(link);
  loadedFontsSet.add(cleanFamily);
};

/**
 * Preload only essential viral starter fonts
 */
export const preloadPopularFonts = () => {
  ['Bebas Neue', 'Montserrat', 'Inter', 'Poppins'].forEach((f) => loadGoogleFont(f, [400, 700]));
};
