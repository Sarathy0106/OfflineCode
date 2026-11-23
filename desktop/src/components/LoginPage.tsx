import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Lock,
  ArrowRight,
  User,
  Sparkles,
  BookOpen,
  Terminal,
  Layers,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { role: 'admin' | 'student'; name: string; id: string; email?: string }) => void;
  isOnline: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isOnline }) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin'>('student');
  const [studentId, setStudentId] = useState('CS2026-042');
  const [studentName, setStudentName] = useState('Sarathy V');
  const [studentPass, setStudentPass] = useState('password123');

  const [adminEmail, setAdminEmail] = useState('admin@exam.local');
  const [adminPass, setAdminPass] = useState('admin2026');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim()) return;
    onLogin({
      role: 'student',
      name: studentName.trim(),
      id: studentId.trim(),
      email: `${studentId.toLowerCase()}@student.edu`
    });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) return;
    onLogin({
      role: 'admin',
      name: 'System Administrator',
      id: 'ADMIN-01',
      email: adminEmail.trim()
    });
  };

  const quickStudents = [
    { name: 'Sarathy V', id: 'CS2026-042', dept: 'Computer Science' },
    { name: 'Alex Rivera', id: 'CS2026-015', dept: 'Software Eng' },
    { name: 'Priya Sharma', id: 'CS2026-088', dept: 'AI & Data Science' }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Online Education & Examination Platform
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                v1.0 Desktop
              </span>
            </h1>
            <p className="text-xs text-slate-400">Offline Secure Testing & Administration Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Network:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isOnline ? 'Online Ready' : '100% Offline Mode'}
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {/* Role Switcher Pill */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                selectedRole === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>

          {selectedRole === 'student' ? (
            /* Student Login Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Student Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Sarathy V"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Roll / Student ID
                </label>
                <div className="relative">
                  <Terminal className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. CS2026-042"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Passcode / Exam Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 mt-2"
              >
                <span>Authenticate as Student</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Profile Chips */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">
                  Quick Demo Accounts:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {quickStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setStudentName(s.name);
                        setStudentId(s.id);
                      }}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition"
                    >
                      <p className="text-[11px] font-bold text-white truncate">{s.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono truncate">{s.id}</p>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* Admin Login Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Admin Email / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@exam.local"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 mt-2"
              >
                <span>Authenticate as Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@exam.local');
                    setAdminPass('admin2026');
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Default Controller Account</p>
                    <p className="text-[10px] text-slate-400 font-mono">admin@exam.local (Pre-filled)</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer Features Info */}
      <footer className="max-w-6xl w-full mx-auto grid grid-cols-3 gap-4 pt-4 border-t border-slate-900 text-xs text-slate-500 z-10">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>Local Compiler Engine (Python 3, C++, C, Java)</span>
        </div>
        <div className="flex items-center space-x-2 text-center justify-center">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Strict Offline Anti-Cheat & SHA-256 Seal</span>
        </div>
        <div className="flex items-center space-x-2 justify-end">
          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>Cross-Platform macOS & Windows App</span>
        </div>
      </footer>
    </div>
  );
};
