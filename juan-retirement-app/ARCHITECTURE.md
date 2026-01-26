# RetireZest Technical Architecture

## System Overview

RetireZest is a full-stack retirement planning application built with a Python backend (FastAPI) and a TypeScript/React frontend (Next.js). The application simulates Canadian retirement scenarios with tax optimization strategies.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js Frontend (Port 3000)                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Pages   │  │Components│  │  Charts  │  │   Forms  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Middleware)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /api/simulation/run → Python Backend Proxy                │ │
│  │  /api/profile/*      → Prisma Database Operations          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│            FastAPI Backend (Port 8000)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  POST /simulate                                             │ │
│  │    ↓                                                        │ │
│  │  Pydantic Validation → Converters → Simulation Engine      │ │
│  │    ↓                                                        │ │
│  │  DataFrame → Converters → JSON Response                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│         Core Simulation Engine (modules/simulation.py)           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Multi-Year Loop                                            │ │
│  │   ├─ Calculate Government Benefits (CPP/OAS/GIS)           │ │
│  │   ├─ Execute Withdrawal Strategy                           │ │
│  │   ├─ Calculate Taxes (Federal + Provincial)                │ │
│  │   ├─ Update Account Balances                               │ │
│  │   └─ Track Underfunding/Surplus                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  RetirementProfile (user inputs, saved scenarios)          │ │
│  │  User (authentication, preferences)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

- **Framework:** Next.js 15.5.9 (App Router)
- **React:** 19.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts 2.x
- **ORM:** Prisma (for database access)

### Directory Structure

```
webapp/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── simulation/               # Simulation feature
│   │   └── page.tsx              # Main simulation page (500+ lines)
│   ├── profile/                  # User profile management
│   └── api/                      # Next.js API routes
│       ├── simulation/
│       │   └── run/route.ts      # Proxy to Python backend
│       └── profile/
│           └── [id]/route.ts     # CRUD operations
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── simulation/               # Feature-specific components
│       ├── ResultsDashboard.tsx  # Main results container
│       ├── ResultsHeroSection.tsx # Health score display
│       ├── GovernmentBenefitsChart.tsx
│       ├── TaxBreakdownChart.tsx
│       ├── NetWorthChart.tsx
│       └── YearByYearTable.tsx
│
├── lib/
│   ├── types/
│   │   └── simulation.ts         # TypeScript interfaces
│   ├── utils/
│   │   ├── simulation-client.ts  # API client
│   │   └── cn.ts                 # Tailwind utilities
│   └── prisma.ts                 # Prisma client singleton
│
└── prisma/
    ├── schema.prisma             # Database schema
    └── migrations/               # Database migrations
```

### Key Components

#### 1. Simulation Page (`app/simulation/page.tsx`)

**Responsibilities:**
- User input collection (account balances, spending, strategy)
- State management (localStorage + database sync)
- API communication
- Result display coordination

**State Flow:**
```typescript
User Input → localStorage (immediate)
           → Database (debounced, 2 seconds)
           → API call (on "Run Simulation")
           → Results display
```

**Key Features:**
- Smart loading: Database first, localStorage fallback
- Debounced auto-save (2 second delay)
- Profile merging: Fresh DB data + custom user settings
- Strategy recommendations

#### 2. Results Dashboard (`components/simulation/ResultsDashboard.tsx`)

**Responsibilities:**
- Orchestrates all result visualizations
- Transforms API data for charts
- Provides tabbed interface (Overview, Tax, Government Benefits, Year-by-Year)

**Data Transformations:**
```typescript
// API Response → Chart Data
const chartData: ChartDataPoint[] = result.year_by_year.map((year) => ({
  year: year.year,
  age_p1: year.age_p1,
  net_worth: year.total_value,
  tax: year.total_tax,
  cpp_total: year.cpp_p1 + year.cpp_p2,
  // ... more fields
}));
```

#### 3. Charts

All charts use **Recharts** with consistent styling:

```typescript
<ResponsiveContainer width="100%" height={350}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="year" />
    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
    <Tooltip content={<CustomTooltip />} />
    <Legend />
    <Area type="monotone" dataKey="value" fill="#8884d8" />
  </AreaChart>
</ResponsiveContainer>
```

**Chart Components:**
- `GovernmentBenefitsChart` - CPP, OAS, GIS stacked area chart
- `TaxBreakdownChart` - Federal vs Provincial tax over time
- `NetWorthChart` - Account balances projection
- `WithdrawalStrategyChart` - Withdrawals by account type

### API Client

**Location:** `lib/utils/simulation-client.ts`

```typescript
export async function runSimulation(params: SimulationParams): Promise<SimulationResponse> {
  const response = await fetch('/api/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Simulation failed: ${response.statusText}`);
  }

  return response.json();
}
```

**Error Handling:**
- Network errors caught and displayed to user
- Validation errors from backend shown as alerts
- Loading states during API calls

---

## Backend Architecture

### Technology Stack

- **Framework:** FastAPI 0.110+
- **Server:** Uvicorn (ASGI)
- **Language:** Python 3.11+
- **Data Processing:** Pandas 2.x
- **Validation:** Pydantic 2.x

### Directory Structure

```
api/
├── main.py                       # FastAPI app entry point
├── routes/
│   └── simulation.py             # /simulate endpoint
├── models/
│   ├── request.py                # Pydantic request models
│   └── response.py               # Pydantic response models
└── utils/
    └── converters.py             # API ↔ Internal model converters

modules/
├── simulation.py                 # Core simulation engine (2500+ lines)
├── models.py                     # Internal data models
├── config.py                     # Tax config loader
├── tax_calc.py                   # Tax calculation utilities
└── strategies/
    └── gis_optimizer.py          # GIS optimization logic
```

### Request/Response Flow

#### 1. Request Processing

```python
# api/routes/simulation.py
@router.post("/simulate")
async def simulate_endpoint(request: SimulationRequest) -> SimulationResponse:
    # Step 1: Validate request (Pydantic automatic)
    # Step 2: Convert API models to internal models
    household = api_household_to_household(request.household)

    # Step 3: Load tax configuration
    tax_config = load_tax_config('tax_config_canada_2025.json')

    # Step 4: Run simulation
    df = simulate(household, tax_config)

    # Step 5: Convert DataFrame to API response
    year_results = dataframe_to_year_results(df)
    summary = calculate_summary(df)

    return SimulationResponse(
        success=True,
        year_by_year=year_results,
        summary=summary,
        household_input=request.household
    )
```

#### 2. Data Model Conversion

**API Models → Internal Models:**

```python
# api/utils/converters.py
def api_household_to_household(api_hh: APIHousehold) -> Household:
    """Convert API request model to internal simulation model."""

    p1 = Person(
        name=api_hh.p1.name,
        start_age=api_hh.p1.start_age,
        tfsa_balance=api_hh.p1_balances.tfsa,
        rrif_balance=api_hh.p1_balances.rrif,
        # ... map all fields
    )

    return Household(
        p1=p1,
        p2=p2 if api_hh.p2 else None,
        province=api_hh.province,
        start_year=api_hh.start_year,
        # ... map all fields
    )
```

**DataFrame → API Response:**

```python
def dataframe_to_year_results(df: pd.DataFrame) -> list[YearResult]:
    """Convert simulation DataFrame to API response format."""

    results = []
    for _, row in df.iterrows():
        results.append(YearResult(
            year=int(row['year']),
            age_p1=int(row['age_p1']),
            # Map DataFrame columns to API fields
            tfsa_balance_p1=float(row.get('end_tfsa_p1', 0)),
            rrif_balance_p1=float(row.get('end_rrif_p1', 0)),
            # ... map all 60+ fields
        ))

    return results
```

---

## Core Simulation Engine

### Architecture

**Location:** `modules/simulation.py`

The simulation engine is the heart of the application. It processes retirement scenarios year-by-year.

### Main Function: `simulate()`

```python
def simulate(hh: Household, tax_cfg: Dict) -> pd.DataFrame:
    """
    Run multi-year retirement simulation.

    Args:
        hh: Household configuration (people, spending, strategy)
        tax_cfg: Tax brackets and rates by province

    Returns:
        DataFrame with one row per simulated year
    """

    # 1. Initialize
    fed, prov = get_tax_params(tax_cfg, hh.province)
    rows: List[YearResult] = []

    # 2. Initialize starting balances
    p1, p2 = hh.p1, hh.p2

    # 3. Year-by-year loop
    for year in range(hh.start_year, hh.start_year + max_years):
        age1 = p1.start_age + (year - hh.start_year)
        age2 = p2.start_age + (year - hh.start_year) if p2 else 0

        # Stop if both people exceed end_age
        if age1 > hh.end_age and (not p2 or age2 > hh.end_age):
            break

        # 4. Determine spending target for this year
        spend = calculate_spending_target(hh, age1, year)

        # 5. Simulate each person
        w1, t1, info1 = simulate_year(p1, hh, year, spend/2, ...)
        w2, t2, info2 = simulate_year(p2, hh, year, spend/2, ...) if p2 else ({}, {}, {})

        # 6. Calculate household taxes (with income splitting if applicable)
        total_tax = calculate_household_tax(t1, t2, hh)

        # 7. Update account balances (withdrawals + growth)
        update_balances(p1, w1, hh)
        update_balances(p2, w2, hh)

        # 8. Track underfunding
        total_available = (t1['cpp'] + t1['oas'] + t1['gis'] +
                          t2['cpp'] + t2['oas'] + t2['gis'] +
                          sum(w1.values()) + sum(w2.values()))

        underfunded = max(spend - total_available, 0.0)
        is_underfunded = underfunded > hh.gap_tolerance

        # 9. Store year result
        rows.append(YearResult(
            year=year,
            age_p1=age1,
            age_p2=age2,
            spend_target_after_tax=spend,
            # ... 60+ more fields
            underfunded_after_tax=underfunded,
            is_underfunded=is_underfunded,
        ))

    # 10. Convert to DataFrame
    return pd.DataFrame([r.__dict__ for r in rows])
```

### Key Sub-Functions

#### 1. `simulate_year()` - Single Person, Single Year

```python
def simulate_year(
    person: Person,
    hh: Household,
    year: int,
    after_tax_target: float,
    strategy_name: str,
    ...
) -> Tuple[Dict, Dict, Dict]:
    """
    Simulate one person for one year.

    Returns:
        (withdrawals, tax_info, additional_info)
    """

    # 1. Initialize non-reg buckets if needed
    bucket_total = person.nr_cash + person.nr_gic + person.nr_invest
    if bucket_total < 1e-9 and person.nonreg_balance > 1e-9:
        # Auto-initialize: put 100% in investment bucket
        person.nr_invest = person.nonreg_balance
        person.nr_cash = 0.0
        person.nr_gic = 0.0

    # 2. Calculate government benefits
    cpp = calculate_cpp(person, hh, year)
    oas = calculate_oas(person, hh, year)

    # 3. Calculate GIS (if eligible)
    gis = calculate_gis(person, cpp, oas, ...)

    # 4. Calculate base after-tax cash (before withdrawals)
    base_after_tax = cpp + oas + gis - estimate_base_tax(...)

    # 5. Determine shortfall
    shortfall = max(after_tax_target - base_after_tax, 0.0)

    # 6. Execute withdrawal strategy
    withdrawals = execute_strategy(
        person,
        shortfall,
        strategy_name,
        ...
    )

    # 7. Calculate final tax
    final_tax = calculate_tax_with_withdrawals(person, withdrawals, ...)

    return (withdrawals, tax_info, additional_info)
```

#### 2. Withdrawal Strategy Execution

```python
def execute_strategy(
    person: Person,
    shortfall: float,
    strategy_name: str,
    ...
) -> Dict[str, float]:
    """
    Execute withdrawal strategy to meet spending target.

    Returns:
        {'rrif': amount, 'tfsa': amount, 'nonreg': amount, 'corp': amount}
    """

    # 1. Determine withdrawal order based on strategy
    if "minimize-income" in strategy_name.lower():
        order = ['nonreg', 'rrif', 'tfsa']  # Minimize taxable income
    elif "tfsa-first" in strategy_name.lower():
        order = ['tfsa', 'nonreg', 'rrif']  # Preserve tax-deferred
    else:  # balanced
        order = ['nonreg', 'rrif', 'tfsa']

    # 2. Initialize withdrawals
    withdrawals = {'rrif': 0.0, 'tfsa': 0.0, 'nonreg': 0.0, 'corp': 0.0}

    # 3. RRIF minimum (mandatory by law)
    rrif_min = rrif_minimum(person.rrif_balance, age)
    withdrawals['rrif'] = rrif_min

    # 4. Recalculate shortfall after RRIF minimum
    # ...

    # 5. Loop through strategy order
    for source in order:
        if shortfall < 1e-6:
            break  # Target met

        # Determine available balance
        if source == 'rrif':
            available = max(person.rrif_balance - withdrawals['rrif'], 0.0)
        elif source == 'tfsa':
            available = person.tfsa_balance
        elif source == 'nonreg':
            available = person.nonreg_balance
        elif source == 'corp':
            available = person.corporate_balance

        if available < 1e-6:
            continue  # Nothing available from this source

        # Calculate gross withdrawal needed (accounting for tax)
        gross_needed = calculate_gross_for_net(shortfall, source, person, ...)

        # Take minimum of needed and available
        withdraw_amount = min(gross_needed, available)
        withdrawals[source] += withdraw_amount

        # Update shortfall
        net_received = withdraw_amount * (1 - effective_tax_rate)
        shortfall -= net_received

    return withdrawals
```

#### 3. Balance Updates

```python
def update_balances(person: Person, withdrawals: Dict, hh: Household):
    """Update account balances after withdrawals and growth."""

    # RRIF: Withdraw, then grow
    person.rrif_balance = max(
        person.rrif_balance - withdrawals['rrif'], 0.0
    ) * (1 + person.yield_rrif_growth)

    # TFSA: Withdraw, then grow
    person.tfsa_balance = max(
        person.tfsa_balance - withdrawals['tfsa'], 0.0
    ) * (1 + person.yield_tfsa_growth)

    # Non-Reg: Bucket-aware growth
    total_buckets = person.nr_cash + person.nr_gic + person.nr_invest

    if total_buckets > 1e-9:
        # Proportional withdrawal from each bucket
        withdrawal_ratio = min(
            withdrawals['nonreg'] / total_buckets, 1.0
        )

        # Update each bucket
        person.nr_cash = (person.nr_cash * (1 - withdrawal_ratio)) * (1 + person.y_nr_cash_interest)
        person.nr_gic = (person.nr_gic * (1 - withdrawal_ratio)) * (1 + person.y_nr_gic_interest)
        person.nr_invest = (person.nr_invest * (1 - withdrawal_ratio)) * (1 + person.y_nr_inv_total_return)

        # Update total
        person.nonreg_balance = person.nr_cash + person.nr_gic + person.nr_invest
```

### Critical Code Sections

#### Account Balance Tracking (Lines 2073-2162)

**CRITICAL:** This is where EOY balances are calculated. Must happen AFTER withdrawals and BEFORE storing YearResult.

```python
# Line 2073-2076: RRIF and TFSA
p1.rrif_balance = max(p1.rrif_balance - w1["rrif"], 0.0) * (1 + p1.yield_rrif_growth)
p1.tfsa_balance = max(p1.tfsa_balance - w1["tfsa"], 0.0) * (1 + p1.yield_tfsa_growth)

# Line 2134: Non-Reg with buckets
p1.nonreg_balance = p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new + nr_reinvest_p1
```

#### Underfunding Detection (Lines 2419-2425)

```python
# Calculate total available cash
total_available_cash = (
    t1["cpp"] + t1["oas"] + t1["gis"] +
    t2["cpp"] + t2["oas"] + t2["gis"] +
    sum(w1.values()) + sum(w2.values())
)

# Calculate underfunding
underfunded = max(spend - total_available_cash, 0.0)
is_underfunded = underfunded > hh.gap_tolerance  # Default: $5,000
```

#### YearResult Storage (Lines 2340-2430)

```python
rows.append(YearResult(
    year=year,
    age_p1=age1,
    age_p2=age2,
    spend_target_after_tax=spend,

    # Government benefits
    cpp_p1=t1["cpp"], oas_p1=t1["oas"], gis_p1=t1["gis"],

    # Withdrawals
    withdraw_rrif_p1=w1["rrif"],
    withdraw_tfsa_p1=w1["tfsa"],
    withdraw_nonreg_p1=w1["nonreg"],

    # EOY Balances (CRITICAL: Use Person objects AFTER update_balances)
    end_rrif_p1=p1.rrif_balance,
    end_tfsa_p1=p1.tfsa_balance,
    end_nonreg_p1=p1.nonreg_balance,

    # Underfunding
    underfunded_after_tax=underfunded,
    is_underfunded=is_underfunded,

    # ... 50+ more fields
))
```

---

## Data Models

### Internal Models (`modules/models.py`)

#### Person
```python
@dataclass
class Person:
    """Represents one person in the household."""

    # Identity
    name: str
    start_age: int

    # Account balances
    tfsa_balance: float = 0.0
    rrif_balance: float = 0.0
    rrsp_balance: float = 0.0
    nonreg_balance: float = 0.0
    corporate_balance: float = 0.0

    # Non-reg buckets (optional, auto-initialized if zero)
    nr_cash: float = 0.0
    nr_gic: float = 0.0
    nr_invest: float = 0.0

    # Non-reg ACB (cost basis)
    nonreg_acb: float = 0.0

    # Government benefits
    cpp_annual_at_start: float = 0.0
    cpp_start_age: int = 65
    oas_annual_at_start: float = 0.0
    oas_start_age: int = 65

    # Yields (annual rates)
    yield_rrif_growth: float = 0.05
    yield_tfsa_growth: float = 0.05
    # ... more yield fields
```

#### Household
```python
@dataclass
class Household:
    """Represents household configuration."""

    # People
    p1: Person
    p2: Optional[Person] = None

    # Location
    province: str = "ON"

    # Timeline
    start_year: int = 2025
    end_age: int = 95

    # Spending patterns (3-phase)
    spending_go_go: float = 50000
    go_go_end_age: int = 75
    spending_slow_go: float = 40000
    slow_go_end_age: int = 85
    spending_no_go: float = 30000

    # Inflation
    general_inflation: float = 0.02
    spending_inflation: float = 0.02

    # Strategy
    strategy: str = "balanced"

    # Tolerances
    gap_tolerance: float = 5000.0  # Acceptable underfunding
```

#### YearResult
```python
@dataclass
class YearResult:
    """One year's simulation output (~60 fields)."""

    # Timeline
    year: int
    age_p1: int
    age_p2: int
    years_since_start: int

    # Spending
    spend_target_after_tax: float

    # Government benefits
    cpp_p1: float
    cpp_p2: float
    oas_p1: float
    oas_p2: float
    gis_p1: float
    gis_p2: float

    # Withdrawals
    withdraw_rrif_p1: float
    withdraw_rrif_p2: float
    withdraw_tfsa_p1: float
    withdraw_tfsa_p2: float
    withdraw_nonreg_p1: float
    withdraw_nonreg_p2: float

    # EOY Balances
    end_rrif_p1: float
    end_rrif_p2: float
    end_tfsa_p1: float
    end_tfsa_p2: float
    end_nonreg_p1: float
    end_nonreg_p2: float

    # Taxes
    tax_p1: float
    tax_p2: float
    total_tax_after_split: float

    # Underfunding
    underfunded_after_tax: float
    is_underfunded: bool

    # Net worth
    net_worth_end: float

    # ... 30+ more fields
```

### API Models (`api/models/`)

TypeScript equivalents are in `webapp/lib/types/simulation.ts`.

---

## Tax Calculation

### Tax Configuration (`tax_config_canada_2025.json`)

```json
{
  "federal": {
    "brackets": [0, 55867, 111733, 173205, 246752],
    "rates": [0.15, 0.205, 0.26, 0.29, 0.33],
    "basic_personal_amount": 15705,
    "cpp_max_employee": 3867.50,
    "ei_max_premium": 1049.12
  },
  "provinces": {
    "ON": {
      "brackets": [0, 51446, 102894, 150000, 220000],
      "rates": [0.0505, 0.0915, 0.1116, 0.1216, 0.1316],
      "basic_personal_amount": 11865,
      "surtax_thresholds": [5315, 6802],
      "surtax_rates": [0.20, 0.56]
    },
    "AB": {
      "brackets": [0, 148269, 177922, 237230, 355845],
      "rates": [0.10, 0.12, 0.13, 0.14, 0.15],
      "basic_personal_amount": 21885
    }
    // ... more provinces
  },
  "gis": {
    "max_single": 1086.88,
    "max_couple_both_receive": 652.52,
    "threshold_single": 21624,
    "threshold_couple": 28560,
    "clawback_rate": 0.50
  }
}
```

### Tax Calculation Flow

```python
def calculate_tax(person: Person, withdrawals: Dict, benefits: Dict) -> float:
    """
    Calculate total tax (federal + provincial).

    Income Components:
    - Employment income (if any)
    - CPP + OAS (fully taxable)
    - RRIF withdrawals (fully taxable)
    - Corporate dividends (grossed-up, then dividend tax credit)
    - Non-Reg: Only capital gains portion (50% inclusion)
    - TFSA: Tax-free (not included)
    """

    # 1. Calculate taxable income
    taxable_income = (
        benefits['cpp'] +
        benefits['oas'] +
        withdrawals['rrif'] +
        (withdrawals['nonreg'] * capital_gain_ratio * 0.50) +  # 50% inclusion
        (withdrawals['corp'] * grossup_factor)  # Dividend grossup
    )

    # 2. Federal tax
    fed_tax = apply_brackets(taxable_income, fed_brackets, fed_rates)
    fed_tax -= fed_basic_personal_amount * fed_rates[0]  # Basic exemption

    # 3. Provincial tax
    prov_tax = apply_brackets(taxable_income, prov_brackets, prov_rates)
    prov_tax -= prov_basic_personal_amount * prov_rates[0]

    # 4. Apply surtax (if applicable, e.g., Ontario)
    if province == "ON":
        if fed_tax > surtax_threshold_1:
            prov_tax += (fed_tax - surtax_threshold_1) * surtax_rate_1
        if fed_tax > surtax_threshold_2:
            prov_tax += (fed_tax - surtax_threshold_2) * surtax_rate_2

    # 5. Dividend tax credit (if corporate dividends)
    if withdrawals['corp'] > 0:
        fed_tax -= withdrawals['corp'] * fed_dividend_credit_rate
        prov_tax -= withdrawals['corp'] * prov_dividend_credit_rate

    # 6. OAS clawback (if income > threshold)
    oas_clawback = 0.0
    if taxable_income > oas_clawback_threshold:
        oas_clawback = min(
            (taxable_income - oas_clawback_threshold) * 0.15,
            benefits['oas']
        )

    return max(fed_tax + prov_tax + oas_clawback, 0.0)
```

---

## GIS Optimization

### GIS Eligibility

**GIS** (Guaranteed Income Supplement) is income-tested:

```python
def calculate_gis(person: Person, cpp: float, oas: float, other_income: float) -> float:
    """
    Calculate GIS based on income test.

    GIS Income Test:
    - Includes: CPP, RRIF, employment, non-eligible dividends, 50% capital gains
    - Excludes: OAS, TFSA withdrawals, return of capital
    """

    # Calculate GIS net income
    gis_income = (
        cpp +
        rrif_withdrawals +
        (nonreg_withdrawals * capital_gain_ratio * 0.50) +
        employment_income
    )
    # Note: OAS excluded from GIS income test

    # Determine max GIS (single vs couple)
    if is_single:
        max_gis = gis_max_single
        threshold = gis_threshold_single
    else:
        max_gis = gis_max_couple
        threshold = gis_threshold_couple

    # Calculate GIS
    if gis_income <= threshold:
        gis = max_gis
    else:
        # Clawback at 50% rate
        clawback = (gis_income - threshold) * 0.50
        gis = max(max_gis - clawback, 0.0)

    return gis
```

### Minimize-Income Strategy

The `minimize-income` strategy prioritizes **GIS eligibility** by:

1. **Withdrawing from accounts with lowest GIS impact:**
   - NonReg first (only 50% of capital gains count)
   - RRIF second (100% taxable, affects GIS)
   - TFSA last (0% impact, preserve for emergencies)

2. **GIS Optimizer** attempts to maximize GIS by:
   - Finding optimal RRIF/NonReg withdrawal mix
   - Staying below GIS clawback thresholds
   - Using TFSA to fill gaps without affecting GIS

```python
# Line 1230-1260 in simulation.py
if "minimize-income" in strategy_name.lower():
    # Attempt GIS optimization
    gis_optimized_withdrawals = optimize_for_gis(
        person,
        shortfall,
        fed_params,
        ...
    )

    if gis_optimized_withdrawals:
        withdrawals = gis_optimized_withdrawals
    else:
        # Fallback to standard order
        order = ['nonreg', 'rrif', 'tfsa']
```

---

## Database Schema

### Prisma Schema (`webapp/prisma/schema.prisma`)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profiles      RetirementProfile[]
}

model RetirementProfile {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id])

  // Person 1 (required)
  p1_name               String    @default("Person 1")
  p1_age                Int       @default(65)
  p1_tfsa               Float     @default(0)
  p1_rrif               Float     @default(0)
  p1_rrsp               Float     @default(0)
  p1_nonreg             Float     @default(0)
  p1_corporate          Float     @default(0)
  p1_cpp_annual         Float     @default(0)
  p1_cpp_start_age      Int       @default(65)
  p1_oas_annual         Float     @default(0)
  p1_oas_start_age      Int       @default(65)

  // Person 2 (optional)
  p2_name               String?
  p2_age                Int?
  p2_tfsa               Float?
  p2_rrif               Float?
  p2_rrsp               Float?
  p2_nonreg             Float?
  p2_corporate          Float?
  p2_cpp_annual         Float?
  p2_cpp_start_age      Int?
  p2_oas_annual         Float?
  p2_oas_start_age      Int?

  // Household settings
  province              String    @default("ON")
  start_year            Int       @default(2025)
  end_age               Int       @default(95)

  // Spending (3-phase)
  spending_go_go        Float     @default(50000)
  go_go_end_age         Int       @default(75)
  spending_slow_go      Float     @default(40000)
  slow_go_end_age       Int       @default(85)
  spending_no_go        Float     @default(30000)

  // Strategy
  strategy              String    @default("balanced")

  // Metadata
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
}
```

---

## Performance Considerations

### Backend Performance

1. **Simulation Complexity:** O(n) where n = number of years
   - Typical: 30 years × 2 people = 60 person-years
   - Execution time: ~100-500ms

2. **Optimization Opportunities:**
   - Cache tax config (already implemented)
   - Vectorize calculations using NumPy (future enhancement)
   - Pre-calculate RRIF minimums (lookup table)

3. **Memory Usage:**
   - Modest: ~10MB per simulation
   - DataFrame overhead: ~1KB per year

### Frontend Performance

1. **Chart Rendering:**
   - Use `useMemo` for data transformations
   - Lazy load chart components
   - Limit data points (downsample for long simulations)

2. **State Management:**
   - Debounce auto-save (2 second delay)
   - LocalStorage for immediate feedback
   - Database for persistence

3. **Bundle Size:**
   - Next.js automatic code splitting
   - Tree-shaking for unused components
   - Dynamic imports for charts

---

## Security Considerations

### Input Validation

1. **Backend (Pydantic):**
   ```python
   class PersonBalances(BaseModel):
       tfsa: float = Field(ge=0, description="Must be non-negative")
       rrif: float = Field(ge=0)
       # ... more fields
   ```

2. **Frontend (Zod - future):**
   ```typescript
   const balanceSchema = z.object({
     tfsa: z.number().min(0),
     rrif: z.number().min(0),
   });
   ```

### Data Protection

1. **Database:**
   - User data encrypted at rest (Railway/PostgreSQL)
   - SSL/TLS for connections
   - Environment variables for credentials

2. **API:**
   - CORS restricted to frontend domain
   - Rate limiting (future enhancement)
   - Authentication required for profile operations

---

## Deployment Architecture

### Development

```
Local Machine:
  - Frontend: localhost:3000 (npm run dev)
  - Backend: localhost:8000 (uvicorn --reload)
  - Database: localhost:5433 (PostgreSQL)
```

### Production (Railway)

```
Railway Services:
  ├─ Next.js (Frontend + API Routes)
  │    ├─ Port: 3000
  │    ├─ Environment: NODE_ENV=production
  │    └─ Auto-deploy on: main branch
  │
  ├─ Python Backend (FastAPI)
  │    ├─ Port: 8000
  │    ├─ Command: uvicorn api.main:app --host 0.0.0.0
  │    └─ Auto-deploy on: main branch
  │
  └─ PostgreSQL Database
       ├─ Internal URL: DATABASE_URL
       └─ Automatic backups
```

---

## Error Handling

### Backend Errors

```python
@router.post("/simulate")
async def simulate_endpoint(request: SimulationRequest):
    try:
        # Run simulation
        result = simulate(household, tax_config)
        return SimulationResponse(success=True, ...)

    except ValueError as e:
        # Invalid input
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # Unexpected error
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail="Simulation failed")
```

### Frontend Errors

```typescript
try {
  const result = await runSimulation(params);
  setResults(result);
} catch (error) {
  console.error('Simulation error:', error);
  toast.error('Simulation failed. Please check your inputs.');
  setResults(null);
}
```

---

## Future Enhancements

### Planned Features

1. **Scenario Comparison**
   - Run multiple strategies side-by-side
   - Visual comparison charts
   - "What-if" analysis

2. **Monte Carlo Simulation**
   - Probabilistic returns
   - Success probability analysis
   - Confidence intervals

3. **Advanced Tax Optimization**
   - Pension income splitting
   - TFSA contribution strategies
   - Corporate tax integration planning

4. **Export/Import**
   - PDF report generation
   - CSV data export
   - Scenario templates

5. **Collaboration**
   - Share scenarios with advisors
   - Real-time collaboration
   - Comments and annotations

---

## Glossary

- **CPP:** Canada Pension Plan
- **OAS:** Old Age Security
- **GIS:** Guaranteed Income Supplement
- **RRIF:** Registered Retirement Income Fund
- **TFSA:** Tax-Free Savings Account
- **ACB:** Adjusted Cost Base
- **EOY:** End of Year
- **BOY:** Beginning of Year
- **Clawback:** Reduction in benefits based on income
- **Grossup:** Dividend income adjustment for tax calculation
- **Marginal Rate:** Tax rate on next dollar earned

---

This architecture document provides a comprehensive technical reference for developers working on RetireZest. For practical development tasks, see the [Developer Guide](./DEVELOPER_GUIDE.md).
