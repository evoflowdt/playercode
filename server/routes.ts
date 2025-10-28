import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
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
      const normalizedUrl = objectStorageService.normalizeObjectEntityPath(req.body.url);
      
      const validatedData = insertContentItemSchema.parse({
        ...req.body,
        url: normalizedUrl,
      });
      const item = await storage.createContentItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Content creation error:', error);
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
      res.status(201).json(schedule);
    } catch (error) {
      console.error('Schedule creation error:', error);
      res.status(400).json({ error: "Invalid schedule data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Schedule not found" });
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
      if (session) {
        await storage.updatePlayerSession(displayId, {
          lastHeartbeat: new Date(),
          currentContentId,
        });
      } else {
        // Create session if it doesn't exist
        await storage.createPlayerSession({
          displayId,
          currentContentId,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Heartbeat error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update heartbeat" });
    }
  });
  
  // Get content to display
  app.get("/api/player/content/:displayId", async (req, res) => {
    try {
      const { displayId } = req.params;
      
      const display = await storage.getDisplay(displayId);
      if (!display) {
        return res.status(404).json({ error: "Display not found" });
      }
      
      // Get active schedules for this display
      const allSchedules = await storage.getSchedulesWithDetails();
      const now = new Date();
      
      const activeSchedules = allSchedules.filter(schedule => {
        if (!schedule.active) return false;
        
        const isForThisDisplay = 
          (schedule.targetType === "display" && schedule.targetId === displayId) ||
          (schedule.targetType === "group" && display.groupId === schedule.targetId);
        
        if (!isForThisDisplay) return false;
        
        const startTime = new Date(schedule.startTime);
        const endTime = new Date(schedule.endTime);
        
        return now >= startTime && now <= endTime;
      });
      
      // Get content items from active schedules
      const contentIds = activeSchedules.map(s => s.contentId);
      const contentItems = await storage.getAllContentItems();
      const activeContent = contentItems.filter(item => contentIds.includes(item.id));
      
      res.json({
        display,
        content: activeContent,
        schedules: activeSchedules,
      });
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ error: "Failed to fetch content" });
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
}
