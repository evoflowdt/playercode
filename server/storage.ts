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
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gt, lt, gte, lte } from "drizzle-orm";

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
  createPlayerSession(session: InsertPlayerSession): Promise<PlayerSession>;
  updatePlayerSession(displayId: string, updates: Partial<PlayerSession>): Promise<PlayerSession | undefined>;
  deletePlayerSession(displayId: string): Promise<boolean>;
  updateHeartbeat(displayId: string): Promise<boolean>;
  
  getPlayerCapabilities(displayId: string): Promise<PlayerCapabilities | undefined>;
  createPlayerCapabilities(capabilities: InsertPlayerCapabilities): Promise<PlayerCapabilities>;
  updatePlayerCapabilities(displayId: string, updates: Partial<PlayerCapabilities>): Promise<PlayerCapabilities | undefined>;
  
  getSchedulingRule(id: string): Promise<SchedulingRule | undefined>;
  getAllSchedulingRules(): Promise<SchedulingRule[]>;
  getSchedulingRulesBySchedule(scheduleId: string): Promise<SchedulingRule[]>;
  createSchedulingRule(rule: InsertSchedulingRule): Promise<SchedulingRule>;
  updateSchedulingRule(id: string, updates: Partial<SchedulingRule>): Promise<SchedulingRule | undefined>;
  deleteSchedulingRule(id: string): Promise<boolean>;
  
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
  async getSchedulingRule(id: string): Promise<SchedulingRule | undefined> {
    const [rule] = await db
      .select()
      .from(schedulingRules)
      .where(eq(schedulingRules.id, id));
    return rule || undefined;
  }

  async getAllSchedulingRules(): Promise<SchedulingRule[]> {
    return await db.select().from(schedulingRules);
  }

  async getSchedulingRulesBySchedule(scheduleId: string): Promise<SchedulingRule[]> {
    return await db
      .select()
      .from(schedulingRules)
      .where(eq(schedulingRules.scheduleId, scheduleId));
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
    updates: Partial<SchedulingRule>
  ): Promise<SchedulingRule | undefined> {
    const [updated] = await db
      .update(schedulingRules)
      .set(updates)
      .where(eq(schedulingRules.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSchedulingRule(id: string): Promise<boolean> {
    const result = await db
      .delete(schedulingRules)
      .where(eq(schedulingRules.id, id));
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
}

export const storage = new DatabaseStorage();
