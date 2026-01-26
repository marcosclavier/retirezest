# RetireZest Production Infrastructure

## Overview

RetireZest is built using a modern, scalable cloud infrastructure leveraging best-in-class services for deployment, payment processing, and communication.

**GitHub Repository**: https://github.com/marcosclavier/retirezest

---

## Infrastructure Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                   (Next.js Frontend)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Global CDN                                           ││
│  │  • Automatic SSL/TLS                                    ││
│  │  • Edge Functions                                       ││
│  │  • Static Asset Optimization                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
    ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Railway    │ │   Stripe    │ │   Resend    │
    │  (Backend)   │ │ (Payments)  │ │   (Email)   │
    └──────────────┘ └─────────────┘ └─────────────┘
            │
            ↓
    ┌──────────────┐
    │  PostgreSQL  │
    │  (Database)  │
    └──────────────┘
```

---

## 1. GitHub (Source Control)

### Repository Configuration

**URL**: https://github.com/marcosclavier/retirezest
**Organization**: marcosclavier
**Visibility**: Private
**Default Branch**: `main`

### Repository Structure

```
marcosclavier/retirezest/
├── .github/
│   └── DEPLOYMENT.md              # Deployment guide
│
├── webapp/                         # Frontend (Next.js)
│   ├── app/                        # Next.js App Router
│   ├── components/                 # React components
│   ├── lib/                        # Utilities & business logic
│   ├── prisma/                     # Database schema
│   │   ├── schema.prisma          # Prisma schema (PostgreSQL)
│   │   └── migrations/            # Database migrations
│   ├── public/                     # Static assets
│   ├── package.json               # Frontend dependencies
│   └── .env.example               # Environment variables template
│
├── juan-retirement-app/            # Backend (Python)
│   ├── api/                        # FastAPI application
│   │   ├── main.py                # API entry point
│   │   ├── routes/                # API endpoints
│   │   ├── models/                # Pydantic models
│   │   └── utils/                 # Converters & helpers
│   ├── modules/                    # Core simulation engine
│   │   ├── simulation.py          # Main simulation logic
│   │   ├── models.py              # Internal models
│   │   ├── tax_calc.py            # Tax calculations
│   │   └── strategies/            # Withdrawal strategies
│   ├── requirements.txt           # Python dependencies
│   └── Dockerfile                 # Container configuration
│
├── README.md                       # Main documentation
├── ARCHITECTURE.md                # Technical architecture
└── PRODUCTION_INFRASTRUCTURE.md   # This file
```

### Webhooks & Integrations

**Vercel Integration**:
- **Trigger**: Push to `main` branch
- **Action**: Automatic build and deployment
- **Scope**: `webapp/` directory

**Railway Integration**:
- **Trigger**: Push to `main` branch
- **Action**: Automatic build and deployment
- **Scope**: `juan-retirement-app/` directory

### Branch Protection

**Main Branch Rules**:
- Require pull request reviews
- Require status checks to pass
- Include administrators
- Restrict force pushes

---

## 2. Vercel (Frontend Hosting)

### Platform Details

**Service**: Vercel
**Website**: https://vercel.com
**Purpose**: Next.js application hosting and edge functions

### Project Configuration

**Project Name**: `webapp`
**Project ID**: `prj_o95HAbwz9ARD1NIVNshKr4vN3WW3`
**Organization ID**: `team_gUAdSHxCVTaxoGyCYK8iyAUg`
**Framework**: Next.js 15.5.9
**Root Directory**: `webapp/`

### Deployment Settings

**Build Configuration**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

**Environment Variables** (Production):
```bash
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Authentication
JWT_SECRET="[secret-key]"
NEXTAUTH_URL="https://[production-domain]"
NEXTAUTH_SECRET="[secret-key]"

# API Endpoints
PYTHON_API_URL="https://[railway-domain]"
NEXT_PUBLIC_API_URL="https://[production-domain]/api"

# Stripe Integration
STRIPE_SECRET_KEY="sk_live_[secret]"
STRIPE_PUBLISHABLE_KEY="pk_live_[public]"
STRIPE_WEBHOOK_SECRET="whsec_[secret]"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_[public]"

# Email (Resend)
RESEND_API_KEY="re_[secret]"
RESEND_FROM_EMAIL="noreply@retirezest.com"

