# Vercel Deployment

This folder contains scripts and configuration for deploying the Finance App to Vercel.

## Quick Deploy

```bash
# One-command production deployment
./deploy/vercel/deploy.sh
```

## Deployment Scripts

This folder contains TypeScript and bash scripts for managing Vercel deployments.

## Files

### `deploy.sh`
Complete deployment script that orchestrates the entire deployment process to Vercel production.

**What it does:**
1. Installs dependencies
2. Generates Prisma Client
3. Builds the Next.js application
4. Tests the build locally
5. Checks git status
6. Pushes to remote repository
7. Deploys to Vercel production
8. Verifies the deployment

**Usage:**
```bash
# From project root
./deploy/vercel/deploy.sh

# Or from deploy/vercel directory
cd deploy/vercel
./deploy.sh
```

**Requirements:**
- `.env.production` file with all required environment variables
- Vercel CLI (`npx vercel` or `npm install -g vercel`)
- Git repository configured
- Vercel project linked

### `sync-env.ts`
Syncs Vercel environment variables to `.env.production` file. This allows existing scripts that use `dotenv -e .env.production` to work seamlessly on Vercel.

**Usage:**
```bash
tsx deploy/vercel/sync-env.ts
```

### `build.ts`
Orchestrates the complete build process for Vercel deployments:
1. Syncs Vercel environment variables to `.env.production`
2. Generates Prisma Client
3. Runs database migrations
4. Builds the Next.js application

**Usage:**
```bash
tsx deploy/vercel/build.ts
```

### `types.ts`
TypeScript type definitions for Vercel deployment configuration.

## Configuration

The `vercel.json` file in `deploy/vercel/` configures Vercel to use these scripts:

```json
{
  "buildCommand": "tsx deploy/vercel/build.ts",
  "devCommand": "npm run dev:local",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Note:** When using Vercel CLI commands, specify the config file location:
```bash
vercel --local-config deploy/vercel/vercel.json
vercel --prod --local-config deploy/vercel/vercel.json
```

## Environment Variables

The following environment variables are automatically synced from Vercel to `.env.production`:

- `DATABASE_URL` - Database connection string
- `SESSION_SECRET` - Session encryption secret
- `BREVO_API_KEY` - Brevo email API key
- `BREVO_SENDER_EMAIL` - Brevo sender email address
- `BREVO_SENDER_NAME` - Brevo sender name
- `EMAIL_PROVIDER` - Email provider selection
- `NEXT_PUBLIC_APP_URL` - Public application URL
- `NEXT_PUBLIC_FORCE_GUEST_MODE` - Force guest mode flag
- `NEXT_PUBLIC_MAILHOG_HTTP_URL` - Mailhog HTTP URL
- `MAILHOG_HOST` - Mailhog host
- `MAILHOG_PORT` - Mailhog port
- `MAILHOG_USERNAME` - Mailhog username
- `MAILHOG_PASSWORD` - Mailhog password
- `NODE_ENV` - Node environment
- `VERCEL` - Vercel deployment flag
- `VERCEL_URL` - Vercel deployment URL
- `VERCEL_PROJECT_PRODUCTION_URL` - Vercel production URL

## Initial Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
# or use npx vercel
```

### 2. Link Project to Vercel

```bash
# From project root
vercel link
```

Follow the prompts to:
- Log in to your Vercel account
- Select or create a project
- Link the current directory

### 3. Set Environment Variables

**Option A: Via Vercel Dashboard**

1. Go to your project on vercel.com
2. Navigate to Settings → Environment Variables
3. Add all required variables (see below)

**Option B: Via Vercel CLI**

```bash
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel env add BREVO_API_KEY production
# ... add all other variables
```

### 4. Create .env.production Locally

For local production testing:

```bash
cp .env.example .env.production
# Edit .env.production with your production values
```

**Note:** `.env.production` should NOT be committed to git.

### 5. Deploy

```bash
# Quick deploy (recommended)
./deploy/vercel/deploy.sh

# Or manually
vercel --prod --local-config deploy/vercel/vercel.json
```

## Deployment Process

### Automatic Deployment (Recommended)

The `deploy.sh` script provides a complete deployment workflow:

```bash
./deploy/vercel/deploy.sh
```

This will:
1. ✅ Install dependencies
2. ✅ Generate Prisma Client
3. ✅ Build Next.js application
4. ✅ Test build locally
5. ✅ Check git status (offer to commit changes)
6. ✅ Push to remote repository
7. ✅ Deploy to Vercel production
8. ✅ Display deployment URL

### Manual Deployment

```bash
# Preview deployment (for testing)
vercel --local-config deploy/vercel/vercel.json

# Production deployment
vercel --prod --local-config deploy/vercel/vercel.json

# With specific environment
vercel --prod --local-config deploy/vercel/vercel.json --env DATABASE_URL="..." --env SESSION_SECRET="..."
```

## Environment Variables Management

### Required Environment Variables

All variables are synced from Vercel to `.env.production` during build:

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Security:**
- `SESSION_SECRET` - Session encryption secret (32+ characters)

**Email (Brevo):**
- `EMAIL_PROVIDER` - Set to `brevo`
- `BREVO_API_KEY` - Your Brevo API key
- `BREVO_SENDER_EMAIL` - Sender email address
- `BREVO_SENDER_NAME` - Sender name

**Application:**
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `NEXT_PUBLIC_FORCE_GUEST_MODE` - `false` (or `true` for guest-only)

### Vercel-Specific Variables (Auto-set)

These are automatically provided by Vercel:
- `VERCEL` - Vercel deployment flag
- `VERCEL_URL` - Deployment URL
- `VERCEL_PROJECT_PRODUCTION_URL` - Production URL
- `NODE_ENV` - Set to `production`

