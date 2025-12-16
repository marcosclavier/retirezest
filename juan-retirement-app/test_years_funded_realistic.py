"""
Test years_funded with a portfolio that WILL run out of money.

Creates a scenario similar to user's case where:
- High spending ($500k/year)
- Smaller portfolio that runs out around year 10-12
- Should show years_funded < total years
"""

import requests
import json

# Smaller portfolio that will run out with $500k/year spending
profile = {
    "p1": {
        "name": "Test Person",
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
    "end_age": 95,  # 31 years total (65-95)
    "strategy": "balanced",
    "spending_go_go": 500000,    # High spending
    "spending_slow_go": 250000,
    "spending_no_go": 150000,
}

print("=" * 80)
print("TESTING YEARS_FUNDED WITH PORTFOLIO THAT RUNS OUT")
print("=" * 80)
print(f"\nTotal Assets: ${profile['p1']['tfsa_balance'] + profile['p1']['rrif_balance'] + profile['p1']['nonreg_balance'] + profile['p1']['corporate_balance'] + profile['p2']['tfsa_balance']:,.0f}")
print(f"Go-Go Spending: ${profile['spending_go_go']:,.0f}/year")
print(f"Expected: Portfolio should run out before 31 years")
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
            'shortfall': shortfall,
            'net_worth': year_data.get('net_worth_end', 0)
        })

if shortfall_years:
    print(f"✓ Years with Spending Shortfalls: {len(shortfall_years)}")
    print()
    for yr in shortfall_years[:8]:
        print(f"  {yr['year']} (Age {yr['age']}): "
              f"Need ${yr['need']:,.0f}, Met ${yr['met']:,.0f}, "
              f"Shortfall ${yr['shortfall']:,.0f}, Net Worth ${yr['net_worth']:,.0f}")
    if len(shortfall_years) > 8:
        print(f"  ... and {len(shortfall_years) - 8} more years")
else:
    print("⚠️  No spending shortfalls found (portfolio didn't run out)")

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

# Calculate expected years_funded
expected_years_funded = years_simulated - len(shortfall_years)

print(f"\nExpected years_funded: {expected_years_funded} (total {years_simulated} - {len(shortfall_years)} shortfall years)")
print(f"Actual years_funded:   {years_funded}")

if len(shortfall_years) > 0:
    if years_funded == expected_years_funded:
        print("\n✅ FIX WORKING: years_funded correctly counts only fully funded years!")
        print(f"   The fix properly shows {years_funded}/{years_simulated} instead of incorrectly showing {years_simulated}/{years_simulated}")
    elif years_funded == years_simulated:
        print(f"\n❌ BUG STILL PRESENT: years_funded shows {years_simulated}/{years_simulated} but should show {expected_years_funded}/{years_simulated}")
        print("   The old buggy code is still running (counting net_worth > 0 instead of underfunded < 1)")
    else:
        print(f"\n⚠️  UNEXPECTED: Expected {expected_years_funded} but got {years_funded}")
        print("   Difference could be due to rounding (shortfalls < $1)")
else:
    print("\n⚠️  Cannot verify fix - test portfolio didn't run out of money")
    print("   Need a smaller portfolio to test the years_funded calculation")

# Check health score alignment
if len(shortfall_years) > 0:
    if health_score >= 80 or health_rating == "Excellent":
        print(f"\n❌ HEALTH SCORE BUG: Score is {health_score} ({health_rating}) but plan has {len(shortfall_years)} shortfall years!")
    else:
        print(f"\n✅ Health score correctly reflects issues: {health_score} ({health_rating})")
else:
    if health_score >= 80:
        print(f"\n✅ Health score correctly shows excellent: {health_score} ({health_rating})")

print("\n" + "=" * 80)
