# Sprint 10 Planning - Calculation Accuracy & Quality Sprint

**Sprint**: Sprint 10
**Sprint Dates**: February 6-12, 2026 (7 days)
**Sprint Planning Date**: February 8, 2026
**Sprint Goal**: "Fix critical RRIF minimum withdrawal compliance issue and improve government benefit calculation accuracy"

**Team Capacity**: 18 story points (standard sprint)
**Sprint Type**: 🔴 CRITICAL COMPLIANCE FIX + Calculation Accuracy Improvements

---

## Executive Summary

Sprint 10 focuses on fixing **5 calculation validation issues** discovered during Sprint 9's post-sprint testing. The highest priority is **US-080** (RRIF minimum withdrawals), a **P0 critical legal compliance issue** affecting all users age 72+ with RRSP/RRIF accounts.

**Key Priorities**:
1. **US-080** (P0, 5 pts): Fix RRIF minimum withdrawal enforcement - **MUST DO**
2. **US-081** (P1, 3 pts): Cap CPP benefits at legislated maximum - **SHOULD DO**
3. **US-082** (P1, 3 pts): Cap OAS benefits at legislated maximum - **SHOULD DO**
4. **US-083** (P2, 2 pts): Add BPA to simulation output - **NICE TO HAVE**
5. **US-084** (P2, 2 pts): Add age credit to simulation output - **NICE TO HAVE**

**Total Available**: 15 story points across 5 issues
**Sprint Capacity**: 18 story points
**Recommended Commitment**: 11 story points (US-080, US-081, US-082)

---

## Sprint 10 Backlog

### Committed User Stories (11 pts)

| ID | User Story | Story Points | Priority | Epic | Estimated Days |
|----|------------|--------------|----------|------|----------------|
| **US-080** | Fix RRIF Minimum Withdrawal Enforcement | 5 | P0 🔴 | Epic 5: Simulation | 2-3 days |
| **US-081** | Cap CPP Benefits at Legislated Maximum | 3 | P1 🟡 | Epic 5: Simulation | 1-2 days |
| **US-082** | Cap OAS Benefits at Legislated Maximum | 3 | P1 🟡 | Epic 5: Simulation | 1-2 days |

### Stretch Goals (4 pts)

| ID | User Story | Story Points | Priority | Epic | Estimated Days |
|----|------------|--------------|----------|------|----------------|
| **US-083** | Add Basic Personal Amount to Simulation Output | 2 | P2 🟢 | Epic 5: Simulation | 0.5 days |
| **US-084** | Add Age Credit to Simulation Output | 2 | P2 🟢 | Epic 5: Simulation | 0.5 days |

**Total**: 11 committed + 4 stretch = 15 total

---

## Sprint Goal

**"Fix critical RRIF minimum withdrawal compliance issue and improve government benefit calculation accuracy"**

### Success Criteria

1. ✅ **US-080 COMPLETE**: RRIF minimum withdrawals enforced for all ages 72+
   - All 6 test accounts pass RRIF minimum withdrawal validation (0% → 100%)
   - CRA compliance table implemented (7.48% at age 72 → 20% at age 95+)
   - Deployed to production with verification

2. ✅ **US-081 COMPLETE**: CPP benefits capped at realistic legislated maximums
   - CPP benefits never exceed ~$17K (2025) indexed at 2%/year
   - All 6 test accounts pass CPP maximum validation

3. ✅ **US-082 COMPLETE**: OAS benefits capped at realistic legislated maximums
   - OAS benefits never exceed ~$8.5K (2025) indexed at 2%/year + age 75+ top-up
   - All 6 test accounts pass OAS maximum validation

4. 🎯 **STRETCH**: US-083 and US-084 completed (BPA and age credit in output)

---

## Rationale & Priorities

### Why This Sprint?

Sprint 9's calculation validation testing identified **5 consistent calculation issues** affecting all 6 test accounts:
- 15/20 validation categories passing (75% success rate)
- 5 issues identified, ranging from P0 (critical compliance) to P2 (data completeness)

