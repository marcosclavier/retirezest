"""
Simple test to print ALL year balances
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

# Load tax config and run simulation
tax_config = load_tax_config('tax_config_canada_2025.json')
results = simulate(household, tax_config)

print("=" * 80)
print("ALL YEARS BALANCES")
print("=" * 80)

for idx, row in results.iterrows():
    year = int(row['year'])
    total = row['end_rrif_p1'] + row['end_rrif_p2'] + row['end_tfsa_p1'] + row['end_tfsa_p2'] + row['end_nonreg_p1'] + row['end_nonreg_p2']

    print(f"Year {year}: EOY Total = ${total:>12,.0f}  " +
          f"(RRIF: ${row['end_rrif_p1'] + row['end_rrif_p2']:>10,.0f}, " +
          f"TFSA: ${row['end_tfsa_p1'] + row['end_tfsa_p2']:>10,.0f}, " +
          f"NonReg: ${row['end_nonreg_p1'] + row['end_nonreg_p2']:>10,.0f})")

    if year >= 2035:
        break

print("=" * 80)
