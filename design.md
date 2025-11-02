# Design & Architecture

## Overview
This document outlines the complete design and architecture of the finance-app personal finance tracking application.

## Key Features

### Core Functionality
1. **Google Drive Storage**: All data stored in user's personal Google Drive
2. **CSV-Based Data Management**: Simple, portable, and human-readable data format
3. **Multi-Currency Support**: Track expenses and incomes in different currencies with monthly exchange rates
4. **Expense & Income Tracking**: Categorized financial records with tags
5. **Visual Statistics**: Pie charts and summaries with currency conversion
6. **Tag Management**: Customizable categories with color coding
7. **Currency Management**: Month-specific exchange rate tracking
8. **Mobile-First PWA**: Works on all devices, installable as Android app

### Multi-Currency System
- **Monthly Exchange Rates**: Define different rates for each month to maintain historical accuracy
- **USD as Base Currency**: All conversions use USD as the intermediate currency
- **Flexible Display**: View statistics in any currency available for that month
- **Automatic Conversion**: All calculations automatically convert between currencies
- **Per-Transaction Currency**: Each expense/income can be in different currencies

## Application Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js App (React + TypeScript)              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   UI Layer   │  │  State Mgmt  │  │  Auth Layer  │ │ │
│  │  │   (MUI)      │  │  (Context)   │  │ (NextAuth)   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth API    │  │  Drive API   │  │  CSV Parser  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↕ Google APIs
┌─────────────────────────────────────────────────────────────┐
│                      Google Cloud Platform                   │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │  Google OAuth 2.0      │  │   Google Drive API       │  │
│  │  (Authentication)      │  │   (CSV File Storage)     │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### CSV File Structures

#### 1. Transaction Records: `transactions-YYYY-MM.csv`
```csv
date,transactionType,amount,description,tag,currency
2025-11-01,expense,45.50,Grocery shopping,Food,USD
2025-11-02,expense,120.00,Electric bill,Utilities,USD
2025-11-03,expense,15.75,Coffee shop,Food,GBP
2025-11-01,income,3000.00,Monthly salary,Salary,USD
2025-11-15,income,500.00,Freelance project,Freelance,EUR
```

**Fields:**
- `date`: ISO date format (YYYY-MM-DD)
- `transactionType`: "expense" or "income"
- `amount`: Decimal number (e.g., 45.50)
- `description`: Text description of transaction
- `tag`: Category tag from tags.csv
- `currency`: Currency code from currencies.csv

#### 2. Tags Configuration: `tags.csv`
```csv
type,name,color
expense,Food,#FF6B6B
expense,Utilities,#4ECDC4
expense,Transportation,#45B7D1
expense,Entertainment,#FFA07A
expense,Healthcare,#98D8C8
income,Salary,#6BCF7F
income,Freelance,#F7DC6F
income,Investment,#BB8FCE
```

**Fields:**
- `type`: "expense" or "income"
- `name`: Tag name
- `color`: Hex color code for visualization

#### 3. Currencies Configuration: `currencies.csv`
```csv
currencyName,year,month,ratio
USD,2025,11,1.0
GBP,2025,11,0.79
EUR,2025,11,0.92
JPY,2025,11,149.50
USD,2025,10,1.0
GBP,2025,10,0.78
EUR,2025,10,0.93
```

**Fields:**
- `currencyName`: Currency code (e.g., USD, GBP, EUR, JPY)
- `year`: Year for which this exchange rate applies
- `month`: Month (1-12) for which this exchange rate applies
- `ratio`: Exchange rate relative to 1 USD (e.g., 0.79 means 1 USD = 0.79 GBP)

**Notes:**
- Exchange rates are tracked per month to support historical accuracy
- The ratio represents how much of that currency equals 1 USD
- For USD, the ratio is always 1.0
- To convert from any currency to USD: amount / ratio
- To convert from USD to any currency: amount * ratio

#### 4. App Settings: `settings.json`
```json
{
  "folderId": "google-drive-folder-id",
  "defaultCurrency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "initialized": true
}
```

### TypeScript Interfaces

