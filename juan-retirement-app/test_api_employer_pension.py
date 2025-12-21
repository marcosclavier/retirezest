"""
Test API endpoint with employer pension data.

Sends a POST request to /api/run-simulation with employer_pension_annual
and verifies the response includes the pension in results.
"""

import requests
import json
import sys

def test_api_with_pension():
    """Test API endpoint accepts and processes employer pension"""

    print("="*80)
    print("API ENDPOINT TEST: Employer Pension Integration")
    print("="*80)

    # Test payload with employer pension
    payload = {
        "p1": {
            "name": "Test Person 1",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "employer_pension_annual": 30000,  # $30k employer pension
            "tfsa_balance": 100000,
            "rrif_balance": 200000,
            "nonreg_balance": 150000,
            "nonreg_acb": 100000,
        },
        "p2": {
            "name": "Test Person 2",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "employer_pension_annual": 0,  # No pension
            "tfsa_balance": 100000,
            "rrif_balance": 150000,
            "nonreg_balance": 100000,
            "nonreg_acb": 75000,
        },
        "province": "AB",
        "start_year": 2025,
        "end_age": 85,  # Minimum allowed by API validation
        "strategy": "corporate-optimized",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 50000,
        "slow_go_end_age": 85,
        "spending_no_go": 40000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
    }

    # API endpoint
    url = "http://127.0.0.1:8000/api/run-simulation"

    print(f"\n📡 Sending POST request to: {url}")
    print(f"\nRequest Summary:")
    print(f"  P1 Employer Pension: ${payload['p1']['employer_pension_annual']:,}")
    print(f"  P2 Employer Pension: ${payload['p2']['employer_pension_annual']:,}")
    print(f"  Province: {payload['province']}")
    print(f"  Years: {payload['start_year']}-{payload['start_year'] + (payload['end_age'] - payload['p1']['start_age'])}")

    try:
        # Make API request
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"\n📥 Response Status: {response.status_code}")

        if response.status_code != 200:
            print(f"\n❌ API request failed!")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False

        # Parse response
        data = response.json()

        print(f"\n✅ API request successful!")
        print(f"\nResponse Structure:")
        print(f"  - success: {data.get('success', 'N/A')}")
        print(f"  - year_by_year: {len(data.get('year_by_year', []))} years")

        # Check if employer pension appears in results
        if 'year_by_year' in data and len(data['year_by_year']) > 0:
            first_year = data['year_by_year'][0]

            print(f"\nFirst Year Results (2025):")
            print(f"  Year: {first_year.get('year', 'N/A')}")
            print(f"  Age P1: {first_year.get('age_p1', 'N/A')}")
            print(f"  Age P2: {first_year.get('age_p2', 'N/A')}")

            # Check for employer pension fields
            has_pension_p1 = 'employer_pension_p1' in first_year
            has_pension_p2 = 'employer_pension_p2' in first_year

            if has_pension_p1 and has_pension_p2:
                pension_p1 = first_year['employer_pension_p1']
                pension_p2 = first_year['employer_pension_p2']

                print(f"\n  ✅ Employer Pension fields present in response:")
                print(f"     - employer_pension_p1: ${pension_p1:,.2f}")
                print(f"     - employer_pension_p2: ${pension_p2:,.2f}")

                # Validate values
                checks_passed = True

                if abs(pension_p1 - 30000) < 1:
                    print(f"  ✅ P1 pension correct ($30,000)")
                else:
                    print(f"  ❌ P1 pension incorrect: expected $30,000, got ${pension_p1:,.2f}")
                    checks_passed = False

                if abs(pension_p2 - 0) < 1:
                    print(f"  ✅ P2 pension correct ($0)")
                else:
                    print(f"  ❌ P2 pension incorrect: expected $0, got ${pension_p2:,.2f}")
                    checks_passed = False

                # Check taxable income includes pension
                if 'taxable_inc_p1' in first_year:
                    taxable_inc_p1 = first_year['taxable_inc_p1']
                    min_expected = first_year.get('cpp_p1', 0) + first_year.get('oas_p1', 0) + pension_p1

                    print(f"\n  Tax Calculation Check:")
                    print(f"     - P1 Taxable Income: ${taxable_inc_p1:,.2f}")
                    print(f"     - Min Expected (CPP+OAS+Pension): ${min_expected:,.2f}")

                    if taxable_inc_p1 >= min_expected - 100:
                        print(f"  ✅ Taxable income includes employer pension")
                    else:
                        print(f"  ❌ Taxable income too low (pension not included?)")
                        checks_passed = False

                # Check all 3 years have pension data
                print(f"\n  Year-by-Year Pension Verification:")
                for year_data in data['year_by_year']:
                    year = year_data['year']
                    p1_pension = year_data.get('employer_pension_p1', 0)
                    p2_pension = year_data.get('employer_pension_p2', 0)

                    # Expected with 2% inflation
                    years_since_start = year - 2025
                    expected_p1 = 30000 * (1.02 ** years_since_start)

                    status = "✅" if abs(p1_pension - expected_p1) < 1 else "❌"
                    print(f"     {year}: P1=${p1_pension:>10,.2f}, P2=${p2_pension:>10,.2f} {status}")

                return checks_passed
            else:
                print(f"\n  ❌ Employer pension fields MISSING from response!")
                print(f"     Available fields: {list(first_year.keys())[:20]}...")
                return False
        else:
            print(f"\n  ❌ No year_by_year data in response!")
            return False

    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection failed!")
        print(f"   Make sure the API server is running on port 8000")
        print(f"   Start with: python3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000")
        return False
    except requests.exceptions.Timeout:
        print(f"\n❌ Request timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_api_with_pension()

    print("\n" + "="*80)
    if success:
        print("✅ API ENDPOINT TEST PASSED!")
        print("   - API accepts employer_pension_annual")
        print("   - Response includes employer pension data")
        print("   - Pension included in tax calculations")
    else:
        print("❌ API ENDPOINT TEST FAILED!")
    print("="*80 + "\n")

    sys.exit(0 if success else 1)
