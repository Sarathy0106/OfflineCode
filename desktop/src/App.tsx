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

const STUDENT_TITLES: Record<StudentNavKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Student Dashboard',
    subtitle: 'Overview of scheduled tests, academic progress and playground metrics'
  },
  test: {
    title: 'Available Coding Examinations',
    subtitle: 'Standardized offline assessments with anti-cheat lockdown kiosk'
  },
  practice: {
    title: 'Interactive Practice Arena',
    subtitle: 'Solve coding problems with offline Python, C, C++, and Java execution'
  },
  result: {
    title: 'Examination Results & Scorecards',
    subtitle: 'Cryptographically sealed test scorecards and submission integrity audit'
  }
};

const ADMIN_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Administrator Dashboard',
    subtitle: 'Global academic statistics, exam attempts and platform metrics'
  },
  leaderboard: {
    title: 'Academic Leaderboard',
    subtitle: 'Student rankings by exam scores and practice completion'
  },
  question_test: {
    title: 'Test Question Upload',
    subtitle: 'Author and publish standardized offline examination specifications'
  },
  practice: {
    title: 'Practice Question Upload',
    subtitle: 'Create challenges and coding exercises for student practice'
  },
  results: {
    title: 'Results Management [Test + Practice]',
    subtitle: 'Inspect student code submissions, marks and integrity logs'
  },
  monitoring: {
    title: 'Real-Time Exam Monitoring',
    subtitle: 'Active student sessions, kiosk violations and heartbeat tracker'
  },
  crud: {
    title: 'Academic Database Management (CRUD)',
    subtitle: 'Manage student records, sections, subjects, and curriculum topics'
  }
};

export const App: React.FC = () => {
  // Authentication State: null means user must log in
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeExam, setActiveExam] = useState<Test | null>(null);

  // Active navigation tabs for Student and Admin portals (matching index.html sidebar)
  const [studentTab, setStudentTab] = useState<StudentNavKey>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

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

  // 1. If not authenticated, show Authentication Login Page (with image theme)
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => setCurrentUser(user)}
        isOnline={isOnline}
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

  // Current title metadata based on active role & tab
  const currentTitleMeta =
    currentUser.role === 'admin'
      ? ADMIN_TITLES[adminTab] || { title: 'Administrator Portal', subtitle: '' }
      : STUDENT_TITLES[studentTab] || { title: 'Student Portal', subtitle: '' };

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
        onSignOut={() => {
          setActiveExam(null);
          setCurrentUser(null);
        }}
      />

      {/* Main Right Area: TopBar + Page Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F4F8FD]">
        {/* Top Header Bar */}
        <AppTopBar
          title={currentTitleMeta.title}
          subtitle={currentTitleMeta.subtitle}
          isOnline={isOnline}
        />

        {/* Dynamic Portal Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F4F8FD]">
          {currentUser.role === 'admin' ? (
            <AdminPortal
              activeTab={adminTab}
              onTabChange={setAdminTab}
            />
          ) : (
            <StudentPortal
              studentName={currentUser.name}
              studentId={currentUser.id}
              isOnline={isOnline}
              onStartExam={(test) => setActiveExam(test)}
              activeTab={studentTab}
              onTabChange={setStudentTab}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
