# RetireZest Codebase Introduction

## Overview
RetireZest is a comprehensive Canadian retirement planning platform that helps seniors optimize their retirement income, calculate government benefits (CPP, OAS, GIS), and project retirement scenarios with advanced tax-optimized withdrawal strategies.

**Production Status:** Live with 67+ active users
**Latest Update:** February 15, 2026

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
│   │   ├── PersonForm.tsx   # Person income/assets form (FIXED: displays pensions)
│   │   ├── HouseholdForm.tsx # Household settings
│   │   └── ResultsDashboard.tsx # Simulation results display
│   ├── profile/              # Profile management components
│   ├── ui/                   # Reusable UI components (Radix-based)
│   └── benefits/             # Government benefit calculators
├── lib/                       # Core utilities
│   ├── auth.ts              # Authentication helpers
│   ├── prisma.ts            # Database client
│   ├── types/               # TypeScript type definitions
│   │   └── simulation.ts    # Simulation types (PersonInput, HouseholdInput)
│   └── api/                 # API client functions
├── python-api/               # Python simulation backend
│   ├── api/
│   │   ├── main.py         # FastAPI app
│   │   ├── models/         # Pydantic models
│   │   │   └── requests.py # Request/response models (with pension_incomes)
│   │   ├── routes/         # API endpoints
│   │   │   └── simulation.py # Simulation endpoint
│   │   └── utils/
│   │       └── converters.py # Data converters (maps pension data)
│   └── modules/
│       ├── simulation.py    # Core simulation engine
│       └── tax_calculator.py # Tax calculations
└── prisma/
    └── schema.prisma        # Database schema

```

## Key Features & Recent Updates

### February 2026 Updates

#### ✅ Fixed: Private Pension Display Issue
- **Problem:** Private pensions saved in Profile → Income weren't showing in Simulation page
- **Root Cause:** PersonForm.tsx was displaying a static message instead of actual pension data
- **Solution:** Modified PersonForm to dynamically display pension_incomes and other_incomes arrays
- **Files Changed:**
  - `/components/simulation/PersonForm.tsx` (lines 304-383)
  - `/app/(dashboard)/simulation/page.tsx` (added debug logging)

#### ✅ Life Expectancy Calculation Fix
- Fixed age calculation using wrong reference date
- Now correctly uses simulation start year instead of current year
- Ensures accurate retirement projections

#### ✅ Income Data Flow Architecture
```
Database (PostgreSQL)
    ↓
Prefill API (/api/simulation/prefill)
    ↓
Frontend State (household.p1.pension_incomes)
    ↓
PersonForm Component (displays in UI) ← FIXED HERE
    ↓
Simulation API (/api/simulation/run)
    ↓
Python Backend (calculates projections)
```

### Core Features

#### 1. User Profile System
- **Profile Settings:** Personal info, retirement age, life expectancy
- **Assets Management:** TFSA, RRSP, RRIF, Non-registered, Corporate accounts
- **Income Sources:**
  - Government benefits (CPP, OAS)
  - Private pensions (with start age)
  - Employment, rental, business, investment income
- **Expenses Tracking:** Essential vs discretionary, recurring vs one-time

#### 2. Retirement Simulation Engine
- **Withdrawal Strategies:**
  - Minimize Income (GIS optimization)
  - RRIF Frontload (minimize lifetime taxes)
  - Balanced (minimum withdrawals)
  - TFSA First
  - Capital Gains Optimized
- **Tax Calculations:** Federal + provincial (AB, BC, ON, QC)
- **Monte Carlo Analysis:** Success rate calculations
- **Year-by-Year Projections:**
  - Account balances
  - Income sources
  - Tax obligations
  - Net spending power

#### 3. Government Benefits Calculators
- **CPP Calculator:** Based on earnings history and retirement age
- **OAS Calculator:** Including GIS supplements
- **Integrated Benefits:** Automatic inclusion in retirement projections

#### 4. Visualization & Reporting
- Interactive charts (Recharts)
- Year-by-year tables
- PDF report generation
- Health score assessment
- 5-year detailed plans

### Data Flow

#### Profile to Simulation Flow
1. User enters data in Profile sections (Settings, Assets, Income, Expenses)
2. Data saved to PostgreSQL via Prisma ORM
3. Simulation page calls `/api/simulation/prefill` to load profile data
4. Prefill API fetches and transforms data into simulation format
5. Frontend displays data in PersonForm and HouseholdForm
6. User can adjust values before running simulation
7. Simulation runs through Python backend for calculations

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
- API testing with test scripts (see test-*.py files)
- Database state verification via Prisma Studio
- Browser console for debugging data flow

### Common Issues & Solutions

#### Pension Not Displaying
- Check PersonForm.tsx renders pension_incomes array
- Verify prefill API returns pension data
- Check console logs for data flow

#### Simulation Failures
- Verify Python backend is running (port 8000)
- Check for 422 validation errors in console
- Ensure all required fields are populated

#### Authentication Issues
- Clear cookies and re-login
- Check JWT token expiration
- Verify email verification status

## Recent Bug Fixes

### February 14-15, 2026
1. **Pension Display Fix:** PersonForm now properly displays pension and other income sources from profile
2. **Life Expectancy Calculation:** Fixed to use simulation start year instead of current year
3. **Data Merge Logic:** Improved prefill data merging to preserve income arrays
4. **UI Improvements:** Added visual indicators for loaded profile data

## Deployment

### Production Environment
- **Frontend:** Vercel (automatic deployments from main branch)
- **Python API:** Railway (manual deployments)
- **Database:** Neon PostgreSQL (connection pooling enabled)
- **Domain:** retirezest.com (Cloudflare DNS)

### Deployment Process
1. Test locally with production-like data
2. Push to GitHub (triggers Vercel build)
3. Deploy Python backend to Railway if needed
4. Run database migrations if schema changed
5. Monitor error logs and analytics

## Monitoring & Analytics
- **Vercel Analytics:** Performance metrics
- **Google Analytics 4:** User behavior tracking
- **Sentry:** Error tracking (optional)
- **Database Metrics:** Via Neon dashboard

## Support & Documentation
- User documentation in `/docs` (if available)
- API documentation in `API-README.md`
- Changelog in `CHANGELOG.md`
- Test reports in `TESTING_REPORT.md`

---

*Last Updated: February 15, 2026*
*Version: 1.0.0*
*Active Users: 67+*