#!/usr/bin/env python3
"""
Test the final tax recalculation fix for RRIF frontload
"""
import requests
import json

# Exact scenario from screenshot
payload = {
    "p1": {
        "name": "Test Person",
        "start_age": 65,
        "end_age": 70,
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
    "p2": {
        "name": "",
        "is_retired": False
    },
    "hh": {
        "province": "ON",
        "start_year": 2031,
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
print("TESTING FINAL TAX RECALCULATION FIX")
print("=" * 80)
print(f"Scenario: Age 65, OAS Start Age 65, RRIF $338,100")
print(f"Expected: 8% RRIF withdrawal = $27,048")
print(f"Spending Target: $90,000")
print("\nSending request...")

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text[:500])
    else:
        data = response.json()

        if 'years' in data and len(data['years']) > 0:
            year = data['years'][0]

            print(f"\n✅ Results for Year {year['year']} (Age {year.get('age_p1', 65)}):")
            print(f"\n📊 WITHDRAWALS:")
            print(f"   RRIF: ${year.get('total_withdrawals', {}).get('rrif', 0):,.0f}")
            print(f"   NonReg: ${year.get('total_withdrawals', {}).get('nonreg', 0):,.0f}")
            print(f"   TFSA: ${year.get('total_withdrawals', {}).get('tfsa', 0):,.0f}")

            print(f"\n💸 TAXES & STATUS:")
            print(f"   Tax Paid: ${year.get('tax_paid', 0):,.0f}")
            print(f"   Status: {year.get('status', 'Unknown')}")

            if year.get('status') == 'Gap':
                print(f"   ⚠️  GAP: Still showing gap!")
            else:
                print(f"   ✅ Fully funded!")

        else:
            print(f"\n❌ No years data")
            print(f"Message: {data.get('message', 'No message')}")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")

print("\n" + "=" * 80)
print("Check backend logs for tax recalculation debug output:")
print("grep 'TAX RECALCULATION' /tmp/uvicorn-final.log")
print("=" * 80)
