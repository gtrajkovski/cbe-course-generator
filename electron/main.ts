import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import Store from 'electron-store';
import * as fs from 'fs';

const store = new Store();
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- CSP Headers ---
app.on('ready', () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:* https://api.anthropic.com ws://localhost:*; img-src 'self' data:; font-src 'self' data:;"
            : "default-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; font-src 'self' data:;",
        ],
      },
    });
  });
});

// --- IPC: Claude API Streaming ---
ipcMain.handle('claude:generate', async (event, params: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  stream: boolean;
}) => {
  const { apiKey, systemPrompt, userPrompt, stream } = params;

  const client = new Anthropic({ apiKey });

  if (stream) {
    try {
      const streamResponse = client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      streamResponse.on('text', (text: string) => {
        mainWindow?.webContents.send('claude:stream-chunk', text);
      });

      const finalMessage = await streamResponse.finalMessage();

      mainWindow?.webContents.send('claude:stream-end', {
        usage: finalMessage.usage,
        stopReason: finalMessage.stop_reason,
      });

      return { success: true };
    } catch (error: any) {
      mainWindow?.webContents.send('claude:stream-error', error.message);
      return { success: false, error: error.message };
    }
  } else {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        success: true,
        text: textContent,
        usage: response.usage,
        stopReason: response.stop_reason,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
});

// --- IPC: DOCX Export ---
ipcMain.handle('docx:export', async (_event, params: {
  docData: {
    title: string;
    sections: Array<{
      heading: string;
      content: string;
      level?: number;
    }>;
  };
  outputPath: string;
}) => {
  const { docData, outputPath } = params;

  try {
    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        text: docData.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Sections
    for (const section of docData.sections) {
      const headingLevel =
        section.level === 1 ? HeadingLevel.HEADING_1 :
        section.level === 2 ? HeadingLevel.HEADING_2 :
        section.level === 3 ? HeadingLevel.HEADING_3 :
        HeadingLevel.HEADING_1;

      children.push(
        new Paragraph({
          text: section.heading,
          heading: headingLevel,
          spacing: { before: 300, after: 200 },
        })
      );

      // Split content by newlines into separate paragraphs
      const lines = section.content.split('\n');
      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 120 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    return { success: true, path: outputPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// --- IPC: Save Dialog ---
ipcMain.handle('dialog:saveFile', async (_event, options?: {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}) => {
  if (!mainWindow) return { canceled: true, filePath: '' };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: options?.title ?? 'Save File',
    defaultPath: options?.defaultPath ?? 'document.docx',
    filters: options?.filters ?? [
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  return { canceled: result.canceled, filePath: result.filePath };
});

// --- IPC: Electron Store ---
ipcMain.handle('store:get', (_event, key: string) => {
  return store.get(key);
});

ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
  store.set(key, value);
  return true;
});

// --- IPC: Voice (placeholders — actual recognition uses Web Speech API in renderer) ---
ipcMain.handle('voice:start', () => {
  // Voice recognition handled by Web Speech API in the renderer process.
  // This handler exists for future native integration if needed.
  return { success: true, message: 'Voice start acknowledged (renderer-side)' };
});

ipcMain.handle('voice:stop', () => {
  return { success: true, message: 'Voice stop acknowledged (renderer-side)' };
});

// --- IPC: Window Controls (for frameless window) ---
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());

// --- App Lifecycle ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
