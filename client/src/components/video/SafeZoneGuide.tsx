import React, { useState } from 'react';
import { ShieldCheck, Heart, MessageCircle, Share2, Disc, Search, Music2 } from 'lucide-react';

interface SafeZoneGuideProps {
  visible: boolean;
  aspectRatio: string;
}

export const SafeZoneGuide: React.FC<SafeZoneGuideProps> = ({ visible, aspectRatio }) => {
  const [platform, setPlatform] = useState<'tiktok' | 'reels'>('tiktok');

  if (!visible || aspectRatio !== '9:16') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden animate-fadeIn">
      {/* Platform Badge Indicator */}
      <div className="absolute top-3 left-3 pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-purple-400/40 text-[10px] text-purple-200 font-mono shadow-lg">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        <span className="font-semibold text-white">Safe Zone:</span>
        <button
          onClick={() => setPlatform(platform === 'tiktok' ? 'reels' : 'tiktok')}
          className="underline hover:text-white uppercase tracking-wider text-[9px]"
          title="Switch platform guide"
        >
          {platform === 'tiktok' ? 'TikTok' : 'IG Reels'}
        </button>
      </div>

      {/* Main Safe Area Frame (Green / Purple dashed border) */}
      <div className="absolute top-[8%] bottom-[22%] left-[4%] right-[17%] border-2 border-dashed border-purple-400/60 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] flex flex-col justify-between p-2">
        <div className="text-[9px] font-mono text-purple-300 font-semibold tracking-wider uppercase bg-slate-900/60 backdrop-blur-xs px-1.5 py-0.5 rounded self-start border border-purple-400/30">
          ✓ Safe Text & Subject Area
        </div>
      </div>

      {/* Danger Zone: Top Header (Search & Tabs) */}
      <div className="absolute top-0 inset-x-0 h-[8%] bg-gradient-to-b from-rose-950/40 to-transparent border-b border-rose-400/30 flex items-center justify-center">
        <div className="flex items-center gap-1 text-[9px] font-mono text-rose-300/90 font-medium px-2 py-0.5 rounded bg-rose-950/60 backdrop-blur-xs border border-rose-400/30">
          <Search className="w-2.5 h-2.5" />
          <span>Top Header & Search Zone</span>
        </div>
      </div>

      {/* Danger Zone: Right Action Bar (Like, Comment, Bookmark, Share, Sound) */}
      <div className="absolute top-[8%] bottom-[22%] right-0 w-[17%] bg-gradient-to-l from-rose-950/40 to-transparent border-l border-rose-400/30 flex flex-col items-center justify-end pb-3 gap-3">
        <div className="flex flex-col items-center gap-2 text-rose-300/80">
          <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-400/30 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 fill-rose-300/40" />
          </div>
          <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-400/30 flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5 fill-rose-300/40" />
          </div>
          <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-400/30 flex items-center justify-center">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-400/30 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
            <Disc className="w-3.5 h-3.5" />
          </div>
        </div>
        <span className="text-[8px] font-mono text-rose-300/80 text-center uppercase tracking-tighter px-1">
          Buttons
        </span>
      </div>

      {/* Danger Zone: Bottom Description & Username Area */}
      <div className="absolute bottom-0 inset-x-0 h-[22%] bg-gradient-to-t from-rose-950/60 via-rose-950/30 to-transparent border-t border-rose-400/30 p-3 flex flex-col justify-end">
        <div className="space-y-1.5 max-w-[80%]">
          <div className="h-2.5 w-24 bg-rose-300/40 rounded-full" />
          <div className="h-2 w-48 bg-rose-300/30 rounded-full" />
          <div className="h-2 w-36 bg-rose-300/25 rounded-full" />
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-rose-300/90 pt-1">
            <Music2 className="w-2.5 h-2.5" />
            <span>Platform Sound Title Bar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
