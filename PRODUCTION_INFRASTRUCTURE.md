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
│                       Cloudflare CDN                         │
│         (DNS, DDoS Protection, WAF, SSL/TLS)                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Global CDN & Caching                                 ││
│  │  • DDoS Protection                                      ││
│  │  • Web Application Firewall (WAF)                      ││
│  │  • DNS Management                                       ││
│  │  • SSL/TLS Encryption                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                   (Next.js Frontend)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Next.js 15 Application                               ││
│  │  • Edge Functions                                       ││
│  │  • API Routes                                           ││
│  │  • Static Asset Optimization                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────────┐
            ↓               ↓                   ↓
    ┌──────────────┐ ┌─────────────┐   ┌─────────────┐
    │   Railway    │ │   Stripe    │   │   Resend    │
    │  (Backend)   │ │ (Payments)  │   │   (Email)   │
    └──────────────┘ └─────────────┘   └─────────────┘
            │
            ↓
    ┌──────────────┐
    │  PostgreSQL  │
    │  (Database)  │
    └──────────────┘
```

---

## 1. Cloudflare (CDN & Security)

### Platform Details

**Service**: Cloudflare
**Website**: https://cloudflare.com
**Purpose**: DNS management, CDN, DDoS protection, WAF, and SSL/TLS

### Features Enabled

**CDN & Performance**:
- Global content delivery network (300+ locations)
- Automatic caching of static assets
- HTTP/2 and HTTP/3 support
- Brotli compression
- Image optimization (Polish)
- Minification (HTML, CSS, JavaScript)

**Security**:
- DDoS protection (automatic mitigation)
- Web Application Firewall (WAF)
- Rate limiting
- Bot protection
- SSL/TLS encryption (Full Strict mode)
- Always Use HTTPS
- HSTS (HTTP Strict Transport Security)

**DNS**:
- Authoritative DNS hosting
- Fast DNS resolution (< 20ms globally)
- DNSSEC support
- Custom DNS records for email authentication

### DNS Configuration

**Domain Records**:
```
A     @               [Vercel IP]
CNAME www             cname.vercel-dns.com
CNAME api             [Railway domain]

# Email Authentication (SPF, DKIM, DMARC)
TXT   @               "v=spf1 include:resend.com ~all"
TXT   resend._domainkey    "[DKIM-value-from-Resend]"
TXT   _dmarc              "v=DMARC1; p=quarantine; rua=mailto:dmarc@retirezest.com"

# Email verification
TXT   @               "[verification-token]"

# Security headers
TXT   @               "[security-policy]"
```

### Page Rules

**Custom Page Rules**:
1. **Always Use HTTPS**: Force HTTPS for all traffic
2. **Cache Everything**: Cache static assets at the edge
3. **Security Level**: Medium (challenges suspicious traffic)
4. **Browser Cache TTL**: 4 hours for static assets
5. **Edge Cache TTL**: 2 hours

### Firewall Rules

**WAF Rules**:
```
# Block common attack patterns
- SQL injection attempts
- XSS (Cross-Site Scripting) attempts
- Path traversal attempts
- Known malicious IPs/ASNs

# Rate Limiting
- Max 100 requests per minute per IP for API routes
- Max 10 requests per minute for authentication endpoints
- Max 5 requests per minute for password reset

