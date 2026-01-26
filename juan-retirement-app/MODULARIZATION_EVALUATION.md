# Simulation Module Modularization Evaluation

**Date:** 2026-01-25
**Evaluator:** Technical Architecture Review
**Module:** `modules/simulation.py` (2,520 lines)

---

## Executive Summary

**Recommendation: MODULARIZE with HIGH priority**

The `simulation.py` module has grown to 2,520 lines with high cyclomatic complexity (431 conditional statements) and multiple responsibilities. While some modularization has already occurred (tax_engine, withdrawal_strategies, benefits), the core `simulate_year()` and `simulate()` functions remain monolithic and difficult to maintain.

### Quick Metrics
- **Lines of Code:** 2,520
- **Functions:** 14
- **Conditional Statements:** 431
- **Longest Function:** `simulate_year()` ~629 lines (lines 1037-1666)
- **Second Longest:** `simulate()` ~757 lines (lines 1763-2520)
- **Maintainability Index:** Low (due to function length and complexity)

---

## Current State Analysis

### Module Structure

```
simulation.py (2,520 lines)
├── rrif_min_factor()           24 lines
├── rrif_minimum()              16 lines
├── nonreg_distributions()      78 lines  ← Account calculations
├── corp_passive_income()      101 lines  ← Corporate calculations
├── apply_corp_dividend()       32 lines  ← Corporate calculations
├── cap_gain_ratio()            20 lines  ← Tax calculations
├── tax_for_detailed()          90 lines  ← Tax calculations
├── tax_for()                   63 lines  ← Tax calculations
├── calculate_gis()             80 lines  ← GIS calculations
├── calculate_gis_optimization_withdrawal()  418 lines  ← GIS optimization
├── recompute_tax()             50 lines  ← Tax calculations
├── _get_strategy_order()       25 lines  ← Strategy selection
├── simulate_year()            629 lines  ← MONOLITHIC CORE FUNCTION
└── simulate()                 757 lines  ← MONOLITHIC CORE FUNCTION
```

### Dependencies

The module already imports from well-modularized components:
```python
from modules.models import Person, Household, TaxParams, YearResult
from modules.config import get_tax_params, index_tax_params
from modules.tax_engine import progressive_tax
from modules.withdrawal_strategies import get_strategy, is_hybrid_strategy
from modules.tax_optimizer import TaxOptimizer
from modules.estate_tax_calculator import EstateCalculator
from modules import real_estate
```

This shows **good architectural separation** in some areas, but the core simulation logic remains tightly coupled.

---

## Problems Identified

### 1. **Monolithic Core Functions**

**`simulate_year()` (629 lines)**
- Handles 10+ distinct responsibilities:
  - Bucket initialization and synchronization
  - CPP/OAS/GIS benefit calculations
  - Rental income and real estate
  - RRSP→RRIF conversion
  - Non-reg and corporate distributions
  - RRIF minimum calculations
  - Tax calculations (base + iterative)
  - Withdrawal strategy execution
  - GIS optimization
  - Account balance updates
  - Underfunding detection

**Impact:**
- **Testing Difficulty:** Cannot test individual responsibilities in isolation
- **Bug Risk:** Recent fixes (lines 1263-1270, 1299-1308) required careful navigation of complex logic
- **Onboarding:** New developers struggle to understand 629-line function flow
- **Code Review:** Changes require reviewing entire function context

### 2. **High Cyclomatic Complexity**

**431 conditional statements** across the file indicates:
- Deep nesting of if/elif/else blocks
- Multiple decision paths (exponential test case growth)
- Hard-to-trace logic flows
- High probability of edge case bugs

