"""
Verify the exact tax calculation for Juan & Daniela 2025
Address the discrepancy: why is tax $9,875 instead of ~$36,000?
"""

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax

# Load 2025 tax config
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Income breakdown for each person (from API analysis)
age = 65

# Based on the 5-year plan and NonReg yield analysis:
# RRIF: $10,000 (pension income)
# Corporate dividend: $107,073.01 (eligible)
# NonReg distributions: $14,250 broken down as:
#   - Interest (cash 2% + GIC 3.5%): ~$2,700
#   - Eligible dividends (2% of $210k investments): ~$4,200
#   - Non-eligible dividends (0.5% of $210k): ~$1,050
#   - Capital gains (3% of $210k): ~$6,300

pension = 10_000.00  # RRIF withdrawal
ordinary = 2_700.00  # Interest from NonReg cash + GIC
elig_div = 107_073.01 + 4_200.00  # Corporate + NonReg eligible div
nonelig_div = 1_050.00  # NonReg non-eligible div
cap_gains = 6_300.00  # NonReg capital gains
oas = 0.0

print("=" * 100)
print("DETAILED TAX VERIFICATION - JUAN/DANIELA 2025 (Per Person)")
print("=" * 100)
print()

print("INCOME COMPONENTS:")
print(f"  Pension (RRIF):              ${pension:>12,.2f}")
print(f"  Ordinary (Interest):         ${ordinary:>12,.2f}")
print(f"  Eligible Dividends:          ${elig_div:>12,.2f}")
print(f"    ├─ Corporate:              ${107_073.01:>12,.2f}")
print(f"    └─ NonReg:                 ${4_200.00:>12,.2f}")
print(f"  Non-Eligible Dividends:      ${nonelig_div:>12,.2f}")
print(f"  Capital Gains (actual):      ${cap_gains:>12,.2f}")
print(f"  OAS:                         ${oas:>12,.2f}")
print()

# Calculate federal tax
print("=" * 100)
print("FEDERAL TAX CALCULATION")
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

print(f"\nTaxable Income:              ${fed_result['taxable_income']:>12,.2f}")
print(f"  (includes grossup and inclusion)")
print()
print(f"Gross Tax:                   ${fed_result['gross_tax']:>12,.2f}")
print(f"Total Credits:               ${fed_result['total_credits']:>12,.2f}")
print(f"Tax After Credits:           ${fed_result['tax_after_credits']:>12,.2f}")
print(f"OAS Clawback:                ${fed_result['oas_clawback']:>12,.2f}")
print(f"{'─' * 80}")
print(f"NET FEDERAL TAX:             ${fed_result['net_tax']:>12,.2f}")
print()

# Calculate provincial tax
print("=" * 100)
print("ALBERTA PROVINCIAL TAX CALCULATION")
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

print(f"\nTaxable Income:              ${prov_result['taxable_income']:>12,.2f}")
print(f"Gross Tax:                   ${prov_result['gross_tax']:>12,.2f}")
print(f"Total Credits:               ${prov_result['total_credits']:>12,.2f}")
print(f"Tax After Credits:           ${prov_result['tax_after_credits']:>12,.2f}")
print(f"{'─' * 80}")
print(f"NET PROVINCIAL TAX:          ${prov_result['net_tax']:>12,.2f}")
print()

# Total
total_tax = fed_result['net_tax'] + prov_result['net_tax']
print("=" * 100)
print("TOTAL TAX (PER PERSON)")
print("=" * 100)
print(f"Federal Tax:                 ${fed_result['net_tax']:>12,.2f}")
print(f"Provincial Tax:              ${prov_result['net_tax']:>12,.2f}")
print(f"{'─' * 80}")
print(f"TOTAL TAX:                   ${total_tax:>12,.2f}")
print()
print(f"Expected from API:           ${9_875.18:>12,.2f}")
print(f"Difference:                  ${abs(total_tax - 9_875.18):>12,.2f}")
print()

if abs(total_tax - 9_875.18) < 1:
    print("✅ CALCULATION MATCHES API!")
