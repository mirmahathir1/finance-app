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
- Profile, Tag, and Currency interfaces are defined below as they're stored in IndexedDB, not PostgreSQL.

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
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String
  emailVerifiedAt  DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @default(now())
  transactions     Transaction[]

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
  updatedAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

enum TransactionType {
  expense
  income
}
```

**Note:** Profile, Tag, and Currency models are not needed in Prisma as they are stored in IndexedDB on the frontend. See [currency-system.md](currency-system.md) for the IndexedDB schemas.

