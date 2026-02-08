#!/usr/bin/env python3
"""
Real-world test using actual user Oliver (age 56)
Tests that he can plan for retirement at age 60 (4 years in the future)
"""

import json
import subprocess
import tempfile

def test_oliver_current_age_56():
    """Test Oliver with his current age (56) - should work"""
    print("\n" + "="*80)
    print("TEST 1: Oliver at current age 56 (should work)")
    print("="*80)

    payload = {
        "p1": {
            "name": "Oliver",
            "start_age": 56,  # Current age
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "tfsa_balance": 90000,  # Real asset from DB
            "rrsp_balance": 1100000,  # Real asset from DB
            "rrif_balance": 0,
            "nonreg_balance": 10000,  # Real asset from DB
            "nonreg_acb": 8000,
            "corporate_balance": 0
        },
        "p2": {
            "name": "Person 2",
            "start_age": 60,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "tfsa_balance": 100000,
            "rrsp_balance": 300000,
            "rrif_balance": 0,
            "nonreg_balance": 150000,
            "nonreg_acb": 120000,
            "corporate_balance": 0
        },
        "province": "QC",  # Oliver's real province
        "start_year": 2026,
        "end_age": 95,
        "strategy": "minimize-income",
        "spending_go_go": 70000,
        "go_go_end_age": 75,
        "spending_slow_go": 55000,
        "slow_go_end_age": 85,
        "spending_no_go": 45000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    return run_simulation(payload, "Current age 56")


def test_oliver_future_age_60():
    """Test Oliver planning for age 60 (future retirement) - should work with our fix"""
    print("\n" + "="*80)
    print("TEST 2: Oliver planning for age 60 (4 years future) - KEY TEST!")
    print("="*80)

    payload = {
        "p1": {
            "name": "Oliver",
            "start_age": 60,  # FUTURE age (currently 56)
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "tfsa_balance": 90000,
            "rrsp_balance": 1100000,
            "rrif_balance": 0,
            "nonreg_balance": 10000,
            "nonreg_acb": 8000,
            "corporate_balance": 0
        },
        "p2": {
            "name": "Person 2",
            "start_age": 64,  # FUTURE age (currently 60)
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "tfsa_balance": 100000,
            "rrsp_balance": 300000,
            "rrif_balance": 0,
            "nonreg_balance": 150000,
            "nonreg_acb": 120000,
            "corporate_balance": 0
        },
        "province": "QC",
        "start_year": 2026,
        "end_age": 95,
        "strategy": "minimize-income",
        "spending_go_go": 70000,
        "go_go_end_age": 75,
        "spending_slow_go": 55000,
        "slow_go_end_age": 85,
        "spending_no_go": 45000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    return run_simulation(payload, "Future retirement at age 60")


def run_simulation(payload, test_name):
    """Run simulation and validate results"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f)
        temp_file = f.name

    try:
        cmd = [
            'curl', '-s', '-X', 'POST',
            'http://localhost:8000/api/run-simulation',
            '-H', 'Content-Type: application/json',
            '-d', f'@{temp_file}'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            print(f"❌ FAILED: API call failed")
            print(f"Error: {result.stderr}")
            return False

        response = json.loads(result.stdout)

        # Check success
        if not response.get('success'):
            print(f"❌ FAILED: Simulation failed")
            if 'error' in response:
                print(f"Error: {response['error']}")
            if 'errors' in response:
                print(f"Errors: {json.dumps(response['errors'], indent=2)}")
            return False

        # Validate ages
        first_year = response['year_by_year'][0]
        expected_age_p1 = payload['p1']['start_age']
        expected_age_p2 = payload['p2']['start_age']

        print(f"✅ SUCCESS: {test_name}")
        print(f"\n📊 Simulation Results:")
        print(f"  First Year: {first_year['year']}")
        print(f"  P1 Age: {first_year['age_p1']} (expected: {expected_age_p1})")
        print(f"  P2 Age: {first_year['age_p2']} (expected: {expected_age_p2})")
        print(f"  Total Years: {len(response['year_by_year'])}")
        print(f"  Success Rate: {response.get('success_rate', 0) * 100:.1f}%")
        print(f"  Final Portfolio: ${response.get('final_portfolio', 0):,.0f}")

        # Verify ages match
        if first_year['age_p1'] != expected_age_p1:
            print(f"❌ AGE MISMATCH: P1 age {first_year['age_p1']} != {expected_age_p1}")
            return False

        if first_year['age_p2'] != expected_age_p2:
            print(f"❌ AGE MISMATCH: P2 age {first_year['age_p2']} != {expected_age_p2}")
            return False

        print(f"\n✅ Age verification passed!")

        # Show first 5 years
        print(f"\n📈 First 5 Years:")
        for year in response['year_by_year'][:5]:
            print(f"  Year {year['year']}: " +
                  f"P1 Age {year['age_p1']}, P2 Age {year['age_p2']}, " +
                  f"Spending: ${year.get('spending_met', 0):,.0f}")

        return True

    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False
    finally:
        import os
        try:
            os.unlink(temp_file)
        except:
            pass


def main():
    print("="*80)
    print("REAL-WORLD TEST: Oliver (Age 56) Planning Future Retirement")
    print("="*80)
    print("\nUser Profile:")
    print("  Name: Oliver Tyson")
    print("  Email: lmcolty@hotmail.com")
    print("  Current Age: 56 (DOB: 1970-09-02)")
    print("  Province: QC")
    print("  Assets: $1.2M total")
    print("\nScenario:")
    print("  Oliver is 56 and wants to plan retirement at age 60")
    print("  Person 2 is 60 and wants to plan retirement at age 64")
    print("  This is a 4-year future planning scenario")

    results = []

    # Test 1: Current age (baseline)
    results.append(test_oliver_current_age_56())

    # Test 2: Future age (the key test!)
    results.append(test_oliver_future_age_60())

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    passed = sum(1 for r in results if r)
    total = len(results)

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 ALL REAL-WORLD TESTS PASSED!")
        print("\n✅ Confirmed: Oliver (age 56) can successfully plan retirement for age 60")
        print("✅ Confirmed: The system supports future retirement planning")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
