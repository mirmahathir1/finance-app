[← Back to README](README.md)

# Application Architecture

## High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js App (React + TypeScript)              │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Global Progress Bar (for API calls)              │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   UI Layer   │  │  State Mgmt  │  │  Auth Layer  │ │ │
│  │  │   (MUI)      │  │  (Context)   │  │ (Credentials)│ │ │
│  │  │              │  │              │  │ (Guest Mode) │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Guest Mode Indicator (Floating Icon)              │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ IndexedDB (Profile & Currency Storage)           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth API    │  │  Domain APIs │  │  Services    │     │
│  │              │  │  (CRUD)      │  │  (Reports)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Note: Guest Mode bypasses server - data generated          │
│  client-side using GuestDataService (Faker.js)              │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data & Infrastructure                  │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   Auth & Sessions      │  │  PostgreSQL (Neon)       │  │
│  │ (Credentials + Cookies)│  │  (Primary Data Store)    │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context API
- **Authentication**: Credentials (email + password) with HTTP-only session cookie
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Storage**: PostgreSQL (Neon)
- **Data Format**: Normalized relational schema

### Deployment
- **Container**: Docker
- **Platform**: Cloud hosting of choice
- **PWA**: Progressive Web App with Service Worker
- **Mobile**: Bubblewrap for Android packaging

## Key Architectural Decisions

1. **Hybrid Storage Architecture**: 
   - Core transaction data (transactions only) in PostgreSQL (Neon)
   - Profile, tag, and currency data stored client-side in IndexedDB for offline availability
   - Transactions include profile name and tag names as text fields
2. **Session-based Auth**: First-party credentials with HTTP-only cookies; no third-party OAuth.
3. **Profile-Based Filtering**: Transactions filtered by profile name (text field) at query time
4. **Embedded Tags**: Tag names stored as text array in transactions for simplicity
5. **Mobile-First PWA**: Responsive design that works on all devices and can be installed as an app
6. **Global Progress Indicator**: Unified loading feedback for API calls
7. **Backups**: Per-user backup to a single CSV file containing only transaction data (excludes `id` and `user_id` columns) for download; restore by uploading that CSV file (replaces all user transaction data). Profile, tag, and currency data are not included in backups as they're stored locally in IndexedDB.
8. **Guest Mode**: Allow users to explore the app without authentication. API calls are intercepted client-side before reaching the server, and a unified `GuestDataService` generates mock data directly in the browser using Faker.js. This approach eliminates the need for server-side guest routes, provides zero network overhead, and ensures instant responses. Guest mode state is stored in localStorage, and a floating indicator shows when Guest Mode is active.

## Data & Reporting Services

### Responsibilities
- Aggregations and reporting (by date ranges, tags, categories)
- Per-user backup/restore endpoints:
  - `GET /api/backup` → streams CSV file of user's transactions (excludes `id` and `user_id` columns)
  - `POST /api/restore` → uploads CSV file and restores user's transaction data transactionally (deletes existing user transaction data first)
- Data retention and housekeeping tasks

### Notes
- Use parameterized queries/ORM to prevent SQL injection.
- Encapsulate authorization checks in service functions close to data access.

