[← Back to README](README.md)

# Manage Profiles {#manage-profiles}

<pre>

<a id="rename-user-flow"></a>
<a id="delete-user-flow"></a>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <a href="./dashboard.md">← Back</a>  Manage Profiles           │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Active Profile Display                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Active Profile: Personal                          │ │
│  │                                                    │ │
│  │ ℹ️  All transactions are saved with the active    │ │
│  │    profile name. Profiles are stored locally.     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Profiles List                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Profiles                                          │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [Import from Database]                       │ │ │
│  │ │ (Auto-populates profiles from transactions)   │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Personal                                      │  │ │
│  │ │ [Active] [<a href="#rename-profile-modal">Rename</a>] [<a href="#delete-profile-modal">Delete</a>]                    │  │ │
│  │ │ (delete disabled - active profile)            │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Business                                      │  │ │
│  │ │ [Set as Active] [<a href="#rename-profile-modal">Rename</a>] [<a href="#delete-profile-modal">Delete</a>]             │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Family                                        │  │ │
│  │ │ [Set as Active] [<a href="#rename-profile-modal">Rename</a>] [<a href="#delete-profile-modal">Delete</a>]             │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Create Profile Form                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Create New Profile                               │ │
│  │                                                    │ │
│  │ Profile Name                                      │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [Enter profile name]                         │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ Examples: Personal, Business, Family, Travel      │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ Create Profile                                │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Info Text                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ℹ️  All transactions are saved with the active    │ │
│  │    profile name. Profiles are stored locally.     │ │
│  │    Switching profiles filters your transactions.  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Empty State (when no profiles)                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │        👤                                          │ │
│  │                                                    │ │
│  │  No profiles yet                                  │ │
│  │                                                    │ │
│  │  Create your first profile to get started        │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-profile-management"></a>

### Profile Management
- Profile operations now derive everything from `/api/transactions`. The front-end scans transactions to count references, and uses `PUT /api/transactions/:id` to update rows when renaming profiles. There are no dedicated `/api/profiles/*` endpoints after the metadata removal work.

**Note:** Profile management operations (create, switch, delete) are performed client-side using IndexedDB. Renaming a profile still requires an API call to update transactions in the database, but deletion now relies solely on the preview API—if the preview shows zero affected transactions, the profile is removed locally with no further backend calls. The transactions API is also used for the "Import from Database" feature to extract profile names from existing transactions.

**Storage:** Profiles are stored locally in IndexedDB. Transactions are stored in PostgreSQL (Supabase) with profile names embedded in each transaction record. When a profile is renamed, both IndexedDB and all related transactions in the database are updated.

## Features

