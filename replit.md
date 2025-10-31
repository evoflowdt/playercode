# EvoFlow - Digital Signage Management Platform

## Overview
EvoFlow is a cloud-based digital signage management platform designed for remote control and monitoring of various digital display types (LG webOS, Samsung Tizen, Android, Raspberry Pi, etc.). Its primary purpose is to streamline digital signage operations for businesses through a comprehensive dashboard for content management, scheduling, device grouping, and real-time monitoring. The platform is built for SaaS/white-label deployment, prioritizing multi-tenancy and robust authentication, with ambitions to become a leading solution in the digital signage market.

## User Preferences
I prefer clear and direct communication. When suggesting changes, please explain the reasoning concisely. For code modifications, prioritize maintainability and scalability. I appreciate an iterative development approach where features are built and reviewed incrementally. Please ask for confirmation before implementing significant architectural changes or refactoring large portions of the codebase. I prefer detailed explanations for complex technical concepts but keep them succinct for routine tasks.

## System Architecture

### UI/UX Decisions
The platform features a Material Design 3-inspired interface, rebranded as EvoFlow, with a dark teal, light gray, and orange color palette. Typography uses Inter/Roboto Mono, with generous spacing and adapted Shadcn UI components. A mobile-first, responsive design is prioritized for all interfaces. The landing page features a clean Hero section with gradient background (`from-accent/20 via-background to-background`) without background images, and includes Digital Town Srl company information in the footer (Copyright © 2025 Digital Town Srl | P.IVA 03802320139 | REA CO.333859).

### Technical Implementations
-   **Frontend**: A React single-page application (SPA) built with TypeScript, utilizing Wouter for routing, TanStack Query for data management, Shadcn UI with Tailwind CSS for UI components, Leaflet for mapping, Uppy for file uploads, WebSockets for real-time updates, and AuthContext for authentication.
-   **Backend**: An Express.js server providing RESTful APIs and a WebSocket server. It integrates with object storage, uses PostgreSQL with Drizzle ORM, and implements session-based authentication with bcrypt hashing.
-   **Shared**: Contains TypeScript schemas, Zod validation, and Drizzle ORM definitions, including database schemas for a multi-tenant architecture covering users, organizations, roles, and sessions.

### Feature Specifications
-   **Core Platform**: Includes a modern, bilingual (EN/IT) landing page, multi-tenant authentication with RBAC, a real-time dashboard, comprehensive display management (monitoring, editing, geocoding), content library (upload, search, filter), scheduling (time-based, recurring, conditional), display grouping, content playlists, and multi-monitor synchronization.
-   **Advanced Capabilities**: Features an analytics dashboard with real-time data, a Player API for device interaction, configurable display resolution with content adaptation, and player auto-reset functionality.
-   **Management & Administration**: Encompasses team management with granular permissions (Owner/Admin/Editor/Viewer roles), organization settings (plan, display limits), audit logging, and a secure invitation workflow.
-   **Developer Tools**: Provides a full developer API system with API key management, webhook management for event subscriptions, and a notification center for in-app alerts with real-time WebSocket delivery.
-   **Content & Automation**: Offers content templates for quick display configuration and bulk operations for displays and content items.
-   **Scheduling Enhancements**: Implements an advanced, priority-based scheduling system with dayparting support.
-   **Cross-Platform Experience**: Features a comprehensive mobile-responsive design across all pages and Progressive Web App (PWA) support for Apple iOS, Android, and Windows.
-   **Downloads Page**: Protected page providing detailed, beginner-friendly step-by-step build instructions for the EvoFlow Desktop Player across Windows, macOS, and Linux platforms. Features a permanent "Download Source Code" section with two options: git clone command and direct ZIP download button (using `https://codeload.github.com/evoflowdt/playercode/zip/refs/heads/main` for reliable downloads). The page includes 50+ translation keys with time estimates, exact commands, prerequisite explanations, and installation guidance for non-technical users. Additionally displays available pre-built releases when published by administrators. Player source code is hosted on public GitHub repository `evoflowdt/playercode`. Includes sidebar navigation and colored download buttons for better visibility.
-   **Player Releases Management**: Complete GitHub-integrated release management system allowing administrators to upload player software versions to GitHub Releases. Includes protected admin interface at `/releases` for managing releases (upload, view, delete) and automatic display of available downloads on the `/downloads` page. Integrates with Replit's GitHub connector for OAuth authentication and secure asset management.

### System Design Choices
-   **Data Flow**: Frontend communicates with the Express backend via TanStack Query and authorization headers; backend interacts with PostgreSQL using Drizzle ORM. WebSockets provide real-time updates.
-   **Storage Layer**: PostgreSQL (Neon) for persistent data, managed by Drizzle ORM, supporting a multi-tenant architecture with bcrypt-hashed passwords and UUID-based session tokens.
-   **Object Storage**: Replit Object Storage is used for media files, accessed via presigned URLs.
-   **Authentication**: Session-based, with tokens stored in localStorage and validated via Bearer tokens in API requests, with sessions expiring after 30 days.
-   **Routing Architecture**: Public routes (landing, login, register, player, accept-invitation) do not require authentication and have no sidebar. Protected routes (dashboard, displays, content, templates, schedules, downloads, releases, install, etc.) require authentication and include the sidebar for consistent navigation.

## External Dependencies
-   **PostgreSQL**: Primary database.
-   **Replit Object Storage**: Media content storage.
-   **OpenStreetMap Nominatim API**: Geocoding services.
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
-   **Inter & Roboto Mono**: Google Fonts for typography.