#!/usr/bin/env python3
"""
Test GIS calculation with inflated values for 2040
"""

# Base 2026 values
base_single_threshold = 21768
base_single_max = 13265.16

# Years from 2026 to 2040
years = 14
inflation_rate = 0.02

# Calculate inflated values
inflation_factor = (1 + inflation_rate) ** years
inflated_threshold = base_single_threshold * inflation_factor
inflated_max_benefit = base_single_max * inflation_factor

print("GIS Values for 2040 (with 2% inflation from 2026)")
print("=" * 60)
print(f"Years of inflation: {years}")
print(f"Inflation factor: {inflation_factor:.4f}")
print()
print(f"Single person threshold:")
print(f"  2026: ${base_single_threshold:,}")
print(f"  2040: ${inflated_threshold:,.2f}")
print()
print(f"Single person max benefit:")
print(f"  2026: ${base_single_max:,}")
print(f"  2040: ${inflated_max_benefit:,.2f}")
print()

# Check what income would give $9k GIS in 2040
target_gis = 9000
# GIS = max_benefit - (income - threshold) * 0.5
# 9000 = inflated_max_benefit - (income - inflated_threshold) * 0.5
# (income - inflated_threshold) * 0.5 = inflated_max_benefit - 9000
# income = inflated_threshold + 2 * (inflated_max_benefit - 9000)

implied_income = inflated_threshold + 2 * (inflated_max_benefit - target_gis)
print(f"To receive ${target_gis:,} GIS in 2040:")
print(f"  Required GIS-eligible income: ${implied_income:,.2f}")
print()

# Check what debug showed
debug_income = 13459
debug_threshold = 28877
debug_benefit = 15651.10

print("Debug output analysis:")
print(f"  Income shown: ${debug_income:,}")
print(f"  Threshold shown: ${debug_threshold:,} (this matches inflated SINGLE threshold)")
print(f"  Benefit shown: ${debug_benefit:,.2f}")
print()

# If income is really $13,459 and threshold is $28,877
# Then income is BELOW threshold, so max benefit applies
print(f"With income ${debug_income:,} < threshold ${debug_threshold:,}:")
print(f"  GIS should be max benefit: ${inflated_max_benefit:,.2f}")
print(f"  Debug shows: ${debug_benefit:,.2f}")
print()

# Now check Rafael's actual situation
rafael_cpp = 12492
rafael_rrif_min = 28000  # Assuming minimum RRIF withdrawal
rafael_total_gis_income = rafael_cpp + rafael_rrif_min

print(f"Rafael's expected GIS income (2040):")
print(f"  CPP: ${rafael_cpp:,}")
print(f"  RRIF: ${rafael_rrif_min:,}")
print(f"  Total GIS-eligible: ${rafael_total_gis_income:,}")
print()

# Calculate GIS with correct income
if rafael_total_gis_income > inflated_threshold:
    clawback = (rafael_total_gis_income - inflated_threshold) * 0.5
    rafael_gis = max(0, inflated_max_benefit - clawback)
else:
    rafael_gis = inflated_max_benefit

print(f"Rafael's GIS with correct calculation:")
print(f"  Income ${rafael_total_gis_income:,} vs threshold ${inflated_threshold:,.2f}")
if rafael_total_gis_income > inflated_threshold:
    print(f"  Excess: ${rafael_total_gis_income - inflated_threshold:,.2f}")
    print(f"  Clawback: ${(rafael_total_gis_income - inflated_threshold) * 0.5:,.2f}")
print(f"  GIS benefit: ${rafael_gis:,.2f}")

# Check cutoff
cutoff = inflated_threshold + 2 * inflated_max_benefit
print(f"\nGIS cutoff for 2040: ${cutoff:,.2f}")
print(f"Rafael's income ${rafael_total_gis_income:,} {'exceeds' if rafael_total_gis_income > cutoff else 'is below'} cutoff")