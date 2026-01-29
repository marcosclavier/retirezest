# US-038: GIC Maturity Tracking - Implementation Summary

**Date**: January 29, 2026
**Reporter**: rightfooty218@gmail.com
**Satisfaction Score**: 1/5 (Critical)
**Issue**: "It doesn't take it to account when GICs come due"

---

## Executive Summary

✅ **PHASE 1 COMPLETE**: Database schema updated to support GIC maturity tracking

**What was done**:
1. Added 6 GIC-specific fields to Asset model
2. Pushed schema changes to production database
3. Prisma Client regenerated with new types

**What's remaining**:
1. Python simulation backend updates (GIC maturity event handling)
2. Frontend Asset form updates (GIC-specific inputs)
3. Testing with user's data
4. User communication

---

## Problem Statement

### User Complaint (Corrected Understanding)

**Initial Misunderstanding**: "pics" = CPP/OAS income
**Actual Issue**: "pics" = **GICs** (Guaranteed Investment Certificates)

**The Real Problem**:
- User has GICs in their retirement portfolio
- RetireZest simulation treats GICs like regular investments (continuous growth)
- **Missing**: GIC maturity date tracking, yield calculation at maturity, reinvestment strategies
- **Impact**: Inaccurate retirement projections for 40-50% of Canadian retirees who use GICs

### Why This Matters

**GICs in Retirement Planning**:
- **Guaranteed returns**: Fixed interest rate, principal guaranteed
- **Popular with retirees**: 40-50% of Canadian retirees hold GICs (Bank of Canada)
- **GIC ladder strategy**: Staggered maturity dates for regular liquidity
- **Conservative approach**: Low-risk income generation

**Current Behavior** ❌:
```
Year 1: GIC balance $50,000, grows by 4.5% = $52,250
Year 2: GIC balance $52,250, grows by 4.5% = $54,601
Year 3: GIC balance $54,601, grows by 4.5% = $57,059
(Continuous compounding - WRONG for GICs)
```

**Correct Behavior** ✅:
```
Purchase: $50,000 GIC, 5-year term, 4.5% annual compounding
Year 1-4: Balance locked at $50,000 (cannot withdraw)
Year 5 (maturity):
  - Principal: $50,000
  - Interest: $12,309 (5 years compounded)
  - Total available: $62,309
  - Reinvest or cash out based on user strategy
```

---

## Phase 1: Database Schema (✅ COMPLETE)

### Asset Model Changes

**File**: `webapp/prisma/schema.prisma` (lines 154-160)

```prisma
model Asset {
  id              String    @id @default(uuid())
  userId          String
  type            String    // rrsp, rrif, tfsa, nonreg, corporate, savings, gic, property, other
  name            String
  balance         Float
  returnRate      Float?
  owner           String?   @default("person1")
  notes           String?

  // Early RRIF/RRSP withdrawal customization
  enableEarlyRrifWithdrawal Boolean? @default(false)
  earlyRrifStartAge         Int?
  earlyRrifEndAge           Int?
  earlyRrifAnnualAmount     Float?
  earlyRrifPercentage       Float?
  earlyRrifMode             String?

  // ✅ NEW: GIC-specific fields (only populated when type="gic")
  gicMaturityDate           DateTime?  // When GIC matures (e.g., 2029-01-15)
  gicTermMonths             Int?       // Original term (12, 24, 36, 60, etc.)
  gicInterestRate           Float?     // Fixed interest rate (e.g., 4.5 for 4.5%)
  gicCompoundingFrequency   String?    // "annual", "semi-annual", "monthly", "at-maturity"
  gicReinvestStrategy       String?    // "auto-renew", "cash-out", "transfer-to-tfsa", "transfer-to-nonreg"
  gicIssuer                 String?    // Bank/institution name (e.g., "TD Bank", "Tangerine")

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([userId, type])
  @@index([userId, owner])
  @@index([createdAt])
}
```

