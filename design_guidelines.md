# Design Guidelines: Digital Signage Management Dashboard

## Design Approach

**Selected System:** Material Design 3 (Material You)
**Justification:** Material Design excels at data-rich, professional dashboards with clear hierarchies, robust component patterns, and excellent information density management. Perfect for a B2B SaaS platform requiring efficiency and clarity.

**Key Design Principles:**
- **Clarity First:** Every interface element must clearly communicate its purpose and state
- **Efficient Workflow:** Minimize clicks and cognitive load for frequent tasks
- **Visual Feedback:** Immediate system responses to user actions
- **Scalable Information:** Design accommodates varying data densities across different views

---

## Typography

**Primary Font:** Inter (Google Fonts)
**Secondary Font:** Roboto Mono (for codes, technical data)

**Type Scale:**
- **Display/Hero (Dashboard titles):** 32px/40px, Semi-bold (600)
- **H1 (Section headers):** 24px/32px, Semi-bold (600)
- **H2 (Subsection headers):** 20px/28px, Medium (500)
- **H3 (Card titles):** 16px/24px, Medium (500)
- **Body Large (Primary content):** 16px/24px, Regular (400)
- **Body (Secondary content):** 14px/20px, Regular (400)
- **Caption (Labels, metadata):** 12px/16px, Regular (400)
- **Technical (Hash codes, IDs):** 14px/20px, Mono, Regular (400)

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 6, 8, 12, 16, 24**
- Micro spacing (within components): p-2, gap-2
- Standard spacing (between elements): p-4, gap-4, m-4
- Section spacing: p-6, p-8
- Major spacing (between sections): p-12, p-16, p-24

**Grid System:**
- **Main Dashboard:** Responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
- **Content Area:** max-w-7xl with px-6 padding
- **Sidebar Navigation:** Fixed w-64 on desktop, collapsible on mobile
- **Top Bar:** Fixed h-16 with z-50

**Breakpoints:**
- Mobile: base (< 768px)
- Tablet: md (768px)
- Desktop: lg (1024px)
- Wide: xl (1280px)
- Ultra-wide: 2xl (1536px)

---

## Component Library

### Navigation Components

**Top Navigation Bar:**
- Fixed header with logo left, global search center, user profile/notifications right
- Height: h-16
- Includes: breadcrumb navigation, real-time connection status indicator
- Background: Elevated surface with subtle shadow

**Sidebar Navigation:**
- Fixed left sidebar (w-64) with collapsible sections
- Primary navigation items with icons (24px) and labels
- Active state: filled background with accent indicator
- Includes: Dashboard, Displays, Content Library, Scheduling, Groups, Analytics, Settings
- Footer: Account switcher, help, collapse toggle

### Dashboard Components

**Statistics Cards:**
- Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Each card: p-6, rounded-lg, with icon (40px), value (32px bold), label (14px), trend indicator
- Metrics: Total Displays, Active Now, Offline, Content Items

**Interactive Map View:**
- Full-width container (min-h-96) showing geographic distribution
- Custom markers for display locations with status indicators
- Zoom controls, search overlay, filter panel (slide-in from right)
- Legend: Status colors and device types

**Display Status Grid:**
- Grid of display cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
- Each card: aspect-video thumbnail, device name, status badge, location, last active
- Quick action menu (3-dot) on hover
- Status badges: Online (green), Offline (red), Warning (amber)

**Live Screenshot Panel:**
- Large preview area with device selector dropdown
- Refresh button with timestamp
- Fullscreen toggle
- Device info sidebar: resolution, OS, uptime

### Content Management Components

**Content Library Grid:**
- Mixed grid showing uploaded media (images, videos)
- Drag-drop upload zone at top (min-h-48, dashed border)
- Each item: thumbnail, filename, file size, upload date, usage count
- Multi-select checkboxes for batch operations
- Filter toolbar: Type, Date, Status, Tags

**Drag-and-Drop Composer:**
- Split view: Content library (left 1/3) | Timeline builder (right 2/3)
- Timeline: Horizontal scrolling with time markers
- Drag content items onto timeline slots
- Visual duration indicators with resize handles

