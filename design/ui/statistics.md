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
│  │ Include other currencies [ ]                      │ │
│  │ (convert via open.er-api.com rates)               │ │
│  │ ℹ️  Showing statistics for USD; conversions add   │ │
│  │     non-USD totals when checkbox is enabled       │ │
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
│   ├── CurrencySelector (dropdown - shows only currencies used in transactions for selected period)
│   └── IncludeConversionToggle (checkbox - converts other currencies into the selected currency using open.er-api.com rates)
├── StatsDisplay (when year and month selected)
│   ├── ExpensePieChart (breakdown by tags, respects conversion toggle)
│   ├── IncomeVsExpenseBar (respects conversion toggle)
│   └── SummaryCards
│       ├── TotalIncomeCard (in selected currency)
│       ├── TotalExpenseCard (in selected currency)
│       └── NetBalanceCard (in selected currency)
└── EmptyState (when no data for selected period/currency)
```

**Note:** Statistics default to transactions in the selected currency, filtering by `type` for expenses and incomes. When the "Include other currencies" toggle is enabled, out-of-currency transactions are converted to the selected currency via https://open.er-api.com before aggregation.

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
10. (Optional) If conversions are enabled, fetch exchange rates from open.er-api.com and convert other currencies into the selected currency
11. Aggregate data by tags for filtered and converted transactions
12. Render Pie Chart & Summary
13. Display Results

## Features

- **Year and Month Selection**: Dropdown selectors for filtering by time period
- **Currency Filter**: Shows only currencies used in transactions for selected period
- **Cross-Currency Inclusion**: Optional checkbox fetches exchange rates from https://open.er-api.com and merges other currencies into the selected currency
- **Expense Breakdown**: Pie chart showing expense breakdown by tags (respects conversion toggle)
- **Income vs Expense**: Bar chart comparing income and expense totals (respects conversion toggle)
- **Summary Cards**: Total income, total expense, and net balance in selected currency
- **Empty State**: Clear message when no data available for selected period/currency
- **Currency-Specific or Converted**: Defaults to selected currency only, with optional conversions for multi-currency inclusion

## User Flow

1. User navigates to Statistics page
2. User selects year and month
3. System loads transactions for selected period
4. System determines available currencies
5. Currency dropdown populates with currencies used in transactions
6. User selects currency (defaults to user's default currency)
7. Optional: User enables "Include other currencies" toggle to convert additional currencies using open.er-api.com rates
8. System filters transactions by selected currency and merges converted values (if enabled)
9. Charts and summaries display updated totals
10. User can change currency or toggle conversions to explore different views

## UI/UX Guidelines

- Clearly indicate which currency is selected (e.g., "Showing statistics for USD only") and whether other currencies are being converted
- Use appropriate currency symbols ($ £ € ¥) when displaying amounts
- Format numbers according to currency locale
- Color-coded charts: Red for expenses, green for incomes
- Responsive charts that adapt to mobile and desktop
- Smooth animations for chart rendering (200-400ms)
- Empty state provides helpful guidance to try different filters or toggling currency inclusion
