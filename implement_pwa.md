# PWA Implementation Guide

This document provides step-by-step implementation instructions for converting the Finance App into a Progressive Web App. Each phase is standalone and can be implemented independently.

## Overview

The implementation is divided into 5 standalone phases:
1. **Phase 1: Icon Generation** - Generate PWA icons from existing logo
2. **Phase 2: Web App Manifest** - Create and configure the app manifest
3. **Phase 3: Service Worker Setup** - Configure service worker for static asset caching
4. **Phase 4: Build Timestamp Display** - Add build info to Settings page
5. **Phase 5: Install Prompt UI** - Add custom install prompt component

---

## Phase 1: Icon Generation Script

### Overview
Create a script to generate all required PWA icon sizes from the existing `public/logo.png` file.

### Prerequisites
- `public/logo.png` exists
- Node.js installed

### Implementation Steps

#### Step 1.1: Install Dependencies
```bash
npm install --save-dev sharp to-ico
```

#### Step 1.2: Create Scripts Directory
```bash
mkdir -p scripts
```

#### Step 1.3: Create Icon Generation Script
Create `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const inputLogo = path.join(__dirname, '..', 'public', 'logo.png');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Icon sizes to generate
const iconSizes = [
  16, 32, 48, 96, 128, 180, 192, 256, 384, 512
];

async function generateIcons() {
  try {
    // Validate input exists
    if (!fs.existsSync(inputLogo)) {
      throw new Error(`Logo file not found: ${inputLogo}`);
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    console.log('Generating icons...');

    // Generate PNG icons
    const pngPromises = iconSizes.map(async (size) => {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    });

    await Promise.all(pngPromises);

    // Generate favicon.ico (multi-resolution)
    const faviconSizes = [16, 32, 48];
    const faviconBuffers = await Promise.all(
      faviconSizes.map(async (size) => {
        return await sharp(inputLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer();
      })
    );

    const icoBuffer = await toIco(faviconBuffers);
    const faviconPath = path.join(outputDir, 'favicon.ico');
    fs.writeFileSync(faviconPath, icoBuffer);
    console.log(`✓ Generated ${faviconPath}`);

    // Copy 180x180 as apple-touch-icon
    const appleTouchIcon = path.join(outputDir, 'icon-180x180.png');
    const appleTouchIconDest = path.join(outputDir, 'apple-touch-icon.png');
    if (fs.existsSync(appleTouchIcon)) {
      fs.copyFileSync(appleTouchIcon, appleTouchIconDest);
      console.log(`✓ Generated ${appleTouchIconDest}`);
    }

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
```

#### Step 1.4: Add Script to package.json
Add to `package.json` scripts section:
```json
{
  "scripts": {
    "generate-icons": "node scripts/generate-icons.js"
  }
}
```

#### Step 1.5: Run Icon Generation
```bash
npm run generate-icons
```

### Verification
- Check that `public/icons/` directory exists
- Verify all icon files are generated:
  - `favicon.ico`
  - `icon-16x16.png` through `icon-512x512.png`
  - `apple-touch-icon.png`
- Icons should be visible and properly sized

### Files Created
- `scripts/generate-icons.js`
- `public/icons/` (directory with all icon files)

---

## Phase 2: Web App Manifest

### Overview
Create the web app manifest file and link it in the app layout.

### Prerequisites
- Phase 1 completed (icons generated)
- Access to `app/layout.tsx`

### Implementation Steps

#### Step 2.1: Create Manifest File
Create `public/manifest.json`:

```json
{
  "name": "Finance App",
  "short_name": "Finance",
  "description": "Track your expenses and income",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Note:** Adjust `name`, `short_name`, `description`, `theme_color`, and `background_color` to match your app's branding.

#### Step 2.2: Update Layout File
Open `app/layout.tsx` and add to the `<head>` section (or create a metadata export):

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  // ... existing metadata
  manifest: '/manifest.json',
  themeColor: '#1976d2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Finance App',
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}
```

