"""
CPP and OAS benefit calculations for Canada Retirement & Tax Simulator.

This module handles:
- CPP (Canada Pension Plan) calculations with inflation adjustment
- OAS (Old Age Security) calculations with inflation adjustment
- OAS clawback calculation
- Combined CPP+OAS benefit for a year

These benefits are indexed to inflation annually after the start age.
"""

from typing import Tuple, Dict


def cpp_benefit(
    cpp_annual_at_start: float,
    cpp_start_age: int,
    current_age: int,
    inflation_rate: float = 0.02,
    years_since_start: int = 0,
) -> float:
    """
    Calculate CPP benefit for a given age with inflation adjustment.

    CPP is indexed to inflation annually after the start age (typically 60-70).
    This function applies a simple inflation factor to the starting CPP amount.

    Args:
        cpp_annual_at_start (float): Initial annual CPP amount at cpp_start_age
        cpp_start_age (int): Age when CPP starts (typically 60-70)
        current_age (int): Current age
        inflation_rate (float): Annual inflation rate (default 2%)
        years_since_start (int): Years since start of simulation (for inflation)

    Returns:
        float: Annual CPP benefit at current age, inflation-adjusted

    Examples:
        >>> cpp_benefit(15000, 65, 65, 0.02, 0)
        15000.0

        >>> cpp_benefit(15000, 65, 66, 0.02, 1)  # 1 year inflation
        15300.0

        >>> cpp_benefit(15000, 70, 60, 0.02, 0)  # Too young
        0.0

    Notes:
        - Returns 0 if current_age < cpp_start_age
        - Uses simple compounding: amount * (1 + rate) ** years
    """
    if current_age < cpp_start_age:
        return 0.0

    years_since = max(0, current_age - cpp_start_age)
    inflation_factor = (1.0 + inflation_rate) ** years_since
    return cpp_annual_at_start * inflation_factor


def oas_benefit(
    oas_annual_at_start: float,
    oas_start_age: int,
    current_age: int,
    inflation_rate: float = 0.02,
    years_since_start: int = 0,
) -> float:
    """
    Calculate OAS benefit for a given age with inflation adjustment.

    OAS is indexed to inflation quarterly (simplified to annual here).
    This function applies a simple inflation factor to the starting OAS amount.

    Args:
        oas_annual_at_start (float): Initial annual OAS amount at oas_start_age
        oas_start_age (int): Age when OAS starts (typically 65)
        current_age (int): Current age
        inflation_rate (float): Annual inflation rate (default 2%)
        years_since_start (int): Years since start of simulation (for inflation)

    Returns:
        float: Annual OAS benefit at current age, inflation-adjusted (before clawback)

    Examples:
        >>> oas_benefit(7000, 65, 65, 0.02, 0)
        7000.0

        >>> oas_benefit(7000, 65, 66, 0.02, 1)  # 1 year inflation
        7140.0

        >>> oas_benefit(7000, 65, 64, 0.02, 0)  # Too young
        0.0

    Notes:
        - Returns 0 if current_age < oas_start_age
        - In Canada, OAS is actually indexed quarterly; simplified to annual here
        - Use oas_clawback() to calculate clawback amount
    """
    if current_age < oas_start_age:
        return 0.0

    years_since = max(0, current_age - oas_start_age)
    inflation_factor = (1.0 + inflation_rate) ** years_since
    return oas_annual_at_start * inflation_factor


def oas_clawback(
    oas_before_clawback: float,
    net_taxable_income: float,
    clawback_threshold: float = 90997.0,
    clawback_rate: float = 0.15,
) -> float:
    """
    Calculate OAS clawback based on net taxable income.

    In Canada, OAS is subject to a clawback (reduction) if net taxable income
    exceeds a threshold. The clawback is 15% of income above the threshold,
    up to a maximum of 100% of the OAS amount.

    Args:
        oas_before_clawback (float): Annual OAS amount before clawback
        net_taxable_income (float): Net taxable income for the year
        clawback_threshold (float): Income threshold for clawback (default 2025 threshold)
        clawback_rate (float): Clawback percentage (default 15%)

    Returns:
        float: Clawback amount (positive value to subtract from OAS)

    Examples:
        >>> oas_clawback(7000, 80000)  # Income below threshold
        0.0

        >>> oas_clawback(7000, 100000)  # (100000-90997)*0.15
        1350.45

        >>> oas_clawback(7000, 150000)  # Clawed back up to OAS amount
        7000.0

    Notes:
        - Clawback cannot exceed the OAS amount (so OAS doesn't go negative)
        - 2025 threshold is approximately $90,997
        - Threshold is indexed annually for inflation
    """
    if net_taxable_income <= clawback_threshold:
        return 0.0

    income_over = net_taxable_income - clawback_threshold
    clawback_amount = income_over * clawback_rate

    # Clawback cannot exceed the OAS amount
    return min(clawback_amount, oas_before_clawback)


