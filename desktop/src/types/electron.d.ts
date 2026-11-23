export interface IElectronAPI {
  enterKiosk: () => Promise<boolean>;
  exitKiosk: () => Promise<boolean>;
  isKiosk: () => Promise<boolean>;
  onFocusViolation: (callback: () => void) => () => void;

  checkNetwork: () => Promise<boolean>;
  onNetworkChange: (callback: (isOnline: boolean) => void) => () => void;

  executeCode: (args: {
    language: string;
    code: string;
    input?: string;
    timeoutMs?: number;
  }) => Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    timeMs: number;
  }>;

  evaluateTestCases: (args: {
    language: string;
    code: string;
    testCases: Array<{
      input: string;
      expected_output: string;
      is_hidden?: boolean;
      id?: string;
    }>;
  }) => Promise<{
    total: number;
    passed: number;
    allPassed: boolean;
    details: Array<{
      id: string;
      is_hidden: boolean;
      passed: boolean;
      actual_output: string;
      expected_output: string;
      stderr: string;
      timeMs: number;
      exitCode: number;
    }>;
  }>;

  saveLocal: (key: string, data: any) => Promise<boolean>;
  getLocal: (key: string) => Promise<any>;
  clearLocal: (key: string) => Promise<boolean>;
  hashData: (data: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