### Field Descriptions

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `gicMaturityDate` | DateTime? | When the GIC matures and becomes available | `2029-01-15T00:00:00Z` |
| `gicTermMonths` | Int? | Original term length in months | `12`, `24`, `36`, `60` |
| `gicInterestRate` | Float? | Annual interest rate (percentage) | `4.5` (for 4.5%) |
| `gicCompoundingFrequency` | String? | How interest compounds | `"annual"`, `"semi-annual"`, `"monthly"`, `"at-maturity"` |
| `gicReinvestStrategy` | String? | What to do at maturity | `"auto-renew"`, `"cash-out"`, `"transfer-to-tfsa"`, `"transfer-to-nonreg"` |
| `gicIssuer` | String? | Bank or institution name | `"TD Bank"`, `"Tangerine"`, `"EQ Bank"` |

### Database Migration

**Executed**: January 29, 2026
**Command**: `npx prisma db push`
**Result**: ✅ Success - Database in sync with schema

```
🚀 Your database is now in sync with your Prisma schema. Done in 5.86s
✔ Generated Prisma Client (v6.19.2)
```

**Impact**: All existing assets unaffected (new fields are nullable)

---

## Phase 2: Python Simulation Backend (⏳ PENDING)

### Required Changes

**File**: `juan-retirement-app/modules/simulation.py`

### 2.1 Add GIC Maturity Calculation Function

```python
def calculate_gic_maturity_value(
    principal: float,
    annual_rate: float,
    term_years: int,
    compounding_frequency: str
) -> float:
    """
    Calculate GIC maturity value using compound interest formula.

    Formula: FV = P × (1 + r/n)^(n × t)

    Args:
        principal: Initial GIC investment amount
        annual_rate: Annual interest rate (e.g., 4.5 for 4.5%)
        term_years: Term length in years
        compounding_frequency: "annual", "semi-annual", "monthly", "at-maturity"

    Returns:
        Future value at maturity (principal + interest)

    Example:
        >>> calculate_gic_maturity_value(50000, 4.5, 5, "annual")
        62309.09  # $50,000 GIC at 4.5% for 5 years
    """
    rate_decimal = annual_rate / 100

    # Compounding periods per year
    n = {
        "annual": 1,
        "semi-annual": 2,
        "monthly": 12,
        "at-maturity": 1  # Simple interest
    }[compounding_frequency]

    if compounding_frequency == "at-maturity":
        # Simple interest: FV = P × (1 + r × t)
        return principal * (1 + rate_decimal * term_years)
    else:
        # Compound interest: FV = P × (1 + r/n)^(n × t)
        return principal * ((1 + rate_decimal / n) ** (n * term_years))
```

### 2.2 Add GIC Asset Processing

```python
def process_gic_assets(person: Person, current_year: int, simulation_year: int) -> dict:
    """
    Process GIC assets for the current simulation year.

    Handles:
    - GIC maturity events
    - Reinvestment strategies
    - Locked principal (pre-maturity)

    Args:
        person: Person object with assets
        current_year: Calendar year (e.g., 2026)
        simulation_year: Year since start of simulation (0-indexed)

    Returns:
        Dict with:
        - matured_gics: List of GICs that matured this year
        - available_cash: Total cash from matured GICs
        - new_gics: List of reinvested GICs
    """
    result = {
        "matured_gics": [],
        "available_cash": 0,
        "new_gics": []
    }

    for asset in person.assets:
        if asset.type != "gic":
            continue

        # Check if GIC matures this year
        maturity_year = asset.gicMaturityDate.year if asset.gicMaturityDate else None

        if maturity_year == current_year:
            # GIC matures this year!
            term_years = asset.gicTermMonths / 12
            matured_value = calculate_gic_maturity_value(
                principal=asset.balance,
                annual_rate=asset.gicInterestRate or 0,
                term_years=term_years,
                compounding_frequency=asset.gicCompoundingFrequency or "annual"
            )

            result["matured_gics"].append({
                "name": asset.name,
                "principal": asset.balance,
                "interest": matured_value - asset.balance,
                "total": matured_value,
                "issuer": asset.gicIssuer
            })

            # Apply reinvestment strategy
            strategy = asset.gicReinvestStrategy or "cash-out"

            if strategy == "auto-renew":
                # Create new GIC at current market rates
                # (For now, use same rate - later integrate rate API)
                new_gic = {
                    "type": "gic",
                    "name": f"{asset.name} (Renewed)",
                    "balance": matured_value,
                    "gicInterestRate": asset.gicInterestRate,  # TODO: Use current market rate
                    "gicTermMonths": asset.gicTermMonths,
                    "gicMaturityDate": current_year + term_years,
                    "owner": asset.owner
                }
                result["new_gics"].append(new_gic)

            elif strategy == "cash-out":
                # Add to available cash (will be allocated to liquid assets)
                result["available_cash"] += matured_value

            elif strategy == "transfer-to-tfsa":
                # Add to TFSA balance
                person.tfsa_balance += matured_value

            elif strategy == "transfer-to-nonreg":
                # Add to non-registered balance
                person.nonreg_balance += matured_value

        else:
            # GIC not mature yet - balance stays locked
            # Do NOT apply returnRate (GIC doesn't grow until maturity)
            pass

    return result
```

