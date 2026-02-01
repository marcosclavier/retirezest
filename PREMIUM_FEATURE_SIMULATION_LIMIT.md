# Premium Feature: 10 Simulation Limit for Free Users

**Created**: January 30, 2026
**Status**: 🔴 NOT IMPLEMENTED - Needs Development
**Priority**: High (Premium monetization feature)

---

## 📋 Requirement

**Free Tier**: Maximum 10 simulations per user (lifetime)
**Premium Tier**: Unlimited simulations

---

## 🎯 Current State Analysis

### Database Schema (schema.prisma)

#### User Model (Lines 13-100)
```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique

  // Premium subscription fields (ALREADY EXISTS)
  subscriptionTier           String    @default("free") // "free" | "premium"
  subscriptionStatus         String    @default("active")
  stripeCustomerId           String?   @unique
  stripeSubscriptionId       String?   @unique

  // Usage tracking (ALREADY EXISTS)
  earlyRetirementCalcsToday  Int       @default(0)  // Rate limiting for early retirement
  earlyRetirementCalcsDate   DateTime?

  // ❌ MISSING: Simulation count tracking
  // Need to add: simulationCount Int @default(0)

  simulationRuns    SimulationRun[]  // Relationship to all simulations
}
```

#### SimulationRun Model (Lines 301-350)
```prisma
model SimulationRun {
  id                String    @id @default(uuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  // Tracks individual simulation runs
  // ✅ Can count these to enforce limit
}
```

### API Route Analysis

**File**: `/webapp/app/api/simulation/run/route.ts`

**Current Checks**:
1. ✅ Authentication (session required)
2. ✅ Email verification (emailVerified must be true)
3. ❌ **MISSING: Simulation limit check for free users**

**Where to Add Limit Check**: After line 64 (after email verification check)

---

## 🔧 Implementation Plan

### Step 1: Add Simulation Count Tracking

**Option A**: Add counter field to User model (faster queries)
```prisma
model User {
  // Add this field:
  simulationCount  Int  @default(0)  // Total simulations run (lifetime)

  // Existing fields...
  subscriptionTier  String  @default("free")
  simulationRuns    SimulationRun[]
}
```

**Option B**: Count SimulationRun records (no schema change needed)
```typescript
// Count existing simulations
const simulationCount = await prisma.simulationRun.count({
  where: { userId: session.userId }
});
```

**Recommendation**: Use **Option B** initially (no migration needed), add Option A later for performance optimization.

---

### Step 2: Update API Route to Enforce Limit

**File**: `/webapp/app/api/simulation/run/route.ts`

**Location**: After line 64 (after email verification)

```typescript
// After email verification check (line 64)
console.log('✅ Email verified');

// ========== NEW: SIMULATION LIMIT CHECK ==========
console.log('🔍 Checking simulation limit...');

// Check if user is premium
const isPremium = user.subscriptionTier === 'premium' &&
                  user.subscriptionStatus === 'active';

if (!isPremium) {
  // Free user - enforce 10 simulation limit
  const simulationCount = await prisma.simulationRun.count({
    where: { userId: session.userId }
  });

  console.log(`📊 User has run ${simulationCount} simulations`);

  if (simulationCount >= 10) {
    console.log('❌ Simulation limit reached for free user');
    logger.info('Simulation blocked - free tier limit reached', {
      user: session.email,
      simulationCount,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Free tier simulation limit reached',
        error: 'Upgrade to Premium for unlimited simulations',
        error_details: `You've reached the free tier limit of 10 simulations. Upgrade to Premium for unlimited simulations, advanced scenarios, and professional reports.`,
        requiresUpgrade: true,
        simulationCount,
        simulationLimit: 10,
        upgradeUrl: '/subscribe',
        warnings: [],
      },
      { status: 403 }
    );
  }

  console.log(`✅ Simulation ${simulationCount + 1}/10 allowed`);
}
// ========== END NEW CODE ==========

// Continue with existing simulation logic...
const body = await request.json();
```

---

### Step 3: Update Frontend to Show Limit

**File**: `/webapp/app/(dashboard)/simulation/page.tsx`

**Add UI to show remaining simulations**:

```typescript
// Add state for simulation count
const [simulationCount, setSimulationCount] = useState<number | null>(null);
const [simulationLimit] = useState(10);

// Fetch simulation count on mount
useEffect(() => {
  async function fetchSimulationCount() {
    if (!isPremium) {
      try {
        const response = await fetch('/api/user/simulation-count');
        if (response.ok) {
          const data = await response.json();
          setSimulationCount(data.count);
        }
      } catch (err) {
        console.error('Failed to fetch simulation count:', err);
      }
    }
  }

  fetchSimulationCount();
}, [isPremium]);