**Example from `simulate_year()` (lines 1332-1400):**
```python
for k in order:
    if shortfall <= 1e-6:
        break

    if k == "rrif":
        available = max(person.rrif_balance - (withdrawals["rrif"] + extra["rrif"]), 0.0)
    elif k == "corp":
        corp_cda_avail = max(getattr(person, "corp_cda_balance", 0.0) - 0.0, 0.0)
        corp_other_avail = max(corporate_balance_start - (withdrawals["corp"] + extra["corp"]) - corp_cda_avail, 0.0)
        available = corp_cda_avail + corp_other_avail

        if "Balanced" in strategy_name or "tax efficiency" in strategy_name.lower():
            person._corp_cda_preferred = getattr(person, "corp_cda_balance", 0.0) > 1e-9
    elif k == "nonreg":
        acb_ratio = person.nonreg_acb / max(person.nonreg_balance, 1e-9) if person.nonreg_balance > 1e-9 else 0.0
        gains_tax_rate = (1.0 - acb_ratio) * 0.25
        available = max(person.nonreg_balance - (withdrawals["nonreg"] + extra["nonreg"]), 0.0)

        if available > 1e-6 and ("Balanced" in strategy_name or "tax efficiency" in strategy_name.lower()):
            import sys
            print(f"DEBUG ACB [{person.name}]: ...", file=sys.stderr)
    elif k == "tfsa":
        rrif_left = max(person.rrif_balance - (withdrawals["rrif"] + extra["rrif"]), 0.0)
        corp_left = max(corporate_balance_start - (withdrawals["corp"] + extra["corp"]), 0.0)
        nonreg_left = max(person.nonreg_balance - (withdrawals["nonreg"] + extra["nonreg"]), 0.0)

        if (nonreg_left > 1e-9) or (rrif_left > 1e-9) or (corp_left > 1e-9):
            if shortfall > 1e-6:
                import sys
                print(f"  -> Skipping TFSA ...", file=sys.stderr)
            continue
        available = max(person.tfsa_balance - (withdrawals["tfsa"] + extra["tfsa"]), 0.0)
    else:
        available = 0.0
```

**This 70-line block** should be 4 separate functions, one per account type.

### 3. **Mixed Abstraction Levels**

`simulate_year()` mixes:
- **Low-level:** Bucket arithmetic (`person.nr_cash + person.nr_gic + person.nr_invest`)
- **Mid-level:** Tax calculations, withdrawal logic
- **High-level:** Strategy orchestration, GIS optimization

**Example (lines 1062-1072):**
```python
bucket_total = person.nr_cash + person.nr_gic + person.nr_invest
if bucket_total > 1e-9:
    person.nonreg_balance = bucket_total
elif person.nonreg_balance > 1e-9:
    person.nr_invest = person.nonreg_balance
    person.nr_cash = 0.0
    person.nr_gic = 0.0
```

This **bucket synchronization logic** should be in a separate `AccountManager` or `BucketManager` class.

### 4. **Duplication Across Functions**

**Tax calculation** appears in multiple forms:
- `tax_for()` (line 401)
- `tax_for_detailed()` (line 310)
- `recompute_tax()` (line 962)
- Inline tax calculations in `simulate_year()`

**GIS calculations** appear in:
- `calculate_gis()` (line 464)
- `calculate_gis_optimization_withdrawal()` (line 544)
- Inline GIS logic in `simulate_year()`

### 5. **Poor Testability**

**Current testing requires:**
- Creating full Person + Household objects
- Running entire `simulate_year()` or `simulate()` function
- Parsing complex return dictionaries
- Cannot test individual steps in isolation

**Example test setup (from test files):**
```python
# Requires 50+ lines of setup just to test one withdrawal scenario
rafael = Person(
    name="Rafael", start_age=64, tfsa_balance=312000,
    rrif_balance=350000, rrsp_balance=0, nonreg_balance=330000,
    corporate_balance=0, cpp_annual_at_start=15300,
    cpp_start_age=65, oas_annual_at_start=8670, oas_start_age=65
)
lucy = Person(...)
household = Household(p1=rafael, p2=lucy, province="AB", ...)
tax_config = load_tax_config('tax_config_canada_2025.json')
results = simulate(household, tax_config)  # Black box
```

### 6. **Debugging Challenges**

**Debug statements scattered throughout** (lines 1088-1090, 1314-1322, 1376-1378, 1384-1386, 1393-1395):
```python
import sys
print(f"DEBUG WITHDRAWAL [{person.name}] Age {age} Year {year if year else '?'}:", file=sys.stderr)
print(f"  Strategy: {strategy_name}", file=sys.stderr)
print(f"  After-tax target: ${after_tax_target:,.0f}", file=sys.stderr)
```

