"""
File I/O utilities for saving and loading retirement scenarios.

This module provides functions to serialize and deserialize Household
objects and simulation results to/from JSON files, enabling users to
save their retirement plans and reload them later.
"""

import json
from datetime import datetime
from typing import Tuple, Optional
from pathlib import Path
import pandas as pd
from modules.models import Person, Household, Bracket, TaxParams


def _person_to_dict(person: Person) -> dict:
    """Convert a Person object to a dictionary."""
    return {
        'name': person.name,
        'start_age': person.start_age,
        'cpp_annual_at_start': person.cpp_annual_at_start,
        'cpp_start_age': person.cpp_start_age,
        'oas_annual_at_start': person.oas_annual_at_start,
        'oas_start_age': person.oas_start_age,
        'rrsp_balance': person.rrsp_balance,
        'rrif_balance': person.rrif_balance,
        'tfsa_balance': person.tfsa_balance,
        'tfsa_room_start': person.tfsa_room_start,
        'tfsa_room_annual_growth': person.tfsa_room_annual_growth,
        'p1_tfsa_room_start': person.p1_tfsa_room_start,
        'p2_tfsa_room_start': person.p2_tfsa_room_start,
        'tfsa_withdraw_last_year1': person.tfsa_withdraw_last_year1,
        'tfsa_withdraw_last_year2': person.tfsa_withdraw_last_year2,
        'tfsa_withdraw': person.tfsa_withdraw,
        'nonreg_balance': person.nonreg_balance,
        'nonreg_acb': person.nonreg_acb,
        'corporate_balance': person.corporate_balance,
        'corp_rdtoh': person.corp_rdtoh,
        'corp_dividend_type': person.corp_dividend_type,
        'yield_nonreg_interest': person.yield_nonreg_interest,
        'yield_nonreg_elig_div': person.yield_nonreg_elig_div,
        'yield_nonreg_nonelig_div': person.yield_nonreg_nonelig_div,
        'yield_nonreg_capg': person.yield_nonreg_capg,
        'yield_nonreg_roc_pct': person.yield_nonreg_roc_pct,
        'yield_corp_interest': person.yield_corp_interest,
        'yield_corp_elig_div': person.yield_corp_elig_div,
        'yield_corp_capg': person.yield_corp_capg,
        'yield_rrif_growth': person.yield_rrif_growth,
        'yield_tfsa_growth': person.yield_tfsa_growth,
        'yield_rrsp_growth': person.yield_rrsp_growth,
        'nr_cash': person.nr_cash,
        'nr_gic': person.nr_gic,
        'nr_invest': person.nr_invest,
        'nr_cash_pct': person.nr_cash_pct,
        'nr_gic_pct': person.nr_gic_pct,
        'nr_invest_pct': person.nr_invest_pct,
        'y_nr_cash_interest': person.y_nr_cash_interest,
        'y_nr_gic_interest': person.y_nr_gic_interest,
        'y_nr_inv_total_return': person.y_nr_inv_total_return,
        'y_nr_inv_elig_div': person.y_nr_inv_elig_div,
        'y_nr_inv_nonelig_div': person.y_nr_inv_nonelig_div,
        'y_nr_inv_capg': person.y_nr_inv_capg,
        'y_nr_inv_roc_pct': person.y_nr_inv_roc_pct,
        'corp_cash_bucket': person.corp_cash_bucket,
        'corp_gic_bucket': person.corp_gic_bucket,
        'corp_invest_bucket': person.corp_invest_bucket,
        'corp_cash_pct': person.corp_cash_pct,
        'corp_gic_pct': person.corp_gic_pct,
        'corp_invest_pct': person.corp_invest_pct,
        'y_corp_cash_interest': person.y_corp_cash_interest,
        'y_corp_gic_interest': person.y_corp_gic_interest,
        'y_corp_inv_total_return': person.y_corp_inv_total_return,
        'y_corp_inv_elig_div': person.y_corp_inv_elig_div,
        'y_corp_inv_capg': person.y_corp_inv_capg,
    }


def _dict_to_person(data: dict) -> Person:
    """Reconstruct a Person object from a dictionary."""
    return Person(**data)


