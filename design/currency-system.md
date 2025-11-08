[← Back to README](README.md)

# Currency System

## Overview
The app supports multi-currency tracking without automatic conversion. Each transaction is recorded in its original currency, and statistics and reports show data for one currency at a time. Users can select which currency to view in reports using a dropdown selector.

## No Currency Conversion
- **No exchange rates stored**: The system does not store or manage exchange rates
- **No automatic conversion**: Transactions are always displayed in their original currency
- **Single-currency reports**: Statistics and reports show only transactions in the selected currency

## Currency Storage
- **Frontend Storage**: Currencies are stored in IndexedDB on the browser side
- **No Backend Storage**: There are no currency tables in PostgreSQL
- **Per-Browser Storage**: Currencies are stored locally per browser/device
- **Profile-Independent**: Currencies are shared across all profiles on the same browser

**Note:** Profiles are also stored in IndexedDB alongside currencies. See IndexedDB Schema section below.

## Currency Management

### Initial Setup
1. When the app starts for the first time (no currencies in IndexedDB)
2. User is prompted to select their first currency
3. Currency is saved to IndexedDB and becomes the default
4. User can then proceed to use the app

### Adding Currencies
1. **From Manage Currencies Page:**
   - User navigates to Manage Currencies page
   - Enters currency code (e.g., USD, GBP, EUR)
   - System validates and saves currency to IndexedDB
   - Currency becomes available for transaction entry

2. **During Transaction Entry:**
   - Currency dropdown shows all stored currencies from IndexedDB
   - Dropdown includes an "Add New Currency" option
   - Selecting "Add New Currency" opens an inline input/dialog
   - User enters new currency code, which is validated and saved to IndexedDB
   - New currency becomes available immediately in the dropdown

### Using Currencies in Transactions
1. When creating expense/income, user selects currency from dropdown
2. System populates currency dropdown from IndexedDB
3. Each transaction is recorded with its original currency in PostgreSQL
4. No conversion occurs at any point

### Default Behavior
- User selects the first currency during initial app startup
- This default currency is pre-selected in transaction forms for convenience
- Default currency preference is stored in IndexedDB
- Users can add as many currencies as needed
- Each transaction retains its original currency permanently

### Managing Currencies
- **Adding**: Add new currencies via Manage Currencies page or inline during transaction entry
- **Editing**: Change currency code (updates IndexedDB only, does not affect existing transactions)
- **Deleting**: Remove currencies from IndexedDB (does not affect existing transactions already saved in PostgreSQL)
- **Default Currency**: Set or change the default currency in settings (stored in IndexedDB)
- **Import from Database**: Scan all transactions and auto-populate IndexedDB with existing currencies (skips duplicates if currencies already exist)

## Statistics and Reporting

### Single-Currency View
1. Load all transactions for selected period from database
2. Filter transactions by `type` (expense/income) and other criteria
3. Identify all unique currencies used in transactions
4. User selects which currency to view from a dropdown
5. Display only transactions in the selected currency:
   ```typescript
   // Filter transactions by selected currency
   const filteredTransactions = transactions.filter(
     transaction => transaction.currency === selectedCurrency
   );
   
   // Aggregate amounts by tag and type
   for (const transaction of filteredTransactions) {
     if (transaction.type === 'expense') {
       aggregatedExpenses[transaction.tag] += transaction.amount;
     } else {
       aggregatedIncomes[transaction.tag] += transaction.amount;
     }
   }
   ```
6. Display pie chart and summary showing only the selected currency

### Example Scenario
**Transactions in November 2025:**
- Expense: $100 USD (Food)
- Expense: £50 GBP (Food)
- Expense: $75 USD (Transport)
- Income: $2000 USD (Salary)
- Income: £500 GBP (Freelance)

**Statistics when viewing USD:**
- Food: $100
- Transport: $75
- Total Expenses: $175
- Total Income: $2000
- Net: $1825

**Statistics when viewing GBP:**
- Food: £50
- Total Expenses: £50
- Total Income: £500
- Net: £450

**Note:** Only transactions in the selected currency are included in the report.

## Data Validation

### Currency Entry Validation
- Currency code: 3 uppercase letters (e.g., USD, GBP, EUR)
- Currency must be unique in IndexedDB
- Currency code follows ISO 4217 standard (recommended but not enforced)

### Transaction Validation
- Currency can be any valid 3-letter code (transactions store currency as text)
- Amount must be positive number
- All required fields must be filled

## IndexedDB Schema

### profiles (Object Store)
```typescript
interface Profile {
  name: string;        // Primary key, profile name
  createdAt: string;   // ISO 8601 timestamp
  updatedAt: string;   // ISO 8601 timestamp
}
```

### tags (Object Store)
```typescript
interface Tag {
  id: string;          // Primary key, unique ID
  name: string;        // Tag name
  profile: string;     // Profile name
  type: 'expense' | 'income'; // Transaction type
  color?: string;      // Optional color for UI display
  createdAt: string;   // ISO 8601 timestamp
  updatedAt: string;   // ISO 8601 timestamp
}

// Composite index on (profile, name) for uniqueness within profile
```

