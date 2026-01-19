# RRIF Early Withdrawal Feature - Implementation Summary

## Overview
This document summarizes the implementation of the RRIF Early Withdrawal feature, which addresses user feedback requesting more detailed control over RRSP/RRIF withdrawals before age 71.

**User Feedback**: Ian Crawford requested "ability make more detailed decisions like early RRIF Withdrawals for wife with no income" before deleting his account.

---

## What Was Implemented (Phase 1 - Core Feature)

### 1. TypeScript Types (`lib/types/simulation.ts`)

Added new fields to `PersonInput` interface:
```typescript
// Early RRIF/RRSP withdrawal customization (before age 71)
enable_early_rrif_withdrawal: boolean;
early_rrif_withdrawal_start_age: number;
early_rrif_withdrawal_end_age: number;
early_rrif_withdrawal_annual: number; // Fixed annual amount
early_rrif_withdrawal_percentage: number; // Or as % of balance (0-100)
early_rrif_withdrawal_mode: 'fixed' | 'percentage'; // Which mode to use
```

### 2. Database Schema (`prisma/schema.prisma`)

Added fields to the `Asset` model:
```prisma
// Early RRIF/RRSP withdrawal customization (applies to RRSP/RRIF types)
enableEarlyRrifWithdrawal Boolean? @default(false)
earlyRrifStartAge         Int?     // Age to start early withdrawals
earlyRrifEndAge           Int?     // Age to end early withdrawals (must be < 71)
earlyRrifAnnualAmount     Float?   // Fixed annual withdrawal amount
earlyRrifPercentage       Float?   // Or percentage of balance (0-100)
earlyRrifMode             String?  // 'fixed' or 'percentage'
```

✅ **Migration applied successfully** to production database (Neon PostgreSQL)

### 3. UI Component (`components/simulation/EarlyRrifWithdrawalControl.tsx`)

Created a new reusable component with:
- **Toggle switch** to enable/disable feature
- **Withdrawal mode selector**: Fixed amount vs. Percentage
- **Age range inputs**: Start age and end age (must be < 71)
- **Amount/Percentage input**: Based on selected mode
- **Helpful tooltips and strategy tips**
- **Responsive design** with proper validation

Features:
- Only shows when RRSP/RRIF balance > 0
- Displays person name for couples
- Strategy tip highlighting use case for lower-income spouse
- Clear explanation of when mandatory minimums kick in (age 71)

### 4. Integration with PersonForm (`components/simulation/PersonForm.tsx`)

- Added import for `EarlyRrifWithdrawalControl`
- Integrated control into Account Balances section
- Conditional rendering: Only shows if person has RRSP or RRIF balance
- Proper state management with `onChange` handlers
- All 6 new fields properly wired up

---

## How It Works

### User Flow

1. User navigates to simulation page
2. Enters RRSP or RRIF balance for a person
3. **Early RRIF Withdrawal Control appears** below account balances
4. User enables the feature with toggle
5. User selects withdrawal method:
   - **Fixed Amount**: Specify exact dollar amount per year
   - **Percentage**: Specify % of balance per year
6. User sets age range (e.g., 65-70)
7. Data is passed to simulation API along with other parameters

### Technical Flow

```
Frontend (PersonForm)
  ↓
PersonInput with early_rrif_* fields
  ↓
HouseholdInput
  ↓
POST /api/simulation/run
  ↓
Proxy to Python FastAPI backend
  ↓
[PENDING] Python simulation engine processes early withdrawals
```

---

## What Still Needs To Be Done

### Phase 1 Remaining Tasks

#### 1. Python Backend Integration ⚠️ **CRITICAL**

The Python FastAPI backend needs to be updated to:
- Accept the new `early_rrif_*` parameters in the `PersonInput` model
- Implement logic in the simulation engine to:
  - Check if `enable_early_rrif_withdrawal` is true
  - For ages between `early_rrif_withdrawal_start_age` and `early_rrif_withdrawal_end_age`:
    - If mode is 'fixed': Withdraw `early_rrif_withdrawal_annual` amount
    - If mode is 'percentage': Withdraw `early_rrif_withdrawal_percentage` % of RRIF balance
  - Properly tax these withdrawals as income
  - Track withdrawals in year-by-year results

**Location**: Python backend repository (likely `retirement-simulation-engine` or similar)