## Database Setup

### Recommended Database Providers for Vercel

1. **Vercel Postgres** (Easiest)
   ```bash
   # Add from Vercel dashboard
   # Integrations → Vercel Postgres
   ```

2. **Neon** (Free tier available)
   - Sign up at [neon.tech](https://neon.tech)
   - Create database
   - Copy connection string to `DATABASE_URL`

3. **Supabase** (Free tier available)
   - Sign up at [supabase.com](https://supabase.com)
   - Create project
   - Copy PostgreSQL connection string

4. **Railway** (Simple setup)
   - Sign up at [railway.app](https://railway.app)
   - Create PostgreSQL database
   - Copy connection string

### Database Migrations

Migrations run automatically during build via `build.ts`:

```bash
# Migrations are applied using:
npx prisma migrate deploy
```

For manual migration:

```bash
# With Vercel environment variables
npx vercel env pull .env.production
npm run prisma:migrate:deploy:prod
```

## Custom Build Configuration

The `vercel.json` in `deploy/vercel/` configures the build:

```json
{
  "buildCommand": "tsx deploy/vercel/build.ts",
  "devCommand": "npm run dev:local",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Note:** Use `--local-config deploy/vercel/vercel.json` with Vercel CLI commands to specify the config file location.

### Build Process (build.ts)

1. **Sync Environment** - Pulls Vercel env vars to `.env.production`
2. **Generate Prisma** - Creates Prisma Client
3. **Migrate Database** - Applies pending migrations
4. **Build Next.js** - Builds the application

## Monitoring & Logs

### View Logs

```bash
# Recent logs
vercel logs

# Follow logs (real-time)
vercel logs -f

# Logs for specific deployment
vercel logs https://your-deployment-url.vercel.app
```

### View Deployments

```bash
# List all deployments
vercel ls

# List production deployments only
vercel ls --prod
```

## Rollback

```bash
# List previous deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

## CI/CD Integration

### GitHub Integration (Recommended)

Vercel automatically deploys:
- **Preview Deployments** - Every push to any branch
- **Production Deployments** - Every push to `main` branch

**Note:** For automatic GitHub deployments, Vercel looks for `vercel.json` in the project root by default. Since the config is now in `deploy/vercel/vercel.json`, you have two options:

1. **Create a symlink** (recommended for automatic deployments):
   ```bash
   ln -s deploy/vercel/vercel.json vercel.json
   ```

2. **Configure in Vercel project settings** - Some Vercel projects allow specifying a custom config path in the project settings.

Configure in Vercel dashboard:
1. Connect GitHub repository
2. Set production branch to `main`
3. Configure automatic deployments
4. If needed, create the symlink as shown above

### Manual CI/CD

For custom workflows, use Vercel CLI in CI:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          npm install -g vercel
          vercel --prod --local-config deploy/vercel/vercel.json --token=$VERCEL_TOKEN
```

## Custom Domain

### Add Domain via Dashboard

1. Go to project settings on vercel.com
2. Navigate to Domains
3. Add your custom domain
4. Update DNS records as instructed

### Add Domain via CLI

```bash
vercel domains add yourdomain.com
```

## Performance Optimization

### Edge Functions

Vercel automatically deploys API routes as Edge Functions for global performance.

### Image Optimization

Next.js Image Optimization works automatically on Vercel.

### Caching

Configure in `next.config.js`:
```javascript
module.exports = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
vercel logs <deployment-url>

# Test build locally
npm run build:prod
```

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly in Vercel dashboard
- Check database allows connections from Vercel IPs
- For some databases, you may need to add `?sslmode=require`

### Environment Variables Not Working

```bash
# Pull latest env vars
vercel env pull .env.production

# Verify variables are set
vercel env ls
```

### Prisma Issues

```bash
# Verify Prisma Client generation in build logs
# Should see: "✓ Generated Prisma Client"

# Check if migrations ran successfully
# Should see: "✓ Database migrations completed"
```

## Deployment Best Practices

1. **Test Locally First**
   ```bash
   npm run build:prod
   npm run start:prod
   ```

2. **Use Preview Deployments**
   - Push to feature branch
   - Test preview URL
   - Merge to main when ready

3. **Monitor Logs**
   ```bash
   vercel logs -f
   ```

4. **Set Up Alerts**
   - Configure in Vercel dashboard
   - Get notified of deployment failures

5. **Use Environment-Specific Variables**
   - Development, Preview, Production
   - Configure in Vercel dashboard

## Security Considerations

1. **Never commit secrets** - Use Vercel environment variables
2. **Rotate secrets regularly** - Update in Vercel dashboard
3. **Use HTTPS only** - Enforced by default on Vercel
4. **Enable Vercel Authentication** - For staging environments
5. **Review deployment logs** - Monitor for security issues

## Cost Management

### Vercel Pro Features (Optional)

- Unlimited bandwidth for Pro plan
- Advanced analytics
- Priority support
- More compute time

### Keep Costs Down

- Use Hobby (free) plan for personal projects
- Optimize images and assets
- Use Edge Functions efficiently
- Monitor usage in Vercel dashboard

## Setup Checklist

- [ ] Install Vercel CLI
- [ ] Link project with `vercel link`
- [ ] Set up database (Neon, Supabase, etc.)
- [ ] Configure all environment variables
- [ ] Test build locally
- [ ] Deploy with `./deploy/vercel/deploy.sh`
- [ ] Verify deployment health
- [ ] Set up custom domain (optional)
- [ ] Configure GitHub integration
- [ ] Set up monitoring/alerts

## Notes

- The `.env.production` file is generated during the build process and should not be committed to git
- Environment variables are read from Vercel's runtime environment (`process.env`)
- The sync script only writes variables that are defined and non-empty

