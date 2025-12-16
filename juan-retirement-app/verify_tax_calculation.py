"""
Verify Tax Calculation - Step by Step
Shows detailed calculation for Person 1 with exact numbers from API
"""

import requests
import json
from modules.config import get_tax_params, load_tax_config

# Make API call
response = requests.post(
    'http://localhost:8000/api/run-simulation',
    json={
        'p1': {
            'name': 'Person 1',
            'start_age': 65,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 0,
            'oas_start_age': 65,
            'oas_annual_at_start': 0,
            'tfsa_balance': 0,
            'rrif_balance': 250000,
            'rrsp_balance': 0,
            'nonreg_balance': 300000,
            'corporate_balance': 1000000,
            'nonreg_acb': 200000,
            'nr_cash': 30000,
            'nr_gic': 60000,
            'nr_invest': 210000,
            'y_nr_cash_interest': 2.0,
            'y_nr_gic_interest': 3.5,
            'y_nr_inv_total_return': 6.0,
            'y_nr_inv_elig_div': 2.0,
            'y_nr_inv_nonelig_div': 0.5,
            'y_nr_inv_capg': 3.0,
            'y_nr_inv_roc_pct': 0.5,
            'nr_cash_pct': 10.0,
            'nr_gic_pct': 20.0,
            'nr_invest_pct': 70.0,
            'corp_cash_bucket': 50000,
            'corp_gic_bucket': 100000,
            'corp_invest_bucket': 850000,
            'corp_rdtoh': 0,
            'y_corp_cash_interest': 2.0,
            'y_corp_gic_interest': 3.5,
            'y_corp_inv_total_return': 6.0,
            'y_corp_inv_elig_div': 2.0,
            'y_corp_inv_capg': 3.5,
            'corp_cash_pct': 5.0,
            'corp_gic_pct': 10.0,
            'corp_invest_pct': 85.0,
            'corp_dividend_type': 'eligible',
            'tfsa_room_start': 7000,
            'tfsa_room_annual_growth': 7000
        },
        'p2': {
            'name': 'Person 2',
            'start_age': 65,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 0,
            'oas_start_age': 65,
            'oas_annual_at_start': 0,
            'tfsa_balance': 0,
            'rrif_balance': 250000,
            'rrsp_balance': 0,
            'nonreg_balance': 300000,
            'corporate_balance': 1000000,
            'nonreg_acb': 200000,
            'nr_cash': 30000,
            'nr_gic': 60000,
            'nr_invest': 210000,
            'y_nr_cash_interest': 2.0,
            'y_nr_gic_interest': 3.5,
            'y_nr_inv_total_return': 6.0,
            'y_nr_inv_elig_div': 2.0,
            'y_nr_inv_nonelig_div': 0.5,
            'y_nr_inv_capg': 3.0,
            'y_nr_inv_roc_pct': 0.5,
            'nr_cash_pct': 10.0,
            'nr_gic_pct': 20.0,
            'nr_invest_pct': 70.0,
            'corp_cash_bucket': 50000,
            'corp_gic_bucket': 100000,
            'corp_invest_bucket': 850000,
            'corp_rdtoh': 0,
            'y_corp_cash_interest': 2.0,
            'y_corp_gic_interest': 3.5,
            'y_corp_inv_total_return': 6.0,
            'y_corp_inv_elig_div': 2.0,
            'y_corp_inv_capg': 3.5,
            'corp_cash_pct': 5.0,
            'corp_gic_pct': 10.0,
            'corp_invest_pct': 85.0,
            'corp_dividend_type': 'eligible',
            'tfsa_room_start': 7000,
            'tfsa_room_annual_growth': 7000
        },
        'province': 'AB',
        'start_year': 2025,
        'end_age': 95,
        'strategy': 'corporate-optimized',
        'spending_go_go': 200100,
        'go_go_end_age': 75,
        'spending_slow_go': 90000,
        'slow_go_end_age': 85,
        'spending_no_go': 70000,
        'spending_inflation': 2.0,
        'general_inflation': 2.0,
        'gap_tolerance': 1000,
        'tfsa_contribution_each': 0,
        'reinvest_nonreg_dist': True,
        'income_split_rrif_fraction': 0.0,
        'hybrid_rrif_topup_per_person': 0,
        'stop_on_fail': False
    }
)

data = response.json()

if not data.get('success', False):
    print(f"❌ API Error: {data.get('error', 'Unknown error')}")
    exit(1)

# Get year 2025 data
year_2025 = data['year_by_year'][0]
five_year = data['five_year_plan'][0] if data.get('five_year_plan') else None

