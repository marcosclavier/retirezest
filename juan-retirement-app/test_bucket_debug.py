"""
Test to debug bucket initialization issue
"""

from modules.models import Person, Household
from modules.config import load_tax_config
import modules.simulation as sim
import sys

# Create Rafael (age 64) with simple balances
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

print("=" * 80)
print("BUCKET INITIALIZATION DEBUG")
print("=" * 80)

print(f"\nInitial Rafael balances:")
print(f"  nonreg_balance: ${rafael.nonreg_balance:,.0f}")
print(f"  nr_cash: ${getattr(rafael, 'nr_cash', 0):,.0f}")
print(f"  nr_gic: ${getattr(rafael, 'nr_gic', 0):,.0f}")
print(f"  nr_invest: ${getattr(rafael, 'nr_invest', 0):,.0f}")
print(f"  Bucket total: ${(getattr(rafael, 'nr_cash', 0) + getattr(rafael, 'nr_gic', 0) + getattr(rafael, 'nr_invest', 0)):,.0f}")

# Create simple household
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

# Patch simulate_year to add debug output
original_simulate_year = sim.simulate_year

def debug_simulate_year(person, *args, **kwargs):
    """Wrapper to debug bucket state before/after simulate_year"""
    bucket_total_before = person.nr_cash + person.nr_gic + person.nr_invest
    result = original_simulate_year(person, *args, **kwargs)
    bucket_total_after = person.nr_cash + person.nr_gic + person.nr_invest

    print(f"\n[DEBUG] simulate_year for {person.name}:", file=sys.stderr)
    print(f"  Buckets BEFORE: cash=${person.nr_cash:,.0f} gic=${person.nr_gic:,.0f} invest=${person.nr_invest:,.0f} total=${bucket_total_before:,.0f}", file=sys.stderr)
    print(f"  nonreg_balance BEFORE: ${kwargs.get('account_balances', {}).get('nonreg', person.nonreg_balance):,.0f}", file=sys.stderr)
    print(f"  Buckets AFTER: cash=${person.nr_cash:,.0f} gic=${person.nr_gic:,.0f} invest=${person.nr_invest:,.0f} total=${bucket_total_after:,.0f}", file=sys.stderr)
    print(f"  nonreg_balance AFTER: ${person.nonreg_balance:,.0f}", file=sys.stderr)

    return result

sim.simulate_year = debug_simulate_year

# Load tax config
tax_config = load_tax_config('tax_config_canada_2025.json')

# Run just year 2026
print(f"\n{'='*80}")
print("Running simulation for year 2026...")
print(f"{'='*80}")

results = sim.simulate(household, tax_config)

# Restore original
sim.simulate_year = original_simulate_year

print(f"\n{'='*80}")
print("YEAR 2026 RESULTS")
print(f"{'='*80}")

year_2026 = results.iloc[0]
print(f"  Rafael EOY balances:")
print(f"    end_rrif_p1:   ${year_2026['end_rrif_p1']:,.0f}")
print(f"    end_tfsa_p1:   ${year_2026['end_tfsa_p1']:,.0f}")
print(f"    end_nonreg_p1: ${year_2026['end_nonreg_p1']:,.0f}")
print(f"\n  Lucy EOY balances:")
print(f"    end_rrif_p2:   ${year_2026['end_rrif_p2']:,.0f}")
print(f"    end_tfsa_p2:   ${year_2026['end_tfsa_p2']:,.0f}")
print(f"    end_nonreg_p2: ${year_2026['end_nonreg_p2']:,.0f}")

print(f"\n  Total EOY: ${year_2026['net_worth_end']:,.0f}")

print(f"\n{'='*80}")
