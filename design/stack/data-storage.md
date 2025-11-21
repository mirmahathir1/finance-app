[← Back to README](README.md)

# Data Storage & Management

## Storage Overview

Application data is persisted using a hybrid storage approach:
- **PostgreSQL (Supabase)**: Source of truth for authenticated users — stores only two tables (`users` and `transactions`). User rows contain authentication data; every profile/currency/tag reference lives directly on each transaction row (no additional tables or metadata blobs).
- **IndexedDB**: Mirrors profile/tag/currency data only when Guest Mode is active (demo experience) and caches lightweight client preferences.

Prisma is the standard ORM for all PostgreSQL data access. The two-table schema plus JSON fields are documented in `design/ui/data-models.md`. Guest-mode IndexedDB schemas live in `design/currency-system.md`.

## PostgreSQL (Supabase) with Prisma

- Use Supabase for managed Postgres with autoscaling and built-in features.
- Connect via `DATABASE_URL` (SSL required). Use Supabase connection pooler (port 6543) or Prisma Accelerate for best performance.
- Use transactions for multi-step writes to maintain consistency.
- Prefer bigint minor units for currency amounts to avoid floating-point issues.

## Prisma Setup

### Install
```bash
npm i -D prisma
npm i @prisma/client
npx prisma init
```

### Configure datasource
Set `DATABASE_URL` in your `.env.local` (Supabase connection string, with `sslmode=require`).

### Define schema
See `design/data-models.md` for the SQL schema and equivalent Prisma models (`prisma/schema.prisma`).

### Migrate & generate
```bash
npx prisma migrate dev -n init
npx prisma generate
# Optional GUI
npx prisma studio
```

### Seed baseline data
```bash
npm run prisma:seed
```
Seeds demo users (with embedded profiles/currencies/tags JSON) plus sample transactions referenced throughout the UI/playbooks.

## IndexedDB (Browser Storage)

### Overview
IndexedDB is used for client-side storage of profile, tag, and currency data:
- **Offline-first**: Profiles, tags, and currencies are available even without network connection
- **Performance**: No API calls needed to load profiles, tags, or currency lists
- **Privacy**: Profile names, tags, and currency preferences stay on the user's device
- **Simplicity**: Eliminates need for backend profile and tag management APIs

### Implementation
```bash
# IndexedDB library (optional, can use native API)
npm install idb
```

### Use Cases
- Storing user's profile list
- Storing user's tag library (per profile)
- Storing user's currency list
- Active profile selection
- Default currency preference
- Profile, tag, and currency metadata

### Database Schema
```typescript
// Database initialization
import { openDB } from 'idb';

const dbPromise = openDB('finance-app', 1, {
  upgrade(db) {
    // Profiles store
    if (!db.objectStoreNames.contains('profiles')) {
      db.createObjectStore('profiles', { keyPath: 'name' });
    }
    
    // Tags store
    if (!db.objectStoreNames.contains('tags')) {
      const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
      tagStore.createIndex('profile_name', ['profile', 'name'], { unique: true });
      tagStore.createIndex('profile', 'profile');
    }
    
    // Currencies store
    if (!db.objectStoreNames.contains('currencies')) {
      const currencyStore = db.createObjectStore('currencies', { keyPath: 'code' });
      currencyStore.createIndex('isDefault', 'isDefault');
    }
    
    // Settings store
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' });
    }
  },
});
```

See `design/currency-system.md` for detailed profile, tag, and currency operations and data structures.

## Date Management

### date-fns
- Date formatting and manipulation
- Timezone support
- Lightweight alternative to moment.js

## Currency & Number Formatting

### Intl.NumberFormat (Built-in JavaScript API)
- Currency formatting for different locales
- No additional library needed
- Example: `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(123.45)`

<!-- App-specific currency system (no conversion) lives in design/currency-system.md -->

## File/Image Handling
- Not applicable. The app does not store profile pictures or arbitrary files.

## Backups

Backups are performed by exporting the logged-in user's transaction data from PostgreSQL to a single CSV file that the user downloads. The backup includes only the user's transactions (with embedded tag names). The CSV file does NOT contain `id` or `user_id` columns.

**Note:** Backups currently include only transactions. Profile, tag, and currency information is inherently part of each transaction row (and mirrored in IndexedDB for Guest Mode), so exporting/importing the ledger automatically transfers these attributes.

Restores are performed by uploading that CSV file, which the server validates and then uses to transactionally restore the user's transaction data. On restore, all existing transaction data for the logged-in user is deleted before restoring the backup data. New `id` values are generated and `user_id` is set from the session.

- Format and layout are defined in `design/file-operations.md` (manifest, CSV rules, table ordering)
- Endpoint contract is defined in `design/api-design.md` (`GET /api/backup`, `POST /api/restore`)
- This approach is cloud-provider-agnostic and portable
- Users can only backup and restore their own data

