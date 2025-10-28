# EVOsignage - Digital Signage Management Platform

## Overview
Cloud-based digital signage management dashboard for controlling and monitoring displays remotely. The platform enables content management, scheduling, device grouping, and real-time monitoring across multiple display platforms including LG webOS, Samsung Tizen, Android, Raspberry Pi, and more.

## Project Structure

### Frontend (client/)
- **React SPA** with TypeScript
- **Wouter** for routing
- **TanStack Query** for data fetching and caching
- **Shadcn UI** components with Tailwind CSS
- **Leaflet** for geographic display mapping
- **Uppy** for file uploads
- **WebSocket client** for real-time updates
- **Theme support** (light/dark mode)

### Backend (server/)
- **Express.js** HTTP server
- **WebSocket server** for real-time display communication
- **Object Storage** integration for media files
- **PostgreSQL database** with Drizzle ORM for persistent storage
- RESTful API endpoints

### Shared (shared/)
- **TypeScript schemas** and types
- **Zod validation** schemas
- **Drizzle ORM** schema definitions
- Data models for displays, content, groups, schedules, playlists

## Features Implemented

### Dashboard
- Real-time statistics (total displays, active, offline, content count)
- Geographic map view of display locations
- Recent displays grid
- Auto-refreshing data via WebSocket

### Display Management
- View all displays with status indicators
- Search and filter displays by status
- Display details modal with screenshots
- Real-time status updates
- Hash code verification for device registration

### Content Library
- Upload images and videos to object storage
- Drag-and-drop interface via Uppy
- Content search and filtering
- Media thumbnails and metadata
- File size and type information

### Scheduling
- Create content schedules for displays or groups
- Time-based content playback
- Recurring schedule support
- Schedule management interface

### Display Groups
- Create and manage display groups
- Organize displays for easier management
- Bulk content deployment to groups

### Content Playlists
- Create and manage content playlists
- Sequential playback ordering
- Add/remove content items from playlists
- Playlist metadata and descriptions

### Analytics Dashboard
- Comprehensive metrics visualization with Recharts
- Display status distribution (pie charts)
- Platform distribution analysis (bar charts)
- Content type breakdown
- System overview with derived metrics (uptime rate, averages)
- Real-time data updates

### Real-time Communication
- WebSocket connection for live updates
- Display status broadcasting
- Auto-reconnection on disconnect
- Event-driven architecture

## Technical Architecture

### Data Flow
1. Frontend components use TanStack Query for data fetching
2. API requests go through Express backend
3. Backend interacts with PostgreSQL database via Drizzle ORM
4. WebSocket broadcasts changes to all connected clients
5. Frontend auto-updates via query invalidation

### Storage Layer
- **PostgreSQL database** with Neon backing
- **Drizzle ORM** for type-safe queries
- Full CRUD operations for all entities
- Seed script with demo data (displays, groups)
- Production-ready persistent storage

### Object Storage
- Replit Object Storage integration
- Presigned URL uploads for security
- Public/private object serving
- Automatic path normalization

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for production)
- `PUBLIC_OBJECT_SEARCH_PATHS`: Object storage public paths
- `PRIVATE_OBJECT_DIR`: Private object directory
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: Bucket ID
- `SESSION_SECRET`: Session encryption key

## API Endpoints

### Health Check
- `GET /health` - Server health status (for deployment monitoring)

### Displays
- `GET /api/displays` - List all displays
- `GET /api/displays/:id` - Get display details
- `POST /api/displays` - Register new display
- `PATCH /api/displays/:id` - Update display
- `DELETE /api/displays/:id` - Remove display

### Content
- `GET /api/content` - List all content items
- `POST /api/content` - Add content item
- `DELETE /api/content/:id` - Delete content

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `DELETE /api/groups/:id` - Delete group

### Schedules
- `GET /api/schedules` - List schedules with details
- `POST /api/schedules` - Create schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Stats
- `GET /api/stats` - Dashboard statistics

### Playlists
- `GET /api/playlists` - List all playlists with items
- `POST /api/playlists` - Create new playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/items` - Add item to playlist
- `DELETE /api/playlists/items/:itemId` - Remove item from playlist

### Object Storage
- `POST /api/objects/upload` - Get upload URL
- `GET /public-objects/:filePath` - Serve public files

## WebSocket Events

### Client → Server
- `display_register`: Register new display
- `display_status`: Update display status
- `display_screenshot`: Update display screenshot

### Server → Client
- `connected`: Connection established
- `display_added`: New display registered
- `display_updated`: Display information changed
- `display_deleted`: Display removed

## Design System
- **Primary Color**: Blue (#3b82f6)
- **Status Colors**: Green (online), Red (offline), Amber (warning)
- **Typography**: Inter (primary), Roboto Mono (code/technical)
- **Spacing**: Tailwind default scale
- **Components**: Material Design 3 inspired
- **Responsive**: Mobile-first design

## Next Phase Features
- Player applications for various OS platforms (LG webOS, Samsung Tizen, Raspberry Pi, Android)
- DAM (Digital Asset Management) integration
- Conditional scheduling rules (day-of-week, time-based filters)
- Multi-user authentication
- Role-based access control
- Integration APIs for third-party systems
- Advanced playlist features (duration overrides, transitions)
- Historical analytics and trend analysis

## Development Notes
- Use `npm run dev` to start the application
- Frontend: Vite dev server with HMR
- Backend: Express with auto-reload
- WebSocket: Path `/ws` (separate from Vite HMR)
- Database: PostgreSQL with persistent storage
- Seed data: Run `npm run db:seed` to populate demo displays

## Recent Changes
- **PostgreSQL Database Migration (Oct 28, 2025)**:
  - Migrated from in-memory storage to PostgreSQL with Drizzle ORM
  - Implemented DatabaseStorage class with full CRUD operations
  - Created seed script with demo displays and groups
  - All features now use persistent database storage
  - Production-ready with proper error handling

- **Content Playlists Feature (Oct 28, 2025)**:
  - Added playlists and playlist_items tables to schema
  - Implemented playlist creation, deletion, and item management
  - Created playlists UI page with React Query integration
  - End-to-end tested with successful CRUD operations

- **Analytics Dashboard (Oct 28, 2025)**:
  - Comprehensive metrics visualization using Recharts
  - Display status, platform, and content type distribution charts
  - System overview with derived metrics (uptime rate, avg content per display)
  - Real-time data updates from all API endpoints

- **Geocoding Feature (Oct 28, 2025)**:
  - Automatic coordinate retrieval from location names
  - Integration with OpenStreetMap Nominatim API (free, no API key)
  - One-click button to auto-populate latitude/longitude fields
  - Proper error handling and user feedback with toast messages

- **Deployment Optimizations (Oct 28, 2025)**:
  - Added `/health` endpoint for deployment health checks
  - Reordered server initialization: listen → routes → WebSocket → Vite
  - Made WebSocket setup non-blocking
  - Enhanced error handling and logging for deployment diagnostics
  - Fixed schedule creation date handling (ISO string → Date conversion)

- **Foundation (Initial Implementation)**:
  - Implemented complete frontend with all pages
  - Added WebSocket real-time communication
  - Integrated object storage for content uploads
  - Created comprehensive API layer
  - Added theme support (light/dark mode)
  - Implemented responsive design across all breakpoints
