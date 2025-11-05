# File Operations

## Google Drive Integration

### Initial Setup
1. User selects/creates a folder in Google Drive (root folder for the app)
2. App requests `drive.file` scope (access only to app-created files)
3. Store root folder ID in `settings.json`
4. User creates first profile, which creates a profile folder inside the root folder
5. Store profile folder IDs in `settings.json` under profiles array

### Folder Structure in Google Drive
```
FinanceApp (root folder - folderId in settings.json)
├── settings.json (app-level settings with profiles list and active profile)
├── Profiles/ (container for all profile folders - profilesContainerFolderId optional)
│   ├── Profile-Personal (profile folder - folderId in profile object)
│   │   ├── profile-photo.jpg (profile photo)
│   │   ├── transactions-2025-01.csv
│   │   ├── transactions-2025-02.csv
│   │   ├── tags.csv
│   │   └── currencies.csv
│   └── Profile-Business (another profile folder)
│       ├── profile-photo.png (profile photo)
│       ├── transactions-2025-01.csv
│       ├── tags.csv
│       └── currencies.csv
└── backup/ (container for full profile backups - backupFolderId optional)
    ├── Personal/ (per-profile backup folder; name or profileId)
    │   ├── 2025-11-05T14-30-22Z/ (timestamped full snapshot of the profile folder)
    │   │   ├── profile-photo.jpg
    │   │   ├── transactions-2025-01.csv
    │   │   ├── transactions-2025-02.csv
    │   │   ├── tags.csv
    │   │   └── currencies.csv
    │   └── 2025-10-31T08-00-00Z/
    └── Business/
        └── 2025-11-01T12-00-00Z/
```

#### Backup Folder Notes
- The `backup/` folder sits alongside `Profiles/` at the root of the app folder (i.e., outside the profiles container).
- Each profile has its own subfolder inside `backup/`, named with the profile display name or `profile-{id}`. Using the immutable profile ID avoids rename edge-cases.
- Each backup is a full snapshot copy of the entire profile folder at a point in time.
- Timestamped backup folder name format: ISO-like `YYYY-MM-DDTHH-mm-ssZ` (colons replaced with dashes for Drive compatibility).
- Backups are read-only snapshots; restore operation replaces the contents of the live profile folder with the selected snapshot.

### File Naming Convention
- Profile Folders: `Profile-{ProfileName}` or use profile ID for folder name
- Profile Photos: `profile-photo.{ext}` (jpg, png, gif, etc.) - stored in profile folder
- Transactions: `transactions-YYYY-MM.csv` (contains both expenses and incomes) - stored in profile folder
- Tags: `tags.csv` - stored in profile folder
- Currencies: `currencies.csv` - stored in profile folder
- Settings: `settings.json` - stored in root folder (contains profile information)
- Backup timestamp folders: `YYYY-MM-DDTHH-mm-ssZ` inside `backup/{profile}/`

### Backup Operations

#### Create Backup (Full Snapshot)
```typescript
interface BackupEntry {
  profileId: string;
  profileName: string;
  backupFolderId: string; // Drive folder for backup/{profile}/
  timestamp: string; // folder name, e.g. 2025-11-05T14-30-22Z
  snapshotFolderId: string; // Drive folder id for the timestamped snapshot
  totalFiles?: number;
  totalBytes?: number;
}

async function createProfileBackup(profileId: string): Promise<BackupEntry> {
  // 1. Resolve root folderId from settings.json
  // 2. Ensure `backup/` folder exists; create if missing
  // 3. Ensure per-profile folder under backup exists; create if missing
  // 4. Generate timestamp folder name (YYYY-MM-DDTHH-mm-ssZ) and create it
  // 5. Copy all files from live profile folder to the timestamp folder (metadata + content)
  // 6. Return BackupEntry with resolved ids and optional size stats
}
```

#### List Backups
```typescript
async function listProfileBackups(profileId: string): Promise<BackupEntry[]> {
  // 1. Resolve backup/{profile}/ folder id
  // 2. List child folders (timestamps) sorted by descending time
  // 3. Map to BackupEntry[]
}
```

