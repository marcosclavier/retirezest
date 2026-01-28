"""
Convert between API models (Pydantic) and internal models (dataclasses).

This module bridges the REST API layer with the existing simulation engine.
"""

from api.models.requests import PersonInput, HouseholdInput
from api.models.responses import (
    YearResult,
    SimulationSummary,
    EstateSummary,
    FiveYearPlanYear,
    SpendingAnalysis,
    KeyAssumptions,
    ChartData,
    ChartDataPoint,
    TaxableComponent,
)
from modules.models import Person, Household
from modules.benefits import gis_benefit
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

        # Real estate - rental income and property details
        rental_income_annual=api_person.rental_income_annual,
        has_primary_residence=api_person.has_primary_residence,
        primary_residence_value=api_person.primary_residence_value,
        primary_residence_purchase_price=api_person.primary_residence_purchase_price,
        primary_residence_mortgage=api_person.primary_residence_mortgage,
        primary_residence_monthly_payment=api_person.primary_residence_monthly_payment,
        plan_to_downsize=api_person.plan_to_downsize,
        downsize_year=api_person.downsize_year,
        downsize_new_home_cost=api_person.downsize_new_home_cost,
        downsize_is_principal_residence=api_person.downsize_is_principal_residence,
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

                # Government benefits - Inflows
                cpp_p1=float(row.get('cpp_p1', 0)),
                cpp_p2=float(row.get('cpp_p2', 0)),
                oas_p1=float(row.get('oas_p1', 0)),
                oas_p2=float(row.get('oas_p2', 0)),
                gis_p1=float(row.get('gis_p1', 0)),
                gis_p2=float(row.get('gis_p2', 0)),
                oas_clawback_p1=float(row.get('oas_clawback_p1', 0)),
                oas_clawback_p2=float(row.get('oas_clawback_p2', 0)),

                # Withdrawals (handle various column naming conventions)
                tfsa_withdrawal_p1=float(row.get('withdraw_tfsa_p1', row.get('tfsa_withdrawal_p1', 0))),
                tfsa_withdrawal_p2=float(row.get('withdraw_tfsa_p2', row.get('tfsa_withdrawal_p2', 0))),
                rrif_withdrawal_p1=float(row.get('withdraw_rrif_p1', row.get('rrif_withdrawal_p1', 0))),
                rrif_withdrawal_p2=float(row.get('withdraw_rrif_p2', row.get('rrif_withdrawal_p2', 0))),
                nonreg_withdrawal_p1=float(row.get('withdraw_nonreg_p1', row.get('nonreg_withdrawal_p1', 0))),
                nonreg_withdrawal_p2=float(row.get('withdraw_nonreg_p2', row.get('nonreg_withdrawal_p2', 0))),
                corporate_withdrawal_p1=float(row.get('withdraw_corp_p1', row.get('corporate_withdrawal_p1', 0))),
                corporate_withdrawal_p2=float(row.get('withdraw_corp_p2', row.get('corporate_withdrawal_p2', 0))),

                # Non-registered distributions (passive income)
                nonreg_distributions=float(
                    row.get('nr_interest_p1', 0) + row.get('nr_interest_p2', 0) +
                    row.get('nr_elig_div_p1', 0) + row.get('nr_elig_div_p2', 0) +
                    row.get('nr_nonelig_div_p1', 0) + row.get('nr_nonelig_div_p2', 0) +
                    row.get('nr_capg_dist_p1', 0) + row.get('nr_capg_dist_p2', 0)
                ),

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
    # Use plan_success field to count years where spending was fully met (not just net worth > 0)
    if 'plan_success' in df.columns:
        years_funded = len(df[df['plan_success'] == True])
    elif 'net_worth_end' in df.columns:
        years_funded = len(df[df['net_worth_end'] > 0])
    else:
        years_funded = years_simulated
    success_rate = years_funded / years_simulated if years_simulated > 0 else 0.0

    # === Government Benefits Totals ===
    total_cpp = 0.0
    total_oas = 0.0
    total_gis = 0.0
    total_oas_clawback = 0.0

    if 'cpp_p1' in df.columns:
        total_cpp += df['cpp_p1'].sum()
    if 'cpp_p2' in df.columns:
        total_cpp += df['cpp_p2'].sum()
    if 'oas_p1' in df.columns:
        total_oas += df['oas_p1'].sum()
    if 'oas_p2' in df.columns:
        total_oas += df['oas_p2'].sum()
    if 'gis_p1' in df.columns:
        total_gis += df['gis_p1'].sum()
    if 'gis_p2' in df.columns:
        total_gis += df['gis_p2'].sum()
    if 'oas_clawback_p1' in df.columns:
        total_oas_clawback += df['oas_clawback_p1'].sum()
    if 'oas_clawback_p2' in df.columns:
        total_oas_clawback += df['oas_clawback_p2'].sum()

    total_inflows = total_cpp + total_oas + total_gis
    total_government_benefits = total_cpp + total_oas + total_gis
    avg_annual_benefits = total_government_benefits / years_simulated if years_simulated > 0 else 0.0

    # === Withdrawals by Source ===
    total_rrif_withdrawn = 0.0
    total_nonreg_withdrawn = 0.0
    total_tfsa_withdrawn = 0.0
    total_corporate_withdrawn = 0.0

    for person in ['p1', 'p2']:
        rrif_col = f'withdraw_rrif_{person}'
        nonreg_col = f'withdraw_nonreg_{person}'
        tfsa_col = f'withdraw_tfsa_{person}'
        corp_col = f'withdraw_corp_{person}'

        if rrif_col in df.columns:
            total_rrif_withdrawn += df[rrif_col].sum()
        if nonreg_col in df.columns:
            total_nonreg_withdrawn += df[nonreg_col].sum()
        if tfsa_col in df.columns:
            total_tfsa_withdrawn += df[tfsa_col].sum()
        if corp_col in df.columns:
            total_corporate_withdrawn += df[corp_col].sum()

    total_withdrawals = total_rrif_withdrawn + total_nonreg_withdrawn + total_tfsa_withdrawn + total_corporate_withdrawn

    # Calculate percentages
    rrif_pct = (total_rrif_withdrawn / total_withdrawals * 100) if total_withdrawals > 0 else 0.0
    nonreg_pct = (total_nonreg_withdrawn / total_withdrawals * 100) if total_withdrawals > 0 else 0.0
    tfsa_pct = (total_tfsa_withdrawn / total_withdrawals * 100) if total_withdrawals > 0 else 0.0
    corporate_pct = (total_corporate_withdrawn / total_withdrawals * 100) if total_withdrawals > 0 else 0.0

    # === Tax Analysis ===
    total_tax_paid = (
        df['total_tax_after_split'].sum()
        if 'total_tax_after_split' in df.columns
        else df['total_tax'].sum() if 'total_tax' in df.columns
        else 0
    )

    tax_col = 'total_tax_after_split' if 'total_tax_after_split' in df.columns else 'total_tax'
    if tax_col in df.columns:
        highest_annual_tax = df[tax_col].max()
        lowest_annual_tax = df[tax_col].min()
    else:
        highest_annual_tax = 0.0
        lowest_annual_tax = 0.0

    # Use spend_target_after_tax for spending
    total_spending = (
        df['spend_target_after_tax'].sum()
        if 'spend_target_after_tax' in df.columns
        else 0
    )

    # Tax efficiency: lower is better (tax as % of total income + withdrawals)
    total_income_and_withdrawals = total_inflows + total_withdrawals
    tax_efficiency_rate = (total_tax_paid / total_income_and_withdrawals * 100) if total_income_and_withdrawals > 0 else 0.0

    # === Net Worth Analysis ===
    first_row = df.iloc[0]
    final_row = df.iloc[-1]

    initial_net_worth = float(first_row.get('net_worth_start', first_row.get('net_worth_end', 0)))
    final_net_worth = float(final_row.get('net_worth_end', 0))
    final_estate_gross = final_net_worth

    net_worth_change_pct = 0.0
    if initial_net_worth > 0:
        net_worth_change_pct = ((final_net_worth - initial_net_worth) / initial_net_worth) * 100

    if net_worth_change_pct > 5:
        net_worth_trend = "Growing"
    elif net_worth_change_pct < -5:
        net_worth_trend = "Declining"
    else:
        net_worth_trend = "Stable"

    # Use after_tax_legacy if available, otherwise estimate at 75%
    final_estate_after_tax = float(final_row.get('after_tax_legacy', final_estate_gross * 0.75))

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
        # Try underfunded_after_tax column
        if 'underfunded_after_tax' in df.columns:
            total_underfunded_years = len(df[df['underfunded_after_tax'] > 0])
            total_underfunding = df['underfunded_after_tax'].sum()
        else:
            total_underfunded_years = 0
            total_underfunding = 0

    # === Health Score Calculation ===
    health_score, health_rating, health_criteria = calculate_health_score(
        success_rate=success_rate,
        years_funded=years_funded,
        years_simulated=years_simulated,
        avg_effective_tax_rate=avg_effective_tax_rate,
        total_government_benefits=total_government_benefits,
        initial_net_worth=initial_net_worth,
        final_net_worth=final_net_worth,
    )

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
        # New fields
        initial_net_worth=initial_net_worth,
        final_net_worth=final_net_worth,
        net_worth_change_pct=net_worth_change_pct,
        net_worth_trend=net_worth_trend,
        total_cpp=total_cpp,
        total_oas=total_oas,
        total_gis=total_gis,
        total_oas_clawback=total_oas_clawback,
        total_government_benefits=total_government_benefits,
        avg_annual_benefits=avg_annual_benefits,
        total_rrif_withdrawn=total_rrif_withdrawn,
        total_nonreg_withdrawn=total_nonreg_withdrawn,
        total_tfsa_withdrawn=total_tfsa_withdrawn,
        total_corporate_withdrawn=total_corporate_withdrawn,
        rrif_pct_of_total=rrif_pct,
        nonreg_pct_of_total=nonreg_pct,
        tfsa_pct_of_total=tfsa_pct,
        corporate_pct_of_total=corporate_pct,
        highest_annual_tax=highest_annual_tax,
        lowest_annual_tax=lowest_annual_tax,
        tax_efficiency_rate=tax_efficiency_rate,
        health_score=health_score,
        health_rating=health_rating,
        health_criteria=health_criteria,
    )


