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
│  │  │ IndexedDB (Profile, Currency & Guest Mode)      │  │ │
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
8. **Guest Mode**: Allow users to explore the app without authentication. API calls are intercepted client-side before reaching the server, and a unified `GuestDataService` generates mock data directly in the browser using Faker.js. This approach eliminates the need for server-side guest routes, provides zero network overhead, and ensures instant responses. Guest mode state is stored in IndexedDB, and a floating indicator shows when Guest Mode is active.

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

## State Management

### Context Providers

The application uses React Context API for global state management:

#### AuthContext
- User session state
- Sign in/out functions
- Loading states
- Guest mode state
- Enter/exit guest mode functions

#### AppContext
- Global app settings
- Date format preferences

#### ProfileContext
- Profiles list (loaded from IndexedDB)
- Active profile state
- Functions to add, rename, delete, switch profiles
- Profile loading and syncing state

#### TagContext
- Tags data for active profile (loaded from IndexedDB)
- Functions to add, edit, delete tags
- Tag loading and syncing state
- Filter tags by transaction type

#### CurrencyContext
- Currencies data (loaded from IndexedDB)
- Default currency preference
- Functions to add, edit, delete currencies
- Currency loading and syncing state

#### LoadingContext
- Global loading state for API calls
- Request counter to track concurrent external requests
- Functions to increment/decrement loading state
- Used by GlobalProgressBar component to show/hide progress indicator

**Implementation Note:** API route handlers should toggle the `LoadingContext` to automatically show/hide the global progress bar.

### Local State
- Form inputs (controlled components)
- UI states (modals, drawers, dialogs)
- Loading and error states for async operations (local spinners, not global progress bar)

## Security Considerations

### Data Privacy
- User account, profile, and application data are stored in PostgreSQL (Neon)
- Only minimal user PII is stored (e.g., email). No profile photo storage
- Users can only access rows they own; enforce row-level authorization in service layer

### API Security
- CSRF protection for state-changing requests (double-submit cookie or CSRF token)
- Rate limiting on API routes (see individual page documentation for specific limits)
- Input validation and sanitization
- SQL injection prevention (parameterized queries/ORM)

### Rate Limiting Implementation
Rate limiting is critical for authentication endpoints to prevent brute force attacks, credential stuffing, and abuse. Implementation notes:

- Use Redis or an in-memory store (e.g., `node-rate-limiter-flexible`, `express-rate-limit`) for tracking attempts
- Rate limit keys should combine endpoint + identifier (email/IP) for granular control
- Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers in responses
- Log rate limit violations for security monitoring
- Consider implementing progressive delays (exponential backoff) for repeated violations

### Authorization
- Role-based access control (RBAC) with `roles` and `user_roles` tables (or a `role` column)
- Fine-grained checks at the service layer per route/action

## Error Handling

### Client-Side Errors
- Form validation errors: Display inline below fields
- Authentication errors: Show inline errors; throttle repeated failures

### Server-Side Errors
- 401 Unauthorized: Re-authenticate
- 403 Forbidden: Show permission error
- 404 Not Found: Show empty state
- 500 Server Error: Show error page with support info

### Logging
- Client: Console errors in development
- Server: Structured logging with timestamps
- Production: Error tracking service (optional)

## Best Practices

### Data Integrity
- Currency can be any valid 3-letter code (transactions store currency as text in PostgreSQL)
- Profile can be any valid string (transactions store profile name as text in PostgreSQL)
- Tags can be any valid strings (transactions store tag names as text array in PostgreSQL)
- No need to check if currency, profile, or tags exist before saving transaction (transactions are independent)
- Profiles, tags, and currencies can be added in IndexedDB freely. Deletion is only allowed if no transactions use them (validated via API before deletion)
- Ensure at least one profile, one currency, and some default tags exist in IndexedDB during initial setup
- Prevent deletion of the active profile
- Validate profile names are unique when creating new profiles
- Validate tag names are unique within a profile and type
- Currency codes must be 3 uppercase letters
- When renaming/deleting profiles or tags in IndexedDB, existing transactions in PostgreSQL retain the old values

### Performance
- Load all profiles, tags, and currencies from IndexedDB (instant, no network calls)
- IndexedDB provides offline access to profiles, tags, and currency lists
- Profile switching is instant (no API calls, just IndexedDB update)
- Tag filtering by profile happens client-side instantly
- Global progress bar uses request counting to handle concurrent calls efficiently
- No API calls needed for profile, tag, or currency operations
- Transaction queries filtered by profile name at the database level
- Tags embedded in transactions as text array for efficient querying
- **Guest Mode**: Zero network overhead - all data generated client-side with minimal delay simulation

### User Experience
- Pre-select user's default currency from IndexedDB in transaction forms
- Display active profile name prominently in the dashboard
- Make profile switching instant and intuitive (no loading, all client-side)
- Load tags instantly when switching profiles or transaction types
- Clearly indicate which currency is the default currency throughout the app
- Include "Add New Currency" option in transaction form for quick currency addition
- Display clear currency filter in statistics (e.g., "Showing only USD transactions")
- Use consistent currency formatting throughout app
- Show currency symbols where appropriate ($ £ € ¥)
- Use tag colors for visual identification in transaction lists and statistics
- Explain that profiles, tags, and currencies are stored locally during first-time setup
- Make it clear that no currency conversion occurs
- Inform users that profiles, tags, and currencies are NOT included in backups (stored locally in IndexedDB)
- Warn users when renaming/deleting profiles or tags that existing transactions keep the old values
- Global progress bar provides consistent feedback for API operations without cluttering the UI
- Provide clear explanations about profile separation during setup
- Show confirmation dialogs when deleting profiles or tags to prevent accidental data loss
- Profiles, tags, and currencies are shared across all users on the same browser/device (browser-level storage)
- Users need to re-create profiles, tags, and currencies when moving to a new device/browser
- **Profile Auto-Population**: At startup, if IndexedDB profiles are empty, automatically populate from existing profiles in transactions for that user
- **Import from Database**: Provide "Import from Database" option in tags and currency screens to scan transactions and auto-populate IndexedDB (handles duplicates gracefully)
- **Guest Mode**: Provide seamless experience with fake data; clearly indicate Guest Mode status; allow easy exit to login page