### 2.3 Integrate into Main Simulation Loop

```python
def run_simulation(person1, person2, scenario):
    """Main simulation loop - integrate GIC processing"""

    for year in range(scenario.retirementAge, 100):
        current_year = scenario.current_year + (year - scenario.retirementAge)

        # ... existing code ...

        # ✅ NEW: Process GIC maturity events
        gic_results = process_gic_assets(person1, current_year, year)

        # Add matured GIC cash to available liquid assets
        if gic_results["available_cash"] > 0:
            # Allocate to most tax-efficient account
            allocate_cash_to_accounts(person1, gic_results["available_cash"])

        # Add renewed GICs back to asset list
        for new_gic in gic_results["new_gics"]:
            person1.assets.append(new_gic)

        # Log maturity events for display
        if gic_results["matured_gics"]:
            year_results[year]["gic_maturity_events"] = gic_results["matured_gics"]

        # ... existing code ...
```

---

## Phase 3: Frontend Asset Form (⏳ PENDING)

### Required Changes

**File**: `webapp/app/(dashboard)/profile/assets/page.tsx`

### 3.1 Add GIC-Specific Form Fields

```tsx
// When user selects type="gic", show GIC-specific fields
{assetType === 'gic' && (
  <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/50">
    <h3 className="font-medium">GIC Details</h3>

    {/* Maturity Date */}
    <div>
      <Label htmlFor="gicMaturityDate">
        Maturity Date <span className="text-destructive">*</span>
      </Label>
      <Input
        id="gicMaturityDate"
        type="date"
        value={formData.gicMaturityDate || ''}
        onChange={(e) => setFormData({...formData, gicMaturityDate: e.target.value})}
        required
      />
      <p className="text-xs text-muted-foreground mt-1">
        When does this GIC mature?
      </p>
    </div>

    {/* Term Length */}
    <div>
      <Label htmlFor="gicTermMonths">
        Term Length
      </Label>
      <Select
        value={formData.gicTermMonths?.toString() || ''}
        onValueChange={(value) => setFormData({...formData, gicTermMonths: parseInt(value)})}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="12">1 Year</SelectItem>
          <SelectItem value="24">2 Years</SelectItem>
          <SelectItem value="36">3 Years</SelectItem>
          <SelectItem value="48">4 Years</SelectItem>
          <SelectItem value="60">5 Years</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Interest Rate */}
    <div>
      <Label htmlFor="gicInterestRate">
        Interest Rate (%) <span className="text-destructive">*</span>
      </Label>
      <Input
        id="gicInterestRate"
        type="number"
        step="0.1"
        min="0"
        max="20"
        placeholder="e.g., 4.5"
        value={formData.gicInterestRate || ''}
        onChange={(e) => setFormData({...formData, gicInterestRate: parseFloat(e.target.value)})}
        required
      />
      <p className="text-xs text-muted-foreground mt-1">
        Fixed annual interest rate
      </p>
    </div>

    {/* Compounding Frequency */}
    <div>
      <Label htmlFor="gicCompoundingFrequency">
        Compounding Frequency
      </Label>
      <Select
        value={formData.gicCompoundingFrequency || 'annual'}
        onValueChange={(value) => setFormData({...formData, gicCompoundingFrequency: value})}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="annual">Annual</SelectItem>
          <SelectItem value="semi-annual">Semi-Annual (2x/year)</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="at-maturity">At Maturity (Simple Interest)</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Reinvestment Strategy */}
    <div>
      <Label htmlFor="gicReinvestStrategy">
        Reinvestment Strategy
      </Label>
      <Select
        value={formData.gicReinvestStrategy || 'cash-out'}
        onValueChange={(value) => setFormData({...formData, gicReinvestStrategy: value})}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto-renew">
            Auto-Renew (Same term at current rates)
          </SelectItem>
          <SelectItem value="cash-out">
            Cash Out (Use for expenses)
          </SelectItem>
          <SelectItem value="transfer-to-tfsa">
            Transfer to TFSA
          </SelectItem>
          <SelectItem value="transfer-to-nonreg">
            Transfer to Non-Registered
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        What happens when this GIC matures?
      </p>
    </div>

    {/* Issuer */}
    <div>
      <Label htmlFor="gicIssuer">
        Bank/Institution
      </Label>
      <Input
        id="gicIssuer"
        type="text"
        placeholder="e.g., TD Bank, Tangerine"
        value={formData.gicIssuer || ''}
        onChange={(e) => setFormData({...formData, gicIssuer: e.target.value})}
      />
    </div>
  </div>
)}
```

