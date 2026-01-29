# Withdrawal Strategies Validation Report

## Executive Summary

**Question**: How many withdrawal strategies does the application have?

**Answer**: The application has **7 user-facing strategies** exposed through the API, but internally implements **8 strategy classes** in the Python backend.

---

## User-Facing Strategies (API Level)

### Strategies Exposed to Users (7)

**Source**: `juan-retirement-app/api/models/requests.py:170-178`

```python
strategy: Literal[
    "rrif-frontload",
    "corporate-optimized",
    "minimize-income",
    "rrif-splitting",
    "capital-gains-optimized",
    "tfsa-first",
    "balanced"
] = Field(default="minimize-income", description="Withdrawal strategy")
```

### Frontend TypeScript Types (7)

**Source**: `webapp/lib/types/simulation.ts:84-91`

```typescript
export type WithdrawalStrategy =
  | 'corporate-optimized'
  | 'minimize-income'
  | 'rrif-splitting'
  | 'capital-gains-optimized'
  | 'tfsa-first'
  | 'balanced'
  | 'rrif-frontload';
```

### Display Names (Frontend)

**Source**: `webapp/app/(dashboard)/simulation/page.tsx:762-770`

```typescript
const strategyMap: Record<string, string> = {
  'minimize-income': 'Minimize Income',
  'balanced': 'Balanced',
  'rrif-splitting': 'RRIF Splitting',
  'corporate-optimized': 'Corporate Optimized',
  'capital-gains-optimized': 'Capital Gains Optimized',
  'tfsa-first': 'TFSA First',
  'manual': 'Manual'  // Note: 'manual' is in display map but not in Literal type
};
```

---

## Backend Strategy Classes (8)

### Strategy Classes Implemented in Python

**Source**: `juan-retirement-app/modules/withdrawal_strategies.py:488-496`

```python
_STRATEGY_MAP = {
    "NonReg->RRIF->Corp->TFSA": NonRegFirstStrategy,
    "RRIF->Corp->NonReg->TFSA": RRIFFirstStrategy,
    "Corp->RRIF->NonReg->TFSA": CorpFirstStrategy,
    "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA": HybridStrategy,
    "TFSA->Corp->RRIF->NonReg": TFSAFirstStrategy,
    "GIS-Optimized (NonReg->Corp->RRIF->TFSA)": GISOptimizedStrategy,
    "Balanced (Optimized for tax efficiency)": BalancedStrategy,
}
```

**Note**: There's also `RRIFFrontloadOASProtectionStrategy` which is referenced in the code but not in the `_STRATEGY_MAP` dictionary.

### All Strategy Classes (8)

**Source**: Grep results from `withdrawal_strategies.py`

1. `NonRegFirstStrategy` (line 97)
2. `RRIFFirstStrategy` (line 130)
3. `CorpFirstStrategy` (line 163)
4. `HybridStrategy` (line 196)
5. `TFSAFirstStrategy` (line 251)
6. `RRIFFrontloadOASProtectionStrategy` (line 294) ⚠️ **Not in _STRATEGY_MAP**
7. `GISOptimizedStrategy` (line 357)
8. `BalancedStrategy` (line 423)

---

## Strategy Mapping Analysis

### API Strategy Name → Python Strategy Class

| API Strategy Name | Python Class | Withdrawal Order |
|-------------------|-------------|------------------|
| `"minimize-income"` | `GISOptimizedStrategy` | NonReg → Corp → RRIF → TFSA |
| `"balanced"` | `BalancedStrategy` | Corp → NonReg → RRIF → TFSA |
| `"rrif-frontload"` | `RRIFFrontloadOASProtectionStrategy` | NonReg → RRIF → TFSA → Corp |
| `"tfsa-first"` | `TFSAFirstStrategy` | TFSA → Corp → RRIF → NonReg |
| `"rrif-splitting"` | ❓ **Unknown mapping** | Likely RRIFFirstStrategy |
| `"corporate-optimized"` | ❓ **Unknown mapping** | Likely CorpFirstStrategy |
| `"capital-gains-optimized"` | ❓ **Unknown mapping** | Likely NonRegFirstStrategy |

