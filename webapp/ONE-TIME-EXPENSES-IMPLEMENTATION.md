# One-Time Expenses Implementation

**Date:** December 24, 2025
**Status:** ✅ UI & Database Complete (Tracking Only - Not in Simulation Yet)

## ⚠️ IMPORTANT NOTE

**Current Limitation:** One-time expenses are currently for **tracking purposes only**. They are saved to the database and displayed in the UI, but they are **NOT yet included in retirement simulations**.

### Impact on Existing Features

**Scenarios:** One-time expenses do **NOT** affect scenarios. Scenarios have their own `annualExpenses` field (a single number) and do not reference the `Expense` table. Scenarios are completely independent.

**Withdrawal Strategies:** One-time expenses do **NOT** affect withdrawal strategies. Strategies determine **how** money is withdrawn (e.g., from RRIF first, corporate-optimized, TFSA-first), not **how much** is spent. Strategies operate on the spending amounts (`spending_go_go`, etc.) provided to the simulation, regardless of whether those amounts include one-time expenses or not.

**Profile/Simulations:** The simulation currently uses phase-based spending amounts (`spending_go_go`, `spending_slow_go`, `spending_no_go`) sent directly to the Python API. One-time expenses stored in the database are not sent to simulations.

**In Phase 2:** When one-time expenses are integrated, the withdrawal strategy will still work the same way - it will just withdraw more money in years with one-time expenses. For example:
- Base spending in 2027: $80,000
- One-time car expense in 2027: $30,000
- Total needed in 2027: $110,000
- Strategy determines how to withdraw that $110,000 (e.g., RRIF first, then corporate, etc.)

To include one-time expenses in simulations, the Python API integration (Phase 2) must be completed.

## Overview

Implementation of major planned expenses feature for RetireZest, allowing users to track one-time expenses like car purchases, home repairs, and large gifts that occur in specific years during retirement.

## User Examples

The feature was designed to support expenses like:
- **2027:** $30,000 - Buying a new car
- **2029:** $25,000 - Gifts for children
- **2031:** $10,000 - Roof replacement
- **One-time:** $200,000 - Mortgage payoff

## Completed Work

### 1. Database Schema ✅

**File:** `prisma/schema.prisma`

Added two new fields to the `Expense` model:

```prisma
model Expense {
  id          String    @id @default(uuid())
  userId      String
  category    String
  description String?
  amount      Float
  frequency   String    // monthly, annual, quarterly, weekly, one-time
  essential   Boolean   @default(true)
  notes       String?

  // NEW FIELDS for one-time/major planned expenses
  isRecurring Boolean   @default(true)   // false for one-time expenses
  plannedYear Int?                       // Specific year (e.g., 2027)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([userId, category])
  @@index([userId, essential])
  @@index([userId, isRecurring])  // NEW INDEX
  @@index([userId, plannedYear])  // NEW INDEX
  @@index([createdAt])
}
```

**Migration Applied:** December 24, 2025
- Successfully pushed to Neon production database using `npx prisma db push`
- Generated Prisma Client v6.19.0

### 2. API Routes ✅

**File:** `app/api/profile/expenses/route.ts`

Updated POST and PUT handlers to:

#### Validation Rules
- One-time expenses (`isRecurring: false`) **require** a `plannedYear`
- `plannedYear` must be current year or future (prevents past years)
- `plannedYear` validated as integer in range

#### Example Request (POST)
```json
{
  "category": "transportation",
  "description": "Buying a new car",
  "amount": 30000,
  "frequency": "one-time",
  "essential": false,
  "isRecurring": false,
  "plannedYear": 2027
}
```

#### Example Response
```json
{
  "id": "uuid-here",
  "category": "transportation",
  "description": "Buying a new car",
  "amount": 30000,
  "frequency": "one-time",
  "essential": false,
  "isRecurring": false,
  "plannedYear": 2027,
  "createdAt": "2025-12-24T...",
  "updatedAt": "2025-12-24T..."
}
```

### 3. User Interface ✅

**File:** `app/(dashboard)/profile/expenses/page.tsx`

#### New Form Fields

1. **Expense Type Selector**
   - "Recurring Expense" (default)
   - "One-Time / Major Planned Expense"

2. **Conditional Fields**
   - **Recurring:** Shows frequency dropdown (Monthly/Annual)
   - **One-Time:** Shows planned year input field with validation

3. **Visual Indicators**
   - Purple badge showing "One-Time (2027)" for one-time expenses
   - Different display format - shows year instead of frequency
   - Clear distinction from recurring expenses

#### UI Features

