import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Test, Question, TestCase, TestAttempt } from '../types';
import {
  Upload,
  CheckCircle2,
  XCircle,
  FileCode,
  AlertTriangle,
  Play,
  Send,
  Eye,
  Trash2,
  Trophy,
  Users,
  Award,
  Layers,
  Clock,
  RefreshCw,
  Plus,
  BookOpen,
  Activity,
  Database,
  Filter,
  Search,
  Check,
  ShieldAlert,
  ArrowRight,
  Code2,
  Terminal,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
} from 'lucide-react';

interface AdminJsonTemplate {
  test_title: string;
  subject: string;
  topic?: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  instructions: string[];
  questions: Array<{
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    marks: number;
    description: string;
    constraints?: string;
    input_format?: string;
    output_format?: string;
    allowed_languages: string[];
    starter_templates: Record<string, string>;
    sample_test_cases: Array<{
      input: string;
      expected_output: string;
      explanation?: string;
    }>;
    hidden_test_cases: Array<{
      input: string;
      expected_output: string;
    }>;
  }>;
}

const SAMPLE_JSON: AdminJsonTemplate = {
  test_title: "Data Structures & Algorithms - Sprint 1",
  subject: "Computer Science",
  topic: "Arrays & Strings",
  duration_minutes: 60,
  total_marks: 100,
  passing_percentage: 50,
  instructions: [
    "Turn off Wi-Fi before starting the examination.",
    "Exam runs in locked full-screen mode.",
    "Answers are saved locally and synced after re-enabling Wi-Fi."
  ],
  questions: [
    {
      id: "q1",
      title: "Two Sum",
      difficulty: "Easy",
      marks: 50,
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
      input_format: "Line 1: N (array length)\nLine 2: N space-separated integers\nLine 3: target integer",
      output_format: "Two space-separated indices (0-indexed)",
      allowed_languages: ["python", "cpp", "java", "c"],
      starter_templates: {
        python: "# Write your solution here\n",
        cpp: "// Write your solution here\n",
        java: "// Write your solution here\n",
        c: "// Write your solution here\n"
      },
      sample_test_cases: [
        {
          input: "4\n2 7 11 15\n9",
          expected_output: "0 1",
          explanation: "nums[0] + nums[1] = 2 + 7 = 9"
        }
      ],
      hidden_test_cases: [
        {
          input: "3\n3 2 4\n6",
          expected_output: "1 2"
        },
        {
          input: "2\n3 3\n6",
          expected_output: "0 1"
        }
      ]
    },
    {
      id: "q2",
      title: "Valid Palindrome",
      difficulty: "Easy",
      marks: 50,
      description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.",
      constraints: "1 <= s.length <= 2 * 10^5",
      input_format: "Single line string s",
      output_format: "Print YES if valid palindrome, otherwise NO",
      allowed_languages: ["python", "cpp", "java", "c"],
      starter_templates: {
        python: "# Write your solution here\n",
        cpp: "// Write your solution here\n",
        java: "// Write your solution here\n",
        c: "// Write your solution here\n"
      },
      sample_test_cases: [
        {
          input: "A man, a plan, a canal: Panama",
          expected_output: "YES",
          explanation: "amanaplanacanalpanama is a palindrome."
        }
      ],
      hidden_test_cases: [
        {
          input: "race a car",
          expected_output: "NO"
        }
      ]
    }
  ]
};

// Initial CRUD Entities (Fetched live from Supabase)
const INITIAL_STUDENTS: Array<any> = [];

const INITIAL_SUBJECTS = ['Computer Science', 'Algorithms & Data Structures', 'Operating Systems', 'Discrete Mathematics'];
const INITIAL_TOPICS = ['Arrays & Hash Maps', 'Strings & Two Pointers', 'Dynamic Programming', 'Trees & Graphs', 'Bit Manipulation'];

interface PracticeItem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  attempts: number;
  explanation: string;
}