```typescript
interface TransactionRecord {
  date: string; // ISO date string
  transactionType: 'expense' | 'income';
  amount: number;
  description: string;
  tag: string;
  currency: string; // Currency code (e.g., USD, GBP, EUR)
}

interface Tag {
  type: 'expense' | 'income';
  name: string;
  color: string;
}

interface CurrencyRecord {
  currencyName: string; // Currency code (USD, GBP, EUR, etc.)
  year: number;
  month: number;
  ratio: number; // Exchange rate relative to 1 USD
}

interface AppSettings {
  folderId: string;
  defaultCurrency?: string;
  dateFormat?: string;
  initialized: boolean;
}

interface MonthlyData {
  year: number;
  month: number;
  transactions: TransactionRecord[];
  expenses: TransactionRecord[]; // Filtered transactions where transactionType === 'expense'
  incomes: TransactionRecord[]; // Filtered transactions where transactionType === 'income'
  totalExpense: number; // In default currency
  totalIncome: number; // In default currency
  availableCurrencies: string[]; // Currencies used in this month
}

interface Statistics {
  year: number;
  month: number;
  displayCurrency: string; // Currency to display statistics in
  expensesByTag: Record<string, number>; // Converted to display currency
  totalExpense: number; // Converted to display currency
  totalIncome: number; // Converted to display currency
  ratio: number; // expense/income ratio
  exchangeRates: Record<string, number>; // Available exchange rates for the month
}
```

## Component Structure

### Page Components

#### 1. `/` - Home/Dashboard Page
```
Dashboard
├── Header (AppBar with user info, logout)
├── ActionButtons
│   ├── CreateTransactionButton
│   ├── ViewTransactionsButton
│   ├── EditTagsButton
│   ├── ManageCurrenciesButton
│   └── ViewStatisticsButton
└── QuickSummary (optional: current month stats)
```

**Note:** The unified transaction approach simplifies the UI by combining expense and income operations into single pages with type selection.

#### 2. `/transactions/create` - Create Transaction Page
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

#### 3. `/transactions/view` - View Transactions Page
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

#### 4. `/tags/edit` - Edit Tags Page
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

#### 5. `/statistics` - Statistics Page
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

#### 6. `/auth/signin` - Sign In Page
```
SignIn
├── AppLogo
├── WelcomeMessage
├── GoogleSignInButton
└── InfoText (permissions needed)
```

#### 7. `/setup` - Initial Setup Page (First-time users)
```
Setup
├── Header
├── SetupSteps
│   ├── WelcomeStep
│   ├── FolderSelectionStep (Google Drive folder picker)
│   └── InitializationStep (create default tags.csv, currencies.csv with USD)
└── CompleteButton
```

#### 8. `/currencies/manage` - Manage Currencies Page
```
ManageCurrencies
├── Header (AppBar with back button)
├── CurrencyList (grouped by Year/Month)
│   └── MonthSection (expandable)
│       └── CurrencyTable
│           ├── CurrencyNameColumn
│           ├── RatioColumn (editable)
│           └── ActionsColumn (Delete button)
├── AddCurrencyForm
│   ├── CurrencyNameInput (e.g., USD, GBP, EUR)
│   ├── YearSelector
│   ├── MonthSelector
│   ├── RatioInput (exchange rate relative to USD)
│   └── AddButton
└── InfoText (explanation of ratio calculation)
```

### Shared/Reusable Components

- `Header` - App bar with navigation
- `LoadingSpinner` - Loading indicator
- `ErrorBoundary` - Error handling wrapper
- `ConfirmDialog` - Confirmation modal
- `Snackbar` - Toast notifications
- `DatePicker` - Date input component
- `AmountInput` - Formatted number input
- `CurrencySelector` - Currency dropdown component
- `TagChip` - Colored tag display
- `EmptyState` - No data placeholder

## User Flows

### 1. First-Time User Flow
```
Start → Sign In Required → 
Google OAuth → Permission Grant → 
Setup Page → Select Drive Folder → 
Initialize Files (settings.json, tags.csv, currencies.csv with USD base) → 
Dashboard
```

### 2. Create Transaction Flow (Expense or Income)
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

### 3. View Transactions Flow
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

### 4. View Statistics Flow
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

### 5. Edit Tags Flow
```
Dashboard → Edit Tags Button → 
Load tags.csv → Display Tags → 
User Edits (Add/Delete/Modify) → 
Validate → Save tags.csv → 
Success Message
```

### 6. Manage Currencies Flow
```
Dashboard → Manage Currencies Button → 
Load currencies.csv → Group by Year/Month → Display List → 
User Actions:
  - Add Currency: Enter Name, Year, Month, Ratio → Validate → Save
  - Edit Ratio: Update ratio value → Validate → Save
  - Delete Currency: Confirm → Remove from CSV → Save
Success Message
```

## API Routes Design

### Authentication APIs
- `GET /api/auth/[...nextauth]` - NextAuth.js handlers
- `GET /api/auth/session` - Get current session

### Google Drive APIs
- `POST /api/drive/folder/select` - Trigger folder picker
- `GET /api/drive/folder/list` - List files in selected folder
- `GET /api/drive/file/read` - Read file content
- `POST /api/drive/file/write` - Write/update file content
- `DELETE /api/drive/file/delete` - Delete file
- `POST /api/drive/file/create` - Create new file

