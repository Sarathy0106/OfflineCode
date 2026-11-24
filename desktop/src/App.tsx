import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { AppSidebar, StudentNavKey, AdminNavKey } from './components/AppSidebar';
import { AppTopBar } from './components/AppTopBar';
import { AdminPortal, AdminTab } from './components/AdminPortal';
import { StudentPortal } from './components/StudentPortal';
import { OfflineExamRoom } from './components/OfflineExamRoom';
import { TopHoverBar } from './components/TopHoverBar';
import { Test } from './types';

interface AuthenticatedUser {
  role: 'admin' | 'student';
  name: string;
  id: string;
  email?: string;
  section?: string;
  dept?: string;
}

// Session Persistence Constants
const AUTH_SESSION_KEY = 'offlinecode_auth_session';
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days session
const REMEMBER_ME_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days session

interface StoredSession {
  user: AuthenticatedUser;
  expiresAt: number;
  rememberMe: boolean;
}

function loadInitialSession(): { user: AuthenticatedUser | null; expired: boolean } {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return { user: null, expired: false };
    const session: StoredSession = JSON.parse(raw);
    if (!session || !session.user || !session.expiresAt) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return { user: null, expired: false };
    }
    if (Date.now() > session.expiresAt) {
      // Session has expired!
      localStorage.removeItem(AUTH_SESSION_KEY);
      return { user: null, expired: true };
    }
    return { user: session.user, expired: false };
  } catch (err) {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {}
    return { user: null, expired: false };
  }
}

export const App: React.FC = () => {
  // Load persisted session on application startup
  const initialSession = loadInitialSession();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(initialSession.user);
  const [sessionExpired, setSessionExpired] = useState<boolean>(initialSession.expired);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeExam, setActiveExam] = useState<Test | null>(null);

  // Active navigation tabs for Student and Admin portals (matching index.html sidebar)
  const [studentTab, setStudentTab] = useState<StudentNavKey>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Cloud Database Sync State
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle successful login: persist session to localStorage
  const handleLogin = (user: AuthenticatedUser, rememberMe = true) => {
    const duration = rememberMe ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS;
    const sessionData: StoredSession = {
      user,
      expiresAt: Date.now() + duration,
      rememberMe
    };
    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to persist session to localStorage', e);
    }
    setSessionExpired(false);
    setCurrentUser(user);
  };

  // Handle Sign Out: cleanly purge stored session
  const handleSignOut = () => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {}
    setActiveExam(null);
    setCurrentUser(null);
    setSessionExpired(false);
  };

  // Periodic session validity check (every 60 seconds)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(AUTH_SESSION_KEY);
        if (!raw) {
          handleSignOut();
          setSessionExpired(true);
          return;
        }
        const session: StoredSession = JSON.parse(raw);
        if (Date.now() > session.expiresAt) {
          handleSignOut();
          setSessionExpired(true);
        }
      } catch (e) {
        handleSignOut();
        setSessionExpired(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Network & Fullscreen Monitoring via Electron IPC
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkNetwork().then(setIsOnline);
      const cleanupNetwork = window.electronAPI.onNetworkChange((online) => {
        setIsOnline(online);
      });

      window.electronAPI.isFullscreen().then(setIsFullscreen);
      const cleanupFullscreen = window.electronAPI.onFullscreenChange((full) => {
        setIsFullscreen(full);
      });

      return () => {
        cleanupNetwork();
        cleanupFullscreen();
      };
    } else {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleToggleFullscreen = async () => {
    if (window.electronAPI) {
      const newState = await window.electronAPI.toggleFullscreen();
      setIsFullscreen(newState);
    }
  };

  const handleExitFullscreen = async () => {
    if (window.electronAPI) {
      await window.electronAPI.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeWindow();
    }
  };

  // 1. If not authenticated, show Authentication Login Page (with persistent session & expiration notice)
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        isOnline={isOnline}
        sessionExpired={sessionExpired}
      />
    );
  }

  // 2. If taking exam, render full-screen Offline Exam Room
  if (activeExam) {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
        <TopHoverBar
          isFullscreen={isFullscreen}
          onExitFullscreen={handleExitFullscreen}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />
        <OfflineExamRoom
          test={activeExam}
          studentName={currentUser.name}
          studentId={currentUser.id}
          isOnline={isOnline}
          onExamSubmitted={(attempt) => {
            console.log('Exam submitted:', attempt);
            setActiveExam(null);
          }}
          onExitKiosk={() => {
            handleExitFullscreen();
            setActiveExam(null);
          }}
        />
      </div>
    );
  }

  // 3. Authenticated App Layout (Sidebar + TopBar + Main Content from index.html)
  return (
    <div className="h-screen w-screen flex bg-[#F4F8FD] text-[#1C2333] overflow-hidden font-sans relative select-none">
      {/* Top Hover Bar for Instant Fullscreen Exit / Controls on mouse hover */}
      <TopHoverBar
        isFullscreen={isFullscreen}
        onExitFullscreen={handleExitFullscreen}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />

      {/* Left Sidebar Navigation (Faithful to index.html structure) */}
      <AppSidebar
        role={currentUser.role}
        userName={currentUser.name}
        userId={currentUser.id}
        userEmail={currentUser.email}
        activeTab={currentUser.role === 'admin' ? adminTab : studentTab}
        onSelectTab={(tab) => {
          if (currentUser.role === 'admin') {
            setAdminTab(tab as AdminTab);
          } else {
            setStudentTab(tab as StudentNavKey);
          }
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Right Area: TopBar + Page Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F4F8FD]">
        {/* Top Header Bar: Only Sync and Network Status (No page title/name) */}
        <AppTopBar
          isOnline={isOnline}
          onSync={() => setSyncTrigger((t) => t + 1)}
          isSyncing={isSyncing}
        />

        {/* Dynamic Portal Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F4F8FD]">
          {currentUser.role === 'admin' ? (
            <AdminPortal
              activeTab={adminTab}
              onTabChange={setAdminTab}
              syncTrigger={syncTrigger}
              onSyncStateChange={setIsSyncing}
            />
          ) : (
            <StudentPortal
              studentName={currentUser.name}
              studentId={currentUser.id}
              isOnline={isOnline}
              onStartExam={(test) => setActiveExam(test)}
              activeTab={studentTab}
              onTabChange={setStudentTab}
              syncTrigger={syncTrigger}
              onSyncStateChange={setIsSyncing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
