# Offline Examination & Education Management System (Desktop)

A cross-platform desktop application built with **Electron + React + TypeScript + Tailwind CSS + Monaco Editor** and integrated with **Supabase**.

## 1. Key Architectural Features

- **100% Offline Coding Examination**:
  - The student downloads the exam payload once while online.
  - The app locks down into full-screen Kiosk mode (`mainWindow.setKiosk(true)`, `mainWindow.setFullScreen(true)`, `setAlwaysOnTop(true, 'screen-saver')`).
  - The app forces physical disconnection from Wi-Fi/Ethernet before the exam can be unlocked.
  - Code (Python, C, C++, Java) is executed, compiled, and evaluated **entirely offline** on the student's machine using local child processes against sample test cases.
  - Progress and code drafts are auto-saved to local encrypted storage.
- **Cheating Prevention & Kiosk Enforcement**:
  - Intercepts system shortcuts (`Cmd+Tab`, `Alt+Tab`, `Cmd+Q`, `Alt+F4`, `Cmd+W`).
  - Active window blur detection logs violation strikes if any application switching is attempted.
  - The exam is sealed upon submission or timer expiration with a cryptographic **SHA-256 integrity hash**.
- **Free-Tier Supabase Optimization**:
  - **Zero socket drops & zero server timeouts**: No continuous connections or WebSocket heartbeats are held during the test.
  - Only **1 GET request** to download the test payload before the exam.
  - Only **1 batch POST request** to upload the sealed submission when the student turns Wi-Fi back on.
- **Admin Portal**:
  - Upload standardized JSON template (`questions.json`).
  - Interactive preview displaying question descriptions, constraints, starter templates, and sample/hidden test cases.
  - One-click publishing to Supabase database.
  - Student results inspection, batch evaluation against hidden cases, and live leaderboard rankings.

---

## 2. Standardized JSON Template Format

Admins can upload test specifications using the following format:

```json
{
  "test_title": "Data Structures & Algorithms - Sprint 1",
  "subject": "Computer Science",
  "topic": "Arrays & Strings",
  "duration_minutes": 60,
  "total_marks": 100,
  "passing_percentage": 50,
  "instructions": [
    "Turn off Wi-Fi before starting the examination.",
    "Exam runs in locked full-screen kiosk mode.",
    "Code is compiled and verified 100% offline.",
    "Answers are saved locally and synced after re-enabling Wi-Fi."
  ],
  "questions": [
    {
      "id": "q1",
      "title": "Two Sum",
      "difficulty": "Easy",
      "marks": 50,
      "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
      "input_format": "Line 1: N (array length)\nLine 2: N space-separated integers\nLine 3: target integer",
      "output_format": "Two space-separated indices (0-indexed)",
      "allowed_languages": ["python", "cpp", "java", "c"],
      "starter_templates": {
        "python": "import sys\n\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
        "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n",
        "java": "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {}\n}\n",
        "c": "#include <stdio.h>\n\nint main() {\n    return 0;\n}\n"
      },
      "sample_test_cases": [
        {
          "input": "4\n2 7 11 15\n9",
          "expected_output": "0 1",
          "explanation": "nums[0] + nums[1] = 2 + 7 = 9"
        }
      ],
      "hidden_test_cases": [
        {
          "input": "3\n3 2 4\n6",
          "expected_output": "1 2"
        }
      ]
    }
  ]
}
```

---

## 3. Running & Packaging

### Run in Development
```bash
cd desktop
npm run dev
# In another terminal:
npm run electron:start
```

### Build Production Desktop Binaries
- **macOS (.app, .dmg)**:
  ```bash
  cd desktop
  npm run dist:mac
  ```
- **Windows (.exe, NSIS installer)**:
  ```bash
  cd desktop
  npm run dist:win
  ```
