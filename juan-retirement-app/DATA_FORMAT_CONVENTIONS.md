# Data Format Conventions

**Last Updated**: February 5, 2026
**Status**: Active
**Related**: US-077 Bug Fix (Percentage vs Decimal)

---

## Purpose

This document defines the standard data formats used throughout the RetireZest codebase to prevent bugs caused by inconsistent percentage vs decimal representations.

## Critical: Percentage vs Decimal Handling

### Historical Context (US-077 Bug)

**Date**: January 26 - February 5, 2026
**Issue**: Exponential growth bug caused by percentage/decimal confusion
**Root Cause**: Database stored yields as whole numbers (2, 3, 6) but simulation engine treated them as decimals (2.0, 3.0, 6.0), causing 600-700% growth instead of 6%.

**Impact**:
- Success rates dropped from 100% → 35.5%
- Final estate values reached $10³¹ (impossible)
- Fixed in commit a56ed7c on February 5, 2026

---

## Standard Conventions

### Rule 1: Internal Representation (Python Simulation Engine)

**All percentage fields MUST be stored as decimals (0.0 - 1.0) in Python code.**

```python
# ✅ CORRECT - Decimals
y_nr_inv_total_return = 0.06      # 6% annual return
general_inflation = 0.02           # 2% inflation
spending_inflation = 0.02          # 2% spending inflation
y_nr_cash_interest = 0.015         # 1.5% cash interest

# ❌ INCORRECT - Whole numbers
y_nr_inv_total_return = 6          # Would be treated as 600%!
general_inflation = 2              # Would be treated as 200%!
```

### Rule 2: Database Storage

**Database MAY store values in either format, but conversion MUST happen at the boundary.**

Current database stores some fields as whole numbers (2, 3, 6) for historical reasons. The simulation engine handles this with conditional conversion:

```python
# Conversion pattern (implemented in simulation.py)
value_raw = float(getattr(person, "y_nr_inv_total_return", 0.04))
value = value_raw / 100.0 if value_raw > 1.0 else value_raw
```

**Logic**: If value > 1.0, assume it's a percentage stored as whole number and divide by 100.

### Rule 3: API Input/Output

**API accepts percentages as whole numbers (2, 3, 6) and converts to decimals internally.**

```typescript
// ✅ CORRECT - Frontend sends whole numbers
{
  "y_nr_inv_total_return": 6,      // 6%
  "general_inflation": 2,            // 2%
  "spending_inflation": 2            // 2%
}
```

API converter (api/utils/converters.py) handles conversion:

```python
# API assumes ALL inputs are percentages
y_nr_inv_total_return = api_person.y_nr_inv_total_return / 100.0
general_inflation = api_household.general_inflation / 100.0
```

---

## Field Reference

### Investment Returns (Person Model)

| Field | Type | Format | Example | Notes |
|-------|------|--------|---------|-------|
| `y_nr_inv_total_return` | Decimal | 0.0-1.0 | 0.06 | 6% total return (includes dividends + capital gains + appreciation) |
| `y_nr_cash_interest` | Decimal | 0.0-1.0 | 0.015 | 1.5% interest on cash bucket |
| `y_nr_gic_interest` | Decimal | 0.0-1.0 | 0.035 | 3.5% GIC interest rate |
| `y_nr_inv_elig_div` | Decimal | 0.0-1.0 | 0.02 | 2% eligible dividend yield |
| `y_nr_inv_nonelig_div` | Decimal | 0.0-1.0 | 0.00 | 0% non-eligible dividend yield |
| `y_nr_inv_capg` | Decimal | 0.0-1.0 | 0.02 | 2% capital gains distribution |

### Corporate Account Returns (Person Model)

| Field | Type | Format | Example | Notes |
|-------|------|--------|---------|-------|
| `corp_yield_interest` | Decimal | 0.0-1.0 | 0.00 | Corporate cash interest |
| `corp_yield_elig_div` | Decimal | 0.0-1.0 | 0.03 | Corporate eligible dividends |
| `corp_yield_nonelig_div` | Decimal | 0.0-1.0 | 0.00 | Corporate non-eligible dividends |
| `corp_yield_capg` | Decimal | 0.0-1.0 | 0.00 | Corporate capital gains |
| `y_corp_cash_interest` | Decimal | 0.0-1.0 | 0.00 | Alternate field name |
| `y_corp_inv_elig_div` | Decimal | 0.0-1.0 | 0.03 | Alternate field name |
| `y_corp_inv_capg` | Decimal | 0.0-1.0 | 0.00 | Alternate field name |

