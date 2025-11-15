# Calculation Validation Report
**Canadian Retirement Planning Application**
**Version:** 1.0 MVP
**Last Updated:** November 14, 2025

---

## Purpose

This document validates the accuracy of all financial calculations against:
1. Official Government of Canada calculators
2. Industry-standard formulas
3. 2025 government benefit rates and tax rates
4. Real-world test scenarios

**Acceptance Criteria:** All calculations must be within ±5% of official sources.

---

## Test Scenarios

### Scenario A: Average Canadian Retiree
**Profile:**
- Age: 65
- Province: Ontario
- Marital Status: Single
- RRSP Balance: $250,000
- TFSA Balance: $95,000
- Non-Registered: $0
- CPP Contributions: 40 years at average wage
- OAS Residency: 40 years in Canada
- Annual Expenses: $40,000
- Investment Return: 5%
- Inflation: 2%

#### Expected Results (from Government Calculators):
- **CPP at 65:** ~$1,100 - $1,200/month
- **OAS at 65:** $713.34/month (full residency, 2025 rate)
- **GIS:** $0 (income too high)

#### Application Results:
- **CPP at 65:** $_____________
- **OAS at 65:** $_____________
- **GIS:** $_____________

#### Variance:
- CPP: _______% (within ±5%? Yes/No)
- OAS: _______% (within ±5%? Yes/No)

#### Tax Calculation Validation:
- Total retirement income: ~$45,000/year (CPP + OAS + withdrawals)
- Expected Federal Tax (2025 brackets):
  - First $55,867 @ 15% = Taxable income × 0.15
  - Less: Basic Personal Amount credit (~$2,355)
  - Expected: ~$4,400/year federal
- Expected Ontario Tax:
  - First $51,446 @ 5.05%
  - Expected: ~$2,275/year provincial
- **Total Tax Expected:** ~$6,675/year

#### Application Results:
- Total Annual Tax: $_____________
- Variance: _______% (within ±5%? Yes/No)

---

### Scenario B: Early Retiree (Age 60)
**Profile:**
- Current Age: 60
- Retirement Age: 60
- Life Expectancy: 90
- Province: Ontario
- RRSP: $800,000
- TFSA: $150,000
- Non-Registered: $100,000
- CPP Start Age: 70 (deferred)
- OAS Start Age: 65
- Annual Expenses: $70,000
- Investment Return: 5%
- Inflation: 2%

#### Expected Behavior:
1. **Ages 60-64:** No CPP/OAS, live off investments
2. **Age 65:** OAS begins ($713/month = $8,556/year)
3. **Age 70:** CPP begins at 142% (deferred 5 years)
4. **Age 71:** RRSP→RRIF conversion, minimum withdrawals begin

#### CPP at Age 70 Calculation:
- Base CPP (at 65): ~$1,200/month
- Deferred 5 years: 1,200 × 1.42 = $1,704/month
- **Expected CPP at 70:** $1,700-$1,750/month

#### Application Results:
- CPP at age 70: $_____________/month
- Variance: _______% (within ±5%? Yes/No)

#### RRIF Conversion (Age 71):
- RRSP balance at age 71: ~$_______ (after growth and withdrawals)
- RRIF minimum withdrawal rate at 71: 5.28%
- Expected minimum withdrawal: RRSP balance × 0.0528
- **Expected:** ~$_______ (calculated)

#### Application Results:
- RRSP balance at age 71: $_____________
- RRIF minimum withdrawal: $_____________
- Variance: _______% (within ±5%? Yes/No)

#### Withdrawal Strategy Validation:
- **Expected Order:**
  1. Non-Registered first (ages 60-62) - lower tax on capital gains
  2. TFSA (ages 63-69) - tax-free
  3. RRSP/RRIF (age 70+) - fully taxable but required

#### Application Results:
- Withdrawal order correct? Yes/No
- Non-Reg depleted by age: _______
- TFSA depleted by age: _______
- RRSP/RRIF used from age: _______

---

### Scenario C: Low-Income Senior
**Profile:**
- Age: 65
- Province: Ontario
- Marital Status: Single
- Assets: $50,000 (TFSA)
- CPP: $400/month (partial contributions)
- OAS: $713/month (full residency)
- Annual Income: $4,800 (CPP) + $8,556 (OAS) = $13,356
- Annual Expenses: $24,000

