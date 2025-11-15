# Canadian Retirement Planning App - MVP

A web application for Canadian seniors to plan their retirement, calculate government benefits (CPP, OAS, GIS), and project retirement income.

## Project Status

🚧 **In Development** - MVP Phase

### Completed
✅ Next.js 15 with TypeScript initialized
✅ Tailwind CSS configured
✅ Prisma ORM configured with SQLite
✅ Database schema created (Users, Income, Assets, Expenses, Debts, Scenarios, Projections)
✅ Authentication utilities (JWT, bcrypt)
✅ TypeScript types defined
✅ Utility functions created

### In Progress
🔄 Installing dependencies
🔄 Creating authentication pages
🔄 Building dashboard layout

### Upcoming
📋 Financial profile forms
📋 Government benefits calculators (CPP, OAS, GIS)
📋 Retirement projection engine
📋 Tax calculations
📋 Data visualizations
📋 PDF report generation

---

## Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript 5
- **Styling:** Tailwind CSS
- **Database:** SQLite (Prisma ORM)
- **Authentication:** JWT with httpOnly cookies
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Date Utilities:** date-fns

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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create and apply migration
npx prisma migrate reset       # Reset database
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema without migration
```

---

## Features

### Phase 1: Authentication ✅
- User registration
- Login/logout
- JWT-based session management
- Password hashing with bcrypt

### Phase 2: Financial Profile (In Progress)
- Income management (employment, pension, investment)
- Asset tracking (RRSP, TFSA, non-registered)
- Expense categorization
- Debt tracking
- Net worth calculation

### Phase 3: Government Benefits (Upcoming)
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

### Phase 4: Retirement Projection (Upcoming)
- Year-by-year projections (to age 95)
- Tax calculations (federal + provincial)
- RRIF minimum withdrawals
- Asset depletion analysis
- Multiple scenario comparison

### Phase 5: Visualizations (Upcoming)
- Interactive dashboard
- Income breakdown charts
- Cash flow projections
- Asset balance charts
- Tax visualization

### Phase 6: Reports (Upcoming)
- PDF report generation
- Executive summary
- Detailed projections
- Recommendations

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
