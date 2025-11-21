[← Back to README](README.md)

# Data Models (PostgreSQL)

## SQL Schema (Core)

### users
```sql
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  email_verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Note:** Profiles are not stored in PostgreSQL. They are managed on the frontend using IndexedDB. See below for details.

### sessions (if using opaque tokens)
```sql
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### roles (optional)
```sql
create table if not exists roles (
  id serial primary key,
  name text unique not null
);
```

### user_roles (optional)
```sql
create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id int not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);
```

### transactions
```sql
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  profile text not null,
  occurred_at date not null,
  amount_minor bigint not null,
  currency text not null,
  type text not null check (type in ('expense','income')),
  tags text[] not null default '{}',
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Note:** 
- The `profile` field stores the profile name as text. Profiles are managed in IndexedDB on the client side.
- The `tags` field stores tag names as a text array. Tags themselves are managed in IndexedDB on the client side.

## TypeScript Interfaces

```typescript
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  userId: string;
  profile: string; // Profile name (stored as text)
  occurredAt: string; // YYYY-MM-DD
  amountMinor: number; // integer minor units
  currency: string;
  type: TransactionType;
  tags: string[]; // Tag names (stored as text array)
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Note:** 
- Profile, Tag, and Currency interfaces are defined below as the guest-mode IndexedDB mirror. In authenticated mode, these entities are captured directly on each transaction row (there is no separate backing table or metadata blob).

### IndexedDB Interfaces

```typescript
export interface Profile {
  name: string; // Primary key
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  name: string; // Primary key (combined with profile)
  profile: string; // Profile name
  type: 'expense' | 'income'; // Transaction type
  color?: string; // Optional color for UI
  createdAt: string;
  updatedAt: string;
}
```

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 String   @id @default(uuid())
  email              String   @unique
  passwordHash       String
  passwordSalt       String?
  emailVerifiedAt    DateTime?
  profiles           Json?
  currencies         Json?
  tags               Json?
  settings           Json?
  verificationTokens Json?
  auditTrail         Json?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  transactions       Transaction[]

  @@map("users")
}

model Transaction {
  id          String   @id @default(uuid())
  userId      String
  profile     String
  occurredAt  DateTime
  amountMinor BigInt
  currency    String
  type        TransactionType
  tags        String[]
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

enum TransactionType {
  expense
  income
}
```

**Note:** Only two tables live in Postgres/Prisma (`users` and `transactions`). Profiles, currencies, and tags live exclusively on the `transactions` rows (one row per ledger entry). Guest mode still mirrors simplified versions of these structures in IndexedDB for the demo experience—see [currency-system.md](currency-system.md) for those browser schemas.

## Data Persistence Overview

All authenticated data is stored in PostgreSQL (managed on Supabase) using just two tables. The `users` table owns every per-user concern (authentication credentials plus JSON fields for profiles/currencies/tags/settings/audit info), while the `transactions` table stores immutable ledger entries that reference the user and the profile name they belong to. No profile photo storage.

**Note:** Profiles, Tags, and Currencies are persisted inside the `users` table as JSON for authenticated users (via Prisma) and mirrored in IndexedDB only when Guest Mode is active.

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

**Note:** Tag management uses Prisma-backed APIs that rewrite the `tags` arrays on each affected transaction in normal mode and IndexedDB only when Guest Mode is active.

## Security & Integrity

- Use transactions for multi-step writes (e.g., create transaction + tags).
- Enforce ownership checks at the service layer for every query.
- Validate and sanitize inputs; use parameterized queries or a safe ORM.

