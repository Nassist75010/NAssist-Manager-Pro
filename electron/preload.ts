import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('nassist', {
  platform: process.platform,
  version: '0.1.0'
});
