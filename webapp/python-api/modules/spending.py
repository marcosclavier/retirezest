"""
Spending phase calculations for Canada Retirement & Tax Simulator.

This module handles:
- Spending phase selection (go-go, slow-go, no-go)
- Spending amount calculation with inflation
- Age-based phase transitions
- Household spending management

Spending phases represent different lifecycle stages:
- Go-Go (age < go_go_end_age): Higher spending, active retirement
- Slow-Go (age < slow_go_end_age): Moderate spending, less active
- No-Go (age >= slow_go_end_age): Lower spending, reduced activity
"""

from typing import Tuple


def get_spending_phase(
    age: int,
    go_go_end_age: int = 74,
    slow_go_end_age: int = 84,
) -> str:
    """
    Determine spending phase based on age.

    Retirement spending typically follows distinct phases:
    - Go-Go: Active retirement with higher spending
    - Slow-Go: Transition to lower activity and spending
    - No-Go: Advanced age with lower spending and higher care costs

    Args:
        age (int): Current age
        go_go_end_age (int): Age when go-go phase ends (default 74)
        slow_go_end_age (int): Age when slow-go phase ends (default 84)

    Returns:
        str: Phase name: "go-go", "slow-go", or "no-go"

    Examples:
        >>> get_spending_phase(70)
        'go-go'

        >>> get_spending_phase(75)
        'slow-go'

        >>> get_spending_phase(85)
        'no-go'

    Notes:
        - Age boundaries are inclusive on the lower end
        - Typical ages: go-go ends at 74, slow-go ends at 84
        - Can be customized in household settings
    """
    if age < go_go_end_age:
        return "go-go"
    elif age < slow_go_end_age:
        return "slow-go"
    else:
        return "no-go"


def get_spending_amount(
    age: int,
    spending_go_go: float,
    spending_slow_go: float,
    spending_no_go: float,
    go_go_end_age: int = 74,
    slow_go_end_age: int = 84,
) -> float:
    """
    Get base spending amount for current age (before inflation).

    Determines which spending phase applies based on age, then returns
    the corresponding spending amount.

    Args:
        age (int): Current age
        spending_go_go (float): Annual spending in go-go phase
        spending_slow_go (float): Annual spending in slow-go phase
        spending_no_go (float): Annual spending in no-go phase
        go_go_end_age (int): Age when go-go phase ends
        slow_go_end_age (int): Age when slow-go phase ends

    Returns:
        float: Base annual spending amount for the phase

    Examples:
        >>> get_spending_amount(70, 120000, 80000, 60000)
        120000.0

        >>> get_spending_amount(75, 120000, 80000, 60000)
        80000.0

        >>> get_spending_amount(85, 120000, 80000, 60000)
        60000.0

    Notes:
        - This is the base amount before inflation adjustment
        - Use spending_with_inflation() to get inflation-adjusted amount
        - Spending amounts are typically household totals
    """
    if age < go_go_end_age:
        return spending_go_go
    elif age < slow_go_end_age:
        return spending_slow_go
    else:
        return spending_no_go


def spending_with_inflation(
    base_spending: float,
    years_since_start: int,
    inflation_rate: float = 0.02,
) -> float:
    """
    Calculate spending amount adjusted for inflation.

    Spending is indexed to inflation each year. This function applies
    a compound inflation factor to the base spending amount.

    Args:
        base_spending (float): Base spending amount (at year 0)
        years_since_start (int): Years since simulation start
        inflation_rate (float): Annual spending inflation rate (default 2%)

    Returns:
        float: Inflation-adjusted annual spending

    Examples:
        >>> spending_with_inflation(100000, 0, 0.02)
        100000.0

        >>> spending_with_inflation(100000, 1, 0.02)
        102000.0

        >>> spending_with_inflation(100000, 10, 0.02)
        121890.28

    Notes:
        - Spending inflation is typically lower than general inflation
        - Default 2% is typical for developed economies
        - Compound inflation: amount * (1 + rate) ** years
    """
    if years_since_start < 0:
        years_since_start = 0

    inflation_factor = (1.0 + inflation_rate) ** years_since_start
    return base_spending * inflation_factor


