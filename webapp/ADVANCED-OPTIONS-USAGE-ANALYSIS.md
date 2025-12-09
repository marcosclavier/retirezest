# Advanced Options Usage Analysis

**Date:** December 8, 2025
**Status:** ✅ All advanced options are actively used in simulation

---

## Summary

**Yes, all advanced options are being used in the simulation.** The Python simulation engine (`juan-retirement-app/modules/simulation.py`) actively uses every single advanced option field from the HouseholdForm.

---

## Advanced Options Breakdown

### 1. **Spending Gap Tolerance** ✅ USED

**UI Field:** `gap_tolerance`
**Default Value:** $1,000
**Description:** "Acceptable shortfall in meeting spending goals"

**How It's Used (simulation.py:1848):**
```python
hh_gap = float(info1.get("unmet_after_tax", 0.0) + info2.get("unmet_after_tax", 0.0))
is_fail = hh_gap > hh.gap_tolerance
```

**Impact:**
- Determines whether the simulation is considered "failed" for a given year
- If household spending gap exceeds this tolerance, the year is marked as a failure
- Used with `stop_on_fail` to potentially end the simulation early

**Real-world Meaning:**
- If you need $100,000 in spending but only have $99,500 available (gap = $500), and tolerance is $1,000, the year is still considered successful
- This allows for minor shortfalls without triggering failure warnings

---

### 2. **Annual TFSA Contribution (each)** ✅ USED

**UI Field:** `tfsa_contribution_each`
**Default Value:** $0
**Description:** Annual TFSA contribution per person

**How It's Used (simulation.py:2053-2054):**
```python
c1 = min(hh.tfsa_contribution_each, max(p1.nonreg_balance, 0.0), tfsa_room1)
c2 = min(hh.tfsa_contribution_each, max(p2.nonreg_balance, 0.0), tfsa_room2)
```

**Impact:**
- Each year, the simulation attempts to contribute this amount to each person's TFSA
- Contributions are limited by:
  - Available TFSA contribution room
  - Available non-registered balance (source of funds)
- Reduces non-registered balance by the contribution amount
- Increases TFSA balance by the contribution amount

**Tax Optimization:**
- Moves money from taxable (non-registered) to tax-free (TFSA) accounts
- Critical for long-term tax efficiency
- **If set to $0, no TFSA contributions are made during retirement**

---

### 3. **Reinvest Non-Registered Distributions** ✅ USED

**UI Field:** `reinvest_nonreg_dist`
**Default Value:** `false` (toggle switch)
**Description:** "Automatically reinvest dividends and distributions"

**How It's Used (simulation.py:1057, 1357, 1465, 1938):**

**Key Logic:**
```python
# Line 1057: Check if distributions should be reinvested or available as cash
if hh.reinvest_nonreg_dist:
    dist_for_cash = 0.0  # Distributions NOT available for spending
else:
    dist_for_cash = dist_amount  # Distributions available as cash

# Line 1938: Calculate reinvestment amounts
if hh.reinvest_nonreg_dist:
    nr_reinvest_p1 = nr_distributions_p1  # Add distributions back to account
    nr_reinvest_p2 = nr_distributions_p2
else:
    nr_reinvest_p1 = 0.0  # Distributions paid out as cash
    nr_reinvest_p2 = 0.0
```

**Impact:**
- **When ON:** Dividends/distributions stay in the account and compound
- **When OFF:** Dividends/distributions are paid out as cash for spending
- **IMPORTANT:** Distributions are ALWAYS taxable (phantom income), regardless of this setting

**Tax Implications:**
```python
# NOTE: Distributions are ALWAYS passed to tax_for() for taxation,
# regardless of the reinvest_nonreg_dist flag. This ensures phantom income
# is properly captured even when distributions are reinvested.
```

---

### 4. **Stop Simulation on Failure** ✅ USED

**UI Field:** `stop_on_fail`
**Default Value:** `false` (toggle switch)
**Description:** "End simulation when assets are depleted"

**How It's Used (simulation.py:2283-2284):**
```python
# Stop if underfunded and stop_on_fail is set
if hh.stop_on_fail and is_fail:
    break  # Exit the simulation loop early
```

**Impact:**
- **When ON:** Simulation stops immediately when a year fails (gap > tolerance)
- **When OFF:** Simulation continues to the end age even if failures occur
- Works in conjunction with `gap_tolerance`

**Use Cases:**
- **ON:** Get a clear "retirement fails at age X" result
- **OFF:** See the full picture including years with negative balances

---

### 5. **Income Split RRIF Fraction** ✅ USED

**UI Field:** `income_split_rrif_fraction`
**Default Value:** 0
**Range:** 0 to 1 (with note "Fraction of RRIF income to split (0 to 1)")
**Description:** Enables pension income splitting for couples

**How It's Used (simulation.py:1860-1862):**
```python
# RRIF income splitting (up to 50% if age >=65)
split = clamp(hh.income_split_rrif_fraction, 0.0, 0.5)
transfer12 = split * w1["rrif"] if age1 >= 65 else 0.0
transfer21 = split * w2["rrif"] if age2 >= 65 else 0.0
```

