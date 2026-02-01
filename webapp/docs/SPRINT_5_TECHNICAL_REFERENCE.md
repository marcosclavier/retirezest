# Sprint 5 Technical Reference

**Sprint**: Sprint 5 (Jan 31 - Feb 13, 2026)
**Goal**: Address user feedback issues and improve simulation accuracy & transparency
**Status**: Ready for Execution
**Last Updated**: January 31, 2026

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [User Stories & Technical Specifications](#user-stories--technical-specifications)
3. [File Locations & Code References](#file-locations--code-references)
4. [Database Schema Reference](#database-schema-reference)
5. [API Endpoints](#api-endpoints)
6. [Testing Requirements](#testing-requirements)
7. [Deployment Checklist](#deployment-checklist)

---

## Sprint Overview

### Committed User Stories (18 points)

| Story | Title | Points | Priority | Status |
|-------|-------|--------|----------|--------|
| US-040 | Enhance What-If Analysis Dashboard | 5 | P0 | Ready |
| US-041 | Add LIRA Account Support in Simulation | 3 | P1 | Ready |
| US-042 | Improve Simulation Results Page UX | 2 | P1 | Ready |
| US-013 | Add RRIF Withdrawal Validation (CRA Rules) | 8 | P1 | Needs Investigation |

### Sprint Capacity

- **Team Capacity**: 30 story points (10 days × 3 pts/day)
- **Committed**: 18 story points (60% - Conservative)
- **Buffer**: 12 story points (40%)

---

## User Stories & Technical Specifications

### US-040: Enhance What-If Analysis Dashboard (5 points)

**Epic**: Epic 5 - Simulation Accuracy & Features
**Priority**: P0 (Critical)
**Status**: Ready for Development

#### Description

As a user, I want to see side-by-side visual comparisons when using What-If sliders, so I can understand the impact of my decisions.

#### Acceptance Criteria

- [ ] Interactive sliders for key variables (retirement age, CPP start age, OAS start age, annual spending)
- [ ] Real-time simulation comparison (baseline vs. modified)
- [ ] Visual indicators: Success rate difference, Estate value difference, Shortfall years
- [ ] Highlight in green (improvement) or red (worse)
- [ ] Mobile-responsive layout (sliders stack vertically)

#### Technical Implementation

**Files to Modify**:
- `webapp/app/early-retirement/page.tsx` - Main page component
- `webapp/components/early-retirement/ComparisonView.tsx` - NEW - Comparison UI
- `webapp/components/early-retirement/WhatIfSliders.tsx` - NEW - Slider controls

**Dependencies**:
- Recharts (already installed)
- shadcn/ui components (Card, Slider, Badge)
- Existing simulation API (`/api/simulation/run`)

**Code Structure**:

```typescript
// webapp/components/early-retirement/WhatIfSliders.tsx
'use client';

import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface WhatIfSlidersProps {
  baselineScenario: Scenario;
  onScenarioChange: (modifiedScenario: Scenario) => void;
}

export function WhatIfSliders({ baselineScenario, onScenarioChange }: WhatIfSlidersProps) {
  const [retirementAge, setRetirementAge] = useState(baselineScenario.retirementAge);
  const [cppStartAge, setCppStartAge] = useState(baselineScenario.cppStartAge);
  const [oasStartAge, setOasStartAge] = useState(baselineScenario.oasStartAge);
  const [annualSpending, setAnnualSpending] = useState(baselineScenario.annualExpenses);

  // Debounce simulation updates
  const debouncedUpdate = useMemo(
    () => debounce((scenario) => onScenarioChange(scenario), 500),
    [onScenarioChange]
  );

  useEffect(() => {
    debouncedUpdate({
      ...baselineScenario,
      retirementAge,
      cppStartAge,
      oasStartAge,
      annualExpenses: annualSpending,
    });
  }, [retirementAge, cppStartAge, oasStartAge, annualSpending]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>What-If Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Retirement Age Slider */}
        <div>
          <label className="text-sm font-medium">
            Retirement Age: {retirementAge}
          </label>
          <Slider
            value={[retirementAge]}
            onValueChange={([value]) => setRetirementAge(value)}
            min={50}
            max={70}
            step={1}
          />
        </div>

        {/* CPP Start Age Slider */}
        <div>
          <label className="text-sm font-medium">
            CPP Start Age: {cppStartAge}
          </label>
          <Slider
            value={[cppStartAge]}
            onValueChange={([value]) => setCppStartAge(value)}
            min={60}
            max={70}
            step={1}
          />
        </div>

        {/* OAS Start Age Slider */}
        <div>
          <label className="text-sm font-medium">
            OAS Start Age: {oasStartAge}
          </label>
          <Slider
            value={[oasStartAge]}
            onValueChange={([value]) => setOasStartAge(value)}
            min={65}
            max={70}
            step={1}
          />
        </div>

        {/* Annual Spending Slider */}
        <div>
          <label className="text-sm font-medium">
            Annual Spending: ${annualSpending.toLocaleString()}
          </label>
          <Slider
            value={[annualSpending]}
            onValueChange={([value]) => setAnnualSpending(value)}
            min={20000}
            max={150000}
            step={5000}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

```typescript
// webapp/components/early-retirement/ComparisonView.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonViewProps {
  baselineResult: SimulationResult;
  modifiedResult: SimulationResult;
}

export function ComparisonView({ baselineResult, modifiedResult }: ComparisonViewProps) {
  const successRateDiff = modifiedResult.successRate - baselineResult.successRate;
  const estateValueDiff = modifiedResult.summary.finalEstateValue - baselineResult.summary.finalEstateValue;

  const comparisonData = [
    {
      metric: 'Success Rate',
      baseline: baselineResult.successRate,
      modified: modifiedResult.successRate,
    },
    {
      metric: 'Final Estate',
      baseline: baselineResult.summary.finalEstateValue / 1000,
      modified: modifiedResult.summary.finalEstateValue / 1000,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Success Rate */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Success Rate Change</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {successRateDiff > 0 ? '+' : ''}{successRateDiff.toFixed(1)}%
              </span>
              <Badge variant={successRateDiff >= 0 ? 'success' : 'destructive'}>
                {successRateDiff >= 0 ? '▲ Better' : '▼ Worse'}
              </Badge>
            </div>
          </div>

          {/* Estate Value */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Estate Value Change</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {estateValueDiff >= 0 ? '+' : ''}${(estateValueDiff / 1000).toFixed(0)}k
              </span>
              <Badge variant={estateValueDiff >= 0 ? 'success' : 'destructive'}>
                {estateValueDiff >= 0 ? '▲ Better' : '▼ Worse'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="baseline" fill="#94a3b8" name="Baseline" />
            <Bar dataKey="modified" fill="#3b82f6" name="Modified" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**API Calls**:
- `POST /api/simulation/run` - Run simulation for modified scenario
- Uses existing simulation engine, no backend changes needed

**Testing**:
- [ ] Sliders update UI in real-time (< 500ms debounce)
- [ ] Success rate difference calculates correctly
- [ ] Green/red indicators show appropriate colors
- [ ] Mobile layout stacks sliders vertically
- [ ] Charts render correctly on all screen sizes

---

### US-041: Add LIRA Account Support in Simulation (3 points)

**Epic**: Epic 5 - Simulation Accuracy & Features
**Priority**: P1 (High)
**Status**: Ready for Development

#### Description

As a user with a LIRA account, I want the simulation to include my LIRA balance and withdrawals, so I get accurate retirement projections.

#### Acceptance Criteria

- [ ] Add LIRA balance input field to simulation form
- [ ] LIRA withdrawals follow locked-in rules (age 55+ unlocking)
- [ ] LIRA treated as tax-deferred (like RRSP/RRIF)
- [ ] LIRA shown separately in results breakdown
- [ ] Support LIRA → LIF conversion at retirement age

#### Technical Implementation

**Files to Modify**:
- `webapp/prisma/schema.prisma` - Add `liraBalance` to Scenario model
- `webapp/app/simulation/page.tsx` - Add LIRA input field
- `juan-retirement-app/modules/models.py` - Add `lira_balance` to Person model
- `juan-retirement-app/modules/simulation.py` - Add LIRA withdrawal logic
- `webapp/components/simulation/ResultsDashboard.tsx` - Display LIRA in charts

**Database Migration**:

```prisma
// webapp/prisma/schema.prisma
model Scenario {
  // ... existing fields
  liraBalance         Float    @default(0)
  // ... rest of fields
}
```

```bash
# Run migration
npx prisma migrate dev --name add_lira_balance
npx prisma generate
```

**Backend Changes** (Python Simulation Engine):

```python
# juan-retirement-app/modules/models.py
@dataclass
class Person:
    # ... existing fields
    lira_balance: float = 0.0
    yield_lira_growth: float = 0.05  # Same as RRIF
```

```python
# juan-retirement-app/modules/simulation.py
# Line ~1350 - Add LIRA to withdrawal logic

def simulate_year(person, hh, year, ...):
    # ... existing code

    # LIRA unlocking at age 55+
    if age >= 55 and person.lira_balance > 0:
        # LIRA becomes available for withdrawal
        # Treat as tax-deferred (like RRIF)
        lira_withdrawal = 0.0

        # Withdraw from LIRA if needed after RRIF
        if after_tax_target > 0:
            lira_withdrawal = min(after_tax_target, person.lira_balance)
            taxable_income += lira_withdrawal
            after_tax_target -= lira_withdrawal

        # Update LIRA balance
        person.lira_balance = max(person.lira_balance - lira_withdrawal, 0.0) * (1 + person.yield_lira_growth)

    # ... rest of logic
```

**Frontend Changes**:

```typescript
// webapp/app/simulation/page.tsx
// Add LIRA input field in form
<div>
  <label htmlFor="liraBalance" className="block text-sm font-medium text-gray-700">
    LIRA Balance
  </label>
  <input
    type="number"
    id="liraBalance"
    name="liraBalance"
    value={scenario.liraBalance || 0}
    onChange={(e) => setScenario({ ...scenario, liraBalance: parseFloat(e.target.value) || 0 })}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  />
  <p className="mt-1 text-sm text-gray-500">
    Locked-in Retirement Account (available at age 55+)
  </p>
</div>
```

**Testing**:
- [ ] LIRA input field accepts values
- [ ] LIRA balance saved to database correctly
- [ ] LIRA withdrawals only occur at age 55+
- [ ] LIRA withdrawals are taxed as income
- [ ] LIRA balance shown in results dashboard
- [ ] LIRA depletes correctly over time

**Notes**:
- LIRA withdrawal limits vary by province (future enhancement)
- For MVP, treat LIRA like RRIF with age 55+ unlocking
- No minimum withdrawal requirement (unlike RRIF)

---

### US-042: Improve Simulation Results Page UX (2 points)

**Epic**: Epic 5 - Simulation Accuracy & Features
**Priority**: P1 (High)
**Status**: Ready for Development

#### Description

As a user viewing simulation results, I want a clearer, more visually appealing results page, so I can understand my retirement plan at a glance.

#### Acceptance Criteria

- [ ] Hero section with key metrics (success rate, estate value, shortfall years)
- [ ] Collapsible chart sections (Income, Assets, Taxes, Government Benefits)
- [ ] Export buttons (CSV, PDF) positioned prominently
- [ ] Mobile-responsive layout (cards stack vertically)
- [ ] Loading states while simulation runs

#### Technical Implementation

**Files to Modify**:
- `webapp/components/simulation/ResultsHeroSection.tsx` - Already exists, enhance
- `webapp/components/simulation/ResultsDashboard.tsx` - Add collapsible sections
- `webapp/app/simulation/page.tsx` - Add loading state

**UI Enhancements**:

```typescript
// webapp/components/simulation/ResultsHeroSection.tsx
// Add visual indicators for success rate

export function ResultsHeroSection({ result }: { result: SimulationResult }) {
  const successRateColor = result.successRate >= 80 ? 'text-green-600' :
                           result.successRate >= 50 ? 'text-yellow-600' :
                           'text-red-600';

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Success Rate */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Success Rate</h3>
          <div className={`text-5xl font-bold ${successRateColor}`}>
            {result.successRate.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {result.successRate >= 80 ? 'Excellent ✓' :
             result.successRate >= 50 ? 'Moderate ⚠' :
             'Needs Improvement ✗'}
          </p>
        </div>

        {/* Estate Value */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Final Estate Value</h3>
          <div className="text-5xl font-bold text-blue-600">
            ${(result.summary.finalEstateValue / 1000).toFixed(0)}k
          </div>
          <p className="text-sm text-gray-500 mt-2">
            At age {result.summary.endAge}
          </p>
        </div>

        {/* Shortfall Years */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Shortfall Years</h3>
          <div className={`text-5xl font-bold ${result.summary.shortfallYears > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {result.summary.shortfallYears}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {result.summary.shortfallYears === 0 ? 'No shortfalls ✓' : 'Years with shortfalls ✗'}
          </p>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// webapp/components/simulation/ResultsDashboard.tsx
// Add collapsible sections using Accordion

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ResultsDashboard({ result }: { result: SimulationResult }) {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={["income", "assets"]}>
        <AccordionItem value="income">
          <AccordionTrigger>Income Breakdown</AccordionTrigger>
          <AccordionContent>
            <IncomeChart chartData={result.year_by_year} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="assets">
          <AccordionTrigger>Asset Balances</AccordionTrigger>
          <AccordionContent>
            <AssetBalanceChart chartData={result.year_by_year} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="taxes">
          <AccordionTrigger>Tax Analysis</AccordionTrigger>
          <AccordionContent>
            <TaxChart chartData={result.year_by_year} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="benefits">
          <AccordionTrigger>Government Benefits</AccordionTrigger>
          <AccordionContent>
            <GovernmentBenefitsChart chartData={result.year_by_year} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

**Loading State**:

```typescript
// webapp/app/simulation/page.tsx
const [isLoading, setIsLoading] = useState(false);

const runSimulation = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/simulation/run', { ... });
    // ... handle response
  } finally {
    setIsLoading(false);
  }
};

// In JSX
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Running simulation...</span>
  </div>
) : (
  <ResultsDashboard result={simulationResult} />
)}
```

**Testing**:
- [ ] Hero section displays correct metrics
- [ ] Success rate color changes based on percentage
- [ ] Accordion sections expand/collapse smoothly
- [ ] Loading spinner shows while simulation runs
- [ ] Mobile layout stacks cards vertically
- [ ] Export buttons work (CSV, PDF)

---

### US-013: Add RRIF Withdrawal Validation (CRA Rules) (8 points)

**Epic**: Epic 5 - Simulation Accuracy & Features
**Priority**: P1 (High)
**Status**: Needs Investigation

#### Description

As a user with RRIF accounts, I want the simulation to enforce CRA minimum withdrawal rules, so my projections are legally compliant.

#### Acceptance Criteria

- [ ] RRIF minimum withdrawals calculated using CRA age-based table
- [ ] Withdrawals cannot be less than minimum (error/warning shown)
- [ ] UI shows minimum withdrawal amount for current age
- [ ] Validation runs on simulation before execution
- [ ] Error messages guide user to fix non-compliant scenarios

#### Technical Investigation Required

**Questions to Answer** (Days 1-2 of Sprint):

1. **Where is RRIF logic currently implemented?**
   - Location: `juan-retirement-app/modules/simulation.py`
   - Function: `simulate_year()` around line 1350-2500
   - Search for: "rrif_min_rate" or "RRIF_MIN"

2. **Is CRA minimum withdrawal table already in the code?**
   - Check: `juan-retirement-app/modules/simulation.py` for `RRIF_MIN` dict
   - Check: `juan-retirement-app/modules/config.py` for tax config tables
   - Expected format:
     ```python
     RRIF_MIN_WITHDRAWAL_RATES = {
         71: 0.0528,  # 5.28%
         72: 0.0540,  # 5.40%
         # ... rest of ages
         95: 0.2000,  # 20.00%
     }
     ```

3. **How are withdrawals currently calculated?**
   - Look for withdrawal strategy logic
   - Check if RRIF minimum is enforced
   - Identify if validation exists

4. **What happens if user inputs violate RRIF minimum?**
   - Does simulation fail?
   - Is there a warning?
   - Is the minimum auto-applied?

**Investigation Tasks**:

```bash
# Search for RRIF minimum logic
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
grep -r "rrif_min" modules/
grep -r "RRIF_MIN" modules/
grep -r "minimum_withdrawal" modules/

# Read key sections of simulation.py
# Line 1350-2500 (simulate_year function)
```

**Expected Findings**:

If RRIF logic exists:
- [ ] Document current implementation
- [ ] Identify gaps (missing validation, incorrect table, etc.)
- [ ] Estimate effort for fixes (likely 3-5 hours)

If RRIF logic doesn't exist:
- [ ] Design implementation approach
- [ ] Add RRIF minimum table to config
- [ ] Add validation to simulation engine
- [ ] Estimate effort (likely 8-10 hours = full 8 points)

**Implementation Plan** (After Investigation):

Will be determined based on findings. Likely approach:

```python
# juan-retirement-app/modules/simulation.py

RRIF_MIN_WITHDRAWAL_RATES = {
    71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567, 75: 0.0582,
    76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682,
    81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851,
    86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192,
    91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879, 95: 0.2000,
}

def calculate_rrif_minimum(rrif_balance: float, age: int) -> float:
    """
    Calculate RRIF minimum withdrawal based on CRA rules.

    Args:
        rrif_balance: Current RRIF balance
        age: Person's age

    Returns:
        Minimum withdrawal amount
    """
    if age < 71:
        return 0.0  # No minimum before RRIF conversion

    rate = RRIF_MIN_WITHDRAWAL_RATES.get(age, 0.20)  # Default to 20% for 95+
    return rrif_balance * rate

def validate_rrif_withdrawal(rrif_withdrawal: float, rrif_balance: float, age: int) -> tuple[bool, str]:
    """
    Validate that RRIF withdrawal meets CRA minimum requirements.

    Returns:
        (is_valid, error_message)
    """
    if age < 71:
        return (True, "")

    minimum_withdrawal = calculate_rrif_minimum(rrif_balance, age)

    if rrif_withdrawal < minimum_withdrawal:
        return (
            False,
            f"RRIF withdrawal (${rrif_withdrawal:,.0f}) is below CRA minimum (${minimum_withdrawal:,.0f}) for age {age}. "
            f"Minimum rate: {RRIF_MIN_WITHDRAWAL_RATES.get(age, 0.20) * 100:.2f}%"
        )

    return (True, "")

# In simulate_year function:
if age >= 71 and person.rrif_balance > 0:
    rrif_min = calculate_rrif_minimum(person.rrif_balance, age)

    # Ensure minimum withdrawal is taken
    rrif_withdrawal = max(rrif_withdrawal, rrif_min)

    # Validate
    is_valid, error_msg = validate_rrif_withdrawal(rrif_withdrawal, person.rrif_balance, age)
    if not is_valid:
        raise ValueError(error_msg)
```

**Testing**:
- [ ] RRIF minimum calculated correctly for all ages 71-95+
- [ ] Withdrawals below minimum trigger validation error
- [ ] Error message shows correct minimum amount and rate
- [ ] Simulation auto-applies minimum if user input is too low
- [ ] Test with edge cases (age 70→71 transition, age 95+)

**Timeline**:
- Days 1-2: Investigation and documentation
- Days 3-7: Implementation based on findings
- Days 8-9: Testing and bug fixes
- Day 10: Code review and merge

---

## File Locations & Code References

### Frontend (Next.js/TypeScript)

| File Path | Purpose | Key Functions |
|-----------|---------|---------------|
| `webapp/app/early-retirement/page.tsx` | Early retirement calculator page | Main page component |
| `webapp/app/simulation/page.tsx` | Main simulation page | `runSimulation()`, form handling |
| `webapp/components/simulation/ResultsDashboard.tsx` | Results visualization | Chart rendering |
| `webapp/components/simulation/ResultsHeroSection.tsx` | Results summary | Key metrics display |
| `webapp/prisma/schema.prisma` | Database schema | Scenario, SimulationRun models |

### Backend (Python Simulation Engine)

| File Path | Purpose | Key Functions |
|-----------|---------|---------------|
| `juan-retirement-app/modules/simulation.py` | Core simulation engine | `simulate()`, `simulate_year()` |
| `juan-retirement-app/modules/models.py` | Data models | Person, Household, YearResult |
| `juan-retirement-app/modules/config.py` | Tax configuration | `load_tax_config()` |
| `juan-retirement-app/api/main.py` | FastAPI entry point | `/simulate` endpoint |

### API Routes

| Route | File | HTTP Method | Purpose |
|-------|------|-------------|---------|
| `/api/simulation/run` | `webapp/app/api/simulation/run/route.ts` | POST | Run simulation |
| `/api/scenario/[id]` | `webapp/app/api/scenario/[id]/route.ts` | GET, PUT, DELETE | CRUD scenarios |

---

## Database Schema Reference

### Scenario Model

```prisma
model Scenario {
  id                      String   @id @default(uuid())
  userId                  String
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                    String
  description             String?

  // Personal info
  currentAge              Int
  retirementAge           Int
  lifeExpectancy          Int      @default(95)
  province                String   @default("ON")

  // Assets
  rrspBalance             Float    @default(0)
  tfsaBalance             Float    @default(0)
  nonRegBalance           Float    @default(0)
  liraBalance             Float    @default(0)  // NEW in Sprint 5

  // Income
  employmentIncome        Float    @default(0)
  pensionIncome           Float    @default(0)

  // CPP/OAS
  cppStartAge             Int      @default(65)
  oasStartAge             Int      @default(65)

  // Expenses
  annualExpenses          Float

  // RRIF
  rrspToRrifAge           Int      @default(71)

  isBaseline              Boolean  @default(false)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  simulations             SimulationRun[]
}
```

### SimulationRun Model

```prisma
model SimulationRun {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scenarioId      String?
  scenario        Scenario? @relation(fields: [scenarioId], references: [id], onDelete: SetNull)

  strategy        String   // withdrawal strategy
  province        String
  startAge        Int
  successRate     Float?

  createdAt       DateTime @default(now())
}
```

---

## API Endpoints

### POST /api/simulation/run

**Purpose**: Execute retirement simulation

**Request Body**:
```typescript
{
  scenarioId: string;
  strategy: 'balanced' | 'minimize-income' | 'rrif-frontload' | 'constant-percentage' | 'tfsa-first';
}
```

**Response**:
```typescript
{
  success: boolean;
  result: {
    successRate: number;
    summary: {
      finalEstateValue: number;
      shortfallYears: number;
      endAge: number;
    };
    year_by_year: Array<{
      year: number;
      age_p1: number;
      total_income: number;
      end_rrif_p1: number;
      end_tfsa_p1: number;
      end_nonreg_p1: number;
      // ... 50+ more fields
    }>;
  };
}
```

**Error Responses**:
- `400 Bad Request` - Missing or invalid parameters
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Simulation limit reached (free tier)
- `500 Internal Server Error` - Simulation engine error

**Rate Limiting**:
- Free tier: 10 simulations max (lifetime)
- Premium tier: Unlimited

---

## Testing Requirements

### Unit Tests (Not Yet Implemented)

**Priority Tests for Sprint 5**:

```typescript
// webapp/__tests__/simulation/rrif-minimum.test.ts
describe('RRIF Minimum Withdrawal', () => {
  test('calculates correct minimum for age 71', () => {
    const balance = 100000;
    const age = 71;
    const minimum = calculateRRIFMinimum(balance, age);
    expect(minimum).toBe(5280); // 5.28% of $100k
  });

  test('returns 0 for age < 71', () => {
    const balance = 100000;
    const age = 70;
    const minimum = calculateRRIFMinimum(balance, age);
    expect(minimum).toBe(0);
  });

  test('uses 20% for age 95+', () => {
    const balance = 100000;
    const age = 100;
    const minimum = calculateRRIFMinimum(balance, age);
    expect(minimum).toBe(20000); // 20% of $100k
  });
});
```

### Integration Tests

**Manual Testing Checklist**:

#### US-040: What-If Analysis
- [ ] Sliders move smoothly without lag
- [ ] Success rate updates within 500ms
- [ ] Green/red badges show correct colors
- [ ] Comparison chart displays both scenarios
- [ ] Mobile layout works on iPhone/Android

#### US-041: LIRA Support
- [ ] LIRA input field accepts numeric values
- [ ] LIRA saves to database correctly
- [ ] LIRA appears in simulation results
- [ ] LIRA withdrawals only start at age 55+
- [ ] LIRA balance depletes correctly over years

#### US-042: Results Page UX
- [ ] Hero section displays 3 key metrics
- [ ] Success rate shows correct color
- [ ] Accordion sections expand/collapse
- [ ] Loading spinner appears during simulation
- [ ] Export buttons generate CSV/PDF

#### US-013: RRIF Validation
- [ ] Minimum withdrawal calculated correctly
- [ ] Validation error shown for low withdrawals
- [ ] Error message includes minimum amount
- [ ] Simulation enforces minimum automatically
- [ ] Test all ages 71-95+

### End-to-End Tests (Future)

**Suggested Tests**:
1. Complete simulation flow (login → create scenario → run simulation → view results)
2. RRIF validation with multiple ages
3. LIRA unlock at age 55 transition
4. What-if slider changes with real-time updates

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests pass
- [ ] Manual testing complete for all 4 stories
- [ ] Code review completed
- [ ] Database migration tested locally
- [ ] Environment variables verified

### Database Migration

```bash
# Run migration for LIRA support (US-041)
cd webapp
npx prisma migrate deploy
npx prisma generate
```

### Backend Deployment (Python)

```bash
# Restart Python backend with LIRA changes
cd juan-retirement-app
git pull origin main
python3 -m uvicorn api.main:app --reload --port 8000
```

### Frontend Deployment (Vercel)

```bash
# Push to main branch triggers auto-deploy
git push origin main

# Or manual deploy
cd webapp
vercel --prod
```

### Post-Deployment Verification

- [ ] Database migration successful
- [ ] LIRA field appears in simulation form
- [ ] What-if sliders render correctly
- [ ] Results page shows new hero section
- [ ] RRIF validation works (if implemented)
- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs
- [ ] Smoke test: Run 3 simulations with different scenarios

### Rollback Plan

If critical issues arise:

```bash
# Rollback database migration
npx prisma migrate resolve --rolled-back <migration_name>

# Revert Git commit
git revert HEAD
git push origin main

# Or rollback Vercel deployment
vercel rollback
```

---

## Sprint Timeline

### Week 1 (Jan 31 - Feb 6)

**Day 1-2 (Jan 31 - Feb 1)**: Investigation & Planning
- [ ] US-013: Investigate RRIF logic (2 days)
- [ ] US-040: Design What-If UI mockups

**Day 3-4 (Feb 3-4)**: Development
- [ ] US-040: Implement What-If sliders (2 days)
- [ ] US-041: Add LIRA database migration

**Day 5 (Feb 5)**: Development
- [ ] US-041: Implement LIRA simulation logic

**Day 6 (Feb 6)**: Development
- [ ] US-042: Enhance Results Page UX

### Week 2 (Feb 7 - Feb 13)

**Day 7-9 (Feb 7-11)**: Development & Testing
- [ ] US-013: Implement RRIF validation (3 days)
- [ ] Testing for all 4 stories

**Day 10 (Feb 12-13)**: Review & Deployment
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Sprint retrospective

---

## References

- **Sprint Planning**: `/Users/jrcb/Documents/GitHub/retirezest/SPRINT_5_BOARD.md`
- **Agile Backlog**: `/Users/jrcb/Documents/GitHub/retirezest/AGILE_BACKLOG.md`
- **Privacy Guidelines**: `/Users/jrcb/Documents/GitHub/retirezest/EMAIL_PRIVACY_GUIDELINES.md`
- **Premium Features**: `/Users/jrcb/Documents/GitHub/retirezest/PREMIUM_FEATURES_SUMMARY.md`

---

**Last Updated**: January 31, 2026
**Next Review**: After Sprint 5 completion (Feb 13, 2026)
