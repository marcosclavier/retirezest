# End-to-End Testing for RetireZest Simulation

This directory contains automated end-to-end tests for the RetireZest retirement simulation feature, built with Playwright.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing New Tests](#writing-new-tests)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The E2E test suite validates all 8 withdrawal strategies and edge cases for the retirement simulation feature:

- **Strategy Tests**: Validates correct behavior for each of the 8 withdrawal strategies
- **Edge Case Tests**: Ensures proper error handling and boundary conditions
- **Performance Tests**: Monitors simulation execution time and response times

### Technologies Used

- **Playwright**: Modern E2E testing framework supporting Chromium, Firefox, and WebKit
- **TypeScript**: Type-safe test code
- **Next.js**: Frontend framework
- **FastAPI**: Backend simulation engine (Python)

---

## Test Coverage

### Withdrawal Strategies (8 tests)

| # | Strategy | Description | Test ID |
|---|----------|-------------|---------|
| 1 | corporate-optimized | Minimizes corporate tax for business owners | SIM-CORP-001 |
| 2 | minimize-income | Preserves GIS eligibility and minimizes OAS clawback | SIM-MIN-001 |
| 3 | rrif-splitting | Uses pension income splitting for couples | SIM-SPLIT-001 |
| 4 | capital-gains-optimized | Prioritizes capital gains for favorable tax treatment | SIM-CAPG-001 |
| 5 | tfsa-first | Withdraws from TFSA before RRSP/RRIF | SIM-TFSA-001 |
| 6 | balanced | Balanced withdrawals across all account types | SIM-BAL-001 |
| 7 | rrif-frontload | Tax smoothing with OAS protection (15% pre-OAS, 8% post-OAS) | SIM-FRONT-001 |
| 8 | manual | Custom user-defined withdrawal strategy | SIM-MAN-001 |

### Edge Cases (8 tests)

| # | Edge Case | Test ID |
|---|-----------|---------|
| 1 | Insufficient assets | EDGE-001 |
| 2 | Very long planning horizon (age 120) | EDGE-002 |
| 3 | Zero spending | EDGE-003 |
| 4 | Unsupported province | EDGE-004 |
| 5 | No partner data in couples strategy | EDGE-005 |
| 6 | API timeout handling | EDGE-006 |
| 7 | Missing CSRF token | EDGE-007 |
| 8 | Invalid negative balances | EDGE-008 |

**Total Tests**: 16 (8 strategy + 8 edge cases)

---

## Prerequisites

Before running E2E tests, ensure the following:

### 1. Backend API Running
```bash
cd ../juan-retirement-app
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Running
```bash
npm run dev
# Should be running on http://localhost:3000
```

### 3. Test Database Seeded
You need a test user with completed wizard data:
- **Email**: `test@example.com`
- **Password**: `Test123!`
- **Profile**: Completed wizard with assets, income, and expenses

To create test user:
```bash
# Run database seed script (if available)
npx prisma db seed

# OR manually create via UI:
# 1. Register at /register
# 2. Complete wizard at /onboarding/wizard
# 3. Add financial data
```

### 4. Environment Variables
Create `.env.local` file:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/retirement_app"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Installation

### 1. Install Playwright Dependencies
```bash
npm install -D @playwright/test playwright
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers (~500MB).

### 3. Install System Dependencies (Linux only)
```bash
npx playwright install-deps
```

---

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite

**Strategy Tests Only:**
```bash
npm run test:e2e:strategies
```

**Edge Case Tests Only:**
```bash
npm run test:e2e:edge-cases
```

### Run Single Test
```bash
npx playwright test -g "corporate-optimized"
```

### Run with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

UI mode provides:
- Interactive test execution
- Time-travel debugging
- Watch mode
- Test picker

### Run in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

Debug mode:
- Opens Playwright Inspector
- Allows step-by-step execution
- Inspects element selectors

### Run on Specific Browser
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit
```

### View Test Report
```bash
npm run test:e2e:report
```

Opens HTML report with:
- Test results
- Screenshots
- Videos
- Traces

---

## Test Structure

```
e2e/
├── README.md                       # This file
├── utils/
│   └── test-helpers.ts             # Reusable helper functions
├── fixtures/
│   └── simulation-data.ts          # Test data and scenarios
├── simulation-strategies.spec.ts   # 8 strategy tests
└── simulation-edge-cases.spec.ts   # 8 edge case tests
```

### Helper Functions (`utils/test-helpers.ts`)

Provides reusable functions:

```typescript
// Authentication
login(page, email, password)
logout(page)

// Navigation
navigateToSimulation(page)
navigateToProfile(page)

// Form Filling
selectStrategy(page, strategy)
fillPersonForm(page, personNumber, data)
fillHouseholdForm(page, data)

// Execution
runSimulation(page, expectSuccess)

// Validation
getSimulationResults(page)
getYearByYearData(page, year)
assertSimulationSuccess(page)
assertNoErrors(page)
```

### Test Fixtures (`fixtures/simulation-data.ts`)

Predefined test data:

```typescript
// Person fixtures
standardPerson
corporateAccountHolder
lowIncomePerson
earlyRetiree
partner1
partner2

// Household fixtures
standardHousehold
coupleHousehold
corporateHousehold

// Complete scenarios
testScenarios.corporateOptimized
testScenarios.minimizeIncome
// ... etc

// Edge cases
edgeCaseScenarios.insufficientAssets
edgeCaseScenarios.longPlanningHorizon
// ... etc
```

---

## Writing New Tests

### 1. Create Test File

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { navigateToSimulation, runSimulation } from './utils/test-helpers';

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login setup
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should validate feature X', async ({ page }) => {
    // Test implementation
    await navigateToSimulation(page);
    // ... test steps
  });
});
```

### 2. Add Test Data to Fixtures

```typescript
// e2e/fixtures/simulation-data.ts
export const myScenario = {
  person: {
    // Person data
  },
  household: {
    // Household data
  },
  expectedOutcome: {
    // Expected results
  },
};
```

### 3. Run New Test

```bash
npx playwright test e2e/my-feature.spec.ts
```

---

## Debugging

### 1. Playwright Inspector

```bash
npm run test:e2e:debug
```

Features:
- Step through test execution
- Pause/resume
- Inspect element selectors
- View console logs

### 2. Screenshots on Failure

Screenshots are automatically captured on test failure:
```
test-results/
  ├── screenshots/
  │   ├── corporate-optimized-results.png
  │   └── minimize-income-failure.png
```

### 3. Videos on Failure

Videos are recorded for failed tests:
```
test-results/
  ├── videos/
  │   └── test-failed-20250111.webm
```

### 4. Traces

Traces provide full test execution timeline:
```bash
# View trace
npx playwright show-trace test-results/trace.zip
```

### 5. Console Logs

View console.log output:
```typescript
test('my test', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  // Test code
});
```

### 6. Codegen (Generate Selectors)

```bash
npm run test:e2e:codegen
```

Opens browser to record actions and generate test code.

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Setup Database
        run: |
          npx prisma migrate deploy
          npx prisma db seed

      - name: Start Backend
        run: |
          cd ../juan-retirement-app
          python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &

      - name: Build Frontend
        run: npm run build

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          CI: true
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Environment-Specific Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.CI
      ? 'http://localhost:3000'
      : process.env.BASE_URL || 'http://localhost:3000',
  },
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
});
```

---

## Troubleshooting

### Issue 1: Tests Timeout

**Symptoms**: Tests fail with timeout errors

**Solutions**:
```typescript
// Increase timeout in playwright.config.ts
export default defineConfig({
  timeout: 120 * 1000, // 120 seconds
});

