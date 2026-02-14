"""
Household utility functions for single vs couple handling.

This module provides helper functions to properly handle single and couple
retirement planning scenarios throughout the simulation.
"""

from typing import List, Optional, Dict, Any
from modules.models import Household, Person


def is_couple(household: Household) -> bool:
    """
    Check if household is a couple or single retiree.

    Args:
        household: Household object with include_partner flag

    Returns:
        bool: True if couple, False if single
    """
    return household.include_partner


def get_participants(household: Household) -> List[Person]:
    """
    Get list of active participants in household.

    For single households, returns list with p1 only.
    For couple households, returns list with both p1 and p2.

    Args:
        household: Household object

    Returns:
        List[Person]: Active participants
    """
    if is_couple(household):
        return [household.p1, household.p2]
    return [household.p1]


def get_participant_count(household: Household) -> int:
    """
    Get number of participants in household.

    Args:
        household: Household object

    Returns:
        int: 1 for single, 2 for couple
    """
    return 2 if is_couple(household) else 1


def get_gis_threshold(household: Household, gis_config: Dict[str, Any]) -> float:
    """
    Get appropriate GIS threshold based on household type.

    Args:
        household: Household object
        gis_config: GIS configuration dictionary

    Returns:
        float: GIS income threshold
    """
    if is_couple(household):
        return gis_config.get("threshold_couple", 29424)
    else:
        return gis_config.get("threshold_single", 22272)


def get_gis_max_benefit(household: Household, gis_config: Dict[str, Any]) -> float:
    """
    Get maximum GIS benefit based on household type.

    Args:
        household: Household object
        gis_config: GIS configuration dictionary

    Returns:
        float: Maximum annual GIS benefit per person
    """
    if is_couple(household):
        return gis_config.get("max_benefit_couple", 6814.20)
    else:
        return gis_config.get("max_benefit_single", 11628.84)


def should_calculate_survivor_scenarios(household: Household) -> bool:
    """
    Check if survivor scenarios should be calculated.

    Only applies to couples, not singles.

    Args:
        household: Household object

    Returns:
        bool: True if survivor scenarios should be calculated
    """
    return is_couple(household)


def get_spending_reduction_factor(household: Household, is_survivor: bool = False) -> float:
    """
    Get spending reduction factor for household size.

    When one spouse passes in a couple, spending typically reduces by 25-30%.
    Singles have no reduction.

    Args:
        household: Household object
        is_survivor: Whether this is for survivor scenario

    Returns:
        float: Spending factor (1.0 for full, 0.7 for survivor)
    """
    if not is_couple(household):
        return 1.0

    if is_survivor:
        return 0.7  # 70% of couple spending for survivor

    return 1.0


def get_tax_splitting_eligible(household: Household) -> bool:
    """
    Check if pension income splitting is available.

    Only couples can split pension income.

    Args:
        household: Household object

    Returns:
        bool: True if eligible for pension splitting
    """
    return is_couple(household)


def get_tfsa_contribution_limit(household: Household, annual_limit: float = 7000.0) -> float:
    """
    Get total household TFSA contribution limit.

    Args:
        household: Household object
        annual_limit: Per-person TFSA contribution limit

    Returns:
        float: Total household TFSA contribution limit
    """
    return annual_limit * get_participant_count(household)


def get_active_person_data(household: Household, person_num: int) -> Optional[Person]:
    """
    Get person data only if they are active in the household.

    Args:
        household: Household object
        person_num: Person number (1 or 2)

    Returns:
        Person object if active, None otherwise
    """
    if person_num == 1:
        return household.p1
    elif person_num == 2 and is_couple(household):
        return household.p2
    return None


def calculate_household_income(
    p1_income: float,
    p2_income: float,
    household: Household
) -> float:
    """
    Calculate total household income based on household type.

    Args:
        p1_income: Person 1's income
        p2_income: Person 2's income
        household: Household object

    Returns:
        float: Total household income
    """
    if is_couple(household):
        return p1_income + p2_income
    return p1_income


def calculate_household_tax(
    p1_tax: float,
    p2_tax: float,
    household: Household
) -> float:
    """
    Calculate total household tax based on household type.

    Args:
        p1_tax: Person 1's tax
        p2_tax: Person 2's tax
        household: Household object

    Returns:
        float: Total household tax
    """
    if is_couple(household):
        return p1_tax + p2_tax
    return p1_tax


def adjust_spending_for_household(
    base_spending: float,
    household: Household,
    is_survivor_year: bool = False
) -> float:
    """
    Adjust spending amount based on household type and survivor status.

    Args:
        base_spending: Base spending amount
        household: Household object
        is_survivor_year: Whether this is after first spouse death

    Returns:
        float: Adjusted spending amount
    """
    if not is_couple(household):
        # Singles don't have survivor adjustments
        return base_spending

    if is_survivor_year:
        # Reduce spending by 30% when one spouse passes
        return base_spending * 0.7

    return base_spending