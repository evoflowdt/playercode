# EvoFlow Player - Electron Desktop Application

This guide explains how to build and distribute the EvoFlow Player as a standalone desktop application for Windows, macOS, and Linux.

## 📋 Prerequisites

- Node.js 18+ installed
- Windows: Windows 10/11 for building Windows installers
- macOS: macOS 10.13+ for building macOS installers (requires Xcode)
- Linux: Ubuntu/Debian for building Linux packages

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)

The Electron dependencies are already installed:
- `electron` - Electron framework
- `electron-builder` - Build and packaging tool
- `concurrently` - Run multiple commands

### 2. Add Scripts to package.json

**IMPORTANT**: You need to manually add these scripts to your `package.json` file.

Open `package.json` and add these entries to the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5000 && NODE_ENV=development electron electron/main.js\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

**Note**: You'll also need to install `wait-on`:
```bash
npm install --save-dev wait-on
```

### 3. Development Mode (Test the Electron App)

Run the Electron app in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the EvoFlow backend server on port 5000
2. Launch the Electron window pointing to `/player`
3. Open DevTools for debugging

The window will NOT be in kiosk mode (you can exit fullscreen with F11 or ESC).

### 4. Build Installers

Before building, make sure you've built the production bundle:

```bash
npm run build
```

Then build for your platform:

#### Windows (on Windows machine)
```bash
npm run electron:build:win
```

**Output**:
- `electron-dist/EvoFlow Player Setup x.x.x.exe` - NSIS installer (recommended)
- `electron-dist/EvoFlow-Player-Portable-x.x.x.exe` - Portable version (no installation)

#### macOS (on macOS machine)
```bash
npm run electron:build:mac
```

**Output**:
- `electron-dist/EvoFlow Player-x.x.x.dmg` - DMG installer
- `electron-dist/EvoFlow Player-x.x.x-mac.zip` - ZIP archive
- Supports both Intel (x64) and Apple Silicon (arm64)

**Note**: For distribution, you'll need to sign the app with an Apple Developer certificate.

#### Linux (on Linux machine)
```bash
npm run electron:build:linux
```

**Output**:
- `electron-dist/EvoFlow Player-x.x.x.AppImage` - Universal Linux package
- `electron-dist/evoflow-player_x.x.x_amd64.deb` - Debian/Ubuntu package
- `electron-dist/evoflow-player-x.x.x.x86_64.rpm` - Fedora/RedHat package

#### All Platforms (build everything)
```bash
npm run electron:build
```

**Warning**: Building for all platforms requires specific OS environments. Cross-compilation has limitations:
- Windows → can only build for Windows
- macOS → can build for macOS and sometimes Linux
- Linux → can build for Linux and sometimes Windows

## 📦 Distribution

### Option 1: Manual Distribution

1. Build the installer for your target platform
2. Find the installer in the `electron-dist/` folder
3. Upload to your website/server
4. Provide download links to users

### Option 2: Auto-Update (Advanced)

You can configure auto-update using Electron's built-in updater:
1. Publish releases to GitHub/S3
2. Configure update server in `electron-builder.json`
3. Add update check code in `electron/main.js`

See: https://www.electron.build/auto-update

## 🎨 Customizing Icons

Place your app icons in `electron/resources/`:

- **Windows**: `icon.ico` (256x256 recommended, multi-resolution .ico file)
- **macOS**: `icon.icns` (512x512@2x recommended, use `iconutil` to create)
- **Linux**: `icon.png` (512x512 PNG recommended)

**Tools to create icons**:
- Windows: Use [icoconvert.com](https://icoconvert.com/) to create .ico from PNG
- macOS: Use `iconutil` command-line tool or [Icon Slate](https://www.kodlian.com/apps/icon-slate)
- Linux: Use any 512x512 PNG image

## ⚙️ Configuration

### Electron Builder Settings

Edit `electron-builder.json` to customize:
- App ID and name
- Build targets
- Installer options
- File inclusion/exclusion
- Code signing certificates

### Kiosk Mode Settings

Edit `electron/main.js` to configure:
- Window size (default: 1920x1080)
- Fullscreen/kiosk mode
- Auto-launch at startup
- Tray icon behavior

## 🔒 Production Considerations

### Code Signing

**Windows**:
- Purchase a code signing certificate
- Sign with `signtool` or configure in `electron-builder.json`
- Without signing, Windows SmartScreen will show warnings

**macOS**:
- Requires Apple Developer account ($99/year)
- Use Xcode to create signing certificates
- Notarize the app for macOS 10.15+

**Linux**:
- No code signing required

### Auto-Launch

The app is configured to launch at system startup by default. Disable this in `electron/main.js`:

```javascript
app.setLoginItemSettings({
  openAtLogin: false,  // Change to false
});
```

### Security

- Context isolation is enabled (secure)
- Node integration is disabled (secure)
- Preload script provides safe IPC communication

## 📁 File Structure

```
electron/
├── main.js              # Main process (window management)
├── preload.js           # Preload script (IPC bridge)
├── entitlements.mac.plist  # macOS permissions
└── resources/           # App icons
    ├── icon.ico         # Windows icon
    ├── icon.icns        # macOS icon
    └── icon.png         # Linux icon

electron-builder.json    # Build configuration
electron-dist/           # Build output (created after build)
```

## 🐛 Troubleshooting

### "wait-on: command not found"
Install the missing dependency:
```bash
npm install --save-dev wait-on
```

### "Cannot find module 'electron'"
Make sure Electron is installed:
```bash
npm install electron
```

### Build fails on Windows
- Install Windows Build Tools: `npm install --global windows-build-tools`
- Or install Visual Studio with C++ development tools

### Build fails on macOS
- Install Xcode command-line tools: `xcode-select --install`

### Build fails on Linux
- Install required packages:
  ```bash
  sudo apt-get install -y libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2
  ```

### App shows blank screen
- Check if the backend server is running (http://localhost:5000)
- Open DevTools (Ctrl+Shift+I in dev mode) and check console errors
- Verify the build was successful: `dist/` folder should contain built files

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Packager](https://github.com/electron/electron-packager)
- [Auto-Update Guide](https://www.electron.build/auto-update)

## 💡 Tips

1. **Test before building**: Always test with `npm run electron:dev` first
2. **Clean builds**: Delete `electron-dist/` before building to avoid issues
3. **Version numbers**: Update `version` in `package.json` before building
4. **File size**: The installer will be 100-200MB (includes Chromium and Node.js)
5. **Updates**: Consider implementing auto-update for easier distribution

## 🎯 Next Steps

1. Add your app icons to `electron/resources/`
2. Test in development mode: `npm run electron:dev`
3. Build for your platform
4. Test the installer
5. Distribute to users!

---

**Need help?** Check the EvoFlow documentation or open an issue on GitHub.
