"""
Test script to verify the spending_met calculation fix.
This tests that non-reg distributions are correctly included in spending_met
when reinvest_nonreg_dist=False (the default).
"""

import pandas as pd
from api.utils.converters import dataframe_to_year_results

# Create a test DataFrame that mimics a simulation year
test_data = {
    'year': [2025],
    'age_p1': [65],
    'age_p2': [65],

    # Government benefits
    'cpp_p1': [15000],
    'cpp_p2': [15000],
    'oas_p1': [8500],
    'oas_p2': [8500],
    'gis_p1': [0],
    'gis_p2': [0],

    # Withdrawals
    'withdraw_rrif_p1': [7400],
    'withdraw_rrif_p2': [10400],
    'withdraw_tfsa_p1': [0],
    'withdraw_tfsa_p2': [0],
    'withdraw_nonreg_p1': [0],
    'withdraw_nonreg_p2': [0],
    'withdraw_corp_p1': [124542],
    'withdraw_corp_p2': [124542],

    # NonReg distributions (passive income)
    'nr_dist_tot': [37765],  # Total distributions

    # Tax
    'total_tax_after_split': [28607],

    # Spending
    'spend_target_after_tax': [200000],

    # Balances (end of year)
    'end_rrif_p1': [185000],
    'end_rrif_p2': [260000],
    'end_tfsa_p1': [182000],
    'end_tfsa_p2': [95000],
    'end_nonreg_p1': [415000],
    'end_nonreg_p2': [415000],
    'end_corp_p1': [1195000],
    'end_corp_p2': [1195000],
    'net_worth_end': [3742000],

    # Tax per person
    'taxable_inc_p1': [70000],
    'taxable_inc_p2': [75000],
    'tax_after_split_p1': [14000],
    'tax_after_split_p2': [14607],
    'marginal_rate_p1': [0.25],
    'marginal_rate_p2': [0.25],

    # Status
    'plan_success': [True],

    # IMPORTANT: No reinvest_nonreg_dist column - should default to False
}

df = pd.DataFrame(test_data)

print("=" * 80)
print("TESTING SPENDING_MET CALCULATION FIX")
print("=" * 80)
print("\nTest Case: Verify non-reg distributions are included in spending_met")
print("when reinvest_nonreg_dist column is missing (should default to False)")
print("\nInput Data:")
print(f"  Government Benefits: CPP={15000+15000:,}, OAS={8500+8500:,}")
print(f"  Withdrawals: RRIF={7400+10400:,}, Corp={124542+124542:,}")
print(f"  NonReg Distributions: ${37765:,}")
print(f"  Total Tax: ${28607:,}")
print(f"  Spending Target: ${200000:,}")

# Convert DataFrame to YearResult objects
year_results = dataframe_to_year_results(df)

print("\n" + "=" * 80)
print("RESULTS")
print("=" * 80)

if year_results:
    yr = year_results[0]

    govt_benefits = yr.cpp_p1 + yr.cpp_p2 + yr.oas_p1 + yr.oas_p2
    withdrawals = (yr.rrif_withdrawal_p1 + yr.rrif_withdrawal_p2 +
                  yr.tfsa_withdrawal_p1 + yr.tfsa_withdrawal_p2 +
                  yr.nonreg_withdrawal_p1 + yr.nonreg_withdrawal_p2 +
                  yr.corporate_withdrawal_p1 + yr.corporate_withdrawal_p2)

    print(f"\nCalculation Breakdown:")
    print(f"  Government Benefits:        ${govt_benefits:>10,.0f}")
    print(f"  Account Withdrawals:        ${withdrawals:>10,.0f}")
    print(f"  NonReg Distributions:       ${37765:>10,.0f}")
    print(f"  Total Inflows:              ${govt_benefits + withdrawals + 37765:>10,.0f}")
    print(f"  Total Tax:                  ${yr.total_tax:>10,.0f}")
    print(f"  " + "-" * 48)
    print(f"  Expected Spending Met:      ${govt_benefits + withdrawals + 37765 - yr.total_tax:>10,.0f}")
    print(f"  Actual Spending Met:        ${yr.spending_met:>10,.0f}")
    print(f"  Spending Target:            ${yr.spending_need:>10,.0f}")
    print(f"  Spending Gap:               ${yr.spending_gap:>10,.0f}")

    expected_spending_met = govt_benefits + withdrawals + 37765 - yr.total_tax

    print("\n" + "=" * 80)
    if abs(yr.spending_met - expected_spending_met) < 1:
        print("✅ TEST PASSED: Spending met correctly includes non-reg distributions!")
        print(f"   Spending Met = ${yr.spending_met:,.0f}")
        print(f"   This covers the ${yr.spending_need:,.0f} target with a surplus of ${yr.spending_met - yr.spending_need:,.0f}")
    else:
        print("❌ TEST FAILED: Spending met does not match expected value")
        print(f"   Expected: ${expected_spending_met:,.0f}")
        print(f"   Got:      ${yr.spending_met:,.0f}")
        print(f"   Difference: ${yr.spending_met - expected_spending_met:,.0f}")
    print("=" * 80)
else:
    print("❌ ERROR: No year results returned from converter")

print("\n")