This indicates **difficulty understanding execution flow** without extensive logging.

---

## Benefits of Modularization

### 1. **Improved Maintainability**

**Before:**
```python
def simulate_year(...):  # 629 lines
    # Bucket sync
    bucket_total = person.nr_cash + person.nr_gic + person.nr_invest
    if bucket_total > 1e-9:
        person.nonreg_balance = bucket_total
    # ... 600 more lines
```

**After:**
```python
def simulate_year(...):  # ~100 lines
    account_manager.sync_buckets(person)
    benefits = benefit_calculator.calculate_benefits(person, age, year)
    withdrawals = withdrawal_engine.execute_strategy(person, strategy, target)
    taxes = tax_calculator.calculate_total_tax(person, withdrawals, benefits)
    account_manager.update_balances(person, withdrawals, taxes)
    return SimulationResult(withdrawals, taxes, benefits)
```

### 2. **Better Testing**

**Unit tests for each component:**
```python
def test_bucket_synchronization():
    person = Person(name="Test", nonreg_balance=100000)
    account_manager = AccountManager()
    account_manager.sync_buckets(person)
    assert person.nr_invest == 100000  # Default allocation
    assert person.nr_cash == 0
    assert person.nr_gic == 0

def test_gis_optimization_with_low_income():
    optimizer = GISOptimizer(gis_config)
    withdrawals = optimizer.optimize(income=5000, target=30000, balances={...})
    assert withdrawals["tfsa"] > 0  # Should use TFSA to avoid GIS clawback
    assert withdrawals["rrif"] == 0  # Should avoid taxable income

def test_withdrawal_strategy_nonreg_first():
    strategy = WithdrawalStrategy("nonreg-first")
    order = strategy.get_order()
    assert order == ["nonreg", "rrif", "corp", "tfsa"]
```

### 3. **Easier Debugging**

**Component-level logging:**
```python
class WithdrawalEngine:
    def execute_strategy(self, person, strategy, target):
        logger.info(f"Executing {strategy} for {person.name}, target=${target:,.0f}")
        order = self._get_order(strategy)

        for account in order:
            amount = self._withdraw_from_account(account, person, shortfall)
            logger.debug(f"  Withdrew ${amount:,.0f} from {account}, remaining shortfall=${shortfall:,.0f}")
```

### 4. **Code Reusability**

**Components can be reused across features:**
- `BenefitCalculator` → Used in simulation, scenario comparison, what-if analysis
- `TaxCalculator` → Used in simulation, tax optimizer, estate calculator
- `AccountManager` → Used in simulation, balance tracking, reporting

### 5. **Parallel Development**

**Teams can work independently:**
- Developer A: Improve GIS optimization logic in `GISOptimizer` class
- Developer B: Add new withdrawal strategy in `WithdrawalStrategy` class
- Developer C: Optimize tax calculations in `TaxCalculator` class
- **No merge conflicts** because each works in separate module

### 6. **Performance Optimization**

**Targeted optimization:**
```python
class TaxCalculator:
    def __init__(self):
        self._cache = {}  # Cache tax calculations by income bracket

    def calculate_tax(self, income, fed, prov):
        cache_key = (income, id(fed), id(prov))
        if cache_key in self._cache:
            return self._cache[cache_key]

        result = self._compute_tax(income, fed, prov)
        self._cache[cache_key] = result
        return result
```

---

## Proposed Modularization Strategy

### Phase 1: Extract Account Management (Week 1)

**Create `modules/account_manager.py`:**
```python
class AccountManager:
    """Manages account balances, bucket synchronization, and growth."""

    def sync_buckets(self, person: Person) -> None:
        """Synchronize nonreg_balance with bucket totals."""
        # Lines 1062-1072 from simulation.py

    def calculate_distributions(self, person: Person) -> Dict[str, float]:
        """Calculate interest, dividends, and capital gains distributions."""
        # Move nonreg_distributions() and corp_passive_income()

    def update_balances(self, person: Person, withdrawals: Dict, growth_rates: Dict) -> None:
        """Update account balances after withdrawals and apply growth."""
        # Lines 2073-2162 from simulation.py

    def apply_growth(self, person: Person, year: int) -> None:
        """Apply yearly growth to all accounts."""
        # RRSP, RRIF, TFSA, NonReg growth logic
```