Alternatively, if using a custom head, add these tags:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1976d2" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### Verification
- Open browser DevTools → Application tab → Manifest
- Verify manifest is detected and valid
- Check that icons are listed correctly
- Verify theme color is set

### Files Created/Modified
- `public/manifest.json` (created)
- `app/layout.tsx` (modified)

---

## Phase 3: Service Worker Setup

### Overview
Configure `next-pwa` to add service worker functionality with static asset caching and automatic updates.

### Prerequisites
- Next.js app running
- Phase 2 completed (manifest exists)

### Implementation Steps

#### Step 3.1: Install next-pwa
```bash
npm install next-pwa
```

#### Step 3.2: Update next.config.js
Open `next.config.js` and update:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-css-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\/_next\/static.+\.(?:js|css|woff|woff2)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withPWA(nextConfig);
```

#### Step 3.3: Update .gitignore
Add to `.gitignore`:
```
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
```

#### Step 3.4: Build and Test
```bash
npm run build:local
npm run start:local
```

### Verification
- Open browser DevTools → Application tab → Service Workers
- Verify service worker is registered
- Check that service worker is active
- Open Network tab and verify static assets are being cached
- Test offline mode (DevTools → Network → Offline) - static assets should still load

### Files Modified
- `next.config.js` (modified)
- `.gitignore` (modified)

### Notes
- Service worker is disabled in development mode
- Service worker will be generated during build
- Automatic updates are enabled (`skipWaiting: true`)

---

## Phase 4: Build Timestamp Display

### Overview
Add build information display to the Settings page to verify service worker updates are working.

### Prerequisites
- Settings page exists at `app/settings/page.tsx`
- Phase 3 completed (service worker working)

### Implementation Steps

#### Step 4.1: Create Build Info Generation Script
Create `scripts/generate-build-info.js`:

```javascript
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');

try {
  // Read package.json for version
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '0.1.0';

  // Generate build info
  const buildInfo = {
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
    version: version,
  };

  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write build info
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2), 'utf8');

  console.log('Build info generated:', buildInfo);
} catch (error) {
  console.error('Error generating build info:', error.message);
  process.exit(1);
}
```

#### Step 4.2: Add Script to package.json
Update `package.json` scripts:

```json
{
  "scripts": {
    "generate-build-info": "node scripts/generate-build-info.js",
    "build:local": "npm run generate-build-info && dotenv -e .env.local -- next build",
    "build:prod": "npm run generate-build-info && dotenv -e .env.production -- next build"
  }
}
```

#### Step 4.3: Update Settings Page
Open `app/settings/page.tsx` and add:

1. **Import statements** (add to existing imports):
```typescript
import { Build as BuildIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
```

2. **State for build info** (add with other useState declarations):
```typescript
const [buildInfo, setBuildInfo] = useState<{
  buildTime?: string
  buildTimestamp?: number
  version?: string
} | null>(null)
```

3. **Fetch build info** (add useEffect):
```typescript
useEffect(() => {
  fetch('/build-info.json')
    .then((res) => res.json())
    .then((data) => setBuildInfo(data))
    .catch((err) => {
      console.error('Failed to load build info:', err)
      // Set fallback if file doesn't exist
      setBuildInfo({
        buildTime: new Date().toISOString(),
        version: '0.1.0',
      })
    })
}, [])
```

4. **Add App Information section** (add after Appearance section, around line 447):
```typescript
<AnimatedSection delay={210}>
  <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
    <Typography variant="h6" gutterBottom>
      App Information
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Build information and version details.
    </Typography>
    <Divider sx={{ my: 3 }} />
    {buildInfo && (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BuildIcon color="primary" />
          <Box>
            <Typography variant="body1">Build Time</Typography>
            <Typography variant="body2" color="text.secondary">
              {buildInfo.buildTime
                ? new Date(buildInfo.buildTime).toLocaleString()
                : 'Unknown'}
            </Typography>
          </Box>
        </Box>
        {buildInfo.version && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Version: {buildInfo.version}
            </Typography>
          </Box>
        )}
      </Box>
    )}
  </Paper>
