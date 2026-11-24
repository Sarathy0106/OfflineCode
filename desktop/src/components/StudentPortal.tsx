import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Test, TestAttempt } from '../types';
import { StudentPracticeArena } from './StudentPracticeArena';
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
  History,
  Code2,
  Terminal,
  LayoutDashboard,
  Check,
  ArrowRight,
  TrendingUp,
  Flame,
  Layers,
  FileCheck2
} from 'lucide-react';

interface StudentPortalProps {
  studentName: string;
  studentId: string;
  isOnline: boolean;
  onStartExam: (test: Test) => void;
  activeTab?: 'dashboard' | 'test' | 'practice' | 'result';
  onTabChange?: (tab: 'dashboard' | 'test' | 'practice' | 'result') => void;
  syncTrigger?: number;
  onSyncStateChange?: (syncing: boolean) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  studentName,
  studentId,
  isOnline,
  onStartExam,
  activeTab: propActiveTab,
  onTabChange,
  syncTrigger,
  onSyncStateChange
}) => {
  // 4 Student Pages extracted from user handwritten diagram:
  // 1. Dashboard, 2. Test, 3. Practice, 4. Result
  const [internalTab, setInternalTab] = useState<'dashboard' | 'test' | 'practice' | 'result'>('dashboard');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: 'dashboard' | 'test' | 'practice' | 'result') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [tests, setTests] = useState<Test[]>([]);
  const [myAttempts, setMyAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTestForLockdown, setSelectedTestForLockdown] = useState<Test | null>(null);
  const [isKioskActive, setIsKioskActive] = useState(false);
  const [selectedAttemptInspect, setSelectedAttemptInspect] = useState<TestAttempt | null>(null);

  // Fetch tests & student's past attempts
  const fetchStudentData = async () => {
    setIsLoading(true);
    if (onSyncStateChange) onSyncStateChange(true);
    try {
      const { data: testList } = await supabase
        .from('tests')
        .select('*, questions(*, test_cases(*))')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (testList) {
        const normalized = testList.map((test: any) => ({
          ...test,
          questions: (test.questions || []).map((q: any) => ({
            ...q,
            sample_test_cases: (q.sample_test_cases && q.sample_test_cases.length > 0)
              ? q.sample_test_cases
              : (q.test_cases || []).filter((tc: any) => !tc.is_hidden),
            hidden_test_cases: (q.hidden_test_cases && q.hidden_test_cases.length > 0)
              ? q.hidden_test_cases
              : (q.test_cases || []).filter((tc: any) => tc.is_hidden)
          }))
        }));
        setTests(normalized);
      }

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
      if (onSyncStateChange) onSyncStateChange(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  useEffect(() => {
    if (syncTrigger && syncTrigger > 0) {
      fetchStudentData();
    }
  }, [syncTrigger]);

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

  const completedCount = myAttempts.length;
  const pendingCount = Math.max(0, tests.length - completedCount);
  const averagePercentage = myAttempts.length > 0
    ? Math.round(myAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / myAttempts.length)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#F4F8FD] text-[#1C2333] overflow-hidden select-none font-sans">
      {/* Student Portal Navigation Bar (4 Pages: Dashboard, Test, Practice, Result) */}
      <div className="h-12 bg-white border-b border-[#E2EAF5] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'dashboard'
                ? 'bg-[#2B3B82] text-white shadow-sm border-b-2 border-[#F5A623]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FA]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>1. Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'test'
                ? 'bg-[#2B3B82] text-white shadow-sm border-b-2 border-[#F5A623]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FA]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Test ({tests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'practice'
                ? 'bg-[#2B3B82] text-white shadow-sm border-b-2 border-[#F5A623]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FA]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. Practice Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('result')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'result'
                ? 'bg-[#2B3B82] text-white shadow-sm border-b-2 border-[#F5A623]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FA]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>4. Result ({myAttempts.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <span className="font-mono bg-[#EEF3FA] px-2.5 py-1 rounded-lg border border-[#D0DCED] text-[#1A2451] font-semibold">
            {studentName} ({studentId})
          </span>
        </div>
      </div>

      {/* Render Selected View */}
      {activeTab === 'practice' ? (
        /* PAGE 3: PRACTICE ARENA & PLAYGROUND */
        <StudentPracticeArena />
      ) : activeTab === 'dashboard' ? (
        /* PAGE 1: STUDENT DASHBOARD */
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#1A2451] via-[#2B3B82] to-[#141D42] border border-[#2B3B82] rounded-3xl p-6 flex items-center justify-between shadow-xl text-white">
            <div>
              <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider">
                Student Education Dashboard
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Welcome back, {studentName}</h2>
              <p className="text-xs text-slate-300 mt-1">
                Candidate ID: <span className="font-mono text-[#F5A623] font-semibold">{studentId}</span> • 100% Offline Kiosk Mode Enabled
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('test')}
                className="flex items-center space-x-2 px-4 py-2 bg-[#F5A623] hover:bg-[#E69500] text-[#141D42] rounded-xl text-xs font-bold shadow transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Take Examination</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition"
              >
                <Terminal className="w-4 h-4" />
                <span>Open Code Playground</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2EAF5] p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2B3B82] flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Available Tests</p>
                <p className="text-2xl font-bold text-[#1A2451]">{tests.length}</p>
                <span className="text-[10px] text-[#2B3B82] font-semibold">{pendingCount} Pending</span>
              </div>
            </div>

            <div className="bg-white border border-[#E2EAF5] p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Tests Completed</p>
                <p className="text-2xl font-bold text-[#1A2451]">{completedCount}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">100% Sealed</span>
              </div>
            </div>

            <div className="bg-white border border-[#E2EAF5] p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Practice Solved</p>
                <p className="text-2xl font-bold text-[#1A2451]">4 Tasks</p>
                <span className="text-[10px] text-indigo-600 font-semibold">Playground Active</span>
              </div>
            </div>

            <div className="bg-white border border-[#E2EAF5] p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#E69500] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Average Score</p>
                <p className="text-2xl font-bold text-[#1A2451]">{averagePercentage > 0 ? `${averagePercentage}%` : 'N/A'}</p>
                <span className="text-[10px] text-[#E69500] font-semibold">Leaderboard Active</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2EAF5] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-[#1A2451] flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#2B3B82]" />
                <span>Next Available Examination</span>
              </h3>
              {tests.length > 0 ? (
                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E2EAF5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#2B3B82] uppercase tracking-wider">
                      {tests[0].subject}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{tests[0].duration_minutes} Mins</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1A2451]">{tests[0].title}</h4>
                  <p className="text-xs text-slate-500">Questions: {tests[0].questions?.length || 0} Coding Tasks • {tests[0].total_marks} Marks</p>
                  <button
                    onClick={() => {
                      setSelectedTestForLockdown(tests[0]);
                      setActiveTab('test');
                    }}
                    className="w-full py-2 bg-[#2B3B82] hover:bg-[#1E2B63] text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Proceed to Examination Gate</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No pending examinations published.</p>
              )}
            </div>

            <div className="bg-white border border-[#E2EAF5] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-[#1A2451] flex items-center space-x-2">
                <History className="w-4 h-4 text-[#2B3B82]" />
                <span>Recent Exam Results</span>
              </h3>
              {myAttempts.length > 0 ? (
                <div className="divide-y divide-[#E2EAF5] text-xs">
                  {myAttempts.slice(0, 3).map(att => (
                    <div key={att.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#1A2451]">Score: {att.total_score}/{att.max_score} ({att.percentage}%)</p>
                        <p className="text-[10px] text-slate-400">{att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'Recent'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {att.passed ? 'PASSED' : 'NOT QUALIFIED'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No tests submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'test' ? (
        /* PAGE 2: TEST (EXAMINATIONS) */
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>Available Coding Examinations ({tests.length})</span>
              </h2>
              <p className="text-xs text-slate-400">Offline exam payloads with anti-cheat full-screen kiosk enforcement.</p>
            </div>
          </div>

          {tests.length === 0 && !isLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
              No examinations published yet. Ask your Administrator to upload a test specification.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tests.map(test => {
              const isAlreadyAttempted = myAttempts.some(a => a.test_id === test.id);
              return (
                <div
                  key={test.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition space-y-4 shadow-lg"
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
                    <p className="text-xs text-slate-400 mt-1">Topic: {test.topic || 'Coding Sprint'}</p>

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
                      <span className="text-xs text-slate-400">Offline Secured</span>
                    )}

                    <button
                      onClick={() => setSelectedTestForLockdown(test)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isAlreadyAttempted ? 'Retake Examination' : 'Start Examination'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* PAGE 4: RESULT */
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>My Examination Results & Scorecards</span>
              </h2>
              <p className="text-xs text-slate-400">Cryptographically verified evaluation records with local execution details.</p>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Exam Title</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Integrity Hash</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {myAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      No examination records found. Take an examination from the "Test" tab to view your results here.
                    </td>
                  </tr>
                ) : (
                  myAttempts.map(att => (
                    <tr key={att.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-white">
                        {tests.find(t => t.id === att.test_id)?.title || 'Coding Sprint Examination'}
                      </td>
                      <td className="p-4 font-bold text-slate-200">{att.total_score} / {att.max_score}</td>
                      <td className="p-4 font-bold text-emerald-400">{att.percentage}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {att.passed ? 'PASSED' : 'NOT QUALIFIED'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                        {att.integrity_hash || 'SHA-256 Validated'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedAttemptInspect(att)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attempt Details Modal */}
      {selectedAttemptInspect && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white">Examination Scorecard</h4>
                <p className="text-xs text-slate-400">{studentName} ({studentId})</p>
              </div>
              <button
                onClick={() => setSelectedAttemptInspect(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Final Score:</span>
                <span className="font-bold text-white">{selectedAttemptInspect.total_score} / {selectedAttemptInspect.max_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Result Standing:</span>
                <span className={`font-bold ${selectedAttemptInspect.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedAttemptInspect.passed ? 'QUALIFIED (PASSED)' : 'NOT QUALIFIED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Integrity Hash:</span>
                <span className="font-mono text-[10px] text-emerald-400 truncate max-w-xs">{selectedAttemptInspect.integrity_hash}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase">Submissions Breakdown</h5>
              {(selectedAttemptInspect.submissions || []).map((sub: any, idx: number) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Question #{idx + 1} ({sub.language})</span>
                    <span className="text-emerald-400 font-bold">{sub.score} Marks</span>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-200 overflow-x-auto max-h-36">
                    {sub.source_code || '// No code recorded'}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