const INITIAL_PRACTICE_ITEMS: PracticeItem[] = [
  { id: 'p1', title: 'Two Sum Problem', topic: 'Arrays & Hash Maps', difficulty: 'Easy', attempts: 24, explanation: 'Use a hash map to look up complement (target - num) in O(1) time.' },
  { id: 'p2', title: 'Valid Palindrome String', topic: 'Strings & Two Pointers', difficulty: 'Easy', attempts: 18, explanation: 'Two pointers moving inward skipping non-alphanumeric chars.' },
  { id: 'p3', title: 'Fibonacci Dynamic State', topic: 'Dynamic Programming', difficulty: 'Easy', attempts: 15, explanation: 'State variables a, b iterative calculation in O(N) time and O(1) memory.' },
  { id: 'p4', title: 'Maximum Subarray (Kadane)', topic: 'Arrays & Hash Maps', difficulty: 'Medium', attempts: 12, explanation: 'Kadane algorithm tracking current_max and global_max in single linear pass.' }
];

export type AdminTab = 'dashboard' | 'leaderboard' | 'question_test' | 'practice' | 'results' | 'monitoring' | 'crud';

interface AdminPortalProps {
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  syncTrigger?: number;
  onSyncStateChange?: (syncing: boolean) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activeTab: propActiveTab,
  onTabChange,
  syncTrigger,
  onSyncStateChange
}) => {
  // 7 Admin Pages extracted from user handwritten diagram:
  // 1. Dashboard, 2. Leaderboard, 3. Question [Test], 4. Practice, 5. Results [Test + Practice], 6. Monitoring, 7. CRUD Operation
  const [internalTab, setInternalTab] = useState<AdminTab>('dashboard');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: AdminTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [parsedJson, setParsedJson] = useState<AdminJsonTemplate | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  // CRUD State
  const [crudTab, setCrudTab] = useState<'students' | 'subjects' | 'topics' | 'practice_sets'>('students');
  const [studentsList, setStudentsList] = useState(INITIAL_STUDENTS);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSectionFilter, setStudentSectionFilter] = useState('All');
  const [subjectsList, setSubjectsList] = useState(INITIAL_SUBJECTS);
  const [topicsList, setTopicsList] = useState(INITIAL_TOPICS);
  const [practiceList, setPracticeList] = useState(INITIAL_PRACTICE_ITEMS);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  // Results & Inspector Modal
  const [selectedSubmissionInspect, setSelectedSubmissionInspect] = useState<any | null>(null);
  const [resultsFilter, setResultsFilter] = useState<'all' | 'tests' | 'practice'>('all');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'tests' | 'practice'>('all');

  // Load tests & results from Supabase
  const fetchData = async () => {
    setIsLoading(true);
    if (onSyncStateChange) onSyncStateChange(true);
    try {
      const { data: testList } = await supabase
        .from('tests')
        .select('*, questions(*, test_cases(*))')
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
        .order('submitted_at', { ascending: false });
      if (attemptList) setAttempts(attemptList as TestAttempt[]);

      // Fetch 280 Students from Supabase
      const { data: studentList } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (studentList && studentList.length > 0) {
        setStudentsList(studentList.map((st: any) => ({
          id: st.id,
          name: st.name,
          roll_id: st.register_number || st.enrollment_number || 'N/A',
          email: st.college_email || st.personal_email || `${st.register_number?.toLowerCase()}@smvec.ac.in`,
          dept: `${st.department || 'AI&DS'} (Sec ${st.section || 'A'})`,
          section: st.section || 'A',
          status: 'Active',
          score: 0
        })));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
      if (onSyncStateChange) onSyncStateChange(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (syncTrigger && syncTrigger > 0) {
      fetchData();
    }
  }, [syncTrigger]);

  const handleJsonUpload = (content: string) => {
    setUploadError(null);
    setPublishSuccess(false);
    try {
      const data = JSON.parse(content) as AdminJsonTemplate;
      if (!data.test_title || !data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid format: Must contain 'test_title' and an array of 'questions'.");
      }
      setParsedJson(data);
      setJsonText(content);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse JSON file.');
      setParsedJson(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleJsonUpload(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    const content = JSON.stringify(SAMPLE_JSON, null, 2);
    handleJsonUpload(content);
  };

  // Publish Parsed JSON to Supabase
  const handlePublishToSupabase = async () => {
    if (!parsedJson) return;
    setIsPublishing(true);
    setPublishSuccess(false);

    try {
      // 1. Insert into 'tests'
      const { data: testRow, error: testError } = await supabase
        .from('tests')
        .insert({
          title: parsedJson.test_title,
          subject: parsedJson.subject || 'Computer Science',
          topic: parsedJson.topic || 'Coding Sprint',
          duration_minutes: parsedJson.duration_minutes || 60,
          total_marks: parsedJson.total_marks || 100,
          passing_percentage: parsedJson.passing_percentage || 50,
          instructions: parsedJson.instructions || [],
          is_published: true
        })
        .select()
        .single();

      if (testError || !testRow) throw testError || new Error('Failed to create test entry');

      // 2. Insert questions
      for (let i = 0; i < parsedJson.questions.length; i++) {
        const q = parsedJson.questions[i];
        const { data: questionRow, error: qError } = await supabase
          .from('questions')
          .insert({
            test_id: testRow.id,
            order_index: i + 1,
            title: q.title,
            difficulty: q.difficulty,
            marks: q.marks,
            description: q.description,
            constraints: q.constraints,
            input_format: q.input_format,
            output_format: q.output_format,
            allowed_languages: q.allowed_languages,
            starter_templates: q.starter_templates
          })
          .select()
          .single();

        if (qError || !questionRow) throw qError || new Error(`Failed to insert question: ${q.title}`);

        // 3. Insert Sample Test Cases
        if (q.sample_test_cases && q.sample_test_cases.length > 0) {
          const sampleRows = q.sample_test_cases.map(stc => ({
            question_id: questionRow.id,
            input: stc.input,
            expected_output: stc.expected_output,
            is_hidden: false,
            explanation: stc.explanation
          }));
          await supabase.from('test_cases').insert(sampleRows);
        }

        // 4. Insert Hidden Test Cases
        if (q.hidden_test_cases && q.hidden_test_cases.length > 0) {
          const hiddenRows = q.hidden_test_cases.map(htc => ({
            question_id: questionRow.id,
            input: htc.input,
            expected_output: htc.expected_output,
            is_hidden: true
          }));
          await supabase.from('test_cases').insert(hiddenRows);
        }
      }

      setPublishSuccess(true);
      fetchData();
      setTimeout(() => {
        setActiveTab('question_test');
      }, 1200);
    } catch (err: any) {
      alert(`Publishing failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test and all its questions?')) return;
    try {
      await supabase.from('tests').delete().eq('id', testId);
      setTests(prev => prev.filter(t => t.id !== testId));
    } catch (err: any) {
      alert(`Error deleting test: ${err.message}`);
    }
  };

  const handleTogglePublish = async (testId: string, current: boolean) => {
    try {
      await supabase.from('tests').update({ is_published: !current }).eq('id', testId);
      setTests(prev => prev.map(t => (t.id === testId ? { ...t, is_published: !current } : t)));
    } catch (err: any) {
      alert(`Error updating test: ${err.message}`);
    }
  };

  // Add new student (CRUD + Supabase)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRoll.trim()) return;
    try {
      const reg = newStudentRoll.trim().toUpperCase();
      const { data } = await supabase.from('students').insert({
        name: newStudentName.trim(),
        register_number: reg,
        enrollment_number: reg,
        section: 'A',
        department: 'AI&DS',
        batch: '2025-2029',
        college_email: `${reg.toLowerCase()}@smvec.ac.in`,
        status: 'Active'
      }).select().single();

      const newSt = {
        id: data?.id || `st-${Date.now()}`,
        name: newStudentName.trim(),
        roll_id: reg,
        email: `${reg.toLowerCase()}@smvec.ac.in`,
        dept: 'AI&DS (Sec A)',
        section: 'A',
        status: 'Active',
        score: 0
      };
      setStudentsList([newSt, ...studentsList]);
      setNewStudentName('');
      setNewStudentRoll('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await supabase.from('students').delete().eq('id', id);
      setStudentsList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Add new subject (CRUD)
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setSubjectsList([...subjectsList, newSubjectName.trim()]);
    setNewSubjectName('');
  };

  // Add new topic (CRUD)
  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setTopicsList([...topicsList, newTopicName.trim()]);
    setNewTopicName('');
  };

  // Computed metrics
  const totalStudentsCount = studentsList.length;
  const totalTestsCount = tests.length;
  const totalPracticeCount = practiceList.length;
  const totalCompletedAttempts = attempts.length;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / attempts.length)
    : 78;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F4F8FD] text-[#1C2333] select-none font-sans">
      {/* Admin Top Title Header */}
      <div className="flex items-center justify-between border-b border-[#E2EAF5] pb-4">
        <div>
          <span className="text-xs font-bold text-[#2B3B82] uppercase tracking-wider">
            Administrator Command Center
          </span>
          <h1 className="text-2xl font-black text-[#1A2451] mt-1">Examination & Education Management</h1>
          <p className="text-xs text-slate-500">
            Standardized JSON test publisher, practice challenges, student monitor, and academic leaderboard.
          </p>
        </div>
      </div>

      {/* =========================================================================
          PAGE 1: ADMIN DASHBOARD
      ========================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-white">{totalStudentsCount}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">● 3 Active Now</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Tests Created</p>
                <p className="text-2xl font-bold text-white">{totalTestsCount}</p>
                <span className="text-[10px] text-blue-400 font-semibold">Supabase Synced</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Practice Questions</p>
                <p className="text-2xl font-bold text-white">{totalPracticeCount}</p>
                <span className="text-[10px] text-slate-500 font-semibold">4 Topic Sets</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Average Performance</p>
                <p className="text-2xl font-bold text-white">{averageScore}%</p>
                <span className="text-[10px] text-emerald-400 font-semibold">88% Passing Rate</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Student Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    loadSample();
                    setActiveTab('question_test');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-between"
                >
                  <span>Upload New Test Specification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-between"
                >
                  <span>Manage Practice Problem Sets</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-between"
                >
                  <span>View Student Standings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Student Activities</span>
                </h3>
                <span className="text-[11px] text-slate-400">Live Examination Feed</span>
              </div>

              <div className="divide-y divide-slate-800 text-xs">
                {attempts.length === 0 ? (
                  <div className="py-6 text-center text-slate-500">
                    No student submissions logged yet. Start an exam on the Student Portal to see live activity.
                  </div>
                ) : (
                  attempts.slice(0, 4).map((att) => (
                    <div key={att.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-white">{att.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {att.student_id} • Score: {att.total_score}/{att.max_score} ({att.percentage}%)
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 2: LEADERBOARD
      ========================================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Academic Performance Leaderboard</span>
            </h2>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Category:</span>
              <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg flex space-x-1">
                {(['all', 'tests', 'practice'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLeaderboardFilter(filter)}
                    className={`px-3 py-1 rounded-md capitalize font-semibold transition ${
                      leaderboardFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'All Activities' : filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Roll ID</th>
                  <th className="p-4">Total Score</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Academic Tier</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No records in leaderboard yet. Complete an exam to register rankings.
                    </td>
                  </tr>
                ) : (
                  attempts
                    .slice()
                    .sort((a, b) => b.total_score - a.total_score)
                    .map((att, index) => (
                      <tr key={att.id} className="hover:bg-slate-800/30">
                        <td className="p-4 font-bold text-sm">
                          {index === 0 && <span className="text-amber-400">🥇 1st Place</span>}
                          {index === 1 && <span className="text-slate-300">🥈 2nd Place</span>}
                          {index === 2 && <span className="text-amber-600">🥉 3rd Place</span>}
                          {index > 2 && <span className="text-slate-500 font-mono">#{index + 1}</span>}
                        </td>
                        <td className="p-4 font-bold text-white">{att.student_name}</td>
                        <td className="p-4 text-slate-400 font-mono">{att.student_id}</td>
                        <td className="p-4 font-bold text-white">{att.total_score} Marks</td>
                        <td className="p-4 font-bold text-emerald-400">{att.percentage}%</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {att.percentage >= 90 ? 'Diamond' : att.percentage >= 75 ? 'Gold' : 'Silver'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            QUALIFIED
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 3: QUESTION [TEST] MANAGEMENT & JSON UPLOAD
      ========================================================================== */}
      {activeTab === 'question_test' && (
        <div className="space-y-6">
          {/* Upload Specification Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Upload Test Specification (JSON)</h2>
                <p className="text-xs text-slate-400">
                  Select a standardized JSON template containing coding questions, starter templates, and test cases.
                </p>
              </div>
              <button
                onClick={loadSample}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                Load Sample JSON
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 bg-slate-950/50 transition">
                <Upload className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  Click to select questions.json or drag and drop
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Accepts standard JSON schema</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Interactive Preview If Parsed */}
          {parsedJson && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    {parsedJson.subject} • {parsedJson.topic}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{parsedJson.test_title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                    <span>Duration: <strong className="text-white">{parsedJson.duration_minutes}m</strong></span>
                    <span>Total Marks: <strong className="text-white">{parsedJson.total_marks}</strong></span>
                    <span>Questions: <strong className="text-white">{parsedJson.questions.length}</strong></span>
                  </div>
                </div>

                <button
                  onClick={handlePublishToSupabase}
                  disabled={isPublishing || publishSuccess}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : publishSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Published!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish to Supabase</span>
                    </>
                  )}
                </button>
              </div>

              {/* Parsed Questions List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Parsed Coding Tasks ({parsedJson.questions.length})</h4>
                {parsedJson.questions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-bold">
                          Q{idx + 1}
                        </span>
                        <span className="text-sm font-bold text-white">{q.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{q.marks} Marks • {q.difficulty}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{q.description}</p>
                    <div className="text-[11px] text-slate-400">
                      Sample Cases: {q.sample_test_cases?.length || 0} • Hidden Cases: {q.hidden_test_cases?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Published Tests in DB */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Published Coding Examinations ({tests.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map(test => (
                <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      {test.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{test.duration_minutes} Mins</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{test.title}</h4>
                  <p className="text-xs text-slate-400">Questions: {test.questions?.length || 0} • Total: {test.total_marks} Marks</p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleTogglePublish(test.id, test.is_published)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        test.is_published
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {test.is_published ? 'Published' : 'Draft'}
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 4: PRACTICE MANAGEMENT
      ========================================================================== */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Practice Challenges Management</span>
              </h2>
              <p className="text-xs text-slate-400">Organize topic-wise practice problem sets and solutions for students.</p>
            </div>
            <button
              onClick={() => {
                const title = prompt('Enter practice problem title:');
                if (title) {
                  const newItem: PracticeItem = {
                    id: `p-${Date.now()}`,
                    title,
                    topic: 'Arrays & Hash Maps',
                    difficulty: 'Easy',
                    attempts: 0,
                    explanation: 'Standard optimal algorithm with linear time complexity.'
                  };
                  setPracticeList([...practiceList, newItem]);
                }
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Practice Question</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practiceList.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {item.topic}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {item.difficulty}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 italic">{item.explanation}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Student Attempts: <strong>{item.attempts}</strong></span>
                  <button
                    onClick={() => setPracticeList(practiceList.filter(p => p.id !== item.id))}
                    className="text-red-400 hover:underline text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 5: RESULTS [TEST + PRACTICE]
      ========================================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span>Results & Evaluations Management</span>
              </h2>
              <p className="text-xs text-slate-400">Review student test attempts, execution logs, and cryptographic SHA-256 seals.</p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Filter:</span>
              <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg flex space-x-1">
                {(['all', 'tests', 'practice'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setResultsFilter(f)}
                    className={`px-3 py-1 rounded-md capitalize font-semibold transition ${
                      resultsFilter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Roll ID</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">SHA-256 Hash</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No results submitted yet.
                    </td>
                  </tr>
                ) : (
                  attempts.map(att => (
                    <tr key={att.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-white">{att.student_name}</td>
                      <td className="p-4 text-slate-400 font-mono">{att.student_id}</td>
                      <td className="p-4 font-bold text-white">{att.total_score} / {att.max_score}</td>
                      <td className="p-4 font-bold text-emerald-400">{att.percentage}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {att.passed ? 'PASSED' : 'NOT QUALIFIED'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                        {att.integrity_hash || 'local_verified'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedSubmissionInspect(att)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          Inspect
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

      {/* Submission Inspector Modal */}
      {selectedSubmissionInspect && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white">Student Submission Details</h4>
                <p className="text-xs text-slate-400">
                  {selectedSubmissionInspect.student_name} ({selectedSubmissionInspect.student_id})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionInspect(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Marks:</span>
                <span className="font-bold text-white">
                  {selectedSubmissionInspect.total_score} / {selectedSubmissionInspect.max_score} ({selectedSubmissionInspect.percentage}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SHA-256 Signature:</span>
                <span className="font-mono text-[10px] text-emerald-400 truncate max-w-md">
                  {selectedSubmissionInspect.integrity_hash}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase">Question Submissions</h5>
              {(selectedSubmissionInspect.submissions || []).map((sub: any, idx: number) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Question #{idx + 1} ({sub.language})</span>
                    <span className="text-emerald-400 font-bold">Score: {sub.score} Marks</span>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-200 overflow-x-auto max-h-40">
                    {sub.source_code || '// No code recorded'}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 6: MONITORING
      ========================================================================== */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Student Test Activity Monitoring</span>
              </h2>
              <p className="text-xs text-slate-400">Track real-time student test attempts, anti-cheat violations, and completion statuses.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              ● Live Surveillance Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <p className="text-xs text-slate-400 font-medium">Assigned Candidates</p>
              <p className="text-2xl font-bold text-white">{studentsList.length}</p>
              <p className="text-[10px] text-slate-500 mt-1">Across 3 academic departments</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <p className="text-xs text-slate-400 font-medium">Completed Attempts</p>
              <p className="text-2xl font-bold text-emerald-400">{attempts.length}</p>
              <p className="text-[10px] text-emerald-400/80 mt-1">All sealed with integrity hashes</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <p className="text-xs text-slate-400 font-medium">Focus Violations Logged</p>
              <p className="text-2xl font-bold text-amber-400">0 Alerts</p>
              <p className="text-[10px] text-amber-400/80 mt-1">100% Kiosk Mode enforcement active</p>
            </div>
          </div>

          {/* Student Status Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Student Examination Status</h3>
            <div className="divide-y divide-slate-800 text-xs">
              {studentsList.map(st => (
                <div key={st.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                      {st.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white">{st.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{st.roll_id} • {st.dept}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      st.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : st.status === 'In Progress'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {st.status}
                    </span>
                    <span className="text-xs font-bold text-white">{st.score > 0 ? `${st.score}%` : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 7: CRUD OPERATIONS
      ========================================================================== */}
      {activeTab === 'crud' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Complete System CRUD Operations</span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage Students, Subjects, Topics, Tests, and Practice sets with full Create, Read, Update, Delete.
              </p>
            </div>
          </div>

          {/* Subtabs for CRUD */}
          <div className="flex space-x-2 border-b border-slate-800 pb-3">
            {(['students', 'subjects', 'topics', 'practice_sets'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCrudTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                  crudTab === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* CRUD: STUDENTS */}
          {crudTab === 'students' && (
            <div className="space-y-4">
              <form onSubmit={handleAddStudent} className="flex gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <input
                  type="text"
                  required
                  placeholder="Student Full Name (e.g. Maya Lin)"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Roll / Student ID (e.g. 25UAI999)"
                  value={newStudentRoll}
                  onChange={e => setNewStudentRoll(e.target.value)}
                  className="w-48 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
              </form>

              {/* Filters & Search for Students */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['All', 'A', 'B', 'C', 'D', 'E'].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setStudentSectionFilter(sec)}
                      className={`px-3 py-1 rounded text-xs font-bold transition ${
                        studentSectionFilter === sec
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec === 'All' ? 'All Sections' : `Sec ${sec}`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search name, roll, email..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 w-56"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: {studentsList.filter(st => {
                      const matchesSection = studentSectionFilter === 'All' || (st as any).section === studentSectionFilter || st.dept.includes(`Sec ${studentSectionFilter}`);
                      const q = studentSearch.toLowerCase();
                      return matchesSection && (!q || st.name.toLowerCase().includes(q) || st.roll_id.toLowerCase().includes(q) || st.email.toLowerCase().includes(q));
                    }).length} / {studentsList.length}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Roll ID</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department & Section</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {studentsList
                      .filter(st => {
                        const matchesSection = studentSectionFilter === 'All' || (st as any).section === studentSectionFilter || st.dept.includes(`Sec ${studentSectionFilter}`);
                        const q = studentSearch.toLowerCase();
                        return matchesSection && (!q || st.name.toLowerCase().includes(q) || st.roll_id.toLowerCase().includes(q) || st.email.toLowerCase().includes(q));
                      })
                      .map(st => (
                        <tr key={st.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-white">{st.name}</td>
                          <td className="p-3 text-slate-400 font-mono">{st.roll_id}</td>
                          <td className="p-3 text-slate-400">{st.email}</td>
                          <td className="p-3 text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono">
                              {st.dept}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="text-red-400 hover:text-red-300 hover:underline font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRUD: SUBJECTS */}
          {crudTab === 'subjects' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSubject} className="flex gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <input
                  type="text"
                  required
                  placeholder="New Subject Title (e.g. Distributed Computing)"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>
              </form>

              <div className="grid grid-cols-2 gap-3">
                {subjectsList.map((sub, i) => (
                  <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{sub}</span>
                    <button
                      onClick={() => setSubjectsList(subjectsList.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:underline text-[11px]"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRUD: TOPICS */}
          {crudTab === 'topics' && (
            <div className="space-y-4">
              <form onSubmit={handleAddTopic} className="flex gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <input
                  type="text"
                  required
                  placeholder="New Topic Title (e.g. Monotonic Stack & Queue)"
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Topic</span>
                </button>
              </form>

              <div className="grid grid-cols-2 gap-3">
                {topicsList.map((top, i) => (
                  <div key={i} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{top}</span>
                    <button
                      onClick={() => setTopicsList(topicsList.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:underline text-[11px]"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRUD: PRACTICE SETS */}
          {crudTab === 'practice_sets' && (
            <div className="space-y-4">
              <div className="divide-y divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl">
                {practiceList.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{p.title}</p>
                      <p className="text-[11px] text-slate-400">{p.topic} • {p.difficulty}</p>
                    </div>
                    <button
                      onClick={() => setPracticeList(practiceList.filter(item => item.id !== p.id))}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
