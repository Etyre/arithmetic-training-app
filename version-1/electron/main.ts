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
    const port = process.env.VITE_PORT || '5174';
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
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

const dataPath = path.join(app.getPath('userData'), 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

const responsesPath = path.join(dataPath, 'responses.json');
const settingsPath = path.join(dataPath, 'settings.json');

ipcMain.handle('load-responses', async () => {
  try {
    if (fs.existsSync(responsesPath)) {
      const data = fs.readFileSync(responsesPath, 'utf-8');
      return JSON.parse(data);
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
    responses.push(response);
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
