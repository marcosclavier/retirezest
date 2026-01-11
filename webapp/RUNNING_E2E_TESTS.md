# Running E2E Tests - Quick Start Guide

**Date**: January 11, 2026
**Status**: ✅ Ready to Execute

---

## 🚀 Quick Start (3 Steps)

### Step 1: Verify Prerequisites

Before running tests, ensure all services are running:

```bash
# Terminal 1: Backend API (should already be running)
cd ../juan-retirement-app
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend (should already be running)
cd webapp
npm run dev
```

**✅ Verify Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Step 2: Ensure Test User Exists

The tests require a user with email `test@example.com` and password `Test123!`.

**Option A: Check if user exists**
```bash
# Try logging in at http://localhost:3000/login
# Email: test@example.com
# Password: Test123!
```

**Option B: Create test user if needed**
1. Go to http://localhost:3000/register
2. Register with:
   - Email: `test@example.com`
   - Password: `Test123!`
   - Name: `Test User`
3. Complete the wizard with any financial data

### Step 3: Run Tests

```bash
# Terminal 3: Run tests
cd webapp

# Option 1: Interactive UI Mode (RECOMMENDED for first run)
npm run test:e2e:ui

# Option 2: Headless mode (run all tests)
npm run test:e2e

# Option 3: Watch browser execution
npm run test:e2e:headed

# Option 4: Debug mode
npm run test:e2e:debug
```

---

## 📊 Available Test Commands

### Run All Tests
```bash
npm run test:e2e
```
Runs all 16 tests (8 strategies + 8 edge cases) in headless mode across all browsers.

### Interactive UI Mode (Best for First Run)
```bash
npm run test:e2e:ui
```
**Features:**
- ✅ Watch mode - tests re-run on file changes
- ✅ Test picker - select specific tests
- ✅ Time travel debugging - step through execution
- ✅ Inspector - examine DOM at any point
- ✅ Trace viewer - see full timeline

**Recommended for:**
- First-time execution
- Writing new tests
- Debugging failures
- Understanding test flow

### Run Specific Test Suite
```bash
# Strategy tests only (8 tests)
npm run test:e2e:strategies

# Edge case tests only (8 tests)
npm run test:e2e:edge-cases
```

### Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector to step through tests line by line.

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```
Watch tests execute in a visible browser window.

### View HTML Report
```bash
npm run test:e2e:report
```
Opens detailed HTML report with:
- Test results (pass/fail)
- Screenshots
- Videos
- Error messages
- Execution timeline

### Generate Test Code
```bash
npm run test:e2e:codegen
```
Record actions in browser and generate test code automatically.

---

## 🎯 Test Coverage

### 8 Withdrawal Strategy Tests

| # | Strategy | Test ID | What It Validates |
|---|----------|---------|-------------------|
| 1 | corporate-optimized | SIM-CORP-001 | Corporate account withdrawals prioritized |
| 2 | minimize-income | SIM-MIN-001 | TFSA preferred, low taxable income |
| 3 | rrif-splitting | SIM-SPLIT-001 | Income splitting for couples |
| 4 | capital-gains-optimized | SIM-CAPG-001 | NonReg withdrawals first |
| 5 | tfsa-first | SIM-TFSA-001 | TFSA depletion before RRSP/RRIF |
| 6 | balanced | SIM-BAL-001 | Proportional withdrawals |
| 7 | rrif-frontload | SIM-FRONT-001 | 15% pre-OAS, 8% post-OAS |
| 8 | manual | SIM-MAN-001 | Custom user strategy |

### 8 Edge Case Tests

| # | Edge Case | Test ID | What It Validates |
|---|-----------|---------|-------------------|
| 1 | Insufficient assets | EDGE-001 | Underfunding warnings |
| 2 | Long planning horizon | EDGE-002 | 55+ year simulation |
| 3 | Zero spending | EDGE-003 | Asset growth |
| 4 | Unsupported province | EDGE-004 | Province mapping |
| 5 | No couple data | EDGE-005 | Fallback behavior |
| 6 | API timeout | EDGE-006 | Error handling |
| 7 | Missing CSRF | EDGE-007 | Security validation |
| 8 | Invalid input | EDGE-008 | Input validation |

**Total: 16 automated tests**

---

## 🔍 Understanding Test Results

### Successful Test Output
```
Running 16 tests using 5 workers

  ✓  1 simulation-strategies.spec.ts:54:3 › Strategy 1: corporate-optimized (5.2s)
  ✓  2 simulation-strategies.spec.ts:106:3 › Strategy 2: minimize-income (4.8s)
  ✓  3 simulation-strategies.spec.ts:153:3 › Strategy 3: rrif-splitting (5.1s)
  ...

  16 passed (1.2m)
```

### Failed Test Output
```
  ✗  1 simulation-strategies.spec.ts:54:3 › Strategy 1: corporate-optimized (5.2s)

    Error: expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received: 0

      at simulation-strategies.spec.ts:89:29
```

### Viewing Detailed Results
```bash
# Open HTML report
npm run test:e2e:report
```

The HTML report includes:
- ✅ Test pass/fail status
- 📸 Screenshots (on failure)
- 🎥 Videos (on failure)
- 📊 Execution timeline
- 🐛 Error messages with stack traces

---

## 🛠️ Troubleshooting

### Issue 1: "Frontend not ready"

**Problem**: Tests can't connect to http://localhost:3000

**Solution**:
```bash
# Start frontend
cd webapp
npm run dev

