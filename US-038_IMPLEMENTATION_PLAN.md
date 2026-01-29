# US-038: Income Timing Bug - Implementation Plan (Option 1)

**Date**: January 29, 2026
**Approach**: Remove CPP/OAS/pension fields from Scenario table, always read from Income table
**Estimated Effort**: 8-13 story points (2-3 days)

---

## Implementation Strategy

### Single Source of Truth: Income Table

**Principle**: The `Income` table should be the **only** source of truth for:
- CPP start age and amount
- OAS start age and amount
- Pension start age and amount
- All other income sources

**Why**: This eliminates synchronization bugs and ensures user updates are immediately reflected in all simulations.

---

## Step 1: Database Migration

### Fields to Remove from Scenario Model

```prisma
// BEFORE (Current schema.prisma)
model Scenario {
  id                      String    @id @default(uuid())
  userId                  String

  // Income
  employmentIncome        Float     @default(0)
  pensionIncome           Float     @default(0)  // ❌ REMOVE
  rentalIncome            Float     @default(0)
  otherIncome             Float     @default(0)

  // CPP/OAS
  cppStartAge             Int       @default(65)  // ❌ REMOVE
  oasStartAge             Int       @default(65)  // ❌ REMOVE
  averageCareerIncome     Float     @default(0)
  yearsOfCPPContributions Int       @default(40)
  yearsInCanada           Int       @default(40)

  // ... other fields
}
```

```prisma
// AFTER (New schema.prisma)
model Scenario {
  id                      String    @id @default(uuid())
  userId                  String

  // Income - Remove pension, keep employment/rental/other for backwards compatibility
  // These will also be migrated to Income table eventually
  employmentIncome        Float     @default(0)
  rentalIncome            Float     @default(0)
  otherIncome             Float     @default(0)

  // CPP/OAS calculation params (keep for benefit estimation)
  averageCareerIncome     Float     @default(0)
  yearsOfCPPContributions Int       @default(40)
  yearsInCanada           Int       @default(40)

  // ... other fields
}
```

### Migration File

Create: `prisma/migrations/YYYYMMDD_remove_income_from_scenario/migration.sql`

```sql
-- Remove income-related fields from Scenario table
-- These are now stored in Income table only

ALTER TABLE "Scenario" DROP COLUMN IF EXISTS "pensionIncome";
ALTER TABLE "Scenario" DROP COLUMN IF EXISTS "cppStartAge";
ALTER TABLE "Scenario" DROP COLUMN IF EXISTS "oasStartAge";
```

---

## Step 2: Update Scenario API Endpoints

### File: webapp/app/api/scenarios/route.ts

**Changes**:

1. **Remove from POST handler** (lines 134, 137-138, 168, 171-172):

```typescript
// BEFORE
const projectionInput: ProjectionInput = {
  // ... other fields ...
  pensionIncome: body.pensionIncome || 0,        // ❌ REMOVE
  cppStartAge: body.cppStartAge || 65,           // ❌ REMOVE
  oasStartAge: body.oasStartAge || 65,           // ❌ REMOVE
  // ... other fields ...
};

const scenario = await prisma.scenario.create({
  data: {
    // ... other fields ...
    pensionIncome: body.pensionIncome || 0,      // ❌ REMOVE
    cppStartAge: body.cppStartAge || 65,         // ❌ REMOVE
    oasStartAge: body.oasStartAge || 65,         // ❌ REMOVE
    // ... other fields ...
  },
});
```

```typescript
// AFTER
const projectionInput: ProjectionInput = {
  // ... other fields ...
  // CPP/OAS/pension data will be fetched from Income table at simulation time
  // ... other fields ...
};

const scenario = await prisma.scenario.create({
  data: {
    // ... other fields ...
    // pensionIncome, cppStartAge, oasStartAge removed
    // ... other fields ...
  },
});
```

2. **Remove from GET handler** (lines 51-55):

```typescript
// BEFORE
select: {
  // ... other fields ...
  pensionIncome: true,      // ❌ REMOVE
  cppStartAge: true,        // ❌ REMOVE
  oasStartAge: true,        // ❌ REMOVE
  // ... other fields ...
}
```

