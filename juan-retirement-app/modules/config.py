"""
Configuration management for Canada Retirement & Tax Simulator.

This module handles loading tax configuration from JSON and providing
tax parameters for federal and provincial jurisdictions, with inflation indexing.
"""

import json
from pathlib import Path
from typing import Dict, Tuple
from modules.models import TaxParams, Bracket


def load_tax_config(filename: str) -> dict:
    """
    Load tax configuration from JSON file.

    Args:
        filename: Path to tax_config_canada_*.json

    Returns:
        Dict with keys 'federal' and 'provinces'

    Raises:
        FileNotFoundError: If config file doesn't exist
        json.JSONDecodeError: If file is not valid JSON
    """
    path = Path(filename)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {filename}")

    with open(path, 'r') as f:
        cfg = json.load(f)

    # Validate structure
    if "federal" not in cfg or "provinces" not in cfg:
        raise KeyError("Config must contain 'federal' and 'provinces' keys")

    return cfg


def get_tax_params(cfg: Dict, province: str) -> Tuple[TaxParams, TaxParams]:
    """
    Extract federal and provincial TaxParams for a given province.

    Args:
        cfg: Config dict from load_tax_config()
        province: Province code (AB, BC, ON, QC, etc.)

    Returns:
        Tuple of (federal_params, provincial_params)
        For unsupported provinces, provincial_params = federal_params

    Raises:
        ValueError: If cfg is None or invalid
        KeyError: If province not in config
    """
    if cfg is None:
        raise ValueError("tax_cfg is None. Load your tax configuration before running the simulation.")
    if not isinstance(cfg, dict):
        raise TypeError(f"tax_cfg must be a dict, got {type(cfg)}.")
    if "federal" not in cfg or "provinces" not in cfg:
        raise KeyError("tax_cfg must contain 'federal' and 'provinces' keys.")
    if province not in cfg["provinces"]:
        raise KeyError(f"Province '{province}' not found in tax_cfg['provinces'].")

    fed_cfg = cfg["federal"]
    prov_cfg = cfg["provinces"][province]

    def parse_side(side: Dict, is_federal: bool) -> TaxParams:
        """Parse a federal or provincial config dict into TaxParams."""
        brackets = [
            Bracket(threshold=b["threshold"], rate=b["rate"])
            for b in side.get("brackets", [])
        ]

        # GIS config is federal-only (loaded from top-level config)
        gis_config = cfg.get("gis", {}) if is_federal else {}

        return TaxParams(
            brackets=brackets,
            bpa_amount=side.get("bpa_amount", 15000.0),
            bpa_rate=side.get("bpa_rate", 0.15),
            pension_credit_amount=side.get("pension_credit_amount", 2000.0),
            pension_credit_rate=side.get("pension_credit_rate", side.get("bpa_rate", 0.15)),
            age_amount=side.get("age_amount", 0.0),
            age_amount_phaseout_start=side.get("age_amount_phaseout_start", 0.0),
            age_amount_phaseout_rate=side.get("age_amount_phaseout_rate", 0.0),
            # OAS clawback is federal-only
            oas_clawback_threshold=fed_cfg.get("oas_clawback_threshold", 1e12) if is_federal else 1e12,
            oas_clawback_rate=fed_cfg.get("oas_clawback_rate", 0.15) if is_federal else 0.0,
            dividend_grossup_eligible=fed_cfg.get("dividend_grossup_eligible", 0.38),
            dividend_grossup_noneligible=fed_cfg.get("dividend_grossup_noneligible", 0.15),
            dividend_credit_rate_eligible=side.get("dividend_credit_rate_eligible", 0.150198),
            dividend_credit_rate_noneligible=side.get("dividend_credit_rate_noneligible", 0.090301),
            gis_config=gis_config,
        )

    fed_params = parse_side(fed_cfg, is_federal=True)
    prov_params = parse_side(prov_cfg, is_federal=False)

    return fed_params, prov_params


def index_tax_params(
    base: TaxParams,
    years_since_start: int,
    rate: float = 0.02,
) -> TaxParams:
    """
    Index tax brackets and credits for inflation.

    Example: If base bracket is $50,000 and rate=0.02, after 2 years
    it becomes $50,000 * 1.02^2 ≈ $52,020.

    Args:
        base: TaxParams to inflate
        years_since_start: Number of years to inflate
        rate: Annual inflation rate (default 2%)

    Returns:
        New TaxParams with inflated brackets and credits
    """
    if years_since_start <= 0 or rate == 0.0:
        return base

    inflation_factor = (1.0 + rate) ** years_since_start

    # Inflate brackets (rates stay the same)
    # Note: Top bracket has threshold=None, which should remain None
    indexed_brackets = [
        Bracket(
            threshold=b.threshold * inflation_factor if b.threshold is not None else None,
            rate=b.rate
        )
        for b in base.brackets
    ]

    # Inflate credit amounts and thresholds (rates/percentages stay the same)
    # GIS thresholds are indexed annually by CRA
    indexed_gis_config = {}
    if base.gis_config:
        indexed_gis_config = {
            "threshold_single": base.gis_config.get("threshold_single", 22272) * inflation_factor,
            "threshold_couple": base.gis_config.get("threshold_couple", 29424) * inflation_factor,
            "threshold_couple_one_oas": base.gis_config.get("threshold_couple_one_oas", 53808) * inflation_factor,
            "threshold_couple_no_oas": base.gis_config.get("threshold_couple_no_oas", 53808) * inflation_factor,
            "max_benefit_single": base.gis_config.get("max_benefit_single", 11628.84) * inflation_factor,
            "max_benefit_couple": base.gis_config.get("max_benefit_couple", 6814.20) * inflation_factor,
            "clawback_rate": base.gis_config.get("clawback_rate", 0.50),
            "employment_exemption_1": base.gis_config.get("employment_exemption_1", 5000.0),  # Not indexed
            "employment_exemption_2_rate": base.gis_config.get("employment_exemption_2_rate", 0.50),  # Not indexed
        }
        if "notes" in base.gis_config:
            indexed_gis_config["notes"] = base.gis_config["notes"]

    return TaxParams(
        brackets=indexed_brackets,
        bpa_amount=base.bpa_amount * inflation_factor,
        bpa_rate=base.bpa_rate,
        pension_credit_amount=base.pension_credit_amount,  # Not indexed
        pension_credit_rate=base.pension_credit_rate,
        age_amount=base.age_amount * inflation_factor,
        age_amount_phaseout_start=base.age_amount_phaseout_start * inflation_factor,
        age_amount_phaseout_rate=base.age_amount_phaseout_rate,
        oas_clawback_threshold=base.oas_clawback_threshold * inflation_factor,
        oas_clawback_rate=base.oas_clawback_rate,
        dividend_grossup_eligible=base.dividend_grossup_eligible,
        dividend_grossup_noneligible=base.dividend_grossup_noneligible,
        dividend_credit_rate_eligible=base.dividend_credit_rate_eligible,
        dividend_credit_rate_noneligible=base.dividend_credit_rate_noneligible,
        gis_config=indexed_gis_config,
    )
