const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev,
    autoHideMenuBar: true,
    kiosk: !isDev,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#000000',
    show: false,
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5000/player'
    : `file://${path.join(__dirname, '../dist/client/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent window from being closed (for kiosk mode)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting && !isDev) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create tray icon (optional - requires icon file)
  // tray = new Tray(path.join(__dirname, 'icon.png'));
  
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
      label: 'Restart',
      click: () => {
        app.relaunch();
        app.quit();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  if (tray) {
    tray.setToolTip('EvoFlow Player');
    tray.setContextMenu(contextMenu);
  }
}

// App event handlers
app.on('ready', () => {
  createWindow();
  createTray();

  // Set app to launch at system startup (optional)
  if (!isDev) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
    });
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Quit when all windows are closed
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
