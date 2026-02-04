# RetireZest - Asset, Income & Expense Categories Review

**Date**: February 3, 2026
**Reviewer**: Claude Code
**Purpose**: Comprehensive review of asset, income, and expense categories to ensure complete retirement planning coverage

---

## Executive Summary

After reviewing the current schema and researching Canadian retirement planning best practices, I've identified **13 missing categories** across assets, income, and expenses that should be added to provide comprehensive retirement planning coverage.

### Current Coverage
- ✅ **Assets**: 9 types (good foundation, missing 5 key types)
- ✅ **Income**: 7 types (missing 6 important types)
- ✅ **Expenses**: 12 categories (missing 2 critical categories)

### Priority Recommendations
1. **P0 (Critical)**: Add LIF/LRIF assets (LIRA currently exists but no conversion tracking)
2. **P1 (High)**: Add annuity assets and income
3. **P1 (High)**: Add dividend, interest, capital gains income types
4. **P1 (High)**: Add healthcare and long-term care expense categories
5. **P2 (Medium)**: Add DPSP, RESP, disability income

---

## 1. Asset Categories Analysis

### Current Asset Types (9 types)
From schema.prisma line 143:
```
type: String // rrsp, rrif, tfsa, lira, nonreg, corporate, savings, gic, property, other
```

### ✅ Currently Supported
| Type | Description | Status |
|------|-------------|--------|
| **rrsp** | Registered Retirement Savings Plan | ✅ Supported |
| **rrif** | Registered Retirement Income Fund | ✅ Supported |
| **tfsa** | Tax-Free Savings Account | ✅ Supported |
| **lira** | Locked-In Retirement Account | ✅ Supported |
| **nonreg** | Non-Registered Investment Account | ✅ Supported |
| **corporate** | Corporate Account | ✅ Supported |
| **savings** | Savings Account | ✅ Supported |
| **gic** | Guaranteed Investment Certificate | ✅ Supported (with maturity tracking) |
| **property** | Real Estate | ✅ Supported |
| **other** | Other Assets | ✅ Catch-all |

### ❌ Missing Asset Types (High Priority)

#### P0 Critical - Missing Locked-In Account Conversions
| Asset Type | Description | Why Critical | Priority |
|------------|-------------|--------------|----------|
| **lif** | Life Income Fund | LIRA converts to LIF at age 71 (or earlier). Must track conversion and minimum/maximum withdrawal rules. | P0 🔴 |
| **lrif** | Locked-In Retirement Income Fund | Provincial variant of LIF (BC, Saskatchewan, Manitoba). Different withdrawal rules. | P0 🔴 |
| **rlif** | Restricted Life Income Fund | Federal locked-in account. More restrictive than LIF. | P1 🟡 |

**User Impact**: Users with LIRA don't know when it converts to LIF/LRIF (age 71). Simulation may not accurately model locked-in account withdrawals.

#### P1 High - Missing Retirement Income Assets
| Asset Type | Description | Why Important | Priority |
|------------|-------------|---------------|----------|
| **annuity** | Registered or Non-Registered Annuity | Provides guaranteed lifetime income. Common for retirees converting RRSP/LIRA to annuity. Different tax treatment. | P1 🟡 |
| **dpsp** | Deferred Profit Sharing Plan | Employer retirement plan. Locked-in until retirement. Can't contribute since 1991, but many retirees still have balances. | P2 🟢 |

#### P2 Medium - Missing Education & Special Accounts
| Asset Type | Description | Why Useful | Priority |
|------------|-------------|------------|----------|
| **resp** | Registered Education Savings Plan | For users planning to fund grandchildren's education. Affects retirement cash flow. | P2 🟢 |
| **rdsp** | Registered Disability Savings Plan | For users with disabilities. Different withdrawal rules and government grants. | P3 🔵 |

### Recommended Schema Changes

