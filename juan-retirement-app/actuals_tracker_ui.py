#!/usr/bin/env python3
"""
Comprehensive Actuals Tracker 2025 - Streamlit UI Components

This module provides Streamlit UI components for the Comprehensive Actuals Tracker 2025,
enabling users to input all household income sources and view complete tax calculations
with full Alberta tax treatment.

Key Features:
- Tab-based navigation for different income categories
- Real-time calculation updates
- Summary dashboard with key metrics
- Tax breakdown by person and income type
- Withholding tax reconciliation
- Q1 2026 reconciliation guidance

Functions:
    render_employment_income_inputs: Employment (T4) income section
    render_non_registered_income_inputs: Non-registered investment income
    render_registered_withdrawal_inputs: RRIF/RRSP/TFSA withdrawals
    render_corporate_distribution_inputs: Corporate distributions
    render_registered_growth_inputs: Registered account growth tracking
    render_tax_summary_dashboard: Complete tax calculation results
    render_actuals_tracker_section: Main UI orchestration
"""

import streamlit as st
import json
from datetime import datetime
from actuals_tracker_data_model import (
    HouseholdActuals2025, PersonActuals,
    serialize_person_actuals, deserialize_person_actuals,
    serialize_household_actuals, deserialize_household_actuals
)
from actuals_tracker_calculations import ComprehensiveTaxCalculator


def _valarg(key: str, default) -> dict:
    """Only supply a default if the key is not already in session_state.

    This prevents Streamlit warnings about widgets created with both
    default value AND session state.
    """
    return {} if key in st.session_state else {"value": float(default)}


def init_actuals_tracker_session_state():
    """Initialize session state for Actuals Tracker if not already present."""

    # Initialize household object
    if "actuals_household" not in st.session_state:
        st.session_state.actuals_household = HouseholdActuals2025()

    # Initialize tax calculator
    if "tax_calculator" not in st.session_state:
        st.session_state.tax_calculator = ComprehensiveTaxCalculator()

    # Initialize tax results cache
    if "actuals_tax_results" not in st.session_state:
        st.session_state.actuals_tax_results = None

    # Initialize all 36 tracker widget keys for both persons
    # This MUST happen before widgets render to prevent Streamlit errors when loading
    for person_id in ["p1", "p2"]:
        # Employment Income (4 keys)
        if f"{person_id}_salary" not in st.session_state:
            st.session_state[f"{person_id}_salary"] = 0.0
        if f"{person_id}_tax_withheld" not in st.session_state:
            st.session_state[f"{person_id}_tax_withheld"] = 0.0
        if f"{person_id}_cpp" not in st.session_state:
            st.session_state[f"{person_id}_cpp"] = 0.0
        if f"{person_id}_ei" not in st.session_state:
            st.session_state[f"{person_id}_ei"] = 0.0

        # Government Benefits (4 keys)
        if f"{person_id}_cpp_benefits" not in st.session_state:
            st.session_state[f"{person_id}_cpp_benefits"] = 0.0
        if f"{person_id}_oas_benefits" not in st.session_state:
            st.session_state[f"{person_id}_oas_benefits"] = 0.0
        if f"{person_id}_gis_benefits" not in st.session_state:
            st.session_state[f"{person_id}_gis_benefits"] = 0.0
        if f"{person_id}_other_benefits" not in st.session_state:
            st.session_state[f"{person_id}_other_benefits"] = 0.0

        # Non-Registered Income (4 keys - note: foreign_div widget exists but not in model)
        if f"{person_id}_interest" not in st.session_state:
            st.session_state[f"{person_id}_interest"] = 0.0
        if f"{person_id}_eligible_div" not in st.session_state:
            st.session_state[f"{person_id}_eligible_div"] = 0.0
        if f"{person_id}_non_eligible_div" not in st.session_state:
            st.session_state[f"{person_id}_non_eligible_div"] = 0.0
        if f"{person_id}_capital_gains" not in st.session_state:
            st.session_state[f"{person_id}_capital_gains"] = 0.0
        if f"{person_id}_rental" not in st.session_state:
            st.session_state[f"{person_id}_rental"] = 0.0

        # Registered Withdrawals (7 keys)
        if f"{person_id}_rrif_withdrawal" not in st.session_state:
            st.session_state[f"{person_id}_rrif_withdrawal"] = 0.0
        if f"{person_id}_rrif_withholding" not in st.session_state:
            st.session_state[f"{person_id}_rrif_withholding"] = 0.0
        if f"{person_id}_rrsp_withdrawal" not in st.session_state:
            st.session_state[f"{person_id}_rrsp_withdrawal"] = 0.0
        if f"{person_id}_rrsp_withholding" not in st.session_state:
            st.session_state[f"{person_id}_rrsp_withholding"] = 0.0
        if f"{person_id}_tfsa_withdrawal" not in st.session_state:
            st.session_state[f"{person_id}_tfsa_withdrawal"] = 0.0
        if f"{person_id}_rrsp_contribution" not in st.session_state:
            st.session_state[f"{person_id}_rrsp_contribution"] = 0.0
        if f"{person_id}_tfsa_contribution" not in st.session_state:
            st.session_state[f"{person_id}_tfsa_contribution"] = 0.0

        # Corporate Distributions (9 keys)
        if f"{person_id}_corp_salary" not in st.session_state:
            st.session_state[f"{person_id}_corp_salary"] = 0.0
        if f"{person_id}_corp_salary_cpp" not in st.session_state:
            st.session_state[f"{person_id}_corp_salary_cpp"] = 0.0
        if f"{person_id}_corp_salary_ei" not in st.session_state:
            st.session_state[f"{person_id}_corp_salary_ei"] = 0.0
        if f"{person_id}_corp_eligible_div" not in st.session_state:
            st.session_state[f"{person_id}_corp_eligible_div"] = 0.0
        if f"{person_id}_corp_non_eligible_div" not in st.session_state:
            st.session_state[f"{person_id}_corp_non_eligible_div"] = 0.0
        if f"{person_id}_cda_distribution" not in st.session_state:
            st.session_state[f"{person_id}_cda_distribution"] = 0.0
        if f"{person_id}_return_of_capital" not in st.session_state:
            st.session_state[f"{person_id}_return_of_capital"] = 0.0
        if f"{person_id}_corp_capital_gains" not in st.session_state:
            st.session_state[f"{person_id}_corp_capital_gains"] = 0.0
        if f"{person_id}_corp_withholding" not in st.session_state:
            st.session_state[f"{person_id}_corp_withholding"] = 0.0

        # Registered Account Growth (6 keys)
        if f"{person_id}_rrif_balance" not in st.session_state:
            st.session_state[f"{person_id}_rrif_balance"] = 0.0
        if f"{person_id}_rrif_growth_ytd" not in st.session_state:
            st.session_state[f"{person_id}_rrif_growth_ytd"] = 0.0
        if f"{person_id}_rrsp_balance" not in st.session_state:
            st.session_state[f"{person_id}_rrsp_balance"] = 0.0
        if f"{person_id}_rrsp_growth_ytd" not in st.session_state:
            st.session_state[f"{person_id}_rrsp_growth_ytd"] = 0.0
        if f"{person_id}_tfsa_balance" not in st.session_state:
            st.session_state[f"{person_id}_tfsa_balance"] = 0.0
        if f"{person_id}_tfsa_growth_ytd" not in st.session_state:
            st.session_state[f"{person_id}_tfsa_growth_ytd"] = 0.0

        # Foreign dividend widget (not in model, but needed for widget)
        if f"{person_id}_foreign_div" not in st.session_state:
            st.session_state[f"{person_id}_foreign_div"] = 0.0


def _load_household_actuals_to_session_state(household: HouseholdActuals2025):
    """Load HouseholdActuals2025 object values into session state for both persons.

    Args:
        household: HouseholdActuals2025 object with loaded data
    """
    _load_person_actuals_to_session_state("p1", household.person1)
    _load_person_actuals_to_session_state("p2", household.person2)


def _collect_household_actuals_from_session_state() -> HouseholdActuals2025:
    """Collect HouseholdActuals2025 from current session state values.

    Returns:
        HouseholdActuals2025 object with both persons' current session state values
    """
    person1 = _collect_person_actuals_from_session_state("p1")
    person2 = _collect_person_actuals_from_session_state("p2")

    household = HouseholdActuals2025(person1=person1, person2=person2)
    return household