- ✅ Form automatically switches between recurring/one-time modes
- ✅ Planned year validation (current year or future, max 50 years out)
- ✅ Visual differentiation with purple badges
- ✅ Proper data conversion (string to int for plannedYear)
- ✅ Edit functionality preserves expense type

#### Example UI Display

```
Transportation                  One-Time (2027)    Discretionary
Buying a new car
$30,000  Planned for 2027
[Edit] [Delete]
```

## Pending Work

### 4. Python API Integration ⏸️

**What's Needed:**

#### A. Update Request Model
**File:** `retirezest/juan-retirement-app/api/models/requests.py`

Add new field to `HouseholdInput`:

```python
class OneTimeExpense(BaseModel):
    """One-time expense in a specific year."""
    year: int = Field(..., ge=2025, le=2100, description="Year when expense occurs")
    amount: float = Field(..., gt=0, description="Expense amount in CAD")
    description: str = Field(default="", max_length=200, description="Expense description")
    essential: bool = Field(default=False, description="Is this an essential expense")

class HouseholdInput(BaseModel):
    # ... existing fields ...

    # NEW FIELD
    one_time_expenses: list[OneTimeExpense] = Field(
        default=[],
        description="List of one-time expenses in specific years"
    )
```

#### B. Update Simulation Engine
**File:** `retirezest/juan-retirement-app/modules/simulation.py`

Modify the annual simulation loop to:
1. Check if current year has any one-time expenses
2. Add those expenses to the annual spending for that year
3. Track one-time expenses separately in results

**Example logic:**
```python
def simulate(household, tax_cfg):
    # ... existing setup ...

    # Group one-time expenses by year
    one_time_by_year = {}
    for expense in household.one_time_expenses:
        if expense.year not in one_time_by_year:
            one_time_by_year[expense.year] = []
        one_time_by_year[expense.year].append(expense)

    for year in range(start_year, end_year):
        # Get base spending for phase
        base_spending = get_phase_spending(year, household)

        # Add one-time expenses for this year
        one_time_total = 0
        if year in one_time_by_year:
            for expense in one_time_by_year[year]:
                one_time_total += expense.amount

        total_spending = base_spending + one_time_total

        # Continue with withdrawal logic using total_spending
        # ...
```

#### C. Update Simulation Prefill
**File:** `webapp/lib/api/simulation-client.ts` or similar

When building the simulation request payload:

```typescript
// Fetch user's expenses from database
const expenses = await prisma.expense.findMany({
  where: {
    userId: user.id,
    isRecurring: false  // Only one-time expenses
  },
  select: {
    amount: true,
    plannedYear: true,
    description: true,
    essential: true
  }
});

// Add to simulation payload
const simulationRequest = {
  // ... existing fields ...
  one_time_expenses: expenses.map(e => ({
    year: e.plannedYear!,
    amount: e.amount,
    description: e.description || '',
    essential: e.essential
  }))
};
```

### 5. Testing ⏸️

Once Python integration is complete:

1. **Unit Tests**
   - Test one-time expense in single year
   - Test multiple one-time expenses in same year
   - Test one-time expenses across different years
   - Test edge cases (year boundaries, portfolio depletion)

2. **Integration Tests**
   - Create expenses via UI
   - Run simulation with one-time expenses
   - Verify results show increased spending in target years
   - Verify estate value calculations account for expenses

3. **End-to-End Test**
   ```
   1. Login as test user
   2. Navigate to Expenses page
   3. Add one-time expense: Car ($30,000 in 2027)
   4. Add one-time expense: Gifts ($25,000 in 2029)
   5. Add one-time expense: Roof ($10,000 in 2031)
   6. Navigate to Simulation page
   7. Run simulation
   8. Verify 2027 shows additional $30k spending
   9. Verify 2029 shows additional $25k spending
   10. Verify 2031 shows additional $10k spending
   ```

## Database Queries

### Find all one-time expenses for a user
```sql
SELECT * FROM "Expense"
WHERE "userId" = 'user-id-here'
  AND "isRecurring" = false
ORDER BY "plannedYear" ASC;
```

### Find one-time expenses in specific year range
```sql
SELECT * FROM "Expense"
WHERE "userId" = 'user-id-here'
  AND "isRecurring" = false
  AND "plannedYear" BETWEEN 2025 AND 2035
ORDER BY "plannedYear" ASC;
```

### Calculate total one-time expenses by year
```sql
SELECT
  "plannedYear",
  SUM(amount) as total_amount,
  COUNT(*) as expense_count
FROM "Expense"
WHERE "userId" = 'user-id-here'
  AND "isRecurring" = false
GROUP BY "plannedYear"
ORDER BY "plannedYear" ASC;
```