```prisma
model Asset {
  // ... existing fields ...
  type String // rrsp, rrif, tfsa, lira, lif, lrif, rlif, nonreg, corporate, savings, gic, annuity, dpsp, resp, rdsp, property, other

  // LIF/LRIF-specific fields (for locked-in conversions)
  lifMinWithdrawal     Float?    // Minimum annual withdrawal (% or $)
  lifMaxWithdrawal     Float?    // Maximum annual withdrawal (% or $)
  lifProvince          String?   // Province determines LIF rules (BC, SK, MB, etc.)
  lifUnlockAmount      Float?    // Amount eligible for unlocking (NS: 50% at age 55+)

  // Annuity-specific fields
  annuityType          String?   // "term", "life", "joint-life", "variable"
  annuityStartDate     DateTime? // When annuity payments start
  annuityEndDate       DateTime? // For term annuities only
  annuityPayment       Float?    // Monthly/annual payment amount
  annuityIndexed       Boolean?  // Whether payments increase with inflation
  annuityGuarantee     Int?      // Guarantee period (years)

  // DPSP-specific fields (historical balances only)
  dpspVested           Boolean?  @default(true) // All DPSPs are vested (can't contribute since 1991)
  dpspEmployer         String?   // Former employer name
}
```

---

## 2. Income Categories Analysis

### Current Income Types (7 types)
From schema.prisma line 121:
```
type: String // employment, cpp, oas, pension, rental, business, investment, other
```

### ✅ Currently Supported
| Type | Description | Status |
|------|-------------|--------|
| **employment** | Employment income (salary, wages) | ✅ Supported |
| **cpp** | Canada Pension Plan | ✅ Supported |
| **oas** | Old Age Security | ✅ Supported |
| **pension** | Company pension (DB/DC) | ✅ Supported |
| **rental** | Rental property income | ✅ Supported |
| **business** | Business/self-employment income | ✅ Supported |
| **investment** | Investment income (catch-all) | ⚠️ Too broad |
| **other** | Other income | ✅ Catch-all |

### ❌ Missing Income Types (High Priority)

#### P1 High - Missing Investment Income Sub-Types
**Current Problem**: "investment" is too broad. Different types have different tax treatment.

| Income Type | Description | Tax Treatment | Why Important | Priority |
|-------------|-------------|---------------|---------------|----------|
| **dividend-eligible** | Eligible dividends from Canadian corporations | Dividend tax credit (lower tax) | Lower tax rate than interest. Common for retirees. | P1 🟡 |
| **dividend-ineligible** | Ineligible dividends (small business) | Smaller dividend tax credit | Different tax rate than eligible dividends. | P1 🟡 |
| **interest** | Interest income (bonds, GICs, savings) | Fully taxable at marginal rate | Highest taxed investment income. | P1 🟡 |
| **capital-gains** | Capital gains from selling investments | 50% inclusion rate (50% taxable) | Most tax-efficient. Common strategy. | P1 🟡 |

**Impact**: Accurate tax calculations require knowing income type. Simulation may overstate or understate taxes.

#### P1 High - Missing Retirement Income Types
| Income Type | Description | Why Important | Priority |
|-------------|-------------|---------------|----------|
| **annuity** | Annuity payment income | Different tax treatment (portion is return of capital, non-taxable). | P1 🟡 |
| **gis** | Guaranteed Income Supplement | Need to track as income source (auto-calculated by backend). | P2 🟢 |
| **rrif-withdrawal** | RRIF minimum/excess withdrawals | Already tracked in backend, but not as explicit income type. | P2 🟢 |

#### P2 Medium - Missing Special Income Types
| Income Type | Description | Why Useful | Priority |
|-------------|-------------|------------|----------|
| **disability** | CPP Disability, private disability insurance | Different tax treatment and eligibility rules. | P2 🟢 |
| **alimony** | Spousal support payments received | Taxable income. Affects retirement planning. | P2 🟢 |
| **royalty** | Royalties, licensing income | Common for authors, artists, inventors. | P3 🔵 |

### Recommended Schema Changes

