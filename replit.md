# EvoFlow - Digital Signage Management Platform

## Overview
EvoFlow is a cloud-based digital signage management platform for remote control and monitoring of various display types (LG webOS, Samsung Tizen, Android, Raspberry Pi, etc.). It offers a comprehensive dashboard for content management, scheduling, device grouping, and real-time monitoring, aiming to streamline digital signage operations for businesses. The platform is designed for a SaaS/white-label deployment, focusing on multi-tenancy and robust authentication.

## User Preferences
I prefer clear and direct communication. When suggesting changes, please explain the reasoning concisely. For code modifications, prioritize maintainability and scalability. I appreciate an iterative development approach where features are built and reviewed incrementally. Please ask for confirmation before implementing significant architectural changes or refactoring large portions of the codebase. I prefer detailed explanations for complex technical concepts but keep them succinct for routine tasks.

## System Architecture

### UI/UX Decisions
The platform features a Material Design 3-inspired interface, rebranded as EvoFlow, emphasizing a clean and intuitive user experience. Key decisions include a dark teal, light gray, and orange color palette, Inter/Roboto Mono typography, generous spacing, adapted Shadcn UI components, and a mobile-first responsive design.

### Technical Implementations
-   **Frontend**: A React SPA with TypeScript, Wouter for routing, TanStack Query for data fetching, Shadcn UI with Tailwind CSS for components, Leaflet for maps, Uppy for uploads, WebSockets for real-time updates, and AuthContext for authentication.
-   **Backend**: An Express.js server providing RESTful APIs and a WebSocket server. It integrates with object storage, uses PostgreSQL with Drizzle ORM, and implements session-based authentication with bcrypt hashing.
-   **Shared**: Contains TypeScript schemas, Zod validation, and Drizzle ORM definitions for data consistency. Includes database schemas for multi-tenant architecture (users, organizations, roles, sessions).

### Feature Specifications
-   **Landing Page**: Modern, responsive marketing page at root path (/) with hero section, features showcase (6 cards), services overview (4 cards), CTA sections, and footer. Full bilingual support (EN/IT) with language/theme toggles. Navigation to Sign In (/login) and Sign Up (/register) pages.
-   **Multi-Tenant Authentication System**: Session-based authentication with role-based access control (RBAC) supporting user registration, secure login, session management, and protected routes.
-   **Dashboard**: Real-time statistics, geographic display map, and recent displays grid. Accessible at /dashboard for authenticated users.
-   **Display Management**: View, search, filter, monitor displays, edit information (name, location, coordinates, resolution), and integrate geocoding. Supports dual view modes (grid/table) and WebSocket notifications.
-   **Content Library**: Upload images/videos to object storage with drag-and-drop, search, filtering, and metadata display.
-   **Scheduling**: Create, edit, and manage time-based, recurring content schedules for displays or groups, with content/playlist assignment, conditional rules, and transition effects.
-   **Display Groups**: Organize displays for bulk content deployment.
-   **Content Playlists**: Create sequential content playlists with video management (add, remove, reorder, custom duration) and radio streaming support.
-   **Multi-Monitor Synchronization**: Synchronize content playback across multiple displays for video walls via sync groups and WebSocket-based coordination.
-   **Analytics Dashboard**: Visualizes display status, platform distribution, content types, and system metrics using Recharts.
-   **Real-time Communication**: WebSocket connection for live updates, status broadcasting, and event-driven architecture.
-   **Player API**: Endpoints for display pairing, registration, heartbeats, content delivery, session management, and capability updates.
-   **Display Resolution & Content Adaptation**: Configurable display resolutions with automatic content adaptation via bounded wrappers.
-   **Player Auto-Reset**: Automatic player disconnection and reset upon session deletion.
-   **Documentation**: Comprehensive built-in bilingual (English/Italian) documentation system.
-   **Internationalization**: Full bilingual support (English/Italian) across the application, with a centralized translation system and language toggle.
-   **Team Management (Sprint 3)**: Complete RBAC system with Owner/Admin/Editor/Viewer roles, secure team invitations with 7-day expiry tokens, role updates, member removal, and granular permissions.
-   **Organization Settings (Sprint 3)**: Configurable organization details including name, subscription plan (Free/Pro/Enterprise), and max displays limits.
-   **Audit Logging (Sprint 3)**: Comprehensive audit trail system tracking all organization actions (user invited, role updated, organization updated, etc.) with IP address, user agent, and detailed change records.
-   **Invitation Workflow (Sprint 3)**: Secure team invitation system with email-ready token links, accept/decline functionality, automatic organization switching, and invitation status tracking.

