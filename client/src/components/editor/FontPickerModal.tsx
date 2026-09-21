import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, Type, Sparkles, Flame } from 'lucide-react';
import { FONTS_CATALOG, FONT_CATEGORIES, CURATED_SHORT_FORM_FONTS, loadGoogleFont, FontItem } from '../../utils/fonts.js';

interface FontPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFont?: string;
  currentFont?: string;
  onSelectFont: (fontFamily: string) => void;
  title?: string;
  previewText?: string;
}

export const FontPickerModal: React.FC<FontPickerModalProps> = ({
  isOpen,
  onClose,
  selectedFont,
  currentFont,
  onSelectFont,
  title = 'Select Typography (110+ Fonts)',
  previewText: initialPreviewText,
}) => {
  const effectiveFont = currentFont || selectedFont || 'Inter';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('curated');
  const [previewText, setPreviewText] = useState(initialPreviewText || 'VIRAL HOOK');

  // Load fonts as the modal opens and as user filters
  useEffect(() => {
    if (!isOpen) return;

    // Load curated fonts immediately
    CURATED_SHORT_FORM_FONTS.forEach((f) => loadGoogleFont(f.family));
    // Load initial batch of visible fonts
    const initialFonts = FONTS_CATALOG.slice(0, 30);
    initialFonts.forEach((f) => loadGoogleFont(f.family));
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Curated font families set for fast lookup
  const curatedFamiliesSet = useMemo(() => {
    return new Set(CURATED_SHORT_FORM_FONTS.map((f) => f.family.toLowerCase()));
  }, []);

  // Filtered fonts list
  const filteredFonts = useMemo(() => {
    return FONTS_CATALOG.filter((item) => {
      const isCurated = curatedFamiliesSet.has(item.family.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'curated' && isCurated) ||
        item.category === activeCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (isCurated && 'curated short reel tiktok'.includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory, curatedFamiliesSet]);

  // Ensure visible filtered fonts are loaded
  useEffect(() => {
    if (!isOpen) return;
    filteredFonts.slice(0, 40).forEach((f) => loadGoogleFont(f.family));
  }, [filteredFonts, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#120a26] border border-purple-100 dark:border-purple-800/80 rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(168,85,247,0.4)] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between shrink-0 bg-purple-50/30 dark:bg-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {title}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-mono font-semibold">
                  {FONTS_CATALOG.length} fonts
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/60">Click any typography to preview & apply</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 dark:text-purple-300/60 hover:text-slate-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Bar: Search & Custom Preview Text */}
        <div className="p-4 border-b border-purple-100 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/30 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search font by name (e.g. Bebas, Anton, Syne)..."
                className="w-full bg-white dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-300/40 focus:outline-none focus:border-purple-400 dark:focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Sample Text Input */}
            <div className="relative flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-purple-300/70 whitespace-nowrap shrink-0 font-medium">Preview:</span>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Type preview text..."
                className="w-full bg-white dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-300/40 focus:outline-none focus:border-purple-400 dark:focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FONT_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'bg-purple-50/70 dark:bg-purple-950/40 text-slate-600 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-white border border-purple-100 dark:border-purple-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Curated 10 Quick Bar */}
          <div className="pt-2 border-t border-purple-100/60 dark:border-purple-900/40 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1 shrink-0">
              <Flame className="w-3 h-3 text-amber-500" />
              Top 10 Viral:
            </span>
            {CURATED_SHORT_FORM_FONTS.map((cf) => {
              const isSel = effectiveFont.toLowerCase() === cf.family.toLowerCase();
              return (
                <button
                  key={cf.id}
                  onClick={() => {
                    loadGoogleFont(cf.family);
                    onSelectFont(cf.family);
                    onClose();
                  }}
                  onMouseEnter={() => loadGoogleFont(cf.family)}
                  title={`${cf.family} - Best for: ${cf.bestFor}`}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                    isSel
                      ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                      : 'bg-white dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-slate-800 dark:text-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/40'
                  }`}
                  style={{ fontFamily: `${cf.family}, sans-serif` }}
                >
                  <span>{cf.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 custom-scrollbar">
          {filteredFonts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 dark:text-purple-300/50 space-y-2">
              <Type className="w-8 h-8 mx-auto text-purple-300 dark:text-purple-500" />
              <p className="text-xs">No fonts found matching "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="text-xs text-purple-700 dark:text-purple-400 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isSelected = effectiveFont.toLowerCase() === font.family.toLowerCase();

              return (
                <button
                  key={font.id}
                  onClick={() => {
                    loadGoogleFont(font.family);
                    onSelectFont(font.family);
                    onClose();
                  }}
                  onMouseEnter={() => loadGoogleFont(font.family)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all group cursor-pointer ${
                    isSelected
                      ? 'border-purple-400 dark:border-purple-500 bg-purple-50/80 dark:bg-purple-900/50 shadow-xs ring-1 ring-purple-300 dark:ring-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'border-purple-100 dark:border-purple-900/40 bg-white dark:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-900/40 shadow-xs'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-purple-100 group-hover:text-purple-900 dark:group-hover:text-white transition-colors">
                        {font.name}
                      </span>
                      {font.popular && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Live Rendered Font Preview */}
                  <div
                    style={{
                      fontFamily: `${font.family}, sans-serif`,
                    }}
                    className="w-full min-h-[44px] flex items-center justify-center py-2 px-3 rounded-lg bg-purple-50/40 border border-purple-100 text-lg text-slate-900 font-medium tracking-wide text-center break-words select-none transition-all group-hover:text-purple-700"
                  >
                    {previewText || font.name}
                  </div>

                  <div className="w-full flex items-center justify-between text-[10px] text-slate-500">
                    <span className="capitalize">{font.category}</span>
                    <span className="text-[9px] font-mono text-purple-600/70 group-hover:text-purple-700 font-medium">
                      {font.family}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-purple-100 bg-purple-50/20 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-slate-600">Selected: <strong className="text-purple-700 font-semibold">{effectiveFont}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
