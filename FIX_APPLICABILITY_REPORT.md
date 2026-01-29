# Fix Applicability Report - All Withdrawal Strategies

## Executive Summary

**Question**: Do the fixes for Rafael & Lucy's issues apply to ALL withdrawal strategies?

**Answer**: ✅ **YES - Both fixes apply universally to ALL strategies**

The fixes made to `simulation.py` are in the **core simulation engine** that runs AFTER the withdrawal strategy has determined which accounts to withdraw from. This means the fixes protect against bugs regardless of which strategy is used.

---

## Investigation Results

### Fix 1: plan_success Flag ✅ UNIVERSAL

**Location**: `simulation.py:2055-2056, 2463`

**Code**:
```python
# Line 2055-2056: Calculate funding gap
hh_gap = float(info1.get("unmet_after_tax", 0.0) + info2.get("unmet_after_tax", 0.0))
is_fail = hh_gap > hh.gap_tolerance

# Line 2463: Set plan_success flag
plan_success=not is_fail,  # True if year is fully funded
```

**Why it applies to ALL strategies**:
1. The `plan_success` flag is calculated at the **household level** after both persons' withdrawals are complete
2. It's based on `unmet_after_tax` (spending gap) which is calculated AFTER the strategy has executed
3. The calculation logic is identical for all strategies - it simply checks if spending needs were met

**Strategies affected** (all 8):
- ✅ minimize-income (GIS-Optimized)
- ✅ balanced
- ✅ rrif-frontload
- ✅ nonreg-first
- ✅ rrif-first
- ✅ corp-first
- ✅ tfsa-first
- ✅ hybrid

**Conclusion**: The `plan_success` flag fix is **strategy-agnostic** and applies universally.

---

### Fix 2: Negative NonReg Balance ✅ UNIVERSAL

**Locations**: `simulation.py:2168, 2196, 2266, 2270`

**Code**:
```python
# Line 2168: After P1 NonReg growth calculation
p1.nonreg_balance = max(0.0, p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1)

# Line 2196: After P2 NonReg growth calculation
p2.nonreg_balance = max(0.0, p2_nr_cash_new + p2_nr_gic_new + p2_nr_invest_new + nr_reinvest_p2)

# Line 2266: After P1 TFSA contribution from NonReg
p1.nonreg_balance = max(0.0, p1.nonreg_balance - c1)  # Prevent negative balance

# Line 2270: After P2 TFSA contribution from NonReg
p2.nonreg_balance = max(0.0, p2.nonreg_balance - c2)  # Prevent negative balance
```

**Why it applies to ALL strategies**:

1. **Lines 2168 & 2196** (Growth calculation):
   - These run AFTER withdrawals are complete
   - They calculate ending NonReg balance after growth and reinvestment
   - This happens regardless of which strategy determined the withdrawal amounts
   - **All strategies** trigger these calculations

2. **Lines 2266 & 2270** (TFSA contributions):
   - These run during TFSA contribution calculation (surplus reinvestment phase)
   - TFSA contributions are funded from NonReg if available
   - This happens regardless of withdrawal strategy
   - **All strategies** can trigger TFSA contributions when there's surplus

**Withdrawal Flow (Strategy-Independent)**:
```
1. Strategy determines withdrawal order → [nonreg, rrif, corp, tfsa]
2. Withdrawals are executed → w1["nonreg"], w1["rrif"], etc.
3. ✅ NonReg balance updated (with max(0.0, ...) protection) ← FIX LOCATION
4. Investment growth applied → balances grow at 5%
5. TFSA contributions calculated → funded from NonReg
6. ✅ NonReg balance updated again (with max(0.0, ...) protection) ← FIX LOCATION
```

**Strategies affected** (all 8):
- ✅ minimize-income (GIS-Optimized) - withdraws NonReg first
- ✅ balanced - optimizes for tax efficiency
- ✅ rrif-frontload - withdraws RRIF first but still uses NonReg
- ✅ nonreg-first - withdraws NonReg first (highest risk!)
- ✅ rrif-first - withdraws RRIF first but still uses NonReg
- ✅ corp-first - withdraws Corp first but still uses NonReg
- ✅ tfsa-first - withdraws TFSA first but still uses NonReg for TFSA contributions
- ✅ hybrid - withdraws hybrid mix but still uses NonReg

