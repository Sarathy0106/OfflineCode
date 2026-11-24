import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface AppTopBarProps {
  title: string;
  subtitle?: string;
  isOnline: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  subtitle,
  isOnline
}) => {
  return (
    <header className="h-14 bg-white border-b border-[#E2EAF5] px-6 flex items-center justify-between select-none flex-shrink-0 z-20 shadow-sm font-sans">
      {/* Current Page Title */}
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

      {/* Right Controls: Only Network Status Badge (Clean text, no emojis) */}
      <div className="flex items-center">
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
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
