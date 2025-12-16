"""
Debug script to see exactly what the tax engine is calculating
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax
import json

# Load 2025 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Juan's income
age = 65
pension = 7_400
ordinary = 3_735
eligd = 86_097.52
noneligd = 1_452.50
capg = 8_715

print("="*100)
print("JUAN'S TAX CALCULATION - RAW ENGINE OUTPUT")
print("="*100)

# Call federal tax engine
fed_res = progressive_tax(
    fed_params, age,
    pension_income=pension,
    ordinary_income=ordinary,
    elig_dividends=eligd,
    nonelig_dividends=noneligd,
    cap_gains=capg,
    oas_received=0
)

print("\n📊 FEDERAL TAX ENGINE RESULTS:")
print(json.dumps(fed_res, indent=2, default=str))

print("\n🔍 KEY FEDERAL VALUES:")
print(f"   Taxable Income:      ${fed_res.get('taxable_income', 0):>12,.2f}")
print(f"   Gross Tax:           ${fed_res.get('gross_tax', 0):>12,.2f}")
print(f"   Total Credits:       ${fed_res.get('total_credits', 0):>12,.2f}")
print(f"   Tax After Credits:   ${fed_res.get('tax_after_credits', 0):>12,.2f}")
print(f"   OAS Clawback:        ${fed_res.get('oas_clawback', 0):>12,.2f}")
print(f"   NET TAX:             ${fed_res.get('net_tax', 0):>12,.2f}")

# Call provincial tax engine
prov_res = progressive_tax(
    prov_params, age,
    pension_income=pension,
    ordinary_income=ordinary,
    elig_dividends=eligd,
    nonelig_dividends=noneligd,
    cap_gains=capg,
    oas_received=0
)

print("\n📊 PROVINCIAL TAX ENGINE RESULTS:")
print(json.dumps(prov_res, indent=2, default=str))

print("\n🔍 KEY PROVINCIAL VALUES:")
print(f"   Taxable Income:      ${prov_res.get('taxable_income', 0):>12,.2f}")
print(f"   Gross Tax:           ${prov_res.get('gross_tax', 0):>12,.2f}")
print(f"   Total Credits:       ${prov_res.get('total_credits', 0):>12,.2f}")
print(f"   Tax After Credits:   ${prov_res.get('tax_after_credits', 0):>12,.2f}")
print(f"   NET TAX:             ${prov_res.get('net_tax', 0):>12,.2f}")

print("\n" + "="*100)
print("TOTAL TAX")
print("="*100)
print(f"   Federal:             ${fed_res.get('net_tax', 0):>12,.2f}")
print(f"   Provincial:          ${prov_res.get('net_tax', 0):>12,.2f}")
print(f"   ────────────────────────────────────")
print(f"   TOTAL:               ${fed_res.get('net_tax', 0) + prov_res.get('net_tax', 0):>12,.2f}")
print("="*100)