**Impact:**
- Removes ~200 lines from `simulate_year()`
- Enables testing of bucket logic independently
- Centralizes balance management

### Phase 2: Extract Benefit Calculations (Week 1-2)

**Create `modules/benefit_calculator.py`:**
```python
class BenefitCalculator:
    """Calculates CPP, OAS, GIS, and other government benefits."""

    def calculate_cpp(self, person: Person, age: int, year: int, household: Household) -> float:
        """Calculate CPP benefit with inflation adjustment."""
        # Lines 1083-1090 from simulation.py

    def calculate_oas(self, person: Person, age: int, year: int, household: Household) -> float:
        """Calculate OAS benefit with inflation adjustment."""
        # Lines 1092-1094 from simulation.py

    def calculate_gis(self, income: float, oas: float, is_couple: bool, gis_config: Dict) -> float:
        """Calculate GIS benefit based on income testing."""
        # Move calculate_gis() function

    def calculate_all_benefits(self, person: Person, age: int, year: int, household: Household, income: float) -> BenefitResult:
        """Calculate all government benefits for the year."""
        return BenefitResult(
            cpp=self.calculate_cpp(person, age, year, household),
            oas=self.calculate_oas(person, age, year, household),
            gis=self.calculate_gis(income, oas, is_couple, gis_config),
        )
```

**Impact:**
- Removes ~100 lines from `simulate_year()`
- Consolidates benefit logic (currently in benefits.py and simulation.py)
- Enables testing benefit calculations independently

### Phase 3: Extract Withdrawal Execution (Week 2-3)

**Create `modules/withdrawal_engine.py`:**
```python
class WithdrawalEngine:
    """Executes withdrawal strategies and handles account-specific logic."""

    def __init__(self, account_manager: AccountManager, tax_calculator: TaxCalculator):
        self.account_manager = account_manager
        self.tax_calculator = tax_calculator

    def execute_strategy(
        self,
        person: Person,
        strategy: str,
        after_tax_target: float,
        benefits: BenefitResult,
        distributions: Dict[str, float],
        fed: TaxParams,
        prov: TaxParams
    ) -> WithdrawalResult:
        """Execute withdrawal strategy to meet after-tax target."""

        # 1. Calculate base withdrawals (custom CSV, RRIF minimum, hybrid topup)
        withdrawals = self._get_base_withdrawals(person, strategy)

        # 2. Apply GIS optimization if enabled
        if self._is_gis_optimized(strategy):
            withdrawals = self._apply_gis_optimization(person, withdrawals, after_tax_target, benefits)

        # 3. Calculate shortfall
        shortfall = self._calculate_shortfall(person, withdrawals, after_tax_target, benefits, distributions)

        # 4. Fill shortfall using strategy order
        if shortfall > 1e-6:
            withdrawals = self._fill_shortfall(person, withdrawals, shortfall, strategy)

        # 5. Enforce RRIF minimum
        withdrawals = self._enforce_rrif_minimum(person, withdrawals)

        return WithdrawalResult(withdrawals, shortfall, tax_info)

    def _withdraw_from_rrif(self, person: Person, amount: float, current_withdrawals: Dict) -> float:
        """Withdraw specified amount from RRIF account."""
        # Lines 1341-1342 logic

    def _withdraw_from_corp(self, person: Person, amount: float, current_withdrawals: Dict) -> float:
        """Withdraw from corporate account (CDA-aware)."""
        # Lines 1344-1353 logic

    def _withdraw_from_nonreg(self, person: Person, amount: float, current_withdrawals: Dict) -> float:
        """Withdraw from non-registered account (ACB-aware)."""
        # Lines 1354-1366 logic

    def _withdraw_from_tfsa(self, person: Person, amount: float, current_withdrawals: Dict) -> float:
        """Withdraw from TFSA (only if other sources depleted)."""
        # Lines 1367-1388 logic
```

