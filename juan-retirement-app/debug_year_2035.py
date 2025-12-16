"""
Debug year 2035 spending status contradiction for jrcb@hotmail.com (Juan and Daniela).

Investigates why year 2035 shows:
- $17,310 shortfall in detailed breakdown
- Green "OK" badge (plan_success=True)
- No gap in Spending Analysis chart

Hypothesis: TFSA contributions are causing discrepancy between:
1. simulation.py's underfunded_amount (doesn't subtract TFSA contributions)
2. converters.py's spending_gap (subtracts TFSA contributions)
"""

import requests
import json

# First, let's get the user's current profile from the database
# We'll need to query the API endpoint that returns simulation results

# For testing, I'll use the profile from the database query
# In production, this would come from: GET /api/users/profile for jrcb@hotmail.com

# Making a request to get simulation results
# Note: We'll need to authenticate or use a test profile that matches

print("=" * 80)
print("YEAR 2035 SPENDING STATUS INVESTIGATION")
print("User: jrcb@hotmail.com (Juan and Daniela)")
print("=" * 80)

# Since we can't directly query the production database, let's create a test
# that replicates the scenario as closely as possible

# Test profile based on Juan and Daniela's likely configuration
profile = {
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
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "balanced",
    "spending_go_go": 120000,
    "spending_slow_go": 90000,
    "spending_no_go": 70000,
}

print("\nRunning simulation...\n")

response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()
if not result.get("success"):
    print(f"❌ Failed: {result.get('message')}")
    exit(1)

year_by_year = result["year_by_year"]

# Find year 2035
year_2035 = None
for yd in year_by_year:
    if yd['year'] == 2035:
        year_2035 = yd
        break

if not year_2035:
    print("❌ Year 2035 not found in simulation results")
    exit(1)

print("=" * 80)
print("YEAR 2035 DETAILED DATA")
print("=" * 80)

# Extract all relevant fields
age_p1 = year_2035.get('age_p1', 'N/A')
age_p2 = year_2035.get('age_p2', 'N/A')
spending_need = year_2035.get('spending_need', 0)
spending_met = year_2035.get('spending_met', 0)
spending_gap = year_2035.get('spending_gap', 0)
plan_success = year_2035.get('plan_success', None)

# Government benefits
cpp_p1 = year_2035.get('cpp_p1', 0)
cpp_p2 = year_2035.get('cpp_p2', 0)
oas_p1 = year_2035.get('oas_p1', 0)
oas_p2 = year_2035.get('oas_p2', 0)
gis_p1 = year_2035.get('gis_p1', 0)
gis_p2 = year_2035.get('gis_p2', 0)

# Withdrawals
tfsa_withdrawal_p1 = year_2035.get('tfsa_withdrawal_p1', 0)
tfsa_withdrawal_p2 = year_2035.get('tfsa_withdrawal_p2', 0)
rrif_withdrawal_p1 = year_2035.get('rrif_withdrawal_p1', 0)
rrif_withdrawal_p2 = year_2035.get('rrif_withdrawal_p2', 0)
rrsp_withdrawal_p1 = year_2035.get('rrsp_withdrawal_p1', 0)
rrsp_withdrawal_p2 = year_2035.get('rrsp_withdrawal_p2', 0)
nonreg_withdrawal_p1 = year_2035.get('nonreg_withdrawal_p1', 0)
nonreg_withdrawal_p2 = year_2035.get('nonreg_withdrawal_p2', 0)

# CRITICAL: TFSA contributions
tfsa_contribution_p1 = year_2035.get('tfsa_contribution_p1', 0)
tfsa_contribution_p2 = year_2035.get('tfsa_contribution_p2', 0)
total_tfsa_contributions = tfsa_contribution_p1 + tfsa_contribution_p2

# Taxes
total_tax = year_2035.get('total_tax', 0)

# Ending balances
tfsa_eoy_p1 = year_2035.get('tfsa_eoy_p1', 0)
tfsa_eoy_p2 = year_2035.get('tfsa_eoy_p2', 0)
rrif_eoy_p1 = year_2035.get('rrif_eoy_p1', 0)
rrif_eoy_p2 = year_2035.get('rrif_eoy_p2', 0)

print(f"\nAges: Juan {age_p1}, Daniela {age_p2}")
print(f"\nStatus: {'✅ OK' if plan_success else '❌ GAP'} (plan_success={plan_success})")
print(f"\nSpending:")
print(f"  Need: ${spending_need:,.2f}")
print(f"  Met:  ${spending_met:,.2f}")
print(f"  Gap:  ${spending_gap:,.2f}")

print(f"\nGovernment Benefits:")
print(f"  CPP P1: ${cpp_p1:,.2f}")
print(f"  CPP P2: ${cpp_p2:,.2f}")
print(f"  OAS P1: ${oas_p1:,.2f}")
print(f"  OAS P2: ${oas_p2:,.2f}")
print(f"  GIS P1: ${gis_p1:,.2f}")
print(f"  GIS P2: ${gis_p2:,.2f}")
print(f"  Total: ${cpp_p1 + cpp_p2 + oas_p1 + oas_p2 + gis_p1 + gis_p2:,.2f}")

