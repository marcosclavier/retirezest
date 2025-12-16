"""
Verify if age credit is correctly applied given the high taxable income.
The age credit phases out at higher income levels.
"""

from modules.config import load_tax_config, get_tax_params

# Load 2025 tax config
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Income values
net_income = 170_614.25  # Total net income (used for phaseout calculation)
taxable_income = 170_614.25  # Taxable income (after grossup)

print("=" * 100)
print("AGE CREDIT PHASEOUT VERIFICATION")
print("=" * 100)
print()

# Federal Age Credit Phaseout
print("FEDERAL AGE CREDIT:")
print(f"  Base age amount:                ${fed_params.age_amount:>12,.2f}")
print(f"  Phaseout starts at:             ${fed_params.age_amount_phaseout_start:>12,.2f}")
print(f"  Phaseout rate:                  {fed_params.age_amount_phaseout_rate:>12.1%}")
print(f"  Net income:                     ${net_income:>12,.2f}")
print()

if net_income > fed_params.age_amount_phaseout_start:
    excess = net_income - fed_params.age_amount_phaseout_start
    reduction = excess * fed_params.age_amount_phaseout_rate
    reduced_age_amount = max(0.0, fed_params.age_amount - reduction)

    print(f"  Income over threshold:          ${excess:>12,.2f}")
    print(f"  Reduction (15% of excess):      ${reduction:>12,.2f}")
    print(f"  Original age amount:            ${fed_params.age_amount:>12,.2f}")
    print(f"  Reduced age amount:             ${reduced_age_amount:>12,.2f}")
    print(f"  Age credit (amount × {fed_params.bpa_rate:.0%}):     ${reduced_age_amount * fed_params.bpa_rate:>12,.2f}")

    if reduced_age_amount == 0:
        print(f"  ❌ AGE CREDIT COMPLETELY PHASED OUT")
    else:
        print(f"  ⚠️  AGE CREDIT PARTIALLY REDUCED")
else:
    print(f"  ✅ No phaseout - income below threshold")
    print(f"  Full age credit:                ${fed_params.age_amount * fed_params.bpa_rate:>12,.2f}")

print()
print("-" * 100)
print()

# Alberta Age Credit Phaseout
print("ALBERTA AGE CREDIT:")
print(f"  Base age amount:                ${prov_params.age_amount:>12,.2f}")
print(f"  Phaseout starts at:             ${prov_params.age_amount_phaseout_start:>12,.2f}")
print(f"  Phaseout rate:                  {prov_params.age_amount_phaseout_rate:>12.1%}")
print(f"  Net income:                     ${net_income:>12,.2f}")
print()

if net_income > prov_params.age_amount_phaseout_start:
    excess = net_income - prov_params.age_amount_phaseout_start
    reduction = excess * prov_params.age_amount_phaseout_rate
    reduced_age_amount = max(0.0, prov_params.age_amount - reduction)

    print(f"  Income over threshold:          ${excess:>12,.2f}")
    print(f"  Reduction (15% of excess):      ${reduction:>12,.2f}")
    print(f"  Original age amount:            ${prov_params.age_amount:>12,.2f}")
    print(f"  Reduced age amount:             ${reduced_age_amount:>12,.2f}")
    print(f"  Age credit (amount × {prov_params.bpa_rate:.0%}):    ${reduced_age_amount * prov_params.bpa_rate:>12,.2f}")

    if reduced_age_amount == 0:
        print(f"  ❌ AGE CREDIT COMPLETELY PHASED OUT")
    else:
        print(f"  ⚠️  AGE CREDIT PARTIALLY REDUCED")
else:
    print(f"  ✅ No phaseout - income below threshold")
    print(f"  Full age credit:                ${prov_params.age_amount * prov_params.bpa_rate:>12,.2f}")

print()
print("=" * 100)
print("EXPECTED OUTCOME")
print("=" * 100)
print()
print("With net income of $170,614.25:")
print()

