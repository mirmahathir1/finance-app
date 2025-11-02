# Finance Tracker App

A personal finance tracking application with multi-currency support. All data is stored as CSV files in your Google Drive.

## Overview

Track expenses and income across multiple currencies with automatic conversion for statistics. Built with Next.js, Material UI, and Google Drive API. Deployable to Google Cloud and packageable as an Android app.

## Key Features

- **Google Drive Storage** - All data in CSV files in your personal Drive
- **Multi-Currency Support** - Track transactions in different currencies with monthly exchange rates
- **Expense & Income Tracking** - Categorized records with customizable tags
- **Visual Statistics** - Pie charts and summaries with automatic currency conversion
- **Mobile PWA** - Works on all devices, installable on Android

## Technology Stack

- **Frontend**: Next.js 14+, TypeScript, Material UI (MUI)
- **Backend**: Next.js API Routes, Google Drive API
- **Auth**: Google OAuth 2.0 via NextAuth.js
- **Visualization**: Chart.js / Recharts
- **Deployment**: Docker, Google Cloud Run
- **Mobile**: Bubblewrap (PWA to Android)

## Data Storage

CSV files stored in Google Drive:
- `transactions-YYYY-MM.csv` - Monthly transactions (expenses and incomes) with transaction type and currency
- `tags.csv` - Category tags with colors
- `currencies.csv` - Exchange rates per month (currencyName, year, month, ratio)
- `settings.json` - App configuration

**Transaction File Structure:**
```csv
date,transactionType,amount,description,tag,currency
2025-11-01,expense,45.50,Grocery shopping,Food,USD
2025-11-01,income,3000.00,Monthly salary,Salary,USD
```

## Multi-Currency System

**Exchange Rate Format**: Ratio represents amount of currency per 1 USD
- Example: `GBP,2025,11,0.79` means 1 USD = 0.79 GBP

**Conversion Logic**:
- To USD: `amount / ratio`
- From USD: `amount × ratio`
- Between currencies: Convert to USD first, then to target

**Example**:
```
£50 GBP with ratio 0.79 → 50 / 0.79 = $63.29 USD
$100 USD with EUR ratio 0.92 → 100 × 0.92 = €92.00 EUR
```

## User Workflow

1. **Sign in** with Google and select Drive folder
2. **Create transaction** - Toggle expense/income, select date, amount, currency, description, tag
3. **View transactions** - Filter by type (All/Expense/Income), browse by year/month, edit/delete entries
4. **Manage tags** - Create custom categories with colors
5. **Manage currencies** - Add/edit exchange rates for specific months
6. **View statistics** - Select year/month/currency, see charts and totals (all amounts converted)

## Setup

### Prerequisites
- Node.js 18+
- Google Cloud Project with OAuth 2.0 credentials
- Google Drive API enabled

### Environment Variables
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Docker
```bash
docker build -t finance-app .
docker run -p 3000:3000 --env-file .env finance-app
```

### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/finance-app
gcloud run deploy finance-app --image gcr.io/PROJECT_ID/finance-app --platform managed
```

## Google Cloud Configuration

1. Create Google Cloud Project
2. Enable Google Drive API and People API
3. Create OAuth 2.0 Client ID
4. Add authorized origins and redirect URIs
5. Required scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/drive.file`

## Android App

Package as Android app using Bubblewrap:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://your-domain.com/manifest.json
bubblewrap build
```

Requirements: HTTPS domain, PWA manifest, service worker, Lighthouse score > 90

## Project Structure

```
finance-app/
├── pages/              # Next.js pages and API routes
├── components/         # React components
├── utils/             # Utility functions (currency conversion)
├── contexts/          # Context providers (Auth, Drive, App)
├── public/            # Static assets
├── design.md          # Detailed architecture documentation
├── stack.md           # Technology stack details
└── README.md          # This file
```

## Main Pages

- **Dashboard** - Streamlined action buttons for all features
- **Create Transaction** - Unified form with expense/income toggle, date, amount, currency, description, tag
- **View Transactions** - Unified view with type filtering (All/Expense/Income), grouped by year/month, color-coded amounts
- **Manage Tags** - Add/edit/delete categories with colors
- **Manage Currencies** - Add/edit exchange rates for specific months
- **Statistics** - Charts and summaries with currency conversion

### Unified Transaction UI Benefits
- **Simplified Navigation**: One button to create any transaction, one to view all
- **Faster Data Entry**: Quick toggle between expense/income without page navigation
- **Better Overview**: See all transactions together with filtering options
- **Consistent Experience**: Same interface for both transaction types

## Documentation

- **[design.md](./design.md)** - Complete architecture, component structure, API routes, UI/UX guidelines, implementation phases
- **[stack.md](./stack.md)** - Technology details, dependencies, configuration, testing, deployment

## Security

- All data stored in user's personal Google Drive
- No server-side data storage
- OAuth 2.0 authentication with token refresh
- HTTPS required for production
- Scoped Drive permissions (app-created files only)

---

**Built with Next.js, Material UI, and Google Drive**
