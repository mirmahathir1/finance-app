# Data Models

## CSV File Structures

### 1. Transaction Records: `transactions-YYYY-MM.csv`
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

### 2. Tags Configuration: `tags.csv`
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

### 3. Currencies Configuration: `currencies.csv`
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

### 4. App Settings: `settings.json`
```json
{
  "folderId": "google-drive-folder-id",
  "defaultCurrency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "initialized": true,
  "profilesContainerFolderId": "google-drive-profiles-folder-id", 
  "backupFolderId": "google-drive-backup-root-folder-id",
  "profiles": [
    {
      "id": "profile-uuid-1",
      "name": "Personal",
      "folderId": "google-drive-profile-folder-id-1",
      "photoFileId": "google-drive-photo-file-id-1"
    },
    {
      "id": "profile-uuid-2",
      "name": "Business",
      "folderId": "google-drive-profile-folder-id-2",
      "photoFileId": "google-drive-photo-file-id-2"
    }
  ],
  "activeProfileId": "profile-uuid-1"
}
```

**Fields:**
- `folderId`: Google Drive folder ID where profile folders are stored
- `defaultCurrency`: User's base currency code (selected during setup, used as default for transactions and conversions)
- `dateFormat`: Preferred date display format
- `initialized`: Boolean indicating if first-time setup is complete
- `profiles`: Array of profile objects, each containing:
  - `id`: Unique identifier for the profile
  - `name`: User-defined profile name
  - `folderId`: Google Drive folder ID where this profile's CSV files are stored
  - `photoFileId`: Google Drive file ID for the profile photo (optional)
- `activeProfileId`: ID of the currently selected profile

## TypeScript Interfaces

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

interface Profile {
  id: string;
  name: string;
  folderId: string;
  photoFileId?: string; // Google Drive file ID for profile photo
}

interface AppSettings {
  folderId: string;
  defaultCurrency?: string;
  dateFormat?: string;
  initialized: boolean;
  profilesContainerFolderId?: string; // Drive folder for Profiles/
  backupFolderId?: string; // Drive folder for backup/
  profiles: Profile[];
  activeProfileId: string;
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

interface BackupEntry {
  profileId: string;
  profileName: string;
  timestamp: string; // e.g., 2025-11-05T14-30-22Z
  snapshotFolderId: string;
  totalFiles?: number;
  totalBytes?: number;
}
```

