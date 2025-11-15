# Canadian Retirement Planning App - Setup Guide

## Current Status

✅ **Completed:**
1. Project structure created in `webapp/` directory
2. Next.js 15 with TypeScript configured
3. Tailwind CSS configured
4. Basic configuration files created:
   - `package.json` - Dependencies
   - `tsconfig.json` - TypeScript configuration
   - `tailwind.config.ts` - Tailwind CSS configuration
   - `next.config.ts` - Next.js configuration
   - `.eslintrc.json` - ESLint configuration
   - `.gitignore` - Git ignore rules
5. Basic app structure created:
   - `app/layout.tsx` - Root layout
   - `app/page.tsx` - Homepage
   - `app/globals.css` - Global styles

🔄 **In Progress:**
- Installing npm dependencies

📋 **Next Steps:**
1. Complete dependency installation
2. Install additional packages (Prisma, React Hook Form, etc.)
3. Set up database schema
4. Create authentication system
5. Build financial profile forms
6. Implement calculation engines

---

## Quick Start Instructions

### 1. Complete Installation

Once the current npm install completes, install the additional dependencies:

```bash
cd C:\Projects\retirement-app\webapp

# Install Prisma (database ORM)
npm install prisma @prisma/client

# Install form libraries
npm install react-hook-form @hookform/resolvers zod

# Install authentication
npm install jose bcryptjs
npm install @types/bcryptjs --save-dev

# Install charting library
npm install recharts

# Install date utilities
npm install date-fns
```

### 2. Initialize Prisma

```bash
cd C:\Projects\retirement-app\webapp

# Initialize Prisma with SQLite
npx prisma init --datasource-provider sqlite
```

This will create:
- `prisma/schema.prisma` - Database schema file
- `.env` - Environment variables file

### 3. Create Database Schema

Edit `prisma/schema.prisma` and add the complete database schema (provided below).

### 4. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# View database in browser
npx prisma studio
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

---

## Complete Database Schema