#### Expected GIS Calculation:
- Maximum GIS (Single, 2025): $1,086.88/month = $13,043/year
- GIS-countable income: $13,356 - $5,000 (exemption) = $8,356
- GIS reduction: $8,356 × 0.50 = $4,178
- **Expected GIS:** $13,043 - $4,178 = $8,865/year (~$738/month)

#### Application Results:
- GIS Amount: $_____________/year
- Variance: _______% (within ±5%? Yes/No)

#### Total Retirement Income:
- CPP: $4,800
- OAS: $8,556
- GIS: $8,865
- **Total Expected:** $22,221/year

#### Application Results:
- Total Income: $_____________/year
- Variance: _______% (within ±5%? Yes/No)

#### Asset Depletion:
- Income: $22,221/year
- Expenses: $24,000/year
- Shortfall: $1,779/year
- Assets: $50,000
- **Expected Depletion:** ~Age 93 (50,000 / 1,779 ≈ 28 years)

#### Application Results:
- Assets depleted at age: _______
- Variance: _______ years (within ±2 years? Yes/No)

---

### Scenario D: High-Income Professional
**Profile:**
- Age: 67
- Province: Ontario
- Marital Status: Married
- RRSP: $1,000,000
- Non-Registered: $500,000
- CPP: $1,400/month (maximum, deferred to 67)
- OAS: Eligible but subject to clawback
- Annual Retirement Income: $120,000
- Annual Expenses: $90,000

#### CPP Calculation (Age 67):
- Maximum CPP at 65: $1,433/month (2025)
- Deferred 2 years: 1,433 × 1.084 (0.7% × 24 months) = $1,553/month
- **Expected:** ~$1,550-$1,560/month

#### Application Results:
- CPP at age 67: $_____________/month
- Variance: _______% (within ±5%? Yes/No)

#### OAS Clawback Calculation:
- Full OAS: $713/month = $8,556/year
- Income: $120,000
- Clawback threshold (2025): $90,997
- Excess income: $120,000 - $90,997 = $29,003
- Clawback: $29,003 × 0.15 = $4,350
- **Net OAS Expected:** $8,556 - $4,350 = $4,206/year (~$351/month)

#### Application Results:
- Gross OAS: $_____________/year
- Clawback amount: $_____________
- Net OAS: $_____________/year
- Variance: _______% (within ±5%? Yes/No)

#### Tax Calculation (Ontario, 2025):
**Income Breakdown:**
- CPP: $18,600/year
- Net OAS: $4,206/year
- RRIF/RRSP withdrawals: ~$50,000/year
- Investment income: ~$47,194/year
- **Total:** $120,000/year

**Federal Tax (2025 Brackets):**
- First $55,867 @ 15% = $8,380
- Next $55,866 ($55,868-$111,733) @ 20.5% = $11,452
- Next $8,267 ($111,734-$120,000) @ 26% = $2,149
- Subtotal: $21,981
- Less: Basic Personal Amount credit ($15,705 × 0.15) = -$2,356
- **Federal Tax:** ~$19,625

**Ontario Tax (2025 Brackets):**
- First $51,446 @ 5.05% = $2,598
- Next $51,447 ($51,447-$102,893) @ 9.15% = $4,707
- Next $17,107 ($102,894-$120,000) @ 11.16% = $1,909
- Subtotal: $9,214
- Less: Basic Personal Amount credit (~$11,865 × 0.0505) = -$599
- **Ontario Tax:** ~$8,615

**Total Expected Tax:** $19,625 + $8,615 = **$28,240/year**

#### Application Results:
- Total Annual Tax: $_____________
- Variance: _______% (within ±5%? Yes/No)

#### Marginal Tax Rate:
- **Expected:** 26% (federal) + 11.16% (Ontario) = **37.16%**

#### Application Results:
- Marginal Tax Rate: _______%
- Variance: _______% (within ±2%? Yes/No)

---

## Calculation Engine Validation

### 1. CPP Calculator

#### Age Adjustment Factors
| Age | Expected Factor | Application Result | Pass/Fail |
|-----|----------------|-------------------|-----------|
| 60  | 0.64 (64%)     | _______           | _______   |
| 61  | 0.712 (71.2%)  | _______           | _______   |
| 62  | 0.784 (78.4%)  | _______           | _______   |
| 63  | 0.856 (85.6%)  | _______           | _______   |
| 64  | 0.928 (92.8%)  | _______           | _______   |
| 65  | 1.00 (100%)    | _______           | _______   |
| 66  | 1.084 (108.4%) | _______           | _______   |
| 67  | 1.168 (116.8%) | _______           | _______   |
| 68  | 1.252 (125.2%) | _______           | _______   |
| 69  | 1.336 (133.6%) | _______           | _______   |
| 70  | 1.42 (142%)    | _______           | _______   |