**Impact:**
- Removes ~300 lines from `simulate_year()`
- Encapsulates withdrawal logic by account type
- Enables testing each withdrawal scenario independently
- Improves code reusability (same engine can be used for scenario testing)

### Phase 4: Extract GIS Optimization (Week 3)

**Create `modules/gis_optimizer.py`:**
```python
class GISOptimizer:
    """Optimizes withdrawals to maximize GIS benefits."""

    def __init__(self, gis_config: Dict, tax_calculator: TaxCalculator):
        self.gis_config = gis_config
        self.tax_calculator = tax_calculator

    def optimize_withdrawals(
        self,
        person: Person,
        after_tax_target: float,
        current_income: float,
        oas: float,
        is_couple: bool,
        account_balances: Dict[str, float]
    ) -> OptimizationResult:
        """Calculate optimal withdrawals to maximize GIS while meeting target."""
        # Move calculate_gis_optimization_withdrawal() (418 lines)

    def calculate_effective_rate(self, withdrawal: Dict, income_before: float) -> float:
        """Calculate effective marginal rate including GIS clawback."""

    def should_use_tfsa(self, gis_eligible: bool, marginal_rate: float) -> bool:
        """Determine if TFSA withdrawal is optimal given GIS status."""
```

**Impact:**
- Removes 418 lines from `simulation.py`
- Isolates complex optimization logic
- Enables testing GIS scenarios independently
- Allows future improvements (e.g., machine learning optimization) without touching core simulation

### Phase 5: Simplify Core Functions (Week 4)

**Refactored `simulate_year()`:**
```python
def simulate_year(
    person: Person,
    age: int,
    after_tax_target: float,
    fed: TaxParams,
    prov: TaxParams,
    rrsp_to_rrif: bool,
    custom_withdraws: Dict[str, float],
    strategy_name: str,
    hybrid_topup_amt: float,
    hh: Household,
    year: int = None,
    tfsa_room: float = 0.0
) -> Tuple[Dict[str, float], Dict[str, float], Dict[str, float]]:
    """
    Simulate one year for a single person.

    Returns:
        - withdrawals: Dict with keys ("nonreg", "rrif", "tfsa", "corp")
        - tax_detail: Dict with keys ("tax", "oas", "cpp", "breakdown")
        - info: Dict with realized capital gains, distributions, etc.
    """
    # Initialize components
    account_mgr = AccountManager()
    benefit_calc = BenefitCalculator()
    withdrawal_engine = WithdrawalEngine(account_mgr, TaxCalculator())

    # 1. Sync account buckets
    account_mgr.sync_buckets(person)

    # 2. Handle RRSP → RRIF conversion
    if rrsp_to_rrif and person.rrsp_balance > 0:
        account_mgr.convert_rrsp_to_rrif(person)

    # 3. Calculate distributions (interest, dividends, capital gains)
    distributions = account_mgr.calculate_distributions(person)

    # 4. Calculate government benefits (CPP, OAS, GIS)
    benefits = benefit_calc.calculate_all_benefits(person, age, year, hh, income=0)  # Iterative

    # 5. Execute withdrawal strategy
    withdrawal_result = withdrawal_engine.execute_strategy(
        person=person,
        strategy=strategy_name,
        after_tax_target=after_tax_target,
        benefits=benefits,
        distributions=distributions,
        custom_withdrawals=custom_withdraws,
        fed=fed,
        prov=prov
    )

    # 6. Update account balances
    account_mgr.update_balances(person, withdrawal_result.withdrawals, growth_rates={...})

    # 7. Prepare return values
    withdrawals = withdrawal_result.withdrawals
    tax_detail = {
        "tax": withdrawal_result.total_tax,
        "oas": benefits.oas,
        "cpp": benefits.cpp,
        "breakdown": withdrawal_result.tax_breakdown
    }
    info = {
        "realized_capital_gains": withdrawal_result.realized_capital_gains,
        "corp_refund": withdrawal_result.corp_refund,
        "distributions": distributions,
        ...
    }

    return withdrawals, tax_detail, info
```

