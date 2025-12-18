import React from 'react';

interface MobileHeaderProps {
  title: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBack, onOpenSettings }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4 md:hidden select-none">
      {/* Home Action */}
      <button 
        onClick={onBack}
        className="p-3 text-zinc-400 active:text-white active:scale-90 transition-all duration-300"
        aria-label="Return Home"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      {/* Title Context */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="text-amber-500 font-mono text-[11px] font-bold tracking-[0.4em] uppercase whitespace-nowrap">
          {title}
        </span>
      </div>

      {/* Settings/Sidebar Trigger */}
      <button 
        onClick={onOpenSettings}
        className="p-3 text-zinc-400 active:text-amber-500 active:scale-90 transition-all duration-300 flex items-center gap-2"
        aria-label="Open Settings"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-status"></div>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
    </header>
  );
};

export default MobileHeader;