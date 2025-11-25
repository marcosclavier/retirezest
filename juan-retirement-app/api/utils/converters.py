"""
Convert between API models (Pydantic) and internal models (dataclasses).

This module bridges the REST API layer with the existing simulation engine.
"""

from api.models.requests import PersonInput, HouseholdInput
from api.models.responses import YearResult, SimulationSummary
from modules.models import Person, Household
import pandas as pd
import logging

logger = logging.getLogger(__name__)


def api_person_to_internal(api_person: PersonInput) -> Person:
    """
    Convert API PersonInput to internal Person dataclass.

    Handles conversion of:
    - Percentages to decimals (e.g., 2.5% → 0.025)
    - All field mappings

    Args:
        api_person: PersonInput from API request

    Returns:
        Person dataclass for simulation engine
    """

    return Person(
        name=api_person.name,
        start_age=api_person.start_age,

        # Government benefits
        cpp_start_age=api_person.cpp_start_age,
        cpp_annual_at_start=api_person.cpp_annual_at_start,
        oas_start_age=api_person.oas_start_age,
        oas_annual_at_start=api_person.oas_annual_at_start,

        # Account balances
        tfsa_balance=api_person.tfsa_balance,
        rrif_balance=api_person.rrif_balance,
        rrsp_balance=api_person.rrsp_balance,
        nonreg_balance=api_person.nonreg_balance,
        corporate_balance=api_person.corporate_balance,

        # Non-registered details
        nonreg_acb=api_person.nonreg_acb,
        nr_cash=api_person.nr_cash,
        nr_gic=api_person.nr_gic,
        nr_invest=api_person.nr_invest,

        # Convert percentages to decimals
        y_nr_cash_interest=api_person.y_nr_cash_interest / 100.0,
        y_nr_gic_interest=api_person.y_nr_gic_interest / 100.0,
        y_nr_inv_total_return=api_person.y_nr_inv_total_return / 100.0,
        y_nr_inv_elig_div=api_person.y_nr_inv_elig_div / 100.0,
        y_nr_inv_nonelig_div=api_person.y_nr_inv_nonelig_div / 100.0,
        y_nr_inv_capg=api_person.y_nr_inv_capg / 100.0,
        y_nr_inv_roc_pct=api_person.y_nr_inv_roc_pct / 100.0,

        nr_cash_pct=api_person.nr_cash_pct / 100.0,
        nr_gic_pct=api_person.nr_gic_pct / 100.0,
        nr_invest_pct=api_person.nr_invest_pct / 100.0,

        # Corporate details
        corp_cash_bucket=api_person.corp_cash_bucket,
        corp_gic_bucket=api_person.corp_gic_bucket,
        corp_invest_bucket=api_person.corp_invest_bucket,
        corp_rdtoh=api_person.corp_rdtoh,

        y_corp_cash_interest=api_person.y_corp_cash_interest / 100.0,
        y_corp_gic_interest=api_person.y_corp_gic_interest / 100.0,
        y_corp_inv_total_return=api_person.y_corp_inv_total_return / 100.0,
        y_corp_inv_elig_div=api_person.y_corp_inv_elig_div / 100.0,
        y_corp_inv_capg=api_person.y_corp_inv_capg / 100.0,

        corp_cash_pct=api_person.corp_cash_pct / 100.0,
        corp_gic_pct=api_person.corp_gic_pct / 100.0,
        corp_invest_pct=api_person.corp_invest_pct / 100.0,

        corp_dividend_type=api_person.corp_dividend_type,

        # TFSA room
        tfsa_room_start=api_person.tfsa_room_start,
        tfsa_room_annual_growth=api_person.tfsa_room_annual_growth,
    )


def api_household_to_internal(
    api_household: HouseholdInput,
    tax_cfg: dict
) -> Household:
    """
    Convert API HouseholdInput to internal Household dataclass.

    Args:
        api_household: HouseholdInput from API request
        tax_cfg: Tax configuration dictionary

    Returns:
        Household dataclass for simulation engine
    """

    return Household(
        p1=api_person_to_internal(api_household.p1),
        p2=api_person_to_internal(api_household.p2),

        province=api_household.province,
        start_year=api_household.start_year,
        end_age=api_household.end_age,

        strategy=api_household.strategy,

        spending_go_go=api_household.spending_go_go,
        go_go_end_age=api_household.go_go_end_age,
        spending_slow_go=api_household.spending_slow_go,
        slow_go_end_age=api_household.slow_go_end_age,
        spending_no_go=api_household.spending_no_go,

        spending_inflation=api_household.spending_inflation / 100.0,
        general_inflation=api_household.general_inflation / 100.0,

        gap_tolerance=api_household.gap_tolerance,
        tfsa_contribution_each=api_household.tfsa_contribution_each,
        reinvest_nonreg_dist=api_household.reinvest_nonreg_dist,
        income_split_rrif_fraction=api_household.income_split_rrif_fraction,
        hybrid_rrif_topup_per_person=api_household.hybrid_rrif_topup_per_person,
        stop_on_fail=api_household.stop_on_fail,
    )


