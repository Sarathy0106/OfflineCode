import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  Cpu,
  Search,
  Filter,
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

// Authorized Admin Credentials
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

  // Student Auth State
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentPasscode, setStudentPasscode] = useState('');
  const [studentAuthError, setStudentAuthError] = useState<string | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Admin Auth State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Fetch students dataset from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setStudents(data as StudentRecord[]);
          // Pre-select first student
          setSelectedStudent(data[0] as StudentRecord);
        }
      } catch (err) {
        console.error('Failed to fetch students from Supabase:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students by section and search query (name, register number, or enrollment number)
  const filteredStudents = students.filter((s) => {
    const matchesSection = selectedSection === 'All' || s.section === selectedSection;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query) ||
      (s.register_number && s.register_number.toLowerCase().includes(query)) ||
      (s.enrollment_number && s.enrollment_number.toLowerCase().includes(query)) ||
      (s.college_email && s.college_email.toLowerCase().includes(query));
    return matchesSection && matchesQuery;
  });

  // Handle Student Login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentAuthError(null);

    let targetStudent = selectedStudent;
    if (!targetStudent && searchQuery.trim()) {
      targetStudent =
        students.find(
          (s) =>
            s.register_number?.toLowerCase() === searchQuery.toLowerCase().trim() ||
            s.enrollment_number?.toLowerCase() === searchQuery.toLowerCase().trim() ||
            s.name.toLowerCase() === searchQuery.toLowerCase().trim()
        ) || null;
    }

    if (!targetStudent) {
      setStudentAuthError('Please select or search your student profile from the dataset.');
      return;
    }

    onLogin({
      role: 'student',
      name: targetStudent.name,
      id: targetStudent.register_number || targetStudent.enrollment_number || 'CS2026',
      email: targetStudent.college_email || `${targetStudent.register_number?.toLowerCase()}@smvec.ac.in`,
      section: targetStudent.section,
      dept: targetStudent.department
    });
  };

  // Handle Admin Login (Strictly checks the 2 credentials)
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
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Online Education & Examination Platform
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                SMVEC AI&DS Dataset (2025-2029)
              </span>
            </h1>
            <p className="text-xs text-slate-400">Department of Artificial Intelligence & Data Science</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Database:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isOnline ? `Supabase Connected (${students.length} Students)` : 'Offline Mode'}
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="max-w-2xl w-full mx-auto my-auto z-10 py-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {/* Role Switcher Pill */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                selectedRole === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Authentication ({students.length} Registered)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Admin Portal (Authorized Only)</span>
            </button>
          </div>

          {selectedRole === 'student' ? (
            /* STUDENT LOGIN FORM WITH DATASET SEARCH */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Your Profile (AI&DS Batch 2025-2029)
                  </label>
                  {/* Section Filters */}
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {['All', 'A', 'B', 'C', 'D', 'E'].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSection(sec)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          selectedSection === sec
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sec {sec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name, Register No (e.g. 25UAI002), or Enrollment No..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Scrollable Student Selection Grid */}
                <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1.5 divide-y divide-slate-900">
                  {isLoadingStudents ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Loading student records from Supabase...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching student found in database.
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudent?.register_number === s.register_number;
                      return (
                        <div
                          key={s.id || s.register_number}
                          onClick={() => setSelectedStudent(s)}
                          className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-xs flex items-center space-x-2">
                              <span>{s.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Sec {s.section}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Reg: {s.register_number} • Enr: {s.enrollment_number} • {s.department}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Profile Card Preview */}
              {selectedStudent && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Examinee:</span>
                    <p className="font-bold text-white text-sm">{selectedStudent.name}</p>
                    <p className="text-[11px] text-blue-400 font-mono">
                      {selectedStudent.register_number} • Section {selectedStudent.section} • {selectedStudent.department}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <p>{selectedStudent.college_email || `${selectedStudent.register_number.toLowerCase()}@smvec.ac.in`}</p>
                    <p className="text-emerald-400 font-bold">Verified in DB</p>
                  </div>
                </div>
              )}

              {studentAuthError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{studentAuthError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedStudent}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
              >
                <span>Launch Student Examination Portal</span>
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
                    placeholder="e.g. facadmin@offlinecode.com or stuadmin@offlinecode.com"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
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

              {/* 1-Click Fast Login for the Two Authorized Admin Accounts */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Authorized Administrator Accounts (Click to Fill):
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {AUTHORIZED_ADMINS.map((admin) => (
                    <button
                      key={admin.email}
                      type="button"
                      onClick={() => {
                        setAdminEmail(admin.email);
                        setAdminPassword(admin.pass);
                        setAdminAuthError(null);
                      }}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {admin.roleLabel}
                        </span>
                        <p className="text-xs font-bold text-white mt-1">{admin.email}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Pass: {admin.pass}</p>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
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
          <span>280 Verified Students in Supabase DB</span>
        </div>
      </footer>
    </div>
  );
};