def calculate_health_score(
    success_rate: float,
    years_funded: int,
    years_simulated: int,
    avg_effective_tax_rate: float,
    total_government_benefits: float,
    initial_net_worth: float,
    final_net_worth: float,
) -> tuple[int, str, dict]:
    """
    Calculate plan health score based on 5 criteria (20 points each, total 100).

    Criteria:
    1. Full period funded (100%)? - 20 points
    2. Adequate funding reserve (80%+ of period)? - 20 points
    3. Good tax efficiency (<25% rate)? - 20 points
    4. Government benefits available? - 20 points
    5. Growing net worth? - 20 points

    Returns:
        tuple: (score 0-100, rating string, criteria dict)

    Frontend expects this format for each criterion:
        {
            "score": number,      // Points earned (0-20)
            "max_score": number,  // Maximum points (20)
            "status": string,     // "Excellent", "Good", "Fair", "At Risk", "Poor"
            "description": string // Human-readable description
        }
    """
    criteria = {}
    score = 0

    def get_status(met: bool, points: int, max_points: int = 20) -> str:
        """Determine status based on points earned."""
        if points == max_points:
            return "Excellent"
        elif points >= max_points * 0.75:
            return "Good"
        elif points >= max_points * 0.5:
            return "Fair"
        elif points > 0:
            return "At Risk"
        else:
            return "Poor"

    # Criterion 1: Full period funded (graduated scoring based on success_rate)
    # Use bool() to convert numpy.bool_ to Python bool for JSON serialization
    full_period_funded = bool(success_rate >= 1.0)

    # Graduated scoring: penalize based on how short the plan falls
    if success_rate >= 1.0:
        points_earned = 20  # Perfect
    elif success_rate >= 0.95:
        points_earned = 18  # 1-2 years short
    elif success_rate >= 0.90:
        points_earned = 15  # 2-3 years short
    elif success_rate >= 0.85:
        points_earned = 12  # 3-5 years short
    elif success_rate >= 0.80:
        points_earned = 8   # 5-7 years short
    elif success_rate >= 0.70:
        points_earned = 4   # 7-10 years short
    else:
        points_earned = 0   # >10 years short

    criteria['full_period_funded'] = {
        'score': points_earned,
        'max_score': 20,
        'status': get_status(full_period_funded, points_earned),
        'description': f'Plan funds {success_rate*100:.0f}% of years ({years_funded}/{years_simulated})',
        # Legacy fields for backwards compatibility
        'met': full_period_funded,
        'points': points_earned,
    }
    score += points_earned

    # Criterion 2: Adequate funding reserve (80%+ of period) - graduated scoring
    adequate_reserve = bool(success_rate >= 0.80)

    # Graduated scoring for reserve adequacy
    if success_rate >= 0.95:
        points_earned = 20  # Excellent reserve
    elif success_rate >= 0.90:
        points_earned = 17  # Good reserve
    elif success_rate >= 0.85:
        points_earned = 14  # Fair reserve
    elif success_rate >= 0.80:
        points_earned = 10  # Minimal acceptable reserve
    elif success_rate >= 0.70:
        points_earned = 5   # Insufficient reserve
    else:
        points_earned = 0   # Critically low

    criteria['adequate_reserve'] = {
        'score': points_earned,
        'max_score': 20,
        'status': get_status(adequate_reserve, points_earned),
        'description': f'Funding reserve: {success_rate*100:.0f}% (target: 80%+)',
        # Legacy fields for backwards compatibility
        'met': adequate_reserve,
        'points': points_earned,
    }
    score += points_earned

    # Criterion 3: Good tax efficiency (<25% effective rate)
    good_tax_efficiency = bool(avg_effective_tax_rate < 0.25)
    points_earned = 20 if good_tax_efficiency else 0
    criteria['good_tax_efficiency'] = {
        'score': points_earned,
        'max_score': 20,
        'status': get_status(good_tax_efficiency, points_earned),
        'description': 'Effective tax rate under 25%',
        # Legacy fields for backwards compatibility
        'met': good_tax_efficiency,
        'points': points_earned,
    }
    score += points_earned

    # Criterion 4: Government benefits available
    has_benefits = bool(total_government_benefits > 0)
    points_earned = 20 if has_benefits else 0
    criteria['government_benefits'] = {
        'score': points_earned,
        'max_score': 20,
        'status': get_status(has_benefits, points_earned),
        'description': 'Receiving government benefits (CPP/OAS/GIS)',
        # Legacy fields for backwards compatibility
        'met': has_benefits,
        'points': points_earned,
    }
    score += points_earned

    # Criterion 5: Growing or stable net worth
    growing_net_worth = bool(final_net_worth >= initial_net_worth * 0.9)  # Allow 10% decline
    points_earned = 20 if growing_net_worth else 0
    criteria['growing_net_worth'] = {
        'score': points_earned,
        'max_score': 20,
        'status': get_status(growing_net_worth, points_earned),
        'description': 'Net worth maintained or growing',
        # Legacy fields for backwards compatibility
        'met': growing_net_worth,
        'points': points_earned,
    }
    score += points_earned

    # Determine rating based on score
    if score >= 80:
        rating = "Excellent"
    elif score >= 60:
        rating = "Good"
    elif score >= 40:
        rating = "Fair"
    else:
        rating = "At Risk"

    return score, rating, criteria


