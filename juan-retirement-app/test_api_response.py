"""
Test what the API is actually returning for Juan & Daniela with spending $200,000
"""

import requests
import json

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
)

data = response.json()

if not data.get('success', False):
    print(f"❌ API Error: {data.get('error', 'Unknown error')}")
    exit(1)

# Get year 2025 data
year_2025 = data['year_by_year'][0]

print("=" * 100)
print("CHECKING API RESPONSE - YEAR 2025")
print("=" * 100)
print()
print(f"Total Tax in API Response:       ${year_2025['total_tax']:,.2f}")
print(f"Tax P1 in API Response:          ${year_2025['total_tax_p1']:,.2f}")
print(f"Tax P2 in API Response:          ${year_2025['total_tax_p2']:,.2f}")
print(f"Taxable Income P1:               ${year_2025['taxable_income_p1']:,.2f}")
print(f"Taxable Income P2:               ${year_2025['taxable_income_p2']:,.2f}")
print()
print("Expected:")
print(f"  Total Tax should be:           $19,772.21")
print(f"  Tax per person should be:      $9,886.10")
print(f"  Taxable income should be:      $170,695.56")
print()

if abs(year_2025['total_tax'] - 19772.21) < 1:
    print("✅ API is returning CORRECT tax values!")
else:
    print(f"❌ API is returning WRONG tax: ${year_2025['total_tax']:,.2f}")
    print(f"   Difference: ${year_2025['total_tax'] - 19772.21:,.2f}")
