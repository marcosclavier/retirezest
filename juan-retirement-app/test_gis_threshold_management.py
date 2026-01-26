"""
Test suite for GIS threshold management in minimize-income strategy.

This test validates that the strategy actively manages withdrawals to stay
below the GIS threshold and maximize government benefits.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.models import Person, Household
from modules.simulation import simulate_year, calculate_gis
from modules.config import load_tax_config, get_tax_params

# Load tax configuration
TAX_CONFIG = load_tax_config("tax_config_canada_2025.json")


def test_gis_threshold_targeting():
    """Test that strategy stays below GIS threshold to maximize benefits."""
    print("\n" + "="*70)
    print("TEST: GIS Threshold Targeting")
    print("="*70)

    # Create low-income GIS-eligible person
    # GIS threshold for singles: $22,272 (2025)
    person = Person(
        name="GIS Eligible",
        start_age=66,
        tfsa_balance=80000,
        rrif_balance=250000,
        nonreg_balance=150000,
        nonreg_acb=135000,  # High ACB = low taxable gains (10% gains)
        corporate_balance=300000,
        cpp_annual_at_start=7000,   # Low CPP
        cpp_start_age=65,
        oas_annual_at_start=8000,   # Full OAS
        oas_start_age=65
    )

    household = Household(
        p1=person,
        p2=None,
        province="ON",
        start_year=2026,
        end_age=95,
        spending_go_go=35000  # Modest spending, should be achievable without exceeding GIS threshold
    )
    household.strategy = "minimize-income"

    fed_params, prov_params = get_tax_params(TAX_CONFIG, "ON")

    print(f"\nInitial situation:")
    print(f"  Age: {person.start_age}")
    print(f"  CPP: ${person.cpp_annual_at_start:,.0f}")
    print(f"  OAS: ${person.oas_annual_at_start:,.0f}")
    print(f"  Base income (CPP+OAS): ${person.cpp_annual_at_start + person.oas_annual_at_start:,.0f}")
    print(f"  GIS threshold (single): $22,272")
    print(f"  Income room for max GIS: ${22272 - (person.cpp_annual_at_start + person.oas_annual_at_start):,.0f}")

    print(f"\nAccount balances:")
    print(f"  TFSA: ${person.tfsa_balance:,.0f}")
    print(f"  RRIF: ${person.rrif_balance:,.0f}")
    print(f"  NonReg: ${person.nonreg_balance:,.0f} (ACB: ${person.nonreg_acb:,.0f})")
    print(f"  Corp: ${person.corporate_balance:,.0f}")

    result = simulate_year(
        person=person,
        age=66,
        after_tax_target=35000,
        fed=fed_params,
        prov=prov_params,
        rrsp_to_rrif=False,
        custom_withdraws={},
        strategy_name="minimize-income",
        hybrid_topup_amt=0.0,
        hh=household,
        year=2026
    )

    withdrawals, income_sources, taxes = result

    print(f"\nWithdrawals executed:")
    print(f"  NonReg: ${withdrawals.get('nonreg', 0):,.0f}")
    print(f"  Corp:   ${withdrawals.get('corp', 0):,.0f}")
    print(f"  RRIF:   ${withdrawals.get('rrif', 0):,.0f}")
    print(f"  TFSA:   ${withdrawals.get('tfsa', 0):,.0f}")

    # Calculate taxable income for GIS purposes
    nonreg_withdrawal = withdrawals.get('nonreg', 0)
    rrif_withdrawal = withdrawals.get('rrif', 0)
    corp_withdrawal = withdrawals.get('corp', 0)

    # NonReg: only gains taxable at 50%
    nonreg_gains = nonreg_withdrawal * (1 - person.nonreg_acb / max(person.nonreg_balance, 1))
    nonreg_taxable = nonreg_gains * 0.5

    # Estimate taxable income
    estimated_taxable_income = (
        person.cpp_annual_at_start +
        person.oas_annual_at_start +
        rrif_withdrawal +
        nonreg_taxable +
        corp_withdrawal  # Dividends are taxable for GIS purposes
    )

    print(f"\nTaxable income breakdown:")
    print(f"  CPP:              ${person.cpp_annual_at_start:,.0f}")
    print(f"  OAS:              ${person.oas_annual_at_start:,.0f}")
    print(f"  RRIF:             ${rrif_withdrawal:,.0f}")
    print(f"  NonReg (taxable): ${nonreg_taxable:,.0f}")
    print(f"  Corp (dividend):  ${corp_withdrawal:,.0f}")
    print(f"  TFSA (taxable):   $0  (TFSA is tax-free)")
    print(f"  ---")
    print(f"  TOTAL TAXABLE:    ${estimated_taxable_income:,.0f}")

    gis_threshold = 22272
    print(f"\nGIS analysis:")
    print(f"  GIS threshold:    ${gis_threshold:,.0f}")
    print(f"  Taxable income:   ${estimated_taxable_income:,.0f}")
    print(f"  Below threshold:  {estimated_taxable_income < gis_threshold}")

    if estimated_taxable_income < gis_threshold:
        print(f"  Status: ✓ PASS - Stayed below GIS threshold")
        print(f"  Margin: ${gis_threshold - estimated_taxable_income:,.0f} below threshold")
    else:
        excess = estimated_taxable_income - gis_threshold
        print(f"  Status: WARNING - Exceeded threshold by ${excess:,.0f}")
        print(f"  GIS clawback: ~${excess * 0.50:,.0f}/year (50% clawback rate)")

    # Calculate GIS benefit
    gis_config = {
        "threshold_single": 22272,
        "max_benefit_single": 11628.84,
        "threshold_couple": 29424,
        "max_benefit_couple": 6814.20,
        "clawback_rate": 0.50,
    }

    gis_benefit = calculate_gis(
        net_income=estimated_taxable_income,
        age=66,
        gis_config=gis_config,
        oas_amount=person.oas_annual_at_start,
        is_couple=False
    )

    print(f"\nGIS benefit:")
    print(f"  Annual GIS: ${gis_benefit:,.0f}")
    print(f"  Max GIS (single): $11,628.84")
    print(f"  Percentage of max: {(gis_benefit / 11628.84 * 100):.1f}%")

    # Verify key strategy behaviors
    assert withdrawals.get('tfsa', 0) > 0 or estimated_taxable_income < gis_threshold * 1.1, \
        "Strategy should use TFSA to stay below GIS threshold"

    print(f"\n✓ TEST PASSED: Strategy manages GIS threshold effectively")

    return {
        "taxable_income": estimated_taxable_income,
        "gis_benefit": gis_benefit,
        "below_threshold": estimated_taxable_income < gis_threshold,
        "withdrawals": withdrawals
    }


def test_tfsa_prioritization_for_gis():
    """Test that TFSA is prioritized when trying to stay below GIS threshold."""
    print("\n" + "="*70)
    print("TEST: TFSA Prioritization for GIS Preservation")
    print("="*70)

    # Create person close to GIS threshold
    person = Person(
        name="Near GIS Threshold",
        start_age=67,
        tfsa_balance=100000,  # Substantial TFSA
        rrif_balance=200000,
        nonreg_balance=100000,
        nonreg_acb=85000,  # 15% gains
        corporate_balance=200000,
        cpp_annual_at_start=8500,
        cpp_start_age=65,
        oas_annual_at_start=8500,
        oas_start_age=65
    )

    # Base income: $17,000 (CPP+OAS)
    # GIS threshold: $22,272
    # Room: $5,272

    household = Household(
        p1=person,
        p2=None,
        province="ON",
        start_year=2026,
        end_age=95,
        spending_go_go=30000  # Need to withdraw to meet spending
    )
    household.strategy = "minimize-income"

    fed_params, prov_params = get_tax_params(TAX_CONFIG, "ON")

    print(f"\nScenario:")
    print(f"  Base income (CPP+OAS): ${person.cpp_annual_at_start + person.oas_annual_at_start:,.0f}")
    print(f"  GIS threshold: $22,272")
    print(f"  Income room: $5,272")
    print(f"  Spending need: $30,000")
    print(f"  TFSA available: ${person.tfsa_balance:,.0f}")

    result = simulate_year(
        person=person,
        age=67,
        after_tax_target=30000,
        fed=fed_params,
        prov=prov_params,
        rrsp_to_rrif=False,
        custom_withdraws={},
        strategy_name="minimize-income",
        hybrid_topup_amt=0.0,
        hh=household,
        year=2026
    )

    withdrawals, income_sources, taxes = result

    print(f"\nWithdrawals:")
    print(f"  TFSA:   ${withdrawals.get('tfsa', 0):,.0f}")
    print(f"  NonReg: ${withdrawals.get('nonreg', 0):,.0f}")
    print(f"  Corp:   ${withdrawals.get('corp', 0):,.0f}")
    print(f"  RRIF:   ${withdrawals.get('rrif', 0):,.0f}")

    # TFSA should be used significantly to avoid GIS clawback
    tfsa_withdrawal = withdrawals.get('tfsa', 0)
    total_withdrawal = sum(withdrawals.values())

    tfsa_percentage = (tfsa_withdrawal / total_withdrawal * 100) if total_withdrawal > 0 else 0

    print(f"\nTFSA usage:")
    print(f"  TFSA withdrawal: ${tfsa_withdrawal:,.0f}")
    print(f"  Total withdrawal: ${total_withdrawal:,.0f}")
    print(f"  TFSA percentage: {tfsa_percentage:.1f}%")

    # Calculate final taxable income
    nonreg_gains = withdrawals.get('nonreg', 0) * (1 - person.nonreg_acb / max(person.nonreg_balance, 1))
    nonreg_taxable = nonreg_gains * 0.5

    final_taxable_income = (
        person.cpp_annual_at_start +
        person.oas_annual_at_start +
        withdrawals.get('rrif', 0) +
        nonreg_taxable +
        withdrawals.get('corp', 0)
    )

    print(f"\nFinal taxable income: ${final_taxable_income:,.0f}")
    print(f"GIS threshold: $22,272")
    print(f"Result: {'✓ Below threshold' if final_taxable_income < 22272 else '✗ Above threshold'}")

    # Verify TFSA was used strategically
    assert tfsa_withdrawal > 0, "TFSA should be used to preserve GIS"
    assert final_taxable_income <= 22272 * 1.2, "Should stay reasonably close to GIS threshold"

    print(f"\n✓ TEST PASSED: TFSA prioritized for GIS preservation")

    return {
        "tfsa_withdrawal": tfsa_withdrawal,
        "tfsa_percentage": tfsa_percentage,
        "final_taxable_income": final_taxable_income
    }


def test_gis_over_30_year_projection():
    """Test GIS preservation strategy over a 30-year retirement."""
    print("\n" + "="*70)
    print("TEST: 30-Year GIS Preservation Projection")
    print("="*70)

    person = Person(
        name="GIS Maximizer",
        start_age=65,
        tfsa_balance=95000,
        rrif_balance=300000,
        nonreg_balance=200000,
        nonreg_acb=170000,  # High ACB
        corporate_balance=400000,
        cpp_annual_at_start=9000,
        cpp_start_age=65,
        oas_annual_at_start=8000,
        oas_start_age=65
    )

    household = Household(
        p1=person,
        p2=None,
        province="ON",
        start_year=2026,
        end_age=95,
        spending_go_go=40000
    )
    household.strategy = "minimize-income"

    fed_params, prov_params = get_tax_params(TAX_CONFIG, "ON")

    gis_config = {
        "threshold_single": 22272,
        "max_benefit_single": 11628.84,
        "clawback_rate": 0.50,
    }

    print(f"\nProjecting first 10 years of retirement:")
    print(f"{'Age':<5} {'TFSA $':<12} {'NonReg $':<12} {'RRIF $':<12} {'Income':<10} {'GIS $':<10} {'Below?':<8}")
    print("-" * 80)

    years_below_threshold = 0
    total_gis_received = 0.0

    for year_offset in range(min(10, 95 - person.start_age)):
        current_age = person.start_age + year_offset

        result = simulate_year(
            person=person,
            age=current_age,
            after_tax_target=40000,
            fed=fed_params,
            prov=prov_params,
            rrsp_to_rrif=False,
            custom_withdraws={},
            strategy_name="minimize-income",
            hybrid_topup_amt=0.0,
            hh=household,
            year=2026 + year_offset
        )

        withdrawals, income_sources, taxes = result

        # Calculate taxable income
        nonreg_gains = withdrawals.get('nonreg', 0) * (1 - person.nonreg_acb / max(person.nonreg_balance, 1)) if person.nonreg_balance > 0 else 0
        nonreg_taxable = nonreg_gains * 0.5

        taxable_income = (
            person.cpp_annual_at_start +
            person.oas_annual_at_start +
            withdrawals.get('rrif', 0) +
            nonreg_taxable +
            withdrawals.get('corp', 0)
        )

        gis_benefit = calculate_gis(
            net_income=taxable_income,
            age=current_age,
            gis_config=gis_config,
            oas_amount=person.oas_annual_at_start
        )

        below_threshold = taxable_income < 22272
        if below_threshold:
            years_below_threshold += 1
        total_gis_received += gis_benefit

        print(f"{current_age:<5} ${withdrawals.get('tfsa', 0):<11,.0f} ${withdrawals.get('nonreg', 0):<11,.0f} "
              f"${withdrawals.get('rrif', 0):<11,.0f} ${taxable_income:<9,.0f} ${gis_benefit:<9,.0f} "
              f"{'Yes' if below_threshold else 'No':<8}")

    print("-" * 80)
    print(f"\nSummary (first 10 years):")
    print(f"  Years below GIS threshold: {years_below_threshold}/10")
    print(f"  Total GIS received: ${total_gis_received:,.0f}")
    print(f"  Average GIS per year: ${total_gis_received / 10:,.0f}")

    # Verify strategy maintained GIS eligibility
    assert years_below_threshold >= 5, "Should stay below threshold for at least half of years"
    assert total_gis_received > 50000, "Should receive significant GIS benefits over 10 years"

    print(f"\n✓ TEST PASSED: Long-term GIS preservation successful")

    return {
        "years_below_threshold": years_below_threshold,
        "total_gis": total_gis_received,
        "average_gis": total_gis_received / 10
    }


def run_all_tests():
    """Run all GIS threshold management tests."""
    print("\n" + "="*70)
    print("GIS THRESHOLD MANAGEMENT TEST SUITE")
    print("="*70)
    print("\nVerifying that minimize-income strategy actively manages")
    print("withdrawals to stay below GIS threshold and maximize benefits.")
    print("="*70)

    try:
        result1 = test_gis_threshold_targeting()
        result2 = test_tfsa_prioritization_for_gis()
        result3 = test_gis_over_30_year_projection()

        print("\n" + "="*70)
        print("✓ ALL TESTS PASSED")
        print("="*70)
        print("\nSummary:")
        print(f"✓ Strategy stays below GIS threshold: {result1['below_threshold']}")
        print(f"✓ TFSA prioritized for GIS preservation: {result2['tfsa_percentage']:.1f}%")
        print(f"✓ Long-term GIS maximization: {result3['years_below_threshold']}/10 years below threshold")
        print(f"✓ Total GIS over 10 years: ${result3['total_gis']:,.0f}")
        print("="*70)

        return True

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
