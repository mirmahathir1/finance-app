[← Back to README](README.md)

# Create Transaction

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <a href="./dashboard.md">← Back</a>  Create Transaction       │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Transaction Form                                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Transaction Type                                  │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [Expense] [Income]                            │ │ │
│  │  │  (red)     (green)                            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Date                                              │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ 📅 January 15, 2024                          │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Amount                                            │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ $ [100.00]                                    │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Currency                                          │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [USD ▼]                                       │ │ │
│  │  │   • USD                                       │ │ │
│  │  │   • EUR                                       │ │ │
│  │  │   • GBP                                       │ │ │
│  │  │   ────────────────────────────               │ │ │
│  │  │   + <a href="./manage-currencies.md">Add New Currency</a>                          │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  (When "Add New Currency" is selected, inline    │ │
│  │   dialog appears: Enter 3-letter code → Validate  │ │
│  │   → Save to IndexedDB → Auto-select new currency)│ │
│  │                                                    │ │
│  │  Description                                       │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Grocery shopping at Walmart                  │ │ │
│  │  │                                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Tag                                               │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [Food & Dining ▼]                            │ │ │
│  │  │   • Food & Dining  🟢                        │ │ │
│  │  │   • Transportation 🟡                        │ │ │
│  │  │   • Shopping       🔵                         │ │ │
│  │  │   (filtered by transaction type)             │ │ │
│  │  │   + <a href="./edit-tags.md">Manage Tags</a>                │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────┐ ┌──────────────────┐      │ │
│  │  │ <a href="./dashboard.md">Cancel</a>  │ │ Save Transaction  │      │ │
│  │  └──────────────────┘ └──────────────────┘      │ │
│  │                                                    │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Recent Transactions                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Recent Entries                                     │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Jan 14  Expense  $45.00  USD  Coffee Shop    │  │ │
│  │ │          🟢 Food & Dining                     │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Jan 13  Income   $2,500.00  USD  Salary       │  │ │
│  │ │          🔵 Salary                             │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Jan 12  Expense  $120.00  USD  Gas Station    │  │ │
│  │ │          🟡 Transportation                    │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │ <a href="./view-transactions.md">View All</a>                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-create-transaction"></a>

### Create Transaction
- `POST /api/transactions` — See [API Response Documentation](./api/transactions-create.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

## Component Structure

The Create Transaction page consists of:

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

## Features

- **Transaction Type Toggle**: Prominent toggle or tabs to switch between Expense (red) and Income (green)
- **Default Currency Pre-selection**: Default currency from IndexedDB is pre-selected for convenience
- **Inline Currency Addition**: When "Add New Currency" is selected from dropdown:
  - Inline dialog/input appears
  - User enters 3-letter currency code
  - System validates and saves to IndexedDB
  - New currency immediately available in dropdown
  - Automatically selects the newly added currency
- **Dynamic Tag Filtering**: Tag dropdown updates based on selected transaction type (expense/income)
- **Recent Transactions**: Shows last 5 entries with color-coded types
- **Visual Mode Indication**: Color scheme changes based on transaction type (red for expense, green for income)

## User Flow

1. User selects transaction type (Expense/Income)
2. Form pre-fills with default currency from IndexedDB
3. User fills in date, amount, currency, description, and tag
4. If currency not in list, user can add inline via "Add New Currency" option
5. User clicks "Save Transaction"
6. Transaction is saved to database with selected type
7. Success message appears
8. If "Save & Add Another": Form clears and user can add another transaction
9. If "Save Transaction": User returns to dashboard or stays on page

## Inline Currency Addition Flow

1. User clicks currency dropdown
2. Selects "Add New Currency" option at bottom of list
3. Inline input dialog appears
4. User enters 3-letter currency code (e.g., GBP, EUR, JPY)
5. System validates format (3 uppercase letters)
6. Currency is saved to IndexedDB
7. Dropdown refreshes to include new currency
8. New currency is automatically selected
9. User continues filling form

## Create Transaction Flow (Expense or Income)

1. Dashboard → Create Transaction Button
2. Transaction Form loads
3. User Selects Transaction Type (Expense/Income toggle)
4. Fill Details:
   - Date
   - Amount
   - Currency from IndexedDB dropdown with "Add New" option
   - Description
   - Tag filtered by type
5. User can select existing currency or "Add New Currency"
6. If "Add New Currency": Inline dialog → Enter code → Validate → Save to IndexedDB → Select new currency
7. Validate all fields
8. Save to database with selected type
9. Success Message → Dashboard or Stay to Add Another

**Key UX Features:**
- Default transaction type can be expense (most common) or last used type
- Default currency is pre-selected from IndexedDB settings
- Currency dropdown includes "Add New Currency" option
- Switching type updates available tags dynamically
- Quick toggle to add multiple transactions of different types

## Error Handling

- **Invalid currency code**: Shows validation error for invalid format
- **Duplicate currency**: Prevents adding currency that already exists
- **Required fields**: Validates all required fields before submission
- **Form validation**: Real-time validation feedback
- **Global progress bar**: Shows during API calls

## Implementation Notes

### Transaction Type State Management
- Transaction type state persists between sessions (remember last used)
- Default to "Expense" for first-time users (most common operation)
- Color coding:
  - Expense mode: Red/pink accent colors
  - Income mode: Green accent colors
- Responsive design: 
  - Desktop: Toggle buttons or tabs
  - Mobile: Segmented control or bottom sheet selector

### Form Features
- Prominent Expense/Income toggle or tabs at the top
- Visual mode indication (color scheme changes)
- Tag selector dynamically updates based on selected type
- "Save & Add Another" option to quickly add multiple transactions
- Recent transactions list shows both types with clear visual distinction

### Data Validation
- Currency can be any valid 3-letter code (transactions store currency as text in PostgreSQL)
- Profile can be any valid string (transactions store profile name as text in PostgreSQL)
- Tags can be any valid strings (transactions store tag names as text array in PostgreSQL)
- No need to check if currency, profile, or tags exist before saving transaction (transactions are independent)

## UI/UX Guidelines

- Pre-select user's default currency from IndexedDB in transaction forms
- Include "Add New Currency" option in currency dropdown for quick addition
- Color-coded amounts (red for expenses, green for incomes)
- Type badges for quick identification
- Use smooth animations for form transitions (150-300ms)
- Currency symbols displayed appropriately ($ £ € ¥)
- Format numbers according to currency locale
