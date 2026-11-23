import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/AdminPortal';
import { StudentPortal } from './components/StudentPortal';
import { OfflineExamRoom } from './components/OfflineExamRoom';
import { Test } from './types';

export const App: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'student'>('admin');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [activeExam, setActiveExam] = useState<Test | null>(null);
  const [studentName, setStudentName] = useState('Sarathy V');
  const [studentId, setStudentId] = useState('CS2026-042');

  // Network Monitoring via Electron IPC or Navigator
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkNetwork().then(setIsOnline);
      const cleanup = window.electronAPI.onNetworkChange((online) => {
        setIsOnline(online);
      });
      return cleanup;
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

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* If in an active exam room, hide the navbar for zero distractions & strict kiosk */}
      {!activeExam && (
        <Navbar
          role={role}
          onRoleChange={setRole}
          isOnline={isOnline}
          studentName={studentName}
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
          onExitKiosk={() => setActiveExam(null)}
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
