# RetireZest Codebase Introduction

## Overview
RetireZest is a comprehensive Canadian retirement planning platform that helps seniors optimize their retirement income, calculate government benefits (CPP, OAS, GIS), and project retirement scenarios with advanced tax-optimized withdrawal strategies.

**Production Status:** Live with 67+ active users
**Latest Update:** February 17, 2026

## Architecture

### Tech Stack
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript 5, Tailwind CSS
- **Backend API:** Next.js API Routes + Python FastAPI for simulation engine
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** JWT with httpOnly cookies, email verification via Resend
- **Payments:** Stripe subscriptions
- **Infrastructure:** Vercel (frontend), Railway (Python backend)

### Project Structure
```
webapp/
├── app/                        # Next.js 15 App Router
│   ├── (auth)/                # Authentication pages (login, register, verify)
│   ├── (dashboard)/           # Main app pages (simulation, profile, benefits)
│   ├── api/                   # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── simulation/       # Simulation endpoints (prefill, run, quick-start)
│   │   ├── profile/          # Profile management
│   │   └── user/             # User management, subscriptions
│   └── layout.tsx            # Root layout with providers
├── components/                 # React components
│   ├── simulation/           # Simulation forms and results
│   │   ├── PersonForm.tsx   # Person income/assets form (displays pensions)
│   │   ├── HouseholdForm.tsx # Household settings
│   │   ├── YearByYearTable.tsx # Detailed yearly results display
│   │   ├── TotalIncomeSourcesChart.tsx # Income visualization chart
│   │   └── ResultsDashboard.tsx # Simulation results display
│   ├── profile/              # Profile management components
│   ├── ui/                   # Reusable UI components (Radix-based)
│   └── benefits/             # Government benefit calculators
├── lib/                       # Core utilities
│   ├── auth.ts              # Authentication helpers
│   ├── prisma.ts            # Database client
│   ├── types/               # TypeScript type definitions
│   │   └── simulation.ts    # Simulation types (PersonInput, HouseholdInput, YearResult)
│   ├── utils/
│   │   └── tfsa-calculator.ts # TFSA contribution room calculator
│   └── api/                 # API client functions
├── python-api/               # Python simulation backend
│   ├── api/
│   │   ├── main.py         # FastAPI app
│   │   ├── models/         # Pydantic models
│   │   │   ├── requests.py # Request models (with pension_incomes, other_incomes)
│   │   │   └── responses.py # Response models (YearResult with reinvestment fields)
│   │   ├── routes/         # API endpoints
│   │   │   └── simulation.py # Simulation endpoint
│   │   └── utils/
│   │       └── converters.py # Data converters (separates contributions from reinvestments)
│   └── modules/
│       ├── simulation.py    # Core simulation engine (GIS calculation, surplus allocation)
│       ├── tax_calculator.py # Tax calculations
│       └── benefits.py      # Government benefits calculations (CPP, OAS, GIS)
└── prisma/
    └── schema.prisma        # Database schema
```

## Key Features & Recent Updates

### February 16-17, 2026 Critical Updates

#### ✅ Fixed: GIS Incorrectly Paid to High-Income Individuals
- **Problem:** Individuals with $100k+ pension income were receiving GIS benefits
- **Root Cause:** GIS income calculation was missing employer pension and other income
- **Solution:** Added pension_income and other_income to GIS net income calculation
- **Impact:** High-income retirees no longer incorrectly receive GIS benefits
- **Files Changed:**
  - `/python-api/modules/simulation.py` (line 2247: added pension/other income to GIS calculation)
  - Validated low-income seniors still correctly receive GIS

#### ✅ Fixed: Surplus Allocation Exceeding Available Funds
- **Problem:** Simulation allocating $103k to TFSA when only $43k surplus available
- **Root Cause:** Pension income was incorrectly subtracted from spending target, making target $0
- **Solution:** Removed incorrect pension subtraction from spending target calculation
- **Impact:** Surplus now correctly calculated as ~$43k instead of $103k
- **Files Changed:**
  - `/python-api/modules/simulation.py` (lines 2729-2741: removed pension subtraction)
  - Spending target now correctly remains at user's specified amount

#### ✅ Fixed: TFSA Contribution Display Issues
- **Problem:** TFSA Contribution showed $0 despite surplus being allocated to TFSA
- **Root Cause:** Display only showed regular contributions, not surplus reinvestments
- **Solution:** Updated display to include both contributions and reinvestments
- **Files Changed:**
  - `/components/simulation/YearByYearTable.tsx` (lines 610-638: fixed TFSA display)
  - `/python-api/api/utils/converters.py` (separated contributions from reinvestments)

