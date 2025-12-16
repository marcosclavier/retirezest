"""
Detailed Tax Breakdown for Year 2025
Shows step-by-step calculation including brackets, grossup, and credits
"""

import requests
import json
from modules.config import get_tax_params, load_tax_config

# Make API call to get simulation data
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

print("=" * 100)
print("DETAILED TAX BREAKDOWN - YEAR 2025")
print("=" * 100)
print()

# Check for errors
if not data.get('success', False):
    print(f"❌ API Error: {data.get('error', 'Unknown error')}")
    print(f"Details: {data.get('error_details', 'No details')}")
    print(f"Message: {data.get('message', 'No message')}")
    exit(1)

if not data.get('year_by_year'):
    print("❌ No year_by_year data in response")
    print(f"Response keys: {list(data.keys())}")
    exit(1)

# Get year 2025 data
year_2025 = data['year_by_year'][0]
five_year = data['five_year_plan'][0] if data.get('five_year_plan') else None

print("📊 INCOME COMPONENTS (Person 1)")
print("-" * 100)
print(f"  CPP: ${year_2025['cpp_p1']:>15,.2f}")
print(f"  OAS: ${year_2025['oas_p1']:>15,.2f}")
print(f"  RRIF Withdrawal: ${year_2025['rrif_withdrawal_p1']:>15,.2f}")
print(f"  Corporate Dividend (eligible): ${year_2025['corporate_withdrawal_p1']:>15,.2f}")

if five_year:
    print(f"  NonReg Distributions: ${five_year['nonreg_distributions_p1']:>15,.2f}")
    nr_dist = five_year['nonreg_distributions_p1']
else:
    nr_dist = 16500  # Estimated

print()

# Load tax config to get parameters
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed, prov = get_tax_params(tax_cfg, 'AB')

print("🏛️  FEDERAL TAX CALCULATION")
print("-" * 100)
print()

# Income components for tax calculation
cpp = year_2025['cpp_p1']
oas = year_2025['oas_p1']
rrif = year_2025['rrif_withdrawal_p1']
corp_div = year_2025['corporate_withdrawal_p1']

print(f"Step 1: Calculate Taxable Income")
print(f"  Ordinary Income (RRIF, CPP, OAS): ${rrif + cpp + oas:,.2f}")

# Detect dividend type from API (default to eligible for this test data)
# In production, we should check the person's corp_dividend_type setting
is_eligible = True  # Assuming eligible based on test data
div_grossup_rate = 1.38 if is_eligible else 1.15
div_type_name = "Eligible" if is_eligible else "Non-Eligible"

print(f"  Corporate {div_type_name} Dividends (actual): ${corp_div:,.2f}")
print(f"  → Grossup @ {(div_grossup_rate - 1) * 100:.0f}%: ${corp_div * div_grossup_rate:,.2f}")
print(f"  NonReg Distributions: ${nr_dist:,.2f}")
print(f"  → Capital Gains (50% inclusion): ${nr_dist * 0.5:,.2f}")
print()

taxable_income = rrif + cpp + oas + (corp_div * div_grossup_rate) + (nr_dist * 0.5)
print(f"  Total Taxable Income: ${taxable_income:,.2f}")
print()

print(f"Step 2: Apply Federal Tax Brackets (2025)")
print(f"  Bracket 1: $0 - $55,867 @ 15%")
print(f"  Bracket 2: $55,867 - $111,733 @ 20.5%")
print(f"  Bracket 3: $111,733 - $173,205 @ 26%")
print(f"  Bracket 4: $173,205 - $246,752 @ 29%")
print(f"  Bracket 5: $246,752+ @ 33%")
print()

# Calculate federal tax manually
if taxable_income <= 55867:
    fed_tax = taxable_income * 0.15
elif taxable_income <= 111733:
    fed_tax = 55867 * 0.15 + (taxable_income - 55867) * 0.205
elif taxable_income <= 173205:
    fed_tax = 55867 * 0.15 + (111733 - 55867) * 0.205 + (taxable_income - 111733) * 0.26
elif taxable_income <= 246752:
    fed_tax = 55867 * 0.15 + (111733 - 55867) * 0.205 + (173205 - 111733) * 0.26 + (taxable_income - 173205) * 0.29
else:
    fed_tax = 55867 * 0.15 + (111733 - 55867) * 0.205 + (173205 - 111733) * 0.26 + (246752 - 173205) * 0.29 + (taxable_income - 246752) * 0.33

print(f"  Tax on ${taxable_income:,.2f} = ${fed_tax:,.2f}")
print()

print(f"Step 3: Calculate Federal Non-Refundable Tax Credits")
bpa = 15705  # 2025 Basic Personal Amount
print(f"  Basic Personal Amount: ${bpa:,.2f} @ 15% = ${bpa * 0.15:,.2f}")

pension_credit_base = min(rrif + cpp, 2000)
print(f"  Pension Credit: ${pension_credit_base:,.2f} @ 15% = ${pension_credit_base * 0.15:,.2f}")

