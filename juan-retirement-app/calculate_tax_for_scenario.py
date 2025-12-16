"""
Calculate exact tax for the 5-Year Withdrawal Plan scenario shown.

From the image:
- RRIF: $17,800 (household)
- NonReg: $37,765 (household)
- Corp: $171,263 (household)
- TFSA: $0

Assuming equal split between Juan & Daniela (both age 65, Alberta)
"""

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax

# Load 2025 tax config
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Per person amounts (household / 2)
age = 65
rrif_per_person = 17_800 / 2  # $8,900
corp_div_per_person = 171_263 / 2  # $85,631.50
nonreg_per_person = 37_765 / 2  # $18,882.50

# NonReg breakdown assumptions:
# Based on typical allocation: interest, eligible dividends, non-eligible dividends, capital gains
# For $18,882.50 in NonReg, estimate:
# - ~15% interest (from cash/GIC): $2,832
# - ~25% eligible dividends: $4,721
# - ~5% non-eligible dividends: $944
# - ~55% capital gains (actual gains, not inclusion): $10,386

ordinary = 2_832  # Interest from NonReg
elig_div = corp_div_per_person + 4_721  # Corporate + NonReg eligible
nonelig_div = 944  # NonReg non-eligible
cap_gains = 10_386  # NonReg capital gains
pension = rrif_per_person  # RRIF is pension income
oas = 0.0

print("=" * 100)
print("TAX CALCULATION FOR 5-YEAR WITHDRAWAL PLAN SCENARIO")
print("=" * 100)
print()
print("HOUSEHOLD WITHDRAWALS (from image):")
print(f"  RRIF:         ${17_800:>12,.2f}")
print(f"  NonReg:       ${37_765:>12,.2f}")
print(f"  Corporate:    ${171_263:>12,.2f}")
print(f"  TFSA:         ${0:>12,.2f}")
print(f"  Total:        ${226_828:>12,.2f}")
print()

print("=" * 100)
print("PER PERSON BREAKDOWN (assuming 50/50 split)")
print("=" * 100)
print()
print(f"RRIF withdrawal:           ${pension:>12,.2f}")
print(f"Corporate dividend:        ${corp_div_per_person:>12,.2f}")
print(f"NonReg total:              ${nonreg_per_person:>12,.2f}")
print(f"  ├─ Interest (est):       ${ordinary:>12,.2f}")
print(f"  ├─ Eligible div (est):   ${4_721:>12,.2f}")
print(f"  ├─ Non-elig div (est):   ${nonelig_div:>12,.2f}")
print(f"  └─ Capital gains (est):  ${cap_gains:>12,.2f}")
print()
print(f"Total eligible dividends:  ${elig_div:>12,.2f}")
print()

# Calculate federal tax
print("=" * 100)
print("FEDERAL TAX (per person)")
print("=" * 100)

fed_result = progressive_tax(
    fed_params, age,
    ordinary_income=ordinary,
    elig_dividends=elig_div,
    nonelig_dividends=nonelig_div,
    cap_gains=cap_gains,
    pension_income=pension,
    oas_received=oas
)

print(f"\nTaxable Income:            ${fed_result['taxable_income']:>12,.2f}")
print(f"Gross Tax:                 ${fed_result['gross_tax']:>12,.2f}")
print(f"Total Credits:             ${fed_result['total_credits']:>12,.2f}")
print(f"Tax After Credits:         ${fed_result['tax_after_credits']:>12,.2f}")
print(f"OAS Clawback:              ${fed_result['oas_clawback']:>12,.2f}")
print(f"{'─' * 80}")
print(f"NET FEDERAL TAX:           ${fed_result['net_tax']:>12,.2f}")
print()

# Calculate provincial tax
print("=" * 100)
print("ALBERTA PROVINCIAL TAX (per person)")
print("=" * 100)

prov_result = progressive_tax(
    prov_params, age,
    ordinary_income=ordinary,
    elig_dividends=elig_div,
    nonelig_dividends=nonelig_div,
    cap_gains=cap_gains,
    pension_income=pension,
    oas_received=oas
)

print(f"\nTaxable Income:            ${prov_result['taxable_income']:>12,.2f}")
print(f"Gross Tax:                 ${prov_result['gross_tax']:>12,.2f}")
print(f"Total Credits:             ${prov_result['total_credits']:>12,.2f}")
print(f"Tax After Credits:         ${prov_result['tax_after_credits']:>12,.2f}")
print(f"{'─' * 80}")
print(f"NET PROVINCIAL TAX:        ${prov_result['net_tax']:>12,.2f}")
print()

# Total per person
total_tax_per_person = fed_result['net_tax'] + prov_result['net_tax']

print("=" * 100)
print("TOTAL TAX (per person)")
print("=" * 100)
print(f"Federal Tax:               ${fed_result['net_tax']:>12,.2f}")
print(f"Provincial Tax:            ${prov_result['net_tax']:>12,.2f}")
print(f"{'─' * 80}")
print(f"TOTAL TAX:                 ${total_tax_per_person:>12,.2f}")
print()

# Household total
household_tax = total_tax_per_person * 2

print("=" * 100)
print("HOUSEHOLD TOTAL (both persons)")
print("=" * 100)
print(f"Tax per person:            ${total_tax_per_person:>12,.2f}")
print(f"Household tax (×2):        ${household_tax:>12,.2f}")
print()

# Calculate effective rate
total_withdrawals = 226_828
effective_rate = (household_tax / total_withdrawals) * 100

print(f"Total withdrawals:         ${total_withdrawals:>12,.2f}")
print(f"Effective tax rate:        {effective_rate:>12.2f}%")
print()

# After-tax cash
after_tax = total_withdrawals - household_tax
print(f"After-tax cash available:  ${after_tax:>12,.2f}")
print(f"Spending target:           ${200_000:>12,.2f}")
print(f"Surplus/(Shortfall):       ${after_tax - 200_000:>12,.2f}")
print()

print("=" * 100)
print("NOTES")
print("=" * 100)
print()
print("1. NonReg $37,765 breakdown is estimated based on typical asset allocation.")
print("   Actual breakdown depends on NonReg portfolio composition.")
print()
print("2. Corporate withdrawal of $171,263 is treated as eligible dividends.")
print()
print("3. RRIF withdrawal qualifies for pension income credit (max $2,000).")
print()
print("4. Age credit is phased out due to high taxable income.")
print()
print("5. Dividend tax credits significantly reduce the effective tax rate.")
