"""
Test to investigate underfunding gaps starting in year 2032 with minimize-income strategy.

This test runs the full simulation and analyzes when and why gaps start increasing.
"""

from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
import pandas as pd

# Create Rafael (age 64) - matches user's scenario
rafael = Person(
    name="Rafael",
    start_age=64,
    tfsa_balance=312000,
    rrif_balance=350000,
    rrsp_balance=0,
    nonreg_balance=330000,
    corporate_balance=0,
    cpp_annual_at_start=15300,
    cpp_start_age=65,
    oas_annual_at_start=8670,
    oas_start_age=65
)

# Create Lucy (age 62) - matches user's scenario
lucy = Person(
    name="Lucy",
    start_age=62,
    tfsa_balance=114000,
    rrif_balance=22000,
    rrsp_balance=0,
    nonreg_balance=183000,
    corporate_balance=0,
    cpp_annual_at_start=15918,
    cpp_start_age=65,
    oas_annual_at_start=9020,
    oas_start_age=65
)

# Create household starting in 2026
household = Household(
    p1=rafael,
    p2=lucy,
    province="AB",
    start_year=2026,
    end_age=95,
    spending_go_go=95000,
    spending_slow_go=76000,
    spending_no_go=57000,
    go_go_end_age=75,
    slow_go_end_age=85,
    general_inflation=0.02,
    spending_inflation=0.02
)
household.strategy = "minimize-income"

print("=" * 80)
print("INVESTIGATING UNDERFUNDING GAPS FROM 2032 ONWARDS")
print("=" * 80)
print(f"\nScenario: Rafael (64) & Lucy (62)")
print(f"Strategy: minimize-income")
print(f"Start Year: 2026")
print(f"\nRunning simulation...")

# Load tax config
tax_config = load_tax_config('tax_config_canada_2025.json')

# Run simulation
results = simulate(household, tax_config)

print(f"\nSimulation completed: {len(results)} years")
print(f"Years: {results['year'].min()} to {results['year'].max()}")

# Analyze underfunding across all years
print(f"\n{'='*80}")
print(f"UNDERFUNDING ANALYSIS")
print(f"{'='*80}")

underfunded_years = results[results['is_underfunded'] == True]
print(f"\nTotal underfunded years: {len(underfunded_years)} out of {len(results)}")

if len(underfunded_years) > 0:
    print(f"\nUnderfunded years: {underfunded_years['year'].tolist()}")
    print(f"Total underfunding: ${underfunded_years['underfunded_after_tax'].sum():,.0f}")
    print(f"Average gap: ${underfunded_years['underfunded_after_tax'].mean():,.0f}")
    print(f"Max gap: ${underfunded_years['underfunded_after_tax'].max():,.0f} in year {underfunded_years.loc[underfunded_years['underfunded_after_tax'].idxmax(), 'year']:.0f}")

# Focus on years 2032-2050
print(f"\n{'='*80}")
print(f"DETAILED ANALYSIS: YEARS 2032-2050")
print(f"{'='*80}")

years_2032_2050 = results[(results['year'] >= 2032) & (results['year'] <= 2050)].copy()