### Sprint 4 (COMPLETED)
-   **Email Notifications**: SKIPPED - No email service integration configured (user preference). Email infrastructure can be added later with Resend/SendGrid/SMTP.
-   **Advanced Analytics** (COMPLETED): Enhanced analytics dashboard with detailed metrics (display uptime, content popularity, schedule performance), time-series hourly aggregation (168-hour window), CSV export functionality, and date range filtering. Implemented with 3 new database tables (displayMetrics, contentViews, scheduleExecutions), 4 backend aggregation methods, 2 API routes, and tabbed frontend UI. All queries properly scoped by organization for multi-tenant security.
-   **API Keys & Webhooks** (COMPLETED): Full developer API system with API key management (create, list, revoke with optional expiry), webhook management (create, update, delete, test), event subscriptions, and webhook event history. Implemented with 3 database tables (apiKeys, webhooks, webhookEvents), 12 storage methods with organizationId validation, 9 API routes with Zod schema validation (insertApiKeySchema, insertWebhookSchema), and comprehensive Developer Settings page (700+ lines). Features crypto-secure key generation (evo_ prefix), webhook secrets (whsec_ prefix), test webhook functionality, and full i18n support (EN/IT). All queries properly scoped by organization for multi-tenant security.
-   **Notification Center** (COMPLETED): In-app notification system with bell icon in header showing unread badge, popover UI with notification list, mark as read/delete functionality, and real-time WebSocket delivery. Implemented with 1 database table (notifications), 6 backend storage methods, 6 API routes with Zod validation (insertNotificationSchema), and NotificationBell component with ScrollArea and empty state. Features secure WebSocket broadcast (generic signal without payload to prevent cross-tenant data leaks), multi-tenant security (all queries scoped by organizationId+userId), userId validation (POST enforces authenticated user), and full i18n support (EN/IT). WebSocket invalidates queries to trigger client-side refresh of user-specific notifications.
-   **Granular Permissions** (COMPLETED): Resource-level permission system for fine-grained access control beyond role-based permissions. Implemented with 1 database table (resource_permissions), 6 backend storage methods (create/list/getUserPermissions/check/update/delete), requireResourcePermission middleware for checking both RBAC and granular permissions, 5 API routes with Zod validation (insertResourcePermissionSchema, updateResourcePermissionSchema), and comprehensive Permissions page with table/filters/CRUD dialogs. Features resource types (display, content_item, playlist, schedule, display_group), actions (view, edit, delete, manage), dynamic resource fetching based on type selection, multi-tenant security (all queries scoped by organizationId), Owner/Admin-only access (manage_users permission required), and full i18n support (EN/IT). Works as RBAC override allowing specific resource access even if user's role doesn't permit.

### Sprint 5 (IN PROGRESS)
-   **Content Templates** (COMPLETED): Reusable template system for quick display configuration with pre-configured layouts, playlists, and settings. Implemented with 2 database tables (contentTemplates, templateApplications), 7 backend storage methods (create/list/get/update/delete/apply/getApplications), 7 API routes with Zod validation (insertContentTemplateSchema, updateContentTemplateSchema, insertTemplateApplicationSchema), and comprehensive Templates page with create/edit/delete/apply functionality. Features template types (welcome, menu, emergency, promo, custom), layout types (fullscreen, split-horizontal, split-vertical, grid-2x2, grid-3x3), configurable settings (transition effects, duration, background color), default playlist/content assignment, and template-to-display application tracking. All queries properly scoped by organization for multi-tenant security. Full bilingual support (EN/IT).

### System Design Choices
-   **Data Flow**: Frontend uses TanStack Query with authorization headers to communicate with the Express backend, which interacts with PostgreSQL via Drizzle ORM. WebSockets broadcast real-time updates.
-   **Storage Layer**: PostgreSQL (Neon) for persistent data, managed with Drizzle ORM. Features multi-tenant architecture with bcrypt-hashed passwords and UUID-based session tokens.
-   **Object Storage**: Replit Object Storage for media files, using presigned URLs.
-   **Authentication Architecture**: Session-based authentication with tokens stored in localStorage, validated via Bearer tokens in API requests. Sessions expire after 30 days.

## External Dependencies
-   **PostgreSQL**: Primary database.
-   **Replit Object Storage**: Media content storage.
-   **OpenStreetMap Nominatim API**: Geocoding display locations.
-   **Wouter**: Frontend routing.
-   **TanStack Query**: Data fetching and caching.
-   **Shadcn UI**: UI component library.
-   **Tailwind CSS**: CSS framework.
-   **Leaflet**: Interactive maps.
-   **Uppy**: File upload library.
-   **Zod**: Schema validation.
-   **Drizzle ORM**: Database interactions.
-   **Recharts**: Charting library.
-   **bcrypt**: Password hashing.
-   **Inter & Roboto Mono**: Typography (Google Fonts).