print("=" * 120)
print("DETAILED TAX CALCULATION VERIFICATION - YEAR 2025 - PERSON 1")
print("=" * 120)
print()

# Load tax parameters
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed, prov = get_tax_params(tax_cfg, 'AB')

print("STEP 1: INCOME COMPONENTS")
print("-" * 120)
print()

cpp_p1 = year_2025['cpp_p1']
oas_p1 = year_2025['oas_p1']
rrif_p1 = year_2025['rrif_withdrawal_p1']
corp_div_p1 = year_2025['corporate_withdrawal_p1']
nonreg_dist_p1 = five_year['nonreg_distributions_p1'] if five_year else 0

print(f"  CPP Income                                  ${cpp_p1:>18,.2f}")
print(f"  OAS Income                                  ${oas_p1:>18,.2f}")
print(f"  RRIF Withdrawal                             ${rrif_p1:>18,.2f}")
print(f"  Corporate Dividend (eligible)               ${corp_div_p1:>18,.2f}")
print(f"  NonReg Distributions (passive income)       ${nonreg_dist_p1:>18,.2f}")
print()
print(f"  Total Cash Received                         ${cpp_p1 + oas_p1 + rrif_p1 + corp_div_p1 + nonreg_dist_p1:>18,.2f}")
print()

print("=" * 120)
print("STEP 2: CALCULATE TAXABLE INCOME")
print("-" * 120)
print()

# Ordinary income (fully taxable)
ordinary_income = cpp_p1 + oas_p1 + rrif_p1
print(f"  2A. Ordinary Income (CPP + OAS + RRIF)")
print(f"      ${cpp_p1:,.2f} + ${oas_p1:,.2f} + ${rrif_p1:,.2f}")
print(f"      = ${ordinary_income:>18,.2f}")
print()

# Eligible dividend grossup (38%)
grossup_rate = 1.38
grossed_up_dividend = corp_div_p1 * grossup_rate
print(f"  2B. Eligible Dividends (with 38% grossup)")
print(f"      Actual dividend received:                ${corp_div_p1:>18,.2f}")
print(f"      Grossup (38%):                           ${corp_div_p1 * 0.38:>18,.2f}")
print(f"      Grossed-up amount (taxable):             ${grossed_up_dividend:>18,.2f}")
print()

# Capital gains (50% inclusion)
# NonReg distributions need to be broken down by type
# For now, let's estimate capital gains portion
# Assume 50% of nonreg_dist is capital gains (need to verify this)
capital_gains = nonreg_dist_p1  # This is the realized capital gain
includable_capg = capital_gains * 0.5  # Only 50% is taxable
print(f"  2C. Capital Gains (50% inclusion)")
print(f"      Capital gains realized:                  ${capital_gains:>18,.2f}")
print(f"      Taxable portion (50%):                   ${includable_capg:>18,.2f}")
print()

# Other NonReg income (interest, dividends from NonReg account)
# This needs to be calculated separately
# From the simulation, NonReg generates: interest, dividends, and capital gains
# Let me estimate based on the yields
nr_invest = 210000
nr_gic = 60000
nr_cash = 30000

# Interest income
nr_cash_interest = nr_cash * 0.02  # 2% on cash
nr_gic_interest = nr_gic * 0.035   # 3.5% on GIC
total_nr_interest = nr_cash_interest + nr_gic_interest

# Eligible dividends from NonReg investments (2% eligible div yield)
nr_elig_div = nr_invest * 0.02
grossed_up_nr_elig_div = nr_elig_div * 1.38

# Non-eligible dividends from NonReg investments (0.5% non-eligible div yield)
nr_nonelig_div = nr_invest * 0.005
grossed_up_nr_nonelig_div = nr_nonelig_div * 1.15

# Capital gains from NonReg (3% capital gains yield)
nr_capg_realized = nr_invest * 0.03
includable_nr_capg = nr_capg_realized * 0.5

print(f"  2D. NonReg Passive Income Breakdown")
print(f"      Interest (Cash + GIC):                   ${total_nr_interest:>18,.2f}")
print(f"      Eligible Dividends (actual):             ${nr_elig_div:>18,.2f}")
print(f"      → Grossed-up (38%):                      ${grossed_up_nr_elig_div:>18,.2f}")
print(f"      Non-Eligible Dividends (actual):         ${nr_nonelig_div:>18,.2f}")
print(f"      → Grossed-up (15%):                      ${grossed_up_nr_nonelig_div:>18,.2f}")
print(f"      Capital Gains (realized):                ${nr_capg_realized:>18,.2f}")
print(f"      → Taxable (50%):                         ${includable_nr_capg:>18,.2f}")
print()

