# GIC Ladder Planner - Implementation Guide for RetireZest

## Current Implementation Status

### ✅ What's Already Built

**Component:** `components/assets/GICLadderPlanner.tsx` (283 lines)

**Features:**
- Interactive ladder generation (2-10 rungs)
- Real-time statistics calculation
- Editable individual rungs (amount, term, rate)
- Add/remove rungs functionality
- Compound interest maturity calculations
- Visual summary with color-coded cards
- Save callback for integration

**Test Coverage:**
- 26 automated tests (100% pass rate)
- Calculation accuracy verified
- Component structure validated
- UI elements tested

**Status:** ✅ **Component is production-ready but NOT YET INTEGRATED into any page**

---

## How It's Implemented in RetireZest

### 1. Component Architecture

**Location:** `/components/assets/GICLadderPlanner.tsx`

**Component Type:** Client-side React component (`'use client'`)

**Dependencies:**
```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, TrendingUp, Calendar, DollarSign } from 'lucide-react';
```

**Props Interface:**
```typescript
interface GICLadderPlannerProps {
  totalInvestment?: number;           // Default: $50,000
  onLadderCreated?: (gics: GICRung[]) => void;  // Callback when user saves
}
```

**Data Structure:**
```typescript
interface GICRung {
  id: string;              // Unique identifier (e.g., "gic-1", "gic-2")
  amount: number;          // Investment amount per rung
  termMonths: number;      // Term in months (12, 24, 36...)
  interestRate: number;    // Annual interest rate (4.0, 4.2, 4.4...)
  maturityYear: number;    // Year GIC matures (2026, 2027...)
}
```

### 2. State Management

The component uses React hooks to manage state:

```typescript
// Line 28-31
const [investment, setInvestment] = useState(totalInvestment);
const [numRungs, setNumRungs] = useState(5);
const [ladder, setLadder] = useState<GICRung[]>([]);
const [showLadder, setShowLadder] = useState(false);
```

**State Flow:**
1. User enters total investment + number of rungs
2. Clicks "Generate GIC Ladder"
3. Component calculates ladder and shows results
4. User can edit individual rungs
5. User clicks "Save Ladder"
6. `onLadderCreated` callback fires with ladder data

### 3. Core Functions

#### A. Ladder Generation (line 34-48)

```typescript
const generateLadder = () => {
  const currentYear = new Date().getFullYear();
  const amountPerRung = investment / numRungs;

  const newLadder: GICRung[] = Array.from({ length: numRungs }, (_, i) => ({
    id: `gic-${i + 1}`,
    amount: Math.round(amountPerRung),
    termMonths: (i + 1) * 12,              // 1yr, 2yr, 3yr, 4yr, 5yr
    interestRate: 4.0 + i * 0.2,           // 4.0%, 4.2%, 4.4%, 4.6%, 4.8%
    maturityYear: currentYear + (i + 1),
  }));

  setLadder(newLadder);
  setShowLadder(true);
};
```

**Example Output:**
```javascript
// Input: $50,000, 5 rungs
[
  { id: 'gic-1', amount: 10000, termMonths: 12, interestRate: 4.0, maturityYear: 2026 },
  { id: 'gic-2', amount: 10000, termMonths: 24, interestRate: 4.2, maturityYear: 2027 },
  { id: 'gic-3', amount: 10000, termMonths: 36, interestRate: 4.4, maturityYear: 2028 },
  { id: 'gic-4', amount: 10000, termMonths: 48, interestRate: 4.6, maturityYear: 2029 },
  { id: 'gic-5', amount: 10000, termMonths: 60, interestRate: 4.8, maturityYear: 2030 }
]
```

#### B. Statistics Calculation (line 75-84)

**Total Invested:**
```typescript
const totalInvested = ladder.reduce((sum, rung) => sum + rung.amount, 0);
// $10,000 + $10,000 + $10,000 + $10,000 + $10,000 = $50,000
```

