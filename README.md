# Canadian Retirement Planning Application

A comprehensive web application to help Canadian seniors plan their retirement by calculating government benefits, projecting income, and comparing different retirement scenarios.

![Version](https://img.shields.io/badge/version-1.2-blue)
![Status](https://img.shields.io/badge/status-Production-success)
![License](https://img.shields.io/badge/license-MIT-green)
![Sprint](https://img.shields.io/badge/sprint-10%20complete-brightgreen)

**Latest Updates (February 2026):**
- ✅ RRIF minimum withdrawal enforcement (CRA compliance)
- ✅ CPP/OAS benefit caps at legislated maximums
- ✅ Early RRIF/RRSP withdrawal customization (age 55-70)
- ✅ Future retirement age planning UX improvements

## Features

- **Government Benefits Calculators**
  - CPP (Canada Pension Plan) with age adjustment factors
  - OAS (Old Age Security) with clawback calculations
  - GIS (Guaranteed Income Supplement) for low-income seniors

- **Financial Planning Tools**
  - Track income sources, assets, expenses, and debts
  - Year-by-year retirement projection to age 95
  - Tax-efficient withdrawal strategies
  - RRSP/RRIF conversion with CRA-compliant minimum withdrawals
  - Early RRIF withdrawal planning (ages 55-70)
  - Future retirement age scenario planning

- **Scenario Comparison**
  - Create and save multiple retirement scenarios
  - Side-by-side comparison of up to 3 scenarios
  - Interactive charts and visualizations

- **PDF Reports**
  - Professional retirement planning reports
  - Executive summary with key findings
  - Detailed year-by-year projections

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (production-ready for PostgreSQL migration)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Authentication**: JWT with httpOnly cookies
- **Deployment**: Docker-ready, Vercel-compatible

## Quick Start

### Local Development (Traditional)

```bash
# Navigate to webapp directory
cd webapp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and JWT_SECRET

# Initialize database
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev
```

Visit `http://localhost:3002`

### Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Visit `http://localhost:3100`

See [README-DOCKER.md](README-DOCKER.md) for detailed Docker deployment instructions.

## Project Structure

```
retirement-app/
├── webapp/                      # Next.js application
│   ├── app/                     # App Router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Dashboard pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   ├── lib/                    # Utilities & business logic
│   │   └── calculations/       # CPP/OAS/GIS/Tax/Projection engines
│   ├── prisma/                 # Database schema & migrations
│   └── public/                 # Static assets
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker orchestration
└── Documentation/              # Project documentation
```

## Key Capabilities

### Calculation Engines

- **CPP Calculator** (`lib/calculations/cpp.ts`)
  - 2025 maximum: $1,433/month
  - Age adjustment (60-70): 64% to 142%
  - Dropout provisions
  - Break-even analysis

- **OAS Calculator** (`lib/calculations/oas.ts`)
  - 2025 maximum: $713.34/month (age 65-74), $784.67/month (75+)
  - Residency-based calculation
  - Income clawback (15% over $90,997)
  - Deferral benefits

- **GIS Calculator** (`lib/calculations/gis.ts`)
  - 2025 maximum: $1,065.47/month (single), $641.35/month (married)
  - Income-tested benefits
  - Exemptions: $5,000 CPP, full OAS

- **Tax Calculator** (`lib/calculations/tax.ts`)
  - Federal & Ontario provincial tax
  - 2025 tax brackets and rates
  - Tax credits: Basic Personal, Age, Pension
  - RRSP withholding and capital gains

- **Projection Engine** (`lib/calculations/projection.ts`)
  - Year-by-year projections
  - RRSP → RRIF conversion at 71
  - RRIF minimum withdrawals
  - Tax-efficient withdrawal strategies
  - Inflation and investment returns

## Environment Variables

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="your-secret-key-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3002"
NODE_ENV="development"
```

## Deployment

### Vercel (Recommended for Production)

1. Push code to GitHub
2. Import repository in Vercel
3. Set root directory to `webapp`
4. Add environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET`
5. Deploy

### Docker

See [README-DOCKER.md](README-DOCKER.md) for complete Docker deployment guide.

## Database Migration (SQLite → PostgreSQL)

```bash
# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/retirement_db"

# Update prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Run migrations
npx prisma migrate deploy
```

## Documentation

### Getting Started
- **[CODEBASE-INTRODUCTION.md](CODEBASE-INTRODUCTION.md)** - Complete codebase guide
- **[juan-retirement-app/DEVELOPER_GUIDE.md](juan-retirement-app/DEVELOPER_GUIDE.md)** - Developer guide with architecture and workflows
- **[README-DOCKER.md](README-DOCKER.md)** - Docker deployment
- **[MANUAL-TESTING-CHECKLIST.md](MANUAL-TESTING-CHECKLIST.md)** - Testing guide

### Project Management
- **[AGILE_BACKLOG.md](AGILE_BACKLOG.md)** - Product backlog and sprint planning
- **[juan-retirement-app/SPRINT_10_PLAN.md](juan-retirement-app/SPRINT_10_PLAN.md)** - Sprint 10 plan
- **[SPRINT_10_REVIEW.md](SPRINT_10_REVIEW.md)** - Sprint 10 retrospective

### Technical Documentation
- **[juan-retirement-app/DATA_FORMAT_CONVENTIONS.md](juan-retirement-app/DATA_FORMAT_CONVENTIONS.md)** - Data format conventions
- **[juan-retirement-app/US080_RRIF_MINIMUM_FIX_COMPLETE.md](juan-retirement-app/US080_RRIF_MINIMUM_FIX_COMPLETE.md)** - RRIF minimum withdrawal implementation
- **[juan-retirement-app/US081_US082_CPP_OAS_CAPS_COMPLETE.md](juan-retirement-app/US081_US082_CPP_OAS_CAPS_COMPLETE.md)** - Government benefit caps implementation

## Production Deployment

### GitHub Repository
- **Repository**: https://github.com/marcosclavier/retirezest
- **Branch**: `main` (production branch)
- **Auto-Deploy**: Vercel connected to GitHub for automatic deployments

### Deployment Flow
1. Push changes to `main` branch
2. GitHub webhook triggers Vercel build
3. Vercel builds and deploys automatically
4. Production URL updates on successful build

### Vercel Configuration
- **Project**: `webapp`
- **Root Directory**: `webapp/`
- **Framework**: Next.js 15
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## Contributing

1. Fork the repository at https://github.com/marcosclavier/retirezest
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request to marcosclavier/retirezest

## License

MIT License - See LICENSE file for details

## Support

For questions or issues, please open a GitHub issue.

## Roadmap

### Completed ✅
- [x] RRIF minimum withdrawal enforcement (CRA compliance) - Sprint 10
- [x] CPP/OAS benefit caps at legislated maximums - Sprint 10
- [x] Early RRIF/RRSP withdrawal customization (age 55-70) - Sprint 10
- [x] Future retirement age planning UX - Sprint 10
- [x] Calculation validation testing infrastructure - Sprint 9
- [x] Bug fix: Exponential growth from percentage/decimal handling - Sprint 8

### In Progress 🔄
- [ ] Tax credit visibility (BPA, age credit) in simulation output

### Planned 📋
- [ ] Unit and integration tests
- [ ] Multi-province tax support (currently Ontario)
- [ ] French language support
- [ ] Mobile app (React Native)
- [ ] Advanced Monte Carlo simulations
- [ ] Financial advisor collaboration features
- [ ] Bank account integration

---

**Built with ❤️ for Canadian seniors planning their retirement**
