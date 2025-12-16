"""
Test years_funded with portfolio guaranteed to run out.

Very small portfolio, no government benefits, high spending.
"""

import requests
import json

# Very small portfolio with no CPP/OAS
profile = {
    "p1": {
        "name": "Test",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 0,  # No CPP
        "oas_start_age": 70,
        "oas_annual_at_start": 0,  # No OAS
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
    "end_age": 95,  # 31 years
    "strategy": "balanced",
    "spending_go_go": 150000,    # $150k/year will deplete $300k quickly
    "spending_slow_go": 75000,
    "spending_no_go": 50000,
}

print("=" * 80)
print("EXTREME TEST: Portfolio MUST Run Out")
print("=" * 80)
total_assets = sum([
    profile['p1']['tfsa_balance'],
    profile['p1']['rrif_balance'],
    profile['p1']['nonreg_balance'],
    profile['p1']['corporate_balance']
])
print(f"Total Assets: ${total_assets:,.0f}")
print(f"Go-Go Spending: ${profile['spending_go_go']:,.0f}/year")
print(f"CPP/OAS: $0 (disabled)")
print(f"Expected: Will run out in ~2-3 years")
print()

response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()
if not result.get("success"):
    print(f"❌ Failed: {result.get('message')}")
    exit(1)

summary = result["summary"]
year_by_year = result["year_by_year"]

print("=" * 80)
print("RESULTS")
print("=" * 80)

years_funded = summary["years_funded"]
years_simulated = summary["years_simulated"]
health_score = summary["health_score"]
health_rating = summary["health_rating"]

print(f"\n  Years Funded:    {years_funded}/{years_simulated}")
print(f"  Health Score:    {health_score} ({health_rating})")

# Find shortfalls
shortfalls = []
for yd in year_by_year:
    need = yd.get('spending_target', 0)
    met = yd.get('spending_met', 0)
    if need > 0 and met < need - 1:
        shortfalls.append({
            'year': yd['year'],
            'need': need,
            'met': met,
            'shortfall': need - met,
            'net_worth': yd.get('net_worth_end', 0)
        })

print(f"\n  Shortfall Years: {len(shortfalls)}")
if shortfalls:
    for s in shortfalls[:10]:
        print(f"    {s['year']}: Need ${s['need']:,.0f}, Met ${s['met']:,.0f}, Short ${s['shortfall']:,.0f}, NW ${s['net_worth']:,.0f}")

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

expected_funded = years_simulated - len(shortfalls)
print(f"\nExpected years_funded: {expected_funded}")
print(f"Actual years_funded:   {years_funded}")

if len(shortfalls) > 0:
    if years_funded == years_simulated:
        print("\n❌ BUG CONFIRMED: Old buggy code still running!")
        print(f"   Shows {years_simulated}/{years_simulated} but should show {expected_funded}/{years_simulated}")
        print("   Fix hasn't taken effect - API server needs to reload with new converters.py")
    elif years_funded == expected_funded:
        print("\n✅ FIX WORKING: Correctly counts only fully funded years!")
    else:
        print(f"\n⚠️  Got {years_funded}, expected {expected_funded} (diff may be rounding)")

print("=" * 80)