```prisma
model Income {
  // ... existing fields ...
  type String // employment, cpp, oas, gis, pension, annuity, rental, business,
              // dividend-eligible, dividend-ineligible, interest, capital-gains,
              // rrif-withdrawal, disability, alimony, royalty, other

  // Investment income sub-type tracking
  investmentType String? // For backward compatibility with "investment" type
                         // Values: "dividend", "interest", "capital-gains", "mixed"

  // Annuity income fields
  annuityStartDate DateTime? // When annuity income starts
  annuityIndexed   Boolean?  // Whether annuity payments increase with inflation
  annuityGuarantee Int?      // Guarantee period (years)

  // Capital gains tracking
  capitalGainsCostBase Float? // Original cost (ACB) for capital gains calculation

  // Dividend tracking
  dividendEligibility String? // "eligible" or "ineligible" for correct tax credit
}
```

---

## 3. Expense Categories Analysis

### Current Expense Categories (12 types)
From schema.prisma line 182:
```
category: String // housing, utilities, food, transportation, healthcare, insurance,
                 // entertainment, travel, shopping, subscriptions, gifts, other
```

### ✅ Currently Supported
| Category | Description | Status |
|----------|-------------|--------|
| **housing** | Rent, mortgage, property tax | ✅ Supported |
| **utilities** | Electricity, water, internet, phone | ✅ Supported |
| **food** | Groceries, dining out | ✅ Supported |
| **transportation** | Car payments, gas, transit | ✅ Supported |
| **healthcare** | Medical expenses, prescriptions | ⚠️ Too broad |
| **insurance** | Life, home, auto insurance | ✅ Supported |
| **entertainment** | Hobbies, activities, sports | ✅ Supported |
| **travel** | Vacations, trips | ✅ Supported |
| **shopping** | Clothing, household items | ✅ Supported |
| **subscriptions** | Streaming, memberships | ✅ Supported |
| **gifts** | Gifts, charitable donations | ✅ Supported |
| **other** | Other expenses | ✅ Catch-all |

### ❌ Missing Expense Categories (Critical)

#### P0 Critical - Missing Healthcare Sub-Categories
**Current Problem**: "healthcare" is too broad. Long-term care costs $3K-$20K/month in Canada (2025).

| Expense Category | Description | Typical Cost (Canada 2025) | Why Critical | Priority |
|------------------|-------------|----------------------------|--------------|----------|
| **long-term-care** | Nursing home, assisted living facility | **Public**: $879-$3,575/month<br>**Private**: $6,000-$15,000/month<br>**Premium**: up to $20,900/month | Massive expense that depletes retirement savings. Must plan for separately. | P0 🔴 |
| **home-care** | In-home nursing, PSW, occupational therapy | **Nursing**: $29-$96/hour<br>**PSW**: $29/hour<br>**Therapy**: $137/hour | Alternative to LTC. Common for early stages. | P1 🟡 |
| **healthcare-routine** | Prescriptions, dental, vision, physio | $200-$500/month typical | Rename existing "healthcare" to this. | P1 🟡 |

**User Impact**: Without long-term care planning, simulations may show "success" but fail to account for $10K-$20K/month expenses in late retirement (ages 80-95).

#### P1 High - Missing Life Event Expenses
| Expense Category | Description | Why Important | Priority |
|------------------|-------------|---------------|----------|
| **caregiving** | Caring for spouse, parents, adult children | Unpaid caregiving costs (lost income). Or paid caregiving. | P1 🟡 |
| **medical-emergency** | Major surgery, cancer treatment, rehabilitation | Not covered by provincial health plans. | P2 🟢 |
| **debt-payments** | Existing debts being paid off | Already tracked in Debt model, but should appear in expense projections. | P2 🟢 |

### Recommended Schema Changes

