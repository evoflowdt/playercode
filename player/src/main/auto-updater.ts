import { app, dialog, BrowserWindow } from 'electron';
import Store from 'electron-store';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

interface PlayerConfig {
  apiUrl: string;
  deviceId: string | null;
  deviceToken: string | null;
  displayName: string;
  autoUpdate: boolean;
  updateCheckInterval: number; // minutes
}

interface ReleaseInfo {
  id: string;
  version: string;
  platform: string;
  downloadUrl: string;
  changelog: string;
  fileSize: number | null;
  isPrerelease: boolean;
  releaseDate: string;
}

export class AutoUpdaterService {
  private store: Store<PlayerConfig>;
  private mainWindow: BrowserWindow | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private currentVersion: string;

  constructor(store: Store<PlayerConfig>) {
    this.store = store;
    this.currentVersion = app.getVersion();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * Start automatic update checks
   */
  startAutoCheck() {
    const autoUpdateEnabled = this.store.get('autoUpdate', true);
    if (!autoUpdateEnabled) {
      console.log('Auto-update is disabled');
      return;
    }

    const intervalMinutes = this.store.get('updateCheckInterval', 60); // Default: check every hour
    const intervalMs = intervalMinutes * 60 * 1000;

    // Check immediately on start
    this.checkForUpdates();

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);

    console.log(`Auto-update checks enabled (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automatic update checks
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Auto-update checks stopped');
    }
  }

  /**
   * Manually check for updates
   */
  async checkForUpdates(): Promise<void> {
    try {
      const apiUrl = this.store.get('apiUrl', '');
      if (!apiUrl) {
        console.log('No API URL configured, skipping update check');
        return;
      }

      // Determine platform
      const platform = this.getPlatform();
      
      // Check with our backend API for latest version
      const latestRelease = await this.fetchLatestRelease(apiUrl, platform);
      
      if (!latestRelease) {
        console.log('No release found for platform:', platform);
        this.sendStatusToRenderer('not-available', 'No updates available for your platform');
        return;
      }

      // Compare versions
      if (this.isNewerVersion(latestRelease.version, this.currentVersion)) {
        console.log(`New version available: ${latestRelease.version} (current: ${this.currentVersion})`);
        
        // Store the latest release info for downloadUpdate() to use
        this.store.set('latestReleaseInfo' as any, latestRelease);
        
        // For custom releases (non-electron-updater), handle manually
        this.handleCustomUpdate(latestRelease);
      } else {
        console.log(`Already running latest version: ${this.currentVersion}`);
        this.sendStatusToRenderer('not-available', 'You are running the latest version');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      this.sendStatusToRenderer('error', 'Failed to check for updates');
    }
  }

  /**
   * Download the available update (called from renderer via IPC)
   */
  async downloadUpdate(): Promise<void> {
    try {
      const latestRelease = this.store.get('latestReleaseInfo' as any, null);
      
      if (!latestRelease) {
        console.log('No update available to download');
        this.sendStatusToRenderer('error', 'No update available to download');
        return;
      }
      
      await this.downloadAndInstallUpdate(latestRelease);
    } catch (error) {
      console.error('Download failed:', error);
      this.sendStatusToRenderer('error', 'Failed to download update');
    }
  }

  /**
   * Fetch latest release from backend API
   */
  private async fetchLatestRelease(apiUrl: string, platform: string): Promise<ReleaseInfo | null> {
    return new Promise((resolve, reject) => {
      const url = `${apiUrl}/api/player/releases?platform=${platform}&latest=true`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const release = JSON.parse(data);
              resolve(release);
            } else if (res.statusCode === 404) {
              resolve(null); // No release found
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Handle custom update (download installer and notify user)
   */
  private handleCustomUpdate(release: ReleaseInfo) {
    this.sendStatusToRenderer('available', `New version ${release.version} available`, release);
    
    // Show notification with download option
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `EvoFlow Player ${release.version} is available`,
      detail: `Current version: ${this.currentVersion}\n\nChangelog:\n${release.changelog || 'No changelog provided'}`,
      buttons: ['Download and Install', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        // Download update
        this.downloadAndInstallUpdate(release);
      }
    });
  }

  /**
   * Download and install update
   */
  private async downloadAndInstallUpdate(release: ReleaseInfo) {
    try {
      this.sendStatusToRenderer('downloading', 'Downloading update...', { percent: 0 });
      
      const downloadPath = path.join(app.getPath('temp'), this.getInstallerFileName(release));
      
      // Create backup of current version info for rollback
      this.createBackupSnapshot();
      
      await this.downloadFile(release.downloadUrl, downloadPath, (progress) => {
        this.sendStatusToRenderer('downloading', `Downloading update: ${Math.round(progress)}%`, { percent: progress });
      });
      
      this.sendStatusToRenderer('downloaded', 'Update downloaded successfully', {
        version: release.version,
        path: downloadPath,
      });
      
      // Save update info for later
      this.store.set('pendingUpdatePath' as any, downloadPath);
      this.store.set('pendingUpdateVersion' as any, release.version);
      
      // Prompt to install
      if (this.mainWindow) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'question',
          title: 'Install Update',
          message: 'Update downloaded successfully',
          detail: `Version ${release.version} is ready to install. The application will close and the installer will launch. Continue?`,
          buttons: ['Install Now', 'Install on Next Restart'],
          defaultId: 0,
          cancelId: 1,
        }).then((result) => {
          if (result.response === 0) {
            // Launch installer and quit
            this.launchInstallerAndQuit(downloadPath);
          }
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.sendStatusToRenderer('error', 'Failed to download update');
      
      // Rollback: clear pending update
      this.clearPendingUpdate();
      
      if (this.mainWindow) {
        dialog.showErrorBox('Update Failed', 'Failed to download the update. Please try again later.');
      }
    }
  }

  /**
   * Create a backup snapshot of current version for rollback
   */
  private createBackupSnapshot() {
    this.store.set('backupVersion' as any, this.currentVersion);
    this.store.set('backupTimestamp' as any, new Date().toISOString());
    console.log(`Created backup snapshot for version ${this.currentVersion}`);
  }

  /**
   * Clear pending update (used for rollback)
   */
  private clearPendingUpdate() {
    this.store.delete('pendingUpdatePath' as any);
    this.store.delete('pendingUpdateVersion' as any);
    this.store.delete('latestReleaseInfo' as any);
    console.log('Cleared pending update');
  }

  /**
   * Rollback to previous version (manual intervention required)
   */
  rollback() {
    const backupVersion = this.store.get('backupVersion' as any, null);
    
    if (!backupVersion) {
      console.log('No backup version available for rollback');
      return false;
    }
    
    // Clear failed update
    this.clearPendingUpdate();
    
    // Log rollback event
    console.log(`Rollback initiated from ${this.currentVersion} to ${backupVersion}`);
    
    // Note: Actual rollback requires reinstalling the previous version
    // This is platform-dependent and typically requires user intervention
    // or a more complex rollback mechanism with version archives
    
    if (this.mainWindow) {
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Rollback Required',
        message: 'Update Failed',
        detail: `To restore version ${backupVersion}, please reinstall the player from the Downloads page or contact support.`,
        buttons: ['OK'],
      });
    }
    
    return true;
  }

  /**
   * Download file with progress tracking and validation
   */
  private downloadFile(url: string, destPath: string, onProgress?: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        // Validate HTTP status code
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        
        const file = fs.createWriteStream(destPath);
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize > 0) {
            const percent = (downloadedSize / totalSize) * 100;
            onProgress(percent);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          // Verify file was written successfully
          if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
            resolve();
          } else {
            reject(new Error('Download verification failed: file is empty or missing'));
          }
        });
        
        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        if (fs.existsSync(destPath)) {
          fs.unlink(destPath, () => {});
        }
        reject(err);
      });
    });
  }

  /**
   * Launch installer and quit application (with error handling)
   */
  private launchInstallerAndQuit(installerPath: string) {
    const { exec } = require('child_process');
    
    // Verify installer file exists and is not empty
    if (!fs.existsSync(installerPath) || fs.statSync(installerPath).size === 0) {
      console.error('Installer file is missing or empty');
      this.sendStatusToRenderer('error', 'Installer file is corrupted');
      if (this.mainWindow) {
        dialog.showErrorBox('Install Error', 'The installer file is corrupted. Please try downloading again.');
      }
      return;
    }
    
    // Launch installer based on platform with error handling
    let command: string;
    if (process.platform === 'win32') {
      command = `"${installerPath}" /S`;
    } else if (process.platform === 'darwin') {
      command = `open "${installerPath}"`;
    } else if (process.platform === 'linux') {
      command = `chmod +x "${installerPath}" && "${installerPath}"`;
    } else {
      console.error('Unsupported platform for auto-update');
      this.sendStatusToRenderer('error', 'Unsupported platform');
      return;
    }
    
    exec(command, (error) => {
      if (error) {
        console.error('Failed to launch installer:', error);
        this.sendStatusToRenderer('error', 'Failed to launch installer');
        if (this.mainWindow) {
          dialog.showErrorBox(
            'Install Error',
            `Failed to launch the installer. Error: ${error.message}\n\nPlease manually install from: ${installerPath}`
          );
        }
        // DO NOT quit app on error - let user try again or install manually
      } else {
        // Clear pending update and installer file before quitting
        console.log('Installer launched successfully, cleaning up and quitting...');
        this.clearPendingUpdate();
        
        // Also delete the downloaded installer file
        try {
          if (fs.existsSync(installerPath)) {
            fs.unlinkSync(installerPath);
            console.log('Cleaned up installer file');
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup installer:', cleanupError);
          // Continue anyway - installer already launched
        }
        
        app.quit();
      }
    });
  }


  /**
   * Quit application and install update
   */
  quitAndInstall() {
    const pendingPath = this.store.get('pendingUpdatePath' as any, null);
    
    if (pendingPath && fs.existsSync(pendingPath as string)) {
      this.launchInstallerAndQuit(pendingPath as string);
    } else {
      console.log('No pending update to install');
      if (this.mainWindow) {
        dialog.showErrorBox('Install Error', 'No update available to install. Please download an update first.');
      }
    }
  }

  /**
   * Send status update to renderer process
   */
  private sendStatusToRenderer(status: string, message: string, data?: any) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('update-status', {
        status,
        message,
        currentVersion: this.currentVersion,
        data,
      });
    }
  }

  /**
   * Get platform identifier
   */
  private getPlatform(): string {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'macos';
    if (process.platform === 'linux') return 'linux';
    return 'unknown';
  }

  /**
   * Get installer file name based on release info
   */
  private getInstallerFileName(release: ReleaseInfo): string {
    const ext = release.platform === 'windows' ? 'exe' : 
                release.platform === 'macos' ? 'dmg' : 
                'AppImage';
    return `evoflow-player-${release.version}.${ext}`;
  }

  /**
   * Compare versions (simple semver comparison)
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const cleanNew = newVersion.replace(/^v/, '').split('-')[0];
    const cleanCurrent = currentVersion.replace(/^v/, '').split('-')[0];
    
    const newParts = cleanNew.split('.').map(Number);
    const currentParts = cleanCurrent.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }
    
    return false; // versions are equal
  }

  /**
   * Check for pending updates on app start
   */
  checkPendingUpdate() {
    const pendingPath = this.store.get('pendingUpdatePath' as any, null);
    if (pendingPath && fs.existsSync(pendingPath as string)) {
      dialog.showMessageBox({
        type: 'question',
        title: 'Pending Update',
        message: 'A previously downloaded update is ready to install',
        detail: 'Would you like to install it now?',
        buttons: ['Install Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((result) => {
        if (result.response === 0) {
          this.launchInstallerAndQuit(pendingPath as string);
        }
      });
    }
  }
}