// Or per-test
test('my test', async ({ page }) => {
  test.setTimeout(120000);
  // Test code
});
```

### Issue 2: Backend Not Running

**Symptoms**: API calls fail, simulation doesn't execute

**Solution**:
```bash
# Terminal 1: Start backend
cd ../juan-retirement-app
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd webapp
npm run dev

# Terminal 3: Run tests
npm run test:e2e
```

### Issue 3: Test User Not Found

**Symptoms**: Login fails, test user doesn't exist

**Solution**:
```bash
# Create test user via UI or SQL
psql -d retirement_app

INSERT INTO users (email, password_hash, name)
VALUES ('test@example.com', 'hashed_password', 'Test User');

# Then complete wizard manually or via script
```

### Issue 4: Element Not Found

**Symptoms**: `TimeoutError: locator.click: Target closed`

**Solutions**:
```typescript
// Use data-testid attributes
<button data-testid="run-simulation">Run</button>

// In test
await page.click('[data-testid="run-simulation"]');

// Or wait explicitly
await page.waitForSelector('[data-testid="run-simulation"]');
await page.click('[data-testid="run-simulation"]');
```

### Issue 5: Flaky Tests

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
```typescript
// Add explicit waits
await page.waitForLoadState('networkidle');

// Wait for specific elements
await page.waitForSelector('[data-testid="results"]');