def _load_person_actuals_to_session_state(person_id: str, person: PersonActuals):
    """Load PersonActuals object values into session state widgets.

    This function maps the PersonActuals dataclass values back into
    the session state keys that the input widgets reference.

    Args:
        person_id: "p1" or "p2"
        person: PersonActuals object with loaded data
    """
    # Employment Income
    st.session_state[f"{person_id}_salary"] = person.employment.gross_salary
    st.session_state[f"{person_id}_tax_withheld"] = person.employment.income_tax_withheld
    st.session_state[f"{person_id}_cpp"] = person.employment.cpp_contribution
    st.session_state[f"{person_id}_ei"] = person.employment.ei_premium

    # Government Benefits
    st.session_state[f"{person_id}_cpp_benefits"] = person.government_benefits.cpp_benefits
    st.session_state[f"{person_id}_oas_benefits"] = person.government_benefits.oas_benefits
    st.session_state[f"{person_id}_gis_benefits"] = person.government_benefits.gis_benefits
    st.session_state[f"{person_id}_other_benefits"] = person.government_benefits.other_benefits

    # Non-Registered Income
    st.session_state[f"{person_id}_interest"] = person.non_registered.interest
    st.session_state[f"{person_id}_eligible_div"] = person.non_registered.eligible_dividend
    st.session_state[f"{person_id}_non_eligible_div"] = person.non_registered.non_eligible_dividend
    st.session_state[f"{person_id}_capital_gains"] = person.non_registered.capital_gains
    st.session_state[f"{person_id}_rental"] = person.non_registered.rental_income

    # Registered Withdrawals
    st.session_state[f"{person_id}_rrif_withdrawal"] = person.registered_withdrawals.rrif_withdrawal
    st.session_state[f"{person_id}_rrif_withholding"] = person.registered_withdrawals.rrif_withholding_tax
    st.session_state[f"{person_id}_rrsp_withdrawal"] = person.registered_withdrawals.rrsp_withdrawal
    st.session_state[f"{person_id}_rrsp_withholding"] = person.registered_withdrawals.rrsp_withholding_tax
    st.session_state[f"{person_id}_tfsa_withdrawal"] = person.registered_withdrawals.tfsa_withdrawal
    st.session_state[f"{person_id}_rrsp_contribution"] = person.registered_withdrawals.rrsp_contribution
    st.session_state[f"{person_id}_tfsa_contribution"] = person.registered_withdrawals.tfsa_contribution

    # Corporate Distributions
    st.session_state[f"{person_id}_corp_salary"] = person.corporate_distributions.salary
    st.session_state[f"{person_id}_corp_salary_cpp"] = person.corporate_distributions.salary_cpp
    st.session_state[f"{person_id}_corp_salary_ei"] = person.corporate_distributions.salary_ei
    st.session_state[f"{person_id}_corp_eligible_div"] = person.corporate_distributions.eligible_dividend
    st.session_state[f"{person_id}_corp_non_eligible_div"] = person.corporate_distributions.non_eligible_dividend
    st.session_state[f"{person_id}_cda_distribution"] = person.corporate_distributions.cda_distribution
    st.session_state[f"{person_id}_return_of_capital"] = person.corporate_distributions.return_of_capital
    st.session_state[f"{person_id}_corp_capital_gains"] = person.corporate_distributions.capital_gains
    st.session_state[f"{person_id}_corp_withholding"] = person.corporate_distributions.withholding_tax

    # Registered Account Growth
    st.session_state[f"{person_id}_rrif_balance"] = person.registered_growth.rrif_balance
    st.session_state[f"{person_id}_rrif_growth_ytd"] = person.registered_growth.rrif_growth_ytd
    st.session_state[f"{person_id}_rrsp_balance"] = person.registered_growth.rrsp_balance
    st.session_state[f"{person_id}_rrsp_growth_ytd"] = person.registered_growth.rrsp_growth_ytd
    st.session_state[f"{person_id}_tfsa_balance"] = person.registered_growth.tfsa_balance
    st.session_state[f"{person_id}_tfsa_growth_ytd"] = person.registered_growth.tfsa_growth_ytd


def _collect_person_actuals_from_session_state(person_id: str) -> PersonActuals:
    """Collect PersonActuals from current session state values.

    This function reads all the input widget values from session state
    and reconstructs a PersonActuals object.

    Args:
        person_id: "p1" or "p2"

    Returns:
        PersonActuals object with current session state values
    """
    from actuals_tracker_data_model import (
        EmploymentIncome, GovernmentBenefits, NonRegisteredIncome, RegisteredWithdrawals,
        CorporateDistributions, RegisteredAccountGrowth
    )

    person = PersonActuals(person_id=person_id)

    # Employment Income
    person.employment.gross_salary = st.session_state.get(f"{person_id}_salary", 0.0)
    person.employment.income_tax_withheld = st.session_state.get(f"{person_id}_tax_withheld", 0.0)
    person.employment.cpp_contribution = st.session_state.get(f"{person_id}_cpp", 0.0)
    person.employment.ei_premium = st.session_state.get(f"{person_id}_ei", 0.0)

    # Government Benefits
    person.government_benefits.cpp_benefits = st.session_state.get(f"{person_id}_cpp_benefits", 0.0)
    person.government_benefits.oas_benefits = st.session_state.get(f"{person_id}_oas_benefits", 0.0)
    person.government_benefits.gis_benefits = st.session_state.get(f"{person_id}_gis_benefits", 0.0)
    person.government_benefits.other_benefits = st.session_state.get(f"{person_id}_other_benefits", 0.0)

    # Non-Registered Income
    person.non_registered.interest = st.session_state.get(f"{person_id}_interest", 0.0)
    person.non_registered.eligible_dividend = st.session_state.get(f"{person_id}_eligible_div", 0.0)
    person.non_registered.non_eligible_dividend = st.session_state.get(f"{person_id}_non_eligible_div", 0.0)
    person.non_registered.capital_gains = st.session_state.get(f"{person_id}_capital_gains", 0.0)
    person.non_registered.rental_income = st.session_state.get(f"{person_id}_rental", 0.0)

    # Registered Withdrawals
    person.registered_withdrawals.rrif_withdrawal = st.session_state.get(f"{person_id}_rrif_withdrawal", 0.0)
    person.registered_withdrawals.rrif_withholding_tax = st.session_state.get(f"{person_id}_rrif_withholding", 0.0)
    person.registered_withdrawals.rrsp_withdrawal = st.session_state.get(f"{person_id}_rrsp_withdrawal", 0.0)
    person.registered_withdrawals.rrsp_withholding_tax = st.session_state.get(f"{person_id}_rrsp_withholding", 0.0)
    person.registered_withdrawals.tfsa_withdrawal = st.session_state.get(f"{person_id}_tfsa_withdrawal", 0.0)
    person.registered_withdrawals.rrsp_contribution = st.session_state.get(f"{person_id}_rrsp_contribution", 0.0)
    person.registered_withdrawals.tfsa_contribution = st.session_state.get(f"{person_id}_tfsa_contribution", 0.0)

    # Corporate Distributions
    person.corporate_distributions.salary = st.session_state.get(f"{person_id}_corp_salary", 0.0)
    person.corporate_distributions.salary_cpp = st.session_state.get(f"{person_id}_corp_salary_cpp", 0.0)
    person.corporate_distributions.salary_ei = st.session_state.get(f"{person_id}_corp_salary_ei", 0.0)
    person.corporate_distributions.eligible_dividend = st.session_state.get(f"{person_id}_corp_eligible_div", 0.0)
    person.corporate_distributions.non_eligible_dividend = st.session_state.get(f"{person_id}_corp_non_eligible_div", 0.0)
    person.corporate_distributions.cda_distribution = st.session_state.get(f"{person_id}_cda_distribution", 0.0)
    person.corporate_distributions.return_of_capital = st.session_state.get(f"{person_id}_return_of_capital", 0.0)
    person.corporate_distributions.capital_gains = st.session_state.get(f"{person_id}_corp_capital_gains", 0.0)
    person.corporate_distributions.withholding_tax = st.session_state.get(f"{person_id}_corp_withholding", 0.0)

    # Registered Account Growth
    person.registered_growth.rrif_balance = st.session_state.get(f"{person_id}_rrif_balance", 0.0)
    person.registered_growth.rrif_growth_ytd = st.session_state.get(f"{person_id}_rrif_growth_ytd", 0.0)
    person.registered_growth.rrsp_balance = st.session_state.get(f"{person_id}_rrsp_balance", 0.0)
    person.registered_growth.rrsp_growth_ytd = st.session_state.get(f"{person_id}_rrsp_growth_ytd", 0.0)
    person.registered_growth.tfsa_balance = st.session_state.get(f"{person_id}_tfsa_balance", 0.0)
    person.registered_growth.tfsa_growth_ytd = st.session_state.get(f"{person_id}_tfsa_growth_ytd", 0.0)

    return person


def calculate_variance(plan_value, actual_value, threshold_minor=0.02, threshold_major=0.05):
    """
    Calculate variance between plan and actual values.

    Compares Simulator plan values (projected) with Tracker actual values (entered).

    Args:
        plan_value: Planned amount from Simulator (float)
        actual_value: Actual amount from Tracker (float)
        threshold_minor: Percentage threshold for "minor" variance (default 2%)
        threshold_major: Percentage threshold for "major" variance (default 5%)

    Returns:
        dict with:
            - absolute: Absolute difference (actual - plan)
            - percent: Percentage difference
            - status: Status text ("On Track", "Minor Variance", "Significant Variance", "—")
            - indicator: Visual indicator ("✓", "⚠", "🔴", "—")
            - color: Color for display ("green", "orange", "red", "gray")
    """
    # Handle zero plan amounts
    if plan_value == 0 or plan_value is None:
        return {
            "absolute": 0 if (actual_value == 0 or actual_value is None) else float(actual_value or 0),
            "percent": 0,
            "status": "—",
            "indicator": "—",
            "color": "gray"
        }

    # Convert to float and calculate variance
    plan_value = float(plan_value or 0)
    actual_value = float(actual_value or 0)

    absolute_variance = actual_value - plan_value
    percent_variance = (absolute_variance / plan_value) * 100 if plan_value != 0 else 0

    # Determine status based on percentage
    abs_percent = abs(percent_variance)

    if abs_percent < threshold_minor:
        status = "On Track"
        indicator = "✓"
        color = "green"
    elif abs_percent < threshold_major:
        status = "Minor Variance"
        indicator = "⚠"
        color = "orange"
    else:
        status = "Significant Variance"
        indicator = "🔴"
        color = "red"

    return {
        "absolute": absolute_variance,
        "percent": percent_variance,
        "status": status,
        "indicator": indicator,
        "color": color
    }


