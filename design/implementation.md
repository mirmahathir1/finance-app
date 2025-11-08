[← Back to README](README.md)

# Implementation Notes & Best Practices

## Currency Management Implementation (IndexedDB)

### Initial Setup Flow
1. **Add Initial Currency Selection Step to Setup Wizard**
   - Create `InitialCurrencySelectionStep` component
   - Only appears if no currencies exist in IndexedDB
   - Dropdown with popular currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SGD)
   - Custom input option for other currencies
   - Validation: 3-letter uppercase currency code
   - Clear explanation: "This will be your first currency and will be pre-selected when creating transactions"
   - Currency symbol preview

2. **Initialize Currency in IndexedDB**
   - Save selected currency to IndexedDB (not PostgreSQL)
   - Set as default currency in IndexedDB settings
   - Store in CurrencyContext for global access

3. **Currency Management UI**
   - Display default currency prominently in Manage Currencies page
   - Show "Default Currency: [CODE]" badge/header
   - Can delete any currency from IndexedDB (doesn't affect existing transactions in PostgreSQL)
   - Can edit currency codes in IndexedDB
   - Simple list of currencies without exchange rates
   - Option to set any currency as the default

4. **Inline Currency Addition During Transaction Entry**
   - Currency dropdown includes "Add New Currency" option
   - When selected, opens inline dialog/input
   - User enters currency code
   - Validates and saves to IndexedDB
   - New currency immediately available in dropdown
   - Automatically selects the newly added currency

### No Conversion - Filter Only
1. **Remove all conversion utilities**
   - No need for currency conversion functions
   - Each transaction retains its original currency in PostgreSQL

2. **Update transaction forms**
   - Pre-select default currency from IndexedDB for convenience
   - Load all available currencies from IndexedDB
   - No exchange rate display or conversion
   - Include "Add New Currency" option in dropdown

3. **Update statistics calculations**
   - Filter transactions by selected currency
   - Display only transactions in the selected currency
   - Clear indicator: "Showing only [CURRENCY] transactions"
   - Dropdown to select which currency to view

### Settings Management
1. **Add default currency change functionality**
   - Settings page option to change default currency
   - Updates IndexedDB settings
   - Simple change without affecting existing transactions
   - No recalculation needed since there's no conversion

### IndexedDB Implementation
1. **Database Setup**
   ```typescript
   import { openDB } from 'idb';
   
   const DB_NAME = 'finance-app';
   const DB_VERSION = 1;
   
   export async function initDB() {
     return openDB(DB_NAME, DB_VERSION, {
       upgrade(db) {
         // Profiles store
         if (!db.objectStoreNames.contains('profiles')) {
           db.createObjectStore('profiles', { keyPath: 'name' });
         }
         // Tags store
         if (!db.objectStoreNames.contains('tags')) {
           const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
           tagStore.createIndex('profile_name', ['profile', 'name'], { unique: true });
           tagStore.createIndex('profile', 'profile');
         }
         // Currencies store
         if (!db.objectStoreNames.contains('currencies')) {
           const store = db.createObjectStore('currencies', { keyPath: 'code' });
           store.createIndex('isDefault', 'isDefault');
         }
         // Settings store
         if (!db.objectStoreNames.contains('settings')) {
           db.createObjectStore('settings', { keyPath: 'key' });
         }
       },
     });
   }
   ```

2. **Profile Operations**
   - See `design/currency-system.md` for detailed profile CRUD operations
   - All operations are async and return Promises
   - Handle errors gracefully with user-friendly messages
   - Profile switching is instant (no API calls)

3. **Tag Operations**
   - See `design/currency-system.md` for detailed tag CRUD operations
   - Tags are profile-specific and filtered by active profile
   - All operations are async and return Promises
   - Handle errors gracefully with user-friendly messages
   - No API calls needed

4. **Currency Operations**
   - See `design/currency-system.md` for detailed currency CRUD operations
   - All operations are async and return Promises
   - Handle errors gracefully with user-friendly messages
   - **Import from Database**: See `design/currency-system.md` for `importCurrenciesFromDatabase()` function
   - Import scans all transactions and adds unique currencies to IndexedDB (skips duplicates)

5. **Import Functionality**
   - **Tags Import**: Available in Edit Tags page (`/tags/edit`)
     - Button triggers `importTagsFromDatabase(profileName)` function
     - Scans all transactions for the active profile
     - Extracts unique tags with their transaction types (expense/income)
     - Adds new tags to IndexedDB, skips existing ones
     - Shows success message with count of added/skipped tags
   - **Currency Import**: Available in Manage Currencies page (`/currencies/manage`)
     - Button triggers `importCurrenciesFromDatabase()` function
     - Scans all transactions for the current user
     - Extracts unique currencies
     - Adds new currencies to IndexedDB, skips existing ones
     - Shows success message with count of added/skipped currencies
   - **Profile Auto-Population**: Runs automatically at app startup
     - Checks if IndexedDB profiles are empty
     - If empty, calls `importProfilesFromDatabase()` function
     - Scans all transactions for the current user
     - Extracts unique profile names
     - Adds profiles to IndexedDB
     - Sets first imported profile as active if no active profile exists
     - Silent operation (no user notification needed)

6. **Context Providers**
   ```typescript
   // contexts/ProfileContext.tsx
   export function ProfileContext({ children }) {
     const [profiles, setProfiles] = useState<Profile[]>([]);
     const [activeProfile, setActiveProfile] = useState<string | null>(null);
     
     useEffect(() => {
       loadProfiles();
     }, []);
     
     async function loadProfiles() {
       const db = await initDB();
       const allProfiles = await db.getAll('profiles');
       
       // Auto-populate profiles from database if IndexedDB is empty
       if (allProfiles.length === 0) {
         await importProfilesFromDatabase();
         // Reload after import
         const updatedProfiles = await db.getAll('profiles');
         setProfiles(updatedProfiles);
       } else {
         setProfiles(allProfiles);
       }
       
       const settings = await db.get('settings', 'activeProfile');
       setActiveProfile(settings?.value || null);
     }
     
     // Add, rename, delete, switch functions...
   }
   
   // contexts/TagContext.tsx
   export function TagProvider({ children }) {
     const { activeProfile } = useProfile();
     const [tags, setTags] = useState<Tag[]>([]);
     
     useEffect(() => {
       if (activeProfile) {
         loadTags();
       }
     }, [activeProfile]);
     
     async function loadTags() {
       const db = await initDB();
       const tx = db.transaction('tags', 'readonly');
       const store = tx.objectStore('tags');
       const index = store.index('profile');
       const profileTags = await index.getAll(activeProfile);
       setTags(profileTags);
     }
     
     // Add, edit, delete functions...
   }
   
   // contexts/CurrencyContext.tsx
   export function CurrencyProvider({ children }) {
     const [currencies, setCurrencies] = useState<Currency[]>([]);
     const [defaultCurrency, setDefaultCurrency] = useState<string | null>(null);
     
     useEffect(() => {
       loadCurrencies();
     }, []);
     
     async function loadCurrencies() {
       const db = await initDB();
       const allCurrencies = await db.getAll('currencies');
       setCurrencies(allCurrencies);
       
       const settings = await db.get('settings', 'defaultCurrency');
       setDefaultCurrency(settings?.value || null);
     }
     
     // Add, edit, delete functions...
   }
   ```

## Unified Transaction UI Implementation Priority

### Phase 1: Core Transaction Management
1. **Create unified transaction data model and TypeScript interfaces**
   - Database entities/interfaces reflecting the SQL schema
   - Service layer functions for CRUD with parameterized queries
   - Migration scripts as needed

2. **Implement Create Transaction Page (`/transactions/create`)**
   - Transaction type toggle/tabs component (Expense/Income)
   - Dynamic tag filtering based on selected type
   - Form validation and submission logic
   - Save to database with appropriate `transactionType`
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
   - Persist changes to database on save
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
// Wrap all API calls with loading context
async function fetchTransactions(params: { profileId: string; from?: string; to?: string }) {
  const { startLoading, stopLoading } = useLoading();
  
  try {
    startLoading(); // Show global progress bar
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`/api/transactions?${query}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } finally {
    stopLoading(); // Hide global progress bar
  }
}
```

### Integration Points
- All server API calls
- Authentication requests (register, login, logout)
- Data export/import operations (optional)
- Settings initialization

## Guest Mode Implementation

### Client-Side Guest Mode Detection
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isGuestMode: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  // ... other auth functions
}

export function AuthProvider({ children }) {
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  useEffect(() => {
    // Check for guest mode in localStorage/sessionStorage
    const guestMode = localStorage.getItem('guestMode') === 'true';
    setIsGuestMode(guestMode);
  }, []);
  
  const enterGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuestMode(true);
    // Redirect to dashboard
    router.push('/');
  };
  
  const exitGuestMode = () => {
    localStorage.removeItem('guestMode');
    setIsGuestMode(false);
    // Redirect to login
    router.push('/auth/signin');
  };
  
  return (
    <AuthContext.Provider value={{ isGuestMode, enterGuestMode, exitGuestMode, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Guest Data Service (Client-Side)
```typescript
// services/guestDataService.ts
import { faker } from '@faker-js/faker';
import type { Transaction, TransactionType } from '@/types';

class GuestDataService {
  private transactions: Map<string, Transaction> = new Map();
  
  // Initialize with some fake transactions
  constructor() {
    this.generateInitialTransactions();
  }
  
  private generateInitialTransactions() {
    for (let i = 0; i < 20; i++) {
      const id = faker.string.uuid();
      this.transactions.set(id, this.generateTransaction(id));
    }
  }
  
  private generateTransaction(id?: string): Transaction {
    const transactionId = id || faker.string.uuid();
    const type: TransactionType = faker.helpers.arrayElement(['expense', 'income']);
    const date = faker.date.between({ 
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date()
    });
    
    return {
      id: transactionId,
      userId: faker.string.uuid(),
      profile: faker.helpers.arrayElement(['Personal', 'Business']),
      occurredAt: date.toISOString().split('T')[0],
      amountMinor: faker.number.int({ min: 100, max: 100000 }),
      currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP', 'JPY']),
      type,
      tags: type === 'expense' 
        ? faker.helpers.arrayElements(['Food', 'Transport', 'Shopping', 'Bills'], { min: 1, max: 3 })
        : faker.helpers.arrayElements(['Salary', 'Freelance', 'Investment'], { min: 1, max: 2 }),
      note: faker.lorem.sentence(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };
  }
  
  async getTransactions(params: {
    profile?: string;
    from?: string;
    to?: string;
    type?: TransactionType;
  }): Promise<Transaction[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filtered = Array.from(this.transactions.values());
    
    if (params.profile) {
      filtered = filtered.filter(t => t.profile === params.profile);
    }
    
    if (params.type) {
      filtered = filtered.filter(t => t.type === params.type);
    }
    
    if (params.from) {
      filtered = filtered.filter(t => t.occurredAt >= params.from!);
    }
    
    if (params.to) {
      filtered = filtered.filter(t => t.occurredAt <= params.to!);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }
  
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const transaction = this.generateTransaction();
    Object.assign(transaction, data, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }
  
  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const existing = this.transactions.get(id);
    if (!existing) {
      throw new Error('Transaction not found');
    }
    
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    this.transactions.set(id, updated);
    return updated;
  }
  
  async deleteTransaction(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.transactions.delete(id);
  }
  
  async getStatistics(params: {
    profile?: string;
    from?: string;
    to?: string;
    currency?: string;
  }): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const transactions = await this.getTransactions(params);
    const filtered = params.currency 
      ? transactions.filter(t => t.currency === params.currency)
      : transactions;
    
    const expenses = filtered.filter(t => t.type === 'expense');
    const incomes = filtered.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amountMinor), 0);
    const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amountMinor), 0);
    
    // Generate tag breakdown
    const tagBreakdown: Record<string, number> = {};
    expenses.forEach(t => {
      t.tags.forEach(tag => {
        tagBreakdown[tag] = (tagBreakdown[tag] || 0) + Number(t.amountMinor);
      });
    });
    
    return {
      totalExpense,
      totalIncome,
      netBalance: totalIncome - totalExpense,
      tagBreakdown,
      transactionCount: filtered.length,
    };
  }
  
  async getSettings(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
      theme: 'light',
    };
  }
  
  async updateSettings(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...this.getSettings(), ...data };
  }
}

// Singleton instance
export const guestDataService = new GuestDataService();
```

### API Utility with Guest Mode Interception
```typescript
// utils/api.ts
import { guestDataService } from '@/services/guestDataService';

// Get guest mode state (can be from context, localStorage, etc.)
function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('guestMode') === 'true';
}

export async function apiCall(endpoint: string, options?: RequestInit) {
  // Intercept in Guest Mode - generate data client-side
  if (isGuestMode()) {
    return handleGuestModeRequest(endpoint, options);
  }
  
  // Normal API call
  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
}

async function handleGuestModeRequest(endpoint: string, options?: RequestInit): Promise<any> {
  const method = options?.method || 'GET';
  const url = new URL(endpoint, window.location.origin);
  const path = url.pathname;
  
  // Route to appropriate guest data service method
  if (path === '/api/transactions') {
    if (method === 'GET') {
      const params = Object.fromEntries(url.searchParams);
      return guestDataService.getTransactions(params);
    }
    if (method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      return guestDataService.createTransaction(body);
    }
  }
  
  if (path.startsWith('/api/transactions/')) {
    const id = path.split('/').pop();
    if (method === 'PUT' && id) {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      return guestDataService.updateTransaction(id, body);
    }
    if (method === 'DELETE' && id) {
      return guestDataService.deleteTransaction(id);
    }
  }
  
  if (path === '/api/statistics') {
    if (method === 'GET') {
      const params = Object.fromEntries(url.searchParams);
      return guestDataService.getStatistics(params);
    }
  }
  
  if (path === '/api/settings') {
    if (method === 'GET') {
      return guestDataService.getSettings();
    }
    if (method === 'POST') {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      return guestDataService.updateSettings(body);
    }
  }
  
  // Default: return empty response
  return Promise.resolve({});
}
```

### Guest Mode Indicator Component
```typescript
// components/GuestModeIndicator.tsx
import { Fab, Tooltip } from '@mui/material';
import { PersonIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export function GuestModeIndicator() {
  const { isGuestMode, exitGuestMode } = useAuth();
  
  if (!isGuestMode) return null;
  
  return (
    <Tooltip title="Guest Mode - Using demo data">
      <Fab
        size="small"
        color="secondary"
        sx={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={() => {
          // Optional: Show exit dialog
          if (confirm('Exit Guest Mode? You will be redirected to the login page.')) {
            exitGuestMode();
          }
        }}
      >
        <PersonIcon />
      </Fab>
    </Tooltip>
  );
}
```

### Fake Data Generation Library
Install a data generation library:
```bash
npm install @faker-js/faker
```

**Usage:**
- Generate realistic transactions with proper structure
- Use consistent seeds for deterministic data (optional)
- Generate appropriate amounts, dates, currencies, and tags
- Ensure generated data matches TypeScript interfaces

### Guest Mode Setup in IndexedDB
When entering Guest Mode, populate IndexedDB with fake profiles, tags, and currencies:
```typescript
// utils/guestMode.ts
import { faker } from '@faker-js/faker';

export async function setupGuestModeIndexedDB() {
  const db = await initDB();
  
  // Generate fake profiles
  const profiles = [
    { name: 'Personal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { name: 'Business', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  
  // Generate fake currencies
  const currencies = ['USD', 'EUR', 'GBP', 'JPY'].map(code => ({
    code,
    isDefault: code === 'USD',
  }));
  
  // Generate fake tags
  const expenseTags = ['Food', 'Transport', 'Shopping', 'Bills'].map(name => ({
    id: faker.string.uuid(),
    name,
    profile: 'Personal',
    type: 'expense',
    color: faker.color.rgb(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  // Save to IndexedDB
  // ... implementation
}
```

## Best Practices

### Data Integrity
- Currency can be any valid 3-letter code (transactions store currency as text in PostgreSQL)
- Profile can be any valid string (transactions store profile name as text in PostgreSQL)
- Tags can be any valid strings (transactions store tag names as text array in PostgreSQL)
- No need to check if currency, profile, or tags exist before saving transaction (transactions are independent)
- Profiles, tags, and currencies can be freely added/deleted in IndexedDB without affecting existing transactions
- Ensure at least one profile, one currency, and some default tags exist in IndexedDB during initial setup
- Prevent deletion of the active profile
- Validate profile names are unique when creating new profiles
- Validate tag names are unique within a profile and type
- Currency codes must be 3 uppercase letters
- When renaming/deleting profiles or tags in IndexedDB, existing transactions in PostgreSQL retain the old values

### Performance
- Load all profiles, tags, and currencies from IndexedDB (instant, no network calls)
- IndexedDB provides offline access to profiles, tags, and currency lists
- Profile switching is instant (no API calls, just IndexedDB update)
- Tag filtering by profile happens client-side instantly
- Global progress bar uses request counting to handle concurrent calls efficiently
- No API calls needed for profile, tag, or currency operations
- Transaction queries filtered by profile name at the database level
- Tags embedded in transactions as text array for efficient querying
- **Guest Mode**: Zero network overhead - all data generated client-side with minimal delay simulation

### User Experience
- Pre-select user's default currency from IndexedDB in transaction forms
- Display active profile name prominently in the dashboard
- Make profile switching instant and intuitive (no loading, all client-side)
- Load tags instantly when switching profiles or transaction types
- Clearly indicate which currency is the default currency throughout the app
- Include "Add New Currency" option in transaction form for quick currency addition
- Display clear currency filter in statistics (e.g., "Showing only USD transactions")
- Use consistent currency formatting throughout app
- Show currency symbols where appropriate ($ £ € ¥)
- Use tag colors for visual identification in transaction lists and statistics
- Explain that profiles, tags, and currencies are stored locally during first-time setup
- Make it clear that no currency conversion occurs
- Inform users that profiles, tags, and currencies are NOT included in backups (stored locally in IndexedDB)
- Warn users when renaming/deleting profiles or tags that existing transactions keep the old values
- Global progress bar provides consistent feedback for API operations without cluttering the UI
- Provide clear explanations about profile separation during setup
- Show confirmation dialogs when deleting profiles or tags to prevent accidental data loss
- Profiles, tags, and currencies are shared across all users on the same browser/device (browser-level storage)
- Users need to re-create profiles, tags, and currencies when moving to a new device/browser
- **Profile Auto-Population**: At startup, if IndexedDB profiles are empty, automatically populate from existing profiles in transactions for that user
- **Import from Database**: Provide "Import from Database" option in tags and currency screens to scan transactions and auto-populate IndexedDB (handles duplicates gracefully)
- **Guest Mode**: Provide seamless experience with fake data; clearly indicate Guest Mode status; allow easy exit to login page

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