#### ✅ Enhanced: Pension Income Visualization
- **Problem:** Pension income not visible in income charts
- **Solution:** Created TotalIncomeSourcesChart component for comprehensive income display
- **Impact:** Users can now clearly see pension income alongside government benefits
- **Files Changed:**
  - `/components/simulation/TotalIncomeSourcesChart.tsx` (new component)
  - `/components/simulation/YearByYearTable.tsx` (includes pension in Total Inflows)

#### ✅ Implemented: TFSA Room Accumulation Calculator
- **Problem:** TFSA room calculation only used annual limit, not accumulated unused room
- **Solution:** Created calculator using CRA historical contribution limits (2009-2024)
- **Impact:** Accurate TFSA room calculation for those who haven't contributed
- **Files Changed:**
  - `/lib/utils/tfsa-calculator.ts` (new utility function)
  - Calculates up to $157,500 accumulated room for 2033 retirement

### February 2026 Earlier Updates

#### ✅ Fixed: Private Pension Display Issue
- **Problem:** Private pensions saved in Profile weren't showing in Simulation page
- **Root Cause:** PersonForm.tsx was displaying static message instead of actual data
- **Solution:** Modified PersonForm to dynamically display pension_incomes arrays
- **Files Changed:**
  - `/components/simulation/PersonForm.tsx` (lines 304-383)

#### ✅ Life Expectancy Calculation Fix
- Fixed age calculation using wrong reference date
- Now correctly uses simulation start year instead of current year

### Core Features

#### 1. User Profile System
- **Profile Settings:** Personal info, retirement age, life expectancy
- **Assets Management:** TFSA, RRSP, RRIF, Non-registered, Corporate accounts
- **Income Sources:**
  - Government benefits (CPP, OAS, GIS)
  - Private/employer pensions (with start age, inflation indexing)
  - Employment, rental, business, investment income
- **Expenses Tracking:** Essential vs discretionary, recurring vs one-time

#### 2. Retirement Simulation Engine
- **Withdrawal Strategies:**
  - Minimize Income (GIS optimization)
  - RRIF Frontload (minimize lifetime taxes)
  - Balanced (minimum withdrawals)
  - TFSA First
  - Capital Gains Optimized
- **Tax Calculations:** Federal + provincial (all provinces/territories)
- **Government Benefits:**
  - CPP with start age optimization
  - OAS with clawback calculations
  - GIS with proper income testing (includes pensions)
- **Surplus Allocation:**
  - Priority 1: TFSA (up to contribution room)
  - Priority 2: Non-registered accounts
  - Never creates unfunded years

#### 3. Key Calculation Logic

##### GIS (Guaranteed Income Supplement) Calculation
```python
# GIS income includes (per CRA rules):
gis_net_income = (
    nr_interest + nr_elig_div + nr_nonelig_div +  # Investment income
    nr_capg_dist * 0.5 +                          # Capital gains (50% inclusion)
    withdrawals["rrif"] + withdrawals["corp"] +    # Account withdrawals
    cpp +                                          # CPP benefits
    pension_income + other_income                  # Employer pensions & other income
)
# NOTE: OAS is explicitly excluded from GIS income test per CRA rules
```

##### Surplus Allocation Logic
```python
# After meeting spending needs and paying taxes:
surplus = max(total_after_tax_cash - after_tax_target, 0)

# Allocate surplus in priority order:
if surplus > 0:
    tfsa_allocation = min(surplus, tfsa_room)
    nonreg_allocation = surplus - tfsa_allocation
```

#### 4. Visualization & Reporting
- Interactive charts (Recharts library)
- Year-by-year detailed tables with cash flow analysis
- PDF report generation
- Health score assessment (0-100)
- 5-year detailed plans

### Data Flow

#### Profile to Simulation Flow
1. User enters data in Profile sections (Settings, Assets, Income, Expenses)
2. Data saved to PostgreSQL via Prisma ORM
3. Simulation page calls `/api/simulation/prefill` to load profile data
4. Prefill API fetches and transforms data into simulation format
5. Frontend displays data in PersonForm and HouseholdForm
6. User can adjust values before running simulation
7. Simulation API validates and sends to Python backend
8. Python backend calculates year-by-year projections
9. Results returned and displayed in charts/tables

#### Key Database Tables
- `User`: Core user data, authentication
- `Asset`: Financial accounts (TFSA, RRSP, etc.)
- `Income`: All income sources including pensions
- `Expense`: Spending tracking
- `Scenario`: Inflation rates and assumptions
- `SimulationResult`: Saved simulation outputs

### Authentication & Security
- JWT tokens in httpOnly cookies
- Email verification required for full access
- CSRF protection on state-changing operations
- Cloudflare Turnstile for bot protection
- Role-based access (free vs premium tiers)