def render_employment_income_inputs(person_id: str, person_label: str):
    """Render employment (T4) income input section."""
    st.subheader(f"{person_label} - Employment Income (T4)")

    col1, col2 = st.columns(2)

    with col1:
        gross_salary = st.number_input(
            "Gross Salary (T4 Box 14)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_salary",
            **_valarg(f"{person_id}_salary", 0.0)
        )

    with col2:
        income_tax_withheld = st.number_input(
            "Income Tax Withheld",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_tax_withheld",
            **_valarg(f"{person_id}_tax_withheld", 0.0)
        )

    col3, col4 = st.columns(2)

    with col3:
        cpp_contribution = st.number_input(
            "CPP Contribution (T4 Box 16)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_cpp",
            **_valarg(f"{person_id}_cpp", 0.0)
        )

    with col4:
        ei_premium = st.number_input(
            "EI Premium (T4 Box 18)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_ei",
            **_valarg(f"{person_id}_ei", 0.0)
        )

    # Update data model
    person = st.session_state.actuals_household.get_person(person_id)
    person.employment.gross_salary = gross_salary
    person.employment.income_tax_withheld = income_tax_withheld
    person.employment.cpp_contribution = cpp_contribution
    person.employment.ei_premium = ei_premium

    # Government Benefits (CPP, OAS, etc.)
    st.subheader(f"{person_label} - Government Benefits")

    col1, col2 = st.columns(2)

    with col1:
        cpp_benefits = st.number_input(
            "CPP Benefits (100% taxable)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_cpp_benefits",
            **_valarg(f"{person_id}_cpp_benefits", 0.0),
            help="Canada Pension Plan retirement benefits received"
        )

    with col2:
        oas_benefits = st.number_input(
            "OAS Benefits (100% taxable)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_oas_benefits",
            **_valarg(f"{person_id}_oas_benefits", 0.0),
            help="Old Age Security benefits (100% taxable income, subject to clawback if income exceeds $93,454)"
        )

    col3, col4 = st.columns(2)

    with col3:
        gis_benefits = st.number_input(
            "GIS Benefits (tax-free)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_gis_benefits",
            **_valarg(f"{person_id}_gis_benefits", 0.0),
            help="Guaranteed Income Supplement benefits"
        )

    with col4:
        other_benefits = st.number_input(
            "Other Government Benefits",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_other_benefits",
            **_valarg(f"{person_id}_other_benefits", 0.0),
            help="EI, disability, or other government benefits"
        )

    # Update government benefits in data model
    person.government_benefits.cpp_benefits = cpp_benefits
    person.government_benefits.oas_benefits = oas_benefits
    person.government_benefits.gis_benefits = gis_benefits
    person.government_benefits.other_benefits = other_benefits


def render_non_registered_income_inputs(person_id: str, person_label: str):
    """Render non-registered investment income input section."""
    st.subheader(f"{person_label} - Non-Registered Income")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Interest & Savings**")
        interest = st.number_input(
            "Interest (T5 Box 2)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_interest",
            **_valarg(f"{person_id}_interest", 0.0)
        )

    with col2:
        st.markdown("**Dividends (Foreign)**")
        foreign_dividend = st.number_input(
            "Foreign Dividend (other)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_foreign_div",
            **_valarg(f"{person_id}_foreign_div", 0.0)
        )

    col3, col4 = st.columns(2)

    with col3:
        st.markdown("**Dividends from Canadian Corp - Eligible**")
        eligible_dividend = st.number_input(
            "Eligible Dividend (T5 Box 24)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_eligible_div",
            **_valarg(f"{person_id}_eligible_div", 0.0)
        )

    with col4:
        st.markdown("**Dividends from Canadian Corp - Non-Eligible**")
        non_eligible_dividend = st.number_input(
            "Non-Eligible Dividend (T5 Box 25)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_non_eligible_div",
            **_valarg(f"{person_id}_non_eligible_div", 0.0)
        )

    col5, col6 = st.columns(2)

    with col5:
        st.markdown("**Capital Gains**")
        capital_gains = st.number_input(
            "Realized Capital Gains",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_capital_gains",
            **_valarg(f"{person_id}_capital_gains", 0.0)
        )

    with col6:
        st.markdown("**Rental Income**")
        rental_income = st.number_input(
            "Net Rental Income",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_nr_rental",
            **_valarg(f"{person_id}_nr_rental", 0.0)
        )

    # Update data model
    person = st.session_state.actuals_household.get_person(person_id)
    person.non_registered.interest = interest
    person.non_registered.eligible_dividend = eligible_dividend
    person.non_registered.non_eligible_dividend = non_eligible_dividend
    person.non_registered.capital_gains = capital_gains
    person.non_registered.rental_income = rental_income


def render_registered_withdrawal_inputs(person_id: str, person_label: str):
    """Render registered account withdrawal input section."""
    st.subheader(f"{person_label} - Registered Account Withdrawals & Contributions")

    st.markdown("**RRIF Withdrawals (Taxable)**")
    col1, col2 = st.columns(2)

    with col1:
        rrif_withdrawal = st.number_input(
            "RRIF Withdrawal Amount",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_rrif_withdrawal",
            **_valarg(f"{person_id}_rrif_withdrawal", 0.0)
        )

    with col2:
        rrif_withholding = st.number_input(
            "RRIF Withholding Tax (20-30%)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_rrif_withholding",
            **_valarg(f"{person_id}_rrif_withholding", 0.0)
        )

    st.markdown("**RRSP Withdrawals (Taxable)**")
    col3, col4 = st.columns(2)

    with col3:
        rrsp_withdrawal = st.number_input(
            "RRSP Withdrawal Amount",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_rrsp_withdrawal",
            **_valarg(f"{person_id}_rrsp_withdrawal", 0.0)
        )

    with col4:
        rrsp_withholding = st.number_input(
            "RRSP Withholding Tax (20-30%)",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_rrsp_withholding",
            **_valarg(f"{person_id}_rrsp_withholding", 0.0)
        )

    st.markdown("**RRSP Contributions (Tax-Deductible)**")
    col5, col6 = st.columns(2)

    with col5:
        rrsp_contribution = st.number_input(
            "RRSP Contribution Amount",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_rrsp_contribution",
            help="Amount contributed to RRSP this year. Tax-deductible (reduces taxable income $1:$1).",
            **_valarg(f"{person_id}_rrsp_contribution", 0.0)
        )

    with col6:
        # Show tax savings at person's marginal rate (calculated after we have data)
        st.markdown("")  # Spacing for alignment
        st.caption("Tax savings shown in Tax Summary")

    st.markdown("**TFSA Withdrawals (Tax-Free)**")
    col7, col8 = st.columns(2)

    with col7:
        tfsa_withdrawal = st.number_input(
            "TFSA Withdrawal Amount (no tax)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_tfsa_withdrawal",
            **_valarg(f"{person_id}_tfsa_withdrawal", 0.0)
        )

    with col8:
        tfsa_contribution = st.number_input(
            "TFSA Contribution Amount (no tax deduction)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_tfsa_contribution",
            help="Amount contributed to TFSA this year. Not tax-deductible but grows tax-free.",
            **_valarg(f"{person_id}_tfsa_contribution", 0.0)
        )

    # Update data model
    person = st.session_state.actuals_household.get_person(person_id)
    person.registered_withdrawals.rrif_withdrawal = rrif_withdrawal
    person.registered_withdrawals.rrif_withholding_tax = rrif_withholding
    person.registered_withdrawals.rrsp_withdrawal = rrsp_withdrawal
    person.registered_withdrawals.rrsp_withholding_tax = rrsp_withholding
    person.registered_withdrawals.rrsp_contribution = rrsp_contribution
    person.registered_withdrawals.tfsa_withdrawal = tfsa_withdrawal
    person.registered_withdrawals.tfsa_contribution = tfsa_contribution


