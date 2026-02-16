#!/usr/bin/env python3
"""
Test to identify why Rafael gets $9k GIS with $52k taxable income.
"""

import sys
sys.path.append('/Users/jrcb/Documents/RetireZest/retirezest/webapp/python-api')

from modules.simulation import calculate_gis

# 2026 GIS configuration
gis_config_2026 = {
    "threshold_single": 21768,
    "threshold_couple": 28752,
    "max_benefit_single": 13265.16,
    "max_benefit_couple": 7956.00,
    "clawback_rate": 0.50,
}

print("Testing Rafael's GIS with different income interpretations")
print("=" * 70)

# Scenario 1: If $52K is the TAXABLE income (including OAS)
print("\nScenario 1: $52K is taxable income (includes OAS)")
print("-" * 50)
taxable_income = 52000
oas_amount = 9226
net_income_excl_oas = taxable_income - oas_amount  # GIS uses income EXCLUDING OAS
print(f"Taxable income: ${taxable_income:,}")
print(f"OAS amount: ${oas_amount:,}")
print(f"Net income for GIS (excl OAS): ${net_income_excl_oas:,}")

gis_1 = calculate_gis(
    net_income=net_income_excl_oas,
    age=67,
    gis_config=gis_config_2026,
    oas_amount=oas_amount,
    is_couple=False,
)

print(f"GIS benefit: ${gis_1:,.2f}")
print(f"Income vs threshold: ${net_income_excl_oas:,} vs ${gis_config_2026['threshold_single']:,}")
if net_income_excl_oas > 48298:
    print("✓ Income exceeds cutoff ($48,298) - should get $0 GIS")
else:
    clawback = max(0, (net_income_excl_oas - gis_config_2026['threshold_single']) * 0.5)
    expected = max(0, gis_config_2026['max_benefit_single'] - clawback)
    print(f"Expected GIS: ${expected:,.2f}")

# Scenario 2: If $52K already excludes OAS (direct GIS income)
print("\nScenario 2: $52K is GIS-eligible income (already excludes OAS)")
print("-" * 50)
gis_income = 52000
print(f"GIS-eligible income: ${gis_income:,}")

gis_2 = calculate_gis(
    net_income=gis_income,
    age=67,
    gis_config=gis_config_2026,
    oas_amount=9226,  # Still need OAS > 0 for eligibility
    is_couple=False,
)

print(f"GIS benefit: ${gis_2:,.2f}")
print(f"Income vs threshold: ${gis_income:,} vs ${gis_config_2026['threshold_single']:,}")
if gis_income > 48298:
    print("✓ Income exceeds cutoff ($48,298) - should get $0 GIS")
else:
    clawback = max(0, (gis_income - gis_config_2026['threshold_single']) * 0.5)
    expected = max(0, gis_config_2026['max_benefit_single'] - clawback)
    print(f"This would give partial GIS of ${expected:,.2f}")

# Scenario 3: Check if there's a calculation error with $9k GIS
print("\nScenario 3: Reverse-engineering $9K GIS")
print("-" * 50)
target_gis = 9000
# GIS = max_benefit - (income - threshold) * 0.5
# 9000 = 13265.16 - (income - 21768) * 0.5
# (income - 21768) * 0.5 = 13265.16 - 9000
# (income - 21768) * 0.5 = 4265.16
# income - 21768 = 8530.32
# income = 30298.32

implied_income = 21768 + ((13265.16 - target_gis) / 0.5)
print(f"To get ${target_gis:,} GIS, the GIS-eligible income would be: ${implied_income:,.2f}")
print(f"This is much lower than the stated $52K taxable income")

# Scenario 4: What if only part of income is GIS-eligible?
print("\nScenario 4: Breakdown of Rafael's likely income (2040)")
print("-" * 50)
cpp = 12492
rrif = 28000
oas = 9226
total_taxable = cpp + rrif + oas
gis_eligible = cpp + rrif  # OAS excluded from GIS calculation

print(f"CPP: ${cpp:,}")
print(f"RRIF: ${rrif:,}")
print(f"OAS: ${oas:,}")
print(f"Total taxable income: ${total_taxable:,}")
print(f"GIS-eligible income (excl OAS): ${gis_eligible:,}")

gis_4 = calculate_gis(
    net_income=gis_eligible,
    age=67,
    gis_config=gis_config_2026,
    oas_amount=oas,
    is_couple=False,
)

print(f"GIS benefit with this income: ${gis_4:,.2f}")
print(f"Note: This gives ~$3.9K GIS, not $9K")

print("\n" + "=" * 70)
print("CONCLUSION: There appears to be an error in the GIS calculation.")
print("With $52K taxable income, Rafael should receive $0 GIS.")
print("The $9K GIS suggests the calculation may be using incorrect income values.")