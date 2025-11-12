[← Back to README](README.md)

# View Transactions

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <a href="./dashboard.md">← Back</a>  Transactions            │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Filter Controls                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Type Filter                                        │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ [All (45)] [Expense (30)] [Income (15)]     │  │ │
│  │ │  (active)     (inactive)     (inactive)     │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │ Tag Filter                                         │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ [All Tags ▼]                                 │  │ │
│  │ │   • All Tags                                 │  │ │
│  │ │   • Food & Dining  🟢                        │  │ │
│  │ │   • Transportation 🟡                         │  │ │
│  │ │   (updates based on type filter)            │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │ Date Range (Optional)                              │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ From: [Jan 1, 2024] To: [Jan 31, 2024]      │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │ Search                                             │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🔍 Search by description...                  │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  <a id="transaction-list"></a>Year/Month List                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │ ▼ January 2024                                    │ │
│  │   Income: $2,500.00  Expense: $1,800.00          │ │
│  │   Balance: $700.00                                │ │
│  │   ┌────────────────────────────────────────────┐ │ │
│  │   │ Date    Type      Amount    Currency  Desc │ │ │
│  │   ├────────────────────────────────────────────┤ │ │
│  │   │ Jan 15  Expense   $45.00    USD      Coffee│ │ │
│  │   │         🟢 Food & Dining                    │ │ │
│  │   │         [<a href="#edit-transaction-modal">Edit</a>] [<a href="#delete-transaction-modal">Delete</a>]                     │ │ │
│  │   ├────────────────────────────────────────────┤ │ │
│  │   │ Jan 14  Income    $2,500.00 USD      Salary │ │ │
│  │   │         🔵 Salary                           │ │ │
│  │   │         [<a href="#edit-transaction-modal">Edit</a>] [<a href="#delete-transaction-modal">Delete</a>]                     │ │ │
│  │   ├────────────────────────────────────────────┤ │ │
│  │   │ Jan 12  Expense   $120.00   USD      Gas    │ │ │
│  │   │         🟡 Transportation                   │ │ │
│  │   │         [<a href="#edit-transaction-modal">Edit</a>] [<a href="#delete-transaction-modal">Delete</a>]                     │ │ │
│  │   └────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ▶ December 2023                                   │ │
│  │   Income: $3,200.00  Expense: $2,100.00          │ │
│  │   Balance: $1,100.00                             │ │
│  │                                                    │ │
│  │ ▶ November 2023                                   │ │
│  │   Income: $2,800.00  Expense: $1,900.00          │ │
│  │   Balance: $900.00                                │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Empty State (when no transactions)                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │        📋                                          │ │
│  │                                                    │ │
│  │  No transactions found                             │ │
│  │                                                    │ │
│  │  <a href="./create-transaction.md">Create Transaction</a>      │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-transaction-management"></a>

### Transaction Management
- `GET /api/transactions?profile&from&to&type` — See [API Response Documentation](./api/transactions-list.md)
- `PUT /api/transactions/:id` — See [API Response Documentation](./api/transactions-update.md)
- `DELETE /api/transactions/:id` — See [API Response Documentation](./api/transactions-delete.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

**Storage:** Backed by PostgreSQL (Neon). All endpoints operate on database tables with server-side authorization checks.

## Component Structure

The View Transactions page consists of:

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

## Features

- **Type Filter Tabs**: All/Expense/Income tabs with transaction count badges
- **Color-Coded Amounts**: Red for expenses, green for incomes
- **Type Badges**: Visual indicators for transaction type
- **Month Summary Cards**: Shows total income, total expense, and net balance per month
- **Search & Filter**: Filter by description, tag, and date range
- **Edit Transaction**: Click "Edit" button to modify transaction details
- **Delete Transaction**: Click "Delete" button with confirmation
- **Responsive Design**: Table on desktop, cards on mobile

## Edit Transaction Flow

1. User clicks "Edit" button on a transaction row
2. Edit modal/form appears with pre-filled transaction data
3. User modifies any field (date, amount, currency, type, description, tag)
4. User clicks "Save Changes"
5. Transaction is updated in database
6. Table refreshes to show updated transaction
7. Success message appears

<a id="edit-transaction-modal"></a>
## Edit Transaction Modal

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              Edit Transaction                      │ │
│  │                                                    │ │
│  │  ────────────────────────────────────────────────  │ │
│  │                                                    │ │
│  │  Transaction Type                                  │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [Expense] [Income]                            │ │ │
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
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Description                                       │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Grocery shopping at Walmart                  │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Tag                                               │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [Food & Dining ▼]                            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#transaction-list">Save Changes</a>                         │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#transaction-list">Cancel</a>                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

<a id="delete-transaction-modal"></a>
## Delete Transaction Modal

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │            Delete Transaction                       │ │
│  │                                                    │ │
│  │  ────────────────────────────────────────────────  │ │
│  │                                                    │ │
│  │  Are you sure you want to delete this transaction? │ │
│  │                                                    │ │
│  │  Transaction Details:                              │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Date: January 15, 2024                       │ │ │
│  │  │ Type: Expense                                │ │ │
│  │  │ Amount: $45.00 USD                           │ │ │
│  │  │ Description: Coffee Shop                     │ │ │
│  │  │ Tag: 🟢 Food & Dining                        │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  This action cannot be undone.                    │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#transaction-list">Delete</a>                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#transaction-list">Cancel</a>                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## View Transactions Flow

1. Dashboard → View Transactions Button
2. Query transactions from DB → Group by Year/Month
3. Display List with Filter Controls (All/Expense/Income)
4. User Selects Filter Type (default: All)
5. User Selects Month
6. Fetch data → Filter by selected transactionType → Display Table
7. Optional: Edit or Delete Row → Persist changes in DB
8. Refresh Display

**Key UX Features:**
- Type filter tabs with transaction counts badges
- Color-coded amounts (red for expense, green for income)
- Month totals showing income, expense, and net balance
- Search/filter by description or tag

## User Flow

1. User navigates to View Transactions page
2. User selects filters (type, tag, date range, search)
3. Transactions are filtered and displayed grouped by month
4. User can expand/collapse months
5. User clicks "Edit" on a transaction
6. Edit modal opens with pre-filled data
7. User modifies fields and saves
8. Transaction is updated and table refreshes
9. User can delete transactions with confirmation

## UI/UX Guidelines

- Color-coded amounts (red for expenses, green for incomes)
- Type badges for quick identification
- Month summary showing total income, total expense, and net balance
- Responsive design: Table on desktop, cards on mobile
- Use smooth animations for accordion expansion (150-300ms)
- Currency symbols displayed appropriately ($ £ € ¥)
- Format numbers according to currency locale
- Multi-currency labels: Show currency code next to amounts

## Implementation Notes

### Transaction View Features
- Filter tabs: All / Expense / Income (with count badges)
- Color-coded amounts: Red for expenses, Green for incomes
- Type badge column for quick identification
- Month summary cards: Total Income, Total Expense, Net Balance
- Search and filter by description, tag, date range
- Edit functionality added

### Data Handling
- Transaction queries filtered by profile name at the database level
- Tags embedded in transactions as text array for efficient querying
- Profile switching is instant (no API calls, just IndexedDB update)
- Load all profiles, tags, and currencies from IndexedDB (instant, no network calls)

### Performance
- Global progress bar uses request counting to handle concurrent calls efficiently
- Optimistic UI updates for better perceived performance
- Lazy loading for transaction lists with pagination

## Error Handling

- **Validation errors**: Shows inline errors for invalid data
- **Delete confirmation**: Requires confirmation before deleting
- **Edit errors**: Shows error message if update fails