def dataframe_to_year_results(df: pd.DataFrame) -> list[YearResult]:
    """
    Convert simulation DataFrame to list of YearResult models.

    Args:
        df: Pandas DataFrame from simulate() function

    Returns:
        List of YearResult Pydantic models for API response
    """

    results = []

    for _, row in df.iterrows():
        try:
            results.append(YearResult(
                year=int(row.get('year', 0)),
                age_p1=int(row.get('age_p1', 0)),
                age_p2=int(row.get('age_p2', 0)),

                # Inflows
                cpp_p1=float(row.get('cpp_p1', 0)),
                cpp_p2=float(row.get('cpp_p2', 0)),
                oas_p1=float(row.get('oas_p1', 0)),
                oas_p2=float(row.get('oas_p2', 0)),

                # Withdrawals (handle various column naming conventions)
                tfsa_withdrawal_p1=float(row.get('withdraw_tfsa_p1', row.get('tfsa_withdrawal_p1', 0))),
                tfsa_withdrawal_p2=float(row.get('withdraw_tfsa_p2', row.get('tfsa_withdrawal_p2', 0))),
                rrif_withdrawal_p1=float(row.get('withdraw_rrif_p1', row.get('rrif_withdrawal_p1', 0))),
                rrif_withdrawal_p2=float(row.get('withdraw_rrif_p2', row.get('rrif_withdrawal_p2', 0))),
                nonreg_withdrawal_p1=float(row.get('withdraw_nonreg_p1', row.get('nonreg_withdrawal_p1', 0))),
                nonreg_withdrawal_p2=float(row.get('withdraw_nonreg_p2', row.get('nonreg_withdrawal_p2', 0))),
                corporate_withdrawal_p1=float(row.get('withdraw_corp_p1', row.get('corporate_withdrawal_p1', 0))),
                corporate_withdrawal_p2=float(row.get('withdraw_corp_p2', row.get('corporate_withdrawal_p2', 0))),

                # Balances
                tfsa_balance_p1=float(row.get('end_tfsa_p1', row.get('tfsa_balance_p1', 0))),
                tfsa_balance_p2=float(row.get('end_tfsa_p2', row.get('tfsa_balance_p2', 0))),
                rrif_balance_p1=float(row.get('end_rrif_p1', row.get('rrif_balance_p1', 0))),
                rrif_balance_p2=float(row.get('end_rrif_p2', row.get('rrif_balance_p2', 0))),
                nonreg_balance_p1=float(row.get('end_nonreg_p1', row.get('nonreg_balance_p1', 0))),
                nonreg_balance_p2=float(row.get('end_nonreg_p2', row.get('nonreg_balance_p2', 0))),
                corporate_balance_p1=float(row.get('corp_p1', row.get('end_corp_p1', 0))),
                corporate_balance_p2=float(row.get('corp_p2', row.get('end_corp_p2', 0))),
                total_value=float(row.get('total_value', row.get('net_worth_end', 0))),

                # Tax
                taxable_income_p1=float(row.get('taxable_inc_p1', row.get('taxable_income_p1', 0))),
                taxable_income_p2=float(row.get('taxable_inc_p2', row.get('taxable_income_p2', 0))),
                total_tax_p1=float(row.get('tax_after_split_p1', row.get('tax_p1', 0))),
                total_tax_p2=float(row.get('tax_after_split_p2', row.get('tax_p2', 0))),
                total_tax=float(row.get('total_tax_after_split', row.get('total_tax', 0))),
                marginal_rate_p1=float(row.get('marginal_rate_p1', row.get('marginal_p1', 0))),
                marginal_rate_p2=float(row.get('marginal_rate_p2', row.get('marginal_p2', 0))),

                # Spending
                spending_need=float(row.get('spend_target_after_tax', row.get('spending_need', 0))),
                spending_met=float(row.get('spend_target_after_tax', row.get('spending_met', 0))),
                spending_gap=float(row.get('underfunded_after_tax', row.get('spending_gap', 0))),

                # Status
                plan_success=bool(row.get('plan_success', row.get('success', True))),
                failure_reason=row.get('failure_reason', None),
            ))
        except Exception as e:
            logger.warning(f"Error converting row {row.get('year', '?')}: {e}")
            continue

    return results


