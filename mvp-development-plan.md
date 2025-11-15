# Canadian Retirement Planning App - Local MVP Development Plan

**Document Version:** 1.0
**Date:** November 14, 2025
**Project:** Canadian Seniors Retirement Planning Web Application (Local MVP)
**Target:** Pre-production prototype for local hosting and testing

---

## 1. Executive Summary

This is a streamlined development plan for building a **local MVP** (Minimum Viable Product) of the Canadian Retirement Planning application. This version focuses on core functionality that can be developed, tested, and demonstrated locally without cloud infrastructure, production deployment, or complex third-party integrations.

### 1.1 MVP Scope

**What's Included:**
- ✅ User authentication (local storage/JWT)
- ✅ Financial profile management (income, assets, expenses, debts)
- ✅ Government benefits calculator (CPP, OAS, GIS)
- ✅ Basic retirement projection engine
- ✅ Tax calculations (federal + provincial)
- ✅ Simple scenario comparison (2-3 scenarios)
- ✅ Dashboard with key metrics
- ✅ Basic charts and visualizations
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Local SQLite database
- ✅ PDF report generation (basic)

**What's Deferred (Post-MVP):**
- ❌ Cloud deployment (AWS/Azure)
- ❌ Email notifications
- ❌ SMS/MFA authentication
- ❌ Advanced Monte Carlo simulations
- ❌ Tax optimization algorithms
- ❌ French translation (English only for MVP)
- ❌ User registration system (demo mode)
- ❌ Production-grade security
- ❌ Real-time data integrations

### 1.2 Technology Stack (Simplified)

**Frontend:**
- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts (visualizations)
- React Hook Form + Zod

**Backend:**
- Next.js API routes
- Prisma ORM
- SQLite database (local file)
- JWT authentication (simple)

**Development:**
- Node.js 20 LTS
- npm package manager
- Local development server
- VS Code (recommended)

### 1.3 Timeline

**Estimated Development Time:** 4-6 weeks (solo developer, part-time)
**Or:** 2-3 weeks (solo developer, full-time)
**Or:** 1-2 weeks (2-3 developers, full-time)

---

## 2. Development Phases

### Phase 1: Project Setup & Foundation (3-5 days)

**Objectives:**
- Set up Next.js project
- Configure development environment
- Create database schema
- Build basic UI shell

**Tasks:**

**Day 1: Project Initialization**
- [ ] Initialize Next.js 14 with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Set up shadcn/ui component library
- [ ] Configure project structure
- [ ] Set up Git repository
- [ ] Create README with setup instructions

**Day 2: Database Setup**
- [ ] Install and configure Prisma
- [ ] Set up SQLite database
- [ ] Create database schema
  - Users table
  - Financial profile tables (income, assets, expenses, debts)
  - Scenarios table
  - Projections table
- [ ] Generate Prisma client
- [ ] Create seed data for testing

**Day 3: Authentication**
- [ ] Create simple JWT authentication
- [ ] Build login page UI
- [ ] Build registration page UI (basic)
- [ ] Implement auth middleware
- [ ] Create protected routes
- [ ] Add logout functionality

**Day 4-5: Basic Layout & Navigation**
- [ ] Create main layout component
- [ ] Build responsive header with navigation
- [ ] Create sidebar navigation
- [ ] Build footer component
- [ ] Set up routing structure
- [ ] Create landing/welcome page
- [ ] Add basic styling and theme

**Deliverables:**
- Working Next.js application
- Database schema implemented
- Basic authentication working
- Responsive layout structure
- Project running on localhost:3000

---

### Phase 2: Financial Profile (4-6 days)

**Objectives:**
- Build financial data entry forms
- Create profile management UI
- Implement CRUD operations

**Tasks:**

**Day 6-7: Income & Assets**
- [ ] Create income sources form
  - Employment income
  - Pension income
  - Investment income
  - Rental income
- [ ] Create assets management interface
  - RRSP accounts
  - TFSA accounts
  - Non-registered accounts
  - Real estate
- [ ] Implement form validation (Zod schemas)
- [ ] Create API routes for CRUD operations
- [ ] Build summary cards showing totals

**Day 8-9: Expenses & Debts**
- [ ] Create expense categorization form
  - Essential expenses
  - Discretionary expenses
  - Monthly totals
- [ ] Create debt tracking interface
  - Mortgages
  - Loans
  - Credit cards
  - Interest rates
