# RetireZest Onboarding Improvement Plan

**Generated:** December 29, 2025
**Current Status:** 50% drop-off after registration, 33.3% completion rate
**Goal:** Increase completion rate from 33.3% to 60%+

---

## Executive Summary

Based on comprehensive analytics and codebase analysis, RetireZest has a **50% drop-off rate** immediately after registration (users not completing personal info). However, users who add assets have a strong **54.5% completion rate**. The key opportunity is bridging the gap between registration and first meaningful action.

### Key Metrics (Current State)
- **Total Users:** 18
- **Registration → Personal Info:** 50% (9/18 users) ❌ **CRITICAL DROP-OFF**
- **Personal Info → Assets:** 61.1% (11/18 users)
- **Assets → Completed Profile:** 54.5% (6/11 users) ✅ Good
- **Overall Completion:** 33.3% (6/18 users)
- **Weekly Retention:** 66.7% ✅ Strong

### Root Cause Analysis

**The Problem:** After registration, users land on dashboard → redirected to welcome page with two-button choice. Many users:
1. Don't understand the value proposition yet
2. Feel overwhelmed by "30-45 minute" estimate
3. Choose "I'm Experienced" to skip but then don't know what to do
4. Abandon the process entirely

**The Opportunity:** Users who commit to adding assets are very likely to complete (54.5%). We need to get more users to that first meaningful action.

---

## Improvement Strategy: The "Progressive Commitment" Approach

### Philosophy
Instead of asking users to commit to 30-45 minutes upfront, guide them through a **progressive commitment journey** where each step builds confidence and provides immediate value.

### Three-Phased Approach

```
Phase 1: Quick Wins (5 minutes)
  ↓ Provides immediate value
Phase 2: Core Setup (15 minutes)
  ↓ Builds on early success
Phase 3: Complete Profile (30 minutes)
  ↓ Full planning power
```

---

## Detailed Improvement Plan

## 🎯 Priority 1: Eliminate Initial Drop-Off (Target: Week 1-2)

### Problem
50% of users don't complete personal info after registration.

### Solution: Inline Registration Enhancement

**Action Items:**

1. **Collect More Data During Registration**
   - **Current:** Email, password, first name, last name
   - **Proposed:** Add date of birth and province to registration form
   - **Why:** Reduces first wizard step from 5 fields to 2 fields (marital status + "do you want to plan with a partner?")
   - **Implementation:** Update `app/(auth)/register/page.tsx`

2. **Remove Welcome Page Friction**
   - **Current:** Two-button choice immediately after registration
   - **Proposed:** Automatically start guided path, show "Quick Setup" progress bar
   - **Why:** Removes decision paralysis, creates momentum
   - **Implementation:**
     - Skip `/welcome` page for new users
     - Auto-set `userPath: 'guided'`
     - Show: "Let's get your retirement plan started! (2 minutes to see your first insights)"

3. **Reimagine Step 1 as "Quick Start"**
   - **New Title:** "Quick Start: Tell Us About Your Situation"
   - **Fields:**
     - Marital status (dropdown)
     - Include partner in planning? (toggle)
   - **Micro-copy:** "This helps us personalize your plan. Takes 30 seconds."
   - **Immediate Benefit:** Show estimated retirement age calculation instantly

**Expected Impact:**
- Registration → Personal Info: 50% → 80%+
- First step completion time: <1 minute
- Immediate value demonstration

**Files to Update:**
- `/app/(auth)/register/page.tsx` - Add DOB and province fields
- `/app/(dashboard)/dashboard/page.tsx` - Remove welcome redirect
- `/app/(dashboard)/onboarding/wizard/steps/PersonalInfoStep.tsx` - Simplify to 2 fields
- `/app/(dashboard)/welcome/page.tsx` - Deprecate or repurpose

---

## 🎯 Priority 2: Restructure Wizard Flow (Target: Week 2-3)

### Problem
Current 6-9 step wizard feels long and overwhelming.

### Solution: "3-2-1 Launch" Progressive Disclosure

**New Structure:**

### **Phase 1: Essential Setup (3 Steps - 5 minutes)**

#### Step 1: Your Situation (Already simplified in Priority 1)
- Marital status
- Include partner toggle

#### Step 2: Your Big Number (NEW - Most Important!)
- **Title:** "What assets do you have to retire with?"
- **Simplified Input:**
  - RRSPs: $______
  - TFSAs: $______
  - Non-Registered: $______
  - "I'll add details later" (saves as single "Total Assets" entry)
- **Immediate Value:** Show rough retirement projection
- **Micro-copy:** "Don't worry about exact numbers. We can refine later."

