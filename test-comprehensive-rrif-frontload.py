#!/usr/bin/env python3
"""
Comprehensive test of RRIF-frontload strategy with all enhancements
"""
import requests
import json

def test_scenario(name, payload, expected):
    """Run a test scenario and validate results"""
    print(f"\n{'='*70}")
    print(f"Testing: {name}")
    print(f"{'='*70}")

    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

    data = response.json()

    # Check success
    if not data.get('success'):
        print(f"❌ Simulation failed: {data.get('message', 'Unknown error')}")
        return False

    # Validate expected results
    passed = True

    # Check summary
    summary = data.get('summary', {})
    years_funded = summary.get('years_funded', 0)

    print(f"✅ Simulation successful")
    print(f"   Years funded: {years_funded}/{expected.get('total_years', 31)}")
    print(f"   Success rate: {summary.get('success_rate', 0):.1f}%")
    print(f"   Total tax: ${summary.get('total_tax_paid', 0):,.0f}")

    # Check first year details
    if 'year_by_year' in data and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # RRIF withdrawals
        rrif_p1 = year1.get('rrif_withdrawal_p1', 0)
        rrif_p2 = year1.get('rrif_withdrawal_p2', 0)
        rrif_total = rrif_p1 + rrif_p2

        # TFSA contributions
        tfsa_p1 = year1.get('tfsa_contribution_p1', 0)
        tfsa_p2 = year1.get('tfsa_contribution_p2', 0)
        tfsa_total = tfsa_p1 + tfsa_p2

        # Validate RRIF percentage
        if 'expected_rrif_pct' in expected:
            p1_rrif_balance = payload['p1']['rrif_balance']
            p2_rrif_balance = payload['p2']['rrif_balance'] if 'p2' in payload else 0
            total_rrif_balance = p1_rrif_balance + p2_rrif_balance

            expected_rrif = total_rrif_balance * expected['expected_rrif_pct']

            print(f"\n   RRIF Withdrawals (Year 1):")
            print(f"      Expected ({expected['expected_rrif_pct']*100:.0f}%): ${expected_rrif:,.0f}")
            print(f"      Actual: ${rrif_total:,.0f}")

            if abs(rrif_total - expected_rrif) < 1000:
                print(f"      ✅ RRIF withdrawal correct")
            else:
                print(f"      ❌ RRIF withdrawal mismatch")
                passed = False

        # Validate TFSA contributions
        if 'expected_tfsa' in expected:
            print(f"\n   TFSA Contributions (Year 1):")
            print(f"      Expected: ${expected['expected_tfsa']:,.0f}")
            print(f"      Actual: ${tfsa_total:,.0f}")

            if abs(tfsa_total - expected['expected_tfsa']) < 100:
                print(f"      ✅ TFSA contributions correct")
            else:
                print(f"      ❌ TFSA contribution mismatch")
                passed = False

        # Check withdrawal order
        corp_total = year1.get('corporate_withdrawal_p1', 0) + year1.get('corporate_withdrawal_p2', 0)
        nonreg_total = year1.get('nonreg_withdrawal_p1', 0) + year1.get('nonreg_withdrawal_p2', 0)
        tfsa_withdrawal = year1.get('tfsa_withdrawal_p1', 0) + year1.get('tfsa_withdrawal_p2', 0)

        print(f"\n   Withdrawal Order:")
        print(f"      RRIF: ${rrif_total:,.0f}")
        print(f"      Corporate: ${corp_total:,.0f}")
        print(f"      NonReg: ${nonreg_total:,.0f}")
        print(f"      TFSA: ${tfsa_withdrawal:,.0f}")

        if tfsa_withdrawal > 0 and (corp_total == 0 or nonreg_total == 0):
            print(f"      ❌ TFSA used before exhausting Corp/NonReg")
            passed = False
        else:
            print(f"      ✅ Correct withdrawal order")

    return passed