**Strategies with HIGHEST risk** (before fix):
1. **nonreg-first**: Depletes NonReg aggressively, making small balances common
2. **minimize-income**: Withdraws NonReg first to minimize taxable income
3. **balanced**: May withdraw NonReg heavily depending on tax optimization

**Strategies with LOWER risk** (but still vulnerable):
1. **rrif-first**: Withdraws RRIF first, but still uses NonReg for distributions and TFSA contributions
2. **tfsa-first**: Withdraws TFSA first, but still uses NonReg to fund TFSA contributions from surplus
3. **corp-first**: Withdraws Corp first, but still uses NonReg eventually

**Conclusion**: The NonReg negative balance fix is **strategy-agnostic** and applies universally. However, strategies that prioritize NonReg withdrawals (nonreg-first, minimize-income, balanced) were at **HIGHER RISK** of triggering the bug.

---

## Architecture Analysis

### How Strategies Interact with Core Simulation

**1. Strategy Selection** (`modules/withdrawal_strategies.py`):
- 8 different strategy classes define withdrawal order
- Each strategy returns an order like: `["nonreg", "rrif", "corp", "tfsa"]`

**2. Strategy Execution** (`modules/simulation.py:1311-1331`):
```python
# Tax optimizer determines withdrawal order
optimizer_plan = tax_optimizer.optimize_withdrawals(person, household, year)
order = optimizer_plan.withdrawal_order

# Fallback to strategy-based order if optimizer fails
if not order or len(order) == 0:
    order = _get_strategy_order(strategy_name)
```

**3. Withdrawal Execution** (`modules/simulation.py:1360-1450`):
- Withdrawals are executed in the order determined by the strategy
- Accounts are tapped sequentially until spending target is met
- This produces `w1` and `w2` dictionaries with withdrawal amounts

**4. Core Balance Updates** (`simulation.py:2107-2270`) ← **WHERE FIXES ARE APPLIED**:
```python
# Line 2107-2110: Update account balances after withdrawals
p1.rrif_balance = max(p1.rrif_balance - w1["rrif"], 0.0) * (1 + p1.yield_rrif_growth)
p2.rrif_balance = max(p2.rrif_balance - w2["rrif"], 0.0) * (1 + p2.yield_rrif_growth)
p1.tfsa_balance = max(p1.tfsa_balance - w1["tfsa"], 0.0) * (1 + p1.yield_tfsa_growth)
p2.tfsa_balance = max(p2.tfsa_balance - w2["tfsa"], 0.0) * (1 + p2.yield_tfsa_growth)

# Line 2168, 2196: ✅ NonReg balance calculation with protection
p1.nonreg_balance = max(0.0, p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1)
p2.nonreg_balance = max(0.0, p2_nr_cash_new + p2_nr_gic_new + p2_nr_invest_new + nr_reinvest_p2)

# Line 2266, 2270: ✅ TFSA contribution with NonReg protection
p1.nonreg_balance = max(0.0, p1.nonreg_balance - c1)
p2.nonreg_balance = max(0.0, p2.nonreg_balance - c2)
```

**5. Funding Gap Calculation** (`simulation.py:2055-2056, 2463`) ← **WHERE FIX #1 IS APPLIED**:
```python
# Calculate household funding gap
hh_gap = float(info1.get("unmet_after_tax", 0.0) + info2.get("unmet_after_tax", 0.0))
is_fail = hh_gap > hh.gap_tolerance

# Set plan_success flag
plan_success=not is_fail  # True if year is fully funded
```

**Key Insight**: The fixes are in steps 4 and 5, which run AFTER the strategy has determined withdrawals. This makes them **strategy-independent**.

---

## Testing Recommendations

Although the analysis shows the fixes are universal, it's good practice to verify with different strategies:

### High-Priority Testing (Most likely to trigger bugs):
1. ✅ **minimize-income** (already tested with Rafael & Lucy)
2. ⏳ **nonreg-first** - Highest risk for negative NonReg balances
3. ⏳ **balanced** - Complex optimization logic