**Weighted Average Rate:**
```typescript
const weightedAvgRate = ladder.length > 0
  ? ladder.reduce((sum, rung) => sum + rung.interestRate * rung.amount, 0) / totalInvested
  : 0;

// (4.0% × $10k) + (4.2% × $10k) + (4.4% × $10k) + (4.6% × $10k) + (4.8% × $10k)
// = $2,200 / $50,000 = 4.40%
```

**Average Maturity:**
```typescript
const avgMaturity = ladder.length > 0
  ? ladder.reduce((sum, rung) => sum + rung.termMonths, 0) / ladder.length
  : 0;

// (12 + 24 + 36 + 48 + 60) / 5 = 36 months = 3 years
```

#### C. Maturity Value Calculation (line 254-256)

**Compound Interest Formula:**
```typescript
const maturityValue = rung.amount *
  Math.pow(1 + rung.interestRate / 100, rung.termMonths / 12);

// Example - 5-year GIC:
// $10,000 × (1 + 4.8/100)^(60/12)
// $10,000 × (1.048)^5
// $10,000 × 1.26424
// $12,642
```

#### D. Rung Operations (line 51-73)

**Update Rung:**
```typescript
const updateRung = (id: string, field: keyof GICRung, value: number) => {
  setLadder((prev) =>
    prev.map((rung) => (rung.id === id ? { ...rung, [field]: value } : rung))
  );
};
```

**Remove Rung:**
```typescript
const removeRung = (id: string) => {
  setLadder((prev) => prev.filter((rung) => rung.id !== id));
};
```

**Add Rung:**
```typescript
const addRung = () => {
  const currentYear = new Date().getFullYear();
  const newRung: GICRung = {
    id: `gic-${Date.now()}`,
    amount: 10000,
    termMonths: 12,
    interestRate: 4.0,
    maturityYear: currentYear + 1,
  };
  setLadder((prev) => [...prev, newRung]);
};
```

### 4. UI Layout

The component has two views:

#### View 1: Configuration (line 107-151)
- Total Investment input
- Number of Rungs input (2-10)
- Educational alert explaining GIC ladder strategy
- "Generate GIC Ladder" button

#### View 2: Ladder Display (line 152-278)
- **Summary Statistics** (3 color-coded cards)
  - Total Invested (blue)
  - Weighted Avg Rate (green)
  - Average Maturity (purple)
- **Ladder Rungs** (editable cards)
  - Each rung shows: amount, term, rate
  - Displays maturity year and value
  - Delete button per rung
- **Action Buttons**
  - "Start Over" (reset to configuration)
  - "Save Ladder" (triggers callback)

---

## Integration Options

### Option 1: Add to Assets Page (RECOMMENDED)

**Location:** `app/(dashboard)/profile/assets/page.tsx`

**Why:** The assets page already has GIC-specific fields:
```typescript
// Line 18-24 in assets/page.tsx
gicMaturityDate: string | null;
gicTermMonths: number | null;
gicInterestRate: number | null;
gicCompoundingFrequency: string | null;
gicReinvestStrategy: string | null;
gicIssuer: string | null;
```

**Implementation Steps:**

1. **Add GIC Ladder Tab**
```typescript
// In assets/page.tsx
import { GICLadderPlanner } from '@/components/assets/GICLadderPlanner';

// Add state for showing planner
const [showGICPlanner, setShowGICPlanner] = useState(false);

// Add button to toggle planner
<Button onClick={() => setShowGICPlanner(!showGICPlanner)}>
  {showGICPlanner ? 'Hide GIC Ladder Planner' : 'Plan GIC Ladder'}
</Button>

// Render planner conditionally
{showGICPlanner && (
  <GICLadderPlanner
    totalInvestment={50000}
    onLadderCreated={handleGICLadderCreated}
  />
)}
```

