import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdminJsonTemplate, Test, TestAttempt } from '../types';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Layers,
  BookOpen,
  Trash2,
  Trophy,
  RefreshCw,
  Eye,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SAMPLE_TEMPLATE: AdminJsonTemplate = {
  test_title: "Data Structures & Algorithms - Sprint 1",
  subject: "Computer Science",
  topic: "Arrays & Strings",
  duration_minutes: 60,
  total_marks: 100,
  passing_percentage: 50,
  instructions: [
    "Turn off Wi-Fi before starting the examination.",
    "Exam runs in locked full-screen kiosk mode.",
    "Code is compiled and verified 100% offline.",
    "Answers are saved locally and synced after re-enabling Wi-Fi."
  ],
  questions: [
    {
      title: "Two Sum",
      difficulty: "Easy",
      marks: 50,
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
      input_format: "Line 1: N (array length)\nLine 2: N space-separated integers\nLine 3: target integer",
      output_format: "Two space-separated indices (0-indexed)",
      allowed_languages: ["python", "cpp", "java", "c"],
      starter_templates: {
        python: "import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    \n    lookup = {}\n    for i, x in enumerate(nums):\n        diff = target - x\n        if diff in lookup:\n            print(f\"{lookup[diff]} {i}\")\n            return\n        lookup[x] = i\n\nif __name__ == '__main__':\n    solve()\n",
        cpp: "#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i = 0; i < n; i++) cin >> nums[i];\n    int target;\n    cin >> target;\n    \n    unordered_map<int, int> lookup;\n    for(int i = 0; i < n; i++) {\n        int diff = target - nums[i];\n        if (lookup.count(diff)) {\n            cout << lookup[diff] << \" \" << i << endl;\n            return 0;\n        }\n        lookup[nums[i]] = i;\n    }\n    return 0;\n}\n",
        c: "#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    int nums[10000];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    int target;\n    scanf(\"%d\", &target);\n    \n    for(int i = 0; i < n; i++) {\n        for(int j = i + 1; j < n; j++) {\n            if (nums[i] + nums[j] == target) {\n                printf(\"%d %d\\n\", i, j);\n                return 0;\n            }\n        }\n    }\n    return 0;\n}\n",
        java: "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        \n        Map<Integer, Integer> map = new HashMap<>();\n        for(int i = 0; i < n; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                System.out.println(map.get(diff) + \" \" + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}\n"
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
      title: "Palindrome String",
      difficulty: "Easy",
      marks: 50,
      description: "Given a string S, determine whether it is a palindrome considering only alphanumeric characters and ignoring cases.",
      constraints: "1 <= S.length <= 10^5",
      input_format: "Line 1: String S",
      output_format: "Print 'YES' if palindrome, else 'NO'",
      allowed_languages: ["python", "cpp", "java", "c"],
      starter_templates: {
        python: "import sys\n\ndef solve():\n    s = sys.stdin.read().strip()\n    filtered = ''.join(c.lower() for c in s if c.isalnum())\n    if filtered == filtered[::-1]:\n        print('YES')\n    else:\n        print('NO')\n\nif __name__ == '__main__':\n    solve()\n",
        cpp: "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    string s, filtered = \"\";\n    if (getline(cin, s)) {\n        for(char c : s) if (isalnum(c)) filtered += tolower(c);\n        int l = 0, r = filtered.size() - 1;\n        bool pal = true;\n        while(l < r) {\n            if (filtered[l++] != filtered[r--]) { pal = false; break; }\n        }\n        cout << (pal ? \"YES\" : \"NO\") << endl;\n    }\n    return 0;\n}\n",
        c: "#include <stdio.h>\n#include <ctype.h>\n#include <string.h>\n\nint main() {\n    char s[10000];\n    if (fgets(s, sizeof(s), stdin)) {\n        char clean[10000];\n        int idx = 0;\n        for(int i = 0; s[i]; i++) {\n            if (isalnum((unsigned char)s[i])) clean[idx++] = tolower((unsigned char)s[i]);\n        }\n        int l = 0, r = idx - 1, pal = 1;\n        while(l < r) {\n            if (clean[l++] != clean[r--]) { pal = 0; break; }\n        }\n        printf(\"%s\\n\", pal ? \"YES\" : \"NO\");\n    }\n    return 0;\n}\n",
        java: "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String s = sc.nextLine();\n            StringBuilder sb = new StringBuilder();\n            for(char c : s.toCharArray()) {\n                if (Character.isLetterOrDigit(c)) sb.append(Character.toLowerCase(c));\n            }\n            String orig = sb.toString();\n            String rev = sb.reverse().toString();\n            System.out.println(orig.equals(rev) ? \"YES\" : \"NO\");\n        }\n    }\n}\n"
      },
      sample_test_cases: [
        {
          input: "A man, a plan, a canal: Panama",
          expected_output: "YES",
          explanation: "amanaplanacanalpanama is a palindrome"
        }
      ],
      hidden_test_cases: [
        {
          input: "race a car",
          expected_output: "NO"
        },
        {
          input: "Was it a car or a cat I saw?",
          expected_output: "YES"
        }
      ]
    }
  ]
};

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'tests' | 'results' | 'leaderboard'>('upload');
  const [parsedJson, setParsedJson] = useState<AdminJsonTemplate | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  // Load tests & results from Supabase
  const fetchData = async () => {
    setIsLoading(true);
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
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    const str = JSON.stringify(SAMPLE_TEMPLATE, null, 2);
    handleJsonUpload(str);
  };

  const publishTestToSupabase = async () => {
    if (!parsedJson) return;
    setIsPublishing(true);
    setUploadError(null);

    try {
      // 1. Insert Test Record
      const { data: testData, error: testErr } = await supabase
        .from('tests')
        .insert({
          title: parsedJson.test_title,
          subject: parsedJson.subject || 'General',
          topic: parsedJson.topic || 'Coding',
          duration_minutes: parsedJson.duration_minutes || 60,
          total_marks: parsedJson.total_marks || 100,
          passing_percentage: parsedJson.passing_percentage || 50,
          instructions: parsedJson.instructions || [],
          is_published: true
        })
        .select()
        .single();

      if (testErr || !testData) throw testErr || new Error('Failed to create test record');

      const testId = testData.id;

      // 2. Insert Questions and Test Cases
      for (let i = 0; i < parsedJson.questions.length; i++) {
        const q = parsedJson.questions[i];
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .insert({
            test_id: testId,
            order_index: i + 1,
            title: q.title,
            difficulty: q.difficulty || 'Medium',
            marks: q.marks || 10,
            description: q.description,
            constraints: q.constraints || '',
            input_format: q.input_format || '',
            output_format: q.output_format || '',
            allowed_languages: q.allowed_languages || ['python', 'cpp', 'java', 'c'],
            starter_templates: q.starter_templates || {}
          })
          .select()
          .single();

        if (qErr || !qData) throw qErr || new Error(`Failed to create question ${q.title}`);

        const qId = qData.id;

        // Sample Test Cases
        if (q.sample_test_cases && q.sample_test_cases.length > 0) {
          const sampleRows = q.sample_test_cases.map(stc => ({
            question_id: qId,
            input: stc.input,
            expected_output: stc.expected_output,
            is_hidden: false,
            explanation: stc.explanation || ''
          }));
          await supabase.from('test_cases').insert(sampleRows);
        }

        // Hidden Test Cases
        if (q.hidden_test_cases && q.hidden_test_cases.length > 0) {
          const hiddenRows = q.hidden_test_cases.map(htc => ({
            question_id: qId,
            input: htc.input,
            expected_output: htc.expected_output,
            is_hidden: true
          }));
          await supabase.from('test_cases').insert(hiddenRows);
        }
      }

      setPublishSuccess(true);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message || 'Error publishing test to Supabase');
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test and all its questions?')) return;
    try {
      await supabase.from('tests').delete().eq('id', testId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Dashboard Stats Calculations
  const totalStudents = new Set(attempts.map(a => a.student_id)).size;
  const totalTestsCount = tests.length;
  const totalQuestionsCount = tests.reduce((acc, t) => acc + (t.questions?.length || 0), 0);
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950 text-slate-100">
      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Published Tests</p>
            <p className="text-2xl font-bold text-white">{totalTestsCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Coding Questions</p>
            <p className="text-2xl font-bold text-white">{totalQuestionsCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed Attempts</p>
            <p className="text-2xl font-bold text-white">{attempts.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Average Student Score</p>
            <p className="text-2xl font-bold text-white">{averageScore}%</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Preview JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manage Tests ({tests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Results & Evaluations ({attempts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Supabase</span>
        </button>
      </div>

      {/* TAB 1: JSON UPLOAD & PREVIEW */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Card */}
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20 transition"
              >
                Load Sample Sprint 1 JSON
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-8 text-center transition bg-slate-950/40">
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">
                Drag and drop your <code className="text-blue-400">questions.json</code> here, or browse
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow"
              >
                Browse JSON File
              </label>
            </div>

            {uploadError && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {publishSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Test specification published successfully to Supabase! Students can now take this exam.</span>
              </div>
            )}
          </div>

          {/* Interactive Preview Section */}
          {parsedJson && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-white">{parsedJson.test_title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {parsedJson.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Topic: {parsedJson.topic} • Total Questions: {parsedJson.questions.length} • Max Marks: {parsedJson.total_marks}
                  </p>
                </div>

                <button
                  onClick={publishTestToSupabase}
                  disabled={isPublishing}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20 transition"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Publishing to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publish Test to Supabase</span>
                    </>
                  )}
                </button>
              </div>

              {/* Questions List Preview */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Extracted Questions ({parsedJson.questions.length})
                </h4>

                {parsedJson.questions.map((q, idx) => {
                  const isExpanded = expandedQuestion === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60"
                    >
                      <div
                        onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            Q{idx + 1}
                          </span>
                          <span className="font-semibold text-white text-sm">{q.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : q.difficulty === 'Hard'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-slate-400">({q.marks} Marks)</span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-slate-400">
                          <span>
                            {q.sample_test_cases?.length || 0} Sample • {q.hidden_test_cases?.length || 0} Hidden Cases
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-800 space-y-4 text-xs">
                          <div>
                            <p className="font-semibold text-slate-400 mb-1">Description:</p>
                            <p className="text-slate-200 whitespace-pre-wrap">{q.description}</p>
                          </div>

                          {q.constraints && (
                            <div>
                              <p className="font-semibold text-slate-400 mb-1">Constraints:</p>
                              <code className="text-amber-300 whitespace-pre-wrap font-mono block bg-slate-900 p-2 rounded">
                                {q.constraints}
                              </code>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-semibold text-slate-400 mb-1">Sample Test Cases:</p>
                              <div className="space-y-2">
                                {q.sample_test_cases?.map((tc, tcIdx) => (
                                  <div key={tcIdx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                                    <p className="text-[10px] text-slate-400 font-mono">Input: <span className="text-slate-200">{tc.input}</span></p>
                                    <p className="text-[10px] text-emerald-400 font-mono mt-1">Expected: {tc.expected_output}</p>
                                    {tc.explanation && (
                                      <p className="text-[10px] text-slate-500 mt-1 italic">{tc.explanation}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="font-semibold text-slate-400 mb-1">Hidden Test Cases (Private):</p>
                              <div className="space-y-2">
                                {q.hidden_test_cases?.map((htc, htcIdx) => (
                                  <div key={htcIdx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                                    <p className="text-[10px] text-slate-400 font-mono">Input: <span className="text-slate-200">{htc.input}</span></p>
                                    <p className="text-[10px] text-amber-400 font-mono mt-1">Expected: {htc.expected_output}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Live Tests Database ({tests.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map(test => (
              <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{test.title}</h3>
                    <p className="text-xs text-slate-400">{test.subject} • {test.topic}</p>
                  </div>
                  <button
                    onClick={() => deleteTest(test.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{test.duration_minutes} mins</span>
                  </span>
                  <span>{test.total_marks} Marks</span>
                  <span>{test.questions?.length || 0} Questions</span>
                  <span className="text-emerald-400 font-medium">Published</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESULTS & EVALUATIONS */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Student Exam Attempts ({attempts.length})</h2>
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5">Result</th>
                  <th className="p-3.5">Integrity Hash</th>
                  <th className="p-3.5">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-semibold text-white">{att.student_name}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{att.student_id}</td>
                    <td className="p-3.5 font-bold text-slate-200">{att.total_score} / {att.max_score}</td>
                    <td className="p-3.5 font-bold">{att.percentage}%</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                      {att.integrity_hash || 'SHA-256 Validated'}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Top Student Rankings</span>
          </h2>
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Roll / Student ID</th>
                  <th className="p-3.5">Total Marks</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attempts
                  .slice()
                  .sort((a, b) => b.total_score - a.total_score)
                  .map((att, index) => (
                    <tr key={att.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-sm">
                        {index === 0 && <span className="text-amber-400">🥇 1st</span>}
                        {index === 1 && <span className="text-slate-300">🥈 2nd</span>}
                        {index === 2 && <span className="text-amber-600">🥉 3rd</span>}
                        {index > 2 && <span className="text-slate-500">#{index + 1}</span>}
                      </td>
                      <td className="p-3.5 font-semibold text-white">{att.student_name}</td>
                      <td className="p-3.5 text-slate-400 font-mono">{att.student_id}</td>
                      <td className="p-3.5 font-bold text-white">{att.total_score}</td>
                      <td className="p-3.5 font-bold text-emerald-400">{att.percentage}%</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          QUALIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
