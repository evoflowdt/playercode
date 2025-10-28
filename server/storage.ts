import {
  type Display,
  type InsertDisplay,
  type ContentItem,
  type InsertContentItem,
  type DisplayGroup,
  type InsertDisplayGroup,
  type Schedule,
  type InsertSchedule,
  type DashboardStats,
  type DisplayWithGroup,
  type ScheduleWithDetails,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getDisplay(id: string): Promise<Display | undefined>;
  getAllDisplays(): Promise<Display[]>;
  createDisplay(display: InsertDisplay): Promise<Display>;
  updateDisplay(id: string, updates: Partial<Display>): Promise<Display | undefined>;
  deleteDisplay(id: string): Promise<boolean>;
  
  getContentItem(id: string): Promise<ContentItem | undefined>;
  getAllContentItems(): Promise<ContentItem[]>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<boolean>;
  
  getDisplayGroup(id: string): Promise<DisplayGroup | undefined>;
  getAllDisplayGroups(): Promise<DisplayGroup[]>;
  createDisplayGroup(group: InsertDisplayGroup): Promise<DisplayGroup>;
  updateDisplayGroup(id: string, updates: Partial<DisplayGroup>): Promise<DisplayGroup | undefined>;
  deleteDisplayGroup(id: string): Promise<boolean>;
  
  getSchedule(id: string): Promise<Schedule | undefined>;
  getAllSchedules(): Promise<Schedule[]>;
  getSchedulesWithDetails(): Promise<ScheduleWithDetails[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<boolean>;
  
  getDashboardStats(): Promise<DashboardStats>;
  getDisplaysWithGroups(): Promise<DisplayWithGroup[]>;
}

export class MemStorage implements IStorage {
  private displays: Map<string, Display>;
  private contentItems: Map<string, ContentItem>;
  private displayGroups: Map<string, DisplayGroup>;
  private schedules: Map<string, Schedule>;

  constructor() {
    this.displays = new Map();
    this.contentItems = new Map();
    this.displayGroups = new Map();
    this.schedules = new Map();
    
    this.seedData();
  }

  private seedData() {
    const demoDisplays: Display[] = [
      {
        id: randomUUID(),
        name: "Store Entrance Display",
        hashCode: "ABC123456",
        status: "online",
        os: "Samsung Tizen",
        location: "New York, USA",
        latitude: "40.7128",
        longitude: "-74.0060",
        resolution: "1920x1080",
        lastSeen: new Date(),
        screenshot: null,
        groupId: null,
      },
      {
        id: randomUUID(),
        name: "Lobby Screen",
        hashCode: "DEF789012",
        status: "online",
        os: "LG webOS",
        location: "London, UK",
        latitude: "51.5074",
        longitude: "-0.1278",
        resolution: "3840x2160",
        lastSeen: new Date(),
        screenshot: null,
        groupId: null,
      },
      {
        id: randomUUID(),
        name: "Waiting Room TV",
        hashCode: "GHI345678",
        status: "offline",
        os: "Android",
        location: "Tokyo, Japan",
        latitude: "35.6762",
        longitude: "139.6503",
        resolution: "1920x1080",
        lastSeen: new Date(Date.now() - 3600000),
        screenshot: null,
        groupId: null,
      },
    ];

    demoDisplays.forEach(display => {
      this.displays.set(display.id, display);
    });
  }

  async getDisplay(id: string): Promise<Display | undefined> {
    return this.displays.get(id);
  }

  async getAllDisplays(): Promise<Display[]> {
    return Array.from(this.displays.values());
  }

  async createDisplay(insertDisplay: InsertDisplay): Promise<Display> {
    const id = randomUUID();
    const display: Display = {
      ...insertDisplay,
      id,
      status: "offline",
      lastSeen: null,
      screenshot: null,
      groupId: null,
    };
    this.displays.set(id, display);
    return display;
  }

  async updateDisplay(id: string, updates: Partial<Display>): Promise<Display | undefined> {
    const display = this.displays.get(id);
    if (!display) return undefined;
    
    const updated = { ...display, ...updates };
    this.displays.set(id, updated);
    return updated;
  }

  async deleteDisplay(id: string): Promise<boolean> {
    return this.displays.delete(id);
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }

  async getAllContentItems(): Promise<ContentItem[]> {
    return Array.from(this.contentItems.values());
  }

  async createContentItem(insertItem: InsertContentItem): Promise<ContentItem> {
    const id = randomUUID();
    const item: ContentItem = {
      ...insertItem,
      id,
      uploadedAt: new Date(),
    };
    this.contentItems.set(id, item);
    return item;
  }

  async updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const item = this.contentItems.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...updates };
    this.contentItems.set(id, updated);
    return updated;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    return this.contentItems.delete(id);
  }

  async getDisplayGroup(id: string): Promise<DisplayGroup | undefined> {
    return this.displayGroups.get(id);
  }

  async getAllDisplayGroups(): Promise<DisplayGroup[]> {
    return Array.from(this.displayGroups.values());
  }

  async createDisplayGroup(insertGroup: InsertDisplayGroup): Promise<DisplayGroup> {
    const id = randomUUID();
    const group: DisplayGroup = {
      ...insertGroup,
      id,
      createdAt: new Date(),
    };
    this.displayGroups.set(id, group);
    return group;
  }

  async updateDisplayGroup(id: string, updates: Partial<DisplayGroup>): Promise<DisplayGroup | undefined> {
    const group = this.displayGroups.get(id);
    if (!group) return undefined;
    
    const updated = { ...group, ...updates };
    this.displayGroups.set(id, updated);
    return updated;
  }

  async deleteDisplayGroup(id: string): Promise<boolean> {
    return this.displayGroups.delete(id);
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedulesWithDetails(): Promise<ScheduleWithDetails[]> {
    const schedules = Array.from(this.schedules.values());
    return schedules.map(schedule => {
      const content = this.contentItems.get(schedule.contentId);
      let targetName = "Unknown";
      
      if (schedule.targetType === "display") {
        const display = this.displays.get(schedule.targetId);
        targetName = display?.name || "Unknown Display";
      } else if (schedule.targetType === "group") {
        const group = this.displayGroups.get(schedule.targetId);
        targetName = group?.name || "Unknown Group";
      }
      
      return {
        ...schedule,
        contentName: content?.name || "Unknown Content",
        targetName,
      };
    });
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = randomUUID();
    const schedule: Schedule = {
      ...insertSchedule,
      id,
      createdAt: new Date(),
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updated = { ...schedule, ...updates };
    this.schedules.set(id, updated);
    return updated;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const displays = Array.from(this.displays.values());
    const totalDisplays = displays.length;
    const activeDisplays = displays.filter(d => d.status === "online").length;
    const offlineDisplays = displays.filter(d => d.status === "offline").length;
    const totalContent = this.contentItems.size;

    return {
      totalDisplays,
      activeDisplays,
      offlineDisplays,
      totalContent,
    };
  }

  async getDisplaysWithGroups(): Promise<DisplayWithGroup[]> {
    const displays = Array.from(this.displays.values());
    return displays.map(display => {
      const group = display.groupId ? this.displayGroups.get(display.groupId) : null;
      return {
        ...display,
        groupName: group?.name,
      };
    });
  }
}

export const storage = new MemStorage();
