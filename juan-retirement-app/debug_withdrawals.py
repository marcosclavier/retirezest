"""Debug actual withdrawals being made"""
import requests
import json

payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
        "tfsa_balance": 100000,
        "rrif_balance": 0,
        "rrsp_balance": 150000,
        "nonreg_balance": 215000,
        "corporate_balance": 2000000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
        "tfsa_balance": 100000,
        "rrif_balance": 0,
        "rrsp_balance": 150000,
        "nonreg_balance": 215000,
        "corporate_balance": 2000000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "spending_go_go": 200000,
    "spending_slow_go": 200000,
    "spending_no_go": 200000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85
}

response = requests.post("http://localhost:8000/api/run-simulation", json=payload)
data = response.json()

if data.get("year_by_year"):
    year = data["year_by_year"][0]

    print("=" * 80)
    print("2025 WITHDRAWALS & INCOME")
    print("=" * 80)
    print(f"\nPERSON 1:")
    print(f"  TFSA withdrawal:      ${year.get('tfsa_withdrawal_p1', 0):,.2f}")
    print(f"  RRIF withdrawal:      ${year.get('rrif_withdrawal_p1', 0):,.2f}")
    print(f"  NonReg withdrawal:    ${year.get('nonreg_withdrawal_p1', 0):,.2f}")
    print(f"  Corporate withdrawal: ${year.get('corporate_withdrawal_p1', 0):,.2f}")
    print(f"  NonReg distributions: ${year.get('nonreg_distributions', 0) / 2:,.2f}")
    print(f"  → Taxable Income:     ${year.get('taxable_income_p1', 0):,.2f}")
    print(f"  → Tax:                ${year.get('total_tax_p1', 0):,.2f}")

    print(f"\nPERSON 2:")
    print(f"  TFSA withdrawal:      ${year.get('tfsa_withdrawal_p2', 0):,.2f}")
    print(f"  RRIF withdrawal:      ${year.get('rrif_withdrawal_p2', 0):,.2f}")
    print(f"  NonReg withdrawal:    ${year.get('nonreg_withdrawal_p2', 0):,.2f}")
    print(f"  Corporate withdrawal: ${year.get('corporate_withdrawal_p2', 0):,.2f}")
    print(f"  NonReg distributions: ${year.get('nonreg_distributions', 0) / 2:,.2f}")
    print(f"  → Taxable Income:     ${year.get('taxable_income_p2', 0):,.2f}")
    print(f"  → Tax:                ${year.get('total_tax_p2', 0):,.2f}")

    print(f"\nTOTAL:")
    print(f"  Total withdrawals:    ${year.get('tfsa_withdrawal_p1', 0) + year.get('tfsa_withdrawal_p2', 0) + year.get('rrif_withdrawal_p1', 0) + year.get('rrif_withdrawal_p2', 0) + year.get('nonreg_withdrawal_p1', 0) + year.get('nonreg_withdrawal_p2', 0) + year.get('corporate_withdrawal_p1', 0) + year.get('corporate_withdrawal_p2', 0):,.2f}")
    print(f"  Total distributions:  ${year.get('nonreg_distributions', 0):,.2f}")
    print(f"  Spending need:        ${year.get('spending_need', 0):,.2f}")
    print(f"  Spending met:         ${year.get('spending_met', 0):,.2f}")
    print(f"  Total tax:            ${year.get('total_tax', 0):,.2f}")

    print("\n" + "=" * 80)
    print("EXPECTED vs ACTUAL")
    print("=" * 80)
    print(f"Expected tax:         $19,750.37")
    print(f"Actual tax:           ${year.get('total_tax', 0):,.2f}")
    print(f"Difference:           ${abs(year.get('total_tax', 0) - 19750.37):,.2f}")
