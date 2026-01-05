import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadResponses: () => ipcRenderer.invoke('load-responses'),
  saveResponse: (response: any) => ipcRenderer.invoke('save-response', response),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
});
