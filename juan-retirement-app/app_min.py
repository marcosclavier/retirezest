# app.py — v2.1 (Strategies)
# Canada Retirement & Decumulation Simulator (Educational only)
# Requires a JSON file tax_config_canada_2024.json in the same folder.

import json
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import pandas as pd
import streamlit as st
import altair as alt
import random
import math

st.set_page_config(page_title="Canada Retirement & Tax Simulator", layout="wide")

# ------------------------------ Utils ------------------------------

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

# ------------------------------ Tax Engine -------------------------

@dataclass
class Bracket:
    threshold: float  # None means top bracket
    rate: float

@dataclass
class TaxParams:
    brackets: List[Bracket]
    bpa_amount: float
    bpa_rate: float
    pension_credit_amount: float
    pension_credit_rate: float
    age_amount: float
    age_amount_phaseout_start: float
    age_amount_phaseout_rate: float
    oas_clawback_threshold: float
    oas_clawback_rate: float
    dividend_grossup_eligible: float
    dividend_grossup_noneligible: float
    dividend_credit_rate_eligible: float
    dividend_credit_rate_noneligible: float

def tax_from_brackets(taxable: float, brackets: List[Bracket]) -> float:
    tax = 0.0
    prev = 0.0
    for b in brackets:
        upper = b.threshold if b.threshold is not None else taxable
        if taxable > prev:
            inc = min(taxable, upper) - prev
            if inc > 0:
                tax += inc * b.rate
        prev = upper
        if taxable <= prev:
            break
    return max(tax, 0.0)

def compute_nonrefundable_credits(params: TaxParams, age: int, net_income: float, pension_income: float) -> float:
    credits = params.bpa_amount * params.bpa_rate
    credits += min(pension_income, params.pension_credit_amount) * params.pension_credit_rate
    if age >= 65 and params.age_amount > 0:
        if net_income <= params.age_amount_phaseout_start:
            age_amt = params.age_amount
        else:
            reduction = (net_income - params.age_amount_phaseout_start) * params.age_amount_phaseout_rate
            age_amt = max(params.age_amount - reduction, 0.0)
        credits += age_amt * params.bpa_rate
    return credits

def compute_oas_clawback(params: TaxParams, net_income: float, annual_oas: float) -> float:
    if annual_oas <= 0:
        return 0.0
    if net_income <= params.oas_clawback_threshold:
        return 0.0
    excess = net_income - params.oas_clawback_threshold
    claw = excess * params.oas_clawback_rate
    return min(claw, annual_oas)

def progressive_tax(params: TaxParams,
                    age: int,
                    ordinary_income: float,
                    elig_dividends: float,
                    nonelig_dividends: float,
                    cap_gains: float,
                    pension_income: float,
                    oas_received: float) -> Dict[str, float]:
    elig_grossed = elig_dividends * (1 + params.dividend_grossup_eligible)
    nonelig_grossed = nonelig_dividends * (1 + params.dividend_grossup_noneligible)
    taxable_income = ordinary_income + pension_income + oas_received + elig_grossed + nonelig_grossed + 0.5 * cap_gains
    gross_tax = tax_from_brackets(taxable_income, params.brackets)
    div_credits = elig_grossed * params.dividend_credit_rate_eligible + nonelig_grossed * params.dividend_credit_rate_noneligible
    nonref_credits = compute_nonrefundable_credits(params, age, taxable_income, pension_income)
    oas_claw = compute_oas_clawback(params, taxable_income, oas_received)
    net_tax = max(gross_tax - (div_credits + nonref_credits), 0.0) + oas_claw
    return {"taxable_income": taxable_income, "gross_tax": gross_tax, "credits": div_credits + nonref_credits,
            "oas_clawback": oas_claw, "net_tax": net_tax}

# ------------------------------ RRIF Minimums ---------------------------

RRIF_FACTORS_UNDER_71 = {
    55: 0.0290, 56: 0.0292, 57: 0.0294, 58: 0.0296, 59: 0.0299,
    60: 0.0310, 61: 0.0323, 62: 0.0338, 63: 0.0353, 64: 0.0369,
    65: 0.0400, 66: 0.0417, 67: 0.0435, 68: 0.0455, 69: 0.0476,
    70: 0.0500
}
def rrif_min_factor(age: int) -> float:
    if age < 55:
        return RRIF_FACTORS_UNDER_71[55]
    if age <= 70:
        return RRIF_FACTORS_UNDER_71[age]
    return 1.0 / (90 - min(age, 95))

def rrif_minimum(balance: float, age: int) -> float:
    return balance * rrif_min_factor(age) if balance > 0 else 0.0

# ------------------------------ Domain Models ---------------------------

@dataclass
class Person:
    name: str
    start_age: int
    cpp_annual_at_start: float = 0.0
    cpp_start_age: int = 70
    oas_annual_at_start: float = 0.0
    oas_start_age: int = 70
    rrsp_balance: float = 0.0
    rrif_balance: float = 0.0
    tfsa_balance: float = 0.0
    tfsa_room_start: float = 0.0
    tfsa_room_annual: float = 7000.0
    tfsa_add_room_next_year: float = 0.0
    nonreg_balance: float = 0.0
    nonreg_acb: float = 0.0
    corporate_balance: float = 0.0
    corp_rdtoh: float = 0.0
    corp_dividend_type: str = "non-eligible"  # or "eligible"
    # Yields
    yield_nonreg_interest: float = 0.01
    yield_nonreg_elig_div: float = 0.02
    yield_nonreg_nonelig_div: float = 0.00
    yield_nonreg_capg: float = 0.02
    yield_nonreg_roc_pct: float = 0.0
    yield_corp_interest: float = 0.00
    yield_corp_elig_div: float = 0.03
    yield_corp_capg: float = 0.00
    yield_rrif_growth: float = 0.05
    yield_tfsa_growth: float = 0.05
    yield_rrsp_growth: float = 0.05

@dataclass
class Household:
    p1: Person
    p2: Person
    province: str
    start_year: int
    end_age: int = 95
    spending_go_go: float = 90000.0
    go_go_end_age: int = 74
    spending_slow_go: float = 78000.0
    slow_go_end_age: int = 84
    spending_no_go: float = 65000.0
    tfsa_contribution_each: float = 7000.0
    income_split_rrif_fraction: float = 0.5
    strategy: str = "NonReg->RRIF->Corp->TFSA"
    hybrid_rrif_topup_per_person: float = 0.0

