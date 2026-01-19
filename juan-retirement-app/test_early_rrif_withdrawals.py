"""
Unit tests for Early RRIF Withdrawal feature.

Tests the calculate_early_rrif_withdrawal function and validate_early_rrif_settings function
with various scenarios including fixed amount mode, percentage mode, age ranges, and validation.
"""

import pytest
from modules.models import Person
from modules.simulation import calculate_early_rrif_withdrawal, validate_early_rrif_settings


def test_early_rrif_disabled():
    """Test that no withdrawal occurs when feature is disabled."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = False
    person.rrsp_balance = 500000

    assert calculate_early_rrif_withdrawal(person, 67) == 0.0


def test_early_rrif_fixed_amount():
    """Test fixed amount withdrawal mode."""
    person = Person(name="Test", start_age=65)
    person.rrsp_balance = 500000
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 25000
    person.early_rrif_withdrawal_mode = "fixed"

    # Within age range
    assert calculate_early_rrif_withdrawal(person, 67) == 25000.0

    # At start age
    assert calculate_early_rrif_withdrawal(person, 65) == 25000.0

    # At end age
    assert calculate_early_rrif_withdrawal(person, 70) == 25000.0

    # Outside age range (before)
    assert calculate_early_rrif_withdrawal(person, 64) == 0.0

    # Outside age range (after)
    assert calculate_early_rrif_withdrawal(person, 71) == 0.0


def test_early_rrif_percentage():
    """Test percentage withdrawal mode."""
    person = Person(name="Test", start_age=60)
    person.rrif_balance = 750000
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 60
    person.early_rrif_withdrawal_end_age = 69
    person.early_rrif_withdrawal_percentage = 5.0
    person.early_rrif_withdrawal_mode = "percentage"

    # 5% of 750,000 = 37,500
    assert calculate_early_rrif_withdrawal(person, 62) == 37500.0


def test_early_rrif_respects_balance():
    """Test that withdrawal doesn't exceed balance."""
    person = Person(name="Test", start_age=65)
    person.rrsp_balance = 10000  # Only $10k left
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 25000  # Wants $25k
    person.early_rrif_withdrawal_mode = "fixed"

    # Should only withdraw what's available
    assert calculate_early_rrif_withdrawal(person, 67) == 10000.0


def test_early_rrif_no_balance():
    """Test that no withdrawal occurs when balance is zero."""
    person = Person(name="Test", start_age=65)
    person.rrsp_balance = 0
    person.rrif_balance = 0
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 25000
    person.early_rrif_withdrawal_mode = "fixed"

    assert calculate_early_rrif_withdrawal(person, 67) == 0.0


def test_early_rrif_combines_rrsp_and_rrif():
    """Test that withdrawal considers both RRSP and RRIF balances."""
    person = Person(name="Test", start_age=65)
    person.rrsp_balance = 300000
    person.rrif_balance = 200000
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_percentage = 10.0
    person.early_rrif_withdrawal_mode = "percentage"

    # 10% of (300,000 + 200,000) = 50,000
    assert calculate_early_rrif_withdrawal(person, 67) == 50000.0


def test_early_rrif_percentage_mode_variations():
    """Test various percentage values."""
    person = Person(name="Test", start_age=60)
    person.rrsp_balance = 1000000
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 60
    person.early_rrif_withdrawal_end_age = 69
    person.early_rrif_withdrawal_mode = "percentage"

    # Test 3%
    person.early_rrif_withdrawal_percentage = 3.0
    assert calculate_early_rrif_withdrawal(person, 62) == 30000.0

    # Test 7.5%
    person.early_rrif_withdrawal_percentage = 7.5
    assert calculate_early_rrif_withdrawal(person, 62) == 75000.0

    # Test 10%
    person.early_rrif_withdrawal_percentage = 10.0
    assert calculate_early_rrif_withdrawal(person, 62) == 100000.0


def test_validation_disabled_feature():
    """Test validation when feature is disabled (should pass)."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = False

    errors = validate_early_rrif_settings(person)
    assert len(errors) == 0


def test_validation_valid_settings():
    """Test validation with valid settings."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 25000
    person.early_rrif_withdrawal_mode = "fixed"

    errors = validate_early_rrif_settings(person)
    assert len(errors) == 0


def test_validation_end_age_too_high():
    """Test validation when end age is >= 71."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 71  # Invalid
    person.early_rrif_withdrawal_mode = "fixed"

    errors = validate_early_rrif_settings(person)
    assert len(errors) > 0
    assert any("less than 71" in error for error in errors)


def test_validation_start_after_end():
    """Test validation when start age is after end age."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 70
    person.early_rrif_withdrawal_end_age = 65  # Invalid
    person.early_rrif_withdrawal_mode = "fixed"

    errors = validate_early_rrif_settings(person)
    assert len(errors) > 0
    assert any("before end age" in error for error in errors)


def test_validation_invalid_mode():
    """Test validation with invalid mode."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_mode = "invalid"  # Invalid

    errors = validate_early_rrif_settings(person)
    assert len(errors) > 0
    assert any("Invalid" in error for error in errors)


def test_validation_percentage_out_of_range():
    """Test validation when percentage is out of range."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_mode = "percentage"
    person.early_rrif_withdrawal_percentage = 150  # Invalid

    errors = validate_early_rrif_settings(person)
    assert len(errors) > 0
    assert any("between 0 and 100" in error for error in errors)


def test_validation_negative_amount():
    """Test validation when amount is negative."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_mode = "fixed"
    person.early_rrif_withdrawal_annual = -5000  # Invalid

    errors = validate_early_rrif_settings(person)
    assert len(errors) > 0
    assert any("must be positive" in error for error in errors)


def test_income_splitting_scenario():
    """Test realistic income splitting scenario for couples."""
    # High income spouse - no early withdrawals
    high_income = Person(name="High Income Spouse", start_age=65)
    high_income.rrsp_balance = 300000
    high_income.employer_pension_annual = 40000
    high_income.enable_early_rrif_withdrawal = False

    # Low income spouse - enable early withdrawals
    low_income = Person(name="Low Income Spouse", start_age=63)
    low_income.rrsp_balance = 400000
    low_income.employer_pension_annual = 0
    low_income.enable_early_rrif_withdrawal = True
    low_income.early_rrif_withdrawal_start_age = 63
    low_income.early_rrif_withdrawal_end_age = 70
    low_income.early_rrif_withdrawal_annual = 30000
    low_income.early_rrif_withdrawal_mode = "fixed"

    # High income spouse should have no early withdrawals
    assert calculate_early_rrif_withdrawal(high_income, 67) == 0.0

    # Low income spouse should withdraw $30k/year
    assert calculate_early_rrif_withdrawal(low_income, 67) == 30000.0

    # After age 70, low income spouse stops early withdrawals
    assert calculate_early_rrif_withdrawal(low_income, 71) == 0.0


def test_oas_clawback_avoidance_scenario():
    """Test OAS clawback avoidance strategy."""
    person = Person(name="Test", start_age=60)
    person.rrsp_balance = 1000000  # Large RRSP
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 60
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 50000
    person.early_rrif_withdrawal_mode = "fixed"

    # Should withdraw $50k/year from age 60-70
    for age in range(60, 71):
        assert calculate_early_rrif_withdrawal(person, age) == 50000.0

    # At 71+, early withdrawals stop (mandatory minimums take over)
    assert calculate_early_rrif_withdrawal(person, 71) == 0.0


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
