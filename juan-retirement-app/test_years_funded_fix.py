"""
Test the years_funded fix - verify it counts years where spending is actually met.

Based on user's scenario showing:
- Go-go spending: $500,000/year
- Plan running out around 2032-2034
- Previous bug: showing 31/31 years funded when only ~28 years were actually funded
"""

import requests
import json

# Test profile similar to user's scenario
# High spending that causes failure in later years
profile = {
    "p1": {
        "name": "Test Person",
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
    "end_age": 95,  # 31 years total (65-95)
    "strategy": "balanced",
    "spending_go_go": 500000,    # Very high spending like user's case
    "spending_slow_go": 250000,
    "spending_no_go": 150000,
}

print("=" * 80)
print("TESTING YEARS_FUNDED FIX")
print("=" * 80)
print("\nScenario: High spending ($500k/year go-go phase) that will run out of money")
print(f"Expected: Should show fewer than 31 years funded due to spending shortfalls")
print()

# Call API
print("Calling API...")
response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"\n❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()

if not result.get("success"):
    print(f"\n❌ Simulation Failed: {result.get('message')}")
    exit(1)

summary = result["summary"]
year_by_year = result["year_by_year"]

print("\n" + "=" * 80)
print("RESULTS")
print("=" * 80)

# Check summary
years_funded = summary["years_funded"]
years_simulated = summary["years_simulated"]
success_rate = summary["success_rate"]
health_score = summary["health_score"]
health_rating = summary["health_rating"]

print(f"\nSummary:")
print(f"  Years Funded:    {years_funded}/{years_simulated}")
print(f"  Success Rate:    {success_rate * 100:.1f}%")
print(f"  Health Score:    {health_score} ({health_rating})")
print()

# Find years with shortfalls
shortfall_years = []
for year_data in year_by_year:
    year = year_data['year']
    spending_need = year_data.get('spending_target', 0)
    spending_met = year_data.get('spending_met', 0)

    if spending_need > 0 and spending_met < spending_need - 1:
        shortfall = spending_need - spending_met
        shortfall_years.append({
            'year': year,
            'age': year_data['age_p1'],
            'need': spending_need,
            'met': spending_met,
            'shortfall': shortfall
        })

if shortfall_years:
    print(f"Years with Spending Shortfalls: {len(shortfall_years)}")
    print()
    for yr in shortfall_years[:5]:  # Show first 5
        print(f"  {yr['year']} (Age {yr['age']}): "
              f"Need ${yr['need']:,.0f}, Met ${yr['met']:,.0f}, "
              f"Shortfall ${yr['shortfall']:,.0f}")
    if len(shortfall_years) > 5:
        print(f"  ... and {len(shortfall_years) - 5} more years")
else:
    print("No spending shortfalls found")

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

# Calculate expected years_funded
expected_years_funded = years_simulated - len(shortfall_years)

print(f"\nExpected years_funded: {expected_years_funded} (total {years_simulated} - {len(shortfall_years)} shortfall years)")
print(f"Actual years_funded:   {years_funded}")

if years_funded == expected_years_funded:
    print("\n✅ FIX VERIFIED: years_funded correctly counts only fully funded years!")
else:
    print(f"\n⚠️  MISMATCH: Expected {expected_years_funded} but got {years_funded}")
    print("This could be due to:")
    print("  - Small rounding errors (shortfalls < $1)")
    print("  - Need to investigate further")

# Check health score alignment
if len(shortfall_years) > 0:
    if health_score >= 80 or health_rating == "Excellent":
        print(f"\n⚠️  ISSUE: Health score is {health_score} ({health_rating}) but plan has shortfalls!")
    else:
        print(f"\n✅ Health score correctly reflects issues: {health_score} ({health_rating})")
else:
    if health_score >= 80:
        print(f"\n✅ Health score correctly shows excellent: {health_score} ({health_rating})")
    else:
        print(f"\n⚠️  Health score is {health_score} ({health_rating}) but no shortfalls found")

print("\n" + "=" * 80)
