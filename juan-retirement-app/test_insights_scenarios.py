"""
Test AI-powered insights with multiple scenarios.

Tests edge cases and different client profiles:
1. Excellent GIS candidate (low CPP, small RRIF, high TFSA)
2. Good GIS candidate (moderate balances)
3. Marginal GIS candidate (at threshold)
4. Poor GIS candidate (high income, large RRIF)
5. Single person scenario
"""

from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
from modules.strategy_insights import format_insights_for_display


def run_scenario(name: str, p1: Person, p2: Person = None, spending: float = 60000, is_single: bool = False):
    """Run a scenario and display insights."""
    print("\n" + "="*80)
    print(f"SCENARIO: {name}")
    print("="*80)

    # If single person, create a dummy p2 with zero balances (simulation requires p2)
    if is_single and p2 is None:
        p2 = Person(
            name="Spouse",
            start_age=p1.start_age,
            tfsa_balance=0,
            rrif_balance=0,
            rrsp_balance=0,
            nonreg_balance=0,
            corporate_balance=0,
            cpp_annual_at_start=0,
            cpp_start_age=100,  # Never receives CPP
            oas_annual_at_start=0,
            oas_start_age=100   # Never receives OAS
        )

    household = Household(
        p1=p1,
        p2=p2,
        province="ON",
        start_year=2026,
        end_age=95,
        spending_go_go=spending,
        spending_slow_go=spending * 0.8,
        spending_no_go=spending * 0.6,
        go_go_end_age=75,
        slow_go_end_age=85,
        general_inflation=0.02,
        spending_inflation=0.02
    )
    household.strategy = "minimize-income"

    # Display profile
    print(f"\nProfile:")
    print(f"  {p1.name}: Age {p1.start_age}" + (" [SINGLE]" if is_single else ""))
    print(f"    CPP: ${p1.cpp_annual_at_start:,.0f}, OAS: ${p1.oas_annual_at_start:,.0f}")
    print(f"    RRIF: ${p1.rrif_balance:,.0f}, TFSA: ${p1.tfsa_balance:,.0f}")
    print(f"    NonReg: ${p1.nonreg_balance:,.0f}, Corp: ${p1.corporate_balance:,.0f}")

    if p2 and not is_single:
        print(f"  {p2.name}: Age {p2.start_age}")
        print(f"    CPP: ${p2.cpp_annual_at_start:,.0f}, OAS: ${p2.oas_annual_at_start:,.0f}")
        print(f"    RRIF: ${p2.rrif_balance:,.0f}, TFSA: ${p2.tfsa_balance:,.0f}")
        print(f"    NonReg: ${p2.nonreg_balance:,.0f}, Corp: ${p2.corporate_balance:,.0f}")

    print(f"\n  Annual spending: ${spending:,.0f}")

    # Run simulation
    print(f"\nRunning simulation...")
    tax_config = load_tax_config('tax_config_canada_2025.json')
    results = simulate(household, tax_config)

    print(f"✓ Completed: {len(results)} years")

    # Display insights
    if 'strategy_insights' in results.attrs:
        insights = results.attrs['strategy_insights']
        gis_feas = insights['gis_feasibility']

        print(f"\n{'─'*80}")
        print(f"QUICK SUMMARY:")
        print(f"  GIS Status: {gis_feas['status'].upper()}")
        print(f"  Rating: {insights['strategy_effectiveness']['rating']}/10 ({insights['strategy_effectiveness']['level']})")
        print(f"  Eligible Years: {gis_feas['eligible_years']}")
        print(f"  Total GIS: ${insights['summary_metrics']['total_gis']:,.0f}")
        print(f"  Final Net Worth: ${insights['summary_metrics']['final_net_worth']:,.0f}")

        print(f"\n{format_insights_for_display(insights)}")
    else:
        print("⚠️ No insights generated")


def test_excellent_gis_candidate():
    """Scenario 1: Excellent GIS candidate - Low CPP, small RRIF, high TFSA."""
    p1 = Person(
        name="Alice",
        start_age=65,
        tfsa_balance=150000,      # High TFSA
        rrif_balance=80000,       # Small RRIF (below threshold)
        rrsp_balance=0,
        nonreg_balance=100000,
        corporate_balance=0,
        cpp_annual_at_start=6000,   # Low CPP
        cpp_start_age=65,
        oas_annual_at_start=7500,   # Full OAS
        oas_start_age=65
    )

    run_scenario("EXCELLENT - Low CPP, Small RRIF, High TFSA", p1, spending=45000, is_single=True)


def test_good_gis_candidate():
    """Scenario 2: Good GIS candidate - Moderate balances."""
    p1 = Person(
        name="Bob",
        start_age=65,
        tfsa_balance=100000,
        rrif_balance=120000,      # Moderate RRIF
        rrsp_balance=0,
        nonreg_balance=150000,
        corporate_balance=100000,
        cpp_annual_at_start=8000,   # Moderate CPP
        cpp_start_age=65,
        oas_annual_at_start=7500,
        oas_start_age=65
    )

    run_scenario("GOOD - Moderate Balances", p1, spending=50000, is_single=True)


def test_marginal_gis_candidate():
    """Scenario 3: Marginal - Right at RRIF threshold."""
    p1 = Person(
        name="Carol",
        start_age=65,
        tfsa_balance=80000,
        rrif_balance=128000,      # Right at threshold for low CPP
        rrsp_balance=0,
        nonreg_balance=100000,
        corporate_balance=50000,
        cpp_annual_at_start=8000,
        cpp_start_age=65,
        oas_annual_at_start=7500,
        oas_start_age=65
    )

    run_scenario("MARGINAL - RRIF at Threshold", p1, spending=55000, is_single=True)


