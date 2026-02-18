#!/bin/bash
#
# RetireZest Test Runner
# Runs all tests to ensure application stability
#

echo "========================================"
echo "RetireZest Test Suite"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
FAILED_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2

    echo -e "${YELLOW}Running: ${test_name}${NC}"

    if python3 "$test_file" 2>&1; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}\n"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}\n"
        ((FAILED_TESTS++))
    fi
}

# Check if API is running
echo "Checking API status..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is running${NC}\n"
else
    echo -e "${RED}❌ API is not running. Please start the API first:${NC}"
    echo "   cd python-api && python3 -m uvicorn api.main:app --reload"
    exit 1
fi

# Run comprehensive test suite
echo "========================================"
echo "Running Comprehensive Tests"
echo "========================================"
echo ""

# Main test suite
if [ -f "tests/test_rrif_frontload_suite.py" ]; then
    run_test "RRIF-Frontload Comprehensive Suite" "tests/test_rrif_frontload_suite.py"
fi

# Rafael's specific tests
if [ -f "test-rafael-comprehensive.py" ]; then
    run_test "Rafael Comprehensive Test" "test-rafael-comprehensive.py"
fi

if [ -f "test-rafael-no-pension.py" ]; then
    run_test "Rafael No Pension Test" "test-rafael-no-pension.py"
fi

# RRIF indicator test
if [ -f "test-rrif-indicator.py" ]; then
    run_test "RRIF Indicator Test" "test-rrif-indicator.py"
fi

# Print summary
echo ""
echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "The application is stable and ready."
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo "Please review the failures above and fix any issues."
    exit 1
fi