# RetireZest Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Planned
- UTM parameter tracking for user acquisition
- Conversion event tracking in Google Analytics
- Enhanced multi-scenario comparison
- Additional withdrawal strategies

---

## [1.5.0] - 2026-01-26

### Added - Re-engagement Email System
- **User Segmentation System** (`get_reengagement_segments.js`)
  - Automated segmentation of 47 inactive users into 5 priority groups
  - Behavioral analysis (onboarding status, email verification, data entry)
  - JSON export of segments with user metadata

- **Email Campaign Platform** (`send_reengagement_emails.js`)
  - Dry-run mode for testing email content
  - 5 personalized email templates for each segment
  - Resend API integration for email delivery
  - Rate limiting (600ms delay) to respect API limits
  - Audit logging for campaign tracking
  - Error handling and retry logic

- **Email Templates**
  1. "Your retirement plan is ready to view!" (Onboarding complete users)
  2. "Verify your email to unlock your retirement plan" (Unverified users)
  3. "Quick question about your setup" (Users stuck at Real Estate step)
  4. "Let's finish your RetireZest setup" (Users stuck at Step 5)
  5. "See your retirement plan in 5 minutes" (Users with no data)

- **Campaign Execution**
  - Launched Day 1 campaign to 46 users (Segments 1, 2, 3)
  - 100% delivery success rate
  - Expected 27 conversions (117% user growth)

### Added - Analytics & Monitoring
- User segmentation analytics script
- Province-level geographic distribution tracking
- User signup timeline analysis
- Inactive user behavior analysis
- Campaign performance tracking framework

### Changed
- Updated README.md with production status and complete feature list
- Documented all withdrawal strategies
- Updated tech stack documentation
- Added user engagement metrics to project overview

### Documentation
- Created `docs/REENGAGEMENT_EMAIL_SYSTEM.md` (comprehensive system documentation)
- Created `REENGAGEMENT_EXECUTION_PLAN.md` (4-week campaign strategy)
- Created `CAMPAIGN_LAUNCH_SUMMARY.md` (Day 1 results)
- Updated programmer's guide with latest architecture

---

## [1.4.0] - 2026-01-25

### Added - RRIF Strategy Validation
- Created comprehensive validation report for RRIF Frontload strategy
- Validated 15% withdrawal before OAS, 8% after OAS
- Confirmed CRA minimum withdrawal enforcement
- Documented withdrawal priority order
- Created `RRIF_STRATEGY_VALIDATION_REPORT.md`

### Fixed
- Verified RRIF frontload calculations are 100% accurate
- Confirmed no double-dipping in non-registered account mechanics
- Validated corporate account priority order (tax-optimized)

### Documentation
- Created `NONREG_ACCOUNT_MECHANICS.md` (distribution vs withdrawal logic)
- Created `JUAN_DANIELA_AUDIT_REPORT.md` (user case study)
- Documented strategy calculation logic

---

## [1.3.0] - 2026-01 (Earlier)

### Added
- **Premium Subscription System**
  - Stripe integration for payment processing
  - Free tier with rate limiting (5 early retirement calculations/day)
  - Premium tier with unlimited simulations
  - Subscription management dashboard
  - Webhook handling for payment events

- **Enhanced User Management**
  - Account soft-delete with 30-day grace period
  - Scheduled deletion system
  - Deletion reason tracking
  - Account recovery functionality

### Added - Withdrawal Strategies
- **RRIF Frontload Strategy**
  - 15% withdrawal before OAS (age < 70)
  - 8% withdrawal after OAS (age ≥ 70)
  - CRA minimum enforcement
  - Tax-optimized withdrawal order

- **RRIF Frontload with OAS Protection**
  - Avoids OAS clawback (income threshold $90,997)
  - Dynamic TFSA withdrawal for clawback protection
  - Preserves TFSA for tax-free growth

---

## [1.2.0] - 2025-12

### Added
- **Couples Planning Support**
  - Partner information (name, age, DOB)
  - Partner assets (RRSP, TFSA, Non-registered, Corporate)
  - Partner income sources
  - Joint assets support
  - Joint real estate assets
  - Combined projections

- **Real Estate Assets**
  - Primary residence tracking
  - Rental properties
  - Cottage/vacation properties
  - Ownership split (partner percentages)
  - Property value appreciation

### Added - Python Backend Integration
- FastAPI simulation server (port 8000)
- Advanced tax calculations (all provinces)
- Government benefits integration (CPP, OAS, GIS)
- Corporate account support with dividend tax credits
- Year-by-year projection engine (to age 95)

### Changed
- Extended onboarding wizard from 7 to 11 steps (for couples)
- Improved mobile responsiveness
- Enhanced data visualization

---

## [1.1.0] - 2025-11

### Added
- **Email Verification System**
  - Resend API integration
  - Email verification tokens
  - Verification expiry (7 days)
  - Resend verification email functionality

- **Security Enhancements**
  - Cloudflare Turnstile bot protection
  - Rate limiting for calculators
  - Password reset functionality
  - JWT token refresh mechanism

### Added - Analytics
- Google Analytics 4 integration (GA_ID: G-JSH4T42PTJ)
- Vercel Analytics for page views
- Vercel Speed Insights for performance monitoring
- Audit logging system for user actions

### Changed
- Migrated from SQLite to PostgreSQL (Neon)
- Updated database schema with email verification fields
- Improved error handling and user feedback

---

## [1.0.0] - 2025-10

### Added - Core Features
- **Authentication System**
  - User registration with bcryptjs password hashing
  - JWT-based session management (httpOnly cookies)
  - Login/logout functionality
  - Protected routes with middleware

