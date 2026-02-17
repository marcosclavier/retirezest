#!/bin/bash

# Railway Deployment Script
# This script helps trigger Railway deployment when needed

echo "=========================================="
echo "Railway Python Backend Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if RAILWAY_WEBHOOK_URL is set
if [ -z "$RAILWAY_WEBHOOK_URL" ]; then
    echo -e "${YELLOW}Warning: RAILWAY_WEBHOOK_URL not set${NC}"
    echo ""
    echo "To set up automatic deployment:"
    echo "1. Go to Railway Dashboard → Settings → Deploy Hooks"
    echo "2. Create a new deploy hook"
    echo "3. Copy the webhook URL"
    echo "4. Add to your .env.local file:"
    echo "   RAILWAY_WEBHOOK_URL=https://your-hook-url"
    echo ""
    echo -e "${RED}For now, please deploy manually via Railway dashboard${NC}"
    exit 1
fi

echo "Triggering Railway deployment..."
echo ""

# Trigger deployment via webhook
response=$(curl -X POST -w "\n%{http_code}" "$RAILWAY_WEBHOOK_URL" 2>/dev/null)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo -e "${GREEN}✓ Deployment triggered successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check Railway dashboard for build progress"
    echo "2. Monitor logs: View logs in Railway dashboard"
    echo "3. Verify deployment: Test production after build completes"
else
    echo -e "${RED}✗ Deployment trigger failed (HTTP $http_code)${NC}"
    echo ""
    echo "Please deploy manually:"
    echo "1. Go to https://railway.app/"
    echo "2. Select your project"
    echo "3. Click 'Redeploy' or trigger from Settings"
    exit 1
fi

echo ""
echo "=========================================="
echo "Deployment triggered at $(date)"
echo "==========================================="