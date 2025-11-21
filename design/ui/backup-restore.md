[← Back to README](README.md)

# Backup & Restore

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <a href="./dashboard.md">← Back</a>  Backup & Restore          │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Active Profile Display                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Active Profile: Personal                          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Download Backup Section                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Download Backup                                   │ │
│  │                                                    │ │
│  │ Export your transaction data to a CSV file.       │ │
│  │                                                    │ │
│  │ What's included:                                  │ │
│  │ • All transactions for your account               │ │
│  │ • Date, type, amount, currency, description, tags │ │
│  │                                                    │ │
│  │ What's NOT included:                              │ │
│  │ • Profiles, tags, and currencies (stored locally)│ │
│  │ • Transaction IDs and user IDs                    │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 📥 Download Backup                          │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │ File will be named:                              │ │
│  │ backup-20240115T143022Z.csv                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Restore from Backup Section                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Restore from CSV                                  │ │
│  │                                                    │ │
│  │ ⚠️  WARNING: This action is destructive!          │ │
│  │                                                    │ │
│  │ Restoring will:                                   │ │
│  │ • Delete ALL your current transaction data        │ │
│  │ • Replace it with data from the CSV file          │ │
│  │ • Profiles, tags, and currencies are NOT affected │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 📤 Restore from CSV                          │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │ Accepted format: .csv files only                 │ │
│  │                                                    │ │
│  │ (Opens <a href="#confirm-restore-modal">confirmation dialog</a> after file selection)│ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-backup-restore"></a>

