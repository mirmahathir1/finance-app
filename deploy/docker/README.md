# Docker Deployment

This directory contains Docker configuration files for running the Finance App in containers.

## Overview

The Docker setup provides a complete development and production environment with:
- **Next.js Application** - The main web application
- **PostgreSQL Database** - Data storage
- **MailHog** - Email testing (development only)

## Files

- `Dockerfile` - Production build with multi-stage optimization
- `Dockerfile.dev` - Development build with hot-reload support
- `docker-compose.yml` - Orchestrates all services

## Quick Start

### Development Mode

Run the app with hot-reload enabled:

```bash
# From project root
docker-compose -f deploy/docker/docker-compose.yml up
```

**Alternative:** If you prefer to work from the docker directory:
```bash
cd deploy/docker
docker-compose up
```

The application will be available at:
- **App**: http://localhost:3000
- **MailHog UI**: http://localhost:8025
- **PostgreSQL**: localhost:5432

### Production Mode

Run the optimized production build:

```bash
# From project root
docker-compose -f deploy/docker/docker-compose.yml --profile prod up app-prod postgres
```

**Alternative:** If you prefer to work from the docker directory:
```bash
cd deploy/docker
docker-compose --profile prod up app-prod postgres
```

## Docker Compose Services

### `postgres`
PostgreSQL 16 database server

**Ports**: 5432  
**Credentials**:
- Database: `finance_app`
- User: `finance_user`
- Password: `finance_pass`

**Volume**: `postgres-data` for data persistence

**Health Check**: Automatic readiness checks

### `mailhog`
Email testing server (development only)

**Ports**:
- 1025 - SMTP server
- 8025 - Web UI

**Usage**: All emails sent by the app are captured here

### `app` (Development)
Next.js application with hot-reload

**Ports**: 3000  
**Build**: Uses `Dockerfile.dev`  
**Features**:
- Source code mounted for instant updates
- No rebuild required for code changes
- Full debug capabilities

### `app-prod` (Production)
Optimized Next.js application

**Ports**: 3000  
**Build**: Uses `Dockerfile` with multi-stage build  
**Features**:
- Minimal image size
- Standalone Next.js output
- Production-optimized

## Detailed Usage

### First Time Setup

```bash
# 1. From project root, start all services
docker-compose -f deploy/docker/docker-compose.yml up

# Migrations run automatically on container startup
# The app will be available once migrations complete

# 2. Access the application
open http://localhost:3000
```

**Note:** Database migrations run automatically when the container starts via the entrypoint script. If you need to run migrations manually:

```bash
docker-compose -f deploy/docker/docker-compose.yml exec app npx prisma migrate deploy
```

### Daily Development

```bash
# From project root, start services
docker-compose -f deploy/docker/docker-compose.yml up

# View logs
docker-compose -f deploy/docker/docker-compose.yml logs -f app

# Stop services
docker-compose -f deploy/docker/docker-compose.yml down

# Stop and remove volumes (clean slate)
docker-compose -f deploy/docker/docker-compose.yml down -v
```

### Database Management

```bash
# From project root
# Access PostgreSQL CLI
docker-compose -f deploy/docker/docker-compose.yml exec postgres psql -U finance_user -d finance_app

# Run Prisma Studio
docker-compose -f deploy/docker/docker-compose.yml exec app npx prisma studio

# Run migrations
docker-compose -f deploy/docker/docker-compose.yml exec app npx prisma migrate deploy

# Reset database (development only!)
docker-compose -f deploy/docker/docker-compose.yml exec app npx prisma migrate reset
```

**Alternative:** From the docker directory:
```bash
cd deploy/docker
docker-compose exec postgres psql -U finance_user -d finance_app
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma migrate reset
```

### Rebuilding Images

```bash
# From project root
docker-compose -f deploy/docker/docker-compose.yml build app

# Rebuild production image
docker-compose -f deploy/docker/docker-compose.yml build app-prod

# Rebuild with no cache
docker-compose -f deploy/docker/docker-compose.yml build --no-cache app
```

**Alternative:** From the docker directory:
```bash
cd deploy/docker
docker-compose build app
docker-compose build app-prod
docker-compose build --no-cache app
```

## Environment Variables

The docker-compose.yml contains default development environment variables. For custom configuration:

### Option 1: Edit docker-compose.yml
Directly modify the `environment` section in docker-compose.yml

### Option 2: Use .env file
Create `.env` in the `deploy/docker` directory:

```bash
# Database
POSTGRES_USER=finance_user
POSTGRES_PASSWORD=finance_pass
POSTGRES_DB=finance_app

# Application
NODE_ENV=development
SESSION_SECRET=your-secret-here
EMAIL_PROVIDER=mailhog
```

Then reference in docker-compose.yml:
```yaml
environment:
  - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

## Production Deployment with Docker

### Option 1: Docker Compose

```bash
# From project root - Build and start production services
docker-compose -f deploy/docker/docker-compose.yml --profile prod up -d app-prod postgres

# Check health
curl http://localhost:3000/api/health
```

**Alternative:** From the docker directory:
```bash
cd deploy/docker
docker-compose --profile prod up -d app-prod postgres
```

### Option 2: Standalone Docker

```bash
# Build production image
docker build -f deploy/docker/Dockerfile -t finance-app:latest .