def _household_to_dict(hh: Household) -> dict:
    """Convert a Household object to a dictionary."""
    return {
        'p1': _person_to_dict(hh.p1),
        'p2': _person_to_dict(hh.p2),
        'province': hh.province,
        'start_year': hh.start_year,
        'end_age': hh.end_age,
        'spending_go_go': hh.spending_go_go,
        'go_go_end_age': hh.go_go_end_age,
        'spending_slow_go': hh.spending_slow_go,
        'slow_go_end_age': hh.slow_go_end_age,
        'spending_no_go': hh.spending_no_go,
        'strategy': hh.strategy,
        'hybrid_rrif_topup_per_person': hh.hybrid_rrif_topup_per_person,
        'income_split_rrif_fraction': hh.income_split_rrif_fraction,
        'reinvest_nonreg_dist': hh.reinvest_nonreg_dist,
        'tfsa_contribution_each': hh.tfsa_contribution_each,
        'spending_inflation': hh.spending_inflation,
        'general_inflation': hh.general_inflation,
        'gap_tolerance': hh.gap_tolerance,
        'stop_on_fail': hh.stop_on_fail,
    }


def _dict_to_household(data: dict) -> Household:
    """Reconstruct a Household object from a dictionary."""
    p1_data = data.pop('p1')
    p2_data = data.pop('p2')
    p1 = _dict_to_person(p1_data)
    p2 = _dict_to_person(p2_data)
    return Household(p1=p1, p2=p2, **data)


def save_scenario(
    hh: Household,
    df: Optional[pd.DataFrame],
    scenario_name: str = "My Retirement Plan",
    scenario_description: str = ""
) -> dict:
    """
    Serialize a household and simulation results to a dictionary.

    This function converts the Household object and simulation DataFrame
    into a JSON-serializable dictionary that can be saved to a file.

    Args:
        hh: Household object with all user inputs
        df: DataFrame with simulation results (can be None)
        scenario_name: User-friendly name for the scenario
        scenario_description: Optional notes/description for the scenario (Phase 2)

    Returns:
        Dictionary ready for JSON serialization
    """
    data = {
        "metadata": {
            "version": "1.0",
            "created_date": datetime.now().isoformat(),
            "last_modified": datetime.now().isoformat(),
            "name": scenario_name,
            "description": scenario_description
        },
        "household": _household_to_dict(hh),
        "results": df.to_dict(orient='records') if df is not None else []
    }

    return data


def load_scenario(json_data: dict) -> Tuple[Household, Optional[pd.DataFrame]]:
    """
    Deserialize a household and simulation results from a dictionary.

    This function reconstructs the Household object and simulation DataFrame
    from a previously saved JSON dictionary.

    Args:
        json_data: Dictionary loaded from JSON file

    Returns:
        Tuple of (Household, DataFrame or None)

    Raises:
        ValueError: If the file format is invalid or incompatible
        KeyError: If required fields are missing
    """
    # Validate format
    if "metadata" not in json_data or "household" not in json_data:
        raise ValueError("Invalid scenario file format. Missing metadata or household data.")

    # Check version compatibility
    version = json_data.get("metadata", {}).get("version", "0.0")
    if version != "1.0":
        raise ValueError(f"Unsupported file version: {version}. Expected 1.0")

    # Reconstruct Household
    hh = _dict_to_household(json_data["household"].copy())

    # Reconstruct DataFrame
    results = json_data.get("results", [])
    df = pd.DataFrame(results) if results else None

    return hh, df


def scenario_to_json_string(
    hh: Household,
    df: Optional[pd.DataFrame],
    scenario_name: str = "My Retirement Plan",
    scenario_description: str = ""
) -> str:
    """
    Convert a scenario to a JSON string.

    Args:
        hh: Household object
        df: Simulation results DataFrame
        scenario_name: Name for the scenario
        scenario_description: Optional notes/description for the scenario (Phase 2)

    Returns:
        JSON string
    """
    data = save_scenario(hh, df, scenario_name, scenario_description)
    return json.dumps(data, indent=2)


def json_string_to_scenario(json_string: str) -> Tuple[Household, Optional[pd.DataFrame]]:
    """
    Convert a JSON string to a scenario.

    Args:
        json_string: JSON string representation of scenario

    Returns:
        Tuple of (Household, DataFrame or None)

    Raises:
        json.JSONDecodeError: If JSON is invalid
        ValueError: If scenario format is invalid
    """
    try:
        data = json.loads(json_string)
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON: {str(e)}", e.doc, e.pos)

    return load_scenario(data)


def get_scenario_metadata(json_data: dict) -> dict:
    """
    Extract metadata from a scenario file without loading the full data.

    Args:
        json_data: Dictionary loaded from JSON file

    Returns:
        Dictionary with metadata (name, created_date, etc.)
    """
    return json_data.get("metadata", {})
