import { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { PlayerConfig } from '../shared/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../shared/config';

const store = new Store<PlayerConfig>();
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../main/preload.js'),
    },
  });

  const htmlPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(htmlPath);

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Use a simple 16x16 colored rect as icon (create programmatically if needed)
  // For now, we'll create the tray without an icon path (Electron will use default)
  try {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
    } else {
      // Create tray without icon on platforms that support it
      tray = new Tray(nativeImage.createEmpty());
    }
  } catch (error) {
    console.error('Failed to create tray:', error);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Player',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Restart Player',
      click: () => {
        if (mainWindow) {
          mainWindow.reload();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        // Open settings dialog
        if (mainWindow) {
          mainWindow.webContents.send('open-settings');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  if (tray) {
    tray.setToolTip('EvoFlow Player');
    tray.setContextMenu(contextMenu);
  }
}

// IPC handlers
ipcMain.handle('get-config', () => {
  return {
    apiUrl: store.get(STORAGE_KEYS.API_URL, DEFAULT_CONFIG.apiUrl),
    deviceId: store.get(STORAGE_KEYS.DEVICE_ID, null),
    deviceToken: store.get(STORAGE_KEYS.DEVICE_TOKEN, null),
    displayName: store.get(STORAGE_KEYS.DISPLAY_NAME, DEFAULT_CONFIG.displayName),
  };
});

ipcMain.handle('save-config', (_event, config: Partial<PlayerConfig>) => {
  if (config.apiUrl) store.set(STORAGE_KEYS.API_URL, config.apiUrl);
  if (config.deviceId) store.set(STORAGE_KEYS.DEVICE_ID, config.deviceId);
  if (config.deviceToken) store.set(STORAGE_KEYS.DEVICE_TOKEN, config.deviceToken);
  if (config.displayName) store.set(STORAGE_KEYS.DISPLAY_NAME, config.displayName);
  return true;
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit();
});

ipcMain.handle('exit-kiosk', () => {
  if (mainWindow) {
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
  }
});

ipcMain.handle('enter-kiosk', () => {
  if (mainWindow) {
    mainWindow.setKiosk(true);
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto-launch on system startup
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: false,
});