#### Step 3: Your Income Today
- Employment income: $______
- Other income: $______
- **Immediate Value:** Show contribution potential and retirement readiness score

**At this point:** User sees a basic retirement projection! They're hooked.

**Show Success Screen:**
```
🎉 Great start! Here's what we found:

✅ Your Assets: $X,XXX,XXX
✅ Projected at Age 65: $X,XXX,XXX
✅ Monthly Income Potential: $X,XXX

Want to get more accurate?
[Continue Setup] [See Dashboard]
```

### **Phase 2: Detailed Setup (2 Steps - 15 minutes)**

Only shown if user clicks "Continue Setup":

#### Step 4: Asset Details
- Break down assets by account type
- Add partner assets if applicable
- More accurate account balances

#### Step 5: Income & Expenses Details
- Complete income sources (CPP, OAS, pensions)
- Household expenses
- Partner income if applicable

### **Phase 3: Advanced Planning (1 Step - 10 minutes)**

#### Step 6: Retirement Goals & Review
- Target retirement age
- Life expectancy
- Risk tolerance
- Final review

**Expected Impact:**
- Phase 1 completion: 80%+
- Phase 1 → Phase 2: 60%+
- Overall completion: 50%+

**Files to Create/Update:**
- New: `/app/(dashboard)/onboarding/wizard/steps/QuickAssetsStep.tsx`
- Update: `/app/(dashboard)/onboarding/wizard/page.tsx` - New step logic
- New: `/components/SuccessScreen.tsx` - Early win celebration

---

## 🎯 Priority 3: Psychological Improvements (Target: Week 3-4)

### 1. Progress Gamification

**Add Progress Milestones:**
```
✅ Step 1: Account Created
✅ Step 2: Basic Info Added
→  Step 3: Add Your First Asset ← You are here!
   Step 4: See Your Projection
   Step 5: Refine Your Plan
```

**Completion Badges:**
- 🌱 "Getting Started" (Steps 1-3)
- 🌿 "Building Momentum" (Steps 4-5)
- 🌳 "Retirement Ready" (Full profile)

**Implementation:**
- Add progress visual to wizard header
- Show percentage complete
- Celebration animations on milestone completion

### 2. Value-First Messaging

**Replace time estimates with value promises:**

❌ **Bad:** "This will take 30-45 minutes"
✅ **Good:** "In 5 minutes, you'll see your retirement projection"

❌ **Bad:** "Step 3 of 9"
✅ **Good:** "Next: See how much you can save on taxes"

### 3. Social Proof

**Add to welcome/wizard:**
- "18 Canadians are already planning their retirement with RetireZest"
- "Average user discovers $127K in tax savings" (when we have data)
- Testimonials from completed profiles

### 4. Exit Intent Intervention

**When user tries to leave wizard:**
```
⚠️ Before you go...

You're just 2 minutes away from seeing your retirement projection.

[Leave Anyway] [Finish Quick Setup]
```

**Files to Update:**
- `/app/(dashboard)/onboarding/wizard/page.tsx` - Add progress indicators
- New: `/components/ProgressMilestones.tsx`
- New: `/components/ExitIntentModal.tsx`

---

## 🎯 Priority 4: Post-Registration Email Sequence (Target: Week 4)

### Problem
Users who abandon onboarding never return.

### Solution: Automated Email Nurture Campaign

**Email 1: Immediately After Registration (0 minutes)**
```
Subject: Welcome to RetireZest! Let's get started 🎉

Hi [First Name],

Thanks for joining RetireZest!

Your personalized retirement dashboard is ready. Let's take 5 minutes
to see your retirement projection:

[Complete Quick Setup]

- See your retirement readiness score
- Discover tax optimization opportunities
- Get your personalized action plan

Takes just 5 minutes.

Juan @ RetireZest
```

**Email 2: Abandoned After Personal Info (24 hours)**
```
Subject: [First Name], you're 3 minutes away from your retirement plan

Hi [First Name],

I noticed you started your RetireZest profile but didn't finish.

Good news: You're 80% done with the basics!

[Finish Your Setup] (3 minutes)

What you'll get:
✅ Your retirement projection
✅ Tax optimization tips
✅ Personalized recommendations

See you inside,
Juan
```

**Email 3: Abandoned After Assets (48 hours)**
```
Subject: Your retirement projection is almost ready!

Hi [First Name],

Great progress! You've added $[ASSET_TOTAL] in assets.

Just 2 more quick questions and you'll see:
- When you can retire comfortably
- How much monthly income you'll have
- Smart ways to optimize your plan

[See My Projection] (2 minutes)

Juan @ RetireZest
```

