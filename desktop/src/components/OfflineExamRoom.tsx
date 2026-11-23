import React, { useState, useEffect, useRef } from 'react';
import { OfflineCodeEditor } from './OfflineCodeEditor';
import { supabase } from '../lib/supabase';
import { Test, Question, StudentSubmission } from '../types';
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
  ArrowRight
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

  const currentQuestion = test.questions?.[activeQuestionIndex] || null;

  // Initialize Starter Templates
  useEffect(() => {
    const initial: Record<string, { code: string; language: string }> = {};
    test.questions?.forEach(q => {
      const defaultLang = q.allowed_languages?.[0] || 'python';
      const template = q.starter_templates?.[defaultLang] || '';
      initial[q.id] = { code: template, language: defaultLang };
    });
    setAnswers(initial);

    // Enter Kiosk Mode
    if (window.electronAPI) {
      window.electronAPI.enterKiosk();
    }
  }, [test]);

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
    const template = currentQuestion.starter_templates?.[newLang] || '';
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        language: newLang,
        code: template
      }
    }));
  };

  // Execute Code Locally against Sample Test Cases
  const handleRunSampleCases = async () => {
    if (!currentQuestion || !window.electronAPI) return;
    setIsRunningLocal(true);
    setRunResults(null);

    const ans = answers[currentQuestion.id];
    const testCases = (currentQuestion.sample_test_cases || []).map((stc, i) => ({
      id: `sample_${i + 1}`,
      input: stc.input,
      expected_output: stc.expected_output,
      is_hidden: false
    }));

    try {
      const evaluation = await window.electronAPI.evaluateTestCases({
        language: ans.language,
        code: ans.code,
        testCases
      });
      setRunResults(evaluation);
    } catch (err: any) {
      setRunResults({
        total: testCases.length,
        passed: 0,
        allPassed: false,
        error: err.message
      });
    } finally {
      setIsRunningLocal(false);
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
      const allTestCases = [
        ...(q.sample_test_cases || []).map((tc, idx) => ({ ...tc, id: `s_${idx}`, is_hidden: false })),
        ...(q.hidden_test_cases || []).map((tc, idx) => ({ ...tc, id: `h_${idx}`, is_hidden: true }))
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
        total_sample_cases: (q.sample_test_cases || []).length,
        passed_hidden_cases: evalResult.details.filter(d => d.is_hidden && d.passed).length,
        total_hidden_cases: (q.hidden_test_cases || []).length,
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
                {isOnline ? 'Internet Detected!' : 'Turn on Wi-Fi to Sync Result'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isOnline
                  ? 'Your offline score is ready for instant cloud synchronization.'
                  : 'Please re-connect your network to upload this sealed record to Admin.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncToSupabase}
            disabled={!isOnline || isSyncing || syncSuccess}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
          >
            {isSyncing ? (
              <span>Uploading Batch Record...</span>
            ) : syncSuccess ? (
              <span>Synced! Redirecting...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Sync Submission to Admin</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Exam Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm tracking-tight text-white">{test.title}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Candidate: {studentName} ({studentId})
          </span>
        </div>

        {/* Live Timer & Submit */}
        <div className="flex items-center space-x-6">
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

      {/* Main Split Layout: Left Problem Description | Right Code Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Question Nav + Problem Statement */}
        <div className="w-[45%] border-r border-slate-800 flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Question Tabs Bar */}
          <div className="flex items-center space-x-2 p-3 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
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
                  <pre className="text-xs font-mono text-amber-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
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

              {/* Sample Cases */}
              {currentQuestion.sample_test_cases && currentQuestion.sample_test_cases.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sample Test Cases
                  </p>
                  {currentQuestion.sample_test_cases.map((stc, stcIdx) => (
                    <div
                      key={stcIdx}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono"
                    >
                      <div>
                        <span className="text-slate-400">Input:</span>
                        <pre className="text-slate-200 mt-1 whitespace-pre-wrap">{stc.input}</pre>
                      </div>
                      <div>
                        <span className="text-emerald-400">Output:</span>
                        <pre className="text-slate-200 mt-1 whitespace-pre-wrap">{stc.expected_output}</pre>
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

        {/* Right Pane: Code Editor & Local Offline Runner */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Editor Action Bar */}
          <div className="h-12 bg-slate-900/80 border-b border-slate-800 px-4 flex items-center justify-between">
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

            <button
              onClick={handleRunSampleCases}
              disabled={isRunningLocal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunningLocal ? 'Compiling Locally...' : 'Run Sample Cases'}</span>
            </button>
          </div>

          {/* Code Editor Canvas (100% Offline with zero CDN dependencies) */}
          <div className="flex-1 relative">
            <OfflineCodeEditor
              value={answers[currentQuestion?.id || '']?.code || ''}
              onChange={handleCodeChange}
              language={answers[currentQuestion?.id || '']?.language || 'python'}
            />
          </div>

          {/* Bottom Execution Console */}
          {runResults && (
            <div className="h-44 bg-slate-900 border-t border-slate-800 p-4 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Local Run Results:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      runResults.allPassed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {runResults.passed} / {runResults.total} Sample Cases Passed
                  </span>
                </div>
                <button
                  onClick={() => setRunResults(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Clear
                </button>
              </div>

              {runResults.details?.map((res: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border ${
                    res.passed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/5 border-red-500/20 text-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Test Case #{idx + 1}</span>
                    <span>{res.passed ? '✓ PASSED' : '✗ FAILED'} ({res.timeMs}ms)</span>
                  </div>
                  {!res.passed && (
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p>Expected: <span className="text-emerald-400 font-bold">{res.expected_output}</span></p>
                      <p>Actual: <span className="text-red-400 font-bold">{res.actual_output || '(Empty)'}</span></p>
                      {res.stderr && <pre className="text-red-400 mt-1 font-mono">{res.stderr}</pre>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
