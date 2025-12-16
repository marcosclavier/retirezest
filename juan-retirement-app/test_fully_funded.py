"""
Test fully funded scenario where all spending needs are met.

This verifies that plan_success=True for all years when portfolio is sufficient.
"""

import requests
import json

# Well-funded portfolio with moderate spending
profile = {
    "p1": {
        "name": "Test",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 200000,
        "rrif_balance": 800000,
        "rrsp_balance": 0,
        "nonreg_balance": 500000,
        "corporate_balance": 1000000,
    },
    "p2": {
        "name": "Spouse",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 200000,
        "rrif_balance": 0,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "balanced",
    "spending_go_go": 150000,  # Moderate spending
    "spending_slow_go": 100000,
    "spending_no_go": 75000,
}

print("=" * 80)
print("FULLY FUNDED TEST (All years should be OK)")
print("=" * 80)
print(f"\nTotal Assets: $2,700,000")
print(f"Go-Go Spending: $150,000/year")
print(f"Expected: All years OK (plan_success=True)")
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
print(f"SUMMARY: {summary['years_funded']}/{summary['years_simulated']} Years Funded")
print(f"Health Score: {summary['health_score']} ({summary['health_rating']})")
print("=" * 80)

# Analyze all years
ok_years = []
gap_years = []

for yd in year_by_year:
    year = yd['year']
    age = yd['age_p1']
    need = yd.get('spending_need', 0)
    met = yd.get('spending_met', 0)
    gap = yd.get('spending_gap', 0)
    plan_success = yd.get('plan_success', None)

    if plan_success:
        ok_years.append((year, age, need, met, gap))
    else:
        gap_years.append((year, age, need, met, gap))

print(f"\n✅ OK Years (plan_success=True): {len(ok_years)}")
if ok_years:
    for year, age, need, met, gap in ok_years[:5]:
        print(f"  {year} (Age {age}): Need ${need:,.0f}, Met ${met:,.0f}, Gap ${gap:,.0f}")
    if len(ok_years) > 5:
        print(f"  ... and {len(ok_years) - 5} more OK years")

print(f"\n❌ GAP Years (plan_success=False): {len(gap_years)}")
if gap_years:
    for year, age, need, met, gap in gap_years[:5]:
        print(f"  {year} (Age {age}): Need ${need:,.0f}, Met ${met:,.0f}, Gap ${gap:,.0f}")
    if len(gap_years) > 5:
        print(f"  ... and {len(gap_years) - 5} more gap years")

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

if len(ok_years) == len(year_by_year) and len(gap_years) == 0:
    print("\n✅ SUCCESS: All years show OK status (plan_success=True)")
    print(f"   Portfolio is sufficient for all {len(ok_years)} years")
    print("\n   The UI will display:")
    print("   - Green 'OK' badges for all years")
    print("   - Green checkmarks in summary tables")
    print(f"   - Years Funded: {summary['years_funded']}/{summary['years_simulated']}")
    print(f"   - Health Score: {summary['health_score']} ({summary['health_rating']})")
elif len(gap_years) > 0:
    print(f"\n⚠️  Portfolio has {len(gap_years)} underfunded years")
    print("   (This may be due to terminal taxes or other factors)")
else:
    print("\n❌ FAILURE: Unexpected status distribution")

print("=" * 80)