- [ ] Implement data persistence
- [ ] Build financial snapshot view
- [ ] Create "Net Worth" calculator

**Day 10-11: Profile Dashboard**
- [ ] Create financial profile dashboard
- [ ] Display all financial data in organized sections
- [ ] Add edit/delete functionality
- [ ] Create navigation between sections
- [ ] Add data validation and error handling
- [ ] Build "Profile Completeness" indicator

**Deliverables:**
- Complete financial profile management
- All CRUD operations working
- Data persisted to SQLite
- Clean, intuitive UI
- Form validation working

---

### Phase 3: Government Benefits Calculator (3-5 days)

**Objectives:**
- Build CPP calculation engine
- Implement OAS calculator
- Create GIS eligibility checker

**Tasks:**

**Day 12-13: CPP Calculator**
- [ ] Create CPP contribution input form
- [ ] Implement CPP calculation algorithm
  - Average YMPE calculation
  - Basic dropout provisions (17%)
  - Age adjustment factors (60-70)
- [ ] Build CPP estimate display
- [ ] Create timing comparison chart (age 60 vs 65 vs 70)
- [ ] Add historical YMPE data (2020-2025)
- [ ] Display monthly and annual amounts

**Day 14: OAS Calculator**
- [ ] Create OAS residency questionnaire
- [ ] Implement OAS calculation
  - Full vs partial based on residency
  - Age 75+ increase
- [ ] Build OAS clawback calculator
  - Income thresholds
  - 15% clawback rate
  - Full clawback calculation
- [ ] Display OAS estimate

**Day 15-16: GIS & Benefits Summary**
- [ ] Implement GIS eligibility logic
- [ ] Build GIS amount calculator
  - Income testing
  - Single vs couple calculations
- [ ] Create government benefits summary page
  - Total monthly benefits
  - Breakdown by type (CPP, OAS, GIS)
  - Timing recommendations
- [ ] Add simple charts for visualization

**Deliverables:**
- Working CPP, OAS, GIS calculators
- Benefits summary dashboard
- Visual comparison tools
- Calculation accuracy validated

---

### Phase 4: Retirement Projection Engine (5-7 days)

**Objectives:**
- Build core projection algorithm
- Implement tax calculations
- Create year-by-year projections

**Tasks:**

**Day 17-18: Tax Calculator**
- [ ] Create federal tax calculation function
  - 2025 tax brackets
  - Basic personal amount
  - Age amount (65+)
  - Pension income credit
- [ ] Implement provincial tax (start with Ontario)
  - Provincial brackets
  - Provincial credits
- [ ] Add marginal tax rate calculator
- [ ] Build tax estimation API endpoint
- [ ] Create simple tax summary display

**Day 19-20: Projection Algorithm**
- [ ] Build retirement projection orchestrator
- [ ] Implement year-by-year iteration (age → 95)
- [ ] Calculate annual income
  - Government benefits (CPP, OAS, GIS)
  - Pension income
  - Investment withdrawals
- [ ] Apply inflation to expenses (2% default)
- [ ] Calculate annual taxes
- [ ] Update asset balances each year
- [ ] Detect asset depletion
- [ ] Generate projection data structure

**Day 21-22: RRIF & Withdrawal Logic**
- [ ] Create RRIF minimum withdrawal table
- [ ] Implement RRIF conversion at age 71
- [ ] Build withdrawal strategy (simple)
  - TFSA first (tax-free)
  - RRSP/RRIF second
  - Non-registered third
- [ ] Calculate capital gains on non-registered
- [ ] Add withdrawal withholding tax

**Day 23: Projection Results**
- [ ] Create projection results API endpoint
- [ ] Build projection display page
- [ ] Show year-by-year summary table
- [ ] Calculate key metrics
  - Total retirement income
  - Asset depletion year
  - Estate value
  - Probability of success (simple)
- [ ] Add export to CSV functionality

**Deliverables:**
- Working retirement projection engine
- Tax calculations (federal + Ontario)
- Year-by-year projections to age 95
- Withdrawal strategy implemented
- Results display page

---

### Phase 5: Dashboard & Visualizations (4-6 days)

**Objectives:**
- Build main dashboard
- Create data visualizations
- Implement retirement readiness score

**Tasks:**

**Day 24-25: Dashboard UI**
- [ ] Design dashboard layout
- [ ] Create retirement readiness score algorithm
  - Asset adequacy (40%)
  - Income replacement (30%)
  - Debt levels (15%)
  - Diversification (15%)
