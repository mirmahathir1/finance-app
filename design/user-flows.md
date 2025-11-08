[← Back to README](README.md)

# User Flows

## 1. First-Time User Flow
```
Start → Sign In Required →
Create Account (Email Verification) or Sign In or Guest Mode →
If Guest Mode:
  Click "Guest Mode" Button → 
  Activate Guest Mode → 
  Generate Fake Data → 
  Dashboard (with Guest Mode indicator) →
If Create Account:
  Enter Email → Submit →
  Show "Check your email" →
  Click Verification Link → Verified →
  Set Password →
  Setup Page →
If Sign In:
  Enter Email + Password → Dashboard or Setup (if first time)
  Step 1: Welcome & Introduction →
  Step 2: Create Profile (Enter Profile Name) →
  Step 3: Choose First Currency (from dropdown or custom input, only if no currencies in IndexedDB) →
  Step 4: Initialize Records (profile in DB, currency in IndexedDB, default tags in DB) → 
Dashboard
```

**Profile & Initial Currency Selection Details:**
- User is presented with a "Create Profile" step
- User creates first profile with a name
- Profile is saved to IndexedDB (client-side storage)
- If no currencies exist in IndexedDB, user selects their first currency (default: USD)
- System saves currency to IndexedDB (client-side storage)
- System initializes default tags in IndexedDB for this profile (common expense/income tags)
- Selected currency becomes the default for future transactions
- Can be changed later in app settings
- User can create multiple profiles (all stored in IndexedDB)
- Each profile has its own tags (stored in IndexedDB)
- Currencies are shared across all profiles (stored in IndexedDB)

## 1a. Sign Up Verification Flow (No DB write before verification)
```
Signup Form (Email only) →
POST /api/auth/signup/request →
Send Brevo email with link https://your.app/verify?token=... →
User clicks link →
GET /api/auth/verify?token=... →
On success: create user, mark email_verified_at, start session or prompt Set Password →
Continue onboarding
```

**UX Notes:**
- Always show a generic success after requesting a link (avoid email enumeration).
- Provide “Resend link” with rate limiting.
- Handle expired/invalid tokens with a clear message and a CTA to request a new link.

## 2. Create Transaction Flow (Expense or Income)
```
Dashboard → Create Transaction Button → 
Transaction Form → 
User Selects Transaction Type (Expense/Income toggle) →
Fill Details (Date, Amount, Currency from IndexedDB dropdown with "Add New" option, Description, Tag filtered by type) → 
User can select existing currency or "Add New Currency" →
If "Add New Currency": Inline dialog → Enter code → Validate → Save to IndexedDB → Select new currency →
Validate → 
Save to database with selected type → 
Success Message → Dashboard or Stay to Add Another
```

**Key UX Features:**
- Default transaction type can be expense (most common) or last used type
- Default currency is pre-selected from IndexedDB settings
- Currency dropdown includes "Add New Currency" option
- Switching type updates available tags dynamically
- Quick toggle to add multiple transactions of different types

## 3. View Transactions Flow
```
Dashboard → View Transactions Button → 
Query transactions from DB → Group by Year/Month → 
Display List with Filter Controls (All/Expense/Income) → 
User Selects Filter Type (default: All) → 
User Selects Month → 
Fetch data → Filter by selected transactionType → Display Table → 
Optional: Edit or Delete Row → Persist changes in DB →
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
Load transactions from DB → 
Filter expenses (type === 'expense') → 
Filter incomes (type === 'income') → 
Determine currencies used in transactions → 
Populate Currency Filter dropdown → 
User selects currency to view (default: user's default currency) →
Filter transactions by selected currency → 
Aggregate data by tags for filtered transactions → 
Render Pie Chart & Summary showing only selected currency → 
Display Results
```

## 5. Edit Tags Flow
```
Dashboard → Edit Tags Button → 
Load tags from IndexedDB for active profile → Display Tags → 
User Actions:
  - Import from Database: Click "Import from Database" → 
    Scan all transactions for active profile → 
    Extract unique tags with types → 
    Add new tags to IndexedDB (skip existing) → 
    Show success message (e.g., "Added 5 tags, skipped 2 existing")
  - Manual Edit: Add/Delete/Modify/Change Color → 
    Validate → Save to IndexedDB → 
    Success Message
```

**Note:** Tags are filtered by active profile and transaction type (expense/income). Import from Database option allows users to quickly populate tags from existing transactions.

