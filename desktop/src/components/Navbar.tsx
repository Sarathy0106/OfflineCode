import React from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  User,
  BookOpen,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  X,
  LogOut,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  role: 'admin' | 'student';
  userName: string;
  userId: string;
  isOnline: boolean;
  isFullscreen?: boolean;
  onSignOut: () => void;
  onToggleFullscreen?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  userName,
  userId,
  isOnline,
  isFullscreen = false,
  onSignOut,
  onToggleFullscreen,
  onMinimize,
  onClose
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between z-20 select-none">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Offline Exam & Education Platform
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.1.0 Desktop
            </span>
          </h1>
          <p className="text-xs text-slate-400">Secure Offline Testing & Administration Engine</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Status Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Internet Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>100% Offline (Exam Safe)</span>
            </>
          )}
        </div>

        {/* Current Portal Badge */}
        <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-white">
          {role === 'admin' ? (
            <>
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Administrator Portal</span>
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Student Portal</span>
            </>
          )}
        </div>

        {/* User Identity Chip */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
            {userName ? userName[0] : 'U'}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-200">{userName}</p>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              {userId}
            </p>
          </div>
        </div>

        {/* Sign Out / Switch User Button */}
        <button
          onClick={onSignOut}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          title="Sign Out to Role Selection Screen"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch User</span>
        </button>

        {/* Desktop Window Controls & Fullscreen Action */}
        <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-1.5 rounded-lg border transition ${
                isFullscreen
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
              }`}
              title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition"
              title="Minimize Window"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-slate-800 transition"
              title="Close Application"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
