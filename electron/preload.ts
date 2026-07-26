import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nassist', {
  platform: process.platform,
  version: '0.5.0',
  scans: {
    list: (limit = 100) => ipcRenderer.invoke('scans:list', limit),
    save: (scan: unknown) => ipcRenderer.invoke('scans:save', scan)
  },
  serviceBag: {
    open: (url: string) => ipcRenderer.invoke('servicebag:open', url),
    extractVisibleText: () => ipcRenderer.invoke('servicebag:extract'),
    close: () => ipcRenderer.invoke('servicebag:close')
  }
});