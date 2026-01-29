# GIC Calculator Integration Plan

**Module**: `modules/gic_calculator.py`
**Target**: `modules/simulation.py` and `api/routes/simulation.py`
**Date**: January 29, 2026

---

## Overview

The `gic_calculator.py` module provides GIC (Guaranteed Investment Certificate) maturity calculations and event processing for retirement simulations. This document outlines how to integrate it into the main simulation engine.

---

## Module API

### Core Functions

#### 1. `calculate_gic_maturity_value(principal, annual_rate, term_years, compounding_frequency)`

Calculates GIC maturity value using compound interest formula.

**Returns**: Float (maturity value in dollars)

**Example**:
```python
from modules.gic_calculator import calculate_gic_maturity_value

maturity_value = calculate_gic_maturity_value(
    principal=50000,
    annual_rate=4.5,
    term_years=5,
    compounding_frequency="annual"
)
# Returns: 62309.10
```

#### 2. `process_gic_maturity_events(gic_assets, current_year, simulation_age)`

Processes all GIC assets and identifies maturity events for the current year.

**Returns**: Dict with keys:
- `matured_gics`: List of GICs that matured this year
- `total_matured_value`: Total cash available from maturities
- `reinvestment_instructions`: How to handle matured funds
- `locked_gics`: GICs that haven't matured yet

**Example**:
```python
from modules.gic_calculator import process_gic_maturity_events

gics = [
    {
        "name": "TD 5-Year GIC",
        "balance": 50000,
        "gicMaturityDate": "2029-01-15T00:00:00Z",
        "gicInterestRate": 4.5,
        "gicTermMonths": 60,
        "gicCompoundingFrequency": "annual",
        "gicReinvestStrategy": "auto-renew",
        "owner": "person1"
    }
]

result = process_gic_maturity_events(gics, 2029, 67)
# result["matured_gics"][0]["total"] = 62309.10
```

#### 3. `get_gic_balance_locked(gic_assets, current_year)`

Gets total GIC balance that is still locked (not yet matured).

**Returns**: Float (locked balance in dollars)

---

## Integration Steps

### Step 1: Import GIC Calculator in simulation.py

```python
# At top of modules/simulation.py
from modules.gic_calculator import (
    process_gic_maturity_events,
    get_gic_balance_locked
)
```

### Step 2: Add GIC Assets to API Input

The simulation API needs to receive GIC assets from the database.

**File**: `api/routes/simulation.py`

**Modification**:
```python
# In /simulate endpoint
@router.post("/simulate")
async def simulate_endpoint(request: SimulationRequest):
    # ... existing code to fetch user data ...

    # NEW: Fetch GIC assets from database
    gic_assets_p1 = fetch_user_gic_assets(user_id, owner="person1")
    gic_assets_p2 = fetch_user_gic_assets(user_id, owner="person2") if has_partner else []

    # Pass GIC assets to simulation
    household = Household(
        p1=Person(
            # ... existing fields ...
            gic_assets=gic_assets_p1  # NEW
        ),
        p2=Person(
            # ... existing fields ...
            gic_assets=gic_assets_p2  # NEW
        ) if has_partner else None
    )
```

### Step 3: Add GIC Assets to Person Model

**File**: `modules/models.py`

**Modification**:
```python
@dataclass
class Person:
    """One individual in the household."""
    name: str
    start_age: int

    # ... existing fields ...

    # NEW: GIC assets (List of dicts from database)
    gic_assets: List[Dict[str, Any]] = field(default_factory=list)
```

### Step 4: Process GIC Maturities in Simulation Loop

**File**: `modules/simulation.py`

**Modification in `simulate_year()` function**:

```python
def simulate_year(
    person: Person,
    age: int,
    year_idx: int,
    household: Household,
    # ... other params ...
) -> YearResult:
    """
    Simulate one year for one person.
    """
    # ... existing code ...

    # NEW: Process GIC maturity events at start of year
    current_calendar_year = household.start_year + year_idx
    gic_result = process_gic_maturity_events(
        gic_assets=person.gic_assets,
        current_year=current_calendar_year,
        simulation_age=age
    )

    # Handle matured GIC funds
    for instruction in gic_result["reinvestment_instructions"]:
        if instruction["action"] == "cash-out":
            # Add to liquid assets (will be used for expenses)
            person.nonreg_balance += instruction["amount"]

        elif instruction["action"] == "transfer-to-tfsa":
            # Move to TFSA (if room available)
            available_tfsa_room = calculate_tfsa_room(person, year_idx)
            tfsa_contribution = min(instruction["amount"], available_tfsa_room)
            person.tfsa_balance += tfsa_contribution
            # Remainder goes to non-reg
            remainder = instruction["amount"] - tfsa_contribution
            if remainder > 0:
                person.nonreg_balance += remainder

        elif instruction["action"] == "transfer-to-nonreg":
            # Move to non-registered account
            person.nonreg_balance += instruction["amount"]

        elif instruction["action"] == "auto-renew":
            # Create new GIC
            new_gic = instruction.get("new_gic")
            if new_gic:
                person.gic_assets.append(new_gic)

    # Update GIC assets list (remove matured, add renewed)
    person.gic_assets = [
        gic for gic in gic_result["locked_gics"]
    ] + [
        instr.get("new_gic")
        for instr in gic_result["reinvestment_instructions"]
        if instr.get("new_gic") is not None
    ]

    # ... rest of existing simulation code ...

    # NEW: Add GIC maturity events to year result
    year_result = YearResult(
        # ... existing fields ...
        gic_maturity_events=gic_result["matured_gics"]  # NEW
    )

    return year_result
```

### Step 5: Update YearResult Model

