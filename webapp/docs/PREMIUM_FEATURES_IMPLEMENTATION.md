# Premium Features - Implementation Guide

**Purpose**: Technical documentation for implementing and maintaining premium subscription features
**Last Updated**: January 31, 2026
**Priority**: P1 (High - Revenue Impact)

---

## Table of Contents

1. [Overview](#overview)
2. [Subscription Tiers](#subscription-tiers)
3. [Feature Gating Implementation](#feature-gating-implementation)
4. [API Endpoint Protection](#api-endpoint-protection)
5. [Frontend UI Changes](#frontend-ui-changes)
6. [Database Schema](#database-schema)
7. [Stripe Integration](#stripe-integration)
8. [Testing & Verification](#testing--verification)
9. [Implementation Status](#implementation-status)

---

## Overview

### Pricing Model

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 simulations max, single market scenario, limited early retirement calc (3/day) |
| **Premium (Monthly)** | **$5.99/month** | Unlimited simulations, all 3 market scenarios, unlimited early retirement calc, CSV/PDF exports |
| **Premium (Yearly)** | **$47/year** | All Premium features + 34% savings ($24.88/year saved) |

### Feature Comparison

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| **Simulation Limit** | ⚠️ **10 max (lifetime)** | ✅ **Unlimited** |
| **Market Scenarios** | ❌ Single (neutral only) | ✅ All 3 (pessimistic, neutral, optimistic) |
| **Early Retirement Calculator** | ⚠️ 3/day limit | ✅ Unlimited |
| **CSV Export** | ❌ No | ✅ Yes |
| **PDF Reports** | ❌ No | ✅ Yes |
| **JSON Data Export** | ❌ No | ✅ Yes |
| **Action Plan** | ⚠️ 5 recommendations | ✅ 10+ recommendations |

---

## Subscription Tiers

### User Model Fields

```prisma
// webapp/prisma/schema.prisma
model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  // ... other fields

  // Subscription fields
  subscriptionTier   String    @default("free")  // "free" | "premium"
  subscriptionStatus String?   // "active" | "canceled" | "past_due" | "trialing"
  stripeCustomerId   String?   @unique
  stripeSubscriptionId String? @unique
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

### Subscription Status Logic

```typescript
// webapp/lib/subscription.ts

export function isPremiumUser(user: User): boolean {
  return (
    user.subscriptionTier === 'premium' &&
    (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')
  );
}

export function canAccessPremiumFeature(user: User, feature: string): boolean {
  if (isPremiumUser(user)) {
    return true;
  }

  // Free tier feature access
  const freeFeatures = ['basic_simulation', 'single_market_scenario'];
  return freeFeatures.includes(feature);
}
```

---

## Feature Gating Implementation

### Feature 1: 10-Simulation Limit (NOT YET IMPLEMENTED)

**Status**: ❌ NOT IMPLEMENTED (See US-045 in backlog)
**Priority**: P1 (High)
**Estimated Effort**: 8 hours (1 day)

**Implementation Plan**:

```typescript
// webapp/app/api/simulation/run/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user with subscription data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  const isPremium = user?.subscriptionTier === 'premium' &&
                   user?.subscriptionStatus === 'active';

  // FREE TIER: Check simulation count
  if (!isPremium) {
    const simulationCount = await prisma.simulationRun.count({
      where: { userId: session.user.id },
    });

    if (simulationCount >= 10) {
      return NextResponse.json({
        success: false,
        message: 'Free tier limit reached',
        error: 'You\'ve used all 10 free simulations. Upgrade to Premium for unlimited simulations!',
        requiresUpgrade: true,
        simulationCount: simulationCount,
        simulationLimit: 10,
        upgradeUrl: '/subscribe',
      }, { status: 403 });
    }
  }

  // Continue with simulation...
  const body = await request.json();
  // ... rest of simulation logic
}
```

**Frontend Implementation**:

```typescript
// webapp/app/simulation/page.tsx

const [simulationCount, setSimulationCount] = useState(0);
const [simulationLimit, setSimulationLimit] = useState(10);

useEffect(() => {
  // Fetch simulation count on page load
  async function fetchSimulationCount() {
    const response = await fetch('/api/user/simulation-count');
    const data = await response.json();
    setSimulationCount(data.count);
  }
  fetchSimulationCount();
}, []);

// Show warning when approaching limit
{simulationCount >= 8 && simulationCount < 10 && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
    <div className="flex">
      <div className="flex-shrink-0">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-yellow-700">
          You've used {simulationCount} of {simulationLimit} free simulations.
          <a href="/subscribe" className="font-medium underline text-yellow-700 hover:text-yellow-600">
            Upgrade to Premium
          </a> for unlimited simulations.
        </p>
      </div>
    </div>
  </div>
)}

// Block simulation when limit reached
{simulationCount >= 10 && (
  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
    <div className="flex">
      <div className="flex-shrink-0">
        <XCircleIcon className="h-5 w-5 text-red-400" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Free Tier Limit Reached</h3>
        <p className="text-sm text-red-700 mt-2">
          You've used all {simulationLimit} free simulations. Upgrade to Premium to run unlimited simulations.
        </p>
        <div className="mt-4">
          <a
            href="/subscribe"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Upgrade Now - $5.99/month
          </a>
        </div>
      </div>
    </div>
  </div>
)}
```

**New API Endpoint** (needs to be created):

```typescript
// webapp/app/api/user/simulation-count/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = await prisma.simulationRun.count({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ count, limit: 10 });
}
```

---

### Feature 2: Multiple Market Scenarios (IMPLEMENTED ✅)

**Status**: ✅ IMPLEMENTED
**Location**: `webapp/app/api/simulation/run/route.ts`

**Implementation**:

```typescript
// Check if user is premium
const isPremium = await checkPremiumStatus(session.user.id);

// Validate market scenario access
if (body.marketScenario && body.marketScenario !== 'neutral' && !isPremium) {
  return NextResponse.json({
    error: 'Premium feature required',
    message: 'Multiple market scenarios are only available for Premium users. Upgrade to access pessimistic and optimistic scenarios.',
    upgradeUrl: '/subscribe',
  }, { status: 403 });
}
```

**Frontend UI**:

```typescript
// webapp/app/simulation/page.tsx

<select
  name="marketScenario"
  value={scenario.marketScenario || 'neutral'}
  onChange={(e) => setScenario({ ...scenario, marketScenario: e.target.value })}
  disabled={!isPremium}
  className={!isPremium ? 'opacity-50 cursor-not-allowed' : ''}
>
  <option value="neutral">Neutral (5% returns)</option>
  <option value="pessimistic" disabled={!isPremium}>
    Pessimistic (3% returns) {!isPremium && '🔒 Premium'}
  </option>
  <option value="optimistic" disabled={!isPremium}>
    Optimistic (7% returns) {!isPremium && '🔒 Premium'}
  </option>
</select>

{!isPremium && (
  <p className="text-sm text-gray-500 mt-1">
    Upgrade to <a href="/subscribe" className="text-blue-600 hover:text-blue-500">Premium</a> to access all 3 market scenarios.
  </p>
)}
```

---

### Feature 3: Early Retirement Calculator Daily Limit (IMPLEMENTED ✅)

**Status**: ✅ IMPLEMENTED
**Location**: `webapp/app/api/early-retirement/calculate/route.ts`

**Implementation**:

```typescript
const isPremium = await checkPremiumStatus(session.user.id);

if (!isPremium) {
  // Check daily usage for free users
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usageToday = await prisma.earlyRetirementCalculation.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: today },
    },
  });

  if (usageToday >= 3) {
    return NextResponse.json({
      error: 'Daily limit reached',
      message: 'Free users can run 3 early retirement calculations per day. Upgrade to Premium for unlimited access.',
      upgradeUrl: '/subscribe',
      resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }, { status: 429 });
  }
}
```

---

### Feature 4: CSV Export (IMPLEMENTED ✅)

**Status**: ✅ IMPLEMENTED
**Location**: `webapp/app/api/simulation/export/csv/route.ts`

**Implementation**:

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPremium = await checkPremiumStatus(session.user.id);

  if (!isPremium) {
    return NextResponse.json({
      error: 'Premium feature required',
      message: 'CSV export is only available for Premium users.',
      upgradeUrl: '/subscribe',
    }, { status: 403 });
  }

  const body = await request.json();
  const { simulationId } = body;

  // Fetch simulation data
  const simulation = await prisma.simulationRun.findUnique({
    where: { id: simulationId },
    include: { scenario: true },
  });

  if (!simulation || simulation.userId !== session.user.id) {
    return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
  }

  // Generate CSV
  const csvData = generateCSV(simulation);

  return new NextResponse(csvData, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="retirement-simulation-${simulationId}.csv"`,
    },
  });
}
```

---

### Feature 5: PDF Reports (IMPLEMENTED ✅)

**Status**: ✅ IMPLEMENTED
**Location**: Frontend component with premium check

**Implementation**:

```typescript
// webapp/components/simulation/ExportButtons.tsx