# Age amount (65+)
age_amount = 8790  # 2025 federal age amount
age_threshold = 42335
if taxable_income > age_threshold:
    age_reduction = (taxable_income - age_threshold) * 0.15
    age_amount = max(0, age_amount - age_reduction)
print(f"  Age Amount (65+): ${age_amount:,.2f} @ 15% = ${age_amount * 0.15:,.2f}")

fed_nonref_credits = bpa * 0.15 + pension_credit_base * 0.15 + age_amount * 0.15
print(f"  Total Non-Refundable Credits: ${fed_nonref_credits:,.2f}")
print()

print(f"Step 4: Calculate Federal Dividend Tax Credit")
grossed_up = corp_div * div_grossup_rate
# 2025 federal dividend tax credit rates
if is_eligible:
    div_credit_rate = 0.150198  # Eligible dividend tax credit rate (15.0198%)
else:
    div_credit_rate = 0.090301  # Non-eligible dividend tax credit rate (9.0301%)
div_credit = grossed_up * div_credit_rate
print(f"  Grossed-up Dividends: ${grossed_up:,.2f}")
print(f"  Credit Rate ({div_type_name}): {div_credit_rate * 100:.4f}%")
print(f"  Dividend Tax Credit: ${div_credit:,.2f}")
print()

total_fed_credits = fed_nonref_credits + div_credit
print(f"  Total Federal Credits: ${total_fed_credits:,.2f}")
print()

fed_tax_after_credits = max(0, fed_tax - total_fed_credits)
print(f"  Federal Tax After Credits: ${fed_tax:,.2f} - ${total_fed_credits:,.2f} = ${fed_tax_after_credits:,.2f}")
print()

# Provincial calculation
print()
print("🏘️  ALBERTA PROVINCIAL TAX CALCULATION")
print("-" * 100)
print()

print(f"Step 1: Taxable Income (same as federal)")
print(f"  Total Taxable Income: ${taxable_income:,.2f}")
print()

print(f"Step 2: Apply Alberta Tax Brackets (2025)")
print(f"  Bracket 1: $0 - $148,269 @ 10%")
print(f"  Bracket 2: $148,269 - $177,922 @ 12%")
print(f"  Bracket 3: $177,922 - $237,230 @ 13%")
print(f"  Bracket 4: $237,230 - $355,845 @ 14%")
print(f"  Bracket 5: $355,845+ @ 15%")
print()

if taxable_income <= 148269:
    prov_tax = taxable_income * 0.10
elif taxable_income <= 177922:
    prov_tax = 148269 * 0.10 + (taxable_income - 148269) * 0.12
elif taxable_income <= 237230:
    prov_tax = 148269 * 0.10 + (177922 - 148269) * 0.12 + (taxable_income - 177922) * 0.13
elif taxable_income <= 355845:
    prov_tax = 148269 * 0.10 + (177922 - 148269) * 0.12 + (237230 - 177922) * 0.13 + (taxable_income - 237230) * 0.14
else:
    prov_tax = 148269 * 0.10 + (177922 - 148269) * 0.12 + (237230 - 177922) * 0.13 + (355845 - 237230) * 0.14 + (taxable_income - 355845) * 0.15

print(f"  Tax on ${taxable_income:,.2f} = ${prov_tax:,.2f}")
print()

print(f"Step 3: Calculate Alberta Non-Refundable Tax Credits")
ab_bpa = 21885  # 2025 Alberta Basic Personal Amount
print(f"  Basic Personal Amount: ${ab_bpa:,.2f} @ 10% = ${ab_bpa * 0.10:,.2f}")

print(f"  Pension Credit: ${pension_credit_base:,.2f} @ 10% = ${pension_credit_base * 0.10:,.2f}")

# Alberta age amount
ab_age_amount = 5850  # 2025 Alberta age amount
ab_age_threshold = 42335
if taxable_income > ab_age_threshold:
    ab_age_reduction = (taxable_income - ab_age_threshold) * 0.15
    ab_age_amount = max(0, ab_age_amount - ab_age_reduction)
print(f"  Age Amount (65+): ${ab_age_amount:,.2f} @ 10% = ${ab_age_amount * 0.10:,.2f}")

prov_nonref_credits = ab_bpa * 0.10 + pension_credit_base * 0.10 + ab_age_amount * 0.10
print(f"  Total Non-Refundable Credits: ${prov_nonref_credits:,.2f}")
print()

print(f"Step 4: Calculate Alberta Dividend Tax Credit")
# 2025 Alberta dividend tax credit rates
if is_eligible:
    ab_div_credit_rate = 0.0812  # Eligible dividend tax credit rate (8.12%)
else:
    ab_div_credit_rate = 0.0218  # Non-eligible dividend tax credit rate (2.18%)