def calculate_estate_summary(df: pd.DataFrame, household) -> EstateSummary:
    """
    Calculate estate summary from final simulation year.

    Args:
        df: Simulation DataFrame
        household: Household object with account info

    Returns:
        EstateSummary with death tax projections, taxable components, and tips
    """
    if df.empty:
        return EstateSummary(
            gross_estate_value=0,
            taxes_at_death=0,
            after_tax_legacy=0,
            effective_tax_rate_at_death=0,
        )

    final_row = df.iloc[-1]

    # Get final balances
    rrif_balance = float(final_row.get('end_rrif_p1', 0)) + float(final_row.get('end_rrif_p2', 0))
    tfsa_balance = float(final_row.get('end_tfsa_p1', 0)) + float(final_row.get('end_tfsa_p2', 0))
    nonreg_balance = float(final_row.get('end_nonreg_p1', 0)) + float(final_row.get('end_nonreg_p2', 0))
    corporate_balance = float(final_row.get('corp_p1', final_row.get('end_corp_p1', 0))) + \
                        float(final_row.get('corp_p2', final_row.get('end_corp_p2', 0)))

    gross_estate_value = rrif_balance + tfsa_balance + nonreg_balance + corporate_balance

    # Estimate taxes at death with detailed breakdown
    marginal_rate = 0.35  # Conservative estimate for high-income final year

    # Build taxable components list
    taxable_components = []

    # RRIF: 100% taxed at marginal rate
    rrif_tax = rrif_balance * marginal_rate
    if rrif_balance > 0:
        taxable_components.append(TaxableComponent(
            account_type="RRIF/RRSP",
            balance_at_death=rrif_balance,
            taxable_inclusion_rate=100.0,
            estimated_tax=rrif_tax,
            description="Full balance included in final tax return at marginal rate"
        ))

    # TFSA: 0% tax
    tfsa_tax = 0.0
    if tfsa_balance > 0:
        taxable_components.append(TaxableComponent(
            account_type="TFSA",
            balance_at_death=tfsa_balance,
            taxable_inclusion_rate=0.0,
            estimated_tax=tfsa_tax,
            description="Tax-free transfer to beneficiaries"
        ))

    # NonReg: 50% inclusion on capital gains
    nonreg_gains_estimate = nonreg_balance * 0.5  # Assume 50% is gains
    nonreg_tax = nonreg_gains_estimate * 0.5 * marginal_rate  # 50% inclusion
    if nonreg_balance > 0:
        taxable_components.append(TaxableComponent(
            account_type="Non-Registered",
            balance_at_death=nonreg_balance,
            taxable_inclusion_rate=50.0,
            estimated_tax=nonreg_tax,
            description="Capital gains taxed at 50% inclusion rate (assumes ~50% of balance is gains)"
        ))

    # Corporate: taxed as dividend or wound up
    corporate_tax = corporate_balance * 0.5 * marginal_rate  # After CDA, ~50% taxable
    if corporate_balance > 0:
        taxable_components.append(TaxableComponent(
            account_type="Corporate",
            balance_at_death=corporate_balance,
            taxable_inclusion_rate=50.0,
            estimated_tax=corporate_tax,
            description="Taxed as capital dividend (CDA) or eligible dividend upon wind-up"
        ))

    taxes_at_death = rrif_tax + nonreg_tax + corporate_tax + tfsa_tax
    after_tax_legacy = gross_estate_value - taxes_at_death
    effective_tax_rate = (taxes_at_death / gross_estate_value * 100) if gross_estate_value > 0 else 0

    # Generate estate planning tips based on composition
    estate_planning_tips = []

    if rrif_balance > gross_estate_value * 0.3:
        estate_planning_tips.append(
            "Consider drawing down RRIF faster to reduce estate tax burden"
        )
    if tfsa_balance < gross_estate_value * 0.1 and tfsa_balance > 0:
        estate_planning_tips.append(
            "Maximize TFSA contributions - transfers to beneficiaries are tax-free"
        )
    if corporate_balance > gross_estate_value * 0.4:
        estate_planning_tips.append(
            "Consider corporate dividend payments to reduce taxable estate"
        )
    if nonreg_balance > gross_estate_value * 0.2:
        estate_planning_tips.append(
            "Review non-registered holdings for tax-loss harvesting opportunities"
        )
    if gross_estate_value > 1000000:
        estate_planning_tips.append(
            "Consider charitable giving strategies for additional tax benefits"
        )
    if not estate_planning_tips:
        estate_planning_tips.append(
            "Your estate is well-balanced across account types"
        )

    return EstateSummary(
        gross_estate_value=gross_estate_value,
        taxes_at_death=taxes_at_death,
        after_tax_legacy=after_tax_legacy,
        effective_tax_rate_at_death=effective_tax_rate,
        rrif_balance_at_death=rrif_balance,
        tfsa_balance_at_death=tfsa_balance,
        nonreg_balance_at_death=nonreg_balance,
        corporate_balance_at_death=corporate_balance,
        taxable_components=taxable_components,
        estate_planning_tips=estate_planning_tips,
    )