def test_poor_gis_candidate_high_rrif():
    """Scenario 4: Poor - High RRIF exceeds threshold."""
    p1 = Person(
        name="David",
        start_age=65,
        tfsa_balance=95000,
        rrif_balance=300000,      # Way above threshold
        rrsp_balance=0,
        nonreg_balance=150000,
        corporate_balance=200000,
        cpp_annual_at_start=10000,  # High CPP
        cpp_start_age=65,
        oas_annual_at_start=7500,
        oas_start_age=65
    )

    run_scenario("POOR - High RRIF Exceeds Threshold", p1, spending=70000, is_single=True)


def test_not_eligible_high_income():
    """Scenario 5: Not eligible - CPP+OAS exceeds threshold."""
    p1 = Person(
        name="Eve",
        start_age=65,
        tfsa_balance=100000,
        rrif_balance=400000,
        rrsp_balance=0,
        nonreg_balance=200000,
        corporate_balance=500000,
        cpp_annual_at_start=15000,  # Very high CPP
        cpp_start_age=65,
        oas_annual_at_start=7500,
        oas_start_age=65
    )

    run_scenario("NOT ELIGIBLE - High Income", p1, spending=100000, is_single=True)


def test_couple_low_income():
    """Scenario 6: Couple - Low income, good GIS potential."""
    p1 = Person(
        name="Frank",
        start_age=65,
        tfsa_balance=100000,
        rrif_balance=100000,      # Small RRIF each
        rrsp_balance=0,
        nonreg_balance=150000,
        corporate_balance=100000,
        cpp_annual_at_start=7000,   # Low CPP
        cpp_start_age=65,
        oas_annual_at_start=7000,
        oas_start_age=65
    )

    p2 = Person(
        name="Grace",
        start_age=63,
        tfsa_balance=100000,
        rrif_balance=100000,
        rrsp_balance=0,
        nonreg_balance=150000,
        corporate_balance=100000,
        cpp_annual_at_start=6000,   # Low CPP
        cpp_start_age=65,
        oas_annual_at_start=7000,
        oas_start_age=65
    )

    run_scenario("COUPLE - Low Income, Good Potential", p1, p2, spending=60000)


def test_couple_marginal():
    """Scenario 7: Couple - Marginal (at threshold)."""
    p1 = Person(
        name="Henry",
        start_age=65,
        tfsa_balance=95000,
        rrif_balance=150000,      # Moderate RRIF
        rrsp_balance=0,
        nonreg_balance=150000,
        corporate_balance=200000,
        cpp_annual_at_start=9000,
        cpp_start_age=65,
        oas_annual_at_start=7000,
        oas_start_age=65
    )

    p2 = Person(
        name="Iris",
        start_age=63,
        tfsa_balance=95000,
        rrif_balance=150000,
        rrsp_balance=0,
        nonreg_balance=150000,
        corporate_balance=200000,
        cpp_annual_at_start=8000,
        cpp_start_age=65,
        oas_annual_at_start=7000,
        oas_start_age=65
    )

    run_scenario("COUPLE - Marginal GIS Eligibility", p1, p2, spending=75000)


def test_couple_poor_rafael_lucy():
    """Scenario 8: Couple - Poor (Rafael & Lucy - high RRIF)."""
    p1 = Person(
        name="Rafael",
        start_age=65,
        tfsa_balance=95000,
        rrif_balance=300000,      # Large RRIF
        rrsp_balance=0,
        nonreg_balance=200000,
        corporate_balance=500000,
        cpp_annual_at_start=10000,  # High CPP
        cpp_start_age=65,
        oas_annual_at_start=7000,
        oas_start_age=65
    )

    p2 = Person(
        name="Lucy",
        start_age=63,
        tfsa_balance=95000,
        rrif_balance=300000,
        rrsp_balance=0,
        nonreg_balance=200000,
        corporate_balance=500000,
        cpp_annual_at_start=10000,
        cpp_start_age=65,
        oas_annual_at_start=7000,
        oas_start_age=65
    )

    run_scenario("COUPLE - Poor (Rafael & Lucy High RRIF)", p1, p2, spending=180000)


def main():
    """Run all test scenarios."""
    print("="*80)
    print("AI-POWERED INSIGHTS: COMPREHENSIVE SCENARIO TESTING")
    print("="*80)
    print("\nTesting 8 different scenarios from excellent to poor GIS candidates...")

    scenarios = [
        ("1. EXCELLENT", test_excellent_gis_candidate),
        ("2. GOOD", test_good_gis_candidate),
        ("3. MARGINAL", test_marginal_gis_candidate),
        ("4. POOR (High RRIF)", test_poor_gis_candidate_high_rrif),
        ("5. NOT ELIGIBLE (High Income)", test_not_eligible_high_income),
        ("6. COUPLE - Good", test_couple_low_income),
        ("7. COUPLE - Marginal", test_couple_marginal),
        ("8. COUPLE - Poor", test_couple_poor_rafael_lucy),
    ]

    for name, test_func in scenarios:
        try:
            test_func()
        except Exception as e:
            print(f"\n❌ {name} FAILED: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*80)
    print("✓ ALL SCENARIOS COMPLETED")
    print("="*80)


if __name__ == "__main__":
    main()
