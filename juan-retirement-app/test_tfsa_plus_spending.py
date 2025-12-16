"""
Test that TFSA contributions are IN ADDITION to spending target.

Expected behavior:
- Spending target: $100,000
- TFSA contributions: $14,000 ($7K x 2 people)
- Total withdrawals needed: $114,000 (plus taxes)
- Spending met should be $100,000 (full target)
"""

import requests
import json

profile = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 100000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 215000,
        "corporate_balance": 500000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000,
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 100000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 215000,
        "corporate_balance": 500000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000,
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",
    "spending_go_go": 100000,
    "spending_slow_go": 100000,
    "spending_no_go": 100000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85,
    "tfsa_contribution_each": 7000,  # TFSA contributions enabled
    "reinvest_nonreg_dist": False
}

print("=" * 100)
print("TESTING: TFSA CONTRIBUTIONS MUST BE IN ADDITION TO SPENDING TARGET")
print("=" * 100)
print("\nConfiguration:")
print(f"  - Spending target: ${profile['spending_go_go']:,}")
print(f"  - TFSA contribution (per person): ${profile['tfsa_contribution_each']:,}")
print(f"  - Total TFSA contribution (household): ${profile['tfsa_contribution_each'] * 2:,}")
print(f"  - Expected total needed: ${profile['spending_go_go'] + profile['tfsa_contribution_each'] * 2:,} (spending + TFSA)")
print("\n" + "=" * 100)

