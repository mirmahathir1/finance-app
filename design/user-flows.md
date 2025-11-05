# User Flows

## 1. First-Time User Flow
```
Start → Sign In Required → 
Google OAuth → Permission Grant → 
Setup Page → 
  Step 1: Welcome & Introduction →
  Step 2: Select/Create Drive Folder →
  Step 3: Create Profile (Enter Profile Name) →
  Step 4: Choose Base Currency (from dropdown or custom input) →
  Step 5: Initialize Files (settings.json, tags.csv, currencies.csv with selected base currency) → 
Dashboard
```

**Profile & Base Currency Selection Details:**
- After linking Google Drive folder, user is presented with a "Create Profile" button
- User creates first profile with a name and optional profile photo
- User selects their primary currency (default: USD)
- System creates profile folder in Google Drive
- System uploads profile photo (if provided) to profile folder and stores file ID
- System creates `currencies.csv` with selected base currency (ratio 1.0) in profile folder
- System creates `tags.csv` in profile folder
- Sets `defaultCurrency` in `settings.json`
- Stores profile information (name, folder ID, photo file ID) in `settings.json`
- All future transactions default to this currency
- Can be changed later in app settings
- User can create multiple profiles, each with their own photo

## 2. Create Transaction Flow (Expense or Income)
```
Dashboard → Create Transaction Button → 
Transaction Form → 
User Selects Transaction Type (Expense/Income toggle) →
Fill Details (Date, Amount, Currency, Description, Tag filtered by type) → 
Validate → Check if Currency exists in currencies.csv for that month →
If not exists: Show warning or auto-add with ratio 1.0 → 
Save to CSV (transactions-YYYY-MM.csv) with selected transactionType → 
Success Message → Dashboard or Stay to Add Another
```

**Key UX Features:**
- Default transaction type can be expense (most common) or last used type
- Switching type updates available tags dynamically
- Quick toggle to add multiple transactions of different types

## 3. View Transactions Flow
```
Dashboard → View Transactions Button → 
Load All Transaction Files (transactions-YYYY-MM.csv) → Group by Year/Month → 
Display List with Filter Controls (All/Expense/Income) → 
User Selects Filter Type (default: All) → 
User Selects Month → 
Load & Parse CSV → Filter by selected transactionType → Display Table → 
Optional: Edit or Delete Row → Update CSV (modify or remove row from transactions file) →
Refresh Display
```

**Key UX Features:**
- Type filter tabs with transaction counts badges
- Color-coded amounts (red for expense, green for income)
- Month totals showing income, expense, and net balance
- Search/filter by description or tag

## 4. View Statistics Flow
```
Dashboard → Statistics Button → 
Select Year → Select Month → 
Load transactions-YYYY-MM.csv → 
Filter expenses (transactionType === 'expense') → 
Filter incomes (transactionType === 'income') → 
Load currencies.csv for selected month/year →
Determine available currencies from records → 
Populate Display Currency dropdown → 
User selects display currency (default: USD or user's default) →
Convert all amounts to selected currency using exchange rates → 
Aggregate data by tags → 
Render Pie Chart & Summary in selected currency → 
Display Results
```

## 5. Edit Tags Flow
```
Dashboard → Edit Tags Button → 
Load tags.csv → Display Tags → 
User Edits (Add/Delete/Modify) → 
Validate → Save tags.csv → 
Success Message
```

## 6. Manage Currencies Flow
```
Dashboard → Manage Currencies Button → 
Load currencies.csv (from active profile folder) → Group by Year/Month → Display List → 
User Actions:
  - Add Currency: Enter Name, Year, Month, Ratio → Validate → Save
  - Edit Ratio: Update ratio value → Validate → Save
  - Delete Currency: Confirm → Remove from CSV → Save
Success Message
```

## 7. Profile Management Flow
```
Dashboard → Manage Profiles Button → 
Load Profiles List from settings.json → Display Active Profile with Photo → 
User Actions:
  - Switch Profile: Select Profile → Update activeProfileId in settings.json → Reload Dashboard
  - Create Profile: Enter Profile Name → Optional: Upload Photo → Generate Profile ID → 
    Create Profile Folder in Drive → Upload Photo to Profile Folder (if provided) → 
    Initialize CSV Files (tags.csv, currencies.csv) → Add to profiles array with photoFileId → 
    Save settings.json
  - Change Profile Photo: Select Profile → Upload New Photo → Delete Old Photo from Drive → 
    Upload New Photo to Profile Folder → Update photoFileId in profile object → Save settings.json
  - Rename Profile: Select Profile → Enter New Name → Update profile name → Save settings.json
  - Delete Profile: Select Profile (non-active) → Confirm → Delete Profile Folder from Drive 
    (including photo) → Remove from profiles array → Save settings.json
Success Message
```

## 8. App Startup Profile Selection Flow
```
App Load → Check settings.json → 
If activeProfileId exists: Load Active Profile Data → Dashboard
If no activeProfileId or profiles empty: Redirect to Setup/Create Profile Flow
User can switch profile anytime from Dashboard
```

## 9. Backup Management Flow
```
Dashboard → Backups Button →
Load backup/{profile}/ timestamps → Display list (newest first) →
User Actions:
  - Create Backup: Click "Create Backup" → Confirm → 
    Global progress bar shows while snapshotting profile folder → 
    On success: new entry appears with timestamp
  - Download Backup: Select backup row → "Download" → 
    API returns ZIP → Browser download starts
  - Restore Backup: Select backup row → "Restore" → 
    Warning dialog (destructive) with explicit confirmation → 
    Global progress bar shows while replacing live profile contents → 
    On success: cache invalidation and data refresh → Success Message
Optional: Pagination/limit controls for long histories
```

**Key UX Features:**
- Clear indication that backups are full snapshots of the profile folder
- Timestamp format `YYYY-MM-DDTHH:mm:ssZ` (display localized, keep original for IDs)
- Disabled restore button if snapshot folder missing
- Double-confirmation (and profile name type-to-confirm) on restore
- All actions reflect in the global progress bar