- [ ] Build key metrics cards
  - Years to retirement
  - Projected monthly income
  - Current net worth
  - Savings rate
- [ ] Create quick actions menu
- [ ] Add alerts and recommendations
- [ ] Display recent activity

**Day 26-27: Data Visualizations**
- [ ] Set up Recharts library
- [ ] Create income breakdown chart (stacked area)
  - CPP, OAS, GIS
  - Pension
  - Withdrawals
- [ ] Build cash flow chart (line chart)
  - Income vs expenses over time
- [ ] Create asset balance chart (area chart)
  - RRSP/RRIF, TFSA, Non-registered
- [ ] Add tax visualization (bar chart)
- [ ] Make charts responsive and interactive

**Day 28-29: Scenario Planning**
- [ ] Create scenario management interface
- [ ] Allow creating 2-3 scenarios
- [ ] Build scenario comparison view (side-by-side)
- [ ] Add parameter adjustment sliders
  - Retirement age
  - Annual spending
  - CPP start age
  - Investment returns
- [ ] Show comparison charts
- [ ] Save scenarios to database

**Deliverables:**
- Interactive dashboard
- Multiple chart visualizations
- Retirement readiness score
- Scenario comparison tool
- Responsive design

---

### Phase 6: Reports & Polish (3-4 days)

**Objectives:**
- Generate PDF reports
- Polish UI/UX
- Add help text
- Final testing

**Tasks:**

**Day 30-31: PDF Reports**
- [ ] Install PDF generation library (react-pdf or puppeteer)
- [ ] Create basic report template
  - Executive summary
  - Key findings (3-5 bullets)
  - Income breakdown
  - Year-by-year table
  - Assumptions and disclaimers
- [ ] Implement report generation
- [ ] Add download button
- [ ] Test PDF output

**Day 32: UI/UX Polish**
- [ ] Review all pages for consistency
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add empty states with helpful guidance
- [ ] Polish responsive design
- [ ] Add tooltips and help text
- [ ] Improve form UX (inline validation, success states)

**Day 33: Testing & Bug Fixes**
- [ ] Test all user flows end-to-end
- [ ] Test with different data scenarios
- [ ] Fix bugs and edge cases
- [ ] Test responsive design on mobile/tablet
- [ ] Verify calculations with sample data
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

**Day 34: Documentation & Demo Data**
- [ ] Write README with setup instructions
- [ ] Create user guide (basic)
- [ ] Add demo/sample data
- [ ] Create screenshot documentation
- [ ] Write deployment guide for localhost
- [ ] Add code comments

**Deliverables:**
- PDF report generation
- Polished UI/UX
- Comprehensive testing completed
- Documentation finished
- Demo-ready application

---

## 3. Database Schema (Simplified)

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String
  firstName         String?
  lastName          String?
  dateOfBirth       DateTime?
  province          String?   // ON, BC, AB, etc.
  maritalStatus     String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  incomeSources     Income[]
  assets            Asset[]
  expenses          Expense[]
  debts             Debt[]
  scenarios         Scenario[]
  projections       Projection[]
}