```typescript
// AFTER
select: {
  // ... other fields ...
  // pensionIncome, cppStartAge, oasStartAge removed
  // ... other fields ...
}
```

### File: webapp/app/api/scenarios/[id]/route.ts

Similar changes for individual scenario GET/PUT endpoints.

---

## Step 3: Update Simulation Logic

### File: webapp/lib/calculations/projection.ts

**Current State**: Likely uses `ProjectionInput` interface with CPP/OAS fields.

**Changes**:

1. **Update ProjectionInput interface**:

```typescript
// BEFORE
export interface ProjectionInput {
  // ... other fields ...
  pensionIncome: number;       // ❌ REMOVE
  cppStartAge: number;         // ❌ REMOVE
  oasStartAge: number;         // ❌ REMOVE
  // ... other fields ...
}
```

```typescript
// AFTER
export interface ProjectionInput {
  // ... other fields ...
  // CPP/OAS/pension data comes from Income table
  userId?: string;  // ✅ ADD - to fetch Income data
  // ... other fields ...
}
```

2. **Update projectRetirement function** to fetch Income data:

```typescript
// AFTER
export async function projectRetirement(input: ProjectionInput): Promise<ProjectionResult> {
  // Fetch income sources from database
  let cppStartAge = 65;
  let oasStartAge = 65;
  let pensionIncome = 0;

  if (input.userId) {
    const incomeSources = await prisma.income.findMany({
      where: { userId: input.userId },
      select: { type: true, amount: true, startAge: true, frequency: true },
    });

    incomeSources.forEach(income => {
      if (income.type === 'cpp') {
        cppStartAge = income.startAge || 65;
      } else if (income.type === 'oas') {
        oasStartAge = income.startAge || 65;
      } else if (income.type === 'pension') {
        // Convert to annual
        const annual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
        pensionIncome += annual;
      }
    });
  }

  // Continue with projection logic using fetched values
  // ...
}
```

---

## Step 4: Update Python API Calls

### File: webapp/lib/api/simulation-client.ts

**Ensure Python API receives correct data from Income table**:

```typescript
// Build Python API payload
async function buildSimulationPayload(userId: string, scenario: Scenario) {
  // Fetch income sources
  const incomeSources = await prisma.income.findMany({
    where: { userId },
    select: { type: true, amount: true, startAge: true, frequency: true, owner: true },
  });

  // Extract CPP/OAS/pension data
  const incomeByOwner = processIncomeData(incomeSources);

  // Build Python API payload
  return {
    p1: {
      name: 'Person 1',
      start_age: scenario.currentAge,
      cpp_start_age: incomeByOwner.person1.cpp_start_age || 65,
      cpp_annual_at_start: incomeByOwner.person1.cpp_annual_at_start || 0,
      oas_start_age: incomeByOwner.person1.oas_start_age || 65,
      oas_annual_at_start: incomeByOwner.person1.oas_annual_at_start || 0,
      employer_pension_annual: incomeByOwner.person1.employer_pension_annual || 0,
      // ... other fields from scenario
    },
    // ... other fields
  };
}
```

**Note**: The `/api/simulation/prefill` endpoint already does this correctly (lines 175-180), so we can reuse that logic.

---

## Step 5: Update TypeScript Types

### File: webapp/lib/types/simulation.ts

```typescript
// BEFORE
export interface ScenarioData {
  // ... other fields ...
  pensionIncome?: number;       // ❌ REMOVE
  cppStartAge?: number;         // ❌ REMOVE
  oasStartAge?: number;         // ❌ REMOVE
  // ... other fields ...
}
```

```typescript
// AFTER
export interface ScenarioData {
  // ... other fields ...
  // CPP/OAS/pension data removed - fetched from Income table
  // ... other fields ...
}
```

---

## Step 6: Update UI Components

### Files to Update:

1. **webapp/app/(dashboard)/simulation/page.tsx**
   - Remove CPP/OAS start age inputs from scenario form
   - Add note: "Income timing configured in Profile → Income"

