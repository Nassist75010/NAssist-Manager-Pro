import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { listScans, saveScan, type ScanRecordInput } from './database';

const isDev = !app.isPackaged;

function registerIpcHandlers() {
  ipcMain.handle('scans:list', (_event, limit?: number) => listScans(Math.min(Math.max(limit ?? 100, 1), 500)));
  ipcMain.handle('scans:save', (_event, input: ScanRecordInput) => {
    if (!input || typeof input.rawText !== 'string' || typeof input.confidence !== 'number') {
      throw new Error('Données de scan invalides.');
    }
    return saveScan(input);
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: "N'Assist Manager Pro",
    backgroundColor: '#08101d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) void window.loadURL('http://localhost:5173');
  else void window.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});