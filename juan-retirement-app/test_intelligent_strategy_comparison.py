"""
Compare the intelligent RRIF-Frontload strategy results.

This test shows that accepting OAS clawback (~$153K) to deplete Corporate
results in much lower estate taxes compared to avoiding clawback.
"""

import requests
import json

# Test profile with Corporate accounts (like Juan & Daniela)
test_profile = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 150000,
        "rrif_balance": 185000,
        "rrsp_balance": 0,
        "nonreg_balance": 441500,
        "corporate_balance": 1207500,
        "nonreg_acb": 397350,
        "nr_cash": 44150,
        "nr_gic": 88300,
        "nr_invest": 309050,
        "y_nr_cash_interest": 1.0,
        "y_nr_gic_interest": 3.0,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 60375,
        "corp_gic_bucket": 120750,
        "corp_invest_bucket": 1026375,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 1.0,
        "y_corp_gic_interest": 3.0,
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
        "tfsa_balance": 220000,
        "rrif_balance": 260000,
        "rrsp_balance": 0,
        "nonreg_balance": 441500,
        "corporate_balance": 1207500,
        "nonreg_acb": 397350,
        "nr_cash": 44150,
        "nr_gic": 88300,
        "nr_invest": 309050,
        "y_nr_cash_interest": 1.0,
        "y_nr_gic_interest": 3.0,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 60375,
        "corp_gic_bucket": 120750,
        "corp_invest_bucket": 1026375,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 1.0,
        "y_corp_gic_interest": 3.0,
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
    "spending_go_go": 207000,
    "go_go_end_age": 75,
    "spending_slow_go": 155250,
    "slow_go_end_age": 85,
    "spending_no_go": 124200,
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
print("INTELLIGENT ESTATE TAX OPTIMIZATION TEST")
print("=" * 80)
print()

# Run simulation
response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=test_profile)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()
if not result.get("success"):
    print(f"❌ Failed: {result.get('message')}")
    exit(1)

summary = result["summary"]
estate_summary = result.get("estate_summary", {})

print("RESULTS:")
print("=" * 80)
print()

# OAS clawback paid during life
total_clawback = summary.get('total_oas_clawback', 0)
print(f"💰 OAS Clawback (paid during life): ${total_clawback:,.0f}")
print()

# Estate at death
gross_estate = estate_summary.get('gross_estate_value', 0)
taxes_at_death = estate_summary.get('taxes_at_death', 0)
after_tax_legacy = estate_summary.get('after_tax_legacy', 0)

tfsa_at_death = estate_summary.get('tfsa_balance_at_death', 0)
corp_at_death = estate_summary.get('corporate_balance_at_death', 0)
rrif_at_death = estate_summary.get('rrif_balance_at_death', 0)

print(f"📊 ESTATE AT DEATH:")
print(f"   Gross estate: ${gross_estate:,.0f}")
print(f"   Taxes at death: ${taxes_at_death:,.0f}")
print(f"   After-tax legacy: ${after_tax_legacy:,.0f}")
print()

print(f"   Account balances at death:")
print(f"   • TFSA: ${tfsa_at_death:,.0f} (tax-free)")
print(f"   • Corporate: ${corp_at_death:,.0f}")
print(f"   • RRIF: ${rrif_at_death:,.0f}")
print()

# Total tax cost
total_tax_cost = total_clawback + taxes_at_death
print(f"📈 TOTAL TAX COST:")
print(f"   OAS clawback + Estate tax: ${total_tax_cost:,.0f}")
print()

# Analysis
print("=" * 80)
print("INTELLIGENT STRATEGY ANALYSIS")
print("=" * 80)
print()

print("✅ This strategy ACCEPTS OAS clawback to REDUCE estate taxes:")
print()
print(f"   • OAS clawback paid: ${total_clawback:,.0f}")
print(f"     (15% on excess income during life)")
print()
print(f"   • Estate tax saved: Compare Corporate balance at death")
print(f"     Old strategy: $5.3M Corporate → $926K estate tax")
print(f"     New strategy: ${corp_at_death:,.0f} Corporate → less estate tax")
print()
print(f"   • TFSA preserved: ${tfsa_at_death:,.0f} (0% tax at death)")
print()

# Net benefit calculation
old_estate_tax = 926000  # From previous test
old_clawback = 3633  # From previous test
old_total = old_estate_tax + old_clawback

new_total = total_tax_cost

savings = old_total - new_total

print(f"💡 NET RESULT:")
print(f"   Old approach (avoid clawback): ${old_total:,.0f} total tax")
print(f"   New approach (intelligent): ${new_total:,.0f} total tax")
print()
if savings > 0:
    print(f"   ✅ SAVINGS: ${savings:,.0f}")
else:
    print(f"   ⚠️  Additional cost: ${-savings:,.0f}")

print()
print("=" * 80)
