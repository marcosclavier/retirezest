"""
GIC (Guaranteed Investment Certificate) maturity calculator for RetireZest.

This module handles GIC maturity calculations and processing for retirement simulations.
GICs are fixed-term investments popular with Canadian retirees (40-50% usage).

Core Functions:
- calculate_gic_maturity_value() - Calculate maturity value with compound interest
- process_gic_maturity_events() - Handle GIC maturities in simulation year
- apply_reinvestment_strategy() - Execute reinvestment decisions at maturity
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import math


def calculate_gic_maturity_value(
    principal: float,
    annual_rate: float,
    term_years: float,
    compounding_frequency: str = "annual"
) -> float:
    """
    Calculate GIC maturity value using compound interest formula.

    Formula: FV = P × (1 + r/n)^(n × t)

    Where:
    - P = Principal (initial investment)
    - r = Annual interest rate (as decimal, e.g., 0.045 for 4.5%)
    - n = Compounding periods per year
    - t = Term length in years

    Args:
        principal (float): Initial GIC investment amount ($)
        annual_rate (float): Annual interest rate (as percentage, e.g., 4.5 for 4.5%)
        term_years (float): Term length in years
        compounding_frequency (str): How interest compounds
            - "annual": Once per year (n=1)
            - "semi-annual": Twice per year (n=2)
            - "monthly": 12 times per year (n=12)
            - "at-maturity": Simple interest (n=1, no compounding)

    Returns:
        float: Future value at maturity (principal + interest)

    Examples:
        >>> calculate_gic_maturity_value(50000, 4.5, 5, "annual")
        62309.09  # $50,000 GIC at 4.5% for 5 years, annual compounding

        >>> calculate_gic_maturity_value(20000, 3.8, 2, "semi-annual")
        21559.70  # $20,000 GIC at 3.8% for 2 years, semi-annual compounding

        >>> calculate_gic_maturity_value(30000, 4.0, 3, "at-maturity")
        33600.00  # $30,000 GIC at 4.0% for 3 years, simple interest
    """
    if principal <= 0:
        return 0.0

    if term_years <= 0:
        return principal

    # Convert percentage to decimal (4.5% → 0.045)
    rate_decimal = annual_rate / 100.0

    # Compounding periods per year
    compounding_periods = {
        "annual": 1,
        "semi-annual": 2,
        "monthly": 12,
        "at-maturity": 1  # Special case: simple interest
    }

    n = compounding_periods.get(compounding_frequency, 1)

    if compounding_frequency == "at-maturity":
        # Simple interest: FV = P × (1 + r × t)
        future_value = principal * (1 + rate_decimal * term_years)
    else:
        # Compound interest: FV = P × (1 + r/n)^(n × t)
        future_value = principal * math.pow(1 + rate_decimal / n, n * term_years)

    return round(future_value, 2)


def calculate_gic_interest(
    principal: float,
    annual_rate: float,
    term_years: float,
    compounding_frequency: str = "annual"
) -> float:
    """
    Calculate total interest earned on GIC at maturity.

    Args:
        principal (float): Initial GIC investment amount ($)
        annual_rate (float): Annual interest rate (as percentage)
        term_years (float): Term length in years
        compounding_frequency (str): How interest compounds

    Returns:
        float: Total interest earned ($)

    Examples:
        >>> calculate_gic_interest(50000, 4.5, 5, "annual")
        12309.09  # Interest on $50,000 at 4.5% for 5 years
    """
    maturity_value = calculate_gic_maturity_value(
        principal, annual_rate, term_years, compounding_frequency
    )
    return round(maturity_value - principal, 2)


def process_gic_maturity_events(
    gic_assets: List[Dict[str, Any]],
    current_year: int,
    simulation_age: int
) -> Dict[str, Any]:
    """
    Process GIC assets and identify maturity events for current simulation year.

    This function:
    1. Checks which GICs mature in the current year
    2. Calculates maturity values (principal + interest)
    3. Prepares reinvestment instructions
    4. Returns summary of maturity events

    Args:
        gic_assets (List[Dict]): List of GIC assets from database
            Each GIC must have:
            - name (str): GIC name
            - balance (float): Principal amount
            - gicMaturityDate (str/datetime): When GIC matures
            - gicInterestRate (float): Annual interest rate (%)
            - gicTermMonths (int): Original term in months
            - gicCompoundingFrequency (str): Compounding frequency
            - gicReinvestStrategy (str): What to do at maturity
            - owner (str): "person1" or "person2"

        current_year (int): Calendar year of simulation (e.g., 2029)
        simulation_age (int): Current age in simulation

    Returns:
        Dict with keys:
        - matured_gics (List[Dict]): GICs that matured this year
        - total_matured_value (float): Total cash available from maturities
        - reinvestment_instructions (List[Dict]): How to handle matured funds
        - locked_gics (List[Dict]): GICs that haven't matured yet

    Example:
        >>> gics = [{
        ...     "name": "TD 5-Year GIC",
        ...     "balance": 50000,
        ...     "gicMaturityDate": "2029-01-15",
        ...     "gicInterestRate": 4.5,
        ...     "gicTermMonths": 60,
        ...     "gicCompoundingFrequency": "annual",
        ...     "gicReinvestStrategy": "auto-renew",
        ...     "owner": "person1"
        ... }]
        >>> result = process_gic_maturity_events(gics, 2029, 67)
        >>> result["matured_gics"][0]["total"]
        62309.09
    """
    result = {
        "matured_gics": [],
        "total_matured_value": 0.0,
        "reinvestment_instructions": [],
        "locked_gics": []
    }

    for gic in gic_assets:
        # Parse maturity date
        maturity_date_str = gic.get("gicMaturityDate")
        if not maturity_date_str:
            # No maturity date set - treat as regular investment
            result["locked_gics"].append(gic)
            continue

        # Convert to datetime if string
        if isinstance(maturity_date_str, str):
            try:
                maturity_date = datetime.fromisoformat(maturity_date_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                # Invalid date format - skip this GIC
                result["locked_gics"].append(gic)
                continue
        else:
            maturity_date = maturity_date_str

        maturity_year = maturity_date.year

        # Check if GIC matures this year
        if maturity_year == current_year:
            # GIC matures this year!
            principal = gic.get("balance", 0.0)
            interest_rate = gic.get("gicInterestRate", 0.0)
            term_months = gic.get("gicTermMonths", 12)
            term_years = term_months / 12.0
            compounding = gic.get("gicCompoundingFrequency", "annual")

            # Calculate maturity value
            matured_value = calculate_gic_maturity_value(
                principal=principal,
                annual_rate=interest_rate,
                term_years=term_years,
                compounding_frequency=compounding
            )

            interest_earned = matured_value - principal

            # Record maturity event
            maturity_event = {
                "name": gic.get("name", "GIC"),
                "issuer": gic.get("gicIssuer", "Unknown"),
                "principal": principal,
                "interest": interest_earned,
                "total": matured_value,
                "rate": interest_rate,
                "term_years": term_years,
                "owner": gic.get("owner", "person1"),
                "reinvest_strategy": gic.get("gicReinvestStrategy", "cash-out")
            }

            result["matured_gics"].append(maturity_event)
            result["total_matured_value"] += matured_value

            # Create reinvestment instruction
            reinvest_instruction = apply_reinvestment_strategy(
                maturity_event=maturity_event,
                current_year=current_year,
                simulation_age=simulation_age
            )

            result["reinvestment_instructions"].append(reinvest_instruction)

        else:
            # GIC hasn't matured yet - principal locked
            result["locked_gics"].append(gic)

    return result


def apply_reinvestment_strategy(
    maturity_event: Dict[str, Any],
    current_year: int,
    simulation_age: int
) -> Dict[str, Any]:
    """
    Apply reinvestment strategy to matured GIC funds.

    Strategies:
    - "auto-renew": Create new GIC with same term at current market rates
    - "cash-out": Add to liquid assets (for spending)
    - "transfer-to-tfsa": Move funds to TFSA (if room available)
    - "transfer-to-nonreg": Move funds to non-registered account

    Args:
        maturity_event (Dict): Matured GIC details
        current_year (int): Calendar year
        simulation_age (int): Current age

    Returns:
        Dict with reinvestment instructions:
        - action (str): What to do with funds
        - amount (float): Total funds to reinvest
        - destination (str): Where to put the money
        - owner (str): person1 or person2
        - new_gic (Dict): New GIC details if auto-renew

    Example:
        >>> event = {
        ...     "name": "TD 5-Year GIC",
        ...     "total": 62309.09,
        ...     "reinvest_strategy": "auto-renew",
        ...     "term_years": 5,
        ...     "rate": 4.5,
        ...     "owner": "person1"
        ... }
        >>> instruction = apply_reinvestment_strategy(event, 2029, 67)
        >>> instruction["action"]
        "auto-renew"
    """
    strategy = maturity_event.get("reinvest_strategy", "cash-out")
    total_funds = maturity_event.get("total", 0.0)
    owner = maturity_event.get("owner", "person1")

    instruction = {
        "action": strategy,
        "amount": total_funds,
        "owner": owner,
        "matured_gic_name": maturity_event.get("name", "GIC")
    }

    if strategy == "auto-renew":
        # Create new GIC with same term
        # Note: In future, integrate with live GIC rate API
        # For now, use same rate (conservative assumption)
        new_maturity_year = current_year + int(maturity_event.get("term_years", 5))

        instruction["destination"] = "new-gic"
        instruction["new_gic"] = {
            "name": f"{maturity_event.get('name', 'GIC')} (Renewed {current_year})",
            "balance": total_funds,
            "gicInterestRate": maturity_event.get("rate", 3.5),  # TODO: Use current market rate
            "gicTermMonths": int(maturity_event.get("term_years", 5) * 12),
            "gicMaturityDate": f"{new_maturity_year}-01-01",
            "gicCompoundingFrequency": "annual",
            "gicReinvestStrategy": "auto-renew",
            "owner": owner
        }

    elif strategy == "cash-out":
        # Add to liquid assets (will be used for expenses)
        instruction["destination"] = "liquid-assets"

    elif strategy == "transfer-to-tfsa":
        # Move to TFSA (if room available)
        instruction["destination"] = "tfsa"

    elif strategy == "transfer-to-nonreg":
        # Move to non-registered account
        instruction["destination"] = "nonreg"

    return instruction


def get_gic_balance_locked(gic_assets: List[Dict[str, Any]], current_year: int) -> float:
    """
    Get total GIC balance that is still locked (not yet matured).

    This is important for withdrawal strategies - locked GIC funds
    cannot be accessed until maturity.

    Args:
        gic_assets (List[Dict]): List of GIC assets
        current_year (int): Current simulation year

    Returns:
        float: Total locked GIC principal ($)

    Example:
        >>> gics = [
        ...     {"balance": 50000, "gicMaturityDate": "2029-01-01"},
        ...     {"balance": 20000, "gicMaturityDate": "2026-01-01"}  # Already matured
        ... ]
        >>> get_gic_balance_locked(gics, 2027)
        50000.0  # Only the 2029 GIC is still locked
    """
    locked_balance = 0.0

    for gic in gic_assets:
        maturity_date_str = gic.get("gicMaturityDate")
        if not maturity_date_str:
            continue

        # Parse maturity date
        if isinstance(maturity_date_str, str):
            try:
                maturity_date = datetime.fromisoformat(maturity_date_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                continue
        else:
            maturity_date = maturity_date_str

        maturity_year = maturity_date.year

        # If maturity year is in the future, balance is locked
        if maturity_year > current_year:
            locked_balance += gic.get("balance", 0.0)

    return locked_balance


# Test functions (for development/debugging)
if __name__ == "__main__":
    # Test 1: 5-year GIC with annual compounding
    print("Test 1: 5-year GIC at 4.5% annual compounding")
    maturity_value = calculate_gic_maturity_value(50000, 4.5, 5, "annual")
    interest = calculate_gic_interest(50000, 4.5, 5, "annual")
    print(f"  Principal: $50,000")
    print(f"  Rate: 4.5%")
    print(f"  Term: 5 years")
    print(f"  Maturity Value: ${maturity_value:,.2f}")
    print(f"  Interest Earned: ${interest:,.2f}")
    print()

    # Test 2: GIC maturity event processing
    print("Test 2: GIC maturity event")
    gics = [{
        "name": "TD 5-Year GIC",
        "balance": 50000,
        "gicMaturityDate": "2029-01-15T00:00:00Z",
        "gicInterestRate": 4.5,
        "gicTermMonths": 60,
        "gicCompoundingFrequency": "annual",
        "gicReinvestStrategy": "auto-renew",
        "gicIssuer": "TD Bank",
        "owner": "person1"
    }]

    result = process_gic_maturity_events(gics, 2029, 67)
    print(f"  Matured GICs: {len(result['matured_gics'])}")
    if result["matured_gics"]:
        event = result["matured_gics"][0]
        print(f"  Name: {event['name']}")
        print(f"  Principal: ${event['principal']:,.2f}")
        print(f"  Interest: ${event['interest']:,.2f}")
        print(f"  Total: ${event['total']:,.2f}")
        print(f"  Reinvest: {event['reinvest_strategy']}")
    print()

    # Test 3: Locked GIC balance
    print("Test 3: Locked GIC balance")
    gics_mixed = [
        {"balance": 50000, "gicMaturityDate": "2030-01-01T00:00:00Z"},
        {"balance": 20000, "gicMaturityDate": "2026-01-01T00:00:00Z"}  # Already matured
    ]
    locked = get_gic_balance_locked(gics_mixed, 2027)
    print(f"  Total locked in 2027: ${locked:,.2f}")
    print(f"  Expected: $50,000.00 (only 2030 GIC is locked)")
