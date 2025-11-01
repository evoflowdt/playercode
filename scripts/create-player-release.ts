import { createGitHubRelease } from '../server/github';

const OWNER = 'evoflowdt';
const REPO = 'playercode';
const VERSION = 'v1.1.0';

const CHANGELOG = `## 🎨 UI Enhancements

### New Features
- **Connection Status Badge**: Visual indicator in the top-right corner showing connection status (green when connected)
- **Content Pagination**: Page counter in the bottom-left showing current position (e.g., "1 / 5")
- **Interactive Player Controls**: Transparent overlay controls with auto-hide functionality
  - ⏸️ **Play/Pause**: Stop and resume content playback with accurate timing
  - 🔄 **Refresh**: Reload content from the platform
  - ⛶ **Fullscreen**: Toggle fullscreen mode
- **Auto-Hide UI**: All controls automatically hide after 5 seconds and reappear on mouse hover
- **Webpage Content Support**: Full support for displaying web URLs via iframe with auto-refresh capability

### Improvements
- Enhanced pause/resume accuracy tracking elapsed time for precise content resumption
- Fullscreen state synchronization with system events
- Smooth hover effects on all interactive elements
- Professional semi-transparent overlays for better content visibility

### Technical Changes
- Added \`webpage\` content type to TypeScript definitions
- Compiled renderer with updated UI logic and event handlers
- Fixed script loading path in HTML for proper module resolution

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