# Geographic Restrictions (optional)
- Allow: North America, Europe, Australia
- Challenge: Asia, South America
- Block: Known high-risk countries
```

### SSL/TLS Configuration

**SSL Mode**: Full (Strict)
- Cloudflare encrypts traffic between browser and Cloudflare
- Cloudflare verifies Vercel's SSL certificate
- End-to-end encryption guaranteed

**Minimum TLS Version**: TLS 1.2
**TLS 1.3**: Enabled
**Automatic HTTPS Rewrites**: Enabled
**Always Use HTTPS**: Enabled

**Edge Certificates**:
- Universal SSL (free, automatic)
- Custom certificates (if needed)
- Dedicated certificates with custom hostname

### Analytics & Monitoring

**Cloudflare Analytics**:
- Traffic overview (requests, bandwidth, threats)
- Geographic distribution
- Threat intelligence
- Performance metrics (time to first byte)
- Cache hit ratio

**Security Analytics**:
- Blocked threats by type
- Rate limiting events
- Firewall rules triggered
- Bot traffic analysis

### Email Routing (Optional)

**Cloudflare Email Routing**:
- Forward emails to `info@retirezest.com` → your inbox
- Catch-all addresses
- Email forwarding rules
- No cost for basic email forwarding

**MX Records** (if using Cloudflare Email Routing):
```
MX  @  10  isaac.mx.cloudflare.net
MX  @  20  linda.mx.cloudflare.net
MX  @  30  amir.mx.cloudflare.net
```

### Cost

**Plan**: Pro ($20/month) or Business ($200/month)
- **Free Plan**: Suitable for development
- **Pro Plan**: Advanced DDoS, WAF, image optimization
- **Business Plan**: Advanced security, PCI compliance, 100% uptime SLA

**Recommended**: Pro Plan ($20/month) for production

---

## 2. GitHub (Source Control)

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

## 3. Vercel (Frontend Hosting)

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

## 4. Railway (Backend Hosting)

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

## 5. Stripe (Payment Processing)

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

## 6. Resend (Email Service)

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

## 7. Email Authentication & Deliverability

### Overview

Email authentication is critical for ensuring emails from RetireZest reach users' inboxes and aren't marked as spam. We implement industry-standard authentication protocols: SPF, DKIM, and DMARC.

### SPF (Sender Policy Framework)

**Purpose**: Specifies which mail servers are authorized to send email on behalf of your domain.

**DNS Record** (via Cloudflare):
```
Type:  TXT
Name:  @
Value: v=spf1 include:resend.com ~all
TTL:   Auto
```

**Explanation**:
- `v=spf1` - SPF version 1
- `include:resend.com` - Authorize Resend's mail servers
- `~all` - Soft fail for unauthorized servers (marks as spam but doesn't reject)

**Alternative** (if using multiple email services):
```
v=spf1 include:resend.com include:_spf.google.com ~all
```

### DKIM (DomainKeys Identified Mail)

**Purpose**: Adds a digital signature to emails, proving they weren't tampered with in transit.

**Setup Process**:
1. Log in to Resend dashboard
2. Go to Domains → Your Domain → DKIM Settings
3. Copy the DKIM record values
4. Add to Cloudflare DNS

**DNS Record** (via Cloudflare):
```
Type:  TXT
Name:  resend._domainkey.retirezest.com
Value: [Long DKIM value provided by Resend]
TTL:   Auto
```

**Example DKIM Value**:
```
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (truncated)
```

**Verification**:
- Resend will automatically verify the DKIM record
- Status shown in Resend dashboard: ✅ Verified

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

**Purpose**: Tells receiving mail servers what to do if SPF or DKIM checks fail, and provides reporting.

**DNS Record** (via Cloudflare):
```
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@retirezest.com; pct=100; adkim=s; aspf=s
TTL:   Auto
```

**Parameters Explained**:
- `v=DMARC1` - DMARC version 1
- `p=quarantine` - Quarantine emails that fail checks (don't reject completely)
- `rua=mailto:dmarc-reports@retirezest.com` - Send aggregate reports to this email
- `pct=100` - Apply policy to 100% of failing messages
- `adkim=s` - Strict DKIM alignment
- `aspf=s` - Strict SPF alignment

**Policy Options**:
- `p=none` - Monitor only (recommended for testing)
- `p=quarantine` - Send failing emails to spam (recommended for production)
- `p=reject` - Reject failing emails completely (use with caution)

**Progressive Rollout**:
```
Week 1-2:  p=none (monitor reports)
Week 3-4:  p=quarantine; pct=50 (apply to 50% of emails)
Week 5+:   p=quarantine; pct=100 (full enforcement)
```

### Email Verification Setup

**Step 1: Add Domain to Resend**
1. Log in to Resend: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `retirezest.com`
4. Resend provides verification records

**Step 2: Add Verification TXT Record**
```
Type:  TXT
Name:  @ (or root domain)
Value: resend-verification=[unique-token]
TTL:   Auto
```

**Step 3: Wait for Verification**
- DNS propagation: 5-60 minutes
- Resend checks automatically
- Status will change to "Verified" ✅

### DNS Records Summary

**Complete DNS Configuration in Cloudflare**:
```
# Domain pointing
A     @                      [Vercel IP]
CNAME www                    cname.vercel-dns.com

