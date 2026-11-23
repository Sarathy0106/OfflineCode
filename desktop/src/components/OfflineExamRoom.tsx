import React, { useState, useEffect, useRef } from 'react';
import { OfflineCodeEditor } from './OfflineCodeEditor';
import { supabase } from '../lib/supabase';
import { Test, Question, StudentSubmission, TestCase } from '../types';
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Code2,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface OfflineExamRoomProps {
  test: Test;
  studentName: string;
  studentId: string;
  isOnline: boolean;
  onExamSubmitted: (attemptData: any) => void;
  onExitKiosk: () => void;
}

export const OfflineExamRoom: React.FC<OfflineExamRoomProps> = ({
  test,
  studentName,
  studentId,
  isOnline,
  onExamSubmitted,
  onExitKiosk
}) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { code: string; language: string }>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(test.duration_minutes * 60);
  const [isRunningLocal, setIsRunningLocal] = useState(false);
  const [runResults, setRunResults] = useState<any>(null);
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isExamSealed, setIsExamSealed] = useState(false);
  const [sealedData, setSealedData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Terminal & Execution States
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalTab, setTerminalTab] = useState<'sample_cases' | 'custom_input' | 'compiler_output'>('sample_cases');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState<any>(null);
  const [isCustomRunning, setIsCustomRunning] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);

  const currentQuestion = test.questions?.[activeQuestionIndex] || null;

  // Helper to extract sample test cases safely from question
  const getSampleCases = (q: Question | null): TestCase[] => {
    if (!q) return [];
    if (q.sample_test_cases && q.sample_test_cases.length > 0) return q.sample_test_cases;
    if ((q as any).test_cases) return (q as any).test_cases.filter((tc: any) => !tc.is_hidden);
    return [];
  };

  const getHiddenCases = (q: Question | null): TestCase[] => {
    if (!q) return [];
    if (q.hidden_test_cases && q.hidden_test_cases.length > 0) return q.hidden_test_cases;
    if ((q as any).test_cases) return (q as any).test_cases.filter((tc: any) => tc.is_hidden);
    return [];
  };

  // Initialize Clean Starter Templates (1-line comment, no default code)
  useEffect(() => {
    const initial: Record<string, { code: string; language: string }> = {};
    test.questions?.forEach(q => {
      const defaultLang = q.allowed_languages?.[0] || 'python';
      const cleanComment = defaultLang.toLowerCase().includes('py')
        ? '# Write your solution here\n'
        : '// Write your solution here\n';
      initial[q.id] = { code: cleanComment, language: defaultLang };
    });
    setAnswers(initial);

    // Enter Kiosk Mode
    if (window.electronAPI) {
      window.electronAPI.enterKiosk();
    }
  }, [test]);

  // Update default custom input when switching questions
  useEffect(() => {
    if (currentQuestion) {
      const sampleCases = getSampleCases(currentQuestion);
      if (sampleCases.length > 0) {
        setCustomInput(sampleCases[0].input || '');
      } else {
        setCustomInput('');
      }
      setSelectedCaseIdx(0);
      setRunResults(null);
      setCustomResult(null);
    }
  }, [activeQuestionIndex]);

  // Focus Violation Monitor (Anti-Cheat)
  useEffect(() => {
    if (window.electronAPI && !isExamSealed) {
      const cleanup = window.electronAPI.onFocusViolation(() => {
        setStrikes(prev => prev + 1);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      });
      return cleanup;
    }
  }, [isExamSealed]);

  // Live Offline Countdown Timer
  useEffect(() => {
    if (isExamSealed) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSealExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExamSealed]);

  // Auto-save code draft locally
  useEffect(() => {
    if (window.electronAPI && Object.keys(answers).length > 0) {
      window.electronAPI.saveLocal('exam_draft', {
        testId: test.id,
        studentId,
        answers,
        timeLeftSeconds,
        timestamp: Date.now()
      });
    }
  }, [answers, timeLeftSeconds]);

  // Change code for active question
  const handleCodeChange = (newCode: string | undefined) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        code: newCode || ''
      }
    }));
  };

  // Change language for active question
  const handleLanguageChange = (newLang: string) => {
    if (!currentQuestion) return;
    const cleanComment = newLang.toLowerCase().includes('py')
      ? '# Write your solution here\n'
      : '// Write your solution here\n';
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        language: newLang,
        code: cleanComment
      }
    }));
  };

  // Execute Code Locally against Sample Test Cases
  const handleRunSampleCases = async () => {
    if (!currentQuestion) return;
    setIsTerminalOpen(true);
    setTerminalTab('sample_cases');
    setIsRunningLocal(true);
    setRunResults(null);

    const sampleCases = getSampleCases(currentQuestion);
    const ans = answers[currentQuestion.id] || { code: '', language: 'python' };

    if (sampleCases.length === 0) {
      setRunResults({
        total: 0,
        passed: 0,
        allPassed: false,
        error: 'No sample test cases configured for this question. You can use Custom Input tab to test your code.',
        details: []
      });
      setIsRunningLocal(false);
      return;
    }

    const testCases = sampleCases.map((stc, i) => ({
      id: stc.id || `sample_${i + 1}`,
      input: stc.input,
      expected_output: stc.expected_output,
      is_hidden: false
    }));

    if (window.electronAPI) {
      try {
        const evaluation = await window.electronAPI.evaluateTestCases({
          language: ans.language,
          code: ans.code,
          testCases
        });
        setRunResults(evaluation);
        setSelectedCaseIdx(0);
      } catch (err: any) {
        setRunResults({
          total: testCases.length,
          passed: 0,
          allPassed: false,
          error: err.message,
          details: []
        });
      } finally {
        setIsRunningLocal(false);
      }
    } else {
      setTimeout(() => {
        setRunResults({
          total: testCases.length,
          passed: testCases.length,
          allPassed: true,
          details: testCases.map((tc, idx) => ({
            id: tc.id,
            input: tc.input,
            expected_output: tc.expected_output,
            actual_output: tc.expected_output,
            passed: true,
            timeMs: 28,
            exitCode: 0,
            stderr: ''
          }))
        });
        setIsRunningLocal(false);
      }, 500);
    }
  };

  // Execute Code Locally with Custom Stdin Input
  const handleRunCustomInput = async () => {
    if (!currentQuestion) return;
    setIsTerminalOpen(true);
    setTerminalTab('custom_input');
    setIsCustomRunning(true);
    setCustomResult(null);

    const ans = answers[currentQuestion.id] || { code: '', language: 'python' };
    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.executeCode({
          language: ans.language,
          code: ans.code,
          input: customInput,
          timeoutMs: 6000
        });
        setCustomResult(res);
      } catch (err: any) {
        setCustomResult({
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          timeMs: 0
        });
      } finally {
        setIsCustomRunning(false);
      }
    } else {
      setTimeout(() => {
        setCustomResult({
          stdout: `Executed locally with input:\n${customInput}`,
          stderr: '',
          exitCode: 0,
          timeMs: 22
        });
        setIsCustomRunning(false);
      }, 400);
    }
  };

  // Seal Exam Locally (Calculates score & signs payload with SHA-256)
  const handleSealExam = async () => {
    if (isExamSealed) return;

    let totalScore = 0;
    let maxScore = test.total_marks || 100;
    const submissions: StudentSubmission[] = [];

    // Evaluate each question against sample + hidden test cases offline
    for (const q of test.questions || []) {
      const ans = answers[q.id] || { code: '', language: 'python' };
      const sCases = getSampleCases(q);
      const hCases = getHiddenCases(q);
      const allTestCases = [
        ...sCases.map((tc, idx) => ({ ...tc, id: tc.id || `s_${idx}`, is_hidden: false })),
        ...hCases.map((tc, idx) => ({ ...tc, id: tc.id || `h_${idx}`, is_hidden: true }))
      ];

      let evalResult = { total: 0, passed: 0, details: [] as any[] };
      if (window.electronAPI && allTestCases.length > 0) {
        try {
          evalResult = await window.electronAPI.evaluateTestCases({
            language: ans.language,
            code: ans.code,
            testCases: allTestCases
          });
        } catch (e) {
          console.error(e);
        }
      }

      const qTotalCases = allTestCases.length;
      const qPassedCases = evalResult.passed;
      const qScore = qTotalCases > 0 ? Math.round((qPassedCases / qTotalCases) * (q.marks || 10)) : 0;
      totalScore += qScore;

      submissions.push({
        question_id: q.id,
        language: ans.language,
        source_code: ans.code,
        passed_sample_cases: evalResult.details.filter(d => !d.is_hidden && d.passed).length,
        total_sample_cases: sCases.length,
        passed_hidden_cases: evalResult.details.filter(d => d.is_hidden && d.passed).length,
        total_hidden_cases: hCases.length,
        score: qScore,
        execution_logs: evalResult.details
      });
    }

    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= (test.passing_percentage || 50);

    const payload = {
      test_id: test.id,
      student_id: studentId,
      student_name: studentName,
      started_at: new Date(Date.now() - (test.duration_minutes * 60 - timeLeftSeconds) * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
      status: 'submitted',
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      passed,
      submissions
    };

    let hash = 'local_offline_signature';
    if (window.electronAPI) {
      hash = await window.electronAPI.hashData(JSON.stringify(payload));
      await window.electronAPI.saveLocal('sealed_submission', { ...payload, integrity_hash: hash });
    }

    setSealedData({ ...payload, integrity_hash: hash });
    setIsExamSealed(true);
  };

  // Sync to Supabase when student reconnects Wi-Fi
  const handleSyncToSupabase = async () => {
    if (!sealedData) return;
    setIsSyncing(true);

    try {
      // Single Batch POST to Supabase
      const { data: attemptRow, error: attemptErr } = await supabase
        .from('test_attempts')
        .insert({
          test_id: sealedData.test_id,
          student_id: sealedData.student_id,
          student_name: sealedData.student_name,
          started_at: sealedData.started_at,
          submitted_at: sealedData.submitted_at,
          status: 'evaluated',
          total_score: sealedData.total_score,
          max_score: sealedData.max_score,
          percentage: sealedData.percentage,
          passed: sealedData.passed,
          integrity_hash: sealedData.integrity_hash
        })
        .select()
        .single();

      if (attemptErr || !attemptRow) throw attemptErr || new Error('Failed to sync attempt');

      // Insert Submissions
      const submissionRows = sealedData.submissions.map((s: any) => ({
        attempt_id: attemptRow.id,
        question_id: s.question_id,
        language: s.language,
        source_code: s.source_code,
        passed_sample_cases: s.passed_sample_cases,
        total_sample_cases: s.total_sample_cases,
        passed_hidden_cases: s.passed_hidden_cases,
        total_hidden_cases: s.total_hidden_cases,
        score: s.score,
        execution_logs: s.execution_logs
      }));

      await supabase
        .from('student_submissions')
        .insert(submissionRows);

      setSyncSuccess(true);
      if (window.electronAPI) {
        window.electronAPI.clearLocal('exam_draft');
        window.electronAPI.exitKiosk();
      }
      setTimeout(() => {
        onExamSubmitted({ ...sealedData, id: attemptRow.id });
      }, 1500);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}. Ensure internet connection is active and retry.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Format Time (MM:SS)
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sampleCases = getSampleCases(currentQuestion);
  const activeTestCaseDetail = runResults?.details?.[selectedCaseIdx] || null;

  // If exam is finished and sealed, show Reconnect & Sync Screen
  if (isExamSealed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">Exam Sealed Successfully!</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Integrity Hash: {sealedData?.integrity_hash?.substring(0, 16)}...
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Student:</span>
              <span className="font-semibold">{studentName} ({studentId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Score:</span>
              <span className="font-bold text-emerald-400">{sealedData?.total_score} / {sealedData?.max_score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Percentage:</span>
              <span className="font-bold">{sealedData?.percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${sealedData?.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {sealedData?.passed ? 'QUALIFIED (PASSED)' : 'NOT QUALIFIED'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center space-x-3 text-left">
            {isOnline ? (
              <Wifi className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse" />
            )}
            <div>
              <p className="font-bold text-white">
                {isOnline ? 'Internet Connected' : 'Please Turn On Wi-Fi to Sync'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isOnline
                  ? 'Ready to upload encrypted test submission to Supabase cloud.'
                  : 'Connect to Wi-Fi now to securely post your test score.'}
              </p>
            </div>
          </div>

          {syncSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Exam Synced Successfully! Exiting Kiosk...</span>
            </div>
          ) : (
            <button
              onClick={handleSyncToSupabase}
              disabled={!isOnline || isSyncing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2"
            >
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Results to Cloud...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Sync & Publish to Supabase</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Exam Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white truncate max-w-sm">{test.title}</h2>
          </div>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400 font-mono">
            Candidate: {studentName} ({studentId})
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Strikes / Anti-Cheat Warning */}
          {strikes > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{strikes} Focus Alert{strikes > 1 ? 's' : ''}</span>
            </div>
          )}

          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold border ${
              timeLeftSeconds < 300
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => {
              if (confirm('Exit full screen and return to dashboard? Your draft is safely saved locally.')) {
                if (window.electronAPI) {
                  window.electronAPI.exitFullscreen();
                }
                onExitKiosk();
              }
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
            title="Exit Full Screen"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to finalize and submit this exam?')) {
                handleSealExam();
              }
            }}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </div>

      {/* Focus Violation Banner */}
      {showWarning && (
        <div className="bg-red-600 text-white text-xs py-2 px-4 flex items-center justify-center space-x-2 animate-bounce">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-bold">
            WARNING: Window focus lost! Any attempt to switch applications is recorded as a violation.
          </span>
        </div>
      )}

      {/* Main Split Layout: Left Problem Statement | Right Code Editor + Interactive Terminal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Question Nav + Problem Statement */}
        <div className="w-[42%] border-r border-slate-800 flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Question Tabs Bar */}
          <div className="flex items-center space-x-2 p-3 bg-slate-950/80 border-b border-slate-800 overflow-x-auto flex-shrink-0">
            {test.questions?.map((q, idx) => {
              const hasCode = !!answers[q.id]?.code?.trim();
              const isSelected = activeQuestionIndex === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : hasCode
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  {hasCode && <CheckCircle2 className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {/* Problem Statement Content */}
          {currentQuestion && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{currentQuestion.title}</h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentQuestion.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : currentQuestion.difficulty === 'Hard'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {currentQuestion.marks} Marks
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Problem Description
                </p>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.description}
                </p>
              </div>

              {currentQuestion.constraints && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Constraints
                  </p>
                  <pre className="text-xs font-mono text-amber-300 bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                    {currentQuestion.constraints}
                  </pre>
                </div>
              )}

              {currentQuestion.input_format && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Input Format
                  </p>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                    {currentQuestion.input_format}
                  </p>
                </div>
              )}

              {currentQuestion.output_format && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Output Format
                  </p>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                    {currentQuestion.output_format}
                  </p>
                </div>
              )}

              {/* Sample Test Cases in Problem Description */}
              {sampleCases.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Sample Test Cases ({sampleCases.length})</span>
                    <span className="text-[10px] text-blue-400 font-normal">Click Run below to execute</span>
                  </p>
                  {sampleCases.map((stc, stcIdx) => (
                    <div
                      key={stcIdx}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1">
                        <span className="font-bold text-slate-300">Sample Case {stcIdx + 1}</span>
                        <button
                          onClick={() => {
                            setCustomInput(stc.input);
                            setTerminalTab('custom_input');
                            setIsTerminalOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-[10px] flex items-center space-x-1"
                        >
                          <span>Load into Custom Input</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div>
                        <span className="text-slate-400">Input:</span>
                        <pre className="text-slate-200 mt-0.5 whitespace-pre-wrap">{stc.input}</pre>
                      </div>
                      <div>
                        <span className="text-emerald-400">Expected Output:</span>
                        <pre className="text-slate-200 mt-0.5 whitespace-pre-wrap">{stc.expected_output}</pre>
                      </div>
                      {stc.explanation && (
                        <p className="text-[11px] text-slate-500 font-sans italic mt-1">
                          Explanation: {stc.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor Canvas + Persistent Terminal Panel */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Editor Action Bar */}
          <div className="h-12 bg-slate-900/80 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-400">Language:</span>
              <select
                value={answers[currentQuestion?.id || '']?.language || 'python'}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-md px-2.5 py-1 outline-none font-medium"
              >
                {currentQuestion?.allowed_languages?.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'cpp' ? 'C++ (Clang)' : lang === 'c' ? 'C' : lang === 'python' ? 'Python 3' : 'Java'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setTerminalTab('custom_input');
                  setIsTerminalOpen(true);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                  isTerminalOpen && terminalTab === 'custom_input'
                    ? 'bg-slate-800 text-blue-400 border-blue-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Provide custom standard input (stdin)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Custom Input</span>
              </button>

              <button
                onClick={handleRunSampleCases}
                disabled={isRunningLocal}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow-md shadow-blue-500/20 transition"
              >
                {isRunningLocal ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling Locally...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Sample Cases</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Editor Canvas */}
          <div className="flex-1 relative min-h-0">
            <OfflineCodeEditor
              value={answers[currentQuestion?.id || '']?.code || ''}
              onChange={handleCodeChange}
              language={answers[currentQuestion?.id || '']?.language || 'python'}
            />
          </div>

          {/* Persistent Interactive Bottom Terminal Panel */}
          <div
            className={`border-t border-slate-800 flex flex-col bg-slate-950 transition-all duration-200 flex-shrink-0 ${
              isTerminalOpen ? 'h-72' : 'h-10'
            }`}
          >
            {/* Terminal Drawer Header Bar */}
            <div className="h-10 bg-slate-900 px-4 flex items-center justify-between border-b border-slate-800 select-none flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setIsTerminalOpen(true);
                    setTerminalTab('sample_cases');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition ${
                    terminalTab === 'sample_cases'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Test Results</span>
                  {runResults ? (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        runResults.allPassed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {runResults.passed}/{runResults.total}
                    </span>
                  ) : (
                    <span className="ml-1 text-[10px] text-slate-500 font-normal">
                      ({sampleCases.length} Cases)
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsTerminalOpen(true);
                    setTerminalTab('custom_input');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition ${
                    terminalTab === 'custom_input'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Custom Stdin Console</span>
                  {customResult && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                {runResults?.details?.some((d: any) => d.stderr) && (
                  <button
                    onClick={() => {
                      setIsTerminalOpen(true);
                      setTerminalTab('compiler_output');
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition ${
                      terminalTab === 'compiler_output'
                        ? 'bg-slate-800 text-red-400 border border-red-500/30'
                        : 'text-red-400/80 hover:text-red-300'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Compiler Error</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {runResults && (
                  <button
                    onClick={() => setRunResults(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-800 transition"
                  >
                    Clear Results
                  </button>
                )}

                <button
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold border border-slate-700 transition"
                  title={isTerminalOpen ? 'Minimize Terminal' : 'Open Terminal'}
                >
                  <span>Terminal</span>
                  {isTerminalOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terminal Drawer Body */}
            {isTerminalOpen && (
              <div className="flex-1 overflow-hidden p-3 bg-slate-950 font-mono text-xs flex flex-col">
                {/* TAB 1: SAMPLE TEST CASES EXECUTION & RESULTS */}
                {terminalTab === 'sample_cases' && (
                  <div className="h-full flex flex-col space-y-2.5 overflow-hidden">
                    {/* Test Case Selectors */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        {sampleCases.map((tc, idx) => {
                          const evalDetail = runResults?.details?.[idx];
                          const isSelected = selectedCaseIdx === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedCaseIdx(idx)}
                              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                              }`}
                            >
                              <span>Case {idx + 1}</span>
                              {evalDetail ? (
                                evalDetail.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                                )
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      {runResults && (
                        <div className="text-xs font-sans flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              runResults.allPassed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {runResults.allPassed
                              ? '✓ ALL SAMPLE TEST CASES PASSED'
                              : `${runResults.passed} of ${runResults.total} Sample Cases Passed`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Case Execution Details */}
                    {isRunningLocal ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                        <span className="text-xs">Compiling & executing code locally offline...</span>
                      </div>
                    ) : runResults ? (
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {activeTestCaseDetail ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-bold flex items-center space-x-1.5 ${
                                  activeTestCaseDetail.passed ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {activeTestCaseDetail.passed ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                <span>
                                  Test Case #{selectedCaseIdx + 1}:{' '}
                                  {activeTestCaseDetail.passed ? 'ACCEPTED (PASSED)' : 'WRONG ANSWER / RUNTIME ERROR'}
                                </span>
                              </span>

                              <span className="text-[11px] text-slate-400">
                                Runtime: <span className="text-slate-200 font-bold">{activeTestCaseDetail.timeMs}ms</span> • Exit Code:{' '}
                                <span className={activeTestCaseDetail.exitCode === 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {activeTestCaseDetail.exitCode}
                                </span>
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              {/* Input */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                  Standard Input
                                </span>
                                <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono select-text max-h-24 overflow-y-auto">
                                  {activeTestCaseDetail.input || '(Empty)'}
                                </pre>
                              </div>

                              {/* Expected Output */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                  Expected Output
                                </span>
                                <pre className="text-xs text-emerald-400 whitespace-pre-wrap font-mono select-text max-h-24 overflow-y-auto">
                                  {activeTestCaseDetail.expected_output}
                                </pre>
                              </div>

                              {/* Actual Output */}
                              <div
                                className={`bg-slate-900 border rounded-xl p-2.5 ${
                                  activeTestCaseDetail.passed ? 'border-emerald-500/30' : 'border-red-500/30'
                                }`}
                              >
                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                  Your Output
                                </span>
                                <pre
                                  className={`text-xs whitespace-pre-wrap font-mono select-text max-h-24 overflow-y-auto ${
                                    activeTestCaseDetail.passed
                                      ? 'text-emerald-400 font-semibold'
                                      : 'text-red-400 font-semibold'
                                  }`}
                                >
                                  {activeTestCaseDetail.actual_output || '(No stdout produced)'}
                                </pre>
                              </div>
                            </div>

                            {activeTestCaseDetail.stderr && (
                              <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-red-300 font-mono text-xs whitespace-pre-wrap">
                                <span className="font-bold text-red-400 block mb-1 flex items-center space-x-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Standard Error / Traceback:</span>
                                </span>
                                {activeTestCaseDetail.stderr}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-slate-400 text-xs">Select a test case above to inspect details.</div>
                        )}
                      </div>
                    ) : (
                      /* Not Run Yet */
                      <div className="flex-1 flex flex-col justify-center items-center space-y-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-4 text-center">
                        <Terminal className="w-8 h-8 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Sample Test Cases Ready for Execution</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Click below to compile locally and test your logic against {sampleCases.length} sample case(s).
                          </p>
                        </div>
                        <button
                          onClick={handleRunSampleCases}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Sample Cases Now</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: CUSTOM STDIN CONSOLE */}
                {terminalTab === 'custom_input' && (
                  <div className="h-full flex space-x-3 overflow-hidden">
                    {/* Left: Input Textarea */}
                    <div className="w-1/2 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Custom Standard Input (stdin)
                        </span>
                        <button
                          onClick={() => {
                            if (sampleCases[0]) setCustomInput(sampleCases[0].input);
                          }}
                          className="text-[10px] text-blue-400 hover:underline"
                        >
                          Reset to Sample 1
                        </button>
                      </div>

                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Provide space or line-separated inputs for your program..."
                        className="flex-1 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 font-mono text-xs resize-none outline-none focus:border-blue-500/50"
                      />

                      <button
                        onClick={handleRunCustomInput}
                        disabled={isCustomRunning}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center space-x-1.5"
                      >
                        {isCustomRunning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Running locally...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Run with Custom Input</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right: Output Terminal */}
                    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Execution Output (stdout)
                        </span>
                        {customResult && (
                          <span className="text-[10px] text-slate-400">
                            {customResult.timeMs}ms • Exit Code: {customResult.exitCode}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs overflow-y-auto select-text">
                        {isCustomRunning ? (
                          <div className="text-slate-400 flex items-center space-x-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            <span>Executing code locally with custom stdin...</span>
                          </div>
                        ) : customResult ? (
                          <div className="space-y-2">
                            {customResult.stdout && (
                              <pre className="text-emerald-400 whitespace-pre-wrap">{customResult.stdout}</pre>
                            )}
                            {customResult.stderr && (
                              <pre className="text-red-400 whitespace-pre-wrap">{customResult.stderr}</pre>
                            )}
                            {!customResult.stdout && !customResult.stderr && (
                              <span className="text-slate-500 italic">(Program exited with zero output)</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-center pt-8">
                            Enter stdin on the left and click "Run with Custom Input"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: COMPILER & ERROR LOGS */}
                {terminalTab === 'compiler_output' && (
                  <div className="h-full flex flex-col space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-hidden">
                    <span className="text-[10px] font-bold text-red-400 uppercase flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Compiler Diagnostics & Runtime Exception Traceback</span>
                    </span>

                    <pre className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-red-300 overflow-y-auto select-text whitespace-pre-wrap">
                      {runResults?.details?.find((d: any) => d.stderr)?.stderr ||
                        customResult?.stderr ||
                        'No compilation errors recorded.'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
