"""
Call the tax engine directly with the exact inputs from the simulation
This will show us exactly what the tax engine calculates vs our manual calculation
"""

from modules.config import get_tax_params, load_tax_config
from modules.tax_engine import progressive_tax

# Load tax parameters
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed, prov = get_tax_params(tax_cfg, 'AB')

# Income components (from the API data):
ordinary_income = 2700.0  # Interest only
pension_income = 10000.0  # RRIF + CPP
elig_dividends = 111331.93  # NR elig div (4200) + Corp div (107131.93)
nonelig_dividends = 1050.0  # NR non-elig div
cap_gains = 6300.0  # NR capital gains realized
oas_received = 0.0  # No OAS
age = 65

print("=" * 120)
print("CALLING TAX ENGINE DIRECTLY")
print("=" * 120)
print()

print("INPUT VALUES:")
print("-" * 120)
print(f"  Age:                             {age}")
print(f"  Ordinary Income (interest):      ${ordinary_income:>18,.2f}")
print(f"  Pension Income (RRIF + CPP):     ${pension_income:>18,.2f}")
print(f"  Eligible Dividends:              ${elig_dividends:>18,.2f}")
print(f"  Non-Eligible Dividends:          ${nonelig_dividends:>18,.2f}")
print(f"  Capital Gains (realized):        ${cap_gains:>18,.2f}")
print(f"  OAS Received:                    ${oas_received:>18,.2f}")
print()

# Call federal tax engine
print("=" * 120)
print("FEDERAL TAX CALCULATION (via tax engine)")
print("=" * 120)
print()

res_fed = progressive_tax(
    fed,
    age=age,
    ordinary_income=ordinary_income,
    elig_dividends=elig_dividends,
    nonelig_dividends=nonelig_dividends,
    cap_gains=cap_gains,
    pension_income=pension_income,
    oas_received=oas_received,
)

print("FEDERAL RESULTS:")
print("-" * 120)
for key, value in sorted(res_fed.items()):
    if isinstance(value, (int, float)):
        if 'rate' in key:
            print(f"  {key:35s} {value:>18.4%}")
        else:
            print(f"  {key:35s} ${value:>18,.2f}")
    else:
        print(f"  {key:35s} {value}")
print()

# Call provincial tax engine
print("=" * 120)
print("ALBERTA PROVINCIAL TAX CALCULATION (via tax engine)")
print("=" * 120)
print()

res_prov = progressive_tax(
    prov,
    age=age,
    ordinary_income=ordinary_income,
    elig_dividends=elig_dividends,
    nonelig_dividends=nonelig_dividends,
    cap_gains=cap_gains,
    pension_income=pension_income,
    oas_received=oas_received,
)

print("ALBERTA RESULTS:")
print("-" * 120)
for key, value in sorted(res_prov.items()):
    if isinstance(value, (int, float)):
        if 'rate' in key:
            print(f"  {key:35s} {value:>18.4%}")
        else:
            print(f"  {key:35s} ${value:>18,.2f}")
    else:
        print(f"  {key:35s} {value}")
print()

# Summary
print("=" * 120)
print("SUMMARY")
print("=" * 120)
print()

print(f"  Taxable Income:                  ${res_fed['taxable_income']:>18,.2f}")
print()
print(f"  Federal Tax:                     ${res_fed['net_tax']:>18,.2f}")
print(f"  Alberta Tax:                     ${res_prov['net_tax']:>18,.2f}")
print(f"  " + "-" * 70)
print(f"  TOTAL TAX (Person 1):            ${res_fed['net_tax'] + res_prov['net_tax']:>18,.2f}")
print()
print(f"  Expected from API:               ${9886.10:>18,.2f}")
print(f"  Difference:                      ${(res_fed['net_tax'] + res_prov['net_tax']) - 9886.10:>18,.2f}")
print()

# Detailed breakdown
print("=" * 120)
print("DETAILED TAX BREAKDOWN")
print("=" * 120)
print()

print("FEDERAL:")
print(f"  Gross Tax (before credits):      ${res_fed['gross_tax']:>18,.2f}")
print(f"  Total Credits:                   ${res_fed['total_credits']:>18,.2f}")
print(f"  Tax After Credits:               ${res_fed['tax_after_credits']:>18,.2f}")
print(f"  OAS Clawback:                    ${res_fed['oas_clawback']:>18,.2f}")
print(f"  Net Tax (final):                 ${res_fed['net_tax']:>18,.2f}")
print()

print("ALBERTA:")
print(f"  Gross Tax (before credits):      ${res_prov['gross_tax']:>18,.2f}")
print(f"  Total Credits:                   ${res_prov['total_credits']:>18,.2f}")
print(f"  Tax After Credits:               ${res_prov['tax_after_credits']:>18,.2f}")
print(f"  OAS Clawback:                    ${res_prov['oas_clawback']:>18,.2f}")
print(f"  Net Tax (final):                 ${res_prov['net_tax']:>18,.2f}")
print()
