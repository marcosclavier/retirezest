#!/usr/bin/env python3
"""
Script to help you enter your exact household configuration and test it.
Run this and answer the prompts to configure your scenario.
"""

import sys
sys.path.insert(0, '/Users/jrcb/OpenAI Retirement')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config
import json

print("=" * 80)
print("CONFIGURATION CAPTURE - Please enter your household settings")
print("=" * 80)
print()

# Gather user input
print("PERSON 1 - ACCOUNT BALANCES")
print("-" * 80)
age = int(input("Age (e.g., 70): ") or "70")
rrif = float(input("RRIF Balance (e.g., 2300000): ") or "2300000")
tfsa = float(input("TFSA Balance (e.g., 826000): ") or "826000")
nonreg = float(input("Non-Reg Balance (e.g., 350000): ") or "350000")
acb = float(input("Non-Reg ACB / Cost Basis (e.g., 0): ") or "0")
corp = float(input("Corporate Account Balance (e.g., 0): ") or "0")

print()
print("SPENDING SETTINGS")
print("-" * 80)
go_go_spending = float(input("Go-Go Years Spending (e.g., 163000): ") or "163000")
go_go_end_age = int(input("Go-Go End Age (e.g., 74): ") or "74")
slow_go_spending = float(input("Slow-Go Years Spending (e.g., 120000): ") or "120000")
slow_go_end_age = int(input("Slow-Go End Age (e.g., 84): ") or "84")
no_go_spending = float(input("No-Go Years Spending (e.g., 80000): ") or "80000")

print()
print("OTHER SETTINGS")
print("-" * 80)
province = input("Province (e.g., ON): ") or "ON"
strategy = input("Withdrawal Strategy (e.g., RRIF->Corp->NonReg->TFSA): ") or "RRIF->Corp->NonReg->TFSA"
inflation = float(input("Inflation Rate (e.g., 0.02): ") or "0.02")

print()
print("YIELDS (as decimals, e.g., 0.03 for 3%)")
print("-" * 80)
yield_rrif = float(input("RRIF Growth Yield (e.g., 0.03): ") or "0.03")
yield_tfsa = float(input("TFSA Growth Yield (e.g., 0.03): ") or "0.03")
yield_nr_interest = float(input("Non-Reg Interest Yield (e.g., 0.01): ") or "0.01")
yield_nr_elig_div = float(input("Non-Reg Eligible Div Yield (e.g., 0.02): ") or "0.02")

print()
print("=" * 80)
print("CONFIGURATION SUMMARY")
print("=" * 80)
print(f"""
Person 1: Age {age}
  RRIF:              ${rrif:>15,.0f}
  TFSA:              ${tfsa:>15,.0f}
  Non-Reg:           ${nonreg:>15,.0f}
  Non-Reg ACB:       ${acb:>15,.0f}
  Corporate:         ${corp:>15,.0f}

Spending:
  Go-Go ({age}-{go_go_end_age}):      ${go_go_spending:>15,.0f}/year
  Slow-Go ({go_go_end_age+1}-{slow_go_end_age}):    ${slow_go_spending:>15,.0f}/year
  No-Go ({slow_go_end_age+1}+):       ${no_go_spending:>15,.0f}/year

Other:
  Province:          {province}
  Strategy:          {strategy}
  Inflation:         {inflation*100:.1f}%

Yields:
  RRIF:              {yield_rrif*100:.2f}%
  TFSA:              {yield_tfsa*100:.2f}%
  Non-Reg Interest:  {yield_nr_interest*100:.2f}%
  Non-Reg Div:       {yield_nr_elig_div*100:.2f}%
""")

confirm = input("Is this correct? (y/n): ").lower()
if confirm != 'y':
    print("Cancelled. Please run again.")
    sys.exit(1)

print()
print("=" * 80)
print("RUNNING SIMULATION")
print("=" * 80)
print()

# Load tax config
with open('tax_config_canada_2025.json', 'r') as f:
    tax_cfg = json.load(f)

