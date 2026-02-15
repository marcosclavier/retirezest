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


def gis_benefit(
    current_age: int,
    net_income_excluding_oas: float,
    is_single: bool = False,
    inflation_rate: float = 0.02,
    years_since_start: int = 0,
    gis_max_single: float = 13265.16,  # 2026: $1,105.43/month * 12
    gis_max_couple: float = 7956.00,   # 2026: $663/month * 12 (per person)
    gis_threshold_single: float = 21768.0,  # 2026 threshold
    gis_threshold_couple: float = 28752.0,  # 2026 combined threshold for couple
) -> float:
    """
    Calculate GIS (Guaranteed Income Supplement) benefit.

    GIS is an income-tested benefit for low-income seniors in Canada.
    It's available to OAS recipients who have little or no other income.

    IMPORTANT: Updated with 2026 thresholds and proper clawback calculation.
    GIS is reduced by $0.50 for every $1 of income (excluding OAS).

    Args:
        current_age (int): Current age of the person
        net_income_excluding_oas (float): Net income excluding OAS payments
        is_single (bool): True if single, False if couple (both receiving OAS)
        inflation_rate (float): Annual inflation rate (default 2%)
        years_since_start (int): Years since start of simulation (for inflation)
        gis_max_single (float): Maximum annual GIS for single person (2026: $13,265.16)
        gis_max_couple (float): Maximum annual GIS per person for couple (2026: $7,956)
        gis_threshold_single (float): Income threshold for zero GIS (2026: $21,768)
        gis_threshold_couple (float): Combined income threshold for zero GIS (2026: $28,752)

    Returns:
        float: Annual GIS benefit amount (after income clawback)

    Examples:
        >>> gis_benefit(65, 0, is_single=True)  # No income, full GIS
        13265.16

        >>> gis_benefit(65, 21768, is_single=True)  # At threshold, no GIS
        0.0

        >>> gis_benefit(65, 10000, is_single=True)  # Partial GIS
        8265.16

        >>> gis_benefit(64, 0, is_single=True)  # Under 65, no GIS
        0.0

    Notes:
        - GIS starts at age 65 (same as OAS)
        - Income excludes OAS but includes CPP, RRIF withdrawals, employment, etc.
        - Clawback is exactly 50% of income (50 cents per dollar)
        - Maximum GIS occurs at $0 income, zero GIS at threshold
        - Amounts are indexed to inflation quarterly (simplified to annual here)
    """
    # GIS starts at 65 (same as OAS)
    if current_age < 65:
        return 0.0

    # Apply inflation adjustment to thresholds and maximums
    inflation_factor = (1.0 + inflation_rate) ** years_since_start

    if is_single:
        gis_max = gis_max_single * inflation_factor
        threshold = gis_threshold_single * inflation_factor
    else:
        # For couples, use per-person amounts
        gis_max = gis_max_couple * inflation_factor
        # For couple, threshold is for combined income, but we need per-person test
        threshold = gis_threshold_couple * inflation_factor / 2.0  # Per person share

    # CRITICAL FIX: Check if income exceeds threshold FIRST
    # If income is at or above threshold, NO GIS is paid
    if net_income_excluding_oas >= threshold:
        return 0.0

    # Calculate GIS with proper 50% clawback rate
    # GIS = Maximum - (Income * 0.50)
    if net_income_excluding_oas <= 0:
        return gis_max

    # Apply 50% clawback for every dollar of income
    clawback_amount = net_income_excluding_oas * 0.50
    gis_amount = gis_max - clawback_amount

    # Ensure GIS doesn't go negative
    return max(0.0, gis_amount)


def combined_benefits_with_gis(
    cpp_annual_at_start: float,
    cpp_start_age: int,
    oas_annual_at_start: float,
    oas_start_age: int,
    current_age: int,
    net_taxable_income: float,
    is_single: bool = False,
    inflation_rate: float = 0.02,
    years_since_start: int = 0,
    oas_clawback_threshold: float = 90997.0,
    oas_clawback_rate: float = 0.15,
) -> Dict[str, float]:
    """
    Calculate combined CPP, OAS, and GIS benefits for a year.

    This function calculates all government benefits including GIS,
    applies OAS clawback, and returns a comprehensive breakdown.

    Args:
        cpp_annual_at_start (float): Initial annual CPP amount
        cpp_start_age (int): Age when CPP starts
        oas_annual_at_start (float): Initial annual OAS amount
        oas_start_age (int): Age when OAS starts
        current_age (int): Current age
        net_taxable_income (float): Net taxable income (for OAS clawback)
        is_single (bool): True if single, False if couple
        inflation_rate (float): Annual inflation rate
        years_since_start (int): Years since simulation start
        oas_clawback_threshold (float): OAS clawback threshold
        oas_clawback_rate (float): OAS clawback rate

    Returns:
        Dict[str, float]: Dictionary with keys:
            - "cpp": CPP benefit amount
            - "oas_gross": OAS before clawback
            - "oas_clawback": OAS clawback amount
            - "oas_net": OAS after clawback
            - "gis": GIS benefit amount
            - "total": Combined CPP + OAS (after clawback) + GIS

    Examples:
        >>> result = combined_benefits_with_gis(15000, 65, 7000, 65, 65, 20000, is_single=True)
        >>> result["gis"] > 0  # Low income qualifies for GIS
        True

        >>> result = combined_benefits_with_gis(15000, 65, 7000, 65, 65, 100000, is_single=False)
        >>> result["gis"]  # High income, no GIS
        0.0
    """
    # Get base benefits
    cpp = cpp_benefit(cpp_annual_at_start, cpp_start_age, current_age, inflation_rate)
    oas_gross = oas_benefit(oas_annual_at_start, oas_start_age, current_age, inflation_rate)

    # Apply OAS clawback threshold with inflation
    threshold_inflated = oas_clawback_threshold * ((1.0 + inflation_rate) ** years_since_start)
    oas_clawback_amt = oas_clawback(
        oas_gross, net_taxable_income, threshold_inflated, oas_clawback_rate
    )
    oas_net = max(0.0, oas_gross - oas_clawback_amt)

    # Calculate GIS based on income excluding OAS
    # GIS income test excludes OAS but includes CPP, RRIF, etc.
    income_for_gis = net_taxable_income - oas_gross  # Remove OAS from income test
    gis = gis_benefit(
        current_age=current_age,
        net_income_excluding_oas=income_for_gis,
        is_single=is_single,
        inflation_rate=inflation_rate,
        years_since_start=years_since_start,
    )

    return {
        "cpp": cpp,
        "oas_gross": oas_gross,
        "oas_clawback": oas_clawback_amt,
        "oas_net": oas_net,
        "gis": gis,
        "total": cpp + oas_net + gis,
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