ab_div_credit = grossed_up * ab_div_credit_rate
print(f"  Grossed-up Dividends: ${grossed_up:,.2f}")
print(f"  Credit Rate ({div_type_name}): {ab_div_credit_rate * 100:.2f}%")
print(f"  Dividend Tax Credit: ${ab_div_credit:,.2f}")
print()

total_prov_credits = prov_nonref_credits + ab_div_credit
print(f"  Total Alberta Credits: ${total_prov_credits:,.2f}")
print()

prov_tax_after_credits = max(0, prov_tax - total_prov_credits)
print(f"  Alberta Tax After Credits: ${prov_tax:,.2f} - ${total_prov_credits:,.2f} = ${prov_tax_after_credits:,.2f}")
print()

# Total
print()
print("💰 TOTAL TAX SUMMARY (Person 1)")
print("-" * 100)
print(f"  Federal Tax: ${fed_tax_after_credits:,.2f}")
print(f"  Alberta Tax: ${prov_tax_after_credits:,.2f}")
print(f"  Total Tax (P1): ${fed_tax_after_credits + prov_tax_after_credits:,.2f}")
print()
print(f"  Reported Tax (P1) from API: ${year_2025['total_tax_p1']:,.2f}")
print(f"  Reported Taxable Income from API: ${year_2025['taxable_income_p1']:,.2f}")
print()

# Household total
print()
print("👥 HOUSEHOLD TOTAL TAX")
print("-" * 100)
print(f"  Person 1 Tax: ${year_2025['total_tax_p1']:,.2f}")
print(f"  Person 2 Tax: ${year_2025['total_tax_p2']:,.2f}")
print(f"  Total Household Tax: ${year_2025['total_tax']:,.2f}")
print()

# Effective rate
total_income = rrif + cpp + oas + corp_div + nr_dist
effective_rate = year_2025['total_tax'] / (total_income * 2) * 100 if total_income > 0 else 0
print(f"  Total Cash Income: ${total_income * 2:,.2f}")
print(f"  Effective Tax Rate: {effective_rate:.2f}%")
print()

print("=" * 100)
print("KEY INSIGHTS")
print("=" * 100)
print()
if is_eligible:
    print("✅ The low tax rate is due to ELIGIBLE dividend tax treatment:")
    print("   1. Generous dividend tax credit (~15.0% federal + 8.1% Alberta on grossed-up amount)")
    print("   2. Basic Personal Amount (~$2,357 federal + $2,189 Alberta per person)")
    print("   3. Pension credit (~$300 per person)")
    print("   4. Age credit (65+) (~$133 federal + $59 Alberta per person)")
    print()
    print(f"   Federal div credit: ${div_credit:,.2f}")
    print(f"   Alberta div credit: ${ab_div_credit:,.2f}")
    print(f"   Total dividend credits: ${div_credit + ab_div_credit:,.2f} per person")
    print("   This offsets most of the tax on the grossed-up dividend income!")
else:
    print("⚠️  NON-ELIGIBLE dividends have less favorable tax treatment:")
    print("   1. Lower dividend tax credit (~9.0% federal + 2.2% Alberta on grossed-up amount)")
    print("   2. Lower grossup (15% vs 38% for eligible)")
    print("   3. This results in HIGHER total tax")
    print()
    print(f"   Federal div credit: ${div_credit:,.2f}")
    print(f"   Alberta div credit: ${ab_div_credit:,.2f}")
    print(f"   Total dividend credits: ${div_credit + ab_div_credit:,.2f} per person")
print()
print("💡 This is by design - the dividend tax credit system prevents double")
print("   taxation since the corporation already paid tax on the earnings.")
print()
print("📊 COMPARISON: Eligible vs Non-Eligible Dividends")
print("-" * 100)
print(f"   Dividend Amount: ${corp_div:,.2f}")
print()
print("   Eligible Dividends:")
print(f"     Grossup: 38% → ${corp_div * 1.38:,.2f} added to taxable income")
print(f"     Federal Credit: 15.02% of grossed-up → ${corp_div * 1.38 * 0.150198:,.2f}")
print(f"     Alberta Credit: 8.12% of grossed-up → ${corp_div * 1.38 * 0.0812:,.2f}")
print(f"     Total Credits: ${corp_div * 1.38 * (0.150198 + 0.0812):,.2f}")
print()
print("   Non-Eligible Dividends:")
print(f"     Grossup: 15% → ${corp_div * 1.15:,.2f} added to taxable income")
print(f"     Federal Credit: 9.03% of grossed-up → ${corp_div * 1.15 * 0.090301:,.2f}")
print(f"     Alberta Credit: 2.18% of grossed-up → ${corp_div * 1.15 * 0.0218:,.2f}")
print(f"     Total Credits: ${corp_div * 1.15 * (0.090301 + 0.0218):,.2f}")
print()
print("   💡 Eligible dividends provide ${:,.2f} MORE in tax credits!".format(
    corp_div * 1.38 * (0.150198 + 0.0812) - corp_div * 1.15 * (0.090301 + 0.0218)
))
print()
