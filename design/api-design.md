# API Routes Design

## Authentication APIs
- `GET /api/auth/[...nextauth]` - NextAuth.js handlers
- `GET /api/auth/session` - Get current session

## Google Drive APIs
- `POST /api/drive/folder/select` - Trigger folder picker
- `GET /api/drive/folder/list` - List files in selected folder
- `GET /api/drive/file/read` - Read file content
- `POST /api/drive/file/write` - Write/update file content
- `DELETE /api/drive/file/delete` - Delete file
- `POST /api/drive/file/create` - Create new file

## Data Management APIs
- `GET /api/transactions/:year/:month` - Get all transactions for month (from active profile)
- `GET /api/transactions/:year/:month?type=expense` - Get expenses for month (filtered, from active profile)
- `GET /api/transactions/:year/:month?type=income` - Get incomes for month (filtered, from active profile)
- `POST /api/transactions` - Create new transaction (expense or income, in active profile)
- `DELETE /api/transactions/:year/:month/:index` - Delete transaction by index (from active profile)
- `GET /api/tags` - Get all tags (from active profile)
- `POST /api/tags` - Update tags (in active profile)
- `GET /api/currencies` - Get all currency records (from active profile)
- `GET /api/currencies/:year/:month` - Get currencies for specific month (from active profile)
- `POST /api/currencies` - Add new currency record (to active profile)
- `PUT /api/currencies/:year/:month/:currency` - Update currency ratio (in active profile)
- `DELETE /api/currencies/:year/:month/:currency` - Delete currency record (from active profile)
- `GET /api/statistics/:year/:month` - Get statistics for month (from active profile)
- `GET /api/statistics/:year/:month/:currency` - Get statistics in specific currency (from active profile)
- `GET /api/settings` - Get app settings
- `POST /api/settings` - Update app settings

## Profile Management APIs
- `GET /api/profiles` - Get all profiles
- `POST /api/profiles` - Create new profile (with optional photo upload)
- `PUT /api/profiles/:profileId` - Update profile (rename)
- `DELETE /api/profiles/:profileId` - Delete profile
- `POST /api/profiles/:profileId/activate` - Set active profile
- `POST /api/profiles/:profileId/photo` - Upload/update profile photo
- `GET /api/profiles/:profileId/photo` - Get profile photo
- `DELETE /api/profiles/:profileId/photo` - Delete profile photo

## Backup APIs
- `POST /api/backups/:profileId` - Create a full backup of the specified profile
  - Body: none
  - Response: `{ profileId, profileName, timestamp, snapshotFolderId, totalFiles?, totalBytes? }`
  - Notes: Triggers global progress bar; creates `backup/{profile}/{timestamp}/` snapshot folder
- `GET /api/backups/:profileId` - List available backups for the profile
  - Query: optional `limit`, `offset`
  - Response: `BackupEntry[]` sorted by descending timestamp
- `GET /api/backups/:profileId/:timestamp/download` - Download selected backup as a ZIP archive
  - Response: `application/zip` blob with `Content-Disposition: attachment; filename="{profile}-{timestamp}.zip"`
- `POST /api/backups/:profileId/:timestamp/restore` - Restore selected backup to live profile folder
  - Body: `{ confirm: true }` (explicit confirmation required by API)
  - Response: `{ restored: true, profileId, timestamp }`
  - Notes: Destructive replace of profile folder contents; triggers cache invalidation and progress bar

# State Management

## Context Providers

### AuthContext
- User session state
- Sign in/out functions
- Loading states

### DriveContext
- Selected folder ID
- Drive API helper functions
- File operation states

### AppContext
- Global app settings
- Profiles list and active profile
- Tags data (for active profile)
- Currencies data (for active profile)
- Default currency, date format preferences
- Profile switching functionality

### LoadingContext
- Global loading state for external API calls
- Request counter to track concurrent external requests
- Functions to increment/decrement loading state
- Used by GlobalProgressBar component to show/hide progress indicator

**Implementation Note:** All API route handlers that make external calls (Google Drive API, OAuth, etc.) should use the LoadingContext to automatically show/hide the global progress bar.

## Local State
- Form inputs (controlled components)
- UI states (modals, drawers, dialogs)
- Loading and error states for async operations (local spinners, not global progress bar)