def render_corporate_distribution_inputs(person_id: str, person_label: str):
    """Render corporate distribution input section."""
    st.subheader(f"{person_label} - Corporate Distributions")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Salary (T4)**")
        salary = st.number_input(
            "Corporate Salary",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_corp_salary",
            **_valarg(f"{person_id}_corp_salary", 0.0)
        )

    with col2:
        st.markdown("**Salary Deductions**")
        col_a, col_b = st.columns(2)

        with col_a:
            salary_cpp = st.number_input(
                "CPP Deduction",
                min_value=0.0,
                step=10.0,
                key=f"{person_id}_corp_cpp",
                **_valarg(f"{person_id}_corp_cpp", 0.0)
            )

        with col_b:
            salary_ei = st.number_input(
                "EI Deduction",
                min_value=0.0,
                step=10.0,
                key=f"{person_id}_corp_ei",
                **_valarg(f"{person_id}_corp_ei", 0.0)
            )

    st.markdown("**Dividend Distributions**")
    col3, col4 = st.columns(2)

    with col3:
        eligible_div = st.number_input(
            "Eligible Dividend",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_corp_elig_div",
            **_valarg(f"{person_id}_corp_elig_div", 0.0)
        )

    with col4:
        non_eligible_div = st.number_input(
            "Non-Eligible Dividend",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_corp_non_elig_div",
            **_valarg(f"{person_id}_corp_non_elig_div", 0.0)
        )

    st.markdown("**Tax-Free Distributions**")
    col5, col6 = st.columns(2)

    with col5:
        cda_dist = st.number_input(
            "CDA Distribution (Tax-Free!) 🎉",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_corp_cda",
            **_valarg(f"{person_id}_corp_cda", 0.0)
        )

    with col6:
        roc = st.number_input(
            "Return of Capital (Tax-Free!)",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_corp_roc",
            **_valarg(f"{person_id}_corp_roc", 0.0)
        )

    st.markdown("**Other Distributions**")
    col7, col8 = st.columns(2)

    with col7:
        corp_cap_gains = st.number_input(
            "Capital Gains Distribution",
            min_value=0.0,
            step=100.0,
            key=f"{person_id}_corp_cap_gains",
            **_valarg(f"{person_id}_corp_cap_gains", 0.0)
        )

    with col8:
        div_withholding = st.number_input(
            "Dividend Withholding Tax",
            min_value=0.0,
            step=10.0,
            key=f"{person_id}_corp_div_withhold",
            **_valarg(f"{person_id}_corp_div_withhold", 0.0)
        )

    # Update data model
    person = st.session_state.actuals_household.get_person(person_id)
    person.corporate_distributions.salary = salary
    person.corporate_distributions.salary_cpp = salary_cpp
    person.corporate_distributions.salary_ei = salary_ei
    person.corporate_distributions.eligible_dividend = eligible_div
    person.corporate_distributions.non_eligible_dividend = non_eligible_div
    person.corporate_distributions.cda_distribution = cda_dist
    person.corporate_distributions.return_of_capital = roc
    person.corporate_distributions.capital_gains = corp_cap_gains
    person.corporate_distributions.withholding_tax = div_withholding


def render_registered_growth_inputs(person_id: str, person_label: str):
    """Render registered account growth tracking (information only - not taxed)."""
    st.subheader(f"{person_label} - Registered Account Growth (Info Only)")

    st.info("These balances are for informational purposes only. Growth is not taxed until withdrawal.")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("**RRIF Balance**")
        col_a, col_b = st.columns(2)
        with col_a:
            rrif_balance = st.number_input(
                "RRIF Balance",
                min_value=0.0,
                step=1000.0,
                key=f"{person_id}_rrif_balance",
                **_valarg(f"{person_id}_rrif_balance", 0.0)
            )
        with col_b:
            rrif_growth = st.number_input(
                "YTD Growth",
                min_value=-100000.0,
                step=100.0,
                key=f"{person_id}_rrif_growth",
                **_valarg(f"{person_id}_rrif_growth", 0.0)
            )

    with col2:
        st.markdown("**RRSP Balance**")
        col_a, col_b = st.columns(2)
        with col_a:
            rrsp_balance = st.number_input(
                "RRSP Balance",
                min_value=0.0,
                step=1000.0,
                key=f"{person_id}_rrsp_balance",
                **_valarg(f"{person_id}_rrsp_balance", 0.0)
            )
        with col_b:
            rrsp_growth = st.number_input(
                "YTD Growth",
                min_value=-100000.0,
                step=100.0,
                key=f"{person_id}_rrsp_growth",
                **_valarg(f"{person_id}_rrsp_growth", 0.0)
            )

    with col3:
        st.markdown("**TFSA Balance**")
        col_a, col_b = st.columns(2)
        with col_a:
            tfsa_balance = st.number_input(
                "TFSA Balance",
                min_value=0.0,
                step=1000.0,
                key=f"{person_id}_tfsa_balance",
                **_valarg(f"{person_id}_tfsa_balance", 0.0)
            )
        with col_b:
            tfsa_growth = st.number_input(
                "YTD Growth",
                min_value=-100000.0,
                step=100.0,
                key=f"{person_id}_tfsa_growth",
                **_valarg(f"{person_id}_tfsa_growth", 0.0)
            )

    # Update data model
    person = st.session_state.actuals_household.get_person(person_id)
    person.registered_growth.rrif_balance = rrif_balance
    person.registered_growth.rrif_growth_ytd = rrif_growth
    person.registered_growth.rrsp_balance = rrsp_balance
    person.registered_growth.rrsp_growth_ytd = rrsp_growth
    person.registered_growth.tfsa_balance = tfsa_balance
    person.registered_growth.tfsa_growth_ytd = tfsa_growth


