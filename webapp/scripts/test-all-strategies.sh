#!/bin/bash

# Test all withdrawal strategies

echo "================================================================================"
echo "COMPREHENSIVE STRATEGY TESTING"
echo "================================================================================"
echo ""

# Array of strategies to test
declare -A strategies
strategies=(
    ["corporate-optimized"]="Corp→RRIF→NonReg→TFSA"
    ["capital-gains-optimized"]="NonReg→RRIF→Corp→TFSA"
    ["minimize-income"]="RRIF→Corp→NonReg→TFSA"
    ["balanced"]="Balanced (Tax-Optimized)"
    ["tfsa-first"]="TFSA→Corp→RRIF→NonReg"
)

# Test each strategy
for strategy in "${!strategies[@]}"; do
    echo "================================================================================"
    echo "Testing: $strategy (${strategies[$strategy]})"
    echo "================================================================================"

    # Create temporary test file with this strategy
    sed "s/corporate-optimized/$strategy/" scripts/test-simulation-2026-direct.ts > /tmp/test-strategy-temp.ts

    # Run the test
    npx tsx /tmp/test-strategy-temp.ts > /tmp/strategy-test-output.txt 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Simulation completed successfully"

        # Extract key withdrawal data from first year
        echo ""
        echo "Year 1 (Age 65) Withdrawals:"
        jq '.year_by_year[0] | {
            year,
            age: .age_p1,
            tfsa: .tfsa_withdrawal_p1,
            rrif: .rrif_withdrawal_p1,
            nonreg: .nonreg_withdrawal_p1,
            corp: .corporate_withdrawal_p1
        }' /tmp/raw-sim-result.json

        # Determine which account was used first
        tfsa=$(jq '.year_by_year[0].tfsa_withdrawal_p1 // 0' /tmp/raw-sim-result.json)
        rrif=$(jq '.year_by_year[0].rrif_withdrawal_p1 // 0' /tmp/raw-sim-result.json)
        nonreg=$(jq '.year_by_year[0].nonreg_withdrawal_p1 // 0' /tmp/raw-sim-result.json)
        corp=$(jq '.year_by_year[0].corporate_withdrawal_p1 // 0' /tmp/raw-sim-result.json)

        echo ""
        echo "Primary Account Used:"
        if (( $(echo "$tfsa > 1000" | bc -l) )); then
            echo "  🎯 TFSA ($$tfsa)"
        elif (( $(echo "$corp > 1000" | bc -l) )); then
            echo "  🎯 Corporate ($$corp)"
        elif (( $(echo "$nonreg > 1000" | bc -l) )); then
            echo "  🎯 NonReg ($$nonreg)"
        elif (( $(echo "$rrif > 1000" | bc -l) )); then
            echo "  🎯 RRIF ($$rrif)"
        else
            echo "  ⚠️  No withdrawals detected"
        fi

        # Get tax rate
        tax=$(jq '.year_by_year[0].total_tax' /tmp/raw-sim-result.json)
        income=$(jq '.year_by_year[0].corporate_withdrawal_p1 + .year_by_year[0].nonreg_withdrawal_p1 + .year_by_year[0].rrif_withdrawal_p1 + .year_by_year[0].tfsa_withdrawal_p1 + .year_by_year[0].cpp_p1 + .year_by_year[0].oas_p1' /tmp/raw-sim-result.json)

        if (( $(echo "$income > 0" | bc -l) )); then
            tax_rate=$(echo "scale=2; ($tax / $income) * 100" | bc)
            echo "  📊 Effective Tax Rate: ${tax_rate}%"
        fi

    else
        echo "❌ Simulation FAILED"
        tail -20 /tmp/strategy-test-output.txt
    fi

    echo ""
    echo ""
done

echo "================================================================================"
echo "ALL STRATEGY TESTS COMPLETE"
echo "================================================================================"
