#!/usr/bin/env python3
"""
Calculate the maximum income cutoff where GIS becomes zero for single person.
"""

# 2026 GIS values
threshold_single = 21768  # Income threshold where clawback starts
max_benefit_single = 13265.16  # Maximum annual GIS benefit
clawback_rate = 0.50  # 50% clawback rate

# Calculate income level where GIS becomes zero
# GIS = max_benefit - (income - threshold) * clawback_rate
# 0 = max_benefit - (income - threshold) * clawback_rate
# (income - threshold) * clawback_rate = max_benefit
# income - threshold = max_benefit / clawback_rate
# income = threshold + (max_benefit / clawback_rate)

income_cutoff = threshold_single + (max_benefit_single / clawback_rate)

print("GIS Income Cutoff Calculation for Single Person (2026)")
print("=" * 60)
print(f"Threshold (clawback starts): ${threshold_single:,.2f}")
print(f"Maximum GIS benefit: ${max_benefit_single:,.2f}/year")
print(f"Clawback rate: {clawback_rate * 100:.0f}%")
print(f"\nIncome where GIS = $0: ${income_cutoff:,.2f}")
print(f"\nThis means:")
print(f"- Income below ${threshold_single:,}: Full GIS of ${max_benefit_single:,.2f}/year")
print(f"- Income ${threshold_single:,} to ${income_cutoff:,.0f}: Partial GIS (reduced by 50% of excess)")
print(f"- Income above ${income_cutoff:,.0f}: No GIS")

# Verify Rafael's case
rafael_income = 40492
if rafael_income < threshold_single:
    rafael_gis = max_benefit_single
elif rafael_income < income_cutoff:
    rafael_gis = max_benefit_single - (rafael_income - threshold_single) * clawback_rate
else:
    rafael_gis = 0

print(f"\nRafael's case:")
print(f"- Income: ${rafael_income:,}")
print(f"- GIS benefit: ${rafael_gis:,.2f}")
print(f"- Status: {'Receives partial GIS' if rafael_gis > 0 else 'No GIS'}")