### Data Management APIs
- `GET /api/transactions/:year/:month` - Get all transactions for month
- `GET /api/transactions/:year/:month?type=expense` - Get expenses for month (filtered)
- `GET /api/transactions/:year/:month?type=income` - Get incomes for month (filtered)
- `POST /api/transactions` - Create new transaction (expense or income)
- `DELETE /api/transactions/:year/:month/:index` - Delete transaction by index
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Update tags
- `GET /api/currencies` - Get all currency records
- `GET /api/currencies/:year/:month` - Get currencies for specific month
- `POST /api/currencies` - Add new currency record
- `PUT /api/currencies/:year/:month/:currency` - Update currency ratio
- `DELETE /api/currencies/:year/:month/:currency` - Delete currency record
- `GET /api/statistics/:year/:month` - Get statistics for month
- `GET /api/statistics/:year/:month/:currency` - Get statistics in specific currency
- `GET /api/settings` - Get app settings
- `POST /api/settings` - Update app settings

## State Management

### Context Providers

#### AuthContext
- User session state
- Sign in/out functions
- Loading states

#### DriveContext
- Selected folder ID
- Drive API helper functions
- File operation states

#### AppContext
- Global app settings
- Tags data
- Currencies data
- Default currency, date format preferences

### Local State
- Form inputs (controlled components)
- UI states (modals, drawers, dialogs)
- Loading and error states for async operations

## Authentication Flow

### OAuth 2.0 with Google
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Exchange code for access token and refresh token
6. Store tokens securely (HTTP-only cookies)
7. Create user session

### Session Management
- Use NextAuth.js for session handling
- JWT tokens for stateless sessions
- Refresh token rotation for security
- Session expiry: 30 days (configurable)

## File Operations

### Google Drive Integration

#### Initial Setup
1. User selects/creates a folder in Google Drive
2. App requests `drive.file` scope (access only to app-created files)
3. Store folder ID in `settings.json`

#### File Naming Convention
- Transactions: `transactions-YYYY-MM.csv` (contains both expenses and incomes)
- Tags: `tags.csv`
- Currencies: `currencies.csv`
- Settings: `settings.json`

#### Read Operation
```typescript
async function readCSV(fileName: string): Promise<string> {
  // 1. Get folder ID from settings
  // 2. Search for file by name in folder
  // 3. Download file content
  // 4. Return as string
}
```

#### Write Operation
```typescript
async function writeCSV(fileName: string, content: string): Promise<void> {
  // 1. Get folder ID from settings
  // 2. Search for existing file
  // 3. If exists, update; else create new
  // 4. Write content
}
```

#### Delete Operation
```typescript
async function deleteRow(fileName: string, rowIndex: number): Promise<void> {
  // 1. Read CSV file
  // 2. Parse to array
  // 3. Remove row at index
  // 4. Stringify back to CSV
  // 5. Write updated content
}
```

## Currency Conversion System

### Overview
The app supports multi-currency tracking with automatic conversion for statistics and reporting. Exchange rates are stored per month to maintain historical accuracy.

### Conversion Logic

#### Core Conversion Functions
```typescript
// Convert any currency to USD (base currency)
function convertToUSD(amount: number, fromCurrency: string, ratio: number): number {
  if (fromCurrency === 'USD') return amount;
  // For other currencies: divide by ratio
  // Example: 100 GBP with ratio 0.79 = 100 / 0.79 = 126.58 USD
  return amount / ratio;
}

// Convert from USD to any currency
function convertFromUSD(amountInUSD: number, toCurrency: string, ratio: number): number {
  if (toCurrency === 'USD') return amountInUSD;
  // Multiply by ratio
  // Example: 100 USD to GBP with ratio 0.79 = 100 * 0.79 = 79 GBP
  return amountInUSD * ratio;
}

// Convert between any two currencies
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  fromRatio: number,
  toRatio: number
): number {
  // First convert to USD, then to target currency
  const amountInUSD = convertToUSD(amount, fromCurrency, fromRatio);
  return convertFromUSD(amountInUSD, toCurrency, toRatio);
}
```

### Exchange Rate Management

#### Adding New Currencies
1. User navigates to Manage Currencies page
2. Enters currency code (e.g., GBP), year, month, and exchange ratio
3. Ratio represents: **1 USD = ratio × currency**
4. Example: If 1 USD = 0.79 GBP, ratio is 0.79
5. System validates and saves to `currencies.csv`

