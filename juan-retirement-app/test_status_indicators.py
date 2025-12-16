"""
Test that status indicators correctly show "Gap" for underfunded years.

This verifies that the plan_success field is properly set based on is_underfunded.
"""

import requests
import json

# Small portfolio that will run out with high spending
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
    "spending_go_go": 150000,  # $150k/year will deplete portfolio quickly
    "spending_slow_go": 75000,
    "spending_no_go": 50000,
}

print("=" * 80)
print("TESTING STATUS INDICATORS (plan_success field)")
print("=" * 80)
print(f"\nTotal Assets: $300,000")
print(f"Go-Go Spending: $150,000/year")
print(f"Expected: Portfolio runs out in ~2-3 years")
print(f"Expected: plan_success=True for funded years, False for underfunded years")
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

year_by_year = result["year_by_year"]

print("=" * 80)
print("YEAR-BY-YEAR STATUS (First 10 years)")
print("=" * 80)

success_years = []
gap_years = []

for i, yd in enumerate(year_by_year[:10]):
    year = yd['year']
    age = yd['age_p1']
    need = yd.get('spending_need', 0)
    met = yd.get('spending_met', 0)
    gap = yd.get('spending_gap', 0)
    plan_success = yd.get('plan_success', None)

    status = "✅ OK" if plan_success else "❌ Gap"

    print(f"\n{year} (Age {age}): {status}")
    print(f"  Need:         ${need:>12,.2f}")
    print(f"  Met:          ${met:>12,.2f}")
    print(f"  Gap:          ${gap:>12,.2f}")
    print(f"  plan_success: {plan_success}")

    # Track for verification
    if need > 0:
        if met >= need - 1:
            success_years.append((year, need, met, plan_success))
        else:
            gap_years.append((year, need, met, gap, plan_success))

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

# Check if status indicators match actual spending status
all_correct = True

if success_years:
    print(f"\n✓ Years with Spending Fully Met: {len(success_years)}")
    for year, need, met, success in success_years:
        if not success:
            print(f"  ❌ {year}: Need ${need:,.0f}, Met ${met:,.0f} - BUT plan_success={success} (should be True)")
            all_correct = False
        else:
            print(f"  ✓ {year}: Need ${need:,.0f}, Met ${met:,.0f} - plan_success={success} ✓")

if gap_years:
    print(f"\n✓ Years with Spending Gaps: {len(gap_years)}")
    for year, need, met, gap, success in gap_years[:5]:
        if success:
            print(f"  ❌ {year}: Need ${need:,.0f}, Met ${met:,.0f}, Gap ${gap:,.0f} - BUT plan_success={success} (should be False)")
            all_correct = False
        else:
            print(f"  ✓ {year}: Need ${need:,.0f}, Met ${met:,.0f}, Gap ${gap:,.0f} - plan_success={success} ✓")
    if len(gap_years) > 5:
        print(f"  ... and {len(gap_years) - 5} more gap years")

print("\n" + "=" * 80)
if all_correct:
    print("✅ SUCCESS: All status indicators correctly match spending status!")
    print("   - Funded years show plan_success=True (will display OK badge)")
    print("   - Underfunded years show plan_success=False (will display Gap badge)")
else:
    print("❌ FAILURE: Some status indicators don't match spending status")
    print("   The is_underfunded field may not be properly set")

print("=" * 80)
