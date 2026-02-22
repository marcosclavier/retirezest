#!/usr/bin/env python3
"""
Test RRIF-frontload strategy for Juan and Daniela (high-value assets couple)
"""
import requests
import json

# High-value assets couple scenario
payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "end_age": 95,
        "cpp_start_age": 65,
        "cpp_amount": 15000,  # Higher CPP
        "oas_start_age": 70,  # Deferred OAS - perfect for RRIF-frontload!
        "oas_amount": 8904,
        "tfsa_balance": 250000,  # High TFSA
        "rrif_balance": 1500000,  # Very high RRIF - needs frontload strategy
        "rrsp_balance": 0,
        "nonreg_balance": 800000,  # High NonReg
        "nonreg_acb": 600000,  # 75% ACB
        "corporate_balance": 500000,  # Significant Corp balance
        "pension_incomes": [{
            "name": "DB Pension",
            "amount": 80000,
            "start_age": 65,
            "indexed_to_inflation": True
        }],
        "other_incomes": []
    },
    "p2": {
        "name": "Daniela",
        "start_age": 62,
        "end_age": 95,
        "cpp_start_age": 65,
        "cpp_amount": 10000,
        "oas_start_age": 67,  # Also deferred
        "oas_amount": 8904,
        "tfsa_balance": 200000,
        "rrif_balance": 800000,  # Also high RRIF
        "rrsp_balance": 0,
        "nonreg_balance": 400000,
        "nonreg_acb": 350000,  # 87.5% ACB
        "corporate_balance": 300000,
        "pension_incomes": [],
        "other_incomes": [{
            "name": "Rental Income",
            "amount": 36000,
            "start_age": 62,
            "end_age": 75,
            "indexed_to_inflation": False
        }]
    },
    "hh": {
        "province": "ON",
        "start_year": 2025,
        "spending_target": 180000,  # High spending target
        "strategy": "rrif-frontload",
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
}

print("=" * 80)
print("HIGH-VALUE COUPLE TEST - Juan (65) and Daniela (62)")
print("=" * 80)
print(f"\n📊 ASSET SUMMARY:")
print(f"Juan:")
print(f"  RRIF: ${payload['p1']['rrif_balance']:,}")
print(f"  Corporate: ${payload['p1']['corporate_balance']:,}")
print(f"  NonReg: ${payload['p1']['nonreg_balance']:,}")
print(f"  TFSA: ${payload['p1']['tfsa_balance']:,}")
print(f"  OAS Start Age: {payload['p1']['oas_start_age']} (DEFERRED)")
print(f"  Pension: ${payload['p1']['pension_incomes'][0]['amount']:,}/year")

print(f"\nDaniela:")
print(f"  RRIF: ${payload['p2']['rrif_balance']:,}")
print(f"  Corporate: ${payload['p2']['corporate_balance']:,}")
print(f"  NonReg: ${payload['p2']['nonreg_balance']:,}")
print(f"  TFSA: ${payload['p2']['tfsa_balance']:,}")
print(f"  OAS Start Age: {payload['p2']['oas_start_age']} (DEFERRED)")
print(f"  Rental Income: ${payload['p2']['other_incomes'][0]['amount']:,}/year")

print(f"\n💰 TOTAL ASSETS: ${sum([
    payload['p1']['rrif_balance'], payload['p1']['corporate_balance'],
    payload['p1']['nonreg_balance'], payload['p1']['tfsa_balance'],
    payload['p2']['rrif_balance'], payload['p2']['corporate_balance'],
    payload['p2']['nonreg_balance'], payload['p2']['tfsa_balance']
]):,}")

print(f"\n🎯 Strategy: RRIF-Frontload")
print(f"Spending Target: ${payload['hh']['spending_target']:,}")

print(f"\n📈 EXPECTED RRIF WITHDRAWALS (Year 1):")
print(f"Juan (Age 65, OAS at 70): 15% of ${payload['p1']['rrif_balance']:,} = ${payload['p1']['rrif_balance'] * 0.15:,.0f}")
print(f"Daniela (Age 62, OAS at 67): 15% of ${payload['p2']['rrif_balance']:,} = ${payload['p2']['rrif_balance'] * 0.15:,.0f}")
print(f"Total RRIF frontload: ${(payload['p1']['rrif_balance'] * 0.15) + (payload['p2']['rrif_balance'] * 0.15):,.0f}")

