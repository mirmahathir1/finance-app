# UI Development Plan - Finance App

This document outlines a phased approach to building the entire UI without database access, using mock data. Each phase results in a fully working UI that can be tested and demonstrated.

## Overview

- **Technology Stack**: Next.js 14+ (App Router), TypeScript, Material-UI (MUI) v5, Recharts
- **State Management**: React Context API
- **Mock Data**: Client-side generation using Faker.js
- **Storage**: IndexedDB for profiles, tags, currencies, and guest mode state
- **No Backend**: All API calls intercepted and handled with mock data

---

## Phase 1: Project Setup & Foundation

**Goal**: Set up the project structure, dependencies, and core infrastructure.

### Steps

1. **Initialize Next.js Project**
   - Create Next.js 14+ project with TypeScript
   - Configure App Router structure
   - Set up folder structure (`app/`, `components/`, `contexts/`, `utils/`, `services/`, `types/`)

2. **Install Dependencies**
   - Material-UI (MUI) v5 and icons
   - Recharts for data visualization
   - Faker.js (`@faker-js/faker`) for mock data generation
   - Date manipulation library (date-fns or dayjs)

3. **Configure MUI Theme**
   - Set up MUI theme provider with custom theme
   - Define color palette (Primary: #1976d2, Secondary: #dc004e, Success: #4caf50, Error: #f44336)
   - Configure responsive breakpoints
   - Set up CssBaseline

4. **Set Up TypeScript Types**
   - Create `types/index.ts` with all TypeScript interfaces:
     - `User`, `Transaction`, `TransactionType`
     - `Profile`, `Tag`, `Currency`
     - API response types

5. **Create IndexedDB Utilities**
   - Set up IndexedDB database initialization
   - Create object stores: `profiles`, `tags`, `currencies`, `settings`, `guestMode`
   - Implement CRUD utilities for IndexedDB operations
   - Create helper functions for guest mode state management

6. **Create Mock Data Service**
   - Set up `services/guestDataService.ts` with `GuestDataService` class
   - Implement methods for generating mock transactions, statistics, etc.
   - Use Faker.js for realistic data generation
   - Implement filtering and querying logic

7. **Set Up API Interception Layer**
   - Create `utils/api.ts` with API call wrapper
   - Implement guest mode detection
   - Route API calls to `GuestDataService` when in guest mode
   - Simulate network delays (50-150ms)

8. **Create Context Providers Structure**
   - Set up context files (empty implementations for now):
     - `AuthContext.tsx`
     - `LoadingContext.tsx`
     - `ProfileContext.tsx`
     - `TagContext.tsx`
     - `CurrencyContext.tsx`
     - `AppContext.tsx`

**Deliverable**: Project structure ready, dependencies installed, IndexedDB utilities working, mock data service functional.

---

## Phase 2: Core Components & Context Providers

**Goal**: Build reusable components and context providers that will be used throughout the app.

### Steps

1. **Implement LoadingContext**
   - Create `LoadingContext` with request counter
   - Implement `startLoading()` and `stopLoading()` functions
   - Create `GlobalProgressBar` component (fixed at top, LinearProgress)
   - Wrap app with `LoadingProvider`

2. **Implement AuthContext**
   - Create `AuthContext` with guest mode state management
   - Implement `enterGuestMode()` and `exitGuestMode()` functions
   - Add guest mode state persistence in IndexedDB
   - Create mock user state for guest mode

3. **Implement ProfileContext**
   - Create `ProfileContext` with profiles list and active profile
   - Implement CRUD operations (add, rename, delete, switch)
   - Load/save profiles from/to IndexedDB
   - Implement profile auto-population from mock transactions

4. **Implement TagContext**
   - Create `TagContext` with tags for active profile
   - Implement CRUD operations (add, edit, delete)
   - Filter tags by transaction type (expense/income)
   - Load/save tags from/to IndexedDB

5. **Implement CurrencyContext**
   - Create `CurrencyContext` with currencies list and default currency
   - Implement CRUD operations (add, edit, delete, set default)
   - Load/save currencies from/to IndexedDB

6. **Create Shared Components**
   - `Header` component (AppBar with logo, user info, logout)
   - `GlobalProgressBar` component (already created in step 1)
   - `GuestModeIndicator` component (floating icon on right side)
   - `ProfileSelector` component (dropdown for profile switching)
   - `ConfirmDialog` component (reusable confirmation modal)
   - `Snackbar` component (toast notifications)
   - `DatePicker` component (date input with MUI)
   - `AmountInput` component (formatted number input)
   - `CurrencySelector` component (dropdown with "Add New Currency" option)
   - `TagChip` component (colored tag display)
   - `EmptyState` component (no data placeholder)

7. **Create Layout Components**
   - Root layout with all context providers
   - Page layout wrapper with Header and GlobalProgressBar
   - GuestModeIndicator in root layout

**Deliverable**: All context providers working, shared components created and reusable, guest mode indicator functional.

---

## Phase 3: Authentication Pages

**Goal**: Build all authentication-related pages with mock functionality.

### Steps

1. **Sign In Page** (`/auth/signin`)
   - Create sign in form (email, password, remember me)
   - Add "Continue as Guest" button (prominent)
   - Link to sign up page
   - Link to forgot password page
   - Implement form validation
   - Mock authentication (always succeeds in guest mode)
   - Redirect to dashboard on success

2. **Sign Up Page** (`/auth/signup`)
   - Create sign up form (email)
   - Implement form validation
   - Mock email verification flow
   - Show "Check your email" message
   - Link to sign in page

3. **Verify Page** (`/auth/verify`)
   - Create verification page
   - Mock verification success
   - Redirect to set password page

4. **Set Password Page** (`/auth/set-password`)
   - Create password setup form
   - Implement password validation
   - Mock password setup
   - Redirect to setup page after success

5. **Forgot Password Page** (`/auth/forgot-password`)
   - Create forgot password form (email)
   - Implement form validation
   - Mock email sending
   - Show "Check your email" message

6. **Reset Password Page** (`/auth/reset-password`)
   - Create reset password form
   - Implement password validation
   - Mock password reset
   - Redirect to sign in page

7. **Mock Email Page** (`/auth/mock-email`)
   - Create mock email display page (for demo purposes)
   - Show verification/reset links
   - Allow clicking links to simulate email clicks

**Deliverable**: All authentication pages functional with mock data, guest mode entry working, navigation between auth pages working.

---

## Phase 4: Setup & Dashboard

**Goal**: Build the initial setup flow and main dashboard.

### Steps

1. **Setup Page** (`/setup`)
   - Create multi-step wizard component
   - Step 1: Welcome & Introduction
   - Step 2: Create Profile (name input, save to IndexedDB)
   - Step 3: Choose First Currency (dropdown with popular currencies, save to IndexedDB)
   - Step 4: Initialize default tags (save to IndexedDB)
   - Step indicator showing progress
   - Form validation at each step
   - Redirect to dashboard on completion

2. **Dashboard Page** (`/`)
   - Create dashboard layout
   - Add ProfileSelector component (dropdown with active profile)
   - Add Quick Summary section (optional: current month stats)
   - Create action buttons grid:
     - Create Transaction
     - View Transactions
     - Edit Tags
     - Manage Currencies
     - Statistics
     - Manage Profiles
     - Backup & Restore
   - Load mock statistics for quick summary
   - Display active profile name prominently
   - Add GuestModeIndicator (if in guest mode)

3. **App Startup Logic**
   - Check if user is in guest mode (from IndexedDB)
   - Check if profiles exist in IndexedDB
   - If no profiles: auto-populate from mock transactions
   - If no active profile: set first profile as active
   - Redirect logic: guest mode → dashboard, authenticated → dashboard or setup

**Deliverable**: Setup wizard functional, dashboard displaying with all action buttons, profile switching working, guest mode indicator visible.

---

## Phase 5: Transaction Management

**Goal**: Build transaction creation, viewing, editing, and deletion with mock data.

### Steps

1. **Create Transaction Page** (`/transactions/create`)
   - Create transaction form:
     - Transaction type toggle (Expense/Income)
     - Date picker
     - Amount input
     - Currency selector (from IndexedDB with "Add New Currency" option)
     - Description input
     - Tag selector (filtered by transaction type)
   - Implement inline currency addition dialog
   - Add "Recent Transactions" section (last 5 entries)
   - Form validation
   - Mock transaction creation (save to GuestDataService)
   - Success message and redirect/navigation

2. **View Transactions Page** (`/transactions`)
   - Create filter controls:
     - Type filter tabs (All/Expense/Income with counts)
     - Tag filter dropdown
     - Date range filter (optional)
     - Search box
   - Create year/month accordion list
   - Display transactions grouped by month
   - Show month summary (income, expense, balance)
   - Color-coded amounts (red for expense, green for income)
   - Edit and Delete buttons for each transaction
   - Empty state when no transactions
   - Load transactions from GuestDataService

3. **Edit Transaction Modal**
   - Create edit modal component
   - Pre-fill form with transaction data
   - Same form fields as create transaction
   - Mock transaction update (update in GuestDataService)
   - Success message and table refresh

4. **Delete Transaction Modal**
   - Create delete confirmation modal
   - Show transaction details
   - Mock transaction deletion (remove from GuestDataService)
   - Success message and table refresh

**Deliverable**: Full transaction CRUD working with mock data, filtering and search functional, responsive design.

---

## Phase 6: Profile Management

**Goal**: Build profile management page with create, rename, delete, and switch functionality.

### Steps

1. **Manage Profiles Page** (`/profiles`)
   - Create profiles list display
   - Show active profile prominently
   - Display all profiles from IndexedDB
   - Add "Import from Database" button (scans mock transactions)
   - Create profile form (name input)
   - Profile item actions:
     - Set as Active button (if not active)
     - Active badge (if active)
     - Rename button
     - Delete button (disabled if active)

2. **Rename Profile Modal**
   - Create rename modal component
   - Show current profile name
   - Input for new name
   - Preview affected transaction count (from mock data)
   - Confirmation dialog
   - Mock profile rename (update in IndexedDB and mock transactions)
   - Success message

3. **Delete Profile Modal**
   - Create delete modal component
   - Check if profile is used in transactions (from mock data)
   - Show error if profile is used
   - Confirmation dialog if not used
   - Mock profile deletion (remove from IndexedDB)
   - Success message

4. **Profile Auto-Population**
   - Implement startup auto-population logic
   - Scan mock transactions for unique profile names
   - Add profiles to IndexedDB if empty
   - Set first profile as active if no active profile

**Deliverable**: Profile management fully functional, rename/delete with validation, profile switching instant.

---

## Phase 7: Tag Management

**Goal**: Build tag management page with create, edit, delete, and import functionality.

### Steps

1. **Edit Tags Page** (`/tags`)
   - Create tags list display
   - Separate sections for Expense Tags and Income Tags
   - Display tags with color chips
   - Add "Import from Database" button (scans mock transactions)
   - Create tag form:
     - Type selector (Expense/Income)
     - Name input
     - Color picker
   - Tag item actions:
     - Edit button
     - Delete button

2. **Edit Tag Modal**
   - Create edit modal component
   - Pre-fill form with tag data
   - Allow editing name, type, and color
   - Preview affected transaction count (from mock data)
   - Confirmation dialog if name changed
   - Mock tag rename (update in IndexedDB and mock transactions)
   - Success message

3. **Delete Tag Modal**
   - Create delete modal component
   - Check if tag is used in transactions (from mock data)
   - Show error if tag is used
   - Confirmation dialog if not used
   - Mock tag deletion (remove from IndexedDB)
   - Success message

4. **Import Tags from Database**
   - Implement import functionality
   - Scan mock transactions for unique tags
   - Extract tags with their types
   - Add new tags to IndexedDB (skip existing)
   - Show success message with counts

**Deliverable**: Tag management fully functional, color coding working, import from mock data working.

---

## Phase 8: Currency Management

**Goal**: Build currency management page with create, edit, delete, and import functionality.

### Steps

1. **Manage Currencies Page** (`/currencies`)
   - Create currencies list display
   - Show default currency prominently
   - Display all currencies from IndexedDB
   - Add "Import from Database" button (scans mock transactions)
   - Create currency form:
     - Currency code input (3 letters, uppercase)
     - Validation
   - Currency item actions:
     - Set as Default button (if not default)
     - Default badge (if default)
     - Edit button
     - Delete button

2. **Edit Currency Modal**
   - Create edit modal component
   - Allow editing currency code
   - Validation (3 uppercase letters)
   - Mock currency update (update in IndexedDB)
   - Success message

3. **Delete Currency Modal**
   - Create delete modal component
   - Check if currency is used in transactions (from mock data)
   - Show error if currency is used
   - Confirmation dialog if not used
   - Mock currency deletion (remove from IndexedDB)
   - Success message

4. **Import Currencies from Database**
   - Implement import functionality
   - Scan mock transactions for unique currencies
   - Add new currencies to IndexedDB (skip existing)
   - Show success message with counts

5. **Inline Currency Addition**
   - Enhance CurrencySelector component
   - Add "Add New Currency" option in dropdown
   - Show inline dialog when selected
   - Validate and save to IndexedDB
   - Auto-select newly added currency

**Deliverable**: Currency management fully functional, inline addition working, default currency setting working.

---

## Phase 9: Statistics Page

**Goal**: Build statistics page with charts and summaries using mock data.

### Steps

1. **Statistics Page** (`/statistics`)
   - Create filter controls:
     - Year selector dropdown
     - Month selector dropdown
     - Currency selector (only currencies used in selected period)
   - Create summary cards:
     - Total Income (green)
     - Total Expense (red)
     - Net Balance (blue)
   - Create Expense Breakdown Pie Chart (by tags, filtered by currency)
   - Create Income vs Expense Bar Chart (filtered by currency)
   - Load statistics from GuestDataService
   - Filter by selected currency (no conversion)
   - Empty state when no data

2. **Chart Components**
   - Implement pie chart using Recharts
   - Implement bar chart using Recharts
   - Color coding (red for expenses, green for incomes)
   - Responsive design
   - Smooth animations

3. **Statistics Calculation**
   - Implement aggregation logic in GuestDataService
   - Filter by year, month, currency, profile
   - Calculate totals by tag
   - Calculate income vs expense totals

**Deliverable**: Statistics page fully functional with charts, filtering working, responsive design.

---

## Phase 10: Backup & Restore

**Goal**: Build backup and restore functionality with CSV export/import.

### Steps

1. **Backup & Restore Page** (`/backup-restore`)
   - Create page layout
   - Add "Download Backup" button (primary)
   - Add "Restore from CSV" button (secondary, danger style)
   - Display active profile name
   - Info text about backup contents

2. **Download Backup**
   - Create backup generation function
   - Export mock transactions to CSV format
   - Exclude `id` and `user_id` columns
   - Trigger browser download
   - Show global progress bar during export
   - Success message

3. **Restore from CSV**
   - Create file picker (CSV only)
   - Create double confirmation dialog:
     - First dialog: warning about data replacement
     - Second dialog: type-to-confirm app/profile name
   - Parse CSV file
   - Validate CSV format
   - Replace mock transactions in GuestDataService
   - Show global progress bar during restore
   - Success message and data refresh

**Deliverable**: Backup and restore fully functional with CSV export/import, confirmation dialogs working.

---

## Phase 11: Polish & Enhancements

**Goal**: Add final polish, animations, error handling, and edge cases.

### Steps

1. **Error Handling**
   - Add error boundaries
   - Implement error states for all pages
   - Add error messages for failed operations
   - Handle network errors gracefully

2. **Loading States**
   - Add loading spinners to all buttons during API calls
   - Disable buttons during operations
   - Add skeleton loaders for data-heavy pages
   - Ensure global progress bar works everywhere

3. **Animations & Transitions**
   - Add smooth page transitions (200-400ms)
   - Add component transitions (150-300ms)
   - Add micro-interactions (100-200ms)
   - Respect `prefers-reduced-motion`
   - Use MUI transition components

4. **Form Validation**
   - Enhance all form validations
   - Add real-time validation feedback
   - Show inline error messages
   - Prevent invalid submissions

5. **Responsive Design**
   - Test and fix mobile layouts
   - Ensure all pages work on mobile
   - Optimize table views for mobile (cards)
   - Test on different screen sizes

6. **Accessibility**
   - Add ARIA labels where needed
   - Ensure keyboard navigation works
   - Test with screen readers
   - Ensure color contrast meets WCAG standards

7. **Edge Cases**
   - Handle empty states everywhere
   - Handle no profiles scenario
   - Handle no currencies scenario
   - Handle no tags scenario
   - Handle no transactions scenario
   - Handle guest mode edge cases

8. **Performance Optimization**
   - Optimize re-renders with React.memo
   - Lazy load heavy components
   - Optimize chart rendering
   - Minimize IndexedDB queries

**Deliverable**: Fully polished UI with smooth animations, comprehensive error handling, responsive design, and all edge cases handled.

---

## Phase 12: Testing & Documentation

**Goal**: Test all functionality and create documentation.

### Steps

1. **Manual Testing**
   - Test all user flows
   - Test guest mode functionality
   - Test profile switching
   - Test transaction CRUD
   - Test tag management
   - Test currency management
   - Test statistics filtering
   - Test backup and restore
   - Test responsive design
   - Test error scenarios

2. **Fix Bugs**
   - Fix any discovered bugs
   - Improve error messages
   - Enhance user feedback

3. **Create Documentation**
   - Document component structure
   - Document context providers
   - Document mock data service
   - Document IndexedDB schema
   - Create user guide (optional)

4. **Code Cleanup**
   - Remove unused code
   - Add comments where needed
   - Ensure consistent code style
   - Optimize imports

**Deliverable**: Fully tested application with documentation, ready for demonstration.

---

## Mock Data Strategy

### GuestDataService Implementation

The `GuestDataService` class should:

1. **Initialize with Seed Data**
   - Generate 20-50 initial transactions
   - Use consistent seed for deterministic data
   - Include multiple profiles, currencies, and tags

2. **Transaction Operations**
   - `getTransactions(params)` - Filter and return transactions
   - `createTransaction(data)` - Add new transaction
   - `updateTransaction(id, data)` - Update existing transaction
   - `deleteTransaction(id)` - Remove transaction

3. **Statistics Operations**
   - `getStatistics(params)` - Calculate aggregated statistics
   - Filter by profile, currency, date range
   - Return totals, breakdowns, and chart data

4. **Data Persistence**
   - Store transactions in memory (Map or array)
   - Persist to localStorage (optional, for demo purposes)
   - Reset on guest mode exit

### IndexedDB Mock Data

For IndexedDB (profiles, tags, currencies):

1. **Initial Setup**
   - Create default profile ("Personal")
   - Create default currency ("USD")
   - Create default tags (Food, Transport, Shopping, Salary, etc.)

2. **Guest Mode Setup**
   - Populate with fake profiles, tags, and currencies
   - Use Faker.js for realistic names
   - Set active profile and default currency

---

## Success Criteria

After completing all phases, the application should:

✅ All pages functional with mock data  
✅ Guest mode working end-to-end  
✅ Profile switching instant and working  
✅ Transaction CRUD fully functional  
✅ Tag management working with colors  
✅ Currency management working  
✅ Statistics page with charts functional  
✅ Backup and restore working  
✅ Responsive design on all devices  
✅ Smooth animations and transitions  
✅ Error handling comprehensive  
✅ Loading states everywhere  
✅ No database access required  
✅ All UI features working independently  

---

## Notes

- Each phase should be completed and tested before moving to the next
- Mock data should be realistic and cover various scenarios
- Guest mode should work seamlessly without any backend
- IndexedDB operations should be instant (no delays)
- API calls should simulate network delays (50-150ms)
- All components should follow MUI design guidelines
- Code should be well-organized and maintainable