def extract_five_year_plan(df: pd.DataFrame) -> list[FiveYearPlanYear]:
    """
    Extract first 5 years of simulation as detailed withdrawal plan.

    Args:
        df: Simulation DataFrame

    Returns:
        List of FiveYearPlanYear for first 5 years
    """
    if df.empty:
        return []

    plan = []
    years_to_extract = min(5, len(df))

    for i in range(years_to_extract):
        row = df.iloc[i]

        # Get withdrawals by source
        rrif_p1 = float(row.get('withdraw_rrif_p1', 0))
        rrif_p2 = float(row.get('withdraw_rrif_p2', 0))
        nonreg_p1 = float(row.get('withdraw_nonreg_p1', 0))
        nonreg_p2 = float(row.get('withdraw_nonreg_p2', 0))
        tfsa_p1 = float(row.get('withdraw_tfsa_p1', 0))
        tfsa_p2 = float(row.get('withdraw_tfsa_p2', 0))
        corp_p1 = float(row.get('withdraw_corp_p1', 0))
        corp_p2 = float(row.get('withdraw_corp_p2', 0))

        total_p1 = rrif_p1 + nonreg_p1 + tfsa_p1 + corp_p1
        total_p2 = rrif_p2 + nonreg_p2 + tfsa_p2 + corp_p2

        spending_target = float(row.get('spend_target_after_tax', 0))

        plan.append(FiveYearPlanYear(
            year=int(row.get('year', 0)),
            age_p1=int(row.get('age_p1', 0)),
            age_p2=int(row.get('age_p2', 0)),
            spending_target=spending_target,
            spending_target_p1=spending_target / 2,  # Split evenly for now
            spending_target_p2=spending_target / 2,
            rrif_withdrawal_p1=rrif_p1,
            rrif_withdrawal_p2=rrif_p2,
            nonreg_withdrawal_p1=nonreg_p1,
            nonreg_withdrawal_p2=nonreg_p2,
            tfsa_withdrawal_p1=tfsa_p1,
            tfsa_withdrawal_p2=tfsa_p2,
            corp_withdrawal_p1=corp_p1,
            corp_withdrawal_p2=corp_p2,
            total_withdrawn_p1=total_p1,
            total_withdrawn_p2=total_p2,
            total_withdrawn=total_p1 + total_p2,
            net_worth_end=float(row.get('net_worth_end', 0)),
        ))

    return plan


