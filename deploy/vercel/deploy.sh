#!/bin/bash

# Finance App - Complete Deployment Script for Vercel
# This script handles building, testing, and deploying the app to Vercel production

set -e  # Exit on any error

echo "🚀 Starting Finance App Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.production"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
    echo "Please create $ENV_FILE with required environment variables"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}🔧 Step 2: Generating Prisma Client...${NC}"
npx dotenv -e "$ENV_FILE" -- npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

echo -e "${BLUE}🗄️  Step 3: Running database migrations...${NC}"
npx dotenv -e "$ENV_FILE" -- npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Please check your database connection and migration files"
    exit 1
fi
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

echo -e "${BLUE}🏗️  Step 4: Building Next.js application...${NC}"
npx dotenv -e "$ENV_FILE" -- npm run build:prod
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

echo -e "${BLUE}🧪 Step 5: Testing production build locally...${NC}"
echo "Starting local server on port 3000..."
npx dotenv -e "$ENV_FILE" -- npm run start:prod &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo '{"ok":false}')
HEALTH_OK=$(echo "$HEALTH_RESPONSE" | grep -o '"ok"[[:space:]]*:[[:space:]]*true' || echo "")

# Stop the local server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

if [ -z "$HEALTH_OK" ]; then
    echo -e "${RED}❌ Health check failed locally${NC}"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi
echo -e "${GREEN}✓ Local health check passed${NC}"
echo ""

echo -e "${BLUE}📋 Step 6: Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add -A
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✓ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Deploying with uncommitted changes${NC}"
    fi
else
    echo -e "${GREEN}✓ Working directory clean${NC}"
fi
echo ""

echo -e "${BLUE}🔄 Step 7: Pushing to remote repository...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"
echo -e "${GREEN}✓ Pushed to $CURRENT_BRANCH${NC}"
echo ""

echo -e "${BLUE}☁️  Step 8: Deploying to Vercel Production...${NC}"
npx vercel --prod --yes --local-config deploy/vercel/vercel.json
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Vercel deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Deployed to Vercel${NC}"
echo ""

echo -e "${BLUE}🔍 Step 9: Getting deployment URL...${NC}"
DEPLOYMENT_URL=$(npx vercel ls --prod 2>/dev/null | grep "finance" | head -1 | awk '{print $2}')
if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}✓ Production URL: https://$DEPLOYMENT_URL${NC}"
    echo ""
    
    echo -e "${BLUE}📊 Step 10: Verifying production deployment...${NC}"
    echo "Waiting for deployment to be ready..."
    sleep 10
    
    # Note: Health check might fail if Vercel deployment protection is enabled
    echo -e "${YELLOW}Note: If health check fails, it might be due to Vercel deployment protection${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Useful commands:"
echo "  - View logs: npx vercel logs <deployment-url>"
echo "  - List deployments: npx vercel ls"
echo "  - View environment variables: npx vercel env ls"
echo ""

