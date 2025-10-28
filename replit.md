# videoMOOD - Digital Signage Management Platform

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
- **In-memory storage** for MVP (displays, content, groups, schedules)
- RESTful API endpoints

### Shared (shared/)
- **TypeScript schemas** and types
- **Zod validation** schemas
- Data models for displays, content, groups, schedules

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

### Real-time Communication
- WebSocket connection for live updates
- Display status broadcasting
- Auto-reconnection on disconnect
- Event-driven architecture

## Technical Architecture

### Data Flow
1. Frontend components use TanStack Query for data fetching
2. API requests go through Express backend
3. Backend interacts with in-memory storage
4. WebSocket broadcasts changes to all connected clients
5. Frontend auto-updates via query invalidation

### Storage Layer
- **MemStorage**: In-memory data storage for MVP
- Implements full CRUD operations for all entities
- Includes demo/seed data for displays
- Ready for migration to PostgreSQL database

### Object Storage
- Replit Object Storage integration
- Presigned URL uploads for security
- Public/private object serving
- Automatic path normalization

## Environment Variables
- `PUBLIC_OBJECT_SEARCH_PATHS`: Object storage public paths
- `PRIVATE_OBJECT_DIR`: Private object directory
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: Bucket ID

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
- PostgreSQL database persistence
- Player applications for various OS platforms
- Advanced analytics and reporting
- DAM (Digital Asset Management) integration
- Conditional scheduling rules
- Content playlists
- Multi-user authentication
- Role-based access control
- Integration APIs for third-party systems

## Development Notes
- Use `npm run dev` to start the application
- Frontend: Vite dev server with HMR
- Backend: Express with auto-reload
- WebSocket: Path `/ws` (separate from Vite HMR)
- All data is in-memory (resets on restart for MVP)

## Recent Changes
- **Deployment Optimizations (Oct 28, 2025)**:
  - Added `/health` endpoint for deployment health checks
  - Reordered server initialization: listen → routes → WebSocket → Vite
  - Made WebSocket setup non-blocking
  - Enhanced error handling and logging for deployment diagnostics
  - Fixed schedule creation date handling (ISO string → Date conversion)
- Implemented complete frontend with all pages
- Added WebSocket real-time communication
- Integrated object storage for content uploads
- Created comprehensive API layer
- Added theme support (light/dark mode)
- Implemented responsive design across all breakpoints