def calculate_spending_analysis(df: pd.DataFrame, summary: SimulationSummary) -> SpendingAnalysis:
    """
    Calculate spending coverage and analysis metrics.

    Args:
        df: Simulation DataFrame
        summary: SimulationSummary with pre-calculated totals

    Returns:
        SpendingAnalysis with spending coverage metrics
    """
    if df.empty:
        return SpendingAnalysis(
            portfolio_withdrawals=0,
            government_benefits_total=0,
            total_spending_available=0,
            spending_target_total=0,
            spending_coverage_pct=0,
            avg_annual_spending=0,
            plan_status_text="No simulation data",
        )

    # Get totals from summary
    portfolio_withdrawals = summary.total_withdrawals
    government_benefits_total = summary.total_government_benefits

    # Total spending available = withdrawals + government benefits
    total_spending_available = portfolio_withdrawals + government_benefits_total

    # Spending target total
    spending_target_total = summary.total_spending

    # Coverage percentage
    spending_coverage_pct = (
        (total_spending_available / spending_target_total * 100)
        if spending_target_total > 0 else 100.0
    )

    # Average annual spending
    years_simulated = len(df)
    avg_annual_spending = spending_target_total / years_simulated if years_simulated > 0 else 0

    # Generate plan status text
    if summary.success_rate >= 1.0:
        final_age = int(df.iloc[-1].get('age_p1', 95))
        plan_status_text = f"Your plan is fully funded through age {final_age}"
    elif summary.first_failure_year:
        plan_status_text = f"Plan underfunded starting year {summary.first_failure_year}"
    else:
        pct = summary.success_rate * 100
        plan_status_text = f"Plan is {pct:.0f}% funded"

    return SpendingAnalysis(
        portfolio_withdrawals=portfolio_withdrawals,
        government_benefits_total=government_benefits_total,
        total_spending_available=total_spending_available,
        spending_target_total=spending_target_total,
        spending_coverage_pct=spending_coverage_pct,
        avg_annual_spending=avg_annual_spending,
        plan_status_text=plan_status_text,
    )


