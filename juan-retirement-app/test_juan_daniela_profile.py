"""
Test the API with Juan and Daniela's actual profile to see what tax is being calculated
"""

import requests
import json

# Make API call with Juan and Daniela's profile
response = requests.post(
    'http://localhost:8000/api/run-simulation',
    json={
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

print("=" * 100)
print("JUAN & DANIELA - YEAR 2025 TAX CALCULATION")
print("=" * 100)
print()

print("WITHDRAWALS:")
print(f"  RRIF (P1):                   ${year_2025['rrif_withdrawal_p1']:,.2f}")
print(f"  RRIF (P2):                   ${year_2025['rrif_withdrawal_p2']:,.2f}")
print(f"  NonReg (P1):                 ${year_2025['nonreg_withdrawal_p1']:,.2f}")
print(f"  NonReg (P2):                 ${year_2025['nonreg_withdrawal_p2']:,.2f}")
print(f"  Corporate (P1):              ${year_2025['corporate_withdrawal_p1']:,.2f}")
print(f"  Corporate (P2):              ${year_2025['corporate_withdrawal_p2']:,.2f}")
print()

print("TAX INFORMATION:")
print(f"  Taxable Income (P1):         ${year_2025['taxable_income_p1']:,.2f}")
print(f"  Taxable Income (P2):         ${year_2025['taxable_income_p2']:,.2f}")
print(f"  Total Tax (P1):              ${year_2025['total_tax_p1']:,.2f}")
print(f"  Total Tax (P2):              ${year_2025['total_tax_p2']:,.2f}")
print()

print("=" * 100)
print(f"TOTAL HOUSEHOLD TAX:         ${year_2025['total_tax']:,.2f}")
print("=" * 100)
print()

# Show total household income
total_income = (
    year_2025['rrif_withdrawal_p1'] + year_2025['rrif_withdrawal_p2'] +
    year_2025['nonreg_withdrawal_p1'] + year_2025['nonreg_withdrawal_p2'] +
    year_2025['corporate_withdrawal_p1'] + year_2025['corporate_withdrawal_p2']
)
print(f"Total Household Income:      ${total_income:,.2f}")
print(f"Effective Tax Rate:          {(year_2025['total_tax'] / total_income * 100):.2f}%")
print()

# Check if this matches expected
expected_tax = 19772.21
difference = year_2025['total_tax'] - expected_tax
if abs(difference) < 1:
    print(f"✅ Tax calculation is CORRECT: ${year_2025['total_tax']:,.2f}")
else:
    print(f"❌ Tax calculation is WRONG:")
    print(f"   Expected: ${expected_tax:,.2f}")
    print(f"   Got:      ${year_2025['total_tax']:,.2f}")
    print(f"   Difference: ${difference:,.2f}")