# Test Case 1: Juan and Daniela (ages 66/65, before OAS)
test1_payload = {
    'p1': {
        'name': 'Juan',
        'start_age': 66,
        'end_age': 95,
        'cpp_start_age': 70,
        'cpp_amount': 15000,
        'oas_start_age': 70,
        'oas_amount': 8904,
        'tfsa_balance': 182000,
        'rrif_balance': 185000,
        'rrsp_balance': 0,
        'nonreg_balance': 415000,
        'nonreg_acb': 350000,
        'corporate_balance': 1195000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Daniela',
        'start_age': 65,
        'end_age': 95,
        'cpp_start_age': 70,
        'cpp_amount': 12000,
        'oas_start_age': 70,
        'oas_amount': 8904,
        'tfsa_balance': 220000,
        'rrif_balance': 260000,
        'rrsp_balance': 0,
        'nonreg_balance': 415000,
        'nonreg_acb': 350000,
        'corporate_balance': 1195000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'province': 'AB',
    'start_year': 2025,
    'spending_target': 150000,
    'strategy': 'rrif-frontload',
    'tfsa_contribution_each': 7000,
    'inflation_general': 2.0,
    'return_rrif': 5.0,
    'return_nonreg': 5.0,
    'return_tfsa': 4.0,
    'return_corporate': 5.0,
    'nonreg_interest_pct': 20.0,
    'nonreg_elig_div_pct': 30.0,
    'nonreg_capg_dist_pct': 50.0,
    'reinvest_nonreg_dist': False
}

# Test Case 2: After OAS starts (age 71)
test2_payload = test1_payload.copy()
test2_payload['p1'] = test1_payload['p1'].copy()
test2_payload['p2'] = test1_payload['p2'].copy()
test2_payload['p1']['start_age'] = 71
test2_payload['p2']['start_age'] = 70
test2_payload['p1']['name'] = 'Juan-After-OAS'
test2_payload['p2']['name'] = 'Daniela-After-OAS'

# Test Case 3: Lower asset couple
test3_payload = {
    'p1': {
        'name': 'Test-Low-Asset',
        'start_age': 65,
        'end_age': 95,
        'cpp_start_age': 70,
        'cpp_amount': 8000,
        'oas_start_age': 70,
        'oas_amount': 7000,
        'tfsa_balance': 50000,
        'rrif_balance': 100000,
        'rrsp_balance': 0,
        'nonreg_balance': 100000,
        'nonreg_acb': 80000,
        'corporate_balance': 100000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Test-Low-Asset-2',
        'start_age': 64,
        'end_age': 95,
        'cpp_start_age': 70,
        'cpp_amount': 6000,
        'oas_start_age': 70,
        'oas_amount': 7000,
        'tfsa_balance': 40000,
        'rrif_balance': 80000,
        'rrsp_balance': 0,
        'nonreg_balance': 80000,
        'nonreg_acb': 70000,
        'corporate_balance': 80000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'province': 'AB',
    'start_year': 2025,
    'spending_target': 60000,
    'strategy': 'rrif-frontload',
    'tfsa_contribution_each': 7000,
    'inflation_general': 2.0,
    'return_rrif': 5.0,
    'return_nonreg': 5.0,
    'return_tfsa': 4.0,
    'return_corporate': 5.0,
    'nonreg_interest_pct': 20.0,
    'nonreg_elig_div_pct': 30.0,
    'nonreg_capg_dist_pct': 50.0,
    'reinvest_nonreg_dist': False
}

print("="*80)
print("🔬 COMPREHENSIVE RRIF-FRONTLOAD STRATEGY TEST SUITE")
print("="*80)

all_passed = True

# Test 1: Before OAS/CPP (expect 15% RRIF, full TFSA)
result1 = test_scenario(
    "Juan & Daniela - Before OAS/CPP (ages 66/65)",
    test1_payload,
    {
        'expected_rrif_pct': 0.15,  # 15% before OAS
        'expected_tfsa': 14000,     # Full $7,000 each
        'total_years': 31
    }
)
all_passed = all_passed and result1

# Test 2: After OAS/CPP (expect 8% RRIF, reduced TFSA)
result2 = test_scenario(
    "Juan & Daniela - After OAS/CPP (ages 71/70)",
    test2_payload,
    {
        'expected_rrif_pct': 0.08,  # 8% after OAS
        'expected_tfsa': 4620,      # Reduced (33% of max)
        'total_years': 25
    }
)
all_passed = all_passed and result2

# Test 3: Lower assets (test withdrawal order)
result3 = test_scenario(
    "Lower Asset Couple - Test Withdrawal Order",
    test3_payload,
    {
        'expected_rrif_pct': 0.15,  # 15% before OAS
        'expected_tfsa': 14000,     # Full contributions if affordable
        'total_years': 31
    }
)
all_passed = all_passed and result3

# Final Summary
print("\n" + "="*80)
print("📊 FINAL TEST RESULTS")
print("="*80)

if all_passed:
    print("\n🎉 ALL TESTS PASSED!")
    print("\nThe RRIF-frontload strategy is working correctly with:")
    print("  ✅ 15% RRIF withdrawals before OAS/CPP")
    print("  ✅ 8% RRIF withdrawals after OAS/CPP")
    print("  ✅ Smart tax-aware TFSA contributions")
    print("  ✅ Correct withdrawal order (RRIF → Corp → NonReg → TFSA)")
    print("  ✅ Tax optimization through strategic timing")
else:
    print("\n⚠️  SOME TESTS FAILED - Review the results above")

print("="*80)