# Total taxable income
taxable_income_calculated = (
    ordinary_income +
    grossed_up_dividend +
    total_nr_interest +
    grossed_up_nr_elig_div +
    grossed_up_nr_nonelig_div +
    includable_nr_capg
)

print(f"  TOTAL TAXABLE INCOME (Calculated)")
print(f"      Ordinary Income                          ${ordinary_income:>18,.2f}")
print(f"      Grossed-up Corp Dividends                ${grossed_up_dividend:>18,.2f}")
print(f"      Interest (NonReg)                        ${total_nr_interest:>18,.2f}")
print(f"      Grossed-up Elig Div (NonReg)             ${grossed_up_nr_elig_div:>18,.2f}")
print(f"      Grossed-up Non-Elig Div (NonReg)         ${grossed_up_nr_nonelig_div:>18,.2f}")
print(f"      Taxable Capital Gains (NonReg)           ${includable_nr_capg:>18,.2f}")
print(f"      " + "-" * 70)
print(f"      TOTAL TAXABLE INCOME                     ${taxable_income_calculated:>18,.2f}")
print()
print(f"      API Reported Taxable Income:             ${year_2025['taxable_income_p1']:>18,.2f}")
print(f"      Difference:                              ${taxable_income_calculated - year_2025['taxable_income_p1']:>18,.2f}")
print()

# Use API taxable income for accuracy
taxable_income = year_2025['taxable_income_p1']

print("=" * 120)
print("STEP 3: APPLY FEDERAL TAX BRACKETS")
print("-" * 120)
print()

# Federal brackets (2025)
brackets_fed = [
    (55867, 0.15),
    (111733, 0.205),
    (173205, 0.26),
    (246752, 0.29),
    (float('inf'), 0.33)
]

fed_tax = 0
prev_bracket = 0
print(f"  Taxable Income: ${taxable_income:,.2f}")
print()

for i, (bracket_limit, rate) in enumerate(brackets_fed, 1):
    if taxable_income > prev_bracket:
        taxable_in_bracket = min(taxable_income, bracket_limit) - prev_bracket
        tax_in_bracket = taxable_in_bracket * rate
        fed_tax += tax_in_bracket

        if bracket_limit == float('inf'):
            print(f"  Bracket {i}: ${prev_bracket:>12,.0f}+          @ {rate*100:>5.1f}%")
        else:
            print(f"  Bracket {i}: ${prev_bracket:>12,.0f} - ${bracket_limit:>12,.0f} @ {rate*100:>5.1f}%")
        print(f"            Income in bracket: ${taxable_in_bracket:>18,.2f}  Tax: ${tax_in_bracket:>18,.2f}")

        prev_bracket = bracket_limit
        if taxable_income <= bracket_limit:
            break

print()
print(f"  TOTAL FEDERAL TAX (before credits)         ${fed_tax:>18,.2f}")
print()

print("=" * 120)
print("STEP 4: CALCULATE FEDERAL TAX CREDITS")
print("-" * 120)
print()

# Basic Personal Amount
bpa = 15705
bpa_credit = bpa * 0.15
print(f"  4A. Basic Personal Amount")
print(f"      Amount: ${bpa:,.2f} × 15% =               ${bpa_credit:>18,.2f}")
print()

# Pension credit (max $2,000 on pension income)
pension_income = min(rrif_p1 + cpp_p1, 2000)
pension_credit = pension_income * 0.15
print(f"  4B. Pension Credit")
print(f"      Eligible income: ${pension_income:,.2f} × 15% =      ${pension_credit:>18,.2f}")
print()

# Age amount (age 65+, income-tested)
age_amount_max = 8790
age_threshold = 42335
if taxable_income > age_threshold:
    age_reduction = (taxable_income - age_threshold) * 0.15
    age_amount = max(0, age_amount_max - age_reduction)
else:
    age_amount = age_amount_max
age_credit = age_amount * 0.15
print(f"  4C. Age Amount Credit (65+)")
print(f"      Max amount: ${age_amount_max:,.2f}")
print(f"      Threshold: ${age_threshold:,.2f}")
if taxable_income > age_threshold:
    print(f"      Reduction: (${taxable_income:,.2f} - ${age_threshold:,.2f}) × 15%")
    print(f"               = ${age_reduction:,.2f}")
    print(f"      Reduced amount: ${age_amount:,.2f}")