### Scheduling Interface

**Calendar View:**
- Month/Week/Day toggle
- Time slots with color-coded scheduled content
- Quick create: Click any slot to add schedule
- Event cards show: content thumbnail, title, display group, time range

**Schedule Builder Form:**
- Modal overlay (max-w-2xl)
- Sections: Content selection, Display/Group targeting, Time & Recurrence, Preview
- DateTime picker with timezone support
- Recurring schedule options with visual preview

### Device Management

**Device Grouping Interface:**
- Two-column layout: Available devices (left) | Group editor (right)
- Drag devices between groups
- Group cards show: name, device count, preview thumbnails
- Quick actions: Edit, Duplicate, Delete, Apply content

**Device Detail Panel:**
- Slide-in from right (w-96)
- Sections: Status overview, System info, Installed apps, Screenshots, Logs
- Action buttons: Restart, Update, Remove, Hash verification

### Forms & Inputs

**Standard Form Elements:**
- Text inputs: h-12, px-4, rounded-lg with border
- Labels: mb-2, text-sm, medium weight
- Dropdowns: Custom styled selects with chevron icons
- Search bars: Magnifying glass icon left, clear button right (when active)
- Checkboxes/Radio: 20px with custom styling
- Toggle switches: Material Design style (w-12 h-6)

**Button Hierarchy:**
- Primary CTA: Filled, h-12, px-6, rounded-lg, medium weight
- Secondary: Outlined, same dimensions
- Tertiary: Text only with hover background
- Icon buttons: 40px × 40px square/circle for compact actions
- FAB (Floating Action Button): 56px circle, bottom-right for primary actions

### Data Display

**Tables:**
- Striped rows for readability
- Sticky header row
- Sortable columns with arrow indicators
- Row actions: Inline edit, quick view, delete
- Pagination: Bottom center with page numbers and navigation

**Status Indicators:**
- Pill-shaped badges (px-3 py-1 rounded-full)
- Icons with tooltip on hover
- Progress bars for operations in progress
- Real-time pulse animations for active status

### Overlays & Modals

**Modal Dialogs:**
- Centered overlay with backdrop (bg-black/50)
- Sizes: sm (max-w-md), md (max-w-lg), lg (max-w-2xl), xl (max-w-4xl)
- Header: Title + close button
- Content area: p-6
- Footer: Action buttons right-aligned

**Toast Notifications:**
- Top-right positioned (toast-top-right)
- Types: Success, Error, Warning, Info with appropriate icons
- Auto-dismiss after 5 seconds
- Action button option (e.g., "Undo")

**Slide-out Panels:**
- Right-side panels for details/forms (w-96 or w-1/3)
- Smooth slide animation
- Overlay backdrop on mobile

---

## Animations

**Principle:** Functional animations only - enhance usability, not distraction

**Approved Animations:**
- Page transitions: Subtle fade (duration-200)
- Modal/Panel slide-in: transform + opacity (duration-300)
- Hover states: Background/border transitions (duration-150)
- Loading states: Skeleton loaders and spinners
- Real-time updates: Gentle pulse for new data (animate-pulse but subtle)
- Drag-and-drop: Shadow lift on grab, smooth position transitions

**Forbidden:**
- Decorative scroll animations
- Complex entrance animations
- Attention-seeking effects
- Parallax effects

---

## Images

**Dashboard Imagery:**
- **No hero images** - This is a functional dashboard, not a marketing site
- **Display screenshots:** Actual device output shown in cards and detail views
- **Map markers:** Custom icon markers on geographic view
- **Placeholder content:** Sample digital signage content (ads, menus, schedules) in thumbnails
- **Empty states:** Simple illustrations (not photos) for empty content library, no devices, etc.
- **User avatars:** Profile images in top-right navigation and activity logs

**Image Guidelines:**
- All device screenshots: aspect-video (16:9)
- Content thumbnails: Square or 16:9 depending on original
- Icons: 24px standard, 40px for feature cards, 16px for inline
- Use skeleton loaders while images load