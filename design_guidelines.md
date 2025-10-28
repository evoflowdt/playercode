# Design Guidelines: EvoFlow Digital Signage Management Platform

## Design Approach

**Selected System:** Material Design 3 adapted with custom color palette
**Justification:** Material Design excels at data-rich dashboards with clear hierarchies and robust component patterns. Perfect for B2B SaaS platforms requiring efficiency and professional aesthetics.

**Key Design Principles:**
- **Professional Clarity:** Every element communicates purpose and state immediately
- **Data-First Workflow:** Minimize cognitive load, maximize information density
- **Visual Feedback:** Real-time status updates with clear indicators
- **Scalable Interface:** Accommodates varying data densities across views

---

## Color System

**Primary Palette:**
- **Header/Sidebar:** Dark Teal (#1a5266) - Navigation chrome, primary surfaces
- **Background:** Light Gray (#e8eef1) - Main workspace background
- **Surface:** White (#ffffff) - Cards, panels, modals with subtle shadows
- **Accent Orange:** #ff8c42 - Highlights, warnings, CTAs
- **Success Green:** #4caf50 - Online status, confirmations, positive metrics
- **Error Red:** #f44336 - Offline status, errors, critical alerts
- **Warning Amber:** #ffa726 - Attention states, pending actions

**Semantic Applications:**
- Status badges: Green (online), Red (offline), Amber (warning), Orange (attention)
- Primary buttons: Dark Teal background with white text
- Secondary buttons: White background with Dark Teal border
- Chart accents: Orange for primary metrics, Green for positive trends
- Shadows on cards: rgba(26, 82, 102, 0.08) for subtle depth

---

## Typography

**Primary Font:** Inter (Google Fonts) - Clean, professional, excellent readability
**Monospace Font:** Roboto Mono - Device IDs, hash codes, technical data

**Type Scale:**
- **Dashboard Titles:** 32px/40px, Semi-bold (600)
- **Section Headers:** 24px/32px, Semi-bold (600)
- **Subsection Headers:** 20px/28px, Medium (500)
- **Card Titles:** 16px/24px, Medium (500)
- **Body Large:** 16px/24px, Regular (400)
- **Body:** 14px/20px, Regular (400)
- **Captions/Labels:** 12px/16px, Regular (400)
- **Technical Data:** 14px/20px, Mono, Regular (400)

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 6, 8, 12, 16, 24**
- Component internals: p-2, gap-2
- Between elements: p-4, gap-4, m-4
- Card padding: p-6
- Section spacing: p-8, p-12
- Major divisions: p-16, p-24

**Grid Architecture:**
- **Sidebar:** Fixed w-64 on desktop, collapsible drawer on mobile
- **Top Bar:** Fixed h-16 spanning full width
- **Main Content:** max-w-7xl with px-6 horizontal padding
- **Metric Cards Grid:** grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- **Display Grid:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- **Generous Gutter:** gap-6 between cards, gap-8 between major sections

---

## Component Library

### Navigation Structure

**Sidebar (Dark Teal #1a5266):**
- Fixed left panel w-64 with white text
- Logo area at top (h-16, p-4)
- Navigation items: p-4, rounded-lg, with 24px icons
- Active state: White background with dark teal text and 4px left accent border
- Sections: Dashboard, Displays, Content Library, Scheduling, Groups, Analytics, Settings
- Bottom area: Account info, Help center, Collapse toggle

**Top Bar (Dark Teal #1a5266):**
- Fixed header h-16 with white elements
- Left: Breadcrumb navigation with chevron separators
- Center: Global search bar (w-96, white background with teal placeholder)
- Right: Notification bell, connection status dot, user avatar dropdown
- Subtle bottom border separating from content area

### Dashboard Components

**Metric Cards (White surface):**
- Grid layout with gap-6
- Each card: p-6, rounded-xl, shadow-sm
- Icon area: 48px circle with light teal background, white icon
- Large metric number: 32px bold, dark teal
- Label: 14px regular, gray-600
- Trend indicator: Small arrow with percentage, green or red
- Metrics: Total Displays, Active Now, Offline Count, Content Items

**Interactive Map Panel:**
- Full-width white card (rounded-xl, shadow-sm)
- Header: Title, filter button, legend
- Map container: min-h-96
- Custom markers: Circle pins color-coded by status (green/red/amber)
- Hover tooltip: Device name, location, last active
- Right slide-panel for filters: Display groups, status, location zones

**Real-Time Display Grid:**
- White cards in responsive grid (gap-6)
- Each card: aspect-video thumbnail preview, p-4
- Device name: 16px medium
- Status badge: Top-right absolute positioning, pill shape
- Metadata row: Location icon + text, last active timestamp
- Three-dot menu: Top-right, shows on hover
- Click card for full detail panel

**Analytics Charts:**
- White card containers (p-6, rounded-xl, shadow-sm)
- Chart types: Line graphs (uptime trends), bar charts (content performance), donut charts (display distribution)
- Orange primary line/bars, teal secondary
- Grid background: Light gray subtle lines
- Legends: Bottom placement with colored squares
- Tooltips: White background with dark text, shadow-md

### Content Management

**Content Library Grid:**
- Drag-drop upload zone at top: min-h-48, dashed border (2px, teal), rounded-xl
- Upload icon (48px) with "Drag files or click to browse" text
- Grid below: gap-4, responsive columns
- Each item: White card with thumbnail (aspect-video or square), filename, size, date
- Checkboxes for multi-select: Top-left overlay
- Hover state: Shadow-lg, scale-102 transform

**Timeline Composer:**
- Split layout: Content panel (w-1/3, white card) | Timeline (w-2/3, white card)
- Timeline: Horizontal scroll, time markers every hour
- Content blocks: Draggable cards with thumbnails, duration badges
- Drop zones: Dashed outlines when dragging
- Resize handles: Corner grips on selected blocks

### Scheduling Interface

**Calendar View:**
- Month/Week/Day toggle tabs at top
- Grid cells with white background
- Scheduled items: Rounded rectangles with orange left accent
- Each event: Content thumbnail (24px), title truncated, time range
- Hover: Expand to show full details in tooltip
- Click to edit: Opens slide-panel from right

**Schedule Form (Modal):**
- Centered overlay, max-w-2xl, white card with shadow-2xl
- Header: Title (20px semi-bold), close X button
- Sections with dividers: Content selection dropdown, Display/Group picker, DateTime with timezone, Recurrence pattern
- Preview panel: Shows what will display and when
- Footer buttons: Cancel (secondary), Save Schedule (primary orange)

### Device Management

**Device Groups Panel:**
- Two-column: Available devices (left) | Group editor (right)
- Each column: White card with header
- Drag devices between lists with smooth animations
- Group cards show: Name input, device count badge, thumbnail grid preview
- Action toolbar: Edit name, Duplicate group, Delete, Apply content

**Device Detail Slide-Panel:**
- Slide from right (w-96 on desktop, full-screen mobile)
- White background
- Sections: Live screenshot (large), System info table, Network details, App list, Activity log
- Action buttons stacked: Restart (secondary), Update firmware (secondary), Remove device (red outlined)
- Hash verification: Monospace text with copy button

### Form Elements

**Input Fields:**
- Text inputs: h-12, px-4, rounded-lg, border gray-300, focus:border-teal
- Labels: mb-2, text-sm medium, gray-700
- Dropdowns: Custom chevron icon, same dimensions as text inputs
- Search bars: Magnifying glass left icon, clear button appears on input
- Toggle switches: w-12 h-6, teal when active
- Checkboxes: 20px, custom teal check icon

**Button Hierarchy:**
- Primary: Dark teal background, white text, h-12, px-6, rounded-lg, medium weight
- Secondary: White background, teal border (2px), teal text, same dimensions
- Tertiary: Text only, teal text, hover shows light teal background
- Icon buttons: 40px square, rounded-lg, teal text with hover background
- Destructive: Red outlined or red filled for critical actions

### Status & Feedback

**Status Badges:**
- Pill shape: px-3 py-1, rounded-full, 12px medium text
- Online: Green background (#4caf50), white text
- Offline: Red background (#f44336), white text
- Warning: Amber background (#ffa726), white text
- Attention: Orange background (#ff8c42), white text

**Toast Notifications:**
- Position: Top-right, stacked
- White card with colored left accent (4px)
- Icon + message + close button
- Success: Green accent, check icon
- Error: Red accent, X icon
- Info: Teal accent, info icon
- Auto-dismiss: 5 seconds

**Loading States:**
- Skeleton loaders: Animated gray-200 to gray-300 gradient
- Spinners: Teal circular spinner (24px standard, 40px large)
- Progress bars: Teal fill on gray-200 background

### Tables & Data Display

**Data Tables:**
- White card container
- Header row: Light gray background, sticky positioning
- Row height: h-14, hover shows light teal background
- Sortable columns: Arrow indicators
- Inline actions: Icon buttons appear on row hover
- Pagination: Bottom center with page numbers, prev/next buttons
- Striped rows for readability (alternating very light gray)

---

## Images

**Dashboard Context:**
- **No hero images** - Functional dashboard focused on data and workflow
- **Device Screenshots:** Live previews in display cards and detail panels (aspect-video)
- **Content Thumbnails:** User-uploaded images/videos shown in library grid (various aspect ratios)
- **Map Markers:** Custom icon-based pins on geographic view
- **Empty States:** Simple teal-toned illustrations for no devices, empty content library, no scheduled items
- **User Avatars:** Circular profile images (32px) in top navigation and activity feeds

---

## Animations

**Functional Only - No Decorative Effects:**
- Page transitions: Fade (200ms)
- Panel/modal slide-in: Transform + opacity (300ms)
- Hover states: Background/border (150ms)
- Drag-and-drop: Shadow lift, smooth position
- Real-time updates: Subtle pulse on new data badges (2s cycle)
- Chart rendering: Animate from zero (600ms ease-out)