**File**: `modules/models.py`

**Modification**:
```python
@dataclass
class YearResult:
    """Results for one simulated year."""
    # ... existing fields ...

    # NEW: GIC maturity events
    gic_maturity_events: List[Dict[str, Any]] = field(default_factory=list)
```

### Step 6: Update Withdrawal Strategies to Exclude Locked GICs

GICs that haven't matured yet should not be considered available for withdrawals.

**File**: `modules/withdrawal_strategies.py`

**Modification**:
```python
from modules.gic_calculator import get_gic_balance_locked

def calculate_available_balance(person: Person, current_year: int) -> Dict[str, float]:
    """
    Calculate available balances for withdrawal.
    """
    # GIC balance locked (not available until maturity)
    locked_gic = get_gic_balance_locked(person.gic_assets, current_year)

    return {
        "rrif": person.rrif_balance,
        "tfsa": person.tfsa_balance,
        "nonreg": person.nonreg_balance - locked_gic,  # Exclude locked GICs
        "corporate": person.corporate_balance
    }
```

---

## Testing Plan

### Unit Tests

**File**: `tests/test_gic_calculator.py`

```python
import pytest
from modules.gic_calculator import (
    calculate_gic_maturity_value,
    process_gic_maturity_events,
    get_gic_balance_locked
)

def test_gic_maturity_annual_compounding():
    """Test GIC maturity with annual compounding."""
    maturity_value = calculate_gic_maturity_value(
        principal=50000,
        annual_rate=4.5,
        term_years=5,
        compounding_frequency="annual"
    )
    assert abs(maturity_value - 62309.10) < 0.01

def test_gic_maturity_semi_annual():
    """Test GIC maturity with semi-annual compounding."""
    maturity_value = calculate_gic_maturity_value(
        principal=20000,
        annual_rate=3.8,
        term_years=2,
        compounding_frequency="semi-annual"
    )
    assert abs(maturity_value - 21559.70) < 0.01

def test_gic_maturity_event_processing():
    """Test GIC maturity event processing."""
    gics = [{
        "name": "Test GIC",
        "balance": 50000,
        "gicMaturityDate": "2029-01-15T00:00:00Z",
        "gicInterestRate": 4.5,
        "gicTermMonths": 60,
        "gicCompoundingFrequency": "annual",
        "gicReinvestStrategy": "auto-renew",
        "owner": "person1"
    }]

    result = process_gic_maturity_events(gics, 2029, 67)

    assert len(result["matured_gics"]) == 1
    assert abs(result["matured_gics"][0]["total"] - 62309.10) < 0.01
    assert result["matured_gics"][0]["reinvest_strategy"] == "auto-renew"

def test_locked_gic_balance():
    """Test locked GIC balance calculation."""
    gics = [
        {"balance": 50000, "gicMaturityDate": "2030-01-01T00:00:00Z"},
        {"balance": 20000, "gicMaturityDate": "2026-01-01T00:00:00Z"}  # Already matured
    ]

    locked = get_gic_balance_locked(gics, 2027)
    assert locked == 50000.0
```

### Integration Tests

**Test Scenario 1: Single GIC Maturity (Cash Out)**
- User has 1 GIC: $50,000, matures 2029, cash-out strategy
- Run simulation through 2029
- Verify GIC maturity event appears in year 2029
- Verify $62,309 added to liquid assets
- Verify GIC no longer in asset list after maturity

**Test Scenario 2: GIC Ladder (Auto-Renew)**
- User has 5 GICs: $20,000 each, matures 2026-2030, auto-renew strategy
- Run simulation through 2030
- Verify 1 GIC matures each year
- Verify new GICs created with maturity value
- Verify ladder continues beyond 2030

**Test Scenario 3: TFSA Transfer**
- User has 1 GIC: $30,000, matures 2027, transfer-to-tfsa strategy
- Run simulation through 2027
- Verify GIC maturity event
- Verify funds transferred to TFSA (if room available)
- Verify excess goes to non-reg if TFSA full

---

## Deployment Checklist

- [ ] `gic_calculator.py` module created and tested
- [ ] Person model updated with `gic_assets` field
- [ ] YearResult model updated with `gic_maturity_events` field
- [ ] simulation.py updated to process GIC maturities
- [ ] withdrawal_strategies.py updated to exclude locked GICs
- [ ] API route updated to fetch GIC assets from database
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Documentation updated
- [ ] Deploy to production
- [ ] Test with rightfooty218@gmail.com

---

## Future Enhancements

### Phase 4 (Future Sprint): GIC Rate API Integration

**Goal**: Integrate live GIC rates from banks when auto-renewing

**Providers**:
- ratehub.ca API
- bankrate.ca API
- Bank of Canada interest rate data

**Implementation**:
```python
from modules.gic_rate_api import get_current_gic_rates

def apply_reinvestment_strategy(maturity_event, current_year, simulation_age):
    if strategy == "auto-renew":
        # Get current market rates
        current_rates = get_current_gic_rates(
            term_years=maturity_event["term_years"],
            province="ON"
        )

        instruction["new_gic"]["gicInterestRate"] = current_rates["best_rate"]
```

### Phase 5 (Future Sprint): Early Withdrawal Penalties

**Goal**: Model GIC early withdrawal penalties

**Implementation**:
- Add `gicEarlyWithdrawalPenalty` field (e.g., 3 months interest)
- Add `allow_early_withdrawal()` function
- Integrate into withdrawal strategies when cash needed

---

**Document Owner**: Development Team
**Status**: ✅ GIC Calculator Module Complete
**Next Steps**: Integrate into simulation.py
**Date**: January 29, 2026
