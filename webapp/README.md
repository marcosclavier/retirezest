# RetireZest - Canadian Retirement Planning Platform

A comprehensive web application for Canadian seniors to plan their retirement, calculate government benefits (CPP, OAS, GIS), and project retirement income with advanced withdrawal strategies.

## Project Status

🚀 **Production** - Active Users: 67

### Production Features
✅ Next.js 15 with TypeScript
✅ Tailwind CSS with responsive design
✅ PostgreSQL database (Neon) with Prisma ORM
✅ Authentication & email verification (Resend)
✅ Couples planning support
✅ Complete onboarding wizard (7-11 steps)
✅ Government benefits calculators (CPP, OAS, GIS)
✅ Advanced retirement projection engine (Python backend)
✅ Multiple withdrawal strategies (5 strategies including RRIF Frontload)
✅ Tax calculations (federal + provincial)
✅ Interactive dashboards & visualizations
✅ PDF report generation
✅ Premium subscriptions (Stripe)
✅ Re-engagement email campaigns
✅ User analytics & tracking
✅ Cloudflare Turnstile (bot protection)
✅ Vercel Analytics & Speed Insights
✅ Google Analytics 4 integration

### Recently Completed (Jan-Feb 2026)
✅ **Dual Simulation Limit System** (Feb 2026) - Freemium monetization
✅ Re-engagement email campaign system
✅ User segmentation & analytics
✅ Email automation with Resend
✅ Audit logging for user actions
✅ RRIF Frontload strategy validation
✅ AI-powered GIS Strategy Assessment (for minimize-income strategy)
✅ Enhanced UI contrast and accessibility improvements

### In Progress
🔄 User acquisition tracking (UTM parameters)
🔄 Conversion tracking in Google Analytics

### Upcoming
📋 Additional withdrawal strategies
📋 Enhanced tax optimization
📋 Multi-scenario comparison improvements

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router), React 18, TypeScript 5
- **Styling:** Tailwind CSS with custom components
- **UI Components:** Radix UI primitives
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation
- **PDF Generation:** jsPDF, html2canvas
- **Analytics:** Google Analytics 4, Vercel Analytics, Speed Insights
- **Security:** Cloudflare Turnstile (bot protection)

### Backend
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Prisma Client
- **Authentication:** JWT with httpOnly cookies, bcryptjs
- **Email:** Resend API
- **Payments:** Stripe (subscriptions)
- **Python Backend:** FastAPI + uvicorn (simulation engine)

### Infrastructure
- **Hosting:** Vercel (frontend), Railway (Python backend)
- **Database:** Neon PostgreSQL
- **Email Service:** Resend
- **CDN:** Vercel Edge Network
- **Environment:** Node.js 20+, Python 3.11+

---

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install additional packages:**
   ```bash
   npm install prisma @prisma/client
   npm install react-hook-form @hookform/resolvers zod
   npm install jose bcryptjs
   npm install @types/bcryptjs --save-dev
   npm install recharts date-fns
   npm install clsx tailwind-merge
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Create database and run migrations
   npx prisma migrate dev --name init
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

---

## Project Structure

```
webapp/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected routes
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── benefits/
│   │   ├── projection/
│   │   └── scenarios/
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── benefits/
│   │   └── projection/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # UI components
│   ├── layout/              # Layout components
│   ├── dashboard/           # Dashboard components
│   ├── charts/              # Chart components
│   └── forms/               # Form components
├── lib/                     # Utility libraries
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Authentication utilities
│   ├── utils.ts            # General utilities
│   └── calculations/       # Calculation functions
│       ├── cpp.ts          # CPP calculator
│       ├── oas.ts          # OAS calculator
│       ├── gis.ts          # GIS calculator
│       ├── tax.ts          # Tax calculator
│       └── projection.ts   # Retirement projection
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── types/
│   └── index.ts            # TypeScript type definitions
├── .env                     # Environment variables
├── package.json            # Dependencies
└── README.md               # This file
```

---

## Environment Variables

Create/edit `.env` file with the following:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (change this!)
JWT_SECRET="your-super-secret-jwt-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Database Schema

The application uses the following database models:

### Core Models
- **User** - User accounts and profiles
- **Income** - Income sources (employment, pension, investment, rental)
- **Asset** - Assets (RRSP, TFSA, non-registered, real estate)
- **Expense** - Monthly/annual expenses
- **Debt** - Debts (mortgage, loans, credit cards)

### Planning Models
- **Scenario** - Retirement scenarios with different assumptions
- **Projection** - Calculated retirement projections

---

## Available Scripts

```bash
# Development
npm run dev          # Start Next.js development server (port 3001)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run analyze      # Analyze bundle size