2. **webapp/components/simulation/SimulationForm.tsx** (if exists)
   - Remove pension income, CPP start age, OAS start age fields
   - Link to Profile → Income for configuration

3. **webapp/app/(dashboard)/scenarios/[id]/page.tsx** (if exists)
   - Remove display of cppStartAge, oasStartAge, pensionIncome
   - Show "View income settings →" link instead

### Example UI Change:

```tsx
// BEFORE
<div>
  <Label>CPP Start Age</Label>
  <Input
    type="number"
    value={scenario.cppStartAge}
    onChange={(e) => setScenario({...scenario, cppStartAge: parseInt(e.target.value)})}
  />
</div>
```

```tsx
// AFTER
<div>
  <Label>CPP & OAS Timing</Label>
  <p className="text-sm text-muted-foreground">
    Configured in <Link href="/profile/income">Profile → Income</Link>
  </p>
</div>
```

---

## Step 7: Data Migration for Existing Users

### Option A: Migrate Existing Scenario Data to Income Table

**Goal**: If users have scenarios with cppStartAge/oasStartAge/pensionIncome but NO Income records, create Income records from Scenario data.

```typescript
// migration script: scripts/migrate_scenario_income_to_income_table.ts
import { prisma } from '@/lib/prisma';

async function migrateScenarioIncomeToIncomeTable() {
  // Find all users with scenarios but no Income records for CPP/OAS
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  for (const user of users) {
    // Check if user has Income records for CPP/OAS
    const cppIncome = await prisma.income.findFirst({
      where: { userId: user.id, type: 'cpp' },
    });

    const oasIncome = await prisma.income.findFirst({
      where: { userId: user.id, type: 'oas' },
    });

    // Find baseline scenario
    const baselineScenario = await prisma.scenario.findFirst({
      where: { userId: user.id, isBaseline: true },
      select: { cppStartAge: true, oasStartAge: true, pensionIncome: true },
    });

    if (!baselineScenario) continue;

    // Create CPP Income record if missing
    if (!cppIncome && baselineScenario.cppStartAge) {
      await prisma.income.create({
        data: {
          userId: user.id,
          type: 'cpp',
          amount: 0, // Will be calculated by CPP calculator
          startAge: baselineScenario.cppStartAge,
          frequency: 'monthly',
          owner: 'person1',
        },
      });
    }

    // Create OAS Income record if missing
    if (!oasIncome && baselineScenario.oasStartAge) {
      await prisma.income.create({
        data: {
          userId: user.id,
          type: 'oas',
          amount: 0, // Will be calculated by OAS calculator
          startAge: baselineScenario.oasStartAge,
          frequency: 'monthly',
          owner: 'person1',
        },
      });
    }
  }
}
```

### Option B: Accept Data Loss

**Approach**: Let old scenarios become stale. Users will need to re-configure income in Profile → Income.

**Pros**: Simpler, cleaner
**Cons**: User experience degradation for existing users

**Recommendation**: Use Option A for active users (logged in within 30 days), Option B for dormant users.

---

## Step 8: Testing Plan

### Unit Tests

1. **Test scenario creation without CPP/OAS fields**:
   - POST /api/scenarios should succeed without cppStartAge/oasStartAge
   - Scenario should be created with only non-income fields

2. **Test simulation with Income table data**:
   - Create user with Income records (CPP startAge=67, OAS startAge=67)
   - Run simulation
   - Verify simulation uses Income.startAge (not hardcoded 65)

3. **Test prefill endpoint**:
   - Verify /api/simulation/prefill correctly reads from Income table
   - Verify CPP/OAS start ages match Income.startAge

### Integration Tests

1. **Test rightfooty218@gmail.com scenario**:
   - User has CPP startAge=67, OAS startAge=67 in Income table
   - Run simulation
   - Verify CPP income appears at age 67 (not 65)

2. **Test scenario creation flow**:
   - User creates profile → adds income → creates scenario → runs simulation
   - Verify simulation uses Income data throughout

