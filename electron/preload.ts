import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nassist', {
  platform: process.platform,
  version: '0.3.0',
  scans: {
    list: (limit = 100) => ipcRenderer.invoke('scans:list', limit),
    save: (scan: unknown) => ipcRenderer.invoke('scans:save', scan)
  }
});