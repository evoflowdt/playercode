import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const displays = pgTable("displays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hashCode: text("hash_code").notNull().unique(),
  status: text("status").notNull().default("offline"),
  os: text("os").notNull(),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  resolution: text("resolution"),
  lastSeen: timestamp("last_seen"),
  screenshot: text("screenshot"),
  groupId: varchar("group_id"),
  organizationId: varchar("organization_id").notNull(),
});

export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  fileSize: integer("file_size"),
  duration: integer("duration"),
  htmlContent: text("html_content"),
  dataFeedUrl: text("data_feed_url"),
  dataFeedConfig: text("data_feed_config"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  organizationId: varchar("organization_id").notNull(),
});

export const displayGroups = pgTable("display_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  organizationId: varchar("organization_id").notNull(),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contentId: varchar("content_id"), // Optional: single content
  playlistId: varchar("playlist_id"), // Optional: playlist (multiple contents in sequence)
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  repeat: text("repeat"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  organizationId: varchar("organization_id").notNull(),
});

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  organizationId: varchar("organization_id").notNull(),
});

export const playlistItems = pgTable("playlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull(),
  contentId: varchar("content_id").notNull(),
  order: integer("order").notNull(),
  duration: integer("duration"),
});

export const radioStreams = pgTable("radio_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pairingTokens = pgTable("pairing_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  displayName: text("display_name"),
  os: text("os"),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  displayId: varchar("display_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playerSessions = pgTable("player_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayId: varchar("display_id").notNull(),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  playerVersion: text("player_version"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  currentContentId: varchar("current_content_id"),
  playbackStatus: text("playback_status").notNull().default("idle"),
});

export const playerCapabilities = pgTable("player_capabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayId: varchar("display_id").notNull().unique(),
  supportsVideo: boolean("supports_video").notNull().default(true),
  supportsAudio: boolean("supports_audio").notNull().default(true),
  supportsHtml: boolean("supports_html").notNull().default(true),
  supportsTouch: boolean("supports_touch").notNull().default(false),
  maxVideoResolution: text("max_video_resolution"),
  supportedVideoFormats: text("supported_video_formats").array(),
  supportedImageFormats: text("supported_image_formats").array(),
  cpuInfo: text("cpu_info"),
  memoryMb: integer("memory_mb"),
  storageMb: integer("storage_mb"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Feature Set 2: Advanced Scheduling
export const schedulingRules = pgTable("scheduling_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull(),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(), // 'day_of_week', 'time_range', 'date_range', 'condition'
  ruleConfig: text("rule_config").notNull(), // JSON string with rule configuration
  priority: integer("priority").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentPriority = pgTable("content_priority", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  priority: integer("priority").notNull().default(0), // Higher number = higher priority
  displayId: varchar("display_id"), // null = applies to all displays
  groupId: varchar("group_id"), // null = applies to all groups
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transitions = pgTable("transitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fromContentId: varchar("from_content_id"), // null = applies to all
  toContentId: varchar("to_content_id"), // null = applies to all
  displayId: varchar("display_id"), // null = applies to all displays
  groupId: varchar("group_id"), // null = applies to all groups
  transitionType: text("transition_type").notNull().default("fade"), // 'fade', 'slide', 'wipe', 'zoom', 'none'
  duration: integer("duration").notNull().default(1000), // milliseconds
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feature Set 3: Multi-Monitor Synchronization
export const syncGroups = pgTable("sync_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  organizationId: varchar("organization_id").notNull(),
});

export const syncGroupMembers = pgTable("sync_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncGroupId: varchar("sync_group_id").notNull(),
  displayId: varchar("display_id").notNull().unique(), // A display can only be in one sync group
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const syncSessions = pgTable("sync_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncGroupId: varchar("sync_group_id").notNull(),
  contentId: varchar("content_id"), // Optional: single content
  playlistId: varchar("playlist_id"), // Optional: playlist
  status: text("status").notNull().default("stopped"), // 'playing', 'paused', 'stopped'
  currentPosition: integer("current_position").notNull().default(0), // milliseconds
  startedAt: timestamp("started_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Feature Set 4: Multi-Tenant Authentication & User Management
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  settings: text("settings"), // JSON string: { branding, features, limits }
  plan: text("plan").notNull().default("free"), // free, pro, enterprise
  maxDisplays: integer("max_displays").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  defaultOrganizationId: varchar("default_organization_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  role: text("role").notNull().default("viewer"), // owner, admin, editor, viewer
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  invitedBy: varchar("invited_by"),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDisplaySchema = createInsertSchema(displays).pick({
  name: true,
  hashCode: true,
  os: true,
  location: true,
  latitude: true,
  longitude: true,
  resolution: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).pick({
  name: true,
  type: true,
  url: true,
  fileSize: true,
  duration: true,
  htmlContent: true,
  dataFeedUrl: true,
  dataFeedConfig: true,
});

export const insertDisplayGroupSchema = createInsertSchema(displayGroups).pick({
  name: true,
  description: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  name: true,
  contentId: true,
  playlistId: true,
  targetType: true,
  targetId: true,
  startTime: true,
  endTime: true,
  repeat: true,
  active: true,
}).refine(
  (data) => data.contentId || data.playlistId,
  { message: "Either contentId or playlistId must be provided" }
);

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  description: true,
});

export const insertPlaylistItemSchema = createInsertSchema(playlistItems).pick({
  playlistId: true,
  contentId: true,
  order: true,
  duration: true,
});

export const insertRadioStreamSchema = createInsertSchema(radioStreams).pick({
  playlistId: true,
  name: true,
  url: true,
  description: true,
  active: true,
});

export const insertPairingTokenSchema = createInsertSchema(pairingTokens).pick({
  token: true,
  displayName: true,
  os: true,
  expiresAt: true,
});

export const insertPlayerSessionSchema = createInsertSchema(playerSessions).pick({
  displayId: true,
  playerVersion: true,
  ipAddress: true,
  userAgent: true,
  currentContentId: true,
  playbackStatus: true,
});

export const insertPlayerCapabilitiesSchema = createInsertSchema(playerCapabilities).pick({
  displayId: true,
  supportsVideo: true,
  supportsAudio: true,
  supportsHtml: true,
  supportsTouch: true,
  maxVideoResolution: true,
  supportedVideoFormats: true,
  supportedImageFormats: true,
  cpuInfo: true,
  memoryMb: true,
  storageMb: true,
});

export const insertSchedulingRuleSchema = createInsertSchema(schedulingRules).pick({
  scheduleId: true,
  name: true,
  ruleType: true,
  ruleConfig: true,
  priority: true,
  enabled: true,
});

export const insertContentPrioritySchema = createInsertSchema(contentPriority).pick({
  contentId: true,
  priority: true,
  displayId: true,
  groupId: true,
  validFrom: true,
  validUntil: true,
});

export const insertTransitionSchema = createInsertSchema(transitions).pick({
  name: true,
  fromContentId: true,
  toContentId: true,
  displayId: true,
  groupId: true,
  transitionType: true,
  duration: true,
  enabled: true,
});

export const insertSyncGroupSchema = createInsertSchema(syncGroups).pick({
  name: true,
  description: true,
  active: true,
});

export const insertSyncGroupMemberSchema = createInsertSchema(syncGroupMembers).pick({
  syncGroupId: true,
  displayId: true,
});

export const insertSyncSessionSchema = createInsertSchema(syncSessions).pick({
  syncGroupId: true,
  contentId: true,
  playlistId: true,
  status: true,
  currentPosition: true,
  startedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  slug: true,
  settings: true,
  plan: true,
  maxDisplays: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  defaultOrganizationId: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
  userId: true,
  organizationId: true,
  role: true,
  invitedBy: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  expiresAt: true,
  ipAddress: true,
  userAgent: true,
});

export type InsertDisplay = z.infer<typeof insertDisplaySchema>;
export type Display = typeof displays.$inferSelect;

export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

export type InsertDisplayGroup = z.infer<typeof insertDisplayGroupSchema>;
export type DisplayGroup = typeof displayGroups.$inferSelect;

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export type InsertPlaylistItem = z.infer<typeof insertPlaylistItemSchema>;
export type PlaylistItem = typeof playlistItems.$inferSelect;

export type InsertRadioStream = z.infer<typeof insertRadioStreamSchema>;
export type RadioStream = typeof radioStreams.$inferSelect;

export type InsertPairingToken = z.infer<typeof insertPairingTokenSchema>;
export type PairingToken = typeof pairingTokens.$inferSelect;

export type InsertPlayerSession = z.infer<typeof insertPlayerSessionSchema>;
export type PlayerSession = typeof playerSessions.$inferSelect;

export type InsertPlayerCapabilities = z.infer<typeof insertPlayerCapabilitiesSchema>;
export type PlayerCapabilities = typeof playerCapabilities.$inferSelect;

export type InsertSchedulingRule = z.infer<typeof insertSchedulingRuleSchema>;
export type SchedulingRule = typeof schedulingRules.$inferSelect;

export type InsertContentPriority = z.infer<typeof insertContentPrioritySchema>;
export type ContentPriority = typeof contentPriority.$inferSelect;

export type InsertTransition = z.infer<typeof insertTransitionSchema>;
export type Transition = typeof transitions.$inferSelect;

export type InsertSyncGroup = z.infer<typeof insertSyncGroupSchema>;
export type SyncGroup = typeof syncGroups.$inferSelect;

export type InsertSyncGroupMember = z.infer<typeof insertSyncGroupMemberSchema>;
export type SyncGroupMember = typeof syncGroupMembers.$inferSelect;

export type InsertSyncSession = z.infer<typeof insertSyncSessionSchema>;
export type SyncSession = typeof syncSessions.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export interface UserWithOrganizations extends User {
  organizations: Array<OrganizationMember & { organizationName: string }>;
}

export interface DashboardStats {
  totalDisplays: number;
  activeDisplays: number;
  offlineDisplays: number;
  totalContent: number;
}

export interface DisplayWithGroup extends Display {
  groupName?: string;
}

export interface ScheduleWithDetails extends Schedule {
  contentName?: string; // Present if contentId is set
  playlistName?: string; // Present if playlistId is set
  targetName: string;
}

export interface PlaylistWithItems extends Playlist {
  items: Array<PlaylistItem & { contentName: string }>;
}

export interface SyncGroupWithMembers extends SyncGroup {
  members: Array<SyncGroupMember & { displayName: string }>;
  memberCount: number;
}

export interface SyncSessionWithDetails extends SyncSession {
  syncGroupName: string;
  contentName?: string;
  playlistName?: string;
}
