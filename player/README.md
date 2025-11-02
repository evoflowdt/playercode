# EvoFlow Desktop Player

A standalone desktop application for displaying digital signage content managed by the EvoFlow platform.

## Features

- **Kiosk Mode**: Fullscreen display with no browser UI
- **Auto-Launch**: Starts automatically when system boots
- **Multi-Platform**: Works on Windows, macOS, and Linux
- **Real-Time Updates**: WebSocket connection for instant content updates
- **Playlist Support**: Displays images and videos in sequence
- **System Tray Control**: Quick access to restart or quit
- **Hardware Acceleration**: Optimized video playback performance

## Prerequisites

Before building the player, ensure you have:

- **Node.js 18+** installed on your system
- **Internet connection** for downloading dependencies
- **Git** (optional, for cloning the repository)

### Platform-Specific Requirements

#### Windows
- Windows 10 or later
- No additional requirements

#### macOS
- macOS 10.13 (High Sierra) or later
- Xcode Command Line Tools: `xcode-select --install`

#### Linux
- Ubuntu 18.04+ / Debian 10+ / Fedora 32+ or equivalent
- Build essentials: `sudo apt install build-essential`

## Building from Source

### Step 1: Clone or Download

```bash
# If using Git
git clone https://github.com/evoflowdt/playercode.git
cd playercode

# Or download and extract the ZIP from GitHub:
# https://codeload.github.com/evoflowdt/playercode/zip/refs/heads/main
```

### Step 2: Install Dependencies ⚠️ REQUIRED

> **⚠️ IMPORTANT**: The source code does NOT include dependencies (node_modules).
> You MUST run `npm install` before building or you'll get "electron not found" errors!

```bash
npm install
```

This command downloads all required packages including:
- **Electron** (the desktop app framework)
- **TypeScript** (for compilation)
- **electron-builder** (for creating installers)
- All other dependencies

**Estimated download**: ~200MB (one-time only)

### Step 3: Build the Application

#### Build for Your Current Platform

```bash
# Build TypeScript files
npm run build

# Create installer for your platform
npm run dist
```

The installer will be created in the `release/` directory.

#### Build for Specific Platforms

```bash
# Windows installer (.exe)
npm run dist:win

# macOS disk image (.dmg)
npm run dist:mac

# Linux AppImage and Debian package
npm run dist:linux
```

**Note**: To build for macOS or Windows from Linux, or vice versa, you may need additional tools. See [electron-builder multi-platform documentation](https://www.electron.build/multi-platform-build).

### Step 4: Find Your Installer

After building, find the installer in the `release/` directory:

- **Windows**: `EvoFlow-Player-Setup-X.X.X.exe`
- **macOS**: `EvoFlow-Player-X.X.X.dmg`
- **Linux**: `evoflow-player-X.X.X.AppImage` or `.deb`

## Development

### Running in Development Mode

```bash
# Build and watch for changes
npm run dev
```

This opens the player in development mode with auto-reload enabled.

### Project Structure

```
player/
├── src/
│   ├── main/          # Electron main process
│   │   ├── main.ts    # App initialization, window creation
│   │   └── preload.ts # IPC bridge
│   ├── renderer/      # UI (runs in browser context)
│   │   ├── index.html # Player interface
│   │   └── player.ts  # Content playback logic
│   └── shared/        # Shared types and config
├── dist/              # Compiled JavaScript
├── release/           # Built installers
└── package.json       # Dependencies and build config
```

## First-Time Setup

### 1. Install the Player

Run the installer for your platform.

### 2. Configure Connection

On first launch:
1. The player will show a settings dialog
2. Enter your **EvoFlow Platform URL** (e.g., `https://your-domain.com`)
3. Enter a **Display Name** for this device
4. Click **Save & Restart**

The player will generate a unique Device ID automatically.

### 3. Register Device

After restart:
1. The player will show: "Device ID: XXXXXXXX - Please pair in dashboard"
2. Go to your EvoFlow web dashboard
3. Navigate to **Displays** → **Add New Display**
4. Enter the Device ID shown in the player status
5. Click **Pair Device**

Once paired, the player will:
- Receive a device token automatically
- Connect to your content feed
- Start displaying your scheduled content

### 4. Add Icon (Optional but Recommended)

Before building for production:
1. Create a 512x512 PNG icon with your branding
2. Save it as `assets/icon.png`
3. electron-builder will use it for all platforms

Without a custom icon, the app uses system defaults.

## Keyboard Shortcuts

- **Ctrl+Shift+S**: Open settings dialog
- **Alt+F4** or **Cmd+Q**: Quit application

## System Tray

Right-click the EvoFlow icon in your system tray to:
- Show the player window
- Restart the player
- Access settings
- Quit the application

## Troubleshooting

### Player won't connect

1. Check that the API URL is correct
2. Ensure the EvoFlow platform is running
3. Verify network connectivity
4. Check firewall settings

### Content not displaying

1. Verify the device is registered in the dashboard
2. Check that content is assigned to this display
3. Look for error messages in the system tray

### Auto-launch not working

- **Windows**: Check Windows Startup folder
- **macOS**: Check System Preferences → Users & Groups → Login Items
- **Linux**: Check your desktop environment's startup applications

## Building for Distribution

### Code Signing (Optional but Recommended)

For production releases, sign your application:

#### Windows
```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
npm run dist:win
```

#### macOS
```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export APPLE_ID=your@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
npm run dist:mac
```

### Creating Releases on GitHub

1. Tag your version: `git tag v1.0.0`
2. Push tags: `git push --tags`
3. Create a release on GitHub
4. Upload the built installers from `release/`

## License

MIT License - Copyright (c) 2025 Digital Town Srl

## Support

For issues or questions:
- GitHub Issues: [Repository URL]
- Email: support@digitaltown.com