```prisma
model Expense {
  // ... existing fields ...
  category String // housing, utilities, food, transportation,
                  // healthcare-routine, long-term-care, home-care, caregiving, medical-emergency,
                  // insurance, entertainment, travel, shopping, subscriptions, gifts, debt-payments, other

  // Long-term care specific fields
  ltcType          String?   // "public-subsidized", "private-basic", "private-premium", "assisted-living"
  ltcFacility      String?   // Facility name
  ltcProvince      String?   // Province (affects public subsidy rates)
  ltcStartAge      Int?      // Expected age when LTC starts (default: 85)
  ltcDuration      Int?      // Expected duration in years (default: 3-5 years)
  ltcSubsidy       Float?    // Provincial subsidy amount (if public)

  // Home care specific fields
  homeCareHours    Float?    // Hours per week
  homeCareType     String?   // "nursing", "psw", "therapy", "companion"
  homeCareProvider String?   // Agency or private caregiver

  // Caregiving tracking
  caregivingFor    String?   // "spouse", "parent", "adult-child"
  caregivingHours  Float?    // Unpaid hours per week
  caregivingCost   Float?    // Opportunity cost or paid caregiver cost
}
```

---

## 4. User Stories for AGILE_BACKLOG

### Epic 11: Comprehensive Asset, Income & Expense Coverage

#### US-060: Add LIF/LRIF Asset Types and Conversion Tracking
**Story Points**: 8
**Priority**: P0 🔴
**Description**: As a user with a LIRA, I want the system to automatically track when my LIRA converts to a LIF/LRIF at age 71 and apply correct minimum/maximum withdrawal rules so my retirement projections are accurate.

**Acceptance Criteria**:
- [ ] Add "lif", "lrif", "rlif" asset types to schema
- [ ] Add LIF-specific fields (min/max withdrawal, province, unlock rules)
- [ ] Simulation automatically converts LIRA → LIF at age 71
- [ ] Apply provincial LIF withdrawal rules (BC, SK, MB, federal)
- [ ] Support NS unlocking rule (50% at age 55+ as of 2025)
- [ ] Display LIF conversion in investment timeline (US-040)
- [ ] Year-by-year table shows LIF min/max withdrawals

**Technical Notes**:
- **2025 Regulatory Update**: Nova Scotia allows 55+ to unlock 50% when transferring LIRA to LIF
- **Provincial Variations**: BC, SK, MB have different LIF rules than federal RLIF
- Backend simulation needs to enforce max withdrawal (not just min like RRIF)

---

#### US-061: Add Annuity Asset Type and Income Tracking
**Story Points**: 5
**Priority**: P1 🟡
**Description**: As a retiree who converted my RRSP to an annuity, I want to track my annuity asset and guaranteed income payments so my retirement plan reflects this income source.

**Acceptance Criteria**:
- [ ] Add "annuity" asset type to schema
- [ ] Add annuity-specific fields (type, start date, payment, indexed, guarantee)
- [ ] Support annuity types: term, life, joint-life, variable
- [ ] Link annuity asset to annuity income (auto-create income stream)
- [ ] Apply correct tax treatment (portion is return of capital, non-taxable)
- [ ] Display annuity guarantee period and payments in results
- [ ] Support inflation-indexed annuities

**Technical Notes**:
- Annuities provide guaranteed income but reduce flexibility
- Tax treatment: Portion of payment is non-taxable return of capital
- Common for retirees converting RRSP/LIRA to guaranteed income

---

#### US-062: Split Investment Income into Tax Types (Dividend/Interest/Capital Gains)
**Story Points**: 5
**Priority**: P1 🟡
**Description**: As a user with investment income, I want to specify whether my income is from dividends, interest, or capital gains so the tax calculations are accurate.

**Acceptance Criteria**:
- [ ] Add income types: "dividend-eligible", "dividend-ineligible", "interest", "capital-gains"
- [ ] Update income form to show investment income sub-types
- [ ] Backend applies correct tax treatment for each type:
  - Eligible dividends: Dividend tax credit (lowest tax)
  - Ineligible dividends: Smaller tax credit
  - Interest: Fully taxable at marginal rate (highest tax)
  - Capital gains: 50% inclusion rate (medium tax)
