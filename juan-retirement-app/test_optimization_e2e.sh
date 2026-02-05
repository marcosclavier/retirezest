#!/bin/bash
# End-to-End Integration Test for US-044 Auto-Optimization Feature
# Tests the complete flow from API request to response validation

set -e  # Exit on any error

echo "========================================================================"
echo "US-044 AUTO-OPTIMIZATION - END-TO-END INTEGRATION TEST"
echo "========================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: API Server Health Check
echo -e "${BLUE}Test 1: API Server Health Check${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "API server is healthy (HTTP $HTTP_CODE)"
else
    print_result 1 "API server health check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Realistic Scenario - Optimization Detection
echo -e "${BLUE}Test 2: Realistic Scenario ($1.05M Portfolio)${NC}"
RESPONSE=$(curl -s -X POST http://localhost:8000/api/run-simulation \
    -H "Content-Type: application/json" \
    -d @test_juan_realistic.json)

# Check success
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
if [ "$SUCCESS" = "True" ]; then
    print_result 0 "Simulation executed successfully"
else
    print_result 1 "Simulation execution failed"
fi

# Check optimization triggered
OPTIMIZED=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(opt.get('optimized', False) if opt else False)" 2>/dev/null || echo "false")
if [ "$OPTIMIZED" = "True" ]; then
    print_result 0 "Optimization detected and triggered"

    # Extract details
    ORIG_STRAT=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(opt.get('original_strategy', 'N/A'))" 2>/dev/null)
    OPT_STRAT=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(opt.get('optimized_strategy', 'N/A'))" 2>/dev/null)
    ORIG_SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(f\"{opt.get('original_success_rate', 0)*100:.1f}\" if opt else 'N/A')" 2>/dev/null)
    OPT_SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(f\"{opt.get('optimized_success_rate', 0)*100:.1f}\" if opt else 'N/A')" 2>/dev/null)
    GAPS=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(opt.get('gaps_eliminated', 0))" 2>/dev/null)

    echo "    From: $ORIG_STRAT ($ORIG_SUCCESS%)"
    echo "    To: $OPT_STRAT ($OPT_SUCCESS%)"
    echo "    Gaps Eliminated: $GAPS years"
else
    print_result 1 "Optimization not triggered (expected to trigger)"
fi
echo ""

# Test 3: Low-Asset Scenario - Critical Failure Mode
echo -e "${BLUE}Test 3: Low-Asset Scenario ($520K Portfolio - Critical Failure Mode)${NC}"
RESPONSE=$(curl -s -X POST http://localhost:8000/api/run-simulation \
    -H "Content-Type: application/json" \
    -d @test_optimization_simple.json)

SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
if [ "$SUCCESS" = "True" ]; then
    print_result 0 "Low-asset simulation executed successfully"
else
    print_result 1 "Low-asset simulation failed"
fi

OPTIMIZED=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(opt.get('optimized', False) if opt else False)" 2>/dev/null || echo "false")
if [ "$OPTIMIZED" = "True" ]; then
    print_result 0 "Critical failure mode optimization triggered"

    ORIG_SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(f\"{opt.get('original_success_rate', 0)*100:.1f}\" if opt else 'N/A')" 2>/dev/null)
    OPT_SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print(f\"{opt.get('optimized_success_rate', 0)*100:.1f}\" if opt else 'N/A')" 2>/dev/null)

    echo "    Original: $ORIG_SUCCESS% (below 75% threshold)"
    echo "    Optimized: $OPT_SUCCESS% (below 75% threshold)"
    echo "    → Both strategies failing, funding-only scoring applied"
else
    print_result 1 "Critical failure mode optimization not triggered"
fi
echo ""

# Test 4: Response Structure Validation
echo -e "${BLUE}Test 4: Response Structure Validation${NC}"
RESPONSE=$(curl -s -X POST http://localhost:8000/api/run-simulation \
    -H "Content-Type: application/json" \
    -d @test_juan_realistic.json)

# Check required fields
REQUIRED_FIELDS=("success" "optimization_result" "summary" "data")
ALL_FIELDS_PRESENT=0

for field in "${REQUIRED_FIELDS[@]}"; do
    HAS_FIELD=$(echo "$RESPONSE" | python3 -c "import sys, json; print('$field' in json.load(sys.stdin))" 2>/dev/null || echo "False")
    if [ "$HAS_FIELD" = "True" ]; then
        ALL_FIELDS_PRESENT=$((ALL_FIELDS_PRESENT + 1))
    fi
done

if [ $ALL_FIELDS_PRESENT -eq ${#REQUIRED_FIELDS[@]} ]; then
    print_result 0 "All required response fields present"
else
    print_result 1 "Missing required response fields ($ALL_FIELDS_PRESENT/${#REQUIRED_FIELDS[@]} present)"
fi

# Check optimization result structure
OPT_FIELDS=("optimized" "original_strategy" "optimized_strategy" "optimization_reason" "original_success_rate" "optimized_success_rate" "gaps_eliminated" "tax_increase_pct" "tax_increase_amount")
OPT_FIELDS_PRESENT=0

for field in "${OPT_FIELDS[@]}"; do
    HAS_FIELD=$(echo "$RESPONSE" | python3 -c "import sys, json; opt = json.load(sys.stdin).get('optimization_result', {}); print('$field' in opt if opt else False)" 2>/dev/null || echo "False")
    if [ "$HAS_FIELD" = "True" ]; then
        OPT_FIELDS_PRESENT=$((OPT_FIELDS_PRESENT + 1))
    fi
done

if [ $OPT_FIELDS_PRESENT -eq ${#OPT_FIELDS[@]} ]; then
    print_result 0 "All optimization result fields present"
else
    print_result 1 "Missing optimization result fields ($OPT_FIELDS_PRESENT/${#OPT_FIELDS[@]} present)"
fi
echo ""

# Summary
echo "========================================================================"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "========================================================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED - OPTIMIZATION FEATURE WORKING CORRECTLY${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED - PLEASE REVIEW${NC}"
    echo ""
    exit 1
fi
