#!/usr/bin/env python3
"""
Quick test to verify RRIF frontload fix
"""
import requests
import json

# Simplified test payload - just 1 year
payload = {
    "p1": {
        "name": "Test Person",
        "start_age": 65,
        "end_age": 70,  # Test first 5 years
        "cpp_start_age": 70,
        "oas_start_age": 70,
        "cpp_amount": 12502,
        "oas_amount": 8904,
        "tfsa_balance": 52500,
        "rrsp_balance": 0,
        "rrif_balance": 338100,
        "nonreg_balance": 154950,
        "nonreg_acb": 154950,
        "corporate_balance": 0,
        "pension_incomes": [{"name": "Pension", "amount": 50000, "start_age": 65, "indexed_to_inflation": True}],
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
        "contribution_start_year": 2024,
        "inflation_general": 2.0,
        "return_rrif": 5.0,
        "return_nonreg": 5.0,
        "nonreg_interest_pct": 25.0,
        "nonreg_elig_div_pct": 25.0,
        "nonreg_capg_dist_pct": 50.0
    }
}

print("=" * 80)
print("RRIF FRONTLOAD FIX VERIFICATION")
print("=" * 80)
print(f"RRIF Balance: ${payload['p1']['rrif_balance']:,}")
print(f"Expected 15% withdrawal: ${payload['p1']['rrif_balance'] * 0.15:,.0f}")
print("\nSending request to API...")

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=60)

    if response.status_code == 200:
        data = response.json()

        if 'years' in data and len(data['years']) > 0:
            year = data['years'][0]
            rrif_wd = year.get('total_withdrawals', {}).get('rrif', 0)
            expected = payload['p1']['rrif_balance'] * 0.15

            print(f"\n✅ API Response received")
            print(f"   RRIF Withdrawal: ${rrif_wd:,.0f}")
            print(f"   Expected: ${expected:,.0f}")
            print(f"   Difference: ${rrif_wd - expected:,.0f}")

            if abs(rrif_wd - expected) < 100:  # Within $100
                print(f"\n🎉 SUCCESS! RRIF frontload is working correctly!")
                print(f"   The strategy is now withdrawing 15% as expected.")
            else:
                pct_actual = (rrif_wd / payload['p1']['rrif_balance']) * 100
                print(f"\n⚠️  ISSUE: RRIF withdrawal is {pct_actual:.1f}% instead of 15%")
        else:
            print(f"\n❌ ERROR: No years data in response")
            print(json.dumps(data, indent=2)[:2000])
    else:
        print(f"\n❌ ERROR: API returned {response.status_code}")
        print(response.text[:500])

except requests.exceptions.Timeout:
    print("\n❌ ERROR: Request timed out (API might be processing)")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")

print("=" * 80)
