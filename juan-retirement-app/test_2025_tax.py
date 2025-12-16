"""
Test tax calculation for 2025 scenario
Corporate withdrawal: $160,575
RRIF withdrawal: $17,800
Expected tax: $3,084 (seems too low)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax

# Load 2025 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")
fed_params, prov_params = get_tax_params(tax_cfg, "AB")

# Test scenario from user's simulation
age = 65
rrif_withdrawal = 17_800
corporate_dividend = 160_575  # Eligible dividend

# Test 1: RRIF only (should be taxed as ordinary income)
print("=" * 80)
print("TEST 1: RRIF Withdrawal Only ($17,800)")
print("=" * 80)
fed_res = progressive_tax(
    fed_params, age,
    pension_income=rrif_withdrawal,
    ordinary_income=0,
    elig_dividends=0,
    nonelig_dividends=0,
    cap_gains=0,
    oas_received=0
)
prov_res = progressive_tax(
    prov_params, age,
    pension_income=rrif_withdrawal,
    ordinary_income=0,
    elig_dividends=0,
    nonelig_dividends=0,
    cap_gains=0,
    oas_received=0
)
print(f"Federal tax: ${fed_res['net_tax']:,.2f}")
print(f"Provincial tax: ${prov_res['net_tax']:,.2f}")
print(f"Total tax: ${fed_res['net_tax'] + prov_res['net_tax']:,.2f}")
print()

# Test 2: Corporate dividend only (eligible)
print("=" * 80)
print("TEST 2: Corporate Dividend Only - ELIGIBLE ($160,575)")
print("=" * 80)
fed_res = progressive_tax(
    fed_params, age,
    pension_income=0,
    ordinary_income=0,
    elig_dividends=corporate_dividend,
    nonelig_dividends=0,
    cap_gains=0,
    oas_received=0
)
prov_res = progressive_tax(
    prov_params, age,
    pension_income=0,
    ordinary_income=0,
    elig_dividends=corporate_dividend,
    nonelig_dividends=0,
    cap_gains=0,
    oas_received=0
)
print(f"Grossed up amount: ${corporate_dividend * (1 + fed_params.dividend_grossup_eligible):,.2f}")
print(f"Grossup rate: {fed_params.dividend_grossup_eligible:.4f} ({fed_params.dividend_grossup_eligible*100:.2f}%)")
print(f"Dividend credit rate (fed): {fed_params.dividend_credit_rate_eligible:.4f} ({fed_params.dividend_credit_rate_eligible*100:.2f}%)")
print(f"Dividend credit rate (prov): {prov_params.dividend_credit_rate_eligible:.4f} ({prov_params.dividend_credit_rate_eligible*100:.2f}%)")
print(f"\nFederal tax: ${fed_res['net_tax']:,.2f}")
print(f"  Taxable income: ${fed_res['taxable_income']:,.2f}")
print(f"  Gross tax: ${fed_res['gross_tax']:,.2f}")
print(f"  Total credits: ${fed_res.get('total_credits', 0):,.2f}")
print(f"Provincial tax: ${prov_res['net_tax']:,.2f}")
print(f"  Taxable income: ${prov_res['taxable_income']:,.2f}")
print(f"  Gross tax: ${prov_res['gross_tax']:,.2f}")
print(f"  Total credits: ${prov_res.get('total_credits', 0):,.2f}")
print(f"\nTotal tax: ${fed_res['net_tax'] + prov_res['net_tax']:,.2f}")
print()

# Test 3: Corporate dividend only (NON-eligible)
print("=" * 80)
print("TEST 3: Corporate Dividend Only - NON-ELIGIBLE ($160,575)")
print("=" * 80)
fed_res = progressive_tax(
    fed_params, age,
    pension_income=0,
    ordinary_income=0,
    elig_dividends=0,
    nonelig_dividends=corporate_dividend,
    cap_gains=0,
    oas_received=0
)
prov_res = progressive_tax(
    prov_params, age,
    pension_income=0,
    ordinary_income=0,
    elig_dividends=0,
    nonelig_dividends=corporate_dividend,
    cap_gains=0,
    oas_received=0
)
print(f"Grossed up amount: ${corporate_dividend * (1 + fed_params.dividend_grossup_noneligible):,.2f}")
print(f"Grossup rate: {fed_params.dividend_grossup_noneligible:.4f} ({fed_params.dividend_grossup_noneligible*100:.2f}%)")
print(f"\nFederal tax: ${fed_res['net_tax']:,.2f}")
print(f"Provincial tax: ${prov_res['net_tax']:,.2f}")
print(f"Total tax: ${fed_res['net_tax'] + prov_res['net_tax']:,.2f}")
print()

# Test 4: Both RRIF + Corporate dividend (eligible)
print("=" * 80)
print("TEST 4: RRIF + Corporate Dividend - ELIGIBLE ($17,800 + $160,575)")
print("=" * 80)
fed_res = progressive_tax(
    fed_params, age,
    pension_income=rrif_withdrawal,
    ordinary_income=0,
    elig_dividends=corporate_dividend,
    nonelig_dividends=0,
    cap_gains=0,
    oas_received=0
)
prov_res = progressive_tax(
    prov_params, age,
    pension_income=rrif_withdrawal,
    ordinary_income=0,
    elig_dividends=corporate_dividend,
    nonelig_dividends=0,
    cap_gains=0,
    oas_received=0
)
print(f"Federal tax: ${fed_res['net_tax']:,.2f}")
print(f"Provincial tax: ${prov_res['net_tax']:,.2f}")
print(f"Total tax: ${fed_res['net_tax'] + prov_res['net_tax']:,.2f}")
print()

# Test 5: Both RRIF + Corporate dividend (NON-eligible)
print("=" * 80)
print("TEST 5: RRIF + Corporate Dividend - NON-ELIGIBLE ($17,800 + $160,575)")
print("=" * 80)
fed_res = progressive_tax(
    fed_params, age,
    pension_income=rrif_withdrawal,
    ordinary_income=0,
    elig_dividends=0,
    nonelig_dividends=corporate_dividend,
    cap_gains=0,
    oas_received=0
)
prov_res = progressive_tax(
    prov_params, age,
    pension_income=rrif_withdrawal,
    ordinary_income=0,
    elig_dividends=0,
    nonelig_dividends=corporate_dividend,
    cap_gains=0,
    oas_received=0
)
print(f"Federal tax: ${fed_res['net_tax']:,.2f}")
print(f"Provincial tax: ${prov_res['net_tax']:,.2f}")
print(f"Total tax: ${fed_res['net_tax'] + prov_res['net_tax']:,.2f}")
print()

print("=" * 80)
print("COMPARISON WITH USER'S RESULT: $3,084")
print("=" * 80)
print("If eligible dividend: This suggests there may be an issue with")
print("how corporate withdrawals are being classified or taxed.")
