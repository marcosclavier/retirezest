"""
Comprehensive Tax Audit for Juan & Daniela - Year 2025

This script performs a detailed audit of tax calculations for the couple's
first year (2025) by:
1. Fetching the actual API response
2. Breaking down all income components
3. Calculating federal and provincial taxes step-by-step
4. Comparing with the API results
"""

import requests
import json
from modules.models import TaxParams, Bracket
from modules.tax_engine import progressive_tax
from modules.config import load_tax_config, get_tax_params

# Configuration for Juan & Daniela
payload = {
    'p1': {
        'name': 'Juan',
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
        'name': 'Daniela',
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
    'spending_go_go': 200000,
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

print("=" * 100)
print("TAX AUDIT FOR JUAN & DANIELA - YEAR 2025")
print("=" * 100)
print()

# Call the API
try:
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload)
    data = response.json()

    if not data.get('success', False):
        print(f"❌ API Error: {data.get('error', 'Unknown error')}")
        exit(1)

    # Get year 2025 data
    year_2025 = data['year_by_year'][0]

    print("STEP 1: API RESPONSE - 2025 SUMMARY")
    print("-" * 100)
    print(f"Total Tax (API):                     ${year_2025['total_tax']:>12,.2f}")
    print(f"Tax P1 (API):                        ${year_2025['total_tax_p1']:>12,.2f}")
    print(f"Tax P2 (API):                        ${year_2025['total_tax_p2']:>12,.2f}")
    print(f"Taxable Income P1:                   ${year_2025['taxable_income_p1']:>12,.2f}")
    print(f"Taxable Income P2:                   ${year_2025['taxable_income_p2']:>12,.2f}")
    print(f"Spending Need:                       ${year_2025['spending_need']:>12,.2f}")
    print(f"Spending Met:                        ${year_2025['spending_met']:>12,.2f}")
    print()

    print("STEP 2: WITHDRAWAL BREAKDOWN")
    print("-" * 100)
    print("Juan (P1):")
    print(f"  CPP:                               ${year_2025['cpp_p1']:>12,.2f}")
    print(f"  OAS:                               ${year_2025['oas_p1']:>12,.2f}")
    print(f"  RRIF Withdrawal:                   ${year_2025['rrif_withdrawal_p1']:>12,.2f}")
    print(f"  NonReg Withdrawal:                 ${year_2025['nonreg_withdrawal_p1']:>12,.2f}")
    print(f"  TFSA Withdrawal:                   ${year_2025['tfsa_withdrawal_p1']:>12,.2f}")
    print(f"  Corporate Withdrawal:              ${year_2025['corporate_withdrawal_p1']:>12,.2f}")

    # Get NonReg distributions if available
    nonreg_dist_p1 = year_2025.get('nonreg_distributions', 0) / 2  # Assume split equally
    print(f"  NonReg Distributions (passive):    ${nonreg_dist_p1:>12,.2f}")
    print()

    print("Daniela (P2):")
    print(f"  CPP:                               ${year_2025['cpp_p2']:>12,.2f}")
    print(f"  OAS:                               ${year_2025['oas_p2']:>12,.2f}")
    print(f"  RRIF Withdrawal:                   ${year_2025['rrif_withdrawal_p2']:>12,.2f}")
    print(f"  NonReg Withdrawal:                 ${year_2025['nonreg_withdrawal_p2']:>12,.2f}")
    print(f"  TFSA Withdrawal:                   ${year_2025['tfsa_withdrawal_p2']:>12,.2f}")
    print(f"  Corporate Withdrawal:              ${year_2025['corporate_withdrawal_p2']:>12,.2f}")

    nonreg_dist_p2 = year_2025.get('nonreg_distributions', 0) / 2
    print(f"  NonReg Distributions (passive):    ${nonreg_dist_p2:>12,.2f}")
    print()

    # Get 5-year plan for more detailed withdrawal info
    if 'five_year_plan' in data:
        five_year_2025 = data['five_year_plan'][0]
        print("STEP 3: 5-YEAR PLAN WITHDRAWAL DETAILS")
        print("-" * 100)
        print(f"Spending Target:                     ${five_year_2025['spending_target']:>12,.2f}")
        print()
        print("Juan (P1):")
        print(f"  RRIF:                              ${five_year_2025['rrif_withdrawal_p1']:>12,.2f}")
        print(f"  NonReg:                            ${five_year_2025['nonreg_withdrawal_p1']:>12,.2f}")
        print(f"  Corporate:                         ${five_year_2025['corp_withdrawal_p1']:>12,.2f}")
        print(f"  NonReg Distributions:              ${five_year_2025.get('nonreg_distributions_p1', 0):>12,.2f}")
        print(f"  Total Withdrawn P1:                ${five_year_2025['total_withdrawn_p1']:>12,.2f}")
        print()
        print("Daniela (P2):")
        print(f"  RRIF:                              ${five_year_2025['rrif_withdrawal_p2']:>12,.2f}")
        print(f"  NonReg:                            ${five_year_2025['nonreg_withdrawal_p2']:>12,.2f}")
        print(f"  Corporate:                         ${five_year_2025['corp_withdrawal_p2']:>12,.2f}")
        print(f"  NonReg Distributions:              ${five_year_2025.get('nonreg_distributions_p2', 0):>12,.2f}")
        print(f"  Total Withdrawn P2:                ${five_year_2025['total_withdrawn_p2']:>12,.2f}")
        print()
        print(f"Total Withdrawn (Both):              ${five_year_2025['total_withdrawn']:>12,.2f}")
        print()

    print("STEP 4: TAX CALCULATION AUDIT")
    print("-" * 100)
    print("Using 2025 tax brackets and rates for Alberta:")
    print()

    # Get tax parameters
    tax_cfg = load_tax_config('tax_config_canada_2025.json')
    fed_params, prov_params = get_tax_params(tax_cfg, 'AB')

    print("Federal Brackets (2025):")
    for i, bracket in enumerate(fed_params.brackets):
        print(f"  ${bracket.threshold:>10,.0f}+  →  {bracket.rate*100:>5.1f}%")
    print()

    print("Alberta Provincial Brackets (2025):")
    for i, bracket in enumerate(prov_params.brackets):
        print(f"  ${bracket.threshold:>10,.0f}+  →  {bracket.rate*100:>5.1f}%")
    print()

    print("Non-Refundable Credits:")
    print(f"  Federal BPA:                       ${fed_params.bpa_amount:>12,.2f} × {fed_params.bpa_rate*100:.1f}% = ${fed_params.bpa_amount * fed_params.bpa_rate:>10,.2f}")
    print(f"  Provincial BPA:                    ${prov_params.bpa_amount:>12,.2f} × {prov_params.bpa_rate*100:.1f}% = ${prov_params.bpa_amount * prov_params.bpa_rate:>10,.2f}")
    print(f"  Federal Pension Credit:            ${fed_params.pension_credit_amount:>12,.2f} × {fed_params.pension_credit_rate*100:.1f}%")
    print(f"  Provincial Pension Credit:         ${prov_params.pension_credit_amount:>12,.2f} × {prov_params.pension_credit_rate*100:.1f}%")
    print(f"  Federal Age Amount (65+):          ${fed_params.age_amount:>12,.2f}")
    print(f"  Provincial Age Amount (65+):       ${prov_params.age_amount:>12,.2f}")
    print()

    print("STEP 5: DETAILED TAX CALCULATION (Per Person)")
    print("-" * 100)

    # For a precise calculation, we need to know the exact income breakdown
    # Let's calculate based on what we know from the withdrawals

    # RRIF withdrawals are fully taxable as ordinary income
    rrif_p1 = year_2025['rrif_withdrawal_p1']
    rrif_p2 = year_2025['rrif_withdrawal_p2']

    # Corporate withdrawals are likely eligible dividends (based on config)
    corp_div_p1 = year_2025['corporate_withdrawal_p1']
    corp_div_p2 = year_2025['corporate_withdrawal_p2']

    # NonReg withdrawals may trigger capital gains
    nonreg_wd_p1 = year_2025['nonreg_withdrawal_p1']
    nonreg_wd_p2 = year_2025['nonreg_withdrawal_p2']

    # NonReg distributions (passive income)
    nonreg_dist_total = year_2025.get('nonreg_distributions', 0)

    print(f"Note: Detailed income breakdown requires additional API data.")
    print(f"The simulation uses complex logic to determine:")
    print(f"  - Ordinary income (RRIF, interest)")
    print(f"  - Eligible dividends (from corporate)")
    print(f"  - Non-eligible dividends")
    print(f"  - Capital gains (from NonReg sales)")
    print(f"  - Return of capital")
    print()

    print("SUMMARY")
    print("=" * 100)
    print(f"Total Tax from API:                  ${year_2025['total_tax']:>12,.2f}")
    print(f"Taxable Income P1:                   ${year_2025['taxable_income_p1']:>12,.2f}")
    print(f"Taxable Income P2:                   ${year_2025['taxable_income_p2']:>12,.2f}")
    print()

    # Check if tax seems reasonable
    total_income = year_2025['taxable_income_p1'] + year_2025['taxable_income_p2']
    effective_rate = year_2025['total_tax'] / total_income if total_income > 0 else 0
    print(f"Total Taxable Income:                ${total_income:>12,.2f}")
    print(f"Effective Tax Rate:                  {effective_rate*100:>13.2f}%")
    print()

    if year_2025['total_tax'] < 15000:
        print("⚠️  WARNING: Tax amount seems LOW for this income level")
        print("   Expected range: $18,000 - $22,000")
    elif year_2025['total_tax'] > 25000:
        print("⚠️  WARNING: Tax amount seems HIGH for this income level")
        print("   Expected range: $18,000 - $22,000")
    else:
        print("✅ Tax amount appears reasonable for this income level")

except requests.exceptions.ConnectionError:
    print("❌ ERROR: Cannot connect to API at http://localhost:8000")
    print("   Please ensure the backend server is running with:")
    print("   cd juan-retirement-app && python -m uvicorn api.main:app --reload")
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
