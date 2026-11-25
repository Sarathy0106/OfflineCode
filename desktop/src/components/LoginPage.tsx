import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BrandLogo } from './BrandLogo';
import appLogo from '../assets/app_logo.png';
import {
  Shield,
  GraduationCap,
  Lock,
  ArrowRight,
  User,
  Sparkles,
  Layers,
  Cpu,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Wifi,
  WifiOff
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
  onLogin: (
    user: {
      role: 'admin' | 'student';
      name: string;
      id: string;
      email?: string;
      section?: string;
      dept?: string;
    },
    rememberMe?: boolean
  ) => void;
  isOnline: boolean;
  sessionExpired?: boolean;
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

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isOnline, sessionExpired = false }) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
        }, rememberMe);
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
      }, rememberMe);
    } else {
      setAdminAuthError(
        'Access Denied: Invalid credentials. Only authorized administrator accounts are permitted.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F8FD] text-[#1C2333] flex flex-col justify-between p-4 md:p-8 relative overflow-hidden select-none font-sans">
      {/* Decorative Background Curved Shapes matching the image style */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-blue-200/50 to-indigo-100/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-gradient-to-tr from-blue-200/40 to-sky-100/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-gradient-to-tl from-indigo-100/40 to-amber-100/30 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto z-10">
        <div className="flex items-center space-x-2.5">
          <img src={appLogo} alt="SMVEC Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
          <div>
            <h1 className="text-sm font-bold text-[#1A2451] tracking-tight flex items-center gap-2">
              Offline Exam & Code Platform
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2B3B82]/10 text-[#2B3B82] border border-[#2B3B82]/20 font-semibold">
                SMVEC AI & DS
              </span>
            </h1>
          </div>
        </div>

        {/* Network Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Online Mode</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Safe</span>
            </>
          )}
        </div>
      </header>

      {/* Main 2-Column Authentication Card (Faithful to the attached design) */}
      <main className="max-w-4xl w-full mx-auto my-auto z-10 py-4">
        <div className="bg-white rounded-[28px] border border-[#E2EAF5] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Brand, Mascot & Illustration */}
          <div className="p-8 md:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-white via-[#FAFBFD] to-[#F1F6FD] border-b md:border-b-0 md:border-r border-[#E2EAF5] relative">
            {/* Subtle background curved glow */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-100/60 rounded-full blur-xl pointer-events-none" />

            {/* Brand Logo & Cap Illustration */}
            <BrandLogo size="lg" variant="light" showIllustration={true} />

            <div className="mt-6 text-center max-w-xs">
              <p className="text-xs text-slate-500 leading-relaxed">
                Department of Artificial Intelligence & Data Science
              </p>
              <p className="text-[11px] font-semibold text-[#2B3B82] mt-1">
                Sri Manakula Vinayagar Engineering College
              </p>
            </div>
          </div>

          {/* Right Column: "Welcome back" Login Form Card */}
          <div className="p-8 md:p-10 flex flex-col justify-center bg-[#FDFEFE]">
            {/* Golden Horizontal Accent Dash */}
            <div className="w-12 h-1 bg-[#F5A623] rounded-full mb-3" />

            <h2 className="text-2xl font-black text-[#1A2451] tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Please enter your details to sign in.
            </p>

            {/* Session Expired Notice Banner */}
            {sessionExpired && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center space-x-2 mb-4 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Your login session has expired. Please sign in again to continue.</span>
              </div>
            )}

            {/* Role Switcher Pill */}
            <div className="bg-[#EEF3FA] p-1 rounded-xl flex items-center mb-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student');
                  setStudentAuthError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'student'
                    ? 'bg-[#2B3B82] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setAdminAuthError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-[#2B3B82] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Administrator</span>
              </button>
            </div>

            {selectedRole === 'student' ? (
              /* STUDENT LOGIN (Email + Enrollment Number as Password) */
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* Email / Username Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="Username or College Email"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#D0DCED] focus:border-[#2B3B82] focus:ring-2 focus:ring-[#2B3B82]/10 rounded-xl text-xs text-[#1C2333] font-medium outline-none transition placeholder:text-slate-400"
                  />
                </div>

                {/* Password / Enrollment Number Input with Toggle Eye */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Password (Enrollment Number)"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-[#D0DCED] focus:border-[#2B3B82] focus:ring-2 focus:ring-[#2B3B82]/10 rounded-xl text-xs text-[#1C2333] font-mono tracking-wider outline-none transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Remember Me & Help Link */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D0DCED] text-[#2B3B82] focus:ring-[#2B3B82]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Student credentials: Your college email and 7-digit enrollment number (from college identity card).');
                    }}
                    className="text-[#E69500] hover:text-[#C77F00] font-semibold transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                {studentAuthError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{studentAuthError}</span>
                  </div>
                )}

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isVerifyingStudent}
                  className="w-full py-3 bg-[#2B3B82] hover:bg-[#1E2B63] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-[#2B3B82]/20 transition flex items-center justify-center space-x-2 mt-2"
                >
                  <span>{isVerifyingStudent ? 'Verifying Student...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* ADMIN LOGIN FORM (STRICT 2 CREDENTIALS) */
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Admin Email Address"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#D0DCED] focus:border-[#2B3B82] focus:ring-2 focus:ring-[#2B3B82]/10 rounded-xl text-xs text-[#1C2333] font-medium outline-none transition placeholder:text-slate-400"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Admin Password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-[#D0DCED] focus:border-[#2B3B82] focus:ring-2 focus:ring-[#2B3B82]/10 rounded-xl text-xs text-[#1C2333] font-mono outline-none transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {adminAuthError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{adminAuthError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2B3B82] hover:bg-[#1E2B63] text-white rounded-xl text-xs font-bold shadow-md shadow-[#2B3B82]/20 transition flex items-center justify-center space-x-2 mt-2"
                >
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Divider "New here?" / "Create an Account" matching design */}
            <div className="mt-6 pt-5 border-t border-[#EEF3FA] text-center">
              <span className="text-xs text-slate-400 block mb-3">New here?</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedRole === 'student') {
                    setSelectedRole('admin');
                  } else {
                    setSelectedRole('student');
                  }
                }}
                className="w-full py-2.5 bg-white hover:bg-[#FFFDF7] border-2 border-[#F5A623] text-[#2B3B82] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4 text-[#F5A623]" />
                <span>
                  {selectedRole === 'student' ? 'Switch to Admin Portal' : 'Switch to Student Portal'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Credentials & Engine Info */}
      <footer className="max-w-4xl w-full mx-auto flex flex-col md:flex-row items-center justify-between pt-4 border-t border-[#E2EAF5] text-xs text-slate-500 z-10 gap-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#2B3B82] flex-shrink-0" />
          <span>Offline Compilers (Python 3, GCC/C++, Java)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Anti-Cheat Kiosk Lockdown Active</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#E69500] flex-shrink-0" />
          <span>SMVEC AI & DS v1.1.0</span>
        </div>
      </footer>
    </div>
  );
};
