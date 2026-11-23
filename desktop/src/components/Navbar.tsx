import React from 'react';
import { Shield, Wifi, WifiOff, User, BookOpen, Layers } from 'lucide-react';

interface NavbarProps {
  role: 'admin' | 'student';
  onRoleChange: (newRole: 'admin' | 'student') => void;
  isOnline: boolean;
  studentName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  onRoleChange,
  isOnline,
  studentName = 'Student'
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between z-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Offline Exam & Education Platform
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.0 Desktop
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

        {/* Role Toggle Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              role === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
          <button
            onClick={() => onRoleChange('student')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              role === 'student'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </button>
        </div>

        {/* User Identity Chip */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-200">
              {role === 'admin' ? 'Administrator' : studentName}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              {role === 'admin' ? 'Exam Controller' : 'ID: 2026-CS-042'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