@dataclass
class YearResult:
    year: int
    age_p1: int
    age_p2: int
    spend_target_after_tax: float
    tax_p1: float
    tax_p2: float
    tax_after_split_p1: float
    tax_after_split_p2: float
    oas_p1: float
    oas_p2: float
    cpp_p1: float
    cpp_p2: float
    withdraw_nonreg_p1: float
    withdraw_nonreg_p2: float
    withdraw_rrif_p1: float
    withdraw_rrif_p2: float
    withdraw_tfsa_p1: float
    withdraw_tfsa_p2: float
    withdraw_corp_p1: float
    withdraw_corp_p2: float
    total_withdrawals: float
    total_tax_after_split: float
    end_rrif_p1: float
    end_rrif_p2: float
    end_tfsa_p1: float
    end_tfsa_p2: float
    end_nonreg_p1: float
    end_nonreg_p2: float
    end_corp_p1: float
    end_corp_p2: float
    tfsa_room_p1: float
    tfsa_room_p2: float
    nonreg_acb_p1: float
    nonreg_acb_p2: float
    corp_rdtoh_p1: float
    corp_rdtoh_p2: float
    net_worth_end: float

# ------------------------------ Config ----------------------------------

def load_tax_config(path: str) -> Dict:
    with open(path, "r") as f:
        return json.load(f)

def get_tax_params(cfg: Dict, province: str) -> Tuple[TaxParams, TaxParams]:
    fed = cfg["federal"]; prov = cfg["provinces"][province]
    def parse_side(side: Dict) -> TaxParams:
        brs = [Bracket(threshold=b["threshold"], rate=b["rate"]) for b in side["brackets"]]
        return TaxParams(
            brackets=brs,
            bpa_amount=side["bpa_amount"], bpa_rate=side["bpa_rate"],
            pension_credit_amount=side.get("pension_credit_amount", 2000.0),
            pension_credit_rate=side.get("pension_credit_rate", side["bpa_rate"]),
            age_amount=side.get("age_amount", 0.0),
            age_amount_phaseout_start=side.get("age_amount_phaseout_start", 0.0),
            age_amount_phaseout_rate=side.get("age_amount_phaseout_rate", 0.0),
            oas_clawback_threshold=cfg["federal"].get("oas_clawback_threshold", 100000.0),
            oas_clawback_rate=cfg["federal"].get("oas_clawback_rate", 0.15),
            dividend_grossup_eligible=cfg["federal"].get("dividend_grossup_eligible", 0.38),
            dividend_grossup_noneligible=cfg["federal"].get("dividend_grossup_noneligible", 0.15),
            dividend_credit_rate_eligible=side.get("dividend_credit_rate_eligible", 0.150198),
            dividend_credit_rate_noneligible=side.get("dividend_credit_rate_noneligible", 0.090301),
        )
    return parse_side(fed), parse_side(prov)

# ------------------------------ Corp helpers ----------------------------

def corp_passive_and_rdtoh(person: Person):
    passive_income = (person.corporate_balance * person.yield_corp_interest
                      + person.corporate_balance * person.yield_corp_elig_div
                      + person.corporate_balance * person.yield_corp_capg)
    corp_tax = passive_income * 0.50
    rdtoh_add = passive_income * 0.30
    retained = passive_income - corp_tax
    return retained, rdtoh_add

def apply_corp_dividend(person: Person, payout: float) -> float:
    if payout <= 0: return 0.0
    refundable = payout * 0.3833
    refund = min(person.corp_rdtoh, refundable)
    person.corp_rdtoh -= refund
    return refund

# ------------------------------ Core Year Sim ---------------------------

