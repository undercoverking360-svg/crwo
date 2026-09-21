import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface CRWOLoaderProps {
  statusText?: string;
  isFullScreen?: boolean;
}

export const CRWOLoader: React.FC<CRWOLoaderProps> = ({
  statusText = 'INITIALIZING SECURE PROTOCOLS...',
  isFullScreen = true
}) => {
  return (
    <div
      className={`${
        isFullScreen ? 'fixed inset-0 z-[99999]' : 'relative w-full py-16'
      } flex flex-col items-center justify-center bg-[#020617] text-slate-100 overflow-hidden select-none`}
    >
      {/* 1. PULSE DOT-MATRIX FULLSCREEN BACKGROUND */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 animate-[pulse_3s_ease-in-out_infinite]"
        style={{
          backgroundImage: 'radial-gradient(rgba(45, 212, 191, 0.5) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* 2. AMBIENT GLOWING ORBS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-teal-500/15 rounded-full blur-[90px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[260px] h-[260px] bg-cyan-500/10 rounded-full blur-[70px] pointer-events-none" />

      {/* 3. CRWO TRANSPARENT WATERMARK THEME BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span 
          className="text-[18vw] font-black tracking-[0.2em] uppercase select-none opacity-15"
          style={{
            color: 'transparent',
            WebkitTextStroke: '2px rgba(45, 212, 191, 0.35)',
            textShadow: '0 0 50px rgba(20, 184, 166, 0.25)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          CRWO
        </span>
      </div>

      {/* 4. MAIN CENTRAL HOLOGRAPHIC LOADER */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        
        {/* Glowing Hologram Rings */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-8 flex items-center justify-center">
          {/* Outer rotating dashed cyan ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-dashed border-teal-400/60 shadow-[0_0_25px_rgba(20,184,166,0.4)] animate-[spin_8s_linear_infinite]" 
          />
          {/* Inner counter-rotating dotted ring */}
          <div 
            className="absolute inset-2 rounded-full border-2 border-dotted border-cyan-400/50 animate-[spin_12s_linear_infinite_reverse]" 
          />
          {/* Pulsing Concentric Ripple */}
          <div 
            className="absolute -inset-3 rounded-full border border-teal-500/25 animate-ping opacity-40" 
          />

          {/* Central Hexagonal / Squircle Core */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-teal-500/60 shadow-[0_0_35px_rgba(20,184,166,0.6)] flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-teal-400/10 animate-pulse pointer-events-none" />
            <Shield className="w-8 h-8 sm:w-9 sm:h-9 text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.9)] animate-pulse" />
          </div>
        </div>

        {/* Brand Titles with Transparent Theme Styling */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-100 to-cyan-300 drop-shadow-[0_0_20px_rgba(45,212,191,0.4)]">
              CRWO
            </h1>
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping" />
          </div>
          
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-teal-400/80">
            Cryptocurrency Welfare Organisation
          </p>
        </div>

        {/* 5. PULSE DOT-DOT-DOT WAVE ANIMATION */}
        <div className="flex items-center justify-center gap-3 my-6">
          <span 
            className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_#2dd4bf] animate-[bounce_1.2s_infinite]" 
            style={{ animationDelay: '0ms' }}
          />
          <span 
            className="w-2.5 h-2.5 rounded-full bg-teal-300 shadow-[0_0_12px_#5eead4] animate-[bounce_1.2s_infinite]" 
            style={{ animationDelay: '150ms' }}
          />
          <span 
            className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-[bounce_1.2s_infinite]" 
            style={{ animationDelay: '300ms' }}
          />
          <span 
            className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_#2dd4bf] animate-[bounce_1.2s_infinite]" 
            style={{ animationDelay: '450ms' }}
          />
          <span 
            className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9] animate-[bounce_1.2s_infinite]" 
            style={{ animationDelay: '600ms' }}
          />
        </div>

        {/* 6. TELEMETRY STATUS BAR */}
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-teal-500/30 backdrop-blur-md shadow-lg shadow-teal-500/10 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-teal-300 uppercase">
              {statusText}
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-48 sm:w-56 h-[2px] bg-slate-800/80 rounded-full overflow-hidden mt-1">
            <div className="w-full h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_#2dd4bf]" />
          </div>
        </div>

      </div>
    </div>
  );
};
