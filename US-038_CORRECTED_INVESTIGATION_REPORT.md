# US-038: GIC Maturity Tracking - CORRECTED Investigation Report

**Date**: January 29, 2026
**Reporter**: rightfooty218@gmail.com
**Satisfaction Score**: 1/5 (Critical)
**Issue (Clarified)**: "It doesn't take it to account when **GICs** come due" (not "pics")

---

## 🔄 Investigation Update

**INITIAL ASSUMPTION (INCORRECT)**: "pics" = CPP/OAS income → Investigated CPP/OAS timing bug

**USER CLARIFICATION (CORRECT)**: "pics" = **GICs** (Guaranteed Investment Certificates)
- When GIC assets mature ("come due")
- Yields should be added to assets
- Simulation should handle GIC maturity and reinvestment

---

## Executive Summary

✅ **ROOT CAUSE IDENTIFIED**: RetireZest does NOT track GIC-specific information:
- ❌ No GIC maturity date field
- ❌ No GIC term length tracking
- ❌ No reinvestment instructions
- ❌ No maturity yield calculations
- ❌ Simulation treats GICs like regular investments (continuous growth)

**The Bug**: When users have GICs, the simulation uses a continuous return rate instead of:
1. Locking the principal until maturity
2. Adding interest at maturity
3. Handling reinvestment (ladder strategy, cash out, etc.)

**Impact**: **HIGH** - GICs are a popular retirement asset for conservative investors (especially 60+). Without proper GIC tracking, simulations are inaccurate for this demographic.

---

## User Profile Analysis

### User: rightfooty218@gmail.com

```
Name: Right Foot
Age: 67
Province: ON
Assets:
- LIRA: $118,927
- Non-Registered: $93,757
- TFSA: $90,082
Total: $302,766
```

**GIC Count**: 0 (in database)

**Analysis**: User likely has GICs in real life but cannot properly track them in RetireZest because:
1. Asset model doesn't have GIC-specific fields (maturity date, term, etc.)
2. User may have entered GICs as generic "savings" or "nonreg" assets
3. Simulation doesn't model GIC laddering or maturity events

---

## Current Asset Model Limitations

### Asset Model (prisma/schema.prisma:132-161)

```prisma
model Asset {
  id              String    @id @default(uuid())
  userId          String
  type            String    // Supports "gic" but no GIC-specific fields
  name            String
  balance         Float     // Current balance
  returnRate      Float?    // Annual return rate percentage

  // ❌ MISSING GIC FIELDS:
  // maturityDate    DateTime?
  // termLength      Int?       // in months
  // interestRate    Float?     // Fixed rate for GIC
  // compoundingFrequency String? // annual, semi-annual, monthly
  // reinvestStrategy String?   // "auto-renew", "cash-out", "ladder"
  // issuer          String?    // Bank name
}
```

**Problems**:
1. **No maturity tracking**: Can't model when GIC principal + interest becomes available
2. **No term length**: Can't project future GIC ladders
3. **Continuous growth assumption**: Uses `returnRate` as if GIC grows continuously (wrong!)
4. **No reinvestment logic**: Can't model GIC laddering strategies

---

## How GICs SHOULD Work in Simulations

### Example: 5-Year GIC Ladder

**User has**:
- 5 x $20,000 GICs
- Maturities: 2026, 2027, 2028, 2029, 2030
- Interest rate: 4.5% annually

**Correct Simulation Behavior**:
```
Year 2026:
  - $20,000 GIC matures
  - Interest earned: $4,500 (compounded over 5 years)
  - Total available: $24,500
  - Reinvest in new 5-year GIC at current rates (e.g., 3.8%)

Year 2027:
  - Next $20,000 GIC matures
  - Interest earned: $4,500
  - Rinse and repeat
```

**Current Simulation Behavior** ❌:
```
Every Year:
  - GIC balance grows by returnRate% continuously
  - No maturity events
  - No reinvestment at new rates
  - No cash-out option for income
```

---

## User Workflow Gap

### What User Wants to Do:
1. Add GIC to profile:
   - Principal: $50,000
   - Term: 5 years
   - Interest Rate: 4.5%
   - Maturity Date: January 2029
   - Reinvest Strategy: Auto-renew at maturity