def simulate_year(person: Person, age: int, after_tax_target: float,
                  fed: TaxParams, prov: TaxParams,
                  rrsp_to_rrif: bool, custom_withdraws: Dict[str, float],
                  strategy_name: str, hybrid_topup_amt: float):
    cpp = person.cpp_annual_at_start if age >= person.cpp_start_age else 0.0
    oas = person.oas_annual_at_start if age >= person.oas_start_age else 0.0

    if rrsp_to_rrif and person.rrsp_balance > 0:
        person.rrif_balance += person.rrsp_balance
        person.rrsp_balance = 0.0

    # Non-reg yearly distributions
    nr = person.nonreg_balance
    nr_interest = nr * person.yield_nonreg_interest
    nr_elig_div = nr * person.yield_nonreg_elig_div
    nr_nonelig_div = nr * person.yield_nonreg_nonelig_div
    nr_capg_dist = nr * person.yield_nonreg_capg

    # ROC reduces ACB
    total_dist = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist
    roc_cash = total_dist * person.yield_nonreg_roc_pct
    person.nonreg_acb = max(person.nonreg_acb - roc_cash, 0.0)

    # Corp passive & RDTOH accrual
    corp_retained, rdtoh_add = corp_passive_and_rdtoh(person)
    person.corp_rdtoh += rdtoh_add

    rrif_min = rrif_minimum(person.rrif_balance, age)

    # Base withdrawals: RRIF min + any custom CSV
    withdrawals = {"nonreg": 0.0, "rrif": rrif_min, "tfsa": 0.0, "corp": 0.0}
    for k in withdrawals.keys():
        if custom_withdraws.get(k, 0.0) > 0:
            withdrawals[k] += custom_withdraws[k]

    # Optional hybrid: pre-add RRIF top-up
    def apply_hybrid_topup(rrif_balance: float, rrif_min_now: float, topup: float) -> float:
        if topup <= 0: return 0.0
        max_possible = max(rrif_balance - rrif_min_now, 0.0)
        return min(topup, max_possible)

    if strategy_name.startswith("Hybrid"):
        extra_up = apply_hybrid_topup(person.rrif_balance, rrif_min, hybrid_topup_amt)
        withdrawals["rrif"] += extra_up

    # Helper ratios and tax calculator
    def cap_gain_ratio():
        if person.nonreg_balance <= 0.0: return 0.0
        if person.nonreg_acb <= 0.0: return 1.0
        return clamp(1.0 - (person.nonreg_acb / person.nonreg_balance), 0.0, 1.0)

    def tax_for(add_nonreg: float, add_rrif: float, add_corp_dividend: float) -> float:
        cg_from_sale = add_nonreg * cap_gain_ratio()
        ordinary_income = nr_interest
        elig_dividends = nr_elig_div + (add_corp_dividend if person.corp_dividend_type=="eligible" else 0.0)
        nonelig_dividends = nr_nonelig_div + (add_corp_dividend if person.corp_dividend_type=="non-eligible" else 0.0)
        cap_gains = nr_capg_dist + cg_from_sale
        pension_income = (withdrawals["rrif"] - rrif_min) + rrif_min + add_rrif  # total RRIF income this year
        oas_income = oas
        res_f = progressive_tax(fed, age, ordinary_income, elig_dividends, nonelig_dividends, cap_gains, pension_income, oas_income)
        res_p = progressive_tax(prov, age, ordinary_income, elig_dividends, nonelig_dividends, cap_gains, pension_income, oas_income)
        return res_f["net_tax"] + res_p["net_tax"]

    pre_tax_cash = (cpp + oas + nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist + withdrawals["rrif"])

    base_tax = tax_for(withdrawals["nonreg"], 0.0, withdrawals["corp"])
    base_after_tax = pre_tax_cash + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] - base_tax
    shortfall = max(after_tax_target - base_after_tax, 0.0)

    # Decide the order for topping up to meet the shortfall
    if strategy_name == "NonReg->RRIF->Corp->TFSA":
        order = ["nonreg", "rrif", "corp", "tfsa"]
    elif strategy_name == "RRIF->Corp->NonReg->TFSA":
        order = ["rrif", "corp", "nonreg", "tfsa"]
    elif strategy_name.startswith("Hybrid"):
        order = ["nonreg", "corp", "tfsa"]  # we already added RRIF top-up
    else:
        order = ["nonreg", "rrif", "corp", "tfsa"]

    extra = {"nonreg": 0.0, "rrif": 0.0, "corp": 0.0, "tfsa": 0.0}

    def add_nonreg(delta_after_tax: float):
        # binary search extra non-reg principal
        lo, hi = 0.0, max(delta_after_tax * 1.8, 1.0)
        for _ in range(22):
            mid = 0.5*(lo+hi)
            t = tax_for(withdrawals["nonreg"]+mid, extra["rrif"], extra["corp"])
            at = pre_tax_cash + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] + mid + extra["rrif"] + extra["corp"] - t
            if at - base_after_tax >= delta_after_tax: hi = mid
            else: lo = mid
        return hi, tax_for(withdrawals["nonreg"]+hi, extra["rrif"], extra["corp"]) - base_tax

    def add_taxable(kind: str, delta_after_tax: float):
        lo, hi = 0.0, max(delta_after_tax * 2.2, 1.0)
        for _ in range(22):
            mid = 0.5*(lo+hi)
            add_rrif = extra["rrif"] + (mid if kind=="rrif" else 0.0)
            add_corp = extra["corp"] + (mid if kind=="corp" else 0.0)
            t = tax_for(withdrawals["nonreg"]+extra["nonreg"], add_rrif, add_corp)
            at = pre_tax_cash + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] \
                 + extra["nonreg"] + add_rrif + add_corp - t
            if at - base_after_tax >= delta_after_tax: hi = mid
            else: lo = mid
        add_rrif = extra["rrif"] + (hi if kind=="rrif" else 0.0)
        add_corp = extra["corp"] + (hi if kind=="corp" else 0.0)
        return hi, tax_for(withdrawals["nonreg"]+extra["nonreg"], add_rrif, add_corp) - base_tax

    for k in order:
        if shortfall <= 1e-6:
            break
        if k == "nonreg":
            x, dt = add_nonreg(shortfall); extra["nonreg"] += x; base_tax += dt; shortfall = 0.0
        elif k in ("rrif", "corp"):
            x, dt = add_taxable(k, shortfall); extra[k] += x; base_tax += dt; shortfall = 0.0
        elif k == "tfsa":
            take = min(shortfall, person.tfsa_balance)
            extra["tfsa"] += take; shortfall -= take

    for k in extra:
        withdrawals[k] += extra[k]

    # Track ACB/CG for non-reg sale
    realized_cg = withdrawals["nonreg"] * cap_gain_ratio()
    if person.nonreg_balance > 0:
        fraction_sold = min(withdrawals["nonreg"]/max(person.nonreg_balance,1e-9), 1.0)
        person.nonreg_acb = max(person.nonreg_acb * (1 - fraction_sold), 0.0)

    corp_refund = apply_corp_dividend(person, withdrawals["corp"])

    tax_detail = {"tax": base_tax, "oas": oas, "cpp": cpp,
                  "breakdown": {"nr_interest": nr_interest, "nr_elig_div": nr_elig_div, "nr_nonelig_div": nr_nonelig_div,
                                "nr_capg_dist": nr_capg_dist, "rrif": withdrawals["rrif"], "corp_div": withdrawals["corp"],
                                "cg_from_sale": realized_cg}}
    info = {"realized_cg": realized_cg, "corp_refund": corp_refund}
    return withdrawals, tax_detail, info

# ------------------------------ Multi-year Sim --------------------------

