import React from 'react';
import { BrandLogo } from './BrandLogo';
import {
  LogOut,
  ChevronRight,
  Shield,
  GraduationCap
} from 'lucide-react';

export type StudentNavKey = 'dashboard' | 'test' | 'practice' | 'result';
export type AdminNavKey = 'dashboard' | 'leaderboard' | 'question_test' | 'practice' | 'results' | 'monitoring' | 'crud';

interface AppSidebarProps {
  role: 'admin' | 'student';
  userName: string;
  userId: string;
  userEmail?: string;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onSignOut: () => void;
}

export const STUDENT_NAV_ITEMS: Array<{ key: StudentNavKey; icon: string; label: string }> = [
  { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { key: 'test', icon: '📝', label: 'Test' },
  { key: 'practice', icon: '💻', label: 'Practice' },
  { key: 'result', icon: '📊', label: 'Test Results' }
];

export const ADMIN_NAV_ITEMS: Array<{ key: AdminNavKey; icon: string; label: string }> = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
  { key: 'question_test', icon: '📤', label: 'Test Question Upload' },
  { key: 'practice', icon: '📥', label: 'Practice Question Upload' },
  { key: 'results', icon: '📝', label: 'Test Results' },
  { key: 'monitoring', icon: '🛰️', label: 'Monitoring' },
  { key: 'crud', icon: '🗂️', label: 'Manage (CRUD)' }
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  role,
  userName,
  userId,
  userEmail,
  activeTab,
  onSelectTab,
  onSignOut
}) => {
  const isStudent = role === 'student';
  const navItems = isStudent ? STUDENT_NAV_ITEMS : ADMIN_NAV_ITEMS;

  return (
    <aside className="w-64 bg-[#141D42] text-[#C9D1E3] flex flex-col h-full flex-shrink-0 select-none border-r border-[#202C5B] shadow-2xl z-30 transition-all font-sans">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-[#202C5B]/70 flex flex-col items-center text-center bg-[#101736]">
        <BrandLogo size="sm" variant="dark" />
        
        {/* Role Pill */}
        <div className="mt-2.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#2B3B82]/60 text-[#F5A623] border border-[#F5A623]/30 flex items-center space-x-1.5">
          {isStudent ? (
            <>
              <GraduationCap className="w-3 h-3 text-[#F5A623]" />
              <span>Student · Desktop</span>
            </>
          ) : (
            <>
              <Shield className="w-3 h-3 text-[#F5A623]" />
              <span>Admin · Control</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation List (.nav from index.html) */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Navigation Menu
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group ${
                isActive
                  ? 'bg-[#2B3B82] text-white shadow-md shadow-[#2B3B82]/40 border-l-4 border-[#F5A623]'
                  : 'text-[#C9D1E3] hover:bg-[#1E2B63] hover:text-white'
              }`}
            >
              <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card (.me from index.html) */}
      <div className="p-3.5 bg-[#0F1633] border-t border-[#202C5B] flex flex-col space-y-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2B3B82] border border-[#F5A623]/50 flex items-center justify-center text-white font-bold text-xs shadow-inner flex-shrink-0">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {userEmail || userId}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#1A2451] hover:bg-red-500/20 hover:text-red-300 text-slate-300 border border-[#202C5B] transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
