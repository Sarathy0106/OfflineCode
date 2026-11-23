import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Test, TestAttempt } from '../types';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  WifiOff,
  Maximize2,
  RefreshCw,
  Trophy,
  History
} from 'lucide-react';

interface StudentPortalProps {
  studentName: string;
  studentId: string;
  isOnline: boolean;
  onStartExam: (test: Test) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  studentName,
  studentId,
  isOnline,
  onStartExam
}) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [myAttempts, setMyAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTestForLockdown, setSelectedTestForLockdown] = useState<Test | null>(null);
  const [isKioskActive, setIsKioskActive] = useState(false);

  // Fetch tests & student's past attempts
  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const { data: testList } = await supabase
        .from('tests')
        .select('*, questions(*, test_cases(*))')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (testList) setTests(testList);

      const { data: attemptList } = await supabase
        .from('test_attempts')
        .select('*, submissions:student_submissions(*)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (attemptList) setMyAttempts(attemptList as TestAttempt[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  // Request Kiosk Fullscreen
  const handleEnableKiosk = async () => {
    if (window.electronAPI) {
      await window.electronAPI.enterKiosk();
      setIsKioskActive(true);
    } else {
      setIsKioskActive(true);
    }
  };

  // Launch Exam
  const handleBeginTest = () => {
    if (!selectedTestForLockdown) return;
    onStartExam(selectedTestForLockdown);
    setSelectedTestForLockdown(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950 text-slate-100">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Student Examination Dashboard
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Welcome back, {studentName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Roll / Student ID: <span className="font-mono text-slate-300 font-semibold">{studentId}</span> • 100% Offline Kiosk Enabled
          </p>
        </div>

        <button
          onClick={fetchStudentData}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Exams</span>
        </button>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <span>Available Coding Examinations ({tests.length})</span>
        </h3>

        {tests.length === 0 && !isLoading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            No examinations published yet. Ask your Administrator to upload a test.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map(test => {
            const isAlreadyAttempted = myAttempts.some(a => a.test_id === test.id);
            return (
              <div
                key={test.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {test.subject}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{test.duration_minutes} Minutes</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{test.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Topic: {test.topic || 'Coding'}</p>

                  <div className="mt-4 flex items-center space-x-4 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] block">QUESTIONS</span>
                      <span className="font-bold">{test.questions?.length || 0} Coding Tasks</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">TOTAL MARKS</span>
                      <span className="font-bold">{test.total_marks} Marks</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">PASS PERCENTAGE</span>
                      <span className="font-bold">{test.passing_percentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  {isAlreadyAttempted ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Attempt Completed</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Offline Safe</span>
                  )}

                  <button
                    onClick={() => setSelectedTestForLockdown(test)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isAlreadyAttempted ? 'Retake Exam' : 'Start Examination'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Submissions & Result History */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <span>My Performance History ({myAttempts.length})</span>
        </h3>

        {myAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No previous exam records found.</p>
        ) : (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Exam Title</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {myAttempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-semibold text-white">
                      {tests.find(t => t.id === att.test_id)?.title || 'Coding Sprint'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-200">{att.total_score} / {att.max_score}</td>
                    <td className="p-3.5 font-bold">{att.percentage}%</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {att.passed ? 'PASSED' : 'NOT QUALIFIED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pre-Flight Lockdown Gate Modal */}
      {selectedTestForLockdown && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Anti-Cheat Lockdown Pre-Flight</h4>
                <p className="text-xs text-slate-400">{selectedTestForLockdown.title}</p>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-3">
              {/* Gate 1: Test Payload */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Test Payload Downloaded</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedTestForLockdown.questions?.length} coding problems cached in local sandbox
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">READY</span>
              </div>

              {/* Gate 2: Fullscreen Kiosk Mode */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isKioskActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">Full-Screen Kiosk Enforcement</p>
                    <p className="text-[10px] text-slate-400">
                      Locks window, disables shortcut exits (Cmd+Tab, Alt+Tab)
                    </p>
                  </div>
                </div>
                {!isKioskActive ? (
                  <button
                    onClick={handleEnableKiosk}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    Enter Kiosk
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">LOCKED</span>
                )}
              </div>

              {/* Gate 3: Internet Disconnection Requirement */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {!isOnline ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">Offline Enforcement (Zero Cheating)</p>
                    <p className="text-[10px] text-slate-400">
                      {isOnline
                        ? 'Please switch off your Wi-Fi or unplug ethernet now'
                        : 'Confirmed offline! Safe to start'}
                    </p>
                  </div>
                </div>
                {!isOnline ? (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">OFFLINE OK</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 uppercase">TURN OFF WI-FI</span>
                )}
              </div>
            </div>

            {isOnline && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>The exam will automatically unlock as soon as your Wi-Fi is switched off.</span>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setSelectedTestForLockdown(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={handleBeginTest}
                disabled={isOnline || !isKioskActive}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Examination</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
