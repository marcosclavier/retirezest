"""
Test to reproduce the exact age credit calculation from the tax engine.
"""

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax, compute_nonrefundable_credits

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
print("AGE CREDIT BUG INVESTIGATION")
print("=" * 100)
print()

# Calculate federal tax using progressive_tax
fed_result = progressive_tax(
    fed_params, age,
    ordinary_income=ordinary,
    elig_dividends=elig_div,
    nonelig_dividends=nonelig_div,
    cap_gains=cap_gains,
    pension_income=pension,
    oas_received=oas
)

print("FEDERAL TAX RESULT:")
print(f"  Taxable Income: ${fed_result['taxable_income']:,.2f}")
print(f"  Total Credits: ${fed_result['total_credits']:,.2f}")
print()

# Now manually calculate what the credits SHOULD be with different income values
print("=" * 100)
print("TESTING DIFFERENT INCOME VALUES FOR AGE CREDIT PHASEOUT")
print("=" * 100)
print()

# Test 1: Using taxable income (what the bug might be doing)
print("TEST 1: Using TAXABLE income ($170,614.25) - INCORRECT")
taxable_income = fed_result['taxable_income']
credits_with_taxable = compute_nonrefundable_credits(
    fed_params, age, taxable_income, pension
)
print(f"  Income used: ${taxable_income:,.2f}")
print(f"  Non-refundable credits: ${credits_with_taxable:,.2f}")
print()

# Calculate age credit manually with taxable income
if taxable_income > fed_params.age_amount_phaseout_start:
    excess = taxable_income - fed_params.age_amount_phaseout_start
    reduction = excess * fed_params.age_amount_phaseout_rate
    age_amount_reduced = max(0.0, fed_params.age_amount - reduction)
    age_credit = age_amount_reduced * fed_params.bpa_rate
    print(f"  Age amount after phaseout: ${age_amount_reduced:,.2f}")
    print(f"  Age credit: ${age_credit:,.2f}")
print()

# Test 2: Using net income (correct per CRA)
print("TEST 2: Using NET income ($131,323.01) - CORRECT PER CRA")
net_income = ordinary + pension + oas + elig_div + nonelig_div + cap_gains
credits_with_net = compute_nonrefundable_credits(
    fed_params, age, net_income, pension
)
print(f"  Income used: ${net_income:,.2f}")
print(f"  Non-refundable credits: ${credits_with_net:,.2f}")
print()

# Calculate age credit manually with net income
if net_income > fed_params.age_amount_phaseout_start:
    excess = net_income - fed_params.age_amount_phaseout_start
    reduction = excess * fed_params.age_amount_phaseout_rate
    age_amount_reduced = max(0.0, fed_params.age_amount - reduction)
    age_credit = age_amount_reduced * fed_params.bpa_rate
    print(f"  Age amount after phaseout: ${age_amount_reduced:,.2f}")
    print(f"  Age credit: ${age_credit:,.2f}")
print()

# Test 3: What if there's no phaseout at all? (to match the $1,294.50 we saw)
print("TEST 3: NO phaseout (full age credit) - to match $1,294.50")
full_age_credit = fed_params.age_amount * fed_params.bpa_rate
print(f"  Full age amount: ${fed_params.age_amount:,.2f}")
print(f"  Full age credit: ${full_age_credit:,.2f}")
print()

# Compare
print("=" * 100)
print("COMPARISON")
print("=" * 100)
print(f"Expected from verification script: $1,294.50")
print(f"Full age credit (no phaseout):     ${full_age_credit:,.2f}")
print()

if abs(full_age_credit - 1294.50) < 1:
    print("✅ MATCH! The tax engine is applying the FULL age credit without phaseout!")
    print()
    print("This means the age credit phaseout is NOT being applied at all.")
    print("This is a BUG - the age credit should be phased out at this income level.")
else:
    print("Further investigation needed...")

print()
print("=" * 100)
print("CREDIT BREAKDOWN FROM progressive_tax()")
print("=" * 100)
print()

# Calculate what the dividend credits are
elig_grossup = elig_div * fed_params.dividend_grossup_eligible
elig_credit = elig_grossup * fed_params.dividend_credit_rate_eligible
nonelig_grossup = nonelig_div * fed_params.dividend_grossup_noneligible
nonelig_credit = nonelig_grossup * fed_params.dividend_credit_rate_noneligible

total_div_credits = elig_credit + nonelig_credit

print(f"Dividend credits:        ${total_div_credits:,.2f}")
print(f"Non-refundable credits:  ${credits_with_taxable:,.2f} (using taxable income)")
print(f"                    OR:  ${credits_with_net:,.2f} (using net income)")
print(f"Total from engine:       ${fed_result['total_credits']:,.2f}")
print()

# Reverse engineer what credits were used
implied_nonref = fed_result['total_credits'] - total_div_credits
print(f"Implied non-refundable:  ${implied_nonref:,.2f}")
print()

# Calculate what BPA + Pension would be (no age)
bpa_credit = fed_params.bpa_amount * fed_params.bpa_rate
pension_credit = min(pension, fed_params.pension_credit_amount) * fed_params.pension_credit_rate
base_credits = bpa_credit + pension_credit

print(f"BPA + Pension credits:   ${base_credits:,.2f}")
print(f"Implied age credit:      ${implied_nonref - base_credits:,.2f}")
print(f"Full age credit:         ${full_age_credit:,.2f}")
print()

if abs((implied_nonref - base_credits) - full_age_credit) < 1:
    print("✅ CONFIRMED: The tax engine is using the FULL age credit without any phaseout!")
    print()
    print("ROOT CAUSE: Line 360 in tax_engine.py passes `taxable_income` to")
    print("            compute_nonrefundable_credits, but CRA rules require `net_income`")
    print("            (income before dividend grossup) for age credit phaseout.")
