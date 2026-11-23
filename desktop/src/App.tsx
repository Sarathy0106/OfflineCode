import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/AdminPortal';
import { StudentPortal } from './components/StudentPortal';
import { OfflineExamRoom } from './components/OfflineExamRoom';
import { TopHoverBar } from './components/TopHoverBar';
import { Test } from './types';

export const App: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'student'>('admin');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeExam, setActiveExam] = useState<Test | null>(null);
  const [studentName, setStudentName] = useState('Sarathy V');
  const [studentId, setStudentId] = useState('CS2026-042');

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

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* Sleek Top Hover Bar for Instant Fullscreen Exit / Controls on mouse hover */}
      <TopHoverBar
        isFullscreen={isFullscreen}
        onExitFullscreen={handleExitFullscreen}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />

      {/* Main Top Navigation Header */}
      {!activeExam && (
        <Navbar
          role={role}
          onRoleChange={setRole}
          isOnline={isOnline}
          studentName={studentName}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />
      )}

      {/* Main Content Areas */}
      {activeExam ? (
        <OfflineExamRoom
          test={activeExam}
          studentName={studentName}
          studentId={studentId}
          isOnline={isOnline}
          onExamSubmitted={(attempt) => {
            console.log('Exam submitted:', attempt);
            setActiveExam(null);
            setRole('student');
          }}
          onExitKiosk={() => {
            handleExitFullscreen();
            setActiveExam(null);
          }}
        />
      ) : role === 'admin' ? (
        <AdminPortal />
      ) : (
        <StudentPortal
          studentName={studentName}
          studentId={studentId}
          isOnline={isOnline}
          onStartExam={(test) => setActiveExam(test)}
        />
      )}
    </div>
  );
};

export default App;