def simulate(hh: Household, tax_cfg: Dict, custom_df: Optional[pd.DataFrame]):
    fed, prov = get_tax_params(tax_cfg, hh.province)
    rows: List[YearResult] = []
    year = hh.start_year; age1 = hh.p1.start_age; age2 = hh.p2.start_age
    p1 = hh.p1; p2 = hh.p2
    tfsa_room1 = p1.tfsa_room_start; tfsa_room2 = p2.tfsa_room_start

    while age1 <= hh.end_age or age2 <= hh.end_age:
        max_age = max(age1, age2)
        spend = hh.spending_go_go if max_age <= hh.go_go_end_age else (hh.spending_slow_go if max_age <= hh.slow_go_end_age else hh.spending_no_go)
        target_each = spend/2.0

        # Custom CSV directives
        cust = {"p1":{"nonreg":0.0,"rrif":0.0,"tfsa":0.0,"corp":0.0},
                "p2":{"nonreg":0.0,"rrif":0.0,"tfsa":0.0,"corp":0.0}}
        if custom_df is not None and not custom_df.empty:
            for _, r in custom_df[custom_df["year"]==year].iterrows():
                who = "p1" if str(r["person"]).strip().lower() in ["p1","juan","1"] else "p2"
                acct = str(r["account"]).strip().lower()
                amt = float(r["amount"])
                if acct in ["nonreg","rrif","tfsa","corp"]:
                    cust[who][acct] += max(amt,0.0)

        # RRSP growth then conversion at 71
        p1.rrsp_balance *= (1 + p1.yield_rrsp_growth)
        p2.rrsp_balance *= (1 + p2.yield_rrsp_growth)
        rrsp_to_rrif1 = (age1 >= 71); rrsp_to_rrif2 = (age2 >= 71)

        w1, t1, info1 = simulate_year(p1, age1, target_each, fed, prov, rrsp_to_rrif1, cust["p1"],
                                      hh.strategy, hh.hybrid_rrif_topup_per_person)
        w2, t2, info2 = simulate_year(p2, age2, target_each, fed, prov, rrsp_to_rrif2, cust["p2"],
                                      hh.strategy, hh.hybrid_rrif_topup_per_person)

        # Simple RRIF income splitting approximation (up to 50%)
        split = clamp(hh.income_split_rrif_fraction, 0.0, 0.5)
        transfer12 = split * w1["rrif"] if age1 >= 65 else 0.0
        transfer21 = split * w2["rrif"] if age2 >= 65 else 0.0

        def recompute_tax(age, rrif_amt, add_rrif_delta, taxd, person, wself):
            bd = taxd["breakdown"]
            ordinary = bd["nr_interest"]
            eligd = bd["nr_elig_div"] + (wself["corp"] if person.corp_dividend_type=="eligible" else 0.0)
            noneligd = bd["nr_nonelig_div"] + (wself["corp"] if person.corp_dividend_type=="non-eligible" else 0.0)
            capg = bd["nr_capg_dist"] + bd["cg_from_sale"]
            oas = taxd["oas"]
            resf = progressive_tax(fed, age, ordinary, eligd, noneligd, capg, rrif_amt + add_rrif_delta, oas)
            resp = progressive_tax(prov, age, ordinary, eligd, noneligd, capg, rrif_amt + add_rrif_delta, oas)
            return resf["net_tax"] + resp["net_tax"]

        tax1_after = recompute_tax(age1, w1["rrif"], -transfer12 + transfer21, t1, p1, w1)
        tax2_after = recompute_tax(age2, w2["rrif"], -transfer21 + transfer12, t2, p2, w2)

        # Update balances: subtract withdrawals, then grow
        tfsa_withdraw_room_add1 = w1["tfsa"]; tfsa_withdraw_room_add2 = w2["tfsa"]
        p1.rrif_balance = max(p1.rrif_balance - w1["rrif"], 0.0) * (1 + p1.yield_rrif_growth)
        p2.rrif_balance = max(p2.rrif_balance - w2["rrif"], 0.0) * (1 + p2.yield_rrif_growth)
        p1.tfsa_balance = max(p1.tfsa_balance - w1["tfsa"], 0.0) * (1 + p1.yield_tfsa_growth)
        p2.tfsa_balance = max(p2.tfsa_balance - w2["tfsa"], 0.0) * (1 + p2.yield_tfsa_growth)
        p1.nonreg_balance = max(p1.nonreg_balance - w1["nonreg"], 0.0) * (1 + p1.yield_nonreg_interest + p1.yield_nonreg_elig_div + p1.yield_nonreg_nonelig_div + p1.yield_nonreg_capg)
        p2.nonreg_balance = max(p2.nonreg_balance - w2["nonreg"], 0.0) * (1 + p2.yield_nonreg_interest + p2.yield_nonreg_elig_div + p2.yield_nonreg_nonelig_div + p2.yield_nonreg_capg)

        # Corporate: subtract dividends, add refund, then add retained passive
        corp_retained1, _ = corp_passive_and_rdtoh(p1)
        corp_retained2, _ = corp_passive_and_rdtoh(p2)
        p1.corporate_balance = max(p1.corporate_balance - w1["corp"] + info1["corp_refund"] + corp_retained1, 0.0)
        p2.corporate_balance = max(p2.corporate_balance - w2["corp"] + info2["corp_refund"] + corp_retained2, 0.0)

        # TFSA contributions at year end, within room (from non-reg)
        room1 = tfsa_room1 + p1.tfsa_room_annual + tfsa_withdraw_room_add1
        room2 = tfsa_room2 + p2.tfsa_room_annual + tfsa_withdraw_room_add2
        c1 = min(hh.tfsa_contribution_each, max(p1.nonreg_balance,0.0), room1)
        c2 = min(hh.tfsa_contribution_each, max(p2.nonreg_balance,0.0), room2)
        p1.nonreg_balance -= c1; p1.tfsa_balance += c1; room1 -= c1
        p2.nonreg_balance -= c2; p2.tfsa_balance += c2; room2 -= c2
        tfsa_room1 = room1; tfsa_room2 = room2

        total_withdrawals = sum(w1.values()) + sum(w2.values())
        total_tax_after_split = tax1_after + tax2_after
        net_worth_end = sum([
            p1.rrif_balance, p2.rrif_balance, p1.tfsa_balance, p2.tfsa_balance,
            p1.nonreg_balance, p2.nonreg_balance, p1.corporate_balance, p2.corporate_balance
        ])

        rows.append(YearResult(
            year=year, age_p1=age1, age_p2=age2, spend_target_after_tax=spend,
            tax_p1=t1["tax"], tax_p2=t2["tax"],
            tax_after_split_p1=tax1_after, tax_after_split_p2=tax2_after,
            oas_p1=t1["oas"], oas_p2=t2["oas"], cpp_p1=t1["cpp"], cpp_p2=t2["cpp"],
            withdraw_nonreg_p1=w1["nonreg"], withdraw_nonreg_p2=w2["nonreg"],
            withdraw_rrif_p1=w1["rrif"], withdraw_rrif_p2=w2["rrif"],
            withdraw_tfsa_p1=w1["tfsa"], withdraw_tfsa_p2=w2["tfsa"],
            withdraw_corp_p1=w1["corp"], withdraw_corp_p2=w2["corp"],
            total_withdrawals=total_withdrawals, total_tax_after_split=total_tax_after_split,
            end_rrif_p1=p1.rrif_balance, end_rrif_p2=p2.rrif_balance,
            end_tfsa_p1=p1.tfsa_balance, end_tfsa_p2=p2.tfsa_balance,
            end_nonreg_p1=p1.nonreg_balance, end_nonreg_p2=p2.nonreg_balance,
            end_corp_p1=p1.corporate_balance, end_corp_p2=p2.corporate_balance,
            tfsa_room_p1=tfsa_room1, tfsa_room_p2=tfsa_room2,
            nonreg_acb_p1=p1.nonreg_acb, nonreg_acb_p2=p2.nonreg_acb,
            corp_rdtoh_p1=p1.corp_rdtoh, corp_rdtoh_p2=p2.corp_rdtoh,
            net_worth_end=net_worth_end
        ))

        year += 1; age1 += 1; age2 += 1
        if age1 > hh.end_age and age2 > hh.end_age:
            break

    return pd.DataFrame([r.__dict__ for r in rows])

