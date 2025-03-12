import { contextBridge, ipcRenderer } from 'electron';

// Define types for tool results
interface ToolResult {
  success: boolean;
  toolName?: string;
  error?: string;
  browserState?: any; // Browser state can vary based on tool
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Add prompt handling
  submitPrompt: (prompt: string) => ipcRenderer.invoke('submit-prompt', prompt),

  // Add event listeners for streaming response and tool executions
  onStreamResponse: (
    callback: (data: { text: string; done: boolean; toolResults: ToolResult[] }) => void
  ) => {
    ipcRenderer.on('stream-response', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('stream-response');
    };
  },

  onToolExecution: (callback: (result: ToolResult) => void) => {
    ipcRenderer.on('tool-execution', (_, result) => callback(result));
    return () => {
      ipcRenderer.removeAllListeners('tool-execution');
    };
  },

  // Add more exposed APIs here as needed for the app functionality
  // This will be expanded as we add more features later
});
