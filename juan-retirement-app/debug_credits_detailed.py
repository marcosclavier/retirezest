"""
Detailed debugging of tax credit calculations.
"""

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax, dividend_grossup_and_credit, compute_nonrefundable_credits

# Load 2025 tax config
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Income values
age = 65
pension = 10_000.00
ordinary = 2_700.00
elig_div = 111_273.01
nonelig_div = 1_050.00
cap_gains = 6_300.00
oas = 0.0

print("=" * 100)
print("DETAILED CREDIT DEBUGGING")
print("=" * 100)
print()

# Step 1: Calculate dividend credits manually
print("STEP 1: DIVIDEND CREDITS")
print()

elig_result = dividend_grossup_and_credit(fed_params, "eligible", elig_div)
nonelig_result = dividend_grossup_and_credit(fed_params, "noneligible", nonelig_div)

print("Eligible Dividends:")
print(f"  Amount received:     ${elig_div:,.2f}")
print(f"  Grossup rate:        {fed_params.dividend_grossup_eligible:.2%}")
print(f"  Grossed-up amount:   ${elig_result['gross_amount']:,.2f}")
print(f"  Credit rate:         {fed_params.dividend_credit_rate_eligible:.4%}")
print(f"  Credit:              ${elig_result['credit']:,.2f}")
print()

print("Non-Eligible Dividends:")
print(f"  Amount received:     ${nonelig_div:,.2f}")
print(f"  Grossup rate:        {fed_params.dividend_grossup_noneligible:.2%}")
print(f"  Grossed-up amount:   ${nonelig_result['gross_amount']:,.2f}")
print(f"  Credit rate:         {fed_params.dividend_credit_rate_noneligible:.4%}")
print(f"  Credit:              ${nonelig_result['credit']:,.2f}")
print()

total_div_credits_manual = elig_result['credit'] + nonelig_result['credit']
print(f"TOTAL DIVIDEND CREDITS: ${total_div_credits_manual:,.2f}")
print()

# Step 2: Calculate non-refundable credits manually
print("=" * 100)
print("STEP 2: NON-REFUNDABLE CREDITS")
print()

# Calculate what income value is being used
net_income = ordinary + pension + oas + elig_div + nonelig_div + cap_gains
taxable_income = (ordinary + pension + oas +
                  elig_result['gross_amount'] + nonelig_result['gross_amount'] +
                  (cap_gains * 0.5))

print(f"Net Income (before grossup):    ${net_income:,.2f}")
print(f"Taxable Income (after grossup): ${taxable_income:,.2f}")
print()

# Call compute_nonrefundable_credits to see what it returns
nonref_credits = compute_nonrefundable_credits(fed_params, age, taxable_income, pension)

print(f"Non-refundable credits returned: ${nonref_credits:,.2f}")
print()

# Manually calculate each component
bpa_credit = fed_params.bpa_amount * fed_params.bpa_rate
pension_credit = min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate

print("Manual breakdown:")
print(f"  BPA credit:      ${bpa_credit:,.2f}")
print(f"  Pension credit:  ${pension_credit:,.2f}")

# Age credit with phaseout
if taxable_income > fed_params.age_amount_phaseout_start:
    excess = taxable_income - fed_params.age_amount_phaseout_start
    reduction = excess * fed_params.age_amount_phaseout_rate
    age_amount_reduced = max(0.0, fed_params.age_amount - reduction)
    age_credit_taxable = age_amount_reduced * fed_params.bpa_rate
    print(f"  Age credit (using taxable income): ${age_credit_taxable:,.2f}")
    print(f"    (excess: ${excess:,.2f}, reduction: ${reduction:,.2f})")

if net_income > fed_params.age_amount_phaseout_start:
    excess = net_income - fed_params.age_amount_phaseout_start
    reduction = excess * fed_params.age_amount_phaseout_rate
    age_amount_reduced = max(0.0, fed_params.age_amount - reduction)
    age_credit_net = age_amount_reduced * fed_params.bpa_rate
    print(f"  Age credit (using net income):     ${age_credit_net:,.2f}")
    print(f"    (excess: ${excess:,.2f}, reduction: ${reduction:,.2f})")

full_age_credit = fed_params.age_amount * fed_params.bpa_rate
print(f"  Age credit (no phaseout):           ${full_age_credit:,.2f}")
print()

manual_nonref = bpa_credit + pension_credit
print(f"Manual total (BPA + Pension):        ${manual_nonref:,.2f}")
print(f"Function returned:                   ${nonref_credits:,.2f}")
print(f"Difference:                          ${nonref_credits - manual_nonref:,.2f}")
print()

# Step 3: Call progressive_tax and compare
print("=" * 100)
print("STEP 3: PROGRESSIVE_TAX RESULT")
print()

result = progressive_tax(
    fed_params, age,
    ordinary_income=ordinary,
    elig_dividends=elig_div,
    nonelig_dividends=nonelig_div,
    cap_gains=cap_gains,
    pension_income=pension,
    oas_received=oas
)

print(f"Total credits from progressive_tax: ${result['total_credits']:,.2f}")
print()

print("Expected calculation:")
print(f"  Dividend credits (manual):        ${total_div_credits_manual:,.2f}")
print(f"  Non-refundable credits (manual):  ${nonref_credits:,.2f}")
print(f"  Expected total:                   ${total_div_credits_manual + nonref_credits:,.2f}")
print()
print(f"  Actual total from engine:         ${result['total_credits']:,.2f}")
print(f"  Difference:                       ${result['total_credits'] - (total_div_credits_manual + nonref_credits):,.2f}")
print()

# Try to reverse engineer
print("=" * 100)
print("REVERSE ENGINEERING")
print("=" * 100)
print()

implied_div_credits = result['total_credits'] - nonref_credits
print(f"If non-refundable = ${nonref_credits:,.2f}")
print(f"Then dividend credits = ${implied_div_credits:,.2f}")
print(f"But we calculated dividend credits = ${total_div_credits_manual:,.2f}")
print(f"Difference: ${implied_div_credits - total_div_credits_manual:,.2f}")
print()

# What if the grossup is being applied to the credit itself?
bad_elig_credit = elig_div * (1 + fed_params.dividend_grossup_eligible) * fed_params.dividend_credit_rate_eligible
bad_nonelig_credit = nonelig_div * (1 + fed_params.dividend_grossup_noneligible) * fed_params.dividend_credit_rate_noneligible
print(f"If dividend credit formula is wrong:")
print(f"  Bad elig credit: ${bad_elig_credit:,.2f}")
print(f"  Bad nonelig credit: ${bad_nonelig_credit:,.2f}")
print(f"  Total: ${bad_elig_credit + bad_nonelig_credit:,.2f}")
