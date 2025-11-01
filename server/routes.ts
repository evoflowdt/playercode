import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./objectStorage";
import {
  insertDisplaySchema,
  insertContentItemSchema,
  insertDisplayGroupSchema,
  insertScheduleSchema,
  insertPlaylistSchema,
  insertPlaylistItemSchema,
  insertRadioStreamSchema,
  insertPairingTokenSchema,
  insertPlayerSessionSchema,
  insertPlayerCapabilitiesSchema,
  insertSchedulingRuleSchema,
  insertContentPrioritySchema,
  insertTransitionSchema,
  insertSyncGroupSchema,
  insertSyncGroupMemberSchema,
  insertSyncSessionSchema,
  insertOrganizationSchema,
  insertUserSchema,
  insertOrganizationMemberSchema,
  insertSessionSchema,
  insertApiKeySchema,
  insertWebhookSchema,
  insertNotificationSchema,
  insertResourcePermissionSchema,
  updateResourcePermissionSchema,
  insertContentTemplateSchema,
  updateContentTemplateSchema,
  insertTemplateApplicationSchema,
  bulkDeleteDisplaysSchema,
  bulkUpdateDisplaysSchema,
  bulkApplyTemplateSchema,
  bulkDeleteContentSchema,
  insertPlayerReleaseSchema,
  updatePlayerReleaseSchema,
  type User,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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
        
        // Display registration is handled via secure pairing flow (POST /api/player/pair)
        // NOT via WebSocket to prevent tenant spoofing
        if (message.type === 'display_status') {
          const display = await storage.getDisplayById(message.displayId);
          if (display) {
            const updated = await storage.updateDisplay(message.displayId, {
              status: message.status,
              lastSeen: new Date(),
            }, display.organizationId);
            if (updated) {
              broadcast({
                type: 'display_updated',
                data: updated
              });
            }
          }
        } else if (message.type === 'display_screenshot') {
          const display = await storage.getDisplayById(message.displayId);
          if (display) {
            const updated = await storage.updateDisplay(message.displayId, {
              screenshot: message.screenshot,
              lastSeen: new Date(),
            }, display.organizationId);
            if (updated) {
              broadcast({
                type: 'display_updated',
                data: updated
              });
            }
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

  // Authentication Middleware
  interface AuthRequest extends Request {
    user?: User;
    userId?: string;
    userRole?: string; // Role in current organization
  }

  async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: "Unauthorized - No token provided" });
      }

      const session = await storage.getSessionByToken(token);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized - Invalid or expired session" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized - User not found" });
      }

      // Get user's role in their default organization
      if (user.defaultOrganizationId) {
        const member = await storage.getOrganizationMember(user.id, user.defaultOrganizationId);
        (req as AuthRequest).userRole = member?.role || 'viewer';
      }

      (req as AuthRequest).user = user;
      (req as AuthRequest).userId = user.id;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  }

  // RBAC Middleware
  type Permission = 'read' | 'create' | 'update' | 'delete' | 'manage_users' | 'manage_organization';
  
  const rolePermissions: Record<string, Permission[]> = {
    owner: ['read', 'create', 'update', 'delete', 'manage_users', 'manage_organization'],
    admin: ['read', 'create', 'update', 'delete', 'manage_users'],
    editor: ['read', 'create', 'update', 'delete'],
    viewer: ['read'],
  };

  function requirePermission(...requiredPermissions: Permission[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthRequest;
      const userRole = authReq.userRole || 'viewer';
      const userPermissions = rolePermissions[userRole] || [];

      const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Forbidden - Insufficient permissions",
          required: requiredPermissions,
          role: userRole
        });
      }

      next();
    };
  }

  function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthRequest;
      const userRole = authReq.userRole || 'viewer';

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: "Forbidden - Insufficient role",
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    };
  }

  // Granular Permissions Middleware (Sprint 4 Feature 5)
  // This middleware checks both role-based AND resource-level permissions
  // Access is granted if EITHER the user's role has the permission OR they have granular permission on the resource
  function requireResourcePermission(resourceType: string, action: string, resourceIdParam: string = 'id') {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthRequest;
      const userId = authReq.userId;
      const organizationId = authReq.user?.defaultOrganizationId;
      const userRole = authReq.userRole || 'viewer';
      const resourceId = req.params[resourceIdParam];

      if (!userId || !organizationId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!resourceId) {
        return res.status(400).json({ error: `Missing resource ID parameter: ${resourceIdParam}` });
      }

      try {
        // Map actions to RBAC permissions
        const actionToPermission: Record<string, Permission> = {
          'view': 'read',
          'edit': 'update',
          'delete': 'delete',
          'manage': 'update',
        };

        const requiredRbacPermission = actionToPermission[action];
        const userPermissions = rolePermissions[userRole] || [];

        // Check 1: Does the user's role have the required permission?
        const hasRolePermission = requiredRbacPermission && userPermissions.includes(requiredRbacPermission);

        if (hasRolePermission) {
          // Role-based permission is sufficient
          return next();
        }

        // Check 2: Does the user have granular permission on this specific resource?
        const hasGranularPermission = await storage.checkResourcePermission(
          userId,
          organizationId,
          resourceType,
          resourceId,
          action
        );

        if (hasGranularPermission) {
          // Granular permission granted
          return next();
        }

        // Neither role nor granular permissions - deny access
        return res.status(403).json({
          error: "Forbidden - Insufficient permissions",
          required: { resourceType, resourceId, action },
          role: userRole
        });
      } catch (error) {
        console.error("Resource permission check error:", error);
        return res.status(500).json({ error: "Permission check failed" });
      }
    };
  }

  // Authentication Routes
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    organizationName: z.string().min(1),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(validated.password, 10);
      
      const slug = validated.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      let uniqueSlug = slug;
      let counter = 1;
      while (await storage.getOrganizationBySlug(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      
      const organization = await storage.createOrganization({
        name: validated.organizationName,
        slug: uniqueSlug,
        plan: "free",
        maxDisplays: 5,
      });

      const user = await storage.createUser({
        email: validated.email,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        defaultOrganizationId: organization.id,
      });

      await storage.createOrganizationMember({
        userId: user.id,
        organizationId: organization.id,
        role: "owner",
      });

      const sessionToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const session = await storage.createSession({
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        token: session.token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid registration data", details: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validated.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      const sessionToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const session = await storage.createSession({
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const userWithOrgs = await storage.getUserWithOrganizations(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          defaultOrganizationId: user.defaultOrganizationId,
        },
        organizations: userWithOrgs?.organizations || [],
        token: session.token,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid login data" });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        const session = await storage.getSessionByToken(token);
        if (session) {
          await storage.deleteSession(session.id);
        }
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userWithOrgs = await storage.getUserWithOrganizations(userId);
      if (!userWithOrgs) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: userWithOrgs.id,
          email: userWithOrgs.email,
          firstName: userWithOrgs.firstName,
          lastName: userWithOrgs.lastName,
          defaultOrganizationId: userWithOrgs.defaultOrganizationId,
        },
        organizations: userWithOrgs.organizations,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Helper function for creating audit logs
  async function createAuditLog(
    req: Request,
    organizationId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: string
  ): Promise<void> {
    try {
      await storage.createAuditLog({
        organizationId,
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  // ============================================
  // SPRINT 3 ROUTES - Team Management & Organization
  // ============================================

  // Team Management Routes
  app.get("/api/team", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const teamMembers = await storage.getTeamMembers(organizationId);
      res.json(teamMembers);
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.patch("/api/team/:userId/role", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const currentUserId = (req as AuthRequest).userId!;
      const targetUserId = req.params.userId;
      
      const roleSchema = z.object({
        role: z.enum(['owner', 'admin', 'editor', 'viewer']),
      });

      const validated = roleSchema.parse(req.body);
      
      const updated = await storage.updateMemberRole(targetUserId, organizationId, validated.role);
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }

      await createAuditLog(
        req,
        organizationId,
        currentUserId,
        'update_member_role',
        'user',
        targetUserId,
        JSON.stringify({ newRole: validated.role })
      );

      res.json(updated);
    } catch (error) {
      console.error("Update member role error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid role. Must be one of: owner, admin, editor, viewer" });
      }
      res.status(500).json({ error: "Failed to update member role" });
    }
  });

  app.delete("/api/team/:userId", requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const currentUserId = (req as AuthRequest).userId!;
      const targetUserId = req.params.userId;

      if (currentUserId === targetUserId) {
        return res.status(400).json({ error: "Cannot remove yourself from the organization" });
      }

      const teamMembers = await storage.getTeamMembers(organizationId);
      const owners = teamMembers.filter(m => m.role === 'owner');
      const targetMember = teamMembers.find(m => m.userId === targetUserId);

      if (targetMember?.role === 'owner' && owners.length === 1) {
        return res.status(400).json({ error: "Cannot remove the last owner of the organization" });
      }

      const deleted = await storage.removeMember(targetUserId, organizationId);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }

      await createAuditLog(
        req,
        organizationId,
        currentUserId,
        'remove_member',
        'user',
        targetUserId
      );

      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Invitation Routes
  app.post("/api/invitations", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const currentUserId = (req as AuthRequest).userId!;

      const invitationSchema = z.object({
        email: z.string().email(),
        role: z.enum(['owner', 'admin', 'editor', 'viewer']),
      });

      const validated = invitationSchema.parse(req.body);

      const teamMembers = await storage.getTeamMembers(organizationId);
      const existingMember = teamMembers.find(m => m.userEmail === validated.email);
      if (existingMember) {
        return res.status(400).json({ error: "User is already a member of this organization" });
      }

      const token = randomBytes(12).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitation = await storage.createInvitation({
        email: validated.email,
        organizationId,
        role: validated.role,
        token,
        invitedBy: currentUserId,
        expiresAt,
      });

      await createAuditLog(
        req,
        organizationId,
        currentUserId,
        'invite_member',
        'invitation',
        invitation.id,
        JSON.stringify({ email: validated.email, role: validated.role })
      );

      res.status(201).json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      console.error("Create invitation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid invitation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  app.get("/api/invitations", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const invitations = await storage.getPendingInvitations(organizationId);
      res.json(invitations);
    } catch (error) {
      console.error("Get invitations error:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.delete("/api/invitations/:id", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const currentUserId = (req as AuthRequest).userId!;
      const invitationId = req.params.id;

      const deleted = await storage.revokeInvitation(invitationId, organizationId);
      if (!deleted) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await createAuditLog(
        req,
        organizationId,
        currentUserId,
        'revoke_invitation',
        'invitation',
        invitationId
      );

      res.json({ message: "Invitation revoked successfully" });
    } catch (error) {
      console.error("Revoke invitation error:", error);
      res.status(500).json({ error: "Failed to revoke invitation" });
    }
  });

  app.post("/api/invitations/accept/:token", requireAuth, async (req, res) => {
    try {
      const token = req.params.token;
      const currentUserId = (req as AuthRequest).userId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Must be logged in to accept invitation" });
      }

      const invitation = await storage.getInvitation(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.accepted) {
        return res.status(400).json({ error: "Invitation has already been accepted" });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invitation has expired" });
      }

      const accepted = await storage.acceptInvitation(token, currentUserId);
      if (!accepted) {
        return res.status(400).json({ error: "Failed to accept invitation" });
      }

      const organization = await storage.getOrganization(invitation.organizationId);

      res.json({
        message: "Invitation accepted successfully",
        organization: {
          id: organization?.id,
          name: organization?.name,
          slug: organization?.slug,
        },
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Organization Settings Routes
  app.get("/api/organization", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Get organization error:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.patch("/api/organization", requireAuth, requirePermission('manage_organization'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const currentUserId = (req as AuthRequest).userId!;

      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        settings: z.string().optional(),
        plan: z.enum(['free', 'pro', 'enterprise']).optional(),
        maxDisplays: z.number().int().positive().optional(),
      });

      const validated = updateSchema.parse(req.body);

      const updated = await storage.updateOrganization(organizationId, validated);
      if (!updated) {
        return res.status(404).json({ error: "Organization not found" });
      }

      await createAuditLog(
        req,
        organizationId,
        currentUserId,
        'update_organization',
        'organization',
        organizationId,
        JSON.stringify(validated)
      );

      res.json(updated);
    } catch (error) {
      console.error("Update organization error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid organization data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  // Audit Logs Routes
  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.defaultOrganizationId!;
      const userRole = authReq.userRole || 'viewer';
      const userPermissions = rolePermissions[userRole] || [];

      const hasPermission = userPermissions.includes('manage_users') || 
                           userPermissions.includes('manage_organization');
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Forbidden - Requires manage_users or manage_organization permission"
        });
      }

      const querySchema = z.object({
        userId: z.string().optional(),
        action: z.string().optional(),
        resourceType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      });

      const validated = querySchema.parse(req.query);

      const filters: any = {};
      if (validated.userId) filters.userId = validated.userId;
      if (validated.action) filters.action = validated.action;
      if (validated.resourceType) filters.resourceType = validated.resourceType;
      if (validated.startDate) filters.startDate = new Date(validated.startDate);
      if (validated.endDate) filters.endDate = new Date(validated.endDate);

      const limit = validated.limit ? parseInt(validated.limit) : 100;
      const offset = validated.offset ? parseInt(validated.offset) : 0;

      const allLogs = await storage.getAuditLogs(organizationId, filters);
      const total = allLogs.length;
      const logs = allLogs.slice(offset, offset + limit);

      res.json({ logs, total });
    } catch (error) {
      console.error("Get audit logs error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid query parameters" });
      }
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // ============================================
  // END SPRINT 3 ROUTES
  // ============================================

  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const stats = await storage.getDashboardStats(organizationId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ============================================
  // SPRINT 4: ADVANCED ANALYTICS ROUTES
  // ============================================

  app.get("/api/analytics/advanced", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAdvancedAnalytics(organizationId, start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Get advanced analytics error:", error);
      res.status(500).json({ error: "Failed to fetch advanced analytics" });
    }
  });

  app.get("/api/analytics/export", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const { format = 'json', startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAdvancedAnalytics(organizationId, start, end);
      
      if (format === 'csv') {
        // Convert to CSV format
        let csv = 'Type,Name,Value1,Value2,Value3\n';
        
        // Display Uptime
        analytics.displayUptime.forEach(d => {
          csv += `Display Uptime,${d.displayName},${d.uptimePercentage.toFixed(2)}%,${d.totalOnlineTime},${d.totalOfflineTime}\n`;
        });
        
        // Content Popularity
        analytics.contentPopularity.forEach(c => {
          csv += `Content Popularity,${c.contentName},${c.viewCount},${c.totalViewTime},-\n`;
        });
        
        // Schedule Performance
        analytics.schedulePerformance.forEach(s => {
          csv += `Schedule Performance,${s.scheduleName},${s.successRate.toFixed(2)}%,${s.successCount},${s.failedCount}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString()}.csv"`);
        res.send(csv);
      } else {
        res.json(analytics);
      }
    } catch (error) {
      console.error("Export analytics error:", error);
      res.status(500).json({ error: "Failed to export analytics" });
    }
  });

  // ============================================
  // END SPRINT 4: ADVANCED ANALYTICS ROUTES
  // ============================================

  // ============================================
  // SPRINT 4: API KEYS & WEBHOOKS ROUTES
  // ============================================

  // API Keys
  app.post("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;
      const { name, expiresAt } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const apiKey = await storage.createApiKey(
        organizationId,
        userId,
        name,
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.status(201).json(apiKey);
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const apiKeys = await storage.listApiKeys(organizationId);
      res.json(apiKeys);
    } catch (error) {
      console.error("List API keys error:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      await storage.revokeApiKey(req.params.id, organizationId);
      res.status(204).send();
    } catch (error) {
      console.error("Revoke API key error:", error);
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  });

  // Webhooks
  app.post("/api/webhooks", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;
      const { name, url, events } = req.body;

      if (!name || !url || !events || !Array.isArray(events)) {
        return res.status(400).json({ error: "Name, URL, and events are required" });
      }

      const webhook = await storage.createWebhook(organizationId, userId, name, url, events);
      res.status(201).json(webhook);
    } catch (error) {
      console.error("Create webhook error:", error);
      res.status(500).json({ error: "Failed to create webhook" });
    }
  });

  app.get("/api/webhooks", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const webhooks = await storage.listWebhooks(organizationId);
      res.json(webhooks);
    } catch (error) {
      console.error("List webhooks error:", error);
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  });

  app.patch("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const { name, url, events, active } = req.body;

      const webhook = await storage.updateWebhook(req.params.id, organizationId, {
        name,
        url,
        events,
        active,
      });

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      res.json(webhook);
    } catch (error) {
      console.error("Update webhook error:", error);
      res.status(500).json({ error: "Failed to update webhook" });
    }
  });

  app.delete("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      await storage.deleteWebhook(req.params.id, organizationId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete webhook error:", error);
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  app.get("/api/webhooks/:id/events", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await storage.listWebhookEvents(req.params.id, organizationId, limit);
      res.json(events);
    } catch (error) {
      console.error("List webhook events error:", error);
      res.status(500).json({ error: "Failed to fetch webhook events" });
    }
  });

  app.post("/api/webhooks/:id/test", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const testPayload = {
        event: "webhook.test",
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test webhook event from EvoFlow",
        },
      };

      await storage.triggerWebhookEvent("webhook.test", organizationId, testPayload);
      res.json({ message: "Test webhook triggered successfully" });
    } catch (error) {
      console.error("Test webhook error:", error);
      res.status(500).json({ error: "Failed to test webhook" });
    }
  });

  // ============================================
  // END SPRINT 4: API KEYS & WEBHOOKS ROUTES
  // ============================================

  app.get("/api/displays-with-groups", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const displaysWithGroups = await storage.getDisplaysWithGroups(organizationId);
      res.json(displaysWithGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch displays with groups" });
    }
  });

  app.get("/api/displays", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const displays = await storage.getAllDisplays(organizationId);
      res.json(displays);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch displays" });
    }
  });

  app.get("/api/displays/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const display = await storage.getDisplay(req.params.id, organizationId);
      if (!display) {
        return res.status(404).json({ error: "Display not found" });
      }
      res.json(display);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch display" });
    }
  });

  app.post("/api/displays", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const result = insertDisplaySchema.safeParse(req.body);
      if (!result.success) {
        console.error("Display validation error:", fromZodError(result.error).message);
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const display = await storage.createDisplay(result.data, organizationId);
      broadcast({
        type: 'display_added',
        data: display
      });
      res.status(201).json(display);
    } catch (error) {
      console.error("Create display error:", error);
      res.status(500).json({ error: "Failed to create display" });
    }
  });

  app.patch("/api/displays/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const updated = await storage.updateDisplay(req.params.id, req.body, organizationId);
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

  app.delete("/api/displays/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const deleted = await storage.deleteDisplay(req.params.id, organizationId);
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

  app.get("/api/content", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const items = await storage.getAllContentItems(organizationId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/content/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const item = await storage.getContentItem(req.params.id, organizationId);
      if (!item) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/content", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
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
      const item = await storage.createContentItem(validatedData, organizationId);
      res.status(201).json(item);
    } catch (error) {
      console.error('Content creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
      }
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.patch("/api/content/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const updated = await storage.updateContentItem(req.params.id, req.body, organizationId);
      if (!updated) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  app.delete("/api/content/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const deleted = await storage.deleteContentItem(req.params.id, organizationId);
      if (!deleted) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const groups = await storage.getAllDisplayGroups(organizationId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const group = await storage.getDisplayGroup(req.params.id, organizationId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const validatedData = insertDisplayGroupSchema.parse(req.body);
      const group = await storage.createDisplayGroup(validatedData, organizationId);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  app.patch("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const updated = await storage.updateDisplayGroup(req.params.id, req.body, organizationId);
      if (!updated) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const deleted = await storage.deleteDisplayGroup(req.params.id, organizationId);
      if (!deleted) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  app.get("/api/schedules", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const schedules = await storage.getSchedulesWithDetails(organizationId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.get("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const schedule = await storage.getSchedule(req.params.id, organizationId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  app.post("/api/schedules", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      console.log('Schedule request body:', req.body);
      
      const scheduleData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };
      
      console.log('Processed schedule data:', scheduleData);
      const validatedData = insertScheduleSchema.parse(scheduleData);
      const schedule = await storage.createSchedule(validatedData, organizationId);
      
      // Notify affected displays via WebSocket
      if (schedule.targetType === 'display') {
        const display = await storage.getDisplay(schedule.targetId, organizationId);
        if (display) {
          broadcast({
            type: 'display_updated',
            data: display
          });
        }
      } else if (schedule.targetType === 'group') {
        const allDisplays = await storage.getDisplaysWithGroups(organizationId);
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

  app.patch("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      console.log('Schedule update request body:', req.body);
      
      // Get the existing schedule first to compare targetType/targetId changes
      const existingSchedule = await storage.getSchedule(req.params.id, organizationId);
      if (!existingSchedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      // Process the update data, converting dates if present
      const updateData: any = { ...req.body };
      if (updateData.startTime) {
        updateData.startTime = new Date(updateData.startTime);
      }
      if (updateData.endTime) {
        updateData.endTime = new Date(updateData.endTime);
      }
      
      console.log('Processed update data:', updateData);
      
      // Update the schedule
      const updated = await storage.updateSchedule(req.params.id, updateData, organizationId);
      if (!updated) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      // Notify affected displays via WebSocket
      // Notify old target if it changed
      if (existingSchedule.targetType === 'display' && 
          (existingSchedule.targetId !== updated.targetId || existingSchedule.targetType !== updated.targetType)) {
        const oldDisplay = await storage.getDisplay(existingSchedule.targetId, organizationId);
        if (oldDisplay) {
          broadcast({
            type: 'display_updated',
            data: oldDisplay
          });
        }
      } else if (existingSchedule.targetType === 'group' && 
                 (existingSchedule.targetId !== updated.targetId || existingSchedule.targetType !== updated.targetType)) {
        const allDisplays = await storage.getDisplaysWithGroups(organizationId);
        const oldGroupDisplays = allDisplays.filter(d => d.groupId === existingSchedule.targetId);
        oldGroupDisplays.forEach((display: typeof allDisplays[0]) => {
          broadcast({
            type: 'display_updated',
            data: display
          });
        });
      }
      
      // Notify new target
      if (updated.targetType === 'display') {
        const display = await storage.getDisplay(updated.targetId, organizationId);
        if (display) {
          broadcast({
            type: 'display_updated',
            data: display
          });
        }
      } else if (updated.targetType === 'group') {
        const allDisplays = await storage.getDisplaysWithGroups(organizationId);
        const groupDisplays = allDisplays.filter(d => d.groupId === updated.targetId);
        groupDisplays.forEach((display: typeof allDisplays[0]) => {
          broadcast({
            type: 'display_updated',
            data: display
          });
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Schedule update error:', error);
      res.status(400).json({ error: "Invalid schedule data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const schedule = await storage.getSchedule(req.params.id, organizationId);
      const deleted = await storage.deleteSchedule(req.params.id, organizationId);
      if (!deleted) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      // Notify affected displays via WebSocket
      if (schedule) {
        if (schedule.targetType === 'display') {
          const display = await storage.getDisplay(schedule.targetId, organizationId);
          if (display) {
            broadcast({
              type: 'display_updated',
              data: display
            });
          }
        } else if (schedule.targetType === 'group') {
          const allDisplays = await storage.getDisplaysWithGroups(organizationId);
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

  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/api/playlists", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const playlists = await storage.getAllPlaylistsWithItems(organizationId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.get("/api/playlists/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const playlist = await storage.getPlaylistWithItems(req.params.id, organizationId);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  app.post("/api/playlists", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData, organizationId);
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Playlist creation error:", error);
      res.status(400).json({ error: "Invalid playlist data" });
    }
  });

  app.patch("/api/playlists/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const updated = await storage.updatePlaylist(req.params.id, req.body, organizationId);
      if (!updated) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update playlist" });
    }
  });

  app.delete("/api/playlists/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const deleted = await storage.deletePlaylist(req.params.id, organizationId);
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

  app.patch("/api/playlists/:id/items/reorder", async (req, res) => {
    try {
      const playlistId = req.params.id;
      const { itemIds } = req.body;
      
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ error: "itemIds must be an array" });
      }
      
      await storage.reorderPlaylistItems(playlistId, itemIds);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Reorder items error:", error);
      res.status(500).json({ error: "Failed to reorder items" });
    }
  });

  // Radio Stream Routes
  app.get("/api/radio-streams", async (_req, res) => {
    try {
      const streams = await storage.getAllRadioStreams();
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch radio streams" });
    }
  });

  app.get("/api/radio-streams/playlist/:playlistId", async (req, res) => {
    try {
      const streams = await storage.getRadioStreamsByPlaylist(req.params.playlistId);
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch radio streams" });
    }
  });

  app.post("/api/radio-streams", async (req, res) => {
    try {
      const validatedData = insertRadioStreamSchema.parse(req.body);
      const stream = await storage.createRadioStream(validatedData);
      res.status(201).json(stream);
    } catch (error) {
      console.error("Create radio stream error:", error);
      res.status(400).json({ error: "Invalid radio stream data" });
    }
  });

  app.patch("/api/radio-streams/:id", async (req, res) => {
    try {
      const updated = await storage.updateRadioStream(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Radio stream not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update radio stream" });
    }
  });

  app.delete("/api/radio-streams/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRadioStream(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Radio stream not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete radio stream" });
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
  app.post("/api/player/pairing-token", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const validated = pairingTokenRequestSchema.parse(req.body);
      
      // Generate cryptographically secure token
      const token = randomBytes(6).toString('hex').toUpperCase();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      const pairingToken = await storage.createPairingToken({
        token,
        displayName: validated.displayName,
        os: validated.os,
        expiresAt,
        organizationId,
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
      }, pairingToken.organizationId);
      
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
      
      // Notify connected clients about the new display
      broadcast({
        type: 'display_added',
        data: display
      });
      
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
      const display = await storage.getDisplayById(displayId);
      if (!display) {
        return res.status(404).json({ error: "Display not found" });
      }
      
      // Update display status
      await storage.updateDisplay(displayId, {
        status: status || "online",
        lastSeen: new Date(),
      }, display.organizationId);
      
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
      
      const display = await storage.getDisplayById(displayId);
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
      
      // Get the schedule details
      const schedule = await storage.getSchedule(scheduledContent.scheduleId, display.organizationId);
      if (!schedule) {
        return res.json({
          display,
          content: [],
          schedules: [],
        });
      }

      let contentItems: any[] = [];
      let radioStreams: any[] = [];

      // Check if this schedule has a playlist or single content
      if (schedule.playlistId) {
        // Expand playlist into array of content items
        const playlistWithItems = await storage.getPlaylistWithItems(schedule.playlistId, display.organizationId);
        if (playlistWithItems && playlistWithItems.items.length > 0) {
          // Get all content items from playlist in order
          for (const item of playlistWithItems.items) {
            const contentItem = await storage.getContentItemById(item.contentId);
            if (contentItem) {
              // Convert internal object path to public URL
              let contentWithUrl = { ...contentItem };
              if (contentItem.url && contentItem.url.startsWith('/objects/')) {
                const publicPath = contentItem.url.replace('/objects/', '/public-objects/');
                contentWithUrl.url = publicPath;
              }
              // Add custom duration if specified in playlist
              if (item.duration) {
                contentWithUrl.duration = item.duration;
              }
              contentItems.push(contentWithUrl);
            }
          }
        }
        
        // Fetch radio streams for this playlist
        const streams = await storage.getRadioStreamsByPlaylist(schedule.playlistId);
        radioStreams = streams.filter(s => s.active);
      } else if (schedule.contentId) {
        // Single content item
        const contentItem = await storage.getContentItemById(schedule.contentId);
        if (contentItem) {
          // Convert internal object path to public URL
          let contentWithUrl = { ...contentItem };
          if (contentItem.url && contentItem.url.startsWith('/objects/')) {
            const publicPath = contentItem.url.replace('/objects/', '/public-objects/');
            contentWithUrl.url = publicPath;
          }
          contentItems.push(contentWithUrl);
        }
      }
      
      const response = {
        display,
        content: contentItems,
        radioStreams: radioStreams,
        schedules: [schedule],
        priority: scheduledContent.priority,
        source: scheduledContent.source,
      };
      
      console.log("[PlayerContent] Sending to player:");
      console.log("[PlayerContent] Display:", display.name);
      console.log("[PlayerContent] Content items count:", contentItems.length);
      console.log("[PlayerContent] Radio streams count:", radioStreams.length);
      if (radioStreams.length > 0) {
        console.log("[PlayerContent] Radio streams:", radioStreams.map(s => ({ name: s.name, url: s.url, active: s.active })));
      }
      
      res.json(response);
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });
  
  // Get all player sessions (filtered by organization)
  app.get("/api/player/sessions", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const sessions = await storage.getPlayerSessionsByOrganization(organizationId);
      
      // Enrich sessions with display information
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          const display = await storage.getDisplayById(session.displayId);
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
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const validatedData = insertSchedulingRuleSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      const rule = await storage.createSchedulingRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Rule creation error:", error);
      res.status(400).json({ error: "Invalid rule data" });
    }
  });

  app.get("/api/scheduling/rules", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const rules = await storage.getAllSchedulingRules(req.user.organizationId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.get("/api/scheduling/rules/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const rule = await storage.getSchedulingRule(req.params.id, req.user.organizationId);
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
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const rules = await storage.getSchedulingRulesBySchedule(req.params.scheduleId, req.user.organizationId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.put("/api/scheduling/rules/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const validatedData = insertSchedulingRuleSchema.omit({ organizationId: true }).partial().parse(req.body);
      const updated = await storage.updateSchedulingRule(req.params.id, validatedData, req.user.organizationId);
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
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const deleted = await storage.deleteSchedulingRule(req.params.id, req.user.organizationId);
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
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { targetType, targetId, currentDate } = req.body;
      
      if (!targetType || !targetId) {
        return res.status(400).json({ error: "targetType and targetId are required" });
      }
      
      const { schedulingEngine } = await import("./scheduling-engine");
      const conflicts = await schedulingEngine.detectConflicts(
        targetType,
        targetId,
        req.user.organizationId,
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
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
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
        req.user.organizationId,
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

  // Sync Group endpoints
  app.get("/api/sync-groups", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const groups = await storage.getAllSyncGroupsWithMembers(organizationId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync groups" });
    }
  });

  app.get("/api/sync-groups/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const group = await storage.getSyncGroupWithMembers(req.params.id, organizationId);
      if (!group) {
        return res.status(404).json({ error: "Sync group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync group" });
    }
  });

  app.post("/api/sync-groups", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const validatedData = insertSyncGroupSchema.parse(req.body);
      const group = await storage.createSyncGroup(validatedData, organizationId);
      res.status(201).json(group);
    } catch (error) {
      console.error("Sync group creation error:", error);
      res.status(400).json({ error: "Invalid sync group data" });
    }
  });

  app.patch("/api/sync-groups/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const validatedData = insertSyncGroupSchema.partial().parse(req.body);
      const updated = await storage.updateSyncGroup(req.params.id, validatedData, organizationId);
      if (!updated) {
        return res.status(404).json({ error: "Sync group not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Sync group update error:", error);
      res.status(400).json({ error: "Invalid sync group data" });
    }
  });

  app.delete("/api/sync-groups/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const deleted = await storage.deleteSyncGroup(req.params.id, organizationId);
      if (!deleted) {
        return res.status(404).json({ error: "Sync group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sync group" });
    }
  });

  app.post("/api/sync-groups/:id/members", async (req, res) => {
    try {
      const validatedData = insertSyncGroupMemberSchema.parse({
        ...req.body,
        syncGroupId: req.params.id,
      });
      const member = await storage.addMemberToSyncGroup(validatedData);
      broadcast({
        type: "sync_group_member_added",
        data: member,
      });
      res.status(201).json(member);
    } catch (error) {
      console.error("Member addition error:", error);
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.delete("/api/sync-groups/:groupId/members/:memberId", async (req, res) => {
    try {
      const deleted = await storage.removeMemberFromSyncGroup(req.params.memberId);
      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }
      broadcast({
        type: "sync_group_member_removed",
        data: { memberId: req.params.memberId, syncGroupId: req.params.groupId },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // Sync Session endpoints
  app.get("/api/sync-sessions", async (_req, res) => {
    try {
      const sessions = await storage.getAllSyncSessionsWithDetails();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync sessions" });
    }
  });

  app.get("/api/sync-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSyncSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Sync session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync session" });
    }
  });

  app.post("/api/sync-sessions", async (req, res) => {
    try {
      const validatedData = insertSyncSessionSchema.parse(req.body);
      const session = await storage.createSyncSession(validatedData);
      
      broadcast({
        type: "sync_session_created",
        data: session,
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Sync session creation error:", error);
      res.status(400).json({ error: "Invalid sync session data" });
    }
  });

  app.put("/api/sync-sessions/:id", async (req, res) => {
    try {
      const validatedData = insertSyncSessionSchema.partial().parse(req.body);
      const updated = await storage.updateSyncSession(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Sync session not found" });
      }
      
      broadcast({
        type: "sync_session_updated",
        data: updated,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Sync session update error:", error);
      res.status(400).json({ error: "Invalid sync session data" });
    }
  });

  app.delete("/api/sync-sessions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSyncSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Sync session not found" });
      }
      
      broadcast({
        type: "sync_session_deleted",
        data: { id: req.params.id },
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sync session" });
    }
  });

  // Sync control endpoints - for controlling playback across sync groups
  app.post("/api/sync-control/:syncGroupId/play", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const { contentId, playlistId } = req.body;
      const syncGroup = await storage.getSyncGroup(req.params.syncGroupId, organizationId);
      
      if (!syncGroup) {
        return res.status(404).json({ error: "Sync group not found" });
      }

      let session = await storage.getSyncSessionByGroup(req.params.syncGroupId);
      if (!session) {
        session = await storage.createSyncSession({
          syncGroupId: req.params.syncGroupId,
          contentId,
          playlistId,
          status: "playing",
          currentPosition: 0,
          startedAt: new Date(),
        });
      } else {
        session = await storage.updateSyncSession(session.id, {
          contentId,
          playlistId,
          status: "playing",
          currentPosition: 0,
          startedAt: new Date(),
        });
      }

      broadcast({
        type: "sync_play",
        data: {
          syncGroupId: req.params.syncGroupId,
          session,
        },
      });

      res.json(session);
    } catch (error) {
      console.error("Sync play error:", error);
      res.status(500).json({ error: "Failed to start sync playback" });
    }
  });

  app.post("/api/sync-control/:syncGroupId/pause", async (req, res) => {
    try {
      const session = await storage.getSyncSessionByGroup(req.params.syncGroupId);
      if (!session) {
        return res.status(404).json({ error: "No active session" });
      }

      const updated = await storage.updateSyncSession(session.id, {
        status: "paused",
      });

      broadcast({
        type: "sync_pause",
        data: {
          syncGroupId: req.params.syncGroupId,
          session: updated,
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to pause sync playback" });
    }
  });

  app.post("/api/sync-control/:syncGroupId/resume", async (req, res) => {
    try {
      const session = await storage.getSyncSessionByGroup(req.params.syncGroupId);
      if (!session) {
        return res.status(404).json({ error: "No active session" });
      }

      const updated = await storage.updateSyncSession(session.id, {
        status: "playing",
      });

      broadcast({
        type: "sync_resume",
        data: {
          syncGroupId: req.params.syncGroupId,
          session: updated,
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to resume sync playback" });
    }
  });

  app.post("/api/sync-control/:syncGroupId/stop", async (req, res) => {
    try {
      const session = await storage.getSyncSessionByGroup(req.params.syncGroupId);
      if (!session) {
        return res.status(404).json({ error: "No active session" });
      }

      const updated = await storage.updateSyncSession(session.id, {
        status: "stopped",
        currentPosition: 0,
      });

      broadcast({
        type: "sync_stop",
        data: {
          syncGroupId: req.params.syncGroupId,
          session: updated,
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop sync playback" });
    }
  });

  app.post("/api/sync-control/:syncGroupId/seek", async (req, res) => {
    try {
      const { position } = req.body;
      const session = await storage.getSyncSessionByGroup(req.params.syncGroupId);
      if (!session) {
        return res.status(404).json({ error: "No active session" });
      }

      const updated = await storage.updateSyncSession(session.id, {
        currentPosition: position,
      });

      broadcast({
        type: "sync_seek",
        data: {
          syncGroupId: req.params.syncGroupId,
          session: updated,
          position,
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to seek sync playback" });
    }
  });

  // API Keys & Webhooks routes (Sprint 4)
  app.post("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;
      
      const validatedData = insertApiKeySchema.parse({
        organizationId,
        createdBy: userId,
        ...req.body,
      });

      const apiKey = await storage.createApiKey(
        organizationId,
        userId,
        validatedData.name,
        validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
      );

      res.status(201).json(apiKey);
    } catch (error) {
      console.error("API key creation error:", error);
      res.status(400).json({ error: "Invalid API key data" });
    }
  });

  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const keys = await storage.listApiKeys(organizationId);
      res.json(keys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      await storage.revokeApiKey(req.params.id, organizationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  });

  app.post("/api/webhooks", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;
      
      const validatedData = insertWebhookSchema.parse({
        organizationId,
        createdBy: userId,
        ...req.body,
      });

      const webhook = await storage.createWebhook(
        organizationId,
        userId,
        validatedData.name,
        validatedData.url,
        validatedData.events
      );

      res.status(201).json(webhook);
    } catch (error) {
      console.error("Webhook creation error:", error);
      res.status(400).json({ error: "Invalid webhook data" });
    }
  });

  app.get("/api/webhooks", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const webhooks = await storage.listWebhooks(organizationId);
      res.json(webhooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  });

  app.patch("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      
      const validatedData = insertWebhookSchema.partial().parse(req.body);

      const webhook = await storage.updateWebhook(req.params.id, organizationId, {
        name: validatedData.name,
        url: validatedData.url,
        events: validatedData.events,
        active: validatedData.active,
      });

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      res.json(webhook);
    } catch (error) {
      console.error("Webhook update error:", error);
      res.status(400).json({ error: "Invalid webhook data" });
    }
  });

  app.delete("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      await storage.deleteWebhook(req.params.id, organizationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  app.post("/api/webhooks/:id/test", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const webhook = await storage.getWebhookById(req.params.id, organizationId);

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      // Create test event
      const event = await storage.createWebhookEvent(
        webhook.id,
        organizationId,
        "test.event",
        { message: "This is a test webhook event" }
      );

      // Send test webhook asynchronously
      storage.sendWebhook(webhook, event).catch(err => {
        console.error(`Failed to send test webhook ${webhook.id}:`, err);
      });

      res.json({ success: true, eventId: event.id });
    } catch (error) {
      console.error("Test webhook error:", error);
      res.status(500).json({ error: "Failed to send test webhook" });
    }
  });

  app.get("/api/webhooks/:id/events", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const events = await storage.listWebhookEvents(req.params.id, organizationId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhook events" });
    }
  });

  // Notification routes (Sprint 4)
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const notifications = await storage.listNotifications(organizationId, userId, {
        unreadOnly,
        limit,
      });

      res.json(notifications);
    } catch (error) {
      console.error("List notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;

      const count = await storage.getUnreadCount(organizationId, userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;
      const parsed = insertNotificationSchema.parse(req.body);

      // Enforce organizationId and userId from authenticated user (prevent forgery)
      if (parsed.organizationId !== organizationId) {
        return res.status(403).json({ error: "Cannot create notifications for other organizations" });
      }
      if (parsed.userId !== userId) {
        return res.status(403).json({ error: "Cannot create notifications for other users" });
      }

      const notification = await storage.createNotification(parsed);

      // Broadcast generic notification event (no payload for security)
      // Each client will invalidate queries and fetch only their own notifications
      broadcast({
        type: 'notification_created'
      });

      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid notification data", details: error.errors });
      }
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;

      const notification = await storage.markNotificationAsRead(
        req.params.id,
        organizationId,
        userId
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;

      const count = await storage.markAllAsRead(organizationId, userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const userId = (req as AuthRequest).user!.id;

      const deleted = await storage.deleteNotification(
        req.params.id,
        organizationId,
        userId
      );

      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Granular Permissions routes (Sprint 4 Feature 5)
  app.post("/api/permissions", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const currentUserId = (req as AuthRequest).userId!;
      const parsed = insertResourcePermissionSchema.parse(req.body);

      // Enforce organizationId from authenticated user
      if (parsed.organizationId !== organizationId) {
        return res.status(403).json({ error: "Cannot create permissions for other organizations" });
      }

      // Set createdBy to current user
      const permission = await storage.createResourcePermission({
        ...parsed,
        createdBy: currentUserId,
      });

      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid permission data", details: error.errors });
      }
      console.error("Create permission error:", error);
      res.status(500).json({ error: "Failed to create permission" });
    }
  });

  app.get("/api/permissions", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const filters = {
        userId: req.query.userId as string | undefined,
        resourceType: req.query.resourceType as string | undefined,
        resourceId: req.query.resourceId as string | undefined,
      };

      const permissions = await storage.listResourcePermissions(organizationId, filters);
      res.json(permissions);
    } catch (error) {
      console.error("List permissions error:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/user/:userId", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const targetUserId = req.params.userId;
      const resourceType = req.query.resourceType as string | undefined;

      const permissions = await storage.getUserResourcePermissions(targetUserId, organizationId, resourceType);
      res.json(permissions);
    } catch (error) {
      console.error("Get user permissions error:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.patch("/api/permissions/:id", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const parsed = updateResourcePermissionSchema.parse(req.body);

      const updated = await storage.updateResourcePermission(req.params.id, organizationId, parsed);

      if (!updated) {
        return res.status(404).json({ error: "Permission not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid permission data", details: error.errors });
      }
      console.error("Update permission error:", error);
      res.status(500).json({ error: "Failed to update permission" });
    }
  });

  app.delete("/api/permissions/:id", requireAuth, requirePermission('manage_users'), async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;

      const deleted = await storage.deleteResourcePermission(req.params.id, organizationId);

      if (!deleted) {
        return res.status(404).json({ error: "Permission not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete permission error:", error);
      res.status(500).json({ error: "Failed to delete permission" });
    }
  });

  // ============================================================
  // Sprint 5.1: Content Templates Routes
  // ============================================================

  app.post("/api/templates", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user!;
      const organizationId = user.defaultOrganizationId!;
      const userId = user.id;

      const parsed = insertContentTemplateSchema.parse(req.body);
      
      const template = await storage.createContentTemplate({
        ...parsed,
        organizationId,
        createdBy: userId,
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid template data", details: error.errors });
      }
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const type = req.query.type as string | undefined;
      const isPublic = req.query.isPublic ? req.query.isPublic === 'true' : undefined;

      const templates = await storage.listContentTemplates(organizationId, { type, isPublic });
      res.json(templates);
    } catch (error) {
      console.error("List templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const template = await storage.getContentTemplate(req.params.id, organizationId);

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.patch("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const parsed = updateContentTemplateSchema.parse(req.body);

      const updated = await storage.updateContentTemplate(req.params.id, organizationId, parsed);

      if (!updated) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid template data", details: error.errors });
      }
      console.error("Update template error:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const deleted = await storage.deleteContentTemplate(req.params.id, organizationId);

      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.post("/api/templates/:id/apply", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user!;
      const organizationId = user.defaultOrganizationId!;
      const userId = user.id;
      const templateId = req.params.id;

      const { displayId } = req.body;
      
      if (!displayId) {
        return res.status(400).json({ error: "displayId is required" });
      }

      // Validate template belongs to organization
      const template = await storage.getContentTemplate(templateId, organizationId);
      if (!template) {
        return res.status(404).json({ error: "Template not found or access denied" });
      }

      // Validate display belongs to same organization
      const display = await storage.getDisplay(displayId, organizationId);
      if (!display) {
        return res.status(404).json({ error: "Display not found or access denied" });
      }

      // Ensure display belongs to the same organization as the template
      if (display.organizationId !== organizationId) {
        return res.status(403).json({ error: "Cannot apply template to display from different organization" });
      }

      const application = await storage.applyTemplateToDisplay({
        templateId,
        displayId,
        appliedBy: userId,
        organizationId,
      });

      res.status(201).json(application);
    } catch (error) {
      console.error("Apply template error:", error);
      res.status(500).json({ error: "Failed to apply template" });
    }
  });

  app.get("/api/templates/applications", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      const templateId = req.query.templateId as string | undefined;
      const displayId = req.query.displayId as string | undefined;

      const applications = await storage.getTemplateApplications(organizationId, { templateId, displayId });
      res.json(applications);
    } catch (error) {
      console.error("List template applications error:", error);
      res.status(500).json({ error: "Failed to fetch template applications" });
    }
  });

  // Sprint 5.2: Bulk Operations endpoints
  app.post("/api/displays/bulk/delete", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      
      const result = bulkDeleteDisplaysSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const { displayIds } = result.data;
      const count = await storage.bulkDeleteDisplays(displayIds, organizationId);
      res.json({ success: true, count });
    } catch (error) {
      console.error("Bulk delete displays error:", error);
      res.status(500).json({ error: "Failed to delete displays" });
    }
  });

  app.post("/api/displays/bulk/update", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      
      const result = bulkUpdateDisplaysSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const { displayIds, updates } = result.data;
      const count = await storage.bulkUpdateDisplays(displayIds, updates, organizationId);
      res.json({ success: true, count });
    } catch (error) {
      console.error("Bulk update displays error:", error);
      res.status(500).json({ error: "Failed to update displays" });
    }
  });

  app.post("/api/displays/bulk/apply-template", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user!;
      const organizationId = user.defaultOrganizationId!;
      const userId = user.id;
      
      const result = bulkApplyTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const { displayIds, templateId } = result.data;
      const count = await storage.bulkApplyTemplate(displayIds, templateId, userId, organizationId);
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Bulk apply template error:", error);
      if (error.message === "Template not found or access denied") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to apply template" });
    }
  });

  app.post("/api/content/bulk/delete", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as AuthRequest).user!.defaultOrganizationId!;
      
      const result = bulkDeleteContentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const { contentIds } = result.data;
      const count = await storage.bulkDeleteContent(contentIds, organizationId);
      res.json({ success: true, count });
    } catch (error) {
      console.error("Bulk delete content error:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Sprint 6: Player Releases endpoints
  // Public endpoint - get all releases or filter by platform
  app.get("/api/player/releases", async (req, res) => {
    try {
      const { platform, latest } = req.query;
      
      if (latest === "true" && platform) {
        const release = await storage.getLatestPlayerRelease(platform as string);
        if (!release) {
          return res.status(404).json({ error: "No release found for this platform" });
        }
        return res.json(release);
      }

      const filters: any = {};
      if (platform) filters.platform = platform as string;
      if (latest === "true") filters.isLatest = true;
      
      // Only show stable releases to public (not prereleases)
      filters.isPrerelease = false;
      
      const releases = await storage.listPlayerReleases(filters);
      res.json(releases);
    } catch (error) {
      console.error("Get player releases error:", error);
      res.status(500).json({ error: "Failed to retrieve releases" });
    }
  });

  // Protected endpoint - get single release (admin only)
  app.get("/api/player/releases/:id", requireAuth, async (req, res) => {
    try {
      const release = await storage.getPlayerRelease(req.params.id);
      if (!release) {
        return res.status(404).json({ error: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      console.error("Get player release error:", error);
      res.status(500).json({ error: "Failed to retrieve release" });
    }
  });

  // Protected endpoint - create new release (admin only)
  app.post("/api/player/releases", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user!;
      
      const result = insertPlayerReleaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const releaseData = {
        ...result.data,
        createdBy: user.id,
      };

      const release = await storage.createPlayerRelease(releaseData);
      
      // If this is marked as latest, update other releases
      if (release.isLatest) {
        await storage.setLatestRelease(release.id, release.platform);
      }

      res.status(201).json(release);
    } catch (error) {
      console.error("Create player release error:", error);
      res.status(500).json({ error: "Failed to create release" });
    }
  });

  // Protected endpoint - update release (admin only)
  app.patch("/api/player/releases/:id", requireAuth, async (req, res) => {
    try {
      const result = updatePlayerReleaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const release = await storage.updatePlayerRelease(req.params.id, result.data);
      if (!release) {
        return res.status(404).json({ error: "Release not found" });
      }

      // If this is marked as latest, update other releases
      if (result.data.isLatest === true) {
        await storage.setLatestRelease(release.id, release.platform);
      }

      res.json(release);
    } catch (error) {
      console.error("Update player release error:", error);
      res.status(500).json({ error: "Failed to update release" });
    }
  });

  // Protected endpoint - delete release (admin only)
  app.delete("/api/player/releases/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deletePlayerRelease(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Release not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete player release error:", error);
      res.status(500).json({ error: "Failed to delete release" });
    }
  });

  // Protected endpoint - set release as latest (admin only)
  app.post("/api/player/releases/:id/set-latest", requireAuth, async (req, res) => {
    try {
      const release = await storage.getPlayerRelease(req.params.id);
      if (!release) {
        return res.status(404).json({ error: "Release not found" });
      }

      await storage.setLatestRelease(release.id, release.platform);
      const updated = await storage.getPlayerRelease(release.id);
      
      res.json(updated);
    } catch (error) {
      console.error("Set latest release error:", error);
      res.status(500).json({ error: "Failed to set latest release" });
    }
  });

}