# App Configuration
NEXT_PUBLIC_APP_URL="https://[production-domain]"
NODE_ENV="production"
```

### Features Enabled

- **Edge Functions**: API routes run at the edge
- **Automatic SSL**: Free SSL certificates via Let's Encrypt
- **CDN**: Global edge network for fast content delivery
- **Image Optimization**: Automatic image optimization
- **Analytics**: Real-time performance monitoring
- **Logs**: Centralized logging for debugging

### Deployment Process

1. **Trigger**: Push to `main` branch on GitHub
2. **Build**: Vercel clones repo and runs `npm run build`
3. **Test**: Runs build verification
4. **Deploy**: Uploads to global CDN
5. **DNS**: Updates production URL
6. **Notify**: Sends deployment notification

**Build Time**: ~2-3 minutes
**Rollback Time**: Instant (promote previous deployment)

### Custom Domains

**Primary Domain**: `[your-domain].com`
**Subdomain**: `www.[your-domain].com`
**SSL**: Automatic via Vercel

---

## 3. Railway (Backend Hosting)

### Platform Details

**Service**: Railway
**Website**: https://railway.app
**Purpose**: Python FastAPI backend hosting

### Project Configuration

**Project Name**: `retirezest-backend`
**Framework**: FastAPI (Python)
**Entry Point**: `juan-retirement-app/api/main.py`
**Port**: 8000 (configurable via `PORT` env variable)

### Deployment Settings

**Build Configuration**:
- **Build Command**: `pip install -r juan-retirement-app/requirements.txt`
- **Start Command**: `cd juan-retirement-app && python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- **Dockerfile**: Use `juan-retirement-app/Dockerfile` if present

**Environment Variables** (Railway):
```bash
# Server Configuration
PORT=8000
PYTHON_ENV=production
PYTHONPATH=/app/juan-retirement-app

# Database (if needed)
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# CORS Origins
ALLOWED_ORIGINS="https://[vercel-domain]"

# Logging
LOG_LEVEL=info
```

### Features

- **Auto-Deploy**: Deploys on push to `main`
- **Environment Management**: Separate staging/production environments
- **Automatic HTTPS**: SSL certificates managed by Railway
- **Scaling**: Automatic scaling based on traffic
- **Logs**: Real-time log streaming
- **Metrics**: CPU, memory, and network monitoring

### Deployment Process

1. **Trigger**: Push to `main` branch on GitHub
2. **Build**: Railway clones repo and installs dependencies
3. **Deploy**: Starts uvicorn server
4. **Health Check**: Verifies `/api/health` endpoint
5. **Switch**: Routes traffic to new deployment
6. **Monitor**: Watches for errors

**Build Time**: ~1-2 minutes
**Rollback**: Via Railway dashboard or CLI

### Custom Domain

**API Domain**: `api.[your-domain].com`
**SSL**: Automatic via Railway

---

## 4. Stripe (Payment Processing)

### Platform Details

**Service**: Stripe
**Website**: https://stripe.com
**Purpose**: Subscription billing and payment processing

### Integration

**Stripe API Version**: `2023-10-16` (or latest)
**Integration Type**: Stripe Checkout + Customer Portal

### Products & Pricing

**Subscription Plans**:
```
Basic Plan:
  - Price ID: price_[id]
  - Amount: $9.99/month
  - Features: 10 simulations/month

Pro Plan:
  - Price ID: price_[id]
  - Amount: $29.99/month
  - Features: Unlimited simulations, PDF reports

Enterprise:
  - Custom pricing
  - Contact sales
```

### Webhooks

**Webhook URL**: `https://[vercel-domain]/api/webhooks/stripe`
**Webhook Secret**: `whsec_[secret]`