print("\n" + "-" * 80)
print("Sending request...")

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text[:500])
    else:
        data = response.json()

        # Check optimization results
        if 'optimization_summary' in data:
            opt = data['optimization_summary']
            print(f"\n🔄 STRATEGY OPTIMIZER RESULTS:")
            print(f"  Original strategy: {opt.get('original_strategy', 'N/A')}")
            print(f"  Best strategy: {opt.get('best_strategy', 'N/A')}")
            print(f"  Improvement: {opt.get('improvement_percentage', 0):.1f}%")

        # Check for year_by_year data (different response format)
        years_data = data.get('year_by_year', data.get('years', []))

        if years_data and len(years_data) > 0:
            # First 3 years analysis
            print(f"\n📅 FIRST 3 YEARS ANALYSIS:")
            for i in range(min(3, len(years_data))):
                year = years_data[i]
                print(f"\n Year {year['year']} (Juan age {year.get('age_p1', 65+i)}, Daniela age {year.get('age_p2', 62+i)}):")

                # Withdrawals
                total_rrif = year.get('total_withdrawals', {}).get('rrif', 0)
                total_corp = year.get('total_withdrawals', {}).get('corp', 0)
                total_nonreg = year.get('total_withdrawals', {}).get('nonreg', 0)
                total_tfsa = year.get('total_withdrawals', {}).get('tfsa', 0)

                print(f"   Withdrawals:")
                print(f"     RRIF: ${total_rrif:,.0f}")
                print(f"     Corp: ${total_corp:,.0f}")
                print(f"     NonReg: ${total_nonreg:,.0f}")
                print(f"     TFSA: ${total_tfsa:,.0f}")

                # Tax and status
                print(f"   Tax Paid: ${year.get('tax_paid', 0):,.0f}")
                print(f"   Status: {year.get('status', 'Unknown')}")

                if year.get('status') == 'Gap':
                    print(f"   ⚠️ GAP: ${year.get('gap', 0):,.0f}")

            # Summary statistics
            print(f"\n📊 SIMULATION SUMMARY:")
            years_funded = sum(1 for y in years_data if y.get('status') != 'Gap')
            total_years = len(years_data)
            success_rate = (years_funded / total_years * 100) if total_years > 0 else 0

            print(f"  Success Rate: {success_rate:.1f}% ({years_funded}/{total_years} years funded)")
            print(f"  Total Tax Paid: ${data.get('total_tax_paid', 0):,.0f}")
            print(f"  Final Estate: ${data.get('final_estate_value', 0):,.0f}")

            # Check if RRIF-frontload is working as expected
            year1 = years_data[0]
            rrif_year1 = year1.get('total_withdrawals', {}).get('rrif', 0)
            expected_rrif = (payload['p1']['rrif_balance'] * 0.15) + (payload['p2']['rrif_balance'] * 0.15)

            print(f"\n✅ RRIF-FRONTLOAD VERIFICATION:")
            print(f"  Expected RRIF (15% each): ${expected_rrif:,.0f}")
            print(f"  Actual RRIF withdrawn: ${rrif_year1:,.0f}")

            if abs(rrif_year1 - expected_rrif) < 1000:
                print(f"  ✅ RRIF frontload working correctly!")
            else:
                print(f"  ⚠️ RRIF withdrawal doesn't match expected frontload")

        else:
            print(f"\n❌ No years data in response")
            print(f"Response data keys: {list(data.keys())}")
            if 'message' in data:
                print(f"Message: {data['message']}")
            if 'success' in data:
                print(f"Success: {data['success']}")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Check backend logs for detailed debug output:")
print("tail -100 /tmp/uvicorn-hybrid.log | grep -E 'RRIF-FRONTLOAD|SHORTFALL'")
print("=" * 80)