import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Add prompt handling
  submitPrompt: (prompt: string) => ipcRenderer.invoke('submit-prompt', prompt),

  // Add more exposed APIs here as needed for the app functionality
  // This will be expanded as we add more features later
});
