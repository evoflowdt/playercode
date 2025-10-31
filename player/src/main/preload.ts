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
    };
  }
}
