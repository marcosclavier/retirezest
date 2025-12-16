"""
Detailed breakdown of 2025 tax calculation for Juan and Daniela
Shows every step: grossup, brackets, credits, etc.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax

# Load 2025 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Actual values from simulation debug logs
age = 65

# Juan's income
juan_pension = 7_400
juan_ordinary = 3_735
juan_eligd = 86_097.52
juan_noneligd = 1_452.50
juan_capg = 8_715

# Daniela's income
daniela_pension = 10_400
daniela_ordinary = 3_735
daniela_eligd = 86_097.52
daniela_noneligd = 1_452.50
daniela_capg = 8_715

def detailed_tax_breakdown(name, age, pension, ordinary, eligd, noneligd, capg, fed_params, prov_params):
    print("=" * 100)
    print(f"{name}'s Detailed Tax Calculation (Age {age}, 2025)")
    print("=" * 100)

    # Step 1: Income Components
    print("\n" + "─" * 100)
    print("STEP 1: INCOME COMPONENTS (Before Grossup)")
    print("─" * 100)
    print(f"  Pension Income (RRIF):              ${pension:>12,.2f}  (Fully taxable)")
    print(f"  Ordinary Income (NonReg interest):  ${ordinary:>12,.2f}  (Fully taxable)")
    print(f"  Eligible Dividends:                 ${eligd:>12,.2f}  (Subject to 38% grossup)")
    print(f"    ├─ Corporate dividend:            ${80287.52:>12,.2f}")
    print(f"    └─ NonReg dividend:               ${eligd - 80287.52:>12,.2f}")
    print(f"  Non-Eligible Dividends:             ${noneligd:>12,.2f}  (Subject to 15% grossup)")
    print(f"  Capital Gains:                      ${capg:>12,.2f}  (50% inclusion rate)")

    # Step 2: Calculate taxable income
    print("\n" + "─" * 100)
    print("STEP 2: CALCULATE TAXABLE INCOME (With Dividend Grossup)")
    print("─" * 100)

    # Grossup calculations
    eligd_grossup = eligd * fed_params.dividend_grossup_eligible
    eligd_grossed = eligd * (1 + fed_params.dividend_grossup_eligible)
    noneligd_grossup = noneligd * fed_params.dividend_grossup_noneligible
    noneligd_grossed = noneligd * (1 + fed_params.dividend_grossup_noneligible)

    print(f"  Base Income:")
    print(f"    Pension:                          ${pension:>12,.2f}")
    print(f"    Ordinary:                         ${ordinary:>12,.2f}")
    print(f"    Taxable capital gains (50%):      ${capg * 0.5:>12,.2f}")
    print(f"\n  Eligible Dividends:")
    print(f"    Actual dividends:                 ${eligd:>12,.2f}")
    print(f"    Grossup ({fed_params.dividend_grossup_eligible:.1%}):              +${eligd_grossup:>12,.2f}")
    print(f"    Grossed-up amount:                ${eligd_grossed:>12,.2f}")
    print(f"\n  Non-Eligible Dividends:")
    print(f"    Actual dividends:                 ${noneligd:>12,.2f}")
    print(f"    Grossup ({fed_params.dividend_grossup_noneligible:.1%}):               +${noneligd_grossup:>12,.2f}")
    print(f"    Grossed-up amount:                ${noneligd_grossed:>12,.2f}")

    taxable_income = pension + ordinary + (capg * 0.5) + eligd_grossed + noneligd_grossed
    print(f"\n  {'─' * 80}")
    print(f"  TOTAL TAXABLE INCOME:               ${taxable_income:>12,.2f}")
    print(f"  {'─' * 80}")

    # Calculate federal tax
    print("\n" + "─" * 100)
    print("STEP 3: FEDERAL TAX CALCULATION")
    print("─" * 100)

    fed_res = progressive_tax(
        fed_params, age,
        pension_income=pension,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        oas_received=0
    )

    print(f"\n  2025 Federal Tax Brackets:")
    print(f"    $0 - $55,867:           15.0%")
    print(f"    $55,867 - $111,733:     20.5%")
    print(f"    $111,733 - $173,205:    26.0%")
    print(f"    $173,205+:              29.0%")

    print(f"\n  Tax on ${taxable_income:,.2f}:")
    # Manual calculation for display
    tax_15 = min(taxable_income, 55867) * 0.15
    tax_205 = max(0, min(taxable_income - 55867, 55866)) * 0.205
    tax_26 = max(0, min(taxable_income - 111733, 61472)) * 0.26
    tax_29 = max(0, taxable_income - 173205) * 0.29

    if taxable_income > 0:
        print(f"    First $55,867:                    ${min(taxable_income, 55867):>12,.2f} × 15.0%  = ${tax_15:>10,.2f}")
    if taxable_income > 55867:
        bracket_amt = min(taxable_income - 55867, 55866)
        print(f"    Next ${bracket_amt:,.2f}:                ${bracket_amt:>12,.2f} × 20.5%  = ${tax_205:>10,.2f}")
    if taxable_income > 111733:
        bracket_amt = min(taxable_income - 111733, 61472)
        print(f"    Next ${bracket_amt:,.2f}:                 ${bracket_amt:>12,.2f} × 26.0%  = ${tax_26:>10,.2f}")
    if taxable_income > 173205:
        bracket_amt = taxable_income - 173205
        print(f"    Above $173,205:                   ${bracket_amt:>12,.2f} × 29.0%  = ${tax_29:>10,.2f}")

    gross_fed_tax = tax_15 + tax_205 + tax_26 + tax_29
    print(f"\n  {'─' * 80}")
    print(f"  GROSS FEDERAL TAX:                  ${gross_fed_tax:>12,.2f}")
    print(f"  {'─' * 80}")

    # Step 4: Federal Credits
    print("\n" + "─" * 100)
    print("STEP 4: FEDERAL TAX CREDITS")
    print("─" * 100)

    # Credits
    basic_personal = fed_params.bpa_amount * 0.15
    age_credit = (fed_params.age_amount if age >= 65 else 0) * 0.15
    pension_credit = (min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate) if pension > 0 else 0

    # Dividend credits
    elig_div_credit = eligd_grossup * fed_params.dividend_credit_rate_eligible
    nonelig_div_credit = noneligd_grossup * fed_params.dividend_credit_rate_noneligible

    print(f"  Basic Personal Amount:")
    print(f"    ${fed_params.bpa_amount:,.2f} × 15% =           ${basic_personal:>12,.2f}")

    if age >= 65:
        print(f"  Age Amount (65+):")
        print(f"    ${fed_params.age_amount:,.2f} × 15% =              ${age_credit:>12,.2f}")

    if pension > 0:
        print(f"  Pension Income Amount:")
        print(f"    ${min(pension, fed_params.pension_credit_amount):,.2f} × 15% =                 ${pension_credit:>12,.2f}")

    print(f"  Eligible Dividend Tax Credit:")
    print(f"    Grossup ${eligd_grossup:,.2f} × {fed_params.dividend_credit_rate_eligible:.4%} = ${elig_div_credit:>12,.2f}")

    print(f"  Non-Eligible Dividend Tax Credit:")
    print(f"    Grossup ${noneligd_grossup:,.2f} × {fed_params.dividend_credit_rate_noneligible:.4%} =  ${nonelig_div_credit:>12,.2f}")

    total_fed_credits = basic_personal + age_credit + pension_credit + elig_div_credit + nonelig_div_credit

    print(f"\n  {'─' * 80}")
    print(f"  TOTAL FEDERAL CREDITS:              ${total_fed_credits:>12,.2f}")
    print(f"  {'─' * 80}")

    net_fed_tax = max(0, gross_fed_tax - total_fed_credits)

    print(f"\n  NET FEDERAL TAX:")
    print(f"    Gross Tax:                        ${gross_fed_tax:>12,.2f}")
    print(f"    Less Credits:                    -${total_fed_credits:>12,.2f}")
    print(f"  {'─' * 80}")
    print(f"    NET FEDERAL TAX:                  ${net_fed_tax:>12,.2f}")
    print(f"  {'─' * 80}")
    print(f"    Actual from tax engine:           ${fed_res['net_tax']:>12,.2f}")

    # Provincial tax
    print("\n" + "─" * 100)
    print("STEP 5: ALBERTA PROVINCIAL TAX CALCULATION")
    print("─" * 100)

    prov_res = progressive_tax(
        prov_params, age,
        pension_income=pension,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        oas_received=0
    )

    print(f"\n  2025 Alberta Tax Brackets:")
    print(f"    $0 - $148,269:          10.0%")
    print(f"    $148,269 - $177,922:    12.0%")
    print(f"    $177,922 - $237,230:    13.0%")
    print(f"    $237,230 - $355,845:    14.0%")
    print(f"    $355,845+:              15.0%")

    print(f"\n  Tax on ${taxable_income:,.2f}:")
    prov_tax_10 = min(taxable_income, 148269) * 0.10
    prov_tax_12 = max(0, min(taxable_income - 148269, 29653)) * 0.12
    prov_tax_13 = max(0, min(taxable_income - 177922, 59308)) * 0.13
    prov_tax_14 = max(0, min(taxable_income - 237230, 118615)) * 0.14
    prov_tax_15 = max(0, taxable_income - 355845) * 0.15

    if taxable_income > 0:
        print(f"    First $148,269:                   ${min(taxable_income, 148269):>12,.2f} × 10.0%  = ${prov_tax_10:>10,.2f}")
    if taxable_income > 148269:
        bracket_amt = min(taxable_income - 148269, 29653)
        print(f"    Next ${bracket_amt:,.2f}:                 ${bracket_amt:>12,.2f} × 12.0%  = ${prov_tax_12:>10,.2f}")

    gross_prov_tax = prov_tax_10 + prov_tax_12 + prov_tax_13 + prov_tax_14 + prov_tax_15

    print(f"\n  {'─' * 80}")
    print(f"  GROSS PROVINCIAL TAX:               ${gross_prov_tax:>12,.2f}")
    print(f"  {'─' * 80}")

    # Provincial credits
    print("\n  Provincial Tax Credits:")

    prov_basic = prov_params.bpa_amount * 0.10
    prov_age = (prov_params.age_amount if age >= 65 else 0) * 0.10
    prov_pension = (min(pension, 1000) * 0.10) if pension > 0 else 0  # AB pension credit is on $1000 max

    # Provincial dividend credits
    prov_elig_div_credit = eligd_grossup * prov_params.dividend_credit_rate_eligible
    prov_nonelig_div_credit = noneligd_grossup * prov_params.dividend_credit_rate_noneligible

    print(f"    Basic Personal Amount:")
    print(f"      ${prov_params.bpa_amount:,.2f} × 10% =         ${prov_basic:>12,.2f}")

    if age >= 65:
        print(f"    Age Amount (65+):")
        print(f"      ${prov_params.age_amount:,.2f} × 10% =            ${prov_age:>12,.2f}")

    if pension > 0:
        print(f"    Pension Income Amount:")
        print(f"      ${min(pension, 1000):,.2f} × 10% =               ${prov_pension:>12,.2f}")

    print(f"    Eligible Dividend Tax Credit:")
    print(f"      Grossup ${eligd_grossup:,.2f} × {prov_params.dividend_credit_rate_eligible:.4%} =   ${prov_elig_div_credit:>12,.2f}")

    print(f"    Non-Eligible Dividend Tax Credit:")
    print(f"      Grossup ${noneligd_grossup:,.2f} × {prov_params.dividend_credit_rate_noneligible:.4%} =    ${prov_nonelig_div_credit:>12,.2f}")

    total_prov_credits = prov_basic + prov_age + prov_pension + prov_elig_div_credit + prov_nonelig_div_credit

    print(f"\n  {'─' * 80}")
    print(f"  TOTAL PROVINCIAL CREDITS:           ${total_prov_credits:>12,.2f}")
    print(f"  {'─' * 80}")

    net_prov_tax = max(0, gross_prov_tax - total_prov_credits)

    print(f"\n  NET PROVINCIAL TAX:")
    print(f"    Gross Tax:                        ${gross_prov_tax:>12,.2f}")
    print(f"    Less Credits:                    -${total_prov_credits:>12,.2f}")
    print(f"  {'─' * 80}")
    print(f"    NET PROVINCIAL TAX:               ${net_prov_tax:>12,.2f}")
    print(f"  {'─' * 80}")
    print(f"    Actual from tax engine:           ${prov_res['net_tax']:>12,.2f}")

    # Final summary
    total_tax = net_fed_tax + net_prov_tax
    actual_total = fed_res['net_tax'] + prov_res['net_tax']

    print("\n" + "=" * 100)
    print(f"FINAL TAX SUMMARY FOR {name.upper()}")
    print("=" * 100)
    print(f"  Federal Tax:                        ${fed_res['net_tax']:>12,.2f}")
    print(f"  Provincial Tax (AB):                ${prov_res['net_tax']:>12,.2f}")
    print(f"  {'─' * 80}")
    print(f"  TOTAL TAX:                          ${actual_total:>12,.2f}")
    print(f"  {'─' * 80}")

    effective_rate = (actual_total / taxable_income * 100) if taxable_income > 0 else 0
    print(f"\n  Effective Tax Rate:                 {effective_rate:>11,.2f}%")
    print(f"  On Taxable Income of:               ${taxable_income:>12,.2f}")

    actual_income = pension + ordinary + eligd + noneligd + (capg * 0.5)
    effective_on_actual = (actual_total / actual_income * 100) if actual_income > 0 else 0
    print(f"\n  Effective Rate on Actual Income:")
    print(f"    (Before grossup):                 {effective_on_actual:>11,.2f}%")
    print(f"    On Actual Income of:              ${actual_income:>12,.2f}")

    print("=" * 100)
    print("\n\n")

    return actual_total

# Calculate for Juan
juan_total = detailed_tax_breakdown(
    "JUAN", age, juan_pension, juan_ordinary,
    juan_eligd, juan_noneligd, juan_capg,
    fed_params, prov_params
)

# Calculate for Daniela
daniela_total = detailed_tax_breakdown(
    "DANIELA", age, daniela_pension, daniela_ordinary,
    daniela_eligd, daniela_noneligd, daniela_capg,
    fed_params, prov_params
)

# Household summary
print("=" * 100)
print("HOUSEHOLD TAX SUMMARY (2025)")
print("=" * 100)
print(f"  Juan's Total Tax:                   ${juan_total:>12,.2f}")
print(f"  Daniela's Total Tax:                ${daniela_total:>12,.2f}")
print(f"  {'─' * 80}")
print(f"  HOUSEHOLD TOTAL TAX:                ${juan_total + daniela_total:>12,.2f}")
print(f"  {'─' * 80}")
print(f"\n  Expected from simulation:           $3,084.22")
print(f"  Match: {'✅ CORRECT!' if abs((juan_total + daniela_total) - 3084.22) < 1 else '❌ MISMATCH'}")
print("=" * 100)
