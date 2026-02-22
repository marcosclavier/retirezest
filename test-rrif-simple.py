#!/usr/bin/env python3
"""
Simple direct test of RRIF frontload - imports modules directly
"""
import sys
sys.path.insert(0, '/Users/jrcb/Documents/RetireZest/retirezest/python-api')

from modules.models import Person, Household
from modules.simulation import simulate_year
from modules.config import get_tax_params

# Create test person
p1 = Person(
    name="Test Person",
    start_age=65,
    end_age=70,
    cpp_start_age=70,
    oas_start_age=70,
    cpp_amount=12502,
    oas_amount=8904,
    tfsa_balance=52500.0,
    rrsp_balance=0.0,
    rrif_balance=338100.0,
    nonreg_balance=154950.0,
    nonreg_acb=154950.0,
    corporate_balance=0.0,
    pension_incomes=[{"name": "Pension", "amount": 50000, "start_age": 65, "indexed_to_inflation": True}],
    other_incomes=[]
)

# Create household
hh = Household(
    province="ON",
    start_year=2031,
    spending_target=90000.0,
    strategy="rrif-frontload"
)

# Get tax params
fed, prov = get_tax_params("ON", 2031)

print("=" * 80)
print("DIRECT RRIF FRONTLOAD TEST")
print("=" * 80)
print(f"Person: {p1.name}, Age: 65")
print(f"RRIF Balance: ${p1.rrif_balance:,.0f}")
print(f"Strategy: {hh.strategy}")
print(f"Expected 15% withdrawal: ${p1.rrif_balance * 0.15:,.0f}")
print("=" * 80)

try:
    # Call simulate_year directly
    withdrawals, tax_detail, info = simulate_year(
        person=p1,
        age=65,
        after_tax_target=90000.0,
        fed=fed,
        prov=prov,
        rrsp_to_rrif=False,
        custom_withdraws={"nonreg": 0.0, "rrif": 0.0, "tfsa": 0.0, "corp": 0.0},
        strategy_name="rrif-frontload",
        hybrid_topup_amt=0.0,
        hh=hh,
        year=2031,
        tfsa_room=50000.0,
        tax_optimizer=None,
        pension_income=50000.0,
        other_income=0.0
    )

    print("\nRESULTS:")
    print(f"  RRIF Withdrawal: ${withdrawals['rrif']:,.0f}")
    print(f"  NonReg Withdrawal: ${withdrawals['nonreg']:,.0f}")
    print(f"  TFSA Withdrawal: ${withdrawals['tfsa']:,.0f}")
    print(f"  Corp Withdrawal: ${withdrawals['corp']:,.0f}")
    print(f"  Total Tax: ${tax_detail['tax']:,.0f}")

    expected = p1.rrif_balance * 0.15
    if abs(withdrawals['rrif'] - expected) / expected < 0.10:
        print(f"\n✅ SUCCESS: RRIF withdrawal matches expected 15%")
    else:
        print(f"\n❌ FAILED: RRIF withdrawal is ${withdrawals['rrif']:,.0f}, expected ${expected:,.0f}")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