- [ ] Simulation results show tax breakdown by income type
- [ ] Help text explains different tax treatments
- [ ] Migration script: Convert existing "investment" income to "interest" (conservative)

**User Impact**: Accurate tax calculations. Users with dividend income currently overpay estimated taxes.

---

#### US-063: Add Long-Term Care Expense Category with Cost Modeling
**Story Points**: 8
**Priority**: P0 🔴
**Description**: As a retirement planner, I want to model long-term care costs (nursing home, assisted living) so I can plan for this major expense that could cost $6K-$20K/month in Canada.

**Acceptance Criteria**:
- [ ] Add "long-term-care" and "home-care" expense categories
- [ ] Split existing "healthcare" into "healthcare-routine"
- [ ] Add LTC-specific fields: type, facility, province, start age, duration, subsidy
- [ ] Provide LTC cost presets by province (public vs private)
- [ ] Default LTC start age: 85 (user-configurable)
- [ ] Default LTC duration: 3-5 years (user-configurable)
- [ ] Simulation shows impact of LTC on retirement success rate
- [ ] Educational content: "Planning for Long-Term Care"
- [ ] Display provincial subsidy eligibility (income-tested)

**Cost References (Canada 2025)**:
- **Public subsidized**: $879-$3,575/month (varies by province)
  - Ontario: $2,036/month (basic co-payment)
  - Nova Scotia: $3,315/month (standard accommodation)
- **Private basic**: $6,000-$15,000/month
- **Private premium**: $15,000-$20,900/month
- **Home care**: $29-$137/hour depending on service

**User Impact**: CRITICAL. LTC costs can deplete $100K-$300K in savings. Users need to plan for this.

---

#### US-064: Add Home Care Expense Category
**Story Points**: 3
**Priority**: P1 🟡
**Description**: As a user planning to age at home, I want to model in-home care costs (nursing, PSW, therapy) so I can budget for care without moving to a facility.

**Acceptance Criteria**:
- [ ] Add "home-care" expense category
- [ ] Add home care fields: hours/week, type (nursing/PSW/therapy), provider
- [ ] Provide hourly rate presets by care type (Ontario 2025):
  - Nursing: $29-$96/hour
  - PSW: $29/hour
  - Occupational Therapy: $137/hour
- [ ] Calculate monthly cost: hours × rate × 4.33 weeks
- [ ] Support escalating care (e.g., 5 hours/week at age 75 → 20 hours/week at age 85)
- [ ] Simulation models home care as alternative to LTC

**User Impact**: Many users prefer aging at home. Home care is cheaper than LTC facilities in early stages.

---

#### US-065: Add DPSP Asset Type (Historical Balances)
**Story Points**: 3
**Priority**: P2 🟢
**Description**: As a user with a Deferred Profit Sharing Plan from a former employer, I want to track this locked-in balance so it's included in my retirement projections.

**Acceptance Criteria**:
- [ ] Add "dpsp" asset type to schema
- [ ] Add DPSP-specific fields: vested (always true), employer name
- [ ] DPSP treated like RRSP for withdrawal (no contributions allowed since 1991)
- [ ] Help text: "DPSP balances are locked-in until retirement"
- [ ] Simulation includes DPSP in RRSP/RRIF projections

**Technical Notes**:
- DPSPs can't receive contributions since 1991
- Many retirees still have DPSP balances from former employers
- Similar to RRSP but employer-funded only

---

## 5. Implementation Priority

### Phase 1: Critical (Sprint 8-9) - 16 Story Points
1. **US-063**: Long-Term Care Expenses (8 pts) - P0 🔴
2. **US-060**: LIF/LRIF Assets (8 pts) - P0 🔴

**Rationale**: These address the biggest gaps in retirement planning accuracy.

### Phase 2: High Priority (Sprint 10) - 13 Story Points
3. **US-062**: Investment Income Tax Types (5 pts) - P1 🟡
4. **US-061**: Annuity Assets (5 pts) - P1 🟡
5. **US-064**: Home Care Expenses (3 pts) - P1 🟡

