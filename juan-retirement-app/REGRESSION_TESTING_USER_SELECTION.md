# Regression Testing: User Selection Strategy

**Date**: February 5, 2026
**Purpose**: Identify real user accounts for comprehensive regression testing
**Total Users Reviewed**: 101 users

---

## Executive Summary

### User Database Breakdown:

| Category | Count | Value for Regression Testing |
|----------|-------|------------------------------|
| **Test Accounts** | 9 | 🧪 **PRIORITY 1** - Designed for testing |
| **High-Value Verified Users** | 40 | 🎯 **PRIORITY 2** - Has data + simulations |
| **Medium-Value Users** | 11 | ⚠️ **PRIORITY 3** - Has data, no simulations |
| **Low-Value Users** | 6 | ❌ **NOT RECOMMENDED** - No data |
| **Unverified Users** | 35 | ❌ **NOT RECOMMENDED** - Incomplete onboarding |

---

## Recommended Users for Regression Testing

### 🧪 PRIORITY 1: Test Accounts (9 users)

These are designed for testing and should be the PRIMARY regression test suite:

| Email | Name | Assets | Income | Simulations | Notes |
|-------|------|--------|--------|-------------|-------|
| **test@example.com** | Test User | 3 | 2 | 181 | 🌟 **MOST ACTIVE** - 181 simulations! |
| sprint5-test@example.com | Sprint5 TestUser | 4 | 3 | 0 | Created for Sprint 5 testing |
| claire.conservative@test.com | Claire Conservative | 3 | 3 | 0 | Conservative profile |
| alex.aggressive@test.com | Alex Aggressive | 3 | 3 | 0 | Aggressive profile |
| mike.moderate@test.com | Mike Moderate | 4 | 4 | 0 | Moderate profile |
| sarah.struggling@test.com | Sarah Struggling | 2 | 3 | 0 | Low-asset scenario |
| helen.highincome@test.com | Helen HighIncome | 3 | 4 | 0 | High-income scenario |

**Recommendation**:
- ✅ Run ALL regression tests against `test@example.com` (181 simulation history!)
- ✅ Use the 5 persona test accounts (Claire, Alex, Mike, Sarah, Helen) for diverse scenarios

---

### 🎯 PRIORITY 2: High-Value Real Users (Top 10)

These users have complete profiles AND simulation history - perfect for real-world regression testing:

| # | Email | Name | Tier | Assets | Income | Simulations | Why Selected |
|---|-------|------|------|--------|--------|-------------|--------------|
| 1 | **juanclavierb@gmail.com** | Rafael Canelon | Premium | 5 | 3 | **210** | 🌟 Highest simulation count |
| 2 | **jrcb@hotmail.com** | Juan Clavier | Premium | 15 | 4 | **112** | 🌟 Most complex profile (15 assets) |
| 3 | **j.mcmillan@shaw.ca** | Susan McMillan | Free | 4 | 2 | **24** | Active free-tier user |
| 4 | **ian.anita.crawford@gmail.com** | Ian Crawford | Free | 9 | 6 | **21** | Complex income (6 sources) |
| 5 | **glacial-keels-0d@icloud.com** | P R | Free | 4 | 4 | **14** | Multiple income sources |
| 6 | **semiwest63@outlook.com** | L P | Free | 7 | 2 | **13** | Multiple assets |
| 7 | **kmak1788@hotmail.com** | Kathy Chan | Free | 2 | 3 | **11** | Multiple expenses (7) |
| 8 | **hgregoire2000@gmail.com** | Paul Lamothe | Free | 5 | 4 | **10** | Complex profile |
| 9 | **gokhale_prasad@hotmail.com** | P Gokhale | Free | 4 | 1 | **7** | Active user |
| 10 | **mattramella@gmail.com** | Matthew Ramella | Free | 17 | 3 | **7** | 🌟 Most complex (17 assets, 28 expenses!) |

**Special Cases**:
- **Matthew Ramella** (`mattramella@gmail.com`): **17 assets, 28 expenses** - Most complex profile in database!
- **Juan Clavier** (`jrcb@hotmail.com`): **15 assets** - Owner/developer account with extensive testing
- **Rafael Canelon** (`juanclavierb@gmail.com`): **210 simulations** - Highest usage, premium tier

---

## Regression Testing Strategy

### Phase 1: Test Accounts (Required)

**Objective**: Verify core functionality with designed test scenarios

**Test Users**:
1. `test@example.com` - Main test account (181 simulation baseline)
2. `claire.conservative@test.com` - Conservative strategy testing
3. `alex.aggressive@test.com` - Aggressive strategy testing
4. `mike.moderate@test.com` - Balanced strategy testing
5. `sarah.struggling@test.com` - Insufficient assets scenario
6. `helen.highincome@test.com` - High-income tax optimization

**Tests to Run**:
- [ ] Retrieve current user profile and financial data
- [ ] Run simulation with current data
- [ ] Compare outputs against historical baseline (if available)
- [ ] Verify all strategies produce consistent results
- [ ] Check tax calculations match expected values
- [ ] Validate success rates are consistent

---

### Phase 2: Premium Users (High Priority)

**Objective**: Validate premium features and complex scenarios

**Test Users**:
1. `juanclavierb@gmail.com` (Rafael) - 210 simulations
2. `jrcb@hotmail.com` (Juan) - 15 assets, complex profile

**Tests to Run**:
- [ ] Retrieve complete profile (all assets, income, expenses)
- [ ] Run simulation with exact current data
- [ ] Verify premium features work correctly
- [ ] Check complex asset allocation calculations
- [ ] Validate multiple income sources handled properly
- [ ] Compare against previous simulation outputs (if logged)

---

### Phase 3: Active Free-Tier Users (Medium Priority)