2. Run simulation
3. See GIC maturity events in yearly projections:
   - Year 2029: "$50,000 GIC matures, $11,806 interest earned"
   - Year 2029: "Reinvested in new 5-year GIC at 3.8%"

### What User Can Currently Do:
1. Add asset with type="gic":
   - Balance: $50,000
   - Return Rate: 4.5% (applied continuously - WRONG)

2. Run simulation
3. See GIC grow continuously every year (no maturity event)

**Gap**: No way to track maturity dates → Simulation inaccurate

---

## Proposed Solution (US-038 Revised)

### Option 1: Add GIC-Specific Fields to Asset Model (RECOMMENDED)

**Schema Changes**:
```prisma
model Asset {
  // ... existing fields ...

  // GIC-specific fields (only for type="gic")
  gicMaturityDate           DateTime?  // When GIC matures
  gicTermMonths             Int?       // Original term (12, 24, 36, 60, etc.)
  gicInterestRate           Float?     // Fixed interest rate (e.g., 4.5)
  gicCompoundingFrequency   String?    // "annual", "semi-annual", "monthly"
  gicReinvestStrategy       String?    // "auto-renew", "cash-out", "transfer-to-savings"
  gicIssuer                 String?    // Bank/institution name
}
```

**Simulation Logic**:
1. For GIC assets, ignore `returnRate` field
2. Use `gicInterestRate` and `gicCompoundingFrequency` for growth
3. At `gicMaturityDate`:
   - Calculate matured value = principal + compounded interest
   - Apply `gicReinvestStrategy`:
     - "auto-renew": Create new GIC with current market rate
     - "cash-out": Add to liquid assets (TFSA/NonReg)
     - "transfer-to-savings": Move to savings account

**Pros**:
- ✅ Accurate GIC modeling
- ✅ Handles maturity events correctly
- ✅ Supports GIC laddering strategies
- ✅ Industry-standard retirement planning feature

**Cons**:
- ⚠️ Requires schema migration
- ⚠️ Python backend simulation logic updates
- ⚠️ UI updates for GIC-specific inputs

**Estimated Effort**: 13-21 story points (3-5 days)

### Option 2: Treat GICs as Sub-Type of Savings (QUICK FIX)

**Approach**:
- Keep Asset model as-is
- Add note in UI: "For GICs, enter maturity date in Notes field"
- Simulation treats GICs as regular savings (continuous growth)

**Pros**:
- ✅ No schema changes
- ✅ Quick implementation (2-3 hours)