**Sprint 10 directly addresses the most critical issues** to improve calculation accuracy from 75% to 95-100%.

### Priority Breakdown

#### **P0 (Critical) - US-080: RRIF Minimum Withdrawals**

**Why P0**:
- **Legal compliance issue**: CRA mandates RRIF minimums starting age 72, not optional
- **100% failure rate**: All 6 test accounts failed this validation
- **User trust**: Non-compliant advice damages credibility and could result in CRA penalties

**Impact**:
- Affects ALL users age 72+ with RRIF accounts
- Current simulations are NON-COMPLIANT with Canadian tax law
- Tax planning accuracy severely affected (underestimating withdrawals and taxes)

**Effort vs Impact**:
- **5 story points** (~2-3 days)
- **Quick fix** with massive compliance impact
- **Implementation**: Add CRA minimum percentage table, enforce max(strategy_withdrawal, minimum_required)

#### **P1 (High) - US-081 & US-082: CPP/OAS Maximum Caps**

**Why P1**:
- **Long-term accuracy**: Projections 20-40 years into retirement show unrealistic government benefits
- **100% affected**: All 6 test accounts show benefits exceeding maximums in later years
- **Quick fixes**: 3 pts each (~1-2 days each)

**Impact**:
- Prevents overestimating retirement income in long-term projections
- Users planning 30-40 year retirements (retire at 55-60) get more realistic projections

**Effort vs Impact**:
- **6 story points total** (~2-4 days combined)
- **Same implementation pattern**: Can be done efficiently together
- **Low risk**: Isolated changes to CPP/OAS calculation logic

#### **P2 (Medium) - US-083 & US-084: Tax Credit Output**

**Why P2 (Stretch)**:
- **No calculation impact**: Taxes already correct internally, just missing data exposure
- **Data completeness**: Improves transparency for detailed tax analysis
- **Quick wins**: 2 pts each (~0.5 days each)

**Rationale for Stretch**:
- Nice to have, but P0/P1 issues are more critical
- Can be deferred to Sprint 11 if time runs short
- Same implementation pattern (can do both together if time permits)

---

## Detailed Task Breakdown

### US-080: Fix RRIF Minimum Withdrawal Enforcement (5 pts, 2-3 days)

**Day 1-2: Implementation**
- [ ] **Research & Locate** (2 hours):
  - Review CRA RRIF minimum percentage table (ages 71-95+)
  - Locate RRIF withdrawal logic in `modules/simulation.py`
  - Identify `simulate_year()` function and RRIF withdrawal section

- [ ] **Implement Minimum Enforcement** (6 hours):
  - Add CRA RRIF minimum percentage table constant
  - Create `enforce_rrif_minimum_withdrawal()` function
  - Calculate minimum withdrawal: `rrif_balance * minimum_percentage`
  - Enforce minimum: `actual_withdrawal = max(strategy_withdrawal, minimum_required)`
  - Handle edge cases (age < 72, balance = 0, RRIF depleted mid-retirement)
  - Track minimum enforcement in year results (for transparency)

- [ ] **Test Implementation** (4 hours):
  - Re-run calculation validation tests on all 6 accounts
  - Verify RRIF minimum withdrawals present at age 72+
  - Verify no regression in other withdrawal logic (TFSA, Non-Reg)
  - Test edge cases (age 71, low balance, Person 2 RRIF)

**Day 3: Documentation & Deployment**
- [ ] **Documentation** (2 hours):
  - Document RRIF minimum percentage table in code comments
  - Update API documentation
  - Add withdrawal strategy docs note: "RRIF minimums enforced regardless of strategy"

- [ ] **Deploy & Verify** (2 hours):
  - Deploy Python backend to production
  - Re-run production simulations for affected users
  - Monitor for any calculation errors
  - Verify calculation validation tests pass

**Total Estimated Time**: 16 hours (~2 days)

---

### US-081: Cap CPP Benefits at Legislated Maximum (3 pts, 1-2 days)

