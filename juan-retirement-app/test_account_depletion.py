"""
Test to identify when accounts become depleted
"""

from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate

# Create Rafael (age 64)
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

# Create Lucy (age 62)
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
print("ACCOUNT DEPLETION ANALYSIS")
print("=" * 80)

# Load tax config and run simulation
tax_config = load_tax_config('tax_config_canada_2025.json')
results = simulate(household, tax_config)

print(f"\nTotal initial assets:")
print(f"  Rafael TFSA: ${rafael.tfsa_balance:,.0f}")
print(f"  Rafael RRIF: ${rafael.rrif_balance:,.0f}")
print(f"  Rafael NonReg: ${rafael.nonreg_balance:,.0f}")
print(f"  Lucy TFSA: ${lucy.tfsa_balance:,.0f}")
print(f"  Lucy RRIF: ${lucy.rrif_balance:,.0f}")
print(f"  Lucy NonReg: ${lucy.nonreg_balance:,.0f}")
print(f"  Total: ${rafael.tfsa_balance + rafael.rrif_balance + rafael.nonreg_balance + lucy.tfsa_balance + lucy.rrif_balance + lucy.nonreg_balance:,.0f}")

print(f"\n{'='*80}")
print("TRACKING ACCOUNT DEPLETION")
print(f"{'='*80}\n")

for idx, row in results.iterrows():
    year = int(row['year'])

    # Get account balances
    tfsa_p1 = row.get('tfsa_balance_p1', 0)
    tfsa_p2 = row.get('tfsa_balance_p2', 0)
    rrif_p1 = row.get('rrif_balance_p1', 0)
    rrif_p2 = row.get('rrif_balance_p2', 0)
    nonreg_p1 = row.get('nonreg_balance_p1', 0)
    nonreg_p2 = row.get('nonreg_balance_p2', 0)

    total_assets = tfsa_p1 + tfsa_p2 + rrif_p1 + rrif_p2 + nonreg_p1 + nonreg_p2

    # Get withdrawals
    wd_tfsa_p1 = row.get('withdraw_tfsa_p1', 0)
    wd_tfsa_p2 = row.get('withdraw_tfsa_p2', 0)
    wd_rrif_p1 = row.get('withdraw_rrif_p1', 0)
    wd_rrif_p2 = row.get('withdraw_rrif_p2', 0)
    wd_nonreg_p1 = row.get('withdraw_nonreg_p1', 0)
    wd_nonreg_p2 = row.get('withdraw_nonreg_p2', 0)
    total_withdrawals = wd_tfsa_p1 + wd_tfsa_p2 + wd_rrif_p1 + wd_rrif_p2 + wd_nonreg_p1 + wd_nonreg_p2

    # Check for account depletion
    depleted_accounts = []
    if tfsa_p1 < 100:
        depleted_accounts.append("Rafael TFSA")
    if tfsa_p2 < 100:
        depleted_accounts.append("Lucy TFSA")
    if rrif_p1 < 100:
        depleted_accounts.append("Rafael RRIF")
    if rrif_p2 < 100:
        depleted_accounts.append("Lucy RRIF")
    if nonreg_p1 < 100:
        depleted_accounts.append("Rafael NonReg")
    if nonreg_p2 < 100:
        depleted_accounts.append("Lucy NonReg")

    if depleted_accounts or year >= 2030:
        print(f"Year {year} (Age {int(row['age_p1'])}/{int(row['age_p2'])})")
        print(f"  Total Assets EOY: ${total_assets:,.0f}")
        print(f"  Total Withdrawals: ${total_withdrawals:,.0f}")

        if depleted_accounts:
            print(f"  ⚠️  DEPLETED: {', '.join(depleted_accounts)}")

        print(f"  Balances EOY:")
        print(f"    Rafael: TFSA=${tfsa_p1:,.0f} RRIF=${rrif_p1:,.0f} NonReg=${nonreg_p1:,.0f}")
        print(f"    Lucy:   TFSA=${tfsa_p2:,.0f} RRIF=${rrif_p2:,.0f} NonReg=${nonreg_p2:,.0f}")
        print()

        # Stop printing after all accounts are depleted
        if total_assets < 100:
            print(f"⚠️  ALL ACCOUNTS DEPLETED IN YEAR {year}")
            print(f"   Remaining years: {len(results) - idx - 1}")
            break

print(f"\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")

# Find first year with gap
years_with_gaps = results[results['underfunded_after_tax'] > 0]
if len(years_with_gaps) > 0:
    first_gap_year = int(years_with_gaps.iloc[0]['year'])
    first_gap_amount = years_with_gaps.iloc[0]['underfunded_after_tax']
    print(f"\nFirst year with gap > $0: {first_gap_year} (gap: ${first_gap_amount:,.0f})")

# Check if marked as underfunded
underfunded_years = results[results['is_underfunded'] == True]
if len(underfunded_years) > 0:
    print(f"Years marked as underfunded (gap > $5,000): {len(underfunded_years)}")
else:
    print(f"Years marked as underfunded (gap > $5,000): NONE")
    print(f"  → All gaps are under $5,000 tolerance threshold")

print(f"\n{'='*80}")