def oas_after_clawback(
    oas_before_clawback: float,
    net_taxable_income: float,
    clawback_threshold: float = 90997.0,
    clawback_rate: float = 0.15,
) -> float:
    """
    Calculate OAS benefit after clawback.

    This is a convenience function that combines oas_clawback() calculation
    with subtraction from OAS.

    Args:
        oas_before_clawback (float): Annual OAS amount before clawback
        net_taxable_income (float): Net taxable income for the year
        clawback_threshold (float): Income threshold for clawback
        clawback_rate (float): Clawback percentage

    Returns:
        float: OAS amount after clawback (guaranteed non-negative)

    Examples:
        >>> oas_after_clawback(7000, 80000)  # Income below threshold
        7000.0

        >>> oas_after_clawback(7000, 100000)  # (100000-90997)*0.15 = 1350.45
        5649.55

        >>> oas_after_clawback(7000, 150000)  # Fully clawed back
        0.0

    Notes:
        - Result is always >= 0 (clawback cannot exceed OAS)
        - For net clawback calculation, check oas_clawback()
    """
    clawback_amount = oas_clawback(
        oas_before_clawback, net_taxable_income, clawback_threshold, clawback_rate
    )
    return max(0.0, oas_before_clawback - clawback_amount)


def combined_benefits(
    cpp_annual_at_start: float,
    cpp_start_age: int,
    oas_annual_at_start: float,
    oas_start_age: int,
    current_age: int,
    net_taxable_income: float,
    inflation_rate: float = 0.02,
    oas_clawback_threshold: float = 90997.0,
    oas_clawback_rate: float = 0.15,
) -> Dict[str, float]:
    """
    Calculate combined CPP and OAS benefits for a year.

    This function calculates both CPP and OAS, applies OAS clawback, and returns
    a comprehensive breakdown of benefits for the year.

    Args:
        cpp_annual_at_start (float): Initial annual CPP amount
        cpp_start_age (int): Age when CPP starts
        oas_annual_at_start (float): Initial annual OAS amount
        oas_start_age (int): Age when OAS starts
        current_age (int): Current age
        net_taxable_income (float): Net taxable income (for OAS clawback)
        inflation_rate (float): Annual inflation rate
        oas_clawback_threshold (float): OAS clawback threshold
        oas_clawback_rate (float): OAS clawback rate

    Returns:
        Dict[str, float]: Dictionary with keys:
            - "cpp": CPP benefit amount
            - "oas_gross": OAS before clawback
            - "oas_clawback": OAS clawback amount
            - "oas_net": OAS after clawback
            - "total": Combined CPP + OAS (after clawback)

    Examples:
        >>> result = combined_benefits(15000, 65, 7000, 65, 65, 80000)
        >>> result["cpp"]
        15000.0
        >>> result["oas_net"]
        7000.0
        >>> result["total"]
        22000.0

        >>> result = combined_benefits(15000, 65, 7000, 65, 70, 120000)
        >>> result["oas_net"] < 7000  # Clawback applied
        True

    Notes:
        - OAS clawback is applied based on net taxable income
        - CPP is not subject to clawback
        - Use this for complete benefit information for a year
    """
    cpp = cpp_benefit(cpp_annual_at_start, cpp_start_age, current_age, inflation_rate)
    oas_gross = oas_benefit(oas_annual_at_start, oas_start_age, current_age, inflation_rate)
    oas_clawback_amt = oas_clawback(
        oas_gross, net_taxable_income, oas_clawback_threshold, oas_clawback_rate
    )
    oas_net = oas_gross - oas_clawback_amt

    return {
        "cpp": cpp,
        "oas_gross": oas_gross,
        "oas_clawback": oas_clawback_amt,
        "oas_net": max(0.0, oas_net),
        "total": cpp + max(0.0, oas_net),
    }


def get_benefit_start_age_defaults() -> Dict[str, int]:
    """
    Get default start ages for CPP and OAS.

    In Canada, individuals can claim CPP between ages 60-70 and OAS at age 65
    (or earlier/later with adjustments). This returns the defaults.

    Returns:
        Dict[str, int]: Dictionary with keys:
            - "cpp": Default CPP start age (70)
            - "oas": Default OAS start age (65)

    Examples:
        >>> defaults = get_benefit_start_age_defaults()
        >>> defaults["cpp"]
        70
        >>> defaults["oas"]
        65

    Notes:
        - Default CPP age of 70 is the maximum; individuals can start at 60
        - Default OAS age of 65 is the standard; can start at 65+
        - Users can customize these in the Person model
    """
    return {
        "cpp": 70,
        "oas": 65,
    }