export function ExportButtons({ simulationResult, isPremium }: { simulationResult: SimulationResult, isPremium: boolean }) {
  const handlePDFExport = async () => {
    if (!isPremium) {
      // Show upgrade modal
      setShowUpgradeModal(true);
      return;
    }

    // Generate PDF
    await generatePDF(simulationResult);
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handlePDFExport}
        disabled={!isPremium}
        className={`btn ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {!isPremium && '🔒 '} Export PDF
      </button>
      {!isPremium && (
        <p className="text-sm text-gray-500">
          <a href="/subscribe" className="text-blue-600 hover:text-blue-500">Upgrade to Premium</a> to export PDFs
        </p>
      )}
    </div>
  );
}
```

---

## API Endpoint Protection

### Reusable Premium Check Function

```typescript
// webapp/lib/subscription.ts

import { prisma } from '@/lib/prisma';

export async function checkPremiumStatus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  return (
    user?.subscriptionTier === 'premium' &&
    (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing')
  );
}

export async function requirePremium(userId: string): Promise<{ error?: { message: string; upgradeUrl: string } }> {
  const isPremium = await checkPremiumStatus(userId);

  if (!isPremium) {
    return {
      error: {
        message: 'This feature requires a Premium subscription.',
        upgradeUrl: '/subscribe',
      },
    };
  }

  return {};
}
```

**Usage in API Routes**:

```typescript
// webapp/app/api/some-premium-feature/route.ts

import { requirePremium } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check premium status
  const premiumCheck = await requirePremium(session.user.id);
  if (premiumCheck.error) {
    return NextResponse.json(premiumCheck.error, { status: 403 });
  }

  // Continue with premium feature logic...
}
```

---

## Frontend UI Changes

### Upgrade Modal Component

```typescript
// webapp/components/subscription/UpgradeModal.tsx

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@heroicons/react/24/outline';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upgrade to Premium</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-600 mb-4">
            <strong>{feature}</strong> is a Premium feature. Unlock unlimited access for just $5.99/month.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Premium Features Include:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Unlimited simulations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>All 3 market scenarios (pessimistic, neutral, optimistic)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Unlimited early retirement calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>CSV and PDF exports</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Comprehensive action plan (10+ recommendations)</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Maybe Later
            </Button>
            <Button
              onClick={() => window.location.href = '/subscribe'}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Upgrade Now - $5.99/month
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Or save 34% with our yearly plan ($47/year)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Premium Badge Component

```typescript
// webapp/components/subscription/PremiumBadge.tsx

'use client';

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-white ${className}`}>
      ⭐ Premium
    </span>
  );
}
```

### Feature Lock Indicator

```typescript
// webapp/components/subscription/FeatureLockIndicator.tsx

'use client';

export function FeatureLockIndicator({ feature, children }: { feature: string; children: React.ReactNode }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      <div className="relative">
        {children}
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-lg cursor-pointer"
             onClick={() => setShowUpgradeModal(true)}>
          <div className="text-center">
            <LockClosedIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Premium Feature</p>
            <p className="text-xs text-gray-500">Upgrade to unlock</p>
          </div>
        </div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
      />
    </>
  );
}
```

---

## Database Schema

### Required Tables

```prisma
// webapp/prisma/schema.prisma

model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  // ... other fields

  // Subscription
  subscriptionTier      String    @default("free")  // "free" | "premium"
  subscriptionStatus    String?   // "active" | "canceled" | "past_due" | "trialing"
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?

  // Relations
  simulations           SimulationRun[]
  earlyRetirementCalcs  EarlyRetirementCalculation[]
}

model SimulationRun {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  // ... other fields
}

model EarlyRetirementCalculation {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  // ... other fields
}
```

---

## Stripe Integration

### Webhook Handler

```typescript
// webapp/app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          subscriptionTier: 'premium',
          subscriptionStatus: subscription.status,
          stripeSubscriptionId: subscription.id,
          subscriptionStartDate: new Date(subscription.current_period_start * 1000),
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        },
      });
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await prisma.user.update({
        where: { stripeCustomerId: deletedSubscription.customer as string },
        data: {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          subscriptionEndDate: new Date(),
        },
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Testing & Verification

### Manual Testing Checklist

#### Free Tier Testing

- [ ] User can run up to 10 simulations
- [ ] 11th simulation blocked with upgrade prompt
- [ ] Only neutral market scenario available
- [ ] Early retirement limited to 3 calculations/day
- [ ] CSV export button disabled with upgrade prompt
- [ ] PDF export button disabled with upgrade prompt
- [ ] Upgrade modals appear correctly

#### Premium Tier Testing

- [ ] User can run unlimited simulations
- [ ] All 3 market scenarios selectable
- [ ] Early retirement unlimited
- [ ] CSV export works
- [ ] PDF export works
- [ ] JSON export works (if implemented)
- [ ] 10+ action plan recommendations shown

#### Stripe Integration Testing

- [ ] Subscription creation updates user tier
- [ ] Subscription cancellation reverts to free tier
- [ ] Webhook signature validation works
- [ ] Payment failure handling works
- [ ] Refund processing works

---

## Implementation Status

### Implemented Features ✅

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Multiple Market Scenarios | ✅ Implemented | `/api/simulation/run/route.ts` | Works correctly |
| Early Retirement Limit | ✅ Implemented | `/api/early-retirement/calculate/route.ts` | 3/day for free |
| CSV Export | ✅ Implemented | `/api/simulation/export/csv/route.ts` | Premium only |
| PDF Reports | ✅ Implemented | Frontend component | Premium only |
| Stripe Subscription | ✅ Implemented | `/api/webhooks/stripe/route.ts` | Webhooks working |
| Billing Portal | ✅ Implemented | `/account/billing` page | Manage subscription |

### Not Yet Implemented ❌

| Feature | Priority | Estimated Effort | User Story |
|---------|----------|------------------|------------|
| **10-Simulation Limit** | P1 (High) | 8 hours (1 day) | **US-045** |
| JSON Data Export | P2 (Medium) | 4 hours | Not yet created |
| Advanced Action Plan (10+ recs) | P2 (Medium) | 16 hours (2 days) | Not yet created |

### US-045: Implement 10-Simulation Limit

**Status**: Added to AGILE_BACKLOG.md
**Epic**: Epic 10 - Monetization & Revenue
**Story Points**: 5
**Acceptance Criteria**: See `/Users/jrcb/Documents/GitHub/retirezest/PREMIUM_FEATURE_SIMULATION_LIMIT.md`

**Next Steps**:
1. Prioritize US-045 for next sprint
2. Follow implementation guide in `PREMIUM_FEATURE_SIMULATION_LIMIT.md`
3. Test thoroughly with free and premium accounts
4. Monitor conversion rates after deployment

---

## References

- **Premium Features Summary**: `/Users/jrcb/Documents/GitHub/retirezest/PREMIUM_FEATURES_SUMMARY.md`
- **Simulation Limit Implementation**: `/Users/jrcb/Documents/GitHub/retirezest/PREMIUM_FEATURE_SIMULATION_LIMIT.md`
- **Stripe Documentation**: https://stripe.com/docs
- **Subscription Page**: https://www.retirezest.com/subscribe

---

**Last Updated**: January 31, 2026
**Next Review**: After US-045 implementation
**Maintained By**: Engineering Team & Product Team
