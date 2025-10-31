# Assets Directory

## Icon Files

To properly package the application, you need to add icon files here:

- **icon.png** - Application icon (256x256 or larger)
  - Used for: Windows installer, macOS app, Linux AppImage
  - Format: PNG with transparency
  - Recommended size: 512x512 or 1024x1024

### Creating Your Icon

You can create an icon using any image editor. For a simple EvoFlow icon:

1. Create a 512x512 PNG image
2. Use the EvoFlow brand colors (teal gradient)
3. Add the "EF" letters or EvoFlow logo
4. Save as `icon.png` in this directory

### Temporary Fallback

The app will use a system default icon if `icon.png` is not present. This allows building without custom icons, but for production releases you should add a proper icon.

## Platform-Specific Icons (Optional)

For better results on each platform:

- **Windows**: icon.ico (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- **macOS**: icon.icns (Apple icon format)
- **Linux**: icon.png (256x256 or larger)

electron-builder can generate these automatically from icon.png.
