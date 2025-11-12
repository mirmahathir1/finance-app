[← Back to README](README.md)

# Statistics

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <a href="./dashboard.md">← Back</a>  Statistics                │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Filter Controls                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Year                                              │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [2024 ▼]                                      │ │ │
│  │ │   • 2024                                      │ │ │
│  │ │   • 2023                                      │ │ │
│  │ │   • 2022                                      │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ Month                                             │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [January ▼]                                    │ │ │
│  │ │   • January                                    │ │ │
│  │ │   • February                                   │ │ │
│  │ │   • March                                      │ │ │
│  │ │   ...                                          │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ Currency                                          │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [USD ▼]                                       │ │ │
│  │ │   • USD (used in transactions)                │ │ │
│  │ │   • EUR (used in transactions)                │ │ │
│  │ │   • GBP (used in transactions)                │ │ │
│  │ │   (only currencies used in selected period)   │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ℹ️  Showing statistics for USD only              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Summary Cards                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │ │
│  │ │ Total Income │ │ Total Expense│ │ Net Balance│ │ │
│  │ │              │ │              │ │            │ │ │
│  │ │ $2,500.00    │ │ $1,800.00    │ │ $700.00    │ │ │
│  │ │ (green)      │ │ (red)        │ │ (blue)     │ │ │
│  │ │              │ │              │ │            │ │ │
│  │ │ USD          │ │ USD          │ │ USD        │ │ │
│  │ └──────────────┘ └──────────────┘ └────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Charts                                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Expense Breakdown by Tag                          │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │                                               │ │ │
│  │  │         [Pie Chart]                           │ │ │
│  │  │                                               │ │ │
│  │  │  Food & Dining: 35% ($630.00)                │ │ │
│  │  │  Transportation: 25% ($450.00)              │ │ │
│  │  │  Shopping: 20% ($360.00)                      │ │ │
│  │  │  Bills & Utilities: 15% ($270.00)              │ │ │
│  │  │  Other: 5% ($90.00)                           │ │ │
│  │  │                                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Income vs Expense                                 │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │                                               │ │ │
│  │  │  $3,000 ┤                                     │ │ │
│  │  │  $2,500 ┤     ████                           │ │ │
│  │  │  $2,000 ┤     ████                           │ │ │
│  │  │  $1,500 ┤     ████                           │ │ │
│  │  │  $1,000 ┤     ████                           │ │ │
│  │  │    $500 ┤     ████                           │ │ │
│  │  │      $0 ┼─────┼─────┼─────┼─────┼─────┼─────┼ │ │
│  │  │          Income  Expense                      │ │ │
│  │  │                                               │ │ │
│  │  │  Income:  $2,500.00 (green bar)              │ │ │
│  │  │  Expense: $1,800.00 (red bar)                │ │ │
│  │  │                                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Empty State (when no data)                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │        📊                                          │ │
│  │                                                    │ │
│  │  No data available for selected period            │ │
│  │                                                    │ │
│  │  Try selecting a different month or currency      │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## API Endpoints

<a id="api-endpoints"></a>

<a id="api-statistics"></a>

### Statistics
- `GET /api/statistics?profile&from&to&currency` — See [API Response Documentation](./api/statistics.md)

**Note:** In Guest Mode, API calls are intercepted client-side and return mock data generated in the browser using Faker.js. No server requests are made in Guest Mode.

**Storage:** Backed by PostgreSQL (Neon). All endpoints operate on database tables with server-side authorization checks.

## Component Structure

The Statistics page consists of:

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

**Note:** Statistics show only transactions in the selected currency, filtering by `type` for expenses and incomes.

## View Statistics Flow

1. Dashboard → Statistics Button
2. Select Year → Select Month
3. Load transactions from DB
4. Filter expenses (type === 'expense')
5. Filter incomes (type === 'income')
6. Determine currencies used in transactions
7. Populate Currency Filter dropdown
8. User selects currency to view (default: user's default currency)
9. Filter transactions by selected currency
10. Aggregate data by tags for filtered transactions
11. Render Pie Chart & Summary showing only selected currency
12. Display Results

## Features

- **Year and Month Selection**: Dropdown selectors for filtering by time period
- **Currency Filter**: Shows only currencies used in transactions for selected period
- **Expense Breakdown**: Pie chart showing expense breakdown by tags (only selected currency)
- **Income vs Expense**: Bar chart comparing income and expense totals (only selected currency)
- **Summary Cards**: Total income, total expense, and net balance in selected currency
- **Empty State**: Clear message when no data available for selected period/currency
- **Currency-Specific**: All statistics filtered by selected currency (no conversion)

## User Flow

1. User navigates to Statistics page
2. User selects year and month
3. System loads transactions for selected period
4. System determines available currencies
5. Currency dropdown populates with currencies used in transactions
6. User selects currency (defaults to user's default currency)
7. System filters transactions by selected currency
8. Charts and summaries display for selected currency only
9. User can change currency to view different currency statistics

## UI/UX Guidelines

- Clearly indicate which currency is selected (e.g., "Showing statistics for USD only")
- Use appropriate currency symbols ($ £ € ¥) when displaying amounts
- Format numbers according to currency locale
- Color-coded charts: Red for expenses, green for incomes
- Responsive charts that adapt to mobile and desktop
- Smooth animations for chart rendering (200-400ms)
- Empty state provides helpful guidance to try different filters
