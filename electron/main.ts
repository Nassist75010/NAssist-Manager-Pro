import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { listScans, saveScan, type ScanRecordInput } from './database';

const isDev = !app.isPackaged;
let serviceBagWindow: BrowserWindow | null = null;

function validateHttpUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Seules les adresses HTTP ou HTTPS sont autorisées.');
  return url.toString();
}

function openReadOnlyBrowser(rawUrl: string) {
  const targetUrl = validateHttpUrl(rawUrl);
  if (serviceBagWindow && !serviceBagWindow.isDestroyed()) {
    serviceBagWindow.focus();
    void serviceBagWindow.loadURL(targetUrl);
    return true;
  }

  serviceBagWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'ServiceBag — lecture contrôlée',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  serviceBagWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  serviceBagWindow.on('closed', () => { serviceBagWindow = null; });
  void serviceBagWindow.loadURL(targetUrl);
  return true;
}

async function extractVisibleText() {
  if (!serviceBagWindow || serviceBagWindow.isDestroyed()) throw new Error('La fenêtre ServiceBag n’est pas ouverte.');
  const text = await serviceBagWindow.webContents.executeJavaScript(`document.body?.innerText || ''`, true);
  return {
    text: String(text).slice(0, 100000),
    url: serviceBagWindow.webContents.getURL(),
    title: serviceBagWindow.webContents.getTitle()
  };
}

function registerIpcHandlers() {
  ipcMain.handle('scans:list', (_event, limit?: number) => listScans(Math.min(Math.max(limit ?? 100, 1), 500)));
  ipcMain.handle('scans:save', (_event, input: ScanRecordInput) => {
    if (!input || typeof input.rawText !== 'string' || typeof input.confidence !== 'number') throw new Error('Données de scan invalides.');
    return saveScan(input);
  });
  ipcMain.handle('servicebag:open', (_event, url: string) => openReadOnlyBrowser(url));
  ipcMain.handle('servicebag:extract', () => extractVisibleText());
  ipcMain.handle('servicebag:close', () => {
    if (serviceBagWindow && !serviceBagWindow.isDestroyed()) serviceBagWindow.close();
    return true;
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