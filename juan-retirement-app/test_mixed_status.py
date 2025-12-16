"""
Test mixed scenario with both funded and underfunded years.

This verifies that plan_success correctly shows:
- True (OK badge) for years where spending is fully met
- False (Gap badge) for years with spending shortfalls
"""

import requests
import json

# Portfolio that starts fine but runs out after several years
profile = {
    "p1": {
        "name": "Test",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 400000,
        "rrsp_balance": 0,
        "nonreg_balance": 250000,
        "corporate_balance": 500000,
    },
    "p2": {
        "name": "Spouse",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 0,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "balanced",
    "spending_go_go": 500000,  # High spending to deplete portfolio mid-plan
    "spending_slow_go": 250000,
    "spending_no_go": 150000,
}

print("=" * 80)
print("MIXED STATUS TEST (Some OK, Some Gap)")
print("=" * 80)
print(f"\nTotal Assets: $1,350,000")
print(f"Go-Go Spending: $500,000/year")
print(f"Expected: Early years OK, later years Gap")
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

# Verify status matches spending
all_correct = True
issues = []

for year, age, need, met, gap in ok_years:
    # OK years should have spending fully met (gap < $1)
    if gap >= 1.0:
        issues.append(f"  ❌ {year}: Shows OK but has ${gap:,.0f} gap")
        all_correct = False

for year, age, need, met, gap in gap_years:
    # Gap years should have spending shortfalls (gap >= $1)
    if gap < 1.0:
        issues.append(f"  ❌ {year}: Shows Gap but spending is fully met")
        all_correct = False

if all_correct:
    print("\n✅ SUCCESS: All status indicators correctly match spending status!")
    print(f"   - {len(ok_years)} years show OK (spending fully met)")
    print(f"   - {len(gap_years)} years show Gap (spending shortfall)")
    print("\n   The UI will now correctly display:")
    print("   - Green 'OK' badges for funded years")
    print("   - Red 'Gap' badges for underfunded years")
else:
    print("\n❌ FAILURE: Status indicators don't match spending:")
    for issue in issues:
        print(issue)

print("=" * 80)
