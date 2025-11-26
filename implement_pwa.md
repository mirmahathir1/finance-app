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

#### Command Line Verification
```bash
# Check icons directory exists
ls -lh public/icons/

# Verify all 12 files are created
ls public/icons/ | wc -l  # Should output: 12
```

**Expected files:**
- `favicon.ico`
- `icon-16x16.png`, `icon-32x32.png`, `icon-48x48.png`
- `icon-96x96.png`, `icon-128x128.png`, `icon-180x180.png`
- `icon-192x192.png`, `icon-256x256.png`, `icon-384x384.png`, `icon-512x512.png`
- `apple-touch-icon.png`

#### Browser Verification (After Starting App)

**Using Docker:**
```bash
docker-compose -f deploy/docker/docker-compose.yml up
```

**Using Local:**
```bash
npm run dev:local
```

Then open `http://localhost:3000` and verify:

1. **Direct Icon Access** - Open these URLs to confirm icons load:
   - `http://localhost:3000/icons/favicon.ico`
   - `http://localhost:3000/icons/icon-192x192.png`
   - `http://localhost:3000/icons/icon-512x512.png`
   - `http://localhost:3000/icons/apple-touch-icon.png`

2. **Visual Check** - Each URL should display your app's logo at the respective size

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

#### Using Docker
```bash
docker-compose -f deploy/docker/docker-compose.yml up
```

#### Using Local Dev Server
```bash
npm run dev:local
```

Then open `http://localhost:3000` in your browser.

#### Step 1: Verify Favicon in Browser Tab
- Look at the browser tab
- You should see your Finance App icon (not the default Next.js icon)

#### Step 2: Verify Manifest File Loads
Open `http://localhost:3000/manifest.json` directly in the browser.

**Expected output:**
```json
{
  "name": "Finance App",
  "short_name": "Finance",
  "description": "Track your expenses and income",
  ...
}
```

#### Step 3: Verify Manifest in DevTools

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Manifest** in the left sidebar

**What to check:**
- ✅ Manifest is detected (no errors shown)
- ✅ Identity section shows:
  - Name: "Finance App"
  - Short name: "Finance"
- ✅ Presentation section shows:
  - Start URL: "/"
  - Theme color: #1976d2
  - Background color: #ffffff
  - Display mode: "standalone"
- ✅ Icons section shows 2 icons:
  - icon-192x192.png (192×192)
  - icon-512x512.png (512×512)
- ✅ Icon previews are visible and show your logo

**Firefox:**
1. Press `F12` to open DevTools
2. Go to **Storage** or **Application** tab
3. Look for **Manifest** section

#### Step 4: Verify HTML Meta Tags

In DevTools → **Elements** tab, inspect the `<head>` section:

**Expected tags:**
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#1976d2">
<link rel="icon" href="/icons/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/icons/icon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Finance App">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

#### Step 5: Verify Theme Color (Mobile)

**On Android Chrome:**
1. Access the app on your Android device
   - Use your computer's IP address: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`
2. The browser's address bar should be colored #1976d2 (blue)

**To find your computer's IP:**
```bash
# macOS/Linux
ifconfig | grep inet

# Windows
ipconfig
```

#### Step 6: Type Check

Verify no TypeScript errors:
```bash
npm run type-check
```

Should complete without errors.

### Troubleshooting

**Manifest not loading:**
- Check `public/manifest.json` exists
- Verify JSON syntax is valid: `cat public/manifest.json | jq .`
- Check browser console for errors

**Icons not showing in manifest:**
- Ensure icons were generated in Phase 1
- Verify icon paths in manifest.json are correct
- Check icon URLs load: `http://localhost:3000/icons/icon-192x192.png`

**Favicon not appearing:**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check favicon.ico exists in public/icons/

### Files Created/Modified
- `public/manifest.json` (created)
- `app/layout.tsx` (modified)

---

## Phase 3: Service Worker Setup