2. **Handle Ladder Creation**
```typescript
const handleGICLadderCreated = async (gics: GICRung[]) => {
  // Create individual GIC assets from ladder
  for (const gic of gics) {
    await fetch('/api/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({
        type: 'gic',
        name: `GIC ${gic.termMonths / 12}-Year (${gic.maturityYear})`,
        balance: gic.amount,
        gicTermMonths: gic.termMonths,
        gicInterestRate: gic.interestRate,
        gicMaturityDate: `${gic.maturityYear}-01-01`,
        gicCompoundingFrequency: 'annual',
        gicReinvestStrategy: 'tbd',
        owner: formData.owner,
      }),
    });
  }

  // Refresh assets list
  fetchAssets();
  setShowGICPlanner(false);
  alert(`GIC Ladder created with ${gics.length} GICs!`);
};
```

**User Flow:**
1. User visits `/profile/assets`
2. Clicks "Plan GIC Ladder" button
3. Enters total investment and number of rungs
4. Reviews generated ladder, edits if needed
5. Clicks "Save Ladder"
6. System creates individual GIC assets
7. Assets appear in main assets list

### Option 2: Standalone GIC Planner Page

**Location:** Create `app/(dashboard)/gic-planner/page.tsx`

**Implementation:**
```typescript
'use client';

import { GICLadderPlanner } from '@/components/assets/GICLadderPlanner';

export default function GICPlannerPage() {
  const handleLadderCreated = (gics: GICRung[]) => {
    console.log('GIC Ladder created:', gics);
    // Save to database or redirect to assets page
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">GIC Ladder Planner</h1>
      <p className="text-gray-600 mb-8">
        Build an optimized GIC ladder to maximize returns while maintaining annual liquidity.
      </p>
      <GICLadderPlanner
        totalInvestment={50000}
        onLadderCreated={handleLadderCreated}
      />
    </div>
  );
}
```

**Navigation:**
Add to sidebar navigation:
```typescript
{
  name: 'GIC Planner',
  href: '/gic-planner',
  icon: CalendarIcon,
}
```

### Option 3: Modal/Dialog Integration

**Location:** Any page with asset creation

**Implementation:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GICLadderPlanner } from '@/components/assets/GICLadderPlanner';

const [showPlannerDialog, setShowPlannerDialog] = useState(false);

<Dialog open={showPlannerDialog} onOpenChange={setShowPlannerDialog}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>GIC Ladder Planner</DialogTitle>
    </DialogHeader>
    <GICLadderPlanner
      totalInvestment={50000}
      onLadderCreated={(gics) => {
        handleGICLadderCreated(gics);
        setShowPlannerDialog(false);
      }}
    />
  </DialogContent>
</Dialog>
```

---

## Database Integration

### Current Asset Schema

The Asset table already supports GIC fields:

```prisma
model Asset {
  id            String    @id @default(uuid())
  userId        String
  type          String    // 'gic'
  name          String
  balance       Float

  // GIC-specific fields
  gicMaturityDate          DateTime?
  gicTermMonths            Int?
  gicInterestRate          Float?
  gicCompoundingFrequency  String?
  gicReinvestStrategy      String?
  gicIssuer                String?

  // ... other fields
}
```

### Saving Ladder to Database

**API Endpoint:** `POST /api/assets`

**Example Request for Each Rung:**
```typescript
const rung = {
  id: 'gic-1',
  amount: 10000,
  termMonths: 12,
  interestRate: 4.0,
  maturityYear: 2026,
};

// Convert to Asset
const assetData = {
  type: 'gic',
  name: `GIC 1-Year (Matures ${rung.maturityYear})`,
  balance: rung.amount,
  gicTermMonths: rung.termMonths,
  gicInterestRate: rung.interestRate,
  gicMaturityDate: new Date(`${rung.maturityYear}-01-01`),
  gicCompoundingFrequency: 'annual',
  gicReinvestStrategy: 'reinvest', // or 'cash-out'
  gicIssuer: 'User-specified',
  owner: 'person1',
};

