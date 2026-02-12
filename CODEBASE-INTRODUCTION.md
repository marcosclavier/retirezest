# Canadian Retirement Planning Application - Codebase Introduction

**Version:** 2.0
**Last Updated:** February 11, 2026
**Status:** 🎉 MVP Complete (100% Priority 1 Features) + 🐳 Docker Ready + 🐍 Python API Consolidated
**Tech Stack:** Next.js 15, TypeScript, Prisma, SQLite, Tailwind CSS, jsPDF, Radix UI, Docker, Python FastAPI
**Deployment:** Fully containerized with Docker & Docker Compose

---

## Table of Contents

1. [Overview](#overview)
2. [Application Architecture](#application-architecture)
3. [Directory Structure](#directory-structure)
4. [Key Features & Functionality](#key-features--functionality)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Calculation Engines](#calculation-engines)
8. [Pages & Routes](#pages--routes)
9. [Components](#components)
10. [Authentication Flow](#authentication-flow)
11. [Common Tasks](#common-tasks)
12. [Development Workflow](#development-workflow)
13. [Docker Deployment](#docker-deployment)

---

## Overview

This is a full-stack web application designed to help Canadian seniors plan their retirement by:
- Calculating government benefits (CPP, OAS, GIS)
- Projecting retirement income and expenses
- Tracking financial assets and liabilities
- Comparing different retirement scenarios
- Generating PDF reports

**Target Users:** Canadian residents planning for retirement (age 50-70)
**Deployment:** Docker containerized (local/production), or Vercel/AWS

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Dashboard  │  │  Calculator  │  │  Simulation  │  │   Profile  │  │
│  │    Pages     │  │    Pages     │  │    Pages     │  │    Pages   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│         │                  │                  │               │          │
│         └──────────────────┴──────────────────┴───────────────┘          │
│                                    │                                      │
│                    ┌───────────────▼───────────────┐                     │
│                    │      Next.js API Routes       │                     │
│                    │  (Auth, Profile, Simulation)  │                     │
│                    └───────────────┬───────────────┘                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   TypeScript Calc   │  │   Python FastAPI    │  │    Prisma ORM       │
│   (CPP/OAS/GIS/Tax) │  │   (Simulation API)  │  │                     │
│   lib/calculations/ │  │   python-api/       │  │                     │
└─────────────────────┘  └──────────┬──────────┘  └──────────┬──────────┘
                                    │                        │
                                    │                        ▼
                         ┌──────────▼──────────┐  ┌─────────────────────┐
                         │  Python Modules     │  │   SQLite Database   │
                         │  - simulation.py    │  │   (User data)       │
                         │  - tax_engine.py    │  └─────────────────────┘
                         │  - benefits.py      │
                         │  - withdrawal.py    │
                         └─────────────────────┘
```

**Dual Calculation Architecture:**

The application uses **two calculation engines** that work together:

1. **TypeScript Calculations** (`lib/calculations/`): Simple benefit calculators for the UI
   - CPP/OAS/GIS estimators for the benefits pages
   - Basic tax calculations for profile pages
   - Lightweight projections for quick feedback

2. **Python FastAPI Backend** (`python-api/`): Advanced simulation engine
   - Full retirement simulation with 18+ modules
   - Tax-optimized withdrawal strategies
   - Monte Carlo analysis
   - Strategy optimization
   - Called via Next.js API routes that proxy to `http://localhost:8000`

**Technology Choices:**
- **Next.js 15**: App Router, Server & Client Components, API Routes
- **TypeScript**: Full type safety across frontend and API gateway
- **Python FastAPI**: High-performance simulation engine
- **Prisma**: Type-safe database ORM with migrations
- **SQLite**: Local database (easy to migrate to PostgreSQL)
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization library
- **jsPDF + html2canvas**: PDF report generation

---

## Directory Structure

```
retirement-app/
├── webapp/                          # Unified monorepo (Next.js + Python)
│   │
│   ├── python-api/                  # Python FastAPI Backend (simulation engine)
│   │   ├── api/                     # FastAPI application
│   │   │   ├── main.py              # FastAPI app entry point, CORS, health
│   │   │   ├── models/              # Pydantic request/response models
│   │   │   │   ├── requests.py      # Input validation schemas
│   │   │   │   └── responses.py     # Output schemas
│   │   │   ├── routes/              # API endpoints
│   │   │   │   ├── simulation.py    # POST /api/run-simulation
│   │   │   │   ├── monte_carlo.py   # Monte Carlo endpoints
│   │   │   │   └── optimization.py  # Strategy optimization
│   │   │   └── utils/
│   │   │       └── converters.py    # API ↔ internal model converters
│   │   │
│   │   ├── modules/                 # Core calculation engine (18 modules)
│   │   │   ├── simulation.py        # Main simulation engine (158KB)
│   │   │   ├── tax_engine.py        # Canadian tax calculations
│   │   │   ├── benefits.py          # CPP/OAS/GIS calculations
│   │   │   ├── withdrawal_strategies.py # RRIF/TFSA/NonReg strategies
│   │   │   ├── asset_aware_withdrawal.py
│   │   │   ├── strategy_optimizer.py
│   │   │   ├── tax_optimizer.py
│   │   │   ├── estate_tax_calculator.py
│   │   │   ├── real_estate.py
│   │   │   ├── gic_calculator.py
│   │   │   ├── spending.py
│   │   │   ├── plan_reliability_analyzer.py
│   │   │   ├── scenario_comparison.py
│   │   │   ├── metrics_tracker.py
│   │   │   ├── strategy_insights.py
│   │   │   ├── models.py            # Core data models
│   │   │   ├── config.py            # Configuration loader
│   │   │   ├── database.py          # Database setup
│   │   │   └── db_service.py        # Database service
│   │   │
│   │   └── utils/                   # Python utilities
│   │       ├── helpers.py
│   │       ├── asset_analyzer.py
│   │       ├── tax_efficiency.py
│   │       ├── strategy_recommender.py
│   │       └── file_io.py
│   │
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Auth route group (no layout)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (dashboard)/             # Dashboard route group (with layout)
│   │   │   ├── dashboard/page.tsx   # Main dashboard
│   │   │   ├── simulation/page.tsx  # Run simulations
│   │   │   ├── scenarios/page.tsx   # Scenario comparison
│   │   │   ├── profile/             # Profile management
│   │   │   │   ├── assets/page.tsx
│   │   │   │   ├── income/page.tsx
│   │   │   │   ├── expenses/page.tsx
│   │   │   │   ├── debts/page.tsx
│   │   │   │   └── real-estate/page.tsx
│   │   │   ├── benefits/            # Benefits calculators
│   │   │   │   ├── cpp/page.tsx
│   │   │   │   ├── oas/page.tsx
│   │   │   │   └── gis/page.tsx
│   │   │   ├── early-retirement/page.tsx
│   │   │   ├── onboarding/wizard/   # Onboarding flow
│   │   │   └── layout.tsx           # Dashboard layout
│   │   │
│   │   ├── api/                     # Next.js API Routes (gateway to Python)
│   │   │   ├── auth/                # Authentication endpoints
│   │   │   ├── profile/             # Profile CRUD
│   │   │   ├── simulation/          # Proxies to Python API
│   │   │   │   ├── run/route.ts     # → /api/run-simulation
│   │   │   │   └── analyze/route.ts # → /api/analyze-composition
│   │   │   ├── scenarios/           # Scenario management
│   │   │   ├── health/              # Health checks (DB + Python API)
│   │   │   └── subscription/        # Stripe integration
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   │
│   ├── components/                  # React Components
│   │   ├── simulation/              # Simulation UI components
│   │   │   ├── HouseholdForm.tsx
│   │   │   ├── ResultsDashboard.tsx
│   │   │   └── charts/              # Visualization components
│   │   ├── reports/
│   │   │   └── RetirementReport.tsx # PDF report template
│   │   └── ui/                      # Radix UI components
│   │
│   ├── lib/                         # TypeScript Utilities
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── prisma.ts                # Prisma instance
│   │   ├── api/
│   │   │   └── simulation-client.ts # Python API client
│   │   ├── calculations/            # TypeScript calculators (UI helpers)
│   │   │   ├── cpp.ts
│   │   │   ├── oas.ts
│   │   │   ├── gis.ts
│   │   │   └── tax.ts
│   │   └── types/
│   │       └── simulation.ts        # Simulation type definitions
│   │
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── migrations/              # Database migrations
│   │
│   ├── e2e/                         # Playwright E2E tests
│   │
│   ├── requirements-api.txt         # Python dependencies (API only)
│   ├── requirements.txt             # Python dependencies (full)
│   ├── tax_config_canada_2025.json  # Canadian tax configuration
│   ├── Procfile                     # Process management
│   ├── render.yaml                  # Render deployment
│   ├── package.json                 # Node.js dependencies
│   └── consolidation.md             # Consolidation documentation
│
├── docker-compose.yml               # Docker orchestration
├── Dockerfile.backup                # Docker configuration
├── CODEBASE-INTRODUCTION.md         # This file
└── README.md                        # Project overview
```

---

## Key Features & Functionality

### 1. **Authentication System**
- **Location:** `app/(auth)/`, `app/api/auth/`, `lib/auth.ts`
- **Features:**
  - User registration with email + password
  - Login with JWT token (httpOnly cookies)
  - Password hashing with bcryptjs (10 rounds)
  - Protected routes with middleware
  - Session validation on every request
- **Security:** JWT secrets, httpOnly cookies, password validation

### 2. **Financial Profile Management**
- **Location:** `app/(dashboard)/profile/`
- **Modules:**
  - **Income** (`income/page.tsx`): Track employment, pension, investment, rental income
  - **Assets** (`assets/page.tsx`): Manage RRSP, TFSA, Non-Registered, Real Estate
  - **Expenses** (`expenses/page.tsx`): Categorize monthly/annual expenses
  - **Debts** (`debts/page.tsx`): Track mortgages, loans, credit cards
- **Features:** Full CRUD operations, real-time totals, categorization

### 3. **Government Benefits Calculators**
- **Location:** `app/(dashboard)/benefits/`, `lib/calculations/`
- **CPP Calculator** (`cpp.ts`, 233 lines):
  - Age adjustment factors (60-70)
  - Dropout provisions (17% lowest years)
  - Break-even analysis
  - Optimal start age finder
  - 2025 maximum: $1,433/month
- **OAS Calculator** (`oas.ts`, 268 lines):
  - Residency-based calculation (40 years = full)
  - Income clawback (15% over $90,997)
  - Age 75+ enhancement
  - Deferral benefits (7.2%/year)
  - 2025 maximum: $713.34/month (age 65-74), $784.67/month (75+)
- **GIS Calculator** (`gis.ts`, 320 lines):
  - Income-tested benefits
  - Single vs married calculations
  - Income exemptions ($5,000 CPP, full OAS)
  - 2025 maximum: $1,065.47/month (single), $641.35/month (married)

### 4. **Tax Calculator**
- **Location:** `lib/calculations/tax.ts` (372 lines)
- **Features:**
  - Federal tax brackets (2025 rates, 5 brackets up to 33%)
  - Provincial tax (Ontario only - 5 brackets up to 13.16%)
  - Tax credits: Basic Personal ($15,705), Age ($8,790), Pension ($2,000)
  - Marginal and average tax rate calculations
  - RRSP withholding tax (10-30%)
  - Capital gains tax (50% inclusion rate)

### 5. **Retirement Projection Engine**
- **Location:** `lib/calculations/projection.ts` (396 lines)
- **Algorithm:**
  - Year-by-year iteration from current age to life expectancy
  - Income sources: Employment, Pension, CPP, OAS, GIS, Investments
  - RRSP → RRIF conversion at age 71
  - RRIF minimum withdrawals (age-based table)
  - Tax-efficient withdrawal strategy:
    1. TFSA first (tax-free)
    2. Non-Registered second (capital gains)
    3. RRSP/RRIF third (fully taxable)
  - Inflation adjustments (compounding)
  - Investment returns (compounding)
  - Asset depletion detection
- **Output:** 26 data points per year × (life expectancy - current age) years

### 6. **Scenario Comparison**
- **Location:** `app/(dashboard)/scenarios/page.tsx`
- **Features:**
  - Create multiple scenarios with different assumptions
  - Save to database with full projection results
  - Select up to 3 scenarios for side-by-side comparison
  - Comparison charts (asset balance, income)
  - Summary comparison table

### 7. **Data Visualization**
- **Library:** Recharts
- **Chart Types:**
  - Line Charts: Income vs Expenses over time
  - Area Charts: Asset balance (stacked), Tax burden
  - Bar Charts: Income sources, Cash flow
- **Features:** Responsive, tooltips, legends, formatted axes

### 8. **PDF Report Generation** ✨ NEW
- **Location:** `lib/reports/generatePDF.ts`, `components/reports/RetirementReport.tsx`
- **Sections:**
  - Executive Summary
  - Key Findings
  - Current Financial Position
  - Retirement Milestones
  - Year-by-Year Summary
  - Disclaimers
- **Technology:** jsPDF + html2canvas
- **Format:** A4, multi-page, professional layout

---

## Database Schema

**Database:** SQLite (`prisma/dev.db`)
**ORM:** Prisma

### Models

#### 1. **User**
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  dateOfBirth   DateTime?
  province      String?   // ON, BC, AB, etc.
  maritalStatus String?   // single, married, divorced, widowed, common_law
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  incomeSources Income[]
  assets        Asset[]
  expenses      Expense[]
  debts         Debt[]
  scenarios     Scenario[]
  projections   Projection[]
}
```

#### 2. **Income**
```prisma
model Income {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        String   // employment, pension, investment, rental, other
  description String?
  amount      Float
  frequency   String   // monthly, annual
  isTaxable   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 3. **Asset**
```prisma
model Asset {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String   // rrsp, tfsa, non_registered, real_estate
  description     String?
  currentValue    Float
  contributionRoom Float?  // For RRSP/TFSA
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### 4. **Expense**
```prisma
model Expense {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    String   // housing, food, transportation, healthcare, utilities, etc.
  description String?
  amount      Float
  frequency   String   // monthly, annual
  isEssential Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 5. **Debt**
```prisma
model Debt {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String   // mortgage, loan, credit_card
  description     String?
  currentBalance  Float
  interestRate    Float
  monthlyPayment  Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### 6. **Scenario**
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
  realEstateValue         Float    @default(0)

  // Income
  employmentIncome        Float    @default(0)
  pensionIncome           Float    @default(0)
  rentalIncome            Float    @default(0)
  otherIncome             Float    @default(0)

  // CPP/OAS
  cppStartAge             Int      @default(65)
  oasStartAge             Int      @default(65)
  averageCareerIncome     Float    @default(0)
  yearsOfCPPContributions Int      @default(40)
  yearsInCanada           Int      @default(40)

  // Expenses
  annualExpenses          Float
  expenseInflationRate    Float    @default(2.0)

  // Investment assumptions
  investmentReturnRate    Float    @default(5.0)
  inflationRate           Float    @default(2.0)

  // RRIF
  rrspToRrifAge           Int      @default(71)

  // Cached results
  projectionResults       String?  // JSON

  isBaseline              Boolean  @default(false)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  projections             Projection[]
}
```

#### 7. **Projection**
```prisma
model Projection {
  id                    String   @id @default(uuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scenarioId            String
  scenario              Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  retirementAge         Int
  calculationDate       DateTime @default(now())
  results               String   // JSON string
  successProbability    Float?
  totalLifetimeIncome   Float?
  estateValue           Float?
  createdAt             DateTime @default(now())
}
```

### Database Relationships

```
User (1) ──→ (*) Income
User (1) ──→ (*) Asset
User (1) ──→ (*) Expense
User (1) ──→ (*) Debt
User (1) ──→ (*) Scenario
User (1) ──→ (*) Projection
Scenario (1) ──→ (*) Projection
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Profile
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/profile` | Get user profile | Yes |
| PUT | `/api/profile` | Update user profile | Yes |
| GET | `/api/profile/income` | Get income sources | Yes |
| POST | `/api/profile/income` | Add income source | Yes |
| PUT | `/api/profile/income/[id]` | Update income | Yes |
| DELETE | `/api/profile/income/[id]` | Delete income | Yes |
| GET | `/api/profile/assets` | Get assets | Yes |
| POST | `/api/profile/assets` | Add asset | Yes |
| PUT | `/api/profile/assets/[id]` | Update asset | Yes |
| DELETE | `/api/profile/assets/[id]` | Delete asset | Yes |
| GET | `/api/profile/expenses` | Get expenses | Yes |
| POST | `/api/profile/expenses` | Add expense | Yes |
| PUT | `/api/profile/expenses/[id]` | Update expense | Yes |
| DELETE | `/api/profile/expenses/[id]` | Delete expense | Yes |
| GET | `/api/profile/debts` | Get debts | Yes |
| POST | `/api/profile/debts` | Add debt | Yes |
| PUT | `/api/profile/debts/[id]` | Update debt | Yes |
| DELETE | `/api/profile/debts/[id]` | Delete debt | Yes |

### Scenarios
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/scenarios` | List all scenarios | Yes |
| POST | `/api/scenarios` | Create scenario | Yes |
| GET | `/api/scenarios/[id]` | Get scenario | Yes |
| PUT | `/api/scenarios/[id]` | Update scenario | Yes |
| DELETE | `/api/scenarios/[id]` | Delete scenario | Yes |

### API Request/Response Examples

**POST /api/auth/login**
```typescript
// Request
{
  "email": "user@example.com",
  "password": "securepassword123"
}

// Response (200 OK)
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John"
  },
  "message": "Login successful"
}
```

**POST /api/profile/income**
```typescript
// Request
{
  "type": "employment",
  "description": "Software Engineer Salary",
  "amount": 85000,
  "frequency": "annual",
  "isTaxable": true
}

// Response (201 Created)
{
  "id": "uuid",
  "userId": "uuid",
  "type": "employment",
  "description": "Software Engineer Salary",
  "amount": 85000,
  "frequency": "annual",
  "isTaxable": true,
  "createdAt": "2025-11-15T00:00:00.000Z",
  "updatedAt": "2025-11-15T00:00:00.000Z"
}
```

---

## Calculation Engines

### 1. CPP Calculator (`lib/calculations/cpp.ts`)

**Key Functions:**
```typescript
// Estimate CPP from average income and years
estimateCPPSimple(
  averageCareerIncome: number,
  yearsOfContributions: number,
  startAge: number
): CPPEstimate

// Calculate CPP from full earnings history
calculateCPP(
  earnings: { year: number; amount: number }[],
  startAge: number
): CPPCalculation

// Find optimal CPP start age
findOptimalCPPAge(
  earnings: { year: number; amount: number }[],
  lifeExpectancy: number
): OptimalCPPResult
```

**Constants:**
```typescript
MAX_CPP_2025 = 1433.00 // Monthly maximum
YMPE_2025 = 68500      // Year's Maximum Pensionable Earnings
```

**Age Adjustment Factors:**
```typescript
age60: 0.64  (-36%)
age62: 0.748 (-25.2%)
age65: 1.0   (100% - baseline)
age67: 1.168 (+16.8%)
age70: 1.42  (+42%)
```

### 2. OAS Calculator (`lib/calculations/oas.ts`)

**Key Functions:**
```typescript
calculateNetOAS(
  yearsInCanada: number,
  annualIncome: number,
  age: number
): OASEstimate

calculateOASClawback(
  annualIncome: number,
  age: number
): ClawbackCalculation
```

**Constants:**
```typescript
MAX_OAS_2025 = 713.34       // Age 65-74
MAX_OAS_75_PLUS = 784.67    // Age 75+
CLAWBACK_THRESHOLD = 90997  // Income threshold
CLAWBACK_RATE = 0.15        // 15%
REQUIRED_YEARS = 40         // Full OAS
```

### 3. GIS Calculator (`lib/calculations/gis.ts`)

**Key Functions:**
```typescript
calculateGIS(
  annualIncome: number,
  maritalStatus: 'single' | 'married',
  hasSpouseReceivingOAS: boolean
): GISEstimate
```

**Constants:**
```typescript
MAX_GIS_SINGLE = 1065.47
MAX_GIS_MARRIED = 641.35
CPP_EXEMPT_AMOUNT = 5000   // First $5k of CPP exempt
OAS_EXEMPT = true          // OAS not counted in GIS income test
```

### 4. Tax Calculator (`lib/calculations/tax.ts`)

**Key Functions:**
```typescript
calculateFederalTax(income: number, age: number, hasPension: boolean): number
calculateOntarioTax(income: number, age: number, hasPension: boolean): number
calculateTotalTax(income: number, province: string, age: number, hasPension: boolean): TaxCalculation
calculateMarginalRate(income: number, province: string): number
```

**Federal Tax Brackets (2025):**
```typescript
$0 - $55,867:     15%
$55,868 - $111,733:   20.5%
$111,734 - $173,205:  26%
$173,206 - $246,752:  29%
$246,753+:        33%
```

**Ontario Tax Brackets (2025):**
```typescript
$0 - $51,446:     5.05%
$51,447 - $102,894:   9.15%
$102,895 - $150,000:  11.16%
$150,001 - $220,000:  12.16%
$220,001+:        13.16%
```

### 5. Projection Engine (`lib/calculations/projection.ts`)

**Main Function:**
```typescript
projectRetirement(input: ProjectionInput): ProjectionSummary

interface ProjectionInput {
  // Personal (3 fields)
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  province: string;

  // Assets (4 fields)
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
  realEstateValue: number;

  // Income (4 fields)
  employmentIncome: number;
  pensionIncome: number;
  rentalIncome: number;
  otherIncome: number;

  // CPP/OAS (5 fields)
  cppStartAge: number;
  oasStartAge: number;
  averageCareerIncome: number;
  yearsOfCPPContributions: number;
  yearsInCanada: number;

  // Expenses (2 fields)
  annualExpenses: number;
  expenseInflationRate: number;

  // Assumptions (3 fields)
  investmentReturnRate: number;
  inflationRate: number;
  rrspToRrifAge: number;
}

interface YearProjection {
  year: number;
  age: number;

  // Income (9 fields)
  employmentIncome: number;
  pensionIncome: number;
  cppIncome: number;
  oasIncome: number;
  gisIncome: number;
  investmentIncome: number;
  rentalIncome: number;
  otherIncome: number;

  // Withdrawals (4 fields)
  rrspWithdrawal: number;
  tfsaWithdrawal: number;
  nonRegWithdrawal: number;
  rrifMinWithdrawal: number;

  // Totals (2 fields)
  totalGrossIncome: number;
  taxableIncome: number;

  // Tax (4 fields)
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  averageTaxRate: number;

  // Cash Flow (3 fields)
  totalAfterTaxIncome: number;
  annualExpenses: number;
  cashSurplusDeficit: number;

  // Assets (4 fields)
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
  totalAssets: number;

  // Flags (3 fields)
  isRetired: boolean;
  isRrifAge: boolean;
  assetsDepletedAge: number | null;
}
```

**RRIF Minimum Withdrawal Table:**
```typescript
Age 71: 5.28%
Age 75: 5.82%
Age 80: 6.82%
Age 85: 8.51%
Age 90: 11.92%
Age 95+: 20.00%
```

**Withdrawal Strategy:**
1. Calculate income shortfall (expenses - government benefits - pensions)
2. Withdraw from TFSA first (tax-free)
3. If needed, withdraw from Non-Registered (50% capital gains)
4. If needed, withdraw from RRSP/RRIF (100% taxable)
5. Apply RRIF minimum if age >= 71 (override strategy if needed)

---

## Python FastAPI Backend

The Python backend provides the advanced simulation engine that powers the main retirement projections.

### Location
```
webapp/python-api/
├── api/                    # FastAPI application
│   ├── main.py             # Entry point, CORS, health endpoint
│   ├── models/             # Pydantic schemas
│   └── routes/             # API endpoints
├── modules/                # Core simulation engine (18 modules)
└── utils/                  # Helper utilities
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/run-simulation` | Run full retirement simulation |
| POST | `/api/analyze-composition` | Analyze asset composition |
| GET | `/api/health` | Health check |

### How Next.js Connects to Python

The Next.js API routes act as a **gateway** to the Python backend:

```
Browser → Next.js API Route → Python FastAPI → Response
         /api/simulation/run → http://localhost:8000/api/run-simulation
```

**Key file:** `lib/api/simulation-client.ts`
```typescript
// Calls Next.js route which proxies to Python
const response = await fetch('/api/simulation/run', {
  method: 'POST',
  body: JSON.stringify(householdInput),
});
```

**Environment Variable:**
```bash
PYTHON_API_URL=http://localhost:8000  # Default
```

### Python Modules Overview

| Module | Purpose |
|--------|---------|
| `simulation.py` | Main simulation engine (158KB, ~4000 lines) |
| `tax_engine.py` | Canadian federal + provincial tax calculations |
| `benefits.py` | CPP, OAS, GIS government benefit calculations |
| `withdrawal_strategies.py` | RRIF-first, TFSA-first, balanced strategies |
| `tax_optimizer.py` | Tax-efficient withdrawal optimization |
| `estate_tax_calculator.py` | Estate and deemed disposition calculations |
| `real_estate.py` | Real estate valuation and analysis |
| `gic_calculator.py` | GIC ladder calculations |
| `config.py` | Loads tax_config_canada_2025.json |

### Tax Configuration

The file `tax_config_canada_2025.json` contains all Canadian tax parameters:
- Federal tax brackets and rates
- Provincial tax brackets (AB, BC, ON, QC)
- Tax credits (BPA, Age Amount, Pension Credit)
- OAS clawback thresholds
- GIS parameters
- Capital gains inclusion rates
- Dividend gross-up and credit rates

### Running the Python API

```bash
# From webapp directory
cd python-api
python -m uvicorn api.main:app --port 8000 --reload

# Or using the Procfile command
cd python-api && python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### Health Check Integration

The Next.js health endpoint (`/api/health`) checks both:
1. **Database** - Prisma connection to SQLite
2. **Python API** - Connection to FastAPI backend

```typescript
// webapp/app/api/health/route.ts
const response = await fetch(`${PYTHON_API_URL}/api/health`);
// Returns: { status: 'healthy' | 'degraded' | 'unhealthy' }
```

---

## Pages & Routes

### Public Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/(auth)/login/page.tsx` | Login form |
| `/register` | `app/(auth)/register/page.tsx` | Registration form |

### Protected Routes (Require Authentication)

| Route | File | Component Type | Description |
|-------|------|----------------|-------------|
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Client | Main dashboard with metrics |
| `/profile` | `app/(dashboard)/profile/page.tsx` | Client | View/edit profile |
| `/profile/income` | `app/(dashboard)/profile/income/page.tsx` | Client | Manage income sources |
| `/profile/assets` | `app/(dashboard)/profile/assets/page.tsx` | Client | Manage assets |
| `/profile/expenses` | `app/(dashboard)/profile/expenses/page.tsx` | Client | Track expenses |
| `/profile/debts` | `app/(dashboard)/profile/debts/page.tsx` | Client | Track debts |
| `/benefits` | `app/(dashboard)/benefits/page.tsx` | Client | Benefits overview |
| `/benefits/cpp` | `app/(dashboard)/benefits/cpp/page.tsx` | Client | CPP calculator |
| `/benefits/oas` | `app/(dashboard)/benefits/oas/page.tsx` | Client | OAS calculator |
| `/benefits/gis` | `app/(dashboard)/benefits/gis/page.tsx` | Client | GIS calculator |
| `/projection` | `app/(dashboard)/projection/page.tsx` | Client | Retirement projection |
| `/scenarios` | `app/(dashboard)/scenarios/page.tsx` | Client | Scenario comparison |

### Page Characteristics

**All dashboard pages are Client Components** (`'use client'`) because they:
- Use React hooks (useState, useEffect)
- Handle user interactions
- Make API calls
- Manage form state
- Render charts (Recharts requires client-side)

**Layout Structure:**
```
Root Layout (app/layout.tsx)
  └── Auth Layout (app/(auth) - no sidebar)
      └── Login/Register Pages

  └── Dashboard Layout (app/(dashboard)/layout.tsx - with sidebar)
      └── All dashboard pages
```

---

## Components

### Layout Components (`components/layout/`)

**`header.tsx`**
- Top navigation bar
- User menu with logout
- Responsive hamburger menu for mobile

**`sidebar.tsx`**
- Vertical navigation menu
- Sections: Dashboard, Profile, Benefits, Planning
- Active route highlighting
- Collapsible on mobile

**`footer.tsx`**
- Copyright information
- Links (currently minimal)

### Report Components (`components/reports/`)

**`RetirementReport.tsx`**
- PDF-ready report template
- Sections: Executive Summary, Key Findings, Financial Position, Milestones, Year-by-Year, Disclaimers
- Hidden by default (only rendered for PDF generation)
- Props: `userName`, `projection`, `inputs`

### UI Components (`components/ui/`)

Installed via shadcn/ui (not all used yet):
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `form.tsx`
- `label.tsx`
- `select.tsx`
- `table.tsx`
- `tabs.tsx`
- `dialog.tsx`

**Usage Pattern:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">Click Me</Button>
```

---

## Authentication Flow

### Registration Flow

1. User fills registration form (`/register`)
2. Frontend validates email format and password strength
3. POST to `/api/auth/register`
4. Backend hashes password with bcryptjs (10 rounds)
5. Creates user in database
6. Returns success (no auto-login)
7. User redirected to `/login`

### Login Flow

1. User enters email + password (`/login`)
2. POST to `/api/auth/login`
3. Backend verifies password hash
4. Generates JWT token with user ID and email
5. Sets httpOnly cookie with token
6. Returns user data
7. Frontend redirects to `/dashboard`

### Session Validation

Every protected page/API route:
```typescript
import { verifyAuth } from '@/lib/auth';

const userId = await verifyAuth(request);
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**`verifyAuth()` function:**
- Reads JWT from httpOnly cookie
- Verifies signature with secret
- Checks expiration
- Returns userId or null

### Logout Flow

1. User clicks logout
2. POST to `/api/auth/logout`
3. Backend clears cookie
4. Frontend redirects to `/login`

---

## Common Tasks

### 1. Add a New Page

```bash
# Create the page file
touch app/(dashboard)/new-feature/page.tsx
```

```tsx
// app/(dashboard)/new-feature/page.tsx
'use client';

import { useState } from 'react';

export default function NewFeaturePage() {
  const [data, setData] = useState(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">New Feature</h1>
      {/* Your content here */}
    </div>
  );
}
```

**Add to sidebar:**
```tsx
// components/layout/sidebar.tsx
{
  name: 'New Feature',
  href: '/new-feature',
  icon: /* SVG icon */
}
```

### 2. Add a New API Endpoint

```bash
# Create the route file
mkdir -p app/api/new-endpoint
touch app/api/new-endpoint/route.ts
```

```typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your logic here
  const data = await prisma.yourModel.findMany({ where: { userId } });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validation
  if (!body.requiredField) {
    return NextResponse.json({ error: 'Missing required field' }, { status: 400 });
  }

  // Create record
  const record = await prisma.yourModel.create({
    data: {
      userId,
      ...body
    }
  });

  return NextResponse.json(record, { status: 201 });
}
```

### 3. Add a New Database Model

```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fieldName String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Add to User model
model User {
  // ... existing fields
  newModels NewModel[]
}
```

```bash
# Generate migration
npx prisma migrate dev --name add_new_model

# Regenerate Prisma client
npx prisma generate
```

### 4. Add a New Calculation Function

```typescript
// lib/calculations/new-calculation.ts

export interface NewCalculationInput {
  param1: number;
  param2: number;
}

export interface NewCalculationResult {
  result: number;
  breakdown: {
    step1: number;
    step2: number;
  };
}

/**
 * Calculate something useful
 * @param input - Calculation parameters
 * @returns Calculation results
 */
export function calculateNewThing(input: NewCalculationInput): NewCalculationResult {
  const step1 = input.param1 * 1.5;
  const step2 = input.param2 + 1000;
  const result = step1 + step2;

  return {
    result,
    breakdown: {
      step1,
      step2
    }
  };
}
```

### 5. Add a Chart to a Page

```tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Prepare data
const chartData = projection.projections.map(p => ({
  age: p.age,
  income: p.totalGrossIncome,
  expenses: p.annualExpenses
}));

// Render chart
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="age"
      label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
    />
    <YAxis
      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
    />
    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
    <Legend />
    <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
    <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
  </LineChart>
</ResponsiveContainer>
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
cd C:/Projects/retirement-app/webapp

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements-api.txt

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-secret-key"
# PYTHON_API_URL="http://localhost:8000"

# Initialize database
npx prisma generate
npx prisma migrate dev

# Start both servers (see Daily Development below)
```

### Daily Development

**Option 1: Two Terminals (Recommended)**
```bash
# Terminal 1: Next.js frontend (localhost:3002)
cd webapp
npm run dev

# Terminal 2: Python API (localhost:8000)
cd webapp/python-api
python -m uvicorn api.main:app --port 8000 --reload
```

**Option 2: Using npm scripts (if configured)**
```bash
# Add to package.json scripts:
# "dev:api": "cd python-api && uvicorn api.main:app --port 8000 --reload"
# "dev:all": "concurrently \"npm run dev\" \"npm run dev:api\""

npm run dev:all
```

**Verify both are running:**
```bash
# Check Next.js
curl http://localhost:3002/api/health

# Check Python API
curl http://localhost:8000/api/health
```

### Database Operations

```bash
# Create a new migration
npx prisma migrate dev --name description_of_change

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in GUI
npx prisma studio
# Opens at http://localhost:5555
```

### Code Quality

```bash
# Type checking
npm run build

# Linting
npm run lint

# Format code (if Prettier is set up)
npm run format
```

### Debugging Tips

**1. Check console logs:**
- Frontend: Browser DevTools Console
- Backend: Terminal running `npm run dev`

**2. Inspect API calls:**
- Browser DevTools > Network tab
- Look for failed requests (red)
- Check request payload and response

**3. Database issues:**
```bash
# View current schema
npx prisma db push --preview-feature

# Check migrations
ls prisma/migrations
```

**4. Authentication issues:**
- Check if JWT_SECRET is set in `.env.local`
- Clear cookies in browser
- Check token expiration in `lib/auth.ts`

**5. Build errors:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Code Conventions

### File Naming
- **Pages:** `page.tsx` (Next.js convention)
- **API Routes:** `route.ts` (Next.js convention)
- **Components:** PascalCase (`RetirementReport.tsx`)
- **Utilities:** camelCase (`generatePDF.ts`)

### Component Structure
```tsx
'use client'; // If using React hooks

import { useState } from 'react';
import { ExternalComponent } from 'library';

interface Props {
  userName: string;
  age: number;
}

export default function MyComponent({ userName, age }: Props) {
  const [state, setState] = useState(0);

  const handleAction = () => {
    // Handler logic
  };

  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
}
```

### API Route Structure
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch data
    const data = await prisma.model.findMany({ where: { userId } });

    // 3. Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Styling Conventions
- Use Tailwind utility classes
- Common patterns:
  - `space-y-6` for vertical spacing
  - `bg-white shadow rounded-lg p-6` for cards
  - `text-3xl font-bold text-gray-900` for headings
  - `px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700` for buttons

---

## Testing

### Current State
- **Unit Tests:** Not implemented yet
- **Integration Tests:** Not implemented yet
- **Manual Testing:** Primary method

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout works
- [ ] Protected routes redirect to login

**Financial Profile:**
- [ ] Add income/asset/expense/debt
- [ ] Edit records
- [ ] Delete records
- [ ] Totals calculate correctly

**Calculators:**
- [ ] CPP amounts match government calculator (±5%)
- [ ] OAS clawback applies correctly
- [ ] GIS calculations accurate

**Projection:**
- [ ] Projection generates year-by-year data
- [ ] Charts display correctly
- [ ] PDF downloads successfully

**Scenarios:**
- [ ] Scenarios save to database
- [ ] Comparison charts work
- [ ] Delete works

---

## Performance Optimization

### Current Optimizations
- Client-side rendering for interactive pages
- Server-side data fetching where possible
- SQLite for fast local queries
- Prisma query optimization (select specific fields)

### Future Optimizations
- Add React Query for caching
- Implement pagination for large datasets
- Lazy load charts
- Add service worker for offline support
- Migrate to PostgreSQL for production

---

## Security Considerations

### Current Security Measures
✅ Password hashing (bcryptjs, 10 rounds)
✅ JWT with httpOnly cookies
✅ CORS protection
✅ SQL injection protection (Prisma ORM)
✅ Input validation on API routes

### Security Gaps (To Address Before Production)
❌ Rate limiting on login attempts
❌ CSRF protection
❌ Content Security Policy
❌ Input sanitization
❌ MFA/2FA
❌ Session timeout
❌ Password strength requirements
❌ Email verification
❌ Brute force protection

---

## Docker Deployment

The application is fully containerized using Docker for easy deployment and consistent environments across development and production.

### Docker Files

**Key Files:**
- `Dockerfile` - Multi-stage build configuration (optimized for production)
- `docker-compose.yml` - Service orchestration configuration
- `.dockerignore` - Excludes unnecessary files from build
- `docker-entrypoint.sh` - Database initialization script
- `README-DOCKER.md` - Complete Docker usage guide

### Quick Start with Docker

**Prerequisites:** Docker Desktop installed and running

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

**Access the app:** http://localhost:3100

### Docker Architecture

```
┌─────────────────────────────────────────────┐
│         Docker Container                     │
│  ┌────────────────────────────────────────┐ │
│  │   Next.js App (Port 3000 internal)     │ │
│  │   ├── API Routes                       │ │
│  │   ├── Pages                            │ │
│  │   └── Calculation Engines              │ │
│  └────────────────┬───────────────────────┘ │
│                   │                          │
│  ┌────────────────▼───────────────────────┐ │
│  │   Prisma ORM                           │ │
│  └────────────────┬───────────────────────┘ │
│                   │                          │
│  ┌────────────────▼───────────────────────┐ │
│  │   SQLite Database (Volume Mounted)     │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
         │
         │ Port Mapping
         ▼
   Host Port 3100
```

### Docker Features

**Build Optimization:**
- Multi-stage build reduces final image size
- Standalone Next.js output (~200MB smaller)
- Cached dependency layers for faster rebuilds

**Data Persistence:**
- SQLite database stored in named Docker volume
- Data persists across container restarts
- Easy backup and restore

**Auto-Initialization:**
- Database automatically created on first run
- Prisma migrations run automatically
- No manual setup required

**Security:**
- Non-root user (nextjs:nodejs)
- Minimal Alpine Linux base image
- Isolated container environment

### Common Docker Commands

```bash
# Start application
docker-compose up -d

# View logs (real-time)
docker-compose logs -f

# Stop application
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Access container shell
docker-compose exec retirement-app sh

# View database (Prisma Studio)
docker-compose exec retirement-app npx prisma studio

# Backup database
docker cp retirement-app:/app/prisma/dev.db ./backup-dev.db

# Check container status
docker-compose ps

# View resource usage
docker stats retirement-app
```

### Environment Variables

Configured in `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=file:./prisma/dev.db
  - JWT_SECRET=your-super-secret-jwt-key-change-in-production
  - NEXT_PUBLIC_APP_URL=http://localhost:3100
  - NODE_ENV=production
```

**Security Note:** Change `JWT_SECRET` in production!

### Docker Volumes

**retirement-data:** Persists SQLite database
```bash
# View volumes
docker volume ls

# Inspect volume
docker volume inspect retirement-app_retirement-data

# Remove volume (WARNING: deletes data)
docker volume rm retirement-app_retirement-data
```

### Production Deployment with Docker

**1. Update Environment Variables:**
```yaml
environment:
  - JWT_SECRET=<generate-secure-random-key>
  - NEXT_PUBLIC_APP_URL=https://your-domain.com
  - NODE_ENV=production
```

**2. Optional: Migrate to PostgreSQL**

Edit `docker-compose.yml` to add PostgreSQL service:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=retirement_user
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=retirement_db
    volumes:
      - postgres-data:/var/lib/postgresql/data

  retirement-app:
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://retirement_user:secure_password@postgres:5432/retirement_db
```

**3. Deploy to Server:**
```bash
# Copy files to server
scp -r retirement-app user@server:/opt/

# On server
cd /opt/retirement-app
docker-compose up -d
```

**4. Set up Reverse Proxy (Nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Troubleshooting

**Container won't start:**
```bash
docker-compose logs retirement-app
docker-compose down -v
docker-compose up --build
```

**Database errors:**
```bash
docker-compose exec retirement-app npx prisma migrate deploy
docker-compose exec retirement-app npx prisma generate
```

**Port conflict:**
Edit `docker-compose.yml` and change port mapping:
```yaml
ports:
  - "3101:3000"  # Use different host port
```

**Complete Documentation:** See `README-DOCKER.md` for detailed instructions

---

## Deployment (Non-Docker)

### Local Development
```bash
cd webapp
npm run dev
# Runs on http://localhost:3002
```

### Production Build
```bash
cd webapp
npm run build
npm start
```

### Deploy to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET`
4. Set root directory to `webapp`
5. Deploy

### Database Migration (SQLite → PostgreSQL)
1. Update `DATABASE_URL` in `.env`
2. Change provider in `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migration:
   ```bash
   npx prisma migrate deploy
   ```

---

## Troubleshooting

### Common Issues

**Issue: "Module not found" error**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue: Database locked**
```bash
# Solution: Stop all dev servers
# Delete dev.db-journal file
rm prisma/dev.db-journal
```

**Issue: "Unauthorized" on every request**
```bash
# Solution: Check JWT_SECRET is set
cat .env.local | grep JWT_SECRET

# Clear browser cookies
# Try logging in again
```

**Issue: Charts not rendering**
```bash
# Solution: Ensure 'use client' directive is at top of file
# Check that data format matches chart expectations
```

**Issue: PDF generation fails**
```bash
# Solution: Check element ID matches
# Ensure RetirementReport component is rendered (even if hidden)
# Check browser console for errors
```

---

## Next Steps for Developers

### For New Contributors
1. Read this document thoroughly
2. Set up local development environment
3. Run the app and explore all features
4. Check `MVP-COMPLETION-TASKS.md` for open tasks
5. Pick a task and create a branch
6. Make changes and test locally
7. Submit pull request

### Immediate Priorities (From MVP-COMPLETION-TASKS.md)
1. ✅ Profile editing (COMPLETE)
2. ✅ PDF report generation (COMPLETE)
3. ⏳ Help text and tooltips (IN PROGRESS)
4. ❌ Unit tests
5. ❌ Enhanced validation
6. ❌ Multi-province tax support

### Long-term Roadmap
- Mobile app (React Native)
- Advanced Monte Carlo simulations
- Tax optimization algorithms
- Financial advisor collaboration
- Bank account integration
- Multi-language support (French)

---

## Support & Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Tailwind:** https://tailwindcss.com/docs
- **Recharts:** https://recharts.org/
- **TypeScript:** https://www.typescriptlang.org/docs

### Government Resources
- **CPP:** https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
- **OAS:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html
- **GIS:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html
- **CRA Tax:** https://www.canada.ca/en/revenue-agency/services/tax/individuals.html

### Contact
- **Issues:** GitHub Issues (when repository is set up)
- **Questions:** Create discussion in repository

---

## Glossary

**CPP:** Canada Pension Plan - Monthly retirement benefit based on contributions
**OAS:** Old Age Security - Monthly benefit for seniors 65+ who meet residency requirements
**GIS:** Guaranteed Income Supplement - Additional benefit for low-income OAS recipients
**RRSP:** Registered Retirement Savings Plan - Tax-deferred retirement account
**RRIF:** Registered Retirement Income Fund - RRSP converts to RRIF at age 71
**TFSA:** Tax-Free Savings Account - Investment account with tax-free growth
**YMPE:** Year's Maximum Pensionable Earnings - CPP contribution ceiling ($68,500 in 2025)
**Clawback:** Reduction of benefits based on income (OAS reduced 15¢ per $1 over threshold)
**JWT:** JSON Web Token - Authentication token format
**Prisma:** TypeScript ORM for database operations
**ORM:** Object-Relational Mapping - Database abstraction layer
**FastAPI:** Python web framework for building APIs with automatic OpenAPI docs
**Pydantic:** Python data validation using type annotations
**Uvicorn:** ASGI server for running FastAPI applications

---

**Document Version:** 2.0
**Last Updated:** February 11, 2026
**Maintained By:** Development Team
**Architecture:** Consolidated monorepo (Next.js + Python FastAPI)

---

## Quick Reference Card

```
PROJECT: Canadian Retirement Planning App
TECH: Next.js 15 + TypeScript + Python FastAPI + Prisma + SQLite + Docker
STATUS: 100% MVP Complete + Python API Consolidated
DEPLOYMENT: Containerized with Docker

🐍 PYTHON API COMMANDS:
cd webapp/python-api && python -m uvicorn api.main:app --port 8000 --reload
curl http://localhost:8000/api/health  → Check Python API

📦 NEXT.JS COMMANDS:
cd webapp && npm run dev       → Start Next.js (localhost:3002)
cd webapp && npx prisma studio → Database GUI (localhost:5555)
cd webapp && npx prisma migrate dev → Create migration
cd webapp && npm run build     → Production build

🚀 FULL STACK DEVELOPMENT (Two Terminals):
# Terminal 1: Next.js
cd webapp && npm run dev

# Terminal 2: Python API
cd webapp/python-api && python -m uvicorn api.main:app --port 8000 --reload

🐳 DOCKER COMMANDS:
docker-compose up -d           → Start app (http://localhost:3100)
docker-compose logs -f         → View logs
docker-compose down            → Stop app
docker-compose up -d --build   → Rebuild and start

KEY DIRECTORIES:
webapp/python-api/api/      → Python FastAPI routes
webapp/python-api/modules/  → Core simulation engine (18 modules)
webapp/app/(dashboard)/     → Next.js pages
webapp/app/api/             → Next.js API routes (gateway to Python)
webapp/lib/                 → TypeScript utilities
webapp/prisma/              → Database schema

KEY FILES:
python-api/api/main.py            → FastAPI entry point
python-api/modules/simulation.py  → Main simulation engine
lib/api/simulation-client.ts      → Python API client
app/api/simulation/run/route.ts   → Simulation proxy route
tax_config_canada_2025.json       → Tax configuration
lib/auth.ts                       → JWT authentication
prisma/schema.prisma              → Database schema

ENVIRONMENT VARIABLES:
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key
PYTHON_API_URL=http://localhost:8000

API FLOW:
Browser → Next.js /api/simulation/run → Python /api/run-simulation → Response

HEALTH CHECK:
curl http://localhost:3002/api/health  → Shows DB + Python API status

CURRENT STATUS:
✅ Profile editing
✅ PDF reports
✅ Docker containerization
✅ Python API consolidated
✅ Streamlit removed
⏳ Help tooltips
❌ Unit tests
```
