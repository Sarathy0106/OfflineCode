import { app, BrowserWindow, ipcMain, globalShortcut, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as dns from 'dns';
import * as crypto from 'crypto';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let isExamLocked = false;
let networkCheckInterval: NodeJS.Timeout | null = null;

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: any[] = [
    ...(isMac
      ? [
          {
            label: 'Offline Exam Kiosk',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: isMac ? 'Ctrl+Command+F' : 'F11',
          click: () => {
            if (mainWindow) {
              const isFull = mainWindow.isFullScreen();
              mainWindow.setFullScreen(!isFull);
            }
          }
        },
        {
          label: 'Exit Full Screen',
          accelerator: 'Escape',
          click: () => {
            if (mainWindow && mainWindow.isFullScreen()) {
              mainWindow.setFullScreen(false);
              mainWindow.setKiosk(false);
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ]
          : [{ role: 'close' }])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'Offline Exam & Education Platform',
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Track Fullscreen transitions and inform the renderer
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-change', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-change', false);
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Monitor Window Focus Violations during Exam
  mainWindow.on('blur', () => {
    if (isExamLocked && mainWindow) {
      mainWindow.webContents.send('exam:focus-violation');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Network Connectivity Prober
function isInternetReachable(): Promise<boolean> {
  return new Promise((resolve) => {
    dns.lookup('google.com', (err) => {
      if (err) {
        // Double check with another reliable domain
        dns.lookup('cloudflare.com', (err2) => {
          resolve(!err2);
        });
      } else {
        resolve(true);
      }
    });
  });
}

function startNetworkMonitoring() {
  if (networkCheckInterval) clearInterval(networkCheckInterval);
  networkCheckInterval = setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const online = await isInternetReachable();
      mainWindow.webContents.send('system:network-status', online);
    }
  }, 2000);
}

// Local Execution Helpers
async function runCommand(
  cmd: string,
  args: string[],
  input: string = '',
  timeoutMs: number = 5000,
  cwd: string = os.tmpdir()
): Promise<{ stdout: string; stderr: string; exitCode: number; timeMs: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const proc = spawn(cmd, args, { cwd });

    const timer = setTimeout(() => {
      isTimedOut = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      const timeMs = Date.now() - startTime;
      if (isTimedOut) {
        resolve({
          stdout,
          stderr: stderr + '\n[Execution Timed Out (Limit: ' + timeoutMs + 'ms)]',
          exitCode: 124,
          timeMs
        });
      } else {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          timeMs
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: `Failed to invoke ${cmd}: ${err.message}. Ensure compiler/runtime is installed.`,
        exitCode: 127,
        timeMs: Date.now() - startTime
      });
    });
  });
}

// Compile & Execute Engine
async function executeOffline(language: string, code: string, input: string = '', timeoutMs: number = 5000) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'offline_exam_'));
  const normalizedLang = language.toLowerCase();

  try {
    if (normalizedLang === 'python' || normalizedLang === 'py') {
      const scriptPath = path.join(tmpDir, 'solution.py');
      fs.writeFileSync(scriptPath, code);
      // Try python3, fallback to python
      const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      return await runCommand(pyCmd, [scriptPath], input, timeoutMs, tmpDir);
    }

    if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
      const srcPath = path.join(tmpDir, 'solution.cpp');
      const binPath = path.join(tmpDir, process.platform === 'win32' ? 'solution.exe' : 'solution.out');
      fs.writeFileSync(srcPath, code);

      const compiler = process.platform === 'win32' ? 'g++' : 'clang++';
      const compileRes = await runCommand(compiler, ['-O2', srcPath, '-o', binPath], '', 10000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: `[Compilation Error]\n${compileRes.stderr}`,
          exitCode: compileRes.exitCode,
          timeMs: compileRes.timeMs
        };
      }
      return await runCommand(binPath, [], input, timeoutMs, tmpDir);
    }

    if (normalizedLang === 'c') {
      const srcPath = path.join(tmpDir, 'solution.c');
      const binPath = path.join(tmpDir, process.platform === 'win32' ? 'solution.exe' : 'solution.out');
      fs.writeFileSync(srcPath, code);

      const compiler = process.platform === 'win32' ? 'gcc' : 'clang';
      const compileRes = await runCommand(compiler, ['-O2', srcPath, '-o', binPath], '', 10000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: `[Compilation Error]\n${compileRes.stderr}`,
          exitCode: compileRes.exitCode,
          timeMs: compileRes.timeMs
        };
      }
      return await runCommand(binPath, [], input, timeoutMs, tmpDir);
    }

    if (normalizedLang === 'java') {
      const srcPath = path.join(tmpDir, 'Solution.java');
      fs.writeFileSync(srcPath, code);

      const compileRes = await runCommand('javac', ['Solution.java'], '', 10000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: `[Compilation Error]\n${compileRes.stderr}`,
          exitCode: compileRes.exitCode,
          timeMs: compileRes.timeMs
        };
      }
      return await runCommand('java', ['Solution'], input, timeoutMs, tmpDir);
    }

    return {
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      exitCode: 1,
      timeMs: 0
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

// IPC Handlers Setup
function setupIpc() {
  // Window controls & Fullscreen
  ipcMain.handle('window:toggle-fullscreen', () => {
    if (!mainWindow) return false;
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
    return !isFull;
  });

  ipcMain.handle('window:exit-fullscreen', () => {
    if (!mainWindow) return false;
    mainWindow.setFullScreen(false);
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    isExamLocked = false;
    return false;
  });

  ipcMain.handle('window:is-fullscreen', () => {
    return mainWindow?.isFullScreen() || false;
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
    return true;
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
    return true;
  });

  // Kiosk & Anti-Cheat
  ipcMain.handle('kiosk:enter', () => {
    if (!mainWindow) return false;
    isExamLocked = true;
    // Standard macOS native fullscreen allows the top options bar to show on hover!
    mainWindow.setFullScreen(true);
    return true;
  });

  ipcMain.handle('kiosk:exit', () => {
    if (!mainWindow) return false;
    isExamLocked = false;
    mainWindow.setFullScreen(false);
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    return true;
  });

  ipcMain.handle('kiosk:status', () => isExamLocked);

  // Network Connectivity
  ipcMain.handle('system:check-network', async () => {
    return await isInternetReachable();
  });

  // Local Code Execution
  ipcMain.handle('code:execute', async (_, { language, code, input, timeoutMs }) => {
    return await executeOffline(language, code, input, timeoutMs);
  });

  // Batch Test Case Evaluation
  ipcMain.handle('code:evaluate-test-cases', async (_, { language, code, testCases }) => {
    const results = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const res = await executeOffline(language, code, tc.input || '', 4000);
      const actualClean = (res.stdout || '').trim().replace(/\r\n/g, '\n');
      const expectedClean = (tc.expected_output || '').trim().replace(/\r\n/g, '\n');
      const passed = res.exitCode === 0 && actualClean === expectedClean;

      if (passed) passedCount++;

      results.push({
        id: tc.id || `tc_${i + 1}`,
        is_hidden: !!tc.is_hidden,
        passed,
        input: tc.is_hidden ? '[Hidden]' : (tc.input || ''),
        actual_output: tc.is_hidden ? (passed ? '[Hidden Passed]' : '[Hidden Failed]') : actualClean,
        expected_output: tc.is_hidden ? '[Hidden]' : expectedClean,
        stdout: res.stdout,
        stderr: res.stderr,
        timeMs: res.timeMs,
        exitCode: res.exitCode
      });
    }

    return {
      total: testCases.length,
      passed: passedCount,
      allPassed: passedCount === testCases.length,
      details: results
    };
  });

  // Local File System Storage (Offline Persistent Cache)
  const getStorageDir = () => path.join(app.getPath('userData'), 'offline_exam_store');

  ipcMain.handle('storage:save', (_, { key, data }) => {
    const dir = getStorageDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(data, null, 2), 'utf-8');
    return true;
  });

  ipcMain.handle('storage:get', (_, { key }) => {
    const filePath = path.join(getStorageDir(), `${key}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return null;
    }
  });

  ipcMain.handle('storage:clear', (_, { key }) => {
    const filePath = path.join(getStorageDir(), `${key}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  });

  // Cryptographic Signature Hash
  ipcMain.handle('system:hash', (_, { data }) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  });
}

app.whenReady().then(() => {
  createApplicationMenu();
  setupIpc();
  createWindow();
  startNetworkMonitoring();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (networkCheckInterval) clearInterval(networkCheckInterval);
});
