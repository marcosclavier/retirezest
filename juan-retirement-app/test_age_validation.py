#!/usr/bin/env python3
"""
Test age validation edge cases
"""

import json
import subprocess
import tempfile

def test_invalid_age(age_p1, age_p2, test_name):
    """Test that invalid ages are rejected"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"Testing ages: P1={age_p1}, P2={age_p2}")

    payload = {
        "p1": {
            "name": "Person 1",
            "start_age": age_p1,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "tfsa_balance": 150000,
            "rrsp_balance": 400000,
            "rrif_balance": 0,
            "nonreg_balance": 200000,
            "nonreg_acb": 160000,
            "corporate_balance": 0
        },
        "p2": {
            "name": "Person 2",
            "start_age": age_p2,
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
        "province": "ON",
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

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        response = json.loads(result.stdout)

        if response.get('success') == False:
            print("✅ PASSED: Invalid age correctly rejected")
            if 'errors' in response:
                print(f"  Validation error: {response['errors']}")
            elif 'error' in response:
                print(f"  Error message: {response['error']}")
            return True
        else:
            print("❌ FAILED: Invalid age was accepted")
            return False

    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False
    finally:
        import os
        try:
            os.unlink(temp_file)
        except:
            pass

def test_valid_age(age_p1, age_p2, test_name):
    """Test that valid ages are accepted"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"Testing ages: P1={age_p1}, P2={age_p2}")

    payload = {
        "p1": {
            "name": "Person 1",
            "start_age": age_p1,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8500,
            "tfsa_balance": 150000,
            "rrsp_balance": 400000,
            "rrif_balance": 0,
            "nonreg_balance": 200000,
            "nonreg_acb": 160000,
            "corporate_balance": 0
        },
        "p2": {
            "name": "Person 2",
            "start_age": age_p2,
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
        "province": "ON",
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

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        response = json.loads(result.stdout)

        if response.get('success') == True:
            first_year = response['year_by_year'][0]
            if first_year['age_p1'] == age_p1 and first_year['age_p2'] == age_p2:
                print(f"✅ PASSED: Valid ages accepted, simulation starts at {age_p1}/{age_p2}")
                return True
            else:
                print(f"❌ FAILED: Ages mismatch in simulation")
                return False
        else:
            print(f"❌ FAILED: Valid age was rejected")
            if 'error' in response:
                print(f"  Error: {response['error']}")
            return False

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
    print("🧪 AGE VALIDATION TEST SUITE")
    print("="*60)

    results = []

    # Test invalid ages (should be rejected)
    print("\n📋 INVALID AGE TESTS (Should be rejected)")
    results.append(test_invalid_age(49, 65, "Age too low (49)"))
    results.append(test_invalid_age(65, 49, "P2 age too low (49)"))
    results.append(test_invalid_age(91, 65, "Age too high (91)"))
    results.append(test_invalid_age(65, 91, "P2 age too high (91)"))
    results.append(test_invalid_age(45, 45, "Both ages too low (45)"))
    results.append(test_invalid_age(100, 100, "Both ages too high (100)"))

    # Test valid boundary ages (should be accepted)
    print("\n\n📋 VALID BOUNDARY AGE TESTS (Should be accepted)")
    results.append(test_valid_age(50, 50, "Minimum valid age (50)"))
    results.append(test_valid_age(90, 90, "Maximum valid age (90)"))
    results.append(test_valid_age(50, 90, "Min and max combination"))
    results.append(test_valid_age(90, 50, "Max and min combination"))

    # Test common future planning ages
    print("\n\n📋 COMMON FUTURE PLANNING AGES (Should be accepted)")
    results.append(test_valid_age(55, 60, "Pre-retirement (55/60)"))
    results.append(test_valid_age(60, 64, "Future retirement (60/64)"))
    results.append(test_valid_age(62, 67, "Phased retirement (62/67)"))
    results.append(test_valid_age(70, 72, "Late retirement (70/72)"))

    # Summary
    passed = sum(1 for r in results if r)
    total = len(results)

    print("\n" + "="*60)
    print(f"📋 SUMMARY: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 ALL VALIDATION TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
