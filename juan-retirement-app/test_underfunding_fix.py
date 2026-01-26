"""
Quick test to verify that the minimize-income strategy no longer underfunds retirement.

This test runs the Rafael & Lucy scenario and verifies that Year 2025 has NO underfunding.
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

# Create household
household = Household(
    p1=rafael,
    p2=lucy,
    province="AB",
    start_year=2025,
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
print("UNDERFUNDING FIX TEST")
print("=" * 80)
print(f"\nScenario: Rafael & Lucy")
print(f"Strategy: minimize-income")
print(f"Spending Target Year 1: ${household.spending_go_go:,.0f}")
print(f"\nRunning simulation...")

# Load tax config
tax_config = load_tax_config('tax_config_canada_2025.json')

# Run simulation
results = simulate(household, tax_config)

# Check Year 2025 (first year)
year_2025 = results.iloc[0]

print(f"\n{'─'*80}")
print(f"YEAR 2025 RESULTS:")
print(f"{'─'*80}")
print(f"  Spending Target:       ${year_2025['spend_target_after_tax']:,.0f}")

# Calculate total inflows (CPP + OAS for both)
total_inflows = year_2025['cpp_p1'] + year_2025['oas_p1'] + year_2025['cpp_p2'] + year_2025['oas_p2']
print(f"  Gov Benefits (CPP+OAS): ${total_inflows:,.0f}")

# Get total withdrawals (already calculated in results)
total_withdrawals = year_2025['total_withdrawals']
print(f"  Total Withdrawals:      ${total_withdrawals:,.0f}")

# Get underfunding amount (should be ~0 after fix)
underfunding = year_2025['underfunded_after_tax']
is_underfunded = year_2025['is_underfunded']

print(f"  Is Underfunded:         {is_underfunded}")
print(f"  Underfunding Amount:    ${underfunding:,.0f}")

if not is_underfunded and abs(underfunding) < 100:
    print(f"\n✅ SUCCESS: Spending is fully funded (underfunding = ${underfunding:.0f})")
    print(f"\n{'='*80}")
    print(f"✅ FIX VERIFIED: The minimize-income strategy now funds retirement FIRST")
    print(f"{'='*80}")
    exit(0)
else:
    print(f"\n❌ FAILED: Underfunding detected!")
    print(f"  Underfunding: ${underfunding:,.0f}")
    print(f"\n{'='*80}")
    print(f"❌ FIX DID NOT WORK: The strategy is still underfunding retirement")
    print(f"{'='*80}")
    exit(1)