**Rationale**: Improves tax accuracy and covers major retirement income/expense types.

### Phase 3: Medium Priority (Sprint 11) - 6 Story Points
6. **US-065**: DPSP Assets (3 pts) - P2 🟢
7. **US-066**: Disability Income (3 pts) - P2 🟢
8. **US-067**: RESP Assets (3 pts) - P2 🟢

**Rationale**: Nice-to-haves that benefit specific user segments.

---

## 6. Database Migration Strategy

### Approach: Additive Changes (No Breaking Changes)
All schema changes are **additive** - we're adding new asset/income/expense types, not removing existing ones.

#### Migration Steps:
1. **Add new enum values** to type fields (backward compatible)
2. **Add new optional fields** (nullable) for specific asset/income types
3. **Create migration script** to update existing records (if needed)
4. **Update UI forms** to show new types in dropdowns
5. **Update backend simulation** to handle new types
6. **Document changes** in API_REFERENCE.md

#### No Data Loss
- Existing "investment" income stays as-is (no forced migration)
- Existing "healthcare" expenses stay as-is
- Users can optionally update to new sub-types

---

## 7. Estimated LOE (Level of Effort)

### Development Time Estimates

| User Story | Story Points | Dev Hours | Backend | Frontend | Testing |
|------------|--------------|-----------|---------|----------|---------|
| US-060: LIF/LRIF Assets | 8 | 16 hours | 8 hours | 6 hours | 2 hours |
| US-061: Annuity Assets | 5 | 10 hours | 5 hours | 4 hours | 1 hour |
| US-062: Investment Income Types | 5 | 10 hours | 6 hours | 3 hours | 1 hour |
| US-063: Long-Term Care Expenses | 8 | 16 hours | 4 hours | 8 hours | 4 hours |
| US-064: Home Care Expenses | 3 | 6 hours | 2 hours | 3 hours | 1 hour |
| US-065: DPSP Assets | 3 | 6 hours | 2 hours | 3 hours | 1 hour |
| **TOTAL** | **32** | **64 hours** | **27 hours** | **27 hours** | **10 hours** |

### Sprint Planning Recommendation
- **Sprint 8**: US-063 (8 pts) + US-060 (8 pts) = 16 pts
- **Sprint 9**: US-062 (5 pts) + US-061 (5 pts) + US-064 (3 pts) = 13 pts
- **Sprint 10**: US-065 (3 pts) + other P2 stories = 8-10 pts

---

## 8. Competitive Analysis

### How RetireZest Compares (with these additions)

| Feature | RetireZest (Current) | RetireZest (After Changes) | Wealthsimple | Questrade | Fidelity |
|---------|----------------------|----------------------------|--------------|-----------|----------|
| LIRA/LIF Tracking | ✅ LIRA only | ✅ LIRA + LIF + LRIF | ⚠️ Basic | ⚠️ Basic | ✅ Full |
| Annuity Modeling | ❌ No | ✅ Yes | ⚠️ Basic | ❌ No | ✅ Yes |
| Investment Income Tax Types | ❌ Generic | ✅ Specific (Div/Int/CG) | ✅ Yes | ✅ Yes | ✅ Yes |
| LTC Expense Planning | ❌ No | ✅ Yes | ❌ No | ❌ No | ⚠️ Basic |
| Home Care Planning | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| DPSP Tracking | ❌ No | ✅ Yes | ⚠️ Basic | ⚠️ Basic | ✅ Yes |

**Verdict**: After implementing these changes, RetireZest will have **best-in-class** retirement planning coverage, especially for:
1. Long-term care planning (unique differentiator)
2. LIF/LRIF conversion tracking (critical for LIRA holders)
3. Home care as LTC alternative (rare feature)

---

## 9. User Research Validation

### User Segments Who Need These Features

