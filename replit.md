# EvoFlow - Digital Signage Management Platform

## Overview
EvoFlow is a cloud-based digital signage management platform designed for remote control and monitoring of various display types (LG webOS, Samsung Tizen, Android, Raspberry Pi, etc.). It provides a comprehensive dashboard for content management, scheduling, device grouping, and real-time monitoring, aiming to streamline digital signage operations for businesses.

## User Preferences
I prefer clear and direct communication. When suggesting changes, please explain the reasoning concisely. For code modifications, prioritize maintainability and scalability. I appreciate an iterative development approach where features are built and reviewed incrementally. Please ask for confirmation before implementing significant architectural changes or refactoring large portions of the codebase. I prefer detailed explanations for complex technical concepts but keep them succinct for routine tasks.

## System Architecture

### UI/UX Decisions
The platform features a Material Design 3-inspired interface, rebranded as EvoFlow, with a focus on a clean and intuitive user experience.
-   **Color Palette**: Dark Teal for navigation, Light Gray for backgrounds, and Orange for accents and CTAs. Status indicators use semantic colors (Green for online, Red for offline, Amber for warnings).
-   **Typography**: Inter for general text, Roboto Mono for code and technical data.
-   **Spacing**: Generous spacing (e.g., `p-8`, `gap-6`) ensures readability and visual hierarchy.
-   **Components**: Shadcn UI components are used, adapted to Material Design 3 principles.
-   **Responsiveness**: Designed with a mobile-first approach, ensuring functionality across various screen sizes.

### Technical Implementations
-   **Frontend**: A React Single Page Application (SPA) built with TypeScript, utilizing Wouter for routing, TanStack Query for data fetching, and Shadcn UI with Tailwind CSS for components. It includes Leaflet for geographic display mapping, Uppy for file uploads, and a WebSocket client for real-time updates.
-   **Backend**: An Express.js server providing RESTful API endpoints and a WebSocket server for real-time display communication. It integrates with object storage for media files and uses PostgreSQL with Drizzle ORM for persistent data.
-   **Shared**: Contains TypeScript schemas, Zod validation schemas, and Drizzle ORM definitions for data consistency across frontend and backend.

