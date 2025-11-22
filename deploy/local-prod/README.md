# Local Development Setup

This guide explains how to run the Finance App locally using production-like configuration:
- **Neon Postgres** - Cloud PostgreSQL database
- **Brevo** - Production email service
- **Next.js** - Running locally in development mode

## Overview

This setup allows you to:
- Test against a production-like database (Neon Postgres)
- Use real email sending (Brevo) instead of MailHog
- Develop locally while connected to cloud services
- Verify production configuration before deploying

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Neon Postgres account (free tier available)
- Brevo account (free tier available)

## Step 1: Set Up Neon Postgres

### 1.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### 1.2 Get Connection String

1. In your Neon dashboard, go to your project
2. Navigate to **Connection Details**
3. Copy the **Connection String** (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

**Note:** Neon requires SSL, so make sure your connection string includes `?sslmode=require`

## Step 2: Set Up Brevo Email

### 2.1 Create Brevo Account

1. Go to [brevo.com](https://www.brevo.com)
2. Sign up for a free account (300 emails/day free tier)
3. Verify your email address

### 2.2 Get API Key

1. In Brevo dashboard, go to **Settings** → **API Keys**
2. Click **Generate a new API key**
3. Copy the API key (starts with `xkeysib-...`)
4. **Important:** Save this key securely, you won't be able to see it again

### 2.3 Configure Sender

1. Go to **Senders** → **Add a sender**
2. Add your email address and verify it
3. Note your sender email and name

## Step 3: Configure Environment Variables

### 3.1 Create .env.local-prod File

Create the `.env.local-prod` file in the project root by copying from the template:

```bash
cp env.template .env.local-prod
```

**File location:** `.env.local-prod` (in project root)

**Note:** We use `.env.local-prod` (not `.env.production`) because:
- `.env.production` is reserved for Vercel deployment where `NEXT_PUBLIC_APP_URL` will be your production URL
- `.env.local-prod` indicates local development with production-like services (Neon, Brevo)
- The `.env.local-prod` file is already in `.gitignore` and will not be committed to git

See `env.template` for detailed instructions about different environment file configurations.

### 3.2 Configure .env.local-prod

Edit `.env.local-prod` with your production-like values:

```bash
# ============================================================================
# DATABASE - Neon Postgres
# ============================================================================
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# ============================================================================
# SECURITY
# ============================================================================
SESSION_SECRET="your-random-32-character-secret-here"
# Generate with: openssl rand -base64 32

# ============================================================================
# EMAIL CONFIGURATION - Brevo
# ============================================================================
EMAIL_PROVIDER="brevo"
BREVO_API_KEY="xkeysib-your-api-key-here"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"
BREVO_SENDER_NAME="Finance App"

# ============================================================================
# APPLICATION
# ============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_FORCE_GUEST_MODE="false"
```

**Important Notes:**
- Replace `DATABASE_URL` with your Neon connection string
- Generate `SESSION_SECRET` using: `openssl rand -base64 32`
- Use your actual Brevo API key and sender details
- Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` (local development)
- The `.env.local-prod` file is gitignored and should NOT be committed

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Generate Prisma Client

Generate the Prisma Client using the local-prod environment:

```bash
npx dotenv -e .env.local-prod -- npx prisma generate
```

This reads from `.env.local-prod` and generates the Prisma Client.

## Step 6: Run Database Migrations

Apply database migrations to your Neon Postgres database:

```bash
npx dotenv -e .env.local-prod -- npx prisma migrate deploy
```

This will:
- Connect to your Neon database using `DATABASE_URL` from `.env.local-prod`
- Apply all pending migrations
- Set up the database schema

**Note:** This uses `prisma migrate deploy` which is safe for production databases (unlike `prisma migrate dev` which can reset data).

## Step 7: Run the Next.js Server

### Quick Start Command

Start the Next.js development server using the `.env.local-prod` environment file:

```bash
npx dotenv -e .env.local-prod -- next dev
```

**What this command does:**
- Loads environment variables from `.env.local-prod`
- Starts Next.js in development mode with hot-reload
- Connects to your Neon Postgres database
- Uses Brevo for sending emails
- Enables hot-reload for instant code updates

The application will be available at: **http://localhost:3000**

### Using NPM Scripts (Recommended)

For convenience, you can add npm scripts to `package.json` (see "Optional: Add NPM Scripts" section below). Once added, you can simply run:

```bash
npm run dev:local-prod
```

This is equivalent to the command above but shorter and easier to remember.

## Complete Setup Commands

Here's the complete sequence of commands:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx dotenv -e .env.local-prod -- npx prisma generate

# 3. Run database migrations
npx dotenv -e .env.local-prod -- npx prisma migrate deploy

# 4. Start development server
npx dotenv -e .env.local-prod -- next dev
```

## Optional: Add NPM Scripts

For convenience, you can add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev:local-prod": "dotenv -e .env.local-prod -- next dev",
    "prisma:generate:local-prod": "dotenv -e .env.local-prod -- prisma generate",
    "prisma:migrate:deploy:local-prod": "dotenv -e .env.local-prod -- prisma migrate deploy",
    "prisma:studio:local-prod": "dotenv -e .env.local-prod -- prisma studio"
  }
}
```

Then you can use:
```bash
npm run dev:local-prod
npm run prisma:generate:local-prod
npm run prisma:migrate:deploy:local-prod
npm run prisma:studio:local-prod
```

## Running the Next.js Server

### Quick Start

After completing the setup steps above, start the development server:

```bash
npx dotenv -e .env.local-prod -- next dev
```

The server will:
- Start on http://localhost:3000
- Connect to your Neon Postgres database
- Use Brevo for email sending
- Enable hot-reload for development

### Using NPM Scripts (Recommended)

For convenience, add these scripts to your `package.json` (see "Optional: Add NPM Scripts" section):

```bash
npm run dev:local-prod
```

This is equivalent to the command above but shorter.

## Running the Next.js Server with .env.local-prod

### Method 1: Direct Command (Always Works)

Run the Next.js development server directly with the `.env.local-prod` file:

```bash
npx dotenv -e .env.local-prod -- next dev
```

This command:
- Reads all environment variables from `.env.local-prod`
- Starts the Next.js development server
- Connects to Neon Postgres (using `DATABASE_URL` from the file)
- Uses Brevo for email (using `BREVO_API_KEY` and related vars)
- Server runs on http://localhost:3000

### Method 2: Using NPM Scripts (Recommended)

If you've added the npm scripts (see "Optional: Add NPM Scripts" section), use:

```bash
npm run dev:local-prod
```

This is a shorter, more convenient command that does the same thing.

### What Happens When You Start the Server

1. **Environment Loading**: Variables from `.env.local-prod` are loaded
2. **Database Connection**: Prisma connects to your Neon Postgres database
3. **Server Start**: Next.js dev server starts with hot-reload enabled
4. **Ready**: App is available at http://localhost:3000

### Stopping the Server

Press `Ctrl+C` in the terminal to stop the development server.

## Daily Development Workflow

### Starting the App

**Option 1: Using dotenv directly**
```bash
npx dotenv -e .env.local-prod -- next dev
```

**Option 2: Using npm script (if added)**
```bash
npm run dev:local-prod
```

### Stopping the App

Press `Ctrl+C` in the terminal running the dev server.

### Viewing Database

Open Prisma Studio to view/edit your Neon database:

```bash
npx dotenv -e .env.local-prod -- npx prisma studio
```

Or if you added the npm scripts:
```bash
npm run prisma:studio:local-prod
```

This opens Prisma Studio at http://localhost:5555

### Running New Migrations

If you create new migrations:

```bash
# Generate migration (creates migration file)
# Use .env.local with local database for safe testing
npm run prisma:migrate:local