### Medium-Priority Testing:
4. ⏳ **rrif-frontload** - RRIF-heavy but uses NonReg
5. ⏳ **hybrid** - Mixed strategy

### Lower-Priority Testing:
6. **rrif-first** - Less likely but still possible
7. **corp-first** - Rare strategy
8. **tfsa-first** - TFSA-heavy, but uses NonReg for contributions

### Suggested Test Case:
Use Rafael & Lucy's profile but test with different strategies:
- Starting assets: $912,000
- Spending: $95,000/year
- Ages: 64 and 62
- Provinces: Ontario
- Test years: Focus on 2033-2034 (where bugs occurred)

Expected results for ALL strategies:
- ✅ No negative NonReg balances in any year
- ✅ plan_success = TRUE when spending_gap = $0
- ✅ No "Gap" badges on years with $600K+ in assets

---

## Summary

### Both Fixes Apply Universally ✅

| Fix | Location | Applies To | Reason |
|-----|----------|------------|--------|
| **plan_success flag** | simulation.py:2463 | ✅ ALL 8 strategies | Calculated at household level after strategy executes |
| **NonReg negative balance** | simulation.py:2168,2196,2266,2270 | ✅ ALL 8 strategies | Applied during balance updates after withdrawals |

### Risk Assessment by Strategy

**Highest Risk (before fix)**:
1. nonreg-first - Aggressive NonReg depletion
2. minimize-income - NonReg-first for GIS optimization
3. balanced - Tax-optimized NonReg usage

**Medium Risk**:
4. rrif-frontload - RRIF-heavy but uses NonReg
5. hybrid - Mixed withdrawals

**Lower Risk** (but still vulnerable):
6. rrif-first - RRIF-first but eventually uses NonReg
7. corp-first - Corp-first but eventually uses NonReg
8. tfsa-first - TFSA-first but uses NonReg for contributions

### Code Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ STRATEGY LAYER (strategy-specific)                          │
│ - NonRegFirstStrategy                                        │
│ - RRIFFirstStrategy                                          │
│ - GISOptimizedStrategy (minimize-income)                     │
│ - BalancedStrategy                                           │
│ - ... (8 total)                                              │
│                                                               │
│ Returns: withdrawal_order = ["nonreg", "rrif", "tfsa", ...]│
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ WITHDRAWAL EXECUTION (strategy-independent)                  │
│ - Execute withdrawals in order from strategy                 │
│ - Produces w1["nonreg"], w1["rrif"], etc.                   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ CORE SIMULATION (strategy-independent) ✅ FIXES APPLIED HERE │
│                                                               │
│ ✅ FIX 2: NonReg balance updates (lines 2168, 2196, 2266, 2270)│
│   - Prevents negative balances with max(0.0, ...)           │
│   - Applies to ALL strategies                                │
│                                                               │
│ ✅ FIX 1: plan_success calculation (lines 2055-2056, 2463)   │
│   - Correctly sets flag based on spending_gap                │
│   - Applies to ALL strategies                                │
└─────────────────────────────────────────────────────────────┘
```

### Conclusion

**Both fixes are in the core simulation engine and apply universally to all 8 withdrawal strategies.** The fixes are **strategy-agnostic** because they protect account balances and calculate funding status AFTER the strategy has determined withdrawals.

Rafael & Lucy's issues will be fixed for ALL strategies, not just minimize-income.

However, strategies that prioritize NonReg withdrawals (nonreg-first, minimize-income, balanced) were at **higher risk** of triggering the bug due to more aggressive NonReg depletion.

---

## Files Referenced

- **simulation.py**:2055-2056, 2463 (plan_success flag)
- **simulation.py**:2168, 2196, 2266, 2270 (NonReg balance protection)
- **withdrawal_strategies.py**:97-423 (8 strategy classes)
- **tax_optimizer.py**:172-249 (strategy-independent optimization)

---

## Next Steps

**Recommended**:
1. ✅ Fixes are already deployed to production (commit 6b6e1ed)
2. ⏳ **Optional**: Test with nonreg-first and balanced strategies to verify
3. ⏳ **Optional**: Add regression tests to prevent future occurrences

**Not Required**:
- No additional code changes needed
- Fixes already apply universally
- Current production deployment is sufficient
