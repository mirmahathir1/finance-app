# Technology Stack

## Overview
This document details the complete technology stack for the finance-app personal finance tracking application.

## Core Technologies

### Frontend Framework
- **Next.js** (v14+)
  - React-based framework for server-side rendering and static site generation
  - App Router for modern routing patterns
  - API routes for backend endpoints
  - Built-in optimization for performance

### Language
- **TypeScript** (v5+)
  - Type-safe development
  - Enhanced IDE support and autocomplete
  - Better code maintainability and documentation

### UI Framework
- **Material UI (MUI)** (v5+)
  - `@mui/material` - Core components
  - `@mui/icons-material` - Icon library
  - `@emotion/react` and `@emotion/styled` - CSS-in-JS styling
  - Responsive design components
  - Theme customization support

## Authentication & Storage

### Google Cloud Platform Services
- **Google Sign-In / OAuth 2.0**
  - `next-auth` or `@react-oauth/google` for authentication flow
  - Scopes required:
    - `https://www.googleapis.com/auth/userinfo.profile`
    - `https://www.googleapis.com/auth/userinfo.email`
    - `https://www.googleapis.com/auth/drive.file`
    - `https://www.googleapis.com/auth/drive.appdata`

- **Google Drive API**
  - `googleapis` npm package for Node.js
  - CSV file storage and retrieval
  - Folder selection and management

### Required Google Cloud Project Configuration
1. **OAuth 2.0 Client ID**
   - Create credentials in Google Cloud Console
   - Add authorized JavaScript origins
   - Add authorized redirect URIs

2. **Enable APIs**
   - Google Drive API
   - Google People API (for user profile)

3. **Environment Variables Needed**
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=your_app_url
   ```

## Data Visualization

### Charts & Statistics
- **Recharts**
  - Pie charts for expense category breakdown
  - Bar charts for income vs expense comparison
  - Responsive and customizable
  - Integration with React components

## Deployment & Containerization

### Docker
- **Dockerfile** for containerization
- Multi-stage builds for optimized image size
- Base image: `node:18-alpine` or `node:20-alpine`

### Google Cloud Platform
- **Google Cloud Run** or **Google Kubernetes Engine (GKE)**
  - Serverless container deployment
  - Auto-scaling capabilities
  - HTTPS enabled by default

- **Google Container Registry (GCR)** or **Artifact Registry**
  - Docker image storage

### CI/CD
- **Google Cloud Build** (optional)
  - Automated builds on git push
  - Deployment pipeline

## Mobile App

### Bubblewrap / TWA (Trusted Web Activity)
- **Bubblewrap CLI**
  - Convert PWA to Android app
  - Package for Google Play Store
  - Requirements:
    - PWA manifest.json
    - Service worker
    - HTTPS enabled
    - Digital Asset Links for verification

## Data Storage & Management

### CSV File Structure
The app uses CSV files stored in Google Drive for data persistence:
1. **transactions-YYYY-MM.csv** - Monthly transactions (both expenses and incomes) with transaction type and currency
2. **tags.csv** - Expense and income category tags with colors
3. **currencies.csv** - Exchange rates per month (currency, year, month, ratio)
4. **settings.json** - App configuration and preferences

**Note:** The unified transaction file includes a `transactionType` field to distinguish between "expense" and "income" records.

### CSV Handling
- **papaparse**
  - CSV parsing and stringification
  - Type-safe parsing with TypeScript
  - Support for headers and custom delimiters

### Date Management
- **date-fns**
  - Date formatting and manipulation
  - Timezone support
  - Lightweight alternative to moment.js

### Currency & Number Formatting
- **Intl.NumberFormat** (Built-in JavaScript API)
  - Currency formatting for different locales
  - No additional library needed
  - Example: `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(123.45)`
- **Custom Currency Conversion Utilities**
  - Utility functions for converting between currencies
  - Exchange rate management
  - USD as base currency for conversions

## Code Quality & Validation

### Validation
- **Zod**
  - Runtime type validation
  - Form validation
  - API request/response validation

### Linting & Formatting
- **ESLint** - Code linting
- **Prettier** (optional) - Code formatting
- **TypeScript compiler** - Type checking

## Development Tools

### Package Manager
- **npm** or **yarn** or **pnpm**

### Node.js
- Version: 18.x or 20.x LTS

## Browser Requirements

### PWA Requirements
- HTTPS (required for service workers)
- manifest.json with app metadata
- Icons (192x192, 512x512)
- Service worker for offline support

## Setup Instructions

### Prerequisites
1. Node.js 18+ installed
2. Google Cloud Project created
3. OAuth 2.0 credentials configured
4. Docker installed (for deployment)

### Local Development Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Google Cloud credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Build
```bash
# Build Docker image
docker build -t finance-app .

# Run Docker container
docker run -p 3000:3000 --env-file .env finance-app
```

### Deploy to Google Cloud Run
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/finance-app

# Deploy to Cloud Run
gcloud run deploy finance-app \
  --image gcr.io/PROJECT_ID/finance-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Security Considerations

1. **Environment Variables**: Never commit credentials to git
2. **OAuth Scopes**: Request only necessary permissions
3. **HTTPS**: Required for production deployment
4. **CORS**: Configure properly for API routes
5. **Data Privacy**: CSV files are user-specific and stored in user's Google Drive

## Performance Optimization

- Next.js automatic code splitting
- Image optimization with next/image
- CSS-in-JS with Emotion for optimized styling
- Server-side rendering for faster initial load
- Static generation where possible
