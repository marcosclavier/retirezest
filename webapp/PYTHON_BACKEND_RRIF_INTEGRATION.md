# Python Backend Integration - RRIF Early Withdrawal Feature

## Overview
This document provides step-by-step instructions for integrating the RRIF Early Withdrawal feature into the Python FastAPI backend.

**Backend Location**: `/Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/`

---

## Step 1: Update Person Model (`modules/models.py`)

Add the following fields to the `Person` dataclass (around line 118):

```python
@dataclass
class Person:
    """One individual in the household."""
    name: str
    start_age: int

    # ... existing fields ...

    # Early RRIF/RRSP withdrawal customization (before age 71)
    enable_early_rrif_withdrawal: bool = False
    early_rrif_withdrawal_start_age: int = 65
    early_rrif_withdrawal_end_age: int = 70
    early_rrif_withdrawal_annual: float = 20000.0
    early_rrif_withdrawal_percentage: float = 5.0
    early_rrif_withdrawal_mode: str = "fixed"  # "fixed" or "percentage"
```

**Location**: Insert after line 155 (after `y_corp_inv_capg`)

---

## Step 2: Create Early RRIF Withdrawal Calculator

Add this function to `modules/simulation.py` (after the `rrif_minimum` function, around line 80):

```python
def calculate_early_rrif_withdrawal(person: Person, age: int) -> float:
    """
    Calculate custom early RRIF/RRSP withdrawal for the year.

    This allows users to specify custom withdrawals before age 71
    (when mandatory minimums kick in). Useful for tax planning,
    income splitting, and OAS clawback avoidance.

    Args:
        person (Person): Person with RRIF withdrawal settings.
        age (int): Current age.

    Returns:
        float: Withdrawal amount for this year ($).

    Examples:
        >>> person = Person(name="Test", start_age=65)
        >>> person.enable_early_rrif_withdrawal = True
        >>> person.early_rrif_withdrawal_start_age = 65
        >>> person.early_rrif_withdrawal_end_age = 70
        >>> person.early_rrif_withdrawal_annual = 25000
        >>> person.early_rrif_withdrawal_mode = "fixed"
        >>> calculate_early_rrif_withdrawal(person, 67)
        25000.0
        >>> calculate_early_rrif_withdrawal(person, 72)
        0.0
    """
    # Check if early withdrawals are enabled
    if not getattr(person, 'enable_early_rrif_withdrawal', False):
        return 0.0

    # Check if age is within the specified range
    start_age = getattr(person, 'early_rrif_withdrawal_start_age', 65)
    end_age = getattr(person, 'early_rrif_withdrawal_end_age', 70)

    if age < start_age or age > end_age:
        return 0.0

    # Check if person has RRSP/RRIF balance
    rrsp_balance = getattr(person, 'rrsp_balance', 0.0)
    rrif_balance = getattr(person, 'rrif_balance', 0.0)
    total_rrif_balance = rrsp_balance + rrif_balance

    if total_rrif_balance < 0.01:
        return 0.0

    # Get withdrawal mode
    mode = getattr(person, 'early_rrif_withdrawal_mode', 'fixed')

    if mode == 'fixed':
        # Fixed amount per year
        amount = getattr(person, 'early_rrif_withdrawal_annual', 20000.0)
        # Don't withdraw more than available
        return min(amount, total_rrif_balance)

    elif mode == 'percentage':
        # Percentage of balance
        percentage = getattr(person, 'early_rrif_withdrawal_percentage', 5.0)
        return total_rrif_balance * (percentage / 100.0)

    else:
        logger.warning(f"Unknown early RRIF withdrawal mode: {mode}")
        return 0.0
```

---

## Step 3: Integrate into Withdrawal Logic

Find the `simulate_year` function in `modules/simulation.py`. You need to modify the RRIF withdrawal logic to include early withdrawals.

**Location**: Look for where RRIF minimum withdrawals are calculated (search for `rrif_minimum`)

**Current Logic (approximate line numbers vary):**
```python
# Calculate RRIF minimum withdrawal
rrif_min_p1 = rrif_minimum(p1.rrif_balance, age_p1)
rrif_min_p2 = rrif_minimum(p2.rrif_balance, age_p2)
```

**New Logic:**
```python
# Calculate RRIF minimum withdrawal (age 71+)
rrif_min_p1 = rrif_minimum(p1.rrif_balance, age_p1)
rrif_min_p2 = rrif_minimum(p2.rrif_balance, age_p2)

# Calculate early RRIF withdrawals (before age 71)
# These are voluntary withdrawals for tax planning
early_rrif_p1 = calculate_early_rrif_withdrawal(p1, age_p1)
early_rrif_p2 = calculate_early_rrif_withdrawal(p2, age_p2)

# Total RRIF withdrawal requirement is MAX of minimum or early withdrawal
# (early withdrawals only apply before age 71, minimums after)
rrif_min_p1 = max(rrif_min_p1, early_rrif_p1)
rrif_min_p2 = max(rrif_min_p2, early_rrif_p2)

# Log if early withdrawals are active
if early_rrif_p1 > 0:
    logger.info(f"P1 age {age_p1}: Early RRIF withdrawal ${early_rrif_p1:,.0f}")
if early_rrif_p2 > 0:
    logger.info(f"P2 age {age_p2}: Early RRIF withdrawal ${early_rrif_p2:,.0f}")
```

