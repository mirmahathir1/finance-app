# Implementation Notes & Best Practices

## Base Currency Setup Implementation

### Initial Setup Flow
1. **Add Base Currency Selection Step to Setup Wizard**
   - Create `BaseCurrencySelectionStep` component
   - Dropdown with popular currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SGD)
   - Custom input option for other currencies
   - Validation: 3-letter uppercase currency code
   - Clear explanation of what base currency means
   - Currency symbol preview

2. **Initialize Settings with Base Currency**
   - Save selected currency to `settings.json` as `defaultCurrency`
   - Create initial `currencies.csv` with base currency entry (ratio 1.0)
   - Set current month's exchange rate for base currency
   - Store in AppContext for global access

3. **Update Currency Management UI**
   - Display base currency prominently in Manage Currencies page
   - Show "Base Currency: [CODE]" badge/header
   - Prevent deletion of base currency
   - Base currency ratio always 1.0 (read-only)
   - All other currencies show rates relative to base

### Conversion Function Updates
1. **Update all conversion utilities to use base currency**
   - Replace hardcoded USD with `settings.defaultCurrency`
   - Pass `baseCurrency` parameter to conversion functions
   - Update function names: `convertToUSD` → `convertToBaseCurrency`

2. **Update transaction forms**
   - Pre-select base currency as default
   - Load available currencies for selected month
   - Show exchange rate relative to base when other currency selected

3. **Update statistics calculations**
   - Use base currency for intermediate conversions
   - Display currency clearly in labels ("relative to USD", etc.)
   - Allow viewing in any available currency

### Settings Management
1. **Add base currency change functionality**
   - Settings page option to change base currency
   - Warning dialog: "Changing base currency will require updating all exchange rates"
   - Confirmation step before changing
   - Optional: Tool to recalculate existing rates (advanced feature)

## Unified Transaction UI Implementation Priority

### Phase 1: Core Transaction Management
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

### Phase 2: Enhanced Features
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

### Phase 3: UX Enhancements
1. **Visual polish and color coding**
   - Expense mode: Red/pink theme
   - Income mode: Green theme
   - Smooth transitions between modes
   - Loading states and animations

2. **Persistence and preferences**
   - Remember last used transaction type
   - Save filter preferences

## Global Progress Bar Implementation

### Component Structure
```typescript
// contexts/LoadingContext.tsx
interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }) {
  const [requestCount, setRequestCount] = useState(0);
  
  const startLoading = () => setRequestCount(prev => prev + 1);
  const stopLoading = () => setRequestCount(prev => Math.max(0, prev - 1));
  const isLoading = requestCount > 0;
  
  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

// components/GlobalProgressBar.tsx
export function GlobalProgressBar() {
  const { isLoading } = useLoading();
  
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      {isLoading && <LinearProgress />}
    </Box>
  );
}
```

### Usage in API Calls
```typescript
// Wrap all external API calls with loading context
async function fetchFromGoogleDrive(fileId: string) {
  const { startLoading, stopLoading } = useLoading();
  
  try {
    startLoading(); // Show global progress bar
    const response = await drive.files.get({ fileId });
    return response.data;
  } finally {
    stopLoading(); // Hide global progress bar
  }
}
```

### Integration Points
- All Google Drive API calls (read, write, delete, list files)
- Google OAuth authentication requests
- Any other external API calls
- File upload/download operations
- Settings initialization

## Best Practices

### Data Integrity
- Always validate currency exists before saving transaction
- Keep user's base currency with ratio 1.0 as immutable (cannot be deleted or modified)
- Prevent deletion of currencies that are in use for a month
- Validate positive decimal values for exchange ratios
- Ensure base currency is set during initial setup and stored in settings
- All exchange rates must be relative to the base currency
- Ensure all file operations use the active profile's folder ID
- Prevent deletion of the active profile
- Validate profile names are unique when creating new profiles

### Performance
- Only load relevant month's currencies for transaction forms when the user picks the date
- Global progress bar uses request counting to handle concurrent external calls efficiently

### User Experience
- Pre-select user's base/default currency in transaction forms
- Clearly indicate which currency is the base currency throughout the app
- Provide quick links to Manage Currencies when needed
- Display clear conversion information in statistics (e.g., "All amounts shown in USD")
- Use consistent currency formatting throughout app
- Show currency symbols where appropriate ($ £ € ¥)
- Explain base currency concept during first-time setup with clear, simple language
- Global progress bar provides consistent feedback for all external operations without cluttering the UI
- Display active profile name and photo prominently in the dashboard
- Make profile switching intuitive and easily accessible with visual profile avatars
- Provide clear explanations about profile separation during setup
- Show confirmation dialogs when deleting profiles to prevent accidental data loss
- Support common image formats for profile photos (JPG, PNG, GIF, WebP)
- Provide image cropping/resizing functionality for profile photos
- Display profile avatars consistently throughout the app (circular format)

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