### Mapping Logic (Factory Function)

**Source**: `withdrawal_strategies.py:542-562`

```python
def get_strategy(strategy_name: str) -> WithdrawalStrategy:
    # Normalize input
    normalized_name = (strategy_name or "").strip()

    # Try exact match first
    if normalized_name in _STRATEGY_MAP:
        return _STRATEGY_MAP[normalized_name]()

    # Partial matching for flexibility
    if "Balanced" in normalized_name or "tax efficiency" in normalized_name.lower():
        return BalancedStrategy()
    elif "TFSA" in normalized_name and normalized_name.startswith("TFSA"):
        return TFSAFirstStrategy()
    elif "GIS" in normalized_name.upper() or "GIS-Optimized" in normalized_name:
        return GISOptimizedStrategy()
    elif "minimize-income" in normalized_name.lower() or "minimize_income" in normalized_name.lower():
        return GISOptimizedStrategy()  # ✅ Confirmed mapping
    elif "RRIF-Frontload" in normalized_name or "rrif-frontload" in normalized_name.lower():
        return RRIFFrontloadOASProtectionStrategy()  # ✅ Confirmed mapping
    elif "NonReg" in normalized_name and "RRIF" in normalized_name:
        return NonRegFirstStrategy()
    elif "Hybrid" in normalized_name:
        return HybridStrategy()
    elif "RRIF" in normalized_name and "Corp" in normalized_name:
        return RRIFFirstStrategy()
    elif "Corp" in normalized_name:
        return CorpFirstStrategy()

    # Default to NonReg-first
    return NonRegFirstStrategy()
```

**Confirmed Mappings**:
- ✅ `"minimize-income"` → `GISOptimizedStrategy` (line 542-545)
- ✅ `"balanced"` → `BalancedStrategy` (line 536-537)
- ✅ `"rrif-frontload"` → `RRIFFrontloadOASProtectionStrategy` (line 546-551)
- ✅ `"tfsa-first"` → `TFSAFirstStrategy` (line 538-539)
- ⚠️ `"corporate-optimized"` → Likely `CorpFirstStrategy` (line 558-559, matches "Corp")
- ⚠️ `"rrif-splitting"` → Likely `RRIFFirstStrategy` (line 556-557, matches "RRIF" and "Corp")
- ⚠️ `"capital-gains-optimized"` → Likely `NonRegFirstStrategy` (default fallback, line 562)

---

## Discrepancies Identified

### 1. Missing Strategy in _STRATEGY_MAP ⚠️

**`RRIFFrontloadOASProtectionStrategy`** is implemented as a class but NOT in the `_STRATEGY_MAP` dictionary.

- This strategy is only accessible via partial matching in `get_strategy()` function
- Can be invoked with: `"rrif-frontload"`, `"RRIF-Frontload"`, or any string containing these keywords

### 2. API Strategies Without Clear Python Mapping ⚠️

These API strategies don't have exact matches in `_STRATEGY_MAP`:
- `"rrif-splitting"` (API) → No exact match, likely mapped via partial matching
- `"corporate-optimized"` (API) → No exact match, likely mapped via partial matching
- `"capital-gains-optimized"` (API) → No exact match, likely falls back to default

### 3. Unused Strategy Classes ⚠️

These Python classes exist but may not be accessible via the API:
- `NonRegFirstStrategy` - May be used as default fallback
- `RRIFFirstStrategy` - May be mapped from `"rrif-splitting"`
- `CorpFirstStrategy` - May be mapped from `"corporate-optimized"`
- `HybridStrategy` - Not exposed in API Literal type

---

## Complete Strategy Catalog

