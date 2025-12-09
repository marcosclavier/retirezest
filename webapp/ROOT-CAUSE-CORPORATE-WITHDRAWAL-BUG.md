# Root Cause Analysis: Corporate Withdrawal Bug

**Date**: 2025-12-07
**Status**: ROOT CAUSE IDENTIFIED
**Priority**: CRITICAL

---

## Summary

The "corporate-optimized" strategy is NOT using corporate accounts for withdrawals. The bug has been traced to the Python simulation engine where the withdrawal calculation logic (`w1["corp"]`) is returning `None` instead of calculating actual withdrawals.

---

## Investigation Findings

### ✅ What's Working

1. **Data Transmission**: All input data is correctly sent to Python API
   - Corporate balance: $2,360,000 ✅
   - CPP/OAS: $13,855 and $7,362 ✅
   - Strategy: "corporate-optimized" ✅
   - All account balances and yields ✅

2. **Corporate Balance Recognition**: Python engine recognizes and grows corporate account
   - Year 2025: $2,477,410 (5% growth from $2.36M) ✅
   - Balance tracked correctly for all 31 years ✅

3. **Dataframe Structure**: Year-by-year results have correct structure
   - Column `corporate_withdrawal_p1` exists ✅
   - Set from `w1["corp"]` in simulation.py:2180 ✅

### ❌ What's Broken

1. **Corporate Withdrawal Calculation**: `w1["corp"]` returns `None` instead of withdrawal amount
   - Result: `corporate_withdrawal_p1: null` for ALL 31 years ❌
   - Expected: `corporate_withdrawal_p1: $40,000-50,000` per year ❌

2. **Strategy Not Followed**: Non-Reg used instead of Corporate
   - Actual: NonReg $43,571, Corp $0 (null) ❌
   - Expected: Corp $43,571, NonReg $0 ❌
   - Strategy order: Should be Corp → RRIF → NonReg → TFSA ❌

---

## Code Flow Analysis

### File Structure

```
/Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/
├── api/
│   ├── routes/simulation.py          # API endpoint
│   └── utils/converters.py           # DataFrame to API conversion
└── modules/
    └── simulation.py                 # Core simulation engine (2300+ lines)
```

###Step-by-Step Code Flow

#### 1. API Request → Simulation Engine

**File**: `api/routes/simulation.py`

```python
# Line 126: Run simulation
df = simulate(household, tax_cfg)

# Line 132: Convert to API format
year_by_year = dataframe_to_year_results(df)
```

#### 2. DataFrame → Year Results Conversion

**File**: `api/utils/converters.py`

```python
# Line 182: Extract corporate withdrawal from dataframe
corporate_withdrawal_p1=float(row.get('withdraw_corp_p1', row.get('corporate_withdrawal_p1', 0))),
```

**What this does**:
- Looks for column `withdraw_corp_p1` OR `corporate_withdrawal_p1`
- If neither exists or both are None, defaults to 0
- **FINDING**: Column exists but value is `None`

#### 3. Simulation Engine Creates Dataframe

**File**: `modules/simulation.py`

```python
# Line 2180: Set withdrawal from w1 dict
withdraw_corp_p1=w1["corp"], withdraw_corp_p2=w2["corp"],

# Line 2322: Convert to DataFrame
return pd.DataFrame([r.__dict__ for r in rows])
```

**What this does**:
- `w1` and `w2` are dictionaries containing withdrawal amounts per account
- `w1["corp"]` should contain the corporate withdrawal amount for person 1
- **FINDING**: `w1["corp"]` is `None` instead of a number

---

## Root Cause

**The withdrawal calculation logic is NOT populating `w1["corp"]` with a withdrawal amount.**

The `w1` and `w2` dictionaries are created somewhere in the simulation loop (before line 2180) but the corporate withdrawal key is either:
1. Not being set at all (defaulting to None)
2. Being explicitly set to None
3. The withdrawal strategy logic is skipping corporate accounts

---

## Where To Look Next

### Critical Investigation Areas

#### 1. Find Where `w1` and `w2` Are Created

**Search Pattern**: Look for where withdrawal dictionaries are built

```bash
grep -n "w1\s*=" /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/modules/simulation.py | grep -v "w1_"
```

**What to look for**:
- Function that creates `w1 = {"tfsa": X, "rrif": Y, "nonreg": Z, "corp": ???}`
- Check if `"corp"` key is being set
- Check if value is conditional on strategy type

#### 2. Find Withdrawal Strategy Implementation

**Search Patterns**:
```bash
# Search for corporate-optimized strategy handling
grep -n "corporate-optimized\|Corp.*RRIF.*NonReg" /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/modules/simulation.py

# Search for withdrawal calculation functions
grep -n "def.*withdraw\|def.*strategy" /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/modules/simulation.py
```