for idx, row in years_2032_2050.iterrows():
    year = int(row['year'])
    age_p1 = int(row['age_p1'])
    age_p2 = int(row['age_p2'])

    # Calculate total available
    gov_benefits = row['cpp_p1'] + row['oas_p1'] + row['gis_p1'] + row['cpp_p2'] + row['oas_p2'] + row['gis_p2']
    total_withdrawals = row['total_withdrawals']
    total_available = gov_benefits + total_withdrawals

    spending_target = row['spend_target_after_tax']
    gap = spending_target - total_available
    is_underfunded = row['is_underfunded']

    # Account balances
    tfsa_p1 = row.get('end_tfsa_p1', 0)
    tfsa_p2 = row.get('end_tfsa_p2', 0)
    rrif_p1 = row.get('end_rrif_p1', 0)
    rrif_p2 = row.get('end_rrif_p2', 0)
    nonreg_p1 = row.get('end_nonreg_p1', 0)
    nonreg_p2 = row.get('end_nonreg_p2', 0)

    total_assets = tfsa_p1 + tfsa_p2 + rrif_p1 + rrif_p2 + nonreg_p1 + nonreg_p2

    # Withdrawals
    wd_tfsa_p1 = row.get('withdraw_tfsa_p1', 0)
    wd_tfsa_p2 = row.get('withdraw_tfsa_p2', 0)
    wd_rrif_p1 = row.get('withdraw_rrif_p1', 0)
    wd_rrif_p2 = row.get('withdraw_rrif_p2', 0)
    wd_nonreg_p1 = row.get('withdraw_nonreg_p1', 0)
    wd_nonreg_p2 = row.get('withdraw_nonreg_p2', 0)

    print(f"\n{'─'*80}")
    print(f"YEAR {year} (Rafael {age_p1}, Lucy {age_p2})")
    print(f"{'─'*80}")
    print(f"  Spending Target:        ${spending_target:>10,.0f}")
    print(f"  Gov Benefits:           ${gov_benefits:>10,.0f}")
    print(f"  Total Withdrawals:      ${total_withdrawals:>10,.0f}")
    print(f"  Total Available:        ${total_available:>10,.0f}")
    print(f"  Gap:                    ${gap:>10,.0f}  {'❌ UNDERFUNDED' if is_underfunded else '✓ OK'}")

    print(f"\n  Account Balances (EOY):")
    print(f"    Rafael TFSA:          ${tfsa_p1:>10,.0f}")
    print(f"    Rafael RRIF:          ${rrif_p1:>10,.0f}")
    print(f"    Rafael NonReg:        ${nonreg_p1:>10,.0f}")
    print(f"    Lucy TFSA:            ${tfsa_p2:>10,.0f}")
    print(f"    Lucy RRIF:            ${rrif_p2:>10,.0f}")
    print(f"    Lucy NonReg:          ${nonreg_p2:>10,.0f}")
    print(f"    Total Assets:         ${total_assets:>10,.0f}")

    print(f"\n  Withdrawals:")
    print(f"    Rafael TFSA:          ${wd_tfsa_p1:>10,.0f}")
    print(f"    Rafael RRIF:          ${wd_rrif_p1:>10,.0f}")
    print(f"    Rafael NonReg:        ${wd_nonreg_p1:>10,.0f}")
    print(f"    Lucy TFSA:            ${wd_tfsa_p2:>10,.0f}")
    print(f"    Lucy RRIF:            ${wd_rrif_p2:>10,.0f}")
    print(f"    Lucy NonReg:          ${wd_nonreg_p2:>10,.0f}")

# Summary
print(f"\n{'='*80}")
print(f"SUMMARY")
print(f"{'='*80}")

years_with_gaps = results[results['underfunded_after_tax'] > 0]
if len(years_with_gaps) > 0:
    first_gap_year = int(years_with_gaps.iloc[0]['year'])
    print(f"\n✓ First year with gap: {first_gap_year}")
    print(f"✓ Years with gaps: {len(years_with_gaps)}")
    print(f"✓ Total cumulative gap: ${years_with_gaps['underfunded_after_tax'].sum():,.0f}")

    # Check if gaps are increasing
    gaps_2032 = years_2032_2050[years_2032_2050['underfunded_after_tax'] > 0]['underfunded_after_tax'].tolist()
    if len(gaps_2032) > 1:
        print(f"\n✓ Gaps in 2032-2050 range:")
        for i, (idx, row) in enumerate(years_2032_2050[years_2032_2050['underfunded_after_tax'] > 0].iterrows()):
            print(f"  Year {int(row['year'])}: ${row['underfunded_after_tax']:,.0f}")
else:
    print(f"\n✓ No underfunding detected!")

print(f"\n{'='*80}")