def render_tax_summary_dashboard():
    """Render complete tax calculation summary dashboard."""
    st.header("📊 Tax Calculation Summary - 2025 Alberta")

    # RRIF Income Splitting Control
    st.subheader("💡 RRIF Income Splitting (Tax Optimization)")
    st.info("""
    **RRIF Income Splitting Strategy:** If both spouses are age 65+, up to 50% of RRIF withdrawals
    can be split to the lower-income spouse, reducing household tax by 5-15%.

    Use the slider below to model the tax impact of income splitting.
    """)

    rrif_split_pct = st.slider(
        "RRIF Income Split Percentage (to lower-income spouse)",
        min_value=0,
        max_value=50,
        value=0,
        step=5,
        help="Percentage of total household RRIF withdrawals to assign to lower-income spouse for tax purposes",
        key="rrif_split_percentage"
    )

    # Calculate current household RRIF total
    p1_rrif = st.session_state.actuals_household.person1.registered_withdrawals.rrif_withdrawal
    p2_rrif = st.session_state.actuals_household.person2.registered_withdrawals.rrif_withdrawal
    total_household_rrif = p1_rrif + p2_rrif

    if total_household_rrif > 0 and rrif_split_pct > 0:
        rrif_split_amt = total_household_rrif * (rrif_split_pct / 100.0)
        st.success(f"""
        ✅ **Split Configuration:**
        - Total Household RRIF: ${total_household_rrif:,.0f}
        - Amount to split ({rrif_split_pct}%): ${rrif_split_amt:,.0f}
        - This will be reassigned to the lower-income spouse
        - Estimated tax savings: ${rrif_split_amt * 0.08:,.0f} - ${rrif_split_amt * 0.15:,.0f} (8-15% of split amount)
        """)

    st.divider()

    # Calculate taxes with RRIF income splitting
    calc = st.session_state.tax_calculator
    results = calc.calculate_household_tax(
        st.session_state.actuals_household,
        rrif_split_pct=rrif_split_pct
    )
    st.session_state.actuals_tax_results = results

    # Household overview
    st.subheader("Household Overview")
    col1, col2, col3, col4 = st.columns(4)

    household_totals = results["household_totals"]

    with col1:
        st.metric(
            "Total Gross Income",
            f"${household_totals['total_gross_income']:,.0f}"
        )

    with col2:
        st.metric(
            "Tax-Free Income",
            f"${household_totals['total_tax_free_income']:,.0f}"
        )

    with col3:
        st.metric(
            "Total Tax Payable",
            f"${household_totals['total_tax_payable']:,.0f}"
        )

    with col4:
        st.metric(
            "Effective Tax Rate",
            f"{household_totals['household_effective_rate']*100:.1f}%"
        )

    # Tax breakdown by component (new row)
    if household_totals.get('total_oas_clawback', 0) > 0 or household_totals.get('total_cpp_ei', 0) > 0:
        st.divider()
        st.subheader("Tax Payable Breakdown")
        col1, col2, col3, col4, col5 = st.columns(5)

        with col1:
            st.metric(
                "Income Tax",
                f"${household_totals['total_income_tax']:,.0f}"
            )

        with col2:
            st.metric(
                "CPP/EI",
                f"${household_totals['total_cpp_ei']:,.0f}"
            )

        with col3:
            oas_clawback = household_totals.get('total_oas_clawback', 0)
            if oas_clawback > 0:
                st.metric(
                    "OAS Clawback",
                    f"${oas_clawback:,.0f}"
                )
            else:
                st.metric(
                    "OAS Clawback",
                    f"$0"
                )

        with col4:
            st.text("")  # Spacer

        with col5:
            st.text("")  # Spacer

        if household_totals.get('total_oas_clawback', 0) > 0:
            st.info("""
            **OAS Clawback Explanation:**
            - OAS is 100% taxable income
            - When household net income > $93,454, OAS is clawed back at 15% on excess
            - This reduces OAS benefits received, not an additional tax bill
            - Capped at total OAS received
            """)

    # Detailed person breakdown
    st.subheader("Person 1 Tax Calculation")
    p1_results = results["person1"]

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Gross Income", f"${p1_results['gross_income']:,.0f}")
        st.metric("Taxable Income", f"${p1_results['taxable_income']:,.0f}")

    with col2:
        st.metric("Federal Tax", f"${p1_results['federal_tax']:,.0f}")
        st.metric("Alberta Tax", f"${p1_results['alberta_tax']:,.0f}")

    with col3:
        st.metric("Total Tax", f"${p1_results['total_tax_payable']:,.0f}")
        st.metric("Effective Rate", f"{p1_results['effective_rate']*100:.1f}%")

    # RRSP Contribution & Tax Savings
    if p1_results['rrsp_contribution'] > 0:
        st.subheader("💰 RRSP Contribution Deduction & Tax Savings")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric(
                "RRSP Contribution",
                f"${p1_results['rrsp_contribution']:,.0f}",
                help="Tax-deductible amount"
            )

        with col2:
            st.metric(
                "Tax Savings",
                f"${p1_results['rrsp_tax_savings']:,.0f}",
                f"@ {p1_results['marginal_rate']*100:.1f}%"
            )

        with col3:
            st.metric(
                "Taxable Income After Deduction",
                f"${p1_results['taxable_income_after_deduction']:,.0f}"
            )

        st.text(f"Taxable Income Before RRSP Deduction: ${p1_results['taxable_income_before_deduction']:,.0f}")
        st.caption("RRSP contributions reduce your taxable income $1 for $1, resulting in immediate tax savings at your marginal rate.")

    # Detailed breakdown
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Income Sources**")
        st.text(f"Direct Taxable Income: ${p1_results['gross_income'] - p1_results['tax_free_income'] - (p1_results['eligible_dividends'] + p1_results['non_eligible_dividends']):,.0f}")
        st.text(f"Eligible Dividends:   ${p1_results['eligible_dividends']:,.0f}")
        st.text(f"Non-Eligible Divs:    ${p1_results['non_eligible_dividends']:,.0f}")
        st.text(f"Tax-Free Income:      ${p1_results['tax_free_income']:,.0f}")

    with col2:
        st.markdown("**Tax Breakdown**")
        st.text(f"Federal (before DTC): ${p1_results['federal_tax_before_dtc']:,.0f}")
        st.text(f"Federal DTC:         -${p1_results['federal_dtc']:,.0f}")
        st.text(f"Alberta (before DTC): ${p1_results['alberta_tax_before_dtc']:,.0f}")
        st.text(f"Alberta DTC:         -${p1_results['alberta_dtc']:,.0f}")
        st.text(f"CPP + EI:            ${p1_results['total_cpp_ei']:,.0f}")
        if p1_results.get('oas_clawback', 0) > 0:
            st.text(f"OAS Clawback:        ${p1_results['oas_clawback']:,.0f}")
            st.caption("⚠️ OAS clawback applies when net income exceeds $93,454")

    # Person 2
    st.subheader("Person 2 Tax Calculation")
    p2_results = results["person2"]

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Gross Income", f"${p2_results['gross_income']:,.0f}")
        st.metric("Taxable Income", f"${p2_results['taxable_income']:,.0f}")

    with col2:
        st.metric("Federal Tax", f"${p2_results['federal_tax']:,.0f}")
        st.metric("Alberta Tax", f"${p2_results['alberta_tax']:,.0f}")

    with col3:
        st.metric("Total Tax", f"${p2_results['total_tax_payable']:,.0f}")
        st.metric("Effective Rate", f"{p2_results['effective_rate']*100:.1f}%")

    # RRSP Contribution & Tax Savings for Person 2
    if p2_results['rrsp_contribution'] > 0:
        st.subheader("💰 Person 2 - RRSP Contribution Deduction & Tax Savings")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric(
                "RRSP Contribution",
                f"${p2_results['rrsp_contribution']:,.0f}",
                help="Tax-deductible amount"
            )

        with col2:
            st.metric(
                "Tax Savings",
                f"${p2_results['rrsp_tax_savings']:,.0f}",
                f"@ {p2_results['marginal_rate']*100:.1f}%"
            )

        with col3:
            st.metric(
                "Taxable Income After Deduction",
                f"${p2_results['taxable_income_after_deduction']:,.0f}"
            )

    # Person 2 Detailed breakdown
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Income Sources**")
        st.text(f"Direct Taxable Income: ${p2_results['gross_income'] - p2_results['tax_free_income'] - (p2_results['eligible_dividends'] + p2_results['non_eligible_dividends']):,.0f}")
        st.text(f"Eligible Dividends:   ${p2_results['eligible_dividends']:,.0f}")
        st.text(f"Non-Eligible Divs:    ${p2_results['non_eligible_dividends']:,.0f}")
        st.text(f"Tax-Free Income:      ${p2_results['tax_free_income']:,.0f}")

    with col2:
        st.markdown("**Tax Breakdown**")
        st.text(f"Federal (before DTC): ${p2_results['federal_tax_before_dtc']:,.0f}")
        st.text(f"Federal DTC:         -${p2_results['federal_dtc']:,.0f}")
        st.text(f"Alberta (before DTC): ${p2_results['alberta_tax_before_dtc']:,.0f}")
        st.text(f"Alberta DTC:         -${p2_results['alberta_dtc']:,.0f}")
        st.text(f"CPP + EI:            ${p2_results['total_cpp_ei']:,.0f}")
        if p2_results.get('oas_clawback', 0) > 0:
            st.text(f"OAS Clawback:        ${p2_results['oas_clawback']:,.0f}")
            st.caption("⚠️ OAS clawback applies when net income exceeds $93,454")

    # Withholding tax reconciliation
    st.subheader("Withholding Tax Reconciliation")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Person 1 Withholding", f"${p1_results['existing_withholding']:,.0f}")

    with col2:
        st.metric("Person 2 Withholding", f"${p2_results['existing_withholding']:,.0f}")

    with col3:
        total_withholding = p1_results['existing_withholding'] + p2_results['existing_withholding']
        st.metric("Total Withholding", f"${total_withholding:,.0f}")

    # Balance (refund or owing)
    balance_status = household_totals['total_balance']

    if balance_status > 0:
        st.success(f"🎉 **Refund Expected: ${balance_status:,.0f}**")
    elif balance_status < 0:
        st.warning(f"⚠️ **Amount Owing: ${abs(balance_status):,.0f}**")
    else:
        st.info("✅ **No refund or balance owing**")


