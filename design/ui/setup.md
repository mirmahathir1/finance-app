[← Back to README](README.md)

# Setup

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Setup                                    │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Step Indicator                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ● ─── ○ ─── ○ ─── ○                              │ │
│  │ Step 1 of 4                                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Step 1: Welcome & Introduction                   │ │
│  │                                                    │ │
│  │  Welcome to Finance App!                           │ │
│  │                                                    │ │
│  │  Let's get you started with a few quick steps:     │ │
│  │                                                    │ │
│  │  • Create your first profile                      │ │
│  │  • Set up your preferred currency                 │ │
│  │  • Initialize your account                        │ │
│  │                                                    │ │
│  │  [Continue]                                        │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Step 2: Create Profile                            │ │
│  │                                                    │ │
│  │  Profiles help you organize your finances.         │ │
│  │  You can create multiple profiles like:            │ │
│  │  • Personal                                        │ │
│  │  • Business                                        │ │
│  │  • Family                                          │ │
│  │                                                    │ │
│  │  Profile Name                                      │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Personal                                      │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ℹ️  All transactions will be associated with      │ │
│  │     this profile. You can create more later.      │ │
│  │                                                    │ │
│  │  [Create Profile]                                  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Step 3: Choose First Currency                     │ │
│  │  (Only shown if no currencies exist)               │ │
│  │                                                    │ │
│  │  Select your primary currency:                     │ │
│  │                                                    │ │
│  │  Currency                                          │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [USD ▼]                                       │ │ │
│  │  │   • USD - US Dollar ($)                      │ │ │
│  │  │   • EUR - Euro (€)                            │ │ │
│  │  │   • GBP - British Pound (£)                   │ │ │
│  │  │   • JPY - Japanese Yen (¥)                    │ │ │
│  │  │   • AUD - Australian Dollar (A$)              │ │ │
│  │  │   • CAD - Canadian Dollar (C$)                │ │ │
│  │  │   • CHF - Swiss Franc                         │ │ │
│  │  │   • CNY - Chinese Yuan (¥)                    │ │ │
│  │  │   • INR - Indian Rupee (₹)                    │ │ │
│  │  │   • SGD - Singapore Dollar (S$)               │ │ │
│  │  │   ────────────────────────────                │ │ │
│  │  │   + Enter Custom Currency Code                │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Or enter custom currency code:                   │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [3-letter code, e.g., GBP]                   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Preview: $ (USD)                                  │ │
│  │                                                    │ │
│  │  ℹ️  This will be your default currency and       │ │
│  │     will be pre-selected when creating            │ │
│  │     transactions. You can add more later.          │ │
│  │                                                    │ │
│  │  [Continue]                                        │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Step 4: Initialization                           │ │
│  │                                                    │ │
│  │  Setting up your account...                       │ │
│  │                                                    │ │
│  │  ✓ Creating profile in database                   │ │
│  │  ✓ Saving currency to local storage               │ │
│  │  ✓ Initializing default tags                      │ │
│  │                                                    │ │
│  │  [Progress indicator]                              │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Complete!                                         │ │
│  │                                                    │ │
│  │  Your account is ready.                           │ │
│  │                                                    │ │
│  │  <a href="./dashboard.md">Go to Dashboard</a>                 │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Component Structure

The Setup page consists of:

```
Setup
├── Header
├── SetupSteps
│   ├── WelcomeStep
│   ├── ProfileCreationStep
│   │   ├── ProfileNameInput
│   │   ├── CreateProfileButton
│   │   └── InfoText (explains profiles and that data will be organized by profile)
│   ├── InitialCurrencySelectionStep
│   │   ├── CurrencyDropdown (popular currencies: USD, EUR, GBP, JPY, etc.)
│   │   ├── CustomCurrencyInput (for other currencies)
│   │   └── InfoText (explains this is the first currency and will be default)
│   └── InitializationStep (create profile record; save currency to IndexedDB; initialize default tags)
└── CompleteButton
```

## Profile Creation Features

- User enters a name for their first profile (e.g., "Personal", "Business")
- Profile is saved to IndexedDB (client-side storage)
- Profile is set as the active profile in IndexedDB settings
- All subsequent transactions and tags will include this profile name for filtering

## Initial Currency Selection Features

- This step only appears if no currencies exist in IndexedDB
- Dropdown with common currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SGD)
- Option to enter custom currency code (3-letter format)
- Clear explanation: "This will be your first currency and will be pre-selected when creating transactions"
- Currency is saved to IndexedDB (not PostgreSQL)
- Preview of currency symbol
- Validation of currency code format
- Cannot be skipped (required step)

## First-Time User Flow

1. Start → Sign In Required
2. Create Account (Email Verification) or Sign In or Guest Mode
3. If Create Account:
   - Enter Email → Submit
   - Show "Check your email"
   - Click Verification Link → Verified
   - Set Password
   - Setup Page
4. If Sign In:
   - Enter Email + Password → Dashboard or Setup (if first time)
5. Setup Page:
   - Step 1: Welcome & Introduction
   - Step 2: Create Profile (Enter Profile Name)
   - Step 3: Choose First Currency (from dropdown or custom input, only if no currencies in IndexedDB)
   - Step 4: Initialize Records (profile in DB, currency in IndexedDB, default tags in DB)
6. Dashboard

**Profile & Initial Currency Selection Details:**
- User is presented with a "Create Profile" step
- User creates first profile with a name
- Profile is saved to IndexedDB (client-side storage)
- If no currencies exist in IndexedDB, user selects their first currency (default: USD)
- System saves currency to IndexedDB (client-side storage)
- System initializes default tags in IndexedDB for this profile (common expense/income tags)
- Selected currency becomes the default for future transactions
- Can be changed later in app settings
- User can create multiple profiles (all stored in IndexedDB)
- Each profile has its own tags (stored in IndexedDB)
- Currencies are shared across all profiles (stored in IndexedDB)

## User Flow

1. User arrives at Setup page (first-time user)
2. User sees welcome message and step indicator
3. User creates first profile with a name
4. If no currencies exist, user selects first currency
5. System initializes account:
   - Creates profile record
   - Saves currency to IndexedDB
   - Initializes default tags in IndexedDB
6. User clicks "Complete" or "Go to Dashboard"
7. Redirects to Dashboard

## Error Handling

- **Invalid profile name**: Shows validation error for empty or invalid names
- **Duplicate profile name**: Prevents creating profiles with duplicate names
- **Invalid currency code**: Shows validation error for invalid format
- **Initialization errors**: Shows error message with guidance

## UI/UX Guidelines

- Display active profile name prominently in the dashboard
- Make profile switching intuitive and easily accessible
- Provide clear explanations about profile separation during setup
- Show confirmation dialogs when deleting profiles to prevent accidental data loss
- Use smooth animations for step transitions (200-400ms)
- Step indicator shows progress clearly
- Clear instructions at each step
