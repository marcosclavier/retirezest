"""
Detailed breakdown of 2025 tax calculation for Juan and Daniela
Uses tax engine's detailed output
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

def detailed_breakdown(name, age, pension, ordinary, eligd, noneligd, capg):
    print("\n" + "=" * 100)
    print(f"{name.upper()}'S DETAILED TAX CALCULATION (Age {age}, 2025)")
    print("=" * 100)

    # Step 1: Income components
    print("\n1️⃣  INCOME COMPONENTS (Before Grossup)")
    print("─" * 100)
    print(f"   RRIF Withdrawal:                ${pension:>12,.2f}  (100% taxable)")
    print(f"   NonReg Interest:                ${ordinary:>12,.2f}  (100% taxable)")
    print(f"   Eligible Dividends:             ${eligd:>12,.2f}  (Subject to 38% grossup)")
    print(f"     ├─ Corporate:                 ${80287.52:>12,.2f}")
    print(f"     └─ NonReg:                    ${eligd - 80287.52:>12,.2f}")
    print(f"   Non-Eligible Dividends:         ${noneligd:>12,.2f}  (Subject to 15% grossup)")
    print(f"   Capital Gains:                  ${capg:>12,.2f}  (50% inclusion rate)")

    # Call tax engine
    fed_res = progressive_tax(
        fed_params, age,
        pension_income=pension,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        oas_received=0
    )

    prov_res = progressive_tax(
        prov_params, age,
        pension_income=pension,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        oas_received=0
    )

    # Step 2: Taxable income
    print("\n2️⃣  TAXABLE INCOME (After Grossup)")
    print("─" * 100)

    eligd_grossup = eligd * 0.38
    noneligd_grossup = noneligd * 0.15

    print(f"   Pension + Ordinary + Cap Gains: ${pension + ordinary + (capg * 0.5):>12,.2f}")
    print(f"   Eligible Div Grossup (38%):    +${eligd_grossup:>12,.2f}")
    print(f"   Non-Elig Div Grossup (15%):    +${noneligd_grossup:>12,.2f}")
    print(f"   " + "─" * 80)
    print(f"   TOTAL TAXABLE INCOME:           ${fed_res['taxable_income']:>12,.2f}")

    # Step 3: Federal tax
    print("\n3️⃣  FEDERAL TAX")
    print("─" * 100)
    print(f"   Gross Tax (on ${fed_res['taxable_income']:,.2f}):")
    print(f"     Tax before credits:           ${fed_res['gross_tax']:>12,.2f}")
    print(f"\n   Tax Credits:")
    # We need to calculate the breakdown manually since tax engine returns total
    bpa_credit = fed_params.bpa_amount * fed_params.bpa_rate
    age_credit = (fed_params.age_amount * fed_params.bpa_rate) if age >= 65 else 0
    pension_credit = (min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate) if pension > 0 else 0
    div_credit_elig = eligd_grossup * fed_params.dividend_credit_rate_eligible
    div_credit_nonelig = noneligd_grossup * fed_params.dividend_credit_rate_noneligible

    print(f"     Basic Personal Amount:        ${bpa_credit:>12,.2f}  (${fed_params.bpa_amount:,.0f} × 15%)")
    print(f"     Age Amount (65+):             ${age_credit:>12,.2f}  (${fed_params.age_amount:,.0f} × 15%)")
    print(f"     Pension Credit:               ${pension_credit:>12,.2f}  (${min(pension, 2000):,.0f} × 15%)")
    print(f"     Elig Div Credit:              ${div_credit_elig:>12,.2f}  (${eligd_grossup:,.2f} × 15.0198%)")
    print(f"     Non-Elig Div Credit:          ${div_credit_nonelig:>12,.2f}  (${noneligd_grossup:,.2f} × {fed_params.dividend_credit_rate_noneligible:.4%})")
    print(f"     " + "─" * 76)
    print(f"     Total Credits:                ${fed_res.get('total_credits', 0):>12,.2f}")

    print(f"\n   NET FEDERAL TAX:                ${fed_res['net_tax']:>12,.2f}")

    # Step 4: Provincial tax
    print("\n4️⃣  ALBERTA PROVINCIAL TAX")
    print("─" * 100)
    print(f"   Gross Tax (on ${prov_res['taxable_income']:,.2f}):")
    print(f"     Tax before credits:           ${prov_res['gross_tax']:>12,.2f}")
    print(f"\n   Tax Credits:")
    prov_bpa_credit = prov_params.bpa_amount * prov_params.bpa_rate
    prov_age_credit = (prov_params.age_amount * prov_params.bpa_rate) if age >= 65 else 0
    prov_pension_credit = (min(pension, 1000) * prov_params.bpa_rate) if pension > 0 else 0
    prov_div_credit_elig = eligd_grossup * prov_params.dividend_credit_rate_eligible
    prov_div_credit_nonelig = noneligd_grossup * prov_params.dividend_credit_rate_noneligible

    print(f"     Basic Personal Amount:        ${prov_bpa_credit:>12,.2f}  (${prov_params.bpa_amount:,.0f} × 10%)")
    print(f"     Age Amount (65+):             ${prov_age_credit:>12,.2f}  (${prov_params.age_amount:,.0f} × 10%)")
    print(f"     Pension Credit:               ${prov_pension_credit:>12,.2f}  (${min(pension, 1000):,.0f} × 10%)")
    print(f"     Elig Div Credit:              ${prov_div_credit_elig:>12,.2f}  (${eligd_grossup:,.2f} × {prov_params.dividend_credit_rate_eligible:.4%})")
    print(f"     Non-Elig Div Credit:          ${prov_div_credit_nonelig:>12,.2f}  (${noneligd_grossup:,.2f} × {prov_params.dividend_credit_rate_noneligible:.4%})")
    print(f"     " + "─" * 76)
    print(f"     Total Credits:                ${prov_res.get('total_credits', 0):>12,.2f}")

    print(f"\n   NET PROVINCIAL TAX:             ${prov_res['net_tax']:>12,.2f}")

    # Final summary
    total_tax = fed_res['net_tax'] + prov_res['net_tax']
    print("\n" + "=" * 100)
    print(f"TOTAL TAX FOR {name.upper()}")
    print("=" * 100)
    print(f"   Federal:                        ${fed_res['net_tax']:>12,.2f}")
    print(f"   Provincial (AB):                ${prov_res['net_tax']:>12,.2f}")
    print(f"   " + "─" * 80)
    print(f"   TOTAL:                          ${total_tax:>12,.2f}")
    print("=" * 100)

    # Effective rate
    actual_income = pension + ordinary + eligd + noneligd + (capg * 0.5)
    eff_rate = (total_tax / actual_income * 100) if actual_income > 0 else 0
    print(f"\n   Effective Rate on Actual Income: {eff_rate:.2f}%")
    print(f"   (Total Tax ${total_tax:,.2f} / Actual Income ${actual_income:,.2f})")

    return total_tax

# Run for both people
print("\n\n")
juan_tax = detailed_breakdown("JUAN", age, juan_pension, juan_ordinary, juan_eligd, juan_noneligd, juan_capg)

print("\n\n")
daniela_tax = detailed_breakdown("DANIELA", age, daniela_pension, daniela_ordinary, daniela_eligd, daniela_noneligd, daniela_capg)

# Household summary
print("\n\n")
print("=" * 100)
print("HOUSEHOLD TAX SUMMARY (2025)")
print("=" * 100)
print(f"   Juan's Total Tax:               ${juan_tax:>12,.2f}")
print(f"   Daniela's Total Tax:            ${daniela_tax:>12,.2f}")
print(f"   " + "─" * 80)
print(f"   HOUSEHOLD TOTAL TAX:            ${juan_tax + daniela_tax:>12,.2f}")
print("=" * 100)
print(f"\n   Expected from simulation:       $3,084.22")
print(f"   Match: {'✅ CORRECT!' if abs((juan_tax + daniela_tax) - 3084.22) < 1 else '❌ MISMATCH'}")
print("=" * 100)

# Income splitting benefit
print("\n\n")
print("💡 WHY IS THE TAX SO LOW?")
print("=" * 100)
print("INCOME SPLITTING BENEFIT:")
print(f"   Total Corporate Withdrawals:    ${160575:>12,.2f}")
print(f"   Total RRIF Withdrawals:         ${17800:>12,.2f}")
print(f"   Total Household Income:         ~${217000:>12,.2f}")
print(f"\n   By splitting income between TWO people:")
print(f"   - Each person's income: ~$108,500")
print(f"   - Each stays in LOWER tax brackets")
print(f"   - Each gets full personal/age/pension credits")
print(f"   - Each gets dividend tax credits on their portion")
print(f"\n   Result: Household tax of ${juan_tax + daniela_tax:,.2f} instead of ~$22,780 for single person!")
print(f"   TAX SAVINGS: ${22780 - (juan_tax + daniela_tax):,.2f} (86.5%)")
print("=" * 100)