def render_save_load_section():
    """Render save/load UI for complete household actuals data."""
    st.divider()
    st.subheader("💾 Save & Load Household Data")
    st.markdown("Save your complete household (Person 1 & Person 2) actuals data to avoid re-entering it each session.")

    col1, col2, col3 = st.columns([2, 2, 1])

    # Save All Data Button
    with col1:
        if st.button("💾 Save All Data", use_container_width=True, key="save_all_button"):
            try:
                household = _collect_household_actuals_from_session_state()

                # Add household setup data from session state
                from actuals_tracker_data_model import HouseholdSetup
                household.setup = HouseholdSetup(
                    p1_name=st.session_state.get("p1_name", "Person 1"),
                    p1_age=int(st.session_state.get("p1_age", 65) or 65),
                    p1_cpp_start=int(st.session_state.get("p1_cpp_start", 65) or 65),
                    p1_oas_start=int(st.session_state.get("p1_oas_start", 65) or 65),
                    p2_name=st.session_state.get("p2_name", "Person 2"),
                    p2_age=int(st.session_state.get("p2_age", 62) or 62),
                    p2_cpp_start=int(st.session_state.get("p2_cpp_start", 65) or 65),
                    p2_oas_start=int(st.session_state.get("p2_oas_start", 65) or 65),
                    province=st.session_state.get("province", "Alberta"),
                    retirement_spend_target=float(st.session_state.get("retirement_spend_target", 0.0) or 0.0),
                    spending_go_go=float(st.session_state.get("spending_go_go", 120000.0) or 120000.0),
                    go_go_end_age=int(st.session_state.get("go_go_end_age", 74) or 74),
                    spending_slow_go=float(st.session_state.get("spending_slow_go", 80000.0) or 80000.0),
                    slow_go_end_age=int(st.session_state.get("slow_go_end_age", 84) or 84),
                    spending_no_go=float(st.session_state.get("spending_no_go", 70000.0) or 70000.0),
                    spending_inflation_pct=float(st.session_state.get("spending_inflation_pct", 2.0) or 2.0),
                    general_inflation_pct=float(st.session_state.get("general_inflation_pct", 3.0) or 3.0),
                    # Person 1 CPP/OAS amounts
                    p1_cpp_amt=float(st.session_state.get("p1_cpp_amt", 7000.0) or 7000.0),
                    p1_oas_amt=float(st.session_state.get("p1_oas_amt", 6000.0) or 6000.0),
                    # Person 1 Account balances
                    p1_rrsp=float(st.session_state.get("p1_rrsp", 0.0) or 0.0),
                    p1_rrif=float(st.session_state.get("p1_rrif", 150000.0) or 150000.0),
                    p1_tfsa=float(st.session_state.get("p1_tfsa", 160000.0) or 160000.0),
                    p1_nonreg=float(st.session_state.get("p1_nonreg", 400000.0) or 400000.0),
                    p1_corp=float(st.session_state.get("p1_corp", 1300000.0) or 1300000.0),
                    # Person 2 CPP/OAS amounts
                    p2_cpp_amt=float(st.session_state.get("p2_cpp_amt", 7000.0) or 7000.0),
                    p2_oas_amt=float(st.session_state.get("p2_oas_amt", 6000.0) or 6000.0),
                    # Person 2 Account balances
                    p2_rrsp=float(st.session_state.get("p2_rrsp", 0.0) or 0.0),
                    p2_rrif=float(st.session_state.get("p2_rrif", 150000.0) or 150000.0),
                    p2_tfsa=float(st.session_state.get("p2_tfsa", 160000.0) or 160000.0),
                    p2_nonreg=float(st.session_state.get("p2_nonreg", 400000.0) or 400000.0),
                    p2_corp=float(st.session_state.get("p2_corp", 1000000.0) or 1000000.0)
                )

                json_data = serialize_household_actuals(household)
                st.session_state.household_saved_data = json_data
                st.success("✅ Household data saved! (Setup + Person 1 & Person 2)")
            except Exception as e:
                st.error(f"❌ Error saving data: {str(e)}")

    # Load All Data File Uploader
    with col2:
        # Use on_change callback to handle file upload before widgets are fully instantiated
        def _on_file_uploaded():
            """Callback function triggered when file is uploaded."""
            if st.session_state.get("household_upload") is not None:
                try:
                    uploaded_file = st.session_state["household_upload"]
                    json_str = uploaded_file.read().decode("utf-8")
                    household = deserialize_household_actuals(json_str)

                    # Load all actuals data FIRST
                    _load_household_actuals_to_session_state(household)

                    # Restore household setup data to session state
                    if household.setup:
                        st.session_state["p1_name"] = household.setup.p1_name
                        st.session_state["p1_age"] = household.setup.p1_age
                        st.session_state["p1_cpp_start"] = household.setup.p1_cpp_start
                        st.session_state["p1_oas_start"] = household.setup.p1_oas_start
                        st.session_state["p2_name"] = household.setup.p2_name
                        st.session_state["p2_age"] = household.setup.p2_age
                        st.session_state["p2_cpp_start"] = household.setup.p2_cpp_start
                        st.session_state["p2_oas_start"] = household.setup.p2_oas_start
                        st.session_state["province"] = household.setup.province
                        st.session_state["retirement_spend_target"] = household.setup.retirement_spend_target
                        st.session_state["p1_start_age_input"] = household.setup.p1_age
                        st.session_state["p2_start_age_input"] = household.setup.p2_age

                        # Restore spending phases
                        st.session_state["spending_go_go"] = household.setup.spending_go_go
                        st.session_state["go_go_end_age"] = household.setup.go_go_end_age
                        st.session_state["spending_slow_go"] = household.setup.spending_slow_go
                        st.session_state["slow_go_end_age"] = household.setup.slow_go_end_age
                        st.session_state["spending_no_go"] = household.setup.spending_no_go

                        # Restore inflation rates
                        st.session_state["spending_inflation_pct"] = household.setup.spending_inflation_pct
                        st.session_state["general_inflation_pct"] = household.setup.general_inflation_pct

                        # Restore Person 1 CPP/OAS amounts
                        st.session_state["p1_cpp_amt"] = household.setup.p1_cpp_amt
                        st.session_state["p1_oas_amt"] = household.setup.p1_oas_amt
                        # Restore Person 1 Account balances
                        st.session_state["p1_rrsp"] = household.setup.p1_rrsp
                        st.session_state["p1_rrif"] = household.setup.p1_rrif
                        st.session_state["p1_tfsa"] = household.setup.p1_tfsa
                        st.session_state["p1_nonreg"] = household.setup.p1_nonreg
                        st.session_state["p1_corp"] = household.setup.p1_corp

                        # Restore Person 2 CPP/OAS amounts
                        st.session_state["p2_cpp_amt"] = household.setup.p2_cpp_amt
                        st.session_state["p2_oas_amt"] = household.setup.p2_oas_amt
                        # Restore Person 2 Account balances
                        st.session_state["p2_rrsp"] = household.setup.p2_rrsp
                        st.session_state["p2_rrif"] = household.setup.p2_rrif
                        st.session_state["p2_tfsa"] = household.setup.p2_tfsa
                        st.session_state["p2_nonreg"] = household.setup.p2_nonreg
                        st.session_state["p2_corp"] = household.setup.p2_corp

                    # Mark as loaded successfully (do NOT try to reset file uploader)
                    st.session_state["_load_success"] = True
                except Exception as e:
                    st.session_state["_load_error"] = str(e)

        st.file_uploader(
            "📁 Load All Data",
            type="json",
            key="household_upload",
            on_change=_on_file_uploaded,
            help="Upload a previously saved household actuals file"
        )

        # Show success/error messages AFTER file processing
        if st.session_state.get("_load_success"):
            st.success("✅ Household data loaded! (Setup + Person 1 & Person 2)")
            st.session_state["_load_success"] = False
            st.rerun()

        if st.session_state.get("_load_error"):
            st.error(f"❌ Error loading data: {st.session_state['_load_error']}")
            st.session_state["_load_error"] = None

    # Download saved data
    with col3:
        if "household_saved_data" in st.session_state:
            st.download_button(
                label="⬇️ Download",
                data=st.session_state.household_saved_data,
                file_name=f"household_actuals_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                use_container_width=True,
                help="Download complete household data"
            )
        else:
            st.info("💡 Click Save first")


def render_plan_vs_actual_summary():
    """
    Render Plan vs Actual summary section at top of Tracker.

    Shows high-level comparison of total income, total tax, and key metrics.
    """
    plan_2025 = st.session_state.get("plan_2025")
    if not plan_2025:
        return

    st.markdown("### 📊 Plan vs Actual Summary (2025)")
    st.markdown("Compare your Simulator plan with actual tracking. Variance analysis helps validate your retirement plan.")

    # Get actual values from session state
    household = _collect_household_actuals_from_session_state()

    # Calculate totals
    plan_total_income = (
        plan_2025.get("person1", {}).get("cpp_benefits", 0) +
        plan_2025.get("person1", {}).get("oas_benefits", 0) +
        plan_2025.get("person1", {}).get("nr_interest", 0) +
        plan_2025.get("person1", {}).get("nr_elig_div", 0) +
        plan_2025.get("person1", {}).get("nr_nonelig_div", 0) +
        plan_2025.get("person1", {}).get("nr_capital_gains", 0) +
        plan_2025.get("person1", {}).get("rrif_withdrawal", 0) +
        plan_2025.get("person2", {}).get("cpp_benefits", 0) +
        plan_2025.get("person2", {}).get("oas_benefits", 0) +
        plan_2025.get("person2", {}).get("nr_interest", 0) +
        plan_2025.get("person2", {}).get("nr_elig_div", 0) +
        plan_2025.get("person2", {}).get("nr_nonelig_div", 0) +
        plan_2025.get("person2", {}).get("nr_capital_gains", 0) +
        plan_2025.get("person2", {}).get("rrif_withdrawal", 0)
    )

    actual_total_income = (
        household.person1.government_benefits.cpp_benefits +
        household.person1.government_benefits.oas_benefits +
        household.person1.non_registered.interest +
        household.person1.non_registered.eligible_dividend +
        household.person1.non_registered.non_eligible_dividend +
        household.person1.non_registered.capital_gains +
        household.person1.registered_withdrawals.rrif_withdrawal +
        household.person2.government_benefits.cpp_benefits +
        household.person2.government_benefits.oas_benefits +
        household.person2.non_registered.interest +
        household.person2.non_registered.eligible_dividend +
        household.person2.non_registered.non_eligible_dividend +
        household.person2.non_registered.capital_gains +
        household.person2.registered_withdrawals.rrif_withdrawal
    )

    variance = calculate_variance(plan_total_income, actual_total_income)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "Plan Total Income",
            f"${plan_total_income:,.0f}",
            delta=None
        )

    with col2:
        st.metric(
            "Actual Total Income",
            f"${actual_total_income:,.0f}",
            delta=f"${variance['absolute']:,.0f}"
        )

    with col3:
        st.metric(
            "Variance %",
            f"{variance['percent']:.1f}%",
            delta=variance['status']
        )

    with col4:
        st.markdown(f"**Status:** {variance['indicator']} {variance['status']}")

    st.divider()


