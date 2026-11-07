// Arithmetic Trainer: Electron main process.
//
// A macOS desktop flashcard app for drilling arithmetic facts (+, -, x, /, and
// percent x percent) with a graduation/streak system and response-time stats.
// This file owns the window and the on-disk data; the UI lives in src/ (React,
// bundled by Vite into dist/renderer) and talks to this process over IPC via
// electron/preload.ts.
//
// Data:   ~/Library/Application Support/arithmetic-trainer/data/
//           responses.json  every answer ever given (append-only)
//           settings.json   practice set + graduation interval
//         Override the folder with ARITHMETIC_TRAINER_DATA_DIR=<path> (used by
//         the smoke test so it never touches real data).
// Logs:   no log file; errors go to the Electron main-process console (the
//         terminal that ran `npm start`). Dev mode also opens DevTools.
// Drafts: the renderer keeps half-typed answers in localStorage (src/utils/drafts.ts).

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    const port = process.env.VITE_PORT || '5173';
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const dataPath =
  process.env.ARITHMETIC_TRAINER_DATA_DIR || path.join(app.getPath('userData'), 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

const responsesPath = path.join(dataPath, 'responses.json');
const settingsPath = path.join(dataPath, 'settings.json');

const ONE_MINUTE_MS = 60 * 1000;

// Truncate response time to max 1 minute
function truncateResponseTime(response: any): any {
  const responseTime = response.responseTimestamp - response.queryTimestamp;
  if (responseTime > ONE_MINUTE_MS) {
    return {
      ...response,
      responseTimestamp: response.queryTimestamp + ONE_MINUTE_MS,
    };
  }
  return response;
}

ipcMain.handle('load-responses', async () => {
  try {
    if (fs.existsSync(responsesPath)) {
      const data = fs.readFileSync(responsesPath, 'utf-8');
      const responses = JSON.parse(data);
      // Truncate any response times > 1 minute
      return responses.map(truncateResponseTime);
    }
    return [];
  } catch (error) {
    console.error('Error loading responses:', error);
    return [];
  }
});

ipcMain.handle('save-response', async (event, response) => {
  try {
    let responses = [];
    if (fs.existsSync(responsesPath)) {
      const data = fs.readFileSync(responsesPath, 'utf-8');
      responses = JSON.parse(data);
    }
    // Truncate response time if > 1 minute before saving
    responses.push(truncateResponseTime(response));
    fs.writeFileSync(responsesPath, JSON.stringify(responses, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving response:', error);
    return false;
  }
});

ipcMain.handle('load-settings', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
    return {
      practiceSet: ['+'],
      graduationInterval: 2000,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      practiceSet: ['+'],
      graduationInterval: 2000,
    };
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
});
