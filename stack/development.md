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
2. Third-party provider credentials configured as needed (see `design/authentication.md`)
3. Docker installed (if deploying containers)

### Local Development Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your provider credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