# Email Authentication
TXT   @                      "v=spf1 include:resend.com ~all"
TXT   resend._domainkey      "[DKIM-value-from-Resend]"
TXT   _dmarc                 "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@retirezest.com; pct=100"

# Domain Verification
TXT   @                      "resend-verification=[token]"

# Email Routing (optional - if using Cloudflare Email Routing)
MX    @   10                 isaac.mx.cloudflare.net
MX    @   20                 linda.mx.cloudflare.net
MX    @   30                 amir.mx.cloudflare.net
```

### Testing Email Deliverability

**Tools**:
1. **Mail-Tester**: https://www.mail-tester.com
   - Send test email to provided address
   - Get deliverability score (aim for 10/10)
   - Shows SPF, DKIM, DMARC status

2. **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
   - Check SPF: `mxtoolbox.com/spf.aspx`
   - Check DKIM: `mxtoolbox.com/dkim.aspx`
   - Check DMARC: `mxtoolbox.com/dmarc.aspx`

3. **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/
   - Comprehensive email server test
   - Verifies DNS records

**Test Email Code**:
```typescript
// Send test email from Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'RetireZest <noreply@retirezest.com>',
  to: 'test@mail-tester.com',
  subject: 'Email Deliverability Test',
  html: '<p>Testing SPF, DKIM, and DMARC configuration.</p>'
});
```

### DMARC Reporting

**Aggregate Reports** (rua):
- Sent daily by receiving mail servers
- XML format with authentication statistics
- Shows pass/fail rates for SPF and DKIM

**Forensic Reports** (ruf) - Optional:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc-agg@retirezest.com; ruf=mailto:dmarc-forensic@retirezest.com
```

**DMARC Report Analyzers**:
- Postmark DMARC Digests (free): https://dmarc.postmarkapp.com
- Dmarcian: https://dmarcian.com
- URIports: https://www.uriports.com

### Email Best Practices

**Sender Reputation**:
- Use consistent "From" address: `noreply@retirezest.com`
- Use recognizable "From" name: `RetireZest`
- Avoid frequent IP changes (Resend handles this)
- Maintain low complaint rate (< 0.1%)

**Content Guidelines**:
- Avoid spam trigger words ("free money", "act now")
- Include unsubscribe link in all marketing emails
- Use plain text + HTML versions
- Keep email size < 100KB
- Include physical mailing address (CAN-SPAM requirement)

**Bounce Handling**:
- Monitor bounce rates (hard bounces vs soft bounces)
- Remove hard bounces from mailing list immediately
- Retry soft bounces with exponential backoff

**List Hygiene**:
- Use double opt-in for subscriptions
- Remove inactive subscribers (> 6 months no opens)
- Segment lists by engagement
- Honor unsubscribe requests immediately

### Monitoring Email Health

**Metrics to Track**:
- Delivery rate (target: > 95%)
- Open rate (target: > 20%)
- Click-through rate (target: > 2%)
- Bounce rate (target: < 5%)
- Spam complaint rate (target: < 0.1%)
- Unsubscribe rate (target: < 0.5%)

**Resend Dashboard**:
- Real-time email status
- Delivery analytics
- Bounce tracking
- Webhook events