# Create Person 1
p1 = Person(
    name='Person 1',
    start_age=age,
    rrif_balance=rrif,
    rrsp_balance=0,
    tfsa_balance=tfsa,
    nonreg_balance=nonreg,
    nonreg_acb=acb,
    corporate_balance=corp,
    corp_rdtoh=0,
    yield_rrif_growth=yield_rrif,
    yield_tfsa_growth=yield_tfsa,
    yield_nonreg_interest=yield_nr_interest,
    yield_nonreg_elig_div=yield_nr_elig_div,
    yield_nonreg_nonelig_div=0.0,
    yield_nonreg_capg=0.0,
    yield_nonreg_roc_pct=0.0,
    cpp_annual_at_start=0,
    oas_annual_at_start=0,
)

# Person 2 (empty)
p2 = Person(
    name='Person 2',
    start_age=age,
    rrif_balance=0,
    rrsp_balance=0,
    tfsa_balance=0,
    nonreg_balance=0,
    nonreg_acb=0,
    corporate_balance=0,
    corp_rdtoh=0,
)

# Create household
hh = Household(
    province=province,
    general_inflation=inflation,
    start_year=2025,
    end_age=95,
    spending_go_go=go_go_spending,
    go_go_end_age=go_go_end_age,
    spending_slow_go=slow_go_spending,
    slow_go_end_age=slow_go_end_age,
    spending_no_go=no_go_spending,
    spending_inflation=inflation,
    tfsa_contribution_each=0,
    income_split_rrif_fraction=0.0,
    strategy=strategy,
    gap_tolerance=5000,
    stop_on_fail=False,
    p1=p1,
    p2=p2,
    hybrid_rrif_topup_per_person=0,
)

# Run simulation
df = simulate(hh, tax_cfg)

print()
print("=" * 80)
print("2025 RESULTS")
print("=" * 80)

if not df.empty and 2025 in df['year'].values:
    row = df[df['year'] == 2025].iloc[0]

    rrif_w = row.get('withdraw_rrif_p1', 0)
    interest = row.get('nr_interest_p1', 0)
    elig_div = row.get('nr_elig_div_p1', 0)
    nonelig_div = row.get('nr_nonelig_div_p1', 0)
    tax = row.get('total_tax_after_split', 0)
    fed_tax = row.get('tax_fed_total_after_split', 0)
    prov_tax = row.get('tax_prov_total_after_split', 0)

    print(f"""
WITHDRAWALS & INCOME:
  RRIF Withdrawal:        ${rrif_w:>15,.2f}
  Interest Income:        ${interest:>15,.2f}
  Eligible Dividends:     ${elig_div:>15,.2f}
  Non-Eligible Dividends: ${nonelig_div:>15,.2f}

TAXES:
  Federal Tax:            ${fed_tax:>15,.2f}
  Provincial Tax:         ${prov_tax:>15,.2f}
  Total Tax:              ${tax:>15,.2f}

ANALYSIS:
""")

    dist_sum = interest + elig_div
    print(f"  Distribution Sum:       ${dist_sum:>15,.2f}")

    if abs(tax - dist_sum) < 1 and dist_sum > 1:
        print(f"\n  🔴 BUG CONFIRMED!")
        print(f"     Tax ({tax:.2f}) = Distribution Sum ({dist_sum:.2f})")
        print(f"     This is the exact bug pattern!")
    else:
        print(f"  Expected tax: ~$65,000 - $73,000 for ~$173,000 income")
        if tax < 30000:
            print(f"  ⚠️  Tax is low: ${tax:,.2f}")
        elif tax > 60000:
            print(f"  ✅ Tax appears reasonable: ${tax:,.2f}")

print()
print("=" * 80)
print("NEXT STEPS")
print("=" * 80)
print("""
1. If you see "BUG CONFIRMED" above, the bug is active in your scenario
2. If tax is too low or matches distributions, there's an issue
3. If you need to adjust spending to match a specific RRIF withdrawal:
   - Change go_go_spending and re-run this script
4. Share this output with me!
""")
