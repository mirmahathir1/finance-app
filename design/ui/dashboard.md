[← Back to README](README.md)

# Dashboard

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Logo] Finance App          [User] [<a href="./signin.md">Logout</a>]      │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Profile Selector                                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Active Profile: [Personal ▼]                      │  │
│  │   • Personal                                       │  │
│  │   • Business                                       │  │
│  │   • Family                                         │  │
│  │   + <a href="./manage-profiles.md">Create New Profile</a> │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Quick Summary (Optional)                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Current Month (January 2024)                      │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │ │ Income    │ │ Expense  │ │ Balance  │          │  │
│  │ │ $2,500.00│ │ $1,800.00│ │ $700.00  │          │  │
│  │ │ (green)  │ │ (red)    │ │ (blue)   │          │  │
│  │ └──────────┘ └──────────┘ └──────────┘          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Action Buttons                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ┌──────────────────┐ ┌──────────────────┐        │  │
│  │ │ + <a href="./create-transaction.md">Create Transaction</a>         │ │ 📋 <a href="./view-transactions.md">View Transactions</a>          │        │  │
│  │ └──────────────────┘ └──────────────────┘        │  │
│  │                                                     │  │
│  │ ┌──────────────────┐ ┌──────────────────┐        │  │
│  │ │ 🏷️  <a href="./edit-tags.md">Edit Tags</a>    │ │ 💱 <a href="./manage-currencies.md">Manage Currencies</a>        │        │  │
│  │ └──────────────────┘ └──────────────────┘        │  │
│  │                                                     │  │
│  │ ┌──────────────────┐ ┌──────────────────┐        │  │
│  │ │ 📊 <a href="./statistics.md">Statistics</a>    │ │ 👤 <a href="./manage-profiles.md">Manage Profiles</a>        │        │  │
│  │ └──────────────────┘ └──────────────────┘        │  │
│  │                                                     │  │
│  │ ┌──────────────────┐                              │  │
│  │ │ 💾 <a href="./backup-restore.md">Backup & Restore</a>        │                              │  │
│  │ └──────────────────┘                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  [Global Progress Bar] (top of page, when loading)     │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Features

- **Profile Selector**: Dropdown showing active profile with option to switch or create new
- **Quick Summary**: Optional current month statistics (income, expense, balance)
- **Action Buttons**: Quick access to all main features
- **Global Progress Bar**: Shows at top of page during API calls
- **Profile Switching**: Instant switching between profiles (no page reload)

## Global Progress Bar

The Global Progress Bar provides visual feedback for all API operations:

- **Position**: Fixed at top of page (`position: fixed; top: 0; left: 0; right: 0; z-index: 9999`)
- **Appearance**: Infinite progress indicator (LinearProgress component)
- **Visibility**: Automatically shows during API calls, hides when complete
- **Scope**: All server API calls trigger the progress bar
- **Request Counting**: Uses request counter to handle concurrent calls efficiently
- **No Clutter**: Single global indicator, not per-component spinners

## Profile Switching

- **Instant**: No API calls needed, just IndexedDB update
- **Dropdown**: Click profile selector to see all profiles
- **Active Indicator**: Current active profile is highlighted
- **Create New**: Option to create new profile from dropdown
- **Auto-Refresh**: Dashboard data refreshes after profile switch

## Component Structure

The Dashboard page consists of:

```
Dashboard
├── Header (AppBar with user info, logout)
├── ProfileSelector (dropdown showing active profile name, option to switch or create new)
├── ActionButtons
│   ├── CreateTransactionButton
│   ├── ViewTransactionsButton
│   ├── EditTagsButton
│   ├── ManageCurrenciesButton
│   ├── ViewStatisticsButton
│   └── ManageProfilesButton
└── QuickSummary (optional: current month stats for active profile)
```

**Note:** 
- All transactions are associated with the currently active profile.
- Users can switch profiles from the dashboard to view different sets of transactions.

## User Flow

1. User sees dashboard with active profile displayed
2. User can switch profile from dropdown (instant, no loading)
3. Dashboard refreshes to show transactions for new profile
4. All actions (create transaction, view transactions, etc.) use active profile
5. User can create new profile from dropdown or manage profiles page

## App Startup Profile Selection Flow

At app startup, the system automatically:

1. Checks session and IndexedDB settings
2. Loads profiles from IndexedDB
3. If profiles empty in IndexedDB:
   - Auto-populates from database:
     - Fetches all transactions for current user
     - Extracts unique profile names
     - Adds profiles to IndexedDB
     - Sets first profile as active (if no active profile exists)
4. Loads active profile from IndexedDB settings
5. If active profile exists: Load transactions/tags for that profile from PostgreSQL → Dashboard
6. If no active profile or profiles still empty: Redirects to Setup/Create Profile Flow
7. User can switch profile anytime from Dashboard
8. All profile switching happens instantly (IndexedDB lookup only)

**Note:** Profile auto-population runs silently at startup if IndexedDB profiles are empty. This ensures users who have transactions but lost their IndexedDB data (e.g., cleared browser data) can continue using the app without manual setup.

## UI/UX Guidelines

- Display active profile name prominently in the dashboard
- Make profile switching intuitive and easily accessible
- Use smooth animations for component transitions (150-300ms)
- Global progress bar shows during API calls
- Responsive design: Mobile-first approach with breakpoints at 600px, 960px, 1280px