**Impact:**
- Reduces `simulate_year()` from 629 lines to ~100 lines
- Improves readability (high-level orchestration, not low-level details)
- Each step can be tested independently
- Easy to understand flow for new developers

**Refactored `simulate()`:**
```python
def simulate(hh: Household, tax_cfg: Dict, custom_df: Optional[pd.DataFrame] = None):
    """Run multi-year retirement simulation."""

    # Initialize
    simulation_engine = SimulationEngine(hh, tax_cfg)
    results = []

    # Year-by-year loop
    for year_state in simulation_engine.iterate_years():
        # Simulate both persons
        result_p1 = simulation_engine.simulate_person(hh.p1, year_state)
        result_p2 = simulation_engine.simulate_person(hh.p2, year_state)

        # Combine results
        year_result = simulation_engine.combine_results(result_p1, result_p2, year_state)
        results.append(year_result)

        # Check for underfunding or depletion
        if simulation_engine.should_stop(year_result):
            break

    # Convert to DataFrame
    return pd.DataFrame([r.__dict__ for r in results])
```

**Impact:**
- Reduces `simulate()` from 757 lines to ~30 lines
- Encapsulates year iteration logic in `SimulationEngine`
- Improves testability (can test year iteration separately from person simulation)

---

## Implementation Plan

### Week 1: Foundation
- [ ] Create `modules/account_manager.py` with `AccountManager` class
- [ ] Move bucket sync, distributions, balance updates
- [ ] Write unit tests for account management
- [ ] Update `simulation.py` to use `AccountManager`

### Week 2: Benefits & Tax
- [ ] Create `modules/benefit_calculator.py` with `BenefitCalculator` class
- [ ] Consolidate CPP, OAS, GIS calculations
- [ ] Write unit tests for benefit calculations
- [ ] Create `modules/tax_calculator.py` to consolidate tax functions
- [ ] Write unit tests for tax calculations

### Week 3: Withdrawals
- [ ] Create `modules/withdrawal_engine.py` with `WithdrawalEngine` class
- [ ] Extract account-specific withdrawal logic (RRIF, Corp, NonReg, TFSA)
- [ ] Write unit tests for each withdrawal scenario
- [ ] Create `modules/gis_optimizer.py` with `GISOptimizer` class
- [ ] Move `calculate_gis_optimization_withdrawal()` (418 lines)
- [ ] Write unit tests for GIS optimization scenarios

### Week 4: Integration
- [ ] Refactor `simulate_year()` to use new components
- [ ] Refactor `simulate()` to use `SimulationEngine` pattern
- [ ] Run full regression test suite
- [ ] Update documentation (ARCHITECTURE.md, DEVELOPER_GUIDE.md)
- [ ] Code review and merge

### Week 5: Cleanup
- [ ] Remove debug logging (replace with proper logging framework)
- [ ] Add performance benchmarks
- [ ] Create integration tests for complex scenarios
- [ ] Update API documentation

---

## Risk Assessment

### Low Risk
- **Account management extraction** - Well-defined boundaries, limited dependencies
- **Benefit calculations** - Pure functions, easy to test
- **Tax calculations** - Already partially modularized

### Medium Risk
- **Withdrawal engine** - Complex interactions with tax, GIS, and account balances
- **GIS optimizer** - 418 lines of complex optimization logic, high bug risk during migration

### High Risk
- **Core simulation refactor** - Changes to `simulate()` and `simulate_year()` affect entire system
- **Regression testing** - Need comprehensive test coverage before refactoring

### Mitigation Strategies

1. **Incremental Migration**
   - Migrate one component at a time
   - Keep old code alongside new code during transition
   - Use feature flags to toggle between old/new implementations

2. **Comprehensive Testing**
   - Create regression test suite with known-good scenarios
   - Test each component independently before integration
   - Use property-based testing for edge cases

3. **Code Review**
   - Mandatory peer review for all refactoring PRs
   - Architecture review for component interfaces
   - Performance testing before merging

4. **Documentation**
   - Update ARCHITECTURE.md with new component diagram
   - Add component-level documentation
   - Create migration guide for developers