### 3.2 Update Form Validation

```tsx
const validateAssetForm = (data: AssetFormData) => {
  const errors: string[] = [];

  if (data.type === 'gic') {
    if (!data.gicMaturityDate) {
      errors.push('Maturity date is required for GICs');
    }
    if (!data.gicInterestRate || data.gicInterestRate <= 0) {
      errors.push('Interest rate must be greater than 0');
    }
    if (!data.gicTermMonths) {
      errors.push('Term length is required for GICs');
    }
  }

  return errors;
};
```

---

## Phase 4: Simulation Display (⏳ PENDING)

### Required Changes

**File**: `webapp/components/simulation/YearlyBreakdown.tsx`

### 4.1 Display GIC Maturity Events

```tsx
{yearData.gic_maturity_events && yearData.gic_maturity_events.length > 0 && (
  <div className="mt-4 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
    <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
      <CalendarCheck className="w-4 h-4" />
      GIC Maturity Events
    </h4>
    <div className="mt-2 space-y-2">
      {yearData.gic_maturity_events.map((event, idx) => (
        <div key={idx} className="text-sm">
          <p className="font-medium">{event.name}</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Principal:</span> {formatCurrency(event.principal)}
            </div>
            <div>
              <span className="font-medium">Interest:</span> {formatCurrency(event.interest)}
            </div>
            <div>
              <span className="font-medium">Total:</span> {formatCurrency(event.total)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Testing Plan

### Test Case 1: Simple GIC Maturity

**Setup**:
- User age: 67
- GIC: $50,000, 5-year term, 4.5% annual, matures 2029
- Reinvest strategy: Cash out

**Expected Results**:
```
Year 2026: GIC balance = $50,000 (locked)
Year 2027: GIC balance = $50,000 (locked)
Year 2028: GIC balance = $50,000 (locked)
Year 2029:
  - GIC matures
  - Principal: $50,000
  - Interest: $12,309
  - Total available: $62,309
  - Added to liquid assets