## 6. Manage Currencies Flow
```
Dashboard → Manage Currencies Button → 
Load currencies from IndexedDB → Display List → 
User Actions:
  - Import from Database: Click "Import from Database" → 
    Scan all transactions → 
    Extract unique currencies → 
    Add new currencies to IndexedDB (skip existing) → 
    Show success message (e.g., "Added 3 currencies, skipped 1 existing")
  - Add Currency: Enter Currency Code → Validate → Save to IndexedDB
  - Set Default: Select Currency → Update default in IndexedDB settings
  - Edit Currency: Select Currency → Modify code → Save to IndexedDB
  - Delete Currency: Confirm → Remove from IndexedDB (does not affect existing transactions in PostgreSQL)
Success Message
```

## 7. Profile Management Flow
```
Dashboard → Manage Profiles Button → 
Load Profiles List from IndexedDB → Display Active Profile → 
User Actions:
  - Switch Profile: Select Profile → Update active selection in IndexedDB settings → Reload Dashboard with new profile filter
  - Create Profile: Enter Profile Name → Save to IndexedDB → 
    No backend initialization needed (tags and transactions will be created with profile name when first used)
  - Rename Profile: Select Profile → Enter New Name → Update profile name in IndexedDB → 
    Note: Existing transactions/tags in PostgreSQL with old profile name remain unchanged
  - Delete Profile: Select Profile (non-active) → Confirm → Remove from IndexedDB →
    Note: Existing transactions/tags in PostgreSQL with this profile name remain unchanged
Success Message
```

## 8. App Startup Profile Selection Flow
```
App Load → Check session and IndexedDB settings → 
Load profiles from IndexedDB →
If profiles empty in IndexedDB:
  Auto-populate from database:
    Fetch all transactions for current user →
    Extract unique profile names →
    Add profiles to IndexedDB →
    Set first profile as active (if no active profile exists)
Load active profile from IndexedDB settings →
If active profile exists: Load transactions/tags for that profile from PostgreSQL → Dashboard
If no active profile or profiles still empty: Redirect to Setup/Create Profile Flow
User can switch profile anytime from Dashboard
All profile switching happens instantly (IndexedDB lookup only)
```

**Note:** Profile auto-population runs silently at startup if IndexedDB profiles are empty. This ensures users who have transactions but lost their IndexedDB data (e.g., cleared browser data) can continue using the app without manual setup.

## 9. Backup & Restore Flow
```
Dashboard → Backup & Restore →
User Actions:
  - Download Backup:
    Click "Download Backup" → Confirm →
    Global progress bar shows while creating export →
    Browser downloads `backup-YYYYMMDDTHHmmssZ.csv`
    (Contains only the logged-in user's transaction data, no id or user_id columns)
  - Restore From Backup:
    Click "Restore from CSV" → Choose file →
    Warning dialog (destructive) explains all current transaction data will be deleted →
    Type-to-confirm app/profile name to proceed →
    Global progress bar shows while restoring →
    On success: data refresh → Success Message
```

**Key UX Features:**
- Backups contain only the logged-in user's transaction data as a single CSV file
- CSV does NOT include `id` or `user_id` columns
- **Profiles, Tags, and Currencies are NOT included in backups** as they are stored in IndexedDB (client-side)
- Timestamp format `YYYY-MM-DDTHH:mm:ssZ` in filenames (display localized in UI)
- Double-confirmation on restore (type-to-confirm) with clear warning that all current user transaction data will be deleted
- Restore replaces all existing user transaction data with backup data (profiles, tags, and currencies in IndexedDB are not affected)
- All actions surface progress via the global progress bar
- Users need to re-add profiles, tags, and currencies when moving to a new device/browser

## 10. Guest Mode Flow
```
Login Page → Click "Guest Mode" Button →
Activate Guest Mode (set flag in localStorage) →
Initialize GuestDataService with fake data →
Redirect to Dashboard →
All API calls intercepted client-side →
GuestDataService generates fake data (no server requests) →
Guest Mode Indicator appears (floating icon on right side) →
User can interact with all UI features using fake data →
User can exit Guest Mode at any time →
Exit Guest Mode → Clear guest mode flag → Redirect to Login Page
```

**Key UX Features:**
- Guest Mode button is prominently displayed on the login page
- All UI features work normally but with generated fake data
- Guest Mode indicator is always visible when in guest mode
- No data persistence - all fake data is ephemeral
- Users can explore the app without creating an account
- Exit Guest Mode option available via the floating indicator or settings
- Fake data is generated client-side using a JavaScript library (e.g., Faker.js) for realistic appearance
- All API calls are intercepted and handled by GuestDataService (no server requests)
- Zero network overhead - all data generation happens in the browser
- Guest mode state persists in localStorage across page refreshes