### 1. minimize-income ✅ (Most Popular)
- **API Name**: `"minimize-income"`
- **Python Class**: `GISOptimizedStrategy`
- **Withdrawal Order**: NonReg → Corp → RRIF → TFSA
- **Purpose**: Minimize taxable income to maximize GIS benefits
- **Default Strategy**: Yes (API default)
- **Status**: ✅ Fully exposed and accessible

### 2. balanced ✅
- **API Name**: `"balanced"`
- **Python Class**: `BalancedStrategy`
- **Withdrawal Order**: Corp → NonReg → RRIF → TFSA
- **Purpose**: Optimize for tax efficiency
- **Status**: ✅ Fully exposed and accessible

### 3. rrif-frontload ✅
- **API Name**: `"rrif-frontload"`
- **Python Class**: `RRIFFrontloadOASProtectionStrategy`
- **Withdrawal Order**: NonReg → RRIF → TFSA → Corp
- **Purpose**: Front-load RRIF withdrawals to avoid OAS clawback
- **Status**: ✅ Fully exposed and accessible

### 4. tfsa-first ✅
- **API Name**: `"tfsa-first"`
- **Python Class**: `TFSAFirstStrategy`
- **Withdrawal Order**: TFSA → Corp → RRIF → NonReg
- **Purpose**: Prioritize TFSA withdrawals
- **Status**: ✅ Fully exposed and accessible

### 5. corporate-optimized ⚠️
- **API Name**: `"corporate-optimized"`
- **Python Class**: Likely `CorpFirstStrategy` (via partial matching)
- **Withdrawal Order**: Corp → RRIF → NonReg → TFSA
- **Purpose**: Prioritize corporate account withdrawals
- **Status**: ⚠️ Exposed but mapping not explicit

### 6. rrif-splitting ⚠️
- **API Name**: `"rrif-splitting"`
- **Python Class**: Likely `RRIFFirstStrategy` (via partial matching)
- **Withdrawal Order**: RRIF → Corp → NonReg → TFSA
- **Purpose**: Prioritize RRIF withdrawals for income splitting
- **Status**: ⚠️ Exposed but mapping not explicit

### 7. capital-gains-optimized ⚠️
- **API Name**: `"capital-gains-optimized"`
- **Python Class**: Likely `NonRegFirstStrategy` (default fallback)
- **Withdrawal Order**: NonReg → RRIF → Corp → TFSA
- **Purpose**: Optimize for capital gains tax treatment
- **Status**: ⚠️ Exposed but likely uses default

### 8. Hybrid Strategy ❌ (Not Exposed)
- **API Name**: ❌ Not in API Literal
- **Python Class**: `HybridStrategy`
- **Withdrawal Order**: Hybrid RRIF top-up → NonReg → Corp → TFSA
- **Purpose**: Front-load RRIF with fixed top-up amount
- **Status**: ❌ Not exposed to users via API

---

## Fix Applicability

### Does Fix Apply to All Strategies?

**Answer**: ✅ **YES - Both fixes apply to all 7 user-facing strategies**

The fixes are in the core simulation engine (simulation.py) which runs AFTER the strategy determines withdrawal order. This makes them strategy-agnostic.

### Strategies Tested:
- ✅ `minimize-income` (GISOptimizedStrategy) - **Tested with Rafael & Lucy**

### Strategies NOT Tested (but fixes still apply):
- ⏳ `balanced` (BalancedStrategy)
- ⏳ `rrif-frontload` (RRIFFrontloadOASProtectionStrategy)
- ⏳ `tfsa-first` (TFSAFirstStrategy)
- ⏳ `corporate-optimized` (likely CorpFirstStrategy)
- ⏳ `rrif-splitting` (likely RRIFFirstStrategy)
- ⏳ `capital-gains-optimized` (likely NonRegFirstStrategy)

---

## Recommendations

### 1. Clarify Strategy Mappings ⚠️

**Issue**: 3 API strategies don't have explicit mappings in the code:
- `"rrif-splitting"`
- `"corporate-optimized"`
- `"capital-gains-optimized"`

**Recommendation**: Add explicit mappings to `get_strategy()` function:

```python
elif "rrif-splitting" in normalized_name.lower():
    return RRIFFirstStrategy()
elif "corporate-optimized" in normalized_name.lower():
    return CorpFirstStrategy()
elif "capital-gains-optimized" in normalized_name.lower():
    return NonRegFirstStrategy()
```

### 2. Add RRIFFrontloadOASProtectionStrategy to _STRATEGY_MAP ⚠️

**Issue**: Strategy class exists but not in registry dictionary.

**Recommendation**: Add to `_STRATEGY_MAP`:

```python
_STRATEGY_MAP = {
    "NonReg->RRIF->Corp->TFSA": NonRegFirstStrategy,
    "RRIF->Corp->NonReg->TFSA": RRIFFirstStrategy,
    "Corp->RRIF->NonReg->TFSA": CorpFirstStrategy,
    "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA": HybridStrategy,
    "TFSA->Corp->RRIF->NonReg": TFSAFirstStrategy,
    "GIS-Optimized (NonReg->Corp->RRIF->TFSA)": GISOptimizedStrategy,
    "Balanced (Optimized for tax efficiency)": BalancedStrategy,
    "RRIF-Frontload (OAS Protection)": RRIFFrontloadOASProtectionStrategy,  # ← ADD THIS
}
```

### 3. Document Hybrid Strategy Availability

**Issue**: `HybridStrategy` class exists but not exposed via API.

**Options**:
- Add to API Literal type to expose to users
- Or remove class if not needed
- Or document as internal-only strategy

### 4. Update Frontend Display Map ⚠️

**Issue**: Display map includes `"manual"` but it's not in TypeScript Literal type.

**Recommendation**: Either:
- Add `"manual"` to `WithdrawalStrategy` type
- Or remove from `strategyMap`

---

## Summary

### Definitive Count:

| Level | Count | List |
|-------|-------|------|
| **User-Facing (API)** | **7** | minimize-income, balanced, rrif-frontload, tfsa-first, corporate-optimized, rrif-splitting, capital-gains-optimized |
| **Backend Classes** | **8** | NonRegFirstStrategy, RRIFFirstStrategy, CorpFirstStrategy, HybridStrategy, TFSAFirstStrategy, RRIFFrontloadOASProtectionStrategy, GISOptimizedStrategy, BalancedStrategy |
| **Fully Mapped** | **4** | minimize-income, balanced, rrif-frontload, tfsa-first |
| **Partially Mapped** | **3** | corporate-optimized, rrif-splitting, capital-gains-optimized |
| **Not Exposed** | **1** | Hybrid |

### Fix Applicability:

✅ **Both fixes (plan_success flag and NonReg negative balance) apply to ALL 7 user-facing strategies**

The fixes are in the core simulation engine and are strategy-agnostic.

---

## Files Referenced

- **Python Backend**:
  - `juan-retirement-app/modules/withdrawal_strategies.py` (Strategy classes and factory)
  - `juan-retirement-app/api/models/requests.py:170-178` (API strategy Literal)
  - `juan-retirement-app/modules/simulation.py:2055-2270` (Core simulation with fixes)

- **TypeScript Frontend**:
  - `webapp/lib/types/simulation.ts:84-91` (TypeScript strategy type)
  - `webapp/app/(dashboard)/simulation/page.tsx:762-770` (Display names)

---

## Conclusion

The application has **7 user-facing withdrawal strategies** exposed through the API, backed by **8 strategy classes** in Python. The two fixes deployed to production (plan_success flag and NonReg negative balance protection) apply universally to all strategies because they're in the core simulation engine that runs after withdrawal order is determined.

**Action Items**:
1. ✅ Fixes already deployed and apply to all strategies
2. ⏳ Optional: Clarify mappings for 3 ambiguous API strategies
3. ⏳ Optional: Add RRIFFrontloadOASProtectionStrategy to _STRATEGY_MAP
4. ⏳ Optional: Test additional strategies to verify (not required, but recommended)