// Show warning when approaching limit
{!isPremium && simulationCount !== null && (
  <Alert className={simulationCount >= 8 ? 'border-orange-400 bg-orange-50' : 'border-blue-400 bg-blue-50'}>
    <AlertDescription>
      {simulationCount >= 10 ? (
        <>
          <strong>Simulation limit reached!</strong> You've used all 10 free simulations.
          <Button onClick={() => router.push('/subscribe')} className="ml-2">
            Upgrade to Premium
          </Button>
        </>
      ) : simulationCount >= 8 ? (
        <>
          <strong>Almost at limit:</strong> {simulationCount}/{simulationLimit} simulations used.
          Upgrade to Premium for unlimited simulations.
        </>
      ) : (
        <>
          Free tier: {simulationCount}/{simulationLimit} simulations used.
        </>
      )}
    </AlertDescription>
  </Alert>
)}
```

---

### Step 4: Create API Endpoint for Simulation Count

**File**: `/webapp/app/api/user/simulation-count/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Count simulations for this user
    const count = await prisma.simulationRun.count({
      where: { userId: session.userId }
    });

    return NextResponse.json({
      count,
      limit: 10,
      isPremium: false, // Would check subscription tier here
    });
  } catch (error) {
    console.error('Error fetching simulation count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Step 5: Handle Limit Exceeded Error in Frontend

**File**: `/webapp/app/(dashboard)/simulation/page.tsx`

**Update handleRunSimulation function**:

```typescript
const handleRunSimulation = async () => {
  try {
    setIsLoading(true);
    setResult(null);

    const response = await runSimulation(household);

    if (!response.success) {
      // Check if limit exceeded
      if (response.requiresUpgrade) {
        // Show upgrade modal instead of generic error
        setUpgradeFeature('general');
        setShowUpgradeModal(true);

        // Show informative message
        toast.error(
          `Simulation limit reached (${response.simulationCount}/10). Upgrade to Premium for unlimited simulations!`
        );
        return;
      }

      // Handle other errors...
      toast.error(response.message || 'Simulation failed');
      return;
    }

    // Success - increment local count
    if (!isPremium && simulationCount !== null) {
      setSimulationCount(simulationCount + 1);
    }

    setResult(response);
    setActiveTab('results');
  } catch (error) {
    console.error('Simulation error:', error);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🎨 User Experience Flow

### Scenario 1: User at 0-7 Simulations
- ✅ Simulation runs normally
- 💡 Small badge shows "X/10 simulations used (Free)"
- No blocking, gentle awareness

### Scenario 2: User at 8-9 Simulations
- ⚠️ Warning banner appears: "Almost at limit! 8/10 simulations used"
- 💡 Soft CTA: "Upgrade to Premium for unlimited simulations"
- Simulation still runs

### Scenario 3: User at 10 Simulations (Limit Reached)
- 🚫 Simulation blocked
- 🔴 Error message: "Free tier limit reached (10/10)"
- 🎯 Upgrade modal appears automatically
- 💡 Clear CTA: "Upgrade to Premium - $5.99/month for unlimited simulations"

### Scenario 4: Premium User
- ✅ No limits, no warnings
- 👑 Badge shows "Premium - Unlimited simulations"

---

## 📊 Analytics & Tracking

### Metrics to Track

1. **Conversion Rate**: Free users who hit limit → Upgrade to Premium
2. **Drop-off**: Users who hit limit → Churn (stop using app)
3. **Simulation Distribution**: How many users at 1, 2, 3... 10 simulations?
4. **Upgrade Trigger**: Did user upgrade before or after hitting limit?

### Database Logging

```typescript
// Log when limit is hit
await prisma.auditLog.create({
  data: {
    userId: session.userId,
    action: 'SIMULATION_LIMIT_REACHED',
    details: {
      simulationCount: 10,
      tier: 'free',
      timestamp: new Date(),
    },
  },
});
```

---

## 🚀 Migration Plan

### Phase 1: Implement Backend Logic (Day 1)
- [ ] Update `/api/simulation/run/route.ts` with limit check
- [ ] Create `/api/user/simulation-count/route.ts` endpoint
- [ ] Test with free and premium users

### Phase 2: Update Frontend (Day 1-2)
- [ ] Add simulation count display to simulation page
- [ ] Add warning banners (8/10, 9/10)
- [ ] Handle limit exceeded error with upgrade modal
- [ ] Update UpgradeModal to highlight "unlimited simulations"

### Phase 3: Testing (Day 2)
- [ ] Test free user flow (0 → 10 simulations)
- [ ] Test limit reached behavior
- [ ] Test premium user (no limits)
- [ ] Test upgrade flow (free → premium, limit removed)

### Phase 4: Analytics & Monitoring (Day 3)
- [ ] Add conversion tracking
- [ ] Monitor user drop-off at limit
- [ ] A/B test messaging (if needed)

---

## 🔄 Database Migration (Optional - Performance Optimization)

If query performance becomes an issue, add a counter field:

```bash
# Create migration
npx prisma migrate dev --name add-simulation-count

# Migration SQL
ALTER TABLE "User" ADD COLUMN "simulationCount" INTEGER NOT NULL DEFAULT 0;

# Backfill existing counts
UPDATE "User" u
SET "simulationCount" = (
  SELECT COUNT(*) FROM "SimulationRun" sr WHERE sr."userId" = u.id
);
```

**Pros**:
- Faster queries (no COUNT needed)
- Indexed field

**Cons**:
- Requires migration
- Must increment counter on each simulation
- Risk of counter drift if not carefully maintained

**Recommendation**: Start with COUNT query (no migration), optimize later if needed.

---

## 📝 Updated Premium Features List

### Free Tier (Updated)
- ✅ Basic retirement simulation
- ✅ Government benefit estimates (CPP, OAS, GIS)
- ✅ Tax calculations
- ✅ Basic charts and visualizations
- ⚠️ **Maximum 10 simulations (lifetime)**
- ❌ No CSV/PDF exports
- ❌ No early retirement calculator
- ❌ Limited action plan (5 recommendations)

### Premium Tier ($5.99/month or $47/year)
- ✅ **Unlimited simulations** ⭐ NEW HIGHLIGHT
- ✅ All 3 market scenarios (pessimistic, neutral, optimistic)
- ✅ Unlimited early retirement calculations
- ✅ CSV/PDF/JSON exports
- ✅ Advanced charts & visualizations
- ✅ Comprehensive action plan (10+ recommendations)
- ✅ Priority support
- ✅ Early access to new features

---

## 🎯 Marketing Copy

### Upgrade Modal (When Limit Reached)

**Title**: "You've Used All 10 Free Simulations! 🎉"

**Body**:
> Congratulations! You've explored your retirement plan 10 times with RetireZest.
>
> Ready to unlock unlimited simulations and advanced features?
>
> **With Premium, you get**:
> - ✨ **Unlimited retirement simulations**
> - 📊 Multiple market scenarios (pessimistic, neutral, optimistic)
> - 📄 Professional PDF reports
> - 📥 CSV/JSON data exports
> - 🎯 Advanced action plans
> - ⚡ Priority support
>
> **Just $5.99/month** or **$47/year (save 34%)**
>
> [Upgrade to Premium] [Maybe Later]

### In-App Warning (8/10 Simulations)

> **Heads up!** You've used 8 out of 10 free simulations. Upgrade to Premium for unlimited simulations and advanced features. [Learn More]

---

## ✅ Testing Checklist

- [ ] Free user can run exactly 10 simulations
- [ ] 11th simulation is blocked with upgrade prompt
- [ ] Premium user has no limits
- [ ] Simulation count displays correctly in UI
- [ ] Warning appears at 8/10 and 9/10
- [ ] Upgrade modal appears when limit reached
- [ ] Counter increments correctly after each simulation
- [ ] Free → Premium upgrade removes limit immediately
- [ ] Error messages are clear and actionable
- [ ] Analytics tracking works correctly

---

## 📅 Estimated Implementation Time

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Backend Logic | API route update, limit check | 2 hours |
| Frontend UI | Count display, warnings, modals | 3 hours |
| Testing | E2E testing, edge cases | 2 hours |
| Documentation | Update help docs, FAQs | 1 hour |
| **Total** | | **8 hours (1 day)** |

---

## 🚨 Important Considerations

1. **Grandfather Existing Users?**
   - Decision: Do users who already ran >10 simulations get blocked?
   - Recommendation: No - only enforce limit going forward (goodwill gesture)
   - Implementation: Check `createdAt` date, only enforce for new users after feature launch

2. **Reset Counter?**
   - Question: Should counter reset monthly/yearly?
   - Recommendation: **Lifetime limit** (simpler, clearer value prop for Premium)

3. **Early Retirement Calculator**
   - Currently has daily limit (`earlyRetirementCalcsToday`)
   - Should this count toward 10 simulation limit?
   - Recommendation: Keep separate (different feature)

4. **Saved Scenarios**
   - User saves a scenario - does re-running it count as new simulation?
   - Recommendation: **Yes** - each run counts, even from saved scenario

---

**Status**: Ready for implementation
**Next Step**: Get approval on implementation approach, then create user story for Sprint 6