def extract_key_assumptions(
    household_input: HouseholdInput,
    df: pd.DataFrame
) -> KeyAssumptions:
    """
    Extract key assumptions used in the simulation.

    Args:
        household_input: Original API input with rates and settings
        df: Simulation DataFrame to determine projection period

    Returns:
        KeyAssumptions with all input parameters
    """
    # Projection period
    projection_period_years = len(df) if not df.empty else 0

    # Strategy name mapping for display
    strategy_names = {
        'corporate-optimized': 'Corporate Optimized',
        'minimize-income': 'Minimize Income',
        'rrif-splitting': 'RRIF Splitting',
        'capital-gains-optimized': 'Capital Gains Optimized',
        'tfsa-first': 'TFSA First',
        'balanced': 'Balanced',
        'manual': 'Manual',
    }

    province_names = {
        'AB': 'Alberta',
        'BC': 'British Columbia',
        'ON': 'Ontario',
        'QC': 'Quebec',
    }

    return KeyAssumptions(
        general_inflation_rate=household_input.general_inflation,
        spending_inflation_rate=household_input.spending_inflation,
        cpp_indexing_rate=household_input.general_inflation,  # CPP indexes at general inflation
        oas_indexing_rate=household_input.general_inflation,  # OAS indexes at general inflation
        projection_period_years=projection_period_years,
        tax_year_basis=household_input.start_year,
        province=province_names.get(household_input.province, household_input.province),
        withdrawal_strategy=strategy_names.get(household_input.strategy, household_input.strategy),
    )


