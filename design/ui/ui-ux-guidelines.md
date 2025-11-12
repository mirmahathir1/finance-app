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

**Button States During API Calls:**
- **All buttons that trigger API calls must:**
  - Display a spinner/loading indicator (e.g., Material-UI `CircularProgress`) while the API call is in progress
  - Be disabled during the API call to prevent duplicate submissions
  - Show the spinner in place of or alongside the button text/icon
  - Re-enable automatically when the API call completes (success or error)
- **Implementation Pattern:**
  - Use local loading state for each button/action
  - Set loading state to `true` when API call starts
  - Set loading state to `false` when API call completes (in `finally` block)
  - Disable button using `disabled={isLoading}` prop
  - Show spinner using Material-UI `CircularProgress` component (typically size="small")
- **Visual Guidelines:**
  - Spinner should be appropriately sized for the button (typically 16-20px for small buttons, 24px for standard buttons)
  - Spinner color should match button text color or use primary color
  - Button text may be hidden or dimmed while loading, or spinner may appear alongside text
  - Maintain button dimensions to prevent layout shift

#### Button Loading State Implementation Example
```typescript
// Example: Button with loading state
import { Button, CircularProgress } from '@mui/material';
import { useState } from 'react';

function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/endpoint', { method: 'POST', ... });
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant="contained"
      onClick={handleSubmit}
      disabled={isLoading}
      startIcon={isLoading ? <CircularProgress size={16} /> : null}
    >
      {isLoading ? 'Submitting...' : 'Submit'}
    </Button>
  );
}
```

### Global Progress Bar Implementation

#### Component Structure
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

#### Usage in API Calls
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

#### Integration Points
- All server API calls
- Authentication requests (register, login, logout)
- Data export/import operations
- Settings initialization

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

## Shared/Reusable Components

The following components are shared across multiple pages and should be implemented as reusable components:

- `Header` - App bar with navigation
- `GlobalProgressBar` - Global infinite progress bar for API calls
- `ProfileSelector` - Dropdown to select/switch active profile
- `LoadingSpinner` - Loading indicator (local component use)
- `ErrorBoundary` - Error handling wrapper
- `ConfirmDialog` - Confirmation modal
- `Snackbar` - Toast notifications
- `DatePicker` - Date input component
- `AmountInput` - Formatted number input
- `CurrencySelector` - Currency dropdown component (loads from IndexedDB with "Add New Currency" option)
- `TagChip` - Colored tag display
- `EmptyState` - No data placeholder
- `GuestModeIndicator` - Floating icon on the right side of the screen indicating Guest Mode is active

**Note:** The `GlobalProgressBar` component displays an infinite progress indicator at the top of the page during API calls. It is managed globally and automatically shows/hides based on pending requests.

### GuestModeIndicator Component Details
The `GuestModeIndicator` component:
- Displays a floating icon/button on the right side of the screen
- Only visible when Guest Mode is active
- Positioned fixed at the right edge (e.g., `position: fixed; right: 16px; top: 50%; transform: translateY(-50%)`)
- Uses Material-UI icon (e.g., `PersonIcon` or `VisibilityIcon`) with appropriate styling
- May include a tooltip on hover: "Guest Mode - Using demo data"
- Clicking the icon can optionally show a dialog with option to exit Guest Mode
- Styled to be visible but not intrusive (semi-transparent or subtle color)

### CurrencySelector Component Details
The `CurrencySelector` component:
- Loads currencies from IndexedDB
- Displays all saved currencies in a dropdown
- Includes an "Add New Currency" option at the bottom of the list
- When "Add New Currency" is selected:
  - Opens an inline input dialog
  - User enters 3-letter currency code
  - Validates the code
  - Saves to IndexedDB
  - Refreshes the dropdown to include the new currency
  - Selects the newly added currency
- Default currency is pre-selected when the form loads

