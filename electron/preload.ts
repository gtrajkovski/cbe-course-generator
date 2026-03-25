import { contextBridge, ipcRenderer } from 'electron';

export interface ClaudeGenerateParams {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  stream: boolean;
}

export interface DocxSection {
  heading: string;
  content: string;
  level?: number;
}

export interface DocxData {
  title: string;
  sections: DocxSection[];
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // --- Claude API ---
  generateWithClaude: (params: ClaudeGenerateParams) =>
    ipcRenderer.invoke('claude:generate', params),

  onClaudeStream: (callback: (chunk: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
    ipcRenderer.on('claude:stream-chunk', listener);
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('claude:stream-chunk', listener);
    };
  },

  onClaudeStreamEnd: (callback: (data: { usage: any; stopReason: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('claude:stream-end', listener);
    return () => {
      ipcRenderer.removeListener('claude:stream-end', listener);
    };
  },

  onClaudeStreamError: (callback: (error: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on('claude:stream-error', listener);
    return () => {
      ipcRenderer.removeListener('claude:stream-error', listener);
    };
  },

  // --- DOCX Export ---
  exportDocx: (docData: DocxData, outputPath: string) =>
    ipcRenderer.invoke('docx:export', { docData, outputPath }),

  // --- File Dialog ---
  showSaveDialog: (options?: SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:saveFile', options),

  // --- Store ---
  getStore: (key: string) => ipcRenderer.invoke('store:get', key),
  setStore: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),

  // --- Voice (placeholder) ---
  voiceStart: () => ipcRenderer.invoke('voice:start'),
  voiceStop: () => ipcRenderer.invoke('voice:stop'),

  // --- Window Controls ---
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),

  // --- Platform Info ---
  platform: process.platform,
  isElectron: true,
});
