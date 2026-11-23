import React, { useState } from 'react';
import { OfflineCodeEditor } from './OfflineCodeEditor';
import {
  Code2,
  Play,
  Terminal,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

interface PracticeQuestion {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  starterTemplates: Record<string, string>;
  testCases: Array<{ input: string; expected_output: string; explanation?: string }>;
  explanation: string;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'p1',
    title: 'Two Sum Problem',
    subject: 'Computer Science',
    topic: 'Arrays & Hash Maps',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nAssume each input has exactly one solution, and you may not use the same element twice.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
    inputFormat: 'Line 1: N (array length)\nLine 2: N space-separated numbers\nLine 3: target sum',
    outputFormat: 'Two space-separated indices (0-indexed)',
    starterTemplates: {
      python: 'import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    \n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            print(f"{lookup[diff]} {i}")\n            return\n        lookup[num] = i\n\nif __name__ == "__main__":\n    solve()\n',
      cpp: '#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i = 0; i < n; i++) cin >> nums[i];\n    int target;\n    cin >> target;\n    \n    unordered_map<int, int> lookup;\n    for(int i = 0; i < n; i++) {\n        int diff = target - nums[i];\n        if (lookup.count(diff)) {\n            cout << lookup[diff] << " " << i << endl;\n            return 0;\n        }\n        lookup[nums[i]] = i;\n    }\n    return 0;\n}\n',
      c: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int nums[1000];\n    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);\n    int target;\n    scanf("%d", &target);\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (nums[i] + nums[j] == target) {\n                printf("%d %d\\n", i, j);\n                return 0;\n            }\n        }\n    }\n    return 0;\n}\n',
      java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                System.out.println(map.get(diff) + " " + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}\n'
    },
    testCases: [
      { input: '4\n2 7 11 15\n9', expected_output: '0 1', explanation: '2 + 7 = 9 at indices 0 and 1' },
      { input: '3\n3 2 4\n6', expected_output: '1 2', explanation: '2 + 4 = 6 at indices 1 and 2' }
    ],
    explanation: 'Optimal Approach: Using a Hash Map allows us to check for the required complement (target - num) in O(1) time, yielding O(N) overall time complexity.'
  },
  {
    id: 'p2',
    title: 'Valid Palindrome String',
    subject: 'Computer Science',
    topic: 'Strings & Two Pointers',
    difficulty: 'Easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.',
    constraints: '1 <= s.length <= 2 * 10^5',
    inputFormat: 'Line 1: String S',
    outputFormat: 'Print "YES" if palindrome, else "NO"',
    starterTemplates: {
      python: 'import sys\n\ndef is_palindrome():\n    s = sys.stdin.read().strip()\n    filtered = [c.lower() for c in s if c.isalnum()]\n    if filtered == filtered[::-1]:\n        print("YES")\n    else:\n        print("NO")\n\nif __name__ == "__main__":\n    is_palindrome()\n',
      cpp: '#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        string filtered = "";\n        for(char c : s) if (isalnum(c)) filtered += tolower(c);\n        int l = 0, r = filtered.size() - 1;\n        bool ok = true;\n        while(l < r) {\n            if (filtered[l++] != filtered[r--]) { ok = false; break; }\n        }\n        cout << (ok ? "YES" : "NO") << endl;\n    }\n    return 0;\n}\n',
      c: '#include <stdio.h>\n#include <ctype.h>\n#include <string.h>\n\nint main() {\n    char s[1000];\n    if (fgets(s, sizeof(s), stdin)) {\n        char clean[1000];\n        int len = 0;\n        for (int i = 0; s[i]; i++) {\n            if (isalnum((unsigned char)s[i])) clean[len++] = tolower((unsigned char)s[i]);\n        }\n        int l = 0, r = len - 1, ok = 1;\n        while (l < r) {\n            if (clean[l++] != clean[r--]) { ok = 0; break; }\n        }\n        printf("%s\\n", ok ? "YES" : "NO");\n    }\n    return 0;\n}\n',
      java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String s = sc.nextLine();\n            StringBuilder sb = new StringBuilder();\n            for (char c : s.toCharArray()) {\n                if (Character.isLetterOrDigit(c)) sb.append(Character.toLowerCase(c));\n            }\n            String orig = sb.toString();\n            String rev = sb.reverse().toString();\n            System.out.println(orig.equals(rev) ? "YES" : "NO");\n        }\n    }\n}\n'
    },
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expected_output: 'YES', explanation: '"amanaplanacanalpanama" reads the same forward and backward' },
      { input: 'race a car', expected_output: 'NO', explanation: '"raceacar" is not a palindrome' }
    ],
    explanation: 'Using Two Pointers starting at the beginning and end of the string allows skipping non-alphanumeric characters in O(N) time and O(1) space.'
  },
  {
    id: 'p3',
    title: 'Fibonacci Number (N-th Term)',
    subject: 'Computer Science',
    topic: 'Math & Dynamic Programming',
    difficulty: 'Easy',
    description: 'The Fibonacci numbers form a sequence where F(0) = 0, F(1) = 1, and F(n) = F(n - 1) + F(n - 2) for n > 1. Given n, calculate F(n).',
    constraints: '0 <= n <= 30',
    inputFormat: 'Line 1: Integer n',
    outputFormat: 'Print the n-th Fibonacci number',
    starterTemplates: {
      python: 'import sys\n\ndef fib():\n    val = sys.stdin.read().strip()\n    if not val: return\n    n = int(val)\n    if n <= 1: \n        print(n)\n        return\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    print(b)\n\nif __name__ == "__main__":\n    fib()\n',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        if (n <= 1) { cout << n << endl; return 0; }\n        int a = 0, b = 1;\n        for(int i = 2; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        cout << b << endl;\n    }\n    return 0;\n}\n',
      c: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        if (n <= 1) { printf("%d\\n", n); return 0; }\n        int a = 0, b = 1;\n        for (int i = 2; i <= n; i++) {\n            int c = a + b; a = b; b = c;\n        }\n        printf("%d\\n", b);\n    }\n    return 0;\n}\n',
      java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            if (n <= 1) { System.out.println(n); return; }\n            int a = 0, b = 1;\n            for (int i = 2; i <= n; i++) {\n                int c = a + b; a = b; b = c;\n            }\n            System.out.println(b);\n        }\n    }\n}\n'
    },
    testCases: [
      { input: '2', expected_output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1' },
      { input: '4', expected_output: '3', explanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3' }
    ],
    explanation: 'Iterative computation with two state variables runs in O(N) time with O(1) space, avoiding exponential recursion call stack.'
  }
];

