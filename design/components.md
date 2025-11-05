# Component Structure

## Page Components

### 1. `/` - Home/Dashboard Page
```
Dashboard
├── Header (AppBar with user info, logout)
├── ProfileSelector (dropdown showing active profile with photo, option to switch or create new)
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
- Profile selector displays profile photo (avatar) next to profile name for visual identification.

### 2. `/transactions/create` - Create Transaction Page
```
CreateTransaction
├── Header (AppBar with back button)
├── TransactionForm
│   ├── TransactionTypeToggle (Expense/Income - prominent toggle or tabs)
│   ├── DatePicker
│   ├── AmountInput
│   ├── CurrencySelector (dropdown from currencies.csv for selected month/year)
│   ├── DescriptionInput
│   ├── TagSelector (dropdown from tags.csv, dynamically filtered by selected transaction type)
│   ├── SaveButton
│   └── CancelButton
└── RecentTransactions (last 5 entries, showing both types with color coding)
```

**Key Features:**
- Transaction type toggle at the top (default can be 'expense' or last used)
- Tag selector dynamically updates when transaction type changes
- Saves to `transactions-YYYY-MM.csv` with selected `transactionType`
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
- Reads from `transactions-YYYY-MM.csv` and filters based on selected type

### 4. `/tags/edit` - Edit Tags Page
```
EditTags
├── Header (AppBar with back button)
├── TagsList
│   ├── ExpenseTagsSection
│   │   └── TagItem (name, color picker, delete button)
│   └── IncomeTagsSection
│       └── TagItem (name, color picker, delete button)
├── AddTagForm
│   ├── TypeSelector (expense/income)
│   ├── NameInput
│   ├── ColorPicker
│   └── AddButton
└── SaveButton
```

### 5. `/statistics` - Statistics Page
```
Statistics
├── Header (AppBar with back button)
├── FilterControls
│   ├── YearSelector (dropdown)
│   ├── MonthSelector (dropdown)
│   └── DisplayCurrencySelector (dropdown - currencies available for that month)
├── StatsDisplay (when year and month selected)
│   ├── ExpensePieChart (breakdown by tags, converted to display currency)
│   ├── IncomeVsExpenseBar (converted to display currency)
│   └── SummaryCards
│       ├── TotalIncomeCard (in selected currency)
│       ├── TotalExpenseCard (in selected currency)
│       └── NetBalanceCard (in selected currency)
└── EmptyState (when no data for selected period)
```

**Note:** Statistics are calculated from `transactions-YYYY-MM.csv`, filtering by `transactionType` for expenses and incomes

### 6. `/auth/signin` - Sign In Page
```
SignIn
├── AppLogo
├── WelcomeMessage
├── GoogleSignInButton
└── InfoText (permissions needed)
```

### 7. `/setup` - Initial Setup Page (First-time users)
```
Setup
├── Header
├── SetupSteps
│   ├── WelcomeStep
│   ├── FolderSelectionStep (Google Drive folder picker for root folder)
│   ├── ProfileCreationStep
│   │   ├── ProfilePhotoUpload (optional, with default avatar option)
│   │   ├── ProfileNameInput
│   │   ├── CreateProfileButton
│   │   └── InfoText (explains profiles and that data will be organized by profile)
│   ├── BaseCurrencySelectionStep
│   │   ├── CurrencyDropdown (popular currencies: USD, EUR, GBP, JPY, etc.)
│   │   ├── CustomCurrencyInput (for other currencies)
│   │   └── InfoText (explains base currency for conversions and default)
│   └── InitializationStep (create profile folder, upload photo, default tags.csv, currencies.csv with selected base currency)
└── CompleteButton
```

**Profile Creation Features:**
- User enters a name for their first profile (e.g., "Personal", "Business")
- User can optionally upload a profile photo during setup
- Supported photo formats: JPG, PNG, GIF, WebP (max 5MB)
- System creates a folder in Google Drive named "Profile-{ProfileName}"
- Profile photo is uploaded to the profile folder
- Profile is set as the active profile
- All subsequent data (tags, currencies, transactions) will be stored in this profile folder

**Base Currency Selection Features:**
- Dropdown with common currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SGD)
- Option to enter custom currency code (3-letter format)
- Clear explanation: "This will be your base currency for conversions and default for new transactions"
- Preview of currency symbol
- Validation of currency code format
- Cannot be skipped (required step)

### 8. `/currencies/manage` - Manage Currencies Page
```
ManageCurrencies
├── Header (AppBar with back button)
├── BaseCurrencyDisplay (shows current base currency, e.g., "Base Currency: USD")
├── CurrencyList (grouped by Year/Month)
│   └── MonthSection (expandable)
│       └── CurrencyTable
│           ├── CurrencyNameColumn
│           ├── RatioColumn (editable, shows "1.0" for base currency, read-only)
│           └── ActionsColumn (Delete button, disabled for base currency)
├── AddCurrencyForm
│   ├── CurrencyNameInput (e.g., GBP, EUR, JPY)
│   ├── YearSelector
│   ├── MonthSelector
│   ├── RatioInput (exchange rate relative to base currency)
│   └── AddButton
└── InfoText (e.g., "Exchange rates are relative to your base currency (USD)")
```

**Features:**
- Prominently displays current base currency at the top
- Base currency always shows ratio 1.0 and cannot be deleted
- Clear indication that all rates are relative to the base currency
- Option to change base currency (with warning about recalculating rates)

### 9. `/profiles/manage` - Manage Profiles Page
```
ManageProfiles
├── Header (AppBar with back button)
├── ActiveProfileDisplay (shows currently active profile with photo)
├── ProfilesList
│   └── ProfileItem
│       ├── ProfilePhoto (avatar/image)
│       ├── ProfileName
│       ├── ChangePhotoButton
│       ├── SetActiveButton (if not current)
│       ├── ActiveBadge (if current)
│       ├── RenameButton
│       └── DeleteButton (disabled if active profile)
├── CreateProfileForm
│   ├── ProfileNameInput
│   ├── ProfilePhotoUpload (optional during creation)
│   └── CreateButton
└── InfoText ("All transactions are saved under the active profile")
```

**Features:**
- List all existing profiles with their photos
- Mark the currently active profile
- Switch active profile (loads that profile's data)
- Create new profiles with unique names and optional photo
- Upload/change profile photos (stored in Google Drive)
- Rename existing profiles
- Delete profiles (except the active one)
- Each profile has its own set of CSV files in a separate folder
- Profile photos are displayed as circular avatars throughout the app

## Shared/Reusable Components

- `Header` - App bar with navigation
- `GlobalProgressBar` - Global infinite progress bar for external API calls
- `ProfileSelector` - Dropdown to select/switch active profile (with photo avatar)
- `ProfileAvatar` - Display profile photo as circular avatar
- `PhotoUpload` - Photo upload component with preview and crop functionality
- `LoadingSpinner` - Loading indicator (local component use)
- `ErrorBoundary` - Error handling wrapper
- `ConfirmDialog` - Confirmation modal
- `Snackbar` - Toast notifications
- `DatePicker` - Date input component
- `AmountInput` - Formatted number input
- `CurrencySelector` - Currency dropdown component
- `TagChip` - Colored tag display
- `EmptyState` - No data placeholder

**Note:** The `GlobalProgressBar` component displays an infinite progress indicator at the top of the page during any external resource calls (Google Drive API, authentication requests, etc.). It is managed globally and automatically shows/hides based on pending external requests.

