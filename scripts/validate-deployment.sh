#!/bin/bash

# Strict Deployment Validation Script
# This script validates the deployment configuration for RetireZest

set -e  # Exit on any error

echo "================================================"
echo "RetireZest Deployment Validation Script"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Phase 1: Environment Detection
echo "Phase 1: Environment Detection"
echo "------------------------------"

if [ -z "$NODE_ENV" ]; then
    echo -e "${RED}❌ NODE_ENV not set${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✅ NODE_ENV: $NODE_ENV${NC}"
fi

# Phase 2: Railway Python API Validation
echo ""
echo "Phase 2: Railway Python API Validation"
echo "---------------------------------------"

RAILWAY_API_URL="https://astonishing-learning-production.up.railway.app"
echo "Testing Railway API at: $RAILWAY_API_URL"

# Test health endpoint
echo -n "Testing /api/health endpoint... "
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RAILWAY_API_URL/api/health" 2>/dev/null || echo "HTTP_CODE:000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"

    # Parse JSON response
    if command -v jq &> /dev/null; then
        ENVIRONMENT=$(echo "$RESPONSE_BODY" | jq -r '.environment' 2>/dev/null || echo "unknown")
        TAX_CONFIG=$(echo "$RESPONSE_BODY" | jq -r '.tax_config_loaded' 2>/dev/null || echo "unknown")
        echo "  - Environment: $ENVIRONMENT"
        echo "  - Tax Config Loaded: $TAX_CONFIG"

        if [ "$ENVIRONMENT" != "production" ] && [ "$NODE_ENV" = "production" ]; then
            echo -e "${RED}  ❌ API not running in production mode!${NC}"
            VALIDATION_PASSED=false
        fi
    else
        echo "$RESPONSE_BODY"
    fi
else
    echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    VALIDATION_PASSED=false
fi

# Test CORS configuration
echo -n "Testing CORS configuration... "
CORS_RESPONSE=$(curl -s -I -X OPTIONS \
    -H "Origin: https://www.retirezest.com" \
    -H "Access-Control-Request-Method: POST" \
    "$RAILWAY_API_URL/api/health" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")

if [[ "$CORS_RESPONSE" == *"https://www.retirezest.com"* ]] || [[ "$CORS_RESPONSE" == *"https://retirezest.com"* ]]; then
    echo -e "${GREEN}✅ Production CORS configured${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify CORS headers${NC}"
fi

# Test that localhost is NOT allowed in production
echo -n "Testing localhost CORS rejection... "
LOCALHOST_CORS=$(curl -s -I -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    "$RAILWAY_API_URL/api/health" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")

if [[ "$LOCALHOST_CORS" == *"localhost"* ]]; then
    echo -e "${RED}❌ Localhost allowed in production!${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✅ Localhost correctly rejected${NC}"
fi

# Phase 3: Vercel Environment Variables
echo ""
echo "Phase 3: Vercel Environment Variables"
echo "-------------------------------------"

echo "Required Vercel environment variables:"
echo "  Production:"
echo "    - PYTHON_API_URL = $RAILWAY_API_URL"
echo "    - NODE_ENV = production"
echo "    - DATABASE_URL = [PostgreSQL connection string with SSL]"
echo "    - JWT_SECRET = [32+ character secret]"
echo "    - NEXT_PUBLIC_API_URL = https://www.retirezest.com"
echo ""
echo "  Development/Preview:"
echo "    - PYTHON_API_URL = http://localhost:8000 (or preview Railway URL)"
echo "    - NODE_ENV = development"
echo "    - DATABASE_URL = [Development database]"
echo "    - JWT_SECRET = [Development secret]"
echo "    - NEXT_PUBLIC_API_URL = [Preview URL or http://localhost:3000]"

# Phase 4: API Route Testing
echo ""
echo "Phase 4: API Route Testing"
echo "--------------------------"

if [ -n "$VERCEL_URL" ]; then
    echo "Testing Vercel deployment at: https://$VERCEL_URL"

    # Test health endpoint
    echo -n "Testing /api/health endpoint... "
    VERCEL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://$VERCEL_URL/api/health" 2>/dev/null || echo "000")

    if [ "$VERCEL_HEALTH" = "200" ]; then
        echo -e "${GREEN}✅ Vercel health check passed${NC}"
    else
        echo -e "${RED}❌ Failed (HTTP $VERCEL_HEALTH)${NC}"
        VALIDATION_PASSED=false
    fi
else
    echo -e "${YELLOW}⚠️  VERCEL_URL not set, skipping Vercel tests${NC}"
fi

# Phase 5: Security Validation
echo ""
echo "Phase 5: Security Validation"
echo "----------------------------"

# Check for exposed secrets (looking for actual hardcoded values, not variable references)
echo -n "Checking for exposed secrets... "
# Look for patterns like JWT_SECRET="actual_value" or DATABASE_URL="postgresql://..."
SECRET_CHECK=$(grep -r "JWT_SECRET.*=.*[\"'][^$]" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" . 2>/dev/null | grep -v ".env" | grep -v "process.env" | grep -v "example" | grep -v "template" || echo "")
SECRET_CHECK2=$(grep -r "DATABASE_URL.*=.*[\"']postgresql:" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" . 2>/dev/null | grep -v ".env" | grep -v "process.env" | grep -v "example" | grep -v "template" || echo "")
SECRET_CHECK3=$(grep -r "RESEND_API_KEY.*=.*[\"']re_" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" . 2>/dev/null | grep -v ".env" | grep -v "process.env" | grep -v "example" | grep -v "template" || echo "")

ALL_SECRETS="$SECRET_CHECK$SECRET_CHECK2$SECRET_CHECK3"

if [ -z "$ALL_SECRETS" ]; then
    echo -e "${GREEN}✅ No exposed secrets found${NC}"
else
    echo -e "${RED}❌ Potential exposed secrets found!${NC}"
    echo "$ALL_SECRETS"
    VALIDATION_PASSED=false
fi

# Phase 6: Data Flow Testing
echo ""
echo "Phase 6: Data Flow Testing"
echo "--------------------------"
echo "To test pension data flow:"
echo "  1. Create a test user account"
echo "  2. Enter profile data with pension information"
echo "  3. Run a simulation"
echo "  4. Verify pension calculations appear in results"
echo "  5. Check withdrawal strategies include pension income"

# Phase 7: Final Summary
echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo ""
    echo "Deployment is ready for production."
else
    echo -e "${RED}❌ Validation failed!${NC}"
    echo ""
    echo "Please fix the issues above before deploying to production."
    exit 1
fi

echo ""
echo "Next Steps:"
echo "  1. Ensure all Vercel environment variables are set"
echo "  2. Trigger a new deployment on both Railway and Vercel"
echo "  3. Test the complete user flow with pension data"
echo "  4. Monitor logs for any errors"