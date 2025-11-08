[← Back to README](README.md)

# UI/UX Design Guidelines

## Theme
- Primary Color: #1976d2 (Material Blue)
- Secondary Color: #dc004e (Pink)
- Success: #4caf50 (Green)
- Error: #f44336 (Red)
- Background: #fafafa (Light Gray)

## Spacing
- Use MUI spacing system (8px base unit)
- Padding: 2-4 units (16px-32px)
- Margins: 1-3 units (8px-24px)

## Responsive Design
- Mobile-first approach
- Breakpoints:
  - xs: 0px
  - sm: 600px
  - md: 960px
  - lg: 1280px
  - xl: 1920px

## Motion and Animation
- All UI transitions and the initial rendering of UI elements must use smooth animations.
- Durations:
  - Micro-interactions (hover, press, chip changes): 100–200ms
  - Component transitions (dialogs, drawers, accordions, list add/remove): 150–300ms
  - Page/route transitions: 200–400ms
- Easing:
  - Use ease-out for enters and ease-in for exits, or a consistent ease-in-out curve across the app.
- Performance:
  - Target 60fps; animate `opacity` and `transform` properties; avoid layout-affecting properties (width/height/top/left) when possible.
- Accessibility:
  - Respect `prefers-reduced-motion`; reduce or disable non-essential animations when enabled.
- Consistency:
  - Use shared motion tokens/variants and consistent travel distances (e.g., 8–16px slide).
- Loading:
  - Prefer skeletons/shimmers and fade-in for content; avoid abrupt pop-in/out.
- Tooling:
  - Prefer framework utilities (e.g., MUI `Fade`, `Grow`, `Slide`) or CSS transitions for consistency.

## Currency Display Guidelines
- **Currency Symbols**: Use appropriate currency symbols ($ £ € ¥) when displaying amounts
- **Formatting**: Format numbers according to currency locale
  - USD: $1,234.56
  - EUR: €1.234,56
  - GBP: £1,234.56
- **Currency Selector**: Use autocomplete dropdown with search for easy currency selection
- **Currency Filter**: When viewing statistics, clearly show which currency is selected
- **Multi-Currency Labels**: In expense/income tables, show currency code next to amounts
- **No Conversion**: Make it clear that amounts are always shown in their original currency

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Dynamic imports for routes
2. **Lazy Loading**: Load components on demand
3. **Memoization**: Use React.memo for expensive components

### Loading States
- **Global infinite progress bar** for API calls
- Skeleton screens for content loading
- Local progress indicators for specific operations
- Optimistic UI updates for better perceived performance

**API Call Handling:**
- Every API call that hits the server triggers the global infinite progress bar
- Progress bar appears at the top of the page (Material UI LinearProgress with indeterminate mode)
- Automatically shows when request starts and hides when complete
- Multiple concurrent requests keep the progress bar visible until all complete
- Provides consistent user feedback across all pages and operations

## Guest Mode Guidelines

### Guest Mode UI
- **Login Page**: Prominent "Guest Mode" or "Continue as Guest" button
  - Positioned below the sign-in form or as a secondary action
  - Clear visual distinction from primary sign-in action
  - Tooltip or helper text: "Explore the app with demo data"
  
- **Guest Mode Indicator**: Floating icon on the right side of the screen
  - Fixed position: `right: 16px; top: 50%; transform: translateY(-50%)`
  - Semi-transparent or subtle styling to avoid intrusion
  - Material-UI icon (e.g., `PersonIcon`, `VisibilityIcon`, or `InfoIcon`)
  - Tooltip on hover: "Guest Mode - Using demo data"
  - Optional: Click to show dialog with option to exit Guest Mode
  - Z-index high enough to stay above other content but below modals

- **Guest Mode Behavior**:
  - All API calls are intercepted client-side and handled by GuestDataService
  - No server requests are made in Guest Mode (zero network overhead)
  - Fake data is generated deterministically for consistent experience
  - Minimal delay simulation (50-150ms) to maintain realistic UX
  - All UI features work normally with fake data
  - Clear indication that data is not persisted

### Data Generation
- Use a JavaScript library (e.g., Faker.js, @faker-js/faker) for generating realistic fake data
- Generate data that matches the structure of real data (transactions, statistics, settings)
- Use consistent seed values for deterministic generation based on query parameters
- Generate realistic amounts, dates, descriptions, and tag names
- Ensure generated data covers various scenarios (multiple profiles, currencies, transaction types)

## User Experience Best Practices

### General
- Display active profile name prominently in the dashboard
- Make profile switching intuitive and easily accessible
- Provide clear explanations about profile separation during setup
- Show confirmation dialogs when deleting profiles to prevent accidental data loss
- Guest Mode should provide a seamless experience for exploring the app without authentication

### Profile Management
- No profile photo storage; keep profile visuals simple and text-focused

### Transaction Management
- Pre-select user's default currency from IndexedDB in transaction forms
- Include "Add New Currency" option in currency dropdown for quick addition
- Color-coded amounts (red for expenses, green for incomes)
- Type badges for quick identification
- Month summary showing total income, total expense, and net balance

### Currency Management
- Currencies stored in IndexedDB (client-side) for offline access and fast loading
- Clearly indicate which currency is the default currency throughout the app
- Provide quick links to Manage Currencies when needed
- Allow inline currency addition during transaction entry
- Display clear currency filter in statistics (e.g., "Showing only USD transactions")
- Use consistent currency formatting throughout app
- Show currency symbols where appropriate ($ £ € ¥)
- Explain during first-time setup that currencies are stored locally
- Make it clear that no currency conversion occurs
- Inform users that currencies are NOT included in backups (stored locally)
- Currencies are shared across all profiles on the same browser/device

### Loading and Feedback
- Global progress bar provides consistent feedback for API operations without cluttering the UI
- Local spinners for specific component operations
- Success messages and error notifications via snackbar

## Backups UI

### Page Layout
- Header with active profile name and two primary actions:
  - \"Download Backup\" (primary)
  - \"Restore from CSV\" (secondary, danger context)
- No server-side list is displayed; backups are downloaded to the user's machine as a single CSV file.

### Actions
- Download Backup:
  - Confirmation dialog explains a backup of the user's transaction data (CSV) will be created
  - Show global progress bar during export
  - Trigger browser download of `backup-YYYYMMDDTHHmmssZ.csv`
- Restore from CSV:
  - Danger-styled action; requires double confirmation
  - Warning dialog clearly states that all current user transaction data will be deleted and replaced with backup data
  - Type-to-confirm app/profile name to proceed
  - File picker accepts `.csv` only
  - Show global progress bar during restore
  - After success, reload affected data and show success snackbar

### Edge Cases
- Handle authorization failures with clear remediation steps (e.g., re-authenticate)


