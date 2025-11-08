[← Back to README](README.md)

# Overview

This document provides an overview of the finance-app personal finance tracking application.

## Key Features

### Core Functionality
1. **Hybrid Storage Architecture**: PostgreSQL (Neon) for transaction data, IndexedDB for profiles, tags, and currencies
2. **Profile Management**: Create and manage multiple profiles (e.g., Personal, Business) stored in IndexedDB
3. **Simplified Data Model**: Only transactions table in PostgreSQL with embedded profile names and tag arrays
4. **Multi-Currency Support**: Track expenses and incomes in different currencies
5. **Expense & Income Tracking**: Categorized financial records with tags
6. **Visual Statistics**: Pie charts and summaries with single-currency filtering
7. **Tag Management**: Customizable categories with color coding, stored in IndexedDB (client-side)
8. **Currency Management**: Simple currency list management in IndexedDB (client-side)
9. **Mobile-First PWA**: Works on all devices, installable as Android app
10. **Backup & Restore**: Per-user backup to a single CSV file containing only transaction data (excludes `id` and `user_id` columns) for download; restore by uploading that CSV file (replaces all user transaction data). Profiles, tags, and currencies not included as they're stored locally.
11. **Guest Mode**: Explore the app without authentication using generated fake data. All UI features work with mock data, and a floating indicator shows Guest Mode status.

### Multi-Currency System
- **No Conversion**: Transactions are recorded and displayed in their original currency
- **User-Selected Default Currency**: User chooses their first currency during initial setup (defaults to USD)
- **Currency Filtering**: View statistics for one currency at a time via dropdown selector
- **Per-Transaction Currency**: Each expense/income is recorded in its original currency
- **Client-Side Storage**: Currencies stored in IndexedDB for offline availability
- **Inline Currency Addition**: Add new currencies during transaction entry
- **Simple Currency List**: No exchange rates, just currency codes

### Profile System
- **Multiple Profiles**: Users can create multiple profiles (e.g., Personal, Business, Family) to keep finances separate
- **Client-Side Storage**: Profiles and tags stored in IndexedDB for offline access and fast loading
- **Profile-Based Data Filtering**: Transactions in PostgreSQL include profile name for filtering
- **Profile-Specific Tags**: Each profile has its own set of tags stored in IndexedDB
- **Shared Currencies**: Currencies are stored in IndexedDB and shared across all profiles on the same browser
- **Active Profile Selection**: Users choose which profile to use when starting the app
- **Easy Profile Switching**: Switch between profiles from the dashboard without re-authentication
- **Independent Management**: Each profile can have different tags and transaction history
- **No Backend Required**: Profile and tag management happens entirely on the frontend
