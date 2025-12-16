"""
Test the API directly to see what tax values it returns for Juan & Daniela.
"""

import sys
sys.path.insert(0, '/Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app')

from api.models.requests import SimulationRequest, PersonProfile
from modules.simulation import run_simulation
from modules.config import load_tax_config

# Juan & Daniela profile
juan = PersonProfile(
    name="Juan",
    birth_year=1960,
    province="AB",
    retirement_age=65,
    life_expectancy=95,
    rrsp=150000,
    tfsa=100000,
    nonreg=215000,
    nonreg_basis=200000,
    employer_pension=0,
    employer_pension_indexing=0.0,
    bridge_amount=0,
    bridge_end_age=0,
    cpp_start_age=65,
    cpp_amount=0,
    oas_start_age=65
)

daniela = PersonProfile(
    name="Daniela",
    birth_year=1960,
    province="AB",
    retirement_age=65,
    life_expectancy=95,
    rrsp=150000,
    tfsa=100000,
    nonreg=215000,
    nonreg_basis=200000,
    employer_pension=0,
    employer_pension_indexing=0.0,
    bridge_amount=0,
    bridge_end_age=0,
    cpp_start_age=65,
    cpp_amount=0,
    oas_start_age=65
)

request = SimulationRequest(
    person1=juan,
    person2=daniela,
    annual_spending=200000,
    inflation_rate=0.02,
    sim_start_year=2025,
    investment_return=0.055,
    tfsa_contribution_room_p1=0,
    tfsa_contribution_room_p2=0,
    include_cpp=True,
    include_oas=True,
    include_gis=False,
    corporate_account_balance=2000000,
    corporate_passive_income=0.055
)

# Load tax config
tax_config = load_tax_config("tax_config_canada_2025.json")

print("=" * 100)
print("DIRECT API TEST - Juan & Daniela 2025")
print("=" * 100)
print()

# Run simulation
result = run_simulation(request, tax_config)

if result.success:
    year_2025 = result.year_by_year[0]

    print("2025 YEAR DATA:")
    print(f"  Year: {year_2025.year}")
    print(f"  Age P1: {year_2025.age_p1}")
    print(f"  Age P2: {year_2025.age_p2}")
    print()
    print("TAX VALUES:")
    print(f"  Total Tax (household): ${year_2025.total_tax:,.2f}")
    print(f"  Tax P1:                ${year_2025.total_tax_p1:,.2f}")
    print(f"  Tax P2:                ${year_2025.total_tax_p2:,.2f}")
    print()
    print("INCOME VALUES:")
    print(f"  Taxable Income P1: ${year_2025.taxable_income_p1:,.2f}")
    print(f"  Taxable Income P2: ${year_2025.taxable_income_p2:,.2f}")
    print()
    print("WITHDRAWALS:")
    print(f"  RRSP P1: ${year_2025.rrsp_withdrawal_p1:,.2f}")
    print(f"  RRSP P2: ${year_2025.rrsp_withdrawal_p2:,.2f}")
    print(f"  TFSA P1: ${year_2025.tfsa_withdrawal_p1:,.2f}")
    print(f"  TFSA P2: ${year_2025.tfsa_withdrawal_p2:,.2f}")
    print(f"  NonReg P1: ${year_2025.nonreg_withdrawal_p1:,.2f}")
    print(f"  NonReg P2: ${year_2025.nonreg_withdrawal_p2:,.2f}")
    print()

    if hasattr(year_2025, 'corporate_dividend_p1'):
        print("CORPORATE:")
        print(f"  Dividend P1: ${year_2025.corporate_dividend_p1:,.2f}")
        print(f"  Dividend P2: ${year_2025.corporate_dividend_p2:,.2f}")
        print()

    print("=" * 100)
    print("VERIFICATION")
    print("=" * 100)
    print()
    print(f"Expected from comprehensive audit: $19,750.37")
    print(f"Actual from API:                   ${year_2025.total_tax:,.2f}")
    print()

    if abs(year_2025.total_tax - 19750.37) < 1:
        print("✅ API RETURNS CORRECT VALUE!")
    else:
        print(f"❌ DISCREPANCY: ${abs(year_2025.total_tax - 19750.37):,.2f}")

    print()
    print("If UI shows $13,199 but API returns $19,750.37:")
    print("→ Problem is in the frontend (data transformation or display)")
    print()

else:
    print(f"❌ Simulation failed: {result.message}")
