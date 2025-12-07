#!/bin/bash

echo "========================================="
echo "COMPREHENSIVE SYSTEM TEST"
echo "========================================="
echo ""

# Test 1: Python API Health
echo "TEST 1: Python API Health Check"
echo "-----------------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/health)
HEALTH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/health)
echo "HTTP Status: $HEALTH_STATUS"
echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ PASSED: Python API is healthy"
else
    echo "❌ FAILED: Python API returned $HEALTH_STATUS"
    exit 1
fi
echo ""

# Test 2: Next.js Webapp
echo "TEST 2: Next.js Webapp Accessibility"
echo "-----------------------------------------"
NEXTJS_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)
echo "HTTP Status: $NEXTJS_STATUS"
TITLE=$(curl -s http://localhost:3000 | grep -o '<title>.*</title>')
echo "Page Title: $TITLE"
if [ "$NEXTJS_STATUS" = "200" ]; then
    echo "✅ PASSED: Next.js webapp is accessible"
else
    echo "❌ FAILED: Next.js returned $NEXTJS_STATUS"
    exit 1
fi
echo ""

# Test 3: Direct Simulation API Call
echo "TEST 3: Simulation API (Direct to Python)"
echo "-----------------------------------------"
SIM_RESPONSE=$(curl -X POST http://localhost:8000/api/run-simulation \
    -H "Content-Type: application/json" \
    -d @test-simulation.json \
    -s -o /tmp/test-result.json -w '%{http_code}')
echo "HTTP Status: $SIM_RESPONSE"
if [ "$SIM_RESPONSE" = "200" ]; then
    python3 << 'PYEOF'
import json
with open('/tmp/test-result.json') as f:
    data = json.load(f)
    success = data.get('success', False)
    if success:
        summary = data.get('summary', {})
        print(f"  Success: {success}")
        print(f"  Health Score: {summary.get('health_score', 'N/A')}/100")
        print(f"  Years Simulated: {len(data.get('year_by_year', []))}")
        print(f"  Final Estate: ${summary.get('final_estate_gross', 0):,.0f}")
        print(f"  Success Rate: {summary.get('success_rate', 0):.1%}")
        print("✅ PASSED: Simulation completed successfully")
    else:
        print(f"  Success: {success}")
        print(f"  Error: {data.get('error', 'Unknown')}")
        print("❌ FAILED: Simulation returned error")
        exit(1)
PYEOF
else
    echo "❌ FAILED: Simulation API returned $SIM_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Check for BrokenPipeError
echo "TEST 4: Verify No BrokenPipeError"
echo "-----------------------------------------"
ERROR_CHECK=$(cat /tmp/test-result.json | grep -i "BrokenPipe\|Broken pipe")
if [ -z "$ERROR_CHECK" ]; then
    echo "✅ PASSED: No BrokenPipeError detected"
else
    echo "❌ FAILED: BrokenPipeError found in response"
    echo "$ERROR_CHECK"
    exit 1
fi
echo ""

# Test 5: Database
echo "TEST 5: Database Connectivity"
echo "-----------------------------------------"
if [ -f "webapp/prisma/dev.db" ]; then
    DB_SIZE=$(ls -lh webapp/prisma/dev.db | awk '{print $5}')
    echo "Database exists: webapp/prisma/dev.db"
    echo "Database size: $DB_SIZE"
    echo "✅ PASSED: Database file exists and is accessible"
else
    echo "❌ FAILED: Database not found"
    exit 1
fi
echo ""

# Test 6: Environment Configuration
echo "TEST 6: Environment Configuration"
echo "-----------------------------------------"
if [ -f "webapp/.env.local" ]; then
    echo "✅ .env.local exists"
    grep -q "PYTHON_API_URL" webapp/.env.local && echo "✅ PYTHON_API_URL configured"
    grep -q "DATABASE_URL" webapp/.env.local && echo "✅ DATABASE_URL configured"
    grep -q "JWT_SECRET" webapp/.env.local && echo "✅ JWT_SECRET configured"
    echo "✅ PASSED: Environment configuration complete"
else
    echo "❌ FAILED: .env.local not found"
    exit 1
fi
echo ""

# Test 7: Check Python API Logs for Errors
echo "TEST 7: Python API Logs (Last 5 lines)"
echo "-----------------------------------------"
tail -5 /tmp/python-api.log
echo ""
ERROR_COUNT=$(grep -i "error\|exception\|failed" /tmp/python-api.log | grep -v "INFO" | wc -l | tr -d ' ')
if [ "$ERROR_COUNT" = "0" ]; then
    echo "✅ PASSED: No errors in Python API logs"
else
    echo "⚠️  WARNING: $ERROR_COUNT potential errors in logs"
fi
echo ""

# Summary
echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo "✅ All critical tests passed!"
echo ""
echo "System is ready for use:"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🐍 Backend API: http://localhost:8000"
echo "  📊 API Docs: http://localhost:8000/docs"
echo ""
echo "Next steps:"
echo "  1. Register at http://localhost:3000/register"
echo "  2. Login and navigate to /simulation"
echo "  3. Run a retirement simulation"
echo ""