### Backup & Restore
- `GET /api/backup` — See [API Response Documentation](./api/backup.md)
- `POST /api/restore` — See [API Response Documentation](./api/restore.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

**Storage:** Backed by PostgreSQL (Supabase). All endpoints operate on database tables with server-side authorization checks.

## Features

- **Download Backup**: Export all transaction data to a single CSV file
- **Restore from Backup**: Import transaction data from a previously downloaded CSV file
- **Type-to-Confirm**: Double confirmation required for restore (opens <a href="#confirm-restore-modal">confirmation dialog</a>)
- **Global Progress Bar**: Shows progress during backup creation and restore operations
- **Data Scope**: Only transaction data is included (profiles, tags, and currencies are stored locally in IndexedDB)
- **File Format**: CSV files with specific schema (excludes `id` and `user_id` columns)

## User Flow - Download Backup

1. User clicks "Download Backup" button
2. Global progress bar appears
3. System exports all user transactions to CSV format
4. Browser downloads file named `backup-YYYYMMDDTHHmmssZ.csv`
5. Success message appears
6. User can save the file for backup purposes

## User Flow - Restore from Backup

1. User clicks "Restore from CSV" button
2. User selects a CSV file to upload
3. System validates file format
4. <a href="#confirm-restore-modal">Confirmation dialog</a> opens
5. User types app/profile name to confirm
6. User clicks "Restore" button
7. Global progress bar shows during restore
8. All existing transaction data is deleted
9. Backup data is restored from CSV
10. Success message appears
11. Dashboard refreshes with restored data

## Error Handling

- **Invalid file format**: Shows error if file is not a valid CSV
- **File validation errors**: Shows specific errors for invalid CSV structure or missing columns
- **Restore errors**: Shows error message if restore operation fails
- **File size limits**: Validates file size before processing

## Component Structure

The Backup & Restore page consists of:

```
BackupRestore
├── Header (AppBar with back button and active profile name)
├── DownloadBackupSection
│   ├── Description (what's included/excluded)
│   └── DownloadBackupButton
└── RestoreFromBackupSection
    ├── Warning (destructive action)
    ├── RestoreFromCSVButton
    └── ConfirmationDialog (type-to-confirm)
```

## Backup & Restore Flow

1. Dashboard → Backup & Restore
2. User Actions:
   - **Download Backup**:
     - Click "Download Backup" → Confirm
     - Global progress bar shows while creating export
     - Browser downloads `backup-YYYYMMDDTHHmmssZ.csv`
     - (Contains only the logged-in user's transaction data, no id or user_id columns)
   - **Restore From Backup**:
     - Click "Restore from CSV" → Choose file
     - Warning dialog (destructive) explains all current transaction data will be deleted
     - Type-to-confirm app/profile name to proceed
     - Global progress bar shows while restoring
     - On success: data refresh → Success Message

**Key UX Features:**
- Backups contain only the logged-in user's transaction data as a single CSV file
- CSV does NOT include `id` or `user_id` columns
- **Profiles, Tags, and Currencies are NOT included in backups** as they are stored in IndexedDB (client-side)
- Timestamp format `YYYY-MM-DDTHH:mm:ssZ` in filenames (display localized in UI)
- Double-confirmation on restore (type-to-confirm) with clear warning that all current user transaction data will be deleted
- Restore replaces all existing user transaction data with backup data (profiles, tags, and currencies in IndexedDB are not affected)
- All actions surface progress via the global progress bar
- Users need to re-add profiles, tags, and currencies when moving to a new device/browser

## Backup & Restore Technical Details

### Backup Contents

The backup is a single CSV file named `backup-YYYYMMDDTHHmmssZ.csv` containing only transaction data for the logged-in user.

**CSV Columns (in order):**
- `profile` - Profile name (text)
- `occurred_at` - Transaction date (YYYY-MM-DD)
- `amount_minor` - Amount in minor units (integer)
- `currency` - Currency code (text)
- `type` - Transaction type ('expense' or 'income')
- `tags` - Tag names as comma-separated values within the field (text array representation)
- `note` - Optional note (text, can be empty)
- `created_at` - Creation timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
- `updated_at` - Update timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)

**Note:** The CSV does NOT include `id` or `user_id` columns.

**Note:** `profiles.csv`, `tags.csv`, and `currencies.csv` are NOT included as profiles, tags, and currencies are stored in IndexedDB.

**Note:** All data in the backup belongs exclusively to the logged-in user. The backup does not include data from other users.

### CSV Format
- UTF-8 encoded with a single header row
- Comma delimiter, double-quote as quote char
- Escape quotes by doubling (`""`)
- Newlines preserved within quoted fields
- `NULL` values represented as empty fields
- Date/time values in ISO-8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`)
- UUIDs as canonical lowercase strings
- Monetary amounts use integer minor units (PostgreSQL `bigint`)

### Backup Creation Flow
- Endpoint identifies the logged-in user from the session.
- Extracts only the user's transaction data:
  - All transactions where `user_id` matches the logged-in user
  - Excludes `id` and `user_id` columns from the export
- Endpoint streams a CSV file with the filename `backup-YYYYMMDDTHHmmssZ.csv`.
- Long-running exports surface progress via the global progress bar on the client.
- **Note:** Profiles, tags, and currencies are not included as they are stored locally in IndexedDB.

### Restore Flow
- User uploads a CSV file created by this application's backup functionality.
- Server identifies the logged-in user from the session.
- Server validates:
  - File is a valid CSV
  - CSV headers match expected schema (name and order)
  - Required columns are present: `profile`, `occurred_at`, `amount_minor`, `currency`, `type`, `tags`, `note`, `created_at`, `updated_at`
  - CSV does NOT contain `id` or `user_id` columns
  - Data types and formats are valid
- Server performs a transactional restore:
  - Ensures a maintenance/lock mode for the duration of restore
  - **Deletes all existing transaction data for the logged-in user**
  - Inserts new transaction records from the CSV, automatically assigning:
    - New UUIDs for `id` (generated by database)
    - Current logged-in user's `user_id` (from session)
  - Loads backup data using prepared statements/copy where possible
  - Re-enables constraints and verifies FK integrity at the end
- On success, the app clears relevant caches and reloads data.
- **Note:** Profiles, tags, and currencies in IndexedDB are not affected by restore operations.

### Security & Safeguards
- Authenticated user access required for both backup and restore endpoints
- User can only backup and restore their own data
- Double confirmation for restore operations (destructive action)
- Strict file size/type limits and content validation
- User ID validation on restore to prevent cross-user data restoration
- Full server-side validation and transactional guarantees
- Detailed audit logging (who initiated, when, result)

## Security Notes

- Only the logged-in user's transaction data is included in backups
- User ID is automatically assigned from session during restore (prevents cross-user data restoration)
- Double confirmation (type-to-confirm) prevents accidental data loss
- All existing transaction data is permanently deleted before restore
- Profiles, tags, and currencies in IndexedDB are NOT affected by restore operations
- CSV files do NOT include `id` or `user_id` columns for security

## UI/UX Guidelines

### Page Layout
- Header with active profile name and two primary actions:
  - "Download Backup" (primary)
  - "Restore from CSV" (secondary, danger context)
- No server-side list is displayed; backups are downloaded to the user's machine as a single CSV file.

### Actions
- **Download Backup**:
  - Confirmation dialog explains a backup of the user's transaction data (CSV) will be created
  - Show global progress bar during export
  - Trigger browser download of `backup-YYYYMMDDTHHmmssZ.csv`
- **Restore from CSV**:
  - Danger-styled action; requires double confirmation
  - Warning dialog clearly states that all current user transaction data will be deleted and replaced with backup data
  - Type-to-confirm app/profile name to proceed
  - File picker accepts `.csv` only
  - Show global progress bar during restore
  - After success, reload affected data and show success snackbar

### Edge Cases
- Handle authorization failures with clear remediation steps (e.g., re-authenticate)

## Confirm Restore Modal

<a id="confirm-restore-modal"></a>

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ⚠️  Confirm Restore                  │ │
│  │                                                    │ │
│  │  ────────────────────────────────────────────────  │ │
│  │                                                    │ │
│  │  This will permanently delete all your current     │ │
│  │  transaction data and replace it with the backup.  │ │
│  │                                                    │ │
│  │  Type the app/profile name to confirm:             │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [Type to confirm]                            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          Cancel                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          Restore (disabled until typed)      │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

### Features

- **Double confirmation**: Requires typing the app/profile name to confirm
- **Destructive action warning**: Clear indication that this will delete all current transaction data
- **Disabled restore button**: Restore button is disabled until confirmation text is typed correctly
- **Cancel option**: User can cancel the restore operation at any time
- **Type-to-confirm**: Prevents accidental restores by requiring explicit confirmation

### User Flow

1. User clicks "Restore from CSV" button on backup-restore page
2. User selects a CSV file to upload
3. Modal opens with confirmation dialog
4. User reads the warning message
5. User types the app/profile name to confirm (e.g., "finance-app" or "Personal")
6. Restore button becomes enabled when text matches
7. User clicks "Restore" to confirm
8. Global progress bar shows while restoring
9. All existing transaction data is deleted
10. Backup data is restored from CSV
11. Modal closes and success message appears
12. Dashboard refreshes with restored data

### Error Handling

- **Invalid file format**: Shows error if file is not a valid CSV
- **File validation errors**: Shows specific errors for invalid CSV structure
- **Confirmation mismatch**: Restore button remains disabled if text doesn't match
- **Restore errors**: Shows error message if restore operation fails

### Security Notes

- Double confirmation prevents accidental data loss
- Type-to-confirm ensures user understands the destructive nature
- All existing transaction data is permanently deleted before restore
- Profiles, tags, and currencies in IndexedDB are NOT affected
- Only transaction data is restored from the CSV file
- User ID is automatically assigned from session (prevents cross-user data restoration)
