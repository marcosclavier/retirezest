#!/usr/bin/env python3
"""
Test scenario matching the user's screenshot:
- Year 2031, Age 65
- RRIF withdrawal $28,000
- Spending target $90,000
- Gap status
"""
import requests
import json

# Scenario matching screenshot
payload = {
    "p1": {
        "name": "Test Person",
        "start_age": 65,
        "cpp_start_age": 65,  # CPP showing $12,502 in screenshot
        "cpp_amount": 12502,
        "oas_start_age": 65,  # OAS showing $8,904 in screenshot
        "oas_amount": 8904,
        "tfsa_balance": 52500,  # From screenshot end balances
        "rrif_balance": 338100,  # From screenshot end balances
        "rrsp_balance": 0,
        "nonreg_balance": 154950,  # From screenshot end balances
        "nonreg_acb": 154950,
        "corporate_balance": 0,
        "pension_incomes": [{
            "name": "Employer Pension",
            "amount": 50000,  # From screenshot
            "start_age": 65,
            "indexed_to_inflation": False
        }],
        "other_incomes": []
    },
    "p2": {
        "name": "",
        "is_retired": False
    },
    "hh": {
        "province": "ON",
        "start_year": 2025,  # Start at age 65 in 2025 (not 2031)
        "end_year": 2035,  # End at age 75
        "spending_target": 90000,  # From screenshot
        "strategy": "rrif-frontload",
        "contribution_start_year": 2024,
        "inflation_general": 2.0,
        "return_rrif": 5.0,
        "return_nonreg": 5.0,
        "nonreg_interest_pct": 25.0,
        "nonreg_elig_div_pct": 25.0,
        "nonreg_capg_dist_pct": 50.0,
        "reinvest_nonreg_dist": False
    }
}

print("=" * 80)
print("SCREENSHOT SCENARIO TEST - Year 2031, Age 65")
print("=" * 80)
print(f"RRIF Balance: ${payload['p1']['rrif_balance']:,}")
print(f"OAS Start Age: {payload['p1']['oas_start_age']}")
print(f"Current Age: 65")
print(f"\nOAS Status: {'AFTER OAS' if 65 >= payload['p1']['oas_start_age'] else 'BEFORE OAS'}")
print(f"Expected frontload %: {'8%' if 65 > payload['p1']['oas_start_age'] else '15%'}")
print(f"Expected RRIF withdrawal: ${payload['p1']['rrif_balance'] * (0.08 if 65 > payload['p1']['oas_start_age'] else 0.15):,.0f}")
print(f"\nSpending Target: ${payload['hh']['spending_target']:,}")
print("\n" + "-" * 80)

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"❌ ERROR: API returned {response.status_code}")
        print(response.text[:500])
    else:
        data = response.json()

        if 'years' in data and len(data['years']) > 0:
            year_2025 = next((y for y in data['years'] if y['year'] == 2025), None)

            if year_2025:
                print(f"\n✅ FOUND Year 2025 Data (Age 65):")
                print(f"\n📊 WITHDRAWALS:")
                print(f"   RRIF: ${year_2025.get('total_withdrawals', {}).get('rrif', 0):,.0f}")
                print(f"   NonReg: ${year_2025.get('total_withdrawals', {}).get('nonreg', 0):,.0f}")
                print(f"   TFSA: ${year_2025.get('total_withdrawals', {}).get('tfsa', 0):,.0f}")
                print(f"   Total Withdrawals: ${year_2025.get('total_withdrawals', {}).get('rrif', 0) + year_2025.get('total_withdrawals', {}).get('nonreg', 0) + year_2025.get('total_withdrawals', {}).get('tfsa', 0):,.0f}")

                print(f"\n💰 INCOME:")
                print(f"   CPP: ${year_2025.get('cpp', 0):,.0f}")
                print(f"   OAS: ${year_2025.get('oas', 0):,.0f}")
                print(f"   Pension: ${year_2025.get('pension_income_p1', 0):,.0f}")

                print(f"\n💸 OUTFLOWS:")
                print(f"   Tax Paid: ${year_2025.get('tax_paid', 0):,.0f}")
                print(f"   Spending Target: ${payload['hh']['spending_target']:,}")

                print(f"\n📈 STATUS:")
                print(f"   Status: {year_2025.get('status', 'Unknown')}")

                if year_2025.get('status') == 'Gap':
                    gap = year_2025.get('gap', 0)
                    print(f"   ⚠️  GAP: ${gap:,.0f}")
                    print(f"\n   This means withdrawals are INSUFFICIENT by ${gap:,.0f}")
                else:
                    print(f"   ✅ Fully funded!")

            else:
                print(f"\n❌ Year 2025 not found")
                print(f"Available years: {[y['year'] for y in data['years'][:5]]}")
        else:
            print(f"\n❌ No years data")
            print(f"Message: {data.get('message', 'No message')}")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Check backend logs: tail -100 /tmp/uvicorn-test.log")
print("=" * 80)