**Pass Rate:** _____ / 11 = ______%

#### Maximum CPP (2025)
- **Expected:** $1,433.32/month
- **Application:** $_____________
- **Variance:** _______% (within ±1%? Yes/No)

---

### 2. OAS Calculator

#### Residency Calculation
| Years in Canada | Expected % | Application Result | Pass/Fail |
|----------------|------------|-------------------|-----------|
| 10             | 25%        | _______           | _______   |
| 20             | 50%        | _______           | _______   |
| 30             | 75%        | _______           | _______   |
| 40+            | 100%       | _______           | _______   |

**Pass Rate:** _____ / 4 = ______%

#### Maximum OAS (2025)
- **Age 65-74:** $713.34/month
- **Age 75+:** $784.67/month (10% increase)

| Age | Expected Amount | Application Result | Pass/Fail |
|-----|----------------|-------------------|-----------|
| 65  | $713.34        | _______           | _______   |
| 70  | $713.34        | _______           | _______   |
| 75  | $784.67        | _______           | _______   |
| 80  | $784.67        | _______           | _______   |

**Pass Rate:** _____ / 4 = ______%

#### Clawback Calculation
Test with income $100,000:
- Threshold: $90,997
- Excess: $9,003
- Clawback: $9,003 × 0.15 = $1,350
- **Expected Net OAS:** $8,560 - $1,350 = $7,210/year

**Application Result:** $_____________
**Variance:** _______% (within ±5%? Yes/No)

---

### 3. GIS Calculator

#### Maximum Amounts (2025)
| Status | Expected Max | Application Result | Pass/Fail |
|--------|-------------|-------------------|-----------|
| Single | $1,086.88/mo | _______           | _______   |
| Married (both OAS) | $654.98/mo | _______  | _______   |
| Married (one OAS) | $1,086.88/mo | _______  | _______   |

**Pass Rate:** _____ / 3 = ______%

#### Income Reduction
Test with Single, $10,000 annual income:
- Max GIS: $13,043/year
- Income above exemption: $10,000 - $5,000 = $5,000
- Reduction: $5,000 × 0.50 = $2,500
- **Expected GIS:** $13,043 - $2,500 = $10,543/year

**Application Result:** $_____________
**Variance:** _______% (within ±5%? Yes/No)

---

### 4. Tax Calculator

#### Federal Tax Brackets (2025)
| Income Range | Rate | Test Income | Expected Tax | Application | Pass/Fail |
|-------------|------|-------------|--------------|-------------|-----------|
| $0-$55,867 | 15% | $50,000 | $7,500 | _______ | _______ |
| $55,868-$111,733 | 20.5% | $100,000 | $17,503 | _______ | _______ |
| $111,734-$173,205 | 26% | $150,000 | $27,459 | _______ | _______ |
| $173,206-$246,752 | 29% | $200,000 | $41,788 | _______ | _______ |
| $246,753+ | 33% | $300,000 | $59,350 | _______ | _______ |

**Pass Rate:** _____ / 5 = ______%
**Note:** Expected tax includes basic personal amount credit

#### Ontario Provincial Tax Brackets (2025)
| Income Range | Rate | Test Income | Expected Tax | Application | Pass/Fail |
|-------------|------|-------------|--------------|-------------|-----------|
| $0-$51,446 | 5.05% | $50,000 | $2,523 | _______ | _______ |
| $51,447-$102,893 | 9.15% | $100,000 | $7,230 | _______ | _______ |
| $102,894-$150,000 | 11.16% | $125,000 | $9,695 | _______ | _______ |
| $150,001-$220,000 | 12.16% | $175,000 | $12,736 | _______ | _______ |
| $220,001+ | 13.16% | $250,000 | $16,684 | _______ | _______ |

**Pass Rate:** _____ / 5 = ______%

#### Basic Personal Amount (2025)
- **Federal:** $15,705
- **Ontario:** $11,865

**Federal BPA Credit:** $15,705 × 0.15 = $2,356
**Ontario BPA Credit:** $11,865 × 0.0505 = $599