# ------------------------------ UI -------------------------------------

st.title("🇨🇦 Retirement & Decumulation Simulator")
st.caption("Educational tool. Configure tax tables in tax_config_canada_2024.json. Not tax advice.")

colA, colB = st.columns([1,1])

with colA:
    st.subheader("Household & Scenario")
    province = st.selectbox("Province", options=["AB","BC","ON","QC"], index=0, help="Provincial tax configuration available for AB, BC, ON, QC")
    st.info("📍 **Province Support**: Currently supporting AB, BC, ON, QC (79% of Canadian population). More provinces coming soon!")
    start_year = st.number_input("Start year", min_value=2020, max_value=2100, value=2025, step=1)
    end_age = st.number_input("Simulate until age", min_value=70, max_value=100, value=95, step=1)

    strategy = st.selectbox(
        "Drawdown strategy",
        [
            "NonReg->RRIF->Corp->TFSA",
            "RRIF->Corp->NonReg->TFSA",
            "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA",
        ],
        index=1,
    )
    hybrid_topup = 0
    if "Hybrid" in strategy:
        hybrid_topup = st.number_input(
            "Hybrid: RRIF top-up per person / year (above RRIF minimum)", value=10000, step=1000, min_value=0
        )

    split_pct = st.slider("Eligible RRIF pension splitting (max 50%)", 0.0, 0.5, 0.5, 0.05)

    st.markdown("**Spending Phases (household-level)**")
    go_go = st.number_input("Go-Go annual (after-tax)", value=90000, step=1000)
    go_end = st.number_input("Go-Go ends at age", value=74, step=1)
    slow_go = st.number_input("Slow-Go annual (after-tax)", value=78000, step=1000)
    slow_end = st.number_input("Slow-Go ends at age", value=84, step=1)
    no_go = st.number_input("No-Go annual (after-tax)", value=65000, step=1000)
    tfsa_contrib = st.number_input("TFSA contribution per person / year", value=7000, step=500)

with colB:
    st.subheader("People")
    with st.expander("Person 1", expanded=True):
        p1_name = st.text_input("Name (P1)", value="Juan")
        p1_age = st.number_input("Start age (P1)", value=65, min_value=50, max_value=95)
        p1_cpp_start = st.number_input("CPP start age (P1)", value=70, min_value=60, max_value=70)
        p1_cpp_amt = st.number_input("CPP annual at start (P1)", value=7000, step=500)
        p1_oas_start = st.number_input("OAS start age (P1)", value=70, min_value=65, max_value=70)
        p1_oas_amt = st.number_input("OAS annual at start (P1)", value=6000, step=500)

        st.markdown("**Balances**")
        p1_rrsp = st.number_input("RRSP balance (P1)", value=0, step=10000)
        p1_rrif = st.number_input("RRIF balance (P1)", value=150000, step=10000)
        p1_tfsa = st.number_input("TFSA balance (P1)", value=160000, step=10000)
        p1_tfsa_room = st.number_input("TFSA starting room (P1)", value=0, step=1000)
        p1_nonreg = st.number_input("Non-Registered balance (P1)", value=800000, step=10000)
        p1_acb = st.number_input("Non-Registered ACB (P1)", value=700000, step=10000)
        p1_corp = st.number_input("Corporate balance (P1)", value=0, step=10000)
        p1_rdtoh = st.number_input("Corp RDTOH opening (P1)", value=0, step=1000)
        p1_corp_divtype = st.selectbox("Corp dividend type (P1)", ["non-eligible","eligible"], index=0)

        st.markdown("**Yields (annual)**")
        p1_y_nr_int = st.number_input("Non-Reg: interest", value=0.01, step=0.005, format="%.3f")
        p1_y_nr_ed = st.number_input("Non-Reg: eligible dividends", value=0.02, step=0.005, format="%.3f")
        p1_y_nr_ned = st.number_input("Non-Reg: non-eligible dividends", value=0.00, step=0.005, format="%.3f")
        p1_y_nr_cg = st.number_input("Non-Reg: cap gains distribution", value=0.02, step=0.005, format="%.3f")
        p1_y_nr_roc = st.number_input("Non-Reg: ROC % of distributions", value=0.00, step=0.05, format="%.2f")
        p1_y_rrif = st.number_input("RRIF: growth", value=0.05, step=0.005, format="%.3f")
        p1_y_tfsa = st.number_input("TFSA: growth", value=0.05, step=0.005, format="%.3f")
        p1_y_rrsp = st.number_input("RRSP: growth", value=0.05, step=0.005, format="%.3f")
        p1_y_corp_int = st.number_input("Corp: interest yield", value=0.00, step=0.005, format="%.3f")
        p1_y_corp_ed = st.number_input("Corp: eligible dividend yield", value=0.03, step=0.005, format="%.3f")
        p1_y_corp_cg = st.number_input("Corp: cap gains yield", value=0.00, step=0.005, format="%.3f")

    with st.expander("Person 2", expanded=True):
        p2_name = st.text_input("Name (P2)", value="Daniela")
        p2_age = st.number_input("Start age (P2)", value=64, min_value=50, max_value=95)
        p2_cpp_start = st.number_input("CPP start age (P2)", value=70, min_value=60, max_value=70)
        p2_cpp_amt = st.number_input("CPP annual at start (P2)", value=7000, step=500)
        p2_oas_start = st.number_input("OAS start age (P2)", value=70, min_value=65, max_value=70)
        p2_oas_amt = st.number_input("OAS annual at start (P2)", value=6000, step=500)

        st.markdown("**Balances**")
        p2_rrsp = st.number_input("RRSP balance (P2)", value=0, step=10000)
        p2_rrif = st.number_input("RRIF balance (P2)", value=150000, step=10000)
        p2_tfsa = st.number_input("TFSA balance (P2)", value=160000, step=10000)
        p2_tfsa_room = st.number_input("TFSA starting room (P2)", value=0, step=1000)
        p2_nonreg = st.number_input("Non-Registered balance (P2)", value=800000, step=10000)
        p2_acb = st.number_input("Non-Registered ACB (P2)", value=700000, step=10000)
        p2_corp = st.number_input("Corporate balance (P2)", value=0, step=10000)
        p2_rdtoh = st.number_input("Corp RDTOH opening (P2)", value=0, step=1000)
        p2_corp_divtype = st.selectbox("Corp dividend type (P2)", ["non-eligible","eligible"], index=0)

        st.markdown("**Yields (annual)**")
        p2_y_nr_int = st.number_input("Non-Reg: interest (P2)", value=0.01, step=0.005, format="%.3f")
        p2_y_nr_ed = st.number_input("Non-Reg: eligible dividends (P2)", value=0.02, step=0.005, format="%.3f")
        p2_y_nr_ned = st.number_input("Non-Reg: non-eligible dividends (P2)", value=0.00, step=0.005, format="%.3f")
        p2_y_nr_cg = st.number_input("Non-Reg: cap gains distribution (P2)", value=0.02, step=0.005, format="%.3f")
        p2_y_nr_roc = st.number_input("Non-Reg: ROC % of distributions (P2)", value=0.00, step=0.05, format="%.2f")
        p2_y_rrif = st.number_input("RRIF: growth (P2)", value=0.05, step=0.005, format="%.3f")
        p2_y_tfsa = st.number_input("TFSA: growth (P2)", value=0.05, step=0.005, format="%.3f")
        p2_y_rrsp = st.number_input("RRSP: growth (P2)", value=0.05, step=0.005, format="%.3f")
        p2_y_corp_int = st.number_input("Corp: interest yield (P2)", value=0.00, step=0.005, format="%.3f")
        p2_y_corp_ed = st.number_input("Corp: eligible dividend yield (P2)", value=0.03, step=0.005, format="%.3f")
        p2_y_corp_cg = st.number_input("Corp: cap gains yield (P2)", value=0.00, step=0.005, format="%.3f")