**Email 4: Completed Profile - Next Steps (Immediately)**
```
Subject: 🎉 Your retirement plan is ready!

Hi [First Name],

Congratulations! Your complete retirement profile is ready.

Here's what to explore next:

1. 💰 Benefits Calculator - Estimate CPP, OAS, GIS
2. 📊 Run Simulations - See different scenarios
3. 🎯 Tax Optimization - Find savings opportunities

[Explore Your Dashboard]

Proud of you,
Juan
```

**Implementation:**
- Use Resend's email API
- Trigger based on onboarding state
- Track opens and clicks
- A/B test subject lines

**Files to Create:**
- `/app/api/email/onboarding-sequence/route.ts`
- `/lib/email-templates/onboarding.tsx`
- Update: `/app/api/user/onboarding/route.ts` - Trigger emails on state change

---

## 🎯 Priority 5: Dashboard First-Time Experience (Target: Week 5)

### Problem
Users who skip onboarding land on empty dashboard and don't know what to do.

### Solution: Smart Empty States

**When dashboard has no data:**

```
┌─────────────────────────────────────────────────┐
│  👋 Welcome to your retirement dashboard!      │
│                                                 │
│  Let's get started with 3 quick questions:     │
│                                                 │
│  1️⃣ What assets do you have? [Add Assets]      │
│  2️⃣ What's your income? [Add Income]           │
│  3️⃣ What are your goals? [Set Goals]           │
│                                                 │
│  Or: [Complete Quick Setup] (5 min)            │
└─────────────────────────────────────────────────┘
```

**After first asset added:**
```
🎉 Great start! Your first asset is saved.

Next recommended action:
→ Add your income to see your retirement projection
  [Add Income Now]
```

**Progressive CTAs:**
- 0 assets: "Add your first asset"
- 1-2 assets: "Add more assets for accuracy"
- Assets only: "Add income to see projection"
- Assets + Income: "Add expenses to refine plan"
- Near complete: "Finish your profile (2 steps left)"

**Files to Create:**
- New: `/components/dashboard/EmptyState.tsx`
- New: `/components/dashboard/NextActionPrompt.tsx`
- Update: `/app/(dashboard)/dashboard/page.tsx`

---

## 🎯 Priority 6: A/B Testing Infrastructure (Target: Week 6)

### Implementation

**Test Variations:**
1. **Welcome Page:**
   - A: Current two-button choice
   - B: Auto-start with progress bar
   - C: Video explanation + CTA

2. **Step 1 Copy:**
   - A: "Personal Information"
   - B: "Quick Start: Your Situation"
   - C: "Tell Us About You (30 seconds)"

3. **Asset Input:**
   - A: Detailed form with all account types
   - B: Simple "What's your total?" input
   - C: Slider with ranges

**Tracking:**
- Completion rate per variation
- Time to complete
- User satisfaction (post-completion survey)

**Files to Create:**
- `/lib/ab-testing.ts` - A/B test utilities
- `/app/api/analytics/track/route.ts` - Event tracking
- Update: Add tracking to all onboarding steps

---

## 🎯 Priority 7: Mobile Optimization (Target: Week 7)

### Problem
Wizard may not be optimized for mobile users.

### Solution

1. **Mobile-First Wizard Design**
   - Single-column layout
   - Large tap targets
   - Swipe navigation between steps
   - Native number keyboards for $ inputs

2. **Save Progress Automatically**
   - Auto-save every field change
   - "Resume on desktop" option
   - QR code to continue on computer

3. **Progressive Web App (PWA)**
   - Add to home screen
   - Offline support for draft data
   - Push notifications for abandoned onboarding

**Files to Update:**
- All wizard step components - Responsive CSS
- `/public/manifest.json` - PWA config
- New: `/app/sw.ts` - Service worker

---

## Implementation Timeline

### Week 1-2: Quick Wins (Priority 1)
- [ ] Add DOB and province to registration
- [ ] Simplify PersonalInfoStep to 2 fields
- [ ] Remove welcome page friction
- [ ] Deploy and measure impact

**Success Metric:** Registration → Personal Info: 50% → 70%

### Week 2-3: Restructure Flow (Priority 2)
- [ ] Create QuickAssetsStep component
- [ ] Implement 3-phase progressive disclosure
- [ ] Add early success screen
- [ ] Deploy and measure

**Success Metric:** Phase 1 completion: 80%+

### Week 3-4: Psychological Improvements (Priority 3)
- [ ] Add progress gamification
- [ ] Update all micro-copy
- [ ] Add exit intent modal
- [ ] Deploy and measure

**Success Metric:** Overall completion: 40%+