#### Using Currencies in Transactions
1. When creating expense/income, user selects date first
2. System extracts year and month from selected date
3. Loads available currencies for that specific month from `currencies.csv`
4. Populates currency dropdown with available options
5. If desired currency not available, user must add it via Manage Currencies

#### Default Behavior
- USD is always available with ratio 1.0
- If no currencies defined for a month, only USD is available
- Users can define different exchange rates for different months

### Statistics Currency Conversion

#### Aggregation Process
1. Load all transactions for selected month from `transactions-YYYY-MM.csv`
2. Filter transactions by `transactionType` for expenses and incomes separately
3. Identify all unique currencies used in transactions
4. Load exchange rates for those currencies from `currencies.csv`
5. User selects display currency from available options
6. Convert all transactions to display currency:
   ```typescript
   for (const transaction of transactions) {
     const ratio = exchangeRates[transaction.currency];
     const displayRatio = exchangeRates[displayCurrency];
     const convertedAmount = convertCurrency(
       transaction.amount,
       transaction.currency,
       displayCurrency,
       ratio,
       displayRatio
     );
     // Aggregate converted amounts by tag and type
     if (transaction.transactionType === 'expense') {
       aggregatedExpenses[transaction.tag] += convertedAmount;
     } else {
       aggregatedIncomes[transaction.tag] += convertedAmount;
     }
   }
   ```
7. Display pie chart and summary in selected currency

#### Handling Missing Exchange Rates
- If transaction uses currency with no exchange rate for that month:
  - Show warning to user
  - Prompt to add exchange rate via Manage Currencies
  - Or exclude transaction from statistics with notification
  
#### Example Scenario
**Transactions in November 2025:**
- Expense: $100 USD (Food)
- Expense: £50 GBP (Food)
- Income: €200 EUR (Salary)

**Exchange rates for November 2025:**
- USD: 1.0
- GBP: 0.79
- EUR: 0.92

**Statistics in USD:**
- Food expenses: $100 + (£50 / 0.79) = $100 + $63.29 = $163.29 USD
- Total Income: (€200 / 0.92) = $217.39 USD

**Statistics in GBP:**
- Food expenses: ($100 * 0.79) + £50 = £79 + £50 = £129 GBP
- Total Income: (€200 / 0.92) * 0.79 = $217.39 * 0.79 = £171.74 GBP

### Data Validation

#### Currency Entry Validation
- Currency name: 3 uppercase letters (e.g., USD, GBP, EUR)
- Year: Valid 4-digit year
- Month: 1-12
- Ratio: Positive decimal number > 0

#### Transaction Validation
- Currency must exist in `currencies.csv` for transaction's month
- Amount must be positive number
- All required fields must be filled

## UI/UX Design Guidelines

### Theme
- Primary Color: #1976d2 (Material Blue)
- Secondary Color: #dc004e (Pink)
- Success: #4caf50 (Green)
- Error: #f44336 (Red)
- Background: #fafafa (Light Gray)

### Spacing
- Use MUI spacing system (8px base unit)
- Padding: 2-4 units (16px-32px)
- Margins: 1-3 units (8px-24px)

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - xs: 0px
  - sm: 600px
  - md: 960px
  - lg: 1280px
  - xl: 1920px

### Currency Display Guidelines
- **Currency Symbols**: Use appropriate currency symbols ($ £ € ¥) when displaying amounts
- **Formatting**: Format numbers according to currency locale
  - USD: $1,234.56
  - EUR: €1.234,56
  - GBP: £1,234.56
- **Currency Selector**: Use autocomplete dropdown with search for easy currency selection
- **Exchange Rate Display**: Show exchange rates clearly with examples in Manage Currencies
- **Conversion Indicator**: When viewing statistics, clearly indicate the display currency
- **Multi-Currency Labels**: In expense/income tables, show currency code next to amounts

## Error Handling

### Client-Side Errors
- Form validation errors: Display inline below fields
- Network errors: Show snackbar with retry option
- Authentication errors: Redirect to sign-in

### Server-Side Errors
- 401 Unauthorized: Refresh token or re-authenticate
- 403 Forbidden: Show permission error
- 404 Not Found: Show empty state
- 500 Server Error: Show error page with support info

### Logging
- Client: Console errors in development
- Server: Structured logging with timestamps
- Production: Error tracking service (optional)

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Dynamic imports for routes
2. **Lazy Loading**: Load components on demand
3. **Memoization**: Use React.memo for expensive components
4. **Virtualization**: For large lists (if needed)
5. **Debouncing**: For search and filter inputs
6. **Caching**: Cache Drive API responses with SWR or React Query