model Income {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        String    // employment, pension, investment, rental
  description String?
  amount      Float
  frequency   String    // monthly, annual
  isTaxable   Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Asset {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String    // rrsp, tfsa, non_registered, real_estate
  description     String?
  currentValue    Float
  contributionRoom Float?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Expense {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    String    // housing, food, transportation, healthcare, etc.
  description String?
  amount      Float
  frequency   String    // monthly, annual
  isEssential Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Debt {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String    // mortgage, loan, credit_card
  description     String?
  currentBalance  Float
  interestRate    Float
  monthlyPayment  Float?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Scenario {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  retirementAge       Int
  lifeExpectancy      Int       @default(95)
  annualSpendingGoal  Float
  cppStartAge         Int       @default(65)
  oasStartAge         Int       @default(65)
  inflationRate       Float     @default(2.0)
  investmentReturn    Float     @default(5.0)
  isBaseline          Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  projections         Projection[]
}

model Projection {
  id                    String    @id @default(uuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  scenarioId            String
  scenario              Scenario  @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  retirementAge         Int
  calculationDate       DateTime  @default(now())
  results               String    // JSON string of yearly projections
  successProbability    Float?
  totalLifetimeIncome   Float?
  estateValue           Float?
  createdAt             DateTime  @default(now())
}
```

---

## 4. Key Features Detail

### 4.1 Financial Profile Management

**User Inputs:**
- Personal info (age, province, retirement age)
- Income sources (salary, pension, investments)
- Assets (RRSP: $X, TFSA: $Y, Non-registered: $Z)
- Monthly expenses ($X,XXX)
- Debts (mortgage, loans)

**Outputs:**
- Net worth calculation
- Monthly income/expense summary
- Debt-to-income ratio
- Profile completeness score

### 4.2 Government Benefits Calculator

**CPP Calculation:**
```javascript
// Simplified CPP calculation
const calculateCPP = (avgYMPE, startAge) => {
  const maxCPP = 1433.00; // 2025 maximum monthly
  const baseAmount = avgYMPE * 0.25 / 12;

  // Age adjustment factors
  const ageFactors = {
    60: 0.64,
    61: 0.694,
    62: 0.748,
    63: 0.802,
    64: 0.856,
    65: 1.0,
    66: 1.084,
    67: 1.168,
    68: 1.252,
    69: 1.336,
    70: 1.42
  };

  const adjustedAmount = baseAmount * ageFactors[startAge];
  return Math.min(adjustedAmount, maxCPP * ageFactors[startAge]);
};
```

**OAS Calculation:**
```javascript
// Simplified OAS calculation
const calculateOAS = (yearsInCanada, age, annualIncome) => {
  const maxOAS = 713.34; // 2025 monthly at age 65
  const maxOAS75Plus = 784.67; // 2025 monthly at age 75+

  // Residency calculation (40 years for full)
  const residencyRatio = Math.min(yearsInCanada / 40, 1);
  const baseOAS = age >= 75 ? maxOAS75Plus : maxOAS;
  let monthlyOAS = baseOAS * residencyRatio;

  // Clawback (income over $90,997)
  const clawbackThreshold = 90997;
  if (annualIncome > clawbackThreshold) {
    const clawback = (annualIncome - clawbackThreshold) * 0.15 / 12;
    monthlyOAS = Math.max(0, monthlyOAS - clawback);
  }

  return monthlyOAS;
};
```

**GIS Calculation:**
```javascript
// Simplified GIS calculation
const calculateGIS = (annualIncome, maritalStatus) => {
  const maxGIS = {
    single: 1065.47,
    married: 641.35
  };

  const incomeThreshold = {
    single: 21624,
    married: 28560
  };

  const status = maritalStatus === 'married' ? 'married' : 'single';

  if (annualIncome >= incomeThreshold[status]) {
    return 0;
  }

  // Simplified calculation (actual is more complex)
  const reductionRate = 0.5; // 50 cents per dollar
  const reduction = annualIncome * reductionRate / 12;

  return Math.max(0, maxGIS[status] - reduction);
};
```

### 4.3 Retirement Projection Engine

**Simplified Algorithm:**
```javascript
const generateProjection = (userProfile, scenario) => {
  const projections = [];
  const currentAge = calculateAge(userProfile.dateOfBirth);
  const retirementAge = scenario.retirementAge;
  const endAge = scenario.lifeExpectancy;

  let rrspBalance = userProfile.rrspBalance;
  let tfsaBalance = userProfile.tfsaBalance;
  let nonRegBalance = userProfile.nonRegBalance;

  for (let age = retirementAge; age <= endAge; age++) {
    const year = {
      age,
      year: new Date().getFullYear() + (age - currentAge),

      // Income
      cppIncome: calculateCPP(userProfile.avgYMPE, scenario.cppStartAge),
      oasIncome: calculateOAS(userProfile.yearsInCanada, age, 0), // simplified
      gisIncome: 0, // calculated after total income known
      pensionIncome: userProfile.pensionIncome || 0,

      // Withdrawals (simplified strategy)
      tfsaWithdrawal: 0,
      rrspWithdrawal: 0,
      nonRegWithdrawal: 0,

      // Expenses
      expenses: scenario.annualSpendingGoal * Math.pow(1 + scenario.inflationRate/100, age - retirementAge),

      // Taxes
      federalTax: 0,
      provincialTax: 0,

      // Balances
      rrspBalance,
      tfsaBalance,
      nonRegBalance
    };

    // Calculate total income before withdrawals
    let totalIncome = year.cppIncome * 12 + year.oasIncome * 12 + year.pensionIncome * 12;

    // Calculate shortfall
    const shortfall = year.expenses - totalIncome;

    if (shortfall > 0) {
      // Withdrawal strategy: TFSA first, then RRSP, then non-reg
      if (tfsaBalance > 0) {
        year.tfsaWithdrawal = Math.min(shortfall, tfsaBalance);
        tfsaBalance -= year.tfsaWithdrawal;
      }

      const remainingShortfall = shortfall - year.tfsaWithdrawal;

      if (remainingShortfall > 0 && rrspBalance > 0) {
        year.rrspWithdrawal = Math.min(remainingShortfall, rrspBalance);
        rrspBalance -= year.rrspWithdrawal;
        totalIncome += year.rrspWithdrawal; // RRSP withdrawals are taxable
      }

      const finalShortfall = remainingShortfall - year.rrspWithdrawal;

      if (finalShortfall > 0 && nonRegBalance > 0) {
        year.nonRegWithdrawal = Math.min(finalShortfall, nonRegBalance);
        nonRegBalance -= year.nonRegWithdrawal;
        totalIncome += year.nonRegWithdrawal * 0.5; // Only 50% taxable (capital gains)
      }
    }

    // Calculate taxes
    const taxableIncome = totalIncome;
    year.federalTax = calculateFederalTax(taxableIncome, age);
    year.provincialTax = calculateProvincialTax(taxableIncome, userProfile.province, age);
    year.totalTax = year.federalTax + year.provincialTax;

    // Update balances with investment returns
    rrspBalance *= (1 + scenario.investmentReturn / 100);
    tfsaBalance *= (1 + scenario.investmentReturn / 100);
    nonRegBalance *= (1 + scenario.investmentReturn / 100);

    year.rrspBalance = rrspBalance;
    year.tfsaBalance = tfsaBalance;
    year.nonRegBalance = nonRegBalance;
    year.totalAssets = rrspBalance + tfsaBalance + nonRegBalance;

    projections.push(year);
  }

  return projections;
};
```

### 4.4 Tax Calculation

**Federal Tax (2025 rates):**
```javascript
const calculateFederalTax = (income, age) => {
  const brackets = [
    { limit: 55867, rate: 0.15 },
    { limit: 111733, rate: 0.205 },
    { limit: 173205, rate: 0.26 },
    { limit: 246752, rate: 0.29 },
    { limit: Infinity, rate: 0.33 }
  ];

  let tax = 0;
  let previousLimit = 0;

  for (const bracket of brackets) {
    if (income > previousLimit) {
      const taxableInBracket = Math.min(income - previousLimit, bracket.limit - previousLimit);
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    }
  }

  // Apply tax credits
  const basicPersonalAmount = 15705;
  const ageAmount = age >= 65 ? 8790 : 0;
  const pensionAmount = 2000; // Simplified

  const totalCredits = (basicPersonalAmount + ageAmount + pensionAmount) * 0.15;

  return Math.max(0, tax - totalCredits);
};
```

---

## 5. File Structure

```
retirement-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   ├── income/
│   │   │   │   └── page.tsx
│   │   │   ├── assets/
│   │   │   │   └── page.tsx
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx
│   │   │   └── debts/
│   │   │       └── page.tsx
│   │   ├── benefits/
│   │   │   └── page.tsx
│   │   ├── projection/
│   │   │   └── page.tsx
│   │   ├── scenarios/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── profile/
│   │   │   ├── income/
│   │   │   │   └── route.ts
│   │   │   ├── assets/
│   │   │   │   └── route.ts
│   │   │   ├── expenses/
│   │   │   │   └── route.ts
│   │   │   └── debts/
│   │   │       └── route.ts
│   │   ├── benefits/
│   │   │   ├── cpp/
│   │   │   │   └── route.ts
│   │   │   ├── oas/
│   │   │   │   └── route.ts
│   │   │   └── gis/
│   │   │       └── route.ts
│   │   ├── projection/
│   │   │   └── route.ts
│   │   └── scenarios/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── metrics-card.tsx
│   │   ├── readiness-score.tsx
│   │   └── quick-actions.tsx
│   ├── charts/
│   │   ├── income-chart.tsx
│   │   ├── cash-flow-chart.tsx
│   │   └── asset-balance-chart.tsx
│   └── forms/
│       ├── income-form.tsx
│       ├── asset-form.tsx
│       ├── expense-form.tsx
│       └── debt-form.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── calculations/
│   │   ├── cpp.ts
│   │   ├── oas.ts
│   │   ├── gis.ts
│   │   ├── tax.ts
│   │   └── projection.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   └── ...
├── types/
│   └── index.ts
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 6. Setup Instructions

### 6.1 Prerequisites

- Node.js 20 LTS installed
- npm or yarn package manager
- VS Code (recommended) or any code editor
- Git (for version control)

### 6.2 Installation Steps

```bash
# 1. Navigate to project directory
cd C:\Projects\retirement-app

# 2. Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm

# 3. Install dependencies
npm install prisma @prisma/client
npm install @hookform/resolvers react-hook-form zod
npm install recharts
npm install jose # for JWT
npm install bcryptjs
npm install @types/bcryptjs --save-dev
npm install date-fns

# 4. Install shadcn/ui
npx shadcn-ui@latest init

# 5. Add shadcn components (as needed)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog

# 6. Initialize Prisma with SQLite
npx prisma init --datasource-provider sqlite

# 7. Create database schema (edit prisma/schema.prisma)
# (Copy schema from section 3.1 above)

# 8. Generate Prisma client
npx prisma generate

# 9. Create and run migrations
npx prisma migrate dev --name init

# 10. Seed database with sample data
npx prisma db seed

# 11. Run development server
npm run dev
```

### 6.3 Environment Variables

Create `.env.local` file:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 7. Development Workflow

### 7.1 Daily Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open browser to `http://localhost:3000`

2. **Make Changes**
   - Edit files in `app/`, `components/`, `lib/`
   - Next.js will hot-reload changes automatically

3. **Database Changes**
   ```bash
   # After modifying schema.prisma
   npx prisma migrate dev --name description_of_change
   npx prisma generate
   ```

4. **View Database**
   ```bash
   npx prisma studio
   ```
   Opens GUI at `http://localhost:5555`

5. **Test Changes**
   - Manual testing in browser
   - Test responsive design (Chrome DevTools)
   - Verify calculations with sample data

### 7.2 Version Control

```bash
# Initialize git (if not done)
git init

# Create .gitignore
echo "node_modules/
.next/
.env.local
*.db
*.db-journal" > .gitignore

# Commit changes
git add .
git commit -m "Your commit message"
```

---

## 8. Testing Strategy (Simplified)

### 8.1 Manual Testing Checklist

**Authentication:**
- [ ] Can register new user
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Can logout successfully
- [ ] Protected routes redirect to login

**Financial Profile:**
- [ ] Can add income sources
- [ ] Can edit income sources
- [ ] Can delete income sources
- [ ] Same for assets, expenses, debts
- [ ] Data persists after refresh
- [ ] Totals calculate correctly

**Benefits Calculator:**
- [ ] CPP calculation produces reasonable results
- [ ] Age adjustment factors work correctly
- [ ] OAS calculation works for different residency years
- [ ] Clawback applies at correct income threshold
- [ ] GIS calculation works for single/married

**Retirement Projection:**
- [ ] Projection generates year-by-year data
- [ ] Asset balances decrease appropriately
- [ ] Taxes calculate correctly
- [ ] Charts display properly
- [ ] Different scenarios produce different results

**General:**
- [ ] Responsive design works on mobile/tablet
- [ ] Forms validate input
- [ ] Error messages are helpful
- [ ] Navigation works correctly
- [ ] No console errors

### 8.2 Calculation Validation

Test with known scenarios:
1. **Scenario A:** Age 65, $100k RRSP, CPP at 65 = ?
2. **Scenario B:** Age 60, $500k portfolio, CPP at 70 = ?
3. Compare results to online calculators

---

## 9. Key Features Implementation Priority

### 9.1 Must-Have (Core MVP)

1. ✅ User authentication
2. ✅ Financial profile (income, assets, expenses)
3. ✅ CPP calculator
4. ✅ OAS calculator
5. ✅ Basic retirement projection
6. ✅ Tax calculation (federal + one province)
7. ✅ Dashboard with key metrics
8. ✅ Simple charts

### 9.2 Should-Have (Enhanced MVP)

9. ✅ GIS calculator
10. ✅ Scenario comparison (2-3 scenarios)
11. ✅ RRIF minimum withdrawals
12. ✅ PDF report (basic)
13. ✅ Responsive design
14. ✅ Form validation

### 9.3 Nice-to-Have (If Time Permits)

15. ⭕ Multiple provincial tax calculations
16. ⭕ Advanced withdrawal optimization
17. ⭕ Data export (CSV)
18. ⭕ Print-friendly views
19. ⭕ Onboarding wizard
20. ⭕ Help tooltips throughout

---

## 10. Deployment for Local Demo

### 10.1 Running Locally

```bash
# Development mode (hot reload)
npm run dev

# Production build (faster)
npm run build
npm start
```

### 10.2 Sharing Demo with Others (Same Network)

1. Find your local IP address:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. Update `next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     experimental: {
       serverActions: true,
     },
   };

   module.exports = nextConfig;
   ```

3. Run with custom host:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

4. Share URL with others on same network:
   ```
   http://192.168.1.100:3000
   ```

### 10.3 Demo Data

Create seed script (`prisma/seed.ts`) with realistic demo data:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@retirement.app',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1960-05-15'),
      province: 'ON',
      maritalStatus: 'married',
    },
  });

  // Income
  await prisma.income.create({
    data: {
      userId: user.id,
      type: 'employment',
      description: 'Salary',
      amount: 85000,
      frequency: 'annual',
      isTaxable: true,
    },
  });

  // Assets
  await prisma.asset.createMany({
    data: [
      {
        userId: user.id,
        type: 'rrsp',
        description: 'RRSP Account',
        currentValue: 250000,
      },
      {
        userId: user.id,
        type: 'tfsa',
        description: 'TFSA Account',
        currentValue: 95000,
      },
      {
        userId: user.id,
        type: 'non_registered',
        description: 'Investment Account',
        currentValue: 150000,
      },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      {
        userId: user.id,
        category: 'housing',
        description: 'Mortgage/Property Tax',
        amount: 2500,
        frequency: 'monthly',
        isEssential: true,
      },
      {
        userId: user.id,
        category: 'food',
        description: 'Groceries',
        amount: 800,
        frequency: 'monthly',
        isEssential: true,
      },
      {
        userId: user.id,
        category: 'transportation',
        description: 'Car, Gas, Insurance',
        amount: 600,
        frequency: 'monthly',
        isEssential: true,
      },
      {
        userId: user.id,
        category: 'discretionary',
        description: 'Entertainment, Dining Out',
        amount: 500,
        frequency: 'monthly',
        isEssential: false,
      },
    ],
  });

  // Debt
  await prisma.debt.create({
    data: {
      userId: user.id,
      type: 'mortgage',
      description: 'Home Mortgage',
      currentBalance: 180000,
      interestRate: 4.5,
      monthlyPayment: 1200,
    },
  });

  console.log('✅ Demo data seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx prisma db seed
```

---

## 11. Success Criteria for MVP

### 11.1 Functionality

- ✅ User can create account and login
- ✅ User can enter complete financial profile
- ✅ Government benefits calculate accurately (within 5% of official calculators)
- ✅ Retirement projection shows year-by-year breakdown
- ✅ Dashboard displays key metrics
- ✅ Charts visualize data effectively
- ✅ User can create and compare 2-3 scenarios
- ✅ Basic PDF report can be generated

### 11.2 Technical

- ✅ Application runs on localhost without errors
- ✅ Database operations work correctly
- ✅ No major bugs or crashes
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ Forms validate input appropriately
- ✅ Performance is acceptable (no long loading times)

### 11.3 User Experience

- ✅ UI is clean and intuitive
- ✅ Navigation is logical
- ✅ Error messages are helpful
- ✅ Forms are easy to use
- ✅ Data persists correctly
- ✅ Charts are readable and informative

---

## 12. Known Limitations (MVP)

This MVP is a **pre-production prototype** with the following limitations:

### 12.1 Security
- ⚠️ Basic JWT authentication (not production-grade)
- ⚠️ No rate limiting
- ⚠️ No CSRF protection
- ⚠️ No MFA
- ⚠️ Local SQLite database (not encrypted)

### 12.2 Functionality
- ⚠️ English only (no French)
- ⚠️ Single province tax calculation (Ontario)
- ⚠️ Simplified Monte Carlo (no correlation)
- ⚠️ No email notifications
- ⚠️ No data import/export (except CSV)
- ⚠️ No financial advisor collaboration
- ⚠️ No advanced tax optimization

### 12.3 Infrastructure
- ⚠️ Local hosting only (no cloud deployment)
- ⚠️ SQLite database (not scalable)
- ⚠️ No backups
- ⚠️ No monitoring/logging
- ⚠️ No load balancing or high availability

### 12.4 Legal
- ⚠️ Demo only - not for actual financial decisions
- ⚠️ No disclaimers or legal review
- ⚠️ Calculations not validated by CFP
- ⚠️ Not PIPEDA compliant

**Important:** This MVP is for **demonstration and testing purposes only**. Do not use for real financial planning without proper validation, security hardening, and legal review.

---

## 13. Next Steps (Post-MVP)

### 13.1 Immediate Improvements

1. **Add all provincial tax calculations** (BC, AB, QC, etc.)
2. **French translation** (i18n implementation)
3. **Enhanced PDF reports** (more detailed, professional)
4. **Better error handling** (edge cases)
5. **Input validation improvements**
6. **Help text and tooltips** throughout UI

### 13.2 Short-term Enhancements

1. **Advanced Monte Carlo simulation** (1000 runs, correlation)
2. **Tax optimization algorithms**
3. **Income splitting calculator** (for couples)
4. **RRIF minimum withdrawal compliance**
5. **Estate planning module**
6. **Data export/import** (backup/restore)

### 13.3 Medium-term (Production Readiness)

1. **Cloud deployment** (AWS, Vercel, etc.)
2. **PostgreSQL database** (replace SQLite)
3. **Production authentication** (Auth0, Cognito)
4. **Email notifications** (SendGrid)
5. **Security hardening** (OWASP compliance)
6. **PIPEDA compliance** (privacy policy, consent)
7. **Professional design review**
8. **CFP validation** of calculations

### 13.4 Long-term (Full Product)

1. **Mobile apps** (iOS, Android)
2. **Financial advisor portal**
3. **Bank account integration** (Plaid, Flinks)
4. **CRA data import** (when API available)
5. **AI-powered recommendations**
6. **Community features**
7. **SOC 2 certification**
8. **Multi-language support**

---

## 14. Resources & References

### 14.1 Government Resources

- **CPP:** https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
- **OAS:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html
- **GIS:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html
- **CRA Tax Rates:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html

### 14.2 Technical Documentation

- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **Recharts:** https://recharts.org/
- **React Hook Form:** https://react-hook-form.com/

### 14.3 Calculation Validators

- **CPP Calculator:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/cpp-benefit/amount.html
- **OAS Calculator:** https://estimateursv-oasestimator.service.canada.ca/
- **Tax Calculator:** https://www.wealthsimple.com/en-ca/tool/tax-calculator/

---

## 15. FAQ

**Q: How long will this take to build?**
A: 4-6 weeks part-time, or 2-3 weeks full-time for a solo developer. Faster with a team.

**Q: Do I need to know React/Next.js?**
A: Basic knowledge is helpful. The plan includes specific code examples you can follow.

**Q: Can I deploy this to the web?**
A: Yes, but you'll need to upgrade from SQLite to PostgreSQL and add production-grade security. Consider Vercel for easy Next.js deployment.

**Q: How accurate are the calculations?**
A: They use official government formulas but are simplified. For production, validate with a CFP.

**Q: Can I use this for real financial planning?**
A: No, this MVP is for demonstration only. Real financial planning requires CFP validation, legal review, and proper disclaimers.

**Q: What if I get stuck?**
A: Refer to the documentation links, search Stack Overflow, or ask in Next.js/React communities.

**Q: Can I customize this?**
A: Absolutely! This is your starting point. Add features, change the design, modify calculations as needed.

---

## 16. Conclusion

This Local MVP Development Plan provides a realistic path to building a **working prototype** of the Canadian Retirement Planning application that you can run on your local machine, test, and demonstrate.

**Key Points:**
- ✅ 4-6 week timeline (part-time solo developer)
- ✅ Modern tech stack (Next.js, TypeScript, Tailwind, Prisma)
- ✅ Core functionality (profile, benefits, projections, dashboard)
- ✅ Local SQLite database (no cloud required)
- ✅ Responsive design
- ✅ Demo-ready with sample data

**What You'll Have:**
- A functional web application
- Government benefits calculator (CPP, OAS, GIS)
- Retirement projection engine
- Interactive dashboard and charts
- Basic PDF reports
- Scenario comparison tool

**What's Next:**
1. Follow the setup instructions (Section 6)
2. Build features phase by phase (Section 2)
3. Test thoroughly (Section 8)
4. Add demo data (Section 10.3)
5. Iterate and improve

Good luck with your development! 🚀

---

**Document Version:** 1.0
**Created:** November 14, 2025
**Status:** Ready for Development
**Estimated Completion:** 4-6 weeks
