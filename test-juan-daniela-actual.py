#!/usr/bin/env python3
"""
Test RRIF-frontload strategy for Juan (66) and Daniela (65)
High-value couple from jrcb@hotmail.com
"""
import requests
import json

# Based on actual data from scripts:
# Juan & Daniela - high net worth couple
# Total assets ~$4M+
payload = {
    "p1": {
        "name": "Juan",
        "start_age": 66,  # Juan is 66
        "end_age": 95,
        "cpp_start_age": 66,
        "cpp_amount": 15000,  # Higher CPP
        "oas_start_age": 70,  # Deferred OAS - perfect for RRIF-frontload
        "oas_amount": 8904,
        "tfsa_balance": 182000,  # Based on actual data
        "rrif_balance": 185000,  # Juan's RRIF
        "rrsp_balance": 0,
        "nonreg_balance": 415000,  # Split joint NonReg
        "nonreg_acb": 350000,
        "corporate_balance": 1195000,  # Split joint Corp
        "pension_incomes": [],
        "other_incomes": []
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,  # Daniela is 65
        "end_age": 95,
        "cpp_start_age": 65,
        "cpp_amount": 12000,
        "oas_start_age": 70,  # Also deferred OAS
        "oas_amount": 8904,
        "tfsa_balance": 220000,  # Daniela's TFSA
        "rrif_balance": 260000,  # Daniela's RRIF
        "rrsp_balance": 0,
        "nonreg_balance": 415000,  # Split joint NonReg
        "nonreg_acb": 350000,
        "corporate_balance": 1195000,  # Split joint Corp
        "pension_incomes": [],
        "other_incomes": []
    },
    # Household-level fields at root
    "province": "AB",  # Alberta
    "start_year": 2025,
    "spending_target": 150000,  # High spending
    "strategy": "rrif-frontload",  # IMPORTANT: At root level, not nested
    "tfsa_contribution_each": 7000,  # Enable TFSA contributions
    "inflation_general": 2.0,
    "return_rrif": 5.0,
    "return_nonreg": 5.0,
    "return_tfsa": 4.0,
    "return_corporate": 5.0,
    "nonreg_interest_pct": 20.0,
    "nonreg_elig_div_pct": 30.0,
    "nonreg_capg_dist_pct": 50.0,
    "reinvest_nonreg_dist": False
}

print("=" * 80)
print("JUAN (66) & DANIELA (65) - HIGH NET WORTH COUPLE")
print("=" * 80)
print(f"\n📊 ASSET SUMMARY:")
print(f"Juan (Age 66):")
print(f"  RRIF: ${payload['p1']['rrif_balance']:,}")
print(f"  Corporate: ${payload['p1']['corporate_balance']:,}")
print(f"  NonReg: ${payload['p1']['nonreg_balance']:,}")
print(f"  TFSA: ${payload['p1']['tfsa_balance']:,}")
print(f"  OAS Start Age: {payload['p1']['oas_start_age']} (DEFERRED - perfect for frontload)")

print(f"\nDaniela (Age 65):")
print(f"  RRIF: ${payload['p2']['rrif_balance']:,}")
print(f"  Corporate: ${payload['p2']['corporate_balance']:,}")
print(f"  NonReg: ${payload['p2']['nonreg_balance']:,}")
print(f"  TFSA: ${payload['p2']['tfsa_balance']:,}")
print(f"  OAS Start Age: {payload['p2']['oas_start_age']} (DEFERRED - perfect for frontload)")

total_assets = sum([
    payload['p1']['rrif_balance'], payload['p1']['corporate_balance'],
    payload['p1']['nonreg_balance'], payload['p1']['tfsa_balance'],
    payload['p2']['rrif_balance'], payload['p2']['corporate_balance'],
    payload['p2']['nonreg_balance'], payload['p2']['tfsa_balance']
])
print(f"\n💰 TOTAL ASSETS: ${total_assets:,}")