print(f"      Credit: ${age_amount:,.2f} × 15% =             ${age_credit:>18,.2f}")
print()

# Dividend tax credit - Eligible (15.0198% of grossed-up amount)
div_credit_rate_elig = 0.150198
corp_div_credit = grossed_up_dividend * div_credit_rate_elig
nr_elig_div_credit = grossed_up_nr_elig_div * div_credit_rate_elig

print(f"  4D. Eligible Dividend Tax Credit (15.0198%)")
print(f"      Corporate dividends (grossed-up): ${grossed_up_dividend:,.2f}")
print(f"      Credit: ${grossed_up_dividend:,.2f} × 15.0198% =    ${corp_div_credit:>18,.2f}")
print(f"      NonReg elig div (grossed-up): ${grossed_up_nr_elig_div:,.2f}")
print(f"      Credit: ${grossed_up_nr_elig_div:,.2f} × 15.0198% =        ${nr_elig_div_credit:>18,.2f}")
print()

# Dividend tax credit - Non-Eligible (9.0301% of grossed-up amount)
div_credit_rate_nonelig = 0.090301
nr_nonelig_div_credit = grossed_up_nr_nonelig_div * div_credit_rate_nonelig

print(f"  4E. Non-Eligible Dividend Tax Credit (9.0301%)")
print(f"      NonReg non-elig div (grossed-up): ${grossed_up_nr_nonelig_div:,.2f}")
print(f"      Credit: ${grossed_up_nr_nonelig_div:,.2f} × 9.0301% =         ${nr_nonelig_div_credit:>18,.2f}")
print()

total_fed_credits = bpa_credit + pension_credit + age_credit + corp_div_credit + nr_elig_div_credit + nr_nonelig_div_credit
print(f"  TOTAL FEDERAL TAX CREDITS                  ${total_fed_credits:>18,.2f}")
print()

fed_tax_after_credits = max(0, fed_tax - total_fed_credits)
print(f"  FEDERAL TAX AFTER CREDITS")
print(f"      Tax before credits:                      ${fed_tax:>18,.2f}")
print(f"      Less: Credits                           -${total_fed_credits:>18,.2f}")
print(f"      " + "-" * 70)
print(f"      FEDERAL TAX PAYABLE                      ${fed_tax_after_credits:>18,.2f}")
print()

print("=" * 120)
print("STEP 5: APPLY ALBERTA PROVINCIAL TAX BRACKETS")
print("-" * 120)
print()

# Alberta brackets (2025)
brackets_ab = [
    (148269, 0.10),
    (177922, 0.12),
    (237230, 0.13),
    (355845, 0.14),
    (float('inf'), 0.15)
]

prov_tax = 0
prev_bracket = 0
print(f"  Taxable Income: ${taxable_income:,.2f}")
print()

for i, (bracket_limit, rate) in enumerate(brackets_ab, 1):
    if taxable_income > prev_bracket:
        taxable_in_bracket = min(taxable_income, bracket_limit) - prev_bracket
        tax_in_bracket = taxable_in_bracket * rate
        prov_tax += tax_in_bracket

        if bracket_limit == float('inf'):
            print(f"  Bracket {i}: ${prev_bracket:>12,.0f}+          @ {rate*100:>5.1f}%")
        else:
            print(f"  Bracket {i}: ${prev_bracket:>12,.0f} - ${bracket_limit:>12,.0f} @ {rate*100:>5.1f}%")
        print(f"            Income in bracket: ${taxable_in_bracket:>18,.2f}  Tax: ${tax_in_bracket:>18,.2f}")

        prev_bracket = bracket_limit
        if taxable_income <= bracket_limit:
            break

print()
print(f"  TOTAL ALBERTA TAX (before credits)         ${prov_tax:>18,.2f}")
print()

print("=" * 120)
print("STEP 6: CALCULATE ALBERTA TAX CREDITS")
print("-" * 120)
print()

# Basic Personal Amount (Alberta)
ab_bpa = 21885
ab_bpa_credit = ab_bpa * 0.10
print(f"  6A. Basic Personal Amount")
print(f"      Amount: ${ab_bpa:,.2f} × 10% =              ${ab_bpa_credit:>18,.2f}")
print()

# Pension credit (Alberta) - 10%
ab_pension_credit = pension_income * 0.10
print(f"  6B. Pension Credit")
print(f"      Eligible income: ${pension_income:,.2f} × 10% =      ${ab_pension_credit:>18,.2f}")
print()

