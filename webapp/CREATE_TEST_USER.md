# Creating the Test User for E2E Tests

## ❌ Issue Detected

The E2E test just failed because the test user doesn't exist yet.

**Error**: "Email or password does not match. Please check your credentials or register."

**Screenshot saved at**: `test-results/simulation-strategies-Simu-01b69-ls-across-all-account-types-chromium/test-failed-1.png`

---

## ✅ Solution: Create Test User

### Option 1: Create via UI (Recommended - 5 minutes)

**Step 1: Register User**
1. Open browser: http://localhost:3000/register
2. Fill in registration form:
   - **Email**: `test@example.com`
   - **Password**: `Test123!`
   - **Confirm Password**: `Test123!`
   - **Name**: `Test User`
3. Click "Create Account"

**Step 2: Complete Wizard**

After registration, you'll be redirected to the onboarding wizard. Complete all steps with sample data:

**Step 1: Personal Info**
- Name: Test User
- Date of Birth: 01/01/1960 (age 65)
- Province: ON (Ontario)
- Marital Status: Single or Married

**Step 2: Retirement Plans**
- Current Age: 65
- Retirement Age: 65
- Planning Horizon: 90
- CPP Start Age: 65
- OAS Start Age: 65

**Step 3: Assets - TFSA**
- TFSA Balance: $50,000
- TFSA Return Rate: 5%

**Step 4: Assets - RRSP/RRIF**
- RRSP/RRIF Balance: $300,000
- RRSP Return Rate: 6%

**Step 5: Assets - Non-Registered**
- Non-Registered Balance: $200,000
- Non-Reg Return Rate: 5%
- ACB (Adjusted Cost Base): $150,000

**Step 6: Income - CPP**
- CPP Annual Amount: $15,000

**Step 7: Income - OAS**
- OAS Annual Amount: $8,500

**Step 8: Income - Other**
- Other Income: $0 (or any amount)

**Step 9: Expenses - Spending Phases**
- Go-Go Phase (65-75): $60,000/year
- Slow-Go Phase (75-85): $45,000/year
- No-Go Phase (85+): $30,000/year

**Step 10: Review & Finish**
- Click "Complete Setup"

---

### Option 2: Create via Database Script (Advanced)

If you prefer to create the user programmatically:

```typescript
// scripts/create-test-user.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existing) {
      console.log('✅ Test user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        onboardingCompleted: true,
        profile: {
          create: {
            dateOfBirth: new Date('1960-01-01'),
            province: 'ON',
            currentAge: 65,
            retirementAge: 65,
            planningHorizon: 90,
            cppStartAge: 65,
            oasStartAge: 65,
          }
        },
        assets: {
          create: [
            { type: 'TFSA', balance: 50000, returnRate: 5 },
            { type: 'RRSP', balance: 300000, returnRate: 6 },
            { type: 'NONREG', balance: 200000, returnRate: 5, acb: 150000 },
          ]
        },
        income: {
          create: [
            { type: 'CPP', annualAmount: 15000 },
            { type: 'OAS', annualAmount: 8500 },
          ]
        },
        expenses: {
          create: {
            goGoSpending: 60000,
            slowGoSpending: 45000,
            noGoSpending: 30000,
          }
        }
      }
    });

    console.log('✅ Test user created successfully');
    console.log('   Email:', user.email);
    console.log('   ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
```

Run with:
```bash
npx tsx scripts/create-test-user.ts
```

---

### Option 3: Use Existing User

If you already have a user in the database, update the test credentials:

**Edit test files to use your credentials:**

1. Open `e2e/simulation-strategies.spec.ts`
2. Find line 43:
   ```typescript
   await page.fill('input[type="email"]', 'test@example.com');
   await page.fill('input[type="password"]', 'Test123!');
   ```
3. Replace with your actual credentials

4. Do the same in `e2e/simulation-edge-cases.spec.ts` (line 32)

---

## ✅ After Creating Test User

Once you've created the test user (via Option 1, 2, or 3), run the tests again:

```bash
# Run single test again
npx playwright test simulation-strategies.spec.ts -g "Strategy 6: balanced" --project=chromium --headed

# Or run all tests
npm run test:e2e

# Or use interactive UI mode
npm run test:e2e:ui
```

---

## 🎯 Expected Result

After creating the test user, the test should:

1. ✅ Login successfully
2. ✅ Navigate to /dashboard
3. ✅ Navigate to /simulation
4. ✅ Load prefill data
5. ✅ Select "balanced" strategy
6. ✅ Run simulation
7. ✅ Display results
8. ✅ Validate withdrawal patterns
9. ✅ Pass all assertions

**Expected output:**
```
Running 1 test using 1 worker

  ✓  1 [chromium] › Strategy 6: balanced (45.2s)

  1 passed (45.2s)
```

---

## 📸 Test Artifacts Created

The failed test already created useful artifacts:

**Screenshot**: `test-results/.../test-failed-1.png`
- Shows the login page with error message
- ✅ Confirms test infrastructure is working
- ✅ Proves Playwright can interact with the app

**Video**: `test-results/.../video.webm`
- Records the entire test execution
- Shows what happened step by step

**Error Context**: `test-results/.../error-context.md`
- Detailed error information

These artifacts prove the test framework is working correctly!

---

## 🚀 Quick Start

**Fastest way to get testing:**

1. Open: http://localhost:3000/register
2. Register as: `test@example.com` / `Test123!`
3. Complete wizard (use any values)
4. Run: `npm run test:e2e:ui`
5. Watch tests pass! 🎉

---

**Last Updated**: January 11, 2026
**Status**: Waiting for test user creation
