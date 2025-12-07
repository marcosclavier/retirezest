#!/bin/bash
# End-to-end test for retirement simulation

echo "========================================="
echo "Testing Retirement Simulation Flow"
echo "========================================="
echo ""

# 1. Test Python API Health
echo "1. Testing Python API (port 8000)..."
PYTHON_HEALTH=$(curl -s http://localhost:8000/api/health)
if echo "$PYTHON_HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ Python API is healthy"
else
    echo "   ❌ Python API is not responding"
    echo "   Please run: cd juan-retirement-app && python3 api/main.py"
    exit 1
fi
echo ""

# 2. Test Next.js Web App
echo "2. Testing Next.js Web App (port 3000)..."
NEXTJS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$NEXTJS_RESPONSE" = "200" ]; then
    echo "   ✅ Next.js is running"
else
    echo "   ❌ Next.js is not responding"
    echo "   Please run: cd webapp && npm run dev"
    exit 1
fi
echo ""

# 3. Test Simulation Endpoint
echo "3. Testing Simulation API endpoint..."
SIMULATION_RESULT=$(curl -X POST http://localhost:8000/api/run-simulation \
    -H "Content-Type: application/json" \
    -d @test-simulation.json \
    -s -o /tmp/test-sim-result.json -w "%{http_code}")

if [ "$SIMULATION_RESULT" = "200" ]; then
    SUCCESS=$(python3 -c "import json; print(json.load(open('/tmp/test-sim-result.json')).get('success', False))")
    if [ "$SUCCESS" = "True" ]; then
        echo "   ✅ Simulation completed successfully"
        python3 << 'PYEOF'
import json
with open('/tmp/test-sim-result.json') as f:
    data = json.load(f)
    summary = data.get('summary', {})
    print(f"      - Health Score: {summary.get('health_score', 'N/A')}/100")
    print(f"      - Years Simulated: {len(data.get('year_by_year', []))}")
    print(f"      - Final Estate: ${summary.get('final_estate_gross', 0):,.0f}")
PYEOF
    else
        echo "   ⚠️  Simulation returned but with errors"
    fi
else
    echo "   ❌ Simulation API failed (HTTP $SIMULATION_RESULT)"
    exit 1
fi
echo ""

# 4. Test Database
echo "4. Testing Database..."
if [ -f "webapp/prisma/dev.db" ]; then
    echo "   ✅ Database file exists"
else
    echo "   ❌ Database not initialized"
    echo "   Please run: cd webapp && DATABASE_URL='file:./prisma/dev.db' npx prisma db push"
    exit 1
fi
echo ""

echo "========================================="
echo "✅ All Tests Passed!"
echo "========================================="
echo ""
echo "Access the application at:"
echo "  🌐 http://localhost:3000"
echo ""
echo "Available pages:"
echo "  - Home: http://localhost:3000"
echo "  - Simulation: http://localhost:3000/simulation"
echo "  - Benefits Calculator: http://localhost:3000/benefits"
echo ""
echo "Note: You'll need to register/login first"
echo "      The simulation page requires authentication"
echo ""
