import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as url from 'url';

// Keep a global reference of the window object to avoid it being garbage collected
let mainWindow: BrowserWindow | null = null;

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
