import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import {
  insertDisplaySchema,
  insertContentItemSchema,
  insertDisplayGroupSchema,
  insertScheduleSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('WebSocket client connected. Total clients:', clients.size);
    
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to videoMOOD server'
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

  return httpServer;
}
