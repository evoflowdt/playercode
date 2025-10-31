import { ContentItem, Playlist, WebSocketMessage, Command } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/config';

class EvoFlowPlayer {
  private ws: WebSocket | null = null;
  private currentPlaylist: Playlist | null = null;
  private currentIndex = 0;
  private contentTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private config: any = null;

  private elements = {
    loading: document.getElementById('loading-screen')!,
    statusText: document.querySelector('.status-text')!,
    imageDisplay: document.getElementById('content-display') as HTMLImageElement,
    videoDisplay: document.getElementById('video-display') as HTMLVideoElement,
    errorMessage: document.getElementById('error-message')!,
    settingsDialog: document.getElementById('settings-dialog')!,
  };

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.config = await window.electronAPI.getConfig();
      
      // Setup settings dialog
      this.setupSettingsDialog();
      
      // If not configured, show settings
      if (!this.config.deviceId || !this.config.apiUrl) {
        this.showSettings();
        return;
      }

      // Connect to platform
      this.connect();
    } catch (error) {
      this.showError('Failed to initialize player');
      console.error('Init error:', error);
    }
  }

  private setupSettingsDialog() {
    const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
    const displayNameInput = document.getElementById('display-name') as HTMLInputElement;
    const deviceIdInput = document.getElementById('device-id') as HTMLInputElement;
    const saveButton = document.getElementById('save-settings')!;
    const cancelButton = document.getElementById('cancel-settings')!;

    // Load current config
    apiUrlInput.value = this.config?.apiUrl || DEFAULT_CONFIG.apiUrl;
    displayNameInput.value = this.config?.displayName || DEFAULT_CONFIG.displayName;
    deviceIdInput.value = this.config?.deviceId || 'Not registered';

    saveButton.addEventListener('click', async () => {
      try {
        await window.electronAPI.saveConfig({
          apiUrl: apiUrlInput.value,
          displayName: displayNameInput.value,
        });
        await window.electronAPI.restartApp();
      } catch (error) {
        this.showError('Failed to save settings');
      }
    });

    cancelButton.addEventListener('click', () => {
      this.hideSettings();
    });

    // Listen for settings open command
    window.electronAPI.onSettingsOpen(() => {
      this.showSettings();
    });

    // Press Ctrl+Shift+S to open settings
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        this.showSettings();
      }
    });
  }

  private showSettings() {
    this.elements.settingsDialog.classList.add('visible');
    window.electronAPI.exitKiosk();
  }

  private hideSettings() {
    this.elements.settingsDialog.classList.remove('visible');
    window.electronAPI.enterKiosk();
  }

  private connect() {
    if (!this.config.apiUrl) {
      this.showError('Player not configured - API URL missing');
      return;
    }
    
    // Device token might not exist yet for new devices
    if (!this.config.deviceToken) {
      console.log('No device token - device needs to be paired in dashboard');
      this.setStatus('Waiting for device pairing...');
    }

    const wsUrl = this.config.apiUrl.replace('http', 'ws') + '/ws';
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to EvoFlow platform');
        this.setStatus('Connected');
        
        // Authenticate if we have a token, otherwise just send device ID for pairing
        if (this.config.deviceToken) {
          this.send({
            type: 'auth',
            payload: {
              deviceId: this.config.deviceId,
              token: this.config.deviceToken,
            },
          });

          // Request current content
          this.send({
            type: 'request_content',
            payload: {},
          });
        } else {
          // Send registration request
          this.send({
            type: 'register',
            payload: {
              deviceId: this.config.deviceId,
              displayName: this.config.displayName,
            },
          });
          this.setStatus('Device ID: ' + this.config.deviceId + ' - Please pair in dashboard');
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.showError('Connection error');
      };

      this.ws.onclose = () => {
        console.log('Disconnected from platform');
        this.setStatus('Disconnected - Reconnecting...');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Connection error:', error);
      this.showError('Failed to connect');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, DEFAULT_CONFIG.reconnectInterval);
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'content_update':
        this.updateContent(message.payload);
        break;
      case 'command':
        this.handleCommand(message.payload);
        break;
      case 'ping':
        this.send({ type: 'pong', payload: {} });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private updateContent(playlist: Playlist) {
    console.log('Updating content:', playlist);
    this.currentPlaylist = playlist;
    this.currentIndex = 0;
    this.hideLoading();
    this.playNext();
  }

  private playNext() {
    if (!this.currentPlaylist || this.currentPlaylist.items.length === 0) {
      this.showError('No content to display');
      return;
    }

    const item = this.currentPlaylist.items[this.currentIndex];
    this.displayContent(item);

    // Schedule next item
    if (this.contentTimeout) {
      clearTimeout(this.contentTimeout);
    }

    this.contentTimeout = setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist!.items.length;
      this.playNext();
    }, item.duration * 1000);
  }

  private displayContent(item: ContentItem) {
    console.log('Displaying:', item);

    // Hide all displays
    this.elements.imageDisplay.style.display = 'none';
    this.elements.videoDisplay.style.display = 'none';

    switch (item.type) {
      case 'image':
        this.elements.imageDisplay.src = item.url;
        this.elements.imageDisplay.style.display = 'block';
        break;
      case 'video':
        this.elements.videoDisplay.src = item.url;
        this.elements.videoDisplay.style.display = 'block';
        this.elements.videoDisplay.play();
        break;
      case 'url':
        // For URL content, open in a new window or display error
        console.log('URL content not yet supported in kiosk mode:', item.url);
        this.showError('URL content type not supported');
        break;
    }
  }

  private handleCommand(command: Command) {
    console.log('Received command:', command);
    
    switch (command.type) {
      case 'restart':
        window.electronAPI.restartApp();
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'screenshot':
        // Implement screenshot functionality
        break;
      case 'update_content':
        this.send({ type: 'request_content', payload: {} });
        break;
    }
  }

  private setStatus(text: string) {
    this.elements.statusText.textContent = text;
  }

  private showError(message: string) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.add('visible');
    setTimeout(() => {
      this.elements.errorMessage.classList.remove('visible');
    }, 5000);
  }

  private hideLoading() {
    this.elements.loading.classList.add('hidden');
  }
}

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new EvoFlowPlayer();
  });
} else {
  new EvoFlowPlayer();
}