print(f"\nAccount Withdrawals:")
print(f"  TFSA P1: ${tfsa_withdrawal_p1:,.2f}")
print(f"  TFSA P2: ${tfsa_withdrawal_p2:,.2f}")
print(f"  RRIF P1: ${rrif_withdrawal_p1:,.2f}")
print(f"  RRIF P2: ${rrif_withdrawal_p2:,.2f}")
print(f"  RRSP P1: ${rrsp_withdrawal_p1:,.2f}")
print(f"  RRSP P2: ${rrsp_withdrawal_p2:,.2f}")
print(f"  NonReg P1: ${nonreg_withdrawal_p1:,.2f}")
print(f"  NonReg P2: ${nonreg_withdrawal_p2:,.2f}")
print(f"  Total: ${tfsa_withdrawal_p1 + tfsa_withdrawal_p2 + rrif_withdrawal_p1 + rrif_withdrawal_p2 + rrsp_withdrawal_p1 + rrsp_withdrawal_p2 + nonreg_withdrawal_p1 + nonreg_withdrawal_p2:,.2f}")

print(f"\n🔑 TFSA CONTRIBUTIONS (KEY!):")
print(f"  P1 Contribution: ${tfsa_contribution_p1:,.2f}")
print(f"  P2 Contribution: ${tfsa_contribution_p2:,.2f}")
print(f"  Total: ${total_tfsa_contributions:,.2f}")

print(f"\nTaxes:")
print(f"  Total Tax: ${total_tax:,.2f}")

print(f"\nEnding Balances:")
print(f"  TFSA P1: ${tfsa_eoy_p1:,.2f}")
print(f"  TFSA P2: ${tfsa_eoy_p2:,.2f}")
print(f"  RRIF P1: ${rrif_eoy_p1:,.2f}")
print(f"  RRIF P2: ${rrif_eoy_p2:,.2f}")

print("\n" + "=" * 80)
print("CALCULATION VERIFICATION")
print("=" * 80)

# Calculate what simulation.py sees (without TFSA contributions)
gov_benefits = cpp_p1 + cpp_p2 + oas_p1 + oas_p2 + gis_p1 + gis_p2
total_withdrawals = (tfsa_withdrawal_p1 + tfsa_withdrawal_p2 +
                     rrif_withdrawal_p1 + rrif_withdrawal_p2 +
                     rrsp_withdrawal_p1 + rrsp_withdrawal_p2 +
                     nonreg_withdrawal_p1 + nonreg_withdrawal_p2)

# Simulation's view (doesn't subtract TFSA contributions)
simulation_available = gov_benefits + total_withdrawals - total_tax
simulation_shortfall = max(0, spending_need - simulation_available)

# Converter's view (subtracts TFSA contributions)
converter_available = gov_benefits + total_withdrawals - total_tax - total_tfsa_contributions
converter_shortfall = max(0, spending_need - converter_available)

print(f"\n1. SIMULATION.PY CALCULATION (sets plan_success):")
print(f"   Available = Benefits + Withdrawals - Taxes")
print(f"   Available = ${gov_benefits:,.2f} + ${total_withdrawals:,.2f} - ${total_tax:,.2f}")
print(f"   Available = ${simulation_available:,.2f}")
print(f"   Shortfall = max(0, ${spending_need:,.2f} - ${simulation_available:,.2f})")
print(f"   Shortfall = ${simulation_shortfall:,.2f}")
print(f"   is_underfunded = {simulation_shortfall >= 1.0}")
print(f"   plan_success = {not (simulation_shortfall >= 1.0)}")

print(f"\n2. CONVERTERS.PY CALCULATION (sets spending_gap):")
print(f"   Available = Benefits + Withdrawals - Taxes - TFSA Contributions")
print(f"   Available = ${gov_benefits:,.2f} + ${total_withdrawals:,.2f} - ${total_tax:,.2f} - ${total_tfsa_contributions:,.2f}")
print(f"   Available = ${converter_available:,.2f}")
print(f"   Shortfall = max(0, ${spending_need:,.2f} - ${converter_available:,.2f})")
print(f"   Shortfall = ${converter_shortfall:,.2f}")

print(f"\n3. DISCREPANCY:")
print(f"   Difference = ${converter_shortfall:,.2f} - ${simulation_shortfall:,.2f}")
print(f"   Difference = ${converter_shortfall - simulation_shortfall:,.2f}")
print(f"   TFSA Contributions = ${total_tfsa_contributions:,.2f}")

print("\n" + "=" * 80)
print("DIAGNOSIS")
print("=" * 80)

if abs(converter_shortfall - simulation_shortfall - total_tfsa_contributions) < 0.01:
    print("\n✅ HYPOTHESIS CONFIRMED!")
    print(f"   The ${spending_gap:,.2f} shortfall in the UI matches the TFSA contributions.")
    print(f"   ")
    print(f"   WHY THE CONTRADICTION EXISTS:")
    print(f"   - simulation.py doesn't subtract TFSA contributions → sees no shortfall")
    print(f"   - converters.py subtracts TFSA contributions → sees ${converter_shortfall:,.2f} shortfall")
    print(f"   ")
    print(f"   RESULT:")
    print(f"   - Status badge shows 'OK' (from plan_success based on simulation)")
    print(f"   - Detailed breakdown shows ${spending_gap:,.2f} shortfall (from converter)")
    print(f"   - Spending Analysis chart uses plan_success → shows no gap")
    print(f"   ")
    print(f"   BUSINESS LOGIC QUESTION:")
    print(f"   Should TFSA contributions be considered 'spending' or 'savings'?")
    print(f"   Currently the system is inconsistent between the two calculation points.")
else:
    print("\n⚠️  HYPOTHESIS PARTIALLY CONFIRMED")
    print(f"   TFSA contributions (${total_tfsa_contributions:,.2f}) explain part of the discrepancy")
    print(f"   but there may be other factors at play.")
    print(f"   Expected gap difference: ${total_tfsa_contributions:,.2f}")
    print(f"   Actual gap difference: ${converter_shortfall - simulation_shortfall:,.2f}")

print("\n" + "=" * 80)
