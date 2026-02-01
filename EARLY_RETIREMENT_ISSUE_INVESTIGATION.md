# Early Retirement Issue Investigation (Age 50)

**Date**: January 31, 2026
**User**: glacial-keels-0d@icloud.com (P R)
**Feedback**: "My situation might be rare, but the retirement analysis is not working for me. I'm 51 and retired at 50."
**Satisfaction**: 1/5 stars
**Priority**: P0 (Critical - Blocking Users)

---

## Investigation Summary

### User Profile
- **Email**: glacial-keels-0d@icloud.com
- **Name**: P R
- **Date of Birth**: December 19, 1974
- **Calculated Age**: 51 years old
- **Province**: Quebec (QC)
- **Target Retirement Age**: 51
- **Subscription**: Free tier
- **Account Created**: January 30, 2026
- **Simulations Run**: 3 (hasn't hit the 10-simulation limit yet)

### Simulation Runs (3 total)

All 3 simulations used the **CORRECT age (51)** and province (QC):

| Simulation | Created | Strategy | Province | Start Age | Success Rate |
|------------|---------|----------|----------|-----------|--------------|
| #1 | Jan 31, 07:18 | minimize-income | QC | 51 | **0.58%** |
| #2 | Jan 31, 07:07 | capital-gains-optimized | QC | 51 | **0.68%** |
| #3 | Jan 31, 07:05 | capital-gains-optimized | QC | 51 | **0.70%** |

### Baseline Scenario (Database)

The saved "Baseline" scenario in the database has **WRONG data**:

```json
{
  "name": "Baseline",
  "description": "Default retirement scenario",
  "currentAge": 65,           // ❌ WRONG - Should be 51
  "retirementAge": 65,        // ❌ WRONG - Should be 51 (or 50)
  "province": "ON",           // ❌ WRONG - Should be QC
  "cppStartAge": 65,
  "oasStartAge": 65,
  "rrspBalance": 0,
  "tfsaBalance": 0,
  "nonRegBalance": 0,
  "employmentIncome": 0,
  "pensionIncome": 0,
  "annualExpenses": 60000,
  "isBaseline": true
}
```

---

## Root Cause Analysis

### Primary Issue: Extremely Low Success Rate (< 1%)

**The user's simulations are failing because they have:**
1. **Age 51** - Very young for retirement
2. **Retired at age 50** - Already retired (no employment income)
3. **Zero account balances** - No RRSP, TFSA, or Non-Reg savings
4. **Zero income** - No employment, pension, or other income
5. **$60,000/year expenses** - Standard expenses
6. **Cannot access government benefits yet**:
   - CPP earliest at age 60 (9 years away)
   - OAS earliest at age 65 (14 years away)

**Success Rate: 0.58% - 0.70%** means the retirement plan will **FAIL 99% of the time**!

### Why "Not Working for Me"?

The user says "retirement analysis is not working for me" because:

1. **Missing the Point**: The app IS working correctly - it's showing that retiring at 50 with $0 assets is **not viable**
2. **Expects Validation**: User likely expects the app to validate their plan, but the math shows it won't work
3. **Doesn't Understand Success Rate**: A 0.6% success rate means "you'll run out of money in 99.4% of scenarios"
4. **Early Retirement Education Gap**: User doesn't understand they need income/assets to bridge the gap from age 50 to 60 (CPP) to 65 (OAS)

### Secondary Issue: Baseline Scenario Not Personalized

The "Baseline" scenario stored in the database has generic placeholder values (age 65, province ON) instead of the user's actual data. However, this **doesn't affect simulations** - the frontend appears to be using the correct user data when running simulations.

---

## What The User Needs

### Scenario for Early Retirement at Age 50-51

To retire at age 50 with $60,000/year expenses, the user needs:

1. **Assets to Cover Age 50-60** (before CPP):
   - 10 years × $60,000 = $600,000 minimum
   - Accounting for inflation and investment returns

2. **Assets to Cover Age 60-65** (CPP only, no OAS):
   - 5 years with reduced expenses (CPP provides some income)

3. **Assets for Retirement After Age 65**:
   - CPP + OAS will provide base income
   - Remaining assets to supplement

**Rough Estimate**: Needs **$1.5M - $2M in savings** to retire at age 50 with $60K/year expenses.

**Current Assets**: $0 (RRSP + TFSA + Non-Reg = $0)

**Gap**: $1.5M - $2M shortfall 🚨

---

## Required Fixes

### Fix #1: Better Error Messages for Unrealistic Plans (P0)

**Problem**: User sees "0.6% success rate" without understanding what it means.

**Solution**: Add contextual warnings when success rate < 10%:

```
⚠️ Your Retirement Plan Needs Attention

Your plan has a 0.6% success rate, which means you're likely to run out of money.

Here's why:
• You're retiring at age 50 with no employment income
• Government benefits don't start until age 60 (CPP) and 65 (OAS)
• Your current savings ($0) won't cover 10+ years of expenses

Recommendations:
1. Increase your retirement age to 60+ (when CPP starts)
2. Add current savings/assets to your profile
3. Plan for part-time work or other income until age 60
4. Reduce annual expenses to match available income

[Adjust My Plan] [Talk to an Advisor]
```

### Fix #2: Early Retirement Education & Guidance (P1)

**Problem**: Users don't understand the challenges of retiring before age 60.

**Solution**: Add "Early Retirement Planning Guide" to help docs:

Topics:
- CPP minimum age: 60 (with 36% penalty if taken early)
- OAS minimum age: 65 (no early access)
- Income gap strategies (part-time work, rental income, dividends)
- Asset requirements for early retirement
- Withdrawal sequencing for tax efficiency

### Fix #3: Fix Baseline Scenario Auto-Population (P1)

**Problem**: Baseline scenario has generic values (age 65, province ON) instead of user's actual data.

**Solution**: When creating baseline scenario, populate from user profile:

```typescript
// When user signs up or first visits simulation page
const baselineScenario = {
  name: "Baseline",
  description: "Your default retirement scenario",
  currentAge: calculateAge(user.dateOfBirth),  // Calculate from DOB
  retirementAge: user.targetRetirementAge || calculateAge(user.dateOfBirth),  // Use target or current age
  province: user.province || "ON",  // Use user's province
  cppStartAge: Math.max(60, user.targetRetirementAge || 65),  // CPP min age 60
  oasStartAge: Math.max(65, user.targetRetirementAge || 65),  // OAS min age 65
  // ... rest of fields
};
```

### Fix #4: Validate CPP/OAS Start Ages for Early Retirement (P1)

**Problem**: Users can set retirement age < 60, but CPP cannot start before 60.

**Solution**: Add validation in simulation UI:

```typescript
// When user sets retirement age < 60
if (retirementAge < 60) {
  // Auto-adjust CPP start age to 60 (minimum)
  setCppStartAge(Math.max(60, cppStartAge));

  showWarning(`
    Retiring before age 60? Your CPP benefits won't start until age 60.
    You'll need other income sources to cover ${60 - retirementAge} years.
  `);
}

if (retirementAge < 65) {
  // Auto-adjust OAS start age to 65 (minimum)
  setOasStartAge(Math.max(65, oasStartAge));

  showWarning(`
    OAS benefits don't start until age 65.
    You'll need to cover ${65 - retirementAge} years without OAS.
  `);
}
```

### Fix #5: Add "Why Is My Success Rate Low?" Help Section (P2)

**Problem**: Users don't understand what affects success rate.

**Solution**: Add interactive help tooltip/modal explaining:

- What success rate means (% of scenarios where money lasts to age 95)
- Factors that reduce success rate:
  - Early retirement (< age 60)
  - Low savings relative to expenses
  - High spending in early years
  - No income sources during retirement
  - Aggressive withdrawal strategy
- How to improve success rate:
  - Work longer (delay retirement)
  - Save more before retiring
  - Reduce expenses
  - Add income sources (rental, part-time, dividends)
  - Optimize withdrawal strategy

---

## User Stories to Create

### US-046: Improve Low Success Rate Messaging (8 pts)

**As a** retirement planner
**I want** clear explanations when my plan has a low success rate
**So that** I understand why it's failing and what I can do to fix it

**Acceptance Criteria**:
- [ ] When success rate < 10%, show warning modal with specific reasons
- [ ] Identify exact issues (low savings, early retirement, no income, etc.)
- [ ] Provide 3-5 actionable recommendations
- [ ] Link to relevant help docs (early retirement guide, withdrawal strategies)
- [ ] Allow user to accept warning or adjust plan
- [ ] Track how many users adjust vs. ignore warnings (analytics)

**Technical Notes**:
- Add `getFailureReasons()` function to analyze simulation results
- Check: retirement age, savings balance, income sources, expense ratio
- Create `LowSuccessRateWarning` component
- Add to `/simulation/results` page

**Estimated Time**: 8 hours

---

### US-047: Fix Baseline Scenario Auto-Population (3 pts)

**As a** new user
**I want** my baseline scenario to use my actual age and province
**So that** my simulations are relevant to my situation

**Acceptance Criteria**:
- [ ] Calculate user's age from `dateOfBirth` when creating baseline scenario
- [ ] Use user's `province` instead of defaulting to "ON"
- [ ] Use user's `targetRetirementAge` if set, otherwise use current age
- [ ] Set CPP start age to max(60, retirementAge)
- [ ] Set OAS start age to max(65, retirementAge)
- [ ] Apply to both new users and update existing baseline scenarios (migration)

**Technical Notes**:
- Update `/api/scenario/create-baseline` endpoint
- Add `calculateAgeFromDOB()` utility function
- Create migration script to fix existing baseline scenarios
- Test with users who have DOB but wrong scenario age

**Estimated Time**: 3 hours

---

### US-048: Add Early Retirement Validation & Warnings (5 pts)

**As a** user planning early retirement (< age 60)
**I want** to see warnings about CPP/OAS timing and income gaps
**So that** I can plan appropriately for the years before benefits start

**Acceptance Criteria**:
- [ ] Detect when `retirementAge < 60`
- [ ] Show warning: "CPP cannot start until age 60 (X years away)"
- [ ] Auto-adjust CPP start age to minimum 60
- [ ] Show warning: "OAS cannot start until age 65 (Y years away)"
- [ ] Auto-adjust OAS start age to minimum 65
- [ ] Calculate income gap years and display prominently
- [ ] Suggest income sources for gap years (employment, rental, dividends)
- [ ] Link to "Early Retirement Planning Guide" help doc

**Technical Notes**:
- Add validation to `/simulation/form` component
- Create `EarlyRetirementWarning` component
- Update CPP/OAS age inputs with min/max constraints
- Add help tooltip explaining government benefit age rules

**Estimated Time**: 5 hours

---

### US-049: Create Early Retirement Planning Guide (2 pts)

**As a** user considering early retirement
**I want** educational content about early retirement challenges
**So that** I can make informed decisions about my retirement age

**Acceptance Criteria**:
- [ ] Create `/help/early-retirement` page
- [ ] Explain CPP/OAS minimum ages and penalties
- [ ] Show examples of successful early retirement scenarios
- [ ] Provide asset requirement calculator (years × expenses)
- [ ] List income gap strategies (work, rental, dividends, withdrawal sequencing)
- [ ] Link from simulation warnings and help menu

**Technical Notes**:
- Create Markdown content file
- Add to help documentation nav
- Include interactive examples
- Link from relevant error/warning messages

**Estimated Time**: 2 hours

---

## Immediate Actions

1. **Respond to User** (Privacy-Safe Email):
   - Thank them for feedback
   - Explain that 0.6% success rate means plan needs adjustments
   - Ask if they have savings/assets not yet entered in profile
   - Offer to schedule call to review their early retirement plan
   - Link to dashboard to update profile

2. **Add to Sprint 6 Backlog**:
   - US-046 (8 pts) - Low success rate messaging
   - US-047 (3 pts) - Baseline scenario fix
   - US-048 (5 pts) - Early retirement validation
   - US-049 (2 pts) - Early retirement guide
   - **Total**: 18 points

3. **Quick Win** (Deploy Today):
   - Add simple warning when success rate < 10%: "Your plan may not be sustainable. Consider adjusting retirement age, increasing savings, or reducing expenses."

---

## Analytics to Track

1. **Early Retirement Cohort**:
   - Users with `retirementAge < 60`
   - Average success rate for early retirees
   - Conversion to adjusting plan after warning

2. **Success Rate Distribution**:
   - How many users have success rate < 10%?
   - How many adjust their plan vs. ignore warnings?

3. **Common Issues**:
   - Most frequent failure reasons
   - Which fixes improve success rate the most?

---

## Conclusion

**The app is working correctly** - it's showing that retiring at age 50 with $0 assets is not financially viable.

**The user needs better education and guidance** to understand:
1. Why their plan has a 0.6% success rate
2. What they can do to improve it (work longer, save more, reduce expenses)
3. The specific challenges of early retirement (income gaps before CPP/OAS)

**Priority**: Create US-046, US-047, US-048, and US-049 for Sprint 6 to improve early retirement planning experience.

---

**Status**: Investigation complete
**Next Steps**: Add user stories to backlog, send privacy-safe clarification email to user
