"""
Detailed credit breakdown with NON-ELIGIBLE corporate dividends
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax

# Load 2025 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

print("="*100)
print("TAX CALCULATION WITH NON-ELIGIBLE CORPORATE DIVIDENDS")
print("="*100)

# Juan's income - treating corporate dividend as NON-ELIGIBLE
age = 65
pension = 7_400
ordinary = 3_735

# Split dividends correctly
corp_dividend = 80_287.52  # This is NON-ELIGIBLE
nr_elig_div = 5_810        # From NonReg account
nr_nonelig_div = 1_452.50  # From NonReg account

# Total dividends by type
eligd = nr_elig_div  # Only NonReg eligible dividends
noneligd = corp_dividend + nr_nonelig_div  # Corporate + NonReg non-eligible

capg = 8_715

print(f"\n📊 JUAN'S INCOME BREAKDOWN:")
print(f"   Pension (RRIF):                     ${pension:>12,.2f}")
print(f"   Ordinary (NonReg interest):         ${ordinary:>12,.2f}")
print(f"   Capital Gains (50% taxable):        ${capg:>12,.2f}")
print(f"\n   ELIGIBLE Dividends:")
print(f"     NonReg eligible div:              ${nr_elig_div:>12,.2f}")
print(f"     ───────────────────────────────────────────────")
print(f"     TOTAL ELIGIBLE:                   ${eligd:>12,.2f}")
print(f"\n   NON-ELIGIBLE Dividends:")
print(f"     Corporate dividend:               ${corp_dividend:>12,.2f}  ← NON-ELIGIBLE")
print(f"     NonReg non-eligible div:          ${nr_nonelig_div:>12,.2f}")
print(f"     ───────────────────────────────────────────────")
print(f"     TOTAL NON-ELIGIBLE:               ${noneligd:>12,.2f}")

# Calculate federal tax
fed_res = progressive_tax(
    fed_params, age,
    pension_income=pension,
    ordinary_income=ordinary,
    elig_dividends=eligd,
    nonelig_dividends=noneligd,
    cap_gains=capg,
    oas_received=0
)

# Calculate provincial tax
prov_res = progressive_tax(
    prov_params, age,
    pension_income=pension,
    ordinary_income=ordinary,
    elig_dividends=eligd,
    nonelig_dividends=noneligd,
    cap_gains=capg,
    oas_received=0
)

print("\n" + "="*100)
print("FEDERAL TAX CALCULATION")
print("="*100)

# Grossup calculations
elig_grossup = eligd * fed_params.dividend_grossup_eligible
nonelig_grossup = noneligd * fed_params.dividend_grossup_noneligible

print(f"\n1️⃣  TAXABLE INCOME:")
print(f"   Base income:                        ${pension + ordinary + (capg * 0.5):>12,.2f}")
print(f"   Eligible div grossup (38%):        +${elig_grossup:>12,.2f}")
print(f"   Non-elig div grossup (15%):        +${nonelig_grossup:>12,.2f}")
print(f"   ───────────────────────────────────────────────")
print(f"   TAXABLE INCOME:                     ${fed_res['taxable_income']:>12,.2f}")

print(f"\n2️⃣  GROSS TAX (Progressive Brackets):")
print(f"   Tax on ${fed_res['taxable_income']:,.2f}:       ${fed_res['gross_tax']:>12,.2f}")

print(f"\n3️⃣  FEDERAL TAX CREDITS (Detailed):")

# Calculate each credit component
bpa_credit = fed_params.bpa_amount * fed_params.bpa_rate
print(f"\n   A) Basic Personal Amount Credit:")
print(f"      Amount: ${fed_params.bpa_amount:>12,.2f}")
print(f"      Rate:   {fed_params.bpa_rate:>12.1%}")
print(f"      Credit: ${bpa_credit:>12,.2f}")

age_credit = fed_params.age_amount * fed_params.bpa_rate
print(f"\n   B) Age Amount Credit (65+):")
print(f"      Amount: ${fed_params.age_amount:>12,.2f}")
print(f"      Rate:   {fed_params.bpa_rate:>12.1%}")
print(f"      Credit: ${age_credit:>12,.2f}")

pension_credit = min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate
print(f"\n   C) Pension Income Credit:")
print(f"      Base:   ${min(pension, fed_params.pension_credit_amount):>12,.2f}  (max ${fed_params.pension_credit_amount:,.0f})")
print(f"      Rate:   {fed_params.pension_credit_rate:>12.1%}")
print(f"      Credit: ${pension_credit:>12,.2f}")

elig_div_credit = elig_grossup * fed_params.dividend_credit_rate_eligible
print(f"\n   D) Eligible Dividend Tax Credit:")
print(f"      Grossup:${elig_grossup:>12,.2f}  (${eligd:,.2f} × {fed_params.dividend_grossup_eligible:.0%})")
print(f"      Rate:   {fed_params.dividend_credit_rate_eligible:>12.4%}")
print(f"      Credit: ${elig_div_credit:>12,.2f}")

nonelig_div_credit = nonelig_grossup * fed_params.dividend_credit_rate_noneligible
print(f"\n   E) Non-Eligible Dividend Tax Credit:")
print(f"      Grossup:${nonelig_grossup:>12,.2f}  (${noneligd:,.2f} × {fed_params.dividend_grossup_noneligible:.0%})")
print(f"      Rate:   {fed_params.dividend_credit_rate_noneligible:>12.4%}")
print(f"      Credit: ${nonelig_div_credit:>12,.2f}")

total_fed_credits = bpa_credit + age_credit + pension_credit + elig_div_credit + nonelig_div_credit
print(f"\n   ───────────────────────────────────────────────")
print(f"   TOTAL FEDERAL CREDITS:              ${total_fed_credits:>12,.2f}")
print(f"   (Tax engine reports:                ${fed_res['total_credits']:>12,.2f})")

print(f"\n4️⃣  NET FEDERAL TAX:")
print(f"   Gross Tax:                          ${fed_res['gross_tax']:>12,.2f}")
print(f"   Less Credits:                      -${fed_res['total_credits']:>12,.2f}")
print(f"   ───────────────────────────────────────────────")
print(f"   NET FEDERAL TAX:                    ${fed_res['net_tax']:>12,.2f}")

print("\n" + "="*100)
print("ALBERTA PROVINCIAL TAX CALCULATION")
print("="*100)

print(f"\n1️⃣  TAXABLE INCOME:                    ${prov_res['taxable_income']:>12,.2f}")

print(f"\n2️⃣  GROSS TAX (Progressive Brackets):")
print(f"   Tax on ${prov_res['taxable_income']:,.2f}:       ${prov_res['gross_tax']:>12,.2f}")

print(f"\n3️⃣  PROVINCIAL TAX CREDITS (Detailed):")

# Provincial credits
prov_bpa_credit = prov_params.bpa_amount * prov_params.bpa_rate
print(f"\n   A) Basic Personal Amount Credit:")
print(f"      Amount: ${prov_params.bpa_amount:>12,.2f}")
print(f"      Rate:   {prov_params.bpa_rate:>12.1%}")
print(f"      Credit: ${prov_bpa_credit:>12,.2f}")

prov_age_credit = prov_params.age_amount * prov_params.bpa_rate
print(f"\n   B) Age Amount Credit (65+):")
print(f"      Amount: ${prov_params.age_amount:>12,.2f}")
print(f"      Rate:   {prov_params.bpa_rate:>12.1%}")
print(f"      Credit: ${prov_age_credit:>12,.2f}")

prov_pension_credit = min(pension, 1000) * prov_params.bpa_rate
print(f"\n   C) Pension Income Credit:")
print(f"      Base:   ${min(pension, 1000):>12,.2f}  (max $1,000 for AB)")
print(f"      Rate:   {prov_params.bpa_rate:>12.1%}")
print(f"      Credit: ${prov_pension_credit:>12,.2f}")

prov_elig_div_credit = elig_grossup * prov_params.dividend_credit_rate_eligible
print(f"\n   D) Eligible Dividend Tax Credit:")
print(f"      Grossup:${elig_grossup:>12,.2f}")
print(f"      Rate:   {prov_params.dividend_credit_rate_eligible:>12.4%}")
print(f"      Credit: ${prov_elig_div_credit:>12,.2f}")

prov_nonelig_div_credit = nonelig_grossup * prov_params.dividend_credit_rate_noneligible
print(f"\n   E) Non-Eligible Dividend Tax Credit:")
print(f"      Grossup:${nonelig_grossup:>12,.2f}")
print(f"      Rate:   {prov_params.dividend_credit_rate_noneligible:>12.4%}")
print(f"      Credit: ${prov_nonelig_div_credit:>12,.2f}")

total_prov_credits = prov_bpa_credit + prov_age_credit + prov_pension_credit + prov_elig_div_credit + prov_nonelig_div_credit
print(f"\n   ───────────────────────────────────────────────")
print(f"   TOTAL PROVINCIAL CREDITS:           ${total_prov_credits:>12,.2f}")
print(f"   (Tax engine reports:                ${prov_res['total_credits']:>12,.2f})")

print(f"\n4️⃣  NET PROVINCIAL TAX:")
print(f"   Gross Tax:                          ${prov_res['gross_tax']:>12,.2f}")
print(f"   Less Credits:                      -${prov_res['total_credits']:>12,.2f}")
print(f"   ───────────────────────────────────────────────")
print(f"   NET PROVINCIAL TAX:                 ${prov_res['net_tax']:>12,.2f}")

print("\n" + "="*100)
print("JUAN'S TOTAL TAX (NON-ELIGIBLE CORPORATE DIVIDENDS)")
print("="*100)
print(f"   Federal Tax:                        ${fed_res['net_tax']:>12,.2f}")
print(f"   Provincial Tax:                     ${prov_res['net_tax']:>12,.2f}")
print(f"   ───────────────────────────────────────────────")
print(f"   TOTAL TAX:                          ${fed_res['net_tax'] + prov_res['net_tax']:>12,.2f}")
print("="*100)

# Now calculate for Daniela
daniela_pension = 10_400
daniela_eligd = nr_elig_div
daniela_noneligd = corp_dividend + nr_nonelig_div

fed_res_d = progressive_tax(
    fed_params, age,
    pension_income=daniela_pension,
    ordinary_income=ordinary,
    elig_dividends=daniela_eligd,
    nonelig_dividends=daniela_noneligd,
    cap_gains=capg,
    oas_received=0
)

prov_res_d = progressive_tax(
    prov_params, age,
    pension_income=daniela_pension,
    ordinary_income=ordinary,
    elig_dividends=daniela_eligd,
    nonelig_dividends=daniela_noneligd,
    cap_gains=capg,
    oas_received=0
)

print(f"\n\n")
print("="*100)
print("DANIELA'S TOTAL TAX (NON-ELIGIBLE CORPORATE DIVIDENDS)")
print("="*100)
print(f"   Federal Tax:                        ${fed_res_d['net_tax']:>12,.2f}")
print(f"   Provincial Tax:                     ${prov_res_d['net_tax']:>12,.2f}")
print(f"   ───────────────────────────────────────────────")
print(f"   TOTAL TAX:                          ${fed_res_d['net_tax'] + prov_res_d['net_tax']:>12,.2f}")
print("="*100)

print(f"\n\n")
print("="*100)
print("HOUSEHOLD TOTAL (2025, NON-ELIGIBLE CORPORATE DIVIDENDS)")
print("="*100)
juan_total = fed_res['net_tax'] + prov_res['net_tax']
daniela_total = fed_res_d['net_tax'] + prov_res_d['net_tax']
household_total = juan_total + daniela_total

print(f"   Juan's Total Tax:                   ${juan_total:>12,.2f}")
print(f"   Daniela's Total Tax:                ${daniela_total:>12,.2f}")
print(f"   ───────────────────────────────────────────────")
print(f"   HOUSEHOLD TOTAL:                    ${household_total:>12,.2f}")
print("="*100)

print(f"\n💡 KEY INSIGHT:")
print(f"   If corporate dividends were ELIGIBLE instead:")
print(f"   - Much higher dividend tax credits would apply")
print(f"   - Tax would be significantly LOWER")
print(f"\n   For CCPC passive income, NON-ELIGIBLE is the correct classification!")