- **Active Profile Display**: Shows currently active profile prominently
- **Profile List**: Lists all profiles from IndexedDB
- **Switch Profile**: Set any profile as active (instant, no API calls)
- **Create Profile**: Add new profiles with unique names
- **Rename Profile**: Update profile name in IndexedDB and all transactions in database - [See Rename Modal](#rename-profile-modal)
- **Delete Profile**: Remove profile from IndexedDB only if no transactions use it (validated via preview only; no backend delete call) - [See Delete Modal](#delete-profile-modal)
- **Import from Database**: Scan transactions and auto-populate profiles
- **Profile Auto-Population**: Automatically runs at app startup if IndexedDB is empty

## Profile Auto-Population (Startup)

At app startup, if IndexedDB profiles are empty, the system automatically:

1. Fetches all transactions for the current user
2. Extracts unique profile names from transactions
3. Adds profiles to IndexedDB
4. Sets first profile as active (if no active profile exists)
5. Runs silently (no user notification needed)

This ensures users who have transactions but lost their IndexedDB data (e.g., cleared browser data) can continue using the app without manual setup.

## Import from Database

The "Import from Database" button allows manual profile import:

1. User clicks "Import from Database" button
2. System scans all transactions for the current user
3. Extracts unique profile names
4. Adds new profiles to IndexedDB (skips existing ones)
5. Shows success message (e.g., "Added 3 profiles, skipped 1 existing")
6. If no active profile exists, sets first imported profile as active

## User Flow

1. User navigates to Manage Profiles page
2. User sees list of all profiles with active profile highlighted
3. User can switch active profile (instant, reloads dashboard data)
4. User can create new profile (saved to IndexedDB)
5. User can rename profile (updates IndexedDB and all transactions in database) - [See Rename Modal](#rename-profile-modal)
6. User can delete profile (removes from IndexedDB, transactions remain) - [See Delete Modal](#delete-profile-modal)
7. User can import profiles from database (scans transactions)

## Error Handling

- **Duplicate names**: Prevents creating profiles with duplicate names
- **Active profile deletion**: Disabled for active profile (must switch first)
- **Validation**: Ensures profile name is not empty
- **Success feedback**: Shows success message after operations

## Component Structure

The Manage Profiles page consists of:

```
ManageProfiles
├── Header (AppBar with back button)
├── ActiveProfileDisplay (shows currently active profile name)
├── ProfilesList
│   └── ProfileItem
│       ├── ProfileName
│       ├── SetActiveButton (if not current)
│       ├── ActiveBadge (if current)
│       ├── RenameButton
│       └── DeleteButton (disabled if active profile)
├── CreateProfileForm
│   ├── ProfileNameInput
│   └── CreateButton
└── InfoText ("All transactions are saved with the active profile name. Profiles are stored locally.")
```

## Profile Management Flow

1. Dashboard → Manage Profiles Button
2. Load Profiles List from IndexedDB → Display Active Profile
3. User Actions:
   - **Switch Profile**: Select Profile → Update active selection in IndexedDB settings → Reload Dashboard with new profile filter
   - **Create Profile**: Enter Profile Name → Save to IndexedDB → 
     - No backend initialization needed (tags and transactions will be created with profile name when first used)
   - **Rename Profile**: Select Profile → [Open Rename Modal](#rename-profile-modal) → Enter New Name → Query `/api/transactions?profile=<oldName>&limit=1` to show affected count → When confirmed, stream `/api/transactions?profile=<oldName>` and call `PUT /api/transactions/:id` with the new profile name for each row → Update the profile record in IndexedDB.
     - All transactions in PostgreSQL with old profile name are updated via the existing transactions endpoint.
   - **Delete Profile**: Select Profile (non-active) → Query `/api/transactions?profile=<name>&limit=1` to confirm zero usage → [Open Delete Modal](#delete-profile-modal) with count → If profile is used, show error and block deletion → If not used, Confirm → Remove from IndexedDB.
     - Deletion is only allowed if no transactions contain the profile
4. Success Message

## Security Notes

- Profile management (create, switch) happens client-side (IndexedDB)
- Profile renaming requires API call to update database transactions
- Profile deletion happens entirely client-side after preview confirms there are no transactions referencing the profile
- Existing transactions in database are updated when renaming a profile
- Profile rename operations update all user's transactions that have the old profile name
- Profile delete operations permanently remove all user's transactions that have the profile name

---

## Rename Profile Modal

<a id="rename-profile-modal"></a>

### Visual Design

<pre>
┌─────────────────────────────────────────────────────────┐
│  Rename Profile Modal (Dialog)                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  Rename Profile                                  │ │
│  │                                                   │ │
│  │  Current Profile: Business                       │ │
│  │                                                   │ │
│  │  New Profile Name                                │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │ Business                                      │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │                                                   │ │
│  │  This will update 42 transactions.              │ │
│  │                                                   │ │
│  │  ℹ️  All existing transactions with this profile │ │
│  │     will be updated to use the new name.         │ │
│  │                                                   │ │
│  │  ┌──────────────┐  ┌─────────────────────────┐ │ │
│  │  │ <a href="#rename-user-flow">Cancel</a>     │  │ <a href="#rename-user-flow">Rename Profile</a>      │ │ │
│  │  └──────────────┘  └─────────────────────────┘ │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
</pre>

### User Flow

1. User clicks "Rename" button on a profile item
2. Modal opens with current profile name pre-filled
3. User edits the profile name
4. User clicks "Rename Profile" button
5. System validates:
   - Name is not empty
   - Name is not duplicate of existing profile
   - Name is different from current name
6. If valid: 
   - Calls `GET /api/profiles/rename/preview` to get affected transaction count
   - Shows confirmation dialog: "This will update X transactions. Continue?"
   - User confirms → Calls `POST /api/profiles/rename` to update all transactions in database
   - Updates profile name in IndexedDB
7. Modal closes
8. Profile list refreshes with updated name
9. Success message displayed: "Profile renamed successfully. X transactions updated."

### Validation Rules

- **Empty name**: Shows error "Profile name cannot be empty"
- **Duplicate name**: Shows error "A profile with this name already exists"
- **Same as current**: Shows error "New name must be different from current name"
- **Special characters**: Allowed (no restrictions)

### Component Structure

```
RenameProfileModal
├── Dialog (Material-UI)
│   ├── DialogTitle ("Rename Profile")
│   ├── DialogContent
│   │   ├── CurrentProfileName (read-only display)
│   │   ├── TextField (profile name input)
│   │   └── InfoText (warning about existing transactions)
│   └── DialogActions
│       ├── CancelButton (closes modal)
│       └── RenameButton (validates and saves)
```

### Error Handling

- **Validation errors**: Displayed inline below input field
- **IndexedDB errors**: Shows error message "Failed to rename profile. Please try again."
- **API errors**: If database update fails, shows error "Failed to update profile in database. Please try again."
- **Network errors**: Shows error "Failed to rename profile. Please check your connection and try again."
- **Success feedback**: Toast notification "Profile renamed successfully. X transactions updated."

### Notes

- All existing transactions in PostgreSQL database with the old profile name are updated to use the new name
- Profile rename requires an API call to update the database
- The rename operation updates all transactions that have the old profile name
- If the renamed profile is currently active, the active profile name updates immediately in IndexedDB
- The API returns the count of transactions that were updated

---

## Delete Profile Modal

<a id="delete-profile-modal"></a>

### Visual Design

<pre>
┌─────────────────────────────────────────────────────────┐
│  Delete Profile Modal (Dialog)                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  ⚠️  Delete Profile                              │ │
│  │                                                   │ │
│  │  Are you sure you want to delete this profile?   │ │
│  │                                                   │ │
│  │  Profile: Business                               │ │
│  │                                                   │ │
│  │  [If profile is used:]                            │ │
│  │  ❌ This profile is used in 42 transactions.   │ │
│  │     Deletion is not allowed.                      │ │
│  │                                                   │ │
│  │  [If profile is not used:]                       │ │
│  │  ✓ No transactions use this profile.               │ │
│  │                                                   │ │
│  │  ⚠️  Warning:                                    │ │
│  │  - This action cannot be undone                  │ │
│  │  - The profile will be removed from your list    │ │
│  │                                                   │ │
│  │  ┌──────────────┐  ┌─────────────────────────┐ │ │
│  │  │ <a href="#delete-user-flow">Cancel</a>     │  │ <a href="#delete-user-flow">Delete Profile</a>        │ │ │
│  │  └──────────────┘  └─────────────────────────┘ │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
</pre>



### User Flow

1. User clicks "Delete" button on a profile item (disabled for active profile)
2. System calls `GET /api/profiles/delete/preview` to check if profile is used in transactions
3. If profile is used:
   - Modal opens showing error: "This profile is used in X transactions. Deletion is not allowed."
   - Delete button is disabled
   - User must delete or reassign all transactions before deletion is allowed
4. If profile is not used:
   - Modal opens with confirmation message
   - User reviews warning information
   - User clicks "Delete Profile" button to confirm
   - System validates:
     - Profile is not the currently active profile
     - Profile exists in IndexedDB
   - If valid:
     - Removes profile from IndexedDB (no backend delete request)
   - Modal closes
   - Profile list refreshes (deleted profile removed)
   - Success message displayed: "Profile deleted successfully."
5. If deleted profile was the only profile, shows empty state


### Validation Rules

- **Active profile**: Delete button is disabled (cannot delete active profile)
- **Non-existent profile**: Shows error "Profile not found"
- **Confirmation required**: User must explicitly click "Delete Profile" button

### Component Structure

```
DeleteProfileModal
├── Dialog (Material-UI)
│   ├── DialogTitle ("Delete Profile" with warning icon)
│   ├── DialogContent
│   │   ├── ConfirmationText ("Are you sure...")
│   │   ├── ProfileName (profile to be deleted)
│   │   └── WarningText (list of consequences)
│   └── DialogActions
│       ├── CancelButton (closes modal)
│       └── DeleteButton (confirms and deletes)
```

### Error Handling

- **Active profile deletion attempt**: Button is disabled, no modal opens
- **Preview errors**: If preview API fails, shows error "Failed to check affected transactions. Please try again."
- **IndexedDB errors**: Shows error message "Failed to delete profile. Please try again."
- **Preview result (profile is in use)**: Shows error "Cannot delete profile: it is used in X transactions. Please delete or reassign all transactions before deleting the profile."
- **Network errors**: Shows error "Failed to delete profile. Please check your connection and try again."
- **Success feedback**: Toast notification "Profile deleted successfully."

### Notes

- Deletion is only allowed if no transactions contain the profile
- If any transactions use the profile, deletion is blocked with an error message
- The profile is removed from IndexedDB only after validation confirms no transactions use it
- If all profiles are deleted, user will see empty state and can create a new profile
- Delete operation relies solely on the preview API; once it reports zero transactions, removal happens locally
- Cannot delete the currently active profile (must switch to another profile first)
- The preview API validates that no transactions contain the profile before allowing deletion

