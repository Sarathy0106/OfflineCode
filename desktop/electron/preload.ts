import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Kiosk & Window
  enterKiosk: () => ipcRenderer.invoke('kiosk:enter'),
  exitKiosk: () => ipcRenderer.invoke('kiosk:exit'),
  isKiosk: () => ipcRenderer.invoke('kiosk:status'),
  onFocusViolation: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('exam:focus-violation', listener);
    return () => ipcRenderer.removeListener('exam:focus-violation', listener);
  },

  // Network & Connectivity
  checkNetwork: () => ipcRenderer.invoke('system:check-network'),
  onNetworkChange: (callback: (isOnline: boolean) => void) => {
    const listener = (_: any, isOnline: boolean) => callback(isOnline);
    ipcRenderer.on('system:network-status', listener);
    return () => ipcRenderer.removeListener('system:network-status', listener);
  },

  // Offline Code Execution & Testing
  executeCode: (args: { language: string; code: string; input?: string; timeoutMs?: number }) =>
    ipcRenderer.invoke('code:execute', args),
  evaluateTestCases: (args: { language: string; code: string; testCases: Array<{ input: string; expected_output: string; is_hidden?: boolean; id?: string }> }) =>
    ipcRenderer.invoke('code:evaluate-test-cases', args),

  // Local Storage (Offline persistence)
  saveLocal: (key: string, data: any) => ipcRenderer.invoke('storage:save', { key, data }),
  getLocal: (key: string) => ipcRenderer.invoke('storage:get', { key }),
  clearLocal: (key: string) => ipcRenderer.invoke('storage:clear', { key }),
  hashData: (data: string) => ipcRenderer.invoke('system:hash', { data })
});
