export interface PlayerConfig {
  apiUrl: string;
  deviceId: string | null;
  deviceToken: string | null;
  displayName: string;
}

export interface Display {
  id: string;
  name: string;
  organizationId: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
}

export interface ContentItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'url';
  url: string;
  duration: number; // in seconds
  metadata?: Record<string, any>;
}

export interface Playlist {
  id: string;
  name: string;
  items: ContentItem[];
}

export interface Schedule {
  id: string;
  playlistId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

export interface WebSocketMessage {
  type: 'content_update' | 'schedule_update' | 'command' | 'ping';
  payload: any;
}

export interface Command {
  type: 'restart' | 'reload' | 'screenshot' | 'update_content';
  params?: any;
}