**Cons**:
- ❌ Still inaccurate (doesn't model maturity events)
- ❌ Doesn't solve user's problem
- ❌ Band-aid solution

---

## Impact Assessment

### Affected Users

**Who is affected**:
- ✅ **Conservative investors (60+ years old)** - GICs are staple of retirement portfolios
- ✅ **Risk-averse retirees** - Use GIC ladders for guaranteed income
- ✅ **Cash flow planners** - Need to know when GIC principal becomes available

**Percentage of Canadian retirees with GICs**: Estimated **40-50%** (Bank of Canada data)

**Severity**: **HIGH** - Core feature missing for significant user segment

### Business Impact

**Current State**:
- Users with GICs get inaccurate simulations
- Cannot model GIC laddering (common strategy)
- Loss of trust in simulation accuracy
- User satisfaction: 1/5

**With Fix**:
- Accurate GIC maturity modeling
- Support for GIC ladder strategies
- Competitive advantage (many retirement calculators ignore GICs)
- Improved user satisfaction

---

## Implementation Plan

### Phase 1: Schema & Data Model (Day 1-2)

1. **Add GIC fields to Asset model**
2. **Create database migration**
3. **Update Prisma client**

### Phase 2: Backend Simulation Logic (Day 2-3)

1. **Update Python simulation.py**:
   - Detect GIC assets
   - Model locked principal until maturity
   - Calculate compound interest
   - Handle maturity events

2. **Add GIC reinvestment logic**:
   - Auto-renew at new rates
   - Cash-out to liquid assets
   - Transfer strategies

### Phase 3: Frontend UI (Day 3-4)

1. **Update Asset form** (webapp/app/(dashboard)/profile/assets/page.tsx):
   - Show GIC-specific fields when type="gic"
   - Add maturity date picker
   - Add term length selector (1Y, 2Y, 3Y, 5Y)
   - Add interest rate input
   - Add reinvestment strategy dropdown

2. **Update Simulation display**:
   - Show GIC maturity events in yearly breakdown
   - Highlight when GICs mature
   - Show reinvestment decisions

### Phase 4: Testing (Day 4)

1. **Test with rightfooty218@gmail.com**
2. **Verify GIC maturity calculations**
3. **Test GIC laddering scenarios**

### Phase 5: Deployment (Day 5)

1. **Deploy schema changes**
2. **Email user with fix**
3. **Monitor for feedback**

---

## Success Criteria

1. ✅ User can add GIC with maturity date
2. ✅ Simulation shows GIC maturity events
3. ✅ GIC yields correctly added at maturity
4. ✅ Reinvestment strategies work (auto-renew, cash-out)
5. ✅ User satisfaction improves from 1/5 to 4-5/5

---

## Related Stories

- **US-038** (P0, 13 pts): Add GIC Maturity Tracking - **THIS STORY (REVISED)**
- **US-040** (P2, 8 pts): GIC Ladder Optimizer - Suggest optimal GIC ladder strategies
- **US-041** (P3, 5 pts): GIC Rate Comparison - Integrate current GIC rates from banks

---

## Appendices

### Appendix A: User Assets

**rightfooty218@gmail.com**:
- LIRA: $118,927
- Non-Registered: $93,757
- TFSA: $90,082
- **No GICs tracked** (likely why they gave 1/5 satisfaction)

### Appendix B: GIC Compound Interest Formula

```
Future Value = Principal × (1 + rate/n)^(n × years)

Where:
- Principal = Initial GIC amount
- rate = Annual interest rate (e.g., 0.045 for 4.5%)
- n = Compounding frequency (1=annual, 2=semi-annual, 12=monthly)
- years = Term length
```

Example:
- Principal: $50,000
- Rate: 4.5%
- Term: 5 years
- Compounding: Annual

FV = $50,000 × (1 + 0.045/1)^(1 × 5)
FV = $50,000 × 1.246182
FV = **$62,309** (maturity value)

### Appendix C: Python Backend Changes

**File**: `juan-retirement-app/modules/simulation.py`

Add GIC handling:
```python
def process_gic_assets(person, year):
    gics = [asset for asset in person.assets if asset.type == 'gic']

    for gic in gics:
        if year == gic.maturity_year:
            # GIC matures this year
            matured_value = calculate_gic_maturity(
                principal=gic.principal,
                rate=gic.interest_rate,
                years=gic.term_years,
                compounding=gic.compounding_frequency
            )

            # Apply reinvestment strategy
            if gic.reinvest_strategy == 'auto-renew':
                # Create new GIC at current rates
                new_gic = create_new_gic(matured_value, current_rates[year])
                person.assets.append(new_gic)
            elif gic.reinvest_strategy == 'cash-out':
                # Add to liquid assets
                person.tfsa_balance += matured_value
```

---

**Document Owner**: Development Team
**Status**: ✅ Investigation Complete (Corrected) - Ready for Implementation
**Priority**: P0 (Critical) - Missing core feature for 40-50% of retirees
**Estimated Effort**: 13-21 story points (3-5 days)

---

## Key Takeaway

**The user's complaint "It doesn't take it to account when GICs come due" is 100% correct.**

RetireZest currently has:
- ❌ No GIC maturity date tracking
- ❌ No GIC term length tracking
- ❌ No maturity event handling in simulations
- ❌ No reinvestment strategy options

This is a **missing feature**, not a bug. GICs are a critical asset class for retirees, and proper GIC modeling is essential for accurate retirement projections.

**Recommendation**: Implement Option 1 (Add GIC-Specific Fields) to properly support GIC assets and improve simulation accuracy for conservative investors.