**Application Results:**
- Federal BPA Credit: $_____________
- Ontario BPA Credit: $_____________
- Both within ±5%? Yes/No

---

### 5. RRIF Minimum Withdrawal Rates

| Age | Expected % | Application Result | Pass/Fail |
|-----|-----------|-------------------|-----------|
| 71  | 5.28%     | _______           | _______   |
| 72  | 5.40%     | _______           | _______   |
| 75  | 5.82%     | _______           | _______   |
| 80  | 6.82%     | _______           | _______   |
| 85  | 8.51%     | _______           | _______   |
| 90  | 11.92%    | _______           | _______   |
| 95+ | 20.00%    | _______           | _______   |

**Pass Rate:** _____ / 7 = ______%

Test calculation (RRIF balance $500,000, age 71):
- Minimum withdrawal: $500,000 × 0.0528 = $26,400
- **Application Result:** $_____________
- **Variance:** _______% (within ±1%? Yes/No)

---

### 6. Investment Growth & Inflation

#### Compound Growth Test
Initial: $100,000
Rate: 5% annual
Years: 10
**Expected:** $100,000 × (1.05)^10 = $162,889

**Application Result:** $_____________
**Variance:** _______% (within ±1%? Yes/No)

#### Inflation Adjustment Test
Expenses: $50,000/year
Inflation: 2% annual
Years: 10
**Expected:** $50,000 × (1.02)^10 = $60,950

**Application Result:** $_____________
**Variance:** _______% (within ±1%? Yes/No)

---

## Cross-Reference with Government Calculators

### Service Canada CPP Calculator
- **URL:** https://www.canada.ca/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html
- **Test Date:** _____________________
- **Our Result:** $_____________/month
- **Government Result:** $_____________/month
- **Variance:** _______% (within ±5%? Yes/No)

### Service Canada OAS Estimator
- **URL:** https://estimateursv-oasestimator.service.canada.ca/en
- **Test Date:** _____________________
- **Our Result:** $_____________/month
- **Government Result:** $_____________/month
- **Variance:** _______% (within ±5%? Yes/No)

---

## Known Differences & Assumptions

### Documented Calculation Differences:

1. **CPP Dropout Provision:**
   - Government calculator uses actual earnings history
   - Our calculator uses average income simplification
   - **Impact:** ±5-10% variance acceptable

2. **Provincial Tax Variations:**
   - Our calculator uses Ontario rates
   - Other provinces will have different rates
   - **Impact:** Expected variance for non-Ontario users

3. **Future Rate Changes:**
   - Government benefits indexed to inflation
   - Our 2025 rates may differ from actual future rates
   - **Impact:** Long-term projections less accurate

4. **Investment Returns:**
   - We assume constant rate
   - Reality has market volatility
   - **Impact:** Projections are estimates, not guarantees

---

## Calculation Accuracy Summary

| Calculator | Tests Passed | Total Tests | Pass Rate | Status |
|------------|-------------|-------------|-----------|--------|
| CPP        | _____ | _____ | _____% | _______ |
| OAS        | _____ | _____ | _____% | _______ |
| GIS        | _____ | _____ | _____% | _______ |
| Tax        | _____ | _____ | _____% | _______ |
| RRIF       | _____ | _____ | _____% | _______ |
| Projection | _____ | _____ | _____% | _______ |
| **TOTAL**  | _____ | _____ | _____% | _______ |

**Overall Acceptance:** ☐ Pass (≥95%) ☐ Conditional Pass (90-94%) ☐ Fail (<90%)

---

## Recommendations

### If Pass Rate ≥ 95%:
✅ Calculations are accurate and ready for production
✅ Proceed with user testing
✅ Monitor real-world usage for edge cases

### If Pass Rate 90-94%:
⚠️ Review failed tests and fix calculation errors
⚠️ Re-test after fixes
⚠️ Consider adding warnings about estimate accuracy

### If Pass Rate < 90%:
❌ Critical calculation errors found
❌ Do NOT proceed to production
❌ Comprehensive review and refactoring required

---

## Sign-Off

**Validation Completed By:** _____________________
**Date:** _____________________
**Overall Result:** ☐ Pass ☐ Conditional Pass ☐ Fail
**Ready for Production:** ☐ Yes ☐ No ☐ With Disclaimers

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Signature:** _________________ **Date:** _________________
