import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Shield,
  GraduationCap,
  Lock,
  ArrowRight,
  User,
  Sparkles,
  Layers,
  Cpu,
  AlertCircle
} from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  register_number: string;
  enrollment_number: string;
  section: string;
  current_year: string;
  department: string;
  batch: string;
  phone: string;
  college_email: string;
  personal_email?: string;
  dob: string;
  blood_group: string;
}

interface LoginPageProps {
  onLogin: (user: {
    role: 'admin' | 'student';
    name: string;
    id: string;
    email?: string;
    section?: string;
    dept?: string;
  }) => void;
  isOnline: boolean;
}

// Authorized Admin Credentials (Strictly 2 accounts allowed)
const AUTHORIZED_ADMINS = [
  {
    email: 'facadmin@offlinecode.com',
    pass: 'Admin@aidssmvec',
    name: 'Faculty Administrator',
    id: 'FAC-ADMIN-01',
    roleLabel: 'Faculty Admin'
  },
  {
    email: 'stuadmin@offlinecode.com',
    pass: 'Admin@aidssmvec',
    name: 'Student Administrator',
    id: 'STU-ADMIN-02',
    roleLabel: 'Student Admin'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isOnline }) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin'>('student');

  // Student Auth State (NO LISTING: College Email + Enrollment Number as Password)
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAuthError, setStudentAuthError] = useState<string | null>(null);
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);

  // Admin Auth State (Strictly 2 authorized accounts)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Handle Student Login: Validates against Supabase students table
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentAuthError(null);

    const emailTrim = studentEmail.trim().toLowerCase();
    const passTrim = studentPassword.trim().toUpperCase();

    if (!emailTrim || !passTrim) {
      setStudentAuthError('Please enter both your college email and enrollment number.');
      return;
    }

    setIsVerifyingStudent(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
      }

      const allStudents = (data as StudentRecord[]) || [];

      // Match student by Email & Enrollment Number password
      const matchedStudent = allStudents.find((s) => {
        const matchesEmail =
          (s.college_email && s.college_email.toLowerCase() === emailTrim) ||
          (s.personal_email && s.personal_email.toLowerCase() === emailTrim) ||
          (s.register_number && s.register_number.toLowerCase() === emailTrim) ||
          (s.register_number && `${s.register_number.toLowerCase()}@smvec.ac.in` === emailTrim) ||
          (s.enrollment_number && s.enrollment_number.toLowerCase() === emailTrim);

        const matchesPass =
          (s.enrollment_number && s.enrollment_number.trim().toUpperCase() === passTrim) ||
          (s.register_number && s.register_number.trim().toUpperCase() === passTrim);

        return matchesEmail && matchesPass;
      });

      if (matchedStudent) {
        onLogin({
          role: 'student',
          name: matchedStudent.name,
          id: matchedStudent.register_number || matchedStudent.enrollment_number,
          email: matchedStudent.college_email || `${matchedStudent.register_number?.toLowerCase()}@smvec.ac.in`,
          section: matchedStudent.section,
          dept: matchedStudent.department
        });
      } else {
        setStudentAuthError(
          'Authentication failed. Invalid College Email or Enrollment Number. Please check your credentials.'
        );
      }
    } catch (err: any) {
      setStudentAuthError(err?.message || 'Error verifying credentials against database.');
    } finally {
      setIsVerifyingStudent(false);
    }
  };

  // Handle Admin Login (Strictly checks the 2 authorized credentials)
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);

    const emailTrim = adminEmail.trim().toLowerCase();
    const passTrim = adminPassword.trim();

    const matchedAdmin = AUTHORIZED_ADMINS.find(
      (a) => a.email.toLowerCase() === emailTrim && a.pass === passTrim
    );

    if (matchedAdmin) {
      onLogin({
        role: 'admin',
        name: matchedAdmin.name,
        id: matchedAdmin.id,
        email: matchedAdmin.email
      });
    } else {
      setAdminAuthError(
        'Access Denied: Invalid credentials. Only authorized administrator accounts are permitted.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Offline Examination Platform
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                v1.0 Kiosk
              </span>
            </h1>
            <p className="text-xs text-slate-400">Department of AI & Data Science • SMVEC</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Status:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isOnline ? 'Online (Supabase Connected)' : 'Offline Kiosk Mode'}
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {/* Role Switcher Pill */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center mb-6">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                setStudentAuthError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                selectedRole === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setAdminAuthError(null);
              }}
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
            /* CLEAN STUDENT LOGIN (NO LISTING, EMAIL + ENROLLMENT NUMBER AS PASSWORD) */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  College Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. btechaids2511156@smvec.ac.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Use your registered SMVEC college email or register number.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Password (Enrollment Number)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Enter your Enrollment Number (e.g. 2511156)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Your official 7-digit enrollment number acts as your password.
                </p>
              </div>

              {studentAuthError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{studentAuthError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingStudent}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 mt-2"
              >
                <span>{isVerifyingStudent ? 'Verifying Credentials...' : 'Sign In to Student Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ADMIN LOGIN FORM (STRICT 2 CREDENTIALS) */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="facadmin@offlinecode.com or stuadmin@offlinecode.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition font-mono"
                  />
                </div>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
              >
                <span>Authenticate as Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-5xl w-full mx-auto grid grid-cols-3 gap-4 pt-4 border-t border-slate-900 text-xs text-slate-500 z-10">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>Local Compiler Engine (Python 3, C++, C, Java)</span>
        </div>
        <div className="flex items-center space-x-2 text-center justify-center">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Anti-Cheat Kiosk Lockdown Enabled</span>
        </div>
        <div className="flex items-center space-x-2 justify-end">
          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>Cross-Platform macOS & Windows (.exe)</span>
        </div>
      </footer>
    </div>
  );
};
