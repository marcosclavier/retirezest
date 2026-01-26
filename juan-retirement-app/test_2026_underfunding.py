"""
Test for 2026 underfunding issue with minimize-income strategy.

This test runs Rafael (64) & Lucy (62) scenario starting in 2026,
which matches the user's screenshot showing a $9,624 gap.
"""

from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate

# Create Rafael (age 64) - matches screenshot
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

# Create Lucy (age 62) - matches screenshot
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

# Create household starting in 2026 (not 2025)
household = Household(
    p1=rafael,
    p2=lucy,
    province="AB",
    start_year=2026,  # User's webapp now defaults to 2026
    end_age=95,
    spending_go_go=95000,
    spending_slow_go=76000,
    spending_no_go=57000,
    go_go_end_age=75,
    slow_go_end_age=85,
    general_inflation=0.02,
    spending_inflation=0.02
)
household.strategy = "balanced"  # Test with balanced strategy

print("=" * 80)
print("2026 UNDERFUNDING TEST")
print("=" * 80)
print(f"\nScenario: Rafael (64) & Lucy (62)")
print(f"Strategy: minimize-income")
print(f"Start Year: 2026")
print(f"Spending Target Year 1: ${household.spending_go_go:,.0f}")
print(f"\nRunning simulation...")

# Load tax config
tax_config = load_tax_config('tax_config_canada_2025.json')

# Run simulation
results = simulate(household, tax_config)

# Check Year 2026 (first year) - Rafael age 64, Lucy age 62
year_2026 = results.iloc[0]

print(f"\n{'─'*80}")
print(f"YEAR 2026 RESULTS (Rafael 64, Lucy 62):")
print(f"{'─'*80}")
print(f"  Spending Target:        ${year_2026['spend_target_after_tax']:,.0f}")

# Calculate total inflows
total_inflows = (year_2026['cpp_p1'] + year_2026['oas_p1'] + year_2026['gis_p1'] +
                year_2026['cpp_p2'] + year_2026['oas_p2'] + year_2026['gis_p2'])
print(f"  Gov Benefits Total:     ${total_inflows:,.0f}")

# Get total withdrawals
total_withdrawals = year_2026['total_withdrawals']
print(f"  Total Withdrawals:      ${total_withdrawals:,.0f}")

# Calculate total available (gov benefits + withdrawals)
total_available = total_inflows + total_withdrawals
print(f"  Total Available:        ${total_available:,.0f}")

# Get underfunding amount
underfunding = year_2026['underfunded_after_tax']
is_underfunded = year_2026['is_underfunded']

print(f"\n  Is Underfunded:         {is_underfunded}")
print(f"  Underfunding Amount:    ${underfunding:,.0f}")

# Show individual account withdrawals
print(f"\n{'─'*80}")
print(f"WITHDRAWAL BREAKDOWN:")
print(f"{'─'*80}")
print(f"  Rafael RRIF:            ${year_2026.get('withdraw_rrif_p1', 0):,.0f}")
print(f"  Rafael TFSA:            ${year_2026.get('withdraw_tfsa_p1', 0):,.0f}")
print(f"  Rafael NonReg:          ${year_2026.get('withdraw_nonreg_p1', 0):,.0f}")
print(f"  Lucy RRIF:              ${year_2026.get('withdraw_rrif_p2', 0):,.0f}")
print(f"  Lucy TFSA:              ${year_2026.get('withdraw_tfsa_p2', 0):,.0f}")
print(f"  Lucy NonReg:            ${year_2026.get('withdraw_nonreg_p2', 0):,.0f}")

if not is_underfunded and abs(underfunding) < 100:
    print(f"\n✅ SUCCESS: Spending is fully funded (gap = ${underfunding:.0f})")
    print(f"\n{'='*80}")
    print(f"✅ TEST PASSED: Year 2026 is properly funded")
    print(f"{'='*80}")
    exit(0)
else:
    print(f"\n❌ FAILED: Underfunding detected!")
    print(f"  Gap: ${underfunding:,.0f}")
    print(f"  Expected: ~$0")
    print(f"  Actual: ${underfunding:,.0f}")
    print(f"\n{'='*80}")
    print(f"❌ TEST FAILED: Year 2026 has ${underfunding:,.0f} gap")
    print(f"{'='*80}")
    exit(1)