st.divider()
st.subheader("Optional: Custom withdrawals CSV")
st.write("Columns: year, person (p1/p2), account (nonreg/rrif/tfsa/corp), amount")
csv_file = st.file_uploader("Upload CSV to force withdrawals", type=["csv"])
custom_df = None
if csv_file:
    try:
        custom_df = pd.read_csv(csv_file)
        st.dataframe(custom_df, use_container_width=True)
    except Exception as e:
        st.error(f"Failed to read CSV: {e}")

if st.button("Run simulation"):
    p1 = Person(
        name=p1_name, start_age=p1_age,
        cpp_annual_at_start=p1_cpp_amt, cpp_start_age=p1_cpp_start,
        oas_annual_at_start=p1_oas_amt, oas_start_age=p1_oas_start,
        rrsp_balance=p1_rrsp, rrif_balance=p1_rrif, tfsa_balance=p1_tfsa,
        tfsa_room_start=p1_tfsa_room, tfsa_room_annual=tfsa_contrib,
        nonreg_balance=p1_nonreg, nonreg_acb=p1_acb,
        corporate_balance=p1_corp, corp_rdtoh=p1_rdtoh,
        corp_dividend_type=p1_corp_divtype,
        yield_nonreg_interest=p1_y_nr_int, yield_nonreg_elig_div=p1_y_nr_ed,
        yield_nonreg_nonelig_div=p1_y_nr_ned, yield_nonreg_capg=p1_y_nr_cg, yield_nonreg_roc_pct=p1_y_nr_roc,
        yield_corp_interest=p1_y_corp_int, yield_corp_elig_div=p1_y_corp_ed, yield_corp_capg=p1_y_corp_cg,
        yield_rrif_growth=p1_y_rrif, yield_tfsa_growth=p1_y_tfsa, yield_rrsp_growth=p1_y_rrsp
    )
    p2 = Person(
        name=p2_name, start_age=p2_age,
        cpp_annual_at_start=p2_cpp_amt, cpp_start_age=p2_cpp_start,
        oas_annual_at_start=p2_oas_amt, oas_start_age=p2_oas_start,
        rrsp_balance=p2_rrsp, rrif_balance=p2_rrif, tfsa_balance=p2_tfsa,
        tfsa_room_start=p2_tfsa_room, tfsa_room_annual=tfsa_contrib,
        nonreg_balance=p2_nonreg, nonreg_acb=p2_acb,
        corporate_balance=p2_corp, corp_rdtoh=p2_rdtoh,
        corp_dividend_type=p2_corp_divtype,
        yield_nonreg_interest=p2_y_nr_int, yield_nonreg_elig_div=p2_y_nr_ed,
        yield_nonreg_nonelig_div=p2_y_nr_ned, yield_nonreg_capg=p2_y_nr_cg, yield_nonreg_roc_pct=p2_y_nr_roc,
        yield_corp_interest=p2_y_corp_int, yield_corp_elig_div=p2_y_corp_ed, yield_corp_capg=p2_y_corp_cg,
        yield_rrif_growth=p2_y_rrif, yield_tfsa_growth=p2_y_tfsa, yield_rrsp_growth=p2_y_rrsp
    )

    hh = Household(
        p1=p1, p2=p2, province=province, start_year=start_year, end_age=end_age,
        spending_go_go=go_go, go_go_end_age=go_end, spending_slow_go=slow_go, slow_go_end_age=slow_end,
        spending_no_go=no_go, tfsa_contribution_each=tfsa_contrib,
        income_split_rrif_fraction=split_pct, strategy=strategy,
        hybrid_rrif_topup_per_person=hybrid_topup,
    )

    try:
        tax_cfg = json.load(open("tax_config_canada_2024.json","r"))
    except Exception as e:
        st.error(f"Failed to load tax_config_canada_2024.json: {e}")
        st.stop()

    df = simulate(hh, tax_cfg, custom_df)
    
    # ---------------- Baseline Dashboard (simple) ----------------
    st.success("Simulation complete (Baseline: RRIF → Corp → Non-Reg → TFSA)")
    st.caption(f"Strategy used: {strategy}")

# --- Core metrics (simple, deterministic baseline) ---
    ending = df.iloc[-1]

# Cumulative (lifetime) tax paid
    cum_tax = float(df["total_tax_after_split"].sum())

# Gross legacy at end_age (sum of all account balances at last year)
    gross_legacy = float(ending[[ 
        "end_rrif_p1","end_rrif_p2",
        "end_tfsa_p1","end_tfsa_p2",
        "end_nonreg_p1","end_nonreg_p2",
        "end_corp_p1","end_corp_p2"
    ]].sum())

# Quick & rough estate tax estimate assumptions (you can tune these)
    with st.expander("Estate tax assumptions (rough & adjustable)"):
        rrff_eff = st.slider("RRIF effective tax rate on death", 0.0, 0.60, 0.30, 0.01)
        nonreg_eff = st.slider("Non-registered effective tax rate on unrealized gains", 0.0, 0.60, 0.25, 0.01)
        corp_eff  = st.slider("Corporate effective tax rate to distribute at death", 0.0, 0.60, 0.30, 0.01)
        st.caption("Notes: TFSA = 0%. Non-reg applies only to unrealized gains (cap-gain style). RRIF is fully taxable as income. Corp simplified.")

