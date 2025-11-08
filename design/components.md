[← Back to README](README.md)

# Component Structure

## Page Components

### 1. `/` - Home/Dashboard Page
```
Dashboard
├── Header (AppBar with user info, logout)
├── ProfileSelector (dropdown showing active profile name, option to switch or create new)
├── ActionButtons
│   ├── CreateTransactionButton
│   ├── ViewTransactionsButton
│   ├── EditTagsButton
│   ├── ManageCurrenciesButton
│   ├── ViewStatisticsButton
│   └── ManageProfilesButton
└── QuickSummary (optional: current month stats for active profile)
```

**Note:** 
- All transactions are associated with the currently active profile.
- Users can switch profiles from the dashboard to view different sets of transactions.

### 2. `/transactions/create` - Create Transaction Page
```
CreateTransaction
├── Header (AppBar with back button)
├── TransactionForm
│   ├── TransactionTypeToggle (Expense/Income - prominent toggle or tabs)
│   ├── DatePicker
│   ├── AmountInput
│   ├── CurrencySelector (dropdown from IndexedDB with "Add New Currency" option)
│   ├── DescriptionInput
│   ├── TagSelector (dropdown from tags table, dynamically filtered by selected transaction type)
│   ├── SaveButton
│   └── CancelButton
└── RecentTransactions (last 5 entries, showing both types with color coding)
```

**Key Features:**
- Transaction type toggle at the top (default can be 'expense' or last used)
- Tag selector dynamically updates when transaction type changes
- Saves to database with selected `transactionType`
- Visual distinction between expense (red) and income (green) modes
- Quick switch between types without leaving the page

### 3. `/transactions/view` - View Transactions Page
```
ViewTransactions
├── Header (AppBar with back button)
├── FilterControls
│   ├── TypeFilter (All/Expense/Income toggle or tabs with badges showing counts)
│   ├── TagFilter (dropdown - updates based on type filter)
│   ├── DateRangeFilter (optional)
│   └── SearchBox (filter by description)
├── YearMonthList (Accordion or List)
│   └── MonthItem (expandable, shows month totals)
│       └── TransactionTable
│           ├── DateColumn
│           ├── TypeColumn (Expense/Income badge with color coding)
│           ├── AmountColumn (color-coded: red for expense, green for income)
│           ├── CurrencyColumn
│           ├── DescriptionColumn
│           ├── TagColumn (chip with tag color)
│           └── ActionsColumn (Edit, Delete buttons)
└── EmptyState (when no transactions exist)
```

**Key Features:**
- Unified view with filtering by transaction type
- Color-coded amounts (red for expenses, green for incomes)
- Type badges for quick identification
- Month summary showing total income, total expense, and net balance
- Responsive table that adapts to mobile (cards) and desktop (table)
- Reads from database and filters based on selected type

### 4. `/tags/edit` - Edit Tags Page
```
EditTags
├── Header (AppBar with back button)
├── ImportFromDatabaseButton (scans transactions and auto-populates tags)
├── TagsList
│   ├── ExpenseTagsSection
│   │   └── TagItem (name, color picker, edit button, delete button)
│   └── IncomeTagsSection
│       └── TagItem (name, color picker, edit button, delete button)
├── AddTagForm
│   ├── TypeSelector (expense/income)
│   ├── NameInput
│   ├── ColorPicker
│   └── AddButton
└── InfoText ("Tags are stored locally and specific to this profile")
```

**Features:**
- Tags are loaded from IndexedDB for the active profile
- Each profile has its own independent set of tags
- Tags are categorized by transaction type (expense/income)
- Color coding for visual identification
- Add, edit, and delete tags instantly (no API calls)
- All changes are saved to IndexedDB immediately
- **Import from Database**: Button to scan all transactions for the active profile and auto-populate IndexedDB with existing tags (handles duplicates by skipping existing tags)

### 5. `/statistics` - Statistics Page
```
Statistics
├── Header (AppBar with back button)
├── FilterControls
│   ├── YearSelector (dropdown)
│   ├── MonthSelector (dropdown)
│   └── CurrencySelector (dropdown - shows only currencies used in transactions for selected period)
├── StatsDisplay (when year and month selected)
│   ├── ExpensePieChart (breakdown by tags, only transactions in selected currency)
│   ├── IncomeVsExpenseBar (only transactions in selected currency)
│   └── SummaryCards
│       ├── TotalIncomeCard (in selected currency)
│       ├── TotalExpenseCard (in selected currency)
│       └── NetBalanceCard (in selected currency)
└── EmptyState (when no data for selected period/currency)
```

**Note:** Statistics show only transactions in the selected currency, filtering by `type` for expenses and incomes

### 6. `/auth/signin` - Sign In Page
```
SignIn
├── AppLogo
├── WelcomeMessage
├── EmailPasswordForm (email, password, submit)
├── GuestModeButton (prominent button: "Try Guest Mode" or "Continue as Guest")
└── InfoText (security and password guidance)
```