# Testing
npm run test                   # Run calculation tests
npm run test:e2e              # Run end-to-end tests (Playwright)
npm run test:e2e:ui           # Run E2E tests in UI mode
npm run test:e2e:strategies   # Test withdrawal strategies
npm run test:e2e:edge-cases   # Test edge cases

# Database
npx prisma studio              # Open database GUI (port 5555)
npx prisma migrate dev         # Create and apply migration
npx prisma migrate reset       # Reset database
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema without migration

# Analytics & User Management
npm run analytics              # Run user analytics script
node get_reengagement_segments.js    # Generate user segments
node send_reengagement_emails.js <segment> [--send]  # Send re-engagement emails
node test_email.js             # Test email configuration

# Python Backend (from juan-retirement-app/)
python3 -m uvicorn api.main:app --reload  # Start Python simulation server (port 8000)
```

---

## Features

### Authentication & User Management ✅
- User registration with email verification
- Login/logout with JWT session management
- Password reset functionality
- Email verification with Resend
- Cloudflare Turnstile bot protection
- Account soft-delete with 30-day grace period

### Financial Profile ✅
- Income management (employment, pension, investment, rental, other)
- Asset tracking (RRSP, TFSA, non-registered, corporate)
- Real estate assets (primary, rental, cottage)
- Expense categorization
- Debt tracking
- Couples planning (partner assets, income, joint assets)
- Net worth calculation

### Government Benefits Calculators ✅
- **CPP Calculator**
  - Contribution history input
  - Estimate based on average YMPE
  - Age adjustment factors (60-70)
  - Optimal timing recommendations

- **OAS Calculator**
  - Residency-based calculation
  - Clawback calculator (income over $90,997)
  - Age 75+ increase

- **GIS Calculator**
  - Income-tested eligibility
  - Single vs married calculations

### Retirement Projection Engine ✅
- Year-by-year projections (to age 95)
- Advanced tax calculations (federal + provincial, all provinces)
- RRIF minimum withdrawals (CRA tables)
- Asset depletion analysis
- Multiple withdrawal strategies:
  1. **Constant Percentage** - Fixed withdrawal rate
  2. **RRIF Minimum** - CRA minimum withdrawals only
  3. **RRIF Frontload** - 15% before OAS, 8% after OAS (tax-optimized)
  4. **RRIF Frontload with OAS Protection** - Avoids OAS clawback
  5. **Tax-Optimized** - Minimizes lifetime taxes
  6. **Minimize Income** - Designed to maximize GIS eligibility
- OAS clawback avoidance
- Government benefits integration (CPP, OAS, GIS)
- Corporate account support with dividend tax credits
- Multiple scenario comparison
- **AI-Powered Strategy Insights** (for minimize-income strategy):
  - GIS eligibility analysis with 30-year projection
  - Strategy effectiveness rating (0-10)
  - Personalized recommendations with priority levels
  - Optimization opportunities identification
  - Key milestones timeline
  - Visual GIS feasibility assessment

### Visualizations & Dashboard ✅
- Interactive retirement dashboard
- Income breakdown charts
- Cash flow projections (30 years)
- Asset balance trajectories
- Tax visualization by source
- Estate value projections
- Government benefits timeline

### Reports & Export ✅
- PDF report generation (jsPDF)
- Executive summary
- Year-by-year detailed projections
- Tax breakdown analysis
- Account balance charts
- Customizable branding (company name/logo)

### User Engagement & Analytics ✅
- **Re-engagement Email System**
  - Automated user segmentation (5 priority segments)
  - Personalized email templates
  - Dry-run testing mode
  - Email delivery via Resend API
  - Audit logging for campaign tracking
- **Analytics**
  - Google Analytics 4 integration
  - Vercel Analytics (page views, performance)
  - User growth tracking
  - Geographic distribution (province-level)
  - Conversion funnel monitoring

### Subscription & Payments ✅
- **Dual Simulation Limit System**:
  - Unverified users: 3 lifetime simulations (encourages email verification)
  - Verified free tier: 10 simulations/day (freemium model)
  - Premium tier: Unlimited simulations
- Stripe integration for premium subscriptions
- Subscription management dashboard
- Webhook handling for payment events
- Progressive conversion funnel (unverified → verified → premium)

---

## Development Workflow

### 1. Daily Development

```bash
# Start the dev server
npm run dev