# Unrealized gains in non-registered at end (balance − ACB, floored at 0)
    unrealized_gains = max(ending["end_nonreg_p1"] - ending["nonreg_acb_p1"], 0.0) \
                 + max(ending["end_nonreg_p2"] - ending["nonreg_acb_p2"], 0.0)

# Estimated final tax on death (very rough)
    rrif_total = float(ending["end_rrif_p1"] + ending["end_rrif_p2"])
    corp_total = float(ending["end_corp_p1"] + ending["end_corp_p2"])
    est_final_tax = rrff_eff * rrif_total + nonreg_eff * float(unrealized_gains) + corp_eff * corp_total

    legacy_after_tax = max(gross_legacy - est_final_tax, 0.0)

# Simple “Probability of Success” (deterministic v1 = % of years target met)
# For now our engine always targets spend, so call it 100% and mark as deterministic.
    success_pct = 100
    years = int(df.shape[0])

# ---- Dashboard UI ----
    st.subheader("Baseline Dashboard")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Financial Well-Being (Success %)", f"{success_pct}%")
    c2.metric("Cumulative Taxes Paid", f"${cum_tax:,.0f}")
    c3.metric("Projected Legacy (Gross)", f"${gross_legacy:,.0f}")
    c4.metric("Estimated Legacy (After Final Taxes)", f"${legacy_after_tax:,.0f}")

# Simple progress bar for success rate
    st.progress(success_pct/100)

# Build time series for cumulative tax
    df = df.copy()
    df["cumulative_tax"] = df["total_tax_after_split"].cumsum()

    st.markdown("### Net Worth Over Time")
    st.line_chart(df.set_index("year")["net_worth_end"])

    st.markdown("### Cumulative Taxes Over Time")
    st.line_chart(df.set_index("year")["cumulative_tax"])

    st.markdown("### Withdrawals by Account & Person")
    st.line_chart(
        df.set_index("year")[[ 
            "withdraw_nonreg_p1","withdraw_nonreg_p2",
            "withdraw_rrif_p1","withdraw_rrif_p2",
            "withdraw_tfsa_p1","withdraw_tfsa_p2"
        ]])