response = requests.post("http://localhost:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()

if not data.get("success"):
    print(f"\n❌ Simulation failed: {data.get('message')}")
    exit(1)

print("\n✅ Simulation successful!")

# Get first year data
years = data.get("year_by_year", [])
if not years:
    print("\n❌ No year-by-year data")
    exit(1)

year1 = years[0]

# Extract key metrics
spending_need = year1.get('spending_need', 0)
spending_met = year1.get('spending_met', 0)
spending_gap = year1.get('spending_gap', 0)

tfsa_contrib_p1 = year1.get('tfsa_contribution_p1', 0)
tfsa_contrib_p2 = year1.get('tfsa_contribution_p2', 0)
total_tfsa_contrib = tfsa_contrib_p1 + tfsa_contrib_p2

# Withdrawals
rrif_wd_p1 = year1.get('rrif_withdrawal_p1', 0)
rrif_wd_p2 = year1.get('rrif_withdrawal_p2', 0)
nonreg_wd_p1 = year1.get('nonreg_withdrawal_p1', 0)
nonreg_wd_p2 = year1.get('nonreg_withdrawal_p2', 0)
corp_wd_p1 = year1.get('corporate_withdrawal_p1', 0)
corp_wd_p2 = year1.get('corporate_withdrawal_p2', 0)
tfsa_wd_p1 = year1.get('tfsa_withdrawal_p1', 0)
tfsa_wd_p2 = year1.get('tfsa_withdrawal_p2', 0)

total_withdrawals = (rrif_wd_p1 + rrif_wd_p2 + nonreg_wd_p1 + nonreg_wd_p2 +
                    corp_wd_p1 + corp_wd_p2 + tfsa_wd_p1 + tfsa_wd_p2)

# Tax
tax_p1 = year1.get('total_tax_p1', 0)
tax_p2 = year1.get('total_tax_p2', 0)
total_tax = year1.get('total_tax', 0)

# Government benefits
cpp_p1 = year1.get('cpp_p1', 0)
cpp_p2 = year1.get('cpp_p2', 0)
oas_p1 = year1.get('oas_p1', 0)
oas_p2 = year1.get('oas_p2', 0)
total_gov_benefits = cpp_p1 + cpp_p2 + oas_p1 + oas_p2

# NonReg distributions
nonreg_dist = year1.get('nonreg_distributions', 0)

print("\n" + "=" * 100)
print("YEAR 1 (2025) DETAILED BREAKDOWN")
print("=" * 100)

print("\n📊 SPENDING:")
print(f"  Spending Need:   ${spending_need:>12,.2f}")
print(f"  Spending Met:    ${spending_met:>12,.2f}")
print(f"  Spending Gap:    ${spending_gap:>12,.2f}")

print("\n💰 GOVERNMENT BENEFITS:")
print(f"  CPP (P1):        ${cpp_p1:>12,.2f}")
print(f"  CPP (P2):        ${cpp_p2:>12,.2f}")
print(f"  OAS (P1):        ${oas_p1:>12,.2f}")
print(f"  OAS (P2):        ${oas_p2:>12,.2f}")
print(f"  Total Benefits:  ${total_gov_benefits:>12,.2f}")

print("\n📤 ACCOUNT WITHDRAWALS:")
print(f"  RRIF (P1):       ${rrif_wd_p1:>12,.2f}")
print(f"  RRIF (P2):       ${rrif_wd_p2:>12,.2f}")
print(f"  NonReg (P1):     ${nonreg_wd_p1:>12,.2f}")
print(f"  NonReg (P2):     ${nonreg_wd_p2:>12,.2f}")
print(f"  Corporate (P1):  ${corp_wd_p1:>12,.2f}")
print(f"  Corporate (P2):  ${corp_wd_p2:>12,.2f}")
print(f"  TFSA (P1):       ${tfsa_wd_p1:>12,.2f}")
print(f"  TFSA (P2):       ${tfsa_wd_p2:>12,.2f}")
print(f"  ─────────────────────────────")
print(f"  Total Withdrawals: ${total_withdrawals:>12,.2f}")

print("\n🎯 TFSA CONTRIBUTIONS:")
print(f"  TFSA Contrib (P1): ${tfsa_contrib_p1:>12,.2f}")
print(f"  TFSA Contrib (P2): ${tfsa_contrib_p2:>12,.2f}")
print(f"  ─────────────────────────────")
print(f"  Total TFSA Contrib: ${total_tfsa_contrib:>12,.2f}")

print("\n💵 PASSIVE INCOME:")
print(f"  NonReg Distributions: ${nonreg_dist:>12,.2f}")

print("\n💸 TAXES:")
print(f"  Tax (P1):        ${tax_p1:>12,.2f}")
print(f"  Tax (P2):        ${tax_p2:>12,.2f}")
print(f"  Total Tax:       ${total_tax:>12,.2f}")

# Calculate total after-tax cash available
total_inflows = total_gov_benefits + total_withdrawals + nonreg_dist
total_after_tax = total_inflows - total_tax

print("\n" + "=" * 100)
print("CASH FLOW SUMMARY")
print("=" * 100)
print(f"\nTotal Inflows (Gov + Withdrawals + Distributions): ${total_inflows:>12,.2f}")
print(f"Total Tax Paid:                                     ${total_tax:>12,.2f}")
print(f"                                                     ─────────────────")
print(f"Total After-Tax Cash Available:                     ${total_after_tax:>12,.2f}")
print(f"\nAllocated to:")
print(f"  Spending:          ${spending_met:>12,.2f}")
print(f"  TFSA Contributions: ${total_tfsa_contrib:>12,.2f}")
print(f"                     ─────────────────")
print(f"  Total Allocated:   ${spending_met + total_tfsa_contrib:>12,.2f}")
print(f"\nRemaining (surplus): ${total_after_tax - spending_met - total_tfsa_contrib:>12,.2f}")

print("\n" + "=" * 100)
print("VALIDATION CHECKS")
print("=" * 100)

# Check 1: Spending is fully met
expected_spending = profile['spending_go_go']
if abs(spending_met - expected_spending) < 100:
    print(f"\n✅ CHECK 1 PASSED: Spending fully met")
    print(f"   Expected: ${expected_spending:,.0f}")
    print(f"   Actual:   ${spending_met:,.0f}")
else:
    print(f"\n❌ CHECK 1 FAILED: Spending not fully met")
    print(f"   Expected: ${expected_spending:,.0f}")
    print(f"   Actual:   ${spending_met:,.0f}")
    print(f"   Gap:      ${expected_spending - spending_met:,.0f}")

# Check 2: TFSA contributions are happening
expected_tfsa_contrib = profile['tfsa_contribution_each'] * 2
if abs(total_tfsa_contrib - expected_tfsa_contrib) < 100:
    print(f"\n✅ CHECK 2 PASSED: TFSA contributions correct")
    print(f"   Expected: ${expected_tfsa_contrib:,.0f}")
    print(f"   Actual:   ${total_tfsa_contrib:,.0f}")
else:
    print(f"\n❌ CHECK 2 FAILED: TFSA contributions incorrect")
    print(f"   Expected: ${expected_tfsa_contrib:,.0f}")
    print(f"   Actual:   ${total_tfsa_contrib:,.0f}")

# Check 3: Total allocated = spending + TFSA contributions
total_allocated = spending_met + total_tfsa_contrib
expected_total = expected_spending + expected_tfsa_contrib
if abs(total_allocated - expected_total) < 100:
    print(f"\n✅ CHECK 3 PASSED: Total allocation correct")
    print(f"   Spending + TFSA = ${total_allocated:,.0f}")
    print(f"   Expected:         ${expected_total:,.0f}")
else:
    print(f"\n❌ CHECK 3 FAILED: Total allocation incorrect")
    print(f"   Spending + TFSA = ${total_allocated:,.0f}")
    print(f"   Expected:         ${expected_total:,.0f}")

# Check 4: No spending gap
if spending_gap < 10:
    print(f"\n✅ CHECK 4 PASSED: No spending gap")
    print(f"   Gap: ${spending_gap:,.0f}")
else:
    print(f"\n❌ CHECK 4 FAILED: Spending gap exists")
    print(f"   Gap: ${spending_gap:,.0f}")

print("\n" + "=" * 100)
all_checks_passed = (
    abs(spending_met - expected_spending) < 100 and
    abs(total_tfsa_contrib - expected_tfsa_contrib) < 100 and
    abs(total_allocated - expected_total) < 100 and
    spending_gap < 10
)

if all_checks_passed:
    print("✅ ALL CHECKS PASSED!")
    print("✅ TFSA contributions are correctly IN ADDITION to spending target!")
else:
    print("❌ SOME CHECKS FAILED - Review output above")

print("=" * 100)