---

## Step 4: Ensure Withdrawals are Taxed

The early RRIF withdrawals should be treated as regular RRIF withdrawals for tax purposes. Verify that:

1. They're added to taxable income
2. They reduce the RRIF/RRSP balance
3. They count toward spending needs
4. They're reflected in year-by-year results

**Verification**: Check that RRIF withdrawals are being added to `taxable_income_p1` and `taxable_income_p2`

---

## Step 5: Update YearResult Model (if needed)

If you want to track early RRIF withdrawals separately in the results, add fields to `YearResult`:

```python
@dataclass
class YearResult:
    """Results for one year of simulation."""
    year: int
    age_p1: int
    age_p2: int

    # ... existing fields ...

    # Optional: Track early vs mandatory RRIF withdrawals
    rrif_withdrawal_p1: float = 0.0
    rrif_withdrawal_p2: float = 0.0
    early_rrif_withdrawal_p1: float = 0.0  # NEW
    early_rrif_withdrawal_p2: float = 0.0  # NEW
    rrif_minimum_p1: float = 0.0           # NEW
    rrif_minimum_p2: float = 0.0           # NEW
```

---

## Step 6: Update API Route (if needed)

Check `api/routes/simulation.py` to ensure the new Person fields are accepted:

```python
# The Pydantic model should automatically accept the new fields
# if they're defined in the Person dataclass
```

**Verification**: Test the API endpoint with sample data containing the new fields.

---

## Step 7: Add Validation

Add validation to ensure inputs are sensible:

```python
def validate_early_rrif_settings(person: Person) -> List[str]:
    """
    Validate early RRIF withdrawal settings.

    Returns:
        List[str]: List of validation errors (empty if valid).
    """
    errors = []

    if not person.enable_early_rrif_withdrawal:
        return errors  # Not enabled, nothing to validate

    # End age must be < 71 (when mandatory minimums start)
    if person.early_rrif_withdrawal_end_age >= 71:
        errors.append("Early RRIF withdrawal end age must be less than 71")

    # Start age must be before end age
    if person.early_rrif_withdrawal_start_age >= person.early_rrif_withdrawal_end_age:
        errors.append("Early RRIF withdrawal start age must be before end age")

    # Percentage must be 0-100
    if person.early_rrif_withdrawal_mode == "percentage":
        if person.early_rrif_withdrawal_percentage < 0 or person.early_rrif_withdrawal_percentage > 100:
            errors.append("Early RRIF withdrawal percentage must be between 0 and 100")

    # Fixed amount must be positive
    if person.early_rrif_withdrawal_mode == "fixed":
        if person.early_rrif_withdrawal_annual < 0:
            errors.append("Early RRIF withdrawal amount must be positive")

    # Mode must be valid
    if person.early_rrif_withdrawal_mode not in ["fixed", "percentage"]:
        errors.append(f"Invalid early RRIF withdrawal mode: {person.early_rrif_withdrawal_mode}")

    return errors
```

Call this validation in the API route before running the simulation.

---

## Testing Checklist

### Unit Tests

Create `tests/test_early_rrif.py`:

```python
import pytest
from modules.models import Person
from modules.simulation import calculate_early_rrif_withdrawal

def test_early_rrif_disabled():
    """Test that no withdrawal occurs when feature is disabled."""
    person = Person(name="Test", start_age=65)
    person.enable_early_rrif_withdrawal = False
    assert calculate_early_rrif_withdrawal(person, 67) == 0.0

def test_early_rrif_fixed_amount():
    """Test fixed amount withdrawal mode."""
    person = Person(name="Test", start_age=65)
    person.rrsp_balance = 500000
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 25000
    person.early_rrif_withdrawal_mode = "fixed"

    # Within age range
    assert calculate_early_rrif_withdrawal(person, 67) == 25000.0

    # Outside age range
    assert calculate_early_rrif_withdrawal(person, 64) == 0.0
    assert calculate_early_rrif_withdrawal(person, 71) == 0.0

def test_early_rrif_percentage():
    """Test percentage withdrawal mode."""
    person = Person(name="Test", start_age=60)
    person.rrif_balance = 750000
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 60
    person.early_rrif_withdrawal_end_age = 69
    person.early_rrif_withdrawal_percentage = 5.0
    person.early_rrif_withdrawal_mode = "percentage"

    # 5% of 750,000 = 37,500
    assert calculate_early_rrif_withdrawal(person, 62) == 37500.0

def test_early_rrif_respects_balance():
    """Test that withdrawal doesn't exceed balance."""
    person = Person(name="Test", start_age=65)
    person.rrsp_balance = 10000  # Only $10k left
    person.enable_early_rrif_withdrawal = True
    person.early_rrif_withdrawal_start_age = 65
    person.early_rrif_withdrawal_end_age = 70
    person.early_rrif_withdrawal_annual = 25000  # Wants $25k
    person.early_rrif_withdrawal_mode = "fixed"

    # Should only withdraw what's available
    assert calculate_early_rrif_withdrawal(person, 67) == 10000.0
```