def extract_chart_data(df: pd.DataFrame) -> ChartData:
    """
    Extract pre-computed chart data for frontend visualization.

    Args:
        df: Simulation DataFrame

    Returns:
        ChartData with year-by-year data points
    """
    if df.empty:
        return ChartData(data_points=[])

    data_points = []

    for _, row in df.iterrows():
        # Aggregate government benefits
        cpp_total = float(row.get('cpp_p1', 0)) + float(row.get('cpp_p2', 0))
        oas_total = float(row.get('oas_p1', 0)) + float(row.get('oas_p2', 0))
        gis_total = float(row.get('gis_p1', 0)) + float(row.get('gis_p2', 0))
        government_benefits_total = cpp_total + oas_total + gis_total

        # Aggregate balances (combined P1+P2)
        rrif_balance = float(row.get('end_rrif_p1', 0)) + float(row.get('end_rrif_p2', 0))
        tfsa_balance = float(row.get('end_tfsa_p1', 0)) + float(row.get('end_tfsa_p2', 0))
        nonreg_balance = float(row.get('end_nonreg_p1', 0)) + float(row.get('end_nonreg_p2', 0))
        corporate_balance = (
            float(row.get('corp_p1', row.get('end_corp_p1', 0))) +
            float(row.get('corp_p2', row.get('end_corp_p2', 0)))
        )
        net_worth = float(row.get('net_worth_end', 0))

        # Aggregate withdrawals
        rrif_withdrawal = float(row.get('withdraw_rrif_p1', 0)) + float(row.get('withdraw_rrif_p2', 0))
        nonreg_withdrawal = float(row.get('withdraw_nonreg_p1', 0)) + float(row.get('withdraw_nonreg_p2', 0))
        tfsa_withdrawal = float(row.get('withdraw_tfsa_p1', 0)) + float(row.get('withdraw_tfsa_p2', 0))
        corporate_withdrawal = float(row.get('withdraw_corp_p1', 0)) + float(row.get('withdraw_corp_p2', 0))

        # Tax data
        total_tax = float(row.get('total_tax_after_split', row.get('total_tax', 0)))
        taxable_income = float(row.get('taxable_inc_p1', 0)) + float(row.get('taxable_inc_p2', 0))
        effective_tax_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else 0

        # TFSA withdrawals are tax-free income
        tax_free_income = tfsa_withdrawal + gis_total

        # Spending data
        spending_target = float(row.get('spend_target_after_tax', 0))
        spending_met = float(row.get('spend_target_after_tax', 0)) - float(row.get('underfunded_after_tax', 0))
        spending_coverage_pct = (spending_met / spending_target * 100) if spending_target > 0 else 100

        data_points.append(ChartDataPoint(
            year=int(row.get('year', 0)),
            age_p1=int(row.get('age_p1', 0)),
            age_p2=int(row.get('age_p2', 0)),
            spending_target=spending_target,
            spending_met=spending_met,
            spending_coverage_pct=spending_coverage_pct,
            rrif_balance=rrif_balance,
            tfsa_balance=tfsa_balance,
            nonreg_balance=nonreg_balance,
            corporate_balance=corporate_balance,
            net_worth=net_worth,
            cpp_total=cpp_total,
            oas_total=oas_total,
            gis_total=gis_total,
            government_benefits_total=government_benefits_total,
            total_tax=total_tax,
            effective_tax_rate=effective_tax_rate,
            taxable_income=taxable_income,
            tax_free_income=tax_free_income,
            rrif_withdrawal=rrif_withdrawal,
            nonreg_withdrawal=nonreg_withdrawal,
            tfsa_withdrawal=tfsa_withdrawal,
            corporate_withdrawal=corporate_withdrawal,
        ))

    return ChartData(data_points=data_points)

def get_strategy_display_name(strategy_key: str) -> str:
    """
    Convert strategy key to user-friendly display name.

    Args:
        strategy_key: Strategy identifier (e.g., "corporate-optimized")

    Returns:
        Human-readable strategy name
    """
    strategy_names = {
        "corporate-optimized": "Corporate Optimized",
        "minimize-income": "Minimize Income",
        "rrif-splitting": "RRIF Splitting",
        "capital-gains-optimized": "Capital Gains Optimized",
        "tfsa-first": "TFSA First",
        "balanced": "Balanced",
        "manual": "Manual"
    }

    return strategy_names.get(strategy_key.lower(), strategy_key.title())
