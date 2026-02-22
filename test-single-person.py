#!/usr/bin/env python3
"""
Test single person scenario - Rafael at age 65
"""
import requests
import json

# Single person scenario
payload = {
    "p1": {
        "name": "Rafael",
        "start_age": 65,
        "end_age": 75,
        "cpp_start_age": 65,
        "cpp_amount": 12502,
        "oas_start_age": 65,
        "oas_amount": 8904,
        "tfsa_balance": 52500,
        "rrif_balance": 338100,
        "rrsp_balance": 0,
        "nonreg_balance": 154950,
        "nonreg_acb": 154950,
        "corporate_balance": 0,
        "pension_incomes": [{
            "name": "Employer Pension",
            "amount": 50000,
            "start_age": 65,
            "indexed_to_inflation": False
        }],
        "other_incomes": []
    },
    "hh": {
        "province": "ON",
        "start_year": 2025,
        "spending_target": 90000,
        "strategy": "rrif-frontload",
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
print("SINGLE PERSON TEST - Rafael Age 65")
print("=" * 80)
print(f"RRIF Balance: ${payload['p1']['rrif_balance']:,}")
print(f"OAS Start Age: {payload['p1']['oas_start_age']}")
print(f"Age: 65")
print(f"\nExpected: 8% RRIF withdrawal = ${payload['p1']['rrif_balance'] * 0.08:,.0f}")
print(f"Spending Target: ${payload['hh']['spending_target']:,}")
print("\nSending request...")

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text[:500])
    else:
        data = response.json()

        if 'years' in data and len(data['years']) > 0:
            year_2025 = data['years'][0]  # First year

            print(f"\n✅ Results for Year {year_2025['year']} (Age {year_2025.get('age_p1', 65)})")
            print(f"\n📊 WITHDRAWALS:")
            print(f"   RRIF: ${year_2025.get('total_withdrawals', {}).get('rrif', 0):,.0f}")
            print(f"   NonReg: ${year_2025.get('total_withdrawals', {}).get('nonreg', 0):,.0f}")
            print(f"   TFSA: ${year_2025.get('total_withdrawals', {}).get('tfsa', 0):,.0f}")

            print(f"\n💰 INCOME:")
            print(f"   CPP: ${year_2025.get('cpp', 0):,.0f}")
            print(f"   OAS: ${year_2025.get('oas', 0):,.0f}")
            print(f"   Pension: ${year_2025.get('pension_income_p1', 0):,.0f}")

            print(f"\n💸 TAXES & STATUS:")
            print(f"   Tax Paid: ${year_2025.get('tax_paid', 0):,.0f}")
            print(f"   Status: {year_2025.get('status', 'Unknown')}")

            if year_2025.get('status') == 'Gap':
                gap = year_2025.get('gap', 0)
                print(f"   ⚠️  GAP: ${gap:,.0f}")
            else:
                print(f"   ✅ Fully funded!")

        else:
            print(f"\n❌ No years data")
            print(f"Message: {data.get('message', 'No message')}")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Check backend logs for tax recalculation:")
print("tail -50 /tmp/uvicorn-final.log | grep 'TAX RECALCULATION'")
print("=" * 80)
