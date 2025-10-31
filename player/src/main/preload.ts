import { contextBridge, ipcRenderer } from 'electron';
import { PlayerConfig } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (): Promise<PlayerConfig> => ipcRenderer.invoke('get-config'),
  saveConfig: (config: Partial<PlayerConfig>): Promise<boolean> => 
    ipcRenderer.invoke('save-config', config),
  restartApp: (): Promise<void> => ipcRenderer.invoke('restart-app'),
  exitKiosk: (): Promise<void> => ipcRenderer.invoke('exit-kiosk'),
  enterKiosk: (): Promise<void> => ipcRenderer.invoke('enter-kiosk'),
  onSettingsOpen: (callback: () => void) => {
    ipcRenderer.on('open-settings', callback);
  },
  // Auto-update API
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('download-update'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('update-status', (_event, status) => callback(status));
  },
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  },
});

declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<PlayerConfig>;
      saveConfig: (config: Partial<PlayerConfig>) => Promise<boolean>;
      restartApp: () => Promise<void>;
      exitKiosk: () => Promise<void>;
      enterKiosk: () => Promise<void>;
      onSettingsOpen: (callback: () => void) => void;
      // Auto-update API
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateStatus: (callback: (status: any) => void) => void;
      removeUpdateStatusListener: () => void;
    };
  }
}
