"""
End-to-End Test: Private Pension Income in Income Composition Chart

This test verifies that private pension income flows correctly through the entire system:
1. User input (via API request payload)
2. Backend simulation (modules/simulation.py)
3. API response conversion (api/utils/converters.py)
4. Chart data (ready for frontend display)

Tests multiple scenarios:
- Single person with private pension
- Couple with pensions on both sides
- Multiple income sources (pension + employment + rental)
- Users without pensions (backward compatibility)
"""

import requests
import json
import sys

def test_scenario_1_single_person_pension():
    """Test single person with private pension income"""

    print("=" * 80)
    print("SCENARIO 1: Single Person with Private Pension")
    print("=" * 80)

    payload = {
        "p1": {
            "name": "Marc Rondeau",
            "start_age": 65,

            # Government benefits
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,

            # Private pension - THE KEY FIELD BEING TESTED
            "pension_incomes": [
                {
                    "name": "Work Pension Plan",
                    "amount": 30000,  # $30k/year
                    "startAge": 65,
                    "inflationIndexed": True
                }
            ],

            # Accounts
            "tfsa_balance": 100000,
            "rrif_balance": 200000,
            "nonreg_balance": 50000,
            "nonreg_acb": 40000,
        },
        "p2": {
            "name": "Not Used",
            "start_age": 65,
        },
        "province": "ON",
        "start_year": 2025,
        "end_age": 85,  # Minimum allowed by API validation
        "strategy": "balanced",
        "spending_go_go": 50000,
        "go_go_end_age": 75,
        "spending_slow_go": 40000,
        "slow_go_end_age": 85,
        "spending_no_go": 30000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
    }

    url = "http://127.0.0.1:8000/api/run-simulation"

    print(f"\n📡 Sending request to: {url}")
    print(f"   Private Pension: ${payload['p1']['pension_incomes'][0]['amount']:,}/year")

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            return False

        data = response.json()

        if not data.get('success'):
            print(f"❌ Simulation failed: {data.get('message')}")
            return False

        # Check year_by_year data
        year_2025 = data['year_by_year'][0]

        print(f"\n✓ Year 2025 Data:")
        print(f"   Pension Income P1: ${year_2025.get('pension_income_p1', 0):,.2f}")
        print(f"   CPP P1: ${year_2025.get('cpp_p1', 0):,.2f}")
        print(f"   OAS P1: ${year_2025.get('oas_p1', 0):,.2f}")

        # Check chart_data - THIS IS THE CRITICAL TEST
        if 'chart_data' not in data or 'data_points' not in data['chart_data']:
            print(f"❌ FAIL: chart_data missing from API response")
            return False

        chart_2025 = data['chart_data']['data_points'][0]
        taxable_income_chart = chart_2025['taxable_income']

        print(f"\n✓ Chart Data:")
        print(f"   Taxable Income (chart): ${taxable_income_chart:,.2f}")

        # Calculate minimum expected income (CPP + OAS + Pension)
        pension_p1 = year_2025.get('pension_income_p1', 0)
        cpp_p1 = year_2025.get('cpp_p1', 0)
        oas_p1 = year_2025.get('oas_p1', 0)
        expected_minimum = pension_p1 + cpp_p1 + oas_p1

        print(f"\n📊 Verification:")
        print(f"   Expected minimum (CPP + OAS + Pension): ${expected_minimum:,.2f}")
        print(f"   Actual chart income: ${taxable_income_chart:,.2f}")

        if taxable_income_chart >= expected_minimum:
            print(f"   ✅ PASS: Chart includes pension income")
            print(f"   Difference: ${taxable_income_chart - expected_minimum:,.2f} (RRIF/other withdrawals)")
            return True
        else:
            print(f"   ❌ FAIL: Chart is missing ${expected_minimum - taxable_income_chart:,.2f}")
            print(f"   This means pension income is NOT displayed in the chart!")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to API. Is the server running?")
        print("   Start server with: python3 -m uvicorn api.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_scenario_2_couple_with_pensions():
    """Test couple where both have pension income"""

    print("\n" + "=" * 80)
    print("SCENARIO 2: Couple - Both with Private Pensions")
    print("=" * 80)

    payload = {
        "p1": {
            "name": "Person 1",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "pension_incomes": [
                {
                    "name": "Teacher Pension",
                    "amount": 40000,
                    "startAge": 65,
                    "inflationIndexed": True
                }
            ],
            "tfsa_balance": 100000,
            "rrif_balance": 200000,
            "nonreg_balance": 50000,
            "nonreg_acb": 40000,
        },
        "p2": {
            "name": "Person 2",
            "start_age": 63,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "pension_incomes": [
                {
                    "name": "Nurse Pension",
                    "amount": 35000,
                    "startAge": 63,
                    "inflationIndexed": True
                }
            ],
            "tfsa_balance": 80000,
            "rrif_balance": 150000,
            "nonreg_balance": 40000,
            "nonreg_acb": 30000,
        },
        "province": "ON",
        "start_year": 2025,
        "end_age": 85,  # Minimum allowed by API validation
        "strategy": "balanced",
        "spending_go_go": 80000,
        "go_go_end_age": 75,
        "spending_slow_go": 60000,
        "slow_go_end_age": 85,
        "spending_no_go": 50000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
    }

    url = "http://127.0.0.1:8000/api/run-simulation"

    print(f"\n📡 Sending request to: {url}")
    print(f"   P1 Pension: ${payload['p1']['pension_incomes'][0]['amount']:,}/year")
    print(f"   P2 Pension: ${payload['p2']['pension_incomes'][0]['amount']:,}/year")

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            return False

        data = response.json()

        if not data.get('success'):
            print(f"❌ Simulation failed: {data.get('message')}")
            return False

        year_2025 = data['year_by_year'][0]
        chart_2025 = data['chart_data']['data_points'][0]

        pension_p1 = year_2025.get('pension_income_p1', 0)
        pension_p2 = year_2025.get('pension_income_p2', 0)
        pension_total = pension_p1 + pension_p2

        taxable_income_chart = chart_2025['taxable_income']

        print(f"\n✓ Year 2025 Pensions:")
        print(f"   P1 Pension: ${pension_p1:,.2f}")
        print(f"   P2 Pension: ${pension_p2:,.2f}")
        print(f"   Total Pensions: ${pension_total:,.2f}")

        print(f"\n✓ Chart Data:")
        print(f"   Taxable Income: ${taxable_income_chart:,.2f}")

        # Chart income should include both pensions
        if pension_total > 0 and taxable_income_chart >= pension_total:
            print(f"   ✅ PASS: Chart includes both pensions (${pension_total:,.2f})")
            return True
        else:
            print(f"   ❌ FAIL: Chart missing pension income")
            return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_scenario_3_multiple_income_sources():
    """Test person with pension + employment + rental income"""

    print("\n" + "=" * 80)
    print("SCENARIO 3: Multiple Income Sources (Pension + Employment + Rental)")
    print("=" * 80)

    payload = {
        "p1": {
            "name": "Multi-Income Person",
            "start_age": 60,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,

            # Private pension
            "pension_incomes": [
                {
                    "name": "Company Pension",
                    "amount": 25000,
                    "startAge": 60,
                    "inflationIndexed": True
                }
            ],

            # Other income sources
            "other_incomes": [
                {
                    "name": "Part-Time Consulting",
                    "category": "employment",
                    "amount": 20000,
                    "startAge": 60,
                    "endAge": 65,
                    "inflationIndexed": False
                },
                {
                    "name": "Rental Property",
                    "category": "rental",
                    "amount": 15000,
                    "startAge": 60,
                    "endAge": 95,
                    "inflationIndexed": True
                }
            ],

            "tfsa_balance": 100000,
            "rrif_balance": 150000,
            "nonreg_balance": 50000,
            "nonreg_acb": 40000,
        },
        "p2": {
            "name": "Not Used",
            "start_age": 60,
        },
        "province": "ON",
        "start_year": 2025,
        "end_age": 65,
        "strategy": "balanced",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 50000,
        "slow_go_end_age": 85,
        "spending_no_go": 40000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
    }

    url = "http://127.0.0.1:8000/api/run-simulation"

    print(f"\n📡 Sending request to: {url}")
    print(f"   Pension: $25,000/year")
    print(f"   Employment: $20,000/year")
    print(f"   Rental: $15,000/year")
    print(f"   Expected total from these: $60,000/year")

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            return False

        data = response.json()

        if not data.get('success'):
            print(f"❌ Simulation failed: {data.get('message')}")
            return False

        year_2025 = data['year_by_year'][0]
        chart_2025 = data['chart_data']['data_points'][0]

        pension_p1 = year_2025.get('pension_income_p1', 0)
        other_income_p1 = year_2025.get('other_income_p1', 0)

        taxable_income_chart = chart_2025['taxable_income']

        print(f"\n✓ Year 2025 Income Sources:")
        print(f"   Pension: ${pension_p1:,.2f}")
        print(f"   Other Income (employment + rental): ${other_income_p1:,.2f}")
        print(f"   Total from these sources: ${pension_p1 + other_income_p1:,.2f}")

        print(f"\n✓ Chart Data:")
        print(f"   Taxable Income: ${taxable_income_chart:,.2f}")

        # Chart should include pension + other income (at minimum)
        expected_minimum = pension_p1 + other_income_p1

        if taxable_income_chart >= expected_minimum:
            print(f"   ✅ PASS: Chart includes pension and other income")
            return True
        else:
            print(f"   ❌ FAIL: Chart missing ${expected_minimum - taxable_income_chart:,.2f}")
            return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_scenario_4_no_pension_backward_compatibility():
    """Test that users WITHOUT pensions still work correctly"""

    print("\n" + "=" * 80)
    print("SCENARIO 4: No Pensions (Backward Compatibility)")
    print("=" * 80)

    payload = {
        "p1": {
            "name": "No Pension Person",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            # NO pension_incomes field
            # NO other_incomes field
            "tfsa_balance": 200000,
            "rrif_balance": 300000,
            "nonreg_balance": 100000,
            "nonreg_acb": 80000,
        },
        "p2": {
            "name": "Not Used",
            "start_age": 65,
        },
        "province": "ON",
        "start_year": 2025,
        "end_age": 85,  # Minimum allowed by API validation
        "strategy": "balanced",
        "spending_go_go": 50000,
        "go_go_end_age": 75,
        "spending_slow_go": 40000,
        "slow_go_end_age": 85,
        "spending_no_go": 30000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
    }

    url = "http://127.0.0.1:8000/api/run-simulation"

    print(f"\n📡 Sending request to: {url}")
    print(f"   No pension income fields in request")

    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            return False

        data = response.json()

        if not data.get('success'):
            print(f"❌ Simulation failed: {data.get('message')}")
            return False

        year_2025 = data['year_by_year'][0]
        chart_2025 = data['chart_data']['data_points'][0]

        pension_p1 = year_2025.get('pension_income_p1', 0)
        other_income_p1 = year_2025.get('other_income_p1', 0)

        taxable_income_chart = chart_2025['taxable_income']

        print(f"\n✓ Year 2025 Data:")
        print(f"   Pension Income: ${pension_p1:,.2f} (should be $0)")
        print(f"   Other Income: ${other_income_p1:,.2f} (should be $0)")
        print(f"   Chart Taxable Income: ${taxable_income_chart:,.2f}")

        # Should still work, just with no pension income
        if pension_p1 == 0 and other_income_p1 == 0 and taxable_income_chart > 0:
            print(f"   ✅ PASS: Backward compatibility maintained")
            print(f"   Income comes from CPP, OAS, and withdrawals only")
            return True
        else:
            print(f"   ❌ FAIL: Unexpected values")
            return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def main():
    """Run all end-to-end test scenarios"""

    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 15 + "END-TO-END TEST: PENSION INCOME IN CHARTS" + " " * 22 + "║")
    print("╚" + "=" * 78 + "╝")
    print("\nThis test verifies the bug fix for Marc Rondeau's issue:")
    print("Private pension income now appears in Income Composition Chart")
    print("\n⚠️  PREREQUISITE: API server must be running on http://127.0.0.1:8000")
    print("   Start with: python3 -m uvicorn api.main:app --reload")

    # Check if server is running (try main endpoint since /health doesn't exist)
    try:
        response = requests.get("http://127.0.0.1:8000/", timeout=5)
        if response.status_code in [200, 404]:  # Server responds
            print("   ✅ API server is running\n")
        else:
            print("   ⚠️  API server responded with unexpected status\n")
    except:
        print("   ❌ API server is NOT running!")
        print("   Start the server first, then run this test again.\n")
        sys.exit(1)

    results = []

    # Run all test scenarios
    results.append(("Scenario 1: Single person with pension", test_scenario_1_single_person_pension()))
    results.append(("Scenario 2: Couple with pensions", test_scenario_2_couple_with_pensions()))
    results.append(("Scenario 3: Multiple income sources", test_scenario_3_multiple_income_sources()))
    results.append(("Scenario 4: No pensions (backward compat)", test_scenario_4_no_pension_backward_compatibility()))

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for scenario, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {scenario}")

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Pension income fix is working correctly.")
        print("\nThe fix successfully:")
        print("  ✅ Shows pension income in Income Composition Chart")
        print("  ✅ Handles couples with multiple pensions")
        print("  ✅ Works with combined income sources (pension + employment + rental)")
        print("  ✅ Maintains backward compatibility for users without pensions")
        sys.exit(0)
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        print("\nThe pension income fix may not be working correctly.")
        sys.exit(1)


if __name__ == "__main__":
    main()
