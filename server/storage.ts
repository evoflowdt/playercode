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
  type DashboardStats,
  type DisplayWithGroup,
  type ScheduleWithDetails,
  type PlaylistWithItems,
  type SyncGroupWithMembers,
  type SyncSessionWithDetails,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gt } from "drizzle-orm";

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
  
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getAllPlaylists(): Promise<Playlist[]>;
  getPlaylistWithItems(id: string): Promise<PlaylistWithItems | undefined>;
  getAllPlaylistsWithItems(): Promise<PlaylistWithItems[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<boolean>;
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
  
  getSyncGroup(id: string): Promise<SyncGroup | undefined>;
  getAllSyncGroups(): Promise<SyncGroup[]>;
  getSyncGroupWithMembers(id: string): Promise<SyncGroupWithMembers | undefined>;
  getAllSyncGroupsWithMembers(): Promise<SyncGroupWithMembers[]>;
  createSyncGroup(group: InsertSyncGroup): Promise<SyncGroup>;
  updateSyncGroup(id: string, updates: Partial<SyncGroup>): Promise<SyncGroup | undefined>;
  deleteSyncGroup(id: string): Promise<boolean>;
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

  // Playlist methods
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return await db.select().from(playlists);
  }

  async getPlaylistWithItems(id: string): Promise<PlaylistWithItems | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
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

  async getAllPlaylistsWithItems(): Promise<PlaylistWithItems[]> {
    const allPlaylists = await db.select().from(playlists);
    
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

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values(insertPlaylist)
      .returning();
    return playlist;
  }

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined> {
    const [updated] = await db
      .update(playlists)
      .set(updates)
      .where(eq(playlists.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    await db.delete(playlistItems).where(eq(playlistItems.playlistId, id));
    const result = await db.delete(playlists).where(eq(playlists.id, id));
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
  async getSyncGroup(id: string): Promise<SyncGroup | undefined> {
    const [group] = await db
      .select()
      .from(syncGroups)
      .where(eq(syncGroups.id, id));
    return group || undefined;
  }

  async getAllSyncGroups(): Promise<SyncGroup[]> {
    return await db.select().from(syncGroups);
  }

  async getSyncGroupWithMembers(id: string): Promise<SyncGroupWithMembers | undefined> {
    const group = await this.getSyncGroup(id);
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

  async getAllSyncGroupsWithMembers(): Promise<SyncGroupWithMembers[]> {
    const groups = await this.getAllSyncGroups();
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const withMembers = await this.getSyncGroupWithMembers(group.id);
        return withMembers!;
      })
    );
    return groupsWithMembers;
  }

  async createSyncGroup(insertGroup: InsertSyncGroup): Promise<SyncGroup> {
    const [group] = await db
      .insert(syncGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async updateSyncGroup(
    id: string,
    updates: Partial<SyncGroup>
  ): Promise<SyncGroup | undefined> {
    const [updated] = await db
      .update(syncGroups)
      .set(updates)
      .where(eq(syncGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSyncGroup(id: string): Promise<boolean> {
    await db.delete(syncGroupMembers).where(eq(syncGroupMembers.syncGroupId, id));
    await db.delete(syncSessions).where(eq(syncSessions.syncGroupId, id));
    const result = await db.delete(syncGroups).where(eq(syncGroups.id, id));
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
}

export const storage = new DatabaseStorage();