</AnimatedSection>
```

#### Step 4.4: Test Build Info Generation
```bash
npm run generate-build-info
```

Verify `public/build-info.json` is created with correct content.

#### Step 4.5: Build and Test
```bash
npm run build:local
npm run start:local
```

Navigate to Settings page and verify build info is displayed.

### Verification
- `public/build-info.json` exists after build
- Settings page displays build time and version
- Build timestamp updates after each new build
- Service worker update causes new build info to be fetched

### Files Created/Modified
- `scripts/generate-build-info.js` (created)
- `package.json` (modified - build scripts updated)
- `app/settings/page.tsx` (modified - App Information section added)

---

## Phase 5: Install Prompt UI

### Overview
Create a custom install prompt component that appears when the app is installable.

### Prerequisites
- Phase 2 completed (manifest exists)
- Phase 3 completed (service worker working)
- App is served over HTTPS (or localhost)

### Implementation Steps

#### Step 5.1: Create Install Prompt Component
Create `components/InstallPrompt.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
} from '@mui/material'
import {
  GetApp as GetAppIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or if dismissed recently
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  // Check if dismissed recently (within last 7 days)
  const dismissedTime = localStorage.getItem('installPromptDismissed')
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
    if (daysSinceDismissed < 7) {
      return null
    }
  }

  return (
    <Slide direction="down" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          p: 2,
          maxWidth: 400,
          width: '90%',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <GetAppIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight="bold">
            Install Finance App
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add to home screen for quick access
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleInstall}
          startIcon={<GetAppIcon />}
        >
          Install
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{ ml: 1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  )
}
```

#### Step 5.2: Add Install Prompt to Layout
Open `app/layout.tsx` and add:

```typescript
import { InstallPrompt } from '@/components/InstallPrompt'

// In the body, add before closing </body>:
<InstallPrompt />
```

Or add it to a specific page if you prefer (e.g., dashboard).

#### Step 5.3: Build and Test
```bash
npm run build:local
npm run start:local
```

### Verification
- Install prompt appears when app is installable
- Install button triggers native install prompt
- Dismiss button hides the prompt
- Prompt doesn't appear if app is already installed
- Prompt respects dismissal (won't show again for 7 days)

### Files Created/Modified
- `components/InstallPrompt.tsx` (created)
- `app/layout.tsx` (modified - InstallPrompt added)

### Notes
- Install prompt only works on HTTPS (or localhost)
- Not all browsers support `beforeinstallprompt` event
- iOS Safari doesn't support this event - users must use "Add to Home Screen" manually

---

## Testing Checklist

After completing all phases, verify:

- [ ] Icons are generated and display correctly
- [ ] Manifest is valid (check in DevTools)
- [ ] Service worker is registered and active
- [ ] Static assets are cached
- [ ] Build info displays in Settings
- [ ] Install prompt appears (on supported browsers)
- [ ] App can be installed on Android
- [ ] App can be installed on iOS (via Safari share menu)
- [ ] Service worker updates automatically
- [ ] Build timestamp updates after new build

## Troubleshooting

### Service Worker Not Registering
- Ensure app is served over HTTPS (or localhost)
- Check browser console for errors
- Verify `next.config.js` is configured correctly
- Clear browser cache and reload

### Icons Not Displaying
- Verify icons are generated in `public/icons/`
- Check manifest.json icon paths are correct
- Clear browser cache

### Build Info Not Updating
- Verify script runs before build
- Check `public/build-info.json` exists after build
- Clear service worker cache if needed

### Install Prompt Not Showing
- App must be served over HTTPS (or localhost)
- Manifest must be valid
- Service worker must be registered
- Browser must support `beforeinstallprompt` event

## Next Steps

After completing all phases:
1. Test on multiple devices and browsers
2. Run Lighthouse PWA audit
3. Deploy to staging environment
4. Test install flow end-to-end
5. Monitor service worker errors in production

