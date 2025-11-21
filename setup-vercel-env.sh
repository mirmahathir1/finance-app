#!/bin/bash

# Finance App - Vercel Environment Variables Setup Script
# This script syncs environment variables from .env.production to Vercel

set -e  # Exit on any error

echo "🔧 Setting up Vercel environment variables..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ENV_FILE=".env.production"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
    exit 1
fi

echo -e "${BLUE}Reading environment variables from $ENV_FILE...${NC}"
echo ""

# Environment to target (production, preview, development)
TARGET_ENV="${1:-production}"

if [ "$TARGET_ENV" != "production" ] && [ "$TARGET_ENV" != "preview" ] && [ "$TARGET_ENV" != "development" ]; then
    echo -e "${RED}❌ Invalid environment: $TARGET_ENV${NC}"
    echo "Usage: ./setup-vercel-env.sh [production|preview|development]"
    exit 1
fi

echo -e "${YELLOW}Target environment: $TARGET_ENV${NC}"
echo ""

# Parse .env.production and add to Vercel
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract key and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        KEY="${BASH_REMATCH[1]}"
        VALUE="${BASH_REMATCH[2]}"
        
        # Skip NEXT_PUBLIC_APP_URL as it should be set to the actual Vercel URL
        if [ "$KEY" == "NEXT_PUBLIC_APP_URL" ]; then
            echo -e "${YELLOW}⚠️  Skipping NEXT_PUBLIC_APP_URL (should be set to Vercel URL)${NC}"
            continue
        fi
        
        # Skip NODE_ENV as Vercel sets this automatically
        if [ "$KEY" == "NODE_ENV" ]; then
            echo -e "${YELLOW}⚠️  Skipping NODE_ENV (managed by Vercel)${NC}"
            continue
        fi
        
        echo -e "${BLUE}Adding $KEY to Vercel $TARGET_ENV...${NC}"
        
        # Check if variable already exists
        EXISTING=$(npx vercel env ls 2>/dev/null | grep -w "$KEY" || echo "")
        
        if [ -n "$EXISTING" ]; then
            echo -e "${YELLOW}⚠️  $KEY already exists. Removing old value...${NC}"
            echo "$KEY" | npx vercel env rm "$KEY" "$TARGET_ENV" --yes 2>/dev/null || true
        fi
        
        # Add the variable
        echo "$VALUE" | npx vercel env add "$KEY" "$TARGET_ENV" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Added $KEY${NC}"
        else
            echo -e "${RED}❌ Failed to add $KEY${NC}"
        fi
        echo ""
    fi
done < "$ENV_FILE"

echo ""
echo -e "${GREEN}✅ Environment variables setup complete!${NC}"
echo ""
echo "View all variables with: npx vercel env ls"
echo ""

# Remind about DATABASE_URL SSL mode
echo -e "${YELLOW}📌 Important notes:${NC}"
echo "  - Ensure DATABASE_URL includes '&sslmode=require' for Supabase"
echo "  - Set NEXT_PUBLIC_APP_URL to your actual Vercel production URL"
echo "  - Redeploy after adding new environment variables"
echo ""

