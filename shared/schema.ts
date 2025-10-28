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
});

export const displayGroups = pgTable("display_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contentId: varchar("content_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  repeat: text("repeat"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlistItems = pgTable("playlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull(),
  contentId: varchar("content_id").notNull(),
  order: integer("order").notNull(),
  duration: integer("duration"),
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
  targetType: true,
  targetId: true,
  startTime: true,
  endTime: true,
  repeat: true,
  active: true,
});

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

export type InsertPairingToken = z.infer<typeof insertPairingTokenSchema>;
export type PairingToken = typeof pairingTokens.$inferSelect;

export type InsertPlayerSession = z.infer<typeof insertPlayerSessionSchema>;
export type PlayerSession = typeof playerSessions.$inferSelect;

export type InsertPlayerCapabilities = z.infer<typeof insertPlayerCapabilitiesSchema>;
export type PlayerCapabilities = typeof playerCapabilities.$inferSelect;

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
  contentName: string;
  targetName: string;
}

export interface PlaylistWithItems extends Playlist {
  items: Array<PlaylistItem & { contentName: string }>;
}
