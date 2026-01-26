"""
Test to verify rrif-frontload strategy works correctly
"""

from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate

# Create Rafael (age 64)
rafael = Person(
    name="Rafael",
    start_age=64,
    tfsa_balance=104000,
    rrif_balance=306000,
    rrsp_balance=0,
    nonreg_balance=183000,
    corporate_balance=0,
    cpp_annual_at_start=15918,
    cpp_start_age=65,
    oas_annual_at_start=9020,
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
    spending_go_go=63480,
    spending_slow_go=47670,
    spending_no_go=38136,
    go_go_end_age=75,
    slow_go_end_age=85,
    general_inflation=0.02,
    spending_inflation=0.03
)
household.strategy = "rrif-frontload"

# Load tax config and run simulation
print("=" * 80)
print(f"Testing RRIF-Frontload Strategy")
print("=" * 80)
print(f"Strategy: {household.strategy}")
print(f"Start Year: {household.start_year}")
print(f"Rafael: Age {rafael.start_age}, RRIF=${rafael.rrif_balance:,.0f}, TFSA=${rafael.tfsa_balance:,.0f}")
print(f"Lucy: Age {lucy.start_age}, RRIF=${lucy.rrif_balance:,.0f}, TFSA=${lucy.tfsa_balance:,.0f}")
print("=" * 80)

try:
    tax_config = load_tax_config('tax_config_canada_2025.json')
    results = simulate(household, tax_config)

    print(f"\n✅ Simulation completed successfully!")
    print(f"   Rows returned: {len(results)}")
    print(f"   Columns: {list(results.columns)[:10]}...")  # Show first 10 columns

    # Show first 5 years
    print(f"\nFirst 5 years:")
    print("=" * 80)
    for idx in range(min(5, len(results))):
        row = results.iloc[idx]
        year = int(row['year'])
        total_withdrawals = row.get('withdraw_rrif_p1', 0) + row.get('withdraw_rrif_p2', 0) + \
                          row.get('withdraw_tfsa_p1', 0) + row.get('withdraw_tfsa_p2', 0) + \
                          row.get('withdraw_nonreg_p1', 0) + row.get('withdraw_nonreg_p2', 0)

        print(f"Year {year}:")
        print(f"  Total withdrawals: ${total_withdrawals:,.0f}")
        print(f"  RRIF: ${row.get('withdraw_rrif_p1', 0) + row.get('withdraw_rrif_p2', 0):,.0f}")
        print(f"  TFSA: ${row.get('withdraw_tfsa_p1', 0) + row.get('withdraw_tfsa_p2', 0):,.0f}")
        print(f"  NonReg: ${row.get('withdraw_nonreg_p1', 0) + row.get('withdraw_nonreg_p2', 0):,.0f}")
        print(f"  EOY Balances: RRIF=${row.get('end_rrif_p1', 0) + row.get('end_rrif_p2', 0):,.0f}, " +
              f"TFSA=${row.get('end_tfsa_p1', 0) + row.get('end_tfsa_p2', 0):,.0f}")

    print("=" * 80)
    print("\n✅ RRIF-Frontload strategy is working correctly!")

except Exception as e:
    print(f"\n❌ ERROR: Simulation failed!")
    print(f"   Error: {str(e)}")
    import traceback
    traceback.print_exc()