Replace the contents of `prisma/schema.prisma` with this:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String
  firstName         String?
  lastName          String?
  dateOfBirth       DateTime?
  province          String?
  maritalStatus     String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

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
  type        String
  description String?
  amount      Float
  frequency   String
  isTaxable   Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Asset {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String
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
  category    String
  description String?
  amount      Float
  frequency   String
  isEssential Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Debt {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String
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
  results               String
  successProbability    Float?
  totalLifetimeIncome   Float?
  estateValue           Float?
  createdAt             DateTime  @default(now())
}
```

---

## Environment Variables

Create/edit `.env` in the `webapp` directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (change this to a random string)
JWT_SECRET="your-super-secret-jwt-key-change-me"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Project Structure

```
retirement-app/
├── development-plan.md           # Full 10-month development plan
├── mvp-development-plan.md       # Local MVP development plan
├── retirement-app-specifications.md  # Technical specifications
├── SETUP-GUIDE.md                # This file
└── webapp/                       # Next.js application
    ├── app/                      # Next.js app directory
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx             # Homepage
    │   ├── globals.css          # Global styles
    │   ├── (auth)/              # Authentication routes
    │   │   ├── login/
    │   │   └── register/
    │   ├── (dashboard)/         # Protected dashboard routes
    │   │   ├── dashboard/
    │   │   ├── profile/
    │   │   ├── benefits/
    │   │   ├── projection/
    │   │   ├── scenarios/
    │   │   └── reports/
    │   └── api/                 # API routes
    │       ├── auth/
    │       ├── profile/
    │       ├── benefits/
    │       ├── projection/
    │       └── scenarios/
    ├── components/              # React components
    │   ├── ui/                  # shadcn/ui components
    │   ├── layout/              # Layout components
    │   ├── dashboard/           # Dashboard components
    │   ├── charts/              # Chart components
    │   └── forms/               # Form components
    ├── lib/                     # Utility libraries
    │   ├── prisma.ts           # Prisma client
    │   ├── auth.ts             # Auth utilities
    │   ├── calculations/       # Calculation functions
    │   │   ├── cpp.ts
    │   │   ├── oas.ts
    │   │   ├── gis.ts
    │   │   ├── tax.ts
    │   │   └── projection.ts
    │   └── utils.ts            # General utilities
    ├── prisma/                 # Database
    │   ├── schema.prisma       # Database schema
    │   ├── migrations/         # Migration files
    │   └── seed.ts            # Seed data
    ├── public/                 # Static files
    ├── types/                  # TypeScript types
    ├── .env                    # Environment variables
    ├── .gitignore             # Git ignore
    ├── package.json           # Dependencies
    ├── tsconfig.json          # TypeScript config
    ├── tailwind.config.ts     # Tailwind config
    └── next.config.ts         # Next.js config
```

---

## Development Workflow

### Daily Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **View the app:**
   Open `http://localhost:3000` in your browser

3. **View the database:**
   ```bash
   npx prisma studio
   ```
   Opens at `http://localhost:5555`

4. **Make changes:**
   - Edit files in `app/`, `components/`, `lib/`
   - Changes hot-reload automatically

5. **Database changes:**
   ```bash
   # After editing schema.prisma
   npx prisma migrate dev --name description_of_change
   npx prisma generate
   ```

### Testing

- Manual testing in browser
- Test responsive design (Chrome DevTools, F12)
- Test calculations with sample data
- Verify data persistence

---

## Next Development Tasks

### Phase 1: Authentication (Days 1-3)

1. Create authentication utility functions
2. Build login page
3. Build registration page
4. Implement JWT authentication
5. Create protected route middleware

### Phase 2: Financial Profile (Days 4-11)

1. Create income management interface
2. Create assets management interface
3. Create expenses management interface
4. Create debts management interface
5. Build financial summary dashboard

### Phase 3: Government Benefits (Days 12-16)

1. Implement CPP calculator
2. Implement OAS calculator
3. Implement GIS calculator
4. Create benefits summary dashboard
5. Add comparison visualizations

### Phase 4: Retirement Projection (Days 17-23)

1. Build tax calculation functions
2. Create retirement projection algorithm
3. Implement RRIF withdrawal logic
4. Create projection results display
5. Add year-by-year data table

### Phase 5: Dashboard & Charts (Days 24-29)

1. Create main dashboard
2. Build retirement readiness score
3. Create data visualizations (charts)
4. Implement scenario planning
5. Add scenario comparison

### Phase 6: Reports & Polish (Days 30-34)

1. Implement PDF report generation
2. Polish UI/UX
3. Add help text and tooltips
4. Comprehensive testing
5. Create demo data

---

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create and run migration
npx prisma migrate reset       # Reset database
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema without migration
npx prisma db seed             # Seed database

# Dependencies
npm install <package>          # Install package
npm uninstall <package>        # Remove package
npm update                     # Update packages
npm outdated                   # Check for updates
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Database locked
```bash
# Close Prisma Studio and any database connections
# Then reset the database
npx prisma migrate reset
```

### Dependencies issues
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma client not found
```bash
# Regenerate Prisma client
npx prisma generate
```

---

## Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- React Hook Form: https://react-hook-form.com/
- Recharts: https://recharts.org/

### Government Resources
- CPP: https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
- OAS: https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html
- GIS: https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html
- Tax Rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html

---

## Demo Credentials (After Setup)

Once you create seed data, you can use these demo credentials:

- **Email:** demo@retirement.app
- **Password:** demo123

---

## Important Notes

⚠️ **This is a development/demo application:**
- SQLite database (single file, not suitable for production)
- Basic JWT authentication (not production-grade security)
- No email verification
- No rate limiting
- English only
- Local hosting only

⚠️ **For demonstration purposes only:**
- Do not use for actual financial planning
- Calculations need CFP validation
- No legal disclaimers
- Not PIPEDA compliant

---

## Getting Help

If you encounter issues:

1. Check the error message carefully
2. Search the error on Google/Stack Overflow
3. Check Next.js/Prisma documentation
4. Review the `mvp-development-plan.md` for guidance
5. Check that all dependencies are installed correctly

---

**Happy Coding! 🚀**

The foundation is set. Now you can start building the features step by step according to the MVP development plan.