### currencies (Object Store)
```typescript
interface Currency {
  code: string;        // Primary key, e.g., "USD", "EUR", "GBP"
  isDefault: boolean;  // Whether this is the default currency
  createdAt: string;   // ISO 8601 timestamp
  updatedAt: string;   // ISO 8601 timestamp
}
```

### settings (Object Store)
```typescript
interface AppSettings {
  key: string;           // Primary key (e.g., "defaultCurrency", "activeProfile")
  value: string;         // Setting value
  updatedAt: string;     // ISO 8601 timestamp
}

// Common settings:
// - key: "defaultCurrency", value: "USD"
// - key: "activeProfile", value: "Personal"
```

## Currency Operations (IndexedDB)

### Load All Currencies
```typescript
async function getAllCurrencies(): Promise<Currency[]> {
  const db = await openIndexedDB();
  const tx = db.transaction('currencies', 'readonly');
  const store = tx.objectStore('currencies');
  return await store.getAll();
}
```

### Add Currency
```typescript
async function addCurrency(code: string, isDefault = false): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('currencies', 'readwrite');
  const store = tx.objectStore('currencies');
  
  const currency: Currency = {
    code: code.toUpperCase(),
    isDefault,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await store.add(currency);
}
```

### Update Currency
```typescript
async function updateCurrency(code: string, updates: Partial<Currency>): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('currencies', 'readwrite');
  const store = tx.objectStore('currencies');
  
  const currency = await store.get(code);
  if (currency) {
    Object.assign(currency, updates, { updatedAt: new Date().toISOString() });
    await store.put(currency);
  }
}
```

### Delete Currency
```typescript
async function deleteCurrency(code: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('currencies', 'readwrite');
  const store = tx.objectStore('currencies');
  await store.delete(code);
}
```

### Import Currencies from Database
```typescript
async function importCurrenciesFromDatabase(): Promise<{ added: number; skipped: number }> {
  // Fetch all transactions for the current user
  const response = await fetch('/api/transactions', { credentials: 'include' });
  const transactions: Transaction[] = await response.json();
  
  // Extract unique currencies from transactions
  const uniqueCurrencies = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.currency) {
      uniqueCurrencies.add(transaction.currency.toUpperCase());
    }
  }
  
  const db = await openIndexedDB();
  const tx = db.transaction('currencies', 'readwrite');
  const store = tx.objectStore('currencies');
  
  let added = 0;
  let skipped = 0;
  
  // Get existing currencies to check for duplicates
  const existingCurrencies = await store.getAll();
  const existingCodes = new Set(existingCurrencies.map(c => c.code));
  
  // Add new currencies (skip if already exists)
  for (const code of uniqueCurrencies) {
    if (!existingCodes.has(code)) {
      const currency: Currency = {
        code: code,
        isDefault: false, // Don't change default when importing
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await store.add(currency);
      added++;
    } else {
      skipped++;
    }
  }
  
  return { added, skipped };
}
```

## Profile Operations (IndexedDB)

### Load All Profiles
```typescript
async function getAllProfiles(): Promise<Profile[]> {
  const db = await openIndexedDB();
  const tx = db.transaction('profiles', 'readonly');
  const store = tx.objectStore('profiles');
  return await store.getAll();
}
```

### Add Profile
```typescript
async function addProfile(name: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('profiles', 'readwrite');
  const store = tx.objectStore('profiles');
  
  const profile: Profile = {
    name: name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await store.add(profile);
}
```

### Update Profile
```typescript
async function updateProfile(name: string, newName: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('profiles', 'readwrite');
  const store = tx.objectStore('profiles');
  
  const profile = await store.get(name);
  if (profile) {
    await store.delete(name);
    profile.name = newName;
    profile.updatedAt = new Date().toISOString();
    await store.add(profile);
  }
}
```

### Delete Profile
```typescript
async function deleteProfile(name: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('profiles', 'readwrite');
  const store = tx.objectStore('profiles');
  await store.delete(name);
}
```

### Get/Set Active Profile
```typescript
async function getActiveProfile(): Promise<string | null> {
  const db = await openIndexedDB();
  const tx = db.transaction('settings', 'readonly');
  const store = tx.objectStore('settings');
  const setting = await store.get('activeProfile');
  return setting?.value || null;
}

async function setActiveProfile(profileName: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');
  
  await store.put({
    key: 'activeProfile',
    value: profileName,
    updatedAt: new Date().toISOString(),
  });
}
```

