[← Back to Sign In](./signin.md) | [← Back to README](README.md)

# Guest Mode

## Guest Mode Flow

1. User clicks "Guest Mode" or "Continue as Guest" button (devs can simulate this automatically by setting `NEXT_PUBLIC_FORCE_GUEST_MODE=true` in `.env.local`)
2. System activates Guest Mode (sets flag in IndexedDB)
3. Initializes GuestDataService with fake data
4. Redirects to Dashboard
5. All API calls intercepted client-side
6. GuestDataService generates fake data (no server requests)
7. Guest Mode Indicator appears (floating icon on right side)
8. User can interact with all UI features using fake data
9. User can exit Guest Mode at any time
10. Exit Guest Mode → Clears guest mode flag → Redirects to Login Page

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
- Guest mode state persists in IndexedDB across page refreshes

### Guest Mode Data Generation

When Guest Mode is activated, all API calls are intercepted **client-side** before they reach the server. Instead of making HTTP requests, a unified `GuestDataService` generates mock data directly in the browser using Faker.js. This approach:

- **No server routes needed**: All guest data generation happens client-side
- **Zero network overhead**: No HTTP requests in Guest Mode
- **Instant responses**: Data is generated synchronously
- **Simpler maintenance**: Single guest data service handles all endpoints
- **Consistent API**: Same function signatures as real API calls

The `GuestDataService` handles all mock data generation:
- `getTransactions(params)` — Generates fake transactions matching query parameters
- `createTransaction(data)` — Simulates transaction creation
- `updateTransaction(id, data)` — Simulates transaction update
- `deleteTransaction(id)` — Simulates deletion
- `getStatistics(params)` — Generates fake aggregated metrics
- `getSettings()` — Returns generated fake user/app settings
- `updateSettings(data)` — Simulates settings update

**Note:** In Guest Mode, profile, tag, and currency management is handled entirely on the frontend using IndexedDB. The authenticated experience uses Prisma/PostgreSQL as the source of truth.

### Guest Mode Implementation Details

#### Client-Side Guest Mode Detection
```typescript
// contexts/AuthContext.tsx
import { getGuestModeState, setGuestModeState, clearGuestModeState } from '@/utils/indexedDB';

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
    // Check for guest mode in IndexedDB
    const checkGuestMode = async () => {
      const guestMode = await getGuestModeState();
      setIsGuestMode(guestMode);
    };
    checkGuestMode();
  }, []);
  
  const enterGuestMode = async () => {
    await setGuestModeState(true);
    setIsGuestMode(true);
    // Redirect to dashboard
    router.push('/');
  };
  
  const exitGuestMode = async () => {
    await clearGuestModeState();
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

#### IndexedDB Utility Functions for Guest Mode
```typescript
// utils/indexedDB.ts
// This should be part of your main IndexedDB utility that also handles profiles, tags, and currencies

const DB_NAME = 'FinanceAppDB';
const DB_VERSION = 1;
const STORE_GUEST_MODE = 'guestMode';

// Initialize IndexedDB (should be called once at app startup)
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create guest mode store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_GUEST_MODE)) {
        db.createObjectStore(STORE_GUEST_MODE, { keyPath: 'key' });
      }
      
      // Create other stores for profiles, tags, currencies if needed
      // ... (profiles, tags, currencies stores)
    };
  });
}

// Get guest mode state from IndexedDB
export async function getGuestModeState(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_GUEST_MODE], 'readonly');
      const store = transaction.objectStore(STORE_GUEST_MODE);
      const request = store.get('isGuestMode');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value === true : false);
      };
    });
  } catch (error) {
    console.error('Error reading guest mode state from IndexedDB:', error);
    return false;
  }
}

// Set guest mode state in IndexedDB
export async function setGuestModeState(value: boolean): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_GUEST_MODE], 'readwrite');
      const store = transaction.objectStore(STORE_GUEST_MODE);
      const request = store.put({ key: 'isGuestMode', value });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error writing guest mode state to IndexedDB:', error);
    throw error;
  }
}

// Clear guest mode state from IndexedDB
export async function clearGuestModeState(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_GUEST_MODE], 'readwrite');
      const store = transaction.objectStore(STORE_GUEST_MODE);
      const request = store.delete('isGuestMode');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error clearing guest mode state from IndexedDB:', error);
    throw error;
  }
}
```

**Note:** The IndexedDB implementation should be integrated with your existing IndexedDB setup for profiles, tags, and currencies. All browser-side persistent data should be stored in IndexedDB, not localStorage.

### Developer Shortcuts
- Set `NEXT_PUBLIC_FORCE_GUEST_MODE=true` to auto-enable Guest Mode without clicking the button (useful for screenshots, demos, or when backend services are offline). Remember to switch it back to `false` before shipping builds.

#### Guest Data Service (Client-Side)
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
  
  // ... other methods (createTransaction, updateTransaction, deleteTransaction, getStatistics, getSettings, updateSettings)
}

// Singleton instance
export const guestDataService = new GuestDataService();
```

#### API Utility with Guest Mode Interception
```typescript
// utils/api.ts
import { guestDataService } from '@/services/guestDataService';
import { getGuestModeState } from '@/utils/indexedDB';

// Get guest mode state from IndexedDB
async function isGuestMode(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return await getGuestModeState();
}

export async function apiCall(endpoint: string, options?: RequestInit) {
  // Intercept in Guest Mode - generate data client-side
  if (await isGuestMode()) {
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
  
  // ... handle other endpoints
  
  // Default: return empty response
  return Promise.resolve({});
}
```

#### Guest Mode Indicator Component
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

#### Guest Mode Setup in IndexedDB
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

#### Fake Data Generation Library
Install a data generation library:
```bash
npm install @faker-js/faker
```

**Usage:**
- Generate realistic transactions with proper structure
- Generate appropriate amounts, dates, currencies, and tags
- Ensure generated data matches TypeScript interfaces

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

