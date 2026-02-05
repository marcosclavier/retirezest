#!/bin/bash

# Comprehensive test suite for US-044 Auto-Optimization

echo "============================================================"
echo "US-044 AUTO-OPTIMIZATION COMPREHENSIVE TEST SUITE"
echo "============================================================"
echo ""

# Array to track results
declare -a results

# Function to run test and capture result
run_test() {
    local test_file=$1
    local test_name=$2

    echo "------------------------------------------------------------"
    echo "TEST: $test_name"
    echo "File: $test_file"
    echo "------------------------------------------------------------"

    # Check if file exists
    if [ ! -f "$test_file" ]; then
        echo "⚠️  FILE NOT FOUND: $test_file"
        results+=("SKIP: $test_name - File not found")
        return
    fi

    # Run simulation
    response=$(curl -s -X POST http://localhost:8000/api/run-simulation \
        -H "Content-Type: application/json" \
        -d @"$test_file")

    # Check if response is valid JSON
    if ! echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
        echo "❌ INVALID RESPONSE (not JSON)"
        results+=("FAIL: $test_name - Invalid response")
        return
    fi

    # Parse response
    success=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")
    message=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('message', 'No message'))")

    if [ "$success" != "True" ]; then
        echo "❌ SIMULATION FAILED: $message"
        results+=("FAIL: $test_name - Simulation error")
        return
    fi

    # Check for optimization
    opt_result=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); print('YES' if r.get('optimization_result') else 'NO')")

    # Get summary stats
    years_funded=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); s=r.get('summary', {}); print(s.get('years_funded', 0))")
    years_total=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); s=r.get('summary', {}); print(s.get('years_simulated', 0))")
    success_rate=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); s=r.get('summary', {}); print(f\"{s.get('success_rate', 0)*100:.1f}%\")")

    echo "✓ Simulation successful"
    echo "  Years funded: $years_funded/$years_total ($success_rate)"
    echo "  Optimization triggered: $opt_result"

    if [ "$opt_result" = "YES" ]; then
        # Get optimization details
        orig_strategy=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); o=r.get('optimization_result', {}); print(o.get('original_strategy', 'N/A'))")
        opt_strategy=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); o=r.get('optimization_result', {}); print(o.get('optimized_strategy', 'N/A'))")
        gaps_eliminated=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); o=r.get('optimization_result', {}); print(o.get('gaps_eliminated', 0))")

        echo "  🎉 OPTIMIZATION OCCURRED!"
        echo "     From: $orig_strategy → To: $opt_strategy"
        echo "     Gaps eliminated: $gaps_eliminated years"
        results+=("SUCCESS: $test_name - Optimized to $opt_strategy")
    else
        results+=("PASS: $test_name - No optimization needed (success=$success_rate)")
    fi

    echo ""
}

# Test 1: Simple optimization scenario
run_test "test_optimization_simple.json" "Simple Optimization (RRIF-heavy)"

# Test 2: Realistic Juan scenario
run_test "test_juan_realistic.json" "Juan Realistic Portfolio"

# Test 3: Rafael & Lucy with corporate
run_test "api/test_rafael_lucy_minimize_income.json" "Rafael & Lucy (Corporate Accounts)"

# Test 4: Check actual database test files
run_test "api/test_rafael_lucy_actual.json" "Rafael & Lucy Actual"

# Test 5: Extreme failure case
run_test "api/test_extreme_failure.json" "Extreme Failure Case"

# Test 6: Forced failure
run_test "api/test_forced_failure.json" "Forced Failure Case"

# Summary
echo "============================================================"
echo "TEST SUMMARY"
echo "============================================================"
echo ""

for result in "${results[@]}"; do
    echo "$result"
done

echo ""
echo "Total tests: ${#results[@]}"
echo "============================================================"