await fetch('/api/assets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(assetData),
});
```

### Batch Creation Function

```typescript
async function createGICLadder(
  ladder: GICRung[],
  csrfToken: string,
  owner: string = 'person1'
) {
  const promises = ladder.map(async (rung, index) => {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({
        type: 'gic',
        name: `GIC ${rung.termMonths / 12}-Year (Matures ${rung.maturityYear})`,
        description: `Part of GIC ladder - Rung ${index + 1}`,
        balance: rung.amount,
        currentValue: rung.amount, // Initial value
        gicTermMonths: rung.termMonths,
        gicInterestRate: rung.interestRate,
        gicMaturityDate: new Date(`${rung.maturityYear}-01-01`).toISOString(),
        gicCompoundingFrequency: 'annual',
        gicReinvestStrategy: 'reinvest',
        owner: owner,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create GIC rung ${index + 1}`);
    }

    return response.json();
  });

  try {
    const results = await Promise.all(promises);
    console.log(`Created ${results.length} GIC assets successfully`);
    return results;
  } catch (error) {
    console.error('Error creating GIC ladder:', error);
    throw error;
  }
}
```

---

## User Experience Flow

### Typical User Journey

1. **User visits Assets page**
   - Sees existing assets (RRSP, TFSA, GICs, etc.)
   - Notices "Plan GIC Ladder" button

2. **Clicks "Plan GIC Ladder"**
   - Component appears below existing assets
   - Shows configuration form

3. **Enters ladder parameters**
   - Total Investment: $50,000
   - Number of Rungs: 5
   - Sees educational tooltip about ladder strategy

4. **Clicks "Generate GIC Ladder"**
   - Component generates 5 rungs with:
     - Equal amounts ($10,000 each)
     - Staggered terms (1-5 years)
     - Graduated rates (4.0-4.8%)
   - Shows summary statistics:
     - Total: $50,000
     - Avg Rate: 4.40%
     - Avg Maturity: 3 years

5. **Reviews and customizes**
   - User sees each rung with maturity value
   - Can edit amount, term, or rate per rung
   - Can add/remove rungs
   - Statistics update in real-time

6. **Clicks "Save Ladder"**
   - System creates 5 individual GIC assets
   - Each asset appears in assets list
   - User sees confirmation: "GIC Ladder created with 5 GICs!"

7. **Manages ladder over time**
   - As each GIC matures, user decides:
     - Reinvest in new 5-year GIC
     - Use funds for expenses
     - Adjust ladder based on rates

---

## Advanced Features (Future Enhancements)

### 1. Rate Shopping Integration
Connect to live GIC rates from Canadian banks:
```typescript
const fetchCurrentRates = async () => {
  // Call API to get current GIC rates
  const rates = await fetch('/api/gic-rates');
  // Auto-populate ladder with real rates
};
```

### 2. Reinvestment Tracking
Track when GICs mature and suggest reinvestment:
```typescript
const upcomingMaturities = assets.filter(asset =>
  asset.type === 'gic' &&
  isWithinNextYear(asset.gicMaturityDate)
);

// Show notification: "Your 2-year GIC matures in 3 months. Plan reinvestment?"
```

### 3. Ladder Optimization
Suggest optimal ladder based on user goals:
```typescript
const optimizeLadder = (goal: 'liquidity' | 'returns' | 'balanced') => {
  if (goal === 'liquidity') {
    // Shorter terms, more frequent maturities
    return generateLadder({ minTerm: 1, maxTerm: 3 });
  } else if (goal === 'returns') {
    // Longer terms, higher rates
    return generateLadder({ minTerm: 3, maxTerm: 7 });
  }
  // Balanced: Standard 1-5 year ladder
};
```

### 4. Tax Optimization
Calculate after-tax returns for TFSA vs non-registered:
```typescript
const calculateAfterTaxReturn = (
  amount: number,
  rate: number,
  years: number,
  accountType: 'tfsa' | 'rrsp' | 'nonreg',
  taxRate: number = 0.30
) => {
  const grossReturn = amount * Math.pow(1 + rate / 100, years);

  if (accountType === 'tfsa') {
    return grossReturn; // Tax-free
  } else if (accountType === 'nonreg') {
    const interest = grossReturn - amount;
    const tax = interest * taxRate;
    return grossReturn - tax;
  }
  // RRSP: Tax-deferred
  return grossReturn;
};
```

### 5. Portfolio Integration
Show GIC ladder as part of overall asset allocation:
```typescript
const portfolioBreakdown = {
  stocks: 40%,
  bonds: 20%,
  gicLadder: 30%,  // Highlighted
  cash: 10%,
};

// Show pie chart with GIC ladder as guaranteed income component
```

---

## Testing

### Component Testing (Already Implemented)

**Test File:** `test_gic_ladder_logic.js`

**26 Tests Cover:**
- ✅ Ladder generation logic
- ✅ Statistics calculations
- ✅ Maturity value calculations
- ✅ Rung operations (add/remove/edit)
- ✅ Component structure
- ✅ UI elements

**Run Tests:**
```bash
node test_gic_ladder_logic.js
```

### Integration Testing

**Test Ladder Creation:**
```typescript
describe('GIC Ladder Integration', () => {
  it('should create GIC ladder and save to database', async () => {
    // Generate ladder
    const ladder = generateLadder(50000, 5);

    // Save each rung
    for (const rung of ladder) {
      const asset = await createGICAsset(rung);
      expect(asset.type).toBe('gic');
      expect(asset.balance).toBe(rung.amount);
    }

    // Verify in database
    const gics = await fetchGICs();
    expect(gics.length).toBe(5);
  });
});
```

---

## Deployment Checklist

### Pre-Integration Checklist

- ✅ Component built and tested
- ✅ 26 automated tests passing
- ✅ TypeScript compilation successful
- ✅ UI components (Card, Button, Input) available
- ⏳ Database schema supports GIC fields (already exists)
- ⏳ API endpoint `/api/assets` handles GIC creation
- ⏳ Integration point chosen (assets page recommended)
- ⏳ Callback function implemented
- ⏳ User flow tested end-to-end

### Post-Integration Checklist

- [ ] Component renders correctly on target page
- [ ] Ladder generation produces correct values
- [ ] Statistics calculate accurately
- [ ] Rung editing works (add/remove/update)
- [ ] Save callback creates database records
- [ ] Assets appear in assets list
- [ ] Mobile responsive (test on small screens)
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Error handling (network failures, validation)
- [ ] User feedback (success/error messages)

---

## Documentation

**Component Documentation:** `docs/GIC_LADDER_STRATEGY_EXPLAINED.md`
**Implementation Guide:** This file
**Technical Reference:** `docs/SPRINT_5_TECHNICAL_REFERENCE.md`
**Test Results:** `EARLY_RETIREMENT_TEST_RESULTS.md` (includes GIC tests)

---

## Summary

**Current Status:**
- ✅ Component: Built and tested (283 lines)
- ✅ Tests: 26 automated tests (100% pass rate)
- ✅ Documentation: Complete
- ⏳ Integration: NOT YET INTEGRATED

**Recommended Next Steps:**
1. Integrate into `/profile/assets` page
2. Add "Plan GIC Ladder" button
3. Implement `handleGICLadderCreated` callback
4. Test end-to-end user flow
5. Deploy to production

**Effort Estimate:** 2-3 hours for full integration and testing

**Value Proposition:**
- Helps users optimize GIC investments
- Provides educational value (explains ladder strategy)
- Differentiates RetireZest from competitors
- Supports conservative investors and retirees
- Increases user engagement with asset management

---

**Component Location:** `/components/assets/GICLadderPlanner.tsx`
**Ready for Integration:** ✅ YES
**Production Ready:** ✅ YES
**Integration Target:** `/app/(dashboard)/profile/assets/page.tsx`
