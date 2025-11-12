[← Back to Main README](../README.md)

# Setup Instructions

This folder contains step-by-step instructions for obtaining credentials and setting up third-party services required for the finance app.

## Services

1. **[Brevo Credentials](./brevo-credentials.md)** - Email service for user verification
2. **[Neon Credentials](./neon-credentials.md)** - PostgreSQL database hosting
3. **[GCP Credentials](./gcp-credentials.md)** - Cloud platform for deployment

## Quick Start

1. Follow each guide in order to set up the required services
2. After obtaining credentials, add them to your `.env.local` file
3. Ensure `.env.local` is in your `.gitignore` file

## Environment Variables Summary

After completing all setup guides, your `.env.local` should include:

```env
# Brevo (Email Service)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
BREVO_SENDER_NAME=Your App Name

# Neon (Database)
DATABASE_URL=postgres://username:password@hostname/database?sslmode=require

# GCP (Deployment - Optional for local development)
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCP_SERVICE_ACCOUNT_KEY_PATH=path/to/service-account-key.json
```

## Security Reminders

- ⚠️ **Never commit credentials to version control**
- ✅ Store all credentials in `.env.local`
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use different credentials for development and production
- ✅ Rotate credentials periodically

## Next Steps

After setting up credentials:
1. Run `npm install` to install dependencies
2. Set up Prisma: `npx prisma init`
3. Run migrations: `npx prisma migrate dev`
4. Start the development server: `npm run dev`