# In another terminal, open Prisma Studio to view database
npx prisma studio
```

### 2. Making Database Changes

After editing `prisma/schema.prisma`:

```bash
# Create a new migration
npx prisma migrate dev --name description_of_change

# Regenerate Prisma client
npx prisma generate
```

### 3. Testing

- Manual testing in browser
- Test responsive design (Chrome DevTools)
- Verify calculations with real data
- Cross-browser testing

---

## Key Calculations

### CPP Calculation
```typescript
Monthly CPP = (Average YMPE over contributory period × 25%) / 12
Max monthly CPP (2025) = $1,433.00

Age adjustment factors:
- Age 60: -36% (0.64 multiplier)
- Age 65: 0% (1.0 multiplier)
- Age 70: +42% (1.42 multiplier)
```

### OAS Calculation
```typescript
Full OAS (2025) = $713.34/month at age 65
Residency requirement: 40 years in Canada after age 18
Partial OAS: (Years in Canada / 40) × Full OAS

Clawback threshold (2025): $90,997 annual income
Clawback rate: 15% of income above threshold
```

### GIS Calculation
```typescript
Max GIS (2025):
- Single: $1,065.47/month
- Married: $641.35/month

Income tested based on previous year's income
```

---

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Financial Profile
- `GET /api/profile/income` - Get all income sources
- `POST /api/profile/income` - Create income source
- `PUT /api/profile/income/:id` - Update income source
- `DELETE /api/profile/income/:id` - Delete income source

(Similar routes for assets, expenses, debts)

### Benefits
- `POST /api/benefits/cpp/estimate` - Calculate CPP estimate
- `POST /api/benefits/oas/estimate` - Calculate OAS estimate
- `POST /api/benefits/gis/estimate` - Calculate GIS estimate

### Projections
- `POST /api/projection` - Generate retirement projection
- `GET /api/projection/:id` - Get projection results

### Scenarios
- `GET /api/scenarios` - Get all scenarios
- `POST /api/scenarios` - Create scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario

---

## Troubleshooting

### Port 3000 already in use
```bash
npx kill-port 3000
# or use a different port
npm run dev -- -p 3001
```

### Database locked
Close Prisma Studio and any database connections, then:
```bash
npx prisma migrate reset
```

### Prisma client not found
```bash
npx prisma generate
```

### Dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Resources

### Documentation
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Recharts](https://recharts.org/)

### Government Resources
- [CPP Information](https://www.canada.ca/en/services/benefits/publicpensions/cpp.html)
- [OAS Information](https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html)
- [GIS Information](https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html)
- [CRA Tax Rates](https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html)

---

## Important Notes

⚠️ **This is a development/demo application:**
- SQLite database (not production-ready)
- Basic JWT authentication (not production-grade)
- English only (no French translation yet)
- Local hosting only
- For demonstration purposes only

⚠️ **Not for actual financial planning:**
- Calculations need CFP validation
- No legal disclaimers
- Not PIPEDA compliant
- Do not use for real financial decisions

---

## Contributing

This is an MVP project. Contributions welcome!

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## License

Private project - All rights reserved

---

## Contact

For questions or issues, please refer to the development plan documents in the parent directory.

---

**Happy Coding! 🚀**