### Import Profiles from Database (Startup Auto-Population)
```typescript
async function importProfilesFromDatabase(): Promise<{ added: number; skipped: number }> {
  // Check if profiles already exist in IndexedDB
  const db = await openIndexedDB();
  const tx = db.transaction('profiles', 'readonly');
  const store = tx.objectStore('profiles');
  const existingProfiles = await store.getAll();
  
  // If profiles already exist, skip import
  if (existingProfiles.length > 0) {
    return { added: 0, skipped: 0 };
  }
  
  // Fetch all transactions for the current user
  const response = await fetch('/api/transactions', { credentials: 'include' });
  const transactions: Transaction[] = await response.json();
  
  // Extract unique profile names from transactions
  const uniqueProfiles = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.profile) {
      uniqueProfiles.add(transaction.profile);
    }
  }
  
  // Switch to readwrite transaction
  const writeTx = db.transaction('profiles', 'readwrite');
  const writeStore = writeTx.objectStore('profiles');
  
  let added = 0;
  let skipped = 0;
  
  // Get existing profiles again (in case they were added during the fetch)
  const currentProfiles = await writeStore.getAll();
  const existingProfileNames = new Set(currentProfiles.map(p => p.name));
  
  // Add new profiles
  for (const profileName of uniqueProfiles) {
    if (!existingProfileNames.has(profileName)) {
      const profile: Profile = {
        name: profileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await writeStore.add(profile);
      added++;
    } else {
      skipped++;
    }
  }
  
  // If a profile was added and no active profile is set, set the first one as active
  if (added > 0) {
    const activeProfile = await getActiveProfile();
    if (!activeProfile && uniqueProfiles.size > 0) {
      await setActiveProfile(Array.from(uniqueProfiles)[0]);
    }
  }
  
  return { added, skipped };
}
```

## Tag Operations (IndexedDB)

### Load Tags for Profile
```typescript
async function getTagsForProfile(profileName: string, type?: 'expense' | 'income'): Promise<Tag[]> {
  const db = await openIndexedDB();
  const tx = db.transaction('tags', 'readonly');
  const store = tx.objectStore('tags');
  const index = store.index('profile_name');
  const allTags = await index.getAll(profileName);
  
  if (type) {
    return allTags.filter(tag => tag.type === type);
  }
  return allTags;
}
```

### Add Tag
```typescript
async function addTag(profile: string, name: string, type: 'expense' | 'income', color?: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('tags', 'readwrite');
  const store = tx.objectStore('tags');
  
  const tag: Tag = {
    id: crypto.randomUUID(),
    name: name,
    profile: profile,
    type: type,
    color: color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await store.add(tag);
}
```

### Update Tag
```typescript
async function updateTag(id: string, updates: Partial<Tag>): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('tags', 'readwrite');
  const store = tx.objectStore('tags');
  
  const tag = await store.get(id);
  if (tag) {
    Object.assign(tag, updates, { updatedAt: new Date().toISOString() });
    await store.put(tag);
  }
}
```

### Delete Tag
```typescript
async function deleteTag(id: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction('tags', 'readwrite');
  const store = tx.objectStore('tags');
  await store.delete(id);
}
```

### Check if Tag is Used in Transactions
```typescript
async function isTagUsed(tagName: string, profile: string): Promise<boolean> {
  // This would require querying the backend API
  const response = await fetch(`/api/transactions/check-tag?tag=${encodeURIComponent(tagName)}&profile=${encodeURIComponent(profile)}`);
  const data = await response.json();
  return data.isUsed;
}
```

### Import Tags from Database
```typescript
async function importTagsFromDatabase(profileName: string): Promise<{ added: number; skipped: number }> {
  // Fetch all transactions for the current user and active profile
  const response = await fetch(`/api/transactions?profile=${encodeURIComponent(profileName)}`, { credentials: 'include' });
  const transactions: Transaction[] = await response.json();
  
  // Extract unique tags with their types from transactions
  const tagMap = new Map<string, 'expense' | 'income'>();
  for (const transaction of transactions) {
    if (transaction.tags && transaction.tags.length > 0) {
      for (const tagName of transaction.tags) {
        if (tagName) {
          // Store tag with its transaction type
          // If tag appears in both expense and income, prefer expense
          if (!tagMap.has(tagName) || transaction.type === 'expense') {
            tagMap.set(tagName, transaction.type);
          }
        }
      }
    }
  }
  
  const db = await openIndexedDB();
  const tx = db.transaction('tags', 'readwrite');
  const store = tx.objectStore('tags');
  const index = store.index('profile_name');
  
  let added = 0;
  let skipped = 0;
  
  // Get existing tags for this profile to check for duplicates
  const existingTags = await index.getAll(profileName);
  const existingTagKeys = new Set(
    existingTags.map(tag => `${tag.profile}:${tag.name}:${tag.type}`)
  );
  
  // Add new tags (skip if already exists)
  for (const [tagName, type] of tagMap.entries()) {
    const tagKey = `${profileName}:${tagName}:${type}`;
    if (!existingTagKeys.has(tagKey)) {
      const tag: Tag = {
        id: crypto.randomUUID(),
        name: tagName,
        profile: profileName,
        type: type,
        color: undefined, // No color assigned during import
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await store.add(tag);
      added++;
    } else {
      skipped++;
    }
  }
  
  return { added, skipped };
}
```

