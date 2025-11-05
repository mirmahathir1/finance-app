# Deployment & Distribution

## Deployment Architecture

### Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Google Cloud Run
- Automatic HTTPS
- Auto-scaling based on traffic
- Pay-per-use pricing
- Global CDN

### Environment Variables
- Inject via Cloud Run service configuration
- Use Secret Manager for sensitive data
- Never commit credentials to repository

## Progressive Web App (PWA)

### Manifest Configuration
```json
{
  "name": "Finance Tracker",
  "short_name": "FinApp",
  "description": "Personal finance tracking app",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#fafafa",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
- Cache static assets
- Offline fallback page
- Background sync for pending operations (optional)

## Bubblewrap / Android App

### Configuration
1. Generate TWA (Trusted Web Activity)
2. Configure Digital Asset Links
3. Set app name, icons, colors
4. Build APK/AAB for Google Play

### Requirements
- Valid domain with HTTPS
- PWA manifest
- Service worker
- Lighthouse PWA score > 90

