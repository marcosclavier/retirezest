#!/usr/bin/env python3
"""
Validation test for Rafael's RRIF frontload issue
Testing why withdrawals exceed 15% and 8% limits
"""

import sys
import json

def analyze_rrif_withdrawals():
    """
    Analyze Rafael's RRIF withdrawal percentages
    Based on the screenshots provided showing years 2046 and 2047
    """

    print("=" * 80)
    print("RAFAEL'S RRIF FRONTLOAD VALIDATION ANALYSIS")
    print("=" * 80)

    # Year 2046 (Age 80) - From screenshot
    year_2046 = {
        "age": 80,
        "rrif_withdrawal": 21228,
        "rrif_start_balance": None,  # We need to calculate this
        "oas_status": "Active (started at age 65)",
        "expected_rate": 0.08  # 8% after OAS starts
    }

    # Year 2047 (Age 81) - From screenshot
    year_2047 = {
        "age": 81,
        "rrif_withdrawal": 20825,
        "rrif_end_balance": 164069,  # From screenshot
        "oas_status": "Active",
        "expected_rate": 0.08  # 8% after OAS starts
    }

    # Analyze Year 2046
    print("\n📊 YEAR 2046 (Age 80) ANALYSIS:")
    print("-" * 40)
    print(f"RRIF/RRSP Withdrawal: ${year_2046['rrif_withdrawal']:,}")
    print(f"Expected Rate: {year_2046['expected_rate']*100:.0f}% (after OAS starts)")

    # Calculate what the starting balance must have been for an 8% withdrawal
    implied_start_balance_8pct = year_2046['rrif_withdrawal'] / 0.08
    print(f"\nIf withdrawal was 8%:")
    print(f"  Implied start balance: ${implied_start_balance_8pct:,.0f}")

    # Calculate actual percentage if we know end balance from 2047
    # Assuming no growth, start of 2047 = end of 2046
    estimated_2046_end = year_2047['rrif_end_balance'] + year_2047['rrif_withdrawal']
    estimated_2046_start = estimated_2046_end + year_2046['rrif_withdrawal']
    actual_rate_2046 = year_2046['rrif_withdrawal'] / estimated_2046_start if estimated_2046_start > 0 else 0

    print(f"\nEstimated actual calculation:")
    print(f"  Estimated start balance: ${estimated_2046_start:,.0f}")
    print(f"  Withdrawal: ${year_2046['rrif_withdrawal']:,}")
    print(f"  Actual rate: {actual_rate_2046*100:.2f}%")

    if actual_rate_2046 > 0.08:
        print(f"  ⚠️ EXCEEDS 8% limit by {(actual_rate_2046-0.08)*100:.2f} percentage points")

    # Analyze Year 2047
    print("\n📊 YEAR 2047 (Age 81) ANALYSIS:")
    print("-" * 40)
    print(f"RRIF/RRSP Withdrawal: ${year_2047['rrif_withdrawal']:,}")
    print(f"RRIF End Balance: ${year_2047['rrif_end_balance']:,}")
    print(f"Expected Rate: {year_2047['expected_rate']*100:.0f}% (after OAS starts)")

    # Calculate the starting balance and actual percentage
    start_balance_2047 = year_2047['rrif_end_balance'] + year_2047['rrif_withdrawal']
    actual_rate_2047 = year_2047['rrif_withdrawal'] / start_balance_2047 if start_balance_2047 > 0 else 0

    print(f"\nActual calculation:")
    print(f"  Start balance: ${start_balance_2047:,.0f}")
    print(f"  Withdrawal: ${year_2047['rrif_withdrawal']:,}")
    print(f"  End balance: ${year_2047['rrif_end_balance']:,}")
    print(f"  Actual rate: {actual_rate_2047*100:.2f}%")

    if actual_rate_2047 > 0.08:
        print(f"  ⚠️ EXCEEDS 8% limit by {(actual_rate_2047-0.08)*100:.2f} percentage points")

    # Mandatory RRIF minimum analysis
    print("\n📋 MANDATORY RRIF MINIMUM ANALYSIS:")
    print("-" * 40)

    # RRIF minimum rates for ages 80 and 81
    rrif_min_rates = {
        80: 0.0670,  # 6.70%
        81: 0.0688,  # 6.88%
    }

    print("CRA Mandatory RRIF Minimum Rates:")
    print(f"  Age 80: {rrif_min_rates[80]*100:.2f}%")
    print(f"  Age 81: {rrif_min_rates[81]*100:.2f}%")

    # Check if withdrawals might be influenced by mandatory minimums
    min_withdrawal_2046 = estimated_2046_start * rrif_min_rates[80]
    min_withdrawal_2047 = start_balance_2047 * rrif_min_rates[81]

    print(f"\nYear 2046 (Age 80):")
    print(f"  Mandatory minimum: ${min_withdrawal_2046:,.0f}")
    print(f"  Actual withdrawal: ${year_2046['rrif_withdrawal']:,}")
    print(f"  Actual vs Minimum: {year_2046['rrif_withdrawal']/min_withdrawal_2046:.1f}x")

    print(f"\nYear 2047 (Age 81):")
    print(f"  Mandatory minimum: ${min_withdrawal_2047:,.0f}")
    print(f"  Actual withdrawal: ${year_2047['rrif_withdrawal']:,}")
    print(f"  Actual vs Minimum: {year_2047['rrif_withdrawal']/min_withdrawal_2047:.1f}x")

    # Root Cause Analysis
    print("\n🔍 POTENTIAL ROOT CAUSES:")
    print("-" * 40)

    print("\n1. MANDATORY MINIMUM OVERRIDE:")
    print("   The code shows: rrif_frontload_target = max(rrif_frontload_target, rrif_min)")
    print("   This means if the mandatory minimum (6.70-6.88%) exceeds the frontload")
    print("   target (8%), the minimum takes precedence.")
    print("   ✅ This is CORRECT behavior per CRA requirements")

    print("\n2. SHORTFALL GAP-FILLING:")
    print("   Based on the code analysis, RRIF-Frontload strategy should NOT")
    print("   withdraw additional RRIF beyond the frontload percentage.")
    print("   The gap-filling order is: Corp → NonReg → TFSA (NOT RRIF)")

    print("\n3. CALCULATION ISSUE:")
    if actual_rate_2046 > 0.08 or actual_rate_2047 > 0.08:
        print("   ⚠️ The actual withdrawal rates exceed 8%, suggesting either:")
        print("   a) The RRIF balance calculation has an error")
        print("   b) Additional withdrawals are being made beyond frontload")
        print("   c) The frontload percentage is not being properly applied")

    # Recommendations
    print("\n💡 RECOMMENDATIONS FOR RAFAEL:")
    print("-" * 40)
    print("\n1. The withdrawals appear to be ~10-11% instead of 8%")
    print("2. This could be due to:")
    print("   - Mandatory RRIF minimums being higher than expected")
    print("   - A bug where additional RRIF withdrawals are made for shortfalls")
    print("   - Incorrect calculation of the frontload percentage")
    print("\n3. The code should enforce:")
    print("   - Exactly 15% before OAS (ages < 65 typically)")
    print("   - Exactly 8% after OAS starts (ages >= 65)")
    print("   - NO additional RRIF withdrawals beyond these percentages")
    print("   - Unless mandatory minimums require more")

    print("\n" + "=" * 80)
    print("END OF ANALYSIS")
    print("=" * 80)

if __name__ == "__main__":
    analyze_rrif_withdrawals()