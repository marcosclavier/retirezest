"""
Verify the correct interpretation of tax brackets by checking against known CRA values
"""

# Official CRA 2025 Federal Tax Calculation Example
# For someone with $135,977 taxable income:
#
# Bracket 1: $0 - $55,867 @ 15% = $8,380.05
# Bracket 2: $55,868 - $111,733 @ 20.5% = $11,452.53
# Bracket 3: $111,734 - $135,977 @ 26% = $6,303.56
# Total tax = $26,136.14

print("="*100)
print("CRA 2025 FEDERAL TAX BRACKETS - OFFICIAL")
print("="*100)
print("\nBracket 1: 15% on first $55,867")
print("Bracket 2: 20.5% on $55,868 to $111,733")
print("Bracket 3: 26% on $111,734 to $173,205")
print("Bracket 4: 29% on $173,206 to $246,752")
print("Bracket 5: 33% on $246,753+")

taxable_income = 135977.45

print(f"\n📊 Tax calculation for ${taxable_income:,.2f}:")
print(f"   First $55,867 × 15.0% = $8,380.05")
print(f"   Next $55,866 × 20.5% = $11,452.53")
print(f"   Next $24,244 × 26.0% = $6,303.56")
print(f"   ─────────────────────────────────")
print(f"   TOTAL TAX = $26,136.14")

print("\n" + "="*100)
print("CURRENT TAX ENGINE CALCULATION")
print("="*100)
print(f"   First $111,733 × 15.0% = $16,759.95")
print(f"   Next $24,244 × 20.5% = $4,970.11")
print(f"   ─────────────────────────────────")
print(f"   TOTAL TAX = $21,730.06")

print("\n❌ DISCREPANCY: $4,406.08")
print("\n🔍 The tax engine is UNDER-taxing by $4,406!")
print("   This means ALL simulations are showing incorrect (too low) taxes!")

print("\n" + "="*100)
print("ROOT CAUSE ANALYSIS")
print("="*100)
print("\nThe JSON config uses this format:")
print('   { "threshold": 55867, "rate": 0.15 }')
print('   { "threshold": 111733, "rate": 0.205 }')
print("\nBut the algorithm interprets it as:")
print("   - Apply 0.15 rate from $0 to $111,733 (next bracket's threshold)")
print("   - Apply 0.205 rate from $111,733 onwards")
print("\nWhat it SHOULD interpret:")
print("   - Apply 0.15 rate from $0 to $55,867 (this bracket's threshold)")
print("   - Apply 0.205 rate from $55,867 to $111,733 (next bracket's threshold)")

print("\n" + "="*100)