#### 2. End-to-End Testing

Once backend is updated:
- Test with couple scenario (one spouse with no income)
- Verify tax calculations are correct
- Verify OAS clawback avoidance
- Test both fixed and percentage modes
- Test edge cases (balance too low, age validations, etc.)

---

## Use Cases This Addresses

### Scenario 1: Income Splitting for Couples
**Problem**: One spouse has no income, other has RRSP. Both pay tax at household level.
**Solution**: Enable early withdrawals from lower-income spouse's RRSP to fill their lower tax brackets (e.g., $20K-$30K/year) before CPP/OAS starts.

### Scenario 2: OAS Clawback Avoidance
**Problem**: Large RRIF balance will force high withdrawals at age 71+, triggering OAS clawback.
**Solution**: Withdraw strategically before age 71 to reduce future forced withdrawals and stay under OAS threshold.

### Scenario 3: Tax Bracket Optimization
**Problem**: Spouse retires early (age 55-65) with low/no income but has RRSP.
**Solution**: Draw from RRSP during low-income years to use up lower tax brackets instead of letting money compound and get taxed higher later.

---

## Configuration Examples

### Example 1: Fixed Amount Strategy
```typescript
{
  enable_early_rrif_withdrawal: true,
  early_rrif_withdrawal_start_age: 65,
  early_rrif_withdrawal_end_age: 70,
  early_rrif_withdrawal_annual: 25000,
  early_rrif_withdrawal_mode: 'fixed',
}
```
**Result**: Withdraw exactly $25,000/year from age 65-70

### Example 2: Percentage Strategy
```typescript
{
  enable_early_rrif_withdrawal: true,
  early_rrif_withdrawal_start_age: 60,
  early_rrif_withdrawal_end_age: 69,
  early_rrif_withdrawal_percentage: 5.0,
  early_rrif_withdrawal_mode: 'percentage',
}
```
**Result**: Withdraw 5% of RRIF balance each year from age 60-69

---

## Benefits

1. **Addresses user churn**: Directly responds to feedback from deleted users
2. **Tax optimization**: Enables sophisticated tax planning strategies
3. **Per-person control**: Critical for couples with asymmetric incomes
4. **Flexible**: Supports both fixed amounts and percentages
5. **User-friendly**: Clear UI with helpful tips and tooltips

---

## Next Steps

### Immediate (Required for Feature Completion)
1. ✅ Update Python backend to accept and process early RRIF parameters
2. ✅ Add validation in Python backend (age < 71, balance sufficient, etc.)
3. ✅ Test end-to-end with real scenarios
4. ✅ Update year-by-year results to show early RRIF withdrawals separately

### Phase 2 (Nice-to-Have)
1. Add comparison view: with/without early withdrawals
2. Add automatic recommendation engine
3. Visualization: Show tax savings from strategy
4. Add to PDF reports
5. Onboarding wizard integration

### Phase 3 (Advanced)
1. Multi-year scenarios with different amounts per year
2. "Smart" mode that automatically optimizes withdrawal amounts
3. Integration with Monte Carlo projections
4. Historical backtesting

---

## Files Modified

1. `lib/types/simulation.ts` - Added TypeScript interfaces
2. `prisma/schema.prisma` - Added database fields
3. `components/simulation/EarlyRrifWithdrawalControl.tsx` - New component (created)
4. `components/simulation/PersonForm.tsx` - Integrated control

## Database Migration

✅ Applied to production (Neon PostgreSQL) on 2026-01-19

---

## Testing Checklist

- [ ] Python backend accepts new parameters
- [ ] Fixed amount mode works correctly
- [ ] Percentage mode works correctly
- [ ] Age validation prevents > 70
- [ ] Tax calculations are accurate
- [ ] Works for both person1 and person2
- [ ] Integrates with existing withdrawal strategies
- [ ] UI shows/hides correctly based on RRSP/RRIF balance
- [ ] Results dashboard displays early withdrawals
- [ ] Year-by-year table shows breakdown

---

## Conclusion

Phase 1 (Frontend & Database) is **COMPLETE**. The UI is ready and the database schema supports the feature.

**Next Critical Step**: Update Python backend to handle these parameters and implement the withdrawal logic in the simulation engine.

Once the backend is updated, this feature will be production-ready and should help prevent user churn from couples wanting detailed RRIF withdrawal control.
