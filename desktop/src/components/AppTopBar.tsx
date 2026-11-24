import React from 'react';
import {
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Minus,
  X,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface AppTopBarProps {
  title: string;
  subtitle?: string;
  isOnline: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  subtitle,
  isOnline,
  isFullscreen,
  onToggleFullscreen,
  onMinimize,
  onClose
}) => {
  return (
    <header className="h-14 bg-white border-b border-[#E2EAF5] px-6 flex items-center justify-between select-none flex-shrink-0 z-20 shadow-sm font-sans">
      {/* Current Page Title (.top h1) */}
      <div className="flex items-center space-x-3 min-w-0">
        <div>
          <h1 className="text-base font-bold text-[#1A2451] tracking-tight truncate flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Controls: Network Badge, Fullscreen Toggle, Window Controls */}
      <div className="flex items-center space-x-3">
        {/* Network Status Badge (netBadge from index.html) */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
          }`}
          title={isOnline ? 'Online: Supabase connection verified' : 'Offline: Local compiler kiosk mode'}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>📶 Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>✈ Offline</span>
            </>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-slate-500 hover:text-[#1A2451] hover:bg-[#EEF3FA] transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        {/* Electron Window Controls (Minimize / Close) */}
        <div className="flex items-center space-x-1 pl-2 border-l border-[#E2EAF5]">
          <button
            onClick={onMinimize}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FA] transition"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
