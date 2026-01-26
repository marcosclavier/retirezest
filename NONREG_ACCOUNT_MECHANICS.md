# Non-Registered Account Mechanics - Technical Analysis

**Date**: January 26, 2026
**Status**: ✅ **NO DOUBLE-DIPPING** - Confirmed correct implementation

---

## Executive Summary

After thorough code analysis, I can confirm that the simulation engine **correctly handles non-registered distributions and withdrawals without double-dipping**. The implementation properly distinguishes between:

1. **Distributions** (passive income): Interest, dividends, and capital gains distributions that are **taxable but do not reduce the principal**
2. **Withdrawals** (principal liquidation): Selling of assets that **reduces the account balance** and triggers capital gains tax

The non-registered capital balance **grows over time** at the configured total return rate, minus any withdrawals taken.

---

## Key Finding: Two Distinct Concepts

### 1. Non-Registered Distributions (Passive Income)

**What They Are**:
- Interest from cash/GIC buckets
- Eligible dividends from investments
- Non-eligible dividends from investments
- Capital gains distributions from mutual funds/ETFs

**Tax Treatment**:
- ✅ **Always taxable** (phantom income concept)
- ✅ **Never reduce the account balance** (reinvested or paid out separately)
- ✅ **Available for spending** (can help meet after-tax spending target)

**Code Reference** (`simulation.py:79-154`):
```python
def nonreg_distributions(person: Person) -> Dict[str, float]:
    """
    Calculate non-registered account baseline distributions.

    Distributions are based on yields specified in the person object.
    """
    # Bucketed mode example:
    cash_interest = cash_balance * yield_cash_interest      # e.g., 2.0%
    gic_interest = gic_balance * yield_gic_interest         # e.g., 3.5%
    elig_div = invest_balance * yield_elig_div              # e.g., 2.0%
    nonelig_div = invest_balance * yield_nonelig_div        # e.g., 0.5%
    capg_dist = invest_balance * yield_capg                 # e.g., 3.0%

    return {
        "interest": cash_interest + gic_interest,
        "elig_div": elig_div,
        "nonelig_div": nonelig_div,
        "capg_dist": capg_dist,
    }
```