**Day 1: Implementation**
- [ ] **Research CPP Maximums** (2 hours):
  - Find Service Canada CPP maximum benefit amounts (2025: $17,033)
  - Document historical maximums (2020-2025)
  - Determine indexing rate (~2%/year conservative estimate)

- [ ] **Update Tax Configuration** (2 hours):
  - Add `cpp_max_annual_benefit` to `tax_config_canada_2025.json`
  - Add `cpp_max_benefit_indexing_rate` (default 2.0%)
  - Document assumptions in tax config comments

- [ ] **Implement CPP Cap** (3 hours):
  - Locate CPP benefit calculation in `modules/simulation.py`
  - Create `calculate_cpp_with_cap()` function
  - Calculate max for current year: `cpp_max_2025 * (1.02 ^ years_since_2025)`
  - Apply cap: `cpp_capped = min(cpp_after_inflation, cpp_max_current_year)`

**Day 2: Testing & Documentation**
- [ ] **Test Implementation** (2 hours):
  - Re-run calculation validation tests on all 6 accounts
  - Verify CPP never exceeds maximum in any year
  - Test edge cases (start at maximum, defer to age 70)

- [ ] **Documentation** (1 hour):
  - Document CPP maximum amounts in tax_config
  - Update API documentation
  - Add CPP calculation notes

**Total Estimated Time**: 10 hours (~1.5 days)

---

### US-082: Cap OAS Benefits at Legislated Maximum (3 pts, 1-2 days)

**Day 1: Implementation**
- [ ] **Research OAS Maximums** (2 hours):
  - Find Service Canada OAS maximum benefit amounts (2025: $8,506)
  - Document age 75+ top-up (10% increase = $9,357 in 2025)
  - Determine indexing rate (~2%/year conservative estimate)

- [ ] **Update Tax Configuration** (2 hours):
  - Add `oas_max_annual_benefit` to `tax_config_canada_2025.json`
  - Add `oas_max_benefit_age_75_topup_percent` (10.0%)
  - Add `oas_max_benefit_indexing_rate` (2.0%)

- [ ] **Implement OAS Cap** (3 hours):
  - Locate OAS benefit calculation in `modules/simulation.py`
  - Create `calculate_oas_with_cap()` function
  - Calculate max for current year with age 75+ adjustment
  - Apply cap AFTER inflation indexing, BEFORE clawback

**Day 2: Testing & Documentation**
- [ ] **Test Implementation** (2 hours):
  - Re-run calculation validation tests on all 6 accounts
  - Verify OAS never exceeds maximum
  - Verify age 75+ top-up applied correctly
  - Test OAS clawback still works with capped amounts

- [ ] **Documentation** (1 hour):
  - Document OAS maximum amounts in tax_config
  - Update API documentation

**Total Estimated Time**: 10 hours (~1.5 days)

---

### US-083 & US-084: Add Tax Credits to Output (4 pts, 1 day) - STRETCH

**Day 1: Implementation (Both Together)**
- [ ] **Locate Tax Credit Calculations** (1 hour):
  - Find BPA and age credit calculations in `modules/simulation.py`
  - Confirm credits already applied internally

- [ ] **Add Fields to YearResult** (2 hours):
  - Update `modules/models.py` YearResult dataclass
  - Add: `basic_personal_amount_credit`, `provincial_bpa_credit`
  - Add: `age_amount_credit`, `provincial_age_credit`

- [ ] **Populate Fields in Simulation** (2 hours):
  - Update tax calculation functions to return credit values
  - Populate YearResult fields during simulation

- [ ] **Test & Documentation** (3 hours):
  - Re-run calculation validation tests
  - Verify credits appear in output for all 6 accounts
  - Update API documentation
  - Update TypeScript types if needed

**Total Estimated Time**: 8 hours (~1 day)

---

## Risk Assessment

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **RRIF minimum logic breaks existing withdrawals** | Medium | High | Comprehensive testing on all 6 accounts, regression tests |
| **CPP/OAS cap too conservative** | Low | Medium | Research Service Canada data, use conservative 2% indexing |
| **Tax config changes break production** | Low | High | Test locally first, deploy carefully, monitor logs |
| **Time estimate too optimistic** | Medium | Medium | US-083/US-084 are stretch goals, can defer if needed |