### 7. `/setup` - Initial Setup Page (First-time users)
```
Setup
├── Header
├── SetupSteps
│   ├── WelcomeStep
│   ├── ProfileCreationStep
│   │   ├── ProfileNameInput
│   │   ├── CreateProfileButton
│   │   └── InfoText (explains profiles and that data will be organized by profile)
│   ├── InitialCurrencySelectionStep
│   │   ├── CurrencyDropdown (popular currencies: USD, EUR, GBP, JPY, etc.)
│   │   ├── CustomCurrencyInput (for other currencies)
│   │   └── InfoText (explains this is the first currency and will be default)
│   └── InitializationStep (create profile record; save currency to IndexedDB; initialize default tags)
└── CompleteButton
```

**Profile Creation Features:**
- User enters a name for their first profile (e.g., "Personal", "Business")
- Profile is saved to IndexedDB (client-side storage)
- Profile is set as the active profile in IndexedDB settings
- All subsequent transactions and tags will include this profile name for filtering

**Initial Currency Selection Features:**
- This step only appears if no currencies exist in IndexedDB
- Dropdown with common currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SGD)
- Option to enter custom currency code (3-letter format)
- Clear explanation: "This will be your first currency and will be pre-selected when creating transactions"
- Currency is saved to IndexedDB (not PostgreSQL)
- Preview of currency symbol
- Validation of currency code format
- Cannot be skipped (required step)

### 8. `/currencies/manage` - Manage Currencies Page
```
ManageCurrencies
├── Header (AppBar with back button)
├── ImportFromDatabaseButton (scans transactions and auto-populates currencies)
├── DefaultCurrencyDisplay (shows current default currency, e.g., "Default Currency: USD")
├── CurrencyList
│   └── CurrencyItem
│       ├── CurrencyCodeColumn (e.g., USD, GBP, EUR)
│       ├── SetDefaultButton (if not current default)
│       ├── DefaultBadge (if current default)
│       ├── EditButton (rename currency code)
│       └── DeleteButton (can delete any currency from IndexedDB)
├── AddCurrencyForm
│   ├── CurrencyCodeInput (e.g., GBP, EUR, JPY)
│   └── AddButton
└── InfoText (e.g., "Add currencies that you use for transactions. No exchange rates needed. Currencies are stored locally.")
```

**Features:**
- Displays current default currency prominently at the top
- Simple list of available currencies without exchange rates
- All currencies stored in IndexedDB (client-side)
- Default currency is pre-selected in transaction forms
- Can delete any currency (only affects IndexedDB, not existing transactions in PostgreSQL)
- Can edit currency codes (only affects IndexedDB)
- Option to change default currency (updates IndexedDB)
- **Import from Database**: Button to scan all transactions and auto-populate IndexedDB with existing currencies (handles duplicates by skipping existing currencies)

### 9. `/profiles/manage` - Manage Profiles Page
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

**Features:**
- List all existing profiles from IndexedDB
- Mark the currently active profile
- Switch active profile (instantly updates IndexedDB, reloads transactions for that profile)
- Create new profiles with unique names (saved to IndexedDB)
- Rename existing profiles (updates IndexedDB only, existing transactions keep old profile name)
- Delete profiles (removes from IndexedDB, existing transactions in PostgreSQL remain)
- Each profile's data is filtered by profile name when querying PostgreSQL
- All profile management happens client-side (no API calls)

## Shared/Reusable Components

- `Header` - App bar with navigation
- `GlobalProgressBar` - Global infinite progress bar for API calls
- `ProfileSelector` - Dropdown to select/switch active profile
- `LoadingSpinner` - Loading indicator (local component use)
- `ErrorBoundary` - Error handling wrapper
- `ConfirmDialog` - Confirmation modal
- `Snackbar` - Toast notifications
- `DatePicker` - Date input component
- `AmountInput` - Formatted number input
- `CurrencySelector` - Currency dropdown component (loads from IndexedDB with "Add New Currency" option)
- `TagChip` - Colored tag display
- `EmptyState` - No data placeholder
- `GuestModeIndicator` - Floating icon on the right side of the screen indicating Guest Mode is active

**Note:** The `GlobalProgressBar` component displays an infinite progress indicator at the top of the page during API calls. It is managed globally and automatically shows/hides based on pending requests.

### GuestModeIndicator Component Details
The `GuestModeIndicator` component:
- Displays a floating icon/button on the right side of the screen
- Only visible when Guest Mode is active
- Positioned fixed at the right edge (e.g., `position: fixed; right: 16px; top: 50%; transform: translateY(-50%)`)
- Uses Material-UI icon (e.g., `PersonIcon` or `VisibilityIcon`) with appropriate styling
- May include a tooltip on hover: "Guest Mode - Using demo data"
- Clicking the icon can optionally show a dialog with option to exit Guest Mode
- Styled to be visible but not intrusive (semi-transparent or subtle color)

### CurrencySelector Component Details
The `CurrencySelector` component:
- Loads currencies from IndexedDB
- Displays all saved currencies in a dropdown
- Includes an "Add New Currency" option at the bottom of the list
- When "Add New Currency" is selected:
  - Opens an inline input dialog
  - User enters 3-letter currency code
  - Validates the code
  - Saves to IndexedDB
  - Refreshes the dropdown to include the new currency
  - Selects the newly added currency
- Default currency is pre-selected when the form loads

