#!/usr/bin/env python3
"""
Tax Analysis Script
Analyzes the tax data from the simulation to verify the 5.7% effective tax rate
"""

# Data from the table (Year, Taxable Inc P1, Taxable Inc P2, Total Tax)
data = [
    (2026, 76057.68, 19611.89, 9742.47),
    (2027, 74857.28, 16440.41, 9259.63),
    (2028, 73568.08, 2526.17, 8765.02),
    (2029, 72182.44, 6415.62, 8257.03),
    (2030, 64526.25, 6416.13, 5622.13),
    (2031, 64190.47, 6479.33, 5248.54),
    (2032, 63893.90, 6545.86, 4883.51),
    (2033, 63635.90, 6615.87, 4556.31),
    (2034, 63491.94, 6689.36, 4312.04),
    (2035, 63556.42, 6766.31, 4126.71),
    (2036, 63612.39, 6846.73, 3944.55),
    (2037, 63655.56, 6930.63, 3764.68),
    (2038, 63846.43, 7018.01, 3633.64),
    (2039, 64683.78, 7108.88, 3694.58),
    (2040, 64174.67, 7203.25, 3372.25),
    (2041, 65143.72, 7301.13, 3441.52),
    (2042, 66106.26, 7402.54, 3511.14),
    (2043, 67047.71, 7507.50, 3577.24),
    (2044, 67954.96, 7616.01, 3636.44),
    (2045, 68837.89, 7728.12, 3692.02),
    (2046, 69691.77, 7843.83, 3743.03),
    (2047, 70516.04, 7963.18, 3789.76),
    (2048, 71271.25, 8092.68, 3821.32),
    (2049, 70138.37, 8252.26, 3327.67),
    (2050, 67990.47, 8413.86, 2622.85),
    (2051, 66166.27, 8578.85, 2070.29),
    (2052, 64585.80, 8747.24, 1596.94),
    (2053, 63192.13, 8918.58, 1188.02),
    (2054, 61936.98, 9092.50, 831.15),
]

# Calculate totals
total_tax_paid = sum(row[3] for row in data)
total_taxable_income = sum(row[1] + row[2] for row in data)

# Calculate effective tax rate
effective_tax_rate = (total_tax_paid / total_taxable_income) * 100

print("=" * 70)
print("TAX ANALYSIS SUMMARY")
print("=" * 70)
print(f"\nTotal Years Analyzed: {len(data)}")
print(f"Total Tax Paid: ${total_tax_paid:,.2f}")
print(f"Total Taxable Income: ${total_taxable_income:,.2f}")
print(f"\nCalculated Effective Tax Rate: {effective_tax_rate:.2f}%")
print(f"Expected Rate (from UI): 5.7%")
print(f"Difference: {abs(effective_tax_rate - 5.7):.2f} percentage points")
print("=" * 70)

# Analyze by period
print("\n" + "=" * 70)
print("TAX RATE BY PERIOD")
print("=" * 70)

periods = [
    ("Early Years (2026-2030)", data[0:5]),
    ("Middle Years (2031-2040)", data[5:15]),
    ("Later Years (2041-2054)", data[15:])
]

for period_name, period_data in periods:
    period_tax = sum(row[3] for row in period_data)
    period_income = sum(row[1] + row[2] for row in period_data)
    period_rate = (period_tax / period_income) * 100 if period_income > 0 else 0

    print(f"\n{period_name}:")
    print(f"  Years: {len(period_data)}")
    print(f"  Total Tax: ${period_tax:,.2f}")
    print(f"  Total Income: ${period_income:,.2f}")
    print(f"  Effective Rate: {period_rate:.2f}%")

# Analyze P2's contribution over time
print("\n" + "=" * 70)
print("PERSON 2 TAXABLE INCOME ANALYSIS")
print("=" * 70)

early_p2_avg = sum(row[2] for row in data[0:5]) / 5
late_p2_avg = sum(row[2] for row in data[15:]) / len(data[15:])

print(f"\nEarly Years P2 Avg Taxable Income: ${early_p2_avg:,.2f}")
print(f"Late Years P2 Avg Taxable Income: ${late_p2_avg:,.2f}")
print(f"Change: {((late_p2_avg - early_p2_avg) / early_p2_avg * 100):.1f}%")

# Year-by-year effective rates
print("\n" + "=" * 70)
print("YEAR-BY-YEAR EFFECTIVE TAX RATES")
print("=" * 70)
print(f"\n{'Year':<8} {'Taxable Inc':<15} {'Tax Paid':<12} {'Rate':<8}")
print("-" * 50)

for year, inc_p1, inc_p2, tax in data:
    total_inc = inc_p1 + inc_p2
    rate = (tax / total_inc * 100) if total_inc > 0 else 0
    print(f"{year:<8} ${total_inc:>12,.0f}  ${tax:>10,.0f}  {rate:>6.2f}%")

print("\n" + "=" * 70)