def render_government_benefits_comparison():
    """Render CPP and OAS plan vs actual comparison."""
    plan_2025 = st.session_state.get("plan_2025")
    if not plan_2025:
        return

    st.markdown("### 🏛️ Government Benefits")

    household = _collect_household_actuals_from_session_state()

    col1, col2 = st.columns(2)

    # Person 1 CPP
    with col1:
        st.markdown("#### Person 1 - CPP & OAS")

        plan_cpp_p1 = plan_2025.get("person1", {}).get("cpp_benefits", 0)
        actual_cpp_p1 = household.person1.government_benefits.cpp_benefits
        var_cpp = calculate_variance(plan_cpp_p1, actual_cpp_p1)

        st.markdown(f"**CPP Benefits**")
        st.text(f"Plan: ${plan_cpp_p1:,.0f} | Actual: ${actual_cpp_p1:,.0f}")
        st.text(f"{var_cpp['indicator']} {var_cpp['status']} ({var_cpp['percent']:.1f}%)")

        st.markdown(f"**OAS Benefits**")
        plan_oas_p1 = plan_2025.get("person1", {}).get("oas_benefits", 0)
        actual_oas_p1 = household.person1.government_benefits.oas_benefits
        var_oas = calculate_variance(plan_oas_p1, actual_oas_p1)

        st.text(f"Plan: ${plan_oas_p1:,.0f} | Actual: ${actual_oas_p1:,.0f}")
        st.text(f"{var_oas['indicator']} {var_oas['status']} ({var_oas['percent']:.1f}%)")

    # Person 2 CPP
    with col2:
        st.markdown("#### Person 2 - CPP & OAS")

        plan_cpp_p2 = plan_2025.get("person2", {}).get("cpp_benefits", 0)
        actual_cpp_p2 = household.person2.government_benefits.cpp_benefits
        var_cpp_p2 = calculate_variance(plan_cpp_p2, actual_cpp_p2)

        st.markdown(f"**CPP Benefits**")
        st.text(f"Plan: ${plan_cpp_p2:,.0f} | Actual: ${actual_cpp_p2:,.0f}")
        st.text(f"{var_cpp_p2['indicator']} {var_cpp_p2['status']} ({var_cpp_p2['percent']:.1f}%)")

        st.markdown(f"**OAS Benefits**")
        plan_oas_p2 = plan_2025.get("person2", {}).get("oas_benefits", 0)
        actual_oas_p2 = household.person2.government_benefits.oas_benefits
        var_oas_p2 = calculate_variance(plan_oas_p2, actual_oas_p2)

        st.text(f"Plan: ${plan_oas_p2:,.0f} | Actual: ${actual_oas_p2:,.0f}")
        st.text(f"{var_oas_p2['indicator']} {var_oas_p2['status']} ({var_oas_p2['percent']:.1f}%)")

    st.divider()


def render_investment_income_comparison():
    """Render investment income (non-registered and registered) plan vs actual comparison."""
    plan_2025 = st.session_state.get("plan_2025")
    if not plan_2025:
        return

    st.markdown("### 💰 Investment Income")

    household = _collect_household_actuals_from_session_state()

    col1, col2 = st.columns(2)

    # Person 1 Investment Income
    with col1:
        st.markdown("#### Person 1 - Non-Registered Income")

        # Interest
        plan_int_p1 = plan_2025.get("person1", {}).get("nr_interest", 0)
        actual_int_p1 = household.person1.non_registered.interest
        var_int = calculate_variance(plan_int_p1, actual_int_p1)
        st.text(f"Interest: ${actual_int_p1:,.0f} (Plan: ${plan_int_p1:,.0f}) {var_int['indicator']}")

        # Eligible Dividends
        plan_elig_p1 = plan_2025.get("person1", {}).get("nr_elig_div", 0)
        actual_elig_p1 = household.person1.non_registered.eligible_dividend
        var_elig = calculate_variance(plan_elig_p1, actual_elig_p1)
        st.text(f"Eligible Div: ${actual_elig_p1:,.0f} (Plan: ${plan_elig_p1:,.0f}) {var_elig['indicator']}")

        # Non-Eligible Dividends
        plan_nonelig_p1 = plan_2025.get("person1", {}).get("nr_nonelig_div", 0)
        actual_nonelig_p1 = household.person1.non_registered.non_eligible_dividend
        var_nonelig = calculate_variance(plan_nonelig_p1, actual_nonelig_p1)
        st.text(f"Non-Elig Div: ${actual_nonelig_p1:,.0f} (Plan: ${plan_nonelig_p1:,.0f}) {var_nonelig['indicator']}")

        # Capital Gains
        plan_cg_p1 = plan_2025.get("person1", {}).get("nr_capital_gains", 0)
        actual_cg_p1 = household.person1.non_registered.capital_gains
        var_cg = calculate_variance(plan_cg_p1, actual_cg_p1)
        st.text(f"Capital Gains: ${actual_cg_p1:,.0f} (Plan: ${plan_cg_p1:,.0f}) {var_cg['indicator']}")

    # Person 2 Investment Income
    with col2:
        st.markdown("#### Person 2 - Non-Registered Income")

        # Interest
        plan_int_p2 = plan_2025.get("person2", {}).get("nr_interest", 0)
        actual_int_p2 = household.person2.non_registered.interest
        var_int_p2 = calculate_variance(plan_int_p2, actual_int_p2)
        st.text(f"Interest: ${actual_int_p2:,.0f} (Plan: ${plan_int_p2:,.0f}) {var_int_p2['indicator']}")

        # Eligible Dividends
        plan_elig_p2 = plan_2025.get("person2", {}).get("nr_elig_div", 0)
        actual_elig_p2 = household.person2.non_registered.eligible_dividend
        var_elig_p2 = calculate_variance(plan_elig_p2, actual_elig_p2)
        st.text(f"Eligible Div: ${actual_elig_p2:,.0f} (Plan: ${plan_elig_p2:,.0f}) {var_elig_p2['indicator']}")

        # Non-Eligible Dividends
        plan_nonelig_p2 = plan_2025.get("person2", {}).get("nr_nonelig_div", 0)
        actual_nonelig_p2 = household.person2.non_registered.non_eligible_dividend
        var_nonelig_p2 = calculate_variance(plan_nonelig_p2, actual_nonelig_p2)
        st.text(f"Non-Elig Div: ${actual_nonelig_p2:,.0f} (Plan: ${plan_nonelig_p2:,.0f}) {var_nonelig_p2['indicator']}")

        # Capital Gains
        plan_cg_p2 = plan_2025.get("person2", {}).get("nr_capital_gains", 0)
        actual_cg_p2 = household.person2.non_registered.capital_gains
        var_cg_p2 = calculate_variance(plan_cg_p2, actual_cg_p2)
        st.text(f"Capital Gains: ${actual_cg_p2:,.0f} (Plan: ${plan_cg_p2:,.0f}) {var_cg_p2['indicator']}")

    st.divider()


def render_registered_withdrawals_comparison():
    """Render registered withdrawal plan vs actual comparison."""
    plan_2025 = st.session_state.get("plan_2025")
    if not plan_2025:
        return

    st.markdown("### 🏦 Registered Withdrawals")

    household = _collect_household_actuals_from_session_state()

    col1, col2 = st.columns(2)

    # Person 1 Withdrawals
    with col1:
        st.markdown("#### Person 1 - Withdrawals")

        # RRIF
        plan_rrif_p1 = plan_2025.get("person1", {}).get("rrif_withdrawal", 0)
        actual_rrif_p1 = household.person1.registered_withdrawals.rrif_withdrawal
        var_rrif = calculate_variance(plan_rrif_p1, actual_rrif_p1)
        st.text(f"RRIF: ${actual_rrif_p1:,.0f} (Plan: ${plan_rrif_p1:,.0f}) {var_rrif['indicator']}")

        # RRSP
        plan_rrsp_p1 = plan_2025.get("person1", {}).get("rrsp_withdrawal", 0)
        actual_rrsp_p1 = household.person1.registered_withdrawals.rrsp_withdrawal
        var_rrsp = calculate_variance(plan_rrsp_p1, actual_rrsp_p1)
        st.text(f"RRSP: ${actual_rrsp_p1:,.0f} (Plan: ${plan_rrsp_p1:,.0f}) {var_rrsp['indicator']}")

        # TFSA
        plan_tfsa_p1 = plan_2025.get("person1", {}).get("tfsa_withdrawal", 0)
        actual_tfsa_p1 = household.person1.registered_withdrawals.tfsa_withdrawal
        var_tfsa = calculate_variance(plan_tfsa_p1, actual_tfsa_p1)
        st.text(f"TFSA: ${actual_tfsa_p1:,.0f} (Plan: ${plan_tfsa_p1:,.0f}) {var_tfsa['indicator']}")

    # Person 2 Withdrawals
    with col2:
        st.markdown("#### Person 2 - Withdrawals")

        # RRIF
        plan_rrif_p2 = plan_2025.get("person2", {}).get("rrif_withdrawal", 0)
        actual_rrif_p2 = household.person2.registered_withdrawals.rrif_withdrawal
        var_rrif_p2 = calculate_variance(plan_rrif_p2, actual_rrif_p2)
        st.text(f"RRIF: ${actual_rrif_p2:,.0f} (Plan: ${plan_rrif_p2:,.0f}) {var_rrif_p2['indicator']}")

        # RRSP
        plan_rrsp_p2 = plan_2025.get("person2", {}).get("rrsp_withdrawal", 0)
        actual_rrsp_p2 = household.person2.registered_withdrawals.rrsp_withdrawal
        var_rrsp_p2 = calculate_variance(plan_rrsp_p2, actual_rrsp_p2)
        st.text(f"RRSP: ${actual_rrsp_p2:,.0f} (Plan: ${plan_rrsp_p2:,.0f}) {var_rrsp_p2['indicator']}")

        # TFSA
        plan_tfsa_p2 = plan_2025.get("person2", {}).get("tfsa_withdrawal", 0)
        actual_tfsa_p2 = household.person2.registered_withdrawals.tfsa_withdrawal
        var_tfsa_p2 = calculate_variance(plan_tfsa_p2, actual_tfsa_p2)
        st.text(f"TFSA: ${actual_tfsa_p2:,.0f} (Plan: ${plan_tfsa_p2:,.0f}) {var_tfsa_p2['indicator']}")

    st.divider()


