"""
Real Estate Module for Canada Retirement & Tax Simulator.

This module handles real estate calculations for retirement simulations:
- Rental income (already added to taxable income)
- Mortgage payment deductions from cash flow
- Property appreciation over time
- Downsizing scenarios with capital gains tax

Phase 3 Implementation - January 2026
"""

from typing import Dict, Tuple
from modules.models import Person, Household
import logging

logger = logging.getLogger(__name__)


def calculate_annual_mortgage_payment(person: Person) -> float:
    """
    Calculate annual mortgage payments (12 × monthly payment).

    This represents cash flow out that reduces available spending money.
    Mortgage payments are NOT tax-deductible for principal residences in Canada.

    Args:
        person: Person with mortgage details

    Returns:
        float: Annual mortgage payment amount

    Examples:
        >>> person = Person(name="Test", start_age=65)
        >>> person.primary_residence_monthly_payment = 2000
        >>> calculate_annual_mortgage_payment(person)
        24000.0
    """
    if not person.has_primary_residence:
        return 0.0

    return person.primary_residence_monthly_payment * 12.0


def appreciate_property(person: Person, inflation_rate: float) -> None:
    """
    Appreciate property value with general inflation.

    Properties typically appreciate at the general inflation rate.
    Modifies person.primary_residence_value in place.

    Args:
        person: Person with property
        inflation_rate: Annual inflation rate (as decimal, e.g., 0.02 for 2%)

    Examples:
        >>> person = Person(name="Test", start_age=65)
        >>> person.has_primary_residence = True
        >>> person.primary_residence_value = 500000
        >>> appreciate_property(person, 0.02)  # 2% inflation
        >>> person.primary_residence_value
        510000.0
    """
    if not person.has_primary_residence:
        return

    person.primary_residence_value *= (1 + inflation_rate)


def calculate_capital_gains_on_sale(
    sale_price: float,
    purchase_price: float,
    is_principal_residence: bool
) -> Tuple[float, float]:
    """
    Calculate capital gains and tax on property sale.

    Canadian Tax Rules:
    - Principal Residence: 100% exempt from capital gains tax
    - Investment Property: 50% of gains are taxable (inclusion rate)

    Args:
        sale_price: Final sale price
        purchase_price: Original purchase price
        is_principal_residence: Whether this is principal residence (exempt)

    Returns:
        Tuple of (total_gain, taxable_gain)

    Examples:
        >>> # Principal residence - no tax
        >>> calculate_capital_gains_on_sale(600000, 400000, True)
        (200000.0, 0.0)

        >>> # Investment property - 50% inclusion
        >>> calculate_capital_gains_on_sale(600000, 400000, False)
        (200000.0, 100000.0)
    """
    total_gain = max(0, sale_price - purchase_price)

    if is_principal_residence:
        # Principal residence exemption - no taxable gains
        taxable_gain = 0.0
    else:
        # Investment property - 50% inclusion rate
        taxable_gain = total_gain * 0.50

    return total_gain, taxable_gain


def handle_downsizing(
    person: Person,
    current_year: int,
    household: Household
) -> Dict[str, float]:
    """
    Handle property sale/downsizing in the specified year.

    Process:
    1. Sell current home at current market value
    2. Pay off remaining mortgage
    3. Calculate capital gains tax (if investment property)
    4. Buy new home (if downsizing)
    5. Add net proceeds to non-registered account

    Args:
        person: Person with downsizing plan
        current_year: Current simulation year
        household: Household for inflation tracking

    Returns:
        Dict with keys:
        - "sale_proceeds": Gross sale price
        - "mortgage_payoff": Mortgage paid off
        - "capital_gains": Total capital gains
        - "taxable_gains": Taxable portion of gains
        - "new_home_cost": Cost of new home
        - "net_cash": Net cash added to investments

    Examples:
        >>> person = Person(name="Test", start_age=65)
        >>> person.plan_to_downsize = True
        >>> person.downsize_year = 2026
        >>> person.primary_residence_value = 600000
        >>> person.primary_residence_purchase_price = 400000
        >>> person.primary_residence_mortgage = 100000
        >>> person.downsize_new_home_cost = 300000
        >>> person.downsize_is_principal_residence = True
        >>> hh = Household(...)
        >>> result = handle_downsizing(person, 2026, hh)
        >>> result["net_cash"]  # 600k - 100k mortgage - 300k new home
        200000.0
    """
    result = {
        "sale_proceeds": 0.0,
        "mortgage_payoff": 0.0,
        "capital_gains": 0.0,
        "taxable_gains": 0.0,
        "new_home_cost": 0.0,
        "net_cash": 0.0,
    }

    # Check if downsizing should happen this year
    if not person.plan_to_downsize:
        return result

    if person.downsize_year is None or current_year != person.downsize_year:
        return result

    if not person.has_primary_residence:
        logger.warning(f"{person.name}: Downsizing planned but no residence found")
        return result

    # Step 1: Sell current home
    sale_proceeds = person.primary_residence_value
    result["sale_proceeds"] = sale_proceeds

    # Step 2: Pay off mortgage
    mortgage_payoff = person.primary_residence_mortgage
    result["mortgage_payoff"] = mortgage_payoff

    # Step 3: Calculate capital gains
    total_gain, taxable_gain = calculate_capital_gains_on_sale(
        sale_proceeds,
        person.primary_residence_purchase_price,
        person.downsize_is_principal_residence
    )
    result["capital_gains"] = total_gain
    result["taxable_gains"] = taxable_gain

    # Step 4: Buy new home (if downsizing, not selling outright)
    new_home_cost = person.downsize_new_home_cost
    result["new_home_cost"] = new_home_cost

    # Step 5: Calculate net cash to add to investments
    # Net cash = Sale Price - Mortgage - New Home Cost
    # (Capital gains tax will be calculated separately in tax engine)
    net_cash = sale_proceeds - mortgage_payoff - new_home_cost
    result["net_cash"] = max(0, net_cash)  # Ensure non-negative

    # Update person's property status
    if new_home_cost > 0:
        # Bought a new home - update values
        person.primary_residence_value = new_home_cost
        person.primary_residence_purchase_price = new_home_cost
        person.primary_residence_mortgage = 0.0  # Assume paid cash from proceeds
        person.primary_residence_monthly_payment = 0.0
        # Clear rental income - assume new home doesn't generate rental income
        # (User can manually add rental income if new property is also rental)
        person.rental_income_annual = 0.0
    else:
        # Sold outright - no longer have residence
        person.has_primary_residence = False
        person.primary_residence_value = 0.0
        person.primary_residence_purchase_price = 0.0
        person.primary_residence_mortgage = 0.0
        person.primary_residence_monthly_payment = 0.0
        # Clear rental income - no longer have property
        person.rental_income_annual = 0.0

    # Mark downsizing as complete (don't repeat)
    person.plan_to_downsize = False
    person.downsize_year = None

    logger.info(
        f"{person.name} downsized in {current_year}: "
        f"Sold for ${sale_proceeds:,.0f}, "
        f"Paid off ${mortgage_payoff:,.0f} mortgage, "
        f"Bought new home for ${new_home_cost:,.0f}, "
        f"Net cash: ${net_cash:,.0f}, "
        f"Taxable gains: ${taxable_gain:,.0f}, "
        f"Rental income cleared: Yes"
    )

    return result


def get_rental_income(person: Person) -> float:
    """
    Get annual rental income for tax purposes.

    This is already included in person.rental_income_annual by the frontend.
    This function exists for clarity and future expansion.

    Args:
        person: Person with rental properties

    Returns:
        float: Annual rental income
    """
    return person.rental_income_annual
