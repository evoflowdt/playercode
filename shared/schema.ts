import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
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
  type: text("type").notNull(), // 'image', 'video', 'url', 'webpage', 'html', 'feed'
  url: text("url"), // For URL/webpage content or file URLs
  fileSize: integer("file_size"),
  duration: integer("duration"), // Display duration in seconds
  refreshInterval: integer("refresh_interval"), // Auto-refresh interval in seconds for webpages
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

// Multi-zone layouts for displays
export const layouts = pgTable("layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  zones: text("zones").notNull(), // JSON string defining zones: [{id, x, y, width, height, contentId}]
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zone assignments for displays
export const displayLayouts = pgTable("display_layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayId: varchar("display_id").notNull(),
  layoutId: varchar("layout_id").notNull(),
  active: boolean("active").notNull().default(true),
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proof of Play - content playback tracking
export const playbackLogs = pgTable("playback_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayId: varchar("display_id").notNull(),
  contentId: varchar("content_id").notNull(),
  playlistId: varchar("playlist_id"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Actual playback duration in seconds
  organizationId: varchar("organization_id").notNull(),
});

// Feature 7: Smart Alerts - intelligent monitoring and notifications
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  alertType: text("alert_type").notNull(), // 'display_offline', 'content_failed', 'storage_low'
  condition: text("condition").notNull(), // JSON: threshold, duration, etc.
  targetType: text("target_type").notNull(), // 'display', 'group', 'all'
  targetId: varchar("target_id"),
  notificationChannels: text("notification_channels").array(), // ['email', 'webhook', 'in_app']
  enabled: boolean("enabled").notNull().default(true),
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alertHistory = pgTable("alert_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull(),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON: additional context
  organizationId: varchar("organization_id").notNull(),
});

// Feature 8: Content Approval Workflow
export const contentApprovals = pgTable("content_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  submittedBy: varchar("submitted_by").notNull(),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  comments: text("comments"),
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feature 9: Dynamic Feeds (RSS/Social)
export const dynamicFeeds = pgTable("dynamic_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  feedType: text("feed_type").notNull(), // 'rss', 'twitter', 'instagram', 'weather'
  feedUrl: text("feed_url").notNull(),
  refreshInterval: integer("refresh_interval").notNull().default(300), // seconds
  template: text("template"), // HTML template for rendering
  lastFetched: timestamp("last_fetched"),
  enabled: boolean("enabled").notNull().default(true),
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feature 11: Emergency Override
export const emergencyOverrides = pgTable("emergency_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  targetType: text("target_type").notNull(), // 'display', 'group', 'all'
  targetId: varchar("target_id"),
  priority: integer("priority").notNull().default(999), // Very high priority
  activatedBy: varchar("activated_by").notNull(),
  activatedAt: timestamp("activated_at").notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at"),
  reason: text("reason"),
  organizationId: varchar("organization_id").notNull(),
});

// Feature 12: Weather-Based Scheduling
export const weatherConditions = pgTable("weather_conditions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull(),
  conditionType: text("condition_type").notNull(), // 'temperature', 'precipitation', 'condition'
  operator: text("operator").notNull(), // 'gt', 'lt', 'eq', 'contains'
  value: text("value").notNull(),
  location: text("location").notNull(), // City or coordinates
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feature 13: Two-Factor Authentication
export const userTwoFactor = pgTable("user_two_factor", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  totpSecret: text("totp_secret").notNull(),
  backupCodes: text("backup_codes").array(),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsed: timestamp("last_used"),
});

// Insert schemas for new features
export const insertEmergencyOverrideSchema = createInsertSchema(emergencyOverrides).omit({
  id: true,
  activatedAt: true,
});

export const insertPlaybackLogSchema = createInsertSchema(playbackLogs).omit({
  id: true,
  startTime: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
});

export const insertContentApprovalSchema = createInsertSchema(contentApprovals).omit({
  id: true,
  createdAt: true,
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
  priority: integer("priority").notNull().default(0), // Higher number = higher priority
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
  organizationId: varchar("organization_id").notNull(),
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
  ruleType: text("rule_type").notNull(), // 'daypart', 'day_of_week', 'time_range', 'date_range'
  ruleConfig: text("rule_config").notNull(), // JSON string with rule configuration
  priority: integer("priority").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  organizationId: varchar("organization_id").notNull(),
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

export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  organizationId: varchar("organization_id").notNull(),
  role: text("role").notNull().default("viewer"), // owner, admin, editor, viewer
  token: text("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  accepted: boolean("accepted").notNull().default(false),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // create, update, delete, login, logout, invite, etc.
  resourceType: text("resource_type").notNull(), // display, content, schedule, user, etc.
  resourceId: varchar("resource_id"),
  details: text("details"), // JSON string with additional details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sprint 4: Advanced Analytics
export const displayMetrics = pgTable("display_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayId: varchar("display_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  status: text("status").notNull(), // online, offline, warning
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  uptime: integer("uptime"), // seconds since last status change
  cpuUsage: integer("cpu_usage"), // percentage 0-100
  memoryUsage: integer("memory_usage"), // percentage 0-100
  storageUsage: integer("storage_usage"), // percentage 0-100
});

export const contentViews = pgTable("content_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  displayId: varchar("display_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  scheduleId: varchar("schedule_id"), // null if not from schedule
  playlistId: varchar("playlist_id"), // null if not from playlist
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  duration: integer("duration"), // actual view duration in seconds
});

export const scheduleExecutions = pgTable("schedule_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull(),
  displayId: varchar("display_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
  status: text("status").notNull(), // success, failed, skipped
  errorMessage: text("error_message"),
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
  priority: true,
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
  organizationId: true,
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
  organizationId: true,
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

export const insertInvitationSchema = createInsertSchema(invitations).pick({
  email: true,
  organizationId: true,
  role: true,
  token: true,
  invitedBy: true,
  expiresAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  organizationId: true,
  userId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  details: true,
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

export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

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

export interface TeamMember extends OrganizationMember {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  inviterName?: string;
}

export interface InvitationWithDetails extends Invitation {
  inviterFirstName: string;
  inviterLastName: string;
  organizationName: string;
}

export interface AuditLogWithDetails extends AuditLog {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

// Sprint 4: API Keys & Webhooks
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at"),
});

export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").array().notNull(), // array of event types to subscribe to
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(), // JSON stringified
  status: text("status").notNull(), // pending, sent, failed
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // display.offline, display.online, content.uploaded, schedule.executed, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON stringified additional data
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
  lastAttemptAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Sprint 4 Feature 5: Granular Permissions
export const resourcePermissions = pgTable("resource_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  resourceType: text("resource_type").notNull(), // 'display', 'content_item', 'playlist', 'schedule', 'display_group'
  resourceId: varchar("resource_id").notNull(), // ID of the specific resource
  actions: text("actions").array().notNull(), // ['view', 'edit', 'delete', 'manage']
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull(), // userId who created this permission
});

export const insertResourcePermissionSchema = createInsertSchema(resourcePermissions).omit({
  id: true,
  createdAt: true,
});

export const updateResourcePermissionSchema = insertResourcePermissionSchema.partial().omit({
  userId: true,
  organizationId: true,
  resourceType: true,
  resourceId: true,
});

export type ResourcePermission = typeof resourcePermissions.$inferSelect;
export type InsertResourcePermission = z.infer<typeof insertResourcePermissionSchema>;
export type UpdateResourcePermission = z.infer<typeof updateResourcePermissionSchema>;

// Sprint 5.2: Bulk Operations Schemas
export const bulkDeleteDisplaysSchema = z.object({
  displayIds: z.array(z.string()).min(1, "At least one display ID is required"),
});

export const bulkUpdateDisplaysSchema = z.object({
  displayIds: z.array(z.string()).min(1, "At least one display ID is required"),
  updates: z.object({
    name: z.string().optional(),
    status: z.enum(["online", "offline", "error"]).optional(),
  }).refine(obj => Object.keys(obj).length > 0, "At least one field to update is required"),
});

export const bulkApplyTemplateSchema = z.object({
  displayIds: z.array(z.string()).min(1, "At least one display ID is required"),
  templateId: z.string().min(1, "Template ID is required"),
});

export const bulkDeleteContentSchema = z.object({
  contentIds: z.array(z.string()).min(1, "At least one content ID is required"),
});

// Sprint 4: Advanced Analytics Types
export type DisplayMetric = typeof displayMetrics.$inferSelect;
export type ContentView = typeof contentViews.$inferSelect;
export type ScheduleExecution = typeof scheduleExecutions.$inferSelect;

export interface AdvancedAnalytics {
  displayUptime: Array<{
    displayId: string;
    displayName: string;
    uptimePercentage: number;
    totalOnlineTime: number;
    totalOfflineTime: number;
  }>;
  contentPopularity: Array<{
    contentId: string;
    contentName: string;
    viewCount: number;
    totalViewTime: number;
  }>;
  schedulePerformance: Array<{
    scheduleId: string;
    scheduleName: string;
    successCount: number;
    failedCount: number;
    successRate: number;
  }>;
  timeSeriesMetrics: Array<{
    timestamp: string;
    onlineDisplays: number;
    offlineDisplays: number;
    totalViews: number;
  }>;
}

// ============================================================
// Sprint 5: Advanced Features
// ============================================================

// Sprint 5.1: Content Templates
export const contentTemplates = pgTable("content_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'welcome', 'menu', 'emergency', 'promo', 'custom'
  thumbnailUrl: text("thumbnail_url"),
  config: text("config").notNull(), // JSON: { playlistId?, contentId?, layoutType, settings }
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
});

export const templateApplications = pgTable("template_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => contentTemplates.id),
  displayId: varchar("display_id").notNull().references(() => displays.id),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  appliedBy: varchar("applied_by").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
});

export const insertContentTemplateSchema = createInsertSchema(contentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  createdBy: true,
});

export const updateContentTemplateSchema = insertContentTemplateSchema.partial();

export const insertTemplateApplicationSchema = createInsertSchema(templateApplications).omit({
  id: true,
  appliedAt: true,
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = z.infer<typeof insertContentTemplateSchema>;
export type UpdateContentTemplate = z.infer<typeof updateContentTemplateSchema>;

export type TemplateApplication = typeof templateApplications.$inferSelect;
export type InsertTemplateApplication = z.infer<typeof insertTemplateApplicationSchema>;

// Template config type for type-safe JSON parsing
export interface TemplateConfig {
  playlistId?: string;
  contentId?: string;
  layoutType: 'fullscreen' | 'split-horizontal' | 'split-vertical' | 'grid-2x2' | 'grid-3x3';
  settings: {
    transitionEffect?: 'fade' | 'slide' | 'none';
    defaultDuration?: number; // seconds
    backgroundColor?: string;
    customCss?: string;
  };
  schedule?: {
    startTime?: string;
    endTime?: string;
    repeat?: string;
  };
}

// ============================================================
// Sprint 6: Player Software Distribution
// ============================================================

// Player releases stored in GitHub
export const playerReleases = pgTable("player_releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  version: text("version").notNull(), // e.g., "1.0.0", "1.2.3-beta"
  platform: text("platform").notNull(), // 'windows', 'macos', 'linux'
  releaseDate: timestamp("release_date").notNull().defaultNow(),
  changelog: text("changelog"), // Release notes in markdown
  githubReleaseId: text("github_release_id").notNull(), // GitHub release ID
  githubReleaseUrl: text("github_release_url").notNull(), // URL to GitHub release page
  downloadUrl: text("download_url").notNull(), // Direct download URL from GitHub
  fileName: text("file_name").notNull(), // e.g., "EvoFlow-Player-1.0.0-Windows.exe"
  fileSize: integer("file_size"), // Size in bytes
  isPrerelease: boolean("is_prerelease").notNull().default(false),
  isLatest: boolean("is_latest").notNull().default(false), // Only one per platform should be true
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
}, (table) => ({
  // Composite unique constraint: same version can exist for different platforms
  versionPlatformIdx: unique().on(table.version, table.platform),
}));

export const insertPlayerReleaseSchema = createInsertSchema(playerReleases).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export const updatePlayerReleaseSchema = insertPlayerReleaseSchema.partial();

export type PlayerRelease = typeof playerReleases.$inferSelect;
export type InsertPlayerRelease = z.infer<typeof insertPlayerReleaseSchema>;
export type UpdatePlayerRelease = z.infer<typeof updatePlayerReleaseSchema>;
