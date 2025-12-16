"""
Debug test to see what's happening with spending shortfalls.
"""

import requests
import json

profile = {
    "p1": {
        "name": "Test",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 0,
        "oas_start_age": 70,
        "oas_annual_at_start": 0,
        "tfsa_balance": 50000,
        "rrif_balance": 100000,
        "rrsp_balance": 0,
        "nonreg_balance": 50000,
        "corporate_balance": 100000,
    },
    "p2": {
        "name": "Spouse",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 0,
        "oas_start_age": 70,
        "oas_annual_at_start": 0,
        "tfsa_balance": 0,
        "rrif_balance": 0,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "balanced",
    "spending_go_go": 150000,
    "spending_slow_go": 75000,
    "spending_no_go": 50000,
}

response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=profile)
result = response.json()

if not result.get("success"):
    print(f"Failed: {result.get('message')}")
    exit(1)

year_by_year = result["year_by_year"]

print("Year-by-Year Data (First 10 years):")
print("=" * 100)

for yd in year_by_year[:10]:
    year = yd['year']
    age = yd['age_p1']
    need = yd.get('spending_need', 0)
    met = yd.get('spending_met', 0)
    gap = yd.get('spending_gap', 0)
    net_worth = yd.get('total_value', 0)

    shortfall = need - met if need > 0 else 0

    print(f"\n{year} (Age {age}):")
    print(f"  Spending Need:   ${need:>12,.2f}")
    print(f"  Spending Met:    ${met:>12,.2f}")
    print(f"  Spending Gap:    ${gap:>12,.2f}")
    print(f"  Shortfall:       ${shortfall:>12,.2f}")
    print(f"  Net Worth End:   ${net_worth:>12,.2f}")

    if need > 0 and met < need - 1:
        print(f"  ⚠️  SHORTFALL DETECTED")

# Also print available fields
print("\n" + "=" * 100)
print("Available fields in year_by_year:")
print(list(year_by_year[0].keys()))