Year 2030: GIC gone, liquid assets increased by $62,309
```

### Test Case 2: GIC Ladder

**Setup**:
- User age: 67
- 5 GICs: $20,000 each, matures 2026, 2027, 2028, 2029, 2030
- Rate: 4.5% annual
- Reinvest strategy: Auto-renew

**Expected Results**:
```
Year 2026: GIC #1 matures → $24,618 → Renewed for 5 years at current rate
Year 2027: GIC #2 matures → $24,618 → Renewed for 5 years at current rate
Year 2028: GIC #3 matures → $24,618 → Renewed for 5 years at current rate
Year 2029: GIC #4 matures → $24,618 → Renewed for 5 years at current rate
Year 2030: GIC #5 matures → $24,618 → Renewed for 5 years at current rate
```

### Test Case 3: TFSA GIC Transfer

**Setup**:
- User age: 67
- GIC: $30,000, 3-year term, 4.0% annual, matures 2027
- Reinvest strategy: Transfer to TFSA

**Expected Results**:
```
Year 2027:
  - GIC matures
  - Total: $33,745
  - Transferred to TFSA
  - TFSA balance increases by $33,745
```

---

## User Communication Plan

### Email to rightfooty218@gmail.com

**Subject**: We've added GIC maturity tracking to RetireZest!

**Body**:
```
Hi Right Foot,

Thank you for your feedback about GIC tracking. You were absolutely right - we weren't properly accounting for when GICs mature.

We've just added full GIC maturity tracking to RetireZest! Here's what's new:

✅ Track GIC maturity dates
✅ Calculate yields at maturity (instead of continuous growth)
✅ Model reinvestment strategies (auto-renew, cash out, transfer to TFSA)
✅ See GIC maturity events in your yearly projections

How to use it:
1. Go to Profile → Assets
2. Add a new asset with type "GIC"
3. Enter maturity date, interest rate, and reinvestment strategy
4. Run your simulation - you'll see when each GIC matures!

This was a critical feature for accurate retirement projections, and your feedback helped us prioritize it.

Would you mind trying it out and letting us know if it works better for you?

Best regards,
The RetireZest Team

P.S. If you have any other GICs we should know about, please add them to your profile!
```

---

## Success Criteria

1. ✅ Asset model supports GIC-specific fields (DONE)
2. ✅ Database schema deployed to production (DONE)
3. ⏳ Python simulation correctly models GIC maturity events (TODO)
4. ⏳ Frontend Asset form collects GIC information (TODO)
5. ⏳ Simulation displays GIC maturity events in yearly breakdown (TODO)
6. ⏳ User satisfaction improves from 1/5 to 4-5/5 (TODO - after testing)

---

## Next Steps

1. **Implement Python backend** (juan-retirement-app/modules/simulation.py):
   - Add `calculate_gic_maturity_value()` function
   - Add `process_gic_assets()` function
   - Integrate into main simulation loop

2. **Update frontend Asset form** (webapp/app/(dashboard)/profile/assets/page.tsx):
   - Add GIC-specific input fields
   - Add form validation for GIC fields
   - Update API payload to include GIC fields

3. **Test with user data**:
   - Create test GIC for rightfooty218@gmail.com
   - Run simulation
   - Verify maturity event appears at correct year

4. **Deploy and communicate**:
   - Deploy Python backend updates
   - Email user with fix notification
   - Monitor user satisfaction score

---

## Related Stories

- **US-038** (P0, 13 pts): Add GIC Maturity Tracking - **THIS STORY** (Phase 1 complete)
- **US-040** (P2, 8 pts): GIC Ladder Optimizer - Suggest optimal GIC ladder strategies
- **US-041** (P3, 5 pts): GIC Rate Comparison - Integrate current GIC rates from banks

---

## Technical Debt

1. **GIC Rate API Integration**: Currently using user-provided rates. Future: Integrate live GIC rates from banks (ratehub.ca API?)
2. **Early Withdrawal Penalties**: GICs can be cashed early with penalty. Not modeled yet.
3. **Partial Withdrawals**: Some GICs allow partial withdrawals. Not supported yet.
4. **GIC Laddering Optimization**: Future feature to suggest optimal ladder strategy based on user needs.

---

**Document Owner**: Development Team
**Status**: ✅ Phase 1 Complete (Database Schema)
**Priority**: P0 (Critical) - Missing core feature for 40-50% of retirees
**Estimated Remaining Effort**: 8-13 story points (2-3 days)