### Mitigation Strategies

1. **Comprehensive Testing**: Re-run calculation validation tests on all 6 accounts after each fix
2. **Regression Testing**: Verify CI/CD regression tests still pass (US-079 from Sprint 9)
3. **Conservative Estimates**: Use 2% indexing for CPP/OAS (lower than historical ~4-6%)
4. **Phased Deployment**: Deploy US-080 first (most critical), then US-081/US-082
5. **Stretch Goals**: US-083/US-084 are optional, can defer to Sprint 11 if time tight

---

## Definition of Done

### US-080 (RRIF Minimums)
- [x] RRIF minimum withdrawal enforced for ages 72+ (CRA compliance table implemented)
- [x] Minimum percentage based on age (7.48% at 72 → 20% at 95+)
- [x] Minimum withdrawal occurs even if spending needs met from other sources
- [x] All 6 test accounts pass RRIF minimum withdrawal validation (0% → 100%)
- [x] No regression in other withdrawal logic (TFSA, Non-Reg)
- [x] Code reviewed and tested
- [x] Documentation updated (API docs, code comments)
- [x] Deployed to production
- [x] Production verification: simulation results show RRIF minimums enforced

### US-081 (CPP Cap)
- [x] CPP benefits capped at legislated maximum for each year
- [x] Maximum indexed at 2%/year (conservative estimate)
- [x] Tax config includes CPP maximum ($17,033 for 2025)
- [x] All 6 test accounts pass CPP maximum validation (0% → 100%)
- [x] CPP amounts reasonable in 2050 (< $30K), 2070 (< $45K)
- [x] No regression in CPP calculation logic
- [x] Documentation updated
- [x] Deployed to production

### US-082 (OAS Cap)
- [x] OAS benefits capped at legislated maximum for each year
- [x] Maximum indexed at 2%/year + age 75+ top-up (10%)
- [x] Tax config includes OAS maximum ($8,506 for 2025)
- [x] All 6 test accounts pass OAS maximum validation (0% → 100%)
- [x] OAS clawback still applies correctly (calculated on capped amount)
- [x] Age 75+ top-up applied correctly (10% more than base max)
- [x] No regression in OAS calculation logic
- [x] Documentation updated
- [x] Deployed to production

### US-083 & US-084 (Tax Credits in Output) - STRETCH
- [x] BPA credit and age credit fields added to YearResult dataclass
- [x] Credits appear in simulation output for all 6 accounts
- [x] Values match expected amounts (e.g., $2,356 federal BPA in 2025)
- [x] No regression in tax calculations
- [x] Documentation updated
- [x] TypeScript types updated (if needed)

---

## Success Metrics

### Primary Metrics (US-080, US-081, US-082)

1. **Calculation Validation Test Pass Rate**:
   - **Before Sprint 10**: 15/20 passing (75%)
   - **After Sprint 10**: 18-20/20 passing (90-100%)

2. **RRIF Minimum Withdrawal Compliance**:
   - **Before**: 0/6 accounts passing (0%)
   - **After**: 6/6 accounts passing (100%)
   - **Verification**: All users age 72+ see RRIF minimums enforced

3. **CPP Maximum Validation**:
   - **Before**: 0/6 accounts passing (0%)
   - **After**: 6/6 accounts passing (100%)
   - **Verification**: CPP benefits reasonable in 2050 (< $30K), 2070 (< $45K)

4. **OAS Maximum Validation**:
   - **Before**: 0/6 accounts passing (0%)
   - **After**: 6/6 accounts passing (100%)
   - **Verification**: OAS benefits reasonable in 2050 (< $15K), 2070 (< $22K)

### Stretch Metrics (US-083, US-084)

5. **Tax Credit Output Completeness**:
   - **Before**: BPA and age credit missing from output (but applied internally)
   - **After**: BPA and age credit visible in all simulation results
   - **Verification**: Users can see detailed tax credit breakdown

