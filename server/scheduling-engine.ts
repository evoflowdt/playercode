import type { Schedule, SchedulingRule, ContentPriority, ContentItem } from "@shared/schema";
import { storage } from "./storage";

// Rule configuration types
interface DayOfWeekRule {
  days: number[]; // 0-6 (Sunday-Saturday)
}

interface TimeRangeRule {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

interface DateRangeRule {
  startDate: string; // ISO date
  endDate: string; // ISO date
}

interface DaypartRule {
  daypart: "morning" | "afternoon" | "evening" | "night" | "custom";
  customStartTime?: string; // HH:MM format (for custom daypart)
  customEndTime?: string; // HH:MM format (for custom daypart)
}

interface ConditionRule {
  type: "weather" | "custom";
  condition: string;
  value: any;
}

type RuleConfig = DayOfWeekRule | TimeRangeRule | DateRangeRule | DaypartRule | ConditionRule;

export interface ScheduledContent {
  contentId?: string; // Present if schedule has single content
  playlistId?: string; // Present if schedule has playlist
  scheduleId: string;
  priority: number;
  source: "schedule" | "priority" | "default";
}

export class SchedulingEngine {
  /**
   * Evaluate if a scheduling rule matches the current time
   */
  private evaluateRule(rule: SchedulingRule, currentDate: Date = new Date()): boolean {
    if (!rule.enabled) {
      return false;
    }

    try {
      const config: RuleConfig = JSON.parse(rule.ruleConfig);

      switch (rule.ruleType) {
        case "day_of_week":
          return this.evaluateDayOfWeekRule(config as DayOfWeekRule, currentDate);
        case "time_range":
          return this.evaluateTimeRangeRule(config as TimeRangeRule, currentDate);
        case "date_range":
          return this.evaluateDateRangeRule(config as DateRangeRule, currentDate);
        case "daypart":
          return this.evaluateDaypartRule(config as DaypartRule, currentDate);
        case "condition":
          return this.evaluateConditionRule(config as ConditionRule, currentDate);
        default:
          console.warn(`Unknown rule type: ${rule.ruleType}`);
          return false;
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate day of week rule
   */
  private evaluateDayOfWeekRule(config: DayOfWeekRule, currentDate: Date): boolean {
    const currentDay = currentDate.getDay(); // 0-6
    return config.days.includes(currentDay);
  }

  /**
   * Evaluate time range rule
   */
  private evaluateTimeRangeRule(config: TimeRangeRule, currentDate: Date): boolean {
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();
    
    const [startHours, startMinutes] = config.startTime.split(":").map(Number);
    const startTime = startHours * 60 + startMinutes;
    
    const [endHours, endMinutes] = config.endTime.split(":").map(Number);
    const endTime = endHours * 60 + endMinutes;
    
    // Handle overnight ranges (e.g., 22:00 - 06:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Evaluate date range rule
   */
  private evaluateDateRangeRule(config: DateRangeRule, currentDate: Date): boolean {
    const current = currentDate.getTime();
    const start = new Date(config.startDate).getTime();
    const end = new Date(config.endDate).getTime();
    
    return current >= start && current <= end;
  }

  /**
   * Evaluate daypart rule (time-of-day segments)
   */
  private evaluateDaypartRule(config: DaypartRule, currentDate: Date): boolean {
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();
    
    let startTime: number;
    let endTime: number;
    
    // Predefined dayparts
    switch (config.daypart) {
      case "morning": // 06:00 - 12:00
        startTime = 6 * 60;
        endTime = 12 * 60;
        break;
      case "afternoon": // 12:00 - 18:00
        startTime = 12 * 60;
        endTime = 18 * 60;
        break;
      case "evening": // 18:00 - 22:00
        startTime = 18 * 60;
        endTime = 22 * 60;
        break;
      case "night": // 22:00 - 06:00
        startTime = 22 * 60;
        endTime = 6 * 60;
        break;
      case "custom":
        // Custom daypart with user-defined times
        if (!config.customStartTime || !config.customEndTime) {
          console.warn("Custom daypart missing start/end times");
          return false;
        }
        const [startHours, startMinutes] = config.customStartTime.split(":").map(Number);
        startTime = startHours * 60 + startMinutes;
        const [endHours, endMinutes] = config.customEndTime.split(":").map(Number);
        endTime = endHours * 60 + endMinutes;
        break;
      default:
        console.warn(`Unknown daypart: ${config.daypart}`);
        return false;
    }
    
    // Handle overnight ranges (e.g., night: 22:00 - 06:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  }

  /**
   * Evaluate condition rule (placeholder for future features)
   */
  private evaluateConditionRule(_config: ConditionRule, _currentDate: Date): boolean {
    // TODO: Implement weather API integration and custom conditions
    // For now, return false
    return false;
  }

  /**
   * Get all active schedules that match current time/rules
   */
  async getActiveSchedules(
    targetType: "display" | "group",
    targetId: string,
    organizationId: string,
    currentDate: Date = new Date()
  ): Promise<Schedule[]> {
    const allSchedules = await storage.getAllSchedules(organizationId);
    
    // Filter schedules by target and active status
    const targetSchedules = allSchedules.filter(
      (schedule) =>
        schedule.active &&
        schedule.targetType === targetType &&
        schedule.targetId === targetId
    );
    
    // Filter schedules by time range
    const activeSchedules = targetSchedules.filter((schedule) => {
      const start = new Date(schedule.startTime).getTime();
      const end = new Date(schedule.endTime).getTime();
      const current = currentDate.getTime();
      
      // Check if schedule is within time range
      if (current < start || current > end) {
        return false;
      }
      
      // Check repeat pattern
      if (schedule.repeat) {
        // TODO: Implement advanced repeat patterns (daily, weekly, monthly, etc.)
        // For now, just check if schedule is active
        return true;
      }
      
      return true;
    });
    
    // Evaluate scheduling rules for each active schedule
    const schedulesWithRules: Schedule[] = [];
    
    for (const schedule of activeSchedules) {
      const rules = await storage.getSchedulingRulesBySchedule(schedule.id, organizationId);
      
      // If no rules, include schedule
      if (rules.length === 0) {
        schedulesWithRules.push(schedule);
        continue;
      }
      
      // Check if all enabled rules match
      const enabledRules = rules.filter((rule) => rule.enabled);
      const allRulesMatch = enabledRules.every((rule) =>
        this.evaluateRule(rule, currentDate)
      );
      
      if (allRulesMatch) {
        schedulesWithRules.push(schedule);
      }
    }
    
    return schedulesWithRules;
  }

  /**
   * Get content to display based on schedules and priorities
   */
  async getContentForDisplay(
    displayId: string,
    currentDate: Date = new Date()
  ): Promise<ScheduledContent | null> {
    console.log(`[SchedulingEngine] getContentForDisplay called for display ${displayId} at ${currentDate.toISOString()}`);
    
    // Get display to find group
    const display = await storage.getDisplayById(displayId);
    if (!display) {
      console.log(`[SchedulingEngine] Display ${displayId} not found`);
      return null;
    }
    
    console.log(`[SchedulingEngine] Found display: ${display.name}, groupId: ${display.groupId}`);
    
    // Get schedules for this specific display
    const displaySchedules = await this.getActiveSchedules("display", displayId, display.organizationId, currentDate);
    console.log(`[SchedulingEngine] Found ${displaySchedules.length} active display schedules`);
    
    // Get schedules for display's group (if any)
    let groupSchedules: Schedule[] = [];
    if (display.groupId) {
      groupSchedules = await this.getActiveSchedules("group", display.groupId, display.organizationId, currentDate);
      console.log(`[SchedulingEngine] Found ${groupSchedules.length} active group schedules`);
    }
    
    // Combine and get priorities
    const allSchedules = [...displaySchedules, ...groupSchedules];
    console.log(`[SchedulingEngine] Total active schedules: ${allSchedules.length}`);
    
    // Get content priorities
    const priorities = await storage.getAllContentPriorities();
    const activePriorities = priorities.filter((priority) => {
      // Check if priority applies to this display or group
      if (priority.displayId && priority.displayId !== displayId) {
        return false;
      }
      if (priority.groupId && priority.groupId !== display.groupId) {
        return false;
      }
      
      // Check validity period
      if (priority.validFrom && new Date(priority.validFrom) > currentDate) {
        return false;
      }
      if (priority.validUntil && new Date(priority.validUntil) < currentDate) {
        return false;
      }
      
      return true;
    });
    
    // Build list of scheduled content with priorities
    const scheduledContent: ScheduledContent[] = allSchedules.map((schedule) => {
      // Use schedule priority (from schedules table)
      // Also check contentPriority table for additional priority boost
      const contentPriorityBoost = schedule.contentId 
        ? activePriorities.find((p) => p.contentId === schedule.contentId)
        : undefined;
      
      // Combined priority: schedule priority + content priority boost
      const totalPriority = (schedule.priority || 0) + (contentPriorityBoost?.priority || 0);
      
      return {
        contentId: schedule.contentId || undefined,
        playlistId: schedule.playlistId || undefined,
        scheduleId: schedule.id,
        priority: totalPriority,
        source: "schedule" as const,
      };
    });
    
    // Sort by priority (highest first), then by creation date (newest first)
    scheduledContent.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // If same priority, prefer newer schedules
      const scheduleA = allSchedules.find(s => s.id === a.scheduleId);
      const scheduleB = allSchedules.find(s => s.id === b.scheduleId);
      if (scheduleA && scheduleB) {
        return new Date(scheduleB.createdAt).getTime() - new Date(scheduleA.createdAt).getTime();
      }
      return 0;
    });
    
    // Return highest priority content
    return scheduledContent[0] || null;
  }

  /**
   * Get content for display group
   */
  async getContentForGroup(
    groupId: string,
    organizationId: string,
    currentDate: Date = new Date()
  ): Promise<ScheduledContent | null> {
    const groupSchedules = await this.getActiveSchedules("group", groupId, organizationId, currentDate);
    
    if (groupSchedules.length === 0) {
      return null;
    }
    
    // Get content priorities
    const priorities = await storage.getAllContentPriorities();
    const activePriorities = priorities.filter((priority) => {
      if (priority.groupId && priority.groupId !== groupId) {
        return false;
      }
      
      // Check validity period
      if (priority.validFrom && new Date(priority.validFrom) > currentDate) {
        return false;
      }
      if (priority.validUntil && new Date(priority.validUntil) < currentDate) {
        return false;
      }
      
      return true;
    });
    
    // Build list with priorities
    const scheduledContent: ScheduledContent[] = groupSchedules.map((schedule) => {
      // Find priority for this content (use contentId if available)
      const priority = schedule.contentId
        ? activePriorities.find((p) => p.contentId === schedule.contentId)
        : undefined;
      
      return {
        contentId: schedule.contentId || undefined,
        playlistId: schedule.playlistId || undefined,
        scheduleId: schedule.id,
        priority: priority?.priority || 0,
        source: "schedule" as const,
      };
    });
    
    // Sort by priority
    scheduledContent.sort((a, b) => b.priority - a.priority);
    
    return scheduledContent[0] || null;
  }

  /**
   * Detect scheduling conflicts
   */
  async detectConflicts(
    targetType: "display" | "group",
    targetId: string,
    organizationId: string,
    currentDate: Date = new Date()
  ): Promise<Array<{ schedule1: Schedule; schedule2: Schedule; reason: string }>> {
    const activeSchedules = await this.getActiveSchedules(targetType, targetId, organizationId, currentDate);
    const conflicts: Array<{ schedule1: Schedule; schedule2: Schedule; reason: string }> = [];
    
    // Check for overlapping schedules
    for (let i = 0; i < activeSchedules.length; i++) {
      for (let j = i + 1; j < activeSchedules.length; j++) {
        const schedule1 = activeSchedules[i];
        const schedule2 = activeSchedules[j];
        
        // Check if time ranges overlap
        const start1 = new Date(schedule1.startTime).getTime();
        const end1 = new Date(schedule1.endTime).getTime();
        const start2 = new Date(schedule2.startTime).getTime();
        const end2 = new Date(schedule2.endTime).getTime();
        
        const overlaps =
          (start1 <= start2 && end1 >= start2) ||
          (start2 <= start1 && end2 >= start1);
        
        if (overlaps) {
          conflicts.push({
            schedule1,
            schedule2,
            reason: "Overlapping time ranges",
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Get preview timeline for a date range
   */
  async getTimelinePreview(
    targetType: "display" | "group",
    targetId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date,
    intervalMinutes: number = 60
  ): Promise<Array<{ time: Date; content: ScheduledContent | null }>> {
    const timeline: Array<{ time: Date; content: ScheduledContent | null }> = [];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      let content: ScheduledContent | null;
      
      if (targetType === "display") {
        content = await this.getContentForDisplay(targetId, current);
      } else {
        content = await this.getContentForGroup(targetId, organizationId, current);
      }
      
      timeline.push({
        time: new Date(current),
        content,
      });
      
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    
    return timeline;
  }
}

export const schedulingEngine = new SchedulingEngine();