**Impact:**
- Allows couples to split RRIF income between partners for tax purposes
- **Maximum:** 50% (0.5) of RRIF income can be transferred
- **Age Requirement:** Only works if the person is 65+
- **Tax Optimization:** Balances income between partners to minimize total tax

**Example:**
- Person 1 has $50,000 RRIF withdrawal, Person 2 has $10,000
- If `income_split_rrif_fraction = 0.5`:
  - Person 1 transfers $25,000 (50% of $50,000) to Person 2
  - Result: Person 1 = $25,000, Person 2 = $35,000 (more balanced)

**Note from UI:** Currently shows "Fraction of RRIF income to split (0 to 1)", but the code enforces a maximum of 0.5 (50%)

---

### 6. **Hybrid RRIF Top-up (per person)** ✅ USED

**UI Field:** `hybrid_rrif_topup_per_person`
**Default Value:** $0
**Description:** Strategy-specific parameter for hybrid withdrawal strategy

**How It's Used (simulation.py:1737, 1741):**
```python
w1, t1, info1 = simulate_year(
    p1, age1, target_p1_adjusted, fed_y, prov_y, rrsp_to_rrif1, cust["p1"],
    hh.strategy, hh.hybrid_rrif_topup_per_person, hh, year, tfsa_room1
)
w2, t2, info2 = simulate_year(
    p2, age2, target_p2_adjusted, fed_y, prov_y, rrsp_to_rrif2, cust["p2"],
    hh.strategy, hh.hybrid_rrif_topup_per_person, hh, year, tfsa_room2
)
```

**Impact:**
- Only used when `strategy = 'hybrid'`
- Specifies an additional RRIF withdrawal amount per person beyond the minimum
- Helps balance withdrawals between RRIF and other accounts

**When It Matters:**
- **Hybrid strategy selected:** This value is actively used
- **Other strategies:** This value is passed but likely ignored by the strategy logic

---

## Data Flow Verification

### Frontend → Backend Flow

1. **User Input (HouseholdForm.tsx)**
   - User sets values in Advanced Options section
   - Values stored in `household` state

2. **API Request (simulation-client.ts)**
   ```typescript
   const response = await fetch('/api/simulation/run', {
     method: 'POST',
     body: JSON.stringify(householdInput),  // Entire HouseholdInput sent
   });
   ```

3. **Next.js API Route (/api/simulation/run)**
   - Receives full `HouseholdInput`
   - Forwards to Python FastAPI server

4. **Python Backend (simulation.py)**
   - Receives household data with all advanced options
   - Actively uses each field during simulation

---

## Recommendations

### 1. **UI Clarification for Income Split RRIF Fraction**

**Current UI:** "Fraction of RRIF income to split (0 to 1)"

**Backend Reality:** Code clamps to maximum 0.5 (50%)
```python
split = clamp(hh.income_split_rrif_fraction, 0.0, 0.5)
```

**Recommendation:** Update UI to reflect the actual maximum:
- Change description to: "Fraction of RRIF income to split (0 to 0.5)"
- Or change to: "Percentage of RRIF income to split (0% to 50%)" with adjusted input handling

---

### 2. **Default Value for TFSA Contribution**

**Current Default:** $0
**Impact:** No TFSA contributions are made during retirement by default

**Consideration:** For users with TFSA contribution room, this is a missed optimization opportunity. Consider:
- Setting a small default (e.g., $7,000 matching current TFSA limit)
- OR adding a tooltip explaining why $0 might not be optimal

---

### 3. **Default for Reinvest Non-Registered Distributions**

**Current Default:** OFF (false)
**Impact:** Distributions are paid out as cash and available for spending

**This is reasonable** for most retirees who need the income, but users should understand:
- Distributions are still taxable even if reinvested
- Reinvesting can help accounts grow to offset withdrawals

---

### 4. **Strategy-Specific Parameters**

**Current UI:** All advanced options shown regardless of strategy

**Enhancement Idea:** Consider showing/hiding `hybrid_rrif_topup_per_person` based on selected strategy:
- Only show when `strategy === 'hybrid'`
- Reduces clutter for users not using hybrid strategy

---

## Conclusion

✅ **All advanced options are fully functional and actively used in the simulation**

The Python simulation engine properly:
- Reads all advanced option values from the request
- Uses them in simulation calculations
- Applies them correctly with appropriate constraints (e.g., 50% max for income splitting)

**No dead code or unused fields** - every advanced option impacts the simulation results.

---

## Files Referenced

```
webapp/components/simulation/HouseholdForm.tsx       # UI for advanced options
webapp/lib/api/simulation-client.ts                   # API client (sends full HouseholdInput)
juan-retirement-app/modules/simulation.py             # Core simulation logic (uses all options)
```

---

**Analyzed by:** Claude Code
**Verification Status:** Confirmed via code inspection and grep searches
