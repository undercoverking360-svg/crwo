import React from 'react';
import { Activity } from 'lucide-react';

interface CrwoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const CrwoLogo: React.FC<CrwoLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Centered Glowing Circle Box */}
      <div className={`relative flex items-center justify-center shrink-0 ${containerSizes[size]}`}>
        
        {/* Outer Rotating Dotted Circle / Accent Border Ring */}
        <div className="absolute -inset-2 rounded-full border-2 border-dashed border-teal-400/60 animate-[spin_10s_linear_infinite] pointer-events-none opacity-90 shadow-[0_0_15px_rgba(20,184,166,0.35)]" />

        {/* Counter-Rotating Secondary Glow Accent */}
        <div className="absolute -inset-1 rounded-full border border-dotted border-cyan-400/50 animate-[spin_14s_linear_infinite_reverse] pointer-events-none opacity-75" />

        {/* Core Circle Glass Container with Fading Glow */}
        <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border-2 border-teal-500/60 logo-glow-pulse flex items-center justify-center overflow-hidden">
          {/* Internal Ambient Radial Glow Pulse */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 via-cyan-500/15 to-emerald-500/20 rounded-full animate-pulse pointer-events-none"></div>

          {/* Central Glowing Icon */}
          <Activity className={`${iconSizes[size]} text-teal-400 animate-pulse drop-shadow-[0_0_12px_rgba(45,212,191,0.95)]`} />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black font-orbitron tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 drop-shadow-[0_0_12px_rgba(20,184,166,0.5)] ${textSizes[size]}`}>
            PROJECT CRWO
          </span>
        </div>
      )}
    </div>
  );
};
