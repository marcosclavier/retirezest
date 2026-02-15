# Early Retirement Developer Guide

**Purpose**: Technical guide for implementing early retirement features (age < 60)
**Last Updated**: January 31, 2026
**Priority**: P0 (Critical - User-Facing Issue)

---

## Table of Contents

1. [Early Retirement Overview](#early-retirement-overview)
2. [Technical Challenges](#technical-challenges)
3. [User Stories Reference](#user-stories-reference)
4. [Implementation Guides](#implementation-guides)
5. [Testing Scenarios](#testing-scenarios)
6. [Common Issues & Solutions](#common-issues--solutions)

---

## Early Retirement Overview

### Definition

**Early Retirement**: Retiring before age 60 (the earliest CPP eligibility age)

### Key Canadian Retirement Rules

| Program | Earliest Age | Full Benefit Age | Notes |
|---------|-------------|------------------|-------|
| **CPP** | 60 | 65 | 36% penalty at age 60, 0.6% reduction per month before 65 |
| **OAS** | 65 | 65 | NO early access, cannot start before 65 |
| **GIS** | 65 | 65 | Income-tested, only available when receiving OAS |

### Income Gap Problem

**Scenario**: User retires at age 50
- **Age 50-60** (10 years): NO government benefits, must fund entirely from savings/income
- **Age 60-65** (5 years): CPP only (reduced), NO OAS/GIS
- **Age 65+**: CPP + OAS + GIS (if eligible)

**Financial Impact**:
- Need ~$600K to fund 10 years at $60K/year spending (before considering growth/inflation)
- Actual requirement: $1.5M - $2M depending on expenses and assumptions

---

## Technical Challenges

### Challenge 1: Low Success Rates

**Issue**: Early retirees with insufficient savings show success rates < 10%

**Example** (Real User - glacial-keels-0d@icloud.com):
- Age: 51, retired at 50
- Assets: $0 (RRSP + TFSA + Non-Reg)
- Annual expenses: $60,000
- **Success rate**: 0.6% (plan will fail 99.4% of the time)

**Root Cause**:
- User has NO income or assets to cover age 50-60
- Government benefits don't start until age 60 (CPP) and 65 (OAS)
- App correctly shows plan is not viable

**Technical Solution**: Implement US-046 (Low Success Rate Messaging)

---

### Challenge 2: Baseline Scenario Mismatch

**Issue**: Baseline scenarios default to age 65/province ON instead of user's actual data

**Example**:
- User: Age 51, province QC, target retirement 51
- Baseline scenario: Age 65, province ON, retirement age 65
- **Result**: Simulations use wrong data

**Root Cause**: Baseline scenario creation doesn't pull from user profile

**Technical Solution**: Implement US-047 (Fix Baseline Scenario Auto-Population)

---

### Challenge 3: Missing CPP/OAS Validation

**Issue**: Users can set retirement age < 60 without warnings about benefit timing

**Example**:
- User sets retirement age: 50
- User sets CPP start age: 55 (INVALID - minimum is 60)
- User sets OAS start age: 60 (INVALID - minimum is 65)
- **Result**: Simulation runs with impossible parameters

**Technical Solution**: Implement US-048 (Early Retirement Validation & Warnings)

---

### Challenge 4: User Education Gap

**Issue**: Users don't understand the financial requirements for early retirement

**Example Questions**:
- "Why is my success rate so low?"
- "How much do I need to retire at 50?"
- "Can I take CPP at 55?"

**Technical Solution**: Implement US-049 (Early Retirement Planning Guide)

---

## User Stories Reference

### US-046: Improve Low Success Rate Messaging (8 pts, P0)

**File Location**: `/Users/jrcb/Documents/GitHub/retirezest/EARLY_RETIREMENT_ISSUE_INVESTIGATION.md`

**Acceptance Criteria**:
- [ ] When success rate < 10%, show warning modal with specific reasons
- [ ] Identify exact issues (low savings, early retirement, no income, etc.)
- [ ] Provide 3-5 actionable recommendations
- [ ] Link to relevant help docs
- [ ] Allow user to accept warning or adjust plan

**Technical Implementation**:

```typescript
// webapp/lib/simulation/analysis.ts

interface FailureReason {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  calculation?: string;
  recommendations: string[];
}

export function analyzeFailureReasons(simulation: SimulationResult): FailureReason[] {
  const reasons: FailureReason[] = [];
  const { summary, year_by_year } = simulation;

  // Check 1: Early retirement without adequate savings
  if (simulation.startAge < 60) {
    const gapYears = 60 - simulation.startAge;
    const annualExpenses = year_by_year[0]?.spending_target_after_tax || 60000;
    const fundingNeeded = gapYears * annualExpenses;

    const totalAssets = year_by_year[0]?.end_rrif_p1 +
                       year_by_year[0]?.end_tfsa_p1 +
                       year_by_year[0]?.end_nonreg_p1 || 0;

    if (totalAssets < fundingNeeded) {
      reasons.push({
        type: 'EARLY_RETIREMENT_GAP',
        severity: 'critical',
        message: `Retiring at age ${simulation.startAge} means ${gapYears} years without CPP/OAS benefits`,
        calculation: `${gapYears} years × $${annualExpenses.toLocaleString()}/year = $${fundingNeeded.toLocaleString()} needed. Current assets: $${totalAssets.toLocaleString()}`,
        recommendations: [
          `Delay retirement to age 60 when CPP starts`,
          `Increase savings to at least $${fundingNeeded.toLocaleString()}`,
          `Plan for part-time income until age 60`,
          `Reduce annual expenses to match available income`
        ]
      });
    }
  }

  // Check 2: Zero or very low assets
  const firstYear = year_by_year[0];
  const totalAssets = (firstYear?.end_rrif_p1 || 0) +
                     (firstYear?.end_tfsa_p1 || 0) +
                     (firstYear?.end_nonreg_p1 || 0);

  if (totalAssets < 50000) {
    reasons.push({
      type: 'INSUFFICIENT_ASSETS',
      severity: 'critical',
      message: `Total assets ($${totalAssets.toLocaleString()}) are insufficient for retirement`,
      recommendations: [
        'Continue working to build savings',
        'Consider a part-time retirement instead',
        'Explore downsizing or reducing expenses',
        'Maximize TFSA and RRSP contributions'
      ]
    });
  }

  // Check 3: No income sources
  const hasIncome = (firstYear?.cpp_p1 || 0) > 0 ||
                   (firstYear?.oas_p1 || 0) > 0 ||
                   (firstYear?.pension_income || 0) > 0;

  if (!hasIncome && totalAssets < 500000) {
    reasons.push({
      type: 'NO_INCOME_SOURCES',
      severity: 'high',
      message: 'No income sources available in early retirement years',
      recommendations: [
        'Plan for part-time employment until age 60',
        'Consider rental income from real estate',
        'Delay CPP to maximize benefits (wait until 65-70)',
        'Build dividend portfolio for passive income'
      ]
    });
  }

  // Check 4: High expense ratio
  const annualExpenses = firstYear?.spending_target_after_tax || 0;
  const annualIncome = (firstYear?.cpp_p1 || 0) + (firstYear?.oas_p1 || 0);

  if (annualExpenses > annualIncome * 1.5 && simulation.startAge < 65) {
    reasons.push({
      type: 'HIGH_EXPENSE_RATIO',
      severity: 'high',
      message: `Annual expenses ($${annualExpenses.toLocaleString()}) significantly exceed income ($${annualIncome.toLocaleString()})`,
      recommendations: [
        `Reduce expenses to align with income`,
        `Create a budget for essential vs. discretionary spending`,
        `Consider lifestyle changes (downsizing, relocation)`,
        `Plan for gradual retirement (reduce work hours)`
      ]
    });
  }

  return reasons;
}
```

**UI Component**:

```typescript
// webapp/components/simulation/LowSuccessRateWarning.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { analyzeFailureReasons } from '@/lib/simulation/analysis';

interface LowSuccessRateWarningProps {
  simulation: SimulationResult;
  onContinue: () => void;
  onAdjustPlan: () => void;
}

export function LowSuccessRateWarning({ simulation, onContinue, onAdjustPlan }: LowSuccessRateWarningProps) {
  const [isOpen, setIsOpen] = useState(simulation.successRate < 10);

  const failureReasons = analyzeFailureReasons(simulation);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            Your Retirement Plan Needs Attention
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Rate Display */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-800">
              Your plan has a <strong>{simulation.successRate.toFixed(1)}% success rate</strong>, which means you're likely to run out of money during retirement.
            </p>
          </div>

          {/* Failure Reasons */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Here's why:</h3>
            <div className="space-y-4">
              {failureReasons.map((reason, index) => (
                <div key={index} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">{reason.message}</h4>
                  {reason.calculation && (
                    <p className="text-sm text-yellow-800 mb-2 font-mono">{reason.calculation}</p>
                  )}
                  <div className="mt-3">
                    <p className="text-sm font-medium text-yellow-900 mb-1">Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                      {reason.recommendations.map((rec, recIndex) => (
                        <li key={recIndex}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex gap-4">
            <Button onClick={() => { setIsOpen(false); onContinue(); }} variant="outline" className="flex-1">
              View Results Anyway
            </Button>
            <Button onClick={() => { setIsOpen(false); onAdjustPlan(); }} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Adjust My Plan
            </Button>
          </div>

          {/* Help Link */}
          <div className="text-center">
            <a href="/help/early-retirement" className="text-sm text-blue-600 hover:text-blue-500 underline">
              Learn more about early retirement planning →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### US-047: Fix Baseline Scenario Auto-Population (3 pts, P1)

**Acceptance Criteria**:
- [ ] Calculate user's age from `dateOfBirth` when creating baseline scenario
- [ ] Use user's `province` instead of defaulting to "ON"
- [ ] Use user's `targetRetirementAge` if set, otherwise use current age
- [ ] Set CPP start age to max(60, retirementAge)
- [ ] Set OAS start age to max(65, retirementAge)

**Technical Implementation**:

```typescript
// webapp/app/api/scenario/create-baseline/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if baseline already exists
  const existingBaseline = await prisma.scenario.findFirst({
    where: {
      userId: session.user.id,
      isBaseline: true,
    },
  });

  if (existingBaseline) {
    return NextResponse.json({
      error: 'Baseline scenario already exists',
      scenario: existingBaseline,
    }, { status: 400 });
  }

  // Fetch user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      dateOfBirth: true,
      province: true,
      targetRetirementAge: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Calculate current age from date of birth
  const currentAge = user.dateOfBirth ? calculateAge(new Date(user.dateOfBirth)) : 65;

  // Determine retirement age (use target if set, otherwise current age or 65)
  const retirementAge = user.targetRetirementAge || Math.max(currentAge, 65);

  // Set CPP start age (minimum 60)
  const cppStartAge = Math.max(60, retirementAge);

  // Set OAS start age (minimum 65)
  const oasStartAge = Math.max(65, retirementAge);

  // Create baseline scenario
  const scenario = await prisma.scenario.create({
    data: {
      userId: session.user.id,
      name: 'Baseline',
      description: 'Your default retirement scenario',
      currentAge,
      retirementAge,
      province: user.province || 'ON',
      cppStartAge,
      oasStartAge,
      lifeExpectancy: 95,
      rrspBalance: 0,
      tfsaBalance: 0,
      nonRegBalance: 0,
      liraBalance: 0,
      annualExpenses: 60000,
      isBaseline: true,
    },
  });

  return NextResponse.json({
    success: true,
    scenario,
  }, { status: 201 });
}
```

---

### US-048: Add Early Retirement Validation & Warnings (5 pts, P1)

**Acceptance Criteria**:
- [ ] Detect when `retirementAge < 60`
- [ ] Show warning: "CPP cannot start until age 60"
- [ ] Auto-adjust CPP start age to minimum 60
- [ ] Show warning: "OAS cannot start until age 65"
- [ ] Auto-adjust OAS start age to minimum 65
- [ ] Calculate income gap years and display prominently

**Technical Implementation**:

```typescript
// webapp/components/simulation/EarlyRetirementWarning.tsx

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface EarlyRetirementWarningProps {
  retirementAge: number;
  cppStartAge: number;
  oasStartAge: number;
  onUpdateCPP: (age: number) => void;
  onUpdateOAS: (age: number) => void;
}

export function EarlyRetirementWarning({
  retirementAge,
  cppStartAge,
  oasStartAge,
  onUpdateCPP,
  onUpdateOAS,
}: EarlyRetirementWarningProps) {
  if (retirementAge >= 60) return null;

  const cppGapYears = 60 - retirementAge;
  const oasGapYears = 65 - retirementAge;

  // Auto-adjust ages if needed
  if (cppStartAge < 60) {
    onUpdateCPP(60);
  }
  if (oasStartAge < 65) {
    onUpdateOAS(65);
  }

  return (
    <Alert variant="warning" className="mb-6">
      <ExclamationTriangleIcon className="h-5 w-5" />
      <AlertTitle>Early Retirement Alert</AlertTitle>
      <AlertDescription className="space-y-3 mt-2">
        <div>
          <p className="font-medium">Retiring at age {retirementAge} means:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>
              <strong>{cppGapYears} years</strong> until CPP benefits start (age 60 minimum)
            </li>
            <li>
              <strong>{oasGapYears} years</strong> until OAS benefits start (age 65 minimum)
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            You'll need other income sources to cover:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Age {retirementAge} - 60: No government benefits</li>
            <li>Age 60 - 65: CPP only (no OAS/GIS)</li>
            <li>Age 65+: Full benefits (CPP + OAS + GIS if eligible)</li>
          </ul>
        </div>

        <div>
          <p className="text-sm">
            <strong>Recommendations:</strong>
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li>Build savings to cover {oasGapYears} years of expenses</li>
            <li>Plan for part-time work or other income until age 60</li>
            <li>Consider delaying CPP to age 65-70 for higher benefits</li>
            <li>Explore rental income or dividend investments</li>
          </ul>
        </div>

        <div className="mt-4">
          <a
            href="/help/early-retirement"
            className="text-sm text-blue-600 hover:text-blue-500 underline"
          >
            Learn more about early retirement planning →
          </a>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**Integration in Simulation Form**:

```typescript
// webapp/app/simulation/page.tsx

// Add early retirement warning to simulation form
{scenario.retirementAge < 60 && (
  <EarlyRetirementWarning
    retirementAge={scenario.retirementAge}
    cppStartAge={scenario.cppStartAge}
    oasStartAge={scenario.oasStartAge}
    onUpdateCPP={(age) => setScenario({ ...scenario, cppStartAge: age })}
    onUpdateOAS={(age) => setScenario({ ...scenario, oasStartAge: age })}
  />
)}
```

---

### US-049: Create Early Retirement Planning Guide (2 pts, P2)

**Deliverable**: Create `/help/early-retirement` page

**Content Outline**:

```markdown
# Early Retirement Planning Guide

## What is Early Retirement?

Early retirement means retiring before age 60 - the earliest age you can access CPP benefits.

## Canadian Government Benefits Timeline

### CPP (Canada Pension Plan)
- **Earliest Age**: 60
- **Penalty**: 36% reduction if taken at 60 (0.6% per month before 65)
- **Full Benefit**: Age 65
- **Maximum Benefit**: Age 70 (+42% increase)

### OAS (Old Age Security)
- **Earliest Age**: 65 (NO early access)
- **Full Benefit**: Age 65
- **Enhanced Benefit**: Age 75 (+10%)

### GIS (Guaranteed Income Supplement)
- **Availability**: Only when receiving OAS (age 65+)
- **Income-Tested**: Based on previous year's income
- **Maximum**: $1,065/month (2025) for single seniors

## The Income Gap Problem

If you retire at age 50:
- **Age 50-60** (10 years): NO government benefits
- **Age 60-65** (5 years): CPP only
- **Age 65+**: CPP + OAS + GIS (if eligible)

**Financial Requirement**: You need enough savings to cover 10-15 years WITHOUT government benefits.

## How Much Do You Need?

### Simple Calculation

1. Determine annual expenses: e.g., $60,000/year
2. Calculate years until CPP: e.g., 60 - 50 = 10 years
3. Multiply: $60,000 × 10 = $600,000 minimum
4. Add buffer for inflation and poor market returns: $600,000 × 1.5 = $900,000
5. Add retirement nest egg (age 60+): $500,000
6. **Total needed**: ~$1.4M - $2M

### Rule of Thumb

For every year you retire before age 60, add $60K-$100K to your required savings (depending on expenses).

## Income Gap Strategies

### 1. Part-Time Work
- Work 20 hours/week until age 60
- Covers living expenses, preserves savings
- Maintains social connections
- Example: $30K/year × 10 years = $300K less needed in savings

### 2. Rental Income
- Own rental property generating $2,000/month
- $24K/year passive income
- Reduces savings requirement by $240K (10 years)

### 3. Dividend Portfolio
- Build portfolio generating 4-5% yield
- $500K portfolio = $20-25K/year dividends
- Tax-efficient in non-registered accounts

### 4. Phased Retirement
- Reduce hours gradually instead of hard stop
- Transition from full-time → part-time → retired
- Example: Full salary → 50% salary → part-time → retired

### 5. Geographic Arbitrage
- Move to lower cost-of-living area
- Reduce expenses by 30-40%
- Example: $60K expenses → $40K (saves $200K over 10 years)

## Withdrawal Strategies for Early Retirement

### Recommended Order:
1. **Non-Registered** - Use first (capital gains taxed favorably)
2. **TFSA** - Use sparingly (tax-free growth is valuable)
3. **RRSP/RRIF** - Delay until age 60+ (minimize lifetime taxes)

### Tax Tip:
Keep taxable income LOW before age 65 to maximize GIS eligibility.

## Example Scenarios

### Scenario 1: Successful Early Retirement at Age 55

**Profile**:
- Age: 55
- Retirement age: 55
- Savings: $1.2M ($400K RRSP, $300K TFSA, $500K Non-Reg)
- Annual expenses: $50K
- Plan: Part-time work ($20K/year) until age 60

**Result**: ✅ 92% success rate

**Why it works**:
- Part-time income covers 40% of expenses
- 5-year gap (not 10) before CPP
- Adequate savings ($1.2M)

### Scenario 2: Failed Early Retirement at Age 50

**Profile**:
- Age: 50
- Retirement age: 50
- Savings: $0
- Annual expenses: $60K
- Plan: No income, rely on government benefits

**Result**: ❌ 0.6% success rate

**Why it fails**:
- NO savings to cover age 50-60 (10 years = $600K needed)
- NO income sources
- Government benefits 10-15 years away

## Recommendations

Before retiring early:

1. **Build Adequate Savings**: Use the calculation above
2. **Create Income Sources**: Part-time work, rental, dividends
3. **Reduce Expenses**: Lower cost = lower savings needed
4. **Delay CPP/OAS**: Wait until 65-70 for maximum benefits
5. **Test Your Plan**: Run RetireZest simulation with realistic assumptions
6. **Consult a Professional**: CFP can validate your plan

## Tools & Resources

- **RetireZest Simulator**: Test different retirement ages
- **CRA CPP Calculator**: Estimate your CPP benefits
- **Service Canada**: Official government benefit information

---

**Questions?** Contact us at contact@retirezest.com
```

---

## Testing Scenarios

### Test Scenario 1: Successful Early Retirement (Age 55)

```json
{
  "currentAge": 55,
  "retirementAge": 55,
  "rrspBalance": 400000,
  "tfsaBalance": 300000,
  "nonRegBalance": 500000,
  "annualExpenses": 50000,
  "cppStartAge": 60,
  "oasStartAge": 65,
  "employmentIncome": 20000
}
```

**Expected Result**:
- ✅ Success rate: 85-95%
- ✅ No early retirement warnings (adequate savings)
- ✅ CPP starts at 60, OAS at 65

---

### Test Scenario 2: Failed Early Retirement (Age 50, No Savings)

```json
{
  "currentAge": 50,
  "retirementAge": 50,
  "rrspBalance": 0,
  "tfsaBalance": 0,
  "nonRegBalance": 0,
  "annualExpenses": 60000,
  "cppStartAge": 60,
  "oasStartAge": 65,
  "employmentIncome": 0
}
```

**Expected Result**:
- ❌ Success rate: < 5%
- ⚠️ Low success rate warning modal appears
- ⚠️ Early retirement warning shows 10-year gap
- 📝 Recommendations: Delay retirement, build savings, add income sources

---

### Test Scenario 3: Invalid CPP/OAS Ages (User Error)

```json
{
  "currentAge": 50,
  "retirementAge": 50,
  "cppStartAge": 55,  // INVALID - minimum is 60
  "oasStartAge": 60,  // INVALID - minimum is 65
}
```

**Expected Result**:
- ⚠️ Validation warning appears
- 🔧 CPP start age auto-adjusted to 60
- 🔧 OAS start age auto-adjusted to 65
- 📝 Warning explains government benefit rules

---

## Common Issues & Solutions

### Issue 1: "Why is my success rate so low?"

**Symptoms**:
- Success rate < 10%
- Early retirement age (< 60)
- Low or zero savings

**Solution**:
- Implement US-046 (Low Success Rate Messaging)
- Show specific failure reasons
- Provide actionable recommendations

---

### Issue 2: "Baseline scenario shows wrong age/province"

**Symptoms**:
- Baseline scenario defaults to age 65, province ON
- User is age 51, province QC
- Simulations use incorrect baseline

**Solution**:
- Implement US-047 (Fix Baseline Scenario Auto-Population)
- Calculate age from dateOfBirth
- Use user's province from profile

---

### Issue 3: "Can I take CPP at age 55?"

**Symptoms**:
- User sets CPP start age < 60
- No validation or warning shown
- Simulation runs with impossible parameters

**Solution**:
- Implement US-048 (Early Retirement Validation)
- Auto-adjust CPP to minimum 60
- Auto-adjust OAS to minimum 65
- Show warning explaining rules

---

## References

- **Investigation Report**: `/Users/jrcb/Documents/GitHub/retirezest/EARLY_RETIREMENT_ISSUE_INVESTIGATION.md`
- **User Stories**: US-046, US-047, US-048, US-049 in `AGILE_BACKLOG.md`
- **CRA CPP Info**: https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
- **Service Canada OAS**: https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html

---

**Last Updated**: January 31, 2026
**Maintained By**: Engineering Team
**Next Review**: After US-046 through US-049 implementation
