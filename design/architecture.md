# Application Architecture

## High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js App (React + TypeScript)              │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Global Progress Bar (for external API calls)     │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   UI Layer   │  │  State Mgmt  │  │  Auth Layer  │ │ │
│  │  │   (MUI)      │  │  (Context)   │  │ (NextAuth)   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth API    │  │  Drive API   │  │  CSV Parser  │     │
│  │              │  │  Backup Svc  │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↕ Google APIs
                   (triggers Global Progress Bar)
┌─────────────────────────────────────────────────────────────┐
│                      Google Cloud Platform                   │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │  Google OAuth 2.0      │  │   Google Drive API       │  │
│  │  (Authentication)      │  │   (CSV File Storage)     │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context API
- **Authentication**: NextAuth.js
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Storage**: Google Drive API
- **Data Format**: CSV files

### Deployment
- **Container**: Docker
- **Platform**: Google Cloud Run
- **PWA**: Progressive Web App with Service Worker
- **Mobile**: Bubblewrap for Android packaging

## Key Architectural Decisions

1. **CSV-Based Storage**: Simple, portable, human-readable format stored directly in user's Google Drive
2. **Stateless Design**: No application-side database; all data in user's Google Drive
3. **Profile Isolation**: Each profile has its own folder and CSV files for complete data separation
4. **Mobile-First PWA**: Responsive design that works on all devices and can be installed as an app
5. **Global Progress Indicator**: Unified loading feedback for all external API calls
6. **Snapshot Backups**: Full-folder snapshots per profile stored under `backup/{profile}/{timestamp}` in Drive

## Backup Service

### Responsibilities
- Create full-folder snapshot for a profile
- List available snapshots per profile (sorted by timestamp)
- Stream a snapshot as a ZIP for download
- Restore snapshot to the live profile folder (destructive replace)

### Drive Layout
- Root `FinanceApp/`
  - `Profiles/` → live profile folders
  - `backup/` → per-profile subfolders with timestamped snapshot folders

### Flows
1. Create Backup
   - Ensure `backup/` and `backup/{profile}` folders exist
   - Create timestamp folder `YYYY-MM-DDTHH-mm-ssZ`
   - Copy all files from `Profiles/{Profile-*}` to snapshot folder
2. List Backups
   - List child folders in `backup/{profile}` and map to entries
3. Download Backup
   - Read files under `backup/{profile}/{timestamp}` and stream ZIP
4. Restore Backup
   - Confirm intent → delete/replace contents of live `Profiles/{Profile-*}`
   - Copy files from snapshot to live folder
   - Invalidate caches and refresh client state