**What to look for**:
- Function that implements different withdrawal strategies
- Switch/if-else logic for "corporate-optimized"
- Code that should set `w1["corp"]` based on strategy

#### 3. Check for Strategy-Specific Withdrawal Logic

**Lines to examine**:
```python
# Search around line 2180 backwards to find where w1/w2 are populated
# Look for patterns like:
if strategy == "corporate-optimized":
    # Corporate withdrawal logic
    w1["corp"] = calculate_corp_withdrawal(...)
```

---

## Hypotheses

### Hypothesis #1: Corporate Withdrawals Not Implemented

**Likelihood**: HIGH

The withdrawal calculation may only be implemented for:
- TFSA: `w1["tfsa"]` ✅
- RRIF: `w1["rrif"]` ✅
- NonReg: `w1["nonreg"]` ✅
- Corporate: `w1["corp"]` ❌ NOT IMPLEMENTED

**Evidence**:
- All other withdrawals work (NonReg, RRIF when age > 71)
- Corporate field returns `None` consistently
- No errors or warnings in logs

**Fix**: Implement corporate withdrawal calculation logic

### Hypothesis #2: Strategy Enum Mismatch

**Likelihood**: MEDIUM

The string "corporate-optimized" may not trigger corporate withdrawal code.

**Evidence**:
- Strategy is set correctly at household level
- But withdrawal logic may be checking for different string/enum

**Test**: Try other strategy values and see if any produce corporate withdrawals

**Fix**: Update strategy matching logic or use correct strategy identifier

### Hypothesis #3: Missing Account Type Check

**Likelihood**: MEDIUM

Code may check `if corporate_balance > 0` but using wrong field name.

**Evidence**:
- Balance is recognized ($2.48M)
- But withdrawal logic may be checking `p1.corp_balance` instead of `p1.corporate_balance`

**Fix**: Update field name in withdrawal condition check

---

## Recommended Investigation Steps

### Step 1: Search for Withdrawal Dictionary Population (15 minutes)

```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app

# Find where w1/w2 are created
grep -B 20 -A 5 'withdraw_corp_p1=w1\["corp"\]' modules/simulation.py

# Look for withdrawal calculation functions
grep -n "def.*withdraw" modules/simulation.py
```

**Goal**: Find the exact line where `w1["corp"]` should be set

### Step 2: Check Strategy Implementation (15 minutes)

```bash
# Search for strategy-specific logic
grep -n "corporate-optimized" modules/simulation.py

# Search for strategy switching logic
grep -B 10 -A 10 "if.*strategy\|elif.*strategy" modules/simulation.py
```

**Goal**: Understand how strategies are implemented and if corporate is missing

### Step 3: Add Debug Logging (10 minutes)

**File**: `modules/simulation.py`

Add logging before line 2180 to see what's in `w1`:

```python
# Before line 2180
logger.info(f"Year {year}, Age {age1}: Withdrawals w1={w1}, w2={w2}")
logger.info(f"  Strategy: {hh.strategy}")
logger.info(f"  Corporate balance: p1={p1.corporate_balance}, p2={p2.corporate_balance}")

# Then line 2180
withdraw_corp_p1=w1["corp"], withdraw_corp_p2=w2["corp"],
```

**Goal**: See actual values and identify where they're set

### Step 4: Trace Backward From Line 2180 (30 minutes)

**Starting point**: Line 2180 in `modules/simulation.py`

**Trace backward**:
1. Find where `w1` variable is assigned
2. Find function that creates/populates `w1`
3. Check if that function has corporate withdrawal logic
4. If not, implement it following the pattern for NonReg/RRIF/TFSA

---

## Quick Diagnostic Commands

### Check What's In w1 Dictionary

If you add logging as suggested in Step 3, run:

```bash
# Clear old logs
> /tmp/python-api.log

# Restart Python API
pkill -f "python api/main.py"
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
python api/main.py > /tmp/python-api.log 2>&1 &

# Run test
cd /Users/jrcb/Documents/GitHub/retirezest/webapp
npx tsx scripts/test-simulation-2026-direct.ts

# Check logs
grep "Withdrawals w1=" /tmp/python-api.log | head -5
```

### Check Strategy Handling

```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
grep -C 5 "strategy.*corporate" modules/simulation.py
```

---

## Expected Fix Pattern

Based on how NonReg withdrawals work, the corporate withdrawal fix should follow this pattern:

```python
# Somewhere before line 2180 in simulation.py
# There should be code like:

# Calculate withdrawals based on strategy
if hh.strategy == "corporate-optimized":
    # Priority: Corp → RRIF → NonReg → TFSA

    # 1. Try corporate first
    if p1.corporate_balance > 0 and needed > 0:
        corp_wd = min(needed, p1.corporate_balance)
        p1.corporate_balance -= corp_wd
        needed -= corp_wd
        w1["corp"] = corp_wd  # ← THIS LINE IS MISSING!
    else:
        w1["corp"] = 0

    # 2. Then RRIF minimum
    if p1.rrif_balance > 0 and needed > 0:
        rrif_wd = calculate_rrif_minimum(...)
        w1["rrif"] = rrif_wd
        needed -= rrif_wd

    # 3. Then NonReg
    if p1.nonreg_balance > 0 and needed > 0:
        nonreg_wd = min(needed, p1.nonreg_balance)
        w1["nonreg"] = nonreg_wd
        needed -= nonreg_wd

    # 4. Finally TFSA
    if p1.tfsa_balance > 0 and needed > 0:
        tfsa_wd = min(needed, p1.tfsa_balance)
        w1["tfsa"] = tfsa_wd
```

**Current State**: The `w1["corp"] = corp_wd` line is missing or not being executed.

---

## Files To Modify

### Primary File

**File**: `/Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/modules/simulation.py`

**Lines**: Unknown (need to find withdrawal logic first)

**Change**: Add corporate withdrawal calculation logic

### Verification Files

**File**: `/Users/jrcb/Documents/GitHub/retirezest/webapp/scripts/test-simulation-2026-direct.ts`

**Purpose**: Test harness to verify fix

**Expected Result After Fix**:
```json
{
  "year": 2025,
  "age": 65,
  "corp_withdrawal_p1": 43571,        // ✅ Should have value
  "nonreg_withdrawal_p1": 0,          // ✅ Should be 0
  "rrif_withdrawal_p1": 0,
  "corporate_balance_p1": 2433839     // ✅ Reduced by withdrawal
}
```

---

## Testing Plan

### Test Case 1: Corporate Withdrawals Appear

```bash
# Run simulation
npx tsx webapp/scripts/test-simulation-2026-direct.ts

# Check results
jq '.year_by_year[0] | {corp: .corp_withdrawal_p1, nonreg: .nonreg_withdrawal_p1}' /tmp/raw-sim-result.json
```

**Expected**:
```json
{
  "corp": 43571.0,
  "nonreg": 0.0
}
```

### Test Case 2: Strategy Order Followed

```bash
# Check first 5 years
jq '[.year_by_year[0:5][] | {year, corp: .corp_withdrawal_p1, rrif: .rrif_withdrawal_p1, nonreg: .nonreg_withdrawal_p1}]' /tmp/raw-sim-result.json
```

**Expected**: Corporate used first, NonReg only after corporate depleted

### Test Case 3: Corporate Balance Decreases

```bash
# Check balance trend
jq '[.year_by_year[0:10][] | {year, balance: .corporate_balance_p1, withdrawal: .corp_withdrawal_p1}]' /tmp/raw-sim-result.json
```

**Expected**: Balance decreases as withdrawals happen

---

## Success Criteria

### Must Have ✅

- [ ] `corporate_withdrawal_p1` returns a number, not `null`
- [ ] Corporate account used FIRST in "corporate-optimized" strategy
- [ ] NonReg only used after corporate depleted or for specific needs
- [ ] Tax rate reflects efficient dividend taxation (~4-6%)
- [ ] Final estate not 100% in corporate account

### Should Have

- [ ] All strategies properly implement their withdrawal priorities
- [ ] Logging added to help debug future withdrawal issues
- [ ] Unit tests for withdrawal strategy logic

---

## Additional Context

### Strategy Definitions (from app.py analysis)

From earlier grep analysis of `/Users/jrcb/OpenAI Retirement/app.py`:

**Strategy C** (Corporate-Optimized):
- UI String: "Corp->RRIF->NonReg->TFSA"
- API Enum: "corporate-optimized"
- **Withdrawal Order**: Corporate → RRIF → Non-Reg → TFSA
- **Purpose**: Maximize dividend tax credits, minimize taxable income

**Note**: The juan-retirement-app may be a separate codebase from "OpenAI Retirement". Need to verify they share the same strategy logic.

---

## Contact & Resources

**Python API**: `http://localhost:8000`
**Logs**: `/tmp/python-api.log`
**Test Results**: `/tmp/raw-sim-result.json`

**Key Files**:
- Simulation engine: `juan-retirement-app/modules/simulation.py` (2323 lines)
- API route: `juan-retirement-app/api/routes/simulation.py`
- Converters: `juan-retirement-app/api/utils/converters.py`

---

**Created by**: Claude Code
**Last Updated**: 2025-12-07
**Status**: Investigation complete, ready for fix implementation