else:
    print("❌ DISCREPANCY FOUND!")
    print()
    print("Investigating the difference...")

print()
print("=" * 100)
print("CREDIT BREAKDOWN")
print("=" * 100)

# Federal credits breakdown
print("\nFEDERAL CREDITS:")
bpa_fed = fed_params.bpa_amount * fed_params.bpa_rate
age_fed = fed_params.age_amount * fed_params.bpa_rate if age >= 65 else 0
pension_fed = min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate

print(f"  Basic Personal Amount:     ${bpa_fed:>12,.2f}")
print(f"    (${fed_params.bpa_amount:,.0f} × {fed_params.bpa_rate:.1%})")
print(f"  Age Amount:                ${age_fed:>12,.2f}")
print(f"    (${fed_params.age_amount:,.0f} × {fed_params.bpa_rate:.1%})")
print(f"  Pension Credit:            ${pension_fed:>12,.2f}")
print(f"    (${min(pension, fed_params.pension_credit_amount):,.0f} × {fed_params.pension_credit_rate:.1%})")

# Calculate dividend credits manually
elig_grossup = elig_div * fed_params.dividend_grossup_eligible
nonelig_grossup = nonelig_div * fed_params.dividend_grossup_noneligible
elig_cred_fed = elig_grossup * fed_params.dividend_credit_rate_eligible
nonelig_cred_fed = nonelig_grossup * fed_params.dividend_credit_rate_noneligible

print(f"  Eligible Div Credit:       ${elig_cred_fed:>12,.2f}")
print(f"    (Grossup ${elig_grossup:,.2f} × {fed_params.dividend_credit_rate_eligible:.4%})")
print(f"  Non-Elig Div Credit:       ${nonelig_cred_fed:>12,.2f}")
print(f"    (Grossup ${nonelig_grossup:,.2f} × {fed_params.dividend_credit_rate_noneligible:.4%})")
print(f"  {'─' * 70}")
print(f"  TOTAL FEDERAL CREDITS:     ${fed_result['total_credits']:>12,.2f}")

# Provincial credits breakdown
print("\nPROVINCIAL CREDITS:")
bpa_prov = prov_params.bpa_amount * prov_params.bpa_rate
age_prov = prov_params.age_amount * prov_params.bpa_rate if age >= 65 else 0
pension_prov = min(pension, prov_params.pension_credit_amount) * prov_params.pension_credit_rate

elig_cred_prov = elig_grossup * prov_params.dividend_credit_rate_eligible
nonelig_cred_prov = nonelig_grossup * prov_params.dividend_credit_rate_noneligible

print(f"  Basic Personal Amount:     ${bpa_prov:>12,.2f}")
print(f"    (${prov_params.bpa_amount:,.0f} × {prov_params.bpa_rate:.1%})")
print(f"  Age Amount:                ${age_prov:>12,.2f}")
print(f"    (${prov_params.age_amount:,.0f} × {prov_params.bpa_rate:.1%})")
print(f"  Pension Credit:            ${pension_prov:>12,.2f}")
print(f"    (${min(pension, prov_params.pension_credit_amount):,.0f} × {prov_params.pension_credit_rate:.1%})")
print(f"  Eligible Div Credit:       ${elig_cred_prov:>12,.2f}")
print(f"    (Grossup ${elig_grossup:,.2f} × {prov_params.dividend_credit_rate_eligible:.4%})")
print(f"  Non-Elig Div Credit:       ${nonelig_cred_prov:>12,.2f}")
print(f"    (Grossup ${nonelig_grossup:,.2f} × {prov_params.dividend_credit_rate_noneligible:.4%})")
print(f"  {'─' * 70}")
print(f"  TOTAL PROVINCIAL CREDITS:  ${prov_result['total_credits']:>12,.2f}")

print()
print("=" * 100)
print("HOUSEHOLD TOTAL (Both Persons)")
print("=" * 100)
print(f"Tax per person:              ${total_tax:>12,.2f}")
print(f"Household tax (×2):          ${total_tax * 2:>12,.2f}")
print()
print(f"Expected household total:    ${19_750.37:>12,.2f}")
print()
