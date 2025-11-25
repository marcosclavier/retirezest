# app.py — v3.0 (Modularized: Core logic extracted to modules/)
# Canada Retirement & Decumulation Simulator (Educational only)

import json
from typing import Dict, List, Tuple, Optional
import pandas as pd
import streamlit as st
import altair as alt
import random
import plotly.graph_objects as go
import numpy as np
import math
import sys
from datetime import datetime, timedelta
import plotly.express as px
from plotly.subplots import make_subplots

# Import modularized components
from modules.models import Person, Household, TaxParams, Bracket, YearResult
from modules.config import load_tax_config, get_tax_params, index_tax_params
from modules.tax_engine import progressive_tax
from modules.simulation import (
    rrif_min_factor, rrif_minimum, nonreg_distributions,
    corp_passive_income, apply_corp_dividend, cap_gain_ratio,
    simulate_year, simulate
)
from modules.benefits import (
    cpp_benefit, oas_benefit, oas_clawback, oas_after_clawback,
    combined_benefits, get_benefit_start_age_defaults
)
from modules.retirement_graphs import (
    create_spending_coverage_chart,
    create_account_depletion_chart,
    create_gov_benefits_chart,
    create_plan_funding_pct_chart,
    create_marginal_tax_rate_chart,
    create_income_composition_chart,
    create_household_inflows_chart,
    create_gis_optimization_chart
)
from modules.spending import (
    get_spending_phase, get_spending_amount,
    spending_with_inflation, calculate_phase_spending,
    spending_per_person, get_phase_thresholds
)
from modules.withdrawal_strategies import get_strategy
from utils.helpers import clamp, safe_get, safe_divide, years_funded_from_df, ensure_bucket_defaults
# Note: create_withdrawal_plan_table imported locally where used to avoid import issues
from utils.file_io import save_scenario, load_scenario, scenario_to_json_string, json_string_to_scenario, get_scenario_metadata

# Import Actuals Tracker 2025
from actuals_tracker_ui import render_actuals_tracker_section

# Import PDF export components
from ui.pdf_export import add_pdf_export_button, generate_pdf_automatically

# Import new results dashboard (Tab 1 - Executive Summary)
from ui.results_tabs import render_results_dashboard

# Import multiuser functionality
from models.database import SessionLocal
from modules.multiuser_db import save_scenario_to_db, load_scenario_from_db, list_user_scenarios, delete_scenario

st.set_page_config(page_title="Canada Retirement & Tax Simulator", layout="wide")

# ------------------------------ Authentication Check -----
# Redirect to login if user is not authenticated
if "user_id" not in st.session_state or not st.session_state.user_id:
    st.warning("⚠️ Please log in to access the simulator.")
    if st.button("📝 Go to Login Page"):
        st.switch_page("pages/02_Login.py")
    st.stop()

# ------------------------------ Database Session -----
# Initialize database connection for multiuser support
@st.cache_resource
def get_db():
    return SessionLocal()

db = get_db()

# ------------------------------ Session state init ------------------------------
if "sim_ready" not in st.session_state:
    st.session_state.sim_ready = False
    st.session_state.df = None
    st.session_state.hh = None
    st.session_state.tax_cfg = None
    st.session_state.custom_df = None
    st.session_state.mc_results_exist = False  # Track if Monte Carlo results are available
    # Initialize figures for PDF export
    st.session_state.fig_success = None
    st.session_state.fig_capacity = None

# Initialize all widget keys at TOP LEVEL (BEFORE any widgets render)
# This ensures session state keys exist when widgets are created
ss = st.session_state

# Person names
ss.setdefault("p1_name", "Juan")
ss.setdefault("p2_name", "Jane")

# Key form inputs (Scenario Setup tab)
ss.setdefault("start_year", 2025)
ss.setdefault("p1_age", 65)
ss.setdefault("p2_age", 65)
ss.setdefault("end_age_input", 95)
ss.setdefault("general_inflation_pct", 3.00)
ss.setdefault("spending_inflation_pct", 2.00)
ss.setdefault("spending_go_go", 120000.0)
ss.setdefault("go_go_end_age", 74)
ss.setdefault("spending_slow_go", 80000.0)
ss.setdefault("slow_go_end_age", 84)
ss.setdefault("spending_no_go", 70000.0)
ss.setdefault("tfsa_contribution_each", 7000.0)

# Person 1 Pension defaults (Account Balances tab)
ss.setdefault("p1_cpp_start", 70)
ss.setdefault("p1_cpp_amt", 7000)
ss.setdefault("p1_oas_start", 70)
ss.setdefault("p1_oas_amt", 6000)

# Person 1 Account Balance defaults
ss.setdefault("p1_rrsp", 0)
ss.setdefault("p1_rrif", 150000)
ss.setdefault("p1_tfsa", 160000)
ss.setdefault("p1_nonreg", 400000)
ss.setdefault("p1_corp", 1300000)
ss.setdefault("p1_nonreg_acb", 400000)
ss.setdefault("p1_tfsa_room", 0)
ss.setdefault("p1_tfsa_room_growth", 0)

# Person 1 Non-Registered Yield defaults (% per year)
ss.setdefault("p1_y_cash", 2.00)
ss.setdefault("p1_y_gic", 3.30)
ss.setdefault("p1_y_inv_total", 4.00)

# Person 2 Pension defaults (Account Balances tab)
ss.setdefault("p2_cpp_start", 70)
ss.setdefault("p2_cpp_amt", 7000)
ss.setdefault("p2_oas_start", 70)
ss.setdefault("p2_oas_amt", 6000)

# Person 2 Account Balance defaults
ss.setdefault("p2_rrsp", 0)
ss.setdefault("p2_rrif", 150000)
ss.setdefault("p2_tfsa", 160000)
ss.setdefault("p2_nonreg", 400000)
ss.setdefault("p2_corp", 1000000)
ss.setdefault("p2_nonreg_acb", 400000)
ss.setdefault("p2_tfsa_room", 0)
ss.setdefault("p2_tfsa_room_growth", 0)

# Person 2 Non-Registered Yield defaults (% per year)
ss.setdefault("p2_y_cash", 2.00)
ss.setdefault("p2_y_gic", 3.30)
ss.setdefault("p2_y_inv_total", 4.00)

# Monte Carlo simulation parameter defaults
ss.setdefault("mc_mu_rrif_sims", 0.05)
ss.setdefault("mc_mu_tfsa_sims", 0.05)
ss.setdefault("mc_mu_nonr_sims", 0.04)
ss.setdefault("mc_mu_corp_sims", 0.04)
ss.setdefault("mc_vol_rrif_sims", 0.10)
ss.setdefault("mc_vol_tfsa_sims", 0.10)
ss.setdefault("mc_vol_nonr_sims", 0.08)
ss.setdefault("mc_vol_corp_sims", 0.08)
ss.setdefault("opt_mc_runs", 300)
ss.setdefault("opt_mc_seed", 42)

# Optimizer weight parameters
ss.setdefault("w_success", 1.0)
ss.setdefault("w_legacy", 0.0)
ss.setdefault("w_tax", 0.0)
ss.setdefault("w_gap", 0.0)

# ----- Phase 3: Market Downturn Stress Scenarios (Risk Mitigation) -----
STRESS_SCENARIOS = {
    "baseline": {
        "name": "Baseline",
        "description": "Use your standard return assumptions (no stress)",
        "mu_adjustment": None,  # Use original mu/sigma
        "historical_parallel": "Normal market conditions",
        "years_affected": 30,
        "interpretation": "Reference scenario - all other scenarios compared to this"
    },
    "mild_recession": {
        "name": "Mild Recession (2015-16 Oil Downturn)",
        "description": "Moderate market dip (10-15% peak-to-trough)",
        "mu_adjustment": {
            "year_1": -0.10,      # Year 1: -10% return
            "year_2_3": -0.05,    # Years 2-3: -5% return each
            "year_4_plus": 0.07,  # Years 4+: +7% recovery
        },
        "historical_parallel": "Similar to 2015-2016 oil price crash; brief downturn, rapid recovery",
        "years_affected": 4,
        "interpretation": "Plan can tolerate mild recessions; brief impact on success rate"
    },
    "moderate_recession": {
        "name": "Moderate Recession (2020 COVID Crash)",
        "description": "Sharp market dip (20-25% drawdown) with faster recovery",
        "mu_adjustment": {
            "year_1": -0.20,      # Year 1: -20% return
            "year_2": -0.05,      # Year 2: -5% return
            "year_3_plus": 0.10,  # Years 3+: +10% recovery
        },
        "historical_parallel": "Similar to 2020 COVID crash; sharp downturn but rapid recovery",
        "years_affected": 3,
        "interpretation": "Plan moderately affected; recovery within 2-3 years"
    },
    "severe_recession": {
        "name": "Severe Recession (2008-09 Financial Crisis)",
        "description": "Major market crash (30-40% drawdown) with prolonged recovery",
        "mu_adjustment": {
            "year_1": -0.35,      # Year 1: -35% return (worst year)
            "year_2": -0.15,      # Year 2: -15% return (continued decline)
            "year_3_5": 0.12,     # Years 3-5: +12% recovery
            "year_6_plus": 0.08,  # Years 6+: +8% normal growth
        },
        "historical_parallel": "Similar to 2008-2009 financial crisis; major shock, 5-7 year recovery",
        "years_affected": 6,
        "interpretation": "Plan significantly impacted; prolonged recovery period; many plans fail"
    },
    "stagflation": {
        "name": "Stagflation (1970s-Style)",
        "description": "High inflation + low returns (worst combo: -5% returns, +8% inflation)",
        "mu_adjustment": {
            "all_years": -0.05,   # Negative real returns
        },
        "inflation_adjustment": 0.08,  # 8% inflation (up from baseline ~2%)
        "historical_parallel": "Similar to 1970s stagflation; persistent low returns, high spending",
        "years_affected": 5,
        "interpretation": "Worst-case scenario; erodes purchasing power; high risk"
    },
    "v_shaped": {
        "name": "V-Shaped Recovery (Rapid Bounce-Back)",
        "description": "Sharp crash followed by rapid recovery (bounce-back pattern)",
        "mu_adjustment": {
            "year_1": -0.40,      # Year 1: -40% sharp crash
            "year_2": 0.35,       # Year 2: +35% rapid recovery
            "year_3_plus": 0.08,  # Years 3+: +8% normal growth
        },
        "historical_parallel": "Similar to 2020 COVID or 1987 Black Monday; V-shaped recovery",
        "years_affected": 2,
        "interpretation": "Quick recovery helps; early crash still painful but short-lived"
    },
    "l_shaped": {
        "name": "L-Shaped Recovery (Prolonged Stagnation)",
        "description": "Initial crash followed by flat/low returns for years",
        "mu_adjustment": {
            "year_1": -0.25,      # Year 1: -25% crash
            "year_2_10": 0.02,    # Years 2-10: +2% flat recovery (no growth)
            "year_11_plus": 0.06, # Years 11+: +6% eventual recovery
        },
        "historical_parallel": "Similar to 2000-2010 lost decade; initial crash, stagnation",
        "years_affected": 10,
        "interpretation": "Worst recovery pattern; prolonged stagnation tests plan durability"
    },
    "double_dip": {
        "name": "Double-Dip Recession",
        "description": "Two separate downturns (e.g., 2001-2003 recession repeating)",
        "mu_adjustment": {
            "year_1_2": -0.15,    # Years 1-2: First downturn
            "year_3": 0.08,       # Year 3: Brief recovery
            "year_4_5": -0.12,    # Years 4-5: Second downturn
            "year_6_plus": 0.09,  # Years 6+: Recovery
        },
        "historical_parallel": "Similar to 2001-2003 recession (tech) + 2008-2009 (finance)",
        "years_affected": 5,
        "interpretation": "Multiple shocks test plan resilience; extended vulnerability period"
    },
}

# ----- Utility Functions -----

def calc_federal_tax_one_year(tax_cfg: dict, taxable_income: float, *, age: int = 90) -> float:
    """
    Single-year FEDERAL tax on a lump-sum 'taxable_income'.
    Uses progressive_tax with no dividends/cap-gains/OAS. Age kept high so age/pension credits logic can apply if relevant.
    """
    province_code = st.session_state.get("province", "AB")
    fed_params, _ = get_tax_params(tax_cfg, province_code)
    res = progressive_tax(
        fed_params, age,
        ordinary_income=float(taxable_income),
        elig_dividends=0.0,
        nonelig_dividends=0.0,
        cap_gains=0.0,          # if you need 50% CG inclusion, pass cap_gains in the caller instead
        pension_income=0.0,
        oas_received=0.0,
    )
    return float(res["net_tax"])

def capture_household_start_balances(hh, no_corp: bool = False) -> dict:
    """
    Build a consistent view of starting balances from the *inputs*, not from df.
    Returns a dict you can safely show in the UI.
    """
    p1 = hh.p1
    p2 = hh.p2

    # basic buckets — only the ones you actually collect in UI
    nonreg = float(getattr(p1, "nonreg_balance", 0.0) or 0.0) + float(getattr(p2, "nonreg_balance", 0.0) or 0.0)
    tfsa   = float(getattr(p1, "tfsa_balance", 0.0)   or 0.0) + float(getattr(p2, "tfsa_balance", 0.0)   or 0.0)
    rrsp   = float(getattr(p1, "rrsp_balance", 0.0)   or 0.0) + float(getattr(p2, "rrsp_balance", 0.0)   or 0.0)
    rrif   = float(getattr(p1, "rrif_balance", 0.0)   or 0.0) + float(getattr(p2, "rrif_balance", 0.0)   or 0.0)

    if no_corp:
        corp = 0.0
    else:
        corp = float(getattr(p1, "corporate_balance", 0.0) or 0.0) + float(getattr(p2, "corporate_balance", 0.0) or 0.0)

    total = nonreg + tfsa + rrsp + rrif + corp

    return {
        "nonreg": nonreg,
        "tfsa": tfsa,
        "rrsp": rrsp,
        "rrif": rrif,
        "corp": corp,
        "total": total,
    }

def calc_prov_tax_one_year(tax_cfg: dict, province_code: str, taxable_income: float, *, age: int = 90) -> float:
    """
    Single-year PROVINCIAL tax on a lump-sum 'taxable_income' for the given province_code.
    """
    _, prov_params = get_tax_params(tax_cfg, province_code)
    res = progressive_tax(
        prov_params, age,
        ordinary_income=float(taxable_income),
        elig_dividends=0.0,
        nonelig_dividends=0.0,
        cap_gains=0.0,
        pension_income=0.0,
        oas_received=0.0,
    )
    return float(res["net_tax"])


def summarize_mc_years_funded(mc_results: list[pd.DataFrame]) -> tuple[int,int,int]:
    ys = [years_funded_from_df(d) for d in mc_results]
    ys.sort()
    if not ys:
        return (0, 0, 0)
    n = len(ys)
    median = ys[n//2]
    p10    = ys[max(0, int(0.10*(n-1)))]
    p90    = ys[int(0.90*(n-1))]
    return (median, p10, p90)

# ----- RRIF Minimums -----
RRIF_FACTORS_UNDER_71 = {
    55: 0.0290, 56: 0.0292, 57: 0.0294, 58: 0.0296, 59: 0.0299,
    60: 0.0310, 61: 0.0323, 62: 0.0338, 63: 0.0353, 64: 0.0369,
    65: 0.0400, 66: 0.0417, 67: 0.0435, 68: 0.0455, 69: 0.0476,
    70: 0.0500
}
# RRIF functions now imported from modules.simulation

# ----- Clone utilities -----
def _clone_person(p: Person) -> Person:
    return Person(**{f: getattr(p, f) for f in p.__dataclass_fields__.keys()})

def _clone_household(hh):
    return Household(
        p1=_clone_person(hh.p1),
        p2=_clone_person(hh.p2),
        province=hh.province,
        start_year=hh.start_year,
        end_age=hh.end_age,
        spending_go_go=hh.spending_go_go,
        go_go_end_age=hh.go_go_end_age,
        spending_slow_go=hh.spending_slow_go,
        slow_go_end_age=hh.slow_go_end_age,
        spending_no_go=hh.spending_no_go,
        tfsa_contribution_each=hh.tfsa_contribution_each,
        income_split_rrif_fraction=hh.income_split_rrif_fraction,
        strategy=hh.strategy,
        hybrid_rrif_topup_per_person=hh.hybrid_rrif_topup_per_person,
        spending_inflation=hh.spending_inflation,
        general_inflation=hh.general_inflation,
        gap_tolerance=hh.gap_tolerance,
        reinvest_nonreg_dist=getattr(hh, "reinvest_nonreg_dist", False),
        stop_on_fail=hh.stop_on_fail
    )

# ------------------------------ Corp helpers ----------------------------
# Use in the creation of tables

def _get_results_df() -> Optional[pd.DataFrame]:
    df = st.session_state.get("df")
    if df is None or not hasattr(df, "copy") or getattr(df, "empty", True):
        return None
    return df


def extract_simulator_plan_2025(df_simulation, hh):
    """
    Extract year 2025 plan values from Simulator results.

    Stores plan values in session state for Tracker comparison.

    Args:
        df_simulation: DataFrame from simulate() function
        hh: Household object with parameters

    Returns:
        dict: Plan values for person1 and person2, or None if no 2025 data
    """
    try:
        # Filter for year 2025
        year_2025_data = df_simulation[df_simulation['year'] == 2025]

        if year_2025_data.empty:
            return None

        year_2025 = year_2025_data.iloc[0]

        # Extract plan values
        plan_2025 = {
            "year": 2025,
            "person1": {
                "cpp_benefits": float(year_2025.get('cpp_p1', 0) or 0),
                "oas_benefits": float(year_2025.get('oas_p1', 0) or 0),
                "gis_benefits": float(year_2025.get('gis_p1', 0) or 0),
                "nr_interest": float(year_2025.get('nr_interest_p1', 0) or 0),
                "nr_elig_div": float(year_2025.get('nr_elig_div_p1', 0) or 0),
                "nr_nonelig_div": float(year_2025.get('nr_nonelig_div_p1', 0) or 0),
                "nr_capital_gains": float(year_2025.get('nr_capg_dist_p1', 0) or 0),
                "rrif_withdrawal": float(year_2025.get('withdraw_rrif_p1', 0) or 0),
                "rrsp_withdrawal": float(year_2025.get('withdraw_rrsp_p1', 0) or 0),
                "tfsa_withdrawal": float(year_2025.get('withdraw_tfsa_p1', 0) or 0),
                "total_tax": float(year_2025.get('tax_p1', 0) or 0),
            },
            "person2": {
                "cpp_benefits": float(year_2025.get('cpp_p2', 0) or 0),
                "oas_benefits": float(year_2025.get('oas_p2', 0) or 0),
                "gis_benefits": float(year_2025.get('gis_p2', 0) or 0),
                "nr_interest": float(year_2025.get('nr_interest_p2', 0) or 0),
                "nr_elig_div": float(year_2025.get('nr_elig_div_p2', 0) or 0),
                "nr_nonelig_div": float(year_2025.get('nr_nonelig_div_p2', 0) or 0),
                "nr_capital_gains": float(year_2025.get('nr_capg_dist_p2', 0) or 0),
                "rrif_withdrawal": float(year_2025.get('withdraw_rrif_p2', 0) or 0),
                "rrsp_withdrawal": float(year_2025.get('withdraw_rrsp_p2', 0) or 0),
                "tfsa_withdrawal": float(year_2025.get('withdraw_tfsa_p2', 0) or 0),
                "total_tax": float(year_2025.get('tax_p2', 0) or 0),
            },
            "household_total": float(year_2025.get('total_inflows', 0) or 0),
            "household_total_tax": float(year_2025.get('total_tax_after_split', 0) or 0),
            "household_federal_tax": float(year_2025.get('tax_fed_total_after_split', 0) or 0),
            "household_provincial_tax": float(year_2025.get('tax_prov_total_after_split', 0) or 0),
        }

        return plan_2025

    except Exception as e:
        import traceback
        traceback.print_exc()
        return None


# apply_corp_dividend now imported from modules.simulation

#Format definition 2 decimals
def fmt_num(x, nd=0, prefix="", suffix=""):
    try:
        return f"{prefix}{x:,.{nd}f}{suffix}"
    except Exception:
        return str(x)
    
#Format definitions commas in thousands and period (except year)
def format_df_for_display(df, exclude=("year",), decimals=2):
    df2 = df.copy()
    # Convert age columns to integers to ensure no decimals
    # Handle both lowercase (age_p1) and display (Age P1) column names
    if "age_p1" in df2.columns:
        df2["age_p1"] = pd.to_numeric(df2["age_p1"], errors="coerce").fillna(0).astype(int)
    if "age_p2" in df2.columns:
        df2["age_p2"] = pd.to_numeric(df2["age_p2"], errors="coerce").fillna(0).astype(int)
    if "Age P1" in df2.columns:
        df2["Age P1"] = pd.to_numeric(df2["Age P1"], errors="coerce").fillna(0).astype(int)
    if "Age P2" in df2.columns:
        df2["Age P2"] = pd.to_numeric(df2["Age P2"], errors="coerce").fillna(0).astype(int)

    num_cols = [c for c in df2.select_dtypes(include=["number"]).columns if c not in exclude]
    # Format most columns with decimals, but format age columns as integers (no thousands separator)
    fmt = {}
    for c in num_cols:
        if c in ("age_p1", "age_p2", "Age P1", "Age P2"):
            fmt[c] = "{:d}"  # Pure integer format - no decimals, no commas
        else:
            fmt[c] = "{:,.%df}" % decimals  # Decimal format for other numbers

    # Apply format with special handling for age columns
    styled = df2.style.format(fmt)
    return styled


def get_nonreg_blended_yield(person_id: str) -> float:
    """
    Calculate blended non-registered yield from Tab 2 inputs and Advanced allocations.

    This function supports TWO workflows:

    1. Simple workflow (Tab 2 only):
       - User enters: Cash yield, GIC yield, Investment total return
       - Allocations default to: 0% cash, 0% GIC, 100% investments
       - Result: Blended = (cash% × cash_yield) + (gic% × gic_yield) + (inv% × inv_yield)

    2. Advanced workflow (Tab 3):
       - User also sets: Detailed bucket allocations (percentages)
       - Result: Same calculation with custom allocations

    Args:
        person_id: "p1" or "p2"

    Returns:
        Weighted average yield as float (e.g., 4.81 for 4.81%)
    """
    # Get yields from Tab 2 inputs (in %)
    cash_yield = float(st.session_state.get(f"{person_id}_y_cash", 2.00))
    gic_yield = float(st.session_state.get(f"{person_id}_y_gic", 3.30))
    inv_yield = float(st.session_state.get(f"{person_id}_y_inv_total", 4.00))

    # Get allocation PERCENTAGES from Advanced tab (defaults to 100% investments)
    # These are stored as percentages (0-100), not dollars
    cash_pct = float(st.session_state.get(f"{person_id}_nr_cash_pct", 0.0)) / 100.0
    gic_pct = float(st.session_state.get(f"{person_id}_nr_gic_pct", 0.0)) / 100.0
    inv_pct = float(st.session_state.get(f"{person_id}_nr_inv_pct", 100.0)) / 100.0

    # Normalize percentages in case they don't sum to 100%
    total_pct = cash_pct + gic_pct + inv_pct
    if total_pct > 0:
        cash_pct = cash_pct / total_pct
        gic_pct = gic_pct / total_pct
        inv_pct = inv_pct / total_pct
    else:
        # Default: all in investments
        inv_pct = 1.0

    # Calculate weighted blended yield
    # Formula: (cash% × cash_yield) + (gic% × gic_yield) + (inv% × inv_yield)
    blended = (cash_pct * cash_yield) + (gic_pct * gic_yield) + (inv_pct * inv_yield)

    return blended


def get_corp_blended_yield(person_id: str) -> float:
    """
    Calculate blended corporate yield from individual components.

    NOTE: Like non-registered, corporate yield components represent COMPOSITION of returns,
    not separate yields to be added.

    Corporate yields simplified: Cash, GIC, and combined Investment (dividends + capital gains).

    Args:
        person_id: "p1" or "p2"

    Returns:
        Weighted average yield as float (e.g., 3.00 for 3.00%)
    """
    # Get component yields (in %)
    cash = float(st.session_state.get(f"{person_id}_y_c_c", 0.00))
    gic = float(st.session_state.get(f"{person_id}_y_c_g", 3.00))
    inv_yield = float(st.session_state.get(f"{person_id}_y_c_i", 3.00))  # Combined dividends + capital gains

    # Get corporate bucket allocations (in dollars)
    corp_cash = float(st.session_state.get(f"{person_id}_c_c", 0.0))
    corp_gic = float(st.session_state.get(f"{person_id}_c_g", 0.0))
    corp_inv = float(st.session_state.get(f"{person_id}_c_i", 0.0))

    total_corp = corp_cash + corp_gic + corp_inv

    # If no corporate balance, just average the yields
    if total_corp <= 0:
        components = [cash, gic, inv_yield]
        non_zero = [c for c in components if c > 0]
        return sum(non_zero) / len(non_zero) if non_zero else 3.0

    # Calculate weighted average yield based on bucket allocations
    # Convert percentage yields to decimals by dividing by 100
    weighted = (
        (corp_cash * (cash / 100) + corp_gic * (gic / 100) + corp_inv * (inv_yield / 100)) / total_corp
    ) * 100

    return weighted


# Format in % but returned as fraction (default) or percent
def pct_input(
    label: str,
    key: str,
    default_pct: float = 0.0,   # e.g., 5.00 means 5%
    step: float = 0.10,
    fmt: str = "%.2f",
    *,
    return_fraction: bool = True,
    **number_kwargs,            # pass-through for min_value, max_value, help, etc.
):
    """
    - The widget stores the displayed PERCENT (e.g., 5.00) in st.session_state[key].
    - If return_fraction=True, returns 0.05 for a 5.00% entry; otherwise returns 5.00.
    - IMPORTANT: Always uses session state binding through key= parameter.
    - Ensures widget persists user values across app reruns.
    - NOTE: Session state keys are pre-initialized in _ensure_bucket_defaults().
    - CRITICAL: Always provide value= from session state if it exists, otherwise use default.
      This ensures loaded values are preserved and displayed correctly.
    """
    # Get value from session state or use default
    # Always read from current session state to ensure user edits are preserved
    current_ss_value = st.session_state.get(key, default_pct)

    widget_kwargs = {
        "step": float(step),
        "format": fmt,
        "key": key,
        "value": float(current_ss_value),  # Explicitly set value from current session state
    }

    widget_kwargs.update(number_kwargs)

    val_percent = st.number_input(label, **widget_kwargs)

    return float(val_percent) / 100.0 if return_fraction else float(val_percent)

# nonreg_distributions now imported from modules.simulation

# corp_passive_income now imported from modules.simulation
def compute_estate_tax_at_second_death(
    tax_cfg, province_code: str,
    rrsp_rrif_value: float,
    nonreg_value: float, nonreg_acb: float,
    corp_value: float,   corp_acb: float
) -> dict:
    """
    RRSP/RRIF fully included; capital gains on non-reg & corp at 50% inclusion.
    Uses your single-year fed/prov calculators (replace the two calls if named differently).
    """
    cg_nonreg = max(nonreg_value - max(nonreg_acb, 0.0), 0.0) * 0.5
    cg_corp   = max(corp_value   - max(corp_acb,   0.0), 0.0) * 0.5
    taxable_income = float(rrsp_rrif_value) + float(cg_nonreg) + float(cg_corp)

    fed_tax  = calc_federal_tax_one_year(tax_cfg, taxable_income)   # <-- use your function name
    prov_tax = calc_prov_tax_one_year(tax_cfg, province_code, taxable_income)  # <-- use your function name

    return {"taxable_income": taxable_income, "tax_fed": fed_tax, "tax_prov": prov_tax, "tax_total": fed_tax + prov_tax
    }
# --- Seed once per run, BEFORE any widgets are instantiated ---
def _ensure_bucket_defaults(no_corp_flag: bool):
        """Set defaults ONLY if the key is missing (prevents the Streamlit warning)."""
        ss = st.session_state

        # Clear any temporary loaded inflation values so they don't persist across app reruns
        # (These are used by the file loading logic to temporarily store values before
        # the top-level initialization runs)
        ss.pop("_loaded_spending_inflation_pct", None)
        ss.pop("_loaded_general_inflation_pct", None)

        # Spending phase defaults (will be overwritten by file loading if scenario is loaded)
        ss.setdefault("spending_go_go", 120000.0)
        ss.setdefault("go_go_end_age", 74)
        ss.setdefault("spending_slow_go", 80000.0)
        ss.setdefault("slow_go_end_age", 84)
        ss.setdefault("spending_no_go", 70000.0)
        ss.setdefault("tfsa_contribution_each", 7000.0)

        # P1 non-reg balances & yields
        ss.setdefault("p1_nr_cash", 0.0)
        ss.setdefault("p1_nr_gic", 0.0)
        ss.setdefault("p1_nr_inv", 0.0)
        ss.setdefault("p1_nonreg_acb", 400_000.0)
        ss.setdefault("p1_y_cash", 2.00)      # displayed percent
        ss.setdefault("p1_y_gic", 3.30)
        ss.setdefault("p1_y_inv_elig", 2.00)
        ss.setdefault("p1_y_inv_nonel", 0.00)
        ss.setdefault("p1_y_inv_cg", 2.00)
        ss.setdefault("p1_y_inv_roc", 0.00)

        # P2 non-reg balances & yields
        ss.setdefault("p2_nr_cash", 0.0)
        ss.setdefault("p2_nr_gic", 0.0)
        ss.setdefault("p2_nr_inv", 0.0)
        ss.setdefault("p2_nonreg_acb", 400_000.0)
        ss.setdefault("p2_y_cash", 2.00)
        ss.setdefault("p2_y_gic", 3.30)
        ss.setdefault("p2_y_inv_elig", 2.00)
        ss.setdefault("p2_y_inv_nonel", 0.00)
        ss.setdefault("p2_y_inv_cg", 2.00)
        ss.setdefault("p2_y_inv_roc", 0.00)

        # Global growth percents shown in the UI (percent values)
        ss.setdefault("p1_y_tfsa", 5.00)
        ss.setdefault("p1_y_rrif", 5.00)
        ss.setdefault("p1_y_rrsp", 5.00)
        ss.setdefault("p2_y_tfsa", 5.00)
        ss.setdefault("p2_y_rrif", 5.00)
        ss.setdefault("p2_y_rrsp", 5.00)

        # TFSA room params
        ss.setdefault("p1_tfsa_room", 0.0)
        ss.setdefault("p1_tfsa_room_growth", 7000)
        ss.setdefault("p2_tfsa_room", 0)
        ss.setdefault("p2_tfsa_room_growth", 7000)

        # Corporate (only if corp is enabled)
        if not no_corp_flag:
            ss.setdefault("p1_c_c", 0.0)
            ss.setdefault("p1_c_g", 0.0)
            ss.setdefault("p1_c_i", 0.0)
            ss.setdefault("p1_rdtoh", 0.0)
            ss.setdefault("p1_y_c_c", 0.00)
            ss.setdefault("p1_y_c_g", 3.00)
            ss.setdefault("p1_y_c_i", 5.00)  # Combined investment yield (dividends + capital gains)
            ss.setdefault("p1_y_c_i_elig", 3.00)
            ss.setdefault("p1_y_c_i_cg", 0.00)
            ss.setdefault("p1_corp_divtype", "non-eligible")

            ss.setdefault("p2_c_c", 0.0)
            ss.setdefault("p2_c_g", 0.0)
            ss.setdefault("p2_c_i", 0.0)
            ss.setdefault("p2_rdtoh", 0.0)
            ss.setdefault("p2_y_c_c", 0.00)
            ss.setdefault("p2_y_c_g", 3.00)
            ss.setdefault("p2_y_c_i", 5.00)  # Combined investment yield (dividends + capital gains)
            ss.setdefault("p2_y_c_i_elig", 3.00)
            ss.setdefault("p2_y_c_i_cg", 0.00)
            ss.setdefault("p2_corp_divtype", "non-eligible")

def hydrate(hh, enable_buckets: bool, no_corp: bool):
    # ---- Corporate dividend type (strings your engine expects) ----
    p1_divtype = st.session_state.get("p1_corp_divtype", "non-eligible")
    p2_divtype = st.session_state.get("p2_corp_divtype", "non-eligible")
    # normalize
    p1_divtype = "eligible" if str(p1_divtype).lower().startswith("elig") else "non-eligible"
    p2_divtype = "eligible" if str(p2_divtype).lower().startswith("elig") else "non-eligible"

    hh.p1.corp_dividend_type = p1_divtype
    hh.p2.corp_dividend_type = p2_divtype

    # ---- TFSA meta (room & growth) ----
    hh.p1.tfsa_room_start          = float(st.session_state.get("p1_tfsa_room", 0.0))
    hh.p1.tfsa_room_annual_growth  = float(st.session_state.get("p1_tfsa_room_growth", 7000.0))
    hh.p2.tfsa_room_start          = float(st.session_state.get("p2_tfsa_room", 0.0))
    hh.p2.tfsa_room_annual_growth  = float(st.session_state.get("p2_tfsa_room_growth", 7000.0))

    # ---- Global growth assumptions on registered accounts ----
    hh.p1.yield_tfsa_growth = float(st.session_state.get("p1_y_tfsa", 5.0)) / 100.0
    hh.p1.yield_rrif_growth = float(st.session_state.get("p1_y_rrif", 5.0)) / 100.0
    hh.p1.yield_rrsp_growth = float(st.session_state.get("p1_y_rrsp", 5.0)) / 100.0
    hh.p2.yield_tfsa_growth = float(st.session_state.get("p2_y_tfsa", 5.0)) / 100.0
    hh.p2.yield_rrif_growth = float(st.session_state.get("p2_y_rrif", 5.0)) / 100.0
    hh.p2.yield_rrsp_growth = float(st.session_state.get("p2_y_rrsp", 5.0)) / 100.0

        # ---- Buckets (only if enabled) ----
    if enable_buckets:
        _ensure_bucket_defaults(no_corp)

        # ---- Non-Registered Allocation ----
        # FIX: Allocate total Non-Registered balance to buckets based on percentages
        # Step 1: Get user input for total Non-Registered balance
        p1_nonreg_total = float(st.session_state.get("p1_nonreg", 0.0))
        p2_nonreg_total = float(st.session_state.get("p2_nonreg", 0.0))

        # Step 2: Get allocation percentages (from Advanced > Yields & Buckets tab)
        # These are stored as percentages (0-100), not decimals
        p1_cash_pct = float(st.session_state.get("p1_nr_cash_pct", 0.0)) / 100.0
        p1_gic_pct = float(st.session_state.get("p1_nr_gic_pct", 0.0)) / 100.0
        p1_inv_pct = float(st.session_state.get("p1_nr_invest_pct", 100.0)) / 100.0

        p2_cash_pct = float(st.session_state.get("p2_nr_cash_pct", 0.0)) / 100.0
        p2_gic_pct = float(st.session_state.get("p2_nr_gic_pct", 0.0)) / 100.0
        p2_inv_pct = float(st.session_state.get("p2_nr_invest_pct", 100.0)) / 100.0

        # Step 3: Normalize percentages in case they don't sum to 100%
        p1_total_pct = p1_cash_pct + p1_gic_pct + p1_inv_pct
        if p1_total_pct > 0:
            p1_cash_pct = p1_cash_pct / p1_total_pct
            p1_gic_pct = p1_gic_pct / p1_total_pct
            p1_inv_pct = p1_inv_pct / p1_total_pct
        else:
            # Default: 100% to investments
            p1_inv_pct = 1.0

        p2_total_pct = p2_cash_pct + p2_gic_pct + p2_inv_pct
        if p2_total_pct > 0:
            p2_cash_pct = p2_cash_pct / p2_total_pct
            p2_gic_pct = p2_gic_pct / p2_total_pct
            p2_inv_pct = p2_inv_pct / p2_total_pct
        else:
            # Default: 100% to investments
            p2_inv_pct = 1.0

        # Step 4: Calculate dollar amounts for each bucket and assign
        hh.p1.nr_cash    = p1_nonreg_total * p1_cash_pct
        hh.p1.nr_gic     = p1_nonreg_total * p1_gic_pct
        hh.p1.nr_invest  = p1_nonreg_total * p1_inv_pct

        hh.p2.nr_cash    = p2_nonreg_total * p2_cash_pct
        hh.p2.nr_gic     = p2_nonreg_total * p2_gic_pct
        hh.p2.nr_invest  = p2_nonreg_total * p2_inv_pct

        # Non-reg ACB (Adjusted Cost Base for tax calculations)
        hh.p1.nonreg_acb   = float(st.session_state.get("p1_nonreg_acb", p1_nonreg_total))
        hh.p2.nonreg_acb   = float(st.session_state.get("p2_nonreg_acb", p2_nonreg_total))

        # Non-reg yields (map to dataclass field names)
        # NOTE: Session state stores these as percentages (e.g., 2.0 for 2%),
        # but simulation expects decimals (0.02 for 2%)
        hh.p1.y_nr_cash_interest    = float(st.session_state.get("p1_y_cash", 2.0)) / 100.0
        hh.p1.y_nr_gic_interest     = float(st.session_state.get("p1_y_gic", 3.3)) / 100.0
        # Total return on investments (PRIMARY field for balance growth)
        hh.p1.y_nr_inv_total_return = float(st.session_state.get("p1_y_inv_total", 4.0)) / 100.0
        hh.p2.y_nr_inv_total_return = float(st.session_state.get("p2_y_inv_total", 4.0)) / 100.0

        # Tax component breakdown (used for income categorization and tax calculations)
        hh.p1.y_nr_inv_elig_div     = float(st.session_state.get("p1_y_inv_elig", 2.0)) / 100.0
        hh.p1.y_nr_inv_nonelig_div  = float(st.session_state.get("p1_y_inv_nonel", 0.0)) / 100.0
        hh.p1.y_nr_inv_capg         = float(st.session_state.get("p1_y_inv_cg", 2.0)) / 100.0
        hh.p1.y_nr_inv_roc_pct      = float(st.session_state.get("p1_y_inv_roc", 0.0)) / 100.0

        hh.p2.y_nr_cash_interest    = float(st.session_state.get("p2_y_cash", 2.0)) / 100.0
        hh.p2.y_nr_gic_interest     = float(st.session_state.get("p2_y_gic", 3.3)) / 100.0
        hh.p2.y_nr_inv_elig_div     = float(st.session_state.get("p2_y_inv_elig", 2.0)) / 100.0
        hh.p2.y_nr_inv_nonelig_div  = float(st.session_state.get("p2_y_inv_nonel", 0.0)) / 100.0
        hh.p2.y_nr_inv_capg         = float(st.session_state.get("p2_y_inv_cg", 2.0)) / 100.0
        hh.p2.y_nr_inv_roc_pct      = float(st.session_state.get("p2_y_inv_roc", 0.0)) / 100.0

        # Corporate buckets (skip if no_corp)
        if not no_corp:
            hh.p1.corp_cash_bucket    = float(st.session_state.get("p1_c_c", 0.0))
            hh.p1.corp_gic_bucket     = float(st.session_state.get("p1_c_g", 0.0))
            hh.p1.corp_invest_bucket  = float(st.session_state.get("p1_c_i", 0.0))
            hh.p1.corp_rdtoh          = float(st.session_state.get("p1_rdtoh", 0.0))
            # Convert percentages to decimals (session state stores percentages like 3.0 for 3%)
            hh.p1.y_corp_cash_interest = float(st.session_state.get("p1_y_c_c", 0.00)) / 100.0
            hh.p1.y_corp_gic_interest  = float(st.session_state.get("p1_y_c_g", 3.00)) / 100.0
            hh.p1.y_corp_inv_elig_div  = float(st.session_state.get("p1_y_c_i_elig", 3.00)) / 100.0
            hh.p1.y_corp_inv_capg      = float(st.session_state.get("p1_y_c_i_cg", 0.00)) / 100.0

            hh.p2.corp_cash_bucket    = float(st.session_state.get("p2_c_c", 0.0))
            hh.p2.corp_gic_bucket     = float(st.session_state.get("p2_c_g", 0.0))
            hh.p2.corp_invest_bucket  = float(st.session_state.get("p2_c_i", 0.0))
            hh.p2.corp_rdtoh          = float(st.session_state.get("p2_rdtoh", 0.0))
            # Convert percentages to decimals (session state stores percentages like 3.0 for 3%)
            hh.p2.y_corp_cash_interest = float(st.session_state.get("p2_y_c_c", 0.00)) / 100.0
            hh.p2.y_corp_gic_interest  = float(st.session_state.get("p2_y_c_g", 3.00)) / 100.0
            hh.p2.y_corp_inv_elig_div  = float(st.session_state.get("p2_y_c_i_elig", 3.00)) / 100.0
            hh.p2.y_corp_inv_capg      = float(st.session_state.get("p2_y_c_i_cg", 0.00)) / 100.0


def _normalize_strategy_for_engine(s: str) -> str:
    """Map UI label/variants to the exact strings your simulate() recognizes."""
    s = (s or "").strip()

    # canonical engine strings you expect simulate() to use:
    ENGINE = {
        "NonReg->RRIF->Corp->TFSA": "NonReg->RRIF->Corp->TFSA",
        "RRIF->Corp->NonReg->TFSA": "RRIF->Corp->NonReg->TFSA",
        "Corp->RRIF->NonReg->TFSA": "Corp->RRIF->NonReg->TFSA",
        "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA": "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
        "Balanced (Optimized for tax efficiency)": "Balanced (Optimized for tax efficiency)",
        "GIS-Optimized (NonReg->Corp->TFSA->RRIF)": "GIS-Optimized (NonReg->Corp->TFSA->RRIF)",
    }

    # also accept pretty arrows / spacing and collapse to ASCII
    s_ascii = (
        s.replace("—", "-")
         .replace("→", "->")
         .replace("  ", " ")
         .replace("  ", " ")
         .strip()
    )

    # map pretty UI labels to ASCII engine keys
    UI_TO_ENGINE = {
        "Strategy A - NonReg -> RRIF -> Corp -> TFSA": "NonReg->RRIF->Corp->TFSA",
        "Strategy B - RRIF -> Corp -> NonReg -> TFSA": "RRIF->Corp->NonReg->TFSA",
        "Strategy C - Corp -> RRIF -> NonReg -> TFSA": "Corp->RRIF->NonReg->TFSA",
        "Hybrid - (RRIF top-up first) -> NonReg -> Corp -> TFSA": "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
        "NonReg->RRIF->Corp->TFSA": "NonReg->RRIF->Corp->TFSA",
        "RRIF->Corp->NonReg->TFSA": "RRIF->Corp->NonReg->TFSA",
        "Corp->RRIF->NonReg->TFSA": "Corp->RRIF->NonReg->TFSA",
        "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA": "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
        "Balanced (Optimized for tax efficiency)": "Balanced (Optimized for tax efficiency)",
        "GIS-Optimized (NonReg->Corp->TFSA->RRIF)": "GIS-Optimized (NonReg->Corp->TFSA->RRIF)",
    }

    # try exact first, then normalized UI map
    if s in ENGINE:
        return s
    if s_ascii in UI_TO_ENGINE:
        return UI_TO_ENGINE[s_ascii]

    # last resort: heuristics on tokens
    toks = [t.strip() for t in s_ascii.split("->")]
    if len(toks) >= 4:
        guess = "->".join(toks[:4])
        if guess in ENGINE:
            return guess

    # fallback to a safe default (A)
    return "NonReg->RRIF->Corp->TFSA"     

# Recompute taxes after splitting


def recompute_tax(age, rrif_amt, add_rrif_delta, taxd, person, wself, fed_params, prov_params) -> tuple[float, float, float]:
    bd       = taxd.get("breakdown", {})
    ordinary = float(bd.get("nr_interest", 0.0))
    eligd    = float(bd.get("nr_elig_div", 0.0))
    noneligd = float(bd.get("nr_nonelig_div", 0.0))
    capg     = float(bd.get("nr_capg_dist", 0.0)) + float(bd.get("cg_from_sale", 0.0))

    oas     = float(taxd.get("oas", 0.0))
    cpp_amt = float(taxd.get("cpp", 0.0))

    # Add corporate dividends actually paid to THIS person in the recompute path
    corp_cash = float(wself.get("corp", 0.0))
    if corp_cash > 0.0:
        if getattr(person, "corp_dividend_type", "non-eligible") == "eligible":
            eligd += corp_cash
        else:
            noneligd += corp_cash

    pension_income_local = float(rrif_amt) + float(add_rrif_delta) + cpp_amt

    fed_res = progressive_tax(
        fed_params, age,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        pension_income=pension_income_local,
        oas_received=oas
    )
    prov_res = progressive_tax(
        prov_params, age,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        pension_income=pension_income_local,
        oas_received=oas
    )

    fed_tax  = float(fed_res.get("net_tax", 0.0))   # allow negative
    prov_tax = float(prov_res.get("net_tax", 0.0))  # allow negative

    # If your fed result exposes OAS clawback separately AND excludes it from net_tax, add it.
    if "oas_clawback" in fed_res and not bool(fed_res.get("_net_tax_includes_clawback", True)):
        fed_tax += max(float(fed_res.get("oas_clawback", 0.0)), 0.0)

    total = fed_tax + prov_tax
    return total, fed_tax, prov_tax


# ---------- Safe helpers ----------
def _series_safe(df, col, default_value=0.0):
    if col in df.columns:
        return pd.to_numeric(df[col], errors="coerce").fillna(default_value)
    # return a 0.0 series aligned to df.index
    return pd.Series([default_value] * len(df), index=df.index, dtype="float64")
    
def _split_household_col(df, colname, p1_key, p2_key):
    if colname in df.columns:
        s = pd.to_numeric(df[colname], errors="coerce").fillna(0.0)
    else:
        # Make a 0 series aligned with df
        s = pd.Series(0.0, index=df.index, dtype="float64")

    if p1_key not in df.columns and p2_key not in df.columns:
        half = s * 0.5
        df[p1_key] = half
        df[p2_key] = half

def _ensure_series(value, idx):
    """
    Take anything (Series / list-like / scalar) and return a pandas Series
    aligned to idx, with NaN replaced by 0.0.
    """
    # Case 1: its already a Series
    if isinstance(value, pd.Series):
        return value.reindex(idx).fillna(0.0)
    # Case 2: it's array like with same length
    try:
        if len(value) == len(idx):
            return pd.Series(value, index=idx).fillna(0.0)
    except Exception:
        pass

    # Case 3 scalar fallback
    return pd.Series(value, index=idx, dtype="float64").fillna(0.0)

        # --- new helper to coerce ANYTHING into a Series ---
def _col_or_zero(df, col):
    idx = df.index
    if col in df.columns:
        col_raw = pd.to_numeric(df[col], errors="coerce")
        return _ensure_series(col_raw, idx)
    else:
        return pd.Series(0.0, index=idx, dtype="float64")
 
def _last_safe(df_run, colname, default_val=0.0):
    try:
        val = df_run.iloc[-1][colname]
        if pd.isna(val):
            return default_val
        return float(val)
    except Exception:
        return default_val

def compute_after_tax_legacy(ending_row, hh, tax_cfg):
            """
            ending_row: last row of the simulation df (df.iloc[-1])
            hh: the Household used in that simulation
            tax_cfg: tax configuration dict

            Returns:
                after_tax_legacy (float)
                gross_legacy (float)
                est_final_tax (float)  # useful for debugging / display
            """

            # --- 1. Get balances at the end of plan ---
            end_rrif_p1  = float(ending_row.get("end_rrif_p1", 0.0))
            end_rrif_p2  = float(ending_row.get("end_rrif_p2", 0.0))
            end_tfsa_p1  = float(ending_row.get("end_tfsa_p1", 0.0))
            end_tfsa_p2  = float(ending_row.get("end_tfsa_p2", 0.0))
            end_nonreg_p1= float(ending_row.get("end_nonreg_p1", 0.0))
            end_nonreg_p2= float(ending_row.get("end_nonreg_p2", 0.0))
            end_corp_p1  = float(ending_row.get("end_corp_p1", 0.0))
            end_corp_p2  = float(ending_row.get("end_corp_p2", 0.0))

            gross_legacy = (
                end_rrif_p1 + end_rrif_p2 +
                end_tfsa_p1 + end_tfsa_p2 +
                end_nonreg_p1 + end_nonreg_p2 +
                end_corp_p1 + end_corp_p2
            )

            # --- 2. Figure out the terminal year / ages ---
            # We'll pretend "after last simulated year, both spouses pass".
            # We need the tax params in that terminal year to price the deemed disposition.
            terminal_year = int(ending_row.get("year", hh.start_year))
            years_since_start = terminal_year - hh.start_year

            province = hh.province
            fed_base, prov_base = get_tax_params(tax_cfg, province)

            # index brackets/credits to that future year
            fed_y  = index_tax_params(fed_base,  years_since_start, hh.general_inflation)
            prov_y = index_tax_params(prov_base, years_since_start, hh.general_inflation)

            # choose an age to use for credits/pension-splitting rules at death.
            # common simplification: use the OLDER spouse's age that year
            age1 = float(ending_row.get("age_p1", hh.p1.start_age + years_since_start))
            age2 = float(ending_row.get("age_p2", hh.p2.start_age + years_since_start))
            terminal_age_for_calc = max(age1, age2)

            # --- 3. Tax the RRIFs / RRSPs at full inclusion on death ---
            # In Canada, at second death, RRIF/RRSP value is fully taxable as ordinary
            # income on that terminal return (no rollover left). This is approximate but
            # directionally right.
            rrif_total = end_rrif_p1 + end_rrif_p2
            # We'll treat that as "pension_income" into progressive_tax.

            # --- 4. Tax the *unrealized* capital gains in non-registered and corp ---
            # Non-reg: deemed disposition, only the gain portion is taxable (50% inclusion).
            acb_p1 = float(ending_row.get("nonreg_acb_p1", 0.0))
            acb_p2 = float(ending_row.get("nonreg_acb_p2", 0.0))
            nonreg_gain_total = max(end_nonreg_p1 - acb_p1, 0.0) + max(end_nonreg_p2 - acb_p2, 0.0)
            # Corp: super rough. You *could* assume all corporate value comes out as a taxable dividend.
            corp_total = end_corp_p1 + end_corp_p2

            # We'll push three buckets into one "final return person":
            #  - ordinary income: RRIF + fully taxable portion of corp (we'll assume all is non-eligible dividend equivalent)
            #  - capital gains: deemed gains from non-reg
            #  - OAS/CPP = 0 because at death that year we don't care about pensions continuing
            #
            # You could refine corp: some of that could come out as capital dividend acct etc.,
            # but for planning this is fine.

            ordinary_income_final = rrif_total + corp_total
            cap_gains_final = nonreg_gain_total  # progressive_tax will 50%-include

            # Dividends in final year: we'll just ignore dividend credits at death to stay conservative,
            # or treat it as non-eligible dividend. Let's keep it simple: treat corp_total as ordinary income.
            elig_div_final = 0.0
            nonelig_div_final = 0.0

            # --- 5. Compute tax using progressive_tax for fed & prov ---
            fed_res  = progressive_tax(
                fed_y,
                age=terminal_age_for_calc,
                ordinary_income=ordinary_income_final,
                elig_dividends=elig_div_final,
                nonelig_dividends=nonelig_div_final,
                cap_gains=cap_gains_final,
                pension_income=0.0,
                oas_received=0.0,
            )
            prov_res = progressive_tax(
                prov_y,
                age=terminal_age_for_calc,
                ordinary_income=ordinary_income_final,
                elig_dividends=elig_div_final,
                nonelig_dividends=nonelig_div_final,
                cap_gains=cap_gains_final,
                pension_income=0.0,
                oas_received=0.0,
            )

            est_final_tax = float(fed_res["net_tax"] + prov_res["net_tax"])

            after_tax_legacy = max(gross_legacy - est_final_tax, 0.0)

            return after_tax_legacy, gross_legacy, est_final_tax
# cap_gain_ratio now imported from modules.simulation


# ----- Tax calculator for a candidate extra top-up (marginal search) -----
def tax_for(
    add_nonreg: float,
    add_rrif: float,
    add_corp_dividend: float,
    *,
    # current person context / cashflow context
    nonreg_balance: float,
    nonreg_acb: float,
    corp_dividend_type: str,
    nr_interest: float,
    nr_elig_div: float,
    nr_nonelig_div: float,
    nr_capg_dist: float,
    withdrawals_rrif_base: float,
    cpp_income: float,
    oas_income: float,
    age: int,
    fed_params,
    prov_params,
) -> float:
    """
    Returns household tax (federal + provincial) for this candidate incremental withdrawal mix.
    This mirrors the call signature to progressive_tax(...).

    Arguments:
    - add_nonreg: extra *gross sale* from non-reg (before capital gains split)
    - add_rrif:   extra RRIF withdrawal dollars
    - add_corp_dividend: extra dividend (cash to person) paid from corp
    - corp_dividend_type: "eligible" or "non-eligible" for this person
    - nr_interest / nr_elig_div / nr_nonelig_div / nr_capg_dist:
        baseline amounts already in this year from non-reg
    - withdrawals_rrif_base:
        RRIF dollars already withdrawn (and considered pension income) before add_rrif
    - cpp_income, oas_income: baseline CPP & OAS for this person
    - age: this person's age in this tax year
    - fed_params, prov_params: *already indexed* tax parameter objects for that year
    """

    # capital gains realized when selling extra non-reg principal
    ratio_cg = cap_gain_ratio(nonreg_balance, nonreg_acb)
    cg_from_sale = add_nonreg * ratio_cg  # this is the *cash* capital gain portion

    # Build income components after the "what-if" adds:
    ordinary_income = nr_interest  # interest/other fully taxed income from non-reg

    # Eligible / non-eligible dividends:
    extra_elig = add_corp_dividend if corp_dividend_type.lower().startswith("elig") else 0.0
    extra_nonelig = add_corp_dividend if not corp_dividend_type.lower().startswith("elig") else 0.0

    elig_dividends = nr_elig_div + extra_elig
    nonelig_dividends = nr_nonelig_div + extra_nonelig

    # Capital gains bucket includes fund CG distributions *and* realized gain from extra sale
    cap_gains = nr_capg_dist + cg_from_sale

    # Pension-type income for progressive_tax:
    #   RRIF is pension_income once you're in RRIF-land
    pension_income = withdrawals_rrif_base + add_rrif + cpp_income

    oas_received = oas_income

    # Now compute tax with your engine for this *single person*
    res_f = progressive_tax(
        fed_params,
        age=age,
        ordinary_income=ordinary_income,
        elig_dividends=elig_dividends,
        nonelig_dividends=nonelig_dividends,
        cap_gains=cap_gains,
        pension_income=pension_income,
        oas_received=oas_received,
    )

    res_p = progressive_tax(
        prov_params,
        age=age,
        ordinary_income=ordinary_income,
        elig_dividends=elig_dividends,
        nonelig_dividends=nonelig_dividends,
        cap_gains=cap_gains,
        pension_income=pension_income,
        oas_received=oas_received,
    )

    return float(res_f["net_tax"] + res_p["net_tax"])


def postprocess_df(df: pd.DataFrame, hh_obj: Optional[object] = None) -> pd.DataFrame:

    if df is None or df.empty:
        return df

    out = df.copy()

    # Normalize legacy col name
    if "is underfunded" in out.columns and "is_underfunded" not in out.columns:
        out = out.rename(columns={"is underfunded": "is_underfunded"})

    # ---- Build household tax series (total_tax_after_split) safely ----
    tax = None

    for c in ["total_tax_after_split", "total_tax", "household_tax", "tax_total", "tax"]:
        if c in df.columns:
            s = pd.to_numeric(df[c], errors="coerce")
            if s.notna().any():
                tax = _ensure_series(s, df.index)
                break

    if tax is None:
        t1 = _ensure_series(_series_safe(df, "tax_after_split_p1", default_value=0.0), df.index)
        t2 = _ensure_series(_series_safe(df, "tax_after_split_p2", default_value=0.0), df.index)
        tax = (t1 + t2)

    # final fallback
    tax = _ensure_series(tax if tax is not None else 0.0, df.index)

    out["total_tax_after_split"] = tax

    if tax is None:
        tax = pd.Series(0.0, index=out.index, dtype="float64")

    out["total_tax_after_split"] = _ensure_series(tax, out.index).fillna(0.0)

    # ---- helper local to avoid repeating try/excepts ----
    def _safe_series(name: str) -> pd.Series:
        return _series_safe(out, name).astype(float)

    # Build taxable proxy
    nr_interest_p1    = _safe_series("nr_interest_p1")
    nr_interest_p2    = _safe_series("nr_interest_p2")
    nr_elig_div_p1    = _safe_series("nr_elig_div_p1")
    nr_elig_div_p2    = _safe_series("nr_elig_div_p2")
    nr_nonelig_div_p1 = _safe_series("nr_nonelig_div_p1")
    nr_nonelig_div_p2 = _safe_series("nr_nonelig_div_p2")
    nr_capg_dist_p1   = _safe_series("nr_capg_dist_p1")
    nr_capg_dist_p2   = _safe_series("nr_capg_dist_p2")
    cg_from_sale_p1   = _safe_series("cg_from_sale_p1")
    cg_from_sale_p2   = _safe_series("cg_from_sale_p2")

    withdraw_rrif_p1  = _safe_series("withdraw_rrif_p1")
    withdraw_rrif_p2  = _safe_series("withdraw_rrif_p2")
    cpp_p1            = _safe_series("cpp_p1")
    cpp_p2            = _safe_series("cpp_p2")
    oas_p1            = _safe_series("oas_p1")
    oas_p2            = _safe_series("oas_p2")
    gis_p1            = _safe_series("gis_p1")
    gis_p2            = _safe_series("gis_p2")

    nr_interest    = nr_interest_p1    + nr_interest_p2
    nr_elig_div    = nr_elig_div_p1    + nr_elig_div_p2
    nr_nonelig_div = nr_nonelig_div_p1 + nr_nonelig_div_p2
    nr_capg_dist   = nr_capg_dist_p1   + nr_capg_dist_p2
    cg_from_sale   = cg_from_sale_p1   + cg_from_sale_p2

    cg_taxable = (nr_capg_dist + cg_from_sale) * 0.5
    elig_div_taxable    = nr_elig_div    * 1.38
    nonelig_div_taxable = nr_nonelig_div * 1.15
    rrif_taxable        = withdraw_rrif_p1 + withdraw_rrif_p2
    # Note: GIS is NOT taxable income, so it's not included in pensions_taxable
    pensions_taxable    = cpp_p1 + cpp_p2 + oas_p1 + oas_p2

    out["_taxable_proxy"] = (
        rrif_taxable
        + nr_interest
        + elig_div_taxable
        + nonelig_div_taxable
        + cg_taxable
        + pensions_taxable
    )

    # ---- REMOVED: sanity patch that was incorrectly overwriting correct tax values ----
    # This patch was causing the bug where recompute_tax() results were being replaced
    # with incorrect base_sum values from tax_p1 + tax_p2 (from tax_for function)
    # The total_tax_after_split from recompute_tax() is the CORRECT value and should
    # never be overwritten, even if it appears "implausible" based on _taxable_proxy
    #
    # Removed lines:
    # - implausible check that triggered when _taxable_proxy > 5000 but tax = 0
    # - overwriting total_tax_after_split with base_sum (tax_p1 + tax_p2)
    # - fallback calculation of tax as _taxable_proxy * 0.18
    # - debug output block

    out["_tax_implausible"] = False  # No longer marking as implausible

    # ---- inflows and residuals ----
    for c in [
        "oas_p1","oas_p2","cpp_p1","cpp_p2","gis_p1","gis_p2",
        "withdraw_rrif_p1","withdraw_rrif_p2",
        "withdraw_nonreg_p1","withdraw_nonreg_p2",
        "withdraw_corp_p1","withdraw_corp_p2",
        "withdraw_tfsa_p1","withdraw_tfsa_p2",
        "nr_dist_tot",
    ]:
        out[c] = _safe_series(c)

    if "cash_inflows_total" not in out.columns:
        out["cash_inflows_total"] = (
            out["oas_p1"] + out["oas_p2"] +
            out["cpp_p1"] + out["cpp_p2"] +
            out["gis_p1"] + out["gis_p2"] +
            out["withdraw_rrif_p1"] + out["withdraw_rrif_p2"] +
            out["withdraw_nonreg_p1"] + out["withdraw_nonreg_p2"] +
            out["withdraw_corp_p1"] + out["withdraw_corp_p2"] +
            out["withdraw_tfsa_p1"] + out["withdraw_tfsa_p2"] +
            out["nr_dist_tot"]
        )

    out["after_tax_cash_available"] = (
        _safe_series("cash_inflows_total") - out["total_tax_after_split"]
    )

    if "spend_target_after_tax" in out.columns:
        out["spend_target_after_tax"] = _safe_series("spend_target_after_tax")
        out["residual_vs_target"] = (
            out["after_tax_cash_available"] - out["spend_target_after_tax"]
        )
    else:
        out["residual_vs_target"] = pd.Series(np.nan, index=out.index)

    if "is_underfunded" not in out.columns:
        gap_tol = float(getattr(hh_obj, "gap_tolerance", 0.50) if hh_obj is not None else 0.50)
        out["is_underfunded"] = out["residual_vs_target"].lt(-gap_tol)

    return out



# simulate_year and simulate now imported from modules.simulation
# -----  These large functions have been moved to modules/simulation.py -----

# ------------------------------ UI -------------------------------------
st.title("🇨🇦 Retirement & Decumulation Simulator")
st.caption("Educational tool. Configure tax tables in tax_config_canada_2025.json. Not tax advice.")

# === APP-LEVEL DISCLAIMER ===
with st.expander("⚠️ **IMPORTANT: Educational Disclaimer - Please Read**"):
    st.warning(
        "**This simulator is an EDUCATIONAL PLANNING TOOL ONLY.**\n\n"
        "It does NOT constitute tax, legal, accounting, or financial advice. "
        "It is based on 2025 Canadian tax rules as currently understood, but:\n\n"
        "### ⚠️ KEY LIMITATIONS:\n"
        "- **Tax rates and thresholds change annually** - 2025 values shown may not apply to your situation\n"
        "- **Provincial variations**: Tax rules differ significantly by province/territory\n"
        "- **Non-resident rules**: Does not account for non-resident taxation or cross-border scenarios\n"
        "- **Complex structures**: Not suitable for trusts, corporate holdings, or high-net-worth estates\n"
        "- **Spousal attribution**: Does not model spousal attribution rules or income splitting strategies\n"
        "- **US tax implications**: Ignores US tax treaty rules for US residents/citizens\n"
        "- **Simplified calculations**: Real tax returns are far more complex than this simulation\n\n"
        "### 🔴 YOU MUST:\n"
        "1. **Consult a qualified accountant or tax lawyer** before making financial decisions\n"
        "2. **Verify all tax rates and thresholds** for your current tax year and province\n"
        "3. **Review results with your financial advisor** who knows your full situation\n"
        "4. **Not rely on this tool for tax filing** or legal compliance\n"
        "5. **Update all assumptions** (inflation, investment returns, life expectancy) based on your circumstances\n\n"
        "### ✅ OFFICIAL SOURCES:\n"
        "- [CRA - Death of a Taxpayer](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/death-of-a-taxpayer.html)\n"
        "- [CRA - RRIF Rules](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/rrsp-rrif-tfsa-etc/rrif-rules-2021.html)\n"
        "- [Service Canada - OAS/GIS](https://www.servicecanada.gc.ca/)"
    )

# ----- Save/Load Section (Multiuser Support) -----
load_col, name_col, save_col = st.columns([2, 1, 1])

with load_col:
    st.subheader("📁 Load Scenario", divider=False)

    # Tab for database or file upload
    load_tab1, load_tab2 = st.tabs(["📊 My Scenarios", "📤 Upload File"])

    with load_tab1:
        # Load from database
        user_scenarios = list_user_scenarios(db, st.session_state.user_id)
        if user_scenarios:
            scenario_names = [s[0] for s in user_scenarios]
            selected_scenario = st.selectbox(
                "Select a scenario to load",
                options=scenario_names,
                label_visibility="collapsed"
            )

            if st.button("Load from Database", use_container_width=True, key="load_from_db"):
                try:
                    loaded_hh, loaded_df = load_scenario_from_db(db, st.session_state.user_id, selected_scenario)
                    if loaded_hh is not None:
                        st.session_state.hh = loaded_hh
                        st.session_state.df = loaded_df
                        st.session_state.sim_ready = True
                        hh = loaded_hh

                        # Update all form field keys from loaded household
                        st.session_state["province"] = hh.province
                        st.session_state["start_year"] = hh.start_year
                        st.session_state["end_age_input"] = hh.end_age
                        st.session_state["strategy"] = hh.strategy
                        st.session_state["no_corp"] = False
                        st.session_state["spending_go_go"] = hh.spending_go_go
                        st.session_state["go_go_end_age"] = hh.go_go_end_age
                        st.session_state["spending_slow_go"] = hh.spending_slow_go
                        st.session_state["slow_go_end_age"] = hh.slow_go_end_age
                        st.session_state["spending_no_go"] = hh.spending_no_go
                        st.session_state["spending_inflation_pct"] = hh.spending_inflation * 100.0
                        st.session_state["general_inflation_pct"] = hh.general_inflation * 100.0
                        st.session_state["_loaded_spending_inflation_pct"] = hh.spending_inflation * 100.0
                        st.session_state["_loaded_general_inflation_pct"] = hh.general_inflation * 100.0
                        st.session_state["gap_tolerance"] = hh.gap_tolerance

                        # Person 1
                        st.session_state["p1_name"] = hh.p1.name
                        st.session_state["p1_age"] = hh.p1.start_age
                        st.session_state["p1_cpp_start"] = hh.p1.cpp_start_age
                        st.session_state["p1_cpp_amt"] = hh.p1.cpp_annual_at_start
                        st.session_state["p1_oas_start"] = hh.p1.oas_start_age
                        st.session_state["p1_oas_amt"] = hh.p1.oas_annual_at_start
                        st.session_state["p1_rrsp"] = hh.p1.rrsp_balance
                        st.session_state["p1_rrif"] = hh.p1.rrif_balance
                        st.session_state["p1_tfsa"] = hh.p1.tfsa_balance
                        st.session_state["p1_nonreg"] = hh.p1.nonreg_balance
                        st.session_state["p1_corp"] = hh.p1.corporate_balance
                        st.session_state["p1_nonreg_acb"] = hh.p1.nonreg_acb
                        st.session_state["p1_nr_cash"] = hh.p1.nr_cash
                        st.session_state["p1_nr_gic"] = hh.p1.nr_gic
                        st.session_state["p1_nr_inv"] = hh.p1.nr_invest
                        st.session_state["p1_y_cash"] = hh.p1.y_nr_cash_interest * 100.0
                        st.session_state["p1_y_gic"] = hh.p1.y_nr_gic_interest * 100.0
                        st.session_state["p1_y_inv_total"] = hh.p1.y_nr_inv_total_return * 100.0
                        st.session_state["p1_y_inv_elig"] = hh.p1.y_nr_inv_elig_div * 100.0
                        st.session_state["p1_y_inv_nonel"] = hh.p1.y_nr_inv_nonelig_div * 100.0
                        st.session_state["p1_y_inv_cg"] = hh.p1.y_nr_inv_capg * 100.0
                        st.session_state["p1_y_inv_roc"] = hh.p1.y_nr_inv_roc_pct * 100.0
                        # Non-Registered bucket allocations (convert from fractions to percentages)
                        st.session_state["p1_nr_cash_pct"] = hh.p1.nr_cash_pct * 100.0
                        st.session_state["p1_nr_gic_pct"] = hh.p1.nr_gic_pct * 100.0
                        st.session_state["p1_nr_invest_pct"] = hh.p1.nr_invest_pct * 100.0
                        # Corporate buckets and allocations
                        st.session_state["p1_c_c"] = hh.p1.corp_cash_bucket
                        st.session_state["p1_c_g"] = hh.p1.corp_gic_bucket
                        st.session_state["p1_c_i"] = hh.p1.corp_invest_bucket
                        st.session_state["p1_rdtoh"] = hh.p1.corp_rdtoh
                        st.session_state["p1_y_c_c"] = hh.p1.y_corp_cash_interest * 100.0
                        st.session_state["p1_y_c_g"] = hh.p1.y_corp_gic_interest * 100.0
                        st.session_state["p1_y_c_i"] = hh.p1.y_corp_inv_total_return * 100.0
                        st.session_state["p1_y_c_i_elig"] = hh.p1.y_corp_inv_elig_div * 100.0
                        st.session_state["p1_y_c_i_cg"] = hh.p1.y_corp_inv_capg * 100.0
                        st.session_state["p1_corp_divtype"] = hh.p1.corp_dividend_type
                        # Corporate bucket allocation percentages
                        st.session_state["p1_c_c_pct"] = hh.p1.corp_cash_pct * 100.0
                        st.session_state["p1_c_g_pct"] = hh.p1.corp_gic_pct * 100.0
                        st.session_state["p1_c_i_pct"] = hh.p1.corp_invest_pct * 100.0
                        # TFSA room parameters
                        st.session_state["p1_tfsa_room"] = hh.p1.tfsa_room_start
                        st.session_state["p1_tfsa_room_growth"] = hh.p1.tfsa_room_annual_growth

                        # Person 2
                        st.session_state["p2_name"] = hh.p2.name
                        st.session_state["p2_age"] = hh.p2.start_age
                        st.session_state["p2_cpp_start"] = hh.p2.cpp_start_age
                        st.session_state["p2_cpp_amt"] = hh.p2.cpp_annual_at_start
                        st.session_state["p2_oas_start"] = hh.p2.oas_start_age
                        st.session_state["p2_oas_amt"] = hh.p2.oas_annual_at_start
                        st.session_state["p2_rrsp"] = hh.p2.rrsp_balance
                        st.session_state["p2_rrif"] = hh.p2.rrif_balance
                        st.session_state["p2_tfsa"] = hh.p2.tfsa_balance
                        st.session_state["p2_nonreg"] = hh.p2.nonreg_balance
                        st.session_state["p2_corp"] = hh.p2.corporate_balance
                        st.session_state["p2_nonreg_acb"] = hh.p2.nonreg_acb
                        st.session_state["p2_nr_cash"] = hh.p2.nr_cash
                        st.session_state["p2_nr_gic"] = hh.p2.nr_gic
                        st.session_state["p2_nr_inv"] = hh.p2.nr_invest
                        st.session_state["p2_y_cash"] = hh.p2.y_nr_cash_interest * 100.0
                        st.session_state["p2_y_gic"] = hh.p2.y_nr_gic_interest * 100.0
                        st.session_state["p2_y_inv_total"] = hh.p2.y_nr_inv_total_return * 100.0
                        st.session_state["p2_y_inv_elig"] = hh.p2.y_nr_inv_elig_div * 100.0
                        st.session_state["p2_y_inv_nonel"] = hh.p2.y_nr_inv_nonelig_div * 100.0
                        st.session_state["p2_y_inv_cg"] = hh.p2.y_nr_inv_capg * 100.0
                        st.session_state["p2_y_inv_roc"] = hh.p2.y_nr_inv_roc_pct * 100.0
                        # Non-Registered bucket allocations (convert from fractions to percentages)
                        st.session_state["p2_nr_cash_pct"] = hh.p2.nr_cash_pct * 100.0
                        st.session_state["p2_nr_gic_pct"] = hh.p2.nr_gic_pct * 100.0
                        st.session_state["p2_nr_invest_pct"] = hh.p2.nr_invest_pct * 100.0
                        # Corporate buckets and allocations
                        st.session_state["p2_c_c"] = hh.p2.corp_cash_bucket
                        st.session_state["p2_c_g"] = hh.p2.corp_gic_bucket
                        st.session_state["p2_c_i"] = hh.p2.corp_invest_bucket
                        st.session_state["p2_rdtoh"] = hh.p2.corp_rdtoh
                        st.session_state["p2_y_c_c"] = hh.p2.y_corp_cash_interest * 100.0
                        st.session_state["p2_y_c_g"] = hh.p2.y_corp_gic_interest * 100.0
                        st.session_state["p2_y_c_i"] = hh.p2.y_corp_inv_total_return * 100.0
                        st.session_state["p2_y_c_i_elig"] = hh.p2.y_corp_inv_elig_div * 100.0
                        st.session_state["p2_y_c_i_cg"] = hh.p2.y_corp_inv_capg * 100.0
                        st.session_state["p2_corp_divtype"] = hh.p2.corp_dividend_type
                        # Corporate bucket allocation percentages
                        st.session_state["p2_c_c_pct"] = hh.p2.corp_cash_pct * 100.0
                        st.session_state["p2_c_g_pct"] = hh.p2.corp_gic_pct * 100.0
                        st.session_state["p2_c_i_pct"] = hh.p2.corp_invest_pct * 100.0
                        # TFSA room parameters
                        st.session_state["p2_tfsa_room"] = hh.p2.tfsa_room_start
                        st.session_state["p2_tfsa_room_growth"] = hh.p2.tfsa_room_annual_growth
                        st.session_state["tfsa_contribution_each"] = hh.tfsa_contribution_each
                        st.session_state["reinvest_nonreg_dist_checkbox"] = hh.reinvest_nonreg_dist
                        st.session_state["income_split_rrif_fraction"] = hh.income_split_rrif_fraction
                        st.session_state["hybrid_rrif_topup_per_person"] = hh.hybrid_rrif_topup_per_person
                        st.session_state["stop_on_fail"] = hh.stop_on_fail

                        st.success(f"✅ Loaded: {selected_scenario}")
                        st.rerun()  # Force app to rerun and clear all caches
                    else:
                        st.error(f"❌ Failed to load scenario: {selected_scenario}")
                except Exception as e:
                    st.error(f"❌ Error loading scenario: {str(e)}")
        else:
            st.info("📝 No saved scenarios yet. Start by creating or uploading a scenario.")

    with load_tab2:
        # Load from file upload (existing functionality)
        uploaded_file = st.file_uploader("📁 Upload JSON File", type=['json'], label_visibility="collapsed")
        if uploaded_file is not None:
            # Only process if this is a NEW file (not just the cached buffer from a previous load)
            # Track the file name and only reload if it changes
            current_file_name = uploaded_file.name if uploaded_file else None
            previous_file_name = st.session_state.get("_loaded_file_name", None)

            if current_file_name != previous_file_name:
                try:
                    st.session_state["_loaded_file_name"] = current_file_name
                    file_contents = uploaded_file.read().decode('utf-8')
                    json_data = json.loads(file_contents)
                    loaded_hh, loaded_df = load_scenario(json_data)
                    metadata = get_scenario_metadata(json_data)
                    st.session_state.hh = loaded_hh
                    st.session_state.df = loaded_df
                    st.session_state.sim_ready = True
                    hh = loaded_hh

                    # Update all form field keys from loaded household
                    st.session_state["province"] = hh.province
                    st.session_state["start_year"] = hh.start_year
                    st.session_state["end_age_input"] = hh.end_age
                    st.session_state["strategy"] = hh.strategy
                    st.session_state["no_corp"] = False
                    st.session_state["spending_go_go"] = hh.spending_go_go
                    st.session_state["go_go_end_age"] = hh.go_go_end_age
                    st.session_state["spending_slow_go"] = hh.spending_slow_go
                    st.session_state["slow_go_end_age"] = hh.slow_go_end_age
                    st.session_state["spending_no_go"] = hh.spending_no_go
                    st.session_state["spending_inflation_pct"] = hh.spending_inflation * 100.0
                    st.session_state["general_inflation_pct"] = hh.general_inflation * 100.0
                    st.session_state["_loaded_spending_inflation_pct"] = hh.spending_inflation * 100.0
                    st.session_state["_loaded_general_inflation_pct"] = hh.general_inflation * 100.0
                    st.session_state["gap_tolerance"] = hh.gap_tolerance

                    # Person 1
                    st.session_state["p1_name"] = hh.p1.name
                    st.session_state["p1_age"] = hh.p1.start_age
                    st.session_state["p1_cpp_start"] = hh.p1.cpp_start_age
                    st.session_state["p1_cpp_amt"] = hh.p1.cpp_annual_at_start
                    st.session_state["p1_oas_start"] = hh.p1.oas_start_age
                    st.session_state["p1_oas_amt"] = hh.p1.oas_annual_at_start
                    st.session_state["p1_rrsp"] = hh.p1.rrsp_balance
                    st.session_state["p1_rrif"] = hh.p1.rrif_balance
                    st.session_state["p1_tfsa"] = hh.p1.tfsa_balance
                    st.session_state["p1_nonreg"] = hh.p1.nonreg_balance
                    st.session_state["p1_corp"] = hh.p1.corporate_balance
                    st.session_state["p1_nonreg_acb"] = hh.p1.nonreg_acb
                    st.session_state["p1_nr_cash"] = hh.p1.nr_cash
                    st.session_state["p1_nr_gic"] = hh.p1.nr_gic
                    st.session_state["p1_nr_inv"] = hh.p1.nr_invest
                    st.session_state["p1_y_cash"] = hh.p1.y_nr_cash_interest * 100.0
                    st.session_state["p1_y_gic"] = hh.p1.y_nr_gic_interest * 100.0
                    st.session_state["p1_y_inv_total"] = hh.p1.y_nr_inv_total_return * 100.0
                    st.session_state["p1_y_inv_elig"] = hh.p1.y_nr_inv_elig_div * 100.0
                    st.session_state["p1_y_inv_nonel"] = hh.p1.y_nr_inv_nonelig_div * 100.0
                    st.session_state["p1_y_inv_cg"] = hh.p1.y_nr_inv_capg * 100.0
                    st.session_state["p1_y_inv_roc"] = hh.p1.y_nr_inv_roc_pct * 100.0
                    # Non-Registered bucket allocations (convert from fractions to percentages)
                    st.session_state["p1_nr_cash_pct"] = hh.p1.nr_cash_pct * 100.0
                    st.session_state["p1_nr_gic_pct"] = hh.p1.nr_gic_pct * 100.0
                    st.session_state["p1_nr_invest_pct"] = hh.p1.nr_invest_pct * 100.0
                    # Corporate buckets and allocations
                    st.session_state["p1_c_c"] = hh.p1.corp_cash_bucket
                    st.session_state["p1_c_g"] = hh.p1.corp_gic_bucket
                    st.session_state["p1_c_i"] = hh.p1.corp_invest_bucket
                    st.session_state["p1_rdtoh"] = hh.p1.corp_rdtoh
                    st.session_state["p1_y_c_c"] = hh.p1.y_corp_cash_interest * 100.0
                    st.session_state["p1_y_c_g"] = hh.p1.y_corp_gic_interest * 100.0
                    st.session_state["p1_y_c_i"] = hh.p1.y_corp_inv_total_return * 100.0
                    st.session_state["p1_y_c_i_elig"] = hh.p1.y_corp_inv_elig_div * 100.0
                    st.session_state["p1_y_c_i_cg"] = hh.p1.y_corp_inv_capg * 100.0
                    st.session_state["p1_corp_divtype"] = hh.p1.corp_dividend_type
                    # Corporate bucket allocation percentages
                    st.session_state["p1_c_c_pct"] = hh.p1.corp_cash_pct * 100.0
                    st.session_state["p1_c_g_pct"] = hh.p1.corp_gic_pct * 100.0
                    st.session_state["p1_c_i_pct"] = hh.p1.corp_invest_pct * 100.0
                    # TFSA room parameters
                    st.session_state["p1_tfsa_room"] = hh.p1.tfsa_room_start
                    st.session_state["p1_tfsa_room_growth"] = hh.p1.tfsa_room_annual_growth

                    # Person 2
                    st.session_state["p2_name"] = hh.p2.name
                    st.session_state["p2_age"] = hh.p2.start_age
                    st.session_state["p2_cpp_start"] = hh.p2.cpp_start_age
                    st.session_state["p2_cpp_amt"] = hh.p2.cpp_annual_at_start
                    st.session_state["p2_oas_start"] = hh.p2.oas_start_age
                    st.session_state["p2_oas_amt"] = hh.p2.oas_annual_at_start
                    st.session_state["p2_rrsp"] = hh.p2.rrsp_balance
                    st.session_state["p2_rrif"] = hh.p2.rrif_balance
                    st.session_state["p2_tfsa"] = hh.p2.tfsa_balance
                    st.session_state["p2_nonreg"] = hh.p2.nonreg_balance
                    st.session_state["p2_corp"] = hh.p2.corporate_balance
                    st.session_state["p2_nonreg_acb"] = hh.p2.nonreg_acb
                    st.session_state["p2_nr_cash"] = hh.p2.nr_cash
                    st.session_state["p2_nr_gic"] = hh.p2.nr_gic
                    st.session_state["p2_nr_inv"] = hh.p2.nr_invest
                    st.session_state["p2_y_cash"] = hh.p2.y_nr_cash_interest * 100.0
                    st.session_state["p2_y_gic"] = hh.p2.y_nr_gic_interest * 100.0
                    st.session_state["p2_y_inv_total"] = hh.p2.y_nr_inv_total_return * 100.0
                    st.session_state["p2_y_inv_elig"] = hh.p2.y_nr_inv_elig_div * 100.0
                    st.session_state["p2_y_inv_nonel"] = hh.p2.y_nr_inv_nonelig_div * 100.0
                    st.session_state["p2_y_inv_cg"] = hh.p2.y_nr_inv_capg * 100.0
                    st.session_state["p2_y_inv_roc"] = hh.p2.y_nr_inv_roc_pct * 100.0
                    # Non-Registered bucket allocations (convert from fractions to percentages)
                    st.session_state["p2_nr_cash_pct"] = hh.p2.nr_cash_pct * 100.0
                    st.session_state["p2_nr_gic_pct"] = hh.p2.nr_gic_pct * 100.0
                    st.session_state["p2_nr_invest_pct"] = hh.p2.nr_invest_pct * 100.0
                    # Corporate buckets and allocations
                    st.session_state["p2_c_c"] = hh.p2.corp_cash_bucket
                    st.session_state["p2_c_g"] = hh.p2.corp_gic_bucket
                    st.session_state["p2_c_i"] = hh.p2.corp_invest_bucket
                    st.session_state["p2_rdtoh"] = hh.p2.corp_rdtoh
                    st.session_state["p2_y_c_c"] = hh.p2.y_corp_cash_interest * 100.0
                    st.session_state["p2_y_c_g"] = hh.p2.y_corp_gic_interest * 100.0
                    st.session_state["p2_y_c_i"] = hh.p2.y_corp_inv_total_return * 100.0
                    st.session_state["p2_y_c_i_elig"] = hh.p2.y_corp_inv_elig_div * 100.0
                    st.session_state["p2_y_c_i_cg"] = hh.p2.y_corp_inv_capg * 100.0
                    st.session_state["p2_corp_divtype"] = hh.p2.corp_dividend_type
                    # Corporate bucket allocation percentages
                    st.session_state["p2_c_c_pct"] = hh.p2.corp_cash_pct * 100.0
                    st.session_state["p2_c_g_pct"] = hh.p2.corp_gic_pct * 100.0
                    st.session_state["p2_c_i_pct"] = hh.p2.corp_invest_pct * 100.0
                    # TFSA room parameters
                    st.session_state["p2_tfsa_room"] = hh.p2.tfsa_room_start
                    st.session_state["p2_tfsa_room_growth"] = hh.p2.tfsa_room_annual_growth
                    st.session_state["tfsa_contribution_each"] = hh.tfsa_contribution_each
                    st.session_state["reinvest_nonreg_dist_checkbox"] = hh.reinvest_nonreg_dist
                    st.session_state["income_split_rrif_fraction"] = hh.income_split_rrif_fraction
                    st.session_state["hybrid_rrif_topup_per_person"] = hh.hybrid_rrif_topup_per_person
                    st.session_state["stop_on_fail"] = hh.stop_on_fail

                    # Show compact load feedback and save for later use
                    name = metadata.get('name', 'Unnamed')
                    date = metadata.get('created_date', '')
                    st.session_state["_loaded_file_description"] = name  # Save for else clause
                    st.success(f"✅ {name}" + (f" ({date})" if date else ""))
                    if metadata.get('description'):
                        st.caption(f"📝 {metadata.get('description')}")
                    st.rerun()  # Force app to rerun and clear all caches
                except (json.JSONDecodeError, ValueError, KeyError) as e:
                    st.error(f"❌ Load failed: {str(e)}")
            else:
                # File hasn't changed, just show it's still loaded
                name = st.session_state.get("_loaded_file_description", "Plan")
                st.success(f"✅ Still using: {name}")

with name_col:
    scenario_name = st.text_input("Scenario", value="Plan", label_visibility="collapsed")

with save_col:
    if st.button("💾 Save", use_container_width=True):
        if st.session_state.hh is not None:
            try:
                save_p1_rrsp = float(st.session_state.get("p1_rrsp", 0) or 0)
                save_p1_rrif = float(st.session_state.get("p1_rrif", 150000) or 150000)
                save_p1_tfsa = float(st.session_state.get("p1_tfsa", 160000) or 160000)
                save_p1_nonreg = float(st.session_state.get("p1_nonreg", 0) or 0)
                save_p1_corp = float(st.session_state.get("p1_corp", 0) or 0)
                save_p1_nonreg_acb = float(st.session_state.get("p1_nonreg_acb", 0) or 0)
                save_p2_rrsp = float(st.session_state.get("p2_rrsp", 0) or 0)
                save_p2_rrif = float(st.session_state.get("p2_rrif", 150000) or 150000)
                save_p2_tfsa = float(st.session_state.get("p2_tfsa", 160000) or 160000)
                save_p2_nonreg = float(st.session_state.get("p2_nonreg", 0) or 0)
                save_p2_corp = float(st.session_state.get("p2_corp", 0) or 0)
                save_p2_nonreg_acb = float(st.session_state.get("p2_nonreg_acb", 0) or 0)
                save_p1_name = st.session_state.get("p1_name", "John Doe")
                save_p2_name = st.session_state.get("p2_name", "Jane Doe")
                save_p1_age = int(st.session_state.get("p1_age", 65) or 65)
                save_p2_age = int(st.session_state.get("p2_age", 62) or 62)

                # Get yield values from session state (stored as percentages, need to convert to fractions)
                save_p1_y_cash = float(st.session_state.get("p1_y_cash", 2.00) or 2.00) / 100.0
                save_p1_y_gic = float(st.session_state.get("p1_y_gic", 3.30) or 3.30) / 100.0
                save_p1_y_inv_total = float(st.session_state.get("p1_y_inv_total", 4.00) or 4.00) / 100.0
                save_p1_y_inv_elig = float(st.session_state.get("p1_y_inv_elig", 2.00) or 2.00) / 100.0
                save_p1_y_inv_nonel = float(st.session_state.get("p1_y_inv_nonel", 0.00) or 0.00) / 100.0
                save_p1_y_inv_cg = float(st.session_state.get("p1_y_inv_cg", 2.00) or 2.00) / 100.0
                save_p1_y_inv_roc = float(st.session_state.get("p1_y_inv_roc", 0.00) or 0.00) / 100.0

                save_p2_y_cash = float(st.session_state.get("p2_y_cash", 2.00) or 2.00) / 100.0
                save_p2_y_gic = float(st.session_state.get("p2_y_gic", 3.30) or 3.30) / 100.0
                save_p2_y_inv_total = float(st.session_state.get("p2_y_inv_total", 4.00) or 4.00) / 100.0
                save_p2_y_inv_elig = float(st.session_state.get("p2_y_inv_elig", 2.00) or 2.00) / 100.0
                save_p2_y_inv_nonel = float(st.session_state.get("p2_y_inv_nonel", 0.00) or 0.00) / 100.0
                save_p2_y_inv_cg = float(st.session_state.get("p2_y_inv_cg", 2.00) or 2.00) / 100.0
                save_p2_y_inv_roc = float(st.session_state.get("p2_y_inv_roc", 0.00) or 0.00) / 100.0

                # Non-Registered bucket allocations and yields
                # Non-Registered bucket allocations (convert from percentages to fractions)
                save_p1_nr_cash_pct = float(st.session_state.get("p1_nr_cash_pct", 0.0) or 0.0) / 100.0
                save_p1_nr_gic_pct = float(st.session_state.get("p1_nr_gic_pct", 0.0) or 0.0) / 100.0
                save_p1_nr_invest_pct = float(st.session_state.get("p1_nr_invest_pct", 100.0) or 100.0) / 100.0

                save_p2_nr_cash_pct = float(st.session_state.get("p2_nr_cash_pct", 0.0) or 0.0) / 100.0
                save_p2_nr_gic_pct = float(st.session_state.get("p2_nr_gic_pct", 0.0) or 0.0) / 100.0
                save_p2_nr_invest_pct = float(st.session_state.get("p2_nr_invest_pct", 100.0) or 100.0) / 100.0

                # Corporate bucket allocations and yields
                save_p1_c_c = float(st.session_state.get("p1_c_c", 0.0) or 0.0)
                save_p1_c_g = float(st.session_state.get("p1_c_g", 0.0) or 0.0)
                save_p1_c_i = float(st.session_state.get("p1_c_i", 0.0) or 0.0)
                save_p1_c_c_pct = float(st.session_state.get("p1_c_c_pct", 0.0) or 0.0) / 100.0
                save_p1_c_g_pct = float(st.session_state.get("p1_c_g_pct", 0.0) or 0.0) / 100.0
                save_p1_c_i_pct = float(st.session_state.get("p1_c_i_pct", 100.0) or 100.0) / 100.0
                save_p1_rdtoh = float(st.session_state.get("p1_rdtoh", 0.0) or 0.0)
                save_p1_y_c_c = float(st.session_state.get("p1_y_c_c", 0.00) or 0.00) / 100.0
                save_p1_y_c_g = float(st.session_state.get("p1_y_c_g", 3.00) or 3.00) / 100.0
                save_p1_y_c_i = float(st.session_state.get("p1_y_c_i", 5.00) or 5.00) / 100.0
                save_p1_y_c_i_elig = float(st.session_state.get("p1_y_c_i_elig", 3.00) or 3.00) / 100.0
                save_p1_y_c_i_cg = float(st.session_state.get("p1_y_c_i_cg", 0.00) or 0.00) / 100.0
                save_p1_corp_divtype = st.session_state.get("p1_corp_divtype", "non-eligible")

                save_p2_c_c = float(st.session_state.get("p2_c_c", 0.0) or 0.0)
                save_p2_c_g = float(st.session_state.get("p2_c_g", 0.0) or 0.0)
                save_p2_c_i = float(st.session_state.get("p2_c_i", 0.0) or 0.0)
                save_p2_c_c_pct = float(st.session_state.get("p2_c_c_pct", 0.0) or 0.0) / 100.0
                save_p2_c_g_pct = float(st.session_state.get("p2_c_g_pct", 0.0) or 0.0) / 100.0
                save_p2_c_i_pct = float(st.session_state.get("p2_c_i_pct", 100.0) or 100.0) / 100.0
                save_p2_rdtoh = float(st.session_state.get("p2_rdtoh", 0.0) or 0.0)
                save_p2_y_c_c = float(st.session_state.get("p2_y_c_c", 0.00) or 0.00) / 100.0
                save_p2_y_c_g = float(st.session_state.get("p2_y_c_g", 3.00) or 3.00) / 100.0
                save_p2_y_c_i = float(st.session_state.get("p2_y_c_i", 5.00) or 5.00) / 100.0
                save_p2_y_c_i_elig = float(st.session_state.get("p2_y_c_i_elig", 3.00) or 3.00) / 100.0
                save_p2_y_c_i_cg = float(st.session_state.get("p2_y_c_i_cg", 0.00) or 0.00) / 100.0
                save_p2_corp_divtype = st.session_state.get("p2_corp_divtype", "non-eligible")

                hh_to_save = st.session_state.hh.__class__(
                    p1=st.session_state.hh.p1.__class__(
                        name=save_p1_name, start_age=save_p1_age,
                        cpp_annual_at_start=float(st.session_state.get("p1_cpp_amt", 0) or 0),
                        cpp_start_age=int(st.session_state.get("p1_cpp_start", 65) or 65),
                        oas_annual_at_start=float(st.session_state.get("p1_oas_amt", 0) or 0),
                        oas_start_age=int(st.session_state.get("p1_oas_start", 70) or 70),
                        rrsp_balance=save_p1_rrsp, rrif_balance=save_p1_rrif, tfsa_balance=save_p1_tfsa,
                        nonreg_balance=save_p1_nonreg, nonreg_acb=save_p1_nonreg_acb, corporate_balance=save_p1_corp,
                        # Non-Registered yields (as fractions)
                        y_nr_cash_interest=save_p1_y_cash,
                        y_nr_gic_interest=save_p1_y_gic,
                        y_nr_inv_total_return=save_p1_y_inv_total,
                        y_nr_inv_elig_div=save_p1_y_inv_elig,
                        y_nr_inv_nonelig_div=save_p1_y_inv_nonel,
                        y_nr_inv_capg=save_p1_y_inv_cg,
                        y_nr_inv_roc_pct=save_p1_y_inv_roc,
                        # Non-Registered buckets and allocations
                        nr_cash=float(st.session_state.get("p1_nr_cash", 0.0) or 0.0),
                        nr_gic=float(st.session_state.get("p1_nr_gic", 0.0) or 0.0),
                        nr_invest=float(st.session_state.get("p1_nr_inv", 0.0) or 0.0),
                        nr_cash_pct=save_p1_nr_cash_pct,
                        nr_gic_pct=save_p1_nr_gic_pct,
                        nr_invest_pct=save_p1_nr_invest_pct,
                        # Corporate buckets and yields
                        corp_rdtoh=save_p1_rdtoh,
                        corp_dividend_type=save_p1_corp_divtype,
                        corp_cash_bucket=save_p1_c_c,
                        corp_gic_bucket=save_p1_c_g,
                        corp_invest_bucket=save_p1_c_i,
                        corp_cash_pct=save_p1_c_c_pct,
                        corp_gic_pct=save_p1_c_g_pct,
                        corp_invest_pct=save_p1_c_i_pct,
                        y_corp_cash_interest=save_p1_y_c_c,
                        y_corp_gic_interest=save_p1_y_c_g,
                        y_corp_inv_total_return=save_p1_y_c_i,
                        y_corp_inv_elig_div=save_p1_y_c_i_elig,
                        y_corp_inv_capg=save_p1_y_c_i_cg,
                        # TFSA room parameters
                        tfsa_room_start=float(st.session_state.get("p1_tfsa_room", 0.0) or 0.0),
                        tfsa_room_annual_growth=float(st.session_state.get("p1_tfsa_room_growth", 7000.0) or 7000.0),
                    ),
                    p2=st.session_state.hh.p2.__class__(
                        name=save_p2_name, start_age=save_p2_age,
                        cpp_annual_at_start=float(st.session_state.get("p2_cpp_amt", 0) or 0),
                        cpp_start_age=int(st.session_state.get("p2_cpp_start", 65) or 65),
                        oas_annual_at_start=float(st.session_state.get("p2_oas_amt", 0) or 0),
                        oas_start_age=int(st.session_state.get("p2_oas_start", 70) or 70),
                        rrsp_balance=save_p2_rrsp, rrif_balance=save_p2_rrif, tfsa_balance=save_p2_tfsa,
                        nonreg_balance=save_p2_nonreg, nonreg_acb=save_p2_nonreg_acb, corporate_balance=save_p2_corp,
                        # Non-Registered yields (as fractions)
                        y_nr_cash_interest=save_p2_y_cash,
                        y_nr_gic_interest=save_p2_y_gic,
                        y_nr_inv_total_return=save_p2_y_inv_total,
                        y_nr_inv_elig_div=save_p2_y_inv_elig,
                        y_nr_inv_nonelig_div=save_p2_y_inv_nonel,
                        y_nr_inv_capg=save_p2_y_inv_cg,
                        y_nr_inv_roc_pct=save_p2_y_inv_roc,
                        # Non-Registered buckets and allocations
                        nr_cash=float(st.session_state.get("p2_nr_cash", 0.0) or 0.0),
                        nr_gic=float(st.session_state.get("p2_nr_gic", 0.0) or 0.0),
                        nr_invest=float(st.session_state.get("p2_nr_inv", 0.0) or 0.0),
                        nr_cash_pct=save_p2_nr_cash_pct,
                        nr_gic_pct=save_p2_nr_gic_pct,
                        nr_invest_pct=save_p2_nr_invest_pct,
                        # Corporate buckets and yields
                        corp_rdtoh=save_p2_rdtoh,
                        corp_dividend_type=save_p2_corp_divtype,
                        corp_cash_bucket=save_p2_c_c,
                        corp_gic_bucket=save_p2_c_g,
                        corp_invest_bucket=save_p2_c_i,
                        corp_cash_pct=save_p2_c_c_pct,
                        corp_gic_pct=save_p2_c_g_pct,
                        corp_invest_pct=save_p2_c_i_pct,
                        y_corp_cash_interest=save_p2_y_c_c,
                        y_corp_gic_interest=save_p2_y_c_g,
                        y_corp_inv_total_return=save_p2_y_c_i,
                        y_corp_inv_elig_div=save_p2_y_c_i_elig,
                        y_corp_inv_capg=save_p2_y_c_i_cg,
                        # TFSA room parameters
                        tfsa_room_start=float(st.session_state.get("p2_tfsa_room", 0.0) or 0.0),
                        tfsa_room_annual_growth=float(st.session_state.get("p2_tfsa_room_growth", 7000.0) or 7000.0),
                    ),
                    province=st.session_state.get("province", "ON"),
                    start_year=int(st.session_state.get("start_year", 2025) or 2025),
                    end_age=int(st.session_state.get("end_age_input", 95) or 95),
                    spending_go_go=float(st.session_state.get("spending_go_go", 100000) or 100000),
                    go_go_end_age=int(st.session_state.get("go_go_end_age", 80) or 80),
                    spending_slow_go=float(st.session_state.get("spending_slow_go", 80000) or 80000),
                    slow_go_end_age=int(st.session_state.get("slow_go_end_age", 90) or 90),
                    spending_no_go=float(st.session_state.get("spending_no_go", 60000) or 60000),
                    strategy=st.session_state.get("strategy", "NonReg→RRIF→Corp→TFSA"),
                    tfsa_contribution_each=float(st.session_state.get("tfsa_contribution_each", 7000) or 7000),
                    spending_inflation=float(st.session_state.get("spending_inflation_pct", 2.00) or 2.00) / 100.0,
                    general_inflation=float(st.session_state.get("general_inflation_pct", 3.00) or 3.00) / 100.0,
                    gap_tolerance=float(st.session_state.get("gap_tolerance", 0.5) or 0.5),
                    reinvest_nonreg_dist=bool(st.session_state.get("reinvest_nonreg_dist_checkbox", False)),
                    income_split_rrif_fraction=float(st.session_state.get("income_split_rrif_fraction", 0.5) or 0.5),
                    hybrid_rrif_topup_per_person=float(st.session_state.get("hybrid_rrif_topup_per_person", 0) or 0),
                    stop_on_fail=bool(st.session_state.get("stop_on_fail", False)),
                )

                json_str = scenario_to_json_string(hh_to_save, st.session_state.df, scenario_name, "")

                # Save to database
                save_success = save_scenario_to_db(db, st.session_state.user_id, scenario_name, hh_to_save, st.session_state.df, "")
                if save_success:
                    st.success(f"✅ Saved to database: {scenario_name}")
                else:
                    st.warning(f"⚠️ Failed to save to database (file download still available)")

                # Also offer file download for backup
                st.download_button(
                    label="⬇️ Download as File", data=json_str,
                    file_name=f"{scenario_name.replace(' ', '_')}.retirement.json",
                    mime="application/json", use_container_width=True
                )
            except Exception as e:
                st.error(f"❌ {str(e)}")
        else:
            st.warning("⚠️ Run first")

# Main content tabs
tab1, tab2, tab3, tab4 = st.tabs(["🏠 Household Setup", "💰 Account Balances", "⚙️ Advanced: Yields & Buckets", "📊 2025 Actuals Tracker"])

with tab1:
    left, right = st.columns([2.5, 1.0])

    with left:
            st.markdown("### 🏠 Household Setup")

            # ===== Basics: 4 columns =====
            st.markdown("**Basics**")
            l1, l2, l3, l4 = st.columns(4)
            l1.caption("Province")
            l2.caption("Start Year")
            l3.caption("P1 Age")
            l4.caption("P2 Age")

            bc1, bc2, bc3, bc4 = st.columns(4)
            with bc1:
                province = st.selectbox(
                    "Province",
                    options=["AB","BC","ON","QC"],
                    index=0,
                    help="Provincial tax configuration available for AB, BC, ON, QC. Other provinces use federal rates.",
                    label_visibility="collapsed"
                )
            with bc2:
                start_year = st.number_input(
                    "Start Year",
                    min_value=2020, max_value=2100, step=1,
                    help="The simulation begins in this calendar year.",
                    label_visibility="collapsed",
                    key="start_year"
                )
            with bc3:
                p1_start_age = st.number_input(
                    "P1 Age",
                    min_value=50, max_value=100, step=1,
                    help="Age of Person 1 at the simulation start.",
                    label_visibility="collapsed",
                    key="p1_age"
                )
            with bc4:
                p2_start_age = st.number_input(
                    "P2 Age",
                    min_value=50, max_value=100, step=1,
                    help="Age of Person 2 at the simulation start.",
                    label_visibility="collapsed",
                    key="p2_age"
                )

            # ===== Province info message =====
            st.info("📍 **Province Support**: Currently supporting AB, BC, ON, QC (79% of Canadian population). More provinces coming soon!")

            # ===== Inflation & End Age: 3 columns =====
            st.markdown("**Inflation & Horizon**")
            inf1, inf2, inf3 = st.columns(3)
            inf1.caption("General Inflation (%)")
            inf2.caption("Lifestyle Inflation (%)")
            inf3.caption("Plan to Age")

            ic1, ic2, ic3 = st.columns(3)
            with ic1:
                inflation_pct = st.number_input(
                    "General Inflation (%)",
                    step=0.10, format="%.2f",
                    key="general_inflation_pct",
                    help="Indexing for tax brackets and government benefits.",
                    label_visibility="collapsed"
                )
                inflation = inflation_pct / 100.0
            with ic2:
                infl_lifestyle_pct = st.number_input(
                    "Lifestyle Inflation (%)",
                    step=0.10, format="%.2f",
                    key="spending_inflation_pct",
                    help="Indexing for spending targets across go-go / slow-go / no-go phases.",
                    label_visibility="collapsed"
                )
                infl_lifestyle = infl_lifestyle_pct / 100.0
            with ic3:
                end_age = st.number_input(
                    "Plan to Age",
                    min_value=70, max_value=105, step=1,
                    help="Maximum planning horizon (both persons)",
                    label_visibility="collapsed",
                    key="end_age_input"
                )

            # ===== Spending Phases: 6 columns =====
            # Session state defaults initialized at top of app, will be overwritten by file loading if scenario is loaded

            st.markdown("**Spending Phases**")
            sp_l1, sp_l2, sp_l3, sp_l4, sp_l5, sp_l6 = st.columns(6)
            sp_l1.caption("Go-Go ($)")
            sp_l2.caption("to Age")
            sp_l3.caption("Slow-Go ($)")
            sp_l4.caption("to Age")
            sp_l5.caption("No-Go ($)")
            sp_l6.caption("TFSA/Yr ($)")

            sp1, sp2, sp3, sp4, sp5, sp6 = st.columns(6)
            with sp1:
                go_go = st.number_input("Go-Go ($)",
                                        step=1000.0,
                                        help="Typically higher spend early in retirement.",
                                        key="spending_go_go",
                                        label_visibility="collapsed")
            with sp2:
                go_end = st.number_input("to Age",
                                        step=1,
                                        key="go_go_end_age",
                                        label_visibility="collapsed")
            with sp3:
                slow_go = st.number_input("Slow-Go ($)",
                                          step=1000.0,
                                          help="Moderate spend as travel/activity slows.",
                                          key="spending_slow_go",
                                          label_visibility="collapsed")
            with sp4:
                slow_end = st.number_input("to Age",
                                          step=1,
                                          key="slow_go_end_age",
                                          label_visibility="collapsed")
            with sp5:
                no_go = st.number_input("No-Go ($)",
                                        step=1000.0,
                                        help="Lower spend in later years.",
                                        key="spending_no_go",
                                        label_visibility="collapsed")
            with sp6:
                tfsa_contrib = st.number_input("TFSA/Yr ($)",
                                               step=500.0,
                                               label_visibility="collapsed",
                                               key="tfsa_contribution_each",
                                               min_value=0.0,
                                               value=7000.0,
                                               help="Target annual TFSA contribution per person (limited by available room from CRA + non-registered balance). 2024-2025 limit: $7,000/year.")

            if slow_end <= go_end:
                st.warning('"Slow-Go ends at age" should be greater than "Go-Go ends at age."')

            # ===== Strategy and Advanced Controls: Side-by-side columns =====
            st_col, ac_col = st.columns(2)

            with st_col:
                with st.expander("⚡ Withdrawal Strategy", expanded=True):
                    strategy_label = st.radio(
                        "Choose a strategy",
                        options=[
                            "Strategy A — NonReg → RRIF → Corp → TFSA",
                            "Strategy B — RRIF → Corp → NonReg → TFSA",
                            "Strategy C — Corp → RRIF → NonReg → TFSA",
                            "Hybrid — (RRIF top-up first) → NonReg → Corp → TFSA",
                            "⭐ Balanced — Optimized for tax efficiency (NEW)",
                            "🎯 GIS-Optimized — Maximize Government benefits (NonReg→Corp→TFSA→RRIF)",
                        ],
                        index=1
                    )
                    strategy_map = {
                        "Strategy A — NonReg → RRIF → Corp → TFSA": "NonReg->RRIF->Corp->TFSA",
                        "Strategy B — RRIF → Corp → NonReg → TFSA": "RRIF->Corp->NonReg->TFSA",
                        "Strategy C — Corp → RRIF → NonReg → TFSA": "Corp->RRIF->NonReg->TFSA",
                        "Hybrid — (RRIF top-up first) → NonReg → Corp → TFSA": "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
                        "⭐ Balanced — Optimized for tax efficiency (NEW)": "Balanced (Optimized for tax efficiency)",
                        "🎯 GIS-Optimized — Maximize Government benefits (NonReg→Corp→TFSA→RRIF)": "GIS-Optimized (NonReg->Corp->TFSA->RRIF)",
                    }
                    strategy = strategy_map[strategy_label]

                    # Balanced strategy info box
                    if "Balanced" in strategy:
                        st.info("""
                        #### ⭐ Balanced Strategy Selected

                        This strategy **automatically optimizes withdrawals** to minimize taxes and maximize legacy.

                        **How it works:**
                        1. Withdraws RRIF **minimum only** (not excess)
                        2. Prioritizes Corporate capital dividends (CDA) - **zero tax**
                        3. Uses Non-Registered accounts with high ACB - **minimal gains tax**
                        4. Defers excess RRIF withdrawals - **lower RRIF at death = lower tax**
                        5. Preserves TFSA to end - **100% tax-free to heirs**

                        **Expected benefits:**
                        ✅ 10-15% lower annual taxes
                        ✅ $100-200K+ additional legacy to heirs
                        ✅ Better RRIF minimum management
                        ✅ Optimized income-splitting

                        See **Advanced** tab for detailed technical guide.
                        """)

                    # GIS-Optimized strategy info box
                    if "GIS-Optimized" in strategy:
                        st.info("""
                        #### 🎯 GIS-Optimized Strategy Selected

                        This strategy **maximizes Government Income Supplement (GIS)** for low-income seniors age 65+.

                        **How it works:**
                        1. Calculates the cost of each withdrawal source (tax + GIS impact)
                        2. Ranks sources: TFSA < Non-Registered < Corporate < RRIF
                        3. Withdraws from lowest-cost sources first
                        4. Preserves net income below GIS thresholds (~$22.3K single, ~$29.4K couple)
                        5. Respects RRIF minimums (mandatory by CRA)

                        **Expected benefits:**
                        ✅ Recover $5,000-$12,000+ annually in GIS benefits
                        ✅ 50% less tax on each withdrawal (due to GIS clawback prevention)
                        ✅ Preserve more capital for retirement
                        ✅ Better outcome for couples (income splitting friendly)

                        See **Advanced** tab for detailed GIS calculation details.
                        """)

                    hybrid_topup = 0
                    if "Hybrid" in strategy:
                        hybrid_topup = st.number_input(
                            "RRIF top-up / person / year ($)",
                            value=10000, min_value=0, step=1000,
                            help="Top-up from RRIF before other sources to reach after-tax needs."
                        )
                    elif "Balanced" in strategy:
                        st.info(
                            "💡 **Balanced strategy note:** Does not use a fixed RRIF top-up. "
                            "Instead, it withdraws only the CRA-required minimum and optimizes withdrawals dynamically."
                        )

                    split_pct = st.slider(
                        "RRIF Pension Splitting (max 50%)",
                        0.0, 0.5, 0.5, 0.05,
                        help="If age ≥ 65, you can allocate up to 50% of RRIF as pension income to the spouse."
                    )

            with ac_col:
                with st.expander("⚙️ Advanced Controls", expanded=True):
                    fail_tol = st.slider(
                        "Funding gap tolerance ($)",
                        min_value=100.0, max_value=25000.0, value=5000.0, step=500.0,
                        format="$%.0f",
                        help="Maximum acceptable annual shortfall. Plans with shortfalls below this amount are considered successful for that year. $5,000 is typical for handling normal market volatility."
                    )

                    stop_on_fail = st.checkbox(
                        "Stop simulation on first underfunded year",
                        value=False,
                        help="When enabled, the simulation halts immediately when a year cannot meet spending target."
                    )

                    reinvest_nonreg_dist = st.checkbox(
                        "Reinvest non-reg distributions",
                        value=False,
                        key="reinvest_nonreg_dist_checkbox",
                        help="Reinvest distributions rather than using for spending."
                    )

                    no_corp = st.checkbox(
                        "Disable corporate account",
                        value=False,
                        help="Removes corporate account from withdrawal strategy."
                    )

                    # ===== Emergency Withdrawal Modeling (Risk Mitigation) =====
                    st.divider()
                    st.markdown("**🚨 Emergency Withdrawal Modeling (Risk Mitigation)**")

                    enable_emergency = st.checkbox(
                        "Enable emergency withdrawal modeling",
                        value=False,
                        key="enable_emergency_withdrawals",
                        help="Simulate unexpected large expenses (medical, home repair, family help) during retirement."
                    )

                    if enable_emergency:
                        col_freq, col_amt = st.columns(2)

                        with col_freq:
                            emergency_frequency = st.selectbox(
                                "Emergency Frequency",
                                options=[0.10, 0.25, 0.50],
                                index=1,  # Default to 25% (index 1)
                                format_func=lambda x: {
                                    0.10: "10% annual probability",
                                    0.25: "25% annual probability",
                                    0.50: "50% annual probability"
                                }[x],
                                key="emergency_frequency",
                                help="Probability that an unexpected expense occurs in any given year"
                            )

                        with col_amt:
                            emergency_size = st.radio(
                                "Emergency Size",
                                options=["small", "medium", "large", "custom"],
                                index=1,  # Default to "medium"
                                format_func=lambda x: {
                                    "small": "Small ($5K-$15K)",
                                    "medium": "Medium ($15K-$50K)",
                                    "large": "Large ($50K-$150K)",
                                    "custom": "Custom Range"
                                }[x],
                                key="emergency_size",
                                help="Range of potential emergency withdrawal amounts"
                            )

                        # Map presets to ranges
                        emergency_ranges = {
                            "small": (5000, 15000),
                            "medium": (15000, 50000),
                            "large": (50000, 150000),
                        }

                        if emergency_size == "custom":
                            col_min, col_max = st.columns(2)
                            with col_min:
                                emergency_min = st.number_input(
                                    "Min Emergency ($)",
                                    min_value=1000,
                                    max_value=200000,
                                    value=15000,
                                    step=5000,
                                    key="emergency_min"
                                )
                            with col_max:
                                emergency_max = st.number_input(
                                    "Max Emergency ($)",
                                    min_value=emergency_min + 1000,
                                    max_value=300000,
                                    value=50000,
                                    step=5000,
                                    key="emergency_max"
                                )
                            emergency_min_amt, emergency_max_amt = emergency_min, emergency_max
                        else:
                            emergency_min_amt, emergency_max_amt = emergency_ranges[emergency_size]

                        st.caption(
                            f"📌 Simulations will include random emergency withdrawals in {emergency_frequency*100:.0f}% of years, "
                            f"ranging ${emergency_min_amt:,.0f}-${emergency_max_amt:,.0f}"
                        )

                        # Store computed min/max to session state for use in Monte Carlo
                        # We use separate keys to avoid conflicts with the widgets
                        st.session_state["_emergency_min_computed"] = emergency_min_amt
                        st.session_state["_emergency_max_computed"] = emergency_max_amt

                        # DEBUG: Verify values are stored
                        print(f"DEBUG UI: Emergency enabled! min_amt={emergency_min_amt}, max_amt={emergency_max_amt}, freq={emergency_frequency}")
            # Persist flags used elsewhere
            st.session_state["province"] = province
            st.session_state["no_corp"] = no_corp
            # Note: All emergency withdrawal keys are auto-saved by their widgets:
            #   - enable_emergency_withdrawals: from checkbox
            #   - emergency_frequency: from selectbox
            #   - emergency_size: from radio
            #   - emergency_min: from number_input (if custom)
            #   - emergency_max: from number_input (if custom)
            # Note: reinvest_nonreg_dist is auto-saved by checkbox's key="reinvest_nonreg_dist_checkbox"


            
    # ===== Right rail: Enhanced preview with larger text =====
    with right:
        st.markdown("### 📊 Quick Summary")

        # ===== General Info (1st) =====
        st.markdown("#### ℹ️ General Info")
        mp1, mp2 = st.columns(2)
        with mp1:
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #f5f5f5; border-radius: 5px; margin-bottom: 5px;'>Province: {province}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #f5f5f5; border-radius: 5px;'>General Inflation: {inflation_pct:.2f}%</div>", unsafe_allow_html=True)
        with mp2:
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #f5f5f5; border-radius: 5px; margin-bottom: 5px;'>Plan to Age: {end_age}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #f5f5f5; border-radius: 5px;'>Lifestyle Inflation: {infl_lifestyle_pct:.2f}%</div>", unsafe_allow_html=True)

        # Starting Net Worth (2nd) (moved from dashboard)
        st.divider()
        st.markdown("#### 💰 Starting Net Worth (Household)")

        # Get account balances from session state (populated by user input in Account Balances tab)
        p1_rrsp = float(st.session_state.get("p1_rrsp", 0) or 0)
        p1_rrif = float(st.session_state.get("p1_rrif", 0) or 0)
        p1_tfsa = float(st.session_state.get("p1_tfsa", 0) or 0)
        p1_nonreg = float(st.session_state.get("p1_nonreg", 0) or 0)
        p1_corp = float(st.session_state.get("p1_corp", 0) or 0)

        p2_rrsp = float(st.session_state.get("p2_rrsp", 0) or 0)
        p2_rrif = float(st.session_state.get("p2_rrif", 0) or 0)
        p2_tfsa = float(st.session_state.get("p2_tfsa", 0) or 0)
        p2_nonreg = float(st.session_state.get("p2_nonreg", 0) or 0)
        p2_corp = float(st.session_state.get("p2_corp", 0) or 0)

        # Calculate totals by account type
        total_rrsp = p1_rrsp + p2_rrsp
        total_rrif = p1_rrif + p2_rrif
        total_tfsa = p1_tfsa + p2_tfsa
        total_nonreg = p1_nonreg + p2_nonreg
        total_corp = p1_corp + p2_corp
        total_all = total_rrsp + total_rrif + total_tfsa + total_nonreg + total_corp

        sn1, sn2, sn3 = st.columns([1, 1, 1.1])
        with sn1:
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #d6e8f5; border-radius: 5px; margin-bottom: 5px;'>🟦 TFSA: ${total_tfsa:,.0f}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #d4f1d4; border-radius: 5px;'>🟩 RRSP: ${total_rrsp:,.0f}</div>", unsafe_allow_html=True)
        with sn2:
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #e8d6f1; border-radius: 5px; margin-bottom: 5px;'>🟪 RRIF: ${total_rrif:,.0f}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #e8e8e8; border-radius: 5px;'>⬜ Non-Reg: ${total_nonreg:,.0f}</div>", unsafe_allow_html=True)
        with sn3:
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #ffe8d6; border-radius: 5px; margin-bottom: 5px;'>🟧 Corp: ${total_corp:,.0f}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #f0f2f6; border-radius: 5px;'>Total: ${total_all:,.0f}</div>", unsafe_allow_html=True)

        # Expected Annual Yields (3rd)
        st.divider()
        st.markdown("#### 📈 Expected Annual Yields")

        # Get yields from session state
        p1_tfsa_yield = float(st.session_state.get("p1_y_tfsa", 5.00))
        p1_rrif_yield = float(st.session_state.get("p1_y_rrif", 5.00))
        p1_rrsp_yield = float(st.session_state.get("p1_y_rrsp", 5.00))
        p1_nr_yield = get_nonreg_blended_yield("p1")
        p1_corp_yield = get_corp_blended_yield("p1")

        p2_tfsa_yield = float(st.session_state.get("p2_y_tfsa", 5.00))
        p2_rrif_yield = float(st.session_state.get("p2_y_rrif", 5.00))
        p2_rrsp_yield = float(st.session_state.get("p2_y_rrsp", 5.00))
        p2_nr_yield = get_nonreg_blended_yield("p2")
        p2_corp_yield = get_corp_blended_yield("p2")

        # Display yields in larger format with color coding
        y1, y2 = st.columns(2)

        with y1:
            st.markdown("<div style='font-size: 14px; font-weight: bold; margin-bottom: 5px;'>👤 Person 1</div>", unsafe_allow_html=True)
            st.markdown(f"""
            <div style='font-size: 13px; line-height: 1.8;'>
            🟦 TFSA: <b>{p1_tfsa_yield:.1f}%</b><br>
            🟪 RRIF: <b>{p1_rrif_yield:.1f}%</b><br>
            🟩 RRSP: <b>{p1_rrsp_yield:.1f}%</b><br>
            ⬜ Non-Reg: <b>{p1_nr_yield:.1f}%</b><br>
            🟧 Corp: <b>{p1_corp_yield:.1f}%</b>
            </div>
            """, unsafe_allow_html=True)

        with y2:
            st.markdown("<div style='font-size: 14px; font-weight: bold; margin-bottom: 5px;'>👥 Person 2</div>", unsafe_allow_html=True)
            st.markdown(f"""
            <div style='font-size: 13px; line-height: 1.8;'>
            🟦 TFSA: <b>{p2_tfsa_yield:.1f}%</b><br>
            🟪 RRIF: <b>{p2_rrif_yield:.1f}%</b><br>
            🟩 RRSP: <b>{p2_rrsp_yield:.1f}%</b><br>
            ⬜ Non-Reg: <b>{p2_nr_yield:.1f}%</b><br>
            🟧 Corp: <b>{p2_corp_yield:.1f}%</b>
            </div>
            """, unsafe_allow_html=True)

        # ===== Withdrawal Strategy (4th) =====
        st.divider()
        st.markdown("#### ⚡ Withdrawal Strategy")
        strategy_short = strategy.replace(" -> ", " → ").replace(" (", "\n(")
        st.markdown(f"<div style='font-size: 16px; font-weight: bold; padding: 10px; background-color: #f0f2f6; border-radius: 5px;'>{strategy_short}</div>", unsafe_allow_html=True)
        st.caption(f"RRIF Split: {split_pct*100:.0f}%" + (f" | Top-up: ${hybrid_topup:,.0f}/yr" if "Hybrid" in strategy else ""))

        # ===== Spending Phases (5th) =====
        st.divider()
        st.markdown("#### 💰 Spending Phases")
        st.markdown(f"""
        <div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #e8f5e9; border-radius: 5px; margin-bottom: 5px;'>
        🟢 Go-Go: ${go_go:,.2f}/yr → age {go_end}
        </div>
        <div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #fff9c4; border-radius: 5px; margin-bottom: 5px;'>
        🟡 Slow-Go: ${slow_go:,.2f}/yr → age {slow_end}
        </div>
        <div style='font-size: 15px; font-weight: bold; padding: 8px; background-color: #ffebee; border-radius: 5px;'>
        🔴 No-Go: ${no_go:,.2f}/yr
        </div>
        """, unsafe_allow_html=True)

        # Monte Carlo summary (if available)
        mc_runs_df_list = st.session_state.get("mc_runs_df_list")
        success_pct = st.session_state.get("success_pct")
        if mc_runs_df_list:
            planned_years = int(end_age - min(p1_start_age, p2_start_age) + 1)
            run_lengths = [len(d) for d in mc_runs_df_list if d is not None]
            total_years = max(planned_years, max(run_lengths) if run_lengths else planned_years, 1)
            yf = [years_funded_from_df(d) for d in mc_runs_df_list]

            if success_pct is None:
                success_runs = sum(1 for y in yf if y >= total_years)
                success_pct = 100.0 * success_runs / max(len(yf), 1)

            med_yf = int(np.median(yf)) if yf else 0
            p10_yf = int(np.percentile(yf, 10)) if yf else 0
            p90_yf = int(np.percentile(yf, 90)) if yf else 0

            st.metric(
                label="Success Probability (Monte Carlo)",
                value=f"{success_pct:.0f}% ({med_yf}/{total_years} years)",
                help="Percent of runs that fund every plan year; bracket shows the median years funded."
            )
            st.caption(f"Years funded distribution (10th–50th–90th): {p10_yf} / {med_yf} / {p90_yf} of {total_years}.")

    # Persist all simulation control values
    st.session_state["fail_tol"] = fail_tol
    st.session_state["gap_tolerance"] = fail_tol  # Also save under the Household field name
    st.session_state["stop_on_fail"] = stop_on_fail
    # NOTE: The following are auto-saved by their widget keys - DO NOT manually assign:
    # - end_age_input (key="end_age_input")
    # - p1_age (key="p1_age")
    # - p2_age (key="p2_age")
    # - start_year (key="start_year")
    # - spending_go_go, go_go_end_age, spending_slow_go, slow_go_end_age, spending_no_go (have key= parameters)
    # - tfsa_contribution_each (key="tfsa_contribution_each")
    # - spending_inflation_pct and general_inflation_pct (key= parameters)
    # Streamlit automatically manages these via their widget keys
    st.session_state["strategy"] = strategy
    st.session_state["income_split_rrif_fraction"] = split_pct
    st.session_state["hybrid_rrif_topup_per_person"] = hybrid_topup
    # reinvest_nonreg_dist is auto-saved by checkbox's key="reinvest_nonreg_dist_checkbox"
    # no_corp is already persisted above


with tab2:
    st.header("Account Balances & Income Sources")
    st.caption("Enter starting account balances and pension income. These values drive the withdrawal calculations.")

    col_p1, col_p2 = st.columns(2)
    with col_p1:
        st.subheader("Person 1")
        #Person Data
        p1_name = st.text_input("Name:", key="p1_name")
        with st.expander("Person 1 — Pensions & Balances", expanded=True):
            st.markdown("##### Enter Pensions")
            st.caption("Government retirement benefits (CPP/OAS).")

            p1_cpp_start = st.number_input("CPP start age (P1):", min_value=60, max_value=70, help="Age when CPP benefits begin (60-70)", key="p1_cpp_start")
            p1_cpp_amt = st.number_input("CPP annual at start (P1):", step=500, help="Annual CPP amount at start", key="p1_cpp_amt")
            p1_oas_start = st.number_input("OAS start age (P1):", min_value=65, max_value=70, help="Age when OAS benefits begin (65-70)", key="p1_oas_start")
            p1_oas_amt = st.number_input("OAS annual at start (P1):", step=500, help="Annual OAS amount at start", key="p1_oas_amt")

            st.divider()

            st.markdown("##### Enter Account Balances")
            st.caption("Starting account values at simulation start.")

            p1_rrsp = st.number_input("RRSP balance (P1):", step=10000, key="p1_rrsp", help="Registered Retirement Savings Plan balance")
            p1_rrif = st.number_input("RRIF balance (P1):", step=10000, key="p1_rrif")
            p1_tfsa = st.number_input("TFSA balance (P1):", step=10000, key="p1_tfsa")
            p1_nonreg = st.number_input("Non-Registered balance (P1):", step=10000, key="p1_nonreg")

            if not no_corp:
                p1_corp = st.number_input("Corporate balance (P1):", step=10000, key="p1_corp")
            else:
                p1_corp = 0.0
                st.session_state["p1_corp"] = 0.0

            st.divider()

            st.markdown("##### Approximate Yields & Assumptions")
            st.caption("Expected annual returns for each account type. To edit details, see **Advanced > Yields & Buckets**.")

            # Registered Accounts
            st.markdown("**Registered Accounts**")
            reg_col1, reg_col2, reg_col3 = st.columns(3)

            with reg_col1:
                p1_tfsa_val = float(st.session_state.get("p1_y_tfsa", 5.00))
                st.metric("TFSA Growth Rate", f"{p1_tfsa_val:.2f}%")

            with reg_col2:
                p1_rrif_val = float(st.session_state.get("p1_y_rrif", 5.00))
                st.metric("RRIF Growth Rate", f"{p1_rrif_val:.2f}%")

            with reg_col3:
                p1_rrsp_val = float(st.session_state.get("p1_y_rrsp", 5.00))
                st.metric("RRSP Growth Rate", f"{p1_rrsp_val:.2f}%")

            st.divider()

            # Non-Registered
            st.markdown("**Non-Registered Account (Taxable)**")
            nr_col1, nr_col2 = st.columns([2, 1])
            nr_blended = get_nonreg_blended_yield("p1")
            with nr_col1:
                st.metric("Blended Annual Yield", f"{nr_blended:.2f}%")
            with nr_col2:
                st.markdown("**Breakdown:**")
                # Get allocation percentages from session state (default to 0% if not set)
                p1_nr_total = float(st.session_state.get("p1_nonreg", 0.0))
                p1_nr_cash_pct = float(st.session_state.get("p1_nr_cash_pct", 0.0)) if p1_nr_total > 0 else 0.0
                p1_nr_gic_pct = float(st.session_state.get("p1_nr_gic_pct", 0.0)) if p1_nr_total > 0 else 0.0
                p1_nr_inv_pct = float(st.session_state.get("p1_nr_inv_pct", 100.0)) if p1_nr_total > 0 else 100.0

                # Get yields from Tab 2 inputs
                p1_cash_yield = float(st.session_state.get('p1_y_cash', 2.00))
                p1_gic_yield = float(st.session_state.get('p1_y_gic', 3.30))
                p1_inv_yield = float(st.session_state.get('p1_y_inv_total', 4.00))

                st.caption(f"• Cash ({p1_nr_cash_pct:.0f}%): {p1_cash_yield:.2f}%\n"
                          f"• GIC ({p1_nr_gic_pct:.0f}%): {p1_gic_yield:.2f}%\n"
                          f"• Investments ({p1_nr_inv_pct:.0f}%): {p1_inv_yield:.2f}%")
            st.caption("👉 To adjust allocations, go to **Advanced > Yields & Buckets**")

            st.divider()

            # Corporate
            st.markdown("**Corporate Account**")
            corp_col1, corp_col2 = st.columns([2, 1])
            corp_blended = get_corp_blended_yield("p1")
            with corp_col1:
                st.metric("Blended Annual Yield", f"{corp_blended:.2f}%")
            with corp_col2:
                st.markdown("**Breakdown:**")
                st.caption(f"• Cash: {float(st.session_state.get('p1_y_c_c', 0.00)):.2f}%\n"
                          f"• GIC: {float(st.session_state.get('p1_y_c_g', 3.00)):.2f}%\n"
                          f"• Investments: {float(st.session_state.get('p1_y_c_i', 3.00)):.2f}%")
            st.caption("👉 To adjust components, go to **Advanced > Yields & Buckets**")

    with col_p2:
        st.subheader("Person 2")
        #Person Data
        p2_name = st.text_input("Name:", key="p2_name")
        with st.expander("Person 2 — Pensions & Balances", expanded=True):
            st.markdown("##### Enter Pensions")
            st.caption("Government retirement benefits (CPP/OAS).")

            p2_cpp_start = st.number_input("CPP start age (P2):", min_value=60, max_value=70, help="Age when CPP benefits begin (60-70)", key="p2_cpp_start")
            p2_cpp_amt = st.number_input("CPP amount annual at start (P2):", step=500, help="Annual CPP amount at start", key="p2_cpp_amt")
            p2_oas_start = st.number_input("OAS start age (P2):", min_value=65, max_value=70, help="Age when OAS benefits begin (65-70)", key="p2_oas_start")
            p2_oas_amt = st.number_input("OAS amount annual at start (P2):", step=500, help="Annual OAS amount at start", key="p2_oas_amt")

            st.divider()

            st.markdown("##### Enter Account Balances")
            st.caption("Starting account values at simulation start.")

            p2_rrsp = st.number_input("RRSP balance (P2):", step=10000, key="p2_rrsp", help="Registered Retirement Savings Plan balance")
            p2_rrif = st.number_input("RRIF balance (P2):", step=10000, key="p2_rrif")
            p2_tfsa = st.number_input("TFSA balance (P2):", step=10000, key="p2_tfsa")
            p2_nonreg = st.number_input("Non-Registered balance (P2):", step=10000, key="p2_nonreg")

            if not no_corp:
                p2_corp = st.number_input("Corporate balance (P2):", step=10000, key="p2_corp")
            else:
                p2_corp = 0.0
                st.session_state["p2_corp"] = 0.0

            st.divider()

            st.markdown("##### Approximate Yields & Assumptions")
            st.caption("Expected annual returns for each account type. To edit details, see **Advanced > Yields & Buckets**.")

            # Registered Accounts
            st.markdown("**Registered Accounts**")
            reg_col1, reg_col2, reg_col3 = st.columns(3)

            with reg_col1:
                p2_tfsa_val = float(st.session_state.get("p2_y_tfsa", 5.00))
                st.metric("TFSA Growth Rate", f"{p2_tfsa_val:.2f}%")

            with reg_col2:
                p2_rrif_val = float(st.session_state.get("p2_y_rrif", 5.00))
                st.metric("RRIF Growth Rate", f"{p2_rrif_val:.2f}%")

            with reg_col3:
                p2_rrsp_val = float(st.session_state.get("p2_y_rrsp", 5.00))
                st.metric("RRSP Growth Rate", f"{p2_rrsp_val:.2f}%")

            st.divider()
            # Non-Registered
            st.markdown("**Non-Registered Account (Taxable)**")
            nr_col1, nr_col2 = st.columns([2, 1])
            nr_blended = get_nonreg_blended_yield("p2")
            with nr_col1:
                st.metric("Blended Annual Yield", f"{nr_blended:.2f}%")
            with nr_col2:
                st.markdown("**Breakdown:**")
                # Get allocation percentages from session state (default to 0% if not set)
                p2_nr_total = float(st.session_state.get("p2_nonreg", 0.0))
                p2_nr_cash_pct = float(st.session_state.get("p2_nr_cash_pct", 0.0)) if p2_nr_total > 0 else 0.0
                p2_nr_gic_pct = float(st.session_state.get("p2_nr_gic_pct", 0.0)) if p2_nr_total > 0 else 0.0
                p2_nr_inv_pct = float(st.session_state.get("p2_nr_inv_pct", 100.0)) if p2_nr_total > 0 else 100.0

                # Get yields from Tab 2 inputs
                p2_cash_yield = float(st.session_state.get('p2_y_cash', 2.00))
                p2_gic_yield = float(st.session_state.get('p2_y_gic', 3.30))
                p2_inv_yield = float(st.session_state.get('p2_y_inv_total', 4.00))

                st.caption(f"• Cash ({p2_nr_cash_pct:.0f}%): {p2_cash_yield:.2f}%\n"
                          f"• GIC ({p2_nr_gic_pct:.0f}%): {p2_gic_yield:.2f}%\n"
                          f"• Investments ({p2_nr_inv_pct:.0f}%): {p2_inv_yield:.2f}%")
            st.caption("👉 To adjust allocations, go to **Advanced > Yields & Buckets**")

            st.divider()

            # Corporate
            st.markdown("**Corporate Account**")
            corp_col1, corp_col2 = st.columns([2, 1])
            corp_blended = get_corp_blended_yield("p2")
            with corp_col1:
                st.metric("Blended Annual Yield", f"{corp_blended:.2f}%")
            with corp_col2:
                st.markdown("**Breakdown:**")
                st.caption(f"• Cash: {float(st.session_state.get('p2_y_c_c', 0.00)):.2f}%\n"
                          f"• GIC: {float(st.session_state.get('p2_y_c_g', 3.00)):.2f}%\n"
                          f"• Investments: {float(st.session_state.get('p2_y_c_i', 3.00)):.2f}%")
            st.caption("👉 To adjust components, go to **Advanced > Yields & Buckets**")

with tab3:
    st.header("Advanced Settings")

    # NEW: Balanced Strategy Deep Dive Section
    with st.expander("🎯 Balanced Strategy: Complete Technical Guide", expanded=False):
        st.markdown("""
        ## Balanced Withdrawal Strategy — Technical Guide

        ### 🚨 Critical Tax Fact: RRIF is 100% Taxable at Death

        When you die in Canada with a RRIF balance:
        - **100% of the balance becomes taxable income** on your final return
        - **NOT 50% like capital gains** (NonReg)
        - **NOT 0% like TFSA** (Tax-free savings)
        - Example: $500,000 RRIF @ 53.5% bracket = **$267,500 in taxes**

        This is why RRIF management is critical for legacy planning!

        ---

        ### How the Balanced Strategy Works

        Each year, the strategy:

        1. **Withdraws RRIF strategically** (may be above minimum when beneficial)
           - Only takes what's needed for spending
           - May extract MORE if spouse in lower bracket (tax optimization)
           - Spouse reinvests extracted RRIF to their TFSA (converts taxable → tax-free!)
           - Goal: Minimize RRIF balance at death (saves 100% inclusion tax)

        2. **Prioritizes Corporate capital dividends (CDA)**
           - CDA withdrawals are TAX-FREE (retained earnings distribution)
           - No income reported to CRA
           - Best source for tax-free liquidity

        3. **Uses Non-Registered with high ACB**
           - Accounts with high Adjusted Cost Base = lower capital gains
           - Targets accounts with gains close to cost basis
           - Minimizes capital gains inclusion (50%)

        4. **Defers excess RRIF withdrawals**
           - Only takes minimum if that's all that's needed
           - Reduces tax bracket creep
           - Reduces OAS clawback
           - Leaves more for future years

        5. **Preserves TFSA to end**
           - TFSA withdrawals are absolute last resort
           - At death, TFSA balance = 100% tax-free to heirs
           - Best account for legacy

        ---

        ### Who Should Use Balanced Strategy

        **IDEAL FOR:**
        ✅ Multiple account types (RRIF, Corp, NonReg, TFSA)
        ✅ Corporate account with active CDA (Capital Dividend Account)
        ✅ Tax optimization is priority
        ✅ Estate planning focus (legacy maximization)
        ✅ High net worth households
        ✅ Households with good tax tracking

        **NOT IDEAL FOR:**
        ❌ Very simple household (only RRIF and TFSA)
        ❌ No corporate account
        ❌ Zero CDA balance
        ❌ Prefer simple fixed strategies
        ❌ Limited tax/accounting knowledge

        ---

        ### Typical Savings with Balanced Strategy

        For Juan (75) & Daniela (72):

        | Metric | Savings |
        |--------|---------|
        | Year 1 Tax | -26% (~$16,600) |
        | Annual Tax (avg) | -15% (~$5,000) |
        | 10-Year Tax Total | -$60,000 |
        | Portfolio Gain | +$370,000 (10 years) |
        | Legacy Increase | +$452,725 (at death) |
        | Retirement Longevity | +3 years longer |

        ---

        ### Configuration Notes

        **Balanced strategy does NOT use:**
        - Fixed RRIF top-up (leave at 0)
        - Simple withdrawal order (uses dynamic optimization)
        - Single-account focus (optimizes household-wide)

        **Balanced strategy DOES:**
        - Optimize household tax jointly (both spouses)
        - Consider spouse tax brackets
        - Track Corp CDA vs regular dividends
        - Minimize RRIF balance at death
        - Preserve TFSA for legacy

        ---

        ### Annual Monitoring Checklist

        1. **Corporate CDA Status**
           - Is CDA balance growing or shrinking?
           - Any new retained earnings?
           - Plan for CDA depletion (10+ year horizon)

        2. **NonReg ACB Tracking**
           - Which accounts have highest ACB?
           - Which have realized gains?
           - Adjust sales from highest-ACB accounts

        3. **RRIF Minimum Accuracy**
           - Verify age-based percentage with CRA tables
           - Check actual balance on year-end statements
           - Confirm actual withdrawal met minimum

        4. **OAS/QAS Thresholds**
           - Balanced keeps income lower (usually)
           - May help avoid OAS clawback
           - Review income in May after tax year ends

        5. **Spouse Income-Splitting**
           - Is income balanced between spouses?
           - Could spousal RRIF help further?
           - Consider income-splitting opportunities

        ---

        ### Example: Strategic RRIF Extraction

        **Year 1 - Both spouses alive:**
        ```
        Juan's RRIF: $800,000 @ 53.5% bracket
        Daniela's RRIF: $600,000 @ 40.7% bracket

        Strategy decision:
        Juan withdraws: $30,000 from RRIF
          Tax cost: $30,000 × 53.5% = $16,050
          After-tax: $13,950

        BUT: Daniela receives it, puts it in her TFSA
          Tax cost to her: $0
          After-tax: $30,000 (tax-free growth!)

        Result: Converted $30,000 RRIF (100% taxable at death)
                → $30,000 TFSA (0% taxable at death)
                Saves: $16,050 in death taxes!

        Over 10 years: Could save $150,000+ in death taxes!
        ```

        ---

        ### Learn More

        📄 **Full Documentation:**
        - See "BALANCED_STRATEGY_JUAN_DANIELA_SCENARIOS.md" for detailed household analysis
        - See "CRITICAL_INSIGHT_RRIF_TAXATION.md" for tax law details
        - See "UI_UX_DESIGN_BALANCED_STRATEGY.md" for implementation guide

        ---
        """)

    st.divider()
    st.header("Yields & Buckets")
    st.caption("For most users, simple account balances (Tab 2) are sufficient. Below you can optionally configure detailed bucket breakdowns "
               "for granular control over non-registered (taxable) and corporate balances with per-bucket yield assumptions.")

    # Always show Person sections with detailed bucket configuration
    enable_buckets = True

    # Call this BEFORE any person_block() renders widgets
    _ensure_bucket_defaults(no_corp)

    # ---- person_block definition comes here  ----

    def _valarg(key, default):
        """Only supply a default if the key is not already in session_state."""
        return {} if key in st.session_state else {"value": float(default)}

    def _idxarg(key, default_index=0):
        """Only supply an index if the key is not already in session_state."""
        return {} if key in st.session_state else {"index": int(default_index)}


    def person_block(person_label: str,
                     tfsa_room_key: str,
                     tfsa_room_growth_key: str,
                     tfsa_growth_key: str,
                     rrif_growth_key: str,
                     rrsp_growth_key: str,
                     # Non-Reg balances & yields
                     nr_acb_key: str,
                     nr_cash_key: str, y_nr_cash_key: str,
                     nr_gic_key: str, y_nr_gic_key: str,
                     nr_inv_key: str,
                     y_nr_inv_total_key: str,
                     y_nr_inv_elig_key: str, y_nr_inv_nonel_key: str, y_nr_inv_cg_key: str, y_nr_inv_roc_key: str,
                     # Corporate balances & yields (simplified: combined investment yield)
                     corp_cash_key: str, y_corp_cash_key: str,
                     corp_gic_key: str,  y_corp_gic_key: str,
                     corp_inv_key: str,  y_corp_inv_key: str,
                     corp_divtype_key: str, corp_rdtoh_key: str,
                     # Tab 2 balance keys for read-only display
                     nr_total_key: str,
                     corp_total_key: str,
                     *,
                     no_corp: bool = False
                     ):
        # DEBUG: Verify person_block is being called
        #st.write(f"DEBUG: person_block called for {person_label}")

        with st.container(border=True):
            st.markdown(f"### {person_label} — Buckets & Yields")
            st.divider()

            st.markdown("##### Accounts — Global Growth Assumptions")
            st.caption("Configure TFSA room and investment growth assumptions.")

            # TFSA Room Guidance
            st.info(
                "**TFSA Starting Room**: Enter your cumulative TFSA contribution room from CRA. "
                "You can find this on:\n"
                "- CRA's My Account (login.canada.ca) → TFSA section\n"
                "- Your Notice of Assessment\n"
                "- CRA TFSA transaction summaries\n\n"
                "**Example**: Someone who opened a TFSA on Jan 1, 2009 and never withdrawn has ~$101,500 in room as of 2025."
            )

            c1, c2, c3 = st.columns(3)
            with c1:
                st.number_input(
                    f"TFSA starting room ($) — {person_label}",
                    step=1000.0,
                    key=tfsa_room_key,
                    help="Your cumulative unused TFSA contribution room available on simulation start date. Check CRA My Account to find this value.",
                    **_valarg(tfsa_room_key, 0.0)
                )
            with c2:
                st.number_input(
                    f"TFSA annual room increase ($) — {person_label}",
                    step=500.0,
                    key=tfsa_room_growth_key,
                    help="Annual TFSA room added each January (typically $7,000 for 2024-2025, plus any prior-year withdrawals).",
                    **_valarg(tfsa_room_growth_key, 7000.0)
                )
            with c3:
                pass  # Column reserved for growth rates section

            st.markdown("##### Growth Rates")

            g1, g2, g3 = st.columns(3)

            with g1:
                p_tfsa_growth = pct_input(f"TFSA growth — {person_label}", tfsa_growth_key, 5.00, step=0.10, fmt="%.2f")
            with g2:
                p_rrif_growth = pct_input(f"RRIF growth — {person_label}", rrif_growth_key, 5.00, step=0.10, fmt="%.2f")
            with g3:
                p_rrsp_growth = pct_input(f"RRSP growth — {person_label}", rrsp_growth_key, 5.00, step=0.10, fmt="%.2f")

            st.divider()

            # ===== NON-REGISTERED SECTION =====
            st.markdown("##### Non-Registered (Taxable) — Allocation & Yields")
            st.caption("Allocate your total non-registered balance (from Tab 2) into asset buckets, then define yields for each.")

            # Get total non-registered value from Tab 2
            nr_total = float(st.session_state.get(nr_total_key, 0.0))

            # Display total as metric
            st.metric("💰 Total Non-Registered (2025)", f"${nr_total:,.0f}")
            st.caption("(This value comes from **Tab 2: Account Balances** → Non-Registered balance)")

            st.divider()

            # Allocation percentages
            st.markdown("**Allocate into asset buckets:**")
            alloc_col1, alloc_col2, alloc_col3 = st.columns(3)

            # Initialize allocation percentage keys if needed
            alloc_cash_pct_key = nr_cash_key + "_pct"
            alloc_gic_pct_key = nr_gic_key + "_pct"
            alloc_inv_pct_key = nr_inv_key + "_pct"

            # Get current values from session state with defaults
            # Use actual session state values if they exist, otherwise use defaults
            current_cash_pct = float(st.session_state.get(alloc_cash_pct_key, 0.0) or 0.0)
            current_gic_pct = float(st.session_state.get(alloc_gic_pct_key, 0.0) or 0.0)
            current_inv_pct = float(st.session_state.get(alloc_inv_pct_key, 100.0) or 100.0)

            # Clamp values to valid range (0-100) in case they were loaded incorrectly
            current_cash_pct = max(0.0, min(100.0, current_cash_pct))
            current_gic_pct = max(0.0, min(100.0, current_gic_pct))
            current_inv_pct = max(0.0, min(100.0, current_inv_pct))

            with alloc_col1:
                cash_pct = st.number_input(
                    f"Cash (%)",
                    min_value=0.0, max_value=100.0,
                    step=1.0,
                    value=current_cash_pct,
                    key=alloc_cash_pct_key,
                    help="Percentage of non-registered in cash",
                )
            with alloc_col2:
                gic_pct = st.number_input(
                    f"GIC (%)",
                    min_value=0.0, max_value=100.0,
                    step=1.0,
                    value=current_gic_pct,
                    key=alloc_gic_pct_key,
                    help="Percentage of non-registered in GIC",
                )
            with alloc_col3:
                inv_pct = st.number_input(
                    f"Investments (%)",
                    min_value=0.0, max_value=100.0,
                    step=1.0,
                    value=current_inv_pct,
                    key=alloc_inv_pct_key,
                    help="Percentage of non-registered in investments",
                )

            # Calculate totals and validate
            total_alloc_pct = cash_pct + gic_pct + inv_pct
            if total_alloc_pct != 100.0:
                st.warning(f"⚠️ Allocation percentages sum to {total_alloc_pct}% — must equal 100%. Current: {cash_pct}% + {gic_pct}% + {inv_pct}%")

            # Calculate dollar amounts from percentages
            cash_amt = nr_total * (cash_pct / 100.0) if total_alloc_pct > 0 else 0.0
            gic_amt = nr_total * (gic_pct / 100.0) if total_alloc_pct > 0 else 0.0
            inv_amt = nr_total * (inv_pct / 100.0) if total_alloc_pct > 0 else 0.0

            # Store calculated amounts in session state for use by simulation
            # NOTE: Use "_amt" suffix to avoid collision with yield keys (y_nr_cash_key, etc.)
            st.session_state[nr_cash_key + "_amt"] = cash_amt
            st.session_state[nr_gic_key + "_amt"] = gic_amt
            st.session_state[nr_inv_key + "_amt"] = inv_amt

            # Display calculated amounts
            st.divider()
            st.markdown("**Calculated dollar amounts:**")
            amt_col1, amt_col2, amt_col3, amt_col4 = st.columns(4)

            with amt_col1:
                st.metric("Cash", f"${cash_amt:,.0f}")
            with amt_col2:
                st.metric("GIC", f"${gic_amt:,.0f}")
            with amt_col3:
                st.metric("Investments", f"${inv_amt:,.0f}")
            with amt_col4:
                st.metric("Total", f"${cash_amt + gic_amt + inv_amt:,.0f}")

            st.divider()

            # ACB for Investments
            st.markdown("**Cost Basis:**")
            st.number_input(f"ACB for Investments ($) — {person_label}",
                            step=10000.0, key=nr_acb_key,
                            help="Adjusted Cost Base (original cost) for the Investments bucket. Unrealized gains = Market Value - ACB.",
                            **_valarg(nr_acb_key, 250000.0))

            st.divider()

            st.markdown("##### Non-Registered — Yields (% per year)")
            st.caption("Enter your investment return from bank statements (e.g., 4.5% per year). Optionally configure the tax breakdown for accurate tax calculations.")

            # Main inputs: cash, GIC, and TOTAL investment return
            y1, y2, y3 = st.columns(3)

            # NOTE: Session state keys are pre-initialized in _ensure_bucket_defaults()
            # DO NOT call setdefault() here - it creates binding conflicts
            # Streamlit widget binding via key= parameter handles persistence automatically

            with y1:
                _cash = pct_input(f"Cash interest — {person_label}", y_nr_cash_key, default_pct=2.00, step=0.10, fmt="%.2f")
            with y2:
                _gic = pct_input(f"GIC interest — {person_label}", y_nr_gic_key, default_pct=3.30, step=0.10, fmt="%.2f")
            with y3:
                # KEY FIELD: Total return on investments (what you see on bank statements)
                _total = pct_input(f"Invest: total return — {person_label}", y_nr_inv_total_key, default_pct=4.00, step=0.10, fmt="%.2f")

            # Optional: Tax breakdown (for detailed income tracking)
            with st.expander(f"📊 Tax Breakdown (Optional) — {person_label}", expanded=False):
                st.caption("Allocate your total investment return across income types for tax calculations. These should sum to your total return above.")

                # NOTE: Session state keys are pre-initialized in _ensure_bucket_defaults()
                # DO NOT call setdefault() here - it creates binding conflicts
                # Streamlit widget binding via key= parameter handles persistence automatically

                tb1, tb2, tb3, tb4 = st.columns(4)

                with tb1:
                    _elig = pct_input(f"Eligible dividend", y_nr_inv_elig_key, default_pct=2.00, step=0.10, fmt="%.2f")
                with tb2:
                    _nonelig = pct_input(f"Non-eligible dividend", y_nr_inv_nonel_key, default_pct=0.00, step=0.10, fmt="%.2f")
                with tb3:
                    _cg = pct_input(f"Capital gain", y_nr_inv_cg_key, default_pct=2.00, step=0.10, fmt="%.2f")
                with tb4:
                    yroc = pct_input(f"ROC", y_nr_inv_roc_key, default_pct=0.00, step=0.10, fmt="%.2f")
                
                total_components = _elig + _nonelig + _cg + yroc
                if abs(total_components - _total) > 0.01:
                    st.warning(f"⚠️ Components sum to {total_components:.2f}%, total is {_total:.2f}%. Consider adjusting so they match.")

            st.divider()

            if not no_corp:
                st.markdown("##### Corporation — Allocation & Yields")
                st.caption("Allocate your total corporate balance (from Tab 2) into asset buckets, then define yields for each.")

                # Get total corporate value from Tab 2
                corp_total = float(st.session_state.get(corp_total_key, 0.0))

                # Display total as metric
                st.metric("🏢 Total Corporate (2025)", f"${corp_total:,.0f}")
                st.caption("(This value comes from **Tab 2: Account Balances** → Corporate balance)")

                st.divider()

                # Allocation percentages for corporate
                st.markdown("**Allocate into asset buckets:**")
                corp_alloc_col1, corp_alloc_col2, corp_alloc_col3 = st.columns(3)

                # Initialize allocation percentage keys if needed
                alloc_corp_cash_pct_key = corp_cash_key + "_pct"
                alloc_corp_gic_pct_key = corp_gic_key + "_pct"
                alloc_corp_inv_pct_key = corp_inv_key + "_pct"

                # Get current values from session state with defaults
                # Use actual session state values if they exist, otherwise use defaults
                current_corp_cash_pct = float(st.session_state.get(alloc_corp_cash_pct_key, 0.0) or 0.0)
                current_corp_gic_pct = float(st.session_state.get(alloc_corp_gic_pct_key, 0.0) or 0.0)
                current_corp_inv_pct = float(st.session_state.get(alloc_corp_inv_pct_key, 100.0) or 100.0)

                # Clamp values to valid range (0-100) in case they were loaded incorrectly
                current_corp_cash_pct = max(0.0, min(100.0, current_corp_cash_pct))
                current_corp_gic_pct = max(0.0, min(100.0, current_corp_gic_pct))
                current_corp_inv_pct = max(0.0, min(100.0, current_corp_inv_pct))

                with corp_alloc_col1:
                    corp_cash_pct = st.number_input(
                        f"Corp Cash (%)",
                        min_value=0.0, max_value=100.0,
                        step=1.0,
                        value=current_corp_cash_pct,
                        key=alloc_corp_cash_pct_key,
                        help="Percentage of corporate in cash",
                    )
                with corp_alloc_col2:
                    corp_gic_pct = st.number_input(
                        f"Corp GIC (%)",
                        min_value=0.0, max_value=100.0,
                        step=1.0,
                        value=current_corp_gic_pct,
                        key=alloc_corp_gic_pct_key,
                        help="Percentage of corporate in GIC",
                    )
                with corp_alloc_col3:
                    corp_inv_pct = st.number_input(
                        f"Corp Investments (%)",
                        min_value=0.0, max_value=100.0,
                        step=1.0,
                        value=current_corp_inv_pct,
                        key=alloc_corp_inv_pct_key,
                        help="Percentage of corporate in investments",
                    )

                # Calculate totals and validate
                total_corp_alloc_pct = corp_cash_pct + corp_gic_pct + corp_inv_pct
                if total_corp_alloc_pct != 100.0:
                    st.warning(f"⚠️ Corp allocation percentages sum to {total_corp_alloc_pct}% — must equal 100%. Current: {corp_cash_pct}% + {corp_gic_pct}% + {corp_inv_pct}%")

                # Calculate dollar amounts from percentages
                corp_cash_amt = corp_total * (corp_cash_pct / 100.0) if total_corp_alloc_pct > 0 else 0.0
                corp_gic_amt = corp_total * (corp_gic_pct / 100.0) if total_corp_alloc_pct > 0 else 0.0
                corp_inv_amt = corp_total * (corp_inv_pct / 100.0) if total_corp_alloc_pct > 0 else 0.0

                # Store calculated amounts in session state for use by simulation
                # NOTE: Use "_amt" suffix to avoid collision with yield keys (y_corp_cash_key, etc.)
                st.session_state[corp_cash_key + "_amt"] = corp_cash_amt
                st.session_state[corp_gic_key + "_amt"] = corp_gic_amt
                st.session_state[corp_inv_key + "_amt"] = corp_inv_amt

                # Display calculated amounts
                st.divider()
                st.markdown("**Calculated dollar amounts:**")
                corp_amt_col1, corp_amt_col2, corp_amt_col3, corp_amt_col4 = st.columns(4)

                with corp_amt_col1:
                    st.metric("Corp Cash", f"${corp_cash_amt:,.0f}")
                with corp_amt_col2:
                    st.metric("Corp GIC", f"${corp_gic_amt:,.0f}")
                with corp_amt_col3:
                    st.metric("Corp Investments", f"${corp_inv_amt:,.0f}")
                with corp_amt_col4:
                    st.metric("Total", f"${corp_cash_amt + corp_gic_amt + corp_inv_amt:,.0f}")

                st.divider()

                # RDTOH
                st.markdown("**Refundable Dividend Tax On Hand:**")
                st.number_input(f"RDTOH opening balance ($) — {person_label}",
                                step=1000.0, key=corp_rdtoh_key,
                                help="Refundable Dividend Tax On Hand at start (used to refund some corp tax when dividends are paid).",
                                **_valarg(corp_rdtoh_key, 0.0))

                st.divider()

                st.markdown("##### Corporation — Yields (% per year)")
                st.caption("Set annual distribution rates for corporate holdings. Investment yield combines dividends and capital gains.")

                # NOTE: Session state keys are pre-initialized in _ensure_bucket_defaults()
                # DO NOT call setdefault() here - it creates binding conflicts
                # Streamlit widget binding via key= parameter handles persistence automatically

                cy1, cy2, cy3 = st.columns(3)

                with cy1:
                    _corp_cash = pct_input(f"Corp cash interest — {person_label}", y_corp_cash_key, default_pct=0.00, step=0.10, fmt="%.2f")
                with cy2:
                    _corp_gic = pct_input(f"Corp GIC interest — {person_label}", y_corp_gic_key, default_pct=3.00, step=0.10, fmt="%.2f")
                with cy3:
                    _corp_inv = pct_input(f"Corp investment yield — {person_label}", y_corp_inv_key, default_pct=3.00, step=0.10, fmt="%.2f",
                                          help="Combined return from dividends and capital gains on corporate investments.")

                st.selectbox(f"Corporate dividend type (when paid) — {person_label}",
                             options=["non-eligible", "eligible"], index=0, key=corp_divtype_key,
                             help="Determines how corporate dividends are taxed personally when paid from this person's corporation.",
                            **_idxarg(corp_divtype_key, 0),
                )
            else:
                # Corporate fields are hidden when corp is not enabled
                # Session state defaults are handled by _ensure_bucket_defaults()
                st.caption("corporation fields hidden (Corporation not considered in the plan)")

    # Always show Person sections with detailed bucket configuration
    col_p1_adv, col_p2_adv = st.columns(2)

    # ---------- PERSON 1 ----------
    with col_p1_adv:
        person_block(
            person_label="Person 1",
            tfsa_room_key="p1_tfsa_room",
            tfsa_room_growth_key="p1_tfsa_room_growth",
            tfsa_growth_key="p1_y_tfsa",
            rrif_growth_key="p1_y_rrif",
            rrsp_growth_key="p1_y_rrsp",
            nr_acb_key="p1_nonreg_acb",
            nr_cash_key="p1_nr_cash", y_nr_cash_key="p1_y_cash",
            nr_gic_key="p1_nr_gic",   y_nr_gic_key="p1_y_gic",
            nr_inv_key="p1_nr_inv",
            y_nr_inv_total_key="p1_y_inv_total",
            y_nr_inv_elig_key="p1_y_inv_elig",
            y_nr_inv_nonel_key="p1_y_inv_nonel",
            y_nr_inv_cg_key="p1_y_inv_cg",
            y_nr_inv_roc_key="p1_y_inv_roc",
            corp_cash_key="p1_c_c",   y_corp_cash_key="p1_y_c_c",
            corp_gic_key="p1_c_g",    y_corp_gic_key="p1_y_c_g",
            corp_inv_key="p1_c_i",    y_corp_inv_key="p1_y_c_i",
            corp_divtype_key="p1_corp_divtype",
            corp_rdtoh_key="p1_rdtoh",
            nr_total_key="p1_nonreg",
            corp_total_key="p1_corp",
            no_corp=no_corp,
        )

    # ---------- PERSON 2 ----------
    with col_p2_adv:
        person_block(
            person_label="Person 2",
            tfsa_room_key="p2_tfsa_room",
            tfsa_room_growth_key="p2_tfsa_room_growth",
            tfsa_growth_key="p2_y_tfsa",
            rrif_growth_key="p2_y_rrif",
            rrsp_growth_key="p2_y_rrsp",
            nr_acb_key="p2_nonreg_acb",
            nr_cash_key="p2_nr_cash", y_nr_cash_key="p2_y_cash",
            nr_gic_key="p2_nr_gic",   y_nr_gic_key="p2_y_gic",
            nr_inv_key="p2_nr_inv",
            y_nr_inv_total_key="p2_y_inv_total",
            y_nr_inv_elig_key="p2_y_inv_elig",
            y_nr_inv_nonel_key="p2_y_inv_nonel",
            y_nr_inv_cg_key="p2_y_inv_cg",
            y_nr_inv_roc_key="p2_y_inv_roc",
            corp_cash_key="p2_c_c",   y_corp_cash_key="p2_y_c_c",
            corp_gic_key="p2_c_g",    y_corp_gic_key="p2_y_c_g",
            corp_inv_key="p2_c_i",    y_corp_inv_key="p2_y_c_i",
            corp_divtype_key="p2_corp_divtype",
            corp_rdtoh_key="p2_rdtoh",
            nr_total_key="p2_nonreg",
            corp_total_key="p2_corp",
            no_corp=no_corp,
        )

    st.session_state["enable_buckets"] = enable_buckets

    # ------------------------------ Custom CSV upload -----------------------
    st.divider()
    st.subheader("Optional: Custom Withdrawals CSV")
    st.caption("Override simulator withdrawals with custom amounts. Format: year, person (p1/p2), account (nonreg/rrif/tfsa/corp), amount")

    csv_file = st.file_uploader(
        "Upload CSV to force withdrawals / override yields",
        type=["csv"],
        key="withdrawals_csv"
    )

    custom_df = None
    if csv_file:
        try:
            custom_df = pd.read_csv(csv_file)
            st.dataframe(custom_df, use_container_width=True)
            st.session_state["custom_df"] = custom_df
        except Exception as e:
            st.error(f"Failed to read CSV: {e}")
    else:
        # Only show the clear button when there's already a file in session_state
        if st.session_state.get("custom_df") is not None:
            if st.button("🗑️ Clear uploaded CSV"):
                st.session_state["custom_df"] = None
                st.success("Custom CSV cleared.")

# ------------------------------ Tab 4: 2025 Actuals Tracker Tab4 ------------------------------

with tab4:
    render_actuals_tracker_section()

# ------------------------------ Unified Run Simulation Block ------------------------------

# --- Load tax config once per session ---
if "tax_cfg" not in st.session_state or st.session_state["tax_cfg"] is None:
    try:
        with open("tax_config_canada_2025.json", "r") as f:
            st.session_state["tax_cfg"] = json.load(f)
        st.success("Tax configuration loaded successfully.")
    except Exception as e:
        st.warning(f"⚠️ Could not load tax_config_canada_2025.json automatically: {e}")
        st.session_state["tax_cfg"] = None

# ---------------- Household Inputs Summary & Simulation Trigger ----------------
st.divider()
st.header("▶️ Run Deterministic Simulation")

# ---------------- Primary Run Button ----------------
if st.button("▶️ Run Simulation", type="primary", use_container_width=True):
    try:
        # ---- Load tax configuration ----
        if "tax_cfg" not in st.session_state or st.session_state["tax_cfg"] is None:
            with open("tax_config_canada_2025.json", "r") as f:
                st.session_state["tax_cfg"] = json.load(f)
            st.toast("✅ Tax configuration loaded", icon="📄")
        tax_cfg = st.session_state["tax_cfg"]

        # ---- Build household ----
        strategy_engine = _normalize_strategy_for_engine(strategy)

        hh = Household(
            p1=Person(name=str(p1_name), start_age=int(p1_start_age)),
            p2=Person(name=str(p2_name), start_age=int(p2_start_age)),
            province=province,
            start_year=int(start_year),
            end_age=int(end_age),
            spending_go_go=float(go_go),
            go_go_end_age=int(go_end),
            spending_slow_go=float(slow_go),
            slow_go_end_age=int(slow_end),
            spending_no_go=float(no_go),
            tfsa_contribution_each=float(tfsa_contrib),
            income_split_rrif_fraction=float(split_pct),
            strategy=strategy,  # Store user-friendly strategy name for display in reports
            hybrid_rrif_topup_per_person=float(hybrid_topup),
            spending_inflation=float(infl_lifestyle_pct / 100.0),
            general_inflation=float(inflation_pct / 100.0),
            gap_tolerance=float(fail_tol),
            stop_on_fail=bool(stop_on_fail),
            reinvest_nonreg_dist=bool(st.session_state.get("reinvest_nonreg_dist_checkbox", False)),
        )

        # ---- Attach balances from Tab 2 ----
        # Person 1 - Read from session state directly for reliability
        # CRITICAL: Read directly from session state to avoid timing issues with local variables
        hh.p1.rrif_balance = float(st.session_state.get("p1_rrif", 0) or 0)
        hh.p1.tfsa_balance = float(st.session_state.get("p1_tfsa", 0) or 0)
        hh.p1.nonreg_balance = float(st.session_state.get("p1_nonreg", 0) or 0)
        hh.p1.corporate_balance = float(st.session_state.get("p1_corp", 0) or 0) if not no_corp else 0.0
        hh.p1.rrsp_balance = float(st.session_state.get("p1_rrsp", 0) or 0)

        # DEBUG: Log what was set
        print(f"DEBUG [APP] Person 1 balances set: rrif={hh.p1.rrif_balance}, nonreg={hh.p1.nonreg_balance}, tfsa={hh.p1.tfsa_balance}, corp={hh.p1.corporate_balance}", file=sys.stderr)

        # Read CPP/OAS - Try local variables first, fallback to session state
        try:
            p1_cpp_amt_to_use = p1_cpp_amt
            p1_oas_amt_to_use = p1_oas_amt
            p1_cpp_start_to_use = p1_cpp_start
            p1_oas_start_to_use = p1_oas_start
            print(f"DEBUG: Using local variables for Person 1 CPP/OAS")
        except NameError:
            p1_cpp_amt_to_use = float(st.session_state.get("p1_cpp_amt") or 0)
            p1_oas_amt_to_use = float(st.session_state.get("p1_oas_amt") or 0)
            p1_cpp_start_to_use = int(st.session_state.get("p1_cpp_start") or 70)
            p1_oas_start_to_use = int(st.session_state.get("p1_oas_start") or 70)
            print(f"DEBUG: Using session state for Person 1 CPP/OAS (local variables not in scope)")

        hh.p1.cpp_annual_at_start = float(p1_cpp_amt_to_use)
        hh.p1.oas_annual_at_start = float(p1_oas_amt_to_use)
        hh.p1.cpp_start_age = int(p1_cpp_start_to_use)
        hh.p1.oas_start_age = int(p1_oas_start_to_use)
        print(f"DEBUG: Person 1 set to cpp_annual_at_start={hh.p1.cpp_annual_at_start}, cpp_start_age={hh.p1.cpp_start_age}")

        # Person 2 - Read from session state directly for reliability
        # CRITICAL: Read directly from session state to avoid timing issues with local variables
        hh.p2.rrif_balance = float(st.session_state.get("p2_rrif", 0) or 0)
        hh.p2.tfsa_balance = float(st.session_state.get("p2_tfsa", 0) or 0)
        hh.p2.nonreg_balance = float(st.session_state.get("p2_nonreg", 0) or 0)
        hh.p2.corporate_balance = float(st.session_state.get("p2_corp", 0) or 0) if not no_corp else 0.0
        hh.p2.rrsp_balance = float(st.session_state.get("p2_rrsp", 0) or 0)

        # DEBUG: Log what was set
        print(f"DEBUG [APP] Person 2 balances set: rrif={hh.p2.rrif_balance}, nonreg={hh.p2.nonreg_balance}, tfsa={hh.p2.tfsa_balance}, corp={hh.p2.corporate_balance}", file=sys.stderr)

        # Read CPP/OAS for Person 2 - Try local variables first, fallback to session state
        try:
            p2_cpp_amt_to_use = p2_cpp_amt
            p2_oas_amt_to_use = p2_oas_amt
            p2_cpp_start_to_use = p2_cpp_start
            p2_oas_start_to_use = p2_oas_start
            print(f"DEBUG: Using local variables for Person 2 CPP/OAS")
        except NameError:
            p2_cpp_amt_to_use = float(st.session_state.get("p2_cpp_amt") or 0)
            p2_oas_amt_to_use = float(st.session_state.get("p2_oas_amt") or 0)
            p2_cpp_start_to_use = int(st.session_state.get("p2_cpp_start") or 70)
            p2_oas_start_to_use = int(st.session_state.get("p2_oas_start") or 70)
            print(f"DEBUG: Using session state for Person 2 CPP/OAS (local variables not in scope)")

        hh.p2.cpp_annual_at_start = float(p2_cpp_amt_to_use)
        hh.p2.oas_annual_at_start = float(p2_oas_amt_to_use)
        hh.p2.cpp_start_age = int(p2_cpp_start_to_use)
        hh.p2.oas_start_age = int(p2_oas_start_to_use)
        print(f"DEBUG: Person 2 set to cpp_annual_at_start={hh.p2.cpp_annual_at_start}, cpp_start_age={hh.p2.cpp_start_age}")

        # DEBUG: Log Person 2's CPP/OAS initialization
        print(f"DEBUG app.py: Person 2 initialized with cpp_annual_at_start={hh.p2.cpp_annual_at_start}, cpp_start_age={hh.p2.cpp_start_age}")
        print(f"DEBUG app.py: Person 2 session state: p2_cpp_amt={st.session_state.get('p2_cpp_amt')}, p2_cpp_start={st.session_state.get('p2_cpp_start')}")
        print(f"DEBUG app.py: Person 2 initialized with oas_annual_at_start={hh.p2.oas_annual_at_start}, oas_start_age={hh.p2.oas_start_age}")

        # ---- Attach yield values from Tab 3 (from session state) ----
        # Person 1 - Non-Registered yields
        hh.p1.y_nr_cash_interest = float(st.session_state.get("p1_y_cash", 2.00)) / 100.0
        hh.p1.y_nr_gic_interest = float(st.session_state.get("p1_y_gic", 3.30)) / 100.0
        hh.p1.y_nr_inv_total_return = float(st.session_state.get("p1_y_inv_total", 4.00)) / 100.0
        hh.p1.y_nr_inv_elig_div = float(st.session_state.get("p1_y_inv_elig", 2.00)) / 100.0
        hh.p1.y_nr_inv_nonelig_div = float(st.session_state.get("p1_y_inv_nonel", 0.00)) / 100.0
        hh.p1.y_nr_inv_capg = float(st.session_state.get("p1_y_inv_cg", 2.00)) / 100.0
        hh.p1.y_nr_inv_roc_pct = float(st.session_state.get("p1_y_inv_roc", 0.00)) / 100.0

        # Person 2 - Non-Registered yields
        hh.p2.y_nr_cash_interest = float(st.session_state.get("p2_y_cash", 2.00)) / 100.0
        hh.p2.y_nr_gic_interest = float(st.session_state.get("p2_y_gic", 3.30)) / 100.0
        hh.p2.y_nr_inv_total_return = float(st.session_state.get("p2_y_inv_total", 4.00)) / 100.0
        hh.p2.y_nr_inv_elig_div = float(st.session_state.get("p2_y_inv_elig", 2.00)) / 100.0
        hh.p2.y_nr_inv_nonelig_div = float(st.session_state.get("p2_y_inv_nonel", 0.00)) / 100.0
        hh.p2.y_nr_inv_capg = float(st.session_state.get("p2_y_inv_cg", 2.00)) / 100.0
        hh.p2.y_nr_inv_roc_pct = float(st.session_state.get("p2_y_inv_roc", 0.00)) / 100.0

        # Person 1 - Corporate yields (if corp enabled)
        if not no_corp:
            hh.p1.y_corp_cash_interest = float(st.session_state.get("p1_y_c_c", 0.00)) / 100.0
            hh.p1.y_corp_gic_interest = float(st.session_state.get("p1_y_c_g", 3.00)) / 100.0
            hh.p1.y_corp_inv_total_return = float(st.session_state.get("p1_y_c_i", 3.00)) / 100.0
            hh.p1.y_corp_inv_elig_div = float(st.session_state.get("p1_y_c_i_elig", 3.00)) / 100.0
            hh.p1.y_corp_inv_capg = float(st.session_state.get("p1_y_c_i_cg", 0.00)) / 100.0

            hh.p2.y_corp_cash_interest = float(st.session_state.get("p2_y_c_c", 0.00)) / 100.0
            hh.p2.y_corp_gic_interest = float(st.session_state.get("p2_y_c_g", 3.00)) / 100.0
            hh.p2.y_corp_inv_total_return = float(st.session_state.get("p2_y_c_i", 3.00)) / 100.0
            hh.p2.y_corp_inv_elig_div = float(st.session_state.get("p2_y_c_i_elig", 3.00)) / 100.0
            hh.p2.y_corp_inv_capg = float(st.session_state.get("p2_y_c_i_cg", 0.00)) / 100.0

        # Set non-registered and corporate allocation percentages from session state
        # These need to be converted from percentages (0-100) to fractions (0.0-1.0)
        hh.p1.nr_cash_pct = float(st.session_state.get("p1_nr_cash_pct", 0.0)) / 100.0
        hh.p1.nr_gic_pct = float(st.session_state.get("p1_nr_gic_pct", 0.0)) / 100.0
        hh.p1.nr_invest_pct = float(st.session_state.get("p1_nr_invest_pct", 100.0)) / 100.0

        hh.p2.nr_cash_pct = float(st.session_state.get("p2_nr_cash_pct", 0.0)) / 100.0
        hh.p2.nr_gic_pct = float(st.session_state.get("p2_nr_gic_pct", 0.0)) / 100.0
        hh.p2.nr_invest_pct = float(st.session_state.get("p2_nr_invest_pct", 100.0)) / 100.0

        # Set corporate allocation percentages only if corporate accounts are enabled
        if not st.session_state.get("no_corp", False):
            hh.p1.corp_cash_pct = float(st.session_state.get("p1_c_c_pct", 0.0)) / 100.0
            hh.p1.corp_gic_pct = float(st.session_state.get("p1_c_g_pct", 0.0)) / 100.0
            hh.p1.corp_invest_pct = float(st.session_state.get("p1_c_i_pct", 100.0)) / 100.0

            hh.p2.corp_cash_pct = float(st.session_state.get("p2_c_c_pct", 0.0)) / 100.0
            hh.p2.corp_gic_pct = float(st.session_state.get("p2_c_g_pct", 0.0)) / 100.0
            hh.p2.corp_invest_pct = float(st.session_state.get("p2_c_i_pct", 100.0)) / 100.0

        # ---------------- Household Inputs Summary & Simulation Trigger ----------------

        # build canonical starting balances from inputs
        start_view = capture_household_start_balances(hh, no_corp=st.session_state.get("no_corp", False))
        st.session_state["start_by_acct"] = start_view

      
        # ---- BEFORE simulate(): hydrate balances to all likely attribute names ----

        def _hydrate_corp_aliases(person, total_balance, default_div_type="non-eligible"):
            total = float(total_balance or 0.0)

            # Canonical total
            person.corporate_balance = total

            # Respect any existing bucket inputs (from Advanced tab); otherwise default all to "invest"
            existing_cash = float(getattr(person, "corp_cash_bucket", 0.0) or 0.0)
            existing_gic  = float(getattr(person, "corp_gic_bucket", 0.0) or 0.0)
            existing_inv  = float(getattr(person, "corp_invest_bucket", 0.0) or 0.0)

            if (existing_cash + existing_gic + existing_inv) <= 0.0 and total > 0.0:
                person.corp_cash_bucket   = 0.0
                person.corp_gic_bucket    = 0.0
                person.corp_invest_bucket = total
            else:
                person.corp_cash_bucket   = existing_cash
                person.corp_gic_bucket    = existing_gic
                person.corp_invest_bucket = existing_inv

            # Dividend type used when routing personal tax on paid dividends
            if not getattr(person, "corp_dividend_type", None):
                person.corp_dividend_type = default_div_type  # "eligible" or "non-eligible"


        # Apply corporate hydration, honoring the "no_corp" flag
        if not no_corp:
            _hydrate_corp_aliases(hh.p1, p1_corp, default_div_type=st.session_state.get("p1_corp_divtype", "non-eligible"))
            _hydrate_corp_aliases(hh.p2, p2_corp, default_div_type=st.session_state.get("p2_corp_divtype", "non-eligible"))
        else:
            _hydrate_corp_aliases(hh.p1, 0.0)
            _hydrate_corp_aliases(hh.p2, 0.0)


        hydrate(hh, enable_buckets=enable_buckets, no_corp=no_corp)

        # CRITICAL: Save the fully-prepared household to session state for Monte Carlo to use
        st.session_state["hh"] = hh

        # ---- Run simulation ----
        custom_df = st.session_state.get("custom_df")
        df = simulate(hh, tax_cfg, custom_df)

        # --- TAX HARMONIZATION (insert immediately after postprocess_df) ---

        # 1) Canonicalize per-person after-split tax columns
        TAX_CANON = {
            # common variants seen in engines
            "tax1_after": "tax_after_split_p1",
            "tax2_after": "tax_after_split_p2",
            "tax_after_p1": "tax_after_split_p1",
            "tax_after_p2": "tax_after_split_p2",
            "tax_p1_after_split": "tax_after_split_p1",
            "tax_p2_after_split": "tax_after_split_p2",

            # fed/prov totals after split (sometimes emitted separately)
            "fed_tax_after_p1": "tax_fed_after_p1",
            "fed_tax_after_p2": "tax_fed_after_p2",
            "prov_tax_after_p1": "tax_prov_after_p1",
            "prov_tax_after_p2": "tax_prov_after_p2",

            "tax_fed_total_after_split": "tax_fed_total_after_split",
            "tax_prov_total_after_split": "tax_prov_total_after_split",

            # pre-split household tax (fallback only!)
            "total_tax": "total_tax_presplit",
        }

        for src, dst in TAX_CANON.items():
            if src in df.columns and dst not in df.columns:
                df[dst] = pd.to_numeric(df[src], errors="coerce").fillna(0.0)
        # --- Map our canonical columns to the names your tax engine expects ---
        # Adjust the destination keys below to match what compute_tax() / simulate() actually uses.
        TAX_INPUT_MAP = {
            # interest (household split equally -> per person) - change if you already have per-person interest
            "interest_nonreg": ("tax_interest_p1", "tax_interest_p2"),
            "interest_corp":   ("tax_corp_interest_p1", "tax_corp_interest_p2"),

            # non-reg dividends (per person if you have them; otherwise split)
            "eligible_dividend":    ("tax_div_elig_p1", "tax_div_elig_p2"),
            "noneligible_dividend": ("tax_div_nonelig_p1", "tax_div_nonelig_p2"),

            # realized cap gains (50% inclusion is done inside your tax function)
            "realized_cg": ("tax_capg_p1", "tax_capg_p2"),
        }

        for src, (p1dst, p2dst) in TAX_INPUT_MAP.items():
            if src in df.columns:
                _split_household_col(df, src, p1dst, p2dst)

        # 2) Build the authoritative household after-split total  
        def _mk_total_after_split(_df):
            """
            Always return a pandas Series indexed like _df.index (never a scalar),
            representing total household tax after RRIF split.
            """
            idx = _df.index

            # 1. If we have per-person after-split taxes, sum them
            if "tax_after_split_p1" in _df.columns and "tax_after_split_p2" in _df.columns:
                s1 = _ensure_series(_df["tax_after_split_p1"], idx)
                s2 = _ensure_series(_df["tax_after_split_p2"], idx)
                return s1 + s2

            # 2. If we have fed/prov household totals after split, add them
            if (
                "tax_fed_total_after_split" in _df.columns
                and "tax_prov_total_after_split" in _df.columns
            ):
                sf_raw = pd.to_numeric(_df["tax_fed_total_after_split"], errors="coerce")
                sp_raw = pd.to_numeric(_df["tax_prov_total_after_split"], errors="coerce")
                sf = _ensure_series(sf_raw, idx)
                sp = _ensure_series(sp_raw, idx)
                return sf + sp

            # 3. If we have pre-split household tax, use that as fallback
            if "total_tax_presplit" in _df.columns:
                stax_raw = pd.to_numeric(_df["total_tax_presplit"], errors="coerce")
                stax = _ensure_series(stax_raw, idx)
                return stax

            # 4. Final fallback: zeros Series
            return pd.Series(0.0, index=idx, dtype="float64")

        # --- use helpers robustly ---
        rebuilt_total = _mk_total_after_split(df)

        if "total_tax_after_split" not in df.columns:
            df["total_tax_after_split"] = rebuilt_total
        else:
            cur = pd.to_numeric(df["total_tax_after_split"], errors="coerce").fillna(0.0)
            # Ensure rebuilt_total is a Series with matching index
            if not isinstance(rebuilt_total, pd.Series):
                rebuilt_total = pd.Series(rebuilt_total, index=df.index)
            else:
                rebuilt_total = rebuilt_total.reindex(df.index, fill_value=0.0)

            # per-row fix: if current is <=0 but rebuilt >0, take rebuilt; otherwise keep current
            merged = np.where(
                (cur <= 0.0) & (rebuilt_total > 0.0),
                rebuilt_total.values,  # Extract values to avoid index misalignment
                cur.values,            # Extract values to avoid index misalignment
            )
            # Ensure the result is a proper numeric Series
            # Convert to Series first, then to numeric, then fillna
            merged_series = pd.Series(merged, index=df.index)
            df["total_tax_after_split"] = pd.to_numeric(merged_series, errors="coerce").fillna(0.0)

        # --- END TAX HARMONIZATION ---

        # Sanity: if starting corp > 0 but end_corp is ~0 across all years, flag it
        started_corp = (float(getattr(hh.p1, "corporate_balance", 0.0)) +
                float(getattr(hh.p2, "corporate_balance", 0.0))) if not no_corp else 0.0

        if started_corp > 0:
            total_end_corp = (_series_safe(df, "end_corp_p1") + _series_safe(df, "end_corp_p2")).sum()
            if total_end_corp <= 1e-9:  # tolerance instead of exact 0.0
                st.error(
                    "Corporate balances remained 0 in the simulation despite non-zero inputs. "
                    "That means the engine still isn’t reading corp attributes. "
                    "Double-check attribute names in your Person/Household classes."
                )

        # --- Harmonize simulator column names to canonical UI names ---
        CANONICAL = {
            # corporate withdrawals
            "corp_dividend_p1"  : "withdraw_corp_p1",
            "corp_dividends_p1" : "withdraw_corp_p1",
            "corp_payout_p1"    : "withdraw_corp_p1",
            "corp_cash_out_p1"  : "withdraw_corp_p1",
            "corp_paid_p1"      : "withdraw_corp_p1",
            "withdrawal_corp_p1": "withdraw_corp_p1",
            "corp_div_paid_p1"  : "withdraw_corp_p1",

            "corp_dividend_p2"  : "withdraw_corp_p2",
            "corp_dividends_p2" : "withdraw_corp_p2",
            "corp_payout_p2"    : "withdraw_corp_p2",
            "corp_cash_out_p2"  : "withdraw_corp_p2",
            "corp_paid_p2"      : "withdraw_corp_p2",
            "withdrawal_corp_p2": "withdraw_corp_p2",
            "corp_div_paid_p2"  : "withdraw_corp_p2",

            # household-only columns
            "corp_dividend"     :  "withdraw_corp_tot",
            "corp_dividends"    :  "withdraw_corp_tot",
            "corp_payout"       :  "withdraw_corp_tot",
            "corp_cash_out"     :  "withdraw_corp_tot", 
            "corp_paid"         :  "withdraw_corp_tot",  
        }
        idx = df.index
        for src, dst in CANONICAL.items():
            if src in df.columns and dst not in df.columns:
                raw = pd.to_numeric(df[src], errors="coerce")
                df[dst] = _ensure_series(raw, idx)

        _num_cols = [
        "withdraw_corp_p1","withdraw_corp_p2",
        "withdraw_rrif_p1","withdraw_rrif_p2",
        "withdraw_nonreg_p1","withdraw_nonreg_p2",
        "withdraw_tfsa_p1","withdraw_tfsa_p2",
        "oas_p1","oas_p2","cpp_p1","cpp_p2",
        "nr_interest_p1","nr_interest_p2",
        "nr_elig_div_p1","nr_elig_div_p2",
        "nr_nonelig_div_p1","nr_nonelig_div_p2",
        "nr_capg_dist_p1","nr_capg_dist_p2","nr_dist_tot",
        ]
        for c in _num_cols:
            if c in df.columns:
                raw = pd.to_numeric(df[c], errors="coerce")
                df[c] = _ensure_series(raw, idx)
            else:
                df[c] = pd.Series(0.0, index=idx, dtype="float64")

        # If engine only gave us a single household total, split 50/50 so downstream totals work.
        if "withdraw_corp_tot" in df.columns and ("withdraw_corp_p1" not in df.columns or "withdraw_corp_p2" not in df.columns):
            raw_tot = pd.to_numeric(df["withdraw_corp_tot"], errors="coerce")
            half_series = _ensure_series(raw_tot, df.index) * 0.5
            if "withdraw_corp_p1" not in df.columns:
                df["withdraw_corp_p1"] = half_series
            if "withdraw_corp_p2" not in df.columns:
                df["withdraw_corp_p2"] = half_series


        # If simulator used unknown corp names, try a best-effort auto-map
        def _maybe_map_unknown_corp(colname: str, person_suffix: str) -> bool:
            """
            Map unknown corp payout columns to withdraw_corp_* if they look like
            corporate cash paid out (dividend/payout/withdrawal/cash).
            Returns True if a mapping happened.
            """
            low = colname.lower()
            if (
                "corp" in low and person_suffix in low
                and any(k in low for k in ["div", "payout", "withdraw", "cash"])
                and colname not in ("withdraw_corp_p1","withdraw_corp_p2")
            ):
                target = "withdraw_corp_p1" if person_suffix == "_p1" else "withdraw_corp_p2"
                if target not in df.columns:
                    raw = pd.to_numeric(df[colname], errors="coerce")
                    df[target] = _ensure_series(raw, df.index)
                    return True
            return False

        # Try to catch unexpected variants like 'corp_div_paid_p1', 'corp_withdrawal_p2', etc.
        mapped_any = False
        for col in list(df.columns):
            mapped_any |= _maybe_map_unknown_corp(col, "_p1")
            mapped_any |= _maybe_map_unknown_corp(col, "_p2")
        if mapped_any:
            st.info("Auto-mapped unexpected corporate payout columns → withdraw_corp_p1/withdraw_corp_p2")

        # END OF CODE - To be removed after debugging -----

        # --- Backfill canonical taxable components from per-person columns ---
        def _sum_cols(cols):
            series = []
            for c in cols:
                if c in df.columns:
                    series.append(pd.to_numeric(df[c], errors="coerce").fillna(0.0))
            return sum(series) if series else None

        # 1) Non-registered interest (household)
        if "interest_nonreg" not in df.columns:
            s = _sum_cols(["nr_interest_p1", "nr_interest_p2", "interest_nonreg_p1", "interest_nonreg_p2"])
            if s is not None:
                df["interest_nonreg"] = s

        # 2) Corporate interest (household) — only if you model it; else safe=0
        if "interest_corp" not in df.columns:
            s = _sum_cols(["corp_interest_p1", "corp_interest_p2", "interest_corp_p1", "interest_corp_p2"])
            df["interest_corp"] = s if s is not None else 0.0

        # 3) Eligible & non-eligible dividends from non-reg
        if "eligible_dividend" not in df.columns:
            s = _sum_cols(["nr_elig_div_p1", "nr_elig_div_p2"])
            df["eligible_dividend"] = s if s is not None else 0.0

        if "noneligible_dividend" not in df.columns:
            s = _sum_cols(["nr_nonelig_div_p1", "nr_nonelig_div_p2"])
            df["noneligible_dividend"] = s if s is not None else 0.0

        # 4) Realized capital gains proxy (from sales + fund CG distributions)
        #    Your taxable proxy later uses 50% inclusion on this.
        if "realized_cg" not in df.columns:
            s = _sum_cols(["cg_from_sale_p1", "cg_from_sale_p2", "nr_capg_dist_p1", "nr_capg_dist_p2"])
            df["realized_cg"] = s if s is not None else 0.0

        df = postprocess_df(df, hh)

        # ---------- BEGIN: audited post-processing ---------

        # 1) Normalize/ensure required columns so charts don't show zeros
       
        required_cols = [
            "spend_target_after_tax",
            "oas_p1","oas_p2","cpp_p1","cpp_p2",
            "withdraw_nonreg_p1","withdraw_nonreg_p2",
            "withdraw_rrif_p1","withdraw_rrif_p2",
            "withdraw_corp_p1","withdraw_corp_p2",     # <- canonical
            "withdraw_tfsa_p1","withdraw_tfsa_p2",
            "nr_dist_tot","interest_nonreg","interest_corp",
            "eligible_dividend","noneligible_dividend","realized_cg",
        ]

        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            st.warning(f"Expected columns missing from simulate(): {missing}")
            for c in missing:
                df[c] = pd.Series(0.0, index=df.index, dtype="float64")

        # 2) Cashflow identity: sources – tax = available
        df["cash_inflows_total"] = (
            df.get("oas_p1",0)+df.get("oas_p2",0)+df.get("cpp_p1",0)+df.get("cpp_p2",0) +
            df.get("withdraw_nonreg_p1",0)+df.get("withdraw_nonreg_p2",0) +
            df.get("withdraw_rrif_p1",0)+df.get("withdraw_rrif_p2",0) +
            df.get("withdraw_corp_p1",0)+df.get("withdraw_corp_p2",0) +
            df.get("withdraw_tfsa_p1",0)+df.get("withdraw_tfsa_p2",0) +
            df.get("nr_dist_tot",0)  # include NR distributions if your engine emits them
        )
        # 1) Residuals before any backstop
        df["after_tax_cash_available"] = df["cash_inflows_total"] - df["total_tax_after_split"]
        df["residual_vs_target"] = df["after_tax_cash_available"] - df["spend_target_after_tax"]
        # IMPORTANT: Save the original residual BEFORE backstop for MC success calculation
        df["residual_vs_target_before_backstop"] = df["residual_vs_target"].copy()

        # 2) TFSA backstop (this block mutates cash_inflows_total/after_tax/residual)
        # NOTE: Apply TFSA backstop consistently for both deterministic and MC simulations
        # This ensures fair comparison between simulation methods using identical logic
        enable_tfsa_backstop = True  # Always enabled for both deterministic and MC
        if enable_tfsa_backstop:
            for idx, row in df.iterrows():
                shortfall = -float(row["residual_vs_target"])
                if shortfall <= 0:
                    continue
                take_p1 = min(shortfall, max(float(row.get("end_tfsa_p1", 0.0)), 0.0))
                shortfall -= take_p1
                take_p2 = min(shortfall, max(float(row.get("end_tfsa_p2", 0.0)), 0.0))

                if take_p1 > 0 or take_p2 > 0:
                    df.at[idx, "withdraw_tfsa_p1"] = float(row["withdraw_tfsa_p1"]) + take_p1
                    df.at[idx, "withdraw_tfsa_p2"] = float(row["withdraw_tfsa_p2"]) + take_p2
                    df.at[idx, "end_tfsa_p1"]      = max(float(row["end_tfsa_p1"]) - take_p1, 0.0)
                    df.at[idx, "end_tfsa_p2"]      = max(float(row["end_tfsa_p2"]) - take_p2, 0.0)

                    add_cash = take_p1 + take_p2
                    df.at[idx, "cash_inflows_total"]      = float(row["cash_inflows_total"]) + add_cash
                    df.at[idx, "after_tax_cash_available"] = float(row["after_tax_cash_available"]) + add_cash
                    df.at[idx, "residual_vs_target"]       = df.at[idx, "after_tax_cash_available"] - float(row["spend_target_after_tax"])

        # 3) Recompute funding flags AFTER the backstop
        gap = float(getattr(hh, "gap_tolerance", 0.50))

        # Optional: snap tiny numerical noise to 0 within your tolerance
        df["residual_vs_target"] = df["residual_vs_target"].where(
            ~np.isclose(df["residual_vs_target"], 0.0, atol=gap), 0.0
        )
        df["underfunded_after_tax"] = np.maximum(-df["residual_vs_target"], 0.0)
        df["is_underfunded"] = df["residual_vs_target"] < -gap

        # Ensure columns exist
        for col in ["withdraw_tfsa_p1","withdraw_tfsa_p2","end_tfsa_p1","end_tfsa_p2"]:
            if col not in df.columns: df[col] = 0.0
        df[["withdraw_tfsa_p1","withdraw_tfsa_p2","end_tfsa_p1","end_tfsa_p2"]] = \
            df[["withdraw_tfsa_p1","withdraw_tfsa_p2","end_tfsa_p1","end_tfsa_p2"]].apply(pd.to_numeric, errors="coerce").fillna(0.0)

        # 3) Sanity check: taxable proxy vs. tax (flags years like your 2037)     
        cg_taxable           = _series_safe(df, "realized_cg") * 0.5
        elig_div_taxable     = _series_safe(df, "eligible_dividend") * 1.38
        nonelig_div_taxable  = _series_safe(df, "noneligible_dividend") * 1.15
        rrif_taxable = _series_safe(df, "withdraw_rrif_p1") + _series_safe(df, "withdraw_rrif_p2")
        interest_taxable = _series_safe(df, "interest_nonreg") + _series_safe(df, "interest_corp")
        pensions_taxable = (
            _series_safe(df, "cpp_p1") + _series_safe(df, "cpp_p2") +
            _series_safe(df, "oas_p1") + _series_safe(df, "oas_p2")
        )

        # Build household eligible / non-eligible dividend series for proxy
        _elig_from_nr = df.get("nr_elig_div_p1", 0.0) + df.get("nr_elig_div_p2", 0.0)
        _nonelig_from_nr = df.get("nr_nonelig_div_p1", 0.0) + df.get("nr_nonelig_div_p2", 0.0)

        # From corporate payouts, route by each person’s declared type
        p1_is_elig = (getattr(hh.p1, "corp_dividend_type", "non-eligible").lower().startswith("elig"))
        p2_is_elig = (getattr(hh.p2, "corp_dividend_type", "non-eligible").lower().startswith("elig"))

        corp_p1 = _series_safe(df, "withdraw_corp_p1", 0.0)
        corp_p2 = _series_safe(df, "withdraw_corp_p2", 0.0)

        _elig_from_corp    = (corp_p1 if p1_is_elig else 0.0) + (corp_p2 if p2_is_elig else 0.0)
        _nonelig_from_corp = (corp_p1 if not p1_is_elig else 0.0) + (corp_p2 if not p2_is_elig else 0.0)

        # These are for diagnostics/proxy only (do not overwrite your engine’s real tax inputs)
        raw_elig_nr   = pd.to_numeric(_elig_from_nr, errors="coerce")
        raw_elig_corp = pd.to_numeric(_elig_from_corp, errors="coerce")
        raw_non_nr    = pd.to_numeric(_nonelig_from_nr, errors="coerce")
        raw_non_corp  = pd.to_numeric(_nonelig_from_corp, errors="coerce")

        df["eligible_dividend"] = _ensure_series(raw_elig_nr, df.index) + _ensure_series(raw_elig_corp, df.index)
        df["noneligible_dividend"] = _ensure_series(raw_non_nr, df.index) + _ensure_series(raw_non_corp, df.index)


        df["_taxable_proxy"] = (
            rrif_taxable + interest_taxable +
            elig_div_taxable + nonelig_div_taxable +
            cg_taxable + pensions_taxable
        )

        # 4) (Optional) Withdrawal-order validator for Strategy C (Corp→RRIF→NonReg→TFSA)
        if "Corp->RRIF->NonReg->TFSA" in getattr(hh, "strategy", ""):
            paid_corp = df["withdraw_corp_p1"] + df["withdraw_corp_p2"]
            paid_rrif = df["withdraw_rrif_p1"] + df["withdraw_rrif_p2"]
            paid_nreg = df["withdraw_nonreg_p1"] + df["withdraw_nonreg_p2"]
            paid_tfsa = df["withdraw_tfsa_p1"] + df["withdraw_tfsa_p2"]

            # Get starting balances to check if they exist
            corp_p1_start = hh.p1.corporate_balance if hasattr(hh, 'p1') else 0.0
            corp_p2_start = hh.p2.corporate_balance if hasattr(hh, 'p2') else 0.0
            rrif_p1_start = hh.p1.rrif_balance if hasattr(hh, 'p1') else 0.0
            rrif_p2_start = hh.p2.rrif_balance if hasattr(hh, 'p2') else 0.0

            # Check if accounts were ever tapped (cumulative sum)
            corp_ever_tapped = (paid_corp > 0).any()
            rrif_ever_tapped = (paid_rrif > 0).any()

            # Check if accounts have starting balance
            has_corp = (corp_p1_start > 0.1) or (corp_p2_start > 0.1)
            has_rrif = (rrif_p1_start > 0.1) or (rrif_p2_start > 0.1)

            # Only flag a violation if:
            # - NonReg is withdrawn in year N AND:
            #   - Corp had balance at start but was NEVER tapped, OR
            #   - RRIF had balance at start but was NEVER tapped
            # - TFSA is withdrawn AND similar conditions for earlier accounts
            violates = (paid_nreg.gt(0) & has_corp & ~corp_ever_tapped) | \
                    (paid_nreg.gt(0) & has_rrif & ~rrif_ever_tapped) | \
                    (paid_tfsa.gt(0) & ((has_corp & ~corp_ever_tapped) | (has_rrif & ~rrif_ever_tapped)))

            if violates.any():
                st.warning("⚠️ Some rows violate Strategy C withdrawal order (Corp→RRIF→NonReg→TFSA).")
                st.dataframe(
                    df.loc[violates,
                        ["year","withdraw_corp_p1","withdraw_corp_p2",
                            "withdraw_rrif_p1","withdraw_rrif_p2",
                            "withdraw_nonreg_p1","withdraw_nonreg_p2",
                            "withdraw_tfsa_p1","withdraw_tfsa_p2"]],
                    use_container_width=True
                )

        # 5) cumulative series (used by dashboards)
        df["cumulative_tax"] = df["total_tax_after_split"].cumsum()

        # Cashflow audit moved to Table 3 (after Table 2)

        # ---------- END: audited post-processing ----------

        # ---- Save results ----
        st.session_state.df = df
        st.session_state.hh = hh
        st.session_state.sim_ready = True

        # ---- Extract plan values for Tracker comparison ----
        plan_2025 = extract_simulator_plan_2025(df, hh)
        if plan_2025:
            st.session_state.plan_2025 = plan_2025

        # ---- Success metrics ----
        planned_years = int(end_age - min(p1_start_age, p2_start_age) + 1)
        funded_years = years_funded_from_df(df)
        pct = 100 * funded_years / max(planned_years, 1)

        # persist for later display in Retirement Plan Health Summary
        st.session_state["det_years_funded"] = int(funded_years)
        st.session_state["total_years_plan"] = int(planned_years)

    except Exception as e:
        st.session_state.sim_ready = False
        st.error(f"Simulation failed: {e}")

# ------------------------------ Render after run ------------------------
if st.session_state.get("sim_ready") and st.session_state.df is not None:
    df = st.session_state.df.copy()

    # make sure types are clean
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype(int)
    df["total_tax_after_split"] = pd.to_numeric(df["total_tax_after_split"], errors="coerce").fillna(0.0)

    # create cumulative series (first time or if missing)
    if "cumulative_tax" not in df.columns:
        df["cumulative_tax"] = df["total_tax_after_split"].cumsum()

    # persist the cleaned frame if you want other panels to reuse it
    st.session_state.df = df
    hh = st.session_state.hh
    tax_cfg = st.session_state.tax_cfg
    custom_df = st.session_state.get("custom_df")

    st.success(f"Simulation complete (Baseline) for {p1_name} & {p2_name}")

    # ===== GENERATE CHARTS FOR TABS AND PDF EXPORT =====
    # Create all projection and analysis charts needed by tabs
    try:
        fig_spending_coverage = create_spending_coverage_chart(df)
        fig_account_depletion = create_account_depletion_chart(df)
        fig_gov_benefits = create_gov_benefits_chart(df)
        fig_plan_funding = create_plan_funding_pct_chart(df)
        fig_tax_rate = create_marginal_tax_rate_chart(df)
        fig_income_comp = create_income_composition_chart(df)
        fig_household_inflows = create_household_inflows_chart(df)

        # Store in session state for tabs and PDF export
        st.session_state["fig_spending_coverage"] = fig_spending_coverage
        st.session_state["fig_account_depletion"] = fig_account_depletion
        st.session_state["fig_gov_benefits"] = fig_gov_benefits
        st.session_state["fig_plan_funding"] = fig_plan_funding
        st.session_state["fig_tax_rate"] = fig_tax_rate
        st.session_state["fig_income_comp"] = fig_income_comp
        st.session_state["fig_household_inflows"] = fig_household_inflows
    except Exception as e:
        st.warning(f"Could not create some analysis charts: {str(e)}")

    # ===== NEW TAB-BASED RESULTS DASHBOARD (Tab 1: Executive Summary + scaffolding for Tabs 2-5) =====
    # Render the new tabbed results interface with Executive Summary as primary tab
    fail_tol = st.session_state.get("gap_tolerance", 5000.0)
    render_results_dashboard(df=df, hh=hh, fail_tol=fail_tol)

    st.markdown("---")

    st.markdown("""
    ### 📚 Additional Data Tables

    For even more detailed data, see the tables below.
    All 3 data tables are also available in the **Data Tables** tab for easier navigation.
    """)

    # Table 1 & 2 Combined. Comprehensive Cashflow & Net Worth Summary
    st.subheader("Table 1. Comprehensive Cashflow & Net Worth Summary")
    st.caption("Income sources (CPP, OAS, GIS, withdrawals, distributions), taxes, spending target, and year-end balances.")

    # Prepare unified table with all calculations
    unified = df.copy()

    # Calculate withdrawal totals
    unified["w.nonreg_tot"] = unified["withdraw_nonreg_p1"].fillna(0) + unified["withdraw_nonreg_p2"].fillna(0)
    unified["w.rrif_tot"]   = unified["withdraw_rrif_p1"].fillna(0) + unified["withdraw_rrif_p2"].fillna(0)
    unified["w.tfsa_tot"]   = unified["withdraw_tfsa_p1"].fillna(0) + unified["withdraw_tfsa_p2"].fillna(0)
    unified["w.corp_tot"]   = unified["withdraw_corp_p1"].fillna(0) + unified["withdraw_corp_p2"].fillna(0)
    unified["total_withdrawals"] = unified["w.nonreg_tot"] + unified["w.rrif_tot"] + unified["w.tfsa_tot"] + unified["w.corp_tot"]

    # DEBUG: Check withdrawal totals
    print(f"DEBUG [Table 1] Withdrawal totals summary:", file=sys.stderr)
    print(f"  w.tfsa_tot sample values (years 2040-2045): {unified[unified['year'].isin([2040,2041,2042,2043,2044,2045])]['w.tfsa_tot'].values}", file=sys.stderr)
    print(f"  withdraw_tfsa_p1 sample (year 2040): {unified[unified['year']==2040]['withdraw_tfsa_p1'].values}", file=sys.stderr)
    print(f"  withdraw_tfsa_p2 sample (year 2040): {unified[unified['year']==2040]['withdraw_tfsa_p2'].values}", file=sys.stderr)

    # Calculate ending balance totals for each account type
    unified["end_rrif_tot"]   = unified["end_rrif_p1"] + unified["end_rrif_p2"]
    unified["end_nonreg_tot"] = unified["end_nonreg_p1"] + unified["end_nonreg_p2"]
    unified["end_tfsa_tot"]   = unified["end_tfsa_p1"] + unified["end_tfsa_p2"]
    unified["end_corp_tot"]   = unified["end_corp_p1"] + unified["end_corp_p2"]

    # Calculate TFSA room and contribution totals
    unified["tfsa_room_tot"] = unified.get("tfsa_room_p1", 0) + unified.get("tfsa_room_p2", 0)
    unified["contrib_tfsa_tot"] = unified.get("contrib_tfsa_p1", 0) + unified.get("contrib_tfsa_p2", 0)

    # Government benefits
    unified["cpp_tot"] = unified["cpp_p1"] + unified["cpp_p2"]
    unified["oas_tot"] = unified["oas_p1"] + unified["oas_p2"]
    unified["gis_tot"] = unified["gis_p1"] + unified["gis_p2"]

    # GIS Clawback tracking (for GIS-optimized strategy)
    unified["gis_clawback_tot"] = (
        _col_or_zero(unified, "gis_clawback_p1") + _col_or_zero(unified, "gis_clawback_p2")
    )

    # GIS Income Headroom tracking (for GIS-optimized strategy)
    unified["gis_income_headroom_tot"] = (
        _col_or_zero(unified, "gis_income_headroom_p1") + _col_or_zero(unified, "gis_income_headroom_p2")
    )

    # GIS Strategy Used flag (for reporting)
    unified["gis_strategy_used"] = _col_or_zero(unified, "gis_strategy_used")

    # Non-registered distributions
    nr_dist_calc = (
        (unified["nr_interest_p1"] + unified["nr_interest_p2"])
        + (unified["nr_elig_div_p1"] + unified["nr_elig_div_p2"])
        + (unified["nr_nonelig_div_p1"] + unified["nr_nonelig_div_p2"])
        + (unified["nr_capg_dist_p1"] + unified["nr_capg_dist_p2"])
    )

    # Distributions display and usage logic
    # NOTE: Distributions are ALWAYS shown in output for transparency (to show what's earned),
    # but they only count toward "Total Available" when NOT reinvested.
    # When reinvesting is ON: distributions are automatically reinvested, not available for spending
    # When reinvesting is OFF: distributions are paid out as cash and available for spending

    # Always show distributions in recurring income for transparency (what's earned)
    unified["nr_dist_tot"] = nr_dist_calc

    # Cashflow calculations
    # total_inflows = recurring income sources (CPP, OAS, GIS, distributions from non-reg accounts)
    # Note: withdrawals are NOT inflows - they are conversions of existing account balances
    # Note: GIS is non-taxable, so it's added to total_inflows but NOT included in taxable income
    # CRITICAL: Distributions count as inflows only when NOT reinvested
    if st.session_state.get("reinvest_nonreg_dist_checkbox", False):
        # When reinvesting: distributions don't count toward available cash (reserved for reinvestment)
        unified["total_inflows"] = unified["cpp_tot"] + unified["oas_tot"] + unified["gis_tot"]
    else:
        # When not reinvesting: distributions are available for spending
        unified["total_inflows"] = unified["cpp_tot"] + unified["oas_tot"] + unified["gis_tot"] + unified["nr_dist_tot"]

    unified["total_tax"] = unified["total_tax_after_split"]
    unified["net_income"] = unified["total_inflows"] - unified["total_tax"]
    # For spending adequacy, we need to consider both recurring income AND account withdrawals
    unified["total_available"] = unified["net_income"] + unified["total_withdrawals"]
    unified["spending_target"] = unified["spend_target_after_tax"]
    unified["surplus_shortfall"] = unified["total_available"] - unified["spending_target"]

    # Calculate Taxable Income
    # Taxable Income = CPP + OAS + RRIF Withdrawals + NonReg Distributions (with inclusion rates) + Corp Dividend income
    # Note: GIS is NOT taxable; Non-taxable distributions (ROC) are excluded; Capital gains 50% included
    rrif_tot = unified["withdraw_rrif_p1"] + unified["withdraw_rrif_p2"]

    # Non-Reg distributions with proper inclusion rates
    nr_interest = unified["nr_interest_p1"] + unified["nr_interest_p2"]
    nr_elig_div = (unified["nr_elig_div_p1"] + unified["nr_elig_div_p2"]) * 1.38  # Gross-up for eligible dividends
    nr_nonelig_div = (unified["nr_nonelig_div_p1"] + unified["nr_nonelig_div_p2"]) * 1.15  # Gross-up for non-eligible
    nr_capg_dist = (unified["nr_capg_dist_p1"] + unified["nr_capg_dist_p2"]) * 0.5  # 50% inclusion on capital gains

    # Capital gains from NonReg sales (50% inclusion)
    cg_from_sale = (unified["cg_from_sale_p1"] + unified["cg_from_sale_p2"]) * 0.5

    # Corp dividend income (grossed up)
    corp_elig_div = (unified.get("corp_elig_div_gen_p1", 0) + unified.get("corp_elig_div_gen_p2", 0)) * 1.38

    # Total Taxable Income
    unified["taxable_income"] = (
        unified["cpp_tot"] +
        unified["oas_tot"] +
        rrif_tot +
        nr_interest +
        nr_elig_div +
        nr_nonelig_div +
        nr_capg_dist +
        cg_from_sale +
        corp_elig_div
    )

    # Select columns for unified table
    # REORGANIZED FOR RETIREE FOCUS: Top 5 meaningful columns first
    # 1. Time & Demographics | 2. Spending Adequacy (Critical) | 3. Cash Position (Critical)
    # 4. Account Depletion (Important) | 5. Wealth Summary (Important) | Then supporting detail

    unified_cols = [
        # === TIER 1: WHEN & WHO ===
        "year",
        "age_p1", "age_p2",

        # === TIER 1: THE 5 MOST MEANINGFUL COLUMNS ===
        # Critical: Can you afford this year?
        "spending_target",
        "total_available",
        "surplus_shortfall",

        # Critical: How much wealth remains?
        "net_worth_end",

        # Important: Which accounts are being used? (Strategy verification)
    ]

    # Add corporate ending balance first (highest priority in Balanced strategy)
    if not st.session_state.get("no_corp", False):
        unified_cols.append("end_corp_tot")

    # Add RRIF, NonReg, TFSA (in strategy order)
    unified_cols.extend([
        "end_rrif_tot",
        "end_nonreg_tot",
        "end_tfsa_tot",
    ])

    # === TIER 2: SUPPORTING DETAIL ===
    # Income sources and taxable income
    unified_cols.extend([
        "total_inflows",    # CPP + OAS + GIS (+ Non-Reg Dist if not reinvesting)
        "taxable_income",   # CPP + OAS + RRIF + Non-Reg Dist (with inclusion rates) + Corp dividends
        "cpp_tot", "oas_tot", "gis_tot",
    ])

    # GIS-Optimized strategy tracking (shown only if GIS strategy is being used)
    strategy_used = st.session_state.get("strategy", "")
    if "GIS-Optimized" in strategy_used:
        unified_cols.extend([
            "gis_clawback_tot",
            "gis_income_headroom_tot",
        ])

    # Include non-reg distributions only if NOT reinvesting
    if not st.session_state.get("reinvest_nonreg_dist_checkbox", False):
        unified_cols.append("nr_dist_tot")

    # Withdrawal breakdown (by account type)
    # Add corporate withdrawal column only if NOT ignoring corporate
    if not st.session_state.get("no_corp", False):
        unified_cols.append("w.corp_tot")

    unified_cols.extend([
        "w.rrif_tot",
        "w.nonreg_tot",
        "tfsa_room_tot",
        "w.tfsa_tot",
        "contrib_tfsa_tot",
    ])

    # Total withdrawals (after individual withdrawal columns)
    unified_cols.append("total_withdrawals")

    # === TIER 3: TAX & CASH DETAILS ===
    unified_cols.extend([
        "total_tax",
        "net_income",
        "cash_buffer_flow",
        "cash_buffer_end",
        "underfunded_after_tax"
    ])

    success_pct = round(100.0 * (unified["total_available"] >= unified["spending_target"] - 0.5).mean())

    # Display unified table
    def _style_failers(s):
        return ['background-color: #ffcccc' if v > fail_tol else '' for v in s]

    # Filter unified_cols to only include columns that exist in unified
    missing_cols = [col for col in unified_cols if col not in unified.columns]
    if missing_cols:
        print(f"DEBUG: Missing columns in unified dataframe: {missing_cols}", file=sys.stderr)
        unified_cols = [col for col in unified_cols if col in unified.columns]

    df_display = unified[unified_cols].copy()

    # Convert age columns to integers BEFORE renaming
    if "age_p1" in df_display.columns:
        df_display["age_p1"] = pd.to_numeric(df_display["age_p1"], errors="coerce").fillna(0).astype(int)
    if "age_p2" in df_display.columns:
        df_display["age_p2"] = pd.to_numeric(df_display["age_p2"], errors="coerce").fillna(0).astype(int)

    # Rename columns for cleaner display
    rename_dict = {
        "age_p1": "Age P1",
        "age_p2": "Age P2",
        "total_inflows": "Recurring Income",
        "taxable_income": "Taxable Income",
        "total_tax": "Total Tax",
        "net_income": "Net Income",
        "total_available": "Total Available",
        "spending_target": "Spending Target",
        "surplus_shortfall": "Surplus/Shortfall",
        "cash_buffer_flow": "Buffer Flow",
        "cash_buffer_end": "Buffer (End)",
        # Account ending balances
        "end_rrif_tot": "RRIF (End)",
        "end_nonreg_tot": "Non-Reg (End)",
        "end_tfsa_tot": "TFSA (End)",
        "end_corp_tot": "Corp (End)",
        # Net worth
        "net_worth_end": "Net Worth (End)",
        "underfunded_after_tax": "After-Tax Funding",
        # Withdrawals by account type
        "w.corp_tot": "Corp w/d",
        "w.rrif_tot": "RRIF w/d",
        "w.nonreg_tot": "Non-Reg w/d",
        "w.tfsa_tot": "TFSA w/d",
        "total_withdrawals": "Total w/d",
        # TFSA room and contributions
        "tfsa_room_tot": "TFSA Room",
        "contrib_tfsa_tot": "TFSA Contrib",
        # GIS-Optimized strategy tracking
        "gis_clawback_tot": "GIS Clawback",
        "gis_income_headroom_tot": "GIS Headroom",
    }
    df_display = df_display.rename(columns=rename_dict)
    st.dataframe(format_df_for_display(df_display, exclude=("year", "Age P1", "Age P2")), use_container_width=True)

    # Download button for comprehensive data
    st.download_button(
        label="Download Comprehensive Cashflow & Net Worth Data",
        data=df_display.to_csv(index=False),
        file_name="comprehensive_cashflow_summary.csv",
        mime="text/csv"
    )  

    # Table 3.  Yearly Cashflow, Taxes & Growth 
    df_y = st.session_state.get("df")
    if st.session_state.get("sim_ready") and df_y is not None and not df_y.empty:
        yy = df_y.copy()

        # Ensure numeric types and a clean year column
        yy["year"] = pd.to_numeric(yy["year"], errors="coerce").fillna(0).astype(int)

        # Household totals per row
        yy["withdraw_nonreg_tot"] = yy["withdraw_nonreg_p1"] + yy["withdraw_nonreg_p2"]
        yy["withdraw_rrif_tot"]   = yy["withdraw_rrif_p1"]   + yy["withdraw_rrif_p2"]
        yy["withdraw_tfsa_tot"]   = yy["withdraw_tfsa_p1"]   + yy["withdraw_tfsa_p2"]
        yy["withdraw_corp_tot"]   = yy["withdraw_corp_p1"]   + yy["withdraw_corp_p2"]
        yy["withdrawals_total"]   = yy["withdraw_nonreg_tot"] + yy["withdraw_rrif_tot"] + yy["withdraw_tfsa_tot"] + yy["withdraw_corp_tot"]

        # Already saved into rows now:
        yy["nr_dist_tot"] = yy.get("nr_dist_tot", 0.0)

        yy["cpp_tot"] = yy["cpp_p1"] + yy["cpp_p2"]
        yy["oas_tot"] = yy["oas_p1"] + yy["oas_p2"]

        # Cash inflows for lifestyle check
        yy["cash_inflows_total"] = yy["withdrawals_total"] + yy["nr_dist_tot"] + yy["cpp_tot"] + yy["oas_tot"]
        
        # Household fed/prov taxes (new)
        if "tax_fed_total_after_split" in yy.columns and "tax_prov_total_after_split" in yy.columns:
            yy["tax_fed"]  = yy["tax_fed_total_after_split"]
            yy["tax_prov"] = yy["tax_prov_total_after_split"]
        else:
            # fallback if you haven't added the split yet
            yy["tax_fed"] = 0.0
            yy["tax_prov"] = yy["total_tax_after_split"]

        yy["total_tax_after_split"] = (
            pd.to_numeric(yy.get("tax_fed", 0.0), errors="coerce").fillna(0.0)
            + pd.to_numeric(yy.get("tax_prov", 0.0), errors="coerce").fillna(0.0)
        )

        # OAS Clawback (household total)
        yy["oas_clawback_tot"] = (
            _col_or_zero(yy, "oas_clawback_p1") + _col_or_zero(yy, "oas_clawback_p2")
        )

        # Ending balances (household)
        yy["end_rrif_tot"]  = yy["end_rrif_p1"]  + yy["end_rrif_p2"]
        yy["end_tfsa_tot"]  = yy["end_tfsa_p1"]  + yy["end_tfsa_p2"]
        yy["end_nonreg_tot"]= yy["end_nonreg_p1"]+ yy["end_nonreg_p2"]
        yy["end_corp_tot"]  = yy["end_corp_p1"]  + yy["end_corp_p2"]

        # Growth (household)
        yy["growth_rrif_tot"]   = yy.get("growth_rrif_p1",0.0)   + yy.get("growth_rrif_p2",0.0)
        yy["growth_tfsa_tot"]   = yy.get("growth_tfsa_p1",0.0)   + yy.get("growth_tfsa_p2",0.0)
        yy["growth_nonreg_tot"] = yy.get("growth_nonreg_p1",0.0) + yy.get("growth_nonreg_p2",0.0)
        yy["growth_corp_tot"]   = yy.get("growth_corp_p1",0.0)   + yy.get("growth_corp_p2",0.0)

        # Robust Non-Reg distributions (per household)
        yy["nr_dist_calc"] = (
            _col_or_zero(yy, "nr_interest_p1")
            + _col_or_zero(yy, "nr_interest_p2")
            + _col_or_zero(yy, "nr_elig_div_p1")
            + _col_or_zero(yy, "nr_elig_div_p2")
            + _col_or_zero(yy, "nr_nonelig_div_p1")
            + _col_or_zero(yy, "nr_nonelig_div_p2")
            + _col_or_zero(yy, "nr_capg_dist_p1")
            + _col_or_zero(yy, "nr_capg_dist_p2")
        )
    
        # Use stored nr_dist_tot if it's positive; otherwise fall back to the calc
        if "nr_dist_tot" not in yy.columns:
            yy["nr_dist_tot"] = yy["nr_dist_calc"]
        else:
            yy["nr_dist_tot"] = pd.to_numeric(yy["nr_dist_tot"], errors="coerce").fillna(0.0)
            yy.loc[yy["nr_dist_tot"] <= 0, "nr_dist_tot"] = yy.loc[yy["nr_dist_tot"] <= 0, "nr_dist_calc"]

        if "Corp->RRIF->NonReg->TFSA" in str(hh.strategy):
        # treat cash dividends as corp withdrawals for display if the engine didn't emit any
            if (yy["withdraw_corp_tot"] == 0).all():
                div_cash = yy.get("div_cash_total", 0.0)
                if isinstance(div_cash, (int, float)):
                    yy["withdraw_corp_tot"] = div_cash
                else:
                    yy["withdraw_corp_tot"] = pd.to_numeric(div_cash, errors="coerce").fillna(0.0)


        # Cash inflows (pre-tax)
        yy["cash_inflows_total"] = (
            yy["withdrawals_total"] + yy["nr_dist_tot"] + yy["cpp_tot"] + yy["oas_tot"]
        )

        # Net after tax & gap vs target
        yy["total_tax_after_split"] = pd.to_numeric(yy["total_tax_after_split"], errors="coerce").fillna(0.0)
        yy["net_after_tax"] = yy["cash_inflows_total"] - yy["total_tax_after_split"]
        yy["after_tax_gap"] = yy["net_after_tax"] - yy["spend_target_after_tax"]

        # Optional quick warning banner if any year misses the target
        miss_years = yy.loc[yy["after_tax_gap"] < -0.01, "year"].astype(int).tolist()
        if miss_years:
            st.warning(f"After-tax spending target not met in: {', '.join(map(str, miss_years[:10]))}"
                    + (" ..." if len(miss_years) > 10 else ""))

        # Final selection — detailed tax & growth view (no withdrawal/spending redundancy)
        # Table 1 handles: withdrawals, spending targets, adequacy
        # Table 2 handles: detailed tax breakdown, account balances, and growth
        # Excluded: nr_dist_tot (shown in Table 1), all withdrawal/spending columns
        cols = [
            "year",
            # OAS & Pension info
            "oas_clawback_tot",
            # Dividend analysis (detailed breakdown for tax calculation)
            "div_cash_eligible","div_cash_noneligible","div_cash_total",
            "div_grossed_eligible","div_grossed_noneligible","div_taxable_income",
            "div_credit_fed","div_credit_prov","div_credit_total",
            # Tax breakdown (detailed by jurisdiction)
            "tax_fed","tax_prov","total_tax_after_split",
            # Account-level details (ending balances and growth by account)
            "end_rrif_tot","end_tfsa_tot","end_nonreg_tot",
            "growth_rrif_tot","growth_tfsa_tot","growth_nonreg_tot",
        ]

        # Add corporate account columns only if NOT ignoring corporate
        if not st.session_state.get("no_corp", False):
            cols.extend(["end_corp_tot", "growth_corp_tot"])

        # Ensure nr_dist_tot is explicitly excluded (should be in Table 1, not Table 2)
        cols = [c for c in cols if c in yy.columns]

        yy["year"] = pd.to_numeric(yy["year"], errors="coerce").fillna(0).astype(int)

        # --- Dividend gross-up + credits per year (household) ---

        # Get base tax params and household for routing corp dividends and for per-year indexing
        province = st.session_state.get("province", "AB")
        tax_cfg = st.session_state.tax_cfg
        fed_params_base, prov_params_base = get_tax_params(tax_cfg, province)
        hh_current = st.session_state.hh

        # Helper to route corp cash to elig/non-elig per person
        def _route_corp_to_div(corp_cash: float, divtype: str) -> tuple[float, float]:
            if corp_cash <= 0:
                return 0.0, 0.0
            if (divtype or "non-eligible").lower().startswith("elig"):
                return corp_cash, 0.0
            return 0.0, corp_cash

        # Ensure needed columns exist (robust to older runs)
        for c in ["withdraw_corp_p1","withdraw_corp_p2",
                "nr_elig_div_p1","nr_elig_div_p2",
                "nr_nonelig_div_p1","nr_nonelig_div_p2"]:
            if c not in yy.columns:
                yy[c] = 0.0

        # Build per-row gross-up & credit columns
        div_cols = {
            "div_cash_eligible": [],
            "div_cash_noneligible": [],
            "div_grossed_eligible": [],
            "div_grossed_noneligible": [],
            "div_taxable_income": [],
            "div_credit_fed": [],
            "div_credit_prov": [],
            "div_credit_total": [],
        }

        for _, r in yy.iterrows():
            year = int(r["year"])
            years_since_start = year - hh_current.start_year

            # Index tax params (so gross-up thresholds/credits inflate consistently with your model)
            fed_y  = index_tax_params(fed_params_base,  years_since_start, hh_current.general_inflation)
            prov_y = index_tax_params(prov_params_base, years_since_start, hh_current.general_inflation)

            # Base NR dividends (cash) stored in df (per-person)
            nr_elig_cash = float(r.get("nr_elig_div_p1", 0.0) + r.get("nr_elig_div_p2", 0.0))
            nr_nonelig_cash = float(r.get("nr_nonelig_div_p1", 0.0) + r.get("nr_nonelig_div_p2", 0.0))

            # Corporate cash paid this year to each person
            corp_p1 = float(r.get("withdraw_corp_p1", 0.0))
            corp_p2 = float(r.get("withdraw_corp_p2", 0.0))

            # Route corp cash into eligible vs non-eligible buckets
            elig_p1, nonelig_p1 = _route_corp_to_div(corp_p1, getattr(hh_current.p1, "corp_dividend_type", "non-eligible"))
            elig_p2, nonelig_p2 = _route_corp_to_div(corp_p2, getattr(hh_current.p2, "corp_dividend_type", "non-eligible"))

            # Total cash dividends (household)
            cash_elig    = nr_elig_cash    + elig_p1    + elig_p2
            cash_nonelig = nr_nonelig_cash + nonelig_p1 + nonelig_p2

            # Apply gross-up (same gross-up rates on fed/prov params in your model)
            gross_elig    = cash_elig    * (1.0 + fed_y.dividend_grossup_eligible)
            gross_nonelig = cash_nonelig * (1.0 + fed_y.dividend_grossup_noneligible)

            # Dividend credits (fed & prov) using each side's credit rates
            credit_fed  = gross_elig * fed_y.dividend_credit_rate_eligible \
                        + gross_nonelig * fed_y.dividend_credit_rate_noneligible
            credit_prov = gross_elig * prov_y.dividend_credit_rate_eligible \
                        + gross_nonelig * prov_y.dividend_credit_rate_noneligible

            # Store
            div_cols["div_cash_eligible"].append(cash_elig)
            div_cols["div_cash_noneligible"].append(cash_nonelig)
            div_cols["div_grossed_eligible"].append(gross_elig)
            div_cols["div_grossed_noneligible"].append(gross_nonelig)
            div_cols["div_taxable_income"].append(gross_elig + gross_nonelig)
            div_cols["div_credit_fed"].append(credit_fed)
            div_cols["div_credit_prov"].append(credit_prov)
            div_cols["div_credit_total"].append(credit_fed + credit_prov)

        # Attach new columns to yy
        for k, v in div_cols.items():
            yy[k] = v

        # (Optional) sanity column: total cash dividends before gross-up
        yy["div_cash_total"] = yy["div_cash_eligible"] + yy["div_cash_noneligible"]


        num_cols = [c for c in yy[cols].select_dtypes(include="number").columns if c != "year"]
        fmt = {c: "{:,.2f}" for c in num_cols}

        st.subheader("Table 2: Detailed Tax Analysis & Account Growth (Household)")
        shown = yy[cols]
        st.dataframe(format_df_for_display(shown), use_container_width=True)

        st.download_button(
            "Download Yearly Cashflow, Taxes & Growth (CSV)",
            yy[cols].to_csv(index=False),
            "yearly_cashflow_taxes_growth.csv",
            "text/csv"
        )

        # Table 3: Cashflow Audit
        st.subheader("Table 3: Cashflow Audit")
        audit_cols = [
            "year","spend_target_after_tax","cash_inflows_total","total_tax_after_split",
            "after_tax_cash_available","residual_vs_target","is_underfunded"
        ]
        audit_df = df[[c for c in audit_cols if c in df.columns]].copy()
        # Format Table 3: comma thousands and 2 decimals, except year as integer
        st.dataframe(format_df_for_display(audit_df, exclude=("year",), decimals=2), use_container_width=True)

        # Government Benefits & GIS Analysis charts are now displayed in the Projections & Trends tab
else:
    st.info("Run the simulation to see the Yearly Cashflow, Taxes & Growth table.")

# ============     PDF Report Export Section  =========================
st.markdown("---")
st.markdown("## 📥 Export Your Retirement Plan")

# DEBUG: Check section visibility conditions
import sys
print(f"DEBUG [APP - PDF SECTION CHECK]", file=sys.stderr)
print(f"  sim_ready: {st.session_state.get('sim_ready')}", file=sys.stderr)
print(f"  hh: {st.session_state.get('hh') is not None}", file=sys.stderr)
print(f"  df: {st.session_state.get('df') is not None}", file=sys.stderr)

if st.session_state.get("sim_ready") and st.session_state.get("hh") is not None and st.session_state.get("df") is not None:
    # Collect available figures from session state
    figures_dict = {}

    # Try to collect any Plotly figures that were generated
    figure_keys = [
        # Gauges (original)
        "fig_success", "fig_capacity",
        # Tier 1 projection graphs (NEW)
        "fig_spending_coverage", "fig_account_depletion", "fig_gov_benefits",
        # Tier 2 projection graphs (NEW)
        "fig_plan_funding", "fig_tax_rate", "fig_income_comp", "fig_household_inflows",
        # Other graphs (original)
        "fig_net_income", "fig_spending",
        "fig_balances", "fig_sources", "fig_cpp_oas", "fig_tax_breakdown",
        "fig_gis_impact", "fig_legacy"
    ]

    # DEBUG: Log what's in session state
    import sys
    print(f"DEBUG [APP - PDF SECTION] Checking for figures in session state", file=sys.stderr)
    print(f"  Total session state keys: {len(st.session_state)}", file=sys.stderr)
    for key in figure_keys:
        has_key = key in st.session_state
        is_not_none = st.session_state[key] is not None if key in st.session_state else False
        print(f"  {key}: exists={has_key}, not_none={is_not_none}", file=sys.stderr)

    for key in figure_keys:
        if key in st.session_state and st.session_state[key] is not None:
            display_name = key.replace("fig_", "").replace("_", " ").title()
            figures_dict[display_name] = st.session_state[key]
            print(f"DEBUG [APP - PDF SECTION] Collected figure: {key} -> {display_name}", file=sys.stderr)

    print(f"DEBUG [APP - PDF SECTION] Total figures collected: {len(figures_dict)}", file=sys.stderr)

    # ===== AUTO-GENERATE PDF ON SIMULATION COMPLETION =====
    # Automatically generate PDF after successful simulation to ensure PDF is always in sync
    if not st.session_state.get("pdf_auto_generated"):
        print(f"DEBUG [APP - AUTO PDF] Attempting automatic PDF generation", file=sys.stderr)
        try:
            hh = st.session_state.get("hh")
            df = st.session_state.get("df")

            if hh is not None and df is not None and not df.empty:
                filename, pdf_path, success = generate_pdf_automatically(hh, df, figures_dict if figures_dict else None)

                if success:
                    st.session_state["pdf_auto_generated"] = True
                    st.session_state["last_pdf_filename"] = filename
                    st.session_state["last_pdf_path"] = pdf_path

                    st.toast(f"✅ PDF report automatically generated: {filename}", icon="📄")
                    print(f"DEBUG [APP - AUTO PDF] Success: {filename} saved to {pdf_path}", file=sys.stderr)
                else:
                    print(f"DEBUG [APP - AUTO PDF] PDF generation returned False", file=sys.stderr)
            else:
                print(f"DEBUG [APP - AUTO PDF] Missing data: hh={hh is not None}, df={df is not None if df is not None else False}", file=sys.stderr)
        except Exception as e:
            # Log error but don't break simulation - PDF generation is optional
            print(f"DEBUG [APP - AUTO PDF] Error during auto-generation: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)

    # Show PDF export button
    try:
        add_pdf_export_button(
            hh=st.session_state.get("hh"),
            df_results=st.session_state.get("df"),
            figures=figures_dict if figures_dict else None,
            key_prefix="app"
        )
    except Exception as e:
        st.error(f"Error displaying PDF export: {str(e)}")
        st.caption("PDF export feature is available but encountered an issue. Please try again.")
else:
    st.info("💡 Run the simulation first to generate and export your retirement plan as a PDF.")

# ============     End of Tables  =========================   

# Advanced Analysis
# Keep expander open if Monte Carlo results exist or user wants to see them
show_advanced = st.session_state.get("mc_results_exist", False)
with st.expander("Advanced Analysis (Tax Debugger and Monte Carlo Simulation)", expanded=show_advanced):

    sim_ready = st.session_state.get("sim_ready") and st.session_state.get("df") is not None
    # safe defaults so later code doesn't explode if sim_ready is False
    hh = st.session_state.get("hh")
    tax_cfg = st.session_state.get("tax_cfg")
    custom_df = st.session_state.get("custom_df")
    df = st.session_state.get("df")
    province = st.session_state.get("province", "AB")

    if not sim_ready:
        st.caption("Run a baseline simulation first to enable advanced analysis.")

    else:     
        # ---------------- TAX DEBUGGER: recompute fed+prov tax for selected years ----------------
        st.subheader("Tax Debugger (recompute for a few years)")
            # pick a small window to inspect: first 5 years (adjust as you like)
        
        if st.session_state.get("sim_ready") and st.session_state.df is not None:
        
            # After a successful simulate() run, before rendering
            df = st.session_state.df
            df["total_tax_after_split"] = pd.to_numeric(df["total_tax_after_split"], errors="coerce").fillna(0.0)
            df["cumulative_tax"] = df["total_tax_after_split"].cumsum()
            st.session_state.df = df

            years_to_check = st.multiselect("Pick years to inspect", options=df["year"].tolist(), default=df["year"].tolist()[:5], key="tax_debug_years")
            fed_params, prov_params = get_tax_params(tax_cfg, province)
            debug_rows = []
    
            for _, row in df[df["year"].isin(years_to_check)].iterrows():
                year = int(row["year"])
                age1 = int(row["age_p1"]); age2 = int(row["age_p2"])

                # Pull per-person cash components we *know*:
                rr1 = float(row["withdraw_rrif_p1"]); rr2 = float(row["withdraw_rrif_p2"])
                cd1 = float(row["withdraw_corp_p1"]); cd2 = float(row["withdraw_corp_p2"])
                oas1 = float(row["oas_p1"]); oas2 = float(row["oas_p2"])
                cpp1 = float(row["cpp_p1"]); cpp2 = float(row["cpp_p2"])

                # previously: fed_params, prov_params (base)
                years_since_start = year - hh.start_year
                fed_y  = index_tax_params(fed_params,  years_since_start, hh.general_inflation)
                prov_y = index_tax_params(prov_params, years_since_start, hh.general_inflation)

                def tax_min_proxy(age, rrif_amt, oas_amt, cpp_amt=0.0):
                    res_f = progressive_tax(fed_y, age, ordinary_income=0.0, elig_dividends=0.0, nonelig_dividends=0.0,
                            cap_gains=0.0, pension_income=rrif_amt + cpp_amt, 
                            oas_received = oas_amt
                    )
                    res_p = progressive_tax(prov_y, age, ordinary_income=0.0, elig_dividends=0.0, nonelig_dividends=0.0,
                            cap_gains=0.0, pension_income=rrif_amt + cpp_amt, oas_received=oas_amt
                    )
                    return res_f["net_tax"] + res_p["net_tax"], res_f, res_p
                tax_p1_min, resf1, resp1 = tax_min_proxy(age1, rr1, oas1, cpp1)
                tax_p2_min, resf2, resp2 = tax_min_proxy(age2, rr2, oas2, cpp2)
                tax_min_total = tax_p1_min + tax_p2_min
                
                debug_rows.append({
                    "year": year,
                    "rrif_p1": rr1, "oas_p1": oas1, "cpp_p1": cpp1,
                    "rrif_p2": rr2, "oas_p2": oas2, "cpp_p2": cpp2,
                    "stored_tax_total": float(row["total_tax_after_split"]),
                    "min_proxy_tax_total(RRIF+OAS only)": float(tax_min_total),
                    "min_proxy_tax_p1": float(tax_p1_min),
                    "min_proxy_tax_p2": float(tax_p2_min),
                    "fed_tax_p1(min)": float(resf1["net_tax"]), "prov_tax_p1(min)": float(resp1["net_tax"]),
                    "fed_tax_p2(min)": float(resf2["net_tax"]), "prov_tax_p2(min)": float(resp2["net_tax"]),
                })

            dbg = pd.DataFrame(debug_rows).sort_values("year")
            st.dataframe(format_df_for_display(dbg), use_container_width=True)

            # --- Improved suspicious-year detection (avoid false positives) ---
            susp = dbg[
                (dbg["stored_tax_total"] < 1.0)
                & (dbg["rrif_p1"] + dbg["rrif_p2"] > 0.0)
                & (dbg["min_proxy_tax_total(RRIF+OAS only)"] > 1.0)  # only warn if proxy predicts tax > $1
            ]

            if len(susp) > 0:
                years_list = susp["year"].astype(int).tolist()
                st.error(
                    "Suspicious years where stored total_tax_after_split≈0 AND proxy predicts tax > $1: "
                    + ", ".join(map(str, years_list))
                )
                st.caption("This can indicate an overwrite after the split recompute, or that the split wasn’t applied that year.")

                # -------- Mini Breakdown Viewer for flagged years --------
                pick = st.selectbox("Inspect a flagged year", options=years_list, index=0, key="susp_pick_year")

                r = df.loc[df["year"] == pick].iloc[0]

                # Household components pulled from DF (what the sim stored)
                rr1, rr2 = float(r.get("withdraw_rrif_p1", 0.0)), float(r.get("withdraw_rrif_p2", 0.0))
                cd1, cd2 = float(r.get("withdraw_corp_p1", 0.0)), float(r.get("withdraw_corp_p2", 0.0))
                oas1, oas2 = float(r.get("oas_p1", 0.0)), float(r.get("oas_p2", 0.0))
                cpp1, cpp2 = float(r.get("cpp_p1", 0.0)), float(r.get("cpp_p2", 0.0))

                # Non-reg baseline distributions (cash to household)
                nr_interest = float(r.get("nr_interest_p1",0.0) + r.get("nr_interest_p2",0.0))
                nr_elig    = float(r.get("nr_elig_div_p1",0.0) + r.get("nr_elig_div_p2",0.0))
                nr_nonelig = float(r.get("nr_nonelig_div_p1",0.0) + r.get("nr_nonelig_div_p2",0.0))
                nr_capg    = float(r.get("nr_capg_dist_p1",0.0) + r.get("nr_capg_dist_p2",0.0))

                st.markdown("**Stored vs Proxy (quick view)**")
                st.write({
                    "year": int(pick),
                    "stored_total_tax_after_split": float(r.get("total_tax_after_split", 0.0)),
                    "proxy_min_tax (RRIF+OAS only)": float(
                        susp.loc[susp["year"] == pick, "min_proxy_tax_total(RRIF+OAS only)"].iloc[0]
                    ),
                    "rrif_p1": rr1, "rrif_p2": rr2,
                    "corp_div_p1": cd1, "corp_div_p2": cd2,
                    "oas_tot": oas1 + oas2, "cpp_tot": cpp1 + cpp2,
                    "nr_interest_tot": nr_interest, "nr_elig_div_tot": nr_elig,
                    "nr_nonelig_div_tot": nr_nonelig, "nr_capg_dist_tot": nr_capg,
                })

                st.caption("Tip: If stored tax ≈ 0 but proxy > $1, verify that `tax1_after` and `tax2_after` are used to compute `total_tax_after_split` for that year and weren’t overwritten later.")
            else:
                st.success("Tax Debugger: no inconsistencies detected by the proxy check.")

            # ---------------- TAX MICROSCOPE ----------------
            st.divider()
            st.subheader("Tax Microscope (per year)")
            
            year_choices = df['year'].tolist()
            year_pick = st.selectbox("Pick year to inspect", options=year_choices, index=0, key="tax_microscope_year")

            # Row for selected year
            r = df[df['year'] == year_pick].iloc[0]

            # Get tax params for current province
            fed_params, prov_params = get_tax_params(tax_cfg, province)
            years_since_start = int(year_pick - hh.start_year)
            fed_y  = index_tax_params(fed_params,  years_since_start, hh.general_inflation)
            prov_y = index_tax_params(prov_params, years_since_start, hh.general_inflation)

            # Row for selected year
            r = df[df['year'] == year_pick].iloc[0]

            # Pull components from the dataframe (household totals)
            rrif_income = float(r.get('withdraw_rrif_p1', 0.0) + r.get('withdraw_rrif_p2', 0.0))
            oas_income  = float(r.get('oas_p1', 0.0) + r.get('oas_p2', 0.0))
            cpp_income  = float(r.get('cpp_p1', 0.0) + r.get('cpp_p2', 0.0))

            # Non-reg distributions (automatic cash flows). If not present, fall back to 0.
            nr_dist_total = float(r.get('nr_dist_tot', 0.0))

            # For microscope simplicity, treat NR distributions as ordinary income here.
            # (If you store a full split, we can refine to eligible/non-eligible dividend credits.)
            ordinary_income_est   = nr_dist_total
            elig_dividends_est    = 0.0
            nonelig_dividends_est = 0.0
            capg_dist_est         = 0.0

            # Use max age (same convention as your simulate_year credit calc)
            age_for_credits = int(max(r.get('age_p1', 0), r.get('age_p2', 0)))
    
            # --- Exact(ish) recompute for the selected year (per-person, with RRIF split) ---

            # Pull per-person row values
            rr1 = float(r.get("withdraw_rrif_p1", 0.0)); rr2 = float(r.get("withdraw_rrif_p2", 0.0))
            cd1 = float(r.get("withdraw_corp_p1", 0.0)); cd2 = float(r.get("withdraw_corp_p2", 0.0))
            oas1 = float(r.get("oas_p1", 0.0));          oas2 = float(r.get("oas_p2", 0.0))
            cpp1 = float(r.get("cpp_p1", 0.0));          cpp2 = float(r.get("cpp_p2", 0.0))

            # Non-reg components (cash distributions + realized CG from sale)
            nr_i_1  = float(r.get("nr_interest_p1", 0.0))
            nr_ed_1 = float(r.get("nr_elig_div_p1", 0.0))
            nr_nd_1 = float(r.get("nr_nonelig_div_p1", 0.0))
            nr_cg_1 = float(r.get("nr_capg_dist_p1", 0.0)) + float(r.get("cg_from_sale_p1", 0.0))

            nr_i_2  = float(r.get("nr_interest_p2", 0.0))
            nr_ed_2 = float(r.get("nr_elig_div_p2", 0.0))
            nr_nd_2 = float(r.get("nr_nonelig_div_p2", 0.0))
            nr_cg_2 = float(r.get("nr_capg_dist_p2", 0.0)) + float(r.get("cg_from_sale_p2", 0.0))

            # Route corporate cash to elig/non-elig per person
            def _route_corp(cash: float, divtype: str) -> tuple[float, float]:
                if cash <= 0:
                    return 0.0, 0.0
                return (cash, 0.0) if (divtype or "non-eligible").lower().startswith("elig") else (0.0, cash)
            
            elig1_corp, nonelig1_corp = _route_corp(cd1, getattr(hh.p1, "corp_dividend_type", "non-eligible"))
            elig2_corp, nonelig2_corp = _route_corp(cd2, getattr(hh.p2, "corp_dividend_type", "non-eligible"))


            # Totals per person (cash before gross-up)
            elig1 = nr_ed_1 + elig1_corp
            elig2 = nr_ed_2 + elig2_corp
            nonelig1 = nr_nd_1 + nonelig1_corp
            nonelig2 = nr_nd_2 + nonelig2_corp

            # RRIF pension splitting (replicate simulate())
            split = max(0.0, min(hh.income_split_rrif_fraction, 0.5))
            age1 = int(r.get("age_p1", 0)); age2 = int(r.get("age_p2", 0))
            transfer12 = split * rr1 if age1 >= 65 else 0.0
            transfer21 = split * rr2 if age2 >= 65 else 0.0
            rr1_after = rr1 - transfer12 + transfer21
            rr2_after = rr2 - transfer21 + transfer12

            def _tax_person(age, ordinary, elig, nonelig, capg, rrif, cpp, oas):
                # Compute with gross-up & credits by letting progressive_tax do the work
                res_f = progressive_tax(
                    fed_y, age,
                    ordinary_income=ordinary,
                    elig_dividends=elig,
                    nonelig_dividends=nonelig,
                    cap_gains=capg,
                    pension_income=rrif + cpp,
                    oas_received=oas
                )
                res_p = progressive_tax(
                    prov_y, age,
                    ordinary_income=ordinary,
                    elig_dividends=elig,
                    nonelig_dividends=nonelig,
                    cap_gains=capg,
                    pension_income=rrif + cpp,
                    oas_received=oas
                )
                return {
                    "taxable_income": res_f["taxable_income"],  # same base
                    "gross_tax":      res_f["gross_tax"] + res_p["gross_tax"],
                    "credits":        res_f["total_credits"]   + res_p["total_credits"],
                    "oas_clawback":   res_f["oas_clawback"],     # federal-only
                    "net_tax":        res_f["net_tax"]   + res_p["net_tax"],
                    "fed_net":        res_f["net_tax"],
                    "prov_net":       res_p["net_tax"],
                }

            out1 = _tax_person(age1, nr_i_1, elig1, nonelig1, nr_cg_1, rr1_after, cpp1, oas1)
            out2 = _tax_person(age2, nr_i_2, elig2, nonelig2, nr_cg_2, rr2_after, cpp2, oas2)

            total_net = out1["net_tax"] + out2["net_tax"]

            st.markdown("**Inputs used (per person) — Microscope**")
            st.json({
                "P1": {"ordinary": nr_i_1, "elig": elig1, "nonelig": nonelig1, "capg": nr_cg_1,
                    "RRIF_after_split": rr1_after, "CPP": cpp1, "OAS": oas1, "age": age1},
                "P2": {"ordinary": nr_i_2, "elig": elig2, "nonelig": nonelig2, "capg": nr_cg_2,
                    "RRIF_after_split": rr2_after, "CPP": cpp2, "OAS": oas2, "age": age2},
            })

            # --- Reconcile with stored after-split taxes from the DataFrame ---
            stored_p1 = float(r.get("tax_after_split_p1", float("nan")))
            stored_p2 = float(r.get("tax_after_split_p2", float("nan")))
            stored_tot = float(r.get("total_tax_after_split", float("nan")))

            recomp_p1 = float(out1["net_tax"])
            recomp_p2 = float(out2["net_tax"])
            recomp_tot = float(total_net)

            st.markdown("**Reconciliation vs stored values**")
            st.write({
                "stored_p1": round(stored_p1, 2),
                "stored_p2": round(stored_p2, 2),
                "stored_total": round(stored_tot, 2),
                "microscope_p1": round(recomp_p1, 2),
                "microscope_p2": round(recomp_p2, 2),
                "microscope_total": round(recomp_tot, 2),
                "Δ_p1": round(recomp_p1 - stored_p1, 2) if stored_p1 == stored_p1 else None,
                "Δ_p2": round(recomp_p2 - stored_p2, 2) if stored_p2 == stored_p2 else None,
                "Δ_total": round(recomp_tot - stored_tot, 2) if stored_tot == stored_tot else None,
            })

            colA, colB, colC = st.columns(3)
            with colA:
                st.markdown("**Person 1 — Net tax**")
                st.write(round(out1["net_tax"], 2))
                st.caption(f"Fed: {out1['fed_net']:.2f} | Prov: {out1['prov_net']:.2f}")

            with colB:
                st.markdown("**Person 2 — Net tax**")
                st.write(round(out2["net_tax"], 2))
                st.caption(f"Fed: {out2['fed_net']:.2f} | Prov: {out2['prov_net']:.2f}")

            with colC:
                st.markdown("**Household (after split) — Net tax**")
                st.write(round(total_net, 2))

            st.caption("This recomputation matches the tax engine’s logic (incl. gross-ups, credits, realized CG, corporate payouts, and RRIF pension splitting).")             
            # -------------- END TAX MICROSCOPE --------------

        # -------------- Monte Carlo Simulation Start -------------
        st.divider()
        st.subheader("📊 Monte Carlo (v1) — Scenario Check")

        # === INTERPRETATION GUIDE ===
        with st.expander("📖 What This Simulation Tests", expanded=True):
            st.markdown("""
            **What is Monte Carlo Analysis?**

            This test runs your retirement plan 500+ times, each with different market return scenarios:

            1. We draw random annual returns from your assumptions (e.g., RRIF mean 5% with ±10% volatility)
            2. We run the full retirement simulation with those randomized returns
            3. We track: plan success, final net worth, taxes paid, and legacy left
            4. We calculate the range of outcomes across all scenarios

            **What the Success Rate Means**

            - **Success %**: In what percentage of market scenarios does your plan stay funded throughout retirement?
              - This is the most important metric — it tells you the probability your plan works
              - Based on your spending target and account balances each year

            - **Median Net Worth**: What's the typical final asset balance across all scenarios?

            - **P5-P95 Range**: The worst 5% to best 5% of cases
              - P5 = Very pessimistic scenario (tough market conditions)
              - Median = Most likely outcome
              - P95 = Very optimistic scenario (strong market conditions)

            **How to Interpret Success Rate**

            | Success Rate | Interpretation | Recommendation |
            |:---:|:---|:---|
            | 🟢 **90%+** | Excellent | Proceed with confidence ✅ |
            | 🟢 **80-90%** | Good | Plan is solid, monitor closely |
            | 🟡 **75-80%** | Acceptable | Consider adjustments |
            | 🔴 **<75%** | Risky | Plan needs major adjustments ❌ |

            **What to Test**

            Try different return assumptions to see sensitivity:
            - **Conservative**: Lower means (e.g., 4% instead of 5%), higher volatility
            - **Aggressive**: Higher means (e.g., 6% instead of 5%), similar volatility
            - **Stable**: Lower volatility (e.g., 7% instead of 10%)
            """)

        with st.expander("Settings", expanded=False):
            n_sims = st.number_input(
                "Number of simulations", min_value=100, max_value=5000, value=500, step=100, key="mc_n_sims"
            )
            seed = st.number_input(
                "Random seed", min_value=0, max_value=10_000, value=42, step=1, key="mc_seed_sims"
            )
            st.markdown("**Annual return assumptions (mean & volatility)**")
            col_m1, col_s1 = st.columns(2)
            with col_m1:
                mu_rrif = st.number_input("RRIF / RRSP mean", step=0.005, format="%.3f", key="mc_mu_rrif_sims")
                mu_tfsa = st.number_input("TFSA mean", step=0.005, format="%.3f", key="mc_mu_tfsa_sims")
                mu_nonr = st.number_input("Non-Registered mean", step=0.005, format="%.3f", key="mc_mu_nonr_sims")
                mu_corp = st.number_input("Corporate mean", step=0.005, format="%.3f", key="mc_mu_corp_sims")
            with col_s1:
                vol_rrif = st.number_input("RRIF / RRSP vol (stdev)", step=0.005, format="%.3f", key="mc_vol_rrif_sims")
                vol_tfsa = st.number_input("TFSA vol (stdev)", step=0.005, format="%.3f", key="mc_vol_tfsa_sims")
                vol_nonr = st.number_input("Non-Registered vol (stdev)", step=0.005, format="%.3f", key="mc_vol_nonr_sims")
                vol_corp = st.number_input("Corporate vol (stdev)", step=0.005, format="%.3f", key="mc_vol_corp_sims")

            # ===== Market Stress Scenario Selector (Phase 3) =====
            st.divider()
            st.markdown("**📊 Market Stress Scenario Testing (Phase 3)**")

            stress_scenario_key = st.selectbox(
                "Select market scenario to test",
                options=list(STRESS_SCENARIOS.keys()),
                format_func=lambda x: STRESS_SCENARIOS[x]["name"],
                key="mc_stress_scenario",
                help="Test your plan against different market conditions"
            )

            # Display scenario description and interpretation
            scenario = STRESS_SCENARIOS[stress_scenario_key]
            st.markdown(f"**{scenario['name']}**")
            st.caption(scenario['description'])

            col_hist, col_years = st.columns(2)
            with col_hist:
                st.metric("Historical Parallel", scenario['historical_parallel'])
            with col_years:
                st.metric("Years Affected", scenario['years_affected'])

            st.info(f"📌 {scenario['interpretation']}")

            # Strategy selector

            available_strategies = [
                                    "Corp->RRIF->NonReg->TFSA",
                                    "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
                                    "RRIF->Corp->NonReg->TFSA",
            ]

            selected_strategies = st.multiselect(
                "Select Withdrawal Strategies to Compare",
                available_strategies,
                default=["Corp->RRIF->NonReg->TFSA", "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",],
                key="mc_strategies_sims"
            )

        # ====== NEW: Monte Carlo v2 Helper Functions ======

        def track_mc_simulation_failure(df, hh):
            """
            For a single MC simulation, determine success/failure metrics.

            Uses underfunded_before_backstop to measure TRUE underfunding
            (before any TFSA emergency assistance).

            Returns dict with:
            - is_successful: bool (all years fully funded)
            - year_of_failure: int or None (when first gap occurs)
            - max_gap_year: int (year with largest gap)
            - max_gap_amount: float (size of largest gap)
            - years_underfunded: int (count of underfunded years)
            - pct_years_underfunded: float (fraction of underfunded years)
            """
            if df is None or df.empty:
                return {
                    'is_successful': False,
                    'year_of_failure': None,
                    'max_gap_year': None,
                    'max_gap_amount': 0.0,
                    'years_underfunded': 0,
                    'pct_years_underfunded': 1.0,
                }

            gap_tol = float(getattr(hh, "gap_tolerance", 0.50))

            # Get underfunding metric BEFORE TFSA backstop assistance
            # CRITICAL: Use residual_vs_target_before_backstop which is created at line 2251
            # This preserves the original residual BEFORE the TFSA backstop modifies it

            # Safety check: if _before_backstop column doesn't exist, create it from residual_vs_target
            if "residual_vs_target_before_backstop" not in df.columns:
                # Fallback if column wasn't created (shouldn't happen, but safety measure)
                if "residual_vs_target" in df.columns:
                    df["residual_vs_target_before_backstop"] = df["residual_vs_target"].copy()
                else:
                    # Ultimate fallback
                    df["residual_vs_target_before_backstop"] = 0.0

            residual_series = _series_safe(df, "residual_vs_target_before_backstop", default_value=0.0)
            # Convert to gap amounts (max of 0 and absolute value of negative residuals)
            gap_series = residual_series.apply(lambda x: abs(min(x, 0)))

            if len(gap_series) == 0:
                return {
                    'is_successful': True,
                    'year_of_failure': None,
                    'max_gap_year': None,
                    'max_gap_amount': 0.0,
                    'years_underfunded': 0,
                    'pct_years_underfunded': 0.0,
                }

            # Find years where underfunding exceeds tolerance
            underfunded_mask = gap_series > gap_tol
            years_underfunded = int(underfunded_mask.sum())
            pct_underfunded = float(underfunded_mask.mean())

            # Year of first failure
            year_of_failure = None
            if underfunded_mask.any():
                first_failure_idx = underfunded_mask.idxmax()  # First True
                year_of_failure = int(df.iloc[first_failure_idx]['year']) if 'year' in df.columns else None

            # Year and amount of max gap
            max_gap_amount = float(gap_series.max()) if len(gap_series) > 0 else 0.0
            max_gap_year = None
            if max_gap_amount > 0:
                max_gap_idx = gap_series.idxmax()
                max_gap_year = int(df.iloc[max_gap_idx]['year']) if 'year' in df.columns else None

            is_successful = (years_underfunded == 0)

            return {
                'is_successful': is_successful,
                'year_of_failure': year_of_failure,
                'max_gap_year': max_gap_year,
                'max_gap_amount': max_gap_amount,
                'years_underfunded': years_underfunded,
                'pct_years_underfunded': pct_underfunded,
            }


        def aggregate_mc_results_v2(strategy_results, hh):
            """
            Aggregate all MC simulation runs for a single strategy.

            Calculates success rate, percentiles, and failure analysis.

            Args:
                strategy_results: list of {'df': df, 'metrics': metrics_dict, 'returns': ...}
                hh: Household object

            Returns:
                dict with success_pct, percentiles, failure_analysis, etc.
            """
            if not strategy_results:
                return {
                    'success_pct': 0.0,
                    'success_count': 0,
                    'total_simulations': 0,
                    'years_funded_p10': 0.0,
                    'years_funded_p25': 0.0,
                    'years_funded_p50': 0.0,
                    'years_funded_p75': 0.0,
                    'years_funded_p90': 0.0,
                    'year_of_failure_median': None,
                    'max_gap_median': 0.0,
                }

            n_sims = len(strategy_results)
            success_count = sum(1 for r in strategy_results if r['metrics']['is_successful'])
            success_rate = 100.0 * success_count / n_sims if n_sims > 0 else 0.0

            # Calculate years funded percentiles
            years_funded_pcts = [
                100.0 * (1.0 - r['metrics']['pct_years_underfunded'])
                for r in strategy_results
            ]

            # Failure analysis
            failed_results = [r for r in strategy_results if not r['metrics']['is_successful']]

            years_of_failure = [
                r['metrics']['year_of_failure']
                for r in failed_results
                if r['metrics']['year_of_failure'] is not None
            ]

            max_gaps = [
                r['metrics']['max_gap_amount']
                for r in strategy_results
                if r['metrics']['max_gap_amount'] > 0
            ]

            return {
                'success_pct': float(success_rate),
                'success_count': int(success_count),
                'total_simulations': int(n_sims),

                # Years funded percentiles
                'years_funded_p10': float(np.percentile(years_funded_pcts, 10)),
                'years_funded_p25': float(np.percentile(years_funded_pcts, 25)),
                'years_funded_p50': float(np.percentile(years_funded_pcts, 50)),
                'years_funded_p75': float(np.percentile(years_funded_pcts, 75)),
                'years_funded_p90': float(np.percentile(years_funded_pcts, 90)),

                # Failure analysis
                'failure_count': len(failed_results),
                'year_of_failure_median': float(np.median(years_of_failure)) if years_of_failure else None,
                'year_of_failure_p10': float(np.percentile(years_of_failure, 10)) if years_of_failure else None,
                'year_of_failure_p90': float(np.percentile(years_of_failure, 90)) if years_of_failure else None,

                # Gap analysis
                'max_gap_median': float(np.median(max_gaps)) if max_gaps else 0.0,
                'max_gap_p10': float(np.percentile(max_gaps, 10)) if max_gaps else 0.0,
                'max_gap_p90': float(np.percentile(max_gaps, 90)) if max_gaps else 0.0,
            }

        # ===== Apply Stress Scenario to Returns (Phase 3) =====
        # Note: STRESS_SCENARIOS dict is defined at module level (top of file) for global access
        def apply_stress_scenario(stress_key, mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp):
            """
            Apply stress scenario adjustments to mean returns.

            Args:
                stress_key: Key from STRESS_SCENARIOS dict
                mu_*: Original mean returns
                vol_*: Original volatilities (unchanged)

            Returns:
                Tuple of adjusted (mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp)
            """
            if stress_key == "baseline" or stress_key not in STRESS_SCENARIOS:
                # No adjustment for baseline
                return (mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp)

            scenario = STRESS_SCENARIOS[stress_key]
            adjustment = scenario.get("mu_adjustment", None)

            if adjustment is None:
                # No adjustment defined
                return (mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp)

            # Apply adjustment to all account types equally
            # (In real-world, could differentiate: equities hit harder than bonds, but simplify for now)
            if isinstance(adjustment, dict):
                if "all_years" in adjustment:
                    # Simple adjustment: all years same change
                    adj_amt = adjustment["all_years"]
                    return (
                        mu_rrif + adj_amt,
                        vol_rrif,
                        mu_tfsa + adj_amt,
                        vol_tfsa,
                        mu_nonr + adj_amt,
                        vol_nonr,
                        mu_corp + adj_amt,
                        vol_corp,
                    )
                else:
                    # Year-specific: use worst year for simplicity
                    # In real implementation, would apply different returns to different years
                    worst_year_return = min([v for k, v in adjustment.items() if isinstance(v, (int, float))])
                    return (
                        mu_rrif + worst_year_return,
                        vol_rrif,
                        mu_tfsa + worst_year_return,
                        vol_tfsa,
                        mu_nonr + worst_year_return,
                        vol_nonr,
                        mu_corp + worst_year_return,
                        vol_corp,
                    )
            else:
                # Single value adjustment
                return (
                    mu_rrif + adjustment,
                    vol_rrif,
                    mu_tfsa + adjustment,
                    vol_tfsa,
                    mu_nonr + adjustment,
                    vol_nonr,
                    mu_corp + adjustment,
                    vol_corp,
                )

        # ====== Cached MC runner (returns aggregates + per-run storage) ======
        def run_monte_carlo(
            hh, tax_cfg, custom_df, mu_sigma, n_sims, strategies, seed, _cache_buster: int = 0
        ):
            random.seed(seed)
            mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp = mu_sigma

            # Storage
            results = {strategy: [] for strategy in strategies}  # list of tuples: (df, cum_tax, gross_leg, after_leg)
            failures = {strategy: 0 for strategy in strategies}

            for strategy in strategies:
                # Clone baseline household and set strategy for this batch
                random.seed(seed)
                hh_proto = _clone_household(hh)
                hh_proto.strategy = strategy

                for _ in range(n_sims):
                    result = _run_one_sim(
                        (mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp),
                        hh_proto, tax_cfg, custom_df
                    )
                    # Handle both old and new return signatures
                    if len(result) == 5:
                        df_i, cum_tax_i, gross_leg_i, after_leg_i, metrics_i = result
                    else:
                        df_i, cum_tax_i, gross_leg_i, after_leg_i = result
                        metrics_i = None

                    if df_i is None or (hasattr(df_i, "empty") and df_i.empty):
                        failures[strategy] += 1
                        continue
                    results[strategy].append((df_i, cum_tax_i, gross_leg_i, after_leg_i, metrics_i))

            aggregated = {}
            for strategy in strategies:
                runs = results[strategy]
                if not runs:
                    aggregated[strategy] = {
                        "success_pct": 0.0,
                        "years_funded_pct_median": 0.0,
                        "median_net_worth": 0.0,
                        "net_worth_p5": 0.0,
                        "net_worth_p95": 0.0,
                        "median_taxes": 0.0,   # in $K
                        "taxes_p5": 0.0,       # in $K
                        "taxes_p95": 0.0,      # in $K
                        "median_legacy": 0.0,
                        "legacy_p5": 0.0,
                        "legacy_p95": 0.0,
                        "failures": failures[strategy],
                    }
                    continue


                final_net_worths = [_last_safe(df_run, "net_worth_end", 0.0) for (df_run, *_rest) in runs]
                cum_taxes = [float(tax) for (_df, tax, _g, _a, *_metrics) in runs]
                after_legacies = [float(a) for (_df, _tax, _g, a, *_metrics) in runs]

                # % years funded per run
                # Use residual_vs_target_before_backstop to measure TRUE underfunding BEFORE backstop
                # CRITICAL FIX: residual_vs_target gets modified by backstop, but _before_backstop preserves original
                pct_years_funded = []
                for (df_run, *_rest) in runs:
                    # Safety check: ensure _before_backstop column exists
                    if df_run is not None and "residual_vs_target_before_backstop" not in df_run.columns:
                        if "residual_vs_target" in df_run.columns:
                            df_run["residual_vs_target_before_backstop"] = df_run["residual_vs_target"].copy()
                        else:
                            df_run["residual_vs_target_before_backstop"] = 0.0

                    residual_series = _series_safe(df_run, "residual_vs_target_before_backstop", default_value=0.0)
                    # Convert to gap amounts (abs of negative residuals = shortfalls)
                    gap_series = residual_series.apply(lambda x: abs(min(x, 0)))
                    if len(gap_series) > 0:
                        ok_frac = (gap_series <= hh.gap_tolerance).mean()
                    else:
                        ok_frac = 0.0
                    pct_years_funded.append(100.0 * ok_frac)

                # CORRECTED: Success = % of simulations that fully fund ALL years
                # (not median % of years funded, which is misleading)
                # A simulation is considered "fully funded" if 100% of years are funded (no underfunding)
                # This aligns with deterministic definition: 0 years with gap_series > gap_tolerance
                fully_funded_count = sum(1 for pct in pct_years_funded if pct >= 100.0)
                success_rate = 100.0 * fully_funded_count / len(pct_years_funded) if pct_years_funded else 0.0

                # Calculate downside risk percentiles
                years_funded_p10 = float(np.percentile(pct_years_funded, 10)) if pct_years_funded else 0.0
                years_funded_p25 = float(np.percentile(pct_years_funded, 25)) if pct_years_funded else 0.0
                years_funded_p50 = float(np.percentile(pct_years_funded, 50)) if pct_years_funded else 0.0
                years_funded_p75 = float(np.percentile(pct_years_funded, 75)) if pct_years_funded else 0.0
                years_funded_p90 = float(np.percentile(pct_years_funded, 90)) if pct_years_funded else 0.0

                # ===== Emergency Withdrawal Impact Analysis (Risk Mitigation) =====
                # Calculate impact of emergency withdrawals if enabled
                enable_emergency = st.session_state.get("enable_emergency_withdrawals", False)
                emergency_impact_metrics = {}

                if enable_emergency:
                    # Extract emergency withdrawal amounts from simulations
                    emergency_amounts = []
                    for (df_run, *_rest) in runs:
                        if df_run is not None and "total_emergency_withdrawals" in df_run.columns:
                            total_emerg = _series_safe(df_run, "total_emergency_withdrawals", default_value=0.0)
                            if len(total_emerg) > 0:
                                emergency_amounts.append(float(total_emerg.iloc[-1]))

                    if emergency_amounts:
                        emergency_impact_metrics = {
                            "emergency_avg": float(np.mean(emergency_amounts)),
                            "emergency_median": float(np.median(emergency_amounts)),
                            "emergency_max": float(np.max(emergency_amounts)),
                            "emergency_pct_with_events": 100.0 * len([e for e in emergency_amounts if e > 0]) / len(emergency_amounts),
                        }
                    else:
                        emergency_impact_metrics = {
                            "emergency_avg": 0.0,
                            "emergency_median": 0.0,
                            "emergency_max": 0.0,
                            "emergency_pct_with_events": 0.0,
                        }
                else:
                    emergency_impact_metrics = {
                        "emergency_avg": 0.0,
                        "emergency_median": 0.0,
                        "emergency_max": 0.0,
                        "emergency_pct_with_events": 0.0,
                    }

                # Calculate failure count for funding failures (not simulation crashes)
                # This is simulations that failed to fully fund all years
                failure_count = len(pct_years_funded) - fully_funded_count
                total_simulations = len(pct_years_funded)

                aggregated[strategy] = {
                    "success_pct": float(success_rate),  # % of simulations that fully fund all years
                    "failure_count": int(failure_count),  # Number of simulations that failed funding
                    "total_simulations": int(total_simulations),  # Total simulations run
                    "years_funded_pct_median": float(np.median(pct_years_funded)) if pct_years_funded else 0.0,
                    "years_funded_p10": years_funded_p10,  # Worst 10% scenario
                    "years_funded_p25": years_funded_p25,  # Worst 25% scenario
                    "years_funded_p50": years_funded_p50,  # Median scenario
                    "years_funded_p75": years_funded_p75,  # Best 25% scenario
                    "years_funded_p90": years_funded_p90,  # Best 10% scenario
                    "median_net_worth": float(np.median(final_net_worths) / 1e6),  # $M
                    "net_worth_p5": float(np.percentile(final_net_worths, 5) / 1e6),
                    "net_worth_p95": float(np.percentile(final_net_worths, 95) / 1e6),
                    "median_taxes": float(np.median(cum_taxes) / 1e3),  # $K
                    "taxes_p5": float(np.percentile(cum_taxes, 5) / 1e3),
                    "taxes_p95": float(np.percentile(cum_taxes, 95) / 1e3),
                    "median_legacy": float(np.median(after_legacies) / 1e6),  # $M
                    "legacy_p5": float(np.percentile(after_legacies, 5) / 1e6),
                    "legacy_p95": float(np.percentile(after_legacies, 95) / 1e6),
                    "failures": int(failures[strategy]),
                    **emergency_impact_metrics,  # Add emergency withdrawal metrics
                }

            # Save per-run stats for optional inspection
            aggregated["_runs"] = results
            return aggregated

        # ===== Sequence of Returns Analysis Function (Phase 2) =====
        def analyze_sequence_of_returns(mc_results, strategies):
            """
            Analyze which return sequences lead to success vs failure.
            Returns dict with metrics about dangerous sequences.
            """
            runs_store = mc_results.get("_runs", {})
            if not runs_store:
                return None

            sequence_analysis = {}

            for strategy in strategies:
                runs = runs_store.get(strategy, [])
                if not runs:
                    continue

                # Separate successful from failed runs
                failed_runs = []
                success_runs = []

                for run in runs:
                    if len(run) < 1:
                        continue

                    df_run = run[0]
                    if df_run is None:
                        failed_runs.append(run)
                        continue

                    # Check if this run fully funded (looking at residual before backstop)
                    residual_series = _series_safe(df_run, "residual_vs_target_before_backstop", default_value=0.0)
                    gap_series = residual_series.apply(lambda x: abs(min(x, 0)))

                    if len(gap_series) > 0:
                        ok_frac = (gap_series <= hh.gap_tolerance).mean()
                        if ok_frac >= 1.0:  # Fully funded
                            success_runs.append(run)
                        else:
                            failed_runs.append(run)
                    else:
                        failed_runs.append(run)

                # Extract return sequences
                def extract_return(run, year_idx):
                    """Extract the blended return from a specific year"""
                    if len(run) < 1 or run[0] is None:
                        return None
                    df = run[0]
                    if "annual_blended_return" not in df.columns:
                        return None
                    if year_idx < len(df):
                        return float(df["annual_blended_return"].iloc[year_idx])
                    return None

                # Get average early returns for both groups
                early_year_returns_failed = []
                early_year_returns_success = []

                for run in failed_runs:
                    for year_idx in range(min(3, len(run[0]) if run[0] is not None else 0)):
                        ret = extract_return(run, year_idx)
                        if ret is not None:
                            early_year_returns_failed.append(ret)

                for run in success_runs:
                    for year_idx in range(min(3, len(run[0]) if run[0] is not None else 0)):
                        ret = extract_return(run, year_idx)
                        if ret is not None:
                            early_year_returns_success.append(ret)

                # Calculate statistics
                sequence_analysis[strategy] = {
                    "failed_runs_count": len(failed_runs),
                    "success_runs_count": len(success_runs),
                    "avg_early_return_failed": float(np.mean(early_year_returns_failed)) if early_year_returns_failed else 0.0,
                    "avg_early_return_success": float(np.mean(early_year_returns_success)) if early_year_returns_success else 0.0,
                }

            return sequence_analysis

        def _apply_random_returns_to_person(p, draw_nonreg, draw_corp, draw_reg, draw_tfsa):
            """
            p: Person
            draw_*: tuple (mean_return, vol_return) already sampled into a single float
            Only touches attributes that exist on p.
            """
            # registered (rrsp/rrif)
            if hasattr(p, "yield_rrif_growth"):
                p.yield_rrif_growth = draw_reg
            if hasattr(p, "yield_rrsp_growth"):
                p.yield_rrsp_growth = draw_reg

            # TFSA
            if hasattr(p, "yield_tfsa_growth"):
                p.yield_tfsa_growth = draw_tfsa

            # Non-registered is usually split into 4 components — keep your current rescale idea
            has_any_nonreg = any(
                hasattr(p, name) for name in [
                    "yield_nonreg_interest",
                    "yield_nonreg_elig_div",
                    "yield_nonreg_nonelig_div",
                    "yield_nonreg_capg",
                ]
            )
            if has_any_nonreg:
                base_nonr = max(
                    float(getattr(p, "yield_nonreg_interest", 0.0))
                    + float(getattr(p, "yield_nonreg_elig_div", 0.0))
                    + float(getattr(p, "yield_nonreg_nonelig_div", 0.0))
                    + float(getattr(p, "yield_nonreg_capg", 0.0)),
                    1e-9,
                )
                tgt_nonr = 0.05 + draw_nonreg   # keep your 5% base idea
                scale_nonr = max(tgt_nonr / (0.05 + base_nonr), 0.0)
                if hasattr(p, "yield_nonreg_interest"):
                    p.yield_nonreg_interest *= scale_nonr
                if hasattr(p, "yield_nonreg_elig_div"):
                    p.yield_nonreg_elig_div *= scale_nonr
                if hasattr(p, "yield_nonreg_nonelig_div"):
                    p.yield_nonreg_nonelig_div *= scale_nonr
                if hasattr(p, "yield_nonreg_capg"):
                    p.yield_nonreg_capg *= scale_nonr

            # Corporate (maybe absent if no_corp)
            has_any_corp = any(
                hasattr(p, name) for name in [
                    "yield_corp_interest",
                    "yield_corp_elig_div",
                    "yield_corp_capg",
                ]
            )
            if has_any_corp:
                base_corp = max(
                    float(getattr(p, "yield_corp_interest", 0.0))
                    + float(getattr(p, "yield_corp_elig_div", 0.0))
                    + float(getattr(p, "yield_corp_capg", 0.0)),
                    1e-9,
                )
                tgt_corp = 0.05 + draw_corp
                scale_corp = max(tgt_corp / (0.05 + base_corp), 0.0)
                if hasattr(p, "yield_corp_interest"):
                    p.yield_corp_interest *= scale_corp
                if hasattr(p, "yield_corp_elig_div"):
                    p.yield_corp_elig_div *= scale_corp
                if hasattr(p, "yield_corp_capg"):
                    p.yield_corp_capg *= scale_corp

        # ====== Single-run helper ======
        def _run_one_sim(mu_sigma_tuple, hh_proto: Household, tax_cfg, custom_df):
            """
            Run one stochastic path using Gaussian annual returns (clamped) applied
            to account yield parameters. Returns:
            (df_i, cumulative_tax, gross_legacy, legacy_after_tax)
            or (None, 0, 0, 0) on failure.
            """
            mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp = mu_sigma_tuple

            def _draw(mu, vol):
                r = random.gauss(mu, vol)
                return max(min(r, 2.0), -0.99)  # clamp to avoid pathological tails

            # ===== Sequence of Returns Tracking (Risk Mitigation Phase 2) =====
            # Store annual returns for sequence analysis
            annual_returns = []

            # draws
            r_rrif = _draw(mu_rrif, vol_rrif)
            r_tfsa = _draw(mu_tfsa, vol_tfsa)
            r_nonr = _draw(mu_nonr, vol_nonr)
            r_corp = _draw(mu_corp, vol_corp)

            # Blended return: weighted average of all account returns
            # Weight by typical allocation (rough estimate)
            blended_return = (0.2 * r_rrif + 0.15 * r_tfsa + 0.45 * r_nonr + 0.2 * r_corp)
            annual_returns.append(blended_return)

            # Clone people so we don't mutate the baseline household
            p1c = _clone_person(hh_proto.p1)
            p2c = _clone_person(hh_proto.p2)

            # apply only to attrs that actually exist
            _apply_random_returns_to_person(p1c, r_nonr, r_corp, r_rrif, r_tfsa)
            _apply_random_returns_to_person(p2c, r_nonr, r_corp, r_rrif, r_tfsa)


            # Temporary household for this run
            hh_tmp = Household(
                p1=p1c, p2=p2c,
                province=hh_proto.province,
                start_year=hh_proto.start_year, end_age=hh_proto.end_age,
                spending_go_go=hh_proto.spending_go_go, go_go_end_age=hh_proto.go_go_end_age,
                spending_slow_go=hh_proto.spending_slow_go, slow_go_end_age=hh_proto.slow_go_end_age,
                spending_no_go=hh_proto.spending_no_go,
                tfsa_contribution_each=hh_proto.tfsa_contribution_each,
                income_split_rrif_fraction=hh_proto.income_split_rrif_fraction,
                strategy=hh_proto.strategy,
                hybrid_rrif_topup_per_person=hh_proto.hybrid_rrif_topup_per_person,
                spending_inflation=hh_proto.spending_inflation,
                general_inflation=hh_proto.general_inflation,
                gap_tolerance=hh_proto.gap_tolerance,
                reinvest_nonreg_dist=getattr(hh_proto, "reinvest_nonreg_dist", False),
                stop_on_fail=hh_proto.stop_on_fail,
            )

            # after constructing hh_tmp in _run_one_sim, before simulate(...)
            hydrate(
                hh_tmp,
                enable_buckets=st.session_state.get("enable_buckets", False),
                no_corp=st.session_state.get("no_corp", False),
            )

            # Run the sim; if it fails we return safe zeros and let the caller report it
            try:
                # Run simulation with TFSA backstop enabled for fair comparison with deterministic
                df_i = simulate(hh_tmp, tax_cfg, custom_df)

                if df_i is None or (hasattr(df_i, "empty") and df_i.empty):
                    return None, 0.0, 0.0, 0.0, None

                # Ensure the _before_backstop column exists in the returned dataframe
                if "residual_vs_target_before_backstop" not in df_i.columns:
                    if "residual_vs_target" in df_i.columns:
                        # Re-create it if missing
                        df_i["residual_vs_target_before_backstop"] = df_i["residual_vs_target"].copy()

                # ===== Apply Emergency Withdrawals (Risk Mitigation) =====
                # If emergency withdrawal modeling is enabled, simulate random emergencies
                enable_emergency = st.session_state.get("enable_emergency_withdrawals", False)
                if enable_emergency:
                    emergency_freq = st.session_state.get("emergency_frequency", 0.0)
                    emergency_min = st.session_state.get("_emergency_min_computed", 0)
                    emergency_max = st.session_state.get("_emergency_max_computed", 0)

                    # DEBUG: Log emergency settings
                    print(f"DEBUG: Emergency enabled. freq={emergency_freq}, min={emergency_min}, max={emergency_max}")

                    # For each year, decide if emergency occurs
                    total_emergency = 0.0
                    emergencies_triggered = 0
                    for idx in df_i.index:
                        if random.random() < emergency_freq:
                            # Emergency happens this year
                            emergency_amount = random.uniform(emergency_min, emergency_max)
                            total_emergency += emergency_amount
                            emergencies_triggered += 1

                            # DEBUG
                            print(f"DEBUG: Emergency triggered at year {idx}: ${emergency_amount:.2f}")

                            # Reduce net_worth_end by emergency amount
                            # This is the most conservative approach: emergency comes out of portfolio
                            if idx < len(df_i) - 1:
                                df_i.loc[idx, "net_worth_end"] -= emergency_amount

                                # Recalculate residual vs target for all subsequent years
                                # (since net worth is reduced, they have less to work with)
                                for sub_idx in range(idx, len(df_i)):
                                    df_i.loc[sub_idx, "residual_vs_target"] = (
                                        df_i.loc[sub_idx, "net_worth_end"] -
                                        df_i.loc[sub_idx, "spend_target_after_tax"]
                                    )

                    # Store total emergency amount for analysis
                    df_i["total_emergency_withdrawals"] = total_emergency
                    if emergencies_triggered > 0:
                        print(f"DEBUG: Total emergencies = ${total_emergency:.2f}, triggered {emergencies_triggered} times")

                # ===== Store Return Sequence for Phase 2 Analysis =====
                # Store the annual returns in the dataframe for later sequence analysis
                # This stores the blended return that was drawn at simulation start
                df_i["annual_blended_return"] = blended_return

                # Track success/failure metrics using new helper
                metrics = track_mc_simulation_failure(df_i, hh_tmp)

                ending_i = df_i.iloc[-1]

                # SAFE cumulative tax
                year_tax_series = _series_safe(df_i, "total_tax_after_split", default_value=0.0)
                cum_tax_i = float(year_tax_series.sum())

                # Unified legacy calc
                legacy_after_tax_i, gross_legacy_i, _final_tax = compute_after_tax_legacy(
                    ending_row=ending_i,
                    hh=hh_tmp,
                    tax_cfg=tax_cfg,
                )

                return df_i, cum_tax_i, gross_legacy_i, legacy_after_tax_i, metrics

            except Exception as e:
                st.warning(f"Monte Carlo run failed: {e}")
                return None, 0.0, 0.0, 0.0, None


        # ====== Controls to run (with cache-buster) ======
        cache_bust = st.checkbox("Force recompute (ignore cache)", value=False, key="mc_bust")

        # Define callback to set flag when button is clicked (before rerun happens)
        def on_mc_button_click():
            st.session_state["mc_results_exist"] = True

        run_mc = st.button("Run Monte Carlo (v1)", key="btn_mc_v1", on_click=on_mc_button_click)

        if run_mc:
            # CRITICAL: Retrieve household from session state (created by "Run Simulation" button)
            hh = st.session_state.get("hh")
            if hh is None:
                st.error("⚠️ Please click 'Run Simulation' first to create the household before running Monte Carlo.")
            else:
                mu_sigma = (
                    float(st.session_state.get("mc_mu_rrif_sims", 0.05)), float(st.session_state.get("mc_vol_rrif_sims", 0.10)),
                    float(st.session_state.get("mc_mu_tfsa_sims", 0.05)), float(st.session_state.get("mc_vol_tfsa_sims", 0.10)),
                    float(st.session_state.get("mc_mu_nonr_sims", 0.04)), float(st.session_state.get("mc_vol_nonr_sims", 0.08)),
                    float(st.session_state.get("mc_mu_corp_sims", 0.04)), float(st.session_state.get("mc_vol_corp_sims", 0.08)),
                )
                n_sims = int(st.session_state.get("mc_n_sims", 500))
                seed = int(st.session_state.get("mc_seed_sims", 42))
                strategies = st.session_state.get("mc_strategies_sims", ["Corp->RRIF->NonReg->TFSA"])

                # ===== Apply Stress Scenario (Phase 3) =====
                stress_scenario_key = st.session_state.get("mc_stress_scenario", "baseline")
                mu_sigma_adjusted = apply_stress_scenario(
                    stress_scenario_key,
                    mu_sigma[0], mu_sigma[1], mu_sigma[2], mu_sigma[3],
                    mu_sigma[4], mu_sigma[5], mu_sigma[6], mu_sigma[7]
                )

                # Run Monte Carlo
                with st.spinner("Running Monte Carlo simulations..."):
                    mc_results = run_monte_carlo(
                        hh, tax_cfg, st.session_state.get("custom_df"),
                        mu_sigma_adjusted, n_sims, strategies, seed,
                        _cache_buster=int(cache_bust)  # changes cache key when toggled
                    )
                # ====== Chart 1: Success Rate Bar Chart ======
                st.markdown("### 📊 Success Rate by Strategy")

                # Prepare success rate data
                success_data = []
                for strategy in strategies:
                    row = mc_results.get(strategy, {})
                    success_pct = float(row.get("success_pct", 0.0))
                    success_data.append({
                        "strategy": strategy,
                        "success": success_pct
                    })

                # Create bar chart with color coding
                fig_success = go.Figure()
                for item in success_data:
                    success = item["success"]
                    # Color-code based on success rate
                    if success >= 90:
                        color = "#00AA00"  # Green
                        status = "Excellent"
                    elif success >= 80:
                        color = "#44CC44"  # Light green
                        status = "Good"
                    elif success >= 75:
                        color = "#FFAA00"  # Orange
                        status = "Acceptable"
                    else:
                        color = "#FF5555"  # Red
                        status = "Risky"

                    fig_success.add_trace(go.Bar(
                        x=[item["strategy"]],
                        y=[success],
                        name=item["strategy"],
                        marker=dict(color=color),
                        text=f"{success:.1f}%<br>({status})",
                        textposition="outside",
                        hovertemplate=f"<b>{item['strategy']}</b><br>Success Rate: {success:.1f}%<extra></extra>"
                    ))

                fig_success.update_layout(
                    title="Plan Success Rate Across Strategies",
                    yaxis_title="Success Rate (%)",
                    yaxis=dict(range=[0, 105]),
                    xaxis_title="Strategy",
                    height=400,
                    showlegend=False,
                    margin=dict(l=60, r=20, t=80, b=60)
                )
                st.plotly_chart(fig_success, use_container_width=True)

                # ===== Market Stress Scenario Results (Phase 3) =====
                stress_scenario_key = st.session_state.get("mc_stress_scenario", "baseline")
                if stress_scenario_key != "baseline":
                    st.divider()
                    st.markdown("### 🌪️ Market Stress Scenario Impact")

                    scenario = STRESS_SCENARIOS[stress_scenario_key]
                    primary_strategy = strategies[0] if strategies else None

                    if primary_strategy:
                        primary_results = mc_results.get(primary_strategy, {})
                        scenario_success = primary_results.get("success_pct", 0.0)

                        # Calculate impact (simplified: compare to baseline)
                        # Note: In real implementation, would run baseline separately and compare
                        col1, col2, col3 = st.columns(3)

                        with col1:
                            st.metric(
                                "Scenario",
                                scenario['name'],
                                help=scenario['description']
                            )

                        with col2:
                            st.metric(
                                "Success Rate",
                                f"{scenario_success:.0f}%",
                                help="Plan success rate under this scenario"
                            )

                        with col3:
                            st.metric(
                                "Years Affected",
                                scenario['years_affected'],
                                help="How many years scenario impacts returns"
                            )

                        st.info(
                            f"**Scenario**: {scenario['name']}\n\n"
                            f"**Historical Parallel**: {scenario['historical_parallel']}\n\n"
                            f"**Interpretation**: {scenario['interpretation']}"
                        )

                # ===== Emergency Withdrawal Impact Card (Risk Mitigation) =====
                enable_emergency = st.session_state.get("enable_emergency_withdrawals", False)
                if enable_emergency:
                    st.divider()
                    st.markdown("### 🚨 Emergency Withdrawal Impact Analysis")

                    # Get metrics for primary strategy (first one)
                    primary_strategy = strategies[0] if strategies else None
                    if primary_strategy:
                        primary_results = mc_results.get(primary_strategy, {})
                        emergency_avg = primary_results.get("emergency_avg", 0.0)
                        emergency_median = primary_results.get("emergency_median", 0.0)
                        emergency_max = primary_results.get("emergency_max", 0.0)
                        emergency_pct = primary_results.get("emergency_pct_with_events", 0.0)

                        col1, col2, col3, col4 = st.columns(4)

                        with col1:
                            st.metric(
                                "Avg Emergency/Plan",
                                f"${emergency_avg:,.0f}",
                                help="Average total emergency withdrawals across all simulations"
                            )

                        with col2:
                            st.metric(
                                "Median Emergency",
                                f"${emergency_median:,.0f}",
                                help="Median emergency withdrawal amount across simulations"
                            )

                        with col3:
                            st.metric(
                                "Max Emergency",
                                f"${emergency_max:,.0f}",
                                help="Largest emergency withdrawal across all simulations"
                            )

                        with col4:
                            st.metric(
                                "Plans with Emergencies",
                                f"{emergency_pct:.0f}%",
                                help="Percentage of simulations that included emergency withdrawals"
                            )

                        st.caption(
                            "💡 **Interpretation**: These metrics show the impact of simulated emergency withdrawals on your plan. "
                            "If your success rate dropped significantly with emergency modeling enabled, consider increasing your emergency fund buffer."
                        )

                # ===== Sequence of Returns Analysis (Phase 2) =====
                st.divider()
                st.markdown("### 📊 Sequence of Returns Analysis (Risk Mitigation)")

                sequence_analysis = analyze_sequence_of_returns(mc_results, strategies)
                if sequence_analysis:
                    # Create comparison table
                    seq_data = []
                    for strategy, metrics in sequence_analysis.items():
                        seq_data.append({
                            "Strategy": strategy,
                            "Successful Plans": int(metrics["success_runs_count"]),
                            "Failed Plans": int(metrics["failed_runs_count"]),
                            "Avg Return (Failures, Year 1-3)": f"{metrics['avg_early_return_failed']*100:.2f}%",
                            "Avg Return (Success, Year 1-3)": f"{metrics['avg_early_return_success']*100:.2f}%",
                            "Return Gap": f"{(metrics['avg_early_return_success'] - metrics['avg_early_return_failed'])*100:.2f}%"
                        })

                    seq_df = pd.DataFrame(seq_data)
                    st.dataframe(seq_df, use_container_width=True, hide_index=True)

                    st.caption(
                        "💡 **Key Insight**: Plans that failed typically experienced significantly lower returns in years 1-3. "
                        "This demonstrates **Sequence of Returns Risk**: early market crashes have outsized impact on retirement success. "
                        "The larger the return gap between failed and successful scenarios, the more vulnerable your plan is to early downturns."
                    )

                # ====== Chart 2: Final Net Worth Distribution ======
                st.markdown("### 💰 Final Net Worth Distribution by Strategy")

                runs_store = mc_results.get("_runs", {})
                if runs_store:
                    fig_nw = go.Figure()

                    for s in strategies:
                        runs = runs_store.get(s, [])
                        if not runs:
                            continue

                        # Extract final net worth from runs (second element in tuple)
                        # Format: (scenario_data, cumulative_tax, final_net_worth)
                        final_nw = [float(r[2]) / 1e6 for r in runs if len(r) > 2]  # Convert to $M

                        if not final_nw:
                            continue

                        fig_nw.add_trace(go.Box(
                            y=final_nw,
                            name=s,
                            boxmean='sd',
                            jitter=0.3,
                            pointpos=0,
                            marker=dict(opacity=0.6, size=4),
                            hovertemplate="Net Worth: $%{y:.2f}M<extra>" + s + "</extra>"
                        ))

                    fig_nw.update_layout(
                        title="Final Net Worth Distribution (P5, Median, P95)",
                        yaxis_title="Final Net Worth ($M)",
                        xaxis_title="Strategy",
                        height=400,
                        showlegend=True,
                        margin=dict(l=60, r=20, t=80, b=60)
                    )
                    st.plotly_chart(fig_nw, use_container_width=True)
                else:
                    st.info("Run Monte Carlo first to see final net worth distribution.")

                # ====== Chart 3: Distribution Histogram ======
                st.markdown("### 📈 Distribution of Final Net Worth Outcomes")

                if runs_store:
                    fig_hist = go.Figure()

                    for s in strategies:
                        runs = runs_store.get(s, [])
                        if not runs:
                            continue

                        # Extract final net worth from runs
                        final_nw_values = []
                        for r in runs:
                            if len(r) > 2:
                                final_nw = float(r[2]) / 1e6  # Convert to $M
                                final_nw_values.append(final_nw)

                        if final_nw_values:
                            fig_hist.add_trace(go.Histogram(
                                x=final_nw_values,
                                name=s,
                                nbinsx=25,
                                opacity=0.7,
                                hovertemplate="Net Worth: $%{x:.2f}M<br>Scenarios: %{y}<extra></extra>"
                            ))

                    fig_hist.update_layout(
                        title="Distribution of Final Net Worth Across All Scenarios",
                        xaxis_title="Final Net Worth ($M)",
                        yaxis_title="Number of Scenarios",
                        barmode="overlay",
                        height=400,
                        hovermode="x unified",
                        margin=dict(l=60, r=20, t=80, b=60)
                    )
                    st.plotly_chart(fig_hist, use_container_width=True)

                    # Add interpretation guide
                    with st.expander("📖 How to interpret the histogram", expanded=False):
                        st.markdown("""
                        **What you're seeing:**
                        - Each bar represents a range of final net worth values
                        - Height shows how many simulation scenarios resulted in that range
                        - Wider spread = more uncertainty in outcomes

                        **What to look for:**
                        - **Tall peaks**: Most scenarios cluster around these values (consistent outcomes)
                        - **Flat/spread distribution**: Wide range of outcomes (higher uncertainty)
                        - **Left tail**: Worst-case scenarios (how bad could it get?)
                        - **Right tail**: Best-case scenarios (upside potential)

                        **Example interpretation:**
                        - If 300 scenarios show $1.5-1.7M final net worth = very likely outcome
                        - If only 5 scenarios show <$0.5M = tail risk (unlikely but possible)
                        - If peak is at $1.2M = typical ending wealth
                        """)
                else:
                    st.info("Run Monte Carlo first to see net worth distribution histogram.")


            # Summary section heading
            st.markdown("### 📋 Summary Analysis")

            # ====== Color-coded Success Indicator ======
            st.markdown("### 📊 Success Rate Interpretation")
            for strategy in strategies:
                row = mc_results.get(strategy, {})
                success_pct = float(row.get("success_pct", 0.0))

                # Determine color and interpretation
                if success_pct >= 90:
                    emoji = "🟢"
                    rating = "EXCELLENT"
                    color = "#00AA00"
                    recommendation = "Proceed with strong confidence. Your plan has an excellent success rate."
                elif success_pct >= 80:
                    emoji = "🟢"
                    rating = "GOOD"
                    color = "#44CC44"
                    recommendation = "Plan is solid. Monitor market conditions and review annually."
                elif success_pct >= 75:
                    emoji = "🟡"
                    rating = "ACCEPTABLE"
                    color = "#FFAA00"
                    recommendation = "Plan works in most scenarios. Consider modest adjustments (reduce spending or increase returns)."
                else:
                    emoji = "🔴"
                    rating = "RISKY"
                    color = "#FF5555"
                    recommendation = "Plan has significant vulnerability. Strongly consider major adjustments."

                # Display metric card
                col1, col2 = st.columns([2, 3])
                with col1:
                    st.metric(
                        f"{emoji} {strategy}",
                        f"{success_pct:.1f}% Success",
                        f"{rating}"
                    )
                with col2:
                    st.info(f"**{rating}**: {recommendation}")

            # ====== Summary table with explicit formatting ======
            st.subheader("📈 Summary Statistics")
            data_rows = []
            for s in strategies:
                row = mc_results.get(s, {})
                data_rows.append({
                    "Strategy": s,
                    "Full Success %": float(row.get("success_pct", 0.0)),
                    "Failure Count": int(row.get("failure_count", 0)),
                    "Years Funded P10": float(row.get("years_funded_p10", 0.0)),
                    "Years Funded P50": float(row.get("years_funded_p50", 0.0)),
                    "Years Funded P90": float(row.get("years_funded_p90", 0.0)),
                    "Median Gap ($)": float(row.get("max_gap_median", 0.0)),
                    "Gap P90 ($)": float(row.get("max_gap_p90", 0.0)),
                    "Median Net Worth ($M)": float(row.get("median_net_worth", 0.0)),
                    "Median Legacy ($M)": float(row.get("median_legacy", 0.0)),
                })
            summary_df = pd.DataFrame(data_rows)
            st.dataframe(
                summary_df.style.format({
                    "Full Success %": "{:.1f}",
                    "Failure Count": "{:d}",
                    "Years Funded P10": "{:.1f}",
                    "Years Funded P50": "{:.1f}",
                    "Years Funded P90": "{:.1f}",
                    "Median Gap ($)": "${:,.0f}",
                    "Gap P90 ($)": "${:,.0f}",
                    "Median Net Worth ($M)": "${:.2f}M",
                    "Median Legacy ($M)": "${:.2f}M",
                }),
                use_container_width=True
            )

            # ====== Failure Analysis Section ======
            st.subheader("⚠️ Failure Analysis (When Plans Don't Fully Fund)")
            for strategy in strategies:
                row = mc_results.get(strategy, {})
                success_pct = float(row.get("success_pct", 0.0))
                failure_count = int(row.get("failure_count", 0))
                total_sims = int(row.get("total_simulations", 1))
                failure_pct = 100.0 * failure_count / total_sims if total_sims > 0 else 0.0

                # Use success_pct as primary indicator (not failure_count which can be 0)
                if success_pct < 100.0:
                    year_fail_median = row.get("year_of_failure_median")
                    max_gap_median = row.get("max_gap_median", 0.0)
                    max_gap_p10 = row.get("max_gap_p10", 0.0)
                    max_gap_p90 = row.get("max_gap_p90", 0.0)

                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric(
                            f"Failed Scenarios ({strategy[:20]}...)",
                            f"{failure_count}/{total_sims}",
                            f"{failure_pct:.1f}% of sims"
                        )
                    with col2:
                        st.metric(
                            "Median Year of Failure",
                            f"{int(year_fail_median) if year_fail_median else 'N/A'}",
                            "Year when gap first occurs"
                        )
                    with col3:
                        st.metric(
                            "Median Gap Size",
                            f"${max_gap_median:,.0f}",
                            f"Range: ${max_gap_p10:,.0f} - ${max_gap_p90:,.0f}"
                        )

                    st.info(
                        f"**In {failure_pct:.1f}% of scenarios**, this strategy fails to fully fund all years. "
                        f"Failures typically occur around year {int(year_fail_median) if year_fail_median else '?'} "
                        f"with average shortfall of ${max_gap_median:,.0f}."
                    )
                else:
                    st.success(f"✅ **{strategy}** successfully funded all years in all {total_sims} simulations!")

            # ====== Explanation of metrics ======
            st.markdown("### 📚 How to Interpret These Metrics")
            st.markdown("""
**⚠️ IMPORTANT: This Monte Carlo Tests Your ACTUAL Planned Strategy (No Emergency Backup)**

This revised Monte Carlo simulation tests whether your planned withdrawal strategy can sustain your retirement without using emergency TFSA reserves. This is a more realistic test than the old version.

---

**📊 Key Metrics Explained:**

**Full Success %**
= Percentage of simulations where the plan funds **all retirement years** using only your planned withdrawal strategy
- **What it means**: How often does your actual plan work?
- **Better interpretation**: This shows realistic probability of plan success
- **NOT included**: Emergency TFSA drawdowns that might mask underfunding

**Failure Count & %**
= Number of simulations where at least one year has an underfunding gap
- **What it means**: How vulnerable is your plan to market downturns?
- **If > 10%**: Consider adjustments to spending or strategy
- **If < 5%**: Your plan is quite robust

**Years Funded (P10, P50, P90)**
= In different market scenarios, what % of retirement years are fully funded?
- **P10 (Worst 10%)**: Worst-case market scenario - how many years work?
- **P50 (Median)**: Typical market scenario - what's the baseline?
- **P90 (Best 10%)**: Best-case market scenario - how great can it get?

**Median/Range of Shortfalls**
= If your plan fails, how big is the gap?
- **Median Gap**: Typical underfunding amount
- **Range (P10-P90)**: Worst to best shortfall scenarios
- **Helps you understand**: Not just IF it fails, but HOW BAD it is

**Net Worth & Legacy**
= Ending account balances across all scenarios
- **Median**: Most likely ending wealth
- **Percentiles**: Best and worst case legacies

---

**🎯 Decision Guide:**

| Success % | Rating | Recommendation |
|-----------|--------|---|
| **≥ 90%** | EXCELLENT | Proceed with confidence |
| **80-90%** | GOOD | Plan is solid, monitor annually |
| **70-80%** | ACCEPTABLE | Plan works but sensitive to markets - monitor closely |
| **50-70%** | RISKY | Plan frequently fails - consider significant adjustments |
| **< 50%** | VERY RISKY | Major adjustments needed (spend less, work longer, or increase savings) |

---

**💡 How to Use This Information:**

1. **If Success < 50%**: Your plan is underfunded in baseline scenarios. This aligns with deterministic analysis showing gaps.
2. **If Success 50-80%**: Plan is sensitive to market returns. Consider modest adjustments.
3. **If Success > 85%**: Your plan is quite robust across market scenarios.
4. **Compare percentiles**: If P50 is good but P10 is bad, your plan is market-sensitive.
5. **Look at failure timing**: If failures occur late in retirement (year 30), they're less concerning than early failures (year 5).
            """)

            # ====== Optional: quick raw-dollar sanity outputs ======
            st.markdown("#### Sanity — raw cumulative taxes (per strategy)")
            for strategy in strategies:
                runs = mc_results.get("_runs", {}).get(strategy, [])
                if not runs:
                    st.write(f"No runs captured for {strategy}")
                    continue
                # first 3 samples
                samples = [float(r[1]) for r in runs[:3]]
                st.write(f"Sample cumulative taxes for {strategy} (first 3 runs):", samples)
                all_cum = [float(r[1]) for r in runs]
                st.write(
                    f"{strategy} taxes — median / p5 / p95 (raw $):",
                    float(np.median(all_cum)),
                    float(np.percentile(all_cum, 5)),
                    float(np.percentile(all_cum, 95))
                )

        else:
            st.caption("Run a baseline simulation first, then configure and run Monte Carlo.")
        # -------------- Monte Carlo Simulation End -------------

        
        # ------------------ MONTE CARLO QUICK TESTS ------------------
        st.markdown("#### Monte Carlo — Quick Test Cases")

        _success_threshold_local = float(st.session_state.get("mc_thresh_sims", 1000.0))

        def _mc_batch(n_sims, mu_sigma, hh_proto, tax_cfg, custom_df, seed, success_threshold_val):
            random.seed(int(seed))
            results = []
            for _ in range(int(n_sims)):
                result = _run_one_sim(mu_sigma, hh_proto, tax_cfg, custom_df)
                # Handle both old and new return signatures
                if len(result) == 5:
                    df_i, cum_tax_i, gross_leg_i, leg_after_i, metrics_i = result
                else:
                    df_i, cum_tax_i, gross_leg_i, leg_after_i = result
                    metrics_i = None

                if df_i is not None and not getattr(df_i, "empty", False):
                    results.append((df_i, cum_tax_i, gross_leg_i, leg_after_i, metrics_i))

            if not results:
                return {
                    "success_pct": 0.0,
                    "final_nw_mean": 0.0, "final_nw_std": 0.0,
                    "cum_tax_median": 0.0,
                    "legacy_gross_median": 0.0,
                    "legacy_after_median": 0.0,
                }

            final_nw  = [float(r[0].iloc[-1]["net_worth_end"]) for r in results]
            cum_tax   = [float(r[1]) for r in results]
            gross_leg = [float(r[2]) for r in results]
            after_leg = [float(r[3]) for r in results]

            return {
                "success_pct": 100.0 * sum(1 for x in final_nw if x > float(success_threshold_val)) / float(len(final_nw)),
                "final_nw_mean": pd.Series(final_nw).mean(),
                "final_nw_std": pd.Series(final_nw).std(),
                "cum_tax_median": pd.Series(cum_tax).median(),
                "legacy_gross_median": pd.Series(gross_leg).median(),
                "legacy_after_median": pd.Series(after_leg).median(),
            }

        run_tests = st.button("Run Monte Carlo Test Cases", key="btn_mc_tests")

        if run_tests:
            hh_proto = hh
            N = 300
            SEED = 12345
            caseA_mu_sigma = (0.05, 0.0, 0.05, 0.0, 0.04, 0.0, 0.04, 0.0)
            A = _mc_batch(N, caseA_mu_sigma, hh_proto, tax_cfg, custom_df, SEED, _success_threshold_local)
            caseB_mu_sigma = (0.01, 0.10, 0.01, 0.10, 0.00, 0.08, 0.00, 0.08)
            B = _mc_batch(N, caseB_mu_sigma, hh_proto, tax_cfg, custom_df, SEED, _success_threshold_local)
            caseC_mu_sigma = (0.07, 0.10, 0.07, 0.10, 0.06, 0.08, 0.06, 0.08)
            C = _mc_batch(N, caseC_mu_sigma, hh_proto, tax_cfg, custom_df, SEED, _success_threshold_local)

            det_ok = A["final_nw_std"] < 1e-3
            mono_success_ok = B["success_pct"] <= C["success_pct"] + 1e-9
            mono_legacy_ok = B["legacy_after_median"] <= C["legacy_after_median"] + 1e-9

            tax_warn = (C["cum_tax_median"] + 1e-9) < 0.85 * B["cum_tax_median"]
            
            st.write("**Case A (Deterministic, vol=0)**:", A)
            st.write("**Case B (Pessimistic)**:", B)
            st.write("**Case C (Optimistic)**:", C)

            if det_ok:
                st.success("Determinism: PASS — zero-volatility case produced near-identical outcomes (std ~ 0).")
            else:
                st.error(f"Determinism: FAIL — expected std≈0, got {A['final_nw_std']:.4f}.")

            if mono_success_ok:
                st.success(f"Monotonicity (Success %): PASS — {B['success_pct']:.0f}% ≤ {C['success_pct']:.0f}%.")
            else:
                st.error(f"Monotonicity (Success %): FAIL — pessimistic {B['success_pct']:.0f}% > optimistic {C['success_pct']:.0f}%.")

            if mono_legacy_ok:
                st.success("Monotonicity (Legacy after-tax median): PASS — pessimistic ≤ optimistic.")
            else:
                st.error("Monotonicity (Legacy after-tax median): FAIL — pessimistic > optimistic.")

            if tax_warn:
                st.warning("Note: Optimistic median tax is much lower than pessimistic — verify assumptions; this can happen with TFSA-heavy paths or if income stays under thresholds.")

        # ======================= Strategy Optimizer =======================
        with st.expander("Strategy Optimizer", expanded=False):
            st.markdown("Pick a search grid, objective, and I’ll score the options.")

            # --- Persist last optimizer results across reruns so UI tweaks don't nuke them ---
            if "opt_results" not in st.session_state:
                st.session_state.opt_results = None
            if "opt_diag" not in st.session_state:
                st.session_state.opt_diag = None

            # -------------------- 1) Search Space --------------------
            # Define the canonical options ONCE (use ASCII "->" everywhere)
            STRATEGY_OPTIONS = [
                "NonReg->RRIF->Corp->TFSA",
                "RRIF->Corp->NonReg->TFSA",
                "Corp->RRIF->NonReg->TFSA",
                "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
            ]

            # What you *want* as defaults
            WANTED_DEFAULTS = [
                "Corp->RRIF->NonReg->TFSA",
                "RRIF->Corp->NonReg->TFSA",
            ]

            # Only keep defaults that actually exist in options
            SAFE_DEFAULTS = [s for s in STRATEGY_OPTIONS if s in WANTED_DEFAULTS]

            strategies_grid = st.multiselect(
                "Strategies to test",
                STRATEGY_OPTIONS,
                default=SAFE_DEFAULTS,   # <- won’t blow up if text ever changes
                key="opt_strategies",
                help="Pick which drawdown orders to evaluate."
            )

            topup_grid = st.text_input(
                "Hybrid top-up grid (comma-separated, $ per person / year)",
                value="0, 5000, 10000, 15000, 20000",
                help="Used only for Hybrid strategy rows.",
                key="opt_topups",
            )
            split_grid = st.text_input(
                "RRIF split % grid (comma-separated, 0.00–0.50)",
                value="0.00, 0.25, 0.50",
                key="opt_splits",
            )

            try:
                topup_vals = [float(x.strip()) for x in topup_grid.split(",") if x.strip() != ""]
            except Exception:
                topup_vals = [0.0]
            try:
                split_vals = [max(0.0, min(0.5, float(x.strip()))) for x in split_grid.split(",") if x.strip() != ""]
            except Exception:
                split_vals = [0.5]

            # -------------------- 2) Objective --------------------
            best_by = st.selectbox(
                "Rank by",
                [
                    "Highest Success %",
                    "Lowest Cumulative Taxes",
                    "Highest Legacy (After-Tax)",
                    "Weighted score (configure below)",
                ],
                index=0,
                key="opt_best_by",
            )
            colw1, colw2, colw3, colw4 = st.columns(4)
            with colw1:
                w_success = st.number_input("W: Success %", step=0.1, key="w_success")
            with colw2:
                w_legacy = st.number_input("W: Legacy (After-tax)", step=0.1, key="w_legacy")
            with colw3:
                w_tax = st.number_input("W: Cumulative Taxes (lower is better)", step=0.1, key="w_tax")
            with colw4:
                w_gap = st.number_input("W: Underfunded years (lower is better)", step=0.1, key="w_gap")

            # -------------------- 3) (Optional) Monte Carlo in scoring --------------------
            use_mc = st.checkbox("Include Monte Carlo in scoring", value=False,
                                help="Runs your Monte Carlo engine per candidate. Slower.")
            mc_runs = st.number_input("MC runs per candidate", min_value=100, max_value=2000, step=100, key="opt_mc_runs")
            mc_seed = st.number_input("MC seed", min_value=0, max_value=100000, step=1, key="opt_mc_seed")

            run_opt = st.button("Run Optimizer", type="primary", key="btn_run_optimizer")

            def _score_candidate(hh_proto: Household, tax_cfg, custom_df, do_mc: bool, mc_n: int, mc_seed: int):
                try:
                    hydrate(hh_proto, enable_buckets=st.session_state.get("enable_buckets", False),
                            no_corp=st.session_state.get("no_corp", False),
                            )
                    df_i = simulate(hh_proto, tax_cfg, custom_df)

                    if df_i is None or df_i.empty:
                        return {"fail_flag": True}

                    gap_tol = float(getattr(hh_proto, "gap_tolerance", 0.5))

                    # --- Success % ---
                    gap_series_full = _series_safe(df_i, "underfunded_after_tax", default_value=0.0)
                    if len(gap_series_full) > 0:
                        met = (gap_series_full <= gap_tol).mean()
                    else:
                        met = 0.0
                    success_pct = float(met * 100.0)

                    # --- Deterministic metrics ---
                    year_tax_series = _series_safe(df_i, "total_tax_after_split", default_value=0.0)
                    cum_tax = float(year_tax_series.sum())

                    ending = df_i.iloc[-1]

                    # unified estate / legacy calc
                    legacy_after_tax, legacy_gross, _est_final_tax = compute_after_tax_legacy(
                        ending_row=ending,
                        hh=hh_proto,
                        tax_cfg=tax_cfg,
                    )

                    # Funding stress / liquidity / tax stability proxies
                    after_tax_gap = gap_series_full  # already safe Series
                    underfunded_years = int((after_tax_gap > gap_tol).sum()) if len(after_tax_gap) > 0 else 0
                    worst_gap = float(after_tax_gap.max()) if len(after_tax_gap) > 0 else 0.0
                    ending_tfsa_tot = float(
                        df_i["end_tfsa_p1"].iloc[-1] + df_i["end_tfsa_p2"].iloc[-1]
                    )

                    tax_vol = float(year_tax_series.std()) if len(year_tax_series) > 0 else 0.0
                    max_tax = float(year_tax_series.max()) if len(year_tax_series) > 0 else 0.0

                    out = {
                        "success_pct": success_pct,
                        "cum_tax": cum_tax,
                        "legacy_after_tax": legacy_after_tax,
                        "legacy_gross": legacy_gross,
                        "underfunded_years": underfunded_years,
                        "worst_gap": worst_gap,
                        "ending_tfsa_tot": ending_tfsa_tot,
                        "tax_vol": tax_vol,
                        "max_tax": max_tax,
                        "fail_flag": False,
                    }

                    # Monte Carlo enrichment (unchanged except we already fixed run_monte_carlo/_run_one_sim)
                    if do_mc:
                        mu_sigma = (
                            float(st.session_state.get("mc_mu_rrif_sims", 0.05)), float(st.session_state.get("mc_vol_rrif_sims", 0.10)),
                            float(st.session_state.get("mc_mu_tfsa_sims", 0.05)), float(st.session_state.get("mc_vol_tfsa_sims", 0.10)),
                            float(st.session_state.get("mc_mu_nonr_sims", 0.04)), float(st.session_state.get("mc_vol_nonr_sims", 0.08)),
                            float(st.session_state.get("mc_mu_corp_sims", 0.04)), float(st.session_state.get("mc_vol_corp_sims", 0.08)),
                        )

                        res = run_monte_carlo(
                            hh_proto,
                            tax_cfg,
                            custom_df,
                            mu_sigma,
                            int(mc_n),
                            1_000.0,
                            [hh_proto.strategy],
                            int(mc_seed),
                        )
                        R = res.get(hh_proto.strategy, {})

                        out.update({
                            "mc_success_pct": R.get("success_pct", 0.0),
                            "mc_median_taxes": R.get("median_taxes", 0.0) * 1e3,
                            "mc_median_legacy": R.get("median_legacy", 0.0) * 1e6,
                        })

                    return out

                except Exception as e:
                    return {"fail_flag": True, "error": str(e)}


            def _objective(row, mode, w_s, w_L, w_T, w_G):
                """Turn a row of metrics into a single score (higher=better)."""
                if mode == "Highest Success %":
                    return row["success_pct"]
                if mode == "Lowest Cumulative Taxes":
                    return -row["cum_tax"]  # negative so "min" turns into "max"
                if mode == "Highest Legacy (After-Tax)":
                    return row["legacy_after_tax"]
                # Weighted score (normalize $ to %-like scale for stability)
                return (
                    w_s * row["success_pct"]
                    + w_L * (row["legacy_after_tax"] / 1e6) * 100.0
                    - w_T * (row["cum_tax"] / 1e6) * 100.0
                    - w_G * row["underfunded_years"] * 10.0
                )

            # -------------------- Run the optimizer --------------------
            if run_opt:
                if not st.session_state.get("sim_ready"):
                    st.warning("Run a baseline simulation first so the optimizer can use your current inputs.")
                else:
                    base_hh: Household = st.session_state.hh
                    candidates = []

                    for strat in strategies_grid:
                        if str(strat).startswith("Hybrid"):
                            for topup in topup_vals:
                                for split in split_vals:

                                    hh_try = _clone_household(base_hh)
                                    hh_try.strategy = str(strat)
                                    hh_try.hybrid_rrif_topup_per_person = float(max(topup, 0.0))
                                    hh_try.income_split_rrif_fraction = float(np.clip(split, 0.0, 0.5))

                                    sc = _score_candidate(hh_try, st.session_state.tax_cfg, st.session_state.custom_df,
                                                        do_mc=use_mc, mc_n=mc_runs, mc_seed=mc_seed)
                                    if not sc.get("fail_flag", False):
                                        sc.update({"strategy": str(strat), "hybrid_topup": float(topup), "split": float(split)})
                                        sc["score"] = _objective(sc, best_by, w_success, w_legacy, w_tax, w_gap)
                                        candidates.append(sc)
                        else:
                            for split in split_vals:
                                hh_try = _clone_household(base_hh)
                                hh_try.strategy = str(strat)
                                hh_try.hybrid_rrif_topup_per_person = 0.0
                                hh_try.income_split_rrif_fraction = float(np.clip(split, 0.0, 0.5))
                                hydrate(hh_try,
                                    enable_buckets=st.session_state.get("enable_buckets",False),
                                    no_corp=st.session_state.get("no_corp", False),
                                    )

                                sc = _score_candidate(hh_try, st.session_state.tax_cfg, st.session_state.custom_df,
                                                    do_mc=use_mc, mc_n=mc_runs, mc_seed=mc_seed)
                                if not sc.get("fail_flag", False):
                                    sc.update({"strategy": str(strat), "hybrid_topup": 0.0, "split": float(split)})
                                    sc["score"] = _objective(sc, best_by, w_success, w_legacy, w_tax, w_gap)
                                    candidates.append(sc)

                    if not candidates:
                        st.error("No valid candidates were produced.")
                    else:
                        # Results table (sorted by score)
                        res_df = (
                            pd.DataFrame(candidates)
                            .sort_values("score", ascending=False)
                            .reset_index(drop=True)
                        )
                        res_df.insert(0, "rank", np.arange(1, len(res_df) + 1))

                        # Diagnostics table — re-run each candidate once to capture account usage / inflows
                        diag_rows = []
                        for _, row in res_df.iterrows():
                            hh_try = _clone_household(st.session_state.hh)
                            hh_try.strategy = row["strategy"]
                            hh_try.hybrid_rrif_topup_per_person = float(row.get("hybrid_topup", 0.0))
                            hh_try.income_split_rrif_fraction = float(row.get("split", 0.0))

                            hydrate(hh_try,
                                    enable_buckets=st.session_state.get("enable_buckets",False),
                                    no_corp=st.session_state.get("no_corp", False),
                                    )
                            dfi = simulate(hh_try, st.session_state.tax_cfg, st.session_state.get("custom_df"))

                            flows = {
                                "nonreg": float(_series_safe(dfi, "withdraw_nonreg_p1", 0.0).sum()
                                            + _series_safe(dfi, "withdraw_nonreg_p2", 0.0).sum()),
                                "rrif":   float(_series_safe(dfi, "withdraw_rrif_p1", 0.0).sum()
                                            + _series_safe(dfi, "withdraw_rrif_p2", 0.0).sum()),
                                "tfsa":   float(_series_safe(dfi, "withdraw_tfsa_p1", 0.0).sum()
                                            + _series_safe(dfi, "withdraw_tfsa_p2", 0.0).sum()),
                                "corp":   float(_series_safe(dfi, "withdraw_corp_p1", 0.0).sum()
                                            + _series_safe(dfi, "withdraw_corp_p2", 0.0).sum()),
                                "cpp":    float(_series_safe(dfi, "cpp_p1", 0.0).sum()
                                            + _series_safe(dfi, "cpp_p2", 0.0).sum()),
                                "oas":    float(_series_safe(dfi, "oas_p1", 0.0).sum()
                                            + _series_safe(dfi, "oas_p2", 0.0).sum()),
                                "nr_dist": float(_series_safe(dfi, "nr_dist_tot", 0.0).sum()),
                            }

                            diag_rows.append({
                                "strategy": row["strategy"],
                                "topup": float(row.get("hybrid_topup", 0.0)),
                                "split": float(row.get("split", 0.0)),
                                **flows
                            })
                        diag_df = pd.DataFrame(diag_rows)

                        # Persist BOTH results & diagnostics only after successfully building them
                        st.session_state.opt_results = res_df
                        st.session_state.opt_diag = diag_df

        # -------------------- Render last optimizer results (persisted) --------------------
        if st.session_state.opt_results is not None:
            res_df = st.session_state.opt_results

            # Best pick banner
            best = res_df.iloc[0]
            st.success(
                f"**Best pick:** {best['strategy']}"
                + (f" | Top-up ${best.get('hybrid_topup',0):,.0f}/person/yr"
                if str(best['strategy']).startswith("Hybrid") else "")
                + f" | Split {float(best.get('split',0.0))*100:.0f}%"
            )

            # Diagnostics (flows)
            diag_df = st.session_state.opt_diag
            if diag_df is not None and not diag_df.empty:
                st.subheader("Strategy Diagnostic — Total Flows Used")
                st.dataframe(
                    diag_df.style.format({
                        "topup": "{:,.0f}", "split": "{:.0%}",
                        "nonreg": "{:,.0f}", "rrif": "{:,.0f}", "tfsa": "{:,.0f}", "corp": "{:,.0f}",
                        "cpp": "{:,.0f}", "oas": "{:,.0f}", "nr_dist": "{:,.0f}",
                    }),
                    use_container_width=True
                )

            # --- Sort option for results ---
            st.markdown("##### View Results By:")
            sort_cols = st.columns(4)
            with sort_cols[0]:
                sort_by_best_overall = st.button("🏆 Best Overall (Weighted Score)", use_container_width=True, key="sort_overall")
            with sort_cols[1]:
                sort_by_legacy = st.button("🏛️ Best Legacy (After-Tax)", use_container_width=True, key="sort_legacy")
            with sort_cols[2]:
                sort_by_tax = st.button("💰 Best Tax Efficiency", use_container_width=True, key="sort_tax")
            with sort_cols[3]:
                sort_by_success = st.button("✅ Best Success %", use_container_width=True, key="sort_success")

            # Apply sorting based on button click
            if sort_by_legacy:
                res_df = res_df.sort_values("legacy_after_tax", ascending=False).reset_index(drop=True)
                res_df.insert(0, "rank", np.arange(1, len(res_df) + 1))
                st.session_state.opt_results = res_df  # Persist the sort
            elif sort_by_tax:
                res_df = res_df.sort_values("cum_tax", ascending=True).reset_index(drop=True)
                res_df.insert(0, "rank", np.arange(1, len(res_df) + 1))
                st.session_state.opt_results = res_df  # Persist the sort
            elif sort_by_success:
                res_df = res_df.sort_values("success_pct", ascending=False).reset_index(drop=True)
                res_df.insert(0, "rank", np.arange(1, len(res_df) + 1))
                st.session_state.opt_results = res_df  # Persist the sort
            elif sort_by_best_overall:
                res_df = res_df.sort_values("score", ascending=False).reset_index(drop=True)
                res_df.insert(0, "rank", np.arange(1, len(res_df) + 1))
                st.session_state.opt_results = res_df  # Persist the sort

            # Results table
            use_mc_cols = ("mc_median_taxes" in res_df.columns) and ("mc_median_legacy" in res_df.columns)
            show_cols = [
                "rank", "strategy", "hybrid_topup", "split",
                "success_pct", "underfunded_years",
                "cum_tax", "legacy_gross", "legacy_after_tax",
                "score"
            ] + (["mc_success_pct", "mc_median_taxes", "mc_median_legacy"] if use_mc_cols else [])

            # Ensure columns exist (defensive)
            for c in show_cols:
                if c not in res_df.columns:
                    res_df[c] = np.nan

            fmt = {
                "hybrid_topup": "{:,.0f}",
                "split": "{:.0%}",
                "success_pct": "{:.2f}",
                "mc_success_pct": "{:.2f}",
                "cum_tax": "${:,.0f}",
                "legacy_gross": "${:,.0f}",
                "legacy_after_tax": "${:,.0f}",
                "mc_median_taxes": "${:,.0f}",
                "mc_median_legacy": "${:,.0f}",
                "score": "{:,.2f}",
            }

            def _highlight_best(row):
                return ["background-color: #e8ffe8" if (row.get("rank", 0) == 1) else "" for _ in row]

            st.subheader("Optimizer Results")
            st.dataframe(
                res_df[show_cols].style.format(fmt).apply(_highlight_best, axis=1),
                use_container_width=True
            )

            st.download_button(
                "Download optimizer results (CSV)",
                res_df[show_cols].to_csv(index=False).encode("utf-8"),
                file_name="optimizer_results.csv",
                mime="text/csv"
            )

            # --- Top-N chart (doesn't re-run the optimizer) ---
            # Make sure 'score' exists and is numeric
            if "score" not in res_df.columns:
                res_df["score"] = 0.0
            res_df["score"] = pd.to_numeric(res_df["score"], errors="coerce").fillna(0.0)


            n = int(len(res_df))
            maxN = max(1, min(10, n))        # slider upper bound (1..min(10,n))
            defaultN = max(1, min(5, n))     # default within bounds

            top_n = st.slider(
                "Show top N in chart",
                min_value=1,
                max_value=maxN,
                value=defaultN,
                key="opt_topN",
                help="This slider only changes the chart view; it does not re-run the optimizer.",
            )

            chart_df = res_df.head(top_n).copy().reset_index(drop=True)

            def _row_label(r):
                strat = str(r.get("strategy", ""))
                topup = float(r.get("hybrid_topup", 0.0) or 0.0)
                split = float(r.get("split", 0.0) or 0.0)
                if strat.startswith("Hybrid"):
                    return f"{int(r.name)+1}. {strat} (Top-up ${topup:,.0f}, Split {split*100:.0f}%)"
                return f"{int(r.name)+1}. {strat} (Split {split*100:.0f}%)"

            chart_df["label"] = chart_df.apply(_row_label, axis=1)

            score_chart = (
                alt.Chart(chart_df)
                .mark_bar()
                .encode(
                    x=alt.X("score:Q", title="Score"),
                    y=alt.Y("label:N", sort="-x", title="Candidate"),
                    tooltip=[
                        alt.Tooltip("label:N", title="Candidate"),
                        alt.Tooltip("score:Q", title="Score", format=",.2f"),
                        alt.Tooltip("success_pct:Q", title="Success %", format=".2f"),
                        alt.Tooltip("cum_tax:Q", title="Cumulative Tax", format=",.0f"),
                        alt.Tooltip("legacy_after_tax:Q", title="Legacy (After-tax)", format=",.0f"),
                    ],
                )
                .properties(height=40 * min(top_n, 10), title="Top candidates by score")
            )
            st.altair_chart(score_chart, use_container_width=True)

            # Clear
            if st.button("Clear optimizer results"):
                st.session_state.opt_results = None
                st.session_state.opt_diag = None
        else:
            st.caption("Run the optimizer to see results here.")


# ------------------------------ Sidebar notes --------------------------
st.sidebar.markdown("---")
st.sidebar.subheader("What’s new in v2.2?")
st.sidebar.write("""
- Uses **session_state** so the Dashboard & Monte Carlo panels persist after clicking Run.
- **Monte Carlo (v1)** with configurable means/vols and success threshold.
- **Quick Tests** button that always shows after the first simulation.
- Strategy toggle including **Hybrid (RRIF top-up)**.
- Fixes: correct DataFrame slicing in charts, unique widget keys, stable rendering.
""")