## Current Architecture

### Data Flow (Current - Recurring Expenses Only)

```
User Profile
    ↓
PostgreSQL (Expense table)
    ↓
NOT USED IN SIMULATION ❌
    ↓
Simulation uses:
  - spending_go_go
  - spending_slow_go
  - spending_no_go
```

### Data Flow (Target - With One-Time Expenses)

```
User Profile
    ↓
PostgreSQL (Expense table)
    ├─ Recurring expenses (existing, still not used)
    └─ One-time expenses (NEW)
         ↓
    Next.js API fetches one-time expenses
         ↓
    Sends to Python API
         ↓
    Python simulation adds to annual spending
         ↓
    Results show impact on portfolio
```

## Design Decisions

### Why `isRecurring` instead of just checking `frequency`?

**Reason:** Explicit field makes intent clearer and allows for future flexibility:
- Could support one-time expenses with different frequencies (e.g., "one-time quarterly payment")
- Easier to query and filter
- More maintainable

### Why `plannedYear` instead of `plannedDate`?

**Reason:** Simulations run on annual basis:
- Granularity beyond year not needed for retirement planning
- Simpler validation and comparison
- Matches simulation engine's year-by-year approach

### Why separate from recurring expenses instead of new category?

**Reason:** Fundamentally different behavior:
- Recurring expenses repeat indefinitely (or until retirement phases change)
- One-time expenses occur once in a specific year
- Mixing them would complicate both UI and simulation logic

## Known Limitations

1. **⚠️ NOT INCLUDED IN SIMULATIONS YET:** One-time expenses are currently **tracking only**. They are saved to the database and displayed in the UI, but they do NOT affect retirement simulations until Phase 2 (Python integration) is completed. A blue notice box on the Expenses page informs users of this limitation.

2. **Recurring Expenses Not Used:** Current implementation still doesn't use itemized recurring expenses in simulation - only phase-based spending amounts. This is a separate architectural issue.

3. **No Inflation Adjustment:** One-time expense amounts are entered in future dollars - they don't inflate automatically. This is intentional (users enter expected future cost).

4. **No Partial-Year Expenses:** Expenses are applied to full calendar year, not specific months.

5. **No Conditional Expenses:** Can't model "if portfolio > X, then buy car" type logic.

## Production Checklist

### Phase 1: Tracking Only (Ready for Production ✅)

- [x] Database schema updated
- [x] Migration applied to production DB
- [x] API routes updated and tested
- [x] UI implemented and functional
- [x] User notice added (tracking only, not in simulations)
- [x] Documentation updated

**Status:** Phase 1 can be deployed to production now. Users can start tracking one-time expenses.

### Phase 2: Simulation Integration (Not Started)

- [ ] Python API model updated
- [ ] Simulation engine modified
- [ ] Simulation prefill updated
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Remove "tracking only" notice from UI
- [ ] User announcement: One-time expenses now affect simulations

## Next Steps

**Recommended Approach:**

1. **Complete Python Integration** (2-3 hours)
   - Update request model
   - Modify simulation engine
   - Update prefill logic

2. **Test Thoroughly** (1-2 hours)
   - Create test cases
   - Verify calculations
   - Check edge cases

3. **Deploy & Monitor** (1 hour)
   - Deploy to staging
   - Test with real user data
   - Deploy to production
   - Monitor for errors

**Total Estimated Time:** 4-6 hours

## Questions for User

1. **Inflation:** Should one-time expense amounts inflate with general inflation, or are they entered as "future dollars"?

2. **Recurring Expenses:** Should we also integrate recurring expenses into the simulation (bigger project), or keep using phase-based spending?

3. **Validation:** Should there be a maximum total amount for one-time expenses (e.g., can't exceed current portfolio value)?

4. **UI Placement:** Should one-time expenses have their own dedicated section/page, or stay integrated with recurring expenses?

## References

- **Database Schema:** `prisma/schema.prisma:110-135`
- **API Routes:** `app/api/profile/expenses/route.ts:44-89, 107-152`
- **UI Components:** `app/(dashboard)/profile/expenses/page.tsx:6-16, 26-35, 289-336, 459-502`
- **Python API:** `retirezest/juan-retirement-app/api/models/requests.py:135-249`
- **Simulation Engine:** `retirezest/juan-retirement-app/modules/simulation.py`

---

**Implementation Status:** Phase 1 Complete (UI & Database)
**Next Phase:** Python Integration & Testing
**Ready for:** User testing of UI, then backend integration