- **Government Benefits Calculators**
  - CPP Calculator (contribution history, age adjustment)
  - OAS Calculator (residency-based, clawback)
  - GIS Calculator (income-tested)

- **Financial Profile Management**
  - Income sources (employment, pension, investment, rental, other)
  - Assets (RRSP, TFSA, non-registered, corporate)
  - Expenses (monthly/annual)
  - Debts (mortgage, loans, credit cards)

- **Retirement Projection**
  - Year-by-year projections to age 95
  - Tax calculations (federal + provincial)
  - RRIF minimum withdrawals
  - Asset depletion analysis
  - Multiple scenario support

- **Visualizations**
  - Interactive dashboard with Recharts
  - Income breakdown charts
  - Cash flow projections
  - Asset balance trajectories
  - Tax visualization

- **Reports**
  - PDF report generation (jsPDF)
  - Executive summary
  - Detailed projections
  - Customizable branding

### Infrastructure
- Next.js 15 with App Router
- TypeScript 5
- Tailwind CSS
- Prisma ORM
- PostgreSQL database (Neon)
- Vercel hosting

---

## Database Schema Evolution

### Current Schema (v1.5.0)
- **User**: 40+ fields including email verification, subscription, onboarding tracking
- **Income**: Employment, pension, investment, rental income
- **Asset**: RRSP, TFSA, non-registered, corporate accounts
- **RealEstateAsset**: Primary, rental, cottage properties
- **Expense**: Monthly/annual expenses
- **Debt**: Mortgages, loans, credit cards
- **Scenario**: Retirement scenarios with assumptions
- **Projection**: Calculated retirement projections
- **SimulationRun**: Simulation execution history
- **AuditLog**: User action tracking
- **UserFeedback**: User feedback collection
- **SavedSimulationScenario**: Saved simulation configurations

### Proposed Additions (Future)
- **EmailCampaign**: Campaign tracking
- **EmailLog**: Individual email delivery tracking
- **UserAcquisition**: UTM parameter tracking
- **ConversionEvent**: Google Analytics conversion tracking

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/verify-email` - Verify email address

### Financial Profile
- `GET /api/profile/income` - Get income sources
- `POST /api/profile/income` - Create income source
- `PUT /api/profile/income/:id` - Update income source
- `DELETE /api/profile/income/:id` - Delete income source
- (Similar routes for assets, expenses, debts, real-estate)

### Benefits Calculators
- `POST /api/benefits/cpp/estimate` - Calculate CPP estimate
- `POST /api/benefits/oas/estimate` - Calculate OAS estimate
- `POST /api/benefits/gis/estimate` - Calculate GIS estimate

### Simulations
- `POST /api/simulation/run` - Run retirement simulation (calls Python backend)
- `GET /api/simulation/saved` - Get saved simulations
- `POST /api/simulation/save` - Save simulation scenario
- `DELETE /api/simulation/:id` - Delete simulation

### Subscriptions
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/stripe/create-portal-session` - Create customer portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks

---

## Environment Variables

### Production (.env.local)
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://retirezest.com"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="contact@retirezest.com"

# Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PREMIUM_MONTHLY_PRICE_ID="price_..."
STRIPE_PREMIUM_YEARLY_PRICE_ID="price_..."

# Analytics
NEXT_PUBLIC_GA_ID="G-JSH4T42PTJ"
NEXT_PUBLIC_APP_URL="https://retirezest.com"

# Security
NEXT_PUBLIC_TURNSTILE_SITE_KEY="..."

# Testing
E2E_TEST_MODE="false"
NEXT_PUBLIC_E2E_TEST_MODE="false"
```

---

## Deployment

### Current Infrastructure
- **Frontend**: Vercel (retirezest.com)
- **Backend**: Railway (Python FastAPI)
- **Database**: Neon PostgreSQL (serverless)
- **Email**: Resend
- **Payments**: Stripe
- **CDN**: Vercel Edge Network

### Deployment Commands
```bash
# Vercel (automatic on git push to main)
vercel --prod

# Railway (Python backend)
railway up

# Database migrations
npx prisma migrate deploy
```

---

## Testing

### Test Coverage
- ✅ Calculation tests (CPP, OAS, GIS, tax calculations)
- ✅ End-to-end tests (Playwright) for all withdrawal strategies
- ✅ Edge case tests (depletion, high income, OAS clawback)
- ✅ Email delivery tests
- ✅ Stripe payment flow tests

### Test Commands
```bash
npm run test                    # Unit tests
npm run test:e2e               # E2E tests
npm run test:e2e:strategies    # Strategy tests
npm run test:e2e:edge-cases    # Edge case tests
```

---

## Performance Metrics

### Current Stats (Jan 26, 2026)
- **Total Users**: 67
- **Active Users**: 23 (34.3%)
- **Geographic Distribution**: ON (32.8%), AB (20.9%), BC (11.9%), QC (9.0%)
- **Average Signup Rate**: 1.8 users/day (last 30 days)
- **Email Delivery Rate**: 100% (46/46 sent)
- **Page Load Time**: <1.5s (Vercel Speed Insights)

### Growth Targets (Week 1)
- **Email verifications**: +18 users
- **Onboarding completions**: +8-10 users
- **First simulations**: +15-20 users
- **Total active users**: 38-48 (65-109% growth)

---

## Contributors

- **Development Team**: RetireZest
- **Backend Architecture**: Juan C. (Python simulation engine)
- **Frontend Development**: RetireZest Team
- **Email Campaigns**: Launched Jan 26, 2026

---

## License

Private project - All rights reserved

---

**Last Updated**: January 26, 2026
**Current Version**: 1.5.0
**Next Release**: 1.6.0 (UTM tracking, enhanced analytics)
