# Deployment Guide

This guide covers deploying the Finance App to Vercel production.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Installed and authenticated
   ```bash
   npm install -g vercel
   vercel login
   ```
3. **Environment Variables**: Create `.env.production` with required variables
4. **Database**: Supabase PostgreSQL instance configured

## Required Environment Variables

Create a `.env.production` file in the project root with:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?schema=public&sslmode=require

# Email Service (Brevo)
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourapp.com
BREVO_SENDER_NAME=Your App Name

# Application URL (set to your Vercel production URL after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
```

### Important Notes

- **DATABASE_URL**: Must include `&sslmode=require` for Supabase SSL connections
- **NEXT_PUBLIC_APP_URL**: Update this after your first deployment with your actual Vercel URL
- Never commit `.env.production` to git (it's already in `.gitignore`)

## Deployment Scripts

### 1. First-Time Setup: Environment Variables

Sync your `.env.production` variables to Vercel:

```bash
./setup-vercel-env.sh production
```

This will:
- Read variables from `.env.production`
- Add them to Vercel production environment
- Skip `NODE_ENV` and `NEXT_PUBLIC_APP_URL` (handled separately)

### 2. Complete Deployment

Deploy to Vercel production with full checks:

```bash
./deploy.sh
```

This script will:
1. ✅ Install dependencies
2. ✅ Generate Prisma Client
3. ✅ Build Next.js application
4. ✅ Test production build locally (including health check)
5. ✅ Check git status and commit if needed
6. ✅ Push to remote repository
7. ✅ Deploy to Vercel production
8. ✅ Verify deployment

## Manual Deployment Steps

If you prefer manual deployment:

### Step 1: Build Locally

```bash
# Install dependencies
npm ci

# Generate Prisma Client
npx dotenv -e .env.production -- npx prisma generate

# Build
npx dotenv -e .env.production -- npm run build
```

### Step 2: Test Locally

```bash
# Start production server
npx dotenv -e .env.production -- npm run start

# Test health endpoint (in another terminal)
curl http://localhost:3000/api/health
```

### Step 3: Deploy to Vercel

```bash
# Commit changes
git add -A
git commit -m "Your commit message"
git push

# Deploy to production
npx vercel --prod --yes
```

## Database Migrations

Run migrations on production database:

```bash
# Using .env.production
npx dotenv -e .env.production -- npx prisma migrate deploy
```

**⚠️ Warning**: Always backup your database before running migrations in production!

## Vercel Deployment Protection

By default, Vercel may enable deployment protection. To access your app:

**Option 1**: Disable protection (for public apps)
- Go to Vercel Dashboard → Project Settings → Deployment Protection
- Disable protection for production

**Option 2**: Use bypass token (for protected deployments)
- Get token from Vercel Dashboard → Project Settings → Deployment Protection
- Access with: `https://your-app.vercel.app/api/health?x-vercel-protection-bypass=TOKEN`

## Vercel CLI Useful Commands

```bash
# View deployments
npx vercel ls

# View production logs
npx vercel logs --prod

# View environment variables
npx vercel env ls

# Add environment variable
npx vercel env add VARIABLE_NAME production

# Remove environment variable
npx vercel env rm VARIABLE_NAME production

# Pull environment variables locally
npx vercel env pull .env.vercel.local

# Inspect specific deployment
npx vercel inspect DEPLOYMENT_URL --logs
```

## Troubleshooting

### Health Check Fails During Build

**Problem**: Prisma can't connect to database during `next build`

**Solution**: Mark API routes as dynamic by adding:
```typescript
export const dynamic = 'force-dynamic'
```

Already done for:
- `/api/health`
- `/api/auth/session`
- `/api/auth/verify`
- `/api/auth/reset-password-verify`

### Database Connection Errors

**Problem**: `Can't reach database server`

**Solutions**:
1. Check `DATABASE_URL` includes `&sslmode=require`
2. Verify Supabase database is running
3. Check database credentials are correct
4. Ensure Vercel has environment variables set

### Build Fails

**Problem**: Build errors during deployment

**Solutions**:
1. Test build locally first: `npm run build`
2. Check all environment variables are set in Vercel
3. Verify Prisma schema is up to date
4. Check Node.js version compatibility (requires Node 20+)

### Static Generation Errors

**Problem**: `Route couldn't be rendered statically because it used request.url`

**Solution**: Add `export const dynamic = 'force-dynamic'` to the route file

## Post-Deployment Checklist

- [ ] Health endpoint returns `{"ok": true, "database": "connected"}`
- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` updated to Vercel production URL
- [ ] Database migrations applied
- [ ] Email service (Brevo) working
- [ ] Sign up/login flows tested
- [ ] Deployment protection configured (if needed)
- [ ] Custom domain configured (if applicable)

## Rollback

If deployment fails, rollback to previous version:

```bash
# List deployments
npx vercel ls

# Promote previous deployment to production
npx vercel promote PREVIOUS_DEPLOYMENT_URL
```

## CI/CD Integration

For automatic deployments, Vercel automatically deploys when you push to your connected Git repository:

1. Connect your GitHub/GitLab/Bitbucket repo in Vercel dashboard
2. Set production branch (usually `main` or `master`)
3. Configure environment variables in Vercel
4. Every push to production branch triggers deployment

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- Supabase Documentation: https://supabase.com/docs

## Security Notes

- Never commit `.env.production` or any `.env` files
- Rotate API keys and database passwords regularly
- Use Vercel's Secret environment variables for sensitive data
- Enable Vercel deployment protection for staging environments
- Regularly update dependencies for security patches