### Loading States
- Skeleton screens for content loading
- Progress indicators for file operations
- Optimistic UI updates for better perceived performance

## Security Considerations

### Data Privacy
- All data stored in user's personal Google Drive
- No data stored on application servers
- Each user accesses only their own files

### API Security
- CSRF protection with NextAuth.js
- Rate limiting on API routes
- Input validation and sanitization
- SQL injection prevention (N/A - using CSV)

### OAuth Security
- Use PKCE flow for additional security
- Validate redirect URIs
- Store tokens securely (HTTP-only cookies)
- Implement token refresh logic

## Deployment Architecture

### Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Google Cloud Run
- Automatic HTTPS
- Auto-scaling based on traffic
- Pay-per-use pricing
- Global CDN

### Environment Variables
- Inject via Cloud Run service configuration
- Use Secret Manager for sensitive data
- Never commit credentials to repository

## Progressive Web App (PWA)

### Manifest Configuration
```json
{
  "name": "Finance Tracker",
  "short_name": "FinApp",
  "description": "Personal finance tracking app",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#fafafa",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
- Cache static assets
- Offline fallback page
- Background sync for pending operations (optional)

## Bubblewrap / Android App

### Configuration
1. Generate TWA (Trusted Web Activity)
2. Configure Digital Asset Links
3. Set app name, icons, colors
4. Build APK/AAB for Google Play

### Requirements
- Valid domain with HTTPS
- PWA manifest
- Service worker
- Lighthouse PWA score > 90

## Implementation Notes

### Unified Transaction UI Implementation Priority

#### Phase 1: Core Transaction Management
1. **Create unified transaction data model and TypeScript interfaces**
   - `TransactionRecord` interface with `transactionType` field
   - CSV helper functions for reading/writing unified format
   - Migration utility to convert old separate files (if needed)

2. **Implement Create Transaction Page (`/transactions/create`)**
   - Transaction type toggle/tabs component (Expense/Income)
   - Dynamic tag filtering based on selected type
   - Form validation and submission logic
   - Save to `transactions-YYYY-MM.csv` with appropriate `transactionType`
   - Recent transactions display with type indicators

3. **Implement View Transactions Page (`/transactions/view`)**
   - Type filter tabs (All/Expense/Income) with count badges
   - Transaction table with color-coded amounts
   - Type badge column for identification
   - Basic CRUD operations (view, delete)
   - Month selection and grouping

#### Phase 2: Enhanced Features
1. **Add edit functionality to View Transactions**
   - Inline editing or modal form
   - Update CSV file on save
   - Validation and error handling

2. **Implement advanced filtering**
   - Search by description
   - Filter by tag
   - Date range selection
   - Multiple filter combinations

3. **Add month summary cards**
   - Total Income calculation
   - Total Expense calculation
   - Net Balance display
   - Visual indicators (positive/negative)

#### Phase 3: UX Enhancements
1. **Visual polish and color coding**
   - Expense mode: Red/pink theme
   - Income mode: Green theme
   - Smooth transitions between modes
   - Loading states and animations

2. **Persistence and preferences**
   - Remember last used transaction type
   - Save filter preferences

### Best Practices

#### Data Integrity
- Always validate currency exists before saving transaction
- Keep USD with ratio 1.0 as immutable base currency
- Prevent deletion of currencies that are in use for a month
- Validate positive decimal values for exchange ratios

#### Performance
- Only load relevant month's currencies for transaction forms when the user picks the date.

#### User Experience
- Pre-select user's default currency in forms
- Provide quick links to Manage Currencies when needed
- Display clear conversion information in statistics
- Use consistent currency formatting throughout app

## Key Design Decisions

**UX Features:**
- **Create Page**:
  - Prominent Expense/Income toggle or tabs at the top
  - Visual mode indication (color scheme changes)
  - Tag selector dynamically updates based on selected type
  - "Save & Add Another" option to quickly add multiple transactions
  - Recent transactions list shows both types with clear visual distinction
  
- **View Page**:
  - Filter tabs: All / Expense / Income (with count badges)
  - Color-coded amounts: Red for expenses, Green for incomes
  - Type badge column for quick identification
  - Month summary cards: Total Income, Total Expense, Net Balance
  - Search and filter by description, tag, date range
  - Edit functionality added

**Implementation Notes:**
- Transaction type state persists between sessions (remember last used)
- Default to "Expense" for first-time users (most common operation)
- Color coding:
  - Expense mode: Red/pink accent colors
  - Income mode: Green accent colors
  - Neutral mode when viewing all: Blue/gray
- Responsive design: 
  - Desktop: Toggle buttons or tabs
  - Mobile: Segmented control or bottom sheet selector

