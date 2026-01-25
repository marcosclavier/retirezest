#!/bin/bash

# Test Real Estate Integration via API
# This script tests the /api/simulation/prefill endpoint

echo "🏠 Testing Real Estate Integration via API"
echo "=========================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ Error: Development server is not running"
    echo "Please start the dev server with: npm run dev"
    exit 1
fi

echo "✅ Development server is running"
echo ""

# Test with authentication (you'll need to be logged in)
echo "📋 Testing /api/simulation/prefill endpoint..."
echo ""
echo "Instructions:"
echo "1. Open your browser to http://localhost:3000"
echo "2. Log in to your account"
echo "3. Open DevTools (F12) > Console tab"
echo "4. Run this command:"
echo ""
echo "fetch('/api/simulation/prefill')"
echo "  .then(r => r.json())"
echo "  .then(data => {"
echo "    console.log('=== SIMULATION PREFILL RESPONSE ===');"
echo "    console.log('Total Net Worth:', data.totalNetWorth);"
echo "    console.log('Liquid Net Worth:', data.totalLiquidNetWorth);"
echo "    console.log('Real Estate Equity:', data.realEstate?.totalEquity);"
echo "    console.log('Has Properties:', data.realEstate?.hasProperties);"
echo "    console.log('');"
echo "    console.log('Person 1 Rental Income:', data.person1Input?.rental_income_annual);"
echo "    console.log('Person 2 Rental Income:', data.person2Input?.rental_income_annual);"
echo "    console.log('');"
echo "    console.log('Real Estate Properties:', data.realEstate?.assets);"
echo "    console.log('=================================');"
echo "    return data;"
echo "  })"
echo ""
echo "5. Verify the following:"
echo "   - rental_income_annual includes income from properties"
echo "   - totalNetWorth = totalLiquidNetWorth + realEstate.totalEquity"
echo "   - realEstate.assets shows your properties"
echo ""
echo "Alternative: Use the Network tab"
echo "1. Navigate to /simulation page"
echo "2. Open DevTools > Network tab"
echo "3. Look for the 'prefill' request"
echo "4. Check the Response tab"
echo ""