# Wait for "Ready in X.Xs" message
# Then re-run tests
```

### Issue 2: "Backend not ready"

**Problem**: Tests can't connect to http://localhost:8000

**Solution**:
```bash
# Start backend
cd ../juan-retirement-app
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# Wait for "Application startup complete" message
# Then re-run tests
```

### Issue 3: "Test user not found"

**Problem**: Login fails with test@example.com

**Solution**:
1. Go to http://localhost:3000/register
2. Create user: `test@example.com` / `Test123!`
3. Complete wizard with financial data
4. Re-run tests

### Issue 4: Tests timeout

**Problem**: Tests fail with "Timeout 90000ms exceeded"

**Solution**:
```bash
# Increase timeout in playwright.config.ts
timeout: 120 * 1000  # 120 seconds

# Or ensure backend is responding quickly
curl http://localhost:8000/health
```

### Issue 5: Element not found

**Problem**: `TimeoutError: locator.click: Target closed`

**Solution**:
```bash
# Run in UI mode to see what's happening
npm run test:e2e:ui

# Or run in headed mode
npm run test:e2e:headed

# Check if UI changed and selectors need updating
```

### Issue 6: Database connection errors

**Problem**: Prisma errors or "terminating connection"

**Solution**:
```bash
# Check database is running
psql -d retirement_app -c "SELECT 1;"

# Restart database if needed
# Then restart frontend
```

---

## 📸 Test Artifacts

Tests automatically capture artifacts on failure:

### Screenshots
**Location**: `test-results/screenshots/`

Example:
```
test-results/screenshots/
  corporate-optimized-results.png
  minimize-income-failure.png
  insufficient-assets-warning.png
```

### Videos
**Location**: `test-results/videos/`

Videos show full browser session for failed tests.

### Traces
**Location**: `test-results/traces/`

View with:
```bash
npx playwright show-trace test-results/trace.zip
```

Traces include:
- Network requests
- Console logs
- DOM snapshots
- Timing information

---

## 🎨 Using Playwright UI Mode

The best way to interact with tests:

```bash
npm run test:e2e:ui
```

### Features:

**1. Test Picker**
- Select which tests to run
- Run single test or entire suite
- Filter by test name

**2. Watch Mode**
- Tests re-run when files change
- Instant feedback loop
- Great for test development

**3. Time Travel**
- Step through test execution
- See DOM state at each step
- Understand what happened

**4. Inspector**
- Examine elements
- Test selectors
- See computed styles

**5. Trace Viewer**
- Full timeline of test execution
- Network activity
- Console logs
- Screenshots at each step

### Workflow:
1. Run `npm run test:e2e:ui`
2. Select test from list
3. Click "Run" or "Debug"
4. Watch execution in real-time
5. Click timeline to jump to any point
6. Inspect elements and network calls

---

## 🔄 CI/CD Integration (Future)

The test suite is ready for CI/CD integration.

### GitHub Actions Example

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
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

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Setup Database
        run: |
          npx prisma migrate deploy
          npx prisma db seed

      - name: Start Backend
        run: |
          cd ../juan-retirement-app
          python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 Additional Resources

### Documentation
- [e2e/README.md](e2e/README.md) - Complete testing guide
- [AUTOMATED_E2E_TEST_IMPLEMENTATION.md](AUTOMATED_E2E_TEST_IMPLEMENTATION.md) - Implementation details
- [SIMULATION_E2E_TEST_PLAN.md](SIMULATION_E2E_TEST_PLAN.md) - Manual test plan

### Playwright Resources
- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### Test Files
- `e2e/simulation-strategies.spec.ts` - Strategy tests
- `e2e/simulation-edge-cases.spec.ts` - Edge case tests
- `e2e/utils/test-helpers.ts` - Helper functions
- `e2e/fixtures/simulation-data.ts` - Test data
- `playwright.config.ts` - Playwright configuration

---

## ✅ Pre-Flight Checklist

Before running tests, verify:

- [ ] Frontend running on http://localhost:3000
- [ ] Backend running on http://localhost:8000
- [ ] Test user exists (test@example.com / Test123!)
- [ ] Test user has completed wizard
- [ ] Database is accessible
- [ ] Playwright browsers installed (`npx playwright install`)

**Ready to run:**
```bash
npm run test:e2e:ui
```

---

## 🎉 Success!

When all tests pass, you'll see:

```
Running 16 tests using 5 workers

  ✓  1 Strategy 1: corporate-optimized (5.2s)
  ✓  2 Strategy 2: minimize-income (4.8s)
  ✓  3 Strategy 3: rrif-splitting (5.1s)
  ✓  4 Strategy 4: capital-gains-optimized (5.0s)
  ✓  5 Strategy 5: tfsa-first (4.9s)
  ✓  6 Strategy 6: balanced (5.1s)
  ✓  7 Strategy 7: rrif-frontload (5.3s)
  ✓  8 Strategy 8: manual (4.7s)
  ✓  9 Edge Case 1: Insufficient assets (5.5s)
  ✓ 10 Edge Case 2: Long planning horizon (6.2s)
  ✓ 11 Edge Case 3: Zero spending (5.0s)
  ✓ 12 Edge Case 4: Unsupported province (5.1s)
  ✓ 13 Edge Case 5: No couple data (4.9s)
  ✓ 14 Edge Case 6: API timeout (65.2s)
  ✓ 15 Edge Case 7: Missing CSRF (5.0s)
  ✓ 16 Edge Case 8: Invalid input (4.8s)

  16 passed (1.5m)
```

**View detailed report:**
```bash
npm run test:e2e:report
```

---

**Happy Testing! 🚀**

**Last Updated**: January 11, 2026
**Author**: Claude Code
**Version**: 1.0.0
