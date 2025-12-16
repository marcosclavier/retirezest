"""
Test simulation with CORRECTED tax brackets and NON-ELIGIBLE corporate dividends
"""

import requests
import json

API_URL = "http://localhost:8000"

# Your actual profile data with NON-ELIGIBLE corporate dividends
payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "rrif_balance": 185000,
        "tfsa_balance": 182000,
        "nonreg_balance": 415000,
        "corporate_balance": 1195000,
        "corp_dividend_type": "non-eligible"  # ← Changed from "eligible"
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "rrif_balance": 260000,
        "tfsa_balance": 95000,
        "nonreg_balance": 415000,
        "corporate_balance": 1195000,
        "corp_dividend_type": "non-eligible"  # ← Changed from "eligible"
    },
    "province": "AB",
    "spending_go_go": 200000,
    "spending_slow_go": 200000,
    "spending_no_go": 200000,
    "go_go_years": 10,
    "slow_go_years": 10,
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "inflation_rate": 0.02,
    "rrif_withdrawal_percent": None,
    "reinvest_nonreg_dist": True
}

print("="*100)
print("RUNNING SIMULATION WITH CORRECTED TAX BRACKETS")
print("="*100)
print(f"\nConfiguration:")
print(f"  - Corporate dividend type: NON-ELIGIBLE (realistic for CCPC)")
print(f"  - Tax brackets: CORRECTED (fixed threshold=0 bug)")
print(f"  - Strategy: {payload['strategy']}")
print(f"  - Spending: ${payload['spending_go_go']:,}/year")
print("\nCalling API...")

try:
    response = requests.post(
        f"{API_URL}/api/run-simulation",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30
    )

    if response.status_code == 200:
        result = response.json()

        print("\n✅ Simulation completed successfully!")
        print("="*100)
        print("FIRST 5 YEARS DETAILED BREAKDOWN")
        print("="*100)

        for i, year_result in enumerate(result['years'][:5]):
            year = year_result['year']
            ages = f"{year_result['age_p1']}/{year_result['age_p2']}"

            # Withdrawals
            corp_p1 = year_result.get('withdrawal_corp_p1', 0)
            corp_p2 = year_result.get('withdrawal_corp_p2', 0)
            rrif_p1 = year_result.get('withdrawal_rrif_p1', 0)
            rrif_p2 = year_result.get('withdrawal_rrif_p2', 0)

            # Taxes
            tax_p1 = year_result.get('tax_p1', 0)
            tax_p2 = year_result.get('tax_p2', 0)
            total_tax = year_result.get('total_tax', 0)

            # Balances
            corp_bal = year_result.get('corporate_balance_eoy', 0)
            rrif_bal_p1 = year_result.get('rrif_p1_eoy', 0)
            rrif_bal_p2 = year_result.get('rrif_p2_eoy', 0)

            print(f"\n{year} (Ages {ages}):")
            print(f"  Withdrawals:")
            print(f"    Corporate: ${corp_p1 + corp_p2:>12,.0f}  (Juan: ${corp_p1:,.0f}, Daniela: ${corp_p2:,.0f})")
            print(f"    RRIF:      ${rrif_p1 + rrif_p2:>12,.0f}  (Juan: ${rrif_p1:,.0f}, Daniela: ${rrif_p2:,.0f})")
            print(f"  Taxes:")
            print(f"    Total:     ${total_tax:>12,.0f}  (Juan: ${tax_p1:,.0f}, Daniela: ${tax_p2:,.0f})")
            print(f"  Balances:")
            print(f"    Corporate: ${corp_bal:>12,.0f}")
            print(f"    RRIF:      ${rrif_bal_p1 + rrif_bal_p2:>12,.0f}")

        print("\n" + "="*100)
        print("TAX COMPARISON: OLD vs NEW")
        print("="*100)
        print(f"\n2025 Tax Comparison:")
        print(f"  OLD (broken brackets):     $  3,084")
        print(f"  NEW (corrected):           ${result['years'][0].get('total_tax', 0):>7,.0f}")
        print(f"  Difference:                ${result['years'][0].get('total_tax', 0) - 3084:>7,.0f}")

        # Show total taxes over 5 years
        total_5yr_tax = sum(yr.get('total_tax', 0) for yr in result['years'][:5])
        print(f"\nTotal tax (first 5 years):")
        print(f"  NEW (corrected):           ${total_5yr_tax:>12,.0f}")

        # Check for shortfalls
        shortfalls = [yr for yr in result['years'] if yr.get('shortfall', 0) > 0]
        if shortfalls:
            print(f"\n⚠️  SHORTFALLS DETECTED:")
            print(f"  First shortfall: Year {shortfalls[0]['year']} (${shortfalls[0]['shortfall']:,.0f})")
            print(f"  Total shortfalls: {len(shortfalls)} years")
        else:
            print(f"\n✅ No shortfalls - plan is sustainable!")

        # Final balances
        final_year = result['years'][-1]
        print(f"\nFinal Year ({final_year['year']}):")
        print(f"  Corporate balance: ${final_year.get('corporate_balance_eoy', 0):>12,.0f}")
        print(f"  RRIF balance:      ${final_year.get('rrif_p1_eoy', 0) + final_year.get('rrif_p2_eoy', 0):>12,.0f}")
        print(f"  TFSA balance:      ${final_year.get('tfsa_p1_eoy', 0) + final_year.get('tfsa_p2_eoy', 0):>12,.0f}")

        print("="*100)

    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Error: {e}")
    print("\nMake sure the API server is running:")
    print("  cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app")
    print("  uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload")