### Overview
Configure `next-pwa` to add service worker functionality with static asset caching and automatic updates.

⚠️ **IMPORTANT: Service Worker requires Production Mode**

The configuration includes `disable: process.env.NODE_ENV === 'development'`, which means:
- ❌ Service worker will **NOT** register in development mode
- ✅ Service worker **ONLY** works in production build

**To test service worker features, you MUST use:**
```bash
# Option 1: Local production build
npm run build:local
npm run start:local

# Option 2: Docker production mode
docker-compose -f deploy/docker/docker-compose.yml --profile prod up app-prod
```

**Why disable in development?**
- Hot reloading works better without service worker
- Prevents caching issues during development
- Easier debugging of code changes

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

⚠️ **REMINDER: Service worker only works in production mode!**

#### Option 1: Local Production Build
```bash
# Build the app
npm run build:local

# Start in production mode
npm run start:local
```

Then open `http://localhost:3000`

#### Option 2: Docker Production Mode
```bash
# Stop development containers
docker-compose -f deploy/docker/docker-compose.yml down

# Start production container
docker-compose -f deploy/docker/docker-compose.yml --profile prod up app-prod
```

Then open `http://localhost:3000`

---

#### Step 1: Verify Service Worker Files Generated

After building, check these files exist:
```bash
ls -la public/sw.js
ls -la public/workbox-*.js
```

**Expected output:**
- `public/sw.js` (service worker main file)
- `public/workbox-*.js` (workbox runtime files)
- `public/sw.js.map` (source map)

#### Step 2: Verify Service Worker Registration

**Using Chrome/Edge DevTools:**

1. Open `http://localhost:3000`
2. Press `F12` to open DevTools
3. Go to **Application** tab
4. Click **Service Workers** in the left sidebar

**What to check:**
- ✅ Service worker is listed (shows `sw.js`)
- ✅ Source shows the file path (`http://localhost:3000/sw.js`)
- ✅ Status shows "**activated and is running**"
- ✅ No error messages

**Common Issues:**
- ❌ "No service workers have been detected" = Running in development mode
- ❌ Error status = Check browser console for errors

#### Step 3: Verify Service Worker File is Accessible

Open `http://localhost:3000/sw.js` directly in browser.

**Expected result:**
- Should display JavaScript code (service worker script)
- Status 200 (not 404)

#### Step 4: Verify Cache Storage Created

**In DevTools Application tab:**

1. Expand **Cache Storage** in the left sidebar
2. You should see caches like:
   - `workbox-precache-v2-http://localhost:3000/` (or similar)
   - After navigating: `next-static-assets`, `static-js-css-assets`, etc.

**What to check:**
- ✅ At least one cache is created
- ✅ Precache contains static assets
- ✅ Click on cache to see cached files

#### Step 5: Test Static Asset Caching

**In DevTools Network tab:**

1. Reload the page (`Ctrl+R` or `Cmd+R`)
2. Look at the **Size** column for static assets (JS, CSS, images)
3. Some files should show:
   - "(ServiceWorker)" or "(from ServiceWorker)"
   - Or "disk cache" / "memory cache"

**What to check:**
- ✅ Static assets are being cached
- ✅ Subsequent page loads are faster

#### Step 6: Test Offline Functionality

**Steps:**

1. Navigate around the app (visit 2-3 pages to cache them)
2. Open DevTools → **Network** tab
3. Find the **Throttling** dropdown (says "No throttling")
4. Select **"Offline"**
5. Try to reload the page (`Ctrl+R` or `Cmd+R`)