#### Download Backup (as ZIP)
```typescript
async function downloadProfileBackup(profileId: string, timestamp: string): Promise<Blob> {
  // 1. Resolve backup/{profile}/{timestamp} folder id
  // 2. Fetch files and stream/assemble as a ZIP archive for download
  // 3. Return Blob for browser save (Content-Disposition handled by API route)
}
```

#### Restore Backup (Destructive Replace)
```typescript
async function restoreProfileFromBackup(profileId: string, timestamp: string): Promise<void> {
  // 1. Resolve live profile folder id
  // 2. Resolve backup/{profile}/{timestamp} folder id
  // 3. Safety: Confirm user intent (UI confirmation), ensure not currently writing
  // 4. Delete existing files in live profile folder (or move to temp if desired)
  // 5. Copy files from snapshot folder into live profile folder
  // 6. Refresh caches/state for the active profile
}
```

### Read Operation
```typescript
async function readCSV(fileName: string, profileId?: string): Promise<string> {
  // 1. Get active profile from settings (or use provided profileId)
  // 2. Get profile folder ID from profile object
  // 3. Search for file by name in profile folder
  // 4. Download file content
  // 5. Return as string
}
```

### Write Operation
```typescript
async function writeCSV(fileName: string, content: string, profileId?: string): Promise<void> {
  // 1. Get active profile from settings (or use provided profileId)
  // 2. Get profile folder ID from profile object
  // 3. Search for existing file in profile folder
  // 4. If exists, update; else create new
  // 5. Write content
}
```

### Profile Operations
```typescript
async function createProfile(profileName: string, photoFile?: File): Promise<Profile> {
  // 1. Generate unique profile ID (UUID)
  // 2. Get root folder ID from settings
  // 3. Create new folder in root folder with name "Profile-{profileName}"
  // 4. Get new folder ID
  // 5. If photoFile provided, upload to profile folder and get file ID
  // 6. Initialize default CSV files (tags.csv, currencies.csv) in profile folder
  // 7. Create profile object with id, name, folderId, photoFileId (if photo uploaded)
  // 8. Add to profiles array in settings.json
  // 9. Return profile object
}

async function updateProfilePhoto(profileId: string, photoFile: File): Promise<string> {
  // 1. Get profile from settings
  // 2. Get profile folder ID
  // 3. If existing photo, delete old photo file from Drive
  // 4. Upload new photo to profile folder
  // 5. Get new photo file ID
  // 6. Update profile object with new photoFileId
  // 7. Save updated settings.json
  // 8. Return new photo file ID
}

async function getProfilePhoto(photoFileId: string): Promise<Blob> {
  // 1. Download file from Google Drive using file ID
  // 2. Return as Blob for display in UI
  // 3. Can be cached in browser for performance
}

async function deleteProfile(profileId: string): Promise<void> {
  // 1. Get profile from settings
  // 2. Ensure it's not the active profile
  // 3. Delete profile folder and all contents from Drive (including photo)
  // 4. Remove from profiles array in settings.json
  // 5. Save updated settings
}
```

### Delete Operation
```typescript
async function deleteRow(fileName: string, rowIndex: number): Promise<void> {
  // 1. Read CSV file
  // 2. Parse to array
  // 3. Remove row at index
  // 4. Stringify back to CSV
  // 5. Write updated content
}
```


## Backup & Restore Security

1. Least Privilege: Use `drive.file` scope to create/read/write only app-owned files/folders (`FinanceApp/`, `Profiles/`, `backup/`).
2. Destructive Operations: Restore replaces live profile contents.
   - Require explicit confirmation in API body `{ confirm: true }`.
   - Require UI double-confirmation (type profile name).
   - Block restore while writes are in-flight to prevent race conditions.
3. Integrity: Validate snapshot completeness before restore (required files present).
4. Retention: Optional policy (e.g., keep last N backups); clearly document storage implications.
5. Auditing: Log backup/restore events locally (client analytics) without sensitive content.
6. Sharing: Avoid sharing backup folders; inherited Drive permissions may expose data if shared manually by user.
7. PII Handling: Backups contain full data; warn users before downloading to unmanaged devices.
8. Error Handling: On partial failures during restore, abort and surface clear remediation steps (or attempt transactional replace via temp folder).

