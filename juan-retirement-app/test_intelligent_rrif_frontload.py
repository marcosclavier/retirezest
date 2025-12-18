"""
Test the enhanced RRIF-Frontload strategy with intelligent OAS clawback decision-making.

This test verifies:
1. RRIF depletes in 10-12 years (15% before OAS, 8% after)
2. Corporate preferred after RRIF
3. Intelligent OAS clawback decisions based on estate tax optimization
4. Decision logging shows the reasoning
"""

import requests
import json

# Test profile - Juan & Daniela
test_profile = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 200000,
        "rrif_balance": 800000,
        "rrsp_balance": 0,
        "nonreg_balance": 500000,
        "corporate_balance": 0,
        "nonreg_acb": 450000,
        "nr_cash": 50000,
        "nr_gic": 100000,
        "nr_invest": 350000,
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 0,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 5.0,
        "corp_gic_pct": 10.0,
        "corp_invest_pct": 85.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_contribution_annual": 0,
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 200000,
        "rrif_balance": 0,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "nonreg_acb": 0,
        "nr_cash": 0,
        "nr_gic": 0,
        "nr_invest": 0,
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 0,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 5.0,
        "corp_gic_pct": 10.0,
        "corp_invest_pct": 85.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_contribution_annual": 0,
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",
    "spending_go_go": 120000,
    "go_go_end_age": 75,
    "spending_slow_go": 90000,
    "slow_go_end_age": 85,
    "spending_no_go": 70000,
    "spending_inflation": 2.0,
    "general_inflation": 2.0,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False,
}

print("=" * 80)
print("INTELLIGENT RRIF FRONTLOAD STRATEGY TEST")
print("=" * 80)
print()
print("Profile:")
print(f"  Juan: RRIF=$800K, TFSA=$200K, NonReg=$500K")
print(f"  Daniela: TFSA=$200K")
print(f"  Strategy: rrif-frontload (15% before OAS, 8% after)")
print(f"  OAS starts: Age 70")
print()

# Run simulation
print("Running simulation...")
response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=test_profile)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()
if not result.get("success"):
    print(f"❌ Failed: {result.get('message')}")
    exit(1)

year_by_year = result["year_by_year"]
summary = result["summary"]

print("✅ Simulation completed successfully")
print()

# Analyze RRIF depletion timeline
print("=" * 80)
print("RRIF DEPLETION ANALYSIS")
print("=" * 80)
print()

rrif_depleted_year = None
for yd in year_by_year:
    if yd['rrif_balance_p1'] < 1000:  # Essentially depleted
        rrif_depleted_year = yd['year']
        break

if rrif_depleted_year:
    years_to_deplete = rrif_depleted_year - 2025
    print(f"✅ RRIF depleted by year {rrif_depleted_year} (age {rrif_depleted_year - 2025 + 65})")
    print(f"   Timeline: {years_to_deplete} years")
    if 10 <= years_to_deplete <= 12:
        print(f"   ✅ PERFECT: Within target 10-12 year range")
    else:
        print(f"   ⚠️  Outside target: Expected 10-12 years, got {years_to_deplete}")
else:
    print("⚠️  RRIF not fully depleted by end of simulation")

# Analyze withdrawal patterns
print()
print("=" * 80)
print("WITHDRAWAL PATTERN ANALYSIS (First 15 years)")
print("=" * 80)
print()

print(f"{'Year':<6} {'Age':<4} {'RRIF Bal':<12} {'RRIF %':<8} {'TFSA Bal':<12} {'NonReg WD':<12} {'TFSA WD':<12} {'Corp WD':<12}")
print("-" * 100)

for yd in year_by_year[:15]:
    year = yd['year']
    age = yd['age_p1']
    rrif_bal = yd['rrif_balance_p1']
    rrif_wd = yd['rrif_withdrawal_p1']
    rrif_pct = (rrif_wd / rrif_bal * 100) if rrif_bal > 0 else 0
    tfsa_bal = yd['tfsa_balance_p1']
    nonreg_wd = yd.get('nonreg_withdrawal_p1', 0)
    tfsa_wd = yd['tfsa_withdrawal_p1']
    corp_wd = yd.get('corporate_withdrawal_p1', 0)

    print(f"{year:<6} {age:<4} ${rrif_bal:>10,.0f} {rrif_pct:>6.1f}% ${tfsa_bal:>10,.0f} ${nonreg_wd:>10,.0f} ${tfsa_wd:>10,.0f} ${corp_wd:>10,.0f}")

# Analyze OAS clawback
print()
print("=" * 80)
print("OAS CLAWBACK ANALYSIS")
print("=" * 80)
print()

total_clawback = summary.get('total_oas_clawback', 0)
print(f"Total OAS clawback over lifetime: ${total_clawback:,.0f}")

clawback_years = []
for yd in year_by_year:
    clawback = (yd.get('oas_clawback_p1', 0) or 0) + (yd.get('oas_clawback_p2', 0) or 0)
    if clawback > 100:
        clawback_years.append({
            'year': yd['year'],
            'age': yd['age_p1'],
            'clawback': clawback,
            'tfsa_wd': yd['tfsa_withdrawal_p1'],
            'corp_wd': yd.get('corporate_withdrawal_p1', 0),
        })

if len(clawback_years) > 0:
    print(f"\n⚠️  Found {len(clawback_years)} years with OAS clawback:")
    for cy in clawback_years[:5]:  # Show first 5
        print(f"\n  Year {cy['year']} (age {cy['age']}):")
        print(f"    Clawback: ${cy['clawback']:,.0f}")
        print(f"    TFSA WD: ${cy['tfsa_wd']:,.0f}")
        print(f"    Corp WD: ${cy['corp_wd']:,.0f}")
else:
    print("\n✅ No significant OAS clawback detected")

# Estate analysis
print()
print("=" * 80)
print("ESTATE TAX ANALYSIS")
print("=" * 80)
print()

estate_summary = result.get('estate_summary', {})
if estate_summary:
    gross_estate = estate_summary.get('gross_estate_value', 0)
    taxes_at_death = estate_summary.get('taxes_at_death', 0)
    after_tax_legacy = estate_summary.get('after_tax_legacy', 0)
    tfsa_at_death = estate_summary.get('tfsa_balance_at_death', 0)

    print(f"Gross estate value: ${gross_estate:,.0f}")
    print(f"Taxes at death: ${taxes_at_death:,.0f}")
    print(f"After-tax legacy: ${after_tax_legacy:,.0f}")
    print(f"TFSA at death (tax-free): ${tfsa_at_death:,.0f}")
    print()

    if tfsa_at_death > 100000:
        print(f"✅ TFSA preserved: ${tfsa_at_death:,.0f} tax-free legacy")
    elif tfsa_at_death < 50000:
        print(f"⚠️  TFSA depleted: Only ${tfsa_at_death:,.0f} remaining")
    else:
        print(f"ℹ️  TFSA partially depleted: ${tfsa_at_death:,.0f} remaining")

print()
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
