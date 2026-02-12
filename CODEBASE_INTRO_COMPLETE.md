# RetireZest - Complete Codebase Documentation

## 🚀 Overview
RetireZest is a comprehensive Canadian retirement planning platform that combines sophisticated financial modeling with user-friendly interfaces. Built with Next.js 15, React, TypeScript, and Python, it provides CRA-compliant tax calculations, Monte Carlo simulations, and personalized retirement projections.

## 📁 Project Structure

```
retirezest/
├── webapp/                     # Main application (Next.js 15)
│   ├── app/                   # App router pages and API routes
│   ├── components/            # React components
│   ├── lib/                   # Core business logic
│   ├── utils/                 # Utility functions
│   ├── prisma/                # Database schema and migrations
│   ├── python_api/            # Python simulation engine
│   ├── emails/                # Email templates
│   ├── scripts/               # Admin and utility scripts
│   └── public/                # Static assets
├── docs/                      # Documentation
└── marketing/                 # Marketing website (separate)
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: Custom components + shadcn/ui
- **State Management**: React hooks + Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts 2.14.1
- **Animation**: Framer Motion 11.18.0

### Backend
- **API**: Next.js API Routes + Python FastAPI
- **Database**: SQLite (local) / PostgreSQL (production)
- **ORM**: Prisma 6.0.0
- **Authentication**: JWT with httpOnly cookies
- **Email**: React Email + Resend
- **File Processing**: XLSX, PDF generation
- **Background Jobs**: Node cron for scheduled tasks

### Python Simulation Engine
- **Framework**: FastAPI 0.104.1
- **Data Processing**: Pandas 2.1.3, NumPy 1.26.2
- **Validation**: Pydantic 2.5.2
- **Server**: Uvicorn 0.24.0

## 🗄️ Database Schema (12 Models)

### Core Models
1. **User** - Complete user profile with subscription, couples support, usage tracking
2. **Income** - 8 types (employment, cpp, oas, pension, rental, investment, business, other)
3. **Asset** - 10+ types including GIC-specific configs, early RRIF withdrawals
4. **Expense** - Recurring and one-time planned expenses with inflation indexing
5. **Debt** - 7 types with payment tracking and amortization
6. **Scenario** - Complete financial snapshots with cached projections
7. **Projection** - Year-by-year retirement projection results
8. **SimulationRun** - Full input/output snapshots for reproducibility
9. **SavedSimulationScenario** - User-saved scenarios for comparison
10. **RealEstateAsset** - Property-specific tracking with downsizing options
11. **AuditLog** - GDPR-compliant action tracking
12. **UserFeedback** - Advanced feedback with auto-calculated priority

## 🔐 Authentication & Security

### Authentication System
- JWT-based with httpOnly cookies
- Email verification required
- Password reset flow with expiring tokens
- Session management with 7-day refresh
- Account recovery (30-day grace period after deletion)

### Security Features
- **Rate Limiting**:
  - Login: 5 attempts per 15 minutes
  - Registration: 3 per hour per IP
  - Simulations: 10 per day (free tier)
  - Early retirement calcs: 3 per day (free tier)
- **CSRF Protection**: Token-based on all state-changing operations
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Protection**: React's built-in escaping + Content Security Policy
- **Admin Access**: Role-based with separate dashboards

## 📊 API Endpoints (50+ Routes)

### Authentication & Account (10 routes)
- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/login` - JWT authentication
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Password reset initiation
- `POST /api/auth/reset-password` - Password reset completion
- `GET /api/auth/me` - Current user details
- `DELETE /api/auth/account` - Account deletion (soft delete)

### Profile Management (6 routes)
- `GET /api/profile` - Get profile data
- `PUT /api/profile` - Update profile
- `PUT /api/profile/basic-info` - Update basic information
- `PUT /api/profile/partner` - Update partner details
- `PUT /api/profile/retirement-goals` - Update retirement targets
- `GET /api/profile/completion` - Profile completion percentage

### Financial Data Management (20+ routes)
- **Income**: CRUD operations for 8 income types
- **Assets**: CRUD with GIC-specific management
- **Expenses**: Recurring and one-time expense planning
- **Debts**: CRUD with amortization calculations
- **Scenarios**: Complete snapshot management
- **Projections**: Year-by-year projection storage

### Simulation & Calculations (8 routes)
- `POST /api/simulate` - Monte Carlo retirement simulation
- `POST /api/simulate/early-retirement` - Early retirement analysis
- `GET /api/simulate/history` - Simulation run history
- `GET /api/simulate/{id}` - Specific simulation details
- `POST /api/calculate/cpp` - CPP benefit calculation
- `POST /api/calculate/oas` - OAS/GIS benefit calculation
- `POST /api/calculate/tax` - Federal/provincial tax calculation
- `POST /api/optimize/strategy` - Withdrawal strategy optimization

### Admin Dashboards (9 routes)
- `GET /api/admin/activity` - User activity analytics
- `GET /api/admin/activity/export` - Activity data export (CSV)
- `GET /api/admin/feedback` - Feedback management
- `GET /api/admin/feedback/{id}` - Specific feedback details
- `PUT /api/admin/feedback/{id}/status` - Update feedback status
- `GET /api/admin/deletions` - Account deletion analytics
- `GET /api/admin/users` - User management
- `GET /api/admin/users/{id}/activity` - User-specific activity
- `GET /api/admin/stats` - Platform-wide statistics

### Subscription & Billing (3 routes)
- `POST /api/subscription/create` - Create Stripe subscription
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/status` - Current subscription details

### Utilities (5 routes)
- `GET /api/health` - Health check endpoint
- `GET /api/csrf` - CSRF token generation
- `POST /api/contact` - Contact form submission
- `POST /api/feedback` - User feedback submission
- `GET /api/unsubscribe` - Email unsubscribe

## 💼 Business Logic & Calculations

### Tax Calculations (2026 CRA-Compliant)
- **Federal Tax**: Progressive brackets with personal exemption
- **Provincial Tax**: Province-specific rates and credits
- **Credits**: Age amount, pension income, disability, caregiver
- **Deductions**: RRSP, pension splitting, medical expenses
- **Estate Tax**: Deemed disposition calculations

### Government Benefits
- **CPP**: Age-based adjustments (60-70), max $1,364.60/month
- **OAS**: Clawback calculations, deferral bonuses
- **GIS**: Income-tested supplement calculations
- **Provincial Benefits**: GAINS (Ontario), Shelter Aid (Ontario)

### Investment & Withdrawal Strategies
1. **Traditional**: RRIF → Non-Registered → TFSA
2. **Tax-Optimized**: Non-Registered → RRIF → TFSA
3. **Balanced**: Proportional withdrawals
4. **TFSA-First**: Preserve tax-free growth
5. **Custom**: User-defined order
6. **Optimizer**: AI-selected based on 4-principle scoring

### Monte Carlo Simulation
- 1000+ iterations with return volatility
- Inflation modeling (deterministic or stochastic)
- Success probability calculation
- Percentile outcomes (10th, 25th, 50th, 75th, 90th)
- Sequence of returns risk analysis

### GIC-Specific Features
- Term tracking (3-60 months)
- Compounding frequencies (annual, semi-annual, quarterly, monthly)
- Auto-reinvestment strategies
- Maturity notifications
- Rate comparison tools

## 📧 Email System

### Transactional Emails (React Email Templates)
1. **Welcome Email** - Onboarding with verification link
2. **Email Verification** - Activation link with 24h expiry
3. **Password Reset** - Secure reset link with 1h expiry
4. **Simulation Ready** - Results notification with summary
5. **Subscription Confirmation** - Payment receipt
6. **Account Deletion Warning** - 30-day recovery notice
7. **Feedback Received** - Acknowledgment with ticket number

### Email Features
- HTML/Text multipart messages
- Responsive templates
- Tracking pixels for open rates
- Unsubscribe links (one-click)
- SPF/DKIM authentication
- Bounce handling

## 🎨 UI/UX Features

### Component Library (40+ Components)
- **Navigation**: Responsive nav, breadcrumbs, sidebars
- **Forms**: Multi-step wizards, validation, auto-save
- **Data Display**: Tables, charts, cards, stats
- **Feedback**: Toasts, modals, loading states
- **Inputs**: Currency, percentage, date pickers
- **Visualizations**: Interactive charts, progress bars

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader optimized
- Focus management
- ARIA labels and roles
- Color contrast 4.5:1 minimum

### Performance Optimizations
- Route-based code splitting
- Image optimization (Next.js Image)
- Font optimization (local hosting)
- API response caching
- Database query optimization
- Static generation where possible

## 🧪 Testing Infrastructure

### Test Coverage
- **Unit Tests**: 200+ tests for utilities and calculations
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user flows (Playwright)
- **Performance Tests**: Lighthouse CI integration

### Test Data
- Seed data for development
- Mock data generators
- Test user accounts with various scenarios

## 🔧 Developer Tools & Scripts

### Development Scripts (160+ utilities)
```bash
# Database Management
npm run db:migrate        # Run migrations
npm run db:seed           # Seed development data
npm run db:reset          # Reset and reseed

# Testing
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:e2e          # E2E tests
npm run test:coverage     # Coverage report

# Analysis
npm run analyze:bundle    # Bundle size analysis
npm run analyze:deps      # Dependency audit
npm run lint             # ESLint check
npm run typecheck        # TypeScript validation

# Admin Scripts
node scripts/admin/export-users.js         # Export user data
node scripts/admin/cleanup-old-sessions.js # Session cleanup
node scripts/admin/generate-reports.js     # Analytics reports
node scripts/admin/migrate-data.js         # Data migration
```

### Environment Variables (25+ configs)
```env
# Core
NODE_ENV                  # development/production
DATABASE_URL              # Database connection
NEXTAUTH_SECRET          # JWT signing secret

# APIs
PYTHON_API_URL           # Simulation engine URL
RESEND_API_KEY          # Email service
STRIPE_SECRET_KEY       # Payment processing
TURNSTILE_SECRET_KEY    # Bot protection

# Features
ENABLE_ADMIN_DASHBOARD   # Admin panel toggle
ENABLE_PREMIUM_FEATURES  # Premium features flag
MAINTENANCE_MODE        # Maintenance toggle

# Limits
MAX_FREE_SIMULATIONS    # Free tier limit (10)
MAX_LOGIN_ATTEMPTS      # Rate limit (5)
SESSION_DURATION        # JWT expiry (7d)
```

## 🚀 Hidden/Advanced Features

### Admin-Only Features
1. **Activity Dashboard** - Real-time user analytics
2. **Feedback Manager** - Priority-based ticket system
3. **Deletion Analytics** - Churn analysis with reasons
4. **User Impersonation** - Support tool (audit logged)
5. **Database Export** - GDPR compliance tools
6. **Strategy Analysis** - Optimization performance metrics

### Premium Features
1. **Unlimited Simulations** - No daily limits
2. **Advanced Scenarios** - 10+ concurrent scenarios
3. **Data Export** - Excel/PDF reports
4. **Priority Support** - Direct email channel
5. **Early Access** - Beta features
6. **API Access** - Programmatic access (coming soon)

### Experimental Features (Feature Flags)
1. **AI Advisor** - GPT-powered recommendations
2. **Social Sharing** - Anonymized comparisons
3. **Mobile App API** - REST endpoints for mobile
4. **Webhooks** - Event notifications
5. **Batch Processing** - Multiple scenario runs
6. **Real-time Collaboration** - Couples planning together

### Performance Features
1. **Query Caching** - 5-minute TTL on expensive queries
2. **Result Caching** - Projection results stored
3. **CDN Integration** - Static asset delivery
4. **Database Indexes** - Optimized query paths
5. **Connection Pooling** - Database connection reuse
6. **Request Batching** - Multiple API calls combined

## 📈 Analytics & Monitoring

### Metrics Tracked
- User engagement (DAU/MAU)
- Feature adoption rates
- Simulation completion rates
- Conversion funnel metrics
- Error rates and types
- Performance metrics (Core Web Vitals)
- Revenue metrics (MRR, churn, LTV)

### Monitoring Tools
- Application logs (structured JSON)
- Error tracking (with stack traces)
- Performance monitoring (response times)
- Uptime monitoring (health checks)
- Database query analysis
- Email delivery rates

## 🔄 Data Flow Architecture

### Request Lifecycle
1. **Client Request** → Next.js middleware (auth, CSRF)
2. **API Route Handler** → Validation (Zod schemas)
3. **Business Logic** → Database queries (Prisma)
4. **External Services** → Python API, Stripe, Email
5. **Response** → JSON with consistent structure
6. **Client Update** → React state management

### Data Synchronization
- Real-time updates via polling
- Optimistic UI updates
- Conflict resolution (last-write-wins)
- Data versioning for scenarios
- Audit trail for all changes

## 🌐 Deployment & Infrastructure

### Deployment Pipeline
1. **Development** - Local SQLite, hot reload
2. **Staging** - PostgreSQL, feature branches
3. **Production** - PostgreSQL (Neon), CDN, monitoring

### Infrastructure Requirements
- Node.js 18.17+
- Python 3.11+
- PostgreSQL 15+ or SQLite 3.35+
- 2GB RAM minimum
- 10GB storage for database

## 📚 Additional Resources

### Documentation
- API Documentation: `/docs/api`
- Component Storybook: `/storybook`
- Python API Docs: `/python_api/docs`
- Database Schema: `/prisma/schema.prisma`

### Support Channels
- GitHub Issues: Bug reports and features
- Email Support: Premium users
- Documentation: Comprehensive guides
- Video Tutorials: YouTube channel (coming soon)

---

*Last Updated: February 2025*
*Version: 2.0.0*
*Total Files: 500+*
*Lines of Code: 50,000+*
*Test Coverage: 75%*