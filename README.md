# Canadian Retirement Planning Application

A comprehensive web application to help Canadian seniors plan their retirement by calculating government benefits, projecting income, and comparing different retirement scenarios.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Status](https://img.shields.io/badge/status-Production-success)
![License](https://img.shields.io/badge/license-MIT-green)

**Latest Updates (February 2026):**
- ✅ Consolidated monorepo architecture (webapp + Python API)
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
- **Backend**:
  - Next.js API Routes (authentication, data persistence)
  - Python FastAPI (retirement simulation engine)
- **Database**: SQLite with Prisma ORM (PostgreSQL-ready)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Authentication**: JWT with httpOnly cookies
- **Deployment**:
  - Frontend: Vercel
  - Python API: Railway

## Quick Start

### Local Development

**1. Start the Python API:**
```bash
cd webapp/python-api
pip install -r ../requirements-api.txt
python -m uvicorn api.main:app --reload --port 8000
```

**2. Start the Next.js Frontend (in another terminal):**
```bash
cd webapp
npm install
cp .env.example .env.local
# Edit .env.local - set PYTHON_API_URL=http://localhost:8000

npx prisma generate
npx prisma migrate dev
npm run dev
```

- Frontend: `http://localhost:3000`
- Python API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Docker Deployment

```bash
docker-compose up -d
```

Visit `http://localhost:3100`

## Project Structure

```
retirezest/
├── webapp/                      # Unified application
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Dashboard pages
│   │   └── api/                # Next.js API routes
│   ├── components/             # React components
│   ├── lib/                    # Utilities & business logic
│   │   └── calculations/       # TypeScript calculation helpers
│   ├── prisma/                 # Database schema & migrations
│   ├── public/                 # Static assets
│   └── python-api/             # Python FastAPI backend
│       ├── api/                # FastAPI routes & models
│       │   ├── main.py         # FastAPI app entry point
│       │   ├── routes/         # API endpoints
│       │   └── models/         # Pydantic request/response models
│       ├── modules/            # Core simulation engine
│       │   ├── simulation.py   # Main retirement simulation
│       │   ├── benefits.py     # CPP/OAS/GIS calculations
│       │   ├── tax_engine.py   # Tax calculations
│       │   └── ...
│       └── utils/              # Helper utilities
├── docker-compose.yml          # Docker orchestration
├── railway.toml                # Railway deployment config
└── CODEBASE-INTRODUCTION.md    # Complete architecture guide
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

### Vercel (Frontend)

1. Push code to GitHub
2. Import repository in Vercel
3. Set root directory to `webapp`
4. Add environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET`
   - `PYTHON_API_URL` (Railway URL)
5. Deploy

### Railway (Python API)

1. Connect repository to Railway
2. Set root directory to `/` (repository root)
3. Railway auto-detects Python and deploys
4. Copy the deployment URL to Vercel's `PYTHON_API_URL`

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

- **[CODEBASE-INTRODUCTION.md](CODEBASE-INTRODUCTION.md)** - Complete architecture guide and codebase overview
- **[webapp/consolidation.md](webapp/consolidation.md)** - Monorepo consolidation documentation
- **[webapp/API-README.md](webapp/API-README.md)** - Python API documentation

## Production Deployment

### Architecture
- **Frontend (Vercel)**: Next.js webapp with API routes for auth/data
- **Backend (Railway)**: Python FastAPI for retirement simulations

### GitHub Repository
- **Repository**: https://github.com/marcosclavier/retirezest
- **Branch**: `main` (production branch)
- **Auto-Deploy**: Both Vercel and Railway connected for automatic deployments

### Vercel Configuration (Frontend)
- **Root Directory**: `webapp/`
- **Framework**: Next.js 15
- **Environment Variables**:
  - `DATABASE_URL` - PostgreSQL connection string
  - `JWT_SECRET` - Authentication secret
  - `PYTHON_API_URL` - Railway API URL (e.g., `https://retirezest-production.up.railway.app`)

### Railway Configuration (Python API)
- **Root Directory**: `/` (repository root)
- **Build**: Nixpacks auto-detects Python from `requirements.txt`
- **Start Command**: `cd webapp/python-api && python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `GET /api/health`

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
- [x] Monorepo consolidation (webapp + Python API unified)
- [x] RRIF minimum withdrawal enforcement (CRA compliance)
- [x] CPP/OAS benefit caps at legislated maximums
- [x] Early RRIF/RRSP withdrawal customization (age 55-70)
- [x] Future retirement age planning UX
- [x] Calculation validation testing infrastructure
- [x] Bug fix: Exponential growth from percentage/decimal handling

### Planned 📋
- [ ] Tax credit visibility (BPA, age credit) in simulation output
- [ ] Unit and integration tests
- [ ] Multi-province tax support (currently Ontario)
- [ ] French language support
- [ ] Advanced Monte Carlo simulations

---

**Built with ❤️ for Canadian seniors planning their retirement**
