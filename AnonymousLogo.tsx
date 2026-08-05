import React from 'react';
import { UserCheck, Shield, Lock, LogIn } from 'lucide-react';

interface AnonymousLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  subtitle?: string;
  onLoginClick?: () => void;
  className?: string;
}

export const AnonymousLogo: React.FC<AnonymousLogoProps> = ({
  size = 'lg',
  title = 'GUEST ACCESS LOCKED',
  subtitle = 'Please authenticate to access backend processes and member ledger.',
  onLoginClick,
  className = ''
}) => {
  const containerSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl max-w-md mx-auto my-6 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background Ambient Glow */}
      <div className="absolute -top-16 -left-16 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Centered Glowing Squircle (Rounded Square) Anonymous Logo */}
      <div className={`relative flex items-center justify-center ${containerSizes[size]} mb-5`}>
        {/* Outer Rotating Dotted Square Border */}
        <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-teal-400/60 animate-[spin_10s_linear_infinite] pointer-events-none shadow-[0_0_20px_rgba(20,184,166,0.35)] opacity-90" />

        {/* Counter-Rotating Glowing Neon Accents */}
        <div className="absolute -inset-1 rounded-2xl border border-dotted border-cyan-400/50 animate-[spin_15s_linear_infinite_reverse] pointer-events-none opacity-75" />

        {/* Core Squircle Box */}
        <div className="relative z-10 w-full h-full rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-teal-500/60 shadow-[0_0_30px_rgba(20,184,166,0.6)] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 via-cyan-500/15 to-emerald-500/20 animate-pulse pointer-events-none"></div>
          <UserCheck className={`${iconSizes[size]} text-teal-400 animate-pulse drop-shadow-[0_0_15px_rgba(45,212,191,0.9)]`} />
        </div>
      </div>

      <h3 className="text-sm font-black font-orbitron uppercase tracking-widest text-teal-400 mb-1 flex items-center gap-2">
        <Lock className="w-4 h-4 text-teal-400 animate-pulse" />
        {title}
      </h3>

      <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">
        {subtitle}
      </p>

      {onLoginClick && (
        <button
          onClick={onLoginClick}
          className="px-5 py-2.5 rounded-xl text-xs font-bold font-orbitron tracking-wider bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>SIGN IN TO ACCESS PORTAL</span>
        </button>
      )}
    </div>
  );
};
