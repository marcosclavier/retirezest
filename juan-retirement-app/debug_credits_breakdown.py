"""
Debug the tax engine to see exactly what credits it's calculating
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import (
    progressive_tax,
    compute_nonrefundable_credits,
    dividend_grossup_and_credit
)

# Load 2025 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Juan's income with NON-ELIGIBLE corporate dividends
age = 65
pension = 7_400
ordinary = 3_735
eligd = 5_810  # Only NonReg
noneligd = 81_740.02  # Corporate (80,287.52) + NonReg (1,452.50)
capg = 8_715

print("="*100)
print("DEBUG: FEDERAL TAX ENGINE BREAKDOWN")
print("="*100)

# Calculate dividend grossup and credits manually
elig_result = dividend_grossup_and_credit(fed_params, "eligible", eligd)
nonelig_result = dividend_grossup_and_credit(fed_params, "noneligible", noneligd)

print(f"\n📊 ELIGIBLE DIVIDEND CALCULATION:")
print(f"   Original amount:         ${eligd:>12,.2f}")
print(f"   Grossup rate:            {fed_params.dividend_grossup_eligible:>12.1%}")
print(f"   Grossed-up amount:       ${elig_result['gross_amount']:>12,.2f}")
print(f"   Credit rate:             {fed_params.dividend_credit_rate_eligible:>12.4%}")
print(f"   Dividend tax credit:     ${elig_result['credit']:>12,.2f}")

print(f"\n📊 NON-ELIGIBLE DIVIDEND CALCULATION:")
print(f"   Original amount:         ${noneligd:>12,.2f}")
print(f"   Grossup rate:            {fed_params.dividend_grossup_noneligible:>12.1%}")
print(f"   Grossed-up amount:       ${nonelig_result['gross_amount']:>12,.2f}")
print(f"   Credit rate:             {fed_params.dividend_credit_rate_noneligible:>12.4%}")
print(f"   Dividend tax credit:     ${nonelig_result['credit']:>12,.2f}")

# Calculate taxable income
taxable_income = (
    ordinary +
    pension +
    (capg * 0.5) +
    elig_result['gross_amount'] +
    nonelig_result['gross_amount']
)

print(f"\n📊 TAXABLE INCOME:")
print(f"   Ordinary:                ${ordinary:>12,.2f}")
print(f"   Pension:                 ${pension:>12,.2f}")
print(f"   Capital gains (50%):     ${capg * 0.5:>12,.2f}")
print(f"   Elig div (grossed):      ${elig_result['gross_amount']:>12,.2f}")
print(f"   Non-elig div (grossed):  ${nonelig_result['gross_amount']:>12,.2f}")
print(f"   ────────────────────────────────────")
print(f"   TOTAL TAXABLE INCOME:    ${taxable_income:>12,.2f}")

# Calculate non-refundable credits
nonref_credits = compute_nonrefundable_credits(
    fed_params,
    age,
    taxable_income,  # Use taxable income for phaseout calculation
    pension
)

print(f"\n📊 NON-REFUNDABLE CREDITS:")
print(f"   Age amount phaseout threshold: ${fed_params.age_amount_phaseout_start:,.0f}")
print(f"   Taxable income: ${taxable_income:,.2f}")

# Calculate age credit with phaseout
if taxable_income > fed_params.age_amount_phaseout_start:
    excess = taxable_income - fed_params.age_amount_phaseout_start
    reduction = excess * fed_params.age_amount_phaseout_rate
    age_amount_after_phaseout = max(0, fed_params.age_amount - reduction)
    print(f"\n   Age amount BEFORE phaseout:  ${fed_params.age_amount:>12,.2f}")
    print(f"   Income over threshold:       ${excess:>12,.2f}")
    print(f"   Reduction (15% of excess):  -${reduction:>12,.2f}")
    print(f"   Age amount AFTER phaseout:   ${age_amount_after_phaseout:>12,.2f}")
    age_credit = age_amount_after_phaseout * fed_params.bpa_rate
else:
    age_credit = fed_params.age_amount * fed_params.bpa_rate

bpa_credit = fed_params.bpa_amount * fed_params.bpa_rate
pension_credit = min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate

print(f"\n   BPA credit:              ${bpa_credit:>12,.2f}")
print(f"   Age credit:              ${age_credit:>12,.2f}")
print(f"   Pension credit:          ${pension_credit:>12,.2f}")
print(f"   ────────────────────────────────────")
print(f"   Total non-refundable:    ${nonref_credits:>12,.2f}")

# Total credits
div_credits = elig_result['credit'] + nonelig_result['credit']
total_credits = nonref_credits + div_credits

print(f"\n📊 TOTAL FEDERAL CREDITS:")
print(f"   Non-refundable credits:  ${nonref_credits:>12,.2f}")
print(f"   Dividend credits:        ${div_credits:>12,.2f}")
print(f"   ────────────────────────────────────")
print(f"   TOTAL CREDITS:           ${total_credits:>12,.2f}")

# Now run the full tax engine to compare
fed_res = progressive_tax(
    fed_params, age,
    pension_income=pension,
    ordinary_income=ordinary,
    elig_dividends=eligd,
    nonelig_dividends=noneligd,
    cap_gains=capg,
    oas_received=0
)

print(f"\n📊 TAX ENGINE RESULT:")
print(f"   Taxable income:          ${fed_res['taxable_income']:>12,.2f}")
print(f"   Gross tax:               ${fed_res['gross_tax']:>12,.2f}")
print(f"   Total credits:           ${fed_res['total_credits']:>12,.2f}")
print(f"   Net tax:                 ${fed_res['net_tax']:>12,.2f}")

print(f"\n✅ CREDITS MATCH: {abs(total_credits - fed_res['total_credits']) < 0.01}")
print("="*100)