// Use retry logic
await expect(async () => {
  const text = await page.textContent('[data-testid="status"]');
  expect(text).toBe('Success');
}).toPass({ timeout: 30000 });
```

### Issue 6: Browser Crashes

**Symptoms**: Browser instances crash or hang

**Solutions**:
```bash
# Reinstall browsers
npx playwright install --force

# Clear cache
rm -rf ~/.cache/ms-playwright

# Update system dependencies (Linux)
npx playwright install-deps
```

---

## Performance Benchmarks

Expected performance:

| Metric | Target | Threshold |
|--------|--------|-----------|
| Prefill API | < 500ms | 1000ms |
| Simulation API | < 3000ms | 5000ms |
| Results Rendering | < 1000ms | 2000ms |
| Total Test Time | < 60s | 90s |

Monitor performance:
```typescript
test('measure performance', async ({ page }) => {
  const start = Date.now();

  await navigateToSimulation(page);
  await runSimulation(page);

  const duration = Date.now() - start;
  console.log(`Test duration: ${duration}ms`);
  expect(duration).toBeLessThan(60000); // 60 seconds
});
```

---

## Best Practices

### 1. Use Data Test IDs

```tsx
// Component
<button data-testid="run-simulation">Run Simulation</button>

// Test
await page.click('[data-testid="run-simulation"]');
```

### 2. Wait for Network Idle

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Explicit Assertions

```typescript
// Good
await expect(page.locator('[data-testid="success"]')).toBeVisible();

// Bad
const el = await page.locator('[data-testid="success"]');
expect(el).toBeTruthy(); // Doesn't wait
```

### 4. Isolate Tests

```typescript
test.beforeEach(async ({ page, context }) => {
  // Clear cookies/storage
  await context.clearCookies();
  await context.clearPermissions();
});
```

### 5. Use Page Object Model (for larger suites)

```typescript
// pages/SimulationPage.ts
export class SimulationPage {
  constructor(private page: Page) {}

  async selectStrategy(strategy: string) {
    await this.page.click('#strategy');
    await this.page.click(`[data-value="${strategy}"]`);
  }

  async runSimulation() {
    await this.page.click('[data-testid="run-simulation"]');
    await this.page.waitForSelector('[data-testid="results"]');
  }
}

// In test
const simulationPage = new SimulationPage(page);
await simulationPage.selectStrategy('balanced');
await simulationPage.runSimulation();
```

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [RetireZest Manual Test Plan](../SIMULATION_E2E_TEST_PLAN.md)

---

## Support

For issues or questions:

1. Check this README
2. Review [Troubleshooting](#troubleshooting) section
3. Check Playwright documentation
4. Create an issue in the project repository

---

**Last Updated**: January 11, 2026
**Author**: Claude Code
**Version**: 1.0