---

## Sprint Velocity Prediction

**Historical Velocity**:
- Sprint 8: 23 story points (7 days, but completed in 2 days)
- Sprint 9: 10 story points (7 days, but completed in 1 day!)
- **Average**: ~16.5 story points per 7-day sprint (when sprint runs full duration)

**Sprint 10 Capacity**: 18 story points (standard sprint)

**Commitment**: 11 story points (US-080, US-081, US-082)
- **Conservative**: 61% of capacity (allows buffer for complexity)
- **Rationale**: RRIF minimum withdrawals may be more complex than estimated
- **Stretch**: +4 points (US-083, US-084) if ahead of schedule

**Predicted Velocity**: 11-15 story points (61-83% of capacity)

---

## Dependencies

### Internal Dependencies
- ✅ **Sprint 9 Complete**: Calculation validation test infrastructure in place
- ✅ **Test Accounts Ready**: 6 test accounts with baseline data available
- ✅ **CI/CD Pipeline**: Regression testing automated (US-079)

### External Dependencies
- None (all work is internal simulation engine changes)

### Blockers
- None identified

---

## Communication Plan

### Stakeholder Updates
- **Daily**: Progress updates on US-080 (P0 critical)
- **Mid-Sprint** (Day 4): Status check - US-080 complete, US-081/US-082 progress
- **End of Sprint**: Sprint review with calculation validation test results

### User Communication
- **Post-Deployment**: Optional email to users explaining improved calculation accuracy
- **Support Docs**: Update FAQs to explain RRIF minimum withdrawals, CPP/OAS caps

---

## Sprint Timeline (7 Days)

### Days 1-2: US-080 (RRIF Minimums) - P0 CRITICAL
- **Day 1**: Research, implement RRIF minimum enforcement, handle edge cases
- **Day 2**: Test on all 6 accounts, verify no regression, deploy to production

### Days 3-4: US-081 (CPP Cap) - P1 HIGH
- **Day 3**: Research CPP maximums, update tax config, implement cap logic
- **Day 4**: Test on all 6 accounts, verify CPP amounts reasonable, deploy

### Days 5-6: US-082 (OAS Cap) - P1 HIGH
- **Day 5**: Research OAS maximums, update tax config, implement cap with age 75+ top-up
- **Day 6**: Test on all 6 accounts, verify OAS clawback works, deploy

### Day 7: US-083 & US-084 (Tax Credits) - P2 STRETCH
- **Day 7**: Add BPA and age credit fields to output, test, deploy (if time permits)
- **Fallback**: Sprint retrospective, documentation cleanup, defer US-083/US-084 to Sprint 11

---

## Retrospective Planning

### Questions to Address
1. **Velocity**: Did we accurately estimate story points for calculation fixes?
2. **Testing**: Was calculation validation testing effective at catching issues?
3. **Deployment**: Were deployments smooth? Any production issues?
4. **Stretch Goals**: Did we complete US-083/US-084? Should they be higher priority?

### Continuous Improvement
- Document lessons learned from RRIF minimum withdrawal implementation
- Evaluate if similar compliance issues exist (QPP, provincial tax rules, etc.)
- Consider expanding calculation validation testing to cover more edge cases

---

## Next Sprint Preview (Sprint 11)

**Potential Focus**:
1. **If US-083/US-084 not complete**: Complete tax credit output work
2. **User conversion**: Revisit US-066 to US-071 (user retention work from Epic 1)
3. **Additional calculation accuracy**: Expand validation testing, fix any remaining issues
4. **Premium features**: French translation (US-006, US-007) to expand market

---

**Sprint Created By**: Claude Code (Sonnet 4.5)
**Date**: February 8, 2026
**Related Documentation**:
- CALCULATION_VALIDATION_TEST_RESULTS.md (Sprint 9 follow-up)
- SPRINT_9_COMPLETE.md (Sprint 9 summary)
- AGILE_BACKLOG.md (Product backlog)

**Status**: 📋 **READY FOR SPRINT PLANNING MEETING**