### Inflation Rates (Household Model)

| Field | Type | Format | Example | Notes |
|-------|------|--------|---------|-------|
| `general_inflation` | Decimal | 0.0-1.0 | 0.02 | 2% general inflation for CPP/OAS indexing |
| `spending_inflation` | Decimal | 0.0-1.0 | 0.02 | 2% spending inflation for target adjustments |

---

## Code Locations with Conversion Logic

### ✅ Fixed Locations (Commit a56ed7c)

1. **modules/simulation.py:133-164** - `nonreg_distributions()` function
   ```python
   # Convert percentage to decimal if needed
   yield_cash_interest = yield_cash_interest_raw / 100.0 if yield_cash_interest_raw > 1.0 else yield_cash_interest_raw
   yield_gic_interest = yield_gic_interest_raw / 100.0 if yield_gic_interest_raw > 1.0 else yield_gic_interest_raw
   yield_elig_div = yield_elig_div_raw / 100.0 if yield_elig_div_raw > 1.0 else yield_elig_div_raw
   yield_nonelig_div = yield_nonelig_div_raw / 100.0 if yield_nonelig_div_raw > 1.0 else yield_nonelig_div_raw
   yield_capg = yield_capg_raw / 100.0 if yield_capg_raw > 1.0 else yield_capg_raw
   ```

2. **modules/simulation.py:2488-2506** - Person 1 bucket growth
   ```python
   # Convert percentage to decimal if needed
   p1_yr_cash = p1_yr_cash_raw / 100.0 if p1_yr_cash_raw > 1.0 else p1_yr_cash_raw
   p1_yr_gic = p1_yr_gic_raw / 100.0 if p1_yr_gic_raw > 1.0 else p1_yr_gic_raw
   p1_yr_invest = p1_yr_invest_raw / 100.0 if p1_yr_invest_raw > 1.0 else p1_yr_invest_raw
   ```

3. **modules/simulation.py:2520-2544** - Person 2 bucket growth (same pattern)

4. **modules/simulation.py:194-208** - `corp_passive_income()` bucketed mode
   ```python
   # Convert percentage to decimal if needed
   yield_int = yield_int_raw / 100.0 if yield_int_raw > 1.0 else yield_int_raw
   yield_elig = yield_elig_raw / 100.0 if yield_elig_raw > 1.0 else yield_elig_raw
   yield_nonelig = yield_nonelig_raw / 100.0 if yield_nonelig_raw > 1.0 else yield_nonelig_raw
   yield_capg = yield_capg_raw / 100.0 if yield_capg_raw > 1.0 else yield_capg_raw
   ```

5. **modules/simulation.py:215-224** - `corp_passive_income()` simple mode (same pattern)

### ✅ API Conversion Layer

**api/utils/converters.py** - Converts API input (percentages) to internal format (decimals)

```python
# API assumes ALL inputs are percentages (whole numbers)
y_nr_cash_interest = api_person.y_nr_cash_interest / 100.0
y_nr_gic_interest = api_person.y_nr_gic_interest / 100.0
y_nr_inv_elig_div = api_person.y_nr_inv_elig_div / 100.0
# ... etc for all percentage fields
```

---

## Testing Guidelines

### Regression Testing

When modifying code that handles percentage/decimal fields:

1. **Run regression tests**:
   ```bash
   cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
   python3 test_regression_phase1_v2.py
   ```

2. **Verify success rates** match baseline (±5% tolerance)

3. **Check for exponential growth patterns**:
   - Non-registered account should grow 4-6% annually, not 6-7x
   - Final estate should be < $10M for typical starting assets ($500K-1M)
   - Tax calculations should be $0-100K per year, not $10¹⁷

### Unit Testing

When adding new percentage fields:

```python
def test_percentage_conversion():
    """Test that percentage values are converted correctly."""
    person = Person(
        name="Test",
        y_nr_inv_total_return=6,  # Database stores as whole number
        # ... other fields
    )

    # Simulate and verify growth is ~6% not 600%
    household = Household(p1=person, p2=Person(), start_year=2025)
    results = simulate(household, tax_config)

    # Verify reasonable growth (not exponential)
    year1_balance = results.iloc[0]['end_nonreg_p1']
    year2_balance = results.iloc[1]['end_nonreg_p1']
    growth_rate = (year2_balance / year1_balance) - 1.0

    assert 0.04 <= growth_rate <= 0.08, f"Growth {growth_rate:.1%} outside normal range"
```

---

## Best Practices

### 1. Always Use Conditional Conversion

When retrieving percentage fields from database/models:

```python
# ✅ CORRECT - Safe for both formats
value_raw = float(getattr(person, "field_name", default))
value = value_raw / 100.0 if value_raw > 1.0 else value_raw
```

```python
# ❌ INCORRECT - Assumes decimal format
value = float(getattr(person, "field_name", default))  # Breaks if stored as percentage!
```

### 2. Document Field Units

When defining new percentage fields in models:

```python
class Person(BaseModel):
    # ✅ CORRECT - Clearly documented
    y_nr_inv_total_return: Optional[float] = 0.06  # Annual total return (decimal, 0.06 = 6%)

    # ❌ UNCLEAR - No unit documentation
    y_nr_inv_total_return: Optional[float] = 0.06  # Annual return
```

### 3. Use Descriptive Variable Names

```python
# ✅ CORRECT - Clear what format is expected
yield_raw = getattr(person, "y_nr_inv_total_return", 0.04)
yield_decimal = yield_raw / 100.0 if yield_raw > 1.0 else yield_raw

# ❌ UNCLEAR - Hard to tell what format 'yield' is
yield = getattr(person, "y_nr_inv_total_return", 0.04)
```

### 4. Add Validation

Use Pydantic validators to catch out-of-range values:

```python
from pydantic import BaseModel, field_validator

class Person(BaseModel):
    y_nr_inv_total_return: Optional[float] = 0.06

    @field_validator('y_nr_inv_total_return')
    def validate_return(cls, v):
        # Allow both formats: decimal (0.0-1.0) or percentage (1.0-100.0)
        if v < 0.0 or v > 100.0:
            raise ValueError(f"Return rate must be between 0-100, got {v}")
        return v
```

---

## Migration Plan (Future)

### Phase 1: Document Current State ✅ COMPLETE
- Created DATA_FORMAT_CONVENTIONS.md
- Updated DEVELOPER_GUIDE.md with percentage/decimal section
- Added comments to all conversion code

### Phase 2: Add Database Constraints (US-080)
```sql
-- Ensure yields are stored in consistent format
ALTER TABLE Person ADD CONSTRAINT check_yield_range
  CHECK (y_nr_inv_total_return >= 0 AND y_nr_inv_total_return <= 1);
```

### Phase 3: Standardize Field Names (US-081)
Rename fields to indicate units:
- `y_nr_inv_total_return` → `y_nr_inv_total_return_decimal`
- OR add new `_pct` suffix for percentage fields

### Phase 4: Add Automated Tests (US-079)
- CI/CD regression tests on all PRs
- Automated validation of percentage/decimal handling

---

## Common Pitfalls

### ❌ Pitfall 1: Assuming Database Format

```python
# ❌ WRONG - Assumes database stores decimals
total_return = person.y_nr_inv_total_return
balance_next_year = balance * (1 + total_return)  # Breaks if stored as 6 instead of 0.06!
```

```python
# ✅ CORRECT - Handles both formats
total_return_raw = person.y_nr_inv_total_return
total_return = total_return_raw / 100.0 if total_return_raw > 1.0 else total_return_raw
balance_next_year = balance * (1 + total_return)
```

### ❌ Pitfall 2: Not Converting at Boundaries

```python
# ❌ WRONG - Stores API percentage directly in database
person.y_nr_inv_total_return = api_data["return"]  # Stores 6 instead of 0.06

# ✅ CORRECT - Convert at API boundary
person.y_nr_inv_total_return = api_data["return"] / 100.0
```

### ❌ Pitfall 3: Inconsistent Conversion Logic

```python
# ❌ WRONG - Different conversion thresholds
value1 = raw1 / 100.0 if raw1 > 1.0 else raw1      # Threshold: 1.0
value2 = raw2 / 100.0 if raw2 >= 1.0 else raw2     # Threshold: 1.0 (inclusive)

# ✅ CORRECT - Consistent threshold (> 1.0)
value1 = raw1 / 100.0 if raw1 > 1.0 else raw1
value2 = raw2 / 100.0 if raw2 > 1.0 else raw2
```

---

## Related Documentation

- **ROOT_CAUSE_ANALYSIS_EXPONENTIAL_GROWTH.md** - Detailed analysis of US-077 bug
- **US-077_BUG_FIX_COMPLETE.md** - Complete bug fix summary
- **DEVELOPER_GUIDE.md** - General development guidelines
- **modules/simulation.py** - Implementation of conversion logic

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | February 5, 2026 | Initial document created after US-077 bug fix |

---

**Questions?** See the development team or refer to US-077 documentation for historical context.
