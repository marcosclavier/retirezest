#!/usr/bin/env python3
"""
Comprehensive test to identify why pension income is not being calculated
Tests both direct Python API and through Next.js API
"""
import requests
import json
import sys

def test_direct_python_api():
    """Test pension calculation by calling Python API directly"""
    print("\n" + "="*60)
    print("TEST 1: Direct Python API Call")
    print("="*60)

    payload = {
        "p1": {
            "name": "Rafael",
            "start_age": 67,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12492,
            "oas_start_age": 65,
            "oas_annual_at_start": 8904,
            "pension_incomes": [
                {
                    "name": "Private Pension",
                    "amount": 100000,
                    "startAge": 67,
                    "inflationIndexed": True
                }
            ],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 350000,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
        },
        "p2": {
            "name": "",
            "start_age": 60,
            "pension_incomes": [],
            "other_incomes": [],
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 48000,
        "slow_go_end_age": 85,
        "spending_no_go": 42000,
        "spending_inflation": 2,
        "general_inflation": 2,
    }

    print(f"📤 Sending pension data: {json.dumps(payload['p1']['pension_incomes'], indent=2)}")

    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")

            # Check year 2033 (age 67 - pension start)
            for year_data in result.get("year_by_year", []):
                if year_data.get("year") == 2033:
                    pension = year_data.get("employer_pension_p1", 0)
                    if pension > 0:
                        print(f"✅ PENSION FOUND: Year 2033 (Age 67): ${pension:,.2f}")
                    else:
                        print(f"❌ PENSION MISSING: Year 2033 shows $0")
                    break
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Exception: {e}")

def test_through_nextjs():
    """Test pension calculation through Next.js API route"""
    print("\n" + "="*60)
    print("TEST 2: Through Next.js API Route")
    print("="*60)

    # This mimics what the frontend sends
    payload = {
        "household_input": {
            "p1": {
                "name": "Rafael",
                "start_age": 67,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 12492,
                "oas_start_age": 65,
                "oas_annual_at_start": 8904,
                "pension_incomes": [
                    {
                        "name": "Private Pension",
                        "amount": 100000,
                        "startAge": 67,
                        "inflationIndexed": True
                    }
                ],
                "other_incomes": [],
                "tfsa_balance": 0,
                "rrif_balance": 350000,
                "rrsp_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
            },
            "p2": {
                "name": "",
                "start_age": 60,
                "pension_incomes": [],
                "other_incomes": [],
            },
            "include_partner": False,
            "province": "AB",
            "start_year": 2033,
            "end_age": 85,
            "strategy": "rrif-frontload",
            "spending_go_go": 60000,
            "go_go_end_age": 75,
            "spending_slow_go": 48000,
            "slow_go_end_age": 85,
            "spending_no_go": 42000,
            "spending_inflation": 2,
            "general_inflation": 2,
        }
    }

    print(f"📤 Sending pension data: {json.dumps(payload['household_input']['p1']['pension_incomes'], indent=2)}")

    # Add fake auth headers to bypass auth check
    headers = {
        "Content-Type": "application/json",
        "Cookie": "auth-token=test-token"
    }

    try:
        response = requests.post(
            "http://localhost:3001/api/simulation/run",
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")

            # Check if simulation ran successfully
            if result.get("success"):
                # Check year 2033 (age 67 - pension start)
                for year_data in result.get("year_by_year", []):
                    if year_data.get("year") == 2033:
                        pension = year_data.get("employer_pension_p1", 0)
                        if pension > 0:
                            print(f"✅ PENSION FOUND: Year 2033 (Age 67): ${pension:,.2f}")
                        else:
                            print(f"❌ PENSION MISSING: Year 2033 shows $0")
                        break
            else:
                print(f"❌ Simulation failed: {result.get('message')}")
        else:
            print(f"❌ API Error: {response.status_code}")
            try:
                error = response.json()
                print(f"Error: {error}")
            except:
                print(response.text[:500])

    except Exception as e:
        print(f"❌ Exception: {e}")

def main():
    print("\n" + "🔍 COMPREHENSIVE PENSION CALCULATION TEST 🔍")
    print("Testing Rafael's $100,000 pension starting at age 67")

    # Test 1: Direct Python API
    test_direct_python_api()

    # Test 2: Through Next.js
    test_through_nextjs()

    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print("✓ If Test 1 passes but Test 2 fails: Issue is in Next.js route")
    print("✓ If both tests fail: Issue is in Python API")
    print("✓ If both tests pass: Issue is in frontend UI display")

if __name__ == "__main__":
    main()