# Calculate expected total credits WITHOUT age credit
bpa_fed = fed_params.bpa_amount * fed_params.bpa_rate
pension_fed = 2000 * fed_params.pension_credit_rate
bpa_prov = prov_params.bpa_amount * prov_params.bpa_rate
pension_prov = 2000 * prov_params.pension_credit_rate

# Dividend credits (from previous calculation)
elig_div = 111_273.01
elig_grossup = elig_div * fed_params.dividend_grossup_eligible
nonelig_div = 1_050.00
nonelig_grossup = nonelig_div * fed_params.dividend_grossup_noneligible

elig_cred_fed = elig_grossup * fed_params.dividend_credit_rate_eligible
nonelig_cred_fed = nonelig_grossup * fed_params.dividend_credit_rate_noneligible
elig_cred_prov = elig_grossup * prov_params.dividend_credit_rate_eligible
nonelig_cred_prov = nonelig_grossup * prov_params.dividend_credit_rate_noneligible

total_fed_credits_no_age = bpa_fed + pension_fed + elig_cred_fed + nonelig_cred_fed
total_prov_credits_no_age = bpa_prov + pension_prov + elig_cred_prov + nonelig_cred_prov

print(f"Federal credits (without age):  ${total_fed_credits_no_age:>12,.2f}")
print(f"Provincial credits (without age): ${total_prov_credits_no_age:>12,.2f}")
print()
print("If age credit is incorrectly included, tax would be LOWER than it should be.")
print("This could explain a discrepancy if the simulation is using the wrong income for phaseout.")
print()

# Check what the net income should actually be (before grossup vs after)
print("=" * 100)
print("NET INCOME vs TAXABLE INCOME")
print("=" * 100)
print()
print("IMPORTANT: Age credit phaseout uses NET INCOME, not TAXABLE INCOME")
print()
print("Net income = Income before dividend grossup and capital gains inclusion")
print("Taxable income = Income after grossup/inclusion (used for tax brackets)")
print()

# Calculate actual net income
pension = 10_000.00
ordinary = 2_700.00
elig_div_actual = 111_273.01  # NOT grossed up
nonelig_div_actual = 1_050.00  # NOT grossed up
cap_gains_actual = 6_300.00  # Actual gains, NOT 50% inclusion

net_income_correct = pension + ordinary + elig_div_actual + nonelig_div_actual + cap_gains_actual

print(f"Net Income (correct):           ${net_income_correct:>12,.2f}")
print(f"Taxable Income (with grossup):  ${taxable_income:>12,.2f}")
print()

if net_income_correct != net_income:
    print(f"⚠️  DISCREPANCY DETECTED!")
    print(f"We used: ${net_income:,.2f}")
    print(f"Should be: ${net_income_correct:,.2f}")
    print()

    # Recalculate with correct net income
    print("Recalculating with correct net income...")
    print()

    # Federal
    if net_income_correct > fed_params.age_amount_phaseout_start:
        excess = net_income_correct - fed_params.age_amount_phaseout_start
        reduction = excess * fed_params.age_amount_phaseout_rate
        reduced_age_amount_fed = max(0.0, fed_params.age_amount - reduction)
        age_credit_fed = reduced_age_amount_fed * fed_params.bpa_rate
        print(f"Federal age credit (corrected): ${age_credit_fed:>12,.2f}")

    # Provincial
    if net_income_correct > prov_params.age_amount_phaseout_start:
        excess = net_income_correct - prov_params.age_amount_phaseout_start
        reduction = excess * prov_params.age_amount_phaseout_rate
        reduced_age_amount_prov = max(0.0, prov_params.age_amount - reduction)
        age_credit_prov = reduced_age_amount_prov * prov_params.bpa_rate
        print(f"Alberta age credit (corrected): ${age_credit_prov:>12,.2f}")
else:
    print("✅ Net income calculation is correct")
