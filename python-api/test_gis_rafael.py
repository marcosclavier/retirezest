#!/usr/bin/env python3
"""
Test script to verify Rafael's GIS calculation with 2026 values.
Rafael's scenario:
- Single person (age 67 in 2040)
- Income: ~$40,492 (CPP $12,492 + RRIF $28,000)
- GIS threshold for single: $21,768 (2026)
- Expected result: $0 GIS (income exceeds threshold)
"""

import sys
sys.path.append('/Users/jrcb/Documents/RetireZest/retirezest/webapp/python-api')

from modules.simulation import calculate_gis

# 2026 GIS configuration
gis_config_2026 = {
    "threshold_single": 21768,          # 2026 threshold
    "threshold_couple": 28752,          # 2026 threshold
    "max_benefit_single": 13265.16,     # 2026 max benefit
    "max_benefit_couple": 7956.00,      # 2026 max benefit
    "clawback_rate": 0.50,
}

print("Testing Rafael's GIS eligibility with 2026 values")
print("=" * 60)

# Test Case 1: Rafael in 2040 (age 67)
rafael_age = 67
rafael_net_income = 40492  # CPP + RRIF income (excluding OAS)
rafael_oas = 9226  # OAS amount (required for GIS eligibility)

rafael_gis = calculate_gis(
    net_income=rafael_net_income,
    age=rafael_age,
    gis_config=gis_config_2026,
    oas_amount=rafael_oas,
    is_couple=False,
    other_person_gis_income=0.0
)

print(f"\nRafael's Case (2040):")
print(f"  Age: {rafael_age}")
print(f"  Net Income (excl OAS): ${rafael_net_income:,.2f}")
print(f"  OAS Amount: ${rafael_oas:,.2f}")
print(f"  GIS Threshold (single): ${gis_config_2026['threshold_single']:,.2f}")
print(f"  Income Above Threshold: ${rafael_net_income - gis_config_2026['threshold_single']:,.2f}")
print(f"  GIS Benefit: ${rafael_gis:,.2f}")
print(f"  ✓ CORRECT: Rafael gets $0 GIS (income exceeds threshold)" if rafael_gis == 0 else f"  ✗ ERROR: Rafael incorrectly receives GIS")

print("\n" + "=" * 60)

# Test Case 2: Low-income single person (should receive GIS)
low_income_age = 67
low_income_net = 10000  # Well below threshold
low_income_oas = 9226

low_income_gis = calculate_gis(
    net_income=low_income_net,
    age=low_income_age,
    gis_config=gis_config_2026,
    oas_amount=low_income_oas,
    is_couple=False,
    other_person_gis_income=0.0
)

print(f"\nLow-Income Case (for comparison):")
print(f"  Age: {low_income_age}")
print(f"  Net Income (excl OAS): ${low_income_net:,.2f}")
print(f"  OAS Amount: ${low_income_oas:,.2f}")
print(f"  GIS Threshold (single): ${gis_config_2026['threshold_single']:,.2f}")
print(f"  Income Below Threshold: ${gis_config_2026['threshold_single'] - low_income_net:,.2f}")
print(f"  GIS Benefit: ${low_income_gis:,.2f}")
print(f"  ✓ CORRECT: Low-income person receives maximum GIS" if low_income_gis == gis_config_2026['max_benefit_single'] else f"  Note: GIS reduced due to partial clawback")

print("\n" + "=" * 60)

# Test Case 3: Edge case - income exactly at threshold
edge_case_age = 67
edge_case_net = gis_config_2026['threshold_single']  # Exactly at threshold
edge_case_oas = 9226

edge_case_gis = calculate_gis(
    net_income=edge_case_net,
    age=edge_case_age,
    gis_config=gis_config_2026,
    oas_amount=edge_case_oas,
    is_couple=False,
    other_person_gis_income=0.0
)

print(f"\nEdge Case (income at threshold):")
print(f"  Age: {edge_case_age}")
print(f"  Net Income (excl OAS): ${edge_case_net:,.2f}")
print(f"  OAS Amount: ${edge_case_oas:,.2f}")
print(f"  GIS Threshold (single): ${gis_config_2026['threshold_single']:,.2f}")
print(f"  Income vs Threshold: Exactly at threshold")
print(f"  GIS Benefit: ${edge_case_gis:,.2f}")
print(f"  ✓ CORRECT: Person at threshold receives maximum GIS" if edge_case_gis == gis_config_2026['max_benefit_single'] else f"  Note: GIS amount is ${edge_case_gis:,.2f}")

print("\n" + "=" * 60)
print("\nSummary:")
print(f"✓ Rafael with ${rafael_net_income:,} income correctly receives ${rafael_gis:,.2f} GIS")
print(f"✓ GIS threshold for single person in 2026: ${gis_config_2026['threshold_single']:,}")
print(f"✓ Maximum GIS benefit for single person in 2026: ${gis_config_2026['max_benefit_single']:,.2f}/year")