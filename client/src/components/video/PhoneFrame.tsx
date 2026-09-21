import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  active?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children, active = true }) => {
  if (!active) {
    return <div className="w-full h-full flex items-center justify-center">{children}</div>;
  }

  return (
    <div className="relative mx-auto flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Outer Phone Hardware */}
      <div className="relative w-[300px] sm:w-[320px] md:w-[350px] aspect-[9/19] rounded-[44px] bg-slate-950 p-3 shadow-[0_20px_50px_rgba(147,51,234,0.18),0_10px_25px_rgba(0,0,0,0.12)] border-[4px] border-slate-800 ring-1 ring-purple-500/20">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse"></div>
        </div>

        {/* Status Bar */}
        <div className="absolute top-5 left-8 right-8 z-20 flex items-center justify-between text-[11px] font-semibold text-white/90">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-white/90">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Screen Bezel & Video Canvas */}
        <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-black flex items-center justify-center">
          {children}

          {/* Home Bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/60 rounded-full z-30"></div>
        </div>
      </div>
    </div>
  );
};