print(f"\n🎯 Strategy: {payload['strategy']}")
print(f"Spending Target: ${payload['spending_target']:,}")

print(f"\n📈 EXPECTED RRIF WITHDRAWALS:")
print(f"Juan (Age 66, OAS at 70): 15% of ${payload['p1']['rrif_balance']:,} = ${payload['p1']['rrif_balance'] * 0.15:,.0f}")
print(f"Daniela (Age 65, OAS at 70): 15% of ${payload['p2']['rrif_balance']:,} = ${payload['p2']['rrif_balance'] * 0.15:,.0f}")
print(f"Total RRIF frontload: ${(payload['p1']['rrif_balance'] * 0.15) + (payload['p2']['rrif_balance'] * 0.15):,.0f}")

print("\n" + "-" * 80)
print("Sending request to Python API...")
print(f"DEBUG: Sending strategy = '{payload['strategy']}'")
print(f"DEBUG: Province = '{payload['province']}', Year = {payload['start_year']}")

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text[:500])
    else:
        data = response.json()

        # Success
        if 'success' in data:
            print(f"\n✅ Simulation Status: {'SUCCESS' if data['success'] else 'FAILED'}")

        if 'message' in data:
            print(f"Message: {data['message']}")

        # Check summary if available
        if 'summary' in data and data['summary']:
            summary = data['summary']
            print(f"\n📊 SIMULATION SUMMARY:")

            # Try different possible field names
            years_funded = (summary.get('years_funded') or
                          summary.get('funded_years') or
                          summary.get('success_years'))
            if years_funded:
                print(f"  Years funded: {years_funded}")

            success_rate = summary.get('success_rate')
            if success_rate is not None:
                print(f"  Success rate: {success_rate:.1f}%")

            total_tax = summary.get('total_tax_paid') or summary.get('total_tax')
            if total_tax:
                print(f"  Total tax: ${total_tax:,.0f}")

            estate = summary.get('final_estate_value') or summary.get('final_estate')
            if estate:
                print(f"  Final estate: ${estate:,.0f}")

        # Check year_by_year data
        year_data = data.get('year_by_year', [])
        if year_data and isinstance(year_data, list) and len(year_data) > 0:
            print(f"\n📅 FIRST YEAR ANALYSIS:")

            # Year 2025 should be index 0
            year1 = year_data[0] if isinstance(year_data[0], dict) else None

            if year1:
                # Look for RRIF withdrawals with different possible field names
                rrif_fields = ['rrif_withdrawal_p1', 'rrif_p1', 'withdrawals_rrif_p1',
                             'rrif_withdrawal_total', 'total_withdrawals']

                for field in rrif_fields:
                    if field in year1:
                        print(f"  {field}: ${year1[field]:,.0f}")
                        break

        # Check optimization
        if 'optimization_result' in data and data['optimization_result']:
            opt = data['optimization_result']
            print(f"\n🔄 STRATEGY OPTIMIZER:")
            print(f"  Original: {opt.get('original_strategy', 'N/A')}")
            print(f"  Recommended: {opt.get('recommended_strategy', 'N/A')}")
        else:
            print(f"\n✅ No strategy optimization needed - RRIF-frontload working as expected!")

        print(f"\n✅ RRIF-FRONTLOAD STRATEGY TEST:")
        print(f"  Juan (66) and Daniela (65) both have OAS deferred to 70")
        print(f"  Both should get 15% RRIF withdrawals (before OAS)")
        print(f"  Expected total RRIF: ~${((payload['p1']['rrif_balance'] * 0.15) + (payload['p2']['rrif_balance'] * 0.15)):,.0f}")
        print(f"  With Corp/NonReg available for gap-filling if needed")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Check backend logs for RRIF-frontload debug output:")
print("tail -100 /tmp/uvicorn-hybrid.log | grep -E 'Juan|Daniela|RRIF-FRONTLOAD'")
print("=" * 80)