### E2E Tests

```typescript
// e2e/income-timing.spec.ts
test('simulation uses Income table for CPP/OAS timing', async ({ page }) => {
  // Login as test user
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Configure CPP to start at age 67
  await page.goto('/profile/income');
  await page.click('text=Add Income');
  await page.selectOption('select[name="type"]', 'cpp');
  await page.fill('[name="amount"]', '1000');
  await page.fill('[name="startAge"]', '67');
  await page.click('button:has-text("Save")');

  // Run simulation
  await page.goto('/simulation');
  await page.click('button:has-text("Run Simulation")');
  await page.waitForSelector('.simulation-results');

  // Verify CPP appears at age 67
  const age67Row = page.locator('tr:has-text("Age 67")');
  await expect(age67Row).toContainText('CPP');

  const age65Row = page.locator('tr:has-text("Age 65")');
  await expect(age65Row).not.toContainText('CPP');
});
```

---

## Step 9: Deployment Plan

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migration reviewed
- [ ] Data migration script tested on staging
- [ ] UI components updated
- [ ] TypeScript types updated
- [ ] Documentation updated

### Deployment Steps

1. **Run data migration script** (production):
   ```bash
   npm run migrate:scenario-income
   ```

2. **Deploy code changes**:
   ```bash
   git push origin main
   vercel --prod
   ```

3. **Run Prisma migration**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify production**:
   - Test rightfooty218@gmail.com simulation
   - Check Sentry for errors
   - Monitor simulation API success rate

### Rollback Plan

If issues occur:

1. **Revert code deployment**:
   ```bash
   vercel rollback
   ```

2. **Revert database migration** (add columns back):
   ```sql
   ALTER TABLE "Scenario" ADD COLUMN "pensionIncome" FLOAT DEFAULT 0;
   ALTER TABLE "Scenario" ADD COLUMN "cppStartAge" INT DEFAULT 65;
   ALTER TABLE "Scenario" ADD COLUMN "oasStartAge" INT DEFAULT 65;
   ```

---

## Step 10: Post-Deployment

### User Communication

1. **Email rightfooty218@gmail.com**:
   - Subject: "We fixed the income timing issue you reported!"
   - Body: Explain the fix, ask to re-test simulation

2. **Changelog update**:
   - Add to CHANGELOG.md: "Fixed: Income timing now correctly reflects user-configured start ages"

### Monitoring

1. **Track simulation errors** (Sentry)
2. **Monitor user satisfaction scores** (UserFeedback table)
3. **Check for new income timing issues** (support tickets)

---

## Timeline

### Day 1 (Today - Jan 29)
- [x] Investigation complete
- [x] Implementation plan created
- [ ] Database migration created
- [ ] Scenario API updated

### Day 2 (Jan 30)
- [ ] Simulation logic updated
- [ ] UI components updated
- [ ] Data migration script created
- [ ] Tests written

### Day 3 (Jan 31)
- [ ] All tests passing
- [ ] Deploy to staging
- [ ] Run data migration on staging
- [ ] Test with staging data

### Day 4 (Feb 3)
- [ ] Deploy to production
- [ ] Run data migration on production
- [ ] Verify with rightfooty218@gmail.com
- [ ] Email user with fix confirmation

---

## Success Criteria

1. ✅ rightfooty218@gmail.com sees CPP/OAS income at age 67 (not 65)
2. ✅ All existing users' simulations continue to work
3. ✅ New scenarios don't have CPP/OAS/pension fields
4. ✅ All simulations read from Income table
5. ✅ User satisfaction score improves from 1/5 to 4-5/5

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data migration fails | High | Low | Test on staging first, have rollback plan |
| Existing scenarios break | High | Medium | Data migration script preserves data, extensive testing |
| Python API compatibility | Medium | Low | Prefill endpoint already uses correct format |
| User confusion (UI change) | Low | Medium | Clear messaging, link to income configuration |

---

**Document Owner**: Development Team
**Status**: ✅ Ready for Implementation
**Estimated Completion**: February 3, 2026
