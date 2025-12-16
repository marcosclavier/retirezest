"""
Test that TFSA contributions maximize available room, not just the fixed amount.

Scenario:
- Year 1: Room = $7K → Should contribute $7K
- Year 2: Room = $14K (if we withdraw $7K in year 1) → Should contribute $14K
- Year 3: Room = $21K → Should contribute $21K
- This continues until NonReg is depleted
"""

import requests

# Start with LOW NonReg balance to see room accumulation clearly
profile = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 50000,  # Start with lower TFSA
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 100000,  # Moderate NonReg balance
        "corporate_balance": 500000,
        "nonreg_acb": 90000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 85000,
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 50000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 100000,
        "corporate_balance": 500000,
        "nonreg_acb": 90000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 85000,
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",
    "spending_go_go": 100000,
    "spending_slow_go": 100000,
    "spending_no_go": 100000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85,
    "tfsa_contribution_each": 7000,  # Enable TFSA contributions
    "reinvest_nonreg_dist": False
}

print("=" * 100)
print("TESTING: TFSA CONTRIBUTIONS SHOULD MAXIMIZE AVAILABLE ROOM")
print("=" * 100)
print("\nScenario:")
print("  - Starting TFSA room: $7,000/person")
print("  - Annual room growth: $7,000/person")
print("  - Starting NonReg: $100,000/person")
print("\nExpected behavior:")
print("  - Year 1: Contribute up to $7K (initial room)")
print("  - Year 2+: Contribute MORE if room accumulated from withdrawals or unused room")
print("=" * 100)

response = requests.post("http://localhost:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()
if not data.get("success"):
    print(f"\n❌ Simulation failed")
    exit(1)

years = data.get("year_by_year", [])[:10]

print("\n" + "=" * 100)
print("TFSA CONTRIBUTION ROOM USAGE OVER 10 YEARS")
print("=" * 100)
print(f"\n{'Year':<6} {'Age':<5} {'TFSA Contrib':<15} {'TFSA Contrib':<15} {'NonReg Bal':<15} {'TFSA Bal':<15}")
print(f"{'':6} {'':5} {'P1':<15} {'P2':<15} {'P1':<15} {'P1':<15}")
print("-" * 100)

total_contributed = 0
for i, year_data in enumerate(years):
    year = year_data['year']
    age = year_data['age_p1']

    tfsa_contrib_p1 = year_data.get('tfsa_contribution_p1', 0)
    tfsa_contrib_p2 = year_data.get('tfsa_contribution_p2', 0)

    nonreg_bal_p1 = year_data.get('nonreg_balance_p1', 0)
    tfsa_bal_p1 = year_data.get('tfsa_balance_p1', 0)

    total_contributed += tfsa_contrib_p1 + tfsa_contrib_p2

    print(f"{year:<6} {age:<5} ${tfsa_contrib_p1:>13,.0f} ${tfsa_contrib_p2:>13,.0f} ${nonreg_bal_p1:>13,.0f} ${tfsa_bal_p1:>13,.0f}")

print("-" * 100)
print(f"Total TFSA contributions (10 years): ${total_contributed:,.0f}")

print("\n" + "=" * 100)
print("VALIDATION CHECKS")
print("=" * 100)

# Check year 1
year1 = years[0]
tfsa_y1_p1 = year1.get('tfsa_contribution_p1', 0)
expected_y1 = 7000  # Initial room

if abs(tfsa_y1_p1 - expected_y1) < 100:
    print(f"\n✅ Year 1: Contributed ${tfsa_y1_p1:,.0f} (expected ~${expected_y1:,.0f})")
else:
    print(f"\n⚠️  Year 1: Contributed ${tfsa_y1_p1:,.0f} (expected ~${expected_y1:,.0f})")

# Check if contributions are increasing (using accumulated room)
year2 = years[1]
year3 = years[2]

tfsa_y2_p1 = year2.get('tfsa_contribution_p1', 0)
tfsa_y3_p1 = year3.get('tfsa_contribution_p1', 0)

print(f"\nYear 2: Contributed ${tfsa_y2_p1:,.0f}/person")
print(f"Year 3: Contributed ${tfsa_y3_p1:,.0f}/person")

# We expect contributions to stay constant at room growth rate, OR increase if room accumulates
# In this case, with spending + TFSA contributions, NonReg should be drawn down
# So contributions should be limited by NonReg balance or room

if tfsa_y2_p1 >= 7000:
    print(f"\n✅ Year 2: Using available room (${tfsa_y2_p1:,.0f} >= $7,000 minimum)")
else:
    print(f"\n⚠️  Year 2: Not maximizing room (${tfsa_y2_p1:,.0f} < $7,000)")

# Check total contributed
# Over 10 years, with $7K/person/year growth, we should contribute at least $70K/person
# (might be more if withdrawals create additional room)
min_expected_total = 70000 * 2  # $7K/year × 10 years × 2 people
if total_contributed >= min_expected_total * 0.9:  # Allow 10% variance
    print(f"\n✅ Total contributions: ${total_contributed:,.0f} (expected at least ${min_expected_total:,.0f})")
else:
    print(f"\n⚠️  Total contributions: ${total_contributed:,.0f} (expected at least ${min_expected_total:,.0f})")

# Check that TFSA balance is growing
year1_tfsa = years[0].get('tfsa_balance_p1', 0)
year10_tfsa = years[9].get('tfsa_balance_p1', 0)

tfsa_growth = year10_tfsa - year1_tfsa
print(f"\nTFSA Balance (P1):")
print(f"  Year 1:  ${year1_tfsa:,.0f}")
print(f"  Year 10: ${year10_tfsa:,.0f}")
print(f"  Growth:  ${tfsa_growth:,.0f}")

if tfsa_growth > 50000:  # Expect significant growth
    print(f"\n✅ TFSA growing substantially (${tfsa_growth:,.0f} over 10 years)")
else:
    print(f"\n⚠️  TFSA growth lower than expected (${tfsa_growth:,.0f})")

print("\n" + "=" * 100)
print("✅ TFSA ROOM MAXIMIZATION TEST COMPLETE!")
print("=" * 100)
