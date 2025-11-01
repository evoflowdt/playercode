import { createGitHubRelease } from '../server/github';

const OWNER = 'evoflowdt';
const REPO = 'playercode';
const VERSION = 'v1.2.0';

const CHANGELOG = `## 🎨 UI Enhancements - Auto-Hide Controls

### New Features

#### 🟢 Connection Status Badge
- Visual indicator in the top-right corner
- Green when connected, red when disconnected
- Pulsing animation for visual feedback
- **Auto-hides after 5 seconds**
- **Reappears on mouse hover**

#### 📄 Content Pagination
- Page counter showing current position (e.g., "1 / 5")
- Bottom-left positioning for non-intrusive display
- **Auto-hides after 5 seconds**
- **Reappears on mouse hover**

#### 🎮 Interactive Player Controls
- Transparent overlay controls with blur effect
- Central positioning for easy access
- Three control buttons:
  - ⏸️ **Play/Pause**: Stop and resume content playback
  - 🔄 **Refresh**: Reload content from the platform
  - ⛶ **Fullscreen**: Toggle fullscreen mode
- **Auto-hide after 5 seconds**
- **Reappear on mouse hover**
- Smooth hover effects and transitions

#### 🌐 Webpage Content Support
- Full support for displaying web URLs via iframe
- Auto-refresh capability for dynamic content
- Seamless integration with content rotation

### Improvements
- Enhanced pause/resume with accurate elapsed time tracking
- Fullscreen state synchronization with system events
- Professional semi-transparent overlays
- Non-intrusive UI that doesn't distract from content
- Better user experience for kiosk mode

### Technical Changes
- Added \`webpage\` content type to TypeScript definitions
- Implemented auto-hide timer system (5-second delay)
- CSS hover states for UI element visibility
- Updated renderer with UI event handlers

---

## 📥 Installation

This release contains the source code. To build the player:

\`\`\`bash
# Clone the repository
git clone https://github.com/evoflowdt/playercode.git
cd playercode

# Install dependencies
npm install

# Build the player
npm run build

# Run the player
npm start

# Or build platform-specific installers
npm run dist:win   # Windows
npm run dist:mac   # macOS
npm run dist:linux # Linux
\`\`\`

For detailed build instructions, visit the [EvoFlow Downloads page](https://evoflow.digital/downloads).
`;

async function main() {
  try {
    console.log(`🚀 Creating GitHub Release ${VERSION}...`);
    
    const release = await createGitHubRelease(
      OWNER,
      REPO,
      VERSION,
      CHANGELOG,
      false // not a prerelease
    );
    
    console.log(`✅ Release created successfully!`);
    console.log(`🔗 ${release.html_url}`);
    console.log(`\n📦 Tag: ${release.tag_name}`);
    console.log(`📅 Published: ${release.published_at}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