def calculate_simulation_summary(df: pd.DataFrame) -> SimulationSummary:
    """
    Calculate summary statistics from simulation DataFrame.

    Args:
        df: Pandas DataFrame from simulate() function

    Returns:
        SimulationSummary with aggregated metrics
    """

    if df.empty:
        return SimulationSummary(
            years_simulated=0,
            years_funded=0,
            success_rate=0.0,
            total_inflows=0,
            total_withdrawals=0,
            total_tax_paid=0,
            total_spending=0,
            final_estate_gross=0,
            final_estate_after_tax=0,
            avg_effective_tax_rate=0,
            avg_marginal_rate=0,
            first_failure_year=None,
            total_underfunded_years=0,
            total_underfunding=0,
        )

    years_simulated = len(df)
    years_funded = len(df[df['net_worth_end'] > 0]) if 'net_worth_end' in df.columns else years_simulated
    success_rate = years_funded / years_simulated if years_simulated > 0 else 0.0

    # Inflows and outflows
    total_inflows = (
        df[['cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2']].sum().sum()
        if all(col in df.columns for col in ['cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2'])
        else 0
    )

    # Use internal column names for withdrawals
    withdrawal_cols = []
    for account in ['tfsa', 'rrif', 'nonreg', 'corp']:
        for person in ['p1', 'p2']:
            col = f'withdraw_{account}_{person}'
            if col in df.columns:
                withdrawal_cols.append(col)

    total_withdrawals = df[withdrawal_cols].sum().sum() if withdrawal_cols else 0

    # Use total_tax_after_split for household total tax
    total_tax_paid = (
        df['total_tax_after_split'].sum()
        if 'total_tax_after_split' in df.columns
        else df['total_tax'].sum() if 'total_tax' in df.columns
        else 0
    )

    # Use spend_target_after_tax for spending
    total_spending = (
        df['spend_target_after_tax'].sum()
        if 'spend_target_after_tax' in df.columns
        else 0
    )

    # Final estate
    final_row = df.iloc[-1]
    final_estate_gross = final_row.get('net_worth_end', final_row.get('gross_legacy', 0))

    # Use after_tax_legacy if available, otherwise estimate at 75%
    final_estate_after_tax = final_row.get('after_tax_legacy', final_estate_gross * 0.75)

    # Tax rates
    total_income_cols = ['taxable_inc_p1', 'taxable_inc_p2']
    if all(col in df.columns for col in total_income_cols):
        total_income = df[total_income_cols].sum().sum()
        avg_effective_tax_rate = (
            (total_tax_paid / total_income)
            if total_income > 0
            else 0.0
        )
    else:
        avg_effective_tax_rate = 0.0

    avg_marginal_rate = (
        df['marginal_rate_p1'].mean()
        if 'marginal_rate_p1' in df.columns
        else 0.0
    )

    # Find first failure
    failure_col = 'plan_success' if 'plan_success' in df.columns else 'success'
    if failure_col in df.columns:
        failure_rows = df[df[failure_col] == False]
        first_failure_year = (
            int(failure_rows.iloc[0]['year'])
            if len(failure_rows) > 0
            else None
        )
    else:
        first_failure_year = None

    # Underfunding
    if 'spending_gap' in df.columns:
        total_underfunded_years = len(df[df['spending_gap'] > 0])
        total_underfunding = df['spending_gap'].sum()
    else:
        total_underfunded_years = 0
        total_underfunding = 0

    return SimulationSummary(
        years_simulated=years_simulated,
        years_funded=years_funded,
        success_rate=success_rate,
        total_inflows=total_inflows,
        total_withdrawals=total_withdrawals,
        total_tax_paid=total_tax_paid,
        total_spending=total_spending,
        final_estate_gross=final_estate_gross,
        final_estate_after_tax=final_estate_after_tax,
        avg_effective_tax_rate=avg_effective_tax_rate,
        avg_marginal_rate=avg_marginal_rate,
        first_failure_year=first_failure_year,
        total_underfunded_years=total_underfunded_years,
        total_underfunding=total_underfunding,
    )