**Expected result:**
- ✅ Previously visited pages load from cache
- ✅ Static assets (CSS, JS, images) still load
- ✅ You see "(from ServiceWorker)" in Network tab
- ❌ API calls fail (expected - dynamic data isn't cached)

**Re-enable online:**
- Set throttling back to "No throttling"

#### Step 7: Verify Service Worker Console

**In DevTools:**

1. Go to **Console** tab
2. Look for service worker messages
3. You might see messages like:
   - "Workbox is controlling this page"
   - Precaching messages

**Note:** Some messages only appear during registration, so you may need to reload.

#### Step 8: Inspect Service Worker Code (Optional)

**In DevTools Application → Service Workers:**

1. Click on the service worker source link
2. This opens the service worker JavaScript code
3. You can see the Workbox-generated code and caching strategies

### Development Mode Check

If service worker features don't work, verify you're in production mode:

```bash
# This will NOT have service worker (development)
npm run dev:local

# This WILL have service worker (production)
npm run build:local && npm run start:local
```

**In the browser console, check:**
```javascript
// Run this in browser console
console.log('NODE_ENV:', process.env.NODE_ENV)
// Should output: "production" for service worker to work
```

### Troubleshooting

**Service worker not registering:**
- ✅ Confirm running in production mode (`npm run build:local && npm run start:local`)
- ✅ Check `public/sw.js` exists after build
- ✅ Check browser console for registration errors
- ✅ Try in incognito/private window
- ✅ Clear browser cache and reload

**Service worker not updating:**
- Clear service worker: DevTools → Application → Service Workers → "Unregister"
- Clear cache: Application → Storage → "Clear site data"
- Hard reload: `Ctrl+Shift+R` or `Cmd+Shift+R`

**Offline mode not working:**
- Ensure you visited pages before going offline
- Check Cache Storage contains the pages
- Verify service worker is active
- Check console for errors

**Build fails:**
- Ensure `next-pwa` is installed: `npm install next-pwa`
- Check `next.config.js` syntax is correct
- Try removing `.next` folder: `rm -rf .next && npm run build:local`

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

#### Option 1: Local Production Build
```bash
npm run build:local
npm run start:local
```

Then open `http://localhost:3000` and verify:
- Install prompt appears when app is installable
- Install button triggers native install prompt
- Dismiss button hides the prompt
- Prompt doesn't appear if app is already installed
- Prompt respects dismissal (won't show again for 7 days)

#### Option 2: Docker Production Mode

⚠️ **IMPORTANT: Install prompt only works in production mode!**

**Step 1: Stop any running containers**
```bash
# From project root
docker-compose -f deploy/docker/docker-compose.yml down
```

**Step 2: Start production Docker containers**
```bash
# From project root - Start production build
docker-compose -f deploy/docker/docker-compose.yml --profile prod up app-prod postgres
```

Wait for containers to be ready. You should see:
```
finance_app_nextjs_prod | ✓ Ready in Xms
```

**Step 3: Access the application**
Open your browser and navigate to:
```
http://localhost:3000
```

**Step 4: Verify prerequisites for install prompt**

**4.1: Check Service Worker is registered**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Verify:
   - ✅ Service worker is listed
   - ✅ Status shows "activated and is running"
   - ✅ Source shows `http://localhost:3000/sw.js`

**4.2: Check Manifest is valid**
1. In DevTools → **Application** tab
2. Click **Manifest** in the left sidebar
3. Verify:
   - ✅ No errors shown
   - ✅ Icons are displayed
   - ✅ All manifest fields are correct

**4.3: Check build-info.json exists**
Open directly in browser:
```
http://localhost:3000/build-info.json
```
Should show JSON with `buildTime`, `buildTimestamp`, and `version`.

**Step 5: Test Install Prompt**

**5.1: Clear browser state (if testing again)**
If you've tested before, clear the dismissal:
```javascript
// In browser console (F12 → Console tab)
localStorage.removeItem('installPromptDismissed')
```

**5.2: Reload the page**
Press `Ctrl+R` (or `Cmd+R` on Mac) to reload.

**5.3: Look for the install prompt**
The install prompt should appear as a banner at the top of the page with:
- Download icon
- "Install Finance App" title
- "Add to home screen for quick access" description
- "Install" button
- Close (X) button

**Step 6: Test Install Prompt functionality**

**6.1: Test Install button**
1. Click the "Install" button
2. Expected: Native browser install prompt appears
3. You can:
   - Accept: App installs (or shows install dialog)
   - Cancel: Prompt closes, custom prompt remains

**6.2: Test Dismiss button**
1. Click the X (close) button
2. Expected: Prompt slides up and disappears
3. Reload the page
4. Expected: Prompt does not appear again (dismissed for 7 days)

**6.3: Verify dismissal is remembered**
1. In browser console, check:
```javascript
localStorage.getItem('installPromptDismissed')
// Should return a timestamp
```
2. Reload page multiple times
3. Expected: Prompt does not reappear

**Step 7: Test after 7-day dismissal period**
To test the 7-day cooldown (for testing purposes only):
```javascript
// In browser console - simulate old dismissal
localStorage.setItem('installPromptDismissed', (Date.now() - 8 * 24 * 60 * 60 * 1000).toString())
// Reload page - prompt should appear again
```

**Step 8: Test in standalone mode (if installed)**
If you install the app:
1. The prompt should not appear when running in standalone mode
2. Check by opening DevTools console:
```javascript
window.matchMedia('(display-mode: standalone)').matches
// Should return true if installed
```

**Browser Compatibility:**

**Supported browsers (show install prompt):**
- Chrome (Desktop & Android)
- Edge (Desktop & Android)
- Samsung Internet
- Opera

**Not supported (no install prompt, manual install only):**
- iOS Safari (use "Add to Home Screen" from share menu)
- Firefox (no beforeinstallprompt event)
- Safari (Desktop)

**Quick Test Script:**
Run this in the browser console to check everything:
```javascript
// Check if install prompt prerequisites are met
const checks = {
  serviceWorker: 'serviceWorker' in navigator,
  standalone: window.matchMedia('(display-mode: standalone)').matches,
  dismissed: localStorage.getItem('installPromptDismissed'),
  manifest: document.querySelector('link[rel="manifest"]') !== null,
}

console.table(checks)
```

**Troubleshooting in Docker:**

**Install prompt not appearing:**
1. Verify production mode:
   ```bash
   # Check container logs
   docker-compose -f deploy/docker/docker-compose.yml logs app-prod | grep NODE_ENV
   # Should show: NODE_ENV=production
   ```
2. Check browser console for errors (F12 → Console)
3. Verify service worker is active (DevTools → Application → Service Workers)
4. Verify manifest is valid (DevTools → Application → Manifest)
5. Clear browser cache and reload
6. Try incognito/private window
7. Check if dismissed:
   ```javascript
   localStorage.getItem('installPromptDismissed')
   ```

**Service worker not registering:**
- Ensure you're using the production container (`app-prod`), not the dev container
- Check that `public/sw.js` exists in the container:
  ```bash
  docker-compose -f deploy/docker/docker-compose.yml exec app-prod ls -la /app/public/sw.js
  ```

**Build info not showing:**
- Verify build-info.json was generated:
  ```bash
  docker-compose -f deploy/docker/docker-compose.yml exec app-prod cat /app/public/build-info.json
  ```

**Expected Behavior Summary:**
- ✅ Prompt appears automatically when app is installable
- ✅ Prompt shows on first visit (if not dismissed)
- ✅ Install button triggers native browser install dialog
- ✅ Dismiss button hides prompt and remembers for 7 days
- ✅ Prompt does not show if app is already installed
- ✅ Prompt does not show if dismissed within last 7 days

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
- **Docker**: Ensure using production container (`app-prod`), not dev container
- **Docker**: Verify `NODE_ENV=production` in container logs
- Check if dismissed: `localStorage.getItem('installPromptDismissed')` in browser console
- Clear browser cache and try incognito/private window

## Next Steps

After completing all phases:
1. Test on multiple devices and browsers
2. Run Lighthouse PWA audit
3. Deploy to staging environment
4. Test install flow end-to-end
5. Monitor service worker errors in production