### Week 4: Email Sequence (Priority 4)
- [ ] Design email templates
- [ ] Implement trigger logic
- [ ] Set up tracking
- [ ] Deploy and monitor

**Success Metric:** 20% of abandoned users return

### Week 5: Dashboard Empty States (Priority 5)
- [ ] Design empty state components
- [ ] Implement smart CTAs
- [ ] Add progressive prompts
- [ ] Deploy

**Success Metric:** Dashboard engagement: 50%+

### Week 6-7: Testing & Mobile (Priorities 6-7)
- [ ] Set up A/B testing infrastructure
- [ ] Mobile optimization
- [ ] PWA implementation
- [ ] Continuous iteration

**Success Metric:** Overall completion: 50%+, Mobile parity

---

## Success Metrics & KPIs

### Primary Metrics
| Metric | Current | Target (3 months) |
|--------|---------|-------------------|
| Registration → Personal Info | 50% | 80% |
| Overall Profile Completion | 33.3% | 60% |
| Time to First Value | N/A | <3 minutes |
| Weekly Retention | 66.7% | 75% |

### Secondary Metrics
- Average time to complete onboarding: Target <15 minutes
- Email re-engagement rate: Target 20%+
- Mobile completion rate: Target = Desktop rate
- User satisfaction score: Target 8+/10

### Leading Indicators
- Step 1 completion rate
- Phase 1 (Quick Setup) completion rate
- Asset addition rate
- Email open rates
- Dashboard return visits

---

## Testing Plan

### Phase 1: Internal Testing (Week 1)
- [ ] Test all new flows with internal team
- [ ] Fix critical bugs
- [ ] Validate data persistence

### Phase 2: Beta Testing (Week 2-3)
- [ ] Recruit 10 new users for beta
- [ ] Watch session recordings
- [ ] Collect feedback surveys
- [ ] Iterate based on findings

### Phase 3: Gradual Rollout (Week 4+)
- [ ] 25% of new users → Week 4
- [ ] 50% of new users → Week 5
- [ ] 100% of new users → Week 6
- [ ] Monitor metrics daily

---

## Risk Mitigation

### Potential Risks

1. **Too Many Changes at Once**
   - **Mitigation:** Implement priority by priority, measure each
   - **Rollback Plan:** Feature flags for each major change

2. **Reduced Data Quality**
   - **Mitigation:** Progressive disclosure still gets detailed data in Phase 2
   - **Validation:** Compare data completeness before/after

3. **Existing Users Confusion**
   - **Mitigation:** Only apply to new users (`createdAt > deployment date`)
   - **Communication:** Email existing users about improvements

4. **Technical Complexity**
   - **Mitigation:** Start with simplest changes first
   - **Testing:** Comprehensive test coverage for wizard logic

---

## Resource Requirements

### Development Time Estimate
- Priority 1: 16 hours
- Priority 2: 32 hours
- Priority 3: 20 hours
- Priority 4: 24 hours
- Priority 5: 16 hours
- Priority 6: 20 hours
- Priority 7: 32 hours

**Total:** ~160 hours (4 weeks full-time)

### Design Resources
- New UI components: 20 hours
- Email templates: 8 hours
- Mobile optimization: 12 hours

**Total Design:** ~40 hours

### Tools Needed
- Resend (email) - Already set up ✅
- Analytics platform (consider PostHog or Mixpanel)
- Session recording (Hotjar or LogRocket)
- A/B testing library (optional - can build basic version)

---

## Long-Term Vision

### 6 Months Out
- AI-powered onboarding assistant
- Smart defaults based on demographics
- Voice input for asset/income data
- Integration with financial institutions (Plaid)

### 12 Months Out
- Predictive onboarding (pre-fill based on age/province)
- Personalized video walkthroughs
- Community success stories
- Gamification with rewards

---

## Conclusion

The current 50% drop-off after registration is the critical bottleneck. By implementing the **"Progressive Commitment" approach**, we can:

1. ✅ Get users to first value in <5 minutes (vs 30-45)
2. ✅ Increase completion from 33.3% → 60%+
3. ✅ Maintain data quality through progressive disclosure
4. ✅ Build momentum with early wins
5. ✅ Re-engage abandoned users via email

**Expected ROI:**
- Current: 6 completed profiles / 18 users = 33%
- Target: 11 completed profiles / 18 users = 60%
- **Impact: 83% more completed profiles!**

With $25.7M in assets already on the platform and strong retention (66.7%), improving onboarding is the highest-leverage improvement we can make.

---

**Next Step:** Review and prioritize these recommendations, then start with Priority 1 (Quick Wins) in Week 1.

**Questions or feedback?** Let's discuss implementation approach and resource allocation.