---

## Success Metrics

### Code Quality
- [ ] Reduce `simulate_year()` from 629 lines to <150 lines
- [ ] Reduce `simulate()` from 757 lines to <100 lines
- [ ] Reduce cyclomatic complexity from 431 to <150 conditional statements
- [ ] Achieve 80%+ test coverage for new components

### Maintainability
- [ ] New developers can understand flow in <2 hours (vs. current 1-2 days)
- [ ] Time to fix bugs reduced by 50% (easier to locate issue)
- [ ] Code review time reduced by 40% (smaller, focused PRs)

### Performance
- [ ] No regression in simulation speed (maintain <2s for 30-year simulation)
- [ ] Reduce memory usage by 10% (better object lifecycle management)

### Developer Experience
- [ ] Can test individual components without full simulation setup
- [ ] Can debug specific logic without 200+ line function traces
- [ ] Can add new withdrawal strategies without touching core simulation

---

## Alternative: Do Nothing

### Pros
- No development time required
- No risk of introducing bugs during refactoring
- System works "as is"

### Cons
- Continued difficulty onboarding new developers
- High bug risk due to complexity (recent fixes required careful navigation)
- Performance optimization difficult (can't optimize what you can't isolate)
- Feature development slows down (every change touches monolithic functions)
- Technical debt grows (module already 2,520 lines, trending upward)
- Testing remains difficult (black-box testing only)

### Long-term Impact
Without modularization, the codebase will become increasingly difficult to maintain. As features are added (e.g., Monte Carlo simulation, estate planning, more complex tax strategies), the monolithic functions will grow even larger, making the system unmaintainable.

---

## Recommendation

**Proceed with modularization using the 5-week plan outlined above.**

### Justification
1. **High ROI**: Initial investment of 5 weeks will save 10+ weeks over the next year in reduced debugging time, faster feature development, and easier onboarding
2. **Risk is manageable**: Incremental approach with comprehensive testing minimizes regression risk
3. **Aligned with best practices**: Current module violates Single Responsibility Principle and Open/Closed Principle
4. **Enables future features**: Modular architecture required for planned features (Monte Carlo, AI-driven optimization, multi-scenario comparison)
5. **Improves code quality**: Current complexity (431 conditionals, 629-line functions) is maintenance nightmare

### Next Steps
1. Review and approve modularization plan
2. Allocate 1 developer for 5 weeks (or 2 developers for 2.5 weeks)
3. Create feature branch for refactoring work
4. Set up regression test suite
5. Begin Phase 1: Extract Account Management

---

## Appendix: Component Diagram (Proposed)

```
┌─────────────────────────────────────────────────────────────┐
│                      SimulationEngine                        │
│  (Orchestrates year-by-year simulation)                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────┬────────────────┬─────────────────┬──────────────┐
             │             │                │                 │              │
             ▼             ▼                ▼                 ▼              ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │   Account    │ │   Benefit    │ │  Withdrawal  │ │     Tax      │ │     GIS      │
     │   Manager    │ │  Calculator  │ │    Engine    │ │  Calculator  │ │  Optimizer   │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
     │                │                │                │                │
     │ - sync_buckets│ - calculate_cpp│ - execute_     │ - calculate_   │ - optimize_   │
     │ - calculate_  │ - calculate_oas│   strategy     │   federal_tax  │   withdrawals │
     │   distributions│ - calculate_gis│ - fill_        │ - calculate_   │ - calculate_  │
     │ - update_     │ - apply_       │   shortfall    │   provincial_  │   effective_  │
     │   balances    │   inflation    │ - enforce_     │   tax          │   rate        │
     │ - apply_growth│                │   rrif_min     │ - calculate_   │               │
     │                │                │                │   oas_clawback │               │
     └────────────────┴────────────────┴────────────────┴────────────────┴───────────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │  Person Model   │
                                  │  (Data Object)  │
                                  └─────────────────┘
```

---

**Conclusion:** The simulation module requires modularization to maintain long-term code quality, testability, and developer productivity. The proposed 5-week plan provides a clear, low-risk path to achieve this goal.