### Feature Specifications
-   **Dashboard**: Real-time statistics, geographic display map, recent displays grid, and auto-refreshing data.
-   **Display Management**: View, search, filter, and monitor displays with real-time status updates and hash code verification for registration. Features include: dual view modes (grid cards and table list) with toggle buttons, editing display information (name, location, coordinates, resolution), resolution selector dropdown with 12 standard presets (1920x1080, 1280x720, 3840x2160, 2560x1440, 1366x768, 1024x768, 1600x900, 2048x1152, 3440x1440, plus vertical variants 1080x1920, 720x1280, 2160x3840), integrated geocoding using OpenStreetMap Nominatim API to auto-populate latitude/longitude from address, form pre-population with existing data, localized relative timestamps (date-fns with Italian/English locale support), and WebSocket notifications for real-time updates across all clients. Both view modes maintain full feature parity for all CRUD operations.
-   **Content Library**: Upload images and videos to object storage with drag-and-drop, search, filtering, visual thumbnails with graceful fallback, and metadata display. Uploaded files are stored in `/.private/uploads/` and served publicly via a dedicated route for player access. Legacy content paths convert from `/objects/` to `/public-objects/` for display.
-   **Scheduling**: Create, edit, and manage time-based, recurring content schedules for individual displays or groups. Features include: schedule creation with content or playlist assignment, inline schedule editing with form pre-population, switching between content and playlist targets during edit, real-time form reset when switching between schedules, advanced conditional rules, content priorities, and transition effects. Edit functionality includes proper WebSocket notifications for affected displays when schedules are modified.
-   **Display Groups**: Organize displays for bulk content deployment and simplified management.
-   **Content Playlists**: Create sequential content playlists with full management capabilities. Features include: adding videos from Content Library to playlists, removing videos, reordering with up/down buttons, setting custom duration per video, detailed playlist view with sequential playback order, and radio streaming support for background audio during playlist playback. Radio streams can be configured per playlist with custom stream URLs, enabling continuous background music or audio content during content rotation.
-   **Multi-Monitor Synchronization**: Synchronize content playback across multiple displays for video walls and multi-screen installations. Features include: sync group creation and management, real-time WebSocket-based coordination, centralized playback control (play/pause/resume/stop), session tracking, and support for both single content and playlist synchronization. Players listen to sync commands via WebSocket and coordinate playback in perfect sync. Each display can only belong to one sync group at a time.
-   **Analytics Dashboard**: Visualizes display status, platform distribution, content type breakdown, and system metrics using Recharts.
-   **Real-time Communication**: WebSocket connection for live updates, display status broadcasting, and event-driven architecture including sync coordination events.
-   **Player API**: Endpoints for display pairing, registration, heartbeats, content delivery, session management, and capability updates.
-   **Display Resolution & Content Adaptation**: Displays can be configured with specific resolutions via dropdown selector with 12 standard presets. Player automatically adapts video and image content to match configured resolution using a bounded wrapper strategy: creates an explicit-sized wrapper div (e.g., 1920x1080px) that constrains the media element, which fills the wrapper at 100% width/height with object-contain. This ensures videos and images respect the configured resolution limits in both development and production environments. For unconfigured displays, media falls back to responsive full-screen sizing. Resolution parsing extracts width/height from string format (e.g., "1920x1080") and applies inline pixel dimensions to the wrapper element.
-   **Player Auto-Reset**: Automatic player disconnection and reset when sessions are deleted from Settings page. Players detect 404 from heartbeat/content endpoints, clear localStorage, stop WebSocket reconnection, and return to pairing form with user notification.
-   **Advanced Scheduling API**: Comprehensive API for managing scheduling rules, content priorities, transition effects, detecting conflicts, and generating timeline previews.
-   **Playlist Scheduling**: Schedules can target either single content items OR complete playlists. When a schedule has a `playlistId`, the player content API automatically expands the playlist into an ordered array of content items, respecting custom durations set for each video.
-   **Documentation**: Comprehensive built-in documentation system accessible via sidebar. Features four main sections (Getting Started, Features, Tutorials, API) using Tabs and Accordion components. Content is fully internationalized (English/Italian) and auto-updated to reflect platform features as they evolve. Includes platform overview, step-by-step tutorials, feature guides, API reference documentation, and complete sync groups documentation.
-   **Internationalization**: Complete bilingual support (English/Italian) across all application pages and components. Centralized translation system using i18n pattern with useLanguage hook. All user-facing strings, including UI elements, form labels, placeholders, chart labels, error messages, and notifications are fully translated. Language toggle available in header for instant switching between locales.

### System Design Choices
-   **Data Flow**: Frontend uses TanStack Query, which communicates with the Express backend. The backend interacts with PostgreSQL via Drizzle ORM, and WebSocket broadcasts changes for real-time updates.
-   **Storage Layer**: PostgreSQL database (backed by Neon) for all persistent data, managed with Drizzle ORM for type-safe queries. Includes a seed script for demo data.
-   **Object Storage**: Integrated with Replit Object Storage for media files, utilizing presigned URLs for secure uploads and public/private object serving.

## External Dependencies
-   **PostgreSQL**: Primary database for persistent data storage (e.g., Neon).
-   **Replit Object Storage**: For storing and serving media content (images, videos).
-   **OpenStreetMap Nominatim API**: Used for geocoding display locations (auto-populating latitude/longitude from location names).
-   **Wouter**: Frontend routing library.
-   **TanStack Query**: Data fetching and caching library for the frontend.
-   **Shadcn UI**: UI component library.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Leaflet**: JavaScript library for interactive maps.
-   **Uppy**: File upload library.
-   **Zod**: TypeScript-first schema declaration and validation library.
-   **Drizzle ORM**: TypeScript ORM for database interactions.
-   **Recharts**: Charting library for the analytics dashboard.
-   **Inter & Roboto Mono**: Google Fonts used for typography.