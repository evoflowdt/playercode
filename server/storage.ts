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
  type Playlist,
  type InsertPlaylist,
  type PlaylistItem,
  type InsertPlaylistItem,
  type RadioStream,
  type InsertRadioStream,
  type PairingToken,
  type InsertPairingToken,
  type PlayerSession,
  type InsertPlayerSession,
  type PlayerCapabilities,
  type InsertPlayerCapabilities,
  type SchedulingRule,
  type InsertSchedulingRule,
  type ContentPriority,
  type InsertContentPriority,
  type Transition,
  type InsertTransition,
  type SyncGroup,
  type InsertSyncGroup,
  type SyncGroupMember,
  type InsertSyncGroupMember,
  type SyncSession,
  type InsertSyncSession,
  type Organization,
  type InsertOrganization,
  type User,
  type InsertUser,
  type OrganizationMember,
  type InsertOrganizationMember,
  type Session,
  type InsertSession,
  type Invitation,
  type InsertInvitation,
  type AuditLog,
  type InsertAuditLog,
  type UserWithOrganizations,
  type DashboardStats,
  type DisplayWithGroup,
  type ScheduleWithDetails,
  type PlaylistWithItems,
  type SyncGroupWithMembers,
  type SyncSessionWithDetails,
  type TeamMember,
  type InvitationWithDetails,
  type AuditLogWithDetails,
  type DisplayMetric,
  type ContentView,
  type ScheduleExecution,
  type AdvancedAnalytics,
  type ApiKey,
  type Webhook,
  type WebhookEvent,
  type Notification,
  type InsertNotification,
  type ResourcePermission,
  type InsertResourcePermission,
  type UpdateResourcePermission,
  type ContentTemplate,
  type InsertContentTemplate,
  type UpdateContentTemplate,
  type TemplateApplication,
  type InsertTemplateApplication,
  type PlayerRelease,
  type InsertPlayerRelease,
  type UpdatePlayerRelease,
  displays,
  contentItems,
  displayGroups,
  schedules,
  playlists,
  playlistItems,
  radioStreams,
  pairingTokens,
  playerSessions,
  playerCapabilities,
  schedulingRules,
  contentPriority,
  transitions,
  syncGroups,
  syncGroupMembers,
  syncSessions,
  organizations,
  users,
  organizationMembers,
  sessions,
  invitations,
  auditLogs,
  displayMetrics,
  contentViews,
  scheduleExecutions,
  apiKeys,
  webhooks,
  webhookEvents,
  notifications,
  resourcePermissions,
  contentTemplates,
  templateApplications,
  playerReleases,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gt, lt, gte, lte, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getDisplay(id: string, organizationId: string): Promise<Display | undefined>;
  getDisplayById(id: string): Promise<Display | undefined>; // For internal use without org filtering
  getAllDisplays(organizationId: string): Promise<Display[]>;
  createDisplay(display: InsertDisplay, organizationId: string): Promise<Display>;
  updateDisplay(id: string, updates: Partial<Display>, organizationId: string): Promise<Display | undefined>;
  deleteDisplay(id: string, organizationId: string): Promise<boolean>;
  
  getContentItem(id: string, organizationId: string): Promise<ContentItem | undefined>;
  getContentItemById(id: string): Promise<ContentItem | undefined>; // For internal use without org filtering
  getAllContentItems(organizationId: string): Promise<ContentItem[]>;
  createContentItem(item: InsertContentItem, organizationId: string): Promise<ContentItem>;
  updateContentItem(id: string, updates: Partial<ContentItem>, organizationId: string): Promise<ContentItem | undefined>;
  deleteContentItem(id: string, organizationId: string): Promise<boolean>;
  
  getDisplayGroup(id: string, organizationId: string): Promise<DisplayGroup | undefined>;
  getAllDisplayGroups(organizationId: string): Promise<DisplayGroup[]>;
  createDisplayGroup(group: InsertDisplayGroup, organizationId: string): Promise<DisplayGroup>;
  updateDisplayGroup(id: string, updates: Partial<DisplayGroup>, organizationId: string): Promise<DisplayGroup | undefined>;
  deleteDisplayGroup(id: string, organizationId: string): Promise<boolean>;
  
  getSchedule(id: string, organizationId: string): Promise<Schedule | undefined>;
  getAllSchedules(organizationId: string): Promise<Schedule[]>;
  getSchedulesWithDetails(organizationId: string): Promise<ScheduleWithDetails[]>;
  createSchedule(schedule: InsertSchedule, organizationId: string): Promise<Schedule>;
  updateSchedule(id: string, updates: Partial<Schedule>, organizationId: string): Promise<Schedule | undefined>;
  deleteSchedule(id: string, organizationId: string): Promise<boolean>;
  
  getPlaylist(id: string, organizationId: string): Promise<Playlist | undefined>;
  getPlaylistById(id: string): Promise<Playlist | undefined>; // For internal use without org filtering
  getAllPlaylists(organizationId: string): Promise<Playlist[]>;
  getPlaylistWithItems(id: string, organizationId: string): Promise<PlaylistWithItems | undefined>;
  getAllPlaylistsWithItems(organizationId: string): Promise<PlaylistWithItems[]>;
  createPlaylist(playlist: InsertPlaylist, organizationId: string): Promise<Playlist>;
  updatePlaylist(id: string, updates: Partial<Playlist>, organizationId: string): Promise<Playlist | undefined>;
  deletePlaylist(id: string, organizationId: string): Promise<boolean>;
  addItemToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem>;
  removeItemFromPlaylist(itemId: string): Promise<boolean>;
  
  getRadioStream(id: string): Promise<RadioStream | undefined>;
  getRadioStreamsByPlaylist(playlistId: string): Promise<RadioStream[]>;
  getAllRadioStreams(): Promise<RadioStream[]>;
  createRadioStream(stream: InsertRadioStream): Promise<RadioStream>;
  updateRadioStream(id: string, updates: Partial<RadioStream>): Promise<RadioStream | undefined>;
  deleteRadioStream(id: string): Promise<boolean>;
  
  getPairingToken(token: string): Promise<PairingToken | undefined>;
  getPairingTokenById(id: string): Promise<PairingToken | undefined>;
  createPairingToken(token: InsertPairingToken): Promise<PairingToken>;
  usePairingToken(token: string, displayId: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<number>;
  
  getPlayerSession(displayId: string): Promise<PlayerSession | undefined>;
  getAllPlayerSessions(): Promise<PlayerSession[]>;
  getPlayerSessionsByOrganization(organizationId: string): Promise<PlayerSession[]>;
  createPlayerSession(session: InsertPlayerSession): Promise<PlayerSession>;
  updatePlayerSession(displayId: string, updates: Partial<PlayerSession>): Promise<PlayerSession | undefined>;
  deletePlayerSession(displayId: string): Promise<boolean>;
  updateHeartbeat(displayId: string): Promise<boolean>;
  
  getPlayerCapabilities(displayId: string): Promise<PlayerCapabilities | undefined>;
  createPlayerCapabilities(capabilities: InsertPlayerCapabilities): Promise<PlayerCapabilities>;
  updatePlayerCapabilities(displayId: string, updates: Partial<PlayerCapabilities>): Promise<PlayerCapabilities | undefined>;
  
  getSchedulingRule(id: string, organizationId: string): Promise<SchedulingRule | undefined>;
  getAllSchedulingRules(organizationId: string): Promise<SchedulingRule[]>;
  getSchedulingRulesBySchedule(scheduleId: string, organizationId: string): Promise<SchedulingRule[]>;
  createSchedulingRule(rule: InsertSchedulingRule): Promise<SchedulingRule>;
  updateSchedulingRule(id: string, updates: Partial<SchedulingRule>, organizationId: string): Promise<SchedulingRule | undefined>;
  deleteSchedulingRule(id: string, organizationId: string): Promise<boolean>;
  
  getContentPriority(id: string): Promise<ContentPriority | undefined>;
  getAllContentPriorities(): Promise<ContentPriority[]>;
  getContentPrioritiesByContent(contentId: string): Promise<ContentPriority[]>;
  createContentPriority(priority: InsertContentPriority): Promise<ContentPriority>;
  updateContentPriority(id: string, updates: Partial<ContentPriority>): Promise<ContentPriority | undefined>;
  deleteContentPriority(id: string): Promise<boolean>;
  
  getTransition(id: string): Promise<Transition | undefined>;
  getAllTransitions(): Promise<Transition[]>;
  createTransition(transition: InsertTransition): Promise<Transition>;
  updateTransition(id: string, updates: Partial<Transition>): Promise<Transition | undefined>;
  deleteTransition(id: string): Promise<boolean>;
  
  getSyncGroup(id: string, organizationId: string): Promise<SyncGroup | undefined>;
  getAllSyncGroups(organizationId: string): Promise<SyncGroup[]>;
  getSyncGroupWithMembers(id: string, organizationId: string): Promise<SyncGroupWithMembers | undefined>;
  getAllSyncGroupsWithMembers(organizationId: string): Promise<SyncGroupWithMembers[]>;
  createSyncGroup(group: InsertSyncGroup, organizationId: string): Promise<SyncGroup>;
  updateSyncGroup(id: string, updates: Partial<SyncGroup>, organizationId: string): Promise<SyncGroup | undefined>;
  deleteSyncGroup(id: string, organizationId: string): Promise<boolean>;
  addMemberToSyncGroup(member: InsertSyncGroupMember): Promise<SyncGroupMember>;
  removeMemberFromSyncGroup(memberId: string): Promise<boolean>;
  getSyncGroupMembers(syncGroupId: string): Promise<SyncGroupMember[]>;
  
  getSyncSession(id: string): Promise<SyncSession | undefined>;
  getSyncSessionByGroup(syncGroupId: string): Promise<SyncSession | undefined>;
  getAllSyncSessions(): Promise<SyncSession[]>;
  getAllSyncSessionsWithDetails(): Promise<SyncSessionWithDetails[]>;
  createSyncSession(session: InsertSyncSession): Promise<SyncSession>;
  updateSyncSession(id: string, updates: Partial<SyncSession>): Promise<SyncSession | undefined>;
  deleteSyncSession(id: string): Promise<boolean>;
  
  getDashboardStats(organizationId: string): Promise<DashboardStats>;
  getDisplaysWithGroups(organizationId: string): Promise<DisplayWithGroup[]>;
  
  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<boolean>;
  
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithOrganizations(id: string): Promise<UserWithOrganizations | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Organization Member methods
  getOrganizationMemberById(id: string): Promise<OrganizationMember | undefined>;
  getOrganizationMembersByUser(userId: string): Promise<OrganizationMember[]>;
  getOrganizationMembersByOrganization(organizationId: string): Promise<OrganizationMember[]>;
  getUserRole(userId: string, organizationId: string): Promise<string | undefined>;
  createOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  updateOrganizationMember(id: string, updates: Partial<OrganizationMember>): Promise<OrganizationMember | undefined>;
  deleteOrganizationMember(id: string): Promise<boolean>;
  
  // Session methods
  getSession(id: string): Promise<Session | undefined>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  getSessionsByUser(userId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  deleteSession(id: string): Promise<boolean>;
  deleteSessionsByUser(userId: string): Promise<number>;
  cleanupExpiredSessions(): Promise<number>;
  
  // Team Management methods
  getTeamMembers(organizationId: string): Promise<TeamMember[]>;
  getOrganizationMember(userId: string, organizationId: string): Promise<OrganizationMember | undefined>;
  updateMemberRole(userId: string, organizationId: string, role: string): Promise<OrganizationMember | undefined>;
  removeMember(userId: string, organizationId: string): Promise<boolean>;
  
  // Invitation methods
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(token: string): Promise<Invitation | undefined>;
  getPendingInvitations(organizationId: string): Promise<InvitationWithDetails[]>;
  acceptInvitation(token: string, userId: string): Promise<boolean>;
  revokeInvitation(id: string, organizationId: string): Promise<boolean>;
  cleanupExpiredInvitations(): Promise<number>;
  
  // Audit Log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(organizationId: string, filters?: { userId?: string; action?: string; resourceType?: string; startDate?: Date; endDate?: Date }): Promise<AuditLogWithDetails[]>;
  
  // Advanced Analytics methods (Sprint 4)
  recordDisplayMetric(displayId: string, organizationId: string, status: string, uptime?: number, cpuUsage?: number, memoryUsage?: number, storageUsage?: number): Promise<DisplayMetric>;
  recordContentView(contentId: string, displayId: string, organizationId: string, scheduleId?: string, playlistId?: string, duration?: number): Promise<ContentView>;
  recordScheduleExecution(scheduleId: string, displayId: string, organizationId: string, status: string, errorMessage?: string): Promise<ScheduleExecution>;
  getAdvancedAnalytics(organizationId: string, startDate?: Date, endDate?: Date): Promise<AdvancedAnalytics>;
  
  // Notification methods (Sprint 4)
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  listNotifications(organizationId: string, userId: string, options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]>;
  getUnreadCount(organizationId: string, userId: string): Promise<number>;
  markNotificationAsRead(id: string, organizationId: string, userId: string): Promise<Notification | undefined>;
  markAllAsRead(organizationId: string, userId: string): Promise<number>;
  deleteNotification(id: string, organizationId: string, userId: string): Promise<boolean>;
  
  // Granular Permissions methods (Sprint 4)
  createResourcePermission(insertPermission: InsertResourcePermission): Promise<ResourcePermission>;
  listResourcePermissions(organizationId: string, filters?: { userId?: string; resourceType?: string; resourceId?: string }): Promise<ResourcePermission[]>;
  getUserResourcePermissions(userId: string, organizationId: string, resourceType?: string): Promise<ResourcePermission[]>;
  checkResourcePermission(userId: string, organizationId: string, resourceType: string, resourceId: string, action: string): Promise<boolean>;
  updateResourcePermission(id: string, organizationId: string, updates: UpdateResourcePermission): Promise<ResourcePermission | undefined>;
  deleteResourcePermission(id: string, organizationId: string): Promise<boolean>;

  // Content Templates methods (Sprint 5.1)
  createContentTemplate(insertTemplate: InsertContentTemplate): Promise<ContentTemplate>;
  listContentTemplates(organizationId: string, filters?: { type?: string; isPublic?: boolean }): Promise<ContentTemplate[]>;
  getContentTemplate(id: string, organizationId: string): Promise<ContentTemplate | undefined>;
  updateContentTemplate(id: string, organizationId: string, updates: UpdateContentTemplate): Promise<ContentTemplate | undefined>;
  deleteContentTemplate(id: string, organizationId: string): Promise<boolean>;
  applyTemplateToDisplay(insertApplication: InsertTemplateApplication): Promise<TemplateApplication>;
  getTemplateApplications(organizationId: string, filters?: { templateId?: string; displayId?: string }): Promise<TemplateApplication[]>;

  // Player Releases methods (Sprint 6)
  createPlayerRelease(insertRelease: InsertPlayerRelease): Promise<PlayerRelease>;
  listPlayerReleases(filters?: { platform?: string; isPrerelease?: boolean; isLatest?: boolean }): Promise<PlayerRelease[]>;
  getPlayerRelease(id: string): Promise<PlayerRelease | undefined>;
  getPlayerReleaseByVersion(version: string): Promise<PlayerRelease | undefined>;
  getLatestPlayerRelease(platform: string): Promise<PlayerRelease | undefined>;
  updatePlayerRelease(id: string, updates: UpdatePlayerRelease): Promise<PlayerRelease | undefined>;
  deletePlayerRelease(id: string): Promise<boolean>;
  setLatestRelease(id: string, platform: string): Promise<void>;

  // Bulk Operations methods (Sprint 5.2)
  bulkDeleteDisplays(displayIds: string[], organizationId: string): Promise<number>;
  bulkUpdateDisplays(displayIds: string[], updates: { name?: string; status?: "online" | "offline" | "error" }, organizationId: string): Promise<number>;
  bulkApplyTemplate(displayIds: string[], templateId: string, userId: string, organizationId: string): Promise<number>;
  bulkDeleteContent(contentIds: string[], organizationId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Display methods
  async getDisplay(id: string, organizationId: string): Promise<Display | undefined> {
    const [display] = await db.select().from(displays).where(and(eq(displays.id, id), eq(displays.organizationId, organizationId)));
    return display || undefined;
  }

  async getDisplayById(id: string): Promise<Display | undefined> {
    const [display] = await db.select().from(displays).where(eq(displays.id, id));
    return display || undefined;
  }

  async getAllDisplays(organizationId: string): Promise<Display[]> {
    return await db.select().from(displays).where(eq(displays.organizationId, organizationId));
  }

  async createDisplay(insertDisplay: InsertDisplay, organizationId: string): Promise<Display> {
    const [display] = await db
      .insert(displays)
      .values({ ...insertDisplay, organizationId })
      .returning();
    return display;
  }

  async updateDisplay(id: string, updates: Partial<Display>, organizationId: string): Promise<Display | undefined> {
    const [updated] = await db
      .update(displays)
      .set(updates)
      .where(and(eq(displays.id, id), eq(displays.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteDisplay(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(displays).where(and(eq(displays.id, id), eq(displays.organizationId, organizationId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Content methods
  async getContentItem(id: string, organizationId: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.organizationId, organizationId)));
    return item || undefined;
  }

  async getContentItemById(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item || undefined;
  }

  async getAllContentItems(organizationId: string): Promise<ContentItem[]> {
    return await db.select().from(contentItems).where(eq(contentItems.organizationId, organizationId));
  }

  async createContentItem(insertItem: InsertContentItem, organizationId: string): Promise<ContentItem> {
    const [item] = await db
      .insert(contentItems)
      .values({ ...insertItem, organizationId })
      .returning();
    return item;
  }

  async updateContentItem(id: string, updates: Partial<ContentItem>, organizationId: string): Promise<ContentItem | undefined> {
    const [updated] = await db
      .update(contentItems)
      .set(updates)
      .where(and(eq(contentItems.id, id), eq(contentItems.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteContentItem(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.organizationId, organizationId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Display Group methods
  async getDisplayGroup(id: string, organizationId: string): Promise<DisplayGroup | undefined> {
    const [group] = await db.select().from(displayGroups).where(and(eq(displayGroups.id, id), eq(displayGroups.organizationId, organizationId)));
    return group || undefined;
  }

  async getAllDisplayGroups(organizationId: string): Promise<DisplayGroup[]> {
    return await db.select().from(displayGroups).where(eq(displayGroups.organizationId, organizationId));
  }

  async createDisplayGroup(insertGroup: InsertDisplayGroup, organizationId: string): Promise<DisplayGroup> {
    const [group] = await db
      .insert(displayGroups)
      .values({ ...insertGroup, organizationId })
      .returning();
    return group;
  }

  async updateDisplayGroup(id: string, updates: Partial<DisplayGroup>, organizationId: string): Promise<DisplayGroup | undefined> {
    const [updated] = await db
      .update(displayGroups)
      .set(updates)
      .where(and(eq(displayGroups.id, id), eq(displayGroups.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteDisplayGroup(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(displayGroups).where(and(eq(displayGroups.id, id), eq(displayGroups.organizationId, organizationId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Schedule methods
  async getSchedule(id: string, organizationId: string): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(and(eq(schedules.id, id), eq(schedules.organizationId, organizationId)));
    return schedule || undefined;
  }

  async getAllSchedules(organizationId: string): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.organizationId, organizationId));
  }

  async getSchedulesWithDetails(organizationId: string): Promise<ScheduleWithDetails[]> {
    const allSchedules = await db.select().from(schedules).where(eq(schedules.organizationId, organizationId));
    
    const result: ScheduleWithDetails[] = [];
    
    for (const schedule of allSchedules) {
      let contentName: string | undefined;
      let playlistName: string | undefined;

      // Get content name if contentId is set
      if (schedule.contentId) {
        const [content] = await db
          .select()
          .from(contentItems)
          .where(eq(contentItems.id, schedule.contentId));
        contentName = content?.name || "Unknown Content";
      }

      // Get playlist name if playlistId is set
      if (schedule.playlistId) {
        const [playlist] = await db
          .select()
          .from(playlists)
          .where(eq(playlists.id, schedule.playlistId));
        playlistName = playlist?.name || "Unknown Playlist";
      }
      
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
        contentName,
        playlistName,
        targetName,
      });
    }
    
    return result;
  }

  async createSchedule(insertSchedule: InsertSchedule, organizationId: string): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values({ ...insertSchedule, organizationId })
      .returning();
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<Schedule>, organizationId: string): Promise<Schedule | undefined> {
    const [updated] = await db
      .update(schedules)
      .set(updates)
      .where(and(eq(schedules.id, id), eq(schedules.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteSchedule(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(schedules).where(and(eq(schedules.id, id), eq(schedules.organizationId, organizationId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Stats and aggregations
  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    const result = await db.execute<{
      total_displays: number;
      active_displays: number;
      offline_displays: number;
      total_content: number;
    }>(sql`
      SELECT
        (SELECT COUNT(*)::int FROM ${displays} WHERE organization_id = ${organizationId}) as total_displays,
        (SELECT COUNT(*)::int FROM ${displays} WHERE status = 'online' AND organization_id = ${organizationId}) as active_displays,
        (SELECT COUNT(*)::int FROM ${displays} WHERE status = 'offline' AND organization_id = ${organizationId}) as offline_displays,
        (SELECT COUNT(*)::int FROM ${contentItems} WHERE organization_id = ${organizationId}) as total_content
    `);

    const stats = result.rows[0];

    return {
      totalDisplays: stats?.total_displays || 0,
      activeDisplays: stats?.active_displays || 0,
      offlineDisplays: stats?.offline_displays || 0,
      totalContent: stats?.total_content || 0,
    };
  }

  async getDisplaysWithGroups(organizationId: string): Promise<DisplayWithGroup[]> {
    const allDisplays = await db.select().from(displays).where(eq(displays.organizationId, organizationId));
    
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

  // Playlist methods
  async getPlaylist(id: string, organizationId: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(and(eq(playlists.id, id), eq(playlists.organizationId, organizationId)));
    return playlist || undefined;
  }

  async getPlaylistById(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getAllPlaylists(organizationId: string): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.organizationId, organizationId));
  }

  async getPlaylistWithItems(id: string, organizationId: string): Promise<PlaylistWithItems | undefined> {
    const [playlist] = await db.select().from(playlists).where(and(eq(playlists.id, id), eq(playlists.organizationId, organizationId)));
    if (!playlist) return undefined;

    const items = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, id));

    const itemsWithNames = [];
    for (const item of items) {
      const [content] = await db
        .select()
        .from(contentItems)
        .where(eq(contentItems.id, item.contentId));
      
      itemsWithNames.push({
        ...item,
        contentName: content?.name || "Unknown Content",
      });
    }

    return {
      ...playlist,
      items: itemsWithNames,
    };
  }

  async getAllPlaylistsWithItems(organizationId: string): Promise<PlaylistWithItems[]> {
    const allPlaylists = await db.select().from(playlists).where(eq(playlists.organizationId, organizationId));
    
    const result: PlaylistWithItems[] = [];
    for (const playlist of allPlaylists) {
      const items = await db
        .select()
        .from(playlistItems)
        .where(eq(playlistItems.playlistId, playlist.id));

      const itemsWithNames = [];
      for (const item of items) {
        const [content] = await db
          .select()
          .from(contentItems)
          .where(eq(contentItems.id, item.contentId));
        
        itemsWithNames.push({
          ...item,
          contentName: content?.name || "Unknown Content",
        });
      }

      result.push({
        ...playlist,
        items: itemsWithNames,
      });
    }

    return result;
  }

  async createPlaylist(insertPlaylist: InsertPlaylist, organizationId: string): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values({ ...insertPlaylist, organizationId })
      .returning();
    return playlist;
  }

  async updatePlaylist(id: string, updates: Partial<Playlist>, organizationId: string): Promise<Playlist | undefined> {
    const [updated] = await db
      .update(playlists)
      .set(updates)
      .where(and(eq(playlists.id, id), eq(playlists.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deletePlaylist(id: string, organizationId: string): Promise<boolean> {
    await db.delete(playlistItems).where(eq(playlistItems.playlistId, id));
    const result = await db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.organizationId, organizationId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async addItemToPlaylist(insertItem: InsertPlaylistItem): Promise<PlaylistItem> {
    const [item] = await db
      .insert(playlistItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async removeItemFromPlaylist(itemId: string): Promise<boolean> {
    const result = await db.delete(playlistItems).where(eq(playlistItems.id, itemId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderPlaylistItems(playlistId: string, itemIds: string[]): Promise<void> {
    // Update order for each item
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(playlistItems)
        .set({ order: i })
        .where(
          and(
            eq(playlistItems.id, itemIds[i]),
            eq(playlistItems.playlistId, playlistId)
          )
        );
    }
  }

  // Radio Stream methods
  async getRadioStream(id: string): Promise<RadioStream | undefined> {
    const [stream] = await db.select().from(radioStreams).where(eq(radioStreams.id, id));
    return stream || undefined;
  }

  async getRadioStreamsByPlaylist(playlistId: string): Promise<RadioStream[]> {
    return await db.select().from(radioStreams).where(eq(radioStreams.playlistId, playlistId));
  }

  async getAllRadioStreams(): Promise<RadioStream[]> {
    return await db.select().from(radioStreams);
  }

  async createRadioStream(insertRadioStream: InsertRadioStream): Promise<RadioStream> {
    const [stream] = await db
      .insert(radioStreams)
      .values(insertRadioStream)
      .returning();
    return stream;
  }

  async updateRadioStream(id: string, updates: Partial<RadioStream>): Promise<RadioStream | undefined> {
    const [updated] = await db
      .update(radioStreams)
      .set(updates)
      .where(eq(radioStreams.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRadioStream(id: string): Promise<boolean> {
    const result = await db.delete(radioStreams).where(eq(radioStreams.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pairing Token methods
  async getPairingToken(token: string): Promise<PairingToken | undefined> {
    const [pairingToken] = await db
      .select()
      .from(pairingTokens)
      .where(eq(pairingTokens.token, token));
    return pairingToken || undefined;
  }

  async getPairingTokenById(id: string): Promise<PairingToken | undefined> {
    const [pairingToken] = await db
      .select()
      .from(pairingTokens)
      .where(eq(pairingTokens.id, id));
    return pairingToken || undefined;
  }

  async createPairingToken(insertToken: InsertPairingToken): Promise<PairingToken> {
    const [token] = await db
      .insert(pairingTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async usePairingToken(token: string, displayId: string): Promise<boolean> {
    const result = await db
      .update(pairingTokens)
      .set({ used: true, displayId })
      .where(
        and(
          eq(pairingTokens.token, token),
          eq(pairingTokens.used, false),
          gt(pairingTokens.expiresAt, new Date())
        )
      )
      .returning();
    return result.length > 0;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await db
      .delete(pairingTokens)
      .where(
        and(
          eq(pairingTokens.used, false),
          sql`${pairingTokens.expiresAt} < NOW()`
        )
      );
    return result.rowCount || 0;
  }

  // Player Session methods
  async getPlayerSession(displayId: string): Promise<PlayerSession | undefined> {
    const [session] = await db
      .select()
      .from(playerSessions)
      .where(eq(playerSessions.displayId, displayId));
    return session || undefined;
  }

  async getAllPlayerSessions(): Promise<PlayerSession[]> {
    return await db.select().from(playerSessions);
  }

  async getPlayerSessionsByOrganization(organizationId: string): Promise<PlayerSession[]> {
    return await db
      .select({
        id: playerSessions.id,
        displayId: playerSessions.displayId,
        playerVersion: playerSessions.playerVersion,
        ipAddress: playerSessions.ipAddress,
        userAgent: playerSessions.userAgent,
        connectedAt: playerSessions.connectedAt,
        lastHeartbeat: playerSessions.lastHeartbeat,
        currentContentId: playerSessions.currentContentId,
        playbackStatus: playerSessions.playbackStatus,
      })
      .from(playerSessions)
      .innerJoin(displays, eq(playerSessions.displayId, displays.id))
      .where(eq(displays.organizationId, organizationId));
  }

  async createPlayerSession(insertSession: InsertPlayerSession): Promise<PlayerSession> {
    const [session] = await db
      .insert(playerSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updatePlayerSession(
    displayId: string,
    updates: Partial<PlayerSession>
  ): Promise<PlayerSession | undefined> {
    const [updated] = await db
      .update(playerSessions)
      .set(updates)
      .where(eq(playerSessions.displayId, displayId))
      .returning();
    return updated || undefined;
  }

  async deletePlayerSession(displayId: string): Promise<boolean> {
    const result = await db
      .delete(playerSessions)
      .where(eq(playerSessions.displayId, displayId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateHeartbeat(displayId: string): Promise<boolean> {
    const result = await db
      .update(playerSessions)
      .set({ lastHeartbeat: new Date() })
      .where(eq(playerSessions.displayId, displayId))
      .returning();
    return result.length > 0;
  }

  // Player Capabilities methods
  async getPlayerCapabilities(displayId: string): Promise<PlayerCapabilities | undefined> {
    const [capabilities] = await db
      .select()
      .from(playerCapabilities)
      .where(eq(playerCapabilities.displayId, displayId));
    return capabilities || undefined;
  }

  async createPlayerCapabilities(
    insertCapabilities: InsertPlayerCapabilities
  ): Promise<PlayerCapabilities> {
    const [capabilities] = await db
      .insert(playerCapabilities)
      .values(insertCapabilities)
      .returning();
    return capabilities;
  }

  async updatePlayerCapabilities(
    displayId: string,
    updates: Partial<PlayerCapabilities>
  ): Promise<PlayerCapabilities | undefined> {
    const [updated] = await db
      .update(playerCapabilities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playerCapabilities.displayId, displayId))
      .returning();
    return updated || undefined;
  }

  // Scheduling Rule methods
  async getSchedulingRule(id: string, organizationId: string): Promise<SchedulingRule | undefined> {
    const [rule] = await db
      .select()
      .from(schedulingRules)
      .where(and(
        eq(schedulingRules.id, id),
        eq(schedulingRules.organizationId, organizationId)
      ));
    return rule || undefined;
  }

  async getAllSchedulingRules(organizationId: string): Promise<SchedulingRule[]> {
    return await db
      .select()
      .from(schedulingRules)
      .where(eq(schedulingRules.organizationId, organizationId));
  }

  async getSchedulingRulesBySchedule(scheduleId: string, organizationId: string): Promise<SchedulingRule[]> {
    return await db
      .select()
      .from(schedulingRules)
      .where(and(
        eq(schedulingRules.scheduleId, scheduleId),
        eq(schedulingRules.organizationId, organizationId)
      ));
  }

  async createSchedulingRule(insertRule: InsertSchedulingRule): Promise<SchedulingRule> {
    const [rule] = await db
      .insert(schedulingRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async updateSchedulingRule(
    id: string,
    updates: Partial<SchedulingRule>,
    organizationId: string
  ): Promise<SchedulingRule | undefined> {
    const [updated] = await db
      .update(schedulingRules)
      .set(updates)
      .where(and(
        eq(schedulingRules.id, id),
        eq(schedulingRules.organizationId, organizationId)
      ))
      .returning();
    return updated || undefined;
  }

  async deleteSchedulingRule(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(schedulingRules)
      .where(and(
        eq(schedulingRules.id, id),
        eq(schedulingRules.organizationId, organizationId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Content Priority methods
  async getContentPriority(id: string): Promise<ContentPriority | undefined> {
    const [priority] = await db
      .select()
      .from(contentPriority)
      .where(eq(contentPriority.id, id));
    return priority || undefined;
  }

  async getAllContentPriorities(): Promise<ContentPriority[]> {
    return await db.select().from(contentPriority);
  }

  async getContentPrioritiesByContent(contentId: string): Promise<ContentPriority[]> {
    return await db
      .select()
      .from(contentPriority)
      .where(eq(contentPriority.contentId, contentId));
  }

  async createContentPriority(insertPriority: InsertContentPriority): Promise<ContentPriority> {
    const [priority] = await db
      .insert(contentPriority)
      .values(insertPriority)
      .returning();
    return priority;
  }

  async updateContentPriority(
    id: string,
    updates: Partial<ContentPriority>
  ): Promise<ContentPriority | undefined> {
    const [updated] = await db
      .update(contentPriority)
      .set(updates)
      .where(eq(contentPriority.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContentPriority(id: string): Promise<boolean> {
    const result = await db
      .delete(contentPriority)
      .where(eq(contentPriority.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Transition methods
  async getTransition(id: string): Promise<Transition | undefined> {
    const [transition] = await db
      .select()
      .from(transitions)
      .where(eq(transitions.id, id));
    return transition || undefined;
  }

  async getAllTransitions(): Promise<Transition[]> {
    return await db.select().from(transitions);
  }

  async createTransition(insertTransition: InsertTransition): Promise<Transition> {
    const [transition] = await db
      .insert(transitions)
      .values(insertTransition)
      .returning();
    return transition;
  }

  async updateTransition(
    id: string,
    updates: Partial<Transition>
  ): Promise<Transition | undefined> {
    const [updated] = await db
      .update(transitions)
      .set(updates)
      .where(eq(transitions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTransition(id: string): Promise<boolean> {
    const result = await db
      .delete(transitions)
      .where(eq(transitions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Sync Group methods
  async getSyncGroup(id: string, organizationId: string): Promise<SyncGroup | undefined> {
    const [group] = await db
      .select()
      .from(syncGroups)
      .where(and(eq(syncGroups.id, id), eq(syncGroups.organizationId, organizationId)));
    return group || undefined;
  }

  async getAllSyncGroups(organizationId: string): Promise<SyncGroup[]> {
    return await db.select().from(syncGroups).where(eq(syncGroups.organizationId, organizationId));
  }

  async getSyncGroupWithMembers(id: string, organizationId: string): Promise<SyncGroupWithMembers | undefined> {
    const group = await this.getSyncGroup(id, organizationId);
    if (!group) return undefined;

    const members = await db
      .select({
        id: syncGroupMembers.id,
        syncGroupId: syncGroupMembers.syncGroupId,
        displayId: syncGroupMembers.displayId,
        joinedAt: syncGroupMembers.joinedAt,
        displayName: displays.name,
      })
      .from(syncGroupMembers)
      .leftJoin(displays, eq(syncGroupMembers.displayId, displays.id))
      .where(eq(syncGroupMembers.syncGroupId, id));

    return {
      ...group,
      members: members.map((m) => ({
        id: m.id,
        syncGroupId: m.syncGroupId,
        displayId: m.displayId,
        joinedAt: m.joinedAt,
        displayName: m.displayName || "Unknown",
      })),
      memberCount: members.length,
    };
  }

  async getAllSyncGroupsWithMembers(organizationId: string): Promise<SyncGroupWithMembers[]> {
    const groups = await this.getAllSyncGroups(organizationId);
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const withMembers = await this.getSyncGroupWithMembers(group.id, organizationId);
        return withMembers!;
      })
    );
    return groupsWithMembers;
  }

  async createSyncGroup(insertGroup: InsertSyncGroup, organizationId: string): Promise<SyncGroup> {
    const [group] = await db
      .insert(syncGroups)
      .values({ ...insertGroup, organizationId })
      .returning();
    return group;
  }

  async updateSyncGroup(
    id: string,
    updates: Partial<SyncGroup>,
    organizationId: string
  ): Promise<SyncGroup | undefined> {
    const [updated] = await db
      .update(syncGroups)
      .set(updates)
      .where(and(eq(syncGroups.id, id), eq(syncGroups.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async deleteSyncGroup(id: string, organizationId: string): Promise<boolean> {
    await db.delete(syncGroupMembers).where(eq(syncGroupMembers.syncGroupId, id));
    await db.delete(syncSessions).where(eq(syncSessions.syncGroupId, id));
    const result = await db.delete(syncGroups).where(and(eq(syncGroups.id, id), eq(syncGroups.organizationId, organizationId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async addMemberToSyncGroup(insertMember: InsertSyncGroupMember): Promise<SyncGroupMember> {
    const [member] = await db
      .insert(syncGroupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async removeMemberFromSyncGroup(memberId: string): Promise<boolean> {
    const result = await db
      .delete(syncGroupMembers)
      .where(eq(syncGroupMembers.id, memberId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSyncGroupMembers(syncGroupId: string): Promise<SyncGroupMember[]> {
    return await db
      .select()
      .from(syncGroupMembers)
      .where(eq(syncGroupMembers.syncGroupId, syncGroupId));
  }

  // Sync Session methods
  async getSyncSession(id: string): Promise<SyncSession | undefined> {
    const [session] = await db
      .select()
      .from(syncSessions)
      .where(eq(syncSessions.id, id));
    return session || undefined;
  }

  async getSyncSessionByGroup(syncGroupId: string): Promise<SyncSession | undefined> {
    const [session] = await db
      .select()
      .from(syncSessions)
      .where(eq(syncSessions.syncGroupId, syncGroupId));
    return session || undefined;
  }

  async getAllSyncSessions(): Promise<SyncSession[]> {
    return await db.select().from(syncSessions);
  }

  async getAllSyncSessionsWithDetails(): Promise<SyncSessionWithDetails[]> {
    const sessions = await db
      .select({
        id: syncSessions.id,
        syncGroupId: syncSessions.syncGroupId,
        contentId: syncSessions.contentId,
        playlistId: syncSessions.playlistId,
        status: syncSessions.status,
        currentPosition: syncSessions.currentPosition,
        startedAt: syncSessions.startedAt,
        updatedAt: syncSessions.updatedAt,
        syncGroupName: syncGroups.name,
        contentName: contentItems.name,
        playlistName: playlists.name,
      })
      .from(syncSessions)
      .leftJoin(syncGroups, eq(syncSessions.syncGroupId, syncGroups.id))
      .leftJoin(contentItems, eq(syncSessions.contentId, contentItems.id))
      .leftJoin(playlists, eq(syncSessions.playlistId, playlists.id));

    return sessions.map((s) => ({
      id: s.id,
      syncGroupId: s.syncGroupId,
      contentId: s.contentId,
      playlistId: s.playlistId,
      status: s.status,
      currentPosition: s.currentPosition,
      startedAt: s.startedAt,
      updatedAt: s.updatedAt,
      syncGroupName: s.syncGroupName || "Unknown",
      contentName: s.contentName ?? undefined,
      playlistName: s.playlistName ?? undefined,
    }));
  }

  async createSyncSession(insertSession: InsertSyncSession): Promise<SyncSession> {
    const [session] = await db
      .insert(syncSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateSyncSession(
    id: string,
    updates: Partial<SyncSession>
  ): Promise<SyncSession | undefined> {
    const [updated] = await db
      .update(syncSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(syncSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSyncSession(id: string): Promise<boolean> {
    const result = await db
      .delete(syncSessions)
      .where(eq(syncSessions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug));
    return org || undefined;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(insertOrg)
      .returning();
    return org;
  }

  async updateOrganization(
    id: string,
    updates: Partial<Organization>
  ): Promise<Organization | undefined> {
    const [updated] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const result = await db
      .delete(organizations)
      .where(eq(organizations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async getUserWithOrganizations(id: string): Promise<UserWithOrganizations | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const members = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        invitedBy: organizationMembers.invitedBy,
        organizationName: organizations.name,
      })
      .from(organizationMembers)
      .leftJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, id));

    return {
      ...user,
      organizations: members.map(m => ({
        id: m.id,
        userId: m.userId,
        organizationId: m.organizationId,
        role: m.role,
        joinedAt: m.joinedAt,
        invitedBy: m.invitedBy,
        organizationName: m.organizationName || "Unknown",
      })),
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Organization Member methods
  async getOrganizationMemberById(id: string): Promise<OrganizationMember | undefined> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, id));
    return member || undefined;
  }

  async getOrganizationMembersByUser(userId: string): Promise<OrganizationMember[]> {
    return await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId));
  }

  async getOrganizationMembersByOrganization(organizationId: string): Promise<OrganizationMember[]> {
    return await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
  }

  async getUserRole(userId: string, organizationId: string): Promise<string | undefined> {
    const [member] = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    return member?.role;
  }

  async createOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    const [member] = await db
      .insert(organizationMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateOrganizationMember(
    id: string,
    updates: Partial<OrganizationMember>
  ): Promise<OrganizationMember | undefined> {
    const [updated] = await db
      .update(organizationMembers)
      .set(updates)
      .where(eq(organizationMembers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrganizationMember(id: string): Promise<boolean> {
    const result = await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));
    return session || undefined;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      );
    return session || undefined;
  }

  async getSessionsByUser(userId: string): Promise<Session[]> {
    return await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteSessionsByUser(userId: string): Promise<number> {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));
    return result.rowCount || 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .delete(sessions)
      .where(sql`${sessions.expiresAt} < NOW()`);
    return result.rowCount || 0;
  }

  // Team Management methods
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    const members = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        invitedBy: organizationMembers.invitedBy,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        inviterFirstName: sql<string | null>`inviter.first_name`.as('inviterFirstName'),
        inviterLastName: sql<string | null>`inviter.last_name`.as('inviterLastName'),
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .leftJoin(
        sql`${users} AS inviter`,
        sql`${organizationMembers.invitedBy} = inviter.id`
      )
      .where(eq(organizationMembers.organizationId, organizationId));

    return members.map(m => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
      joinedAt: m.joinedAt,
      invitedBy: m.invitedBy,
      userEmail: m.userEmail,
      userFirstName: m.userFirstName,
      userLastName: m.userLastName,
      inviterName: m.inviterFirstName && m.inviterLastName 
        ? `${m.inviterFirstName} ${m.inviterLastName}` 
        : undefined,
    }));
  }

  async getOrganizationMember(userId: string, organizationId: string): Promise<OrganizationMember | undefined> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    return member || undefined;
  }

  async updateMemberRole(userId: string, organizationId: string, role: string): Promise<OrganizationMember | undefined> {
    const [updated] = await db
      .update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .returning();
    return updated || undefined;
  }

  async removeMember(userId: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Invitation methods
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const [invitation] = await db
      .insert(invitations)
      .values(insertInvitation)
      .returning();
    return invitation;
  }

  async getInvitation(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));
    return invitation || undefined;
  }

  async getPendingInvitations(organizationId: string): Promise<InvitationWithDetails[]> {
    const invites = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        organizationId: invitations.organizationId,
        role: invitations.role,
        token: invitations.token,
        invitedBy: invitations.invitedBy,
        expiresAt: invitations.expiresAt,
        accepted: invitations.accepted,
        acceptedAt: invitations.acceptedAt,
        createdAt: invitations.createdAt,
        inviterFirstName: users.firstName,
        inviterLastName: users.lastName,
        organizationName: organizations.name,
      })
      .from(invitations)
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
      .where(
        and(
          eq(invitations.organizationId, organizationId),
          eq(invitations.accepted, false)
        )
      );

    return invites.map(i => ({
      id: i.id,
      email: i.email,
      organizationId: i.organizationId,
      role: i.role,
      token: i.token,
      invitedBy: i.invitedBy,
      expiresAt: i.expiresAt,
      accepted: i.accepted,
      acceptedAt: i.acceptedAt,
      createdAt: i.createdAt,
      inviterFirstName: i.inviterFirstName,
      inviterLastName: i.inviterLastName,
      organizationName: i.organizationName,
    }));
  }

  async acceptInvitation(token: string, userId: string): Promise<boolean> {
    const invitation = await this.getInvitation(token);
    if (!invitation || invitation.accepted || invitation.expiresAt < new Date()) {
      return false;
    }

    await db
      .update(invitations)
      .set({ 
        accepted: true, 
        acceptedAt: new Date() 
      })
      .where(eq(invitations.token, token));

    await this.createOrganizationMember({
      userId,
      organizationId: invitation.organizationId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    return true;
  }

  async revokeInvitation(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(invitations)
      .where(
        and(
          eq(invitations.id, id),
          eq(invitations.organizationId, organizationId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async cleanupExpiredInvitations(): Promise<number> {
    const result = await db
      .delete(invitations)
      .where(lt(invitations.expiresAt, new Date()));
    return result.rowCount || 0;
  }

  // Audit Log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAuditLogs(
    organizationId: string,
    filters?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditLogWithDetails[]> {
    const conditions = [eq(auditLogs.organizationId, organizationId)];

    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        organizationId: auditLogs.organizationId,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(sql`${auditLogs.createdAt} DESC`);

    return logs.map(log => ({
      id: log.id,
      organizationId: log.organizationId,
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      userFirstName: log.userFirstName,
      userLastName: log.userLastName,
      userEmail: log.userEmail,
    }));
  }

  // API Keys & Webhooks methods (Sprint 4)
  async createApiKey(
    organizationId: string,
    userId: string,
    name: string,
    expiresAt?: Date
  ): Promise<ApiKey> {
    const key = `evo_${crypto.randomUUID().replace(/-/g, '')}`;
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        organizationId,
        name,
        key,
        createdBy: userId,
        expiresAt,
      })
      .returning();
    return apiKey;
  }

  async listApiKeys(organizationId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, organizationId))
      .orderBy(sql`${apiKeys.createdAt} DESC`);
  }

  async revokeApiKey(id: string, organizationId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ revoked: true, revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId)));
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.key, key),
        eq(apiKeys.revoked, false)
      ))
      .limit(1);

    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    return apiKey;
  }

  async createWebhook(
    organizationId: string,
    userId: string,
    name: string,
    url: string,
    events: string[]
  ): Promise<Webhook> {
    const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
    const [webhook] = await db
      .insert(webhooks)
      .values({
        organizationId,
        name,
        url,
        secret,
        events,
        createdBy: userId,
      })
      .returning();
    return webhook;
  }

  async listWebhooks(organizationId: string): Promise<Webhook[]> {
    return await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId))
      .orderBy(sql`${webhooks.createdAt} DESC`);
  }

  async getWebhookById(id: string, organizationId: string): Promise<Webhook | null> {
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId)))
      .limit(1);
    return webhook || null;
  }

  async updateWebhook(
    id: string,
    organizationId: string,
    updates: { name?: string; url?: string; events?: string[]; active?: boolean }
  ): Promise<Webhook | null> {
    const [webhook] = await db
      .update(webhooks)
      .set(updates)
      .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId)))
      .returning();
    return webhook || null;
  }

  async deleteWebhook(id: string, organizationId: string): Promise<void> {
    await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId)));
  }

  async createWebhookEvent(
    webhookId: string,
    organizationId: string,
    eventType: string,
    payload: object
  ): Promise<WebhookEvent> {
    const [event] = await db
      .insert(webhookEvents)
      .values({
        webhookId,
        organizationId,
        eventType,
        payload: JSON.stringify(payload),
        status: 'pending',
      })
      .returning();
    return event;
  }

  async listWebhookEvents(
    webhookId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(and(
        eq(webhookEvents.webhookId, webhookId),
        eq(webhookEvents.organizationId, organizationId)
      ))
      .orderBy(sql`${webhookEvents.createdAt} DESC`)
      .limit(limit);
  }

  async updateWebhookEventStatus(
    id: string,
    status: string,
    responseStatus?: number,
    responseBody?: string
  ): Promise<void> {
    await db
      .update(webhookEvents)
      .set({
        status,
        lastAttemptAt: new Date(),
        attempts: sql`${webhookEvents.attempts} + 1`,
        responseStatus,
        responseBody,
      })
      .where(eq(webhookEvents.id, id));
  }

  async triggerWebhookEvent(eventType: string, organizationId: string, payload: object): Promise<void> {
    // Find all active webhooks subscribed to this event
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.active, true),
        sql`${eventType} = ANY(${webhooks.events})`
      ));

    // Create webhook events for each subscribed webhook
    for (const webhook of activeWebhooks) {
      const event = await this.createWebhookEvent(webhook.id, organizationId, eventType, payload);

      // Send webhook asynchronously (fire and forget)
      this.sendWebhook(webhook, event).catch(err => {
        console.error(`Failed to send webhook ${webhook.id}:`, err);
      });
    }
  }

  async sendWebhook(webhook: Webhook, event: WebhookEvent): Promise<void> {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': webhook.secret,
          'X-Event-Type': event.eventType,
        },
        body: event.payload,
      });

      await this.updateWebhookEventStatus(
        event.id,
        response.ok ? 'sent' : 'failed',
        response.status,
        await response.text().catch(() => undefined)
      );
    } catch (error) {
      await this.updateWebhookEventStatus(
        event.id,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Advanced Analytics methods (Sprint 4)
  async recordDisplayMetric(
    displayId: string,
    organizationId: string,
    status: string,
    uptime?: number,
    cpuUsage?: number,
    memoryUsage?: number,
    storageUsage?: number
  ): Promise<DisplayMetric> {
    const [metric] = await db
      .insert(displayMetrics)
      .values({
        displayId,
        organizationId,
        status,
        uptime,
        cpuUsage,
        memoryUsage,
        storageUsage,
      })
      .returning();
    return metric;
  }

  async recordContentView(
    contentId: string,
    displayId: string,
    organizationId: string,
    scheduleId?: string,
    playlistId?: string,
    duration?: number
  ): Promise<ContentView> {
    const [view] = await db
      .insert(contentViews)
      .values({
        contentId,
        displayId,
        organizationId,
        scheduleId,
        playlistId,
        duration,
      })
      .returning();
    return view;
  }

  async recordScheduleExecution(
    scheduleId: string,
    displayId: string,
    organizationId: string,
    status: string,
    errorMessage?: string
  ): Promise<ScheduleExecution> {
    const [execution] = await db
      .insert(scheduleExecutions)
      .values({
        scheduleId,
        displayId,
        organizationId,
        status,
        errorMessage,
      })
      .returning();
    return execution;
  }

  async getAdvancedAnalytics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AdvancedAnalytics> {
    const dateConditions = [];
    if (startDate) {
      dateConditions.push(sql`${displayMetrics.timestamp} >= ${startDate}`);
    }
    if (endDate) {
      dateConditions.push(sql`${displayMetrics.timestamp} <= ${endDate}`);
    }

    // Display Uptime Calculation
    const displayUptimeQuery = await db.execute<{
      display_id: string;
      display_name: string;
      online_count: number;
      offline_count: number;
      total_count: number;
    }>(sql`
      SELECT 
        dm.display_id,
        d.name as display_name,
        COUNT(CASE WHEN dm.status = 'online' THEN 1 END)::int as online_count,
        COUNT(CASE WHEN dm.status = 'offline' THEN 1 END)::int as offline_count,
        COUNT(*)::int as total_count
      FROM ${displayMetrics} dm
      JOIN ${displays} d ON dm.display_id = d.id
      WHERE dm.organization_id = ${organizationId}
      ${startDate ? sql`AND dm.timestamp >= ${startDate}` : sql``}
      ${endDate ? sql`AND dm.timestamp <= ${endDate}` : sql``}
      GROUP BY dm.display_id, d.name
      ORDER BY d.name
    `);

    const displayUptime = displayUptimeQuery.rows.map(row => ({
      displayId: row.display_id,
      displayName: row.display_name,
      uptimePercentage: row.total_count > 0 ? (row.online_count / row.total_count) * 100 : 0,
      totalOnlineTime: row.online_count,
      totalOfflineTime: row.offline_count,
    }));

    // Content Popularity
    const contentPopularityQuery = await db.execute<{
      content_id: string;
      content_name: string;
      view_count: number;
      total_view_time: number;
    }>(sql`
      SELECT 
        cv.content_id,
        c.name as content_name,
        COUNT(*)::int as view_count,
        COALESCE(SUM(cv.duration), 0)::int as total_view_time
      FROM ${contentViews} cv
      JOIN ${contentItems} c ON cv.content_id = c.id
      WHERE cv.organization_id = ${organizationId}
      ${startDate ? sql`AND cv.viewed_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND cv.viewed_at <= ${endDate}` : sql``}
      GROUP BY cv.content_id, c.name
      ORDER BY view_count DESC
      LIMIT 20
    `);

    const contentPopularity = contentPopularityQuery.rows.map(row => ({
      contentId: row.content_id,
      contentName: row.content_name,
      viewCount: row.view_count,
      totalViewTime: row.total_view_time,
    }));

    // Schedule Performance
    const schedulePerformanceQuery = await db.execute<{
      schedule_id: string;
      schedule_name: string;
      success_count: number;
      failed_count: number;
      total_count: number;
    }>(sql`
      SELECT 
        se.schedule_id,
        s.name as schedule_name,
        COUNT(CASE WHEN se.status = 'success' THEN 1 END)::int as success_count,
        COUNT(CASE WHEN se.status = 'failed' THEN 1 END)::int as failed_count,
        COUNT(*)::int as total_count
      FROM ${scheduleExecutions} se
      JOIN ${schedules} s ON se.schedule_id = s.id
      WHERE se.organization_id = ${organizationId}
      ${startDate ? sql`AND se.executed_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND se.executed_at <= ${endDate}` : sql``}
      GROUP BY se.schedule_id, s.name
      ORDER BY s.name
    `);

    const schedulePerformance = schedulePerformanceQuery.rows.map(row => ({
      scheduleId: row.schedule_id,
      scheduleName: row.schedule_name,
      successCount: row.success_count,
      failedCount: row.failed_count,
      successRate: row.total_count > 0 ? (row.success_count / row.total_count) * 100 : 0,
    }));

    // Time-series Metrics (hourly aggregation)
    const timeSeriesQuery = await db.execute<{
      hour_timestamp: string;
      online_displays: number;
      offline_displays: number;
      total_views: number;
    }>(sql`
      SELECT 
        date_trunc('hour', COALESCE(dm.timestamp, cv.viewed_at)) as hour_timestamp,
        COUNT(DISTINCT CASE WHEN dm.status = 'online' THEN dm.display_id END)::int as online_displays,
        COUNT(DISTINCT CASE WHEN dm.status = 'offline' THEN dm.display_id END)::int as offline_displays,
        COUNT(cv.id)::int as total_views
      FROM ${displayMetrics} dm
      FULL OUTER JOIN ${contentViews} cv ON date_trunc('hour', dm.timestamp) = date_trunc('hour', cv.viewed_at)
        AND dm.organization_id = cv.organization_id
      WHERE COALESCE(dm.organization_id, cv.organization_id) = ${organizationId}
      ${startDate ? sql`AND COALESCE(dm.timestamp, cv.viewed_at) >= ${startDate}` : sql``}
      ${endDate ? sql`AND COALESCE(dm.timestamp, cv.viewed_at) <= ${endDate}` : sql``}
      GROUP BY hour_timestamp
      ORDER BY hour_timestamp DESC
      LIMIT 168
    `);

    const timeSeriesMetrics = timeSeriesQuery.rows.map(row => ({
      timestamp: row.hour_timestamp,
      onlineDisplays: row.online_displays,
      offlineDisplays: row.offline_displays,
      totalViews: row.total_views,
    }));

    return {
      displayUptime,
      contentPopularity,
      schedulePerformance,
      timeSeriesMetrics,
    };
  }

  // Notification methods (Sprint 4)
  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...insertNotification,
        data: insertNotification.data ? JSON.stringify(insertNotification.data) : null,
      })
      .returning();
    return notification;
  }

  async listNotifications(
    organizationId: string,
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<Notification[]> {
    const conditions = [
      eq(notifications.organizationId, organizationId),
      eq(notifications.userId, userId),
    ];

    if (options?.unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    const baseQuery = db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    if (options?.limit) {
      return await baseQuery.limit(options.limit);
    }

    return await baseQuery;
  }

  async getUnreadCount(organizationId: string, userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    return notification;
  }

  async markAllAsRead(organizationId: string, userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      )
      .returning();
    return result.length;
  }

  async deleteNotification(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Granular Permissions methods (Sprint 4 Feature 5)
  async createResourcePermission(
    insertPermission: InsertResourcePermission
  ): Promise<ResourcePermission> {
    const [permission] = await db
      .insert(resourcePermissions)
      .values(insertPermission)
      .returning();
    return permission;
  }

  async listResourcePermissions(
    organizationId: string,
    filters?: { userId?: string; resourceType?: string; resourceId?: string }
  ): Promise<ResourcePermission[]> {
    const conditions = [eq(resourcePermissions.organizationId, organizationId)];

    if (filters?.userId) {
      conditions.push(eq(resourcePermissions.userId, filters.userId));
    }
    if (filters?.resourceType) {
      conditions.push(eq(resourcePermissions.resourceType, filters.resourceType));
    }
    if (filters?.resourceId) {
      conditions.push(eq(resourcePermissions.resourceId, filters.resourceId));
    }

    return await db
      .select()
      .from(resourcePermissions)
      .where(and(...conditions));
  }

  async getUserResourcePermissions(
    userId: string,
    organizationId: string,
    resourceType?: string
  ): Promise<ResourcePermission[]> {
    const conditions = [
      eq(resourcePermissions.userId, userId),
      eq(resourcePermissions.organizationId, organizationId),
    ];

    if (resourceType) {
      conditions.push(eq(resourcePermissions.resourceType, resourceType));
    }

    return await db
      .select()
      .from(resourcePermissions)
      .where(and(...conditions));
  }

  async checkResourcePermission(
    userId: string,
    organizationId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    const permissions = await db
      .select()
      .from(resourcePermissions)
      .where(
        and(
          eq(resourcePermissions.userId, userId),
          eq(resourcePermissions.organizationId, organizationId),
          eq(resourcePermissions.resourceType, resourceType),
          eq(resourcePermissions.resourceId, resourceId)
        )
      );

    if (permissions.length === 0) {
      return false;
    }

    return permissions.some(p => p.actions.includes(action));
  }

  async updateResourcePermission(
    id: string,
    organizationId: string,
    updates: UpdateResourcePermission
  ): Promise<ResourcePermission | undefined> {
    const [updated] = await db
      .update(resourcePermissions)
      .set(updates)
      .where(
        and(
          eq(resourcePermissions.id, id),
          eq(resourcePermissions.organizationId, organizationId)
        )
      )
      .returning();
    return updated || undefined;
  }

  async deleteResourcePermission(
    id: string,
    organizationId: string
  ): Promise<boolean> {
    const result = await db
      .delete(resourcePermissions)
      .where(
        and(
          eq(resourcePermissions.id, id),
          eq(resourcePermissions.organizationId, organizationId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Content Templates methods (Sprint 5.1)
  async createContentTemplate(insertTemplate: InsertContentTemplate): Promise<ContentTemplate> {
    const [template] = await db
      .insert(contentTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async listContentTemplates(
    organizationId: string,
    filters?: { type?: string; isPublic?: boolean }
  ): Promise<ContentTemplate[]> {
    const conditions = [eq(contentTemplates.organizationId, organizationId)];
    
    if (filters?.type) {
      conditions.push(eq(contentTemplates.type, filters.type));
    }
    
    if (filters?.isPublic !== undefined) {
      conditions.push(eq(contentTemplates.isPublic, filters.isPublic));
    }

    return await db
      .select()
      .from(contentTemplates)
      .where(and(...conditions))
      .orderBy(desc(contentTemplates.createdAt));
  }

  async getContentTemplate(id: string, organizationId: string): Promise<ContentTemplate | undefined> {
    const [template] = await db
      .select()
      .from(contentTemplates)
      .where(
        and(
          eq(contentTemplates.id, id),
          eq(contentTemplates.organizationId, organizationId)
        )
      );
    return template || undefined;
  }

  async updateContentTemplate(
    id: string,
    organizationId: string,
    updates: UpdateContentTemplate
  ): Promise<ContentTemplate | undefined> {
    const [updated] = await db
      .update(contentTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contentTemplates.id, id),
          eq(contentTemplates.organizationId, organizationId)
        )
      )
      .returning();
    return updated || undefined;
  }

  async deleteContentTemplate(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(contentTemplates)
      .where(
        and(
          eq(contentTemplates.id, id),
          eq(contentTemplates.organizationId, organizationId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async applyTemplateToDisplay(insertApplication: InsertTemplateApplication): Promise<TemplateApplication> {
    const [application] = await db
      .insert(templateApplications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getTemplateApplications(
    organizationId: string,
    filters?: { templateId?: string; displayId?: string }
  ): Promise<TemplateApplication[]> {
    const conditions = [eq(templateApplications.organizationId, organizationId)];
    
    if (filters?.templateId) {
      conditions.push(eq(templateApplications.templateId, filters.templateId));
    }
    
    if (filters?.displayId) {
      conditions.push(eq(templateApplications.displayId, filters.displayId));
    }

    return await db
      .select()
      .from(templateApplications)
      .where(and(...conditions))
      .orderBy(desc(templateApplications.appliedAt));
  }

  // Sprint 5.2: Bulk Operations
  async bulkDeleteDisplays(displayIds: string[], organizationId: string): Promise<number> {
    if (displayIds.length === 0) return 0;
    
    const result = await db.delete(displays)
      .where(and(
        eq(displays.organizationId, organizationId),
        inArray(displays.id, displayIds)
      ));
    return result.rowCount ?? 0;
  }

  async bulkUpdateDisplays(
    displayIds: string[], 
    updates: { name?: string; status?: "online" | "offline" | "error" }, 
    organizationId: string
  ): Promise<number> {
    if (displayIds.length === 0) return 0;
    
    // Whitelist only safe fields - never allow organizationId, id, or other sensitive fields
    const safeUpdates: any = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.status !== undefined) safeUpdates.status = updates.status;
    
    // Only update if there are fields to update
    if (Object.keys(safeUpdates).length === 0) return 0;
    
    const result = await db.update(displays)
      .set(safeUpdates)
      .where(and(
        eq(displays.organizationId, organizationId),
        inArray(displays.id, displayIds)
      ));
    return result.rowCount ?? 0;
  }

  async bulkApplyTemplate(displayIds: string[], templateId: string, userId: string, organizationId: string): Promise<number> {
    if (displayIds.length === 0) return 0;
    
    // Verify template belongs to organization
    const template = await db.select().from(contentTemplates).where(
      and(eq(contentTemplates.id, templateId), eq(contentTemplates.organizationId, organizationId))
    ).limit(1);
    
    if (template.length === 0) {
      throw new Error("Template not found or access denied");
    }

    // Verify all displays belong to organization
    const validDisplays = await db.select({ id: displays.id }).from(displays).where(
      and(
        eq(displays.organizationId, organizationId),
        inArray(displays.id, displayIds)
      )
    );

    // Insert template applications for all valid displays
    const applications = validDisplays.map(display => ({
      templateId,
      displayId: display.id,
      appliedBy: userId,
      organizationId,
    }));

    if (applications.length > 0) {
      await db.insert(templateApplications).values(applications);
    }

    return applications.length;
  }

  async bulkDeleteContent(contentIds: string[], organizationId: string): Promise<number> {
    if (contentIds.length === 0) return 0;
    
    const result = await db.delete(contentItems)
      .where(and(
        eq(contentItems.organizationId, organizationId),
        inArray(contentItems.id, contentIds)
      ));
    return result.rowCount ?? 0;
  }

  // Player Releases methods (Sprint 6)
  async createPlayerRelease(insertRelease: InsertPlayerRelease): Promise<PlayerRelease> {
    const [release] = await db
      .insert(playerReleases)
      .values(insertRelease)
      .returning();
    return release;
  }

  async listPlayerReleases(filters?: { platform?: string; isPrerelease?: boolean; isLatest?: boolean }): Promise<PlayerRelease[]> {
    const conditions = [];
    
    if (filters?.platform) {
      conditions.push(eq(playerReleases.platform, filters.platform));
    }
    
    if (filters?.isPrerelease !== undefined) {
      conditions.push(eq(playerReleases.isPrerelease, filters.isPrerelease));
    }

    if (filters?.isLatest !== undefined) {
      conditions.push(eq(playerReleases.isLatest, filters.isLatest));
    }

    if (conditions.length === 0) {
      return await db
        .select()
        .from(playerReleases)
        .orderBy(desc(playerReleases.releaseDate));
    }

    return await db
      .select()
      .from(playerReleases)
      .where(and(...conditions))
      .orderBy(desc(playerReleases.releaseDate));
  }

  async getPlayerRelease(id: string): Promise<PlayerRelease | undefined> {
    const [release] = await db
      .select()
      .from(playerReleases)
      .where(eq(playerReleases.id, id))
      .limit(1);
    return release;
  }

  async getPlayerReleaseByVersion(version: string): Promise<PlayerRelease | undefined> {
    const [release] = await db
      .select()
      .from(playerReleases)
      .where(eq(playerReleases.version, version))
      .limit(1);
    return release;
  }

  async getLatestPlayerRelease(platform: string): Promise<PlayerRelease | undefined> {
    const [release] = await db
      .select()
      .from(playerReleases)
      .where(and(
        eq(playerReleases.platform, platform),
        eq(playerReleases.isLatest, true)
      ))
      .limit(1);
    return release;
  }

  async updatePlayerRelease(id: string, updates: UpdatePlayerRelease): Promise<PlayerRelease | undefined> {
    const [updated] = await db
      .update(playerReleases)
      .set(updates)
      .where(eq(playerReleases.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlayerRelease(id: string): Promise<boolean> {
    const result = await db
      .delete(playerReleases)
      .where(eq(playerReleases.id, id))
      .returning();
    return result.length > 0;
  }

  async setLatestRelease(id: string, platform: string): Promise<void> {
    // First, unset all other releases for this platform
    await db
      .update(playerReleases)
      .set({ isLatest: false })
      .where(eq(playerReleases.platform, platform));
    
    // Then set this one as latest
    await db
      .update(playerReleases)
      .set({ isLatest: true })
      .where(eq(playerReleases.id, id));
  }

}

export const storage = new DatabaseStorage();
