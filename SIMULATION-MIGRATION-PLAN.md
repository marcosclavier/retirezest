# Retirement Simulation Migration Plan
## From Streamlit to React/Next.js with Python API Backend

**Project**: Migrate juan-retirement-app Streamlit simulation to React frontend in Vercel production app
**Goal**: Provide simulation functionality with React UI while preserving Python calculation logic
**Timeline**: 2-3 weeks (80-120 hours)
**Last Updated**: November 24, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Development Phases](#development-phases)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Plan](#deployment-plan)
7. [Risk Assessment](#risk-assessment)
8. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State
- **Streamlit App** (`juan-retirement-app/app.py`): 6,671 lines, fully functional retirement simulator
- **Next.js App** (`webapp/`): Production app on Vercel with authentication, CPP/OAS/GIS calculators
- **Problem**: Streamlit UI cannot be embedded in React app; users want consistent React experience

### Target State
- **Python FastAPI Backend**: Expose simulation logic via REST API
- **React Frontend**: New simulation page in Next.js app matching existing UI patterns
- **Unified Experience**: Single application with consistent design system

### Benefits
- ✅ Consistent user experience (all React)
- ✅ Preserves complex Python calculation logic (20+ modules)
- ✅ Maintainable separation of concerns (API + Frontend)
- ✅ Scalable architecture (backend can serve multiple clients)
- ✅ No code rewrite of tax calculations (1000+ hours saved)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           React Simulation Page                      │   │
│  │  - Input forms (person1, person2, household)         │   │
│  │  - Strategy selector                                 │   │
│  │  - Results dashboard                                 │   │
│  │  - Interactive charts (Recharts)                     │   │
│  │  - Data tables                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS POST /api/simulation/*
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js App (Vercel)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         API Route Proxy Layer                        │   │
│  │  /api/simulation/run      → Python API               │   │
│  │  /api/simulation/optimize → Python API               │   │
│  │  /api/simulation/analyze  → Python API               │   │
│  │  /api/simulation/monte-carlo → Python API            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  - Authentication middleware                                │
│  - Request validation                                       │
│  - Response caching (optional)                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS (internal)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Python FastAPI Backend (Railway/Render)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              REST API Endpoints                      │   │
│  │  POST /api/run-simulation                            │   │
│  │  POST /api/optimize-strategy                         │   │
│  │  POST /api/analyze-composition                       │   │
│  │  POST /api/monte-carlo                               │   │
│  │  GET  /api/health                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Existing Python Modules                      │   │
│  │  - modules/simulation.py                             │   │
│  │  - modules/tax_engine.py                             │   │
│  │  - modules/benefits.py                               │   │
│  │  - modules/withdrawal_strategies.py                  │   │
│  │  - utils/asset_analyzer.py                           │   │
│  │  - utils/tax_efficiency.py                           │   │
│  │  - actuals_tracker_calculations.py                   │   │
│  │  + 15 more modules (unchanged)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input Form (React)
  → Next.js API Route (validation)
    → Python FastAPI (calculation)
      → Simulation Engine (existing code)
        → Return DataFrame as JSON
      ← Results
    ← Formatted Response
  ← Display Charts & Tables
```

---

## Technology Stack

### Frontend (React/Next.js)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 15 | Server-side rendering, routing |
| UI Library | React 18 | Component framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Pre-built components |
| Charts | Recharts | Data visualization |
| Forms | React Hook Form | Form state management |
| Validation | Zod | Schema validation |
| State | React Context | Global state (optional) |

### Backend (Python API)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI | REST API framework |
| Validation | Pydantic | Request/response models |
| Server | Uvicorn | ASGI server |
| Data | Pandas, NumPy | Data processing (existing) |
| Calculations | Existing modules | Tax, benefits, simulation logic |

### Infrastructure
| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend Host | Vercel | Next.js deployment (existing) |
| Backend Host | Railway (primary) or Render | Python API hosting |
| Database | PostgreSQL (existing) | User data, scenarios |
| Monitoring | Railway Logs | Error tracking |
| Secrets | Vercel Env Vars | API keys, URLs |

---

## Development Phases

### **Phase 0: Planning & Setup** (Week 1, Days 1-2)

#### 0.1 Repository Setup
- [ ] Create feature branch: `feature/simulation-migration`
- [ ] Set up project structure
  ```
  juan-retirement-app/
  ├── api/
  │   ├── __init__.py
  │   ├── main.py              # FastAPI app
  │   ├── routes/
  │   │   ├── simulation.py    # Simulation endpoints
  │   │   ├── optimization.py  # Optimizer endpoints
  │   │   └── monte_carlo.py   # Monte Carlo endpoints
  │   ├── models/
  │   │   ├── requests.py      # Pydantic request models
  │   │   └── responses.py     # Pydantic response models
  │   └── utils/
  │       └── converters.py    # Convert between API/internal models
  ├── requirements-api.txt     # FastAPI dependencies
  ├── Procfile                 # Railway/Render config
  └── railway.json             # Railway config

  webapp/
  ├── app/
  │   ├── (dashboard)/
  │   │   └── simulation/
  │   │       ├── page.tsx                    # Main simulation page
  │   │       ├── components/
  │   │       │   ├── PersonForm.tsx          # Person input form
  │   │       │   ├── HouseholdForm.tsx       # Household settings
  │   │       │   ├── StrategySelector.tsx    # Strategy picker
  │   │       │   ├── ResultsDashboard.tsx    # Results summary
  │   │       │   ├── YearByYearTable.tsx     # Detailed table
  │   │       │   ├── PortfolioChart.tsx      # Portfolio value chart
  │   │       │   ├── TaxChart.tsx            # Tax analysis chart
  │   │       │   └── SpendingChart.tsx       # Spending coverage
  │   │       └── types.ts                    # TypeScript types
  │   └── api/
  │       └── simulation/
  │           ├── run/route.ts                # POST /api/simulation/run
  │           ├── optimize/route.ts           # POST /api/simulation/optimize
  │           ├── analyze/route.ts            # POST /api/simulation/analyze
  │           └── monte-carlo/route.ts        # POST /api/simulation/monte-carlo
  └── lib/
      ├── api/
      │   └── simulation-client.ts            # API client functions
      └── types/
          └── simulation.ts                   # Shared types
  ```

#### 0.2 Environment Configuration
- [ ] Create `.env.local` variables
  ```bash
  PYTHON_API_URL=http://localhost:8000  # Dev
  # PYTHON_API_URL=https://retirement-api.railway.app  # Production
  NEXT_PUBLIC_ENABLE_SIMULATION=true
  ```

#### 0.3 Dependency Installation
- [ ] Python dependencies
  ```bash
  cd juan-retirement-app
  pip install fastapi uvicorn pydantic python-multipart pydantic-settings
  ```
- [ ] Update `requirements-api.txt`
  ```
  fastapi==0.104.1
  uvicorn[standard]==0.24.0
  pydantic==2.5.0
  pydantic-settings==2.1.0
  pandas==2.1.3
  numpy==1.26.2
  # ... existing dependencies from app.py
  ```

**Testing Deliverables:**
- ✅ Branch created and pushed
- ✅ Directory structure created
- ✅ All dependencies install without errors
- ✅ Environment variables configured

---

### **Phase 1: Python FastAPI Backend** (Week 1, Days 3-7)

#### 1.1 Core API Structure (Day 3)

**File: `juan-retirement-app/api/main.py`**
```python
"""
FastAPI server for retirement simulation calculations.
Wraps existing Python logic from modules/ and utils/.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load resources on startup, cleanup on shutdown."""
    logger.info("🚀 Starting Retirement Simulation API")
    # Load tax config
    from modules.config import load_tax_config
    app.state.tax_cfg = load_tax_config()
    logger.info("✅ Tax configuration loaded")
    yield
    logger.info("👋 Shutting down API")

app = FastAPI(
    title="Retirement Simulation API",
    description="Tax-optimized retirement planning calculations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",           # Local Next.js dev
        "https://your-app.vercel.app",     # Production
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Import routers
from api.routes import simulation, optimization, monte_carlo

app.include_router(simulation.router, prefix="/api", tags=["simulation"])
app.include_router(optimization.router, prefix="/api", tags=["optimization"])
app.include_router(monte_carlo.router, prefix="/api", tags=["monte-carlo"])

@app.get("/")
async def root():
    return {
        "service": "Retirement Simulation API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "tax_config_loaded": hasattr(app.state, "tax_cfg")
    }
```

#### 1.2 Request/Response Models (Day 3)

**File: `juan-retirement-app/api/models/requests.py`**
```python
"""
Pydantic models for API requests.
Maps JSON input to Python types with validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from enum import Enum

class PersonInput(BaseModel):
    """Input data for one person."""

    # Identity
    name: str = Field(..., min_length=1, max_length=50)
    start_age: int = Field(..., ge=50, le=90)

    # Government benefits
    cpp_start_age: int = Field(..., ge=60, le=70)
    cpp_annual_at_start: float = Field(..., ge=0, le=20000)
    oas_start_age: int = Field(..., ge=65, le=70)
    oas_annual_at_start: float = Field(..., ge=0, le=15000)

    # Account balances
    tfsa_balance: float = Field(default=0, ge=0)
    rrif_balance: float = Field(default=0, ge=0)
    rrsp_balance: float = Field(default=0, ge=0)
    nonreg_balance: float = Field(default=0, ge=0)
    corporate_balance: float = Field(default=0, ge=0)

    # Non-registered details
    nonreg_acb: float = Field(default=0, ge=0)
    nr_cash: float = Field(default=0, ge=0)
    nr_gic: float = Field(default=0, ge=0)
    nr_invest: float = Field(default=0, ge=0)

    # Yields (as percentages, e.g., 2.5 for 2.5%)
    y_nr_cash_interest: float = Field(default=2.0, ge=0, le=20)
    y_nr_gic_interest: float = Field(default=3.5, ge=0, le=20)
    y_nr_inv_total_return: float = Field(default=6.0, ge=-50, le=50)
    y_nr_inv_elig_div: float = Field(default=2.0, ge=0, le=20)
    y_nr_inv_nonelig_div: float = Field(default=0.5, ge=0, le=20)
    y_nr_inv_capg: float = Field(default=3.0, ge=0, le=50)
    y_nr_inv_roc_pct: float = Field(default=0.5, ge=0, le=20)

    # Non-registered allocation percentages (must sum to 100)
    nr_cash_pct: float = Field(default=10.0, ge=0, le=100)
    nr_gic_pct: float = Field(default=20.0, ge=0, le=100)
    nr_invest_pct: float = Field(default=70.0, ge=0, le=100)

    # Corporate details
    corp_cash_bucket: float = Field(default=0, ge=0)
    corp_gic_bucket: float = Field(default=0, ge=0)
    corp_invest_bucket: float = Field(default=0, ge=0)
    corp_rdtoh: float = Field(default=0, ge=0)

    # Corporate yields
    y_corp_cash_interest: float = Field(default=2.0, ge=0, le=20)
    y_corp_gic_interest: float = Field(default=3.5, ge=0, le=20)
    y_corp_inv_total_return: float = Field(default=6.0, ge=-50, le=50)
    y_corp_inv_elig_div: float = Field(default=2.0, ge=0, le=20)
    y_corp_inv_capg: float = Field(default=3.5, ge=0, le=50)

    # Corporate allocation percentages
    corp_cash_pct: float = Field(default=5.0, ge=0, le=100)
    corp_gic_pct: float = Field(default=10.0, ge=0, le=100)
    corp_invest_pct: float = Field(default=85.0, ge=0, le=100)

    corp_dividend_type: Literal["eligible", "non-eligible"] = "eligible"

    # TFSA room
    tfsa_room_start: float = Field(default=7000, ge=0)
    tfsa_room_annual_growth: float = Field(default=7000, ge=0)

    @validator('nr_cash_pct', 'nr_gic_pct', 'nr_invest_pct')
    def validate_nr_allocation(cls, v, values):
        """Ensure non-reg allocations sum to 100%."""
        if 'nr_cash_pct' in values and 'nr_gic_pct' in values:
            total = values['nr_cash_pct'] + values['nr_gic_pct'] + v
            if abs(total - 100.0) > 0.1:
                raise ValueError(f"Non-reg allocations must sum to 100%, got {total}%")
        return v

    @validator('corp_cash_pct', 'corp_gic_pct', 'corp_invest_pct')
    def validate_corp_allocation(cls, v, values):
        """Ensure corporate allocations sum to 100%."""
        if 'corp_cash_pct' in values and 'corp_gic_pct' in values:
            total = values['corp_cash_pct'] + values['corp_gic_pct'] + v
            if abs(total - 100.0) > 0.1:
                raise ValueError(f"Corp allocations must sum to 100%, got {total}%")
        return v

class HouseholdInput(BaseModel):
    """Input data for household simulation."""

    # People
    p1: PersonInput
    p2: PersonInput

    # Location and timeframe
    province: Literal["AB", "BC", "ON", "QC"] = "AB"
    start_year: int = Field(..., ge=2024, le=2040)
    end_age: int = Field(..., ge=85, le=100)

    # Withdrawal strategy
    strategy: Literal[
        "corporate-optimized",
        "minimize-income",
        "rrif-splitting",
        "capital-gains-optimized",
        "tfsa-first",
        "balanced",
        "manual"
    ] = "corporate-optimized"

    # Spending phases (annual amounts)
    spending_go_go: float = Field(..., ge=0, le=500000)
    go_go_end_age: int = Field(default=75, ge=65, le=90)
    spending_slow_go: float = Field(..., ge=0, le=500000)
    slow_go_end_age: int = Field(default=85, ge=70, le=95)
    spending_no_go: float = Field(..., ge=0, le=500000)

    # Inflation rates (as percentages)
    spending_inflation: float = Field(default=2.0, ge=0, le=10)
    general_inflation: float = Field(default=2.0, ge=0, le=10)

    # Advanced options
    gap_tolerance: float = Field(default=1000, ge=0, le=10000)
    tfsa_contribution_each: float = Field(default=0, ge=0, le=10000)
    reinvest_nonreg_dist: bool = Field(default=True)
    income_split_rrif_fraction: float = Field(default=0.0, ge=0, le=0.5)
    hybrid_rrif_topup_per_person: float = Field(default=0, ge=0, le=50000)
    stop_on_fail: bool = Field(default=True)

    class Config:
        json_schema_extra = {
            "example": {
                "p1": {
                    "name": "Juan",
                    "start_age": 65,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 15000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8500,
                    "tfsa_balance": 202000,
                    "rrif_balance": 225000,
                    "rrsp_balance": 0,
                    "nonreg_balance": 412500,
                    "corporate_balance": 1202500
                },
                "p2": {
                    "name": "Jane",
                    "start_age": 65,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 15000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8500,
                    "tfsa_balance": 202000,
                    "rrif_balance": 225000,
                    "rrsp_balance": 0,
                    "nonreg_balance": 412500,
                    "corporate_balance": 1202500
                },
                "province": "AB",
                "start_year": 2025,
                "end_age": 95,
                "strategy": "corporate-optimized",
                "spending_go_go": 120000,
                "go_go_end_age": 75,
                "spending_slow_go": 90000,
                "slow_go_end_age": 85,
                "spending_no_go": 70000,
                "spending_inflation": 2.0,
                "general_inflation": 2.0
            }
        }

class OptimizationRequest(BaseModel):
    """Request for strategy optimization."""

    household: HouseholdInput
    strategies: list[str] = Field(
        default=["corporate-optimized", "minimize-income", "rrif-splitting"],
        min_length=2,
        max_length=10
    )
    split_fractions: list[float] = Field(
        default=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5],
        min_length=1,
        max_length=10
    )
    hybrid_topups: list[float] = Field(
        default=[0, 5000, 10000, 15000, 20000],
        min_length=1,
        max_length=10
    )
    optimize_for: Literal["balance", "legacy", "tax_efficiency", "success_rate"] = "balance"

class MonteCarloRequest(BaseModel):
    """Request for Monte Carlo simulation."""

    household: HouseholdInput
    num_trials: int = Field(default=1000, ge=100, le=10000)
    return_mean: float = Field(default=6.0, ge=-10, le=20)
    return_std: float = Field(default=12.0, ge=0, le=50)
    success_threshold: float = Field(default=0.0, ge=0)
    seed: Optional[int] = Field(default=None)
```

**File: `juan-retirement-app/api/models/responses.py`**
```python
"""
Pydantic models for API responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class YearResult(BaseModel):
    """One year of simulation results."""

    year: int
    age_p1: int
    age_p2: int

    # Inflows
    cpp_p1: float
    cpp_p2: float
    oas_p1: float
    oas_p2: float

    # Withdrawals by source
    tfsa_withdrawal_p1: float
    tfsa_withdrawal_p2: float
    rrif_withdrawal_p1: float
    rrif_withdrawal_p2: float
    nonreg_withdrawal_p1: float
    nonreg_withdrawal_p2: float
    corporate_withdrawal_p1: float
    corporate_withdrawal_p2: float

    # Balances
    tfsa_balance_p1: float
    tfsa_balance_p2: float
    rrif_balance_p1: float
    rrif_balance_p2: float
    nonreg_balance_p1: float
    nonreg_balance_p2: float
    corporate_balance_p1: float
    corporate_balance_p2: float
    total_value: float

    # Income and tax
    taxable_income_p1: float
    taxable_income_p2: float
    total_tax_p1: float
    total_tax_p2: float
    total_tax: float
    marginal_rate_p1: float
    marginal_rate_p2: float

    # Spending
    spending_need: float
    spending_met: float
    spending_gap: float

    # Status
    plan_success: bool
    failure_reason: Optional[str] = None

class SimulationSummary(BaseModel):
    """Summary statistics for simulation."""

    years_simulated: int
    years_funded: int
    success_rate: float

    total_inflows: float
    total_withdrawals: float
    total_tax_paid: float
    total_spending: float

    final_estate_gross: float
    final_estate_after_tax: float

    avg_effective_tax_rate: float
    avg_marginal_rate: float

    first_failure_year: Optional[int] = None
    total_underfunded_years: int
    total_underfunding: float

class SimulationResponse(BaseModel):
    """Response from simulation endpoint."""

    success: bool
    message: str

    household_input: Optional[Dict[str, Any]] = None
    composition_analysis: Optional[Dict[str, Any]] = None

    year_by_year: Optional[List[YearResult]] = None
    summary: Optional[SimulationSummary] = None

    warnings: List[str] = Field(default_factory=list)
    error: Optional[str] = None
    error_details: Optional[str] = None

class CompositionResponse(BaseModel):
    """Response from composition analysis endpoint."""

    success: bool

    # Account balances
    tfsa_balance: float
    rrif_balance: float
    nonreg_balance: float
    corporate_balance: float
    total_value: float

    # Percentages
    tfsa_pct: float
    rrif_pct: float
    nonreg_pct: float
    corporate_pct: float

    # Characteristics
    dominant_account: str
    is_corporate_heavy: bool
    is_rrif_heavy: bool
    is_nonreg_heavy: bool
    is_tfsa_significant: bool

    # Recommendation
    recommended_strategy: str
    strategy_rationale: str
    strategy_details: Dict[str, Any]

class OptimizationCandidate(BaseModel):
    """One candidate from optimization."""

    rank: int
    strategy: str
    split_fraction: float
    hybrid_topup: float

    success_pct: float
    underfunded_years: int

    cumulative_tax: float
    legacy_gross: float
    legacy_after_tax: float

    score: float

class OptimizationResponse(BaseModel):
    """Response from optimization endpoint."""

    success: bool
    message: str

    candidates: List[OptimizationCandidate]
    best_candidate: OptimizationCandidate

    optimization_criteria: str
    candidates_tested: int

    warnings: List[str] = Field(default_factory=list)

class MonteCarloTrial(BaseModel):
    """Results from one Monte Carlo trial."""

    trial_number: int
    success: bool
    years_funded: int
    final_estate: float
    total_tax: float
    max_drawdown: float

class MonteCarloResponse(BaseModel):
    """Response from Monte Carlo simulation."""

    success: bool
    message: str

    num_trials: int
    success_rate: float

    # Summary statistics
    median_estate: float
    median_tax: float
    median_years_funded: float

    percentile_10_estate: float
    percentile_50_estate: float
    percentile_90_estate: float

    worst_case_estate: float
    best_case_estate: float

    trials: Optional[List[MonteCarloTrial]] = None  # Optional, can be large

    warnings: List[str] = Field(default_factory=list)
```

#### 1.3 Converter Utilities (Day 4)

**File: `juan-retirement-app/api/utils/converters.py`**
```python
"""
Convert between API models (Pydantic) and internal models (dataclasses).
"""

from api.models.requests import PersonInput, HouseholdInput
from api.models.responses import YearResult, SimulationSummary
from modules.models import Person, Household, YearResult as InternalYearResult
import pandas as pd
from typing import Tuple

def api_person_to_internal(api_person: PersonInput) -> Person:
    """Convert API PersonInput to internal Person dataclass."""

    return Person(
        name=api_person.name,
        start_age=api_person.start_age,

        # Government benefits
        cpp_start_age=api_person.cpp_start_age,
        cpp_annual_at_start=api_person.cpp_annual_at_start,
        oas_start_age=api_person.oas_start_age,
        oas_annual_at_start=api_person.oas_annual_at_start,

        # Account balances
        tfsa_balance=api_person.tfsa_balance,
        rrif_balance=api_person.rrif_balance,
        rrsp_balance=api_person.rrsp_balance,
        nonreg_balance=api_person.nonreg_balance,
        corporate_balance=api_person.corporate_balance,

        # Non-registered details
        nonreg_acb=api_person.nonreg_acb,
        nr_cash=api_person.nr_cash,
        nr_gic=api_person.nr_gic,
        nr_invest=api_person.nr_invest,

        # Convert percentages to decimals
        y_nr_cash_interest=api_person.y_nr_cash_interest / 100.0,
        y_nr_gic_interest=api_person.y_nr_gic_interest / 100.0,
        y_nr_inv_total_return=api_person.y_nr_inv_total_return / 100.0,
        y_nr_inv_elig_div=api_person.y_nr_inv_elig_div / 100.0,
        y_nr_inv_nonelig_div=api_person.y_nr_inv_nonelig_div / 100.0,
        y_nr_inv_capg=api_person.y_nr_inv_capg / 100.0,
        y_nr_inv_roc_pct=api_person.y_nr_inv_roc_pct / 100.0,

        nr_cash_pct=api_person.nr_cash_pct / 100.0,
        nr_gic_pct=api_person.nr_gic_pct / 100.0,
        nr_invest_pct=api_person.nr_invest_pct / 100.0,

        # Corporate details
        corp_cash_bucket=api_person.corp_cash_bucket,
        corp_gic_bucket=api_person.corp_gic_bucket,
        corp_invest_bucket=api_person.corp_invest_bucket,
        corp_rdtoh=api_person.corp_rdtoh,

        y_corp_cash_interest=api_person.y_corp_cash_interest / 100.0,
        y_corp_gic_interest=api_person.y_corp_gic_interest / 100.0,
        y_corp_inv_total_return=api_person.y_corp_inv_total_return / 100.0,
        y_corp_inv_elig_div=api_person.y_corp_inv_elig_div / 100.0,
        y_corp_inv_capg=api_person.y_corp_inv_capg / 100.0,

        corp_cash_pct=api_person.corp_cash_pct / 100.0,
        corp_gic_pct=api_person.corp_gic_pct / 100.0,
        corp_invest_pct=api_person.corp_invest_pct / 100.0,

        corp_dividend_type=api_person.corp_dividend_type,

        # TFSA room
        tfsa_room_start=api_person.tfsa_room_start,
        tfsa_room_annual_growth=api_person.tfsa_room_annual_growth,
    )

def api_household_to_internal(
    api_household: HouseholdInput,
    tax_cfg: dict
) -> Household:
    """Convert API HouseholdInput to internal Household dataclass."""

    return Household(
        p1=api_person_to_internal(api_household.p1),
        p2=api_person_to_internal(api_household.p2),

        province=api_household.province,
        start_year=api_household.start_year,
        end_age=api_household.end_age,

        strategy=api_household.strategy,

        spending_go_go=api_household.spending_go_go,
        go_go_end_age=api_household.go_go_end_age,
        spending_slow_go=api_household.spending_slow_go,
        slow_go_end_age=api_household.slow_go_end_age,
        spending_no_go=api_household.spending_no_go,

        spending_inflation=api_household.spending_inflation / 100.0,
        general_inflation=api_household.general_inflation / 100.0,

        gap_tolerance=api_household.gap_tolerance,
        tfsa_contribution_each=api_household.tfsa_contribution_each,
        reinvest_nonreg_dist=api_household.reinvest_nonreg_dist,
        income_split_rrif_fraction=api_household.income_split_rrif_fraction,
        hybrid_rrif_topup_per_person=api_household.hybrid_rrif_topup_per_person,
        stop_on_fail=api_household.stop_on_fail,
    )

def dataframe_to_year_results(df: pd.DataFrame) -> list[YearResult]:
    """Convert simulation DataFrame to list of YearResult models."""

    results = []
    for _, row in df.iterrows():
        results.append(YearResult(
            year=int(row.get('year', 0)),
            age_p1=int(row.get('age_p1', 0)),
            age_p2=int(row.get('age_p2', 0)),

            # Inflows
            cpp_p1=float(row.get('cpp_p1', 0)),
            cpp_p2=float(row.get('cpp_p2', 0)),
            oas_p1=float(row.get('oas_p1', 0)),
            oas_p2=float(row.get('oas_p2', 0)),

            # Withdrawals
            tfsa_withdrawal_p1=float(row.get('tfsa_w_p1', 0)),
            tfsa_withdrawal_p2=float(row.get('tfsa_w_p2', 0)),
            rrif_withdrawal_p1=float(row.get('rrif_w_p1', 0)),
            rrif_withdrawal_p2=float(row.get('rrif_w_p2', 0)),
            nonreg_withdrawal_p1=float(row.get('nonreg_w_p1', 0)),
            nonreg_withdrawal_p2=float(row.get('nonreg_w_p2', 0)),
            corporate_withdrawal_p1=float(row.get('corp_w_p1', 0)),
            corporate_withdrawal_p2=float(row.get('corp_w_p2', 0)),

            # Balances
            tfsa_balance_p1=float(row.get('tfsa_p1', 0)),
            tfsa_balance_p2=float(row.get('tfsa_p2', 0)),
            rrif_balance_p1=float(row.get('rrif_p1', 0)),
            rrif_balance_p2=float(row.get('rrif_p2', 0)),
            nonreg_balance_p1=float(row.get('nonreg_p1', 0)),
            nonreg_balance_p2=float(row.get('nonreg_p2', 0)),
            corporate_balance_p1=float(row.get('corp_p1', 0)),
            corporate_balance_p2=float(row.get('corp_p2', 0)),
            total_value=float(row.get('total_value', 0)),

            # Tax
            taxable_income_p1=float(row.get('taxable_inc_p1', 0)),
            taxable_income_p2=float(row.get('taxable_inc_p2', 0)),
            total_tax_p1=float(row.get('tax_p1', 0)),
            total_tax_p2=float(row.get('tax_p2', 0)),
            total_tax=float(row.get('total_tax', 0)),
            marginal_rate_p1=float(row.get('marginal_rate_p1', 0)),
            marginal_rate_p2=float(row.get('marginal_rate_p2', 0)),

            # Spending
            spending_need=float(row.get('spending_need', 0)),
            spending_met=float(row.get('spending_met', 0)),
            spending_gap=float(row.get('spending_gap', 0)),

            # Status
            plan_success=bool(row.get('plan_success', True)),
            failure_reason=row.get('failure_reason', None),
        ))

    return results

def calculate_simulation_summary(df: pd.DataFrame) -> SimulationSummary:
    """Calculate summary statistics from simulation DataFrame."""

    years_simulated = len(df)
    years_funded = len(df[df['total_value'] > 0])
    success_rate = years_funded / years_simulated if years_simulated > 0 else 0.0

    total_inflows = df['total_inflows'].sum() if 'total_inflows' in df.columns else 0
    total_withdrawals = df['total_withdrawals'].sum() if 'total_withdrawals' in df.columns else 0
    total_tax_paid = df['total_tax'].sum()
    total_spending = df['spending_met'].sum()

    final_row = df.iloc[-1]
    final_estate_gross = final_row['total_value']

    # Estimate tax on final estate (simplified)
    final_estate_after_tax = final_estate_gross * 0.75  # Rough estimate

    avg_effective_tax_rate = (
        (df['total_tax'].sum() / df['total_income'].sum())
        if 'total_income' in df.columns and df['total_income'].sum() > 0
        else 0.0
    )

    avg_marginal_rate = df['marginal_rate_p1'].mean() if 'marginal_rate_p1' in df.columns else 0.0

    # Find first failure
    failure_rows = df[df['plan_success'] == False]
    first_failure_year = int(failure_rows.iloc[0]['year']) if len(failure_rows) > 0 else None

    total_underfunded_years = len(df[df['spending_gap'] > 0])
    total_underfunding = df['spending_gap'].sum()

    return SimulationSummary(
        years_simulated=years_simulated,
        years_funded=years_funded,
        success_rate=success_rate,
        total_inflows=total_inflows,
        total_withdrawals=total_withdrawals,
        total_tax_paid=total_tax_paid,
        total_spending=total_spending,
        final_estate_gross=final_estate_gross,
        final_estate_after_tax=final_estate_after_tax,
        avg_effective_tax_rate=avg_effective_tax_rate,
        avg_marginal_rate=avg_marginal_rate,
        first_failure_year=first_failure_year,
        total_underfunded_years=total_underfunded_years,
        total_underfunding=total_underfunding,
    )
```

#### 1.4 Simulation Routes (Days 4-5)

**File: `juan-retirement-app/api/routes/simulation.py`**
```python
"""
Simulation endpoints.
"""

from fastapi import APIRouter, HTTPException, Request
from api.models.requests import HouseholdInput
from api.models.responses import SimulationResponse, CompositionResponse
from api.utils.converters import (
    api_household_to_internal,
    dataframe_to_year_results,
    calculate_simulation_summary
)
from modules.simulation import simulate
from utils.asset_analyzer import AssetAnalyzer, AssetComposition
from modules.config import get_tax_params, index_tax_params
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/run-simulation", response_model=SimulationResponse)
async def run_simulation(
    household_input: HouseholdInput,
    request: Request
):
    """
    Run retirement simulation for household.

    - Converts API input to internal models
    - Runs year-by-year simulation
    - Returns detailed results and summary
    """
    try:
        logger.info(f"Starting simulation for {household_input.p1.name} & {household_input.p2.name}")

        # Get tax config from app state
        tax_cfg = request.app.state.tax_cfg

        # Convert API model to internal Household
        household = api_household_to_internal(household_input, tax_cfg)

        # Get tax parameters for province and year
        tax_params = get_tax_params(
            tax_cfg,
            household.province,
            household.start_year
        )

        # Index tax params for inflation
        tax_params_indexed = index_tax_params(
            tax_params,
            household.start_year,
            household.general_inflation
        )

        # Run simulation
        logger.info(f"Running simulation: strategy={household.strategy}, years={household.end_age - household.p1.start_age}")
        df = simulate(household, tax_cfg)

        # Convert results
        year_by_year = dataframe_to_year_results(df)
        summary = calculate_simulation_summary(df)

        # Get composition analysis
        composition = AssetAnalyzer.analyze(household)
        composition_data = {
            "tfsa_pct": composition.tfsa_pct,
            "rrif_pct": composition.rrif_pct,
            "nonreg_pct": composition.nonreg_pct,
            "corporate_pct": composition.corporate_pct,
            "dominant_account": composition.dominant_account,
            "recommended_strategy": composition.recommended_strategy.value,
            "strategy_rationale": composition.strategy_rationale,
        }

        # Warnings
        warnings = []
        if summary.success_rate < 1.0:
            warnings.append(f"Plan fails in year {summary.first_failure_year}")
        if summary.total_underfunded_years > 0:
            warnings.append(f"Plan underfunded for {summary.total_underfunded_years} years")

        logger.info(f"Simulation complete: success_rate={summary.success_rate:.1%}")

        return SimulationResponse(
            success=True,
            message="Simulation completed successfully",
            household_input=household_input.model_dump(),
            composition_analysis=composition_data,
            year_by_year=year_by_year,
            summary=summary,
            warnings=warnings
        )

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Simulation failed: {str(e)}", exc_info=True)
        return SimulationResponse(
            success=False,
            message="Simulation failed",
            error=str(e),
            error_details=str(type(e).__name__)
        )

@router.post("/analyze-composition", response_model=CompositionResponse)
async def analyze_composition(
    household_input: HouseholdInput,
    request: Request
):
    """
    Analyze household asset composition and recommend strategy.

    Returns:
    - Account balances and percentages
    - Dominant account type
    - Recommended withdrawal strategy
    - Strategy rationale
    """
    try:
        logger.info("Analyzing asset composition")

        # Get tax config
        tax_cfg = request.app.state.tax_cfg

        # Convert to internal model
        household = api_household_to_internal(household_input, tax_cfg)

        # Analyze composition
        composition = AssetAnalyzer.analyze(household)

        # Get strategy details
        strategy_details = AssetAnalyzer.get_strategy_description(
            composition.recommended_strategy
        )

        return CompositionResponse(
            success=True,
            tfsa_balance=composition.tfsa_balance,
            rrif_balance=composition.rrif_balance,
            nonreg_balance=composition.nonreg_balance,
            corporate_balance=composition.corporate_balance,
            total_value=composition.total_value,
            tfsa_pct=composition.tfsa_pct,
            rrif_pct=composition.rrif_pct,
            nonreg_pct=composition.nonreg_pct,
            corporate_pct=composition.corporate_pct,
            dominant_account=composition.dominant_account,
            is_corporate_heavy=composition.is_corporate_heavy,
            is_rrif_heavy=composition.is_rrif_heavy,
            is_nonreg_heavy=composition.is_nonreg_heavy,
            is_tfsa_significant=composition.is_tfsa_significant,
            recommended_strategy=composition.recommended_strategy.value,
            strategy_rationale=composition.strategy_rationale,
            strategy_details=strategy_details
        )

    except Exception as e:
        logger.error(f"Composition analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
```

*(Continued in next section...)*

**Testing Deliverables Phase 1:**
- ✅ FastAPI server starts without errors
- ✅ `/api/health` endpoint returns 200 OK
- ✅ `/api/run-simulation` accepts valid input and returns results
- ✅ `/api/analyze-composition` returns composition analysis
- ✅ Error handling returns appropriate HTTP status codes
- ✅ Logging captures all requests and errors

---

### **Phase 2: React Frontend Components** (Week 2, Days 8-12)

#### 2.1 TypeScript Types (Day 8)

**File: `webapp/lib/types/simulation.ts`**
```typescript
/**
 * TypeScript types for simulation API.
 * Mirrors Python Pydantic models.
 */

export interface PersonInput {
  // Identity
  name: string;
  start_age: number;

  // Government benefits
  cpp_start_age: number;
  cpp_annual_at_start: number;
  oas_start_age: number;
  oas_annual_at_start: number;

  // Account balances
  tfsa_balance: number;
  rrif_balance: number;
  rrsp_balance: number;
  nonreg_balance: number;
  corporate_balance: number;

  // Non-registered details
  nonreg_acb: number;
  nr_cash: number;
  nr_gic: number;
  nr_invest: number;

  // Yields (percentages)
  y_nr_cash_interest: number;
  y_nr_gic_interest: number;
  y_nr_inv_total_return: number;
  y_nr_inv_elig_div: number;
  y_nr_inv_nonelig_div: number;
  y_nr_inv_capg: number;
  y_nr_inv_roc_pct: number;

  // Non-reg allocations (percentages, must sum to 100)
  nr_cash_pct: number;
  nr_gic_pct: number;
  nr_invest_pct: number;

  // Corporate details
  corp_cash_bucket: number;
  corp_gic_bucket: number;
  corp_invest_bucket: number;
  corp_rdtoh: number;

  // Corporate yields
  y_corp_cash_interest: number;
  y_corp_gic_interest: number;
  y_corp_inv_total_return: number;
  y_corp_inv_elig_div: number;
  y_corp_inv_capg: number;

  // Corporate allocations (percentages, must sum to 100)
  corp_cash_pct: number;
  corp_gic_pct: number;
  corp_invest_pct: number;

  corp_dividend_type: 'eligible' | 'non-eligible';

  // TFSA room
  tfsa_room_start: number;
  tfsa_room_annual_growth: number;
}

export interface HouseholdInput {
  p1: PersonInput;
  p2: PersonInput;

  province: 'AB' | 'BC' | 'ON' | 'QC';
  start_year: number;
  end_age: number;

  strategy:
    | 'corporate-optimized'
    | 'minimize-income'
    | 'rrif-splitting'
    | 'capital-gains-optimized'
    | 'tfsa-first'
    | 'balanced'
    | 'manual';

  spending_go_go: number;
  go_go_end_age: number;
  spending_slow_go: number;
  slow_go_end_age: number;
  spending_no_go: number;

  spending_inflation: number;
  general_inflation: number;

  gap_tolerance: number;
  tfsa_contribution_each: number;
  reinvest_nonreg_dist: boolean;
  income_split_rrif_fraction: number;
  hybrid_rrif_topup_per_person: number;
  stop_on_fail: boolean;
}

export interface YearResult {
  year: number;
  age_p1: number;
  age_p2: number;

  // Inflows
  cpp_p1: number;
  cpp_p2: number;
  oas_p1: number;
  oas_p2: number;

  // Withdrawals
  tfsa_withdrawal_p1: number;
  tfsa_withdrawal_p2: number;
  rrif_withdrawal_p1: number;
  rrif_withdrawal_p2: number;
  nonreg_withdrawal_p1: number;
  nonreg_withdrawal_p2: number;
  corporate_withdrawal_p1: number;
  corporate_withdrawal_p2: number;

  // Balances
  tfsa_balance_p1: number;
  tfsa_balance_p2: number;
  rrif_balance_p1: number;
  rrif_balance_p2: number;
  nonreg_balance_p1: number;
  nonreg_balance_p2: number;
  corporate_balance_p1: number;
  corporate_balance_p2: number;
  total_value: number;

  // Tax
  taxable_income_p1: number;
  taxable_income_p2: number;
  total_tax_p1: number;
  total_tax_p2: number;
  total_tax: number;
  marginal_rate_p1: number;
  marginal_rate_p2: number;

  // Spending
  spending_need: number;
  spending_met: number;
  spending_gap: number;

  // Status
  plan_success: boolean;
  failure_reason?: string;
}

export interface SimulationSummary {
  years_simulated: number;
  years_funded: number;
  success_rate: number;

  total_inflows: number;
  total_withdrawals: number;
  total_tax_paid: number;
  total_spending: number;

  final_estate_gross: number;
  final_estate_after_tax: number;

  avg_effective_tax_rate: number;
  avg_marginal_rate: number;

  first_failure_year?: number;
  total_underfunded_years: number;
  total_underfunding: number;
}

export interface SimulationResponse {
  success: boolean;
  message: string;

  household_input?: Record<string, any>;
  composition_analysis?: Record<string, any>;

  year_by_year?: YearResult[];
  summary?: SimulationSummary;

  warnings: string[];
  error?: string;
  error_details?: string;
}

export interface CompositionAnalysis {
  success: boolean;

  tfsa_balance: number;
  rrif_balance: number;
  nonreg_balance: number;
  corporate_balance: number;
  total_value: number;

  tfsa_pct: number;
  rrif_pct: number;
  nonreg_pct: number;
  corporate_pct: number;

  dominant_account: string;
  is_corporate_heavy: boolean;
  is_rrif_heavy: boolean;
  is_nonreg_heavy: boolean;
  is_tfsa_significant: boolean;

  recommended_strategy: string;
  strategy_rationale: string;
  strategy_details: Record<string, any>;
}

// Default values for new person
export const defaultPersonInput: PersonInput = {
  name: '',
  start_age: 65,

  cpp_start_age: 65,
  cpp_annual_at_start: 15000,
  oas_start_age: 65,
  oas_annual_at_start: 8500,

  tfsa_balance: 0,
  rrif_balance: 0,
  rrsp_balance: 0,
  nonreg_balance: 0,
  corporate_balance: 0,

  nonreg_acb: 0,
  nr_cash: 0,
  nr_gic: 0,
  nr_invest: 0,

  y_nr_cash_interest: 2.0,
  y_nr_gic_interest: 3.5,
  y_nr_inv_total_return: 6.0,
  y_nr_inv_elig_div: 2.0,
  y_nr_inv_nonelig_div: 0.5,
  y_nr_inv_capg: 3.0,
  y_nr_inv_roc_pct: 0.5,

  nr_cash_pct: 10.0,
  nr_gic_pct: 20.0,
  nr_invest_pct: 70.0,

  corp_cash_bucket: 0,
  corp_gic_bucket: 0,
  corp_invest_bucket: 0,
  corp_rdtoh: 0,

  y_corp_cash_interest: 2.0,
  y_corp_gic_interest: 3.5,
  y_corp_inv_total_return: 6.0,
  y_corp_inv_elig_div: 2.0,
  y_corp_inv_capg: 3.5,

  corp_cash_pct: 5.0,
  corp_gic_pct: 10.0,
  corp_invest_pct: 85.0,

  corp_dividend_type: 'eligible',

  tfsa_room_start: 7000,
  tfsa_room_annual_growth: 7000,
};

// Default household input
export const defaultHouseholdInput: HouseholdInput = {
  p1: { ...defaultPersonInput, name: 'Person 1' },
  p2: { ...defaultPersonInput, name: 'Person 2' },

  province: 'AB',
  start_year: 2025,
  end_age: 95,

  strategy: 'corporate-optimized',

  spending_go_go: 120000,
  go_go_end_age: 75,
  spending_slow_go: 90000,
  slow_go_end_age: 85,
  spending_no_go: 70000,

  spending_inflation: 2.0,
  general_inflation: 2.0,

  gap_tolerance: 1000,
  tfsa_contribution_each: 0,
  reinvest_nonreg_dist: true,
  income_split_rrif_fraction: 0.0,
  hybrid_rrif_topup_per_person: 0,
  stop_on_fail: true,
};
```

*(Due to length constraints, I'll create a summary document. Would you like me to continue with the full implementation details, or create a more concise version?)*

**Testing Deliverables Phase 2:**
- ✅ TypeScript types compile without errors
- ✅ All React components render without errors
- ✅ Form validation works correctly
- ✅ Data flows from forms to API correctly
- ✅ Charts display simulation results
- ✅ Responsive design works on mobile/tablet/desktop

---

## Summary of Remaining Phases

### **Phase 3: Next.js API Routes** (Week 2, Days 13-14)
- Create proxy routes in `/api/simulation/*`
- Add authentication middleware
- Handle errors and logging
- Add request caching (optional)

### **Phase 4: Integration & Testing** (Week 3, Days 15-18)
- Unit tests for API endpoints
- Integration tests for end-to-end flow
- Manual testing of UI
- Performance testing

### **Phase 5: Deployment** (Week 3, Days 19-21)
- Deploy Python API to Railway
- Update Vercel environment variables
- Production testing
- Documentation

---

## Testing Strategy

### Unit Testing

#### Python Backend Tests
```python
# tests/test_api_simulation.py
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_run_simulation_success():
    payload = {
        "p1": {...},  # Valid person data
        "p2": {...},
        "province": "AB",
        # ... complete household data
    }
    response = client.post("/api/run-simulation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert len(data["year_by_year"]) > 0

def test_run_simulation_validation_error():
    payload = {"p1": {"age": -5}}  # Invalid data
    response = client.post("/api/run-simulation", json=payload)
    assert response.status_code == 422  # Validation error
```

#### React Frontend Tests
```typescript
// __tests__/simulation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimulationPage from '@/app/(dashboard)/simulation/page';

describe('Simulation Page', () => {
  it('renders form inputs', () => {
    render(<SimulationPage />);
    expect(screen.getByLabelText(/Person 1 Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/TFSA Balance/i)).toBeInTheDocument();
  });

  it('submits simulation and displays results', async () => {
    render(<SimulationPage />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/Person 1 Name/i), {
      target: { value: 'Juan' }
    });

    // Submit
    fireEvent.click(screen.getByText(/Run Simulation/i));

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/Simulation Results/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

```bash
# Test end-to-end flow
1. Start Python API: uvicorn api.main:app --reload
2. Start Next.js: npm run dev
3. Run integration tests: npm run test:integration
```

### Manual Testing Checklist

- [ ] **Forms**
  - [ ] All inputs accept valid values
  - [ ] Validation errors display correctly
  - [ ] Form persists when switching tabs

- [ ] **Simulation**
  - [ ] Run button triggers API call
  - [ ] Loading state displays
  - [ ] Results display correctly
  - [ ] Charts render with data

- [ ] **Error Handling**
  - [ ] API errors display user-friendly message
  - [ ] Network errors handled gracefully
  - [ ] Validation errors highlighted in form

### Performance Testing

```bash
# Load testing with Artillery
artillery quick --count 10 --num 100 http://localhost:8000/api/run-simulation

# Measure response times
- Target: < 3 seconds for simulation
- Target: < 500ms for composition analysis
```

---

## Deployment Plan

### Python API Deployment (Railway)

**File: `juan-retirement-app/railway.json`**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements-api.txt"
  },
  "deploy": {
    "startCommand": "uvicorn api.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**File: `juan-retirement-app/Procfile`**
```
web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### Deployment Steps

1. **Railway Setup**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Create project
   railway init

   # Deploy
   railway up
   ```

2. **Environment Variables (Railway)**
   ```
   PORT=8000
   PYTHON_ENV=production
   ```

3. **Vercel Environment Variables**
   ```
   PYTHON_API_URL=https://retirement-api.railway.app
   NEXT_PUBLIC_ENABLE_SIMULATION=true
   ```

4. **Deploy Next.js**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Python API timeout (>30s) | Medium | High | Add request timeout, optimize simulation code |
| CORS issues in production | Low | Medium | Configure CORS with exact Vercel domain |
| Data loss during migration | Low | High | Keep existing data intact, parallel systems |
| Railway free tier limits | High | Medium | Monitor usage, upgrade if needed ($5/mo) |
| Type mismatch API↔Frontend | Medium | Medium | Thorough testing, TypeScript validation |
| Complex forms hard to use | Low | High | User testing, iterative UI improvements |

---

## Success Metrics

### Technical Metrics
- ✅ API response time < 3 seconds (95th percentile)
- ✅ Frontend load time < 2 seconds
- ✅ Zero data loss during migration
- ✅ 99.5% uptime

### User Metrics
- ✅ Users can complete simulation in < 5 minutes
- ✅ 90%+ of simulations succeed without errors
- ✅ < 5% support tickets related to simulation

### Development Metrics
- ✅ Complete in 2-3 weeks
- ✅ < 10% code duplication
- ✅ 80%+ test coverage on critical paths

---

## Next Steps After Completion

1. **Add More Features**
   - Scenario comparison (save multiple simulations)
   - PDF export of simulation results
   - Historical data tracking

2. **Performance Optimization**
   - Cache simulation results
   - Precompute common scenarios
   - Add background processing for Monte Carlo

3. **User Experience**
   - Guided wizard for first-time users
   - Tooltips and help text
   - Example scenarios to load

---

## Appendix

### File Structure Summary

```
retirement-app/
├── juan-retirement-app/                  # Python API Backend
│   ├── api/
│   │   ├── main.py                       # FastAPI app
│   │   ├── routes/                       # Endpoints
│   │   ├── models/                       # Pydantic models
│   │   └── utils/                        # Converters
│   ├── modules/                          # Existing simulation code
│   ├── utils/                            # Existing utilities
│   ├── requirements-api.txt              # Dependencies
│   ├── railway.json                      # Railway config
│   └── Procfile                          # Process file
│
└── webapp/                               # Next.js Frontend
    ├── app/
    │   ├── (dashboard)/
    │   │   └── simulation/
    │   │       ├── page.tsx              # Main page
    │   │       └── components/           # UI components
    │   └── api/
    │       └── simulation/               # API routes
    ├── lib/
    │   ├── api/                          # API client
    │   └── types/                        # TypeScript types
    └── __tests__/                        # Tests
```

### Timeline Gantt Chart

```
Week 1: Python API Backend
Day 1-2:  [████] Planning & Setup
Day 3-4:  [████] Core API Structure
Day 5-6:  [████] Endpoints & Routes
Day 7:    [████] Testing

Week 2: React Frontend
Day 8-9:  [████] Components & Forms
Day 10-11:[████] Charts & Visualization
Day 12:   [████] Integration
Day 13-14:[████] API Routes & Middleware

Week 3: Testing & Deployment
Day 15-16:[████] Testing
Day 17-18:[████] Bug Fixes
Day 19-20:[████] Deployment
Day 21:   [████] Documentation & Handoff
```

---

**Document Version**: 1.1
**Last Updated**: November 26, 2025
**Next Review**: After Phase 1 completion

---

# APPENDIX: PDF Report Gap Analysis

## Overview

This section compares all elements from the PDF report (`retirement_report_Rafael_Lucy_2025-11-22.pdf`)
with the current FastAPI response to identify gaps for frontend implementation.

---

## 1. COVER PAGE (Page 1)

| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Report Title | - | STATIC (frontend) |
| Person Names | `household_input.p1.name`, `p2.name` | AVAILABLE |
| Report Generated Date | - | COMPUTE (frontend) |
| Projection Period (years) | `summary.years_simulated` | AVAILABLE |
| Strategy | `key_assumptions.withdrawal_strategy` | AVAILABLE |
| Province | `key_assumptions.province` | AVAILABLE |
| Disclaimer | - | STATIC (frontend) |

---

## 2. RETIREMENT HEALTH METRICS (Pages 2-4)

### Plan Health Score
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Health Score (0-100) | `summary.health_score` | AVAILABLE |
| Health Rating | `summary.health_rating` | AVAILABLE |
| Health Criteria (5 items) | `summary.health_criteria` | AVAILABLE |

### Plan Sustainability Table
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Years Funded | `summary.years_funded` / `summary.years_simulated` | AVAILABLE |
| Initial Net Worth | `summary.initial_net_worth` | AVAILABLE |
| Final Net Worth | `summary.final_net_worth` | AVAILABLE |
| Net Worth Trend | `summary.net_worth_trend` | AVAILABLE |
| RRIF Status | - | COMPUTE from balances |

### Government Benefits Table
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Total CPP | `summary.total_cpp` | AVAILABLE |
| Total OAS | `summary.total_oas` | AVAILABLE |
| Total GIS | `summary.total_gis` | AVAILABLE |
| Total Government Benefits | `summary.total_government_benefits` | AVAILABLE |
| Avg Annual Benefits | `summary.avg_annual_benefits` | AVAILABLE |

---

## 3. WITHDRAWAL & SPENDING ANALYSIS (Page 3)

### Spending Metrics
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Portfolio Withdrawals | `spending_analysis.portfolio_withdrawals` | AVAILABLE |
| Government Benefits | `spending_analysis.government_benefits_total` | AVAILABLE |
| Total Spending Available | `spending_analysis.total_spending_available` | AVAILABLE |
| Spending Target | `spending_analysis.spending_target_total` | AVAILABLE |
| Spending Coverage % | `spending_analysis.spending_coverage_pct` | AVAILABLE |
| Avg Annual Spending | `spending_analysis.avg_annual_spending` | AVAILABLE |
| Plan Status Text | `spending_analysis.plan_status_text` | AVAILABLE |

### Withdrawal Breakdown by Account Source
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| RRIF Total/% | `summary.total_rrif_withdrawn`, `rrif_pct_of_total` | AVAILABLE |
| NonReg Total/% | `summary.total_nonreg_withdrawn`, `nonreg_pct_of_total` | AVAILABLE |
| TFSA Total/% | `summary.total_tfsa_withdrawn`, `tfsa_pct_of_total` | AVAILABLE |
| Corporate Total/% | `summary.total_corporate_withdrawn`, `corporate_pct_of_total` | AVAILABLE |

### Tax Efficiency & OAS Clawback
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Total Taxes | `summary.total_tax_paid` | AVAILABLE |
| OAS Clawback | `summary.total_oas_clawback` | AVAILABLE |
| Tax Efficiency % | `summary.tax_efficiency_rate` | AVAILABLE |

---

## 4. HOUSEHOLD SUMMARY (Pages 5-6)

### Person Details
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Current Age | `household_input.p1.start_age` | AVAILABLE |
| CPP Start Age | `household_input.p1.cpp_start_age` | AVAILABLE |
| OAS Start Age | `household_input.p1.oas_start_age` | AVAILABLE |

### Household Settings
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Withdrawal Strategy | `household_input.strategy` | AVAILABLE |
| Province | `household_input.province` | AVAILABLE |
| Total Household Spending | `household_input.spending_go_go` | AVAILABLE |
| Income Splitting | `household_input.income_split_rrif_fraction` | AVAILABLE |
| Reinvest NonReg | `household_input.reinvest_nonreg_dist` | AVAILABLE |

### Assets & Allocation Table
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| All account balances P1/P2 | `household_input.p1.*_balance`, `p2.*_balance` | AVAILABLE |
| Asset Allocation % | `composition_analysis.*_pct` | AVAILABLE |

---

## 5. RETIREMENT PLAN OVERVIEW (Page 7)

### Annual Spending
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Go-Go Amount | `household_input.spending_go_go` | AVAILABLE |
| Slow-Go Amount | `household_input.spending_slow_go` | AVAILABLE |
| No-Go Amount | `household_input.spending_no_go` | AVAILABLE |

### Key Assumptions
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| General Inflation Rate | `key_assumptions.general_inflation_rate` | AVAILABLE |
| Spending Inflation Rate | `key_assumptions.spending_inflation_rate` | AVAILABLE |
| CPP Indexing Rate | `key_assumptions.cpp_indexing_rate` | AVAILABLE |
| OAS Indexing Rate | `key_assumptions.oas_indexing_rate` | AVAILABLE |
| Projection Period | `key_assumptions.projection_period_years` | AVAILABLE |
| Tax Year Basis | `key_assumptions.tax_year_basis` | AVAILABLE |

---

## 6. FINANCIAL PROJECTIONS (Pages 8-9)

### Summary Metrics
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Total Cumulative Withdrawals | `summary.total_withdrawals` | AVAILABLE |
| Total Cumulative Taxes | `summary.total_tax_paid` | AVAILABLE |
| Average Annual Tax | COMPUTE: `total_tax_paid / years_simulated` | COMPUTE |
| Effective Tax Rate | `summary.avg_effective_tax_rate` | AVAILABLE |
| Final Net Worth | `summary.final_net_worth` | AVAILABLE |

### Year-by-Year Table
| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Year | `year_by_year[].year` | AVAILABLE |
| Ages | `year_by_year[].age_p1`, `age_p2` | AVAILABLE |
| Target | `year_by_year[].spending_need` | AVAILABLE |
| All withdrawals P1/P2 | `year_by_year[].*_withdrawal_p1/p2` | AVAILABLE |
| Taxes | `year_by_year[].total_tax` | AVAILABLE |
| Net Worth | `year_by_year[].total_value` | AVAILABLE |

---

## 7. 5-YEAR WITHDRAWAL PLAN (Pages 11-13)

| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Year, Ages | `five_year_plan[].year`, `age_p1`, `age_p2` | AVAILABLE |
| Spending Target P1/P2/Total | `five_year_plan[].spending_target*` | AVAILABLE |
| All withdrawals by source | `five_year_plan[].*_withdrawal_p1/p2` | AVAILABLE |
| Total Withdrawn | `five_year_plan[].total_withdrawn*` | AVAILABLE |
| Net Worth End | `five_year_plan[].net_worth_end` | AVAILABLE |

---

## 8. TAX ANALYSIS (Page 14)

| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Total Cumulative Tax | `summary.total_tax_paid` | AVAILABLE |
| Average Annual Tax | COMPUTE | COMPUTE |
| Highest Annual Tax | `summary.highest_annual_tax` | AVAILABLE |
| Lowest Annual Tax | `summary.lowest_annual_tax` | AVAILABLE |

---

## 9. ESTATE SUMMARY (Page 15)

| PDF Element | API Field | Status |
|-------------|-----------|--------|
| Gross Estate Value | `estate_summary.gross_estate_value` | AVAILABLE |
| Taxes at Death | `estate_summary.taxes_at_death` | AVAILABLE |
| After-Tax Legacy | `estate_summary.after_tax_legacy` | AVAILABLE |
| Effective Tax Rate at Death | `estate_summary.effective_tax_rate_at_death` | AVAILABLE |
| Taxable Components | `estate_summary.taxable_components[]` | AVAILABLE |
| Estate Planning Tips | `estate_summary.estate_planning_tips[]` | AVAILABLE |

---

## 10. CHARTS (Pages 17-24)

### Chart Data Available
| Chart | API Field | Status |
|-------|-----------|--------|
| Spending Coverage | `chart_data.data_points[].spending_coverage_pct` | AVAILABLE |
| Account Balances | `chart_data.data_points[].*_balance` | AVAILABLE |
| Government Benefits | `chart_data.data_points[].cpp_total`, `oas_total`, `gis_total` | AVAILABLE |
| Tax Rate | `chart_data.data_points[].effective_tax_rate` | AVAILABLE |
| Income Composition | `chart_data.data_points[].taxable_income`, `tax_free_income` | AVAILABLE |
| Withdrawals by Source | `chart_data.data_points[].*_withdrawal` | AVAILABLE |

---

## COVERAGE SUMMARY

| Category | Coverage | Notes |
|----------|----------|-------|
| Cover Page | 100% | Static text + existing fields |
| Health Metrics | 100% | All fields available |
| Spending Analysis | 100% | All fields available |
| Household Summary | 100% | All fields available |
| Plan Overview | 100% | All fields available |
| Financial Projections | 95% | Need computed avg_annual_tax |
| 5-Year Plan | 100% | All fields available |
| Tax Analysis | 95% | Need computed avg_annual_tax |
| Estate Summary | 100% | All fields available |
| Charts | 100% | All data points available |

**Overall Coverage: ~98%**

The API already provides nearly all data needed to replicate the PDF report in the React frontend.
The remaining 2% are simple computations that can be done in the frontend.
