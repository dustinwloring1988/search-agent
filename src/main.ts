import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { PromptManager } from './utils/promptManager';
import { streamQueryAI, ToolExecutionCallback } from './ai';
import { ToolResult } from './tools';

// Keep a global reference of the window object to avoid it being garbage collected
let mainWindow: BrowserWindow | null = null;

// Create a prompt manager instance
const promptManager = new PromptManager();

// Enable hot reload for development mode
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  });
}

/**
 * Creates the main application window
 */
function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security best practices
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load the renderer
  const startUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000' // Dev server URL
      : url.format({
          pathname: path.join(__dirname, 'renderer', 'index.html'),
          protocol: 'file:',
          slashes: true,
        });

  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // External links should open in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when clicking on the dock icon
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set up IPC event handlers between the main process and renderer process
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle prompt submission from the renderer
ipcMain.handle('submit-prompt', async (_, prompt: string) => {
  try {
    // Initialize the prompt manager if not already done
    promptManager.initialize();

    // Add the user prompt to the conversation
    promptManager.addUserPrompt(prompt);

    // Get the current conversation
    const conversation = promptManager.getConversation();

    // Track the complete response
    let completeResponse = '';

    // Track tool call results to send to the renderer
    const toolResults: ToolResult[] = [];

    // Create a callback for the streaming response
    const streamCallback = (text: string, done: boolean) => {
      // Add the text to the complete response
      completeResponse += text;

      // Send the streamed chunk to the renderer
      if (mainWindow) {
        mainWindow.webContents.send('stream-response', {
          text,
          done,
          toolResults: [...toolResults], // Send a copy of current tool results
        });
      }

      // If this is the final chunk, add the complete response to the conversation
      if (done) {
        promptManager.addAssistantResponse(completeResponse);
      }
    };

    // Create a callback for tool execution results
    const toolCallback: ToolExecutionCallback = (result: ToolResult) => {
      // Add the result to the tool results array
      toolResults.push(result);

      // Send the tool execution result to the renderer
      if (mainWindow) {
        mainWindow.webContents.send('tool-execution', result);
      }
    };

    // Process the prompt with the AI using streaming
    await streamQueryAI(conversation, streamCallback, toolCallback);

    // Return success to the renderer
    return {
      success: true,
      toolResults,
      conversation: promptManager.getConversation(),
    };
  } catch (error) {
    console.error('Error processing prompt:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});