def render_tax_comparison():
    """Render tax plan vs actual comparison."""
    plan_2025 = st.session_state.get("plan_2025")
    if not plan_2025:
        return

    st.markdown("### 💰 Tax Comparison")

    # Get calculated tax from Tracker
    household = _collect_household_actuals_from_session_state()

    # Calculate actual tax from Tracker (uses the tax calculator)
    from actuals_tracker_calculations import ComprehensiveTaxCalculator
    calculator = ComprehensiveTaxCalculator()
    results = calculator.calculate_household_tax(household)

    # Extract actual tax values
    actual_total_tax = results.get("household_totals", {}).get("total_tax_payable", 0)
    actual_fed_tax = results.get("household_totals", {}).get("federal_tax", 0)
    actual_prov_tax = results.get("household_totals", {}).get("provincial_tax", 0)

    # Plan tax values
    plan_total_tax = plan_2025.get("household_total_tax", 0)
    plan_fed_tax = plan_2025.get("household_federal_tax", 0)
    plan_prov_tax = plan_2025.get("household_provincial_tax", 0)

    col1, col2, col3 = st.columns(3)

    # Total Tax
    with col1:
        st.markdown("**Total Tax**")
        var_total = calculate_variance(plan_total_tax, actual_total_tax)
        st.metric(
            "Plan vs Actual",
            f"${actual_total_tax:,.0f}",
            delta=f"${var_total['absolute']:,.0f} ({var_total['percent']:.1f}%)",
            delta_color="normal"
        )
        st.caption(f"Plan: ${plan_total_tax:,.0f}")
        st.text(f"{var_total['indicator']} {var_total['status']}")

    # Federal Tax
    with col2:
        st.markdown("**Federal Tax**")
        var_fed = calculate_variance(plan_fed_tax, actual_fed_tax)
        st.metric(
            "Plan vs Actual",
            f"${actual_fed_tax:,.0f}",
            delta=f"${var_fed['absolute']:,.0f} ({var_fed['percent']:.1f}%)",
            delta_color="normal"
        )
        st.caption(f"Plan: ${plan_fed_tax:,.0f}")
        st.text(f"{var_fed['indicator']} {var_fed['status']}")

    # Provincial Tax
    with col3:
        st.markdown("**Provincial Tax**")
        var_prov = calculate_variance(plan_prov_tax, actual_prov_tax)
        st.metric(
            "Plan vs Actual",
            f"${actual_prov_tax:,.0f}",
            delta=f"${var_prov['absolute']:,.0f} ({var_prov['percent']:.1f}%)",
            delta_color="normal"
        )
        st.caption(f"Plan: ${plan_prov_tax:,.0f}")
        st.text(f"{var_prov['indicator']} {var_prov['status']}")

    # Person-level tax comparison
    st.markdown("**Tax by Person**")
    col_p1, col_p2 = st.columns(2)

    with col_p1:
        st.markdown("#### Person 1 Tax")
        plan_tax_p1 = plan_2025.get("person1", {}).get("total_tax", 0)
        actual_tax_p1 = results.get("person1", {}).get("total_tax_payable", 0)
        var_tax_p1 = calculate_variance(plan_tax_p1, actual_tax_p1)
        st.text(f"Plan: ${plan_tax_p1:,.0f}")
        st.text(f"Actual: ${actual_tax_p1:,.0f}")
        st.text(f"{var_tax_p1['indicator']} {var_tax_p1['status']} ({var_tax_p1['percent']:.1f}%)")

    with col_p2:
        st.markdown("#### Person 2 Tax")
        plan_tax_p2 = plan_2025.get("person2", {}).get("total_tax", 0)
        actual_tax_p2 = results.get("person2", {}).get("total_tax_payable", 0)
        var_tax_p2 = calculate_variance(plan_tax_p2, actual_tax_p2)
        st.text(f"Plan: ${plan_tax_p2:,.0f}")
        st.text(f"Actual: ${actual_tax_p2:,.0f}")
        st.text(f"{var_tax_p2['indicator']} {var_tax_p2['status']} ({var_tax_p2['percent']:.1f}%)")

    st.divider()


def render_actuals_tracker_section():
    """Main UI orchestration for Actuals Tracker."""

    # Initialize session state
    init_actuals_tracker_session_state()

    st.title("📈 2025 Comprehensive Actuals Tracker")
    st.markdown("""
    Track all household income sources for 2025 with complete tax treatment for Alberta.
    Includes employment, non-registered investments, registered withdrawals, and corporate distributions.
    """)

    # Create tabs
    tabs = st.tabs([
        "👤 Person 1",
        "👥 Person 2",
        "📊 Tax Summary",
        "📊 Plan vs Actual",
        "💡 Q1 2026 Guide"
    ])

    # Person 1 Tab
    with tabs[0]:
        st.markdown("### Complete Income Tracking - Person 1")

        sub_tabs = st.tabs([
            "Employment (T4)",
            "Non-Registered",
            "Registered Withdrawals",
            "Corporate Dist.",
            "Account Growth"
        ])

        with sub_tabs[0]:
            render_employment_income_inputs("p1", "Person 1")

        with sub_tabs[1]:
            render_non_registered_income_inputs("p1", "Person 1")

        with sub_tabs[2]:
            render_registered_withdrawal_inputs("p1", "Person 1")

        with sub_tabs[3]:
            render_corporate_distribution_inputs("p1", "Person 1")

        with sub_tabs[4]:
            render_registered_growth_inputs("p1", "Person 1")

    # Person 2 Tab
    with tabs[1]:
        st.markdown("### Complete Income Tracking - Person 2")

        sub_tabs = st.tabs([
            "Employment (T4)",
            "Non-Registered",
            "Registered Withdrawals",
            "Corporate Dist.",
            "Account Growth"
        ])

        with sub_tabs[0]:
            render_employment_income_inputs("p2", "Person 2")

        with sub_tabs[1]:
            render_non_registered_income_inputs("p2", "Person 2")

        with sub_tabs[2]:
            render_registered_withdrawal_inputs("p2", "Person 2")

        with sub_tabs[3]:
            render_corporate_distribution_inputs("p2", "Person 2")

        with sub_tabs[4]:
            render_registered_growth_inputs("p2", "Person 2")

    # Tax Summary Tab
    with tabs[2]:
        render_tax_summary_dashboard()

    # Plan vs Actual Tab
    with tabs[3]:
        st.header("📊 Plan vs Actual Comparison")

        if st.session_state.get("plan_2025"):
            st.markdown("Compare your Simulator plan with actual tracking. Variance analysis helps validate your retirement plan.")
            render_plan_vs_actual_summary()
            render_government_benefits_comparison()
            render_investment_income_comparison()
            render_registered_withdrawals_comparison()
            render_tax_comparison()
        else:
            st.info("💡 Run the Simulator first to see Plan vs Actual comparison. The Simulator plan values will automatically appear here.")

    # Q1 2026 Guide Tab
    with tabs[4]:
        st.header("📅 Q1 2026 Reconciliation Guide")

        st.markdown("""
        ## Timeline for 2025 Tax Year Reconciliation

        ### January 2026
        - [ ] Receive T4 from all employers
        - [ ] Receive T3 from trusts/mutual funds
        - [ ] Receive T5 from investment accounts
        - [ ] Receive T5013 from partnerships
        - [ ] Receive slips from corporate distributions

        ### February 2026
        - [ ] Compile all income documents
        - [ ] Reconcile actuals against this tracker
        - [ ] Identify any discrepancies
        - [ ] Schedule accountant meeting

        ### March - April 2026
        - [ ] File Notice of Assessment (NOA)
        - [ ] Receive assessment notice
        - [ ] Reconcile tax payable vs. assessment
        - [ ] Plan for next tax year

        ### Key Documents to Verify
        1. **T4 Employment** - Salary, CPP, EI, tax withheld
        2. **T3 Trust** - Distributions, tax credits
        3. **T5 Investment** - Interest, dividends
        4. **T5013 Partnership** - Partnership income
        5. **Corporate Slips** - Dividend statements
        6. **Withholding Records** - RRIF/RRSP withdrawals
        7. **CDA Documentation** - CDA distributions (tax-free)
        """)

        st.info("""
        **Important:** This tracker shows provisional actuals. Final tax will be determined
        by your Notice of Assessment after CRA processes your return. Store all receipts
        and documentation for 6 years.
        """)

    # Save/Load Section (at the end for easy access)
    render_save_load_section()


# For standalone testing
if __name__ == "__main__":
    render_actuals_tracker_section()
