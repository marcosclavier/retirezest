# RetireZest Developer Guide

Welcome to the RetireZest project! This guide will help you understand the codebase architecture, development workflow, and key concepts.

**Last Updated:** February 8, 2026 (Sprint 10 Complete)
**Current Version:** 1.2 (RRIF Minimums + Government Benefit Caps + Future Retirement Planning)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Development Workflow](#development-workflow)
6. [Key Concepts](#key-concepts)
7. [Testing](#testing)
8. [Debugging](#debugging)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

RetireZest is a comprehensive Canadian retirement planning application that simulates retirement scenarios with tax optimization strategies. It helps users plan their retirement by modeling:

- Multi-account withdrawals (RRIF, TFSA, Non-Registered, Corporate)
- Government benefits (CPP, OAS, GIS) with legislated caps
- Tax-optimized withdrawal strategies
- RRIF minimum withdrawal enforcement (CRA compliance)
- Early RRIF/RRSP withdrawal customization (age 55-70)
- Future retirement age planning (ages 50-90)
- Inflation-adjusted spending patterns
- Multi-year cash flow projections

### Recent Improvements (Sprint 10 - February 2026)

**✅ US-080: RRIF Minimum Withdrawal Enforcement (P0 Critical)**
- Fixed critical legal compliance issue for RRIF minimum withdrawals
- Implemented CRA minimum percentage table (ages 72-95+)
- Added support for early RRIF withdrawals (ages 55-71)
- Location: `modules/tax_engine.py` and `tax_config_canada_2025.json`

**✅ US-081 & US-082: Government Benefit Caps**
- CPP benefits capped at legislated maximum (~$17K/year in 2025)
- OAS benefits capped at legislated maximum (~$8.5K/year in 2025)
- Both indexed at 2%/year for long-term projections
- Location: `modules/simulation.py` and `tax_config_canada_2025.json`

**✅ US-085: Future Retirement Age Planning UX**
- Changed "Current Age" label to "Planning Age" for clarity
- Updated tooltips to explicitly allow future ages (50-90)
- Enables users to plan for future retirement scenarios
- Location: `webapp/components/PersonForm.tsx`, `webapp/lib/simulation-tooltips.ts`

---

## Tech Stack

### Backend (Python)
- **FastAPI** - Modern async web framework
- **Pandas** - Data analysis and simulation results
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server for development

### Frontend (TypeScript/React)
- **Next.js 15.5.9** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **Recharts** - Chart library for visualizations

### Database
- **PostgreSQL** - Production database (via Railway)
- **Prisma** - ORM and database toolkit

---

## Architecture

### Project Structure

```
juan-retirement-app/
├── webapp/                    # Next.js frontend application
│   ├── app/                   # Next.js App Router pages
│   │   ├── simulation/        # Simulation page and components
│   │   ├── profile/           # User profile management
│   │   └── api/               # Next.js API routes (proxy to Python backend)
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui base components
│   │   └── simulation/        # Simulation-specific components
│   ├── lib/                   # Utilities and helpers
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   └── prisma/                # Database schema and migrations
│
├── api/                       # FastAPI Python backend
│   ├── main.py                # FastAPI application entry point
│   ├── routes/                # API route handlers
│   ├── models/                # Pydantic models for API
│   └── utils/                 # API utilities and converters
│
├── modules/                   # Core simulation engine (Python)
│   ├── simulation.py          # Main simulation logic (2500+ lines)
│   ├── models.py              # Data models (Person, Household, YearResult)
│   ├── config.py              # Tax configuration loader
│   ├── tax_calc.py            # Tax calculation functions
│   └── strategies/            # Withdrawal strategies
│
├── tax_config_canada_2025.json # Canadian tax brackets and rates
└── test_*.py                  # Test scripts for debugging
```

### Data Flow

```
User Input (Frontend)
    ↓
Next.js API Route (/api/simulation/run)
    ↓
FastAPI Backend (/simulate)
    ↓
converters.py (API models → Internal models)
    ↓
simulation.py (Core engine)
    ↓
YearResult objects (one per year)
    ↓
Pandas DataFrame
    ↓
converters.py (DataFrame → API models)
    ↓
JSON Response
    ↓
Frontend Components (Charts, Tables)
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.11+**
- **PostgreSQL** (for production) or use Railway connection
- **Git**

### Initial Setup

1. **Clone the repository**
   ```bash
   cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
   ```

2. **Install Python dependencies**
   ```bash
   pip install fastapi uvicorn pandas pydantic python-multipart
   ```

3. **Install Node.js dependencies**
   ```bash
   cd webapp
   npm install
   ```

4. **Set up environment variables**

   Create `webapp/.env.local`:
   ```env
   DATABASE_URL="postgresql://retirement:retirementpass@127.0.0.1:5433/retirement_app"
   NEXT_PUBLIC_API_URL="http://localhost:8000"
   ```

5. **Run database migrations**
   ```bash
   cd webapp
   npx prisma generate
   npx prisma db push
   ```

### Running the Application

You need **two terminal windows**:

**Terminal 1 - Python Backend:**
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Next.js Frontend:**
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/webapp
npm run dev
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Development Workflow

### Making Changes

1. **Frontend changes** (`webapp/`)
   - Edit React components in `webapp/components/`
   - Edit pages in `webapp/app/`
   - Changes hot-reload automatically

2. **Backend changes** (`api/`, `modules/`)
   - Edit Python files
   - Uvicorn auto-reloads on file changes
   - Check http://localhost:8000/docs for API changes

3. **Database changes** (`webapp/prisma/`)
   - Edit `schema.prisma`
   - Run `npx prisma db push` to apply changes
   - Run `npx prisma generate` to update TypeScript types

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add descriptive commit message"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Convention

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## Key Concepts

### 0. Data Format Conventions ⚠️ CRITICAL

**IMPORTANT**: Before working with percentage fields (yields, inflation rates), read:
- **DATA_FORMAT_CONVENTIONS.md** - Comprehensive guide to percentage vs decimal handling

**Quick Reference**:
- **Internal Python Code**: ALWAYS use decimals (0.06 = 6%)
- **Database Storage**: May be percentage (6) or decimal (0.06)
- **Conversion Pattern**: `value = value_raw / 100.0 if value_raw > 1.0 else value_raw`

**Why This Matters**:
A critical bug (US-077, Feb 2026) caused exponential growth when yield fields stored as percentages (6) were treated as decimals (600% growth!). This dropped success rates from 100% → 35.5%. See DATA_FORMAT_CONVENTIONS.md for full details.

**Fields That Require Conversion**:
- `y_nr_inv_total_return`, `y_nr_cash_interest`, `y_nr_gic_interest`
- `y_nr_inv_elig_div`, `y_nr_inv_nonelig_div`, `y_nr_inv_capg`
- `corp_yield_interest`, `corp_yield_elig_div`, `corp_yield_capg`
- `general_inflation`, `spending_inflation`

**Example**:
```python
# ✅ CORRECT - Safe for both formats
yield_raw = float(getattr(person, "y_nr_inv_total_return", 0.06))
yield_decimal = yield_raw / 100.0 if yield_raw > 1.0 else yield_raw
balance_next_year = balance * (1 + yield_decimal)

# ❌ WRONG - Assumes decimal format
yield = float(getattr(person, "y_nr_inv_total_return", 0.06))
balance_next_year = balance * (1 + yield)  # Breaks if stored as 6!
```

**Related Documentation**:
- DATA_FORMAT_CONVENTIONS.md - Complete conventions guide
- ROOT_CAUSE_ANALYSIS_EXPONENTIAL_GROWTH.md - US-077 bug analysis

---

### 1. Simulation Engine (`modules/simulation.py`)

The heart of the application. Key functions:

#### `simulate(hh: Household, tax_cfg: Dict) -> pd.DataFrame`
- **Purpose:** Runs multi-year retirement simulation
- **Input:** Household configuration, tax config
- **Output:** DataFrame with one row per year
- **Flow:**
  1. Initialize tax parameters
  2. Loop through each year until end_age
  3. For each year:
     - Calculate government benefits (CPP, OAS, GIS)
     - Execute withdrawal strategy
     - Calculate taxes
     - Update account balances
     - Track underfunding/surplus
  4. Return complete DataFrame

#### `simulate_year(person, hh, year, ...)`
- **Purpose:** Simulates one person for one year
- **Key logic:**
  - Initializes non-reg buckets if needed (line 1066-1071)
  - Calculates government benefits (CPP, OAS)
  - Determines spending target (after-tax)
  - Executes withdrawal strategy
  - Returns withdrawals and tax info

#### Withdrawal Strategy Order

Different strategies use different account priority:

```python
# Minimize Income (GIS-Optimized)
order = ['nonreg', 'rrif', 'tfsa']  # Minimize taxable income for GIS

# Balanced
order = ['nonreg', 'rrif', 'tfsa']  # Balanced tax efficiency

# TFSA-First
order = ['tfsa', 'nonreg', 'rrif']  # Preserve tax-deferred growth
```

### 2. Account Balance Tracking

**Critical:** Account balances are updated AFTER withdrawals and growth:

```python
# Line 2073-2076: Update RRIF and TFSA
p1.rrif_balance = max(p1.rrif_balance - w1["rrif"], 0.0) * (1 + p1.yield_rrif_growth)
p1.tfsa_balance = max(p1.tfsa_balance - w1["tfsa"], 0.0) * (1 + p1.yield_tfsa_growth)

# Line 2134: Update Non-Reg with bucket-aware growth
p1.nonreg_balance = p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1
```

**Non-Reg Buckets:**
- `nr_cash` - Cash bucket (low yield, liquid)
- `nr_gic` - GIC bucket (fixed income)
- `nr_invest` - Investment bucket (stocks, higher growth)

If buckets are zero but `nonreg_balance > 0`, the engine auto-initializes by putting 100% in `nr_invest` (line 1069).

### 3. Tax Calculation

**Federal + Provincial taxes** calculated using marginal brackets:

```python
# modules/tax_calc.py
def calc_tax(taxable_income, brackets, rates):
    tax = 0.0
    for i, bracket in enumerate(brackets):
        if taxable_income > bracket:
            tax += (min(taxable_income, brackets[i+1] if i+1 < len(brackets) else taxable_income) - bracket) * rates[i]
    return tax
```

**Special cases:**
- GIS income test uses "net income" (excludes OAS, includes 50% capital gains)
- OAS clawback starts at ~$90K income
- Income splitting for RRIF (couples only)

### 4. Underfunding Detection

```python
# Line 2419-2425 in simulation.py
underfunded = spend - total_available_cash
is_underfunded = underfunded > hh.gap_tolerance  # Default: $5,000

# Gap under tolerance → marked as "OK"
# Gap over tolerance → marked as "UNDERFUNDED"
```

**Why gaps exist:**
- Government benefits don't cover full spending
- Accounts depleted or yields too low
- Tax burden higher than expected
- Inflation increases spending faster than returns

### 5. Data Models

#### Person (`modules/models.py:18-85`)
```python
@dataclass
class Person:
    name: str
    start_age: int

    # Account balances
    tfsa_balance: float = 0.0
    rrif_balance: float = 0.0
    rrsp_balance: float = 0.0
    nonreg_balance: float = 0.0
    corporate_balance: float = 0.0

    # Non-reg buckets (optional)
    nr_cash: float = 0.0
    nr_gic: float = 0.0
    nr_invest: float = 0.0

    # Yields (annual rates)
    yield_rrif_growth: float = 0.05
    yield_tfsa_growth: float = 0.05
    # ... more fields
```

#### Household (`modules/models.py:88-152`)
```python
@dataclass
class Household:
    p1: Person
    p2: Optional[Person] = None
    province: str = "ON"
    start_year: int = 2025
    end_age: int = 95

    # Spending patterns
    spending_go_go: float = 50000
    go_go_end_age: int = 75
    spending_slow_go: float = 40000
    slow_go_end_age: int = 85
    spending_no_go: float = 30000

    # Strategy
    strategy: str = "balanced"
    # ... more fields
```

#### YearResult (`modules/models.py:218-370`)
Contains ~60 fields per year:
- Government benefits (CPP, OAS, GIS)
- Withdrawals by account and person
- End-of-year balances
- Taxes (federal, provincial, total)
- Underfunding flags
- Growth by account

---

## Testing

### Running Tests

**Standalone Python tests:**
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app

# Test specific scenario
python3 test_2026_underfunding.py

# Test account depletion
python3 test_account_depletion.py

# Test all years
python3 test_all_years_balances.py
```

**Debugging specific years:**
```python
# Create a test file
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate

rafael = Person(
    name="Rafael",
    start_age=64,
    tfsa_balance=312000,
    rrif_balance=350000,
    nonreg_balance=330000,
    # ... other fields
)

household = Household(p1=rafael, ...)
household.strategy = "minimize-income"

tax_config = load_tax_config('tax_config_canada_2025.json')
results = simulate(household, tax_config)

# Analyze results
print(results[['year', 'age_p1', 'end_rrif_p1', 'end_tfsa_p1', 'underfunded_after_tax']])
```

### Test Files Reference

| File | Purpose |
|------|---------|
| `test_2026_underfunding.py` | Tests first-year underfunding with minimize-income strategy |
| `test_2032_gaps.py` | Tests gaps appearing in years 2032-2050 |
| `test_account_depletion.py` | Tracks when accounts become depleted |
| `test_all_years_balances.py` | Prints EOY balances for all years |
| `test_bucket_debug.py` | Debugs non-reg bucket initialization |
| `test_when_depleted.py` | Identifies exact year of account depletion |

---

## Debugging

### Backend Debugging

**Enable debug logging in `simulation.py`:**

Look for lines with `import sys` and `print(..., file=sys.stderr)`:

```python
# Line 1318-1322: Debug withdrawal strategy
print(f"DEBUG WITHDRAWAL [{person.name}] Age {age} Year {year}:", file=sys.stderr)
print(f"  Strategy: {strategy_name}", file=sys.stderr)
print(f"  After-tax target: ${after_tax_target:,.0f}", file=sys.stderr)
```

**View debug output:**
```bash
# Terminal running uvicorn will show stderr output
python3 -m uvicorn api.main:app --reload 2>&1 | grep DEBUG
```

### Frontend Debugging

**Browser Console:**
- Open DevTools (F12)
- Check Console tab for logs
- Look for component debug logs (search for `console.log`)

**Example debug points:**
- `ResultsHeroSection.tsx:23-28` - Logs household input data
- `ResultsDashboard.tsx:64-71` - Logs tax calculations
- `page.tsx` (simulation) - Logs API responses

**React DevTools:**
- Install React DevTools browser extension
- Inspect component props and state
- Check component tree for data flow

### Common Debug Scenarios

**1. Underfunding Gaps**

Check these values in simulation output:
```python
year_data = results.iloc[0]  # First year
print(f"Spending target: ${year_data['spend_target_after_tax']:,.0f}")
print(f"Gov benefits: ${year_data['cpp_p1'] + year_data['oas_p1'] + year_data['gis_p1']:,.0f}")
print(f"Withdrawals: ${year_data['total_withdrawals']:,.0f}")
print(f"Gap: ${year_data['underfunded_after_tax']:,.0f}")
```

**2. Zero Account Balances**

Check bucket initialization:
```python
print(f"nonreg_balance: ${person.nonreg_balance:,.0f}")
print(f"Buckets: cash=${person.nr_cash:,.0f}, gic=${person.nr_gic:,.0f}, invest=${person.nr_invest:,.0f}")
```

If buckets are zero but `nonreg_balance > 0`, check line 1066-1071 in `simulation.py`.

**3. Tax Calculation Issues**

Check tax components:
```python
print(f"Taxable income P1: ${year_data['taxable_inc_p1']:,.0f}")
print(f"Tax P1: ${year_data['tax_p1']:,.0f}")
print(f"Marginal rate P1: {year_data['marginal_rate_p1']:.2%}")
```

---

## Common Tasks

### Adding a New Withdrawal Strategy

1. **Define strategy in `modules/simulation.py`**

   Find the strategy selection code (around line 1280):
   ```python
   # Add your strategy
   elif "my-new-strategy" in strategy_name.lower():
       order = ['tfsa', 'nonreg', 'rrif']  # Define order
   ```

2. **Add to frontend strategy selector**

   Edit `webapp/app/simulation/page.tsx`:
   ```typescript
   const strategies = [
     { value: 'my-new-strategy', label: 'My New Strategy' },
     // ... existing strategies
   ];
   ```

3. **Update strategy display mapping**

   Edit `webapp/components/simulation/ResultsHeroSection.tsx` (line 123-134):
   ```typescript
   const strategyMap: Record<string, string> = {
     'my-new-strategy': 'My New Strategy',
     // ... existing mappings
   };
   ```

### Adding a New Chart

1. **Create component in `webapp/components/simulation/`**

   ```typescript
   // MyNewChart.tsx
   'use client';

   import { ChartDataPoint } from '@/lib/types/simulation';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

   interface MyNewChartProps {
     chartData: ChartDataPoint[];
   }

   export function MyNewChart({ chartData }: MyNewChartProps) {
     const data = chartData.map((point) => ({
       year: point.year,
       value: point.some_field,  // Use appropriate field
     }));

     return (
       <Card>
         <CardHeader>
           <CardTitle>My New Chart</CardTitle>
         </CardHeader>
         <CardContent>
           <ResponsiveContainer width="100%" height={350}>
             <LineChart data={data}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="year" />
               <YAxis />
               <Tooltip />
               <Legend />
               <Line type="monotone" dataKey="value" stroke="#8884d8" />
             </LineChart>
           </ResponsiveContainer>
         </CardContent>
       </Card>
     );
   }
   ```

2. **Add to ResultsDashboard**

   Edit `webapp/components/simulation/ResultsDashboard.tsx`:
   ```typescript
   import { MyNewChart } from './MyNewChart';

   // In the return statement:
   <MyNewChart chartData={chartData} />
   ```

### Modifying Tax Calculations

1. **Edit tax brackets** in `tax_config_canada_2025.json`

   ```json
   {
     "federal": {
       "brackets": [0, 55867, 111733, 173205, 246752],
       "rates": [0.15, 0.205, 0.26, 0.29, 0.33]
     }
   }
   ```

2. **Update tax calculation logic** in `modules/tax_calc.py`

3. **Test changes:**
   ```bash
   python3 test_2026_underfunding.py
   ```

### Adding Database Fields

1. **Edit Prisma schema** (`webapp/prisma/schema.prisma`)

   ```prisma
   model RetirementProfile {
     // ... existing fields
     newField  Float  @default(0)
   }
   ```

2. **Push changes to database:**
   ```bash
   cd webapp
   npx prisma db push
   npx prisma generate
   ```

3. **Update TypeScript types** (auto-generated by Prisma)

4. **Update frontend forms** to include new field

---

## Troubleshooting

### Common Issues

#### 1. **"Module not found" errors**

**Symptom:** Python import errors when running backend

**Fix:**
```bash
# Make sure you're in the project root
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app

# Run with python module syntax
python3 -m uvicorn api.main:app --reload
```

#### 2. **Frontend won't start - Port 3000 in use**

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Fix:**
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### 3. **Backend won't start - Port 8000 in use**

**Symptom:** `ERROR: [Errno 48] Address already in use`

**Fix:**
```bash
# Kill the process on port 8000
lsof -ti:8000 | xargs kill -9
```

#### 4. **Database connection errors**

**Symptom:** `P1001: Can't reach database server`

**Fix:**
```bash
# Check DATABASE_URL in .env.local
# Make sure PostgreSQL is running
# Or use Railway connection string
```

#### 5. **CORS errors in browser**

**Symptom:** `Access-Control-Allow-Origin` errors in console

**Fix:** Check `api/main.py` CORS configuration (line 20-30):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 6. **Simulation returns $0 balances**

**Symptom:** All EOY balances show $0

**Investigation:**
1. Check if buckets are initialized (line 1066-1071 in simulation.py)
2. Verify Person object has non-zero starting balances
3. Check withdrawal ratio calculation (line 2109-2118)

**Common cause:** Testing with Person objects that were mutated during simulation. Always create fresh Person objects for each test.

#### 7. **Underfunding gaps increasing over time**

**Symptom:** Small gaps in early years, growing gaps in later years

**Causes:**
- Spending growing faster than investment returns
- Accounts depleting earlier than expected
- Inflation on spending vs. fixed government benefits

**Solutions:**
- Reduce spending targets
- Increase initial account balances
- Adjust investment return assumptions
- Consider delaying CPP/OAS to age 70

---

## Performance Optimization

### Backend Optimization

1. **Reduce simulation years** for faster testing:
   ```python
   household.end_age = 80  # Instead of 95
   ```

2. **Cache tax config** (already implemented):
   ```python
   tax_config = load_tax_config('tax_config_canada_2025.json')  # Loads once
   ```

3. **Profile slow functions:**
   ```python
   import cProfile
   cProfile.run('simulate(household, tax_config)')
   ```

### Frontend Optimization

1. **Lazy load charts:**
   ```typescript
   const GovernmentBenefitsChart = dynamic(() => import('./GovernmentBenefitsChart'), {
     loading: () => <p>Loading chart...</p>
   });
   ```

2. **Memoize expensive calculations:**
   ```typescript
   const chartData = useMemo(() => {
     return result.year_by_year.map(transformData);
   }, [result.year_by_year]);
   ```

3. **Debounce input changes:**
   ```typescript
   const debouncedSave = useMemo(
     () => debounce(saveToDatabase, 500),
     []
   );
   ```

---

## Resources

### Documentation Links

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Pandas Docs:** https://pandas.pydata.org/docs/
- **Recharts Docs:** https://recharts.org/

### Canadian Tax Resources

- **CRA Tax Brackets:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
- **GIS Information:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html
- **RRIF Minimums:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals/minimum-amounts.html

### Internal References

- **Simulation Engine:** `modules/simulation.py:1763-2520`
- **Tax Calculation:** `modules/tax_calc.py`
- **API Converters:** `api/utils/converters.py`
- **Frontend Simulation Page:** `webapp/app/simulation/page.tsx`
- **Results Dashboard:** `webapp/components/simulation/ResultsDashboard.tsx`

### Critical Documentation

- **DATA_FORMAT_CONVENTIONS.md** - ⚠️ Required reading for percentage/decimal handling
- **ROOT_CAUSE_ANALYSIS_EXPONENTIAL_GROWTH.md** - US-077 bug analysis (Feb 2026)
- **US-077_BUG_FIX_COMPLETE.md** - Bug fix implementation details
- **SPRINT_10_PLAN.md** - Sprint 10 planning and completion (RRIF minimums, government caps)
- **SPRINT_10_REVIEW.md** - Sprint 10 retrospective and achievements
- **AGILE_BACKLOG.md** - Product backlog and sprint history

### Sprint History

- **Sprint 10 (Feb 6-8, 2026):** ✅ COMPLETE - RRIF minimums + CPP/OAS caps + Future planning UX (14 story points)
- **Sprint 9 (Jan 2026):** ✅ COMPLETE - Calculation validation testing infrastructure (10 story points)
- **Sprint 8 (Jan 2026):** ✅ COMPLETE - US-077 exponential growth bug fix (23 story points)

---

## Getting Help

### Internal Resources

1. **Check existing test files** for examples
2. **Review this guide** for common patterns
3. **Search codebase** for similar implementations

### Debug Checklist

When encountering issues:

- [ ] Check terminal output for error messages
- [ ] Verify environment variables are set
- [ ] Confirm both backend and frontend are running
- [ ] Check browser console for frontend errors
- [ ] Review API response in Network tab
- [ ] Add debug logging at key points
- [ ] Create a minimal test case
- [ ] Check if issue reproduces with default values

---

## Code Style Guide

### Python

```python
# Use type hints
def calculate_tax(income: float, brackets: list[float]) -> float:
    """
    Calculate tax based on income and brackets.

    Args:
        income: Taxable income amount
        brackets: List of tax bracket thresholds

    Returns:
        Total tax amount
    """
    # Implementation
    pass

# Use descriptive variable names
withdrawal_amount = 50000  # Good
wa = 50000  # Bad

# Group related code with comments
# === Calculate government benefits ===
cpp = calculate_cpp(person, year)
oas = calculate_oas(person, year)
gis = calculate_gis(person, cpp, oas)
```

### TypeScript/React

```typescript
// Use interfaces for props
interface ComponentProps {
  data: ChartDataPoint[];
  onUpdate?: (value: number) => void;
}

// Use descriptive component names
export function TaxBreakdownChart({ data }: ComponentProps) {
  // Implementation
}

// Use const for variables that don't change
const MAX_ITERATIONS = 100;

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(transform);
}, [data]);
```

---

## Next Steps

After reading this guide:

1. **Run the application** following the "Getting Started" section
2. **Explore the codebase** by reading key files:
   - `modules/simulation.py` - Core engine
   - `webapp/app/simulation/page.tsx` - Main simulation page
   - `api/main.py` - API entry point
3. **Run test files** to see how simulation works
4. **Make a small change** and observe the results
5. **Review existing issues** on GitHub (if applicable)

Welcome to the team! 🎉
