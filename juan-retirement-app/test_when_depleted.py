"""
Test to identify EXACTLY when accounts become depleted
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

print("="* 80)
print("TRACKING WHEN ACCOUNTS BECOME DEPLETED")
print("=" * 80)

# Load tax config and run simulation
tax_config = load_tax_config('tax_config_canada_2025.json')
results = simulate(household, tax_config)

print(f"\nInitial balances:")
print(f"  Rafael: TFSA=$312,000 RRIF=$350,000 NonReg=$330,000")
print(f"  Lucy:   TFSA=$114,000 RRIF=$22,000 NonReg=$183,000")
print(f"  Total:  $1,311,000")

print(f"\n{'='*80}")
print("YEAR-BY-YEAR BALANCE TRACKING")
print(f"{'='*80}\n")

prev_total = 312000 + 350000 + 330000 + 114000 + 22000 + 183000

for idx, row in results.iterrows():
    year = int(row['year'])

    # Get EOY account balances
    tfsa_p1 = row.get('tfsa_balance_p1', 0)
    tfsa_p2 = row.get('tfsa_balance_p2', 0)
    rrif_p1 = row.get('rrif_balance_p1', 0)
    rrif_p2 = row.get('rrif_balance_p2', 0)
    nonreg_p1 = row.get('nonreg_balance_p1', 0)
    nonreg_p2 = row.get('nonreg_balance_p2', 0)

    total_eoy = tfsa_p1 + tfsa_p2 + rrif_p1 + rrif_p2 + nonreg_p1 + nonreg_p2

    # Get withdrawals
    wd_tfsa_p1 = row.get('withdraw_tfsa_p1', 0)
    wd_tfsa_p2 = row.get('withdraw_tfsa_p2', 0)
    wd_rrif_p1 = row.get('withdraw_rrif_p1', 0)
    wd_rrif_p2 = row.get('withdraw_rrif_p2', 0)
    wd_nonreg_p1 = row.get('withdraw_nonreg_p1', 0)
    wd_nonreg_p2 = row.get('withdraw_nonreg_p2', 0)

    total_withdrawals = wd_tfsa_p1 + wd_tfsa_p2 + wd_rrif_p1 + wd_rrif_p2 + wd_nonreg_p1 + wd_nonreg_p2

    # Calculate expected EOY balance
    # BOY balance - withdrawals + growth (assume 5% return)
    expected_growth = prev_total * 0.05
    expected_eoy = prev_total - total_withdrawals + expected_growth

    print(f"Year {year}:")
    print(f"  BOY Total:        ${prev_total:>12,.0f} (estimated)")
    print(f"  Withdrawals:      ${total_withdrawals:>12,.0f}")
    print(f"  Expected Growth:  ${expected_growth:>12,.0f} (5% return)")
    print(f"  Expected EOY:     ${expected_eoy:>12,.0f}")
    print(f"  Actual EOY:       ${total_eoy:>12,.0f}")
    print(f"  Difference:       ${total_eoy - expected_eoy:>12,.0f}")

    if total_eoy < 100 and prev_total > 100:
        print(f"\n  ⚠️  ACCOUNTS DEPLETED IN YEAR {year}!")
        print(f"     BOY: ${prev_total:,.0f} → EOY: ${total_eoy:,.0f}")
        break

    prev_total = total_eoy

    if year >= 2035:
        break

print(f"\n{'='*80}")
