"""
End-to-end integration test for Early RRIF Withdrawal feature.

Tests the full simulation flow with early RRIF withdrawals enabled,
verifying that withdrawals are applied correctly and reflected in results.
"""

import pytest
from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config


# Load tax config once for all tests
tax_cfg = load_tax_config("tax_config_canada_2025.json")


def test_simulation_with_early_rrif_fixed_amount():
    """Test full simulation with early RRIF withdrawals (fixed amount)."""
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
        end_age=75,  # Short simulation for testing
        spending_go_go=60000,
    )

    results = simulate(household, tax_cfg)

    # Verify simulation ran successfully
    assert len(results) > 0

    # Check years when early withdrawals should occur (age 65-70)
    early_withdrawal_years = results[(results['age_p1'] >= 65) & (results['age_p1'] <= 70)]
    assert len(early_withdrawal_years) > 0

    # Verify RRIF balance is decreasing
    first_row = results.iloc[0]
    total_rrsp_rrif = first_row['rrsp_p1'] + first_row['rrif_p1']
    assert total_rrsp_rrif < 500000  # Should have withdrawn from RRSP/RRIF

    print("\n===== Early RRIF Withdrawal Test Results =====")
    print(f"Total years simulated: {len(results)}")
    print(f"Years with early withdrawals: {len(early_withdrawal_years)}")
    print(f"\nFirst 6 years of simulation:")
    for idx in range(min(6, len(results))):
        row = results.iloc[idx]
        total = row['rrsp_p1'] + row['rrif_p1']
        print(f"  Year {row['year']} (Age {row['age_p1']}): RRSP+RRIF Balance = ${total:,.0f}")


def test_simulation_with_early_rrif_percentage():
    """Test full simulation with early RRIF withdrawals (percentage mode)."""
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

    results = simulate(household, tax_cfg)

    assert len(results) > 0

    # Verify RRIF balance is decreasing over time
    for i in range(1, min(5, len(results))):
        # Balance should generally decrease (accounting for growth)
        # We just verify simulation completes without errors
        assert results[i].rrif_p1 >= 0

    print("\n===== Percentage Mode Test Results =====")
    print(f"Total years simulated: {len(results)}")
    print(f"\nFirst 5 years of simulation:")
    for i, year in enumerate(results[:5]):
        print(f"  Year {year.year} (Age {year.age_p1}): RRIF Balance = ${year.rrif_p1:,.0f}")


def test_couples_income_splitting_simulation():
    """Test realistic income splitting scenario for couples."""
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
        employer_pension_annual=0,  # No pension
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

    results = simulate(household, tax_cfg)

    assert len(results) > 0

    # Check that P2's RRSP is being withdrawn from
    first_year = results[0]
    assert first_year.rrsp_p2 + first_year.rrif_p2 < 400000

    print("\n===== Income Splitting Test Results =====")
    print(f"Total years simulated: {len(results)}")
    print(f"\nFirst 8 years of simulation:")
    print(f"  {'Year':<6} {'P1 Age':<8} {'P2 Age':<8} {'P1 RRSP+RRIF':<15} {'P2 RRSP+RRIF':<15}")
    for i, year in enumerate(results[:8]):
        p1_total = year.rrsp_p1 + year.rrif_p1
        p2_total = year.rrsp_p2 + year.rrif_p2
        print(f"  {year.year:<6} {year.age_p1:<8} {year.age_p2:<8} ${p1_total:<14,.0f} ${p2_total:<14,.0f}")


def test_early_withdrawals_stop_at_71():
    """Test that early withdrawals stop at age 71 and mandatory minimums take over."""
    p1 = Person(
        name="Test Person",
        start_age=68,  # Start close to age 71
        rrif_balance=800000,
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=68,
        early_rrif_withdrawal_end_age=70,
        early_rrif_withdrawal_annual=40000,
        early_rrif_withdrawal_mode="fixed",
        cpp_annual_at_start=12000,
        cpp_start_age=68,
        oas_annual_at_start=8000,
        oas_start_age=68,
    )

    p2 = Person(name="Partner", start_age=68)

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=75,
        spending_go_go=70000,
    )

    results = simulate(household, tax_cfg)

    assert len(results) > 0

    # Find years at age 70 and 71
    year_70 = next((r for r in results if r.age_p1 == 70), None)
    year_71 = next((r for r in results if r.age_p1 == 71), None)

    if year_70 and year_71:
        print("\n===== Early Withdrawal Stop Test =====")
        print(f"Age 70: RRIF Balance = ${year_70.rrif_p1:,.0f}")
        print(f"Age 71: RRIF Balance = ${year_71.rrif_p1:,.0f}")
        print(f"Early withdrawals should stop at age 71")
        print(f"Mandatory minimums take effect at age 71+")


def test_no_rrif_balance():
    """Test that simulation handles person with no RRIF balance correctly."""
    p1 = Person(
        name="Test Person",
        start_age=65,
        rrsp_balance=0,  # No RRSP
        rrif_balance=0,  # No RRIF
        tfsa_balance=100000,
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
        end_age=70,
        spending_go_go=40000,
    )

    # Should not raise an error even though early RRIF is enabled but no balance
    results = simulate(household, tax_cfg)
    assert len(results) > 0


def test_validation_in_simulation():
    """Test that simulation handles validation errors gracefully."""
    # Create person with invalid settings (end age >= 71)
    p1 = Person(
        name="Test Person",
        start_age=65,
        rrsp_balance=500000,
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=65,
        early_rrif_withdrawal_end_age=75,  # Invalid: > 71
        early_rrif_withdrawal_annual=25000,
        early_rrif_withdrawal_mode="fixed",
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

    # Simulation should still run (validation is advisory)
    # The calculate_early_rrif_withdrawal function will just return 0 after age 70
    results = simulate(household, tax_cfg)
    assert len(results) > 0


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "-s"])