# Age amount (Alberta, age 65+, income-tested)
ab_age_amount_max = 5850
ab_age_threshold = 42335
if taxable_income > ab_age_threshold:
    ab_age_reduction = (taxable_income - ab_age_threshold) * 0.15
    ab_age_amount = max(0, ab_age_amount_max - ab_age_reduction)
else:
    ab_age_amount = ab_age_amount_max
ab_age_credit = ab_age_amount * 0.10
print(f"  6C. Age Amount Credit (65+)")
print(f"      Max amount: ${ab_age_amount_max:,.2f}")
print(f"      Threshold: ${ab_age_threshold:,.2f}")
if taxable_income > ab_age_threshold:
    print(f"      Reduction: (${taxable_income:,.2f} - ${ab_age_threshold:,.2f}) × 15%")
    print(f"               = ${ab_age_reduction:,.2f}")
    print(f"      Reduced amount: ${ab_age_amount:,.2f}")
print(f"      Credit: ${ab_age_amount:,.2f} × 10% =              ${ab_age_credit:>18,.2f}")
print()

# Dividend tax credit - Eligible (8.12% of grossed-up amount)
ab_div_credit_rate_elig = 0.0812
ab_corp_div_credit = grossed_up_dividend * ab_div_credit_rate_elig
ab_nr_elig_div_credit = grossed_up_nr_elig_div * ab_div_credit_rate_elig

print(f"  6D. Eligible Dividend Tax Credit (8.12%)")
print(f"      Corporate dividends (grossed-up): ${grossed_up_dividend:,.2f}")
print(f"      Credit: ${grossed_up_dividend:,.2f} × 8.12% =       ${ab_corp_div_credit:>18,.2f}")
print(f"      NonReg elig div (grossed-up): ${grossed_up_nr_elig_div:,.2f}")
print(f"      Credit: ${grossed_up_nr_elig_div:,.2f} × 8.12% =           ${ab_nr_elig_div_credit:>18,.2f}")
print()

# Dividend tax credit - Non-Eligible (2.18% of grossed-up amount)
ab_div_credit_rate_nonelig = 0.0218
ab_nr_nonelig_div_credit = grossed_up_nr_nonelig_div * ab_div_credit_rate_nonelig

print(f"  6E. Non-Eligible Dividend Tax Credit (2.18%)")
print(f"      NonReg non-elig div (grossed-up): ${grossed_up_nr_nonelig_div:,.2f}")
print(f"      Credit: ${grossed_up_nr_nonelig_div:,.2f} × 2.18% =            ${ab_nr_nonelig_div_credit:>18,.2f}")
print()

total_ab_credits = ab_bpa_credit + ab_pension_credit + ab_age_credit + ab_corp_div_credit + ab_nr_elig_div_credit + ab_nr_nonelig_div_credit
print(f"  TOTAL ALBERTA TAX CREDITS                  ${total_ab_credits:>18,.2f}")
print()

prov_tax_after_credits = max(0, prov_tax - total_ab_credits)
print(f"  ALBERTA TAX AFTER CREDITS")
print(f"      Tax before credits:                      ${prov_tax:>18,.2f}")
print(f"      Less: Credits                           -${total_ab_credits:>18,.2f}")
print(f"      " + "-" * 70)
print(f"      ALBERTA TAX PAYABLE                      ${prov_tax_after_credits:>18,.2f}")
print()

print("=" * 120)
print("STEP 7: TOTAL TAX SUMMARY")
print("=" * 120)
print()

total_tax_calculated = fed_tax_after_credits + prov_tax_after_credits
total_tax_api = year_2025['total_tax_p1']

print(f"  Federal Tax Payable                        ${fed_tax_after_credits:>18,.2f}")
print(f"  Alberta Tax Payable                        ${prov_tax_after_credits:>18,.2f}")
print(f"  " + "-" * 70)
print(f"  TOTAL TAX (Calculated)                     ${total_tax_calculated:>18,.2f}")
print()
print(f"  TOTAL TAX (API Reported)                   ${total_tax_api:>18,.2f}")
print(f"  Difference                                 ${total_tax_calculated - total_tax_api:>18,.2f}")
print()

# Effective tax rate
total_cash = cpp_p1 + oas_p1 + rrif_p1 + corp_div_p1 + nonreg_dist_p1
effective_rate = (total_tax_api / total_cash * 100) if total_cash > 0 else 0

print(f"  Total Cash Income Received                 ${total_cash:>18,.2f}")
print(f"  Effective Tax Rate                         {effective_rate:>18.2f}%")
print()

print("=" * 120)
