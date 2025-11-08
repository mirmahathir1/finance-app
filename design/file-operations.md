[← Back to README](README.md)

# Data Persistence (PostgreSQL on Neon)

## Overview
All application data is stored in PostgreSQL (managed on Neon). Replace prior file/Google Drive concepts with normalized tables and transactional CRUD operations. No profile photo storage.

## Core Tables (App Domain)

- `transactions`
  - `id` UUID primary key
  - `user_id` UUID references `users(id)` on delete cascade
  - `profile` text not null  // profile name stored as text
  - `occurred_at` date not null
  - `amount_minor` bigint not null  // store minor units to avoid float
  - `currency` text not null
  - `type` text check (type in ('expense','income')) not null
  - `tags` text[] not null default '{}'  // tag names stored as text array
  - `note` text null
  - `created_at` timestamptz default now()
  - `updated_at` timestamptz default now()

**Note:** Profiles, Tags, and Currencies are stored in IndexedDB on the frontend and are NOT included in PostgreSQL or backups.

## Example Operations (Prisma)

### Insert Transaction
```typescript
import { prisma } from '../server/prisma';

async function addTransaction(userId: string, profile: string, input: {
  occurredAt: string; // YYYY-MM-DD
  amountMinor: number;
  currency: string;
  type: 'expense' | 'income';
  tags: string[]; // Tag names
  note?: string;
}) {
  return prisma.transaction.create({
    data: {
      userId,
      profile,
      occurredAt: new Date(input.occurredAt),
      amountMinor: BigInt(input.amountMinor),
      currency: input.currency,
      type: input.type,
      tags: input.tags,
      note: input.note ?? null,
    },
  });
}
```

### Query Transactions (Paged)
```typescript
import { prisma } from '../server/prisma';

async function listTransactions(userId: string, profile: string, limit = 50, offset = 0) {
  return prisma.transaction.findMany({
    where: { userId, profile },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    skip: offset,
  });
}
```

**Note:** Tag management is now handled entirely in IndexedDB on the client side. No backend operations needed.

## Backups and Restore
- Per-user backups are exported from PostgreSQL to a single CSV file containing only the logged-in user's transactions.
- Backups include only transactions for the logged-in user.
- The CSV file does NOT contain `id` or `user_id` columns.
- **Profiles, Tags, and Currencies are NOT included in backups** as they are stored in IndexedDB on the client side.
- Restores are performed by the user uploading a previously downloaded CSV file; the server validates and restores the user's transaction data.
- On restore, all existing transaction data for the logged-in user is deleted before restoring the backup data.
- This mechanism is provider-agnostic and portable; it does not rely on cloud vendor point-in-time restore.
- Users can only backup and restore their own data

### Backup Contents

The backup is a single CSV file named `backup-YYYYMMDDTHHmmssZ.csv` containing only transaction data for the logged-in user.

**CSV Columns (in order):**
- `profile` - Profile name (text)
- `occurred_at` - Transaction date (YYYY-MM-DD)
- `amount_minor` - Amount in minor units (integer)
- `currency` - Currency code (text)
- `type` - Transaction type ('expense' or 'income')
- `tags` - Tag names as comma-separated values within the field (text array representation)
- `note` - Optional note (text, can be empty)
- `created_at` - Creation timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
- `updated_at` - Update timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)

**Note:** The CSV does NOT include `id` or `user_id` columns.

**Note:** `profiles.csv`, `tags.csv`, and `currencies.csv` are NOT included as profiles, tags, and currencies are stored in IndexedDB.

**Note:** All data in the backup belongs exclusively to the logged-in user. The backup does not include data from other users.

### CSV Format
- UTF-8 encoded with a single header row
- Comma delimiter, double-quote as quote char
- Escape quotes by doubling (`""`)
- Newlines preserved within quoted fields
- `NULL` values represented as empty fields
- Date/time values in ISO-8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`)
- UUIDs as canonical lowercase strings
- Monetary amounts use integer minor units (PostgreSQL `bigint`)

### Backup Creation Flow
- Endpoint identifies the logged-in user from the session.
- Extracts only the user's transaction data:
  - All transactions where `user_id` matches the logged-in user
  - Excludes `id` and `user_id` columns from the export
- Endpoint streams a CSV file with the filename `backup-YYYYMMDDTHHmmssZ.csv`.
- Long-running exports surface progress via the global progress bar on the client.
- **Note:** Profiles, tags, and currencies are not included as they are stored locally in IndexedDB.

### Restore Flow
- User uploads a CSV file created by this application's backup functionality.
- Server identifies the logged-in user from the session.
- Server validates:
  - File is a valid CSV
  - CSV headers match expected schema (name and order)
  - Required columns are present: `profile`, `occurred_at`, `amount_minor`, `currency`, `type`, `tags`, `note`, `created_at`, `updated_at`
  - CSV does NOT contain `id` or `user_id` columns
  - Data types and formats are valid
- Server performs a transactional restore:
  - Ensures a maintenance/lock mode for the duration of restore
  - **Deletes all existing transaction data for the logged-in user**
  - Inserts new transaction records from the CSV, automatically assigning:
    - New UUIDs for `id` (generated by database)
    - Current logged-in user's `user_id` (from session)
  - Loads backup data using prepared statements/copy where possible
  - Re-enables constraints and verifies FK integrity at the end
- On success, the app clears relevant caches and reloads data.
- **Note:** Profiles, tags, and currencies in IndexedDB are not affected by restore operations.

### Security & Safeguards
- Authenticated user access required for both backup and restore endpoints
- User can only backup and restore their own data
- Double confirmation for restore operations (destructive action)
- Strict file size/type limits and content validation
- User ID validation on restore to prevent cross-user data restoration
- Full server-side validation and transactional guarantees
- Detailed audit logging (who initiated, when, result)

## Security & Integrity
- Use transactions for multi-step writes (e.g., create transaction + tags).
- Enforce ownership checks at the service layer for every query.
- Validate and sanitize inputs; use parameterized queries or a safe ORM.