# Apply to Neon database
npx dotenv -e .env.local-prod -- npx prisma migrate deploy
```

Or if you added the npm scripts:
```bash
npm run prisma:migrate:deploy:local-prod
```

**Important:** Always test migrations on a local database first before applying to production.

## Available Commands

All commands use `.env.local-prod`:

| Command | Description |
|---------|-------------|
| `npx dotenv -e .env.local-prod -- next dev` | Start Next.js dev server |
| `npx dotenv -e .env.local-prod -- next build` | Build for production |
| `npx dotenv -e .env.local-prod -- next start` | Start production server (after build) |
| `npx dotenv -e .env.local-prod -- npx prisma generate` | Generate Prisma Client |
| `npx dotenv -e .env.local-prod -- npx prisma migrate deploy` | Apply migrations to database |
| `npx dotenv -e .env.local-prod -- npx prisma studio` | Open Prisma Studio |

**Note:** If you add the optional npm scripts (see above), you can use shorter commands like `npm run dev:local-prod`.

## Troubleshooting

### Database Connection Issues

**Error: Connection refused or timeout**

- Verify your Neon connection string is correct
- Check that your IP is allowed (Neon allows all IPs by default)
- Ensure `?sslmode=require` is in your connection string
- Test connection in Neon dashboard

**Error: SSL required**

- Add `?sslmode=require` to your `DATABASE_URL`
- Neon requires SSL connections

### Email Not Sending

**Error: Brevo API key invalid**

- Verify your Brevo API key in `.env.local-prod`
- Check that the API key has email sending permissions
- Verify your sender email is verified in Brevo

**Error: Sender not verified**

- Go to Brevo dashboard → Senders
- Verify your sender email address
- Wait for verification email and click the link

### Prisma Client Not Generated

**Error: Prisma Client not found**

```bash
# Regenerate Prisma Client
npx dotenv -e .env.local-prod -- npx prisma generate
```

Or if you added the npm scripts:
```bash
npm run prisma:generate:local-prod
```

### Migration Issues

**Error: Migration failed**

- Check database connection string
- Verify you have write permissions on the database
- Check Neon dashboard for database status
- Review migration files in `prisma/migrations/`

**Reset database (⚠️ DESTRUCTIVE - Development only!)**

```bash
# This will DELETE ALL DATA
# Only use on development/test databases
npx dotenv -e .env.local-prod -- npx prisma migrate reset
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon Postgres connection string | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `SESSION_SECRET` | Random 32+ character secret | Generate with `openssl rand -base64 32` |
| `EMAIL_PROVIDER` | Email provider | `"brevo"` |
| `BREVO_API_KEY` | Brevo API key | `"xkeysib-..."` |
| `BREVO_SENDER_EMAIL` | Verified sender email | `"noreply@yourdomain.com"` |
| `BREVO_SENDER_NAME` | Sender display name | `"Finance App"` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `"http://localhost:3000"` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_FORCE_GUEST_MODE` | Force guest mode | `"false"` |

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env.local-prod`** - It contains sensitive credentials
2. **Keep `.env.production` separate** - That's for Vercel deployment with production URL
3. **Rotate secrets regularly** - Change `SESSION_SECRET` periodically
4. **Use strong SESSION_SECRET** - At least 32 characters, random
5. **Protect Brevo API key** - Treat it like a password
6. **Limit database access** - Use Neon's IP restrictions if needed

## Cost Considerations

### Neon Postgres (Free Tier)

- **Free tier includes:**
  - 0.5 GB storage
  - Shared CPU
  - Automatic backups
  - Perfect for development/testing

- **Upgrade if needed:**
  - More storage
  - Better performance
  - Dedicated resources

### Brevo (Free Tier)

- **Free tier includes:**
  - 300 emails/day
  - Unlimited contacts
  - Basic features

- **Upgrade if needed:**
  - More emails/day
  - Advanced features
  - Priority support

## Next Steps

- **Docker Setup**: See [deploy/docker/README.md](../docker/README.md) for containerized development
- **Vercel Deployment**: See [deploy/vercel/README.md](../vercel/README.md) for production deployment
- **AWS Deployment**: See [deploy/aws/README.md](../aws/README.md) for AWS setup
- **GCP Deployment**: See [deploy/gcp/README.md](../gcp/README.md) for GCP setup

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Brevo Documentation](https://developers.brevo.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