# Run with external database
docker run -d \
  --name finance-app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SESSION_SECRET="your-secret" \
  -e EMAIL_PROVIDER="brevo" \
  -e BREVO_API_KEY="your-key" \
  finance-app:latest
```

### Option 3: Container Orchestration

Deploy to Kubernetes, Docker Swarm, or AWS ECS:

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: finance-app
        image: finance-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
```

## Dockerfile Explained

### Dockerfile (Production)

**Stage 1: Dependencies**
- Installs only production dependencies
- Uses npm ci for reproducible builds

**Stage 2: Builder**
- Copies source code
- Generates Prisma client
- Builds Next.js application

**Stage 3: Runner**
- Minimal runtime image
- Non-root user for security
- Only includes built artifacts
- Uses Next.js standalone output

**Result**: Image size ~200MB (vs ~1.5GB with full build)

### Dockerfile.dev (Development)

- Single stage for simplicity
- Includes all dependencies
- Exposes volumes for hot-reload
- Faster iteration cycle

## Networking

All services communicate through the `finance-app-network` bridge network:

```
┌─────────────────┐
│   app (3000)    │─┐
└─────────────────┘ │
                    │
┌─────────────────┐ │
│ postgres (5432) │─┼─ finance-app-network
└─────────────────┘ │
                    │
┌─────────────────┐ │
│ mailhog (1025)  │─┘
└─────────────────┘
```

Services can reference each other by service name:
- `postgres` - Database host
- `mailhog` - Email server host

## Volumes

### Named Volume: `postgres-data`
Persists database data between container restarts

```bash
# From project root - Backup database
docker-compose -f deploy/docker/docker-compose.yml exec postgres pg_dump -U finance_user finance_app > backup.sql

# Restore database
docker-compose -f deploy/docker/docker-compose.yml exec -T postgres psql -U finance_user finance_app < backup.sql
```

### Bind Mounts (Development)
Source code is mounted at `/app` for hot-reload:
- `../..:/app` - Project root
- `/app/node_modules` - Anonymous volume to prevent overwrite
- `/app/.next` - Anonymous volume for build cache

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - '3001:3000'  # Host:Container
```

### Database Connection Refused
```bash
# From project root - Check if postgres is healthy
docker-compose -f deploy/docker/docker-compose.yml ps

# View postgres logs
docker-compose -f deploy/docker/docker-compose.yml logs postgres

# Verify connection from app
docker-compose -f deploy/docker/docker-compose.yml exec app psql postgresql://finance_user:finance_pass@postgres:5432/finance_app
```

### Permission Denied Errors
```bash
# Fix ownership (macOS/Linux)
sudo chown -R $(id -u):$(id -g) .

# Reset file permissions
chmod -R 755 .
```

### Out of Disk Space
```bash
# Remove unused containers, images, volumes
docker system prune -a --volumes

# Check disk usage
docker system df
```

### Container Keeps Restarting
```bash
# From project root - View container logs
docker-compose -f deploy/docker/docker-compose.yml logs app

# Check exit code
docker-compose -f deploy/docker/docker-compose.yml ps

# Run interactively for debugging
docker-compose -f deploy/docker/docker-compose.yml run --rm app sh
```

## Performance Optimization

### Development
- Volumes are used for hot-reload (slower I/O but instant updates)
- Consider Docker Desktop's VirtioFS for better performance on macOS
- Increase Docker Desktop memory/CPU allocation if needed

### Production
- Multi-stage build minimizes image size
- Standalone output reduces dependencies
- Health checks ensure reliability
- Consider resource limits:

```yaml
app-prod:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

## Security Best Practices

### Development
- Default credentials are fine for local development
- MailHog is exposed locally only
- Use `.env` files (not committed to git)

### Production
- **Change all default passwords**
- Use secrets management (Docker secrets, Kubernetes secrets)
- Don't expose PostgreSQL port publicly
- Use read-only root filesystem where possible
- Scan images for vulnerabilities:

```bash
docker scan finance-app:latest
```

### Recommended Production Configuration

```yaml
app-prod:
  read_only: true
  tmpfs:
    - /tmp
  security_opt:
    - no-new-privileges:true
  environment:
    - DATABASE_URL=${DATABASE_URL}  # From secrets
    - SESSION_SECRET=${SESSION_SECRET}  # From secrets
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Docker Image

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -f deploy/docker/Dockerfile -t finance-app .
      
      - name: Run tests
        run: docker run finance-app npm test
```

### GitLab CI Example

```yaml
build:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -f deploy/docker/Dockerfile -t finance-app .
    - docker run finance-app npm test
```

## Migration from Root Directory

If you're migrating from the old setup where Docker files were in the root:

```bash
# Old way (no longer works)
docker-compose up  # ❌

# New way
cd deploy/docker
docker-compose up  # ✅

# Or from root
docker-compose -f deploy/docker/docker-compose.yml up
```

## Next Steps

- **Local Development**: See [deploy/local-prod/README.md](../local-prod/README.md)
- **Vercel Deployment**: See [deploy/vercel/README.md](../vercel/README.md)
- **AWS Deployment**: See [deploy/aws/README.md](../aws/README.md)
- **GCP Deployment**: See [deploy/gcp/README.md](../gcp/README.md)

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

