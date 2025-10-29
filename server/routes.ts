import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./objectStorage";
import {
  insertDisplaySchema,
  insertContentItemSchema,
  insertDisplayGroupSchema,
  insertScheduleSchema,
  insertPlaylistSchema,
  insertPlaylistItemSchema,
  insertPairingTokenSchema,
  insertPlayerSessionSchema,
  insertPlayerCapabilitiesSchema,
  insertSchedulingRuleSchema,
  insertContentPrioritySchema,
  insertTransitionSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express, httpServer: Server): Promise<void> {
  // Setup WebSocket server (non-blocking)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws', noServer: false });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('WebSocket client connected. Total clients:', clients.size);
    
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to EvoFlow server'
    }));
    
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'display_register') {
          const display = await storage.createDisplay(message.data);
          broadcast({
            type: 'display_added',
            data: display
          });
        } else if (message.type === 'display_status') {
          const updated = await storage.updateDisplay(message.displayId, {
            status: message.status,
            lastSeen: new Date(),
          });
          if (updated) {
            broadcast({
              type: 'display_updated',
              data: updated
            });
          }
        } else if (message.type === 'display_screenshot') {
          const updated = await storage.updateDisplay(message.displayId, {
            screenshot: message.screenshot,
            lastSeen: new Date(),
          });
          if (updated) {
            broadcast({
              type: 'display_updated',
              data: updated
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected. Total clients:', clients.size);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  function broadcast(message: any) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/displays", async (_req, res) => {
    try {
      const displays = await storage.getAllDisplays();
      res.json(displays);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch displays" });
    }
  });

  app.get("/api/displays/:id", async (req, res) => {
    try {
      const display = await storage.getDisplay(req.params.id);
      if (!display) {
        return res.status(404).json({ error: "Display not found" });
      }
      res.json(display);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch display" });
    }
  });

  app.post("/api/displays", async (req, res) => {
    try {
      const validatedData = insertDisplaySchema.parse(req.body);
      const display = await storage.createDisplay(validatedData);
      broadcast({
        type: 'display_added',
        data: display
      });
      res.status(201).json(display);
    } catch (error) {
      res.status(400).json({ error: "Invalid display data" });
    }
  });

  app.patch("/api/displays/:id", async (req, res) => {
    try {
      const updated = await storage.updateDisplay(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Display not found" });
      }
      broadcast({
        type: 'display_updated',
        data: updated
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update display" });
    }
  });

  app.delete("/api/displays/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDisplay(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Display not found" });
      }
      broadcast({
        type: 'display_deleted',
        data: { id: req.params.id }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete display" });
    }
  });

  app.get("/api/content", async (_req, res) => {
    try {
      const items = await storage.getAllContentItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      let normalizedUrl = req.body.url;
      
      // Only normalize if URL is provided
      if (normalizedUrl && typeof normalizedUrl === 'string') {
        normalizedUrl = objectStorageService.normalizeObjectEntityPath(normalizedUrl);
      }
      
      const validatedData = insertContentItemSchema.parse({
        ...req.body,
        url: normalizedUrl,
      });
      const item = await storage.createContentItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Content creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
      }
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContentItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  app.get("/api/groups", async (_req, res) => {
    try {
      const groups = await storage.getAllDisplayGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const validatedData = insertDisplayGroupSchema.parse(req.body);
      const group = await storage.createDisplayGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDisplayGroup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  app.get("/api/schedules", async (_req, res) => {
    try {
      const schedules = await storage.getSchedulesWithDetails();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      console.log('Schedule request body:', req.body);
      
      const scheduleData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };
      
      console.log('Processed schedule data:', scheduleData);
      const validatedData = insertScheduleSchema.parse(scheduleData);
      const schedule = await storage.createSchedule(validatedData);
      
      // Notify affected displays via WebSocket
      if (schedule.targetType === 'display') {
        const display = await storage.getDisplay(schedule.targetId);
        if (display) {
          broadcast({
            type: 'display_updated',
            data: display
          });
        }
      } else if (schedule.targetType === 'group') {
        const allDisplays = await storage.getDisplaysWithGroups();
        const groupDisplays = allDisplays.filter(d => d.groupId === schedule.targetId);
        groupDisplays.forEach((display: typeof allDisplays[0]) => {
          broadcast({
            type: 'display_updated',
            data: display
          });
        });
      }
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error('Schedule creation error:', error);
      res.status(400).json({ error: "Invalid schedule data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.getSchedule(req.params.id);
      const deleted = await storage.deleteSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      // Notify affected displays via WebSocket
      if (schedule) {
        if (schedule.targetType === 'display') {
          const display = await storage.getDisplay(schedule.targetId);
          if (display) {
            broadcast({
              type: 'display_updated',
              data: display
            });
          }
        } else if (schedule.targetType === 'group') {
          const allDisplays = await storage.getDisplaysWithGroups();
          const groupDisplays = allDisplays.filter(d => d.groupId === schedule.targetId);
          groupDisplays.forEach((display: typeof allDisplays[0]) => {
            broadcast({
              type: 'display_updated',
              data: display
            });
          });
        }
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private uploads publicly (for player content display)
  app.get("/.private/uploads/:fileId", async (req, res) => {
    const fileId = req.params.fileId;
    
    // Validate UUID format to prevent malformed requests
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(fileId)) {
      return res.status(400).json({ error: "Invalid file ID format" });
    }
    
    const objectStorageService = new ObjectStorageService();
    try {
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/uploads/${fileId}`;
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "File not found" });
      }
      
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving private upload:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  app.post("/api/objects/upload", async (_req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/api/playlists", async (_req, res) => {
    try {
      const playlists = await storage.getAllPlaylistsWithItems();
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylistWithItems(req.params.id);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Playlist creation error:", error);
      res.status(400).json({ error: "Invalid playlist data" });
    }
  });

  app.delete("/api/playlists/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlaylist(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  app.post("/api/playlists/:id/items", async (req, res) => {
    try {
      const playlistId = req.params.id;
      const validatedData = insertPlaylistItemSchema.parse({
        ...req.body,
        playlistId,
      });
      const item = await storage.addItemToPlaylist(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Add item error:", error);
      res.status(400).json({ error: "Invalid item data" });
    }
  });

  app.delete("/api/playlists/items/:itemId", async (req, res) => {
    try {
      const deleted = await storage.removeItemFromPlaylist(req.params.itemId);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item" });
    }
  });

  // Player API Routes
  
  // Validation schemas
  const pairingTokenRequestSchema = z.object({
    displayName: z.string().optional(),
    os: z.string().optional(),
  });

  const pairRequestSchema = z.object({
    token: z.string().min(1),
    displayInfo: z.object({
      name: z.string().optional(),
      os: z.string().optional(),
      location: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      resolution: z.string().optional(),
      playerVersion: z.string().optional(),
      capabilities: z.object({
        supportsVideo: z.boolean().optional(),
        supportsAudio: z.boolean().optional(),
        supportsHtml: z.boolean().optional(),
        supportsTouch: z.boolean().optional(),
        maxVideoResolution: z.string().optional(),
        supportedVideoFormats: z.array(z.string()).optional(),
        supportedImageFormats: z.array(z.string()).optional(),
        cpuInfo: z.string().optional(),
        memoryMb: z.number().optional(),
        storageMb: z.number().optional(),
      }).optional(),
    }),
  });

  const heartbeatRequestSchema = z.object({
    displayId: z.string().min(1),
    status: z.string().optional(),
    currentContentId: z.string().optional(),
  });
  
  // Generate a pairing token
  app.post("/api/player/pairing-token", async (req, res) => {
    try {
      const validated = pairingTokenRequestSchema.parse(req.body);
      
      // Generate cryptographically secure token
      const token = randomBytes(6).toString('hex').toUpperCase();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      const pairingToken = await storage.createPairingToken({
        token,
        displayName: validated.displayName,
        os: validated.os,
        expiresAt,
      });
      
      res.status(201).json(pairingToken);
    } catch (error) {
      console.error("Pairing token creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create pairing token" });
    }
  });
  
  // Complete pairing with a token
  app.post("/api/player/pair", async (req, res) => {
    try {
      const validated = pairRequestSchema.parse(req.body);
      const { token, displayInfo } = validated;
      
      const pairingToken = await storage.getPairingToken(token);
      if (!pairingToken) {
        return res.status(404).json({ error: "Invalid pairing token" });
      }
      
      if (pairingToken.used) {
        return res.status(400).json({ error: "Pairing token already used" });
      }
      
      if (pairingToken.expiresAt < new Date()) {
        return res.status(400).json({ error: "Pairing token expired" });
      }
      
      // Create the display
      const display = await storage.createDisplay({
        name: pairingToken.displayName || displayInfo.name || "Unknown Display",
        hashCode: token,
        os: pairingToken.os || displayInfo.os || "unknown",
        location: displayInfo.location,
        latitude: displayInfo.latitude,
        longitude: displayInfo.longitude,
        resolution: displayInfo.resolution,
      });
      
      // Mark token as used
      await storage.usePairingToken(token, display.id);
      
      // Create player session
      await storage.createPlayerSession({
        displayId: display.id,
        playerVersion: displayInfo.playerVersion || "1.0.0",
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
      });
      
      // Create player capabilities if provided
      if (displayInfo.capabilities) {
        await storage.createPlayerCapabilities({
          displayId: display.id,
          ...displayInfo.capabilities,
        });
      }
      
      res.status(201).json({ display, message: "Player paired successfully" });
    } catch (error) {
      console.error("Pairing error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to complete pairing" });
    }
  });
  
  // Player heartbeat
  app.post("/api/player/heartbeat", async (req, res) => {
    try {
      const validated = heartbeatRequestSchema.parse(req.body);
      const { displayId, status, currentContentId } = validated;
      
      // Verify display exists
      const display = await storage.getDisplay(displayId);
      if (!display) {
        return res.status(404).json({ error: "Display not found" });
      }
      
      // Update display status
      await storage.updateDisplay(displayId, {
        status: status || "online",
        lastSeen: new Date(),
      });
      
      // Update session heartbeat
      const session = await storage.getPlayerSession(displayId);
      if (!session) {
        // Session was deleted - player should re-pair
        return res.status(404).json({ error: "Session not found" });
      }
      
      await storage.updatePlayerSession(displayId, {
        lastHeartbeat: new Date(),
        currentContentId,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Heartbeat error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update heartbeat" });
    }
  });
  
  // Get content to display (using advanced scheduling engine)
  app.get("/api/player/content/:displayId", async (req, res) => {
    try {
      const { displayId } = req.params;
      
      const display = await storage.getDisplay(displayId);
      if (!display) {
        return res.status(404).json({ error: "Display not found" });
      }
      
      // Use scheduling engine to get the content to display
      const { schedulingEngine } = await import("./scheduling-engine");
      const scheduledContent = await schedulingEngine.getContentForDisplay(displayId);
      
      if (!scheduledContent) {
        // No scheduled content, return empty
        return res.json({
          display,
          content: [],
          schedules: [],
        });
      }
      
      // Get the actual content item
      const contentItem = await storage.getContentItem(scheduledContent.contentId);
      if (!contentItem) {
        return res.json({
          display,
          content: [],
          schedules: [],
        });
      }
      
      // Convert internal object path to public URL
      let contentWithUrl = { ...contentItem };
      if (contentItem.url && contentItem.url.startsWith('/objects/')) {
        const publicPath = contentItem.url.replace('/objects/', '/public-objects/');
        contentWithUrl.url = publicPath;
      }
      
      // Get the schedule details
      const schedule = await storage.getSchedule(scheduledContent.scheduleId);
      
      res.json({
        display,
        content: [contentWithUrl],
        schedules: schedule ? [schedule] : [],
        priority: scheduledContent.priority,
        source: scheduledContent.source,
      });
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });
  
  // Get all player sessions
  app.get("/api/player/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getAllPlayerSessions();
      
      // Enrich sessions with display information
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          const display = await storage.getDisplay(session.displayId);
          return {
            ...session,
            displayName: display?.name || "Unknown Display",
            displayOs: display?.os || "unknown",
            displayStatus: display?.status || "offline",
          };
        })
      );
      
      res.json(enrichedSessions);
    } catch (error) {
      console.error("Sessions fetch error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });
  
  // Get player session info
  app.get("/api/player/session/:displayId", async (req, res) => {
    try {
      const session = await storage.getPlayerSession(req.params.displayId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });
  
  // Delete player session
  app.delete("/api/player/session/:displayId", async (req, res) => {
    try {
      const deleted = await storage.deletePlayerSession(req.params.displayId);
      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Session deletion error:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });
  
  // Update player capabilities
  app.put("/api/player/capabilities/:displayId", async (req, res) => {
    try {
      const { displayId } = req.params;
      const validatedData = insertPlayerCapabilitiesSchema.partial().parse(req.body);
      
      const existing = await storage.getPlayerCapabilities(displayId);
      if (existing) {
        const updated = await storage.updatePlayerCapabilities(displayId, validatedData);
        res.json(updated);
      } else {
        const created = await storage.createPlayerCapabilities({
          displayId,
          ...validatedData,
        });
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Capabilities update error:", error);
      res.status(400).json({ error: "Invalid capabilities data" });
    }
  });
  
  // Cleanup expired pairing tokens (can be called periodically or via cron)
  app.post("/api/player/cleanup-tokens", async (_req, res) => {
    try {
      const count = await storage.cleanupExpiredTokens();
      res.json({ deletedCount: count });
    } catch (error) {
      res.status(500).json({ error: "Failed to cleanup tokens" });
    }
  });

  // Feature Set 2: Advanced Scheduling API Endpoints
  
  // Scheduling Rules endpoints
  app.post("/api/scheduling/rules", async (req, res) => {
    try {
      const validatedData = insertSchedulingRuleSchema.parse(req.body);
      const rule = await storage.createSchedulingRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Rule creation error:", error);
      res.status(400).json({ error: "Invalid rule data" });
    }
  });

  app.get("/api/scheduling/rules", async (_req, res) => {
    try {
      const rules = await storage.getAllSchedulingRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.get("/api/scheduling/rules/:id", async (req, res) => {
    try {
      const rule = await storage.getSchedulingRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rule" });
    }
  });

  app.get("/api/scheduling/rules/schedule/:scheduleId", async (req, res) => {
    try {
      const rules = await storage.getSchedulingRulesBySchedule(req.params.scheduleId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.put("/api/scheduling/rules/:id", async (req, res) => {
    try {
      const validatedData = insertSchedulingRuleSchema.partial().parse(req.body);
      const updated = await storage.updateSchedulingRule(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Rule update error:", error);
      res.status(400).json({ error: "Invalid rule data" });
    }
  });

  app.delete("/api/scheduling/rules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSchedulingRule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  // Conflict detection endpoint
  app.post("/api/scheduling/conflicts", async (req, res) => {
    try {
      const { targetType, targetId, currentDate } = req.body;
      
      if (!targetType || !targetId) {
        return res.status(400).json({ error: "targetType and targetId are required" });
      }
      
      const { schedulingEngine } = await import("./scheduling-engine");
      const conflicts = await schedulingEngine.detectConflicts(
        targetType,
        targetId,
        currentDate ? new Date(currentDate) : new Date()
      );
      
      res.json({ conflicts });
    } catch (error) {
      console.error("Conflict detection error:", error);
      res.status(500).json({ error: "Failed to detect conflicts" });
    }
  });

  // Timeline preview endpoint
  app.post("/api/scheduling/timeline", async (req, res) => {
    try {
      const { targetType, targetId, startDate, endDate, intervalMinutes } = req.body;
      
      if (!targetType || !targetId || !startDate || !endDate) {
        return res.status(400).json({ 
          error: "targetType, targetId, startDate, and endDate are required" 
        });
      }
      
      const { schedulingEngine } = await import("./scheduling-engine");
      const timeline = await schedulingEngine.getTimelinePreview(
        targetType,
        targetId,
        new Date(startDate),
        new Date(endDate),
        intervalMinutes || 60
      );
      
      res.json({ timeline });
    } catch (error) {
      console.error("Timeline preview error:", error);
      res.status(500).json({ error: "Failed to generate timeline" });
    }
  });

  // Content Priority endpoints
  app.post("/api/content/priorities", async (req, res) => {
    try {
      const validatedData = insertContentPrioritySchema.parse(req.body);
      const priority = await storage.createContentPriority(validatedData);
      res.status(201).json(priority);
    } catch (error) {
      console.error("Priority creation error:", error);
      res.status(400).json({ error: "Invalid priority data" });
    }
  });

  app.get("/api/content/priorities", async (_req, res) => {
    try {
      const priorities = await storage.getAllContentPriorities();
      res.json(priorities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priorities" });
    }
  });

  app.get("/api/content/priorities/:id", async (req, res) => {
    try {
      const priority = await storage.getContentPriority(req.params.id);
      if (!priority) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.json(priority);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priority" });
    }
  });

  app.put("/api/content/priorities/:id", async (req, res) => {
    try {
      const validatedData = insertContentPrioritySchema.partial().parse(req.body);
      const updated = await storage.updateContentPriority(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Priority update error:", error);
      res.status(400).json({ error: "Invalid priority data" });
    }
  });

  app.delete("/api/content/priorities/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContentPriority(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete priority" });
    }
  });

  // Transition endpoints
  app.post("/api/transitions", async (req, res) => {
    try {
      const validatedData = insertTransitionSchema.parse(req.body);
      const transition = await storage.createTransition(validatedData);
      res.status(201).json(transition);
    } catch (error) {
      console.error("Transition creation error:", error);
      res.status(400).json({ error: "Invalid transition data" });
    }
  });

  app.get("/api/transitions", async (_req, res) => {
    try {
      const transitions = await storage.getAllTransitions();
      res.json(transitions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transitions" });
    }
  });

  app.get("/api/transitions/:id", async (req, res) => {
    try {
      const transition = await storage.getTransition(req.params.id);
      if (!transition) {
        return res.status(404).json({ error: "Transition not found" });
      }
      res.json(transition);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transition" });
    }
  });

  app.put("/api/transitions/:id", async (req, res) => {
    try {
      const validatedData = insertTransitionSchema.partial().parse(req.body);
      const updated = await storage.updateTransition(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Transition not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Transition update error:", error);
      res.status(400).json({ error: "Invalid transition data" });
    }
  });

  app.delete("/api/transitions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTransition(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Transition not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transition" });
    }
  });
}