Run tests:
```bash
pytest tests/test_early_rrif.py -v
```

---

### Integration Tests

Test full simulation with early RRIF withdrawals:

```python
def test_simulation_with_early_rrif():
    """Test that simulation correctly applies early RRIF withdrawals."""
    p1 = Person(
        name="Test Person",
        start_age=65,
        rrsp_balance=500000,
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=65,
        early_rrif_withdrawal_end_age=70,
        early_rrif_withdrawal_annual=25000,
        early_rrif_withdrawal_mode="fixed",
    )

    p2 = Person(name="Partner", start_age=65)

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=95,
    )

    results = simulate(household)

    # Check first year (age 65)
    year1 = results[0]
    assert year1.age_p1 == 65
    # Should have withdrawn $25,000
    assert year1.rrif_withdrawal_p1 == 25000.0

    # Check year 6 (age 70)
    year6 = results[5]
    assert year6.age_p1 == 70
    assert year6.rrif_withdrawal_p1 == 25000.0

    # Check year 7 (age 71 - should revert to minimums)
    year7 = results[6]
    assert year7.age_p1 == 71
    # Should use mandatory minimum instead
    assert year7.rrif_withdrawal_p1 > 0  # Will be RRIF minimum
```

---

## Manual Testing Scenarios

### Scenario 1: Income Splitting for Couples

**Setup:**
- Person 1: High income ($40K pension), $300K RRSP, no early withdrawals
- Person 2: No income, $400K RRSP, early withdrawal $30K/year (ages 63-70)

**Expected:**
- Person 2 withdraws $30K/year from ages 63-70
- Person 2's withdrawals are taxed at lower rates
- Total household tax is reduced

### Scenario 2: OAS Clawback Avoidance

**Setup:**
- Person with $1M RRSP
- Early withdrawal: $50K/year (ages 65-70)
- This reduces balance before mandatory minimums at 71

**Expected:**
- Withdrawals occur ages 65-70
- At age 71+, mandatory minimums are lower due to reduced balance
- Future OAS clawback is minimized

### Scenario 3: Fixed vs Percentage Comparison

**Setup:**
- Same person, two simulations
- Simulation A: Fixed $25K/year
- Simulation B: 5% of balance/year

**Expected:**
- Fixed: Exactly $25K each year
- Percentage: ~$25K first year, decreasing over time

---

## Deployment Checklist

- [ ] Person model updated with new fields
- [ ] `calculate_early_rrif_withdrawal` function added
- [ ] Withdrawal logic integrated into `simulate_year`
- [ ] Validation function added
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] API accepts new fields without errors
- [ ] Year-by-year results show withdrawals correctly
- [ ] Tax calculations include early withdrawals
- [ ] Documentation updated

---

## Expected Behavior Summary

1. **Before Age 71:**
   - If early withdrawals enabled: Use custom amount/percentage
   - If early withdrawals disabled: No forced withdrawals (unless needed for spending)

2. **Age 71+:**
   - Mandatory RRIF minimums apply
   - Early withdrawal settings are ignored

3. **Tax Treatment:**
   - Early withdrawals are 100% taxable (like regular RRIF withdrawals)
   - Reduces RRSP/RRIF balance
   - Counts as income for OAS clawback calculations

4. **Balance Management:**
   - Withdrawals reduce RRIF/RRSP balance
   - Cannot withdraw more than available
   - Withdrawals made at start of year (before growth)

---

## Troubleshooting

### Issue: Early withdrawals not appearing
**Solution**: Check that `enable_early_rrif_withdrawal` is `True` and age is within range

### Issue: Withdrawals continuing after age 70
**Solution**: Verify `early_rrif_withdrawal_end_age` is set correctly

### Issue: Percentage mode withdrawing wrong amount
**Solution**: Ensure percentage is in correct format (5.0 = 5%, not 0.05)

### Issue: Validation errors
**Solution**: Check that end_age < 71 and start_age < end_age

---

## Support for Frontend

Once implemented, the frontend will send requests like:

```json
{
  "p1": {
    "name": "Person 1",
    "start_age": 65,
    "rrsp_balance": 500000,
    "enable_early_rrif_withdrawal": true,
    "early_rrif_withdrawal_start_age": 65,
    "early_rrif_withdrawal_end_age": 70,
    "early_rrif_withdrawal_annual": 25000,
    "early_rrif_withdrawal_percentage": 5.0,
    "early_rrif_withdrawal_mode": "fixed"
  }
}
```

The backend should:
1. Accept these fields
2. Calculate withdrawals correctly
3. Return results with withdrawal details

---

## Completion

Once all steps are complete, the feature will be production-ready!

The frontend is already complete and waiting for the backend integration.

**Estimated Time**: 2-3 hours for experienced Python developer

**Priority**: High (addresses user churn)
