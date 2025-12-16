"""
Test the bracket calculation directly
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import apply_tax_brackets

# Load 2025 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

taxable_income = 135977.45

print("="*100)
print("BRACKET CALCULATION TEST")
print("="*100)

print(f"\nTaxable Income: ${taxable_income:,.2f}")

print("\n📊 FEDERAL BRACKETS:")
for i, bracket in enumerate(fed_params.brackets):
    print(f"   Bracket {i}: threshold=${bracket.threshold}, rate={bracket.rate:.1%}")

# Calculate manually
print("\n🔢 MANUAL CALCULATION:")
tax_manual = 0.0
prev = 0.0

for i, bracket in enumerate(fed_params.brackets):
    if taxable_income <= prev:
        break

    # Get next threshold
    if i + 1 < len(fed_params.brackets):
        next_threshold = fed_params.brackets[i + 1].threshold
        if next_threshold is None:
            upper = taxable_income
        else:
            upper = next_threshold
    else:
        upper = taxable_income

    income_in_bracket = min(taxable_income, upper) - prev

    if income_in_bracket > 0:
        bracket_tax = income_in_bracket * bracket.rate
        tax_manual += bracket_tax
        print(f"   Bracket {i} ({prev:,.0f} - {upper:,.0f}): ${income_in_bracket:,.2f} × {bracket.rate:.1%} = ${bracket_tax:,.2f}")

    prev = upper

print(f"\n   TOTAL MANUAL TAX: ${tax_manual:,.2f}")

# Use tax engine function
tax_engine = apply_tax_brackets(taxable_income, fed_params.brackets)
print(f"\n   TAX ENGINE RESULT: ${tax_engine:,.2f}")

print(f"\n   DIFFERENCE: ${abs(tax_manual - tax_engine):,.2f}")

if abs(tax_manual - tax_engine) < 0.01:
    print("   ✅ MATCH!")
else:
    print("   ❌ MISMATCH!")

print("="*100)