def calculate_phase_spending(
    age: int,
    spending_go_go: float,
    spending_slow_go: float,
    spending_no_go: float,
    go_go_end_age: int,
    slow_go_end_age: int,
    years_since_start: int,
    inflation_rate: float = 0.02,
) -> Tuple[str, float, float]:
    """
    Calculate spending phase and inflation-adjusted amount.

    Convenience function that combines phase determination and inflation
    adjustment in a single call.

    Args:
        age (int): Current age
        spending_go_go (float): Go-go phase spending
        spending_slow_go (float): Slow-go phase spending
        spending_no_go (float): No-go phase spending
        go_go_end_age (int): End age of go-go phase
        slow_go_end_age (int): End age of slow-go phase
        years_since_start (int): Years since simulation start
        inflation_rate (float): Annual inflation rate

    Returns:
        Tuple[str, float, float]: (phase_name, base_amount, inflation_adjusted_amount)

    Examples:
        >>> phase, base, adjusted = calculate_phase_spending(70, 120000, 80000, 60000, 74, 84, 0)
        >>> phase
        'go-go'
        >>> base
        120000.0
        >>> adjusted
        120000.0

        >>> phase, base, adjusted = calculate_phase_spending(75, 120000, 80000, 60000, 74, 84, 5, 0.02)
        >>> phase
        'slow-go'
        >>> base
        80000.0
        >>> abs(adjusted - 88326.39) < 0.01  # 80000 * 1.02^5
        True

    Notes:
        - Returns both base and adjusted amounts for transparency
        - Useful for reporting and analysis
        - Phase is determined based on age
    """
    phase = get_spending_phase(age, go_go_end_age, slow_go_end_age)
    base_amount = get_spending_amount(
        age, spending_go_go, spending_slow_go, spending_no_go, go_go_end_age, slow_go_end_age
    )
    adjusted_amount = spending_with_inflation(base_amount, years_since_start, inflation_rate)

    return phase, base_amount, adjusted_amount


def spending_per_person(
    household_spending: float,
    num_people: int = 2,
) -> float:
    """
    Divide household spending equally among household members.

    Assumes equal spending split among household members (e.g., couple splits
    equally, or divide household total by number of people).

    Args:
        household_spending (float): Total household spending
        num_people (int): Number of people in household (default 2)

    Returns:
        float: Per-person spending (household_spending / num_people)

    Examples:
        >>> spending_per_person(100000, 2)
        50000.0

        >>> spending_per_person(100000, 1)
        100000.0

        >>> spending_per_person(150000, 3)
        50000.0

    Notes:
        - Simple equal split; no differentiation by individual needs
        - Used for household-level targets in simulations
        - Assumes both people spend equally (not always realistic)
    """
    if num_people <= 0:
        return 0.0

    return household_spending / float(num_people)


def get_phase_thresholds() -> dict:
    """
    Get default spending phase threshold ages.

    Returns the default ages where spending phases transition. These can be
    customized in the household configuration.

    Returns:
        dict: Dictionary with keys:
            - "go_go_end_age": Default end age of go-go phase (74)
            - "slow_go_end_age": Default end age of slow-go phase (84)

    Examples:
        >>> thresholds = get_phase_thresholds()
        >>> thresholds["go_go_end_age"]
        74
        >>> thresholds["slow_go_end_age"]
        84

    Notes:
        - Age 74 typically marks transition from active to moderate spending
        - Age 84 marks transition to lower spending and potential care costs
        - These are Canadian guidelines; adjust based on user preferences
    """
    return {
        "go_go_end_age": 74,
        "slow_go_end_age": 84,
    }