**Webhook Configuration**:
```typescript
// webapp/app/api/webhooks/resend/route.ts
export async function POST(req: Request) {
  const event = await req.json();

  switch (event.type) {
    case 'email.delivered':
      // Track successful delivery
      break;
    case 'email.bounced':
      // Handle bounce (remove from list)
      break;
    case 'email.complained':
      // Handle spam complaint (immediate removal)
      break;
  }
}
```

### Troubleshooting

**Emails Going to Spam**:
1. Verify SPF, DKIM, DMARC are all passing
2. Check sender reputation: mxtoolbox.com/blacklists.aspx
3. Review email content for spam triggers
4. Ensure proper authentication headers
5. Check if domain is on any blacklists

**SPF Failures**:
- Verify SPF record includes Resend: `include:resend.com`
- Check for SPF record conflicts (max 10 DNS lookups)
- Use SPF record checker: mxtoolbox.com/spf.aspx

**DKIM Failures**:
- Verify DKIM record is correctly added to DNS
- Check for typos in DKIM value
- Ensure DKIM selector matches: `resend._domainkey`
- Wait for DNS propagation (up to 48 hours)

**DMARC Issues**:
- Start with `p=none` to monitor without blocking
- Review DMARC aggregate reports
- Gradually increase to `p=quarantine` then `p=reject`

---

## 8. PostgreSQL (Database)

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

## 9. Monitoring & Observability

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

## 10. Security

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

## 11. CI/CD Pipeline

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

## 12. Cost Breakdown

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

**Cloudflare** (Pro Plan):
- $20/month for advanced security and performance
- Free plan available for basic usage

**Domain & DNS**:
- Domain: ~$15/year
- DNS: Free (included with Cloudflare)

**Total Estimated Monthly Cost**: $90-140/month
- **Minimum** (Free Cloudflare): ~$70/month
- **Recommended** (Pro Cloudflare): ~$90-140/month

---

## 13. Disaster Recovery

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

## 14. Getting Started Checklist

### Initial Setup

- [ ] **Cloudflare**
  - [ ] Create account
  - [ ] Add domain to Cloudflare
  - [ ] Update nameservers at domain registrar
  - [ ] Enable SSL/TLS (Full Strict mode)
  - [ ] Configure firewall rules
  - [ ] Set up page rules for caching

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
  - [ ] Add domain
  - [ ] Configure SPF record in Cloudflare
  - [ ] Configure DKIM record in Cloudflare
  - [ ] Configure DMARC record in Cloudflare
  - [ ] Verify domain in Resend
  - [ ] Set API key in Vercel
  - [ ] Test email deliverability

- [ ] **Email Authentication**
  - [ ] Verify SPF record: mxtoolbox.com/spf.aspx
  - [ ] Verify DKIM record: mxtoolbox.com/dkim.aspx
  - [ ] Verify DMARC record: mxtoolbox.com/dmarc.aspx
  - [ ] Test with Mail-Tester (aim for 10/10 score)
  - [ ] Set up DMARC reporting email
  - [ ] Monitor deliverability metrics

- [ ] **Database**
  - [ ] Run Prisma migrations
  - [ ] Verify connection
  - [ ] Set up backup schedule

---

## 15. Support & Resources

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

- **Cloudflare** for DNS, CDN, DDoS protection, and Web Application Firewall
- **GitHub** for version control and CI/CD triggers
- **Vercel** for blazing-fast frontend hosting with edge functions
- **Railway** for reliable Python backend hosting
- **Stripe** for secure payment processing
- **Resend** for transactional email delivery with SPF, DKIM, and DMARC authentication
- **PostgreSQL** for reliable data persistence

All services are integrated via environment variables and webhooks, providing automatic deployments, security, and seamless user experiences.

**Total Setup Time**: ~2-3 hours (first time)
**Maintenance**: Minimal (automatic deployments)
**Scalability**: Excellent (auto-scaling on Vercel and Railway)

---

**Last Updated**: January 26, 2026
**Repository**: https://github.com/marcosclavier/retirezest
