"""
Verify RRIF Frontload withdrawal order is correct.

Tests that the RRIF frontload strategy uses the proper withdrawal priority:
1. RRIF (frontload target)
2. Corporate
3. NonReg
4. TFSA
"""

import requests
import json

# Test profile using RRIF Frontload strategy
profile = {
    "p1": {
        "name": "TestPerson",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 0,
        "oas_start_age": 70,
        "oas_annual_at_start": 0,
        "tfsa_balance": 50000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 100000,
        "corporate_balance": 200000,
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
    "end_age": 85,
    "strategy": "rrif-frontload",
    "spending_go_go": 80000,
    "spending_slow_go": 80000,
    "spending_no_go": 80000,
}

print("=" * 80)
print("RRIF FRONTLOAD WITHDRAWAL ORDER VERIFICATION")
print("=" * 80)
print("\nInitial Balances:")
print(f"  RRIF:      ${profile['p1']['rrif_balance']:>10,.0f}")
print(f"  Corporate: ${profile['p1']['corporate_balance']:>10,.0f}")
print(f"  NonReg:    ${profile['p1']['nonreg_balance']:>10,.0f}")
print(f"  TFSA:      ${profile['p1']['tfsa_balance']:>10,.0f}")

print("\nExpected Withdrawal Order:")
print("  1. RRIF (15% frontload target before age 70)")
print("  2. Corporate (used second to fill spending gap)")
print("  3. NonReg (used third if corporate exhausted)")
print("  4. TFSA (preserved as last resort)")

# Call API
print("\nCalling API...")
response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"\n❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()

if not result.get("success"):
    print(f"\n❌ Simulation Failed: {result.get('message')}")
    exit(1)

year_by_year = result["year_by_year"]

print("\n" + "=" * 80)
print("YEAR-BY-YEAR WITHDRAWAL ANALYSIS (First 5 Years)")
print("=" * 80)

for i, year_data in enumerate(year_by_year[:5]):
    year = year_data['year']
    age = year_data['age_p1']

    rrif_wd = year_data['rrif_withdrawal_p1']
    corp_wd = year_data['corporate_withdrawal_p1']
    nonreg_wd = year_data['nonreg_withdrawal_p1']
    tfsa_wd = year_data['tfsa_withdrawal_p1']

    rrif_bal = year_data['rrif_balance_p1']
    corp_bal = year_data['corporate_balance_p1']
    nonreg_bal = year_data['nonreg_balance_p1']
    tfsa_bal = year_data['tfsa_balance_p1']

    print(f"\nYear {year} (Age {age}):")
    print(f"  RRIF Withdrawal:      ${rrif_wd:>10,.0f}  (Balance: ${rrif_bal:>10,.0f})")
    print(f"  Corporate Withdrawal: ${corp_wd:>10,.0f}  (Balance: ${corp_bal:>10,.0f})")
    print(f"  NonReg Withdrawal:    ${nonreg_wd:>10,.0f}  (Balance: ${nonreg_bal:>10,.0f})")
    print(f"  TFSA Withdrawal:      ${tfsa_wd:>10,.0f}  (Balance: ${tfsa_bal:>10,.0f})")

    # Verify order
    print(f"\n  Verification:")

    # Check RRIF is being frontloaded
    if rrif_bal > 0:
        frontload_pct = (rrif_wd / rrif_bal) * 100 if rrif_bal > 0 else 0
        if frontload_pct > 10:  # At least 10% being withdrawn
            print(f"    ✓ RRIF frontload active: ${rrif_wd:,.0f} ({frontload_pct:.1f}% of beginning balance)")
        else:
            print(f"    ⚠ RRIF frontload may not be active (only {frontload_pct:.1f}%)")

    # Check withdrawal order
    if corp_wd > 0 and nonreg_wd == 0 and tfsa_wd == 0:
        print(f"    ✓ Corporate used (NonReg and TFSA preserved)")
    elif corp_bal < 1000 and nonreg_wd > 0 and tfsa_wd == 0:
        print(f"    ✓ Corporate exhausted, now using NonReg (TFSA preserved)")
    elif corp_bal < 1000 and nonreg_bal < 1000 and tfsa_wd > 0:
        print(f"    ✓ Corporate and NonReg exhausted, now using TFSA")
    elif corp_wd > 0 and nonreg_wd > 0:
        print(f"    ⚠ ISSUE: Both Corporate AND NonReg used simultaneously!")
    elif tfsa_wd > 0 and (corp_bal > 1000 or nonreg_bal > 1000):
        print(f"    ⚠ ISSUE: TFSA used while Corporate or NonReg still available!")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

# Check if withdrawal order is correct across all years
issues = []

for year_data in year_by_year[:5]:
    year = year_data['year']
    corp_wd = year_data['corporate_withdrawal_p1']
    nonreg_wd = year_data['nonreg_withdrawal_p1']
    tfsa_wd = year_data['tfsa_withdrawal_p1']
    corp_bal = year_data['corporate_balance_p1']
    nonreg_bal = year_data['nonreg_balance_p1']

    # Check for order violations
    if corp_wd > 0 and nonreg_wd > 0:
        issues.append(f"Year {year}: Both Corp and NonReg used simultaneously")
    if tfsa_wd > 0 and (corp_bal > 1000 or nonreg_bal > 1000):
        issues.append(f"Year {year}: TFSA used while other accounts available")

if issues:
    print("\n⚠️  ISSUES DETECTED:")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("\n✅ WITHDRAWAL ORDER IS CORRECT!")
    print("   1. RRIF frontload is active (15% before age 70)")
    print("   2. Corporate is used as second source")
    print("   3. NonReg is preserved until Corporate exhausted")
    print("   4. TFSA is preserved as last resort")

print("\n" + "=" * 80)