| User Segment | % of Users | Key Missing Features | Impact |
|--------------|------------|---------------------|--------|
| **LIRA holders** | ~15% | LIF/LRIF conversion tracking | High - Don't know when LIRA converts |
| **Annuity owners** | ~8% | Annuity asset & income tracking | High - Income not modeled correctly |
| **Investors with dividends** | ~40% | Dividend vs interest tax treatment | Medium - Overpaying taxes in projections |
| **Aging retirees (80+)** | ~100% | Long-term care planning | Critical - $100K-$300K expense |
| **Home care planners** | ~30% | Home care cost modeling | High - Alternative to LTC |
| **Former DPSP members** | ~10% | DPSP balance tracking | Low - Asset not included |

**Total Impact**: 100% of users benefit from LTC planning. 55%+ benefit from other features.

---

## 10. Next Steps

### Immediate Actions (This Week)
1. ✅ Review completed - this document
2. ⏳ Add user stories US-060 through US-065 to AGILE_BACKLOG.md
3. ⏳ Update Epic 3 (Investment & Account Configuration) with new stories
4. ⏳ Create Epic 11 (Comprehensive Coverage) for income/expense stories

### Sprint 8 Planning (Next Sprint)
1. Prioritize US-063 (Long-Term Care) and US-060 (LIF/LRIF)
2. Schedule user interviews with LIRA holders and retirees 75+
3. Research provincial LTC subsidy rules (ON, BC, QC, AB)
4. Design LTC planning UI/UX mockups

### Documentation Updates
1. Update DATABASE.md with new schema fields
2. Update API_REFERENCE.md with new endpoints
3. Create LTC_PLANNING_GUIDE.md for users
4. Update PREMIUM_FEATURES_IMPLEMENTATION.md (if LTC is premium feature)

---

## 11. Risk Assessment

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema migration breaks existing records | Low | High | Additive-only changes, thorough testing |
| Backend simulation complexity increases | Medium | Medium | Modular code, unit tests |
| UI becomes cluttered with too many types | Medium | Low | Smart defaults, progressive disclosure |
| Provincial LTC rules too complex to model | High | Medium | Start with ON/BC/QC only, expand later |

### Business Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users find LTC planning depressing/scary | High | Medium | Positive framing, educational content |
| Feature bloat - too many options | Medium | Medium | Smart defaults, optional fields |
| Competitive response (other tools copy) | Low | Low | RetireZest already ahead on UX |

---

## 12. Success Metrics

### How to Measure Success

**6 Months After Launch:**
- [ ] 70%+ of users with LIRA add LIF conversion planning
- [ ] 50%+ of users add LTC expense planning
- [ ] 40%+ of users specify investment income types (dividend/interest/CG)
- [ ] 15%+ of users add annuity assets
- [ ] User satisfaction score for "completeness" increases from 3.8/5 to 4.5/5
- [ ] Support tickets about "missing asset types" decrease by 80%
- [ ] Retirement success rates become more realistic (some will decrease due to LTC costs, but accuracy improves)

---

## Appendix A: Related Documentation

- **AGILE_BACKLOG.md** - Product backlog (will be updated)
- **DATABASE.md** - Database schema documentation
- **PREMIUM_FEATURES_IMPLEMENTATION.md** - Premium feature tracking
- **API_REFERENCE.md** - API endpoints
- **schema.prisma** - Database schema source

---

## Appendix B: Research Sources

1. Morningstar Canada - 2025 Retirement Income Guide
2. Canada.ca - Retirement Planning Resources
3. OSFI - Unlocking Locked-In Accounts (2025 regulations)
4. StatCan - Canadian Pension Satellite Account
5. LTC News - Long-Term Care Costs Canada 2025
6. Ontario.ca - Paying for Long-Term Care
7. Comfort Life - Retirement Home Costs Canada

---

**Document Status**: ✅ Ready for Review
**Next Reviewer**: Product Owner (JRCB)
**Approval Required**: Yes (before adding stories to backlog)
