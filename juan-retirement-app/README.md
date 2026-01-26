# RetireZest - Retirement Planning Application

**A comprehensive Canadian retirement planning and tax optimization tool**

RetireZest helps Canadians plan their retirement by simulating multi-year financial scenarios with tax-optimized withdrawal strategies. The application accounts for TFSA, RRSP/RRIF, non-registered accounts, CPP, OAS, GIS, and provincial tax considerations.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Core Concepts](#core-concepts)
- [Contributing](#contributing)
- [Support](#support)

---

## Overview

RetireZest is a full-stack web application that combines a Python-based simulation engine with a modern React frontend. It provides:

- **Multi-year retirement simulations** from current age to end age (typically 95)
- **Tax-optimized withdrawal strategies** including minimize-income, maximize-tfsa, and custom strategies
- **GIS optimization** to maximize Guaranteed Income Supplement benefits
- **Account tracking** across TFSA, RRSP/RRIF, non-registered, and corporate accounts
- **Visual analytics** with interactive charts showing cash flow, account balances, and tax projections
- **Underfunding detection** to identify years where savings may be insufficient
- **Canadian tax compliance** with federal and provincial tax calculations

### Who is this for?

- **Financial planners** helping clients optimize retirement withdrawals
- **Retirees and pre-retirees** planning their retirement income strategy
- **Developers** interested in financial simulation and tax optimization
- **Researchers** studying retirement income strategies

---

## Key Features

### Retirement Simulation Engine
- Simulate 30-40+ years of retirement cash flow
- Support for single individuals and couples
- Age-based spending phases (go-go, slow-go, no-go years)
- Inflation adjustments for spending and government benefits
- Account growth with configurable returns per account type

### Tax Optimization Strategies
- **Minimize Income**: Optimize for GIS eligibility by minimizing taxable income
- **Maximize TFSA**: Prioritize tax-free growth
- **Fixed Order**: Withdraw from accounts in specified sequence
- **Custom Strategies**: Build your own withdrawal logic

### Canadian Tax Features
- Federal and provincial tax calculations for all provinces/territories
- CPP (Canada Pension Plan) and OAS (Old Age Security) integration
- GIS (Guaranteed Income Supplement) calculations with income testing
- OAS clawback calculations
- Capital gains taxation for non-registered accounts
- Age credits and pension income credits

### Interactive UI
- Real-time simulation execution
- Year-by-year cash flow breakdown
- Account balance charts
- Tax liability visualization
- Underfunding alerts with gap analysis
- Export results to CSV

---

## Technology Stack

### Backend
- **Python 3.10+** - Core simulation engine
- **FastAPI** - REST API framework
- **Pandas** - Data processing and results storage
- **Pydantic** - Data validation and serialization
- **PostgreSQL** - Database for user profiles and saved simulations
- **Prisma** - ORM for database access

### Frontend
- **Next.js 15.5.9** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Recharts** - Data visualization
- **TailwindCSS** - Styling
- **React Query** - API state management

### Development Tools
- **npm/node** - Frontend package management
- **pip/venv** - Python package management
- **Docker** - Containerization (optional)
- **Git** - Version control

---

## Quick Start

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourorg/retirezest.git
   cd retirezest/juan-retirement-app
   ```

2. **Set up Python backend**
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Set up Next.js frontend**
   ```bash
   cd webapp
   npm install
   cd ..
   ```

4. **Configure database**
   ```bash
   # Set up PostgreSQL and create .env file
   cp .env.example .env
   # Edit .env with your DATABASE_URL

   # Run Prisma migrations
   cd webapp
   npx prisma migrate dev
   cd ..
   ```

5. **Start the development servers**

   **Terminal 1 - Python Backend:**
   ```bash
   python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   **Terminal 2 - Next.js Frontend:**
   ```bash
   cd webapp
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## Project Structure

```
juan-retirement-app/
├── api/                      # FastAPI backend
│   ├── main.py              # FastAPI app entry point
│   ├── routers/             # API route handlers
│   │   ├── simulation.py    # Simulation endpoints
│   │   └── profiles.py      # Profile management
│   ├── models/              # Pydantic API models
│   └── utils/               # Converters and helpers
│
├── modules/                  # Core simulation engine
│   ├── simulation.py        # Main simulation logic (~2500 lines)
│   ├── models.py            # Person, Household, YearResult models
│   ├── config.py            # Tax configuration loader
│   ├── gis.py               # GIS optimization logic
│   └── strategies/          # Withdrawal strategies
│
├── webapp/                   # Next.js frontend
│   ├── app/                 # Next.js 15 App Router
│   │   ├── page.tsx         # Home page
│   │   ├── simulation/      # Simulation pages
│   │   └── api/             # API routes (middleware)
│   ├── components/          # React components
│   │   ├── InputForm.tsx    # Simulation input form
│   │   ├── ResultsDisplay.tsx
│   │   └── charts/          # Chart components
│   ├── lib/                 # Utilities and types
│   └── prisma/              # Database schema
│
├── tax_config_canada_2025.json  # Tax brackets and rates
├── DEVELOPER_GUIDE.md       # Detailed development guide
├── ARCHITECTURE.md          # System architecture documentation
└── README.md                # This file
```

---

## Documentation

### For New Developers
Start with these documents in order:

1. **README.md** (this file) - Project overview and quick start
2. **DEVELOPER_GUIDE.md** - Comprehensive development guide covering:
   - Detailed setup instructions
   - Development workflow and Git conventions
   - Testing guide with examples
   - Debugging techniques
   - Common tasks (adding strategies, charts, fields)
   - Troubleshooting common issues
   - Code style guide

3. **ARCHITECTURE.md** - Technical architecture documentation:
   - System architecture and data flow
   - Frontend and backend architecture
   - Core simulation engine walkthrough
   - Data models and database schema
   - Tax calculation flow
   - GIS optimization strategy
   - Performance and security considerations

### Additional Resources
- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Tax Config**: `tax_config_canada_2025.json` - Canadian tax brackets and rates
- **Test Files**: `test_*.py` files demonstrate common scenarios

---

## Core Concepts

### Simulation Flow

```
1. User Input (age, balances, spending, strategy)
   ↓
2. Backend API (/api/simulation/run)
   ↓
3. Core Simulation Engine (modules/simulation.py)
   ↓
4. Year-by-year loop:
   - Calculate spending target for age
   - Determine government benefits (CPP, OAS, GIS)
   - Execute withdrawal strategy
   - Apply GIS optimization (if enabled)
   - Calculate taxes (federal + provincial)
   - Update account balances with growth
   - Detect underfunding
   ↓
5. Return Results (Pandas DataFrame)
   ↓
6. Convert to API Response (YearResult[])
   ↓
7. Frontend displays charts and tables
```

### Key Components

**Person Model** (`modules/models.py`)
- Represents an individual with account balances, CPP/OAS benefits, ages
- Tracks TFSA, RRSP/RRIF, non-registered, corporate accounts
- Non-reg accounts subdivided into buckets: cash, GIC, investments

**Household Model** (`modules/models.py`)
- Contains 1-2 Person objects (individual or couple)
- Defines spending phases (go-go, slow-go, no-go)
- Specifies province for tax calculations
- Sets withdrawal strategy

**Simulation Engine** (`modules/simulation.py`)
- Main function: `simulate(household, tax_config) -> DataFrame`
- Runs year-by-year from start_year to end_age
- Executes withdrawal strategy
- Applies tax rules
- Returns complete financial projection

**Withdrawal Strategies** (`modules/strategies/`)
- Determine which accounts to withdraw from and in what order
- Examples: minimize-income, maximize-tfsa, fixed-order
- Can be customized based on user goals

**Tax Calculation**
- Federal and provincial tax brackets from `tax_config_canada_2025.json`
- Marginal tax rate calculations
- GIS income testing and clawback
- OAS clawback for high earners
- Capital gains inclusion rate (50%)

---

## Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   # Run Python tests
   python test_your_feature.py

   # Run Next.js build
   cd webapp && npm run build
   ```

3. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "feat: Add new withdrawal strategy"
   ```

4. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Testing

**Unit Tests**
```python
# Example test file: test_minimize_income.py
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate

# Create test household
rafael = Person(name="Rafael", start_age=64, tfsa_balance=312000, ...)
lucy = Person(name="Lucy", start_age=62, tfsa_balance=114000, ...)
household = Household(p1=rafael, p2=lucy, province="AB", ...)
household.strategy = "minimize-income"

# Run simulation
tax_config = load_tax_config('tax_config_canada_2025.json')
results = simulate(household, tax_config)

# Verify results
assert results.iloc[0]['total_income_p1'] > 0
assert results.iloc[0]['underfunded_after_tax'] < 5000  # Under tolerance
```

**Integration Tests**
- Test API endpoints using pytest or curl
- Test frontend components with React Testing Library
- Test database operations with Prisma

### Code Style

**Python**
- Follow PEP 8 style guide
- Use type hints for function signatures
- Document functions with docstrings
- Maximum line length: 120 characters

**TypeScript/React**
- Use functional components with hooks
- Define prop types with interfaces
- Use descriptive variable names
- Format with Prettier

---

## Common Tasks

### Adding a New Withdrawal Strategy

1. Create strategy file in `modules/strategies/your_strategy.py`
2. Implement strategy function with signature: `(person, household, ...) -> withdrawals`
3. Register strategy in `modules/simulation.py` strategy mapping
4. Add tests in `test_your_strategy.py`
5. Update frontend dropdown in `webapp/components/InputForm.tsx`

### Adding a New Chart

1. Create chart component in `webapp/components/charts/YourChart.tsx`
2. Use Recharts library (LineChart, BarChart, etc.)
3. Add chart to `ResultsDisplay.tsx`
4. Pass simulation results as props

### Updating Tax Configuration

1. Edit `tax_config_canada_2025.json`
2. Update federal or provincial brackets
3. Restart backend server
4. Verify with test scenarios

---

## Support

### Getting Help

- **Documentation**: Start with DEVELOPER_GUIDE.md and ARCHITECTURE.md
- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@retirezest.com

### Common Issues

**Backend won't start**
- Check Python version: `python3 --version` (need 3.10+)
- Verify dependencies: `pip install -r requirements.txt`
- Check port 8000 is available: `lsof -i :8000`

**Frontend build errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (need 18+)
- Verify DATABASE_URL in .env file

**Simulation produces unexpected results**
- Enable debug logging in `modules/simulation.py`
- Create test file with minimal scenario
- Check tax_config for correct year
- Verify account balances are positive

**Database connection errors**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `npx prisma migrate dev`
- Check database exists: `psql -l`

---

## License

[Add your license here]

---

## Acknowledgments

Built with modern financial simulation techniques and Canadian tax regulations. Special thanks to all contributors who have helped improve retirement planning for Canadians.

---

**Questions?** See DEVELOPER_GUIDE.md for detailed development instructions, or ARCHITECTURE.md for technical deep-dives.