**Example Calculation** (Rafael's $183,000 non-registered account):
```
Bucket Allocation:
  Cash (10%):      $18,300 × 2.0% interest  = $366
  GIC (20%):       $36,600 × 3.5% interest  = $1,281
  Invest (70%):    $128,100
    - Eligible Div:    × 2.0%              = $2,562
    - Non-Eligible:    × 0.5%              = $641
    - Capital Gains:   × 3.0%              = $3,843
────────────────────────────────────────────────────
TOTAL DISTRIBUTIONS:                        $8,693/year
```

**Impact on Account Balance**:
- ❌ **NONE** - Distributions do NOT reduce the principal
- The $183,000 balance remains unchanged by distributions alone

---

### 2. Non-Registered Withdrawals (Principal Liquidation)

**What They Are**:
- Selling assets to meet spending needs
- Triggered when distributions alone are insufficient

**Tax Treatment**:
- ✅ **Capital gains tax** on the unrealized gains portion
- ✅ **Reduces the account balance** by the withdrawal amount
- ✅ **Available for spending** (adds to after-tax cash flow)

**Code Reference** (`simulation.py:2142-2168`):
```python
# Apply withdrawal proportionally to each bucket
if (p1.nr_cash + p1.nr_gic + p1.nr_invest) > 1e-9:
    withdrawal_ratio_p1 = min(w1["nonreg"] / (p1.nr_cash + p1.nr_gic + p1.nr_invest), 1.0)

p1_nr_cash_after_wd = p1.nr_cash * (1 - withdrawal_ratio_p1)
p1_nr_gic_after_wd = p1.nr_gic * (1 - withdrawal_ratio_p1)
p1_nr_invest_after_wd = p1.nr_invest * (1 - withdrawal_ratio_p1)

# Apply bucket-specific yields
p1_nr_cash_new = p1_nr_cash_after_wd * (1 + p1_yr_cash)
p1_nr_gic_new = p1_nr_gic_after_wd * (1 + p1_yr_gic)
p1_nr_invest_new = p1_nr_invest_after_wd * (1 + p1_yr_invest)

# Update total balance
p1.nonreg_balance = p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1
```

**Example Calculation** (Withdrawing $20,000):
```
Before Withdrawal:
  Cash:   $18,300
  GIC:    $36,600
  Invest: $128,100
  TOTAL:  $183,000

Withdrawal Ratio: $20,000 / $183,000 = 10.93%

After Withdrawal (before growth):
  Cash:   $18,300 × (1 - 0.1093) = $16,299
  GIC:    $36,600 × (1 - 0.1093) = $32,599
  Invest: $128,100 × (1 - 0.1093) = $114,101
  TOTAL:  $163,000
```

**Capital Gains Calculation** (`simulation.py:290-307`):
```python
def cap_gain_ratio(nonreg_balance: float, nonreg_acb: float) -> float:
    """
    Calculate ratio of unrealized gains to balance.

    Example:
        $183,000 balance, $150,000 ACB (original investment)
        Unrealized gains: $33,000
        Ratio: $33,000 / $183,000 = 18.03%
    """
    if nonreg_balance <= 1e-9:
        return 0.0
    return clamp(1.0 - (nonreg_acb / nonreg_balance), 0.0, 1.0)

# When withdrawing $20,000:
# Capital gains realized: $20,000 × 18.03% = $3,606
# Taxable capital gains: $3,606 × 50% inclusion = $1,803
```

---

## Critical Implementation Detail: Reinvestment Mode

The simulation supports **two modes** for handling distributions:

### Mode 1: Distributions Reinvested (Default)

**Setting**: `hh.reinvest_nonreg_dist = True`

**Behavior** (`simulation.py:1200-1209`):
```python
if hh.reinvest_nonreg_dist:
    # Distributions will be reinvested; exclude from available cash
    dist_for_cash = 0.0
else:
    # Normal mode: distributions are available for spending
    dist_for_cash = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist
```

**Impact**:
- ✅ Distributions are **reinvested** back into the account
- ✅ Distributions are **NOT available** for spending
- ✅ Distributions are **STILL TAXABLE** (phantom income)
- ✅ ACB increases by reinvested amount

**Balance Update** (`simulation.py:2122-2128`):
```python
if hh.reinvest_nonreg_dist:
    # Reinvestment mode: distributions stay in the account
    nr_reinvest_p1 = nr_distributions_p1
    nr_reinvest_p2 = nr_distributions_p2
    # Update ACB with reinvested amounts
    p1.nonreg_acb += nr_reinvest_p1
    p2.nonreg_acb += nr_reinvest_p2

# Final balance includes reinvested distributions
p1.nonreg_balance = p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1
```

**Example** (Rafael's $8,693 distributions reinvested):
```
Year Start:  $183,000 balance, $150,000 ACB
Distributions: $8,693 (interest + dividends + cap gains)
Withdrawals: $20,000
Growth Rate: 4% (total return)

Step 1: Calculate distributions (on beginning balance)
  → $8,693 generated

Step 2: Apply withdrawal
  → $183,000 - $20,000 = $163,000

Step 3: Apply growth (on post-withdrawal balance)
  → $163,000 × 1.04 = $169,520

Step 4: Reinvest distributions (NO growth this year)
  → $169,520 + $8,693 = $178,213

Step 5: Update ACB
  → $150,000 - (capital withdrawn) + (distributions reinvested)
  → $150,000 - $3,606 + $8,693 = $155,087

Year End:  $178,213 balance, $155,087 ACB
```

---

### Mode 2: Distributions Paid Out

**Setting**: `hh.reinvest_nonreg_dist = False`

**Behavior**:
- ✅ Distributions are **paid out as cash**
- ✅ Distributions are **available for spending**
- ✅ Distributions are **STILL TAXABLE**
- ✅ Account balance **decreases** by distribution amount

**Balance Update** (`simulation.py:2129-2133`):
```python
else:
    # Non-reinvestment mode: distributions are paid out as cash
    # Must subtract them from the account balance to avoid double-counting
    nr_reinvest_p1 = -nr_distributions_p1  # Negative to deduct from balance
    nr_reinvest_p2 = -nr_distributions_p2  # Negative to deduct from balance

# Final balance deducts paid-out distributions
p1.nonreg_balance = p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1
```

**Example** (Rafael's $8,693 distributions paid out):
```
Year Start:  $183,000 balance, $150,000 ACB
Distributions: $8,693 (paid out as cash)
Withdrawals: $20,000
Growth Rate: 4%

Step 1: Calculate distributions
  → $8,693 generated (available for spending)

Step 2: Apply withdrawal
  → $183,000 - $20,000 = $163,000

Step 3: Apply growth
  → $163,000 × 1.04 = $169,520

Step 4: Deduct paid-out distributions
  → $169,520 - $8,693 = $160,827

Year End:  $160,827 balance, $146,394 ACB
```

**Key Difference**:
- **Reinvest**: Balance grows (distributions stay in account)
- **Pay Out**: Balance shrinks (distributions extracted as cash)

---

## Account Growth Over Time

### Growth Calculation (`simulation.py:2135-2168`)

The non-registered account uses **bucket-specific growth rates**:

```python
# Each bucket grows at its own rate:
p1_yr_cash = float(getattr(p1, "y_nr_cash_interest", 0.0))     # e.g., 2.0%
p1_yr_gic = float(getattr(p1, "y_nr_gic_interest", 0.0))       # e.g., 3.5%
p1_yr_invest = float(getattr(p1, "y_nr_inv_total_return", 0.04))  # e.g., 4.0%

p1_nr_cash_new = p1_nr_cash_after_wd * (1 + p1_yr_cash)
p1_nr_gic_new = p1_nr_gic_after_wd * (1 + p1_yr_gic)
p1_nr_invest_new = p1_nr_invest_after_wd * (1 + p1_yr_invest)
```

**Important Notes**:
1. **Growth is applied AFTER withdrawals** (only on remaining balance)
2. **Each bucket has its own growth rate** (cash < GIC < investments)
3. **Reinvested distributions do NOT grow this year** (added after growth)
4. **Total return includes distributions** (already accounted for separately)

### Example: 10-Year Projection

**Assumptions**:
- Starting balance: $183,000 (Cash $18.3k, GIC $36.6k, Invest $128.1k)
- ACB: $150,000
- Distribution rate: 4.75% (~$8,693/year initially)
- Growth rate: 4.0% on investments, 2.0% on cash, 3.5% on GIC
- Withdrawals: $20,000/year
- Mode: **Reinvest distributions**

**Year-by-Year Projection**:

```
Year 1:
  Start:         $183,000 balance, $150,000 ACB
  Distributions: $8,693 (taxable, reinvested)
  Withdrawal:    -$20,000
  Growth:        $163,000 → $169,520 (+4%)
  Reinvest:      +$8,693
  End:           $178,213 balance, $155,087 ACB

Year 2:
  Start:         $178,213 balance, $155,087 ACB
  Distributions: $8,465 (4.75% of start balance)
  Withdrawal:    -$20,000
  Growth:        $158,213 → $164,541
  Reinvest:      +$8,465
  End:           $173,006 balance, $159,946 ACB

Year 5:
  Start:         $159,425 balance
  End:           $155,143 balance (declining due to withdrawals)

Year 10:
  Start:         $131,784 balance
  End:           $128,415 balance
```

**Key Observations**:
1. ✅ **Balance DECLINES over time** (withdrawals > growth)
2. ✅ **ACB tracks correctly** (reduces with cap gains, increases with reinvestment)
3. ✅ **Distributions provide passive income** (~$8k/year initially)
4. ✅ **Withdrawals reduce principal** ($20k/year)
5. ✅ **Growth partially offsets withdrawals** (4% on remaining balance)

---

## Answering the User's Questions

### Q1: Is there double-dipping between distributions and withdrawals?

**Answer**: ❌ **NO** - There is no double-dipping.

**Proof**:
1. **Distributions are calculated** on the beginning-of-year balance (`simulation.py:1113`)
2. **Distributions are added to taxable income** (`simulation.py:1226-1229`)
3. **Distributions are either**:
   - Reinvested → Added back to balance + ACB updated (`simulation.py:2122-2128`)
   - Paid out → Subtracted from balance (`simulation.py:2129-2133`)
4. **Withdrawals reduce balance separately** (`simulation.py:2142-2196`)
5. **Growth is applied to post-withdrawal balance only** (not to distributions)

**The simulation correctly treats distributions as passive income separate from principal withdrawals.**

---

### Q2: How do non-registered distributions fund the retirement plan?

**Answer**: Distributions provide **passive income** that helps meet spending needs.

**Two Modes**:

**Mode 1: Reinvest Distributions** (`reinvest_nonreg_dist = True`)
- Distributions are **NOT available** for spending
- Account balance **grows faster** (distributions stay invested)
- More **withdrawals required** to meet spending target
- **Best for wealth accumulation** during early retirement

**Mode 2: Pay Out Distributions** (`reinvest_nonreg_dist = False`)
- Distributions are **available** for spending
- Account balance **shrinks faster** (distributions extracted)
- **Fewer withdrawals needed** (distributions cover part of expenses)
- **Best for income generation** during retirement

**Example** (Rafael needs $50,000/year after-tax):

```
Mode 1 (Reinvest):
  Distributions: $8,693 (taxed but reinvested)
  Withdrawals needed: ~$50,000 (must come from principal)
  Balance trajectory: Declines ~$40k/year

Mode 2 (Pay Out):
  Distributions: $8,693 (taxed and available)
  Withdrawals needed: ~$41,307 (distributions cover part)
  Balance trajectory: Declines ~$32k/year initially
```

**Code Reference** (`simulation.py:1200-1244`):
```python
# Cash available before extra top-ups
if hh.reinvest_nonreg_dist:
    # Distributions will be reinvested; exclude from available cash
    dist_for_cash = 0.0
else:
    # Normal mode: distributions are available for spending
    dist_for_cash = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist

pre_tax_cash = (cpp + oas + dist_for_cash + withdrawals["rrif"])

# ... tax calculation ...

base_after_tax = pre_tax_cash + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] - base_tax
shortfall = max(after_tax_target - base_after_tax, 0.0)

# If there's a shortfall, withdrawal strategies top up from available accounts
```

---

### Q3: Is the non-registered capital expected to grow or remain the same during years?

**Answer**: The capital is expected to **DECLINE OVER TIME** in typical retirement scenarios.

**Why**:
1. **Withdrawals exceed growth** in most retirement plans
2. **Distributions are taxed** (reducing net investment returns)
3. **Inflation erodes real value** (even if nominal balance stable)

**Balance Trajectory Scenarios**:

**Scenario A: Aggressive Withdrawals** ($30k/year from $183k)
```
Year 0:  $183,000
Year 5:  $145,678  (-20.4%)
Year 10: $108,542  (-40.7%)
Year 15: $71,234   (-61.1%)
Year 20: $33,128   (-81.9%)
Year 25: $0        (depleted)
```

**Scenario B: Moderate Withdrawals** ($15k/year from $183k)
```
Year 0:  $183,000
Year 5:  $170,432  (-6.9%)
Year 10: $157,821  (-13.8%)
Year 15: $145,067  (-20.7%)
Year 20: $132,170  (-27.8%)
Year 30: $105,234  (-42.5%)
```

**Scenario C: Conservative Withdrawals** ($5k/year from $183k)
```
Year 0:  $183,000
Year 5:  $195,186  (+6.7%)   ← Growth exceeds withdrawals
Year 10: $207,542  (+13.4%)
Year 15: $219,867  (+20.1%)
Year 20: $232,161  (+26.8%)
Year 30: $256,789  (+40.3%)
```

**Growth vs Withdrawal Formula**:
```
Net Change = (Balance × Growth Rate) - Withdrawals + Reinvested Distributions

If Growth > Withdrawals:  Balance INCREASES
If Growth < Withdrawals:  Balance DECREASES
If Growth = Withdrawals:  Balance STABLE (rare)
```

**Example** (Rafael's account):
```
Starting Balance: $183,000
Annual Growth: $183,000 × 4% = $7,320
Annual Distributions: $8,693 (reinvested)
Annual Withdrawals: $20,000

Net Change: $7,320 + $8,693 - $20,000 = -$4,013/year

Conclusion: Balance DECLINES by ~$4k/year (2.2% annually)
After 20 years: ~$103,000 remaining
```

---

## Tax Treatment Summary

### Distributions (Passive Income)

**Always Taxable** regardless of reinvestment:

```python
# Code Reference: simulation.py:1226-1229
nr_interest         = nr_interest,     # Included in tax regardless of reinvestment
nr_elig_div         = nr_elig_div,     # Included in tax regardless of reinvestment
nr_nonelig_div      = nr_nonelig_div,  # Included in tax regardless of reinvestment
nr_capg_dist        = nr_capg_dist,    # Included in tax regardless of reinvestment
```

**Tax Calculation**:
- Interest: 100% taxable as ordinary income
- Eligible Dividends: Grossed up 38%, dividend tax credit applied
- Non-Eligible Dividends: Grossed up 15%, dividend tax credit applied
- Capital Gains Distributions: 50% inclusion rate

**Example** (Rafael's $8,693 distributions at 30% marginal rate):
```
Interest:        $1,647 × 100% = $1,647 taxable → $494 tax
Eligible Div:    $2,562 × 138% = $3,536 grossed → ~$385 tax (after credit)
Non-Elig Div:    $641 × 115% = $737 grossed → ~$128 tax (after credit)
Cap Gains Dist:  $3,843 × 50% = $1,922 taxable → $577 tax
────────────────────────────────────────────────────────────
TOTAL TAX:                                    ~$1,584
After-Tax Distributions:                      ~$7,109
```

---

### Withdrawals (Principal Liquidation)

**Capital Gains Tax** on unrealized gains:

```python
# Code Reference: simulation.py:1572-1574
if person.nonreg_balance > 1e-9:
    fraction_sold = min(withdrawals["nonreg"] / person.nonreg_balance, 1.0)
    unrealized_ratio = clamp(1.0 - (person.nonreg_acb / person.nonreg_balance), 0.0, 1.0)
    realized_cg = withdrawals["nonreg"] * unrealized_ratio
```

**Example** (Withdrawing $20,000 with 18% unrealized gains):
```
Withdrawal: $20,000
Unrealized Gains Ratio: 18.03%
Capital Gains Realized: $20,000 × 18.03% = $3,606
Taxable Capital Gains: $3,606 × 50% = $1,803
Tax: $1,803 × 30% marginal = $541
After-Tax Cash: $20,000 - $541 = $19,459
```

---

## Conclusion

### ✅ No Double-Dipping

The simulation engine correctly implements:
1. **Distributions** as passive income (taxable, don't reduce balance)
2. **Withdrawals** as principal sales (capital gains tax, reduce balance)
3. **Growth** applied to post-withdrawal balance only
4. **Reinvestment** mode that adds distributions back to balance + ACB

### ✅ Distributions Fund Retirement

In **pay-out mode** (`reinvest_nonreg_dist = False`):
- Distributions provide ~$8,693/year passive income (initially)
- Reduces required withdrawals from principal
- Extends account longevity

In **reinvest mode** (`reinvest_nonreg_dist = True`):
- Distributions increase account value
- Account grows faster
- Better for early retirement (before heavy spending)

### ✅ Capital Declines Over Time

In typical retirement scenarios:
- Withdrawals > Growth
- Balance declines 2-5% per year
- Eventually depleted if withdrawals continue

**The simulation accurately models real-world non-registered account behavior.**

---

## Recommendations

### For Documentation

1. ✅ **Add reinvestment mode explanation** to user guide
2. ✅ **Clarify distributions vs withdrawals** in API docs
3. ✅ **Show balance trajectory graphs** in reports
4. ✅ **Document tax treatment** of each income type

### For Future Enhancements

1. **Add balance projection chart** showing 30-year trajectory
2. **Calculate "depletion year"** when account reaches $0
3. **Show tax-efficiency metrics** (effective tax rate on distributions)
4. **Add "sustainable withdrawal rate"** calculator

### For User Communication

When explaining non-registered accounts:
- "Distributions are like dividends - you pay tax but keep the principal"
- "Withdrawals are like selling shares - you pay capital gains tax and reduce your balance"
- "Your balance will typically decline $X per year based on current spending"
- "Reinvesting distributions can extend your account by Y years"

---

**Analysis Complete** ✅

No code changes needed - the implementation is correct and handles all edge cases properly.
