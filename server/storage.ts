// Database storage implementation - migrated from MemStorage to PostgreSQL
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
  displays,
  contentItems,
  displayGroups,
  schedules,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // Display methods
  async getDisplay(id: string): Promise<Display | undefined> {
    const [display] = await db.select().from(displays).where(eq(displays.id, id));
    return display || undefined;
  }

  async getAllDisplays(): Promise<Display[]> {
    return await db.select().from(displays);
  }

  async createDisplay(insertDisplay: InsertDisplay): Promise<Display> {
    const [display] = await db
      .insert(displays)
      .values(insertDisplay)
      .returning();
    return display;
  }

  async updateDisplay(id: string, updates: Partial<Display>): Promise<Display | undefined> {
    const [updated] = await db
      .update(displays)
      .set(updates)
      .where(eq(displays.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDisplay(id: string): Promise<boolean> {
    const result = await db.delete(displays).where(eq(displays.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Content methods
  async getContentItem(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item || undefined;
  }

  async getAllContentItems(): Promise<ContentItem[]> {
    return await db.select().from(contentItems);
  }

  async createContentItem(insertItem: InsertContentItem): Promise<ContentItem> {
    const [item] = await db
      .insert(contentItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const [updated] = await db
      .update(contentItems)
      .set(updates)
      .where(eq(contentItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    const result = await db.delete(contentItems).where(eq(contentItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Display Group methods
  async getDisplayGroup(id: string): Promise<DisplayGroup | undefined> {
    const [group] = await db.select().from(displayGroups).where(eq(displayGroups.id, id));
    return group || undefined;
  }

  async getAllDisplayGroups(): Promise<DisplayGroup[]> {
    return await db.select().from(displayGroups);
  }

  async createDisplayGroup(insertGroup: InsertDisplayGroup): Promise<DisplayGroup> {
    const [group] = await db
      .insert(displayGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async updateDisplayGroup(id: string, updates: Partial<DisplayGroup>): Promise<DisplayGroup | undefined> {
    const [updated] = await db
      .update(displayGroups)
      .set(updates)
      .where(eq(displayGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDisplayGroup(id: string): Promise<boolean> {
    const result = await db.delete(displayGroups).where(eq(displayGroups.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Schedule methods
  async getSchedule(id: string): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async getSchedulesWithDetails(): Promise<ScheduleWithDetails[]> {
    const allSchedules = await db.select().from(schedules);
    
    const result: ScheduleWithDetails[] = [];
    
    for (const schedule of allSchedules) {
      const [content] = await db
        .select()
        .from(contentItems)
        .where(eq(contentItems.id, schedule.contentId));
      
      let targetName = "Unknown";
      if (schedule.targetType === "display") {
        const [display] = await db
          .select()
          .from(displays)
          .where(eq(displays.id, schedule.targetId));
        targetName = display?.name || "Unknown Display";
      } else if (schedule.targetType === "group") {
        const [group] = await db
          .select()
          .from(displayGroups)
          .where(eq(displayGroups.id, schedule.targetId));
        targetName = group?.name || "Unknown Group";
      }
      
      result.push({
        ...schedule,
        contentName: content?.name || "Unknown Content",
        targetName,
      });
    }
    
    return result;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const [updated] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Stats and aggregations
  async getDashboardStats(): Promise<DashboardStats> {
    const result = await db.execute<{
      total_displays: number;
      active_displays: number;
      offline_displays: number;
      total_content: number;
    }>(sql`
      SELECT
        (SELECT COUNT(*)::int FROM ${displays}) as total_displays,
        (SELECT COUNT(*)::int FROM ${displays} WHERE status = 'online') as active_displays,
        (SELECT COUNT(*)::int FROM ${displays} WHERE status = 'offline') as offline_displays,
        (SELECT COUNT(*)::int FROM ${contentItems}) as total_content
    `);

    const stats = result.rows[0];

    return {
      totalDisplays: stats?.total_displays || 0,
      activeDisplays: stats?.active_displays || 0,
      offlineDisplays: stats?.offline_displays || 0,
      totalContent: stats?.total_content || 0,
    };
  }

  async getDisplaysWithGroups(): Promise<DisplayWithGroup[]> {
    const allDisplays = await db.select().from(displays);
    
    const result: DisplayWithGroup[] = [];
    for (const display of allDisplays) {
      if (display.groupId) {
        const [group] = await db
          .select()
          .from(displayGroups)
          .where(eq(displayGroups.id, display.groupId));
        result.push({
          ...display,
          groupName: group?.name,
        });
      } else {
        result.push({
          ...display,
          groupName: undefined,
        });
      }
    }
    
    return result;
  }
}

export const storage = new DatabaseStorage();
