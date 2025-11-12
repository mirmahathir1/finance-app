[← Back to README](README.md)

# Development Tools & Setup

## Code Quality & Validation

### Validation
- **Zod** - Runtime type validation
  - Form validation
  - API request/response validation

### Linting & Formatting
- **ESLint** - Code linting
- **Prettier** (optional) - Code formatting
- **TypeScript compiler** - Type checking

## Development Tools

### Package Manager
- **npm** or **yarn** or **pnpm**

### Node.js
- Version: 18.x or 20.x LTS

## Setup Instructions

### Prerequisites
1. Node.js 18+ installed
2. PostgreSQL (Neon) database URL configured (see `design/authentication.md`)
3. Docker installed (if deploying containers)

### Local Development Setup
```bash
# Install dependencies
npm install

# Install Prisma
npm i -D prisma
npm i @prisma/client
npx prisma init

# Define models in prisma/schema.prisma (see design/data-models.md)

# Run migrations and generate client
npx prisma migrate dev -n init
npx prisma generate

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and session/JWT secrets

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Optional: Prisma Studio
npx prisma studio
```