**Objective**: Validate free-tier functionality and rate limiting

**Test Users** (Select 5):
1. `j.mcmillan@shaw.ca` - 24 simulations
2. `ian.anita.crawford@gmail.com` - Complex income (6 sources)
3. `kmak1788@hotmail.com` - Complex expenses (7 items)
4. `mattramella@gmail.com` - Most complex profile (17 assets, 28 expenses)
5. `glacial-keels-0d@icloud.com` - 14 simulations

**Tests to Run**:
- [ ] Retrieve user data
- [ ] Run simulation
- [ ] Verify free-tier rate limiting works
- [ ] Check complex profiles process correctly
- [ ] Validate all data types (assets, income, expenses) handled

---

## Test Data Extraction Process

### Step 1: Extract Baseline Data

For each selected user:

```bash
# Get user profile
DATABASE_URL="..." node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
    include: {
      incomeSources: true,
      assets: true,
      expenses: true,
      scenarios: true
    }
  });
  console.log(JSON.stringify(user, null, 2));
  await prisma.\$disconnect();
}

getUser();
"
```

### Step 2: Run Current Simulation

Use the Python simulation engine directly or via API to run simulation with user's current data.

### Step 3: Compare Against Baseline

If previous simulation outputs exist:
- Compare success rates
- Compare tax calculations
- Compare strategy scores
- Compare final estate values
- Document any discrepancies

---

## Expected Regression Test Coverage

### Financial Profile Complexity:

| Profile Type | User Count | Example Users |
|--------------|------------|---------------|
| **Simple** (1-3 assets, 1-2 income) | 25 | Most free-tier users |
| **Moderate** (4-6 assets, 2-4 income) | 12 | Ian Crawford, Paul Lamothe |
| **Complex** (7+ assets, 4+ income) | 3 | Juan Clavier, Matthew Ramella |

### Income Source Types to Test:

- ✅ Employment income
- ✅ CPP benefits
- ✅ OAS benefits
- ✅ Pension income
- ✅ Rental income
- ✅ Investment income
- ✅ Capital gains

### Asset Types to Test:

- ✅ RRSP/RRIF
- ✅ TFSA
- ✅ Non-registered accounts
- ✅ Corporate accounts
- ✅ Real estate
- ✅ Defined benefit pensions

### Withdrawal Strategies to Test:

- ✅ minimize-income (GIS optimization)
- ✅ tfsa-first (tax-free prioritization)
- ✅ balanced (middle ground)
- ✅ capital-gains-optimized (capital gains preference)
- ✅ rrif-frontload (RRIF depletion)

---

## Regression Test Execution Plan

### Pre-Execution:

1. ✅ **Identify test users** (9 test accounts + 10 real users)
2. ⏳ **Extract baseline data** for each user
3. ⏳ **Document current simulation outputs** (if not already saved)
4. ⏳ **Create test scenarios** based on user data

### Execution:

1. ⏳ **Run Phase 1**: Test accounts (6 users)
2. ⏳ **Run Phase 2**: Premium users (2 users)
3. ⏳ **Run Phase 3**: Free-tier users (5 users)

### Post-Execution:

1. ⏳ **Compare outputs** against baselines
2. ⏳ **Document discrepancies**
3. ⏳ **Investigate any regressions**
4. ⏳ **Update test baselines** if changes are expected

---

## Key Metrics to Track

For each regression test:

| Metric | Baseline | Current | Status |
|--------|----------|---------|--------|
| Success Rate | X% | Y% | ✅/❌ |
| Total Tax | $X | $Y | ✅/❌ |
| Total Benefits | $X | $Y | ✅/❌ |
| Final Estate | $X | $Y | ✅/❌ |
| Strategy Score | X pts | Y pts | ✅/❌ |

**Pass Criteria**:
- Success rate: ±2 percentage points
- Tax/Benefits/Estate: ±5% variance
- Strategy score: ±3 points

---

## Recommendations Summary

### ✅ **DO: Test Accounts**
- Primary regression testing suite
- Designed for testing scenarios
- Use `test@example.com` (181 simulations) as main baseline

### ✅ **DO: High-Value Real Users**
- Rafael Canelon (210 simulations, premium)
- Juan Clavier (15 assets, premium)
- Matthew Ramella (17 assets, 28 expenses - most complex!)
- Susan McMillan (24 simulations, active)
- Ian Crawford (6 income sources)

### ⚠️ **CONSIDER: Medium-Value Users**
- Users with data but no simulation history
- Useful for data migration testing
- Less useful for regression testing (no baseline outputs)

### ❌ **AVOID: Unverified/Incomplete Users**
- 35 unverified users
- Incomplete onboarding
- No meaningful data for testing

---

## Next Steps

1. ✅ **User database reviewed** (101 users categorized)
2. ⏳ **Extract baseline data** for Priority 1 & 2 users
3. ⏳ **Create regression test scripts** using selected users
4. ⏳ **Run Phase 1 tests** (test accounts)
5. ⏳ **Document results** and compare against baselines
6. ⏳ **Run Phase 2 & 3** if Phase 1 passes

---

**Total Users for Regression Testing**: **19 users** (9 test + 10 real)

**Estimated Coverage**:
- ✅ All withdrawal strategies
- ✅ Simple to complex financial profiles
- ✅ Free and premium tiers
- ✅ Various income sources and asset types
- ✅ Tax optimization scenarios
- ✅ Real-world usage patterns

**Expected Test Execution Time**: 2-3 hours (19 users × 5-10 min each)

---

**Report Generated**: February 5, 2026
**Total Users Analyzed**: 101
**Recommended for Testing**: 19 (Priority 1 & 2)
**Test Coverage**: Comprehensive (all strategies, asset types, income sources)