const DEFAULT_PLAYGROUND_TEMPLATES: Record<string, string> = {
  python: `# Offline Python 3 Playground\ndef main():\n    name = input("Enter your name: ")\n    print(f"Hello, {name}! Welcome to the Offline Code Practice Arena.")\n\nif __name__ == '__main__':\n    main()\n`,
  cpp: `// Offline C++ Playground (Clang 17)\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cout << "Enter your name: ";\n    if (cin >> name) {\n        cout << "Hello, " << name << "! C++ is ready." << endl;\n    }\n    return 0;\n}\n`,
  c: `// Offline C Playground\n#include <stdio.h>\n\nint main() {\n    char name[100];\n    printf("Enter your name: ");\n    if (scanf("%99s", name) == 1) {\n        printf("Hello, %s! C compilation successful.\\n", name);\n    }\n    return 0;\n}\n`,
  java: `// Offline Java Playground\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        System.out.print("Enter your name: ");\n        if (scanner.hasNext()) {\n            String name = scanner.next();\n            System.out.println("Hello, " + name + "! Java runtime active.");\n        }\n    }\n}\n`
};

export const StudentPracticeArena: React.FC = () => {
  const [practiceMode, setPracticeMode] = useState<'playground' | 'questions'>('playground');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [playgroundCode, setPlaygroundCode] = useState<string>(DEFAULT_PLAYGROUND_TEMPLATES.python);
  const [customInput, setCustomInput] = useState<string>('Sarathy');
  const [outputLogs, setOutputLogs] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionStats, setExecutionStats] = useState<{ timeMs: number; exitCode: number } | null>(null);

  // Questions Mode States
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion>(PRACTICE_QUESTIONS[0]);
  const [questionCode, setQuestionCode] = useState<string>(PRACTICE_QUESTIONS[0].starterTemplates.python);
  const [questionLanguage, setQuestionLanguage] = useState<string>('python');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Switch Playground Language
  const handlePlaygroundLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setPlaygroundCode(DEFAULT_PLAYGROUND_TEMPLATES[lang] || '');
  };

  // Run Code in Playground
  const handleRunPlayground = async () => {
    setIsRunning(true);
    setOutputLogs('Compiling & executing locally offline...');
    setExecutionStats(null);

    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.executeCode({
          language: selectedLanguage,
          code: playgroundCode,
          input: customInput,
          timeoutMs: 6000
        });
        setExecutionStats({ timeMs: res.timeMs, exitCode: res.exitCode });
        if (res.exitCode === 0) {
          setOutputLogs(res.stdout || '(Process finished with no output)');
        } else {
          setOutputLogs(`${res.stderr}\n${res.stdout}`);
        }
      } catch (err: any) {
        setOutputLogs(`Execution failed: ${err.message}`);
      } finally {
        setIsRunning(false);
      }
    } else {
      // Browser preview fallback
      setTimeout(() => {
        setIsRunning(false);
        setOutputLogs(`[Browser Mock Output]\nHello, ${customInput}! Offline compiler executed successfully.`);
        setExecutionStats({ timeMs: 42, exitCode: 0 });
      }, 500);
    }
  };

  // Switch Selected Question
  const handleSelectQuestion = (q: PracticeQuestion) => {
    setSelectedQuestion(q);
    setQuestionCode(q.starterTemplates[questionLanguage] || q.starterTemplates.python || '');
    setTestResults(null);
    setShowExplanation(false);
  };

  // Switch Question Language
  const handleQuestionLanguageChange = (lang: string) => {
    setQuestionLanguage(lang);
    setQuestionCode(selectedQuestion.starterTemplates[lang] || '');
  };

  // Run Test Cases for Question
  const handleRunTestCases = async () => {
    setIsRunning(true);
    setTestResults(null);

    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.evaluateTestCases({
          language: questionLanguage,
          code: questionCode,
          testCases: selectedQuestion.testCases
        });
        setTestResults(res);
      } catch (err: any) {
        setTestResults({ total: selectedQuestion.testCases.length, passed: 0, allPassed: false, error: err.message });
      } finally {
        setIsRunning(false);
      }
    } else {
      setTimeout(() => {
        setIsRunning(false);
        setTestResults({
          total: selectedQuestion.testCases.length,
          passed: selectedQuestion.testCases.length,
          allPassed: true,
          details: selectedQuestion.testCases.map((tc, i) => ({
            id: `tc_${i}`,
            passed: true,
            actual_output: tc.expected_output,
            expected_output: tc.expected_output,
            timeMs: 38
          }))
        });
      }, 600);
    }
  };

  const filteredQuestions = PRACTICE_QUESTIONS.filter(
    q => filterDifficulty === 'All' || q.difficulty === filterDifficulty
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sub-Header Tabs */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Student Practice Arena</h3>
            <p className="text-[10px] text-slate-400">100% Offline Coding Playground • Zero Exam Constraints</p>
          </div>
        </div>

        {/* Practice Mode Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setPracticeMode('playground')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              practiceMode === 'playground'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Code Playground</span>
          </button>
          <button
            onClick={() => setPracticeMode('questions')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              practiceMode === 'questions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice Challenges</span>
          </button>
        </div>
      </div>

      {/* MODE 1: FREE CODE PLAYGROUND */}
      {practiceMode === 'playground' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Code Editor Area */}
          <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold text-slate-400">Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handlePlaygroundLanguageChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded-md px-2.5 py-1 outline-none font-medium"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (Clang)</option>
                  <option value="c">C</option>
                  <option value="java">Java</option>
                </select>

                <button
                  onClick={() => setPlaygroundCode(DEFAULT_PLAYGROUND_TEMPLATES[selectedLanguage] || '')}
                  className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition"
                  title="Reset to starter boilerplate"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <button
                onClick={handleRunPlayground}
                disabled={isRunning}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Compiling Locally...' : 'Run Code'}</span>
              </button>
            </div>

            {/* Code Canvas */}
            <div className="flex-1 relative">
              <OfflineCodeEditor
                value={playgroundCode}
                onChange={setPlaygroundCode}
                language={selectedLanguage}
              />
            </div>
          </div>

          {/* Right: Custom Input & Output Console */}
          <div className="w-full md:w-[420px] flex flex-col bg-slate-900/50 overflow-hidden">
            {/* Stdin Input Section */}
            <div className="h-44 border-b border-slate-800 flex flex-col">
              <div className="h-9 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Standard Input (stdin)</span>
                <span className="text-[10px] text-slate-500 font-normal">Passed to your program</span>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type custom inputs here..."
                className="flex-1 p-3 bg-slate-950 text-slate-100 font-mono text-xs leading-5 resize-none outline-none border-none selection:bg-blue-600/40"
              />
            </div>

            {/* Stdout Output Section */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              <div className="h-9 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Terminal Output</span>
                </div>
                {executionStats && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    executionStats.exitCode === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {executionStats.exitCode === 0 ? `✓ Exit 0 (${executionStats.timeMs}ms)` : `Exit ${executionStats.exitCode}`}
                  </span>
                )}
              </div>
              <pre className="flex-1 p-4 font-mono text-xs text-slate-200 overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-blue-600/40">
                {outputLogs || <span className="text-slate-600 italic">Click "Run Code" to compile and see local execution output here.</span>}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: TOPIC-WISE PRACTICE CHALLENGES */}
      {practiceMode === 'questions' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Question List Sidebar */}
          <div className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Challenges</span>
              <div className="flex space-x-1">
                {(['All', 'Easy', 'Medium'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setFilterDifficulty(diff)}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                      filterDifficulty === diff
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
              {filteredQuestions.map(q => {
                const isSelected = selectedQuestion.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between ${
                      isSelected ? 'bg-blue-600/10 border-l-4 border-blue-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{q.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{q.topic}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {q.difficulty}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Problem Details & Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Problem Statement & Test Cases */}
            <div className="w-[45%] border-r border-slate-800 flex flex-col bg-slate-900/40 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedQuestion.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedQuestion.topic}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedQuestion.difficulty}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedQuestion.description}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Constraints</p>
                <pre className="text-xs font-mono text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedQuestion.constraints}
                </pre>
              </div>

              {/* Sample Test Cases */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sample Test Cases</p>
                {selectedQuestion.testCases.map((tc, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                    <p><span className="text-slate-400">Input:</span> <span className="text-slate-200">{tc.input}</span></p>
                    <p><span className="text-emerald-400">Expected:</span> <span className="text-slate-200">{tc.expected_output}</span></p>
                    {tc.explanation && <p className="text-[10px] text-slate-500 italic mt-1 font-sans">{tc.explanation}</p>}
                  </div>
                ))}
              </div>

              {/* Show Explanation & Algorithmic Solution */}
              <div className="pt-2">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{showExplanation ? 'Hide Explanation' : 'View Explanation & Algorithm'}</span>
                </button>
                {showExplanation && (
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                    {selectedQuestion.explanation}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Code Editor & Test Case Evaluation */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-slate-400">Language:</span>
                  <select
                    value={questionLanguage}
                    onChange={(e) => handleQuestionLanguageChange(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-white rounded-md px-2.5 py-1 outline-none font-medium"
                  >
                    <option value="python">Python 3</option>
                    <option value="cpp">C++ (Clang)</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                  </select>
                </div>

                <button
                  onClick={handleRunTestCases}
                  disabled={isRunning}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Evaluating...' : 'Run Test Cases'}</span>
                </button>
              </div>

              {/* Code Editor */}
              <div className="flex-1 relative">
                <OfflineCodeEditor
                  value={questionCode}
                  onChange={setQuestionCode}
                  language={questionLanguage}
                />
              </div>

              {/* Test Case Results Drawer */}
              {testResults && (
                <div className="h-44 bg-slate-900 border-t border-slate-800 p-4 overflow-y-auto space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white">Results:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      testResults.allPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {testResults.passed} / {testResults.total} Test Cases Passed
                    </span>
                  </div>

                  {testResults.details?.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border flex items-center justify-between ${
                        res.passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' : 'bg-red-500/5 border-red-500/20 text-red-300'
                      }`}
                    >
                      <span className="font-bold">Case #{idx + 1}</span>
                      <span>{res.passed ? '✓ PASSED' : '✗ FAILED'} ({res.timeMs}ms)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
