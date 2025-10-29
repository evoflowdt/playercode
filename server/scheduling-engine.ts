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

interface ConditionRule {
  type: "weather" | "custom";
  condition: string;
  value: any;
}

type RuleConfig = DayOfWeekRule | TimeRangeRule | DateRangeRule | ConditionRule;

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
    currentDate: Date = new Date()
  ): Promise<Schedule[]> {
    const allSchedules = await storage.getAllSchedules();
    
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
      const rules = await storage.getSchedulingRulesBySchedule(schedule.id);
      
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
    const display = await storage.getDisplay(displayId);
    if (!display) {
      console.log(`[SchedulingEngine] Display ${displayId} not found`);
      return null;
    }
    
    console.log(`[SchedulingEngine] Found display: ${display.name}, groupId: ${display.groupId}`);
    
    // Get schedules for this specific display
    const displaySchedules = await this.getActiveSchedules("display", displayId, currentDate);
    console.log(`[SchedulingEngine] Found ${displaySchedules.length} active display schedules`);
    
    // Get schedules for display's group (if any)
    let groupSchedules: Schedule[] = [];
    if (display.groupId) {
      groupSchedules = await this.getActiveSchedules("group", display.groupId, currentDate);
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
    
    // Sort by priority (highest first)
    scheduledContent.sort((a, b) => b.priority - a.priority);
    
    // Return highest priority content
    return scheduledContent[0] || null;
  }

  /**
   * Get content for display group
   */
  async getContentForGroup(
    groupId: string,
    currentDate: Date = new Date()
  ): Promise<ScheduledContent | null> {
    const groupSchedules = await this.getActiveSchedules("group", groupId, currentDate);
    
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
    currentDate: Date = new Date()
  ): Promise<Array<{ schedule1: Schedule; schedule2: Schedule; reason: string }>> {
    const activeSchedules = await this.getActiveSchedules(targetType, targetId, currentDate);
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
        content = await this.getContentForGroup(targetId, current);
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
