"""
Simple end-to-end integration test for Early RRIF Withdrawal feature.

Tests that the simulation runs successfully with early RRIF withdrawals enabled.
"""

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config


def test_early_rrif_fixed_amount_runs():
    """Test that simulation runs with early RRIF withdrawals (fixed amount)."""
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    p1 = Person(
        name="Test Person",
        start_age=65,
        rrsp_balance=500000,
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=65,
        early_rrif_withdrawal_end_age=70,
        early_rrif_withdrawal_annual=25000,
        early_rrif_withdrawal_mode="fixed",
        cpp_annual_at_start=10000,
        cpp_start_age=65,
        oas_annual_at_start=8000,
        oas_start_age=65,
    )

    p2 = Person(name="Partner", start_age=65)

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=75,
        spending_go_go=60000,
    )

    # Should run without errors
    results = simulate(household, tax_cfg)
    assert len(results) > 0

    print("\n✅ Fixed amount mode: Simulation completed successfully")
    print(f"   Total years simulated: {len(results)}")


def test_early_rrif_percentage_runs():
    """Test that simulation runs with early RRIF withdrawals (percentage mode)."""
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    p1 = Person(
        name="Test Person",
        start_age=60,
        rrif_balance=750000,
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=60,
        early_rrif_withdrawal_end_age=69,
        early_rrif_withdrawal_percentage=5.0,
        early_rrif_withdrawal_mode="percentage",
        cpp_annual_at_start=10000,
        cpp_start_age=65,
        oas_annual_at_start=8000,
        oas_start_age=65,
    )

    p2 = Person(name="Partner", start_age=60)

    household = Household(
        p1=p1,
        p2=p2,
        province="ON",
        start_year=2025,
        end_age=70,
        spending_go_go=50000,
    )

    # Should run without errors
    results = simulate(household, tax_cfg)
    assert len(results) > 0

    print("\n✅ Percentage mode: Simulation completed successfully")
    print(f"   Total years simulated: {len(results)}")


def test_couples_income_splitting_runs():
    """Test that simulation runs with income splitting scenario."""
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # High income spouse - no early withdrawals
    p1 = Person(
        name="High Income Spouse",
        start_age=65,
        rrsp_balance=300000,
        employer_pension_annual=40000,
        enable_early_rrif_withdrawal=False,
        cpp_annual_at_start=12000,
        cpp_start_age=65,
        oas_annual_at_start=8000,
        oas_start_age=65,
    )

    # Low income spouse - enable early withdrawals
    p2 = Person(
        name="Low Income Spouse",
        start_age=63,
        rrsp_balance=400000,
        employer_pension_annual=0,
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=63,
        early_rrif_withdrawal_end_age=70,
        early_rrif_withdrawal_annual=30000,
        early_rrif_withdrawal_mode="fixed",
        cpp_annual_at_start=8000,
        cpp_start_age=65,
        oas_annual_at_start=8000,
        oas_start_age=65,
    )

    household = Household(
        p1=p1,
        p2=p2,
        province="BC",
        start_year=2025,
        end_age=75,
        spending_go_go=80000,
    )

    # Should run without errors
    results = simulate(household, tax_cfg)
    assert len(results) > 0

    print("\n✅ Income splitting: Simulation completed successfully")
    print(f"   Total years simulated: {len(results)}")


def test_no_rrif_balance_runs():
    """Test that simulation handles person with no RRIF balance."""
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    p1 = Person(
        name="Test Person",
        start_age=65,
        rrsp_balance=0,  # No RRSP
        rrif_balance=0,  # No RRIF
        tfsa_balance=100000,
        enable_early_rrif_withdrawal=True,  # Enabled but no balance
        early_rrif_withdrawal_start_age=65,
        early_rrif_withdrawal_end_age=70,
        early_rrif_withdrawal_annual=25000,
        early_rrif_withdrawal_mode="fixed",
        cpp_annual_at_start=10000,
        cpp_start_age=65,
        oas_annual_at_start=8000,
        oas_start_age=65,
    )

    p2 = Person(name="Partner", start_age=65)

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=70,
        spending_go_go=40000,
    )

    # Should not raise an error even though early RRIF is enabled but no balance
    results = simulate(household, tax_cfg)
    assert len(results) > 0

    print("\n✅ No RRIF balance: Simulation completed successfully")
    print(f"   Total years simulated: {len(results)}")


if __name__ == "__main__":
    print("=" * 80)
    print("EARLY RRIF WITHDRAWAL - INTEGRATION TESTS")
    print("=" * 80)

    test_early_rrif_fixed_amount_runs()
    test_early_rrif_percentage_runs()
    test_couples_income_splitting_runs()
    test_no_rrif_balance_runs()

    print("\n" + "=" * 80)
    print("✅ ALL INTEGRATION TESTS PASSED")
    print("=" * 80)