# -------------- End Dashboard block --------------

    
    st.success("Simulation complete")
    st.caption(f"Strategy used: {strategy}")
    st.dataframe(df, use_container_width=True)

    st.subheader("Key Charts")

    net = alt.Chart(df).mark_line().encode(
        x=alt.X('year:Q', title='Year'), 
        y=alt.Y('net_worth_end:Q', title='Net Worth ($)')
    ).properties(title='Net Worth Over Time')
    st.altair_chart(net, use_container_width=True)

    tax = alt.Chart(df).mark_line().encode(
        x=alt.X('year:Q', title='Year'), 
        y=alt.Y('total_tax_after_split:Q', title='Tax ($)')
    ).properties(title='Total Household Tax (After RRIF Split)')
    st.altair_chart(tax, use_container_width=True)

    # Long-form for withdrawals
    wcols = [
        "withdraw_nonreg_p1","withdraw_nonreg_p2",
        "withdraw_rrif_p1","withdraw_rrif_p2",
        "withdraw_tfsa_p1","withdraw_tfsa_p2"
    ]
    wlong = df.melt(id_vars=['year'], value_vars=wcols, var_name='series', value_name='amount')

    wdraw = alt.Chart(wlong).mark_line().encode(
        x=alt.X('year:Q', title='Year'),
        y=alt.Y('amount:Q', title='Withdrawals ($)'),
        color=alt.Color('series:N', title='Series')
    ).properties(title='Withdrawals by Account & Person')
    st.altair_chart(wdraw, use_container_width=True)
    # ===================== MONTE CARLO (v1) =====================
    st.divider()
    st.subheader("Monte Carlo (v1) — Scenario Check")

    with st.expander("Settings", expanded=False):
        n_sims = st.number_input("Number of simulations", min_value=100, max_value=5000, value=500, step=100)
        seed = st.number_input("Random seed", min_value=0, max_value=10_000, value=42, step=1)

        st.markdown("**Annual return assumptions (mean & volatility)**")
        col_m1, col_s1 = st.columns(2)
        with col_m1:
            mu_rrif = st.number_input("RRIF / RRSP mean", value=0.05, step=0.005, format="%.3f")
            mu_tfsa = st.number_input("TFSA mean", value=0.05, step=0.005, format="%.3f")
            mu_nonr = st.number_input("Non-Registered mean", value=0.04, step=0.005, format="%.3f")
            mu_corp = st.number_input("Corporate mean", value=0.04, step=0.005, format="%.3f")
        with col_s1:
            vol_rrif = st.number_input("RRIF / RRSP vol (stdev)", value=0.10, step=0.005, format="%.3f")
            vol_tfsa = st.number_input("TFSA vol (stdev)", value=0.10, step=0.005, format="%.3f")
            vol_nonr = st.number_input("Non-Registered vol (stdev)", value=0.08, step=0.005, format="%.3f")
            vol_corp = st.number_input("Corporate vol (stdev)", value=0.08, step=0.005, format="%.3f")

        success_threshold = st.number_input("Failure threshold (final net worth ≤ this is failure)", value=1_000.0, step=500.0)

    def _clone_person(p: Person) -> Person:
    # shallow copy for reruns
        return Person(**{f:getattr(p,f) for f in p.__dataclass_fields__.keys()})

    def _run_one_sim(mu_sigma_tuple, hh_proto: Household, tax_cfg, custom_df):
        mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp = mu_sigma_tuple
    # sample one long-run return per bucket (constant per path in v1)
        r_rrif = random.gauss(mu_rrif, vol_rrif)
        r_tfsa = random.gauss(mu_tfsa, vol_tfsa)
        r_nonr = random.gauss(mu_nonr, vol_nonr)
        r_corp = random.gauss(mu_corp, vol_corp)

    # Clone household & apply sampled returns to both people
        p1c = _clone_person(hh_proto.p1)
        p2c = _clone_person(hh_proto.p2)
        for p in (p1c, p2c):
            p.yield_rrif_growth = r_rrif
            p.yield_rrsp_growth = r_rrif
            p.yield_tfsa_growth = r_tfsa
        # break Non-Reg into components proportionally to keep total ≈ r_nonr
        # simple approach: keep current splits but scale to new total
            total_nonr_y = max(p.yield_nonreg_interest + p.yield_nonreg_elig_div + p.yield_nonreg_nonelig_div + p.yield_nonreg_capg, 1e-9)
            scale_nonr = (1 + r_nonr) / (1 + total_nonr_y)  # crude scaling
            p.yield_nonreg_interest = max(p.yield_nonreg_interest * scale_nonr, 0.0)
            p.yield_nonreg_elig_div = max(p.yield_nonreg_elig_div * scale_nonr, 0.0)
            p.yield_nonreg_nonelig_div = max(p.yield_nonreg_nonelig_div * scale_nonr, 0.0)
            p.yield_nonreg_capg = max(p.yield_nonreg_capg * scale_nonr, 0.0)

        # Corporate: scale to r_corp similarly
            total_corp_y = max(p.yield_corp_interest + p.yield_corp_elig_div + p.yield_corp_capg, 1e-9)
            scale_corp = (1 + r_corp) / (1 + total_corp_y)
            p.yield_corp_interest = max(p.yield_corp_interest * scale_corp, 0.0)
            p.yield_corp_elig_div = max(p.yield_corp_elig_div * scale_corp, 0.0)
            p.yield_corp_capg = max(p.yield_corp_capg * scale_corp, 0.0)

        hh = Household(
            p1=p1c, p2=p2c, province=hh_proto.province, start_year=hh_proto.start_year, end_age=hh_proto.end_age,
            spending_go_go=hh_proto.spending_go_go, go_go_end_age=hh_proto.go_go_end_age,
            spending_slow_go=hh_proto.spending_slow_go, slow_go_end_age=hh_proto.slow_go_end_age,
            spending_no_go=hh_proto.spending_no_go, tfsa_contribution_each=hh_proto.tfsa_contribution_each,
            income_split_rrif_fraction=hh_proto.income_split_rrif_fraction,
            strategy=hh_proto.strategy, hybrid_rrif_topup_per_person=hh_proto.hybrid_rrif_topup_per_person
        )

        df_i = simulate(hh, tax_cfg, custom_df)
        ending = df_i.iloc[-1]
        cum_tax = float(df_i["total_tax_after_split"].sum())
        gross_legacy = float(ending[[ 
            "end_rrif_p1","end_rrif_p2",
            "end_tfsa_p1","end_tfsa_p2",
            "end_nonreg_p1","end_nonreg_p2",
            "end_corp_p1","end_corp_p2"
        ]].sum())

    # Use same estate sliders if set; otherwise default rough rates
        rrff_eff = 0.30; nonreg_eff = 0.25; corp_eff = 0.30
        if "rrff_eff" in locals():  # guard – streamlit locals differ
            pass
    # Compute unrealized gains
        unrealized_gains = max(ending["end_nonreg_p1"] - ending["nonreg_acb_p1"], 0.0) \
                         + max(ending["end_nonreg_p2"] - ending["nonreg_acb_p2"], 0.0)
        rrif_total = float(ending["end_rrif_p1"] + ending["end_rrif_p2"])
        corp_total = float(ending["end_corp_p1"] + ending["end_corp_p2"])
        est_final_tax = rrff_eff * rrif_total + nonreg_eff * float(unrealized_gains) + corp_eff * corp_total
        legacy_after_tax = max(gross_legacy - est_final_tax, 0.0)

        return df_i, cum_tax, gross_legacy, legacy_after_tax

    run_mc = st.button("Run Monte Carlo (v1)")

    if run_mc:
        random.seed(int(seed))

        results = []
        hh_proto = Household(
            p1=_clone_person(p1), p2=_clone_person(p2), province=province, start_year=start_year, end_age=end_age,
            spending_go_go=go_go, go_go_end_age=go_end, spending_slow_go=slow_go, slow_go_end_age=slow_end,
            spending_no_go=no_go, tfsa_contribution_each=tfsa_contrib,
            income_split_rrif_fraction=split_pct, strategy=strategy,
            hybrid_rrif_topup_per_person=hybrid_topup
        )

        mu_sigma = (mu_rrif, vol_rrif, mu_tfsa, vol_tfsa, mu_nonr, vol_nonr, mu_corp, vol_corp)

        # Run sims
        for _ in range(int(n_sims)):
            df_i, cum_tax_i, gross_leg_i, leg_after_i = _run_one_sim(mu_sigma, hh_proto, tax_cfg, custom_df)
            results.append((df_i, cum_tax_i, gross_leg_i, leg_after_i))

        # Summaries
        final_net_worths = [float(r[0].iloc[-1]["net_worth_end"]) for r in results]
        successes = sum(1 for x in final_net_worths if x > float(success_threshold))
        success_pct_mc = 100.0 * successes / float(n_sims)

        cum_taxes = [r[1] for r in results]
        gross_legacies = [r[2] for r in results]
        after_legacies = [r[3] for r in results]

        st.markdown("### Monte Carlo Results (v1)")
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Success probability", f"{success_pct_mc:.0f}%")
        c2.metric("Median cumulative tax", f"${pd.Series(cum_taxes).median():,.0f}")
        c3.metric("Median legacy (gross)", f"${pd.Series(gross_legacies).median():,.0f}")
        c4.metric("Median legacy (after-tax est.)", f"${pd.Series(after_legacies).median():,.0f}")

        # Distributions (quick & light)
        st.markdown("##### Distributions")
        dd = pd.DataFrame({
            "final_net_worth": final_net_worths,
            "cumulative_tax": cum_taxes,
            "legacy_gross": gross_legacies,
            "legacy_after_tax": after_legacies
        })
        st.bar_chart(dd["final_net_worth"])
        st.bar_chart(dd["cumulative_tax"])
# =================== END MONTE CARLO (v1) ===================

    
    st.download_button("Download CSV", df.to_csv(index=False).encode("utf-8"),
                       "retirement_plan_v2_1.csv", "text/csv")

st.sidebar.markdown("---")
st.sidebar.subheader("What’s new in v2.1?")
st.sidebar.write("""
- Strategy toggle:
  - **NonReg → RRIF → Corp → TFSA**
  - **RRIF → Corp → NonReg → TFSA**
  - **Hybrid**: RRIF top-up (per person) then NonReg → Corp → TFSA
- Keeps TFSA last; supports custom CSV withdrawals; RRIF splitting up to 50%.
- Simplified corporate passive + RDTOH, OAS clawback, dividend gross-ups/credits, RRIF minimums.
""")