### Monetization System
- **Free Tier:** 3 simulations before email verification, 10/day after
- **Premium Tier:** Unlimited simulations, PDF exports, advanced features
- **Stripe Integration:** Subscription management
- **Email Campaigns:** Re-engagement for inactive users

## Development Guidelines

### Environment Setup
1. **Required:** Node.js 20+, Python 3.11+
2. **Install dependencies:** `npm install`
3. **Database setup:** `npx prisma migrate dev`
4. **Python backend:** `cd python-api && pip install -r requirements.txt`
5. **Run dev servers:**
   - Frontend: `npm run dev` (port 3001)
   - Python API: `cd python-api && uvicorn api.main:app --reload --port 8000`

### Key Configuration Files
- `.env.local`: Environment variables (database, API keys)
- `prisma/schema.prisma`: Database schema
- `next.config.mjs`: Next.js configuration
- `tailwind.config.ts`: Styling configuration

### Testing Approach
- Manual testing for UI flows
- API testing with test scripts:
  - `test-regression-suite.py`: Comprehensive regression testing
  - `test-final-verification.py`: Pension and surplus verification
  - `test-backend-direct.py`: Direct Python API testing
- Database state verification via Prisma Studio
- Browser console for debugging data flow

### Common Issues & Solutions

#### GIS Incorrectly Paid
- Verify pension_income included in GIS calculation
- Check simulation.py line ~2247 for GIS income calculation
- High-income individuals should receive $0 GIS

#### Surplus Allocation Issues
- Check spending target not being incorrectly reduced
- Verify surplus = inflows - outflows (spending + tax)
- TFSA allocation should not exceed available surplus

#### Pension Not Displaying
- Check PersonForm.tsx renders pension_incomes array
- Verify prefill API returns pension data
- Check console logs for data flow

#### Simulation Failures
- Verify Python backend is running (port 8000)
- Check for 422 validation errors in console
- Ensure all required fields are populated

## Recent Bug Fixes Summary

### February 16-17, 2026
1. **GIS Eligibility Fix:** Added pension/other income to GIS calculation, preventing incorrect benefits
2. **Surplus Calculation Fix:** Removed incorrect pension subtraction from spending target
3. **TFSA Display Fix:** Shows both regular contributions and surplus reinvestments
4. **Pension Visualization:** Added comprehensive income charts showing all sources

### February 14-15, 2026
1. **Pension Display Fix:** PersonForm properly displays pension and other income sources
2. **Life Expectancy Fix:** Uses simulation start year instead of current year
3. **Data Merge Logic:** Improved prefill data merging to preserve income arrays

## Deployment

### Production Environment
- **Frontend:** Vercel (automatic deployments from main branch)
- **Python API:** Railway (manual deployments)
- **Database:** Neon PostgreSQL (connection pooling enabled)
- **Domain:** retirezest.com (Cloudflare DNS)

### Deployment Process
1. Run regression tests locally (`python3 test-regression-suite.py`)
2. Test with production-like data
3. Push to GitHub (triggers Vercel build)
4. Deploy Python backend to Railway if backend changes made
5. Run database migrations if schema changed
6. Monitor error logs and user feedback

## Monitoring & Analytics
- **Vercel Analytics:** Performance metrics
- **Google Analytics 4:** User behavior tracking
- **Database Metrics:** Via Neon dashboard
- **Error Tracking:** Console logs, API response codes

## Support & Documentation
- User documentation in `/docs` (if available)
- API documentation in `API-README.md`
- Changelog in `CHANGELOG.md`
- Test reports in `TESTING_REPORT.md`
- Recent fixes documented in:
  - `PENSION-INCOME-FIX.md`
  - `TFSA_SURPLUS_ALLOCATION_FIX.md`
  - `GIS_FIX_SUMMARY.md`

## Critical Business Logic

### TFSA Contribution Room (CRA Guidelines)
- 2009-2012: $5,000/year
- 2013-2014: $5,500/year
- 2015: $10,000
- 2016-2018: $5,500/year
- 2019-2022: $6,000/year
- 2023: $6,500
- 2024+: $7,000 + inflation

### GIS Income Thresholds (2026)
- Single: $21,768 (full clawback)
- Couple: $28,752 (combined income)
- Clawback rate: 50% of income over threshold

### Tax Integration
- Federal and provincial taxes calculated separately
- OAS clawback at high incomes
- Pension income splitting for couples
- RRIF minimum withdrawal requirements

---

*Last Updated: February 17, 2026*
*Version: 1.1.0*
*Active Users: 67+*
*Recent Major Fixes: GIS eligibility, Surplus allocation, TFSA display*