**Events Handled**:
- `checkout.session.completed` - Create subscription
- `customer.subscription.created` - Initialize subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_succeeded` - Payment success
- `invoice.payment_failed` - Payment failure

### Implementation Files

**Frontend**:
- `webapp/app/api/checkout/route.ts` - Create checkout session
- `webapp/app/api/webhooks/stripe/route.ts` - Handle webhooks
- `webapp/lib/stripe.ts` - Stripe client configuration
- `webapp/components/pricing/PricingCards.tsx` - Pricing UI

**Database Schema** (Prisma):
```prisma
model User {
  id                String    @id @default(cuid())
  stripeCustomerId  String?   @unique
  stripeSubscriptionId String? @unique
  subscriptionStatus String?  // 'active', 'canceled', 'past_due'
  subscriptionTier  String?   // 'basic', 'pro', 'enterprise'
  subscriptionEndsAt DateTime?
}
```

### Customer Portal

**Portal URL**: Managed by Stripe
**Features**:
- Update payment method
- View invoices
- Cancel subscription
- Download receipts

---

## 5. Resend (Email Service)

### Platform Details

**Service**: Resend
**Website**: https://resend.com
**Purpose**: Transactional email delivery

### Configuration

**API Key**: `re_[secret]`
**From Email**: `noreply@retirezest.com`
**Domain**: Verified via DNS records

### DNS Configuration

**SPF Record**:
```
TXT @ "v=spf1 include:resend.com ~all"
```

**DKIM Records**:
```
TXT resend._domainkey.[your-domain].com "[dkim-value]"
```

### Email Templates

**Welcome Email**:
- Trigger: User signs up
- Template: `templates/welcome.tsx`
- Subject: "Welcome to RetireZest"

**Subscription Confirmation**:
- Trigger: Successful payment
- Template: `templates/subscription-confirmed.tsx`
- Subject: "Your RetireZest subscription is active"

**Password Reset**:
- Trigger: User requests password reset
- Template: `templates/password-reset.tsx`
- Subject: "Reset your RetireZest password"

**Simulation Report**:
- Trigger: User generates PDF report
- Template: `templates/report-ready.tsx`
- Subject: "Your retirement plan is ready"

### Implementation Files

**Backend**:
- `webapp/lib/email.ts` - Resend client configuration
- `webapp/app/api/send-email/route.ts` - Email sending endpoint

**Usage Example**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'RetireZest <noreply@retirezest.com>',
  to: user.email,
  subject: 'Welcome to RetireZest',
  react: WelcomeEmail({ userName: user.name })
});
```

---

## 6. PostgreSQL (Database)

### Platform Details

**Provider**: Railway (or managed PostgreSQL)
**Database**: PostgreSQL 15+
**ORM**: Prisma

### Connection Configuration

**Connection String Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

**Environment Variable**:
```bash
DATABASE_URL="postgresql://postgres:[password]@containers-us-west-123.railway.app:5432/railway"
```

### Database Schema

**Key Tables**:
```sql
-- Users
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stripeCustomerId TEXT UNIQUE,
  stripeSubscriptionId TEXT UNIQUE,
  subscriptionStatus TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retirement Profiles
CREATE TABLE "RetirementProfile" (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES "User"(id),
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simulation History
CREATE TABLE "SimulationHistory" (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES "User"(id),
  profileId TEXT REFERENCES "RetirementProfile"(id),
  results JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Migrations

**Prisma Migrations**:
```bash
# Create migration
npx prisma migrate dev --name add_user_table

# Deploy to production
npx prisma migrate deploy
```

**Backup Strategy**:
- Daily automatic backups (Railway)
- 30-day retention
- Point-in-time recovery available

---

## 7. Monitoring & Observability

### Vercel Analytics

**Metrics Tracked**:
- Page views
- Unique visitors
- Core Web Vitals (LCP, FID, CLS)
- API response times
- Build times

**Dashboard**: https://vercel.com/[org]/webapp/analytics

### Railway Metrics

**Metrics Tracked**:
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

**Dashboard**: https://railway.app/project/[project-id]/metrics

### Error Tracking

**Frontend Errors**:
- Browser console errors logged
- Vercel error logs
- Sentry integration (optional)

**Backend Errors**:
- FastAPI exception handling
- Railway logs
- Custom error reporting

---

## 8. Security

### SSL/TLS

- **Vercel**: Automatic SSL via Let's Encrypt
- **Railway**: Automatic SSL for custom domains
- **Stripe**: PCI DSS compliant (Stripe handles card data)

### Environment Variables

**Security Best Practices**:
- Never commit `.env` files to Git
- Use platform-specific secret management (Vercel, Railway)
- Rotate secrets regularly
- Use different secrets for staging/production

### API Security

**Authentication**:
- JWT tokens (httpOnly cookies)
- Token expiration: 24 hours
- Refresh token rotation

**Rate Limiting**:
- API routes: 100 requests/minute per IP
- Stripe webhooks: Verified via signature

**CORS Configuration**:
```typescript
// Allowed origins
const allowedOrigins = [
  'https://retirezest.com',
  'https://www.retirezest.com',
  'https://*.vercel.app'
];
```

---

## 9. CI/CD Pipeline

### Continuous Integration

**On Pull Request**:
1. Run TypeScript type checking
2. Run ESLint
3. Run unit tests (if configured)
4. Build verification

**On Push to Main**:
1. All CI checks pass
2. Automatic deployment to Vercel
3. Automatic deployment to Railway
4. Run smoke tests
5. Notify via Slack/email (optional)

### Deployment Flow

```
Developer Push
      ↓
   GitHub (main branch)
      ↓
   ┌──────────────┬──────────────┐
   ↓              ↓              ↓
Vercel Build   Railway Build   GitHub Actions
   ↓              ↓              ↓
Vercel Deploy  Railway Deploy  Run Tests
   ↓              ↓              ↓
Production     Production     Notify Team
```

---

## 10. Cost Breakdown

### Monthly Estimates (Production)

**Vercel** (Pro Plan):
- Base: $20/month
- Bandwidth: ~$0-50/month (varies by traffic)
- Edge Functions: Included

**Railway** (Pay-as-you-go):
- Base: $5/month (minimum)
- Compute: ~$10-30/month (varies by usage)
- Database: ~$10/month (1GB)

**Stripe** (Transaction fees):
- 2.9% + $0.30 per successful card charge
- No monthly fee

**Resend** (Growth Plan):
- $20/month for 50,000 emails
- First 3,000 emails free

**Domain & DNS** (Namecheap/Cloudflare):
- Domain: ~$15/year
- DNS: Free (Cloudflare)

**Total Estimated Monthly Cost**: $70-120/month

---

## 11. Disaster Recovery

### Backup Strategy

**Database**:
- Automated daily backups (Railway)
- Manual snapshots before major changes
- 30-day retention

**Code**:
- GitHub as source of truth
- All changes in version control
- No manual server changes

### Recovery Procedures

**Frontend Failure**:
1. Check Vercel status page
2. Review deployment logs
3. Rollback to previous deployment
4. Investigate and fix issue

**Backend Failure**:
1. Check Railway status and logs
2. Verify environment variables
3. Restart service or rollback
4. Check database connectivity

**Database Failure**:
1. Contact Railway support
2. Restore from latest backup
3. Verify data integrity
4. Resume services

---

## 12. Getting Started Checklist

### Initial Setup

- [ ] **GitHub**
  - [ ] Fork or clone repository
  - [ ] Set up branch protection
  - [ ] Configure webhooks

- [ ] **Vercel**
  - [ ] Create account
  - [ ] Import GitHub repository
  - [ ] Configure root directory (`webapp/`)
  - [ ] Set environment variables
  - [ ] Configure custom domain

- [ ] **Railway**
  - [ ] Create account
  - [ ] Create new project from GitHub
  - [ ] Set root directory (`juan-retirement-app/`)
  - [ ] Configure environment variables
  - [ ] Set up PostgreSQL database

- [ ] **Stripe**
  - [ ] Create account
  - [ ] Create products and prices
  - [ ] Set up webhook endpoint
  - [ ] Configure API keys in Vercel

- [ ] **Resend**
  - [ ] Create account
  - [ ] Verify domain
  - [ ] Configure DNS records (SPF, DKIM)
  - [ ] Set API key in Vercel

- [ ] **Database**
  - [ ] Run Prisma migrations
  - [ ] Verify connection
  - [ ] Set up backup schedule

---

## 13. Support & Resources

### Documentation

- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app
- **Stripe**: https://stripe.com/docs
- **Resend**: https://resend.com/docs
- **Prisma**: https://www.prisma.io/docs

### Support Channels

- **GitHub Issues**: https://github.com/marcosclavier/retirezest/issues
- **Email**: support@retirezest.com (configure via Resend)
- **Status Pages**:
  - Vercel: https://vercel-status.com
  - Railway: https://railway.app/status
  - Stripe: https://status.stripe.com

---

## Summary

RetireZest leverages a modern, scalable infrastructure:

- **GitHub** for version control and CI/CD triggers
- **Vercel** for blazing-fast frontend hosting with edge functions
- **Railway** for reliable Python backend hosting
- **Stripe** for secure payment processing
- **Resend** for transactional email delivery
- **PostgreSQL** for reliable data persistence

All services are integrated via environment variables and webhooks, providing automatic deployments and seamless user experiences.

**Total Setup Time**: ~2-3 hours (first time)
**Maintenance**: Minimal (automatic deployments)
**Scalability**: Excellent (auto-scaling on Vercel and Railway)

---

**Last Updated**: January 26, 2026
**Repository**: https://github.com/marcosclavier/retirezest
