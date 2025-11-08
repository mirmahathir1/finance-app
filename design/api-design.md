[← Back to README](README.md)

# API Routes Design

## Authentication APIs

All authentication endpoints are protected by rate limiting to prevent brute force attacks and abuse. See `design/authentication.md` for detailed rate limit specifications.

- `POST /api/auth/signup/request` — Initiate signup by email; send Brevo verification link (always returns 200)
  - Rate limit: 5 per email/hour, 10 per IP/hour
- `GET /api/auth/verify?token=` — Verify signup token; create user and mark email as verified
  - Rate limit: 10 per IP/hour
- `POST /api/auth/set-password` — Set password after verification (if required)
  - Rate limit: 5 per email/hour, 10 per IP/hour
- `POST /api/auth/login` — Login with email/password (sets HTTP-only cookie)
  - Rate limit: 5 failed attempts per email/15min, 10 per IP/15min
  - Account lockout: 15 minutes after 5 failed attempts
- `POST /api/auth/logout` — Logout and invalidate session
  - Rate limit: 20 per IP/minute
- `GET /api/auth/session` — Get current session/user
  - Rate limit: 60 per IP/minute

## Storage
Backed by PostgreSQL (Neon). All endpoints below operate on database tables with server-side authorization checks.

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode. See Guest Mode section below.

## Data Management APIs
- `GET /api/transactions?profile&from&to&type` — List transactions (paged, filtered by profile name)
- `POST /api/transactions` — Create transaction (includes profile name and tag names array in body)
- `PUT /api/transactions/:id` — Update transaction (includes tag names array)
- `DELETE /api/transactions/:id` — Delete transaction
- `GET /api/statistics?profile&from&to&currency` — Aggregated metrics for specific currency and profile
- `GET /api/settings` — Get user/app settings
- `POST /api/settings` — Update user/app settings

## Guest Mode Data Generation

When the application is in Guest Mode, all API calls are intercepted **client-side** before they reach the server. Instead of making HTTP requests, a unified guest data service generates mock data directly in the browser using Faker.js. This approach:

- **No server routes needed**: All guest data generation happens client-side
- **Zero network overhead**: No HTTP requests in Guest Mode
- **Instant responses**: Data is generated synchronously
- **Simpler maintenance**: Single guest data service handles all endpoints
- **Consistent API**: Same function signatures as real API calls

### Guest Data Service

A centralized `GuestDataService` class handles all mock data generation:

- `getTransactions(params)` — Generates fake transactions matching query parameters
- `createTransaction(data)` — Simulates transaction creation, returns generated transaction
- `updateTransaction(id, data)` — Simulates transaction update, returns generated updated transaction
- `deleteTransaction(id)` — Simulates deletion, returns success response
- `getStatistics(params)` — Generates fake aggregated metrics
- `getSettings()` — Returns generated fake user/app settings
- `updateSettings(data)` — Simulates settings update, returns generated settings

**Implementation Notes:**
- Guest data service uses Faker.js for realistic data generation
- Data is generated deterministically based on query parameters (using seeds) for consistent results
- All methods return Promises that resolve immediately (simulating async API calls)
- Guest mode is detected in the API utility layer, which routes to the guest data service instead of making HTTP requests

**Note:** Profile, Tag, and Currency management is handled entirely on the frontend using IndexedDB. No profile, tag, or currency API endpoints are needed.

## Backup APIs
- `GET /api/backup` — Streams a single CSV file containing only the logged-in user's transaction data.
  - Auth: Authenticated user (session required)
  - Response: `text/csv`, filename `backup-YYYYMMDDTHHmmssZ.csv`
  - Scope: Includes only the current user's transactions (excludes `id` and `user_id` columns)
  - Note: Profiles, Tags, and Currencies are NOT included as they are stored in IndexedDB
- `POST /api/restore` — Accepts a CSV file produced by `GET /api/backup` and restores the logged-in user's transaction data.
  - Auth: Authenticated user (session required)
  - Request: `multipart/form-data` (field `file`) or `text/csv` body
  - Headers: `X-Restore-Confirm: finance-app` (double confirmation)
  - Behavior: Deletes all existing transaction data for the logged-in user, then performs a full transactional restore of the user's transactions from the CSV with schema/header validation and integrity checks. New `id` values are generated and `user_id` is set from the session.

# State Management

## Context Providers

### AuthContext
- User session state
- Sign in/out functions
- Loading states
- Guest mode state
- Enter/exit guest mode functions

### AppContext
- Global app settings
- Date format preferences

### ProfileContext
- Profiles list (loaded from IndexedDB)
- Active profile state
- Functions to add, rename, delete, switch profiles
- Profile loading and syncing state

### TagContext
- Tags data for active profile (loaded from IndexedDB)
- Functions to add, edit, delete tags
- Tag loading and syncing state
- Filter tags by transaction type

### CurrencyContext
- Currencies data (loaded from IndexedDB)
- Default currency preference
- Functions to add, edit, delete currencies
- Currency loading and syncing state

### LoadingContext
- Global loading state for API calls
- Request counter to track concurrent external requests
- Functions to increment/decrement loading state
- Used by GlobalProgressBar component to show/hide progress indicator

**Implementation Note:** API route handlers should toggle the `LoadingContext` to automatically show/hide the global progress bar.

## Local State
- Form inputs (controlled components)
- UI states (modals, drawers, dialogs)
- Loading and error states for async operations (local spinners, not global progress bar)

