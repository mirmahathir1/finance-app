[← Back to README](README.md)

# Neon Database Credentials Setup

Neon is a serverless PostgreSQL database platform used for storing user accounts, sessions, and transaction data.

## Steps to Get Neon Credentials

### 1. Create a Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign up"** or **"Get started"**
3. Sign up using:
   - GitHub account (recommended)
   - Google account
   - Email address
4. Complete the registration process

### 2. Create a New Project
1. After logging in, you'll be taken to the Neon dashboard
2. Click **"Create a project"** or **"New Project"**
3. Fill in the project details:
   - **Project name**: e.g., "finance-app" or "finance-app-production"
   - **PostgreSQL version**: Select the latest stable version (recommended: 15 or 16)
   - **Region**: Choose the region closest to your application servers for best performance
4. Click **"Create project"**

### 3. Get Your Connection String
1. Once your project is created, you'll see the project dashboard
2. Navigate to the **"Connection Details"** section (usually shown on the project overview)
3. You'll see a connection string in the format:
   ```
   postgres://username:password@hostname/database?sslmode=require
   ```
4. Click **"Copy"** to copy the connection string

**Alternative method:**
1. Go to your project dashboard
2. Click on **"Connection String"** or **"Settings"** → **"Connection Details"**
3. Select the connection string format (usually "Pooled connection" or "Direct connection")
4. Copy the connection string

### 4. Set Up Environment Variables
Add the following to your `.env.local` file:

```env
DATABASE_URL=postgres://username:password@hostname/database?sslmode=require
```

**Replace the connection string** with the one you copied from Neon.

**Important:** The connection string must include `?sslmode=require` at the end for secure connections.

### 5. Test Your Connection
1. Install Prisma CLI (if not already installed):
   ```bash
   npm install -D prisma
   npm install @prisma/client
   ```

2. Initialize Prisma (if not already done):
   ```bash
   npx prisma init
   ```

3. Update `prisma/schema.prisma` with your database configuration

4. Test the connection:
   ```bash
   npx prisma db pull
   ```
   This will verify that Prisma can connect to your Neon database.

### 6. Run Migrations
1. Create your initial migration:
   ```bash
   npx prisma migrate dev --name init
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. For production deployments:
   ```bash
   npx prisma migrate deploy
   ```

## Connection Pooling (Recommended for Serverless)

Neon provides connection pooling for better performance in serverless environments:

1. In your Neon project dashboard, go to **"Connection Details"**
2. Look for **"Pooled connection"** or **"Connection pooling"**
3. Use the pooled connection string instead of the direct connection string
4. The pooled connection string typically includes `-pooler` in the hostname

**Example:**
```
postgres://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/database?sslmode=require
```

## Database Branching (Optional)

Neon supports database branching for development workflows:

1. In your project dashboard, click **"Branches"**
2. Create a new branch from your main branch
3. Each branch has its own connection string
4. Use different branches for:
   - Development
   - Staging
   - Production

## Free Tier Limits
- Neon free tier includes:
  - 0.5 GB storage
  - 1 project
  - Unlimited branches
  - Automatic backups
  - Connection pooling
- For production, consider upgrading to a paid plan for more storage and resources

## Security Best Practices
- **Never commit connection strings to version control**
- Store credentials in `.env.local` (which should be in `.gitignore`)
- Use different databases/projects for development and production
- Enable connection pooling for serverless deployments
- Regularly rotate database passwords
- Use SSL connections (`sslmode=require`) for all connections

## Environment-Specific Setup

### Development
```env
DATABASE_URL=postgres://dev-user:dev-password@dev-host/database?sslmode=require
```

### Production
```env
DATABASE_URL=postgres://prod-user:prod-password@prod-host/database?sslmode=require
```

## Troubleshooting
- **Connection timeout**: Check if you're using the pooled connection string for serverless environments
- **SSL errors**: Ensure `?sslmode=require` is included in the connection string
- **Authentication failed**: Verify the username and password in the connection string
- **Database not found**: Check that the database name in the connection string matches your Neon project database
- **IP restrictions**: Neon doesn't require IP whitelisting, but check your firewall settings

## Additional Resources
- [Neon Documentation](https://neon.tech/docs)
- [Neon Connection Pooling Guide](https://neon.tech/docs/connect/connection-pooling)
- [Prisma with Neon](https://neon.tech/docs/integrations/prisma)
- [Neon Support](https://neon.tech/docs/support)

