import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface AppTopBarProps {
  isOnline: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  isOnline,
  onSync,
  isSyncing = false
}) => {
  return (
    <header className="h-11 bg-white border-b border-[#E2EAF5] px-6 flex items-center justify-end select-none flex-shrink-0 z-20 shadow-sm font-sans">
      {/* Top Bar: Only Sync and Network Status */}
      <div className="flex items-center space-x-3">
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-[#EEF3FA] active:bg-[#E2EAF5] text-[#2B3B82] rounded-lg text-xs font-semibold border border-[#D0DCED] transition shadow-sm disabled:opacity-50"
            title="Sync data with cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        )}

        {/* Network Status Badge (Clean text, no emojis) */}
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
