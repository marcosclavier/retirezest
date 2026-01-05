# Simulation User Experience Improvement Plan
**RetireZest.com - January 2026**

---

## Executive Summary

Based on analysis of the current simulation implementation and user engagement data, this plan proposes comprehensive improvements to make the retirement simulation more user-friendly and increase conversion from "ready to simulate" (42% of users) to "active simulators" (currently only 14%).

**Key Insight:** 10 verified users have 100% profile completion but have run zero simulations - indicating significant UX barriers preventing simulation usage.

---

## Current State Analysis

### User Flow
1. User navigates to `/simulation` page
2. System auto-loads profile data (prefill)
3. User sees complex tabbed interface with "Input" and "Results" tabs
4. Input tab contains 3 major collapsible sections:
   - Person 1 Form (with 7 sub-sections)
   - Person 2 Form (optional, with 7 sub-sections)
   - Household Form (with multiple sub-sections)
5. User must click "Run Simulation" button
6. Results appear in "Results" tab

### Current Strengths
✅ Automatic profile prefilling from database
✅ Smart data merging (fresh DB data + custom settings)
✅ Quick-start mode for fast simulations
✅ Comprehensive visualization suite (6+ chart types)
✅ Year-by-year detailed table
✅ Health score card for plan assessment
✅ PDF export functionality
✅ Scenario comparison feature
✅ Local storage persistence

### Current Pain Points
❌ **Information Overload**: 50+ input fields across multiple collapsible sections
❌ **Unclear Entry Point**: Users don't know where to start
❌ **Hidden Complexity**: Advanced options buried in collapsed sections
❌ **No Progressive Disclosure**: All complexity presented at once
❌ **Intimidating Interface**: Looks like professional financial software
❌ **Lack of Guidance**: No tooltips or contextual help on main inputs
❌ **Results Isolation**: Results in separate tab, breaking flow
❌ **No Visual Feedback**: No preview or mini-results before full simulation
❌ **Missing Confidence Builders**: No validation, no data quality indicators
❌ **Poor Mobile Experience**: Complex forms don't adapt well to small screens

### User Engagement Data (Key Metrics)
- **Total Users:** 36
- **Ready to Simulate:** 15 (42%) - Have sufficient data
- **Active Simulators:** 5 (14%) - Actually ran simulations
- **Conversion Gap:** 28% - Users ready but not simulating
- **Zero Simulations:** 31 users (86%)
- **High-Value Lost Opportunities:** 10 verified users with 100% profile completion and 0 simulations

---

## Improvement Plan: Three-Phase Approach

---

## PHASE 1: Quick Wins (1-2 weeks)
*Focus: Reduce friction and increase confidence*

### 1.1 Simplified Landing Experience

**Problem:** Users face 50+ fields immediately
**Solution:** Implement progressive disclosure

#### Changes:
1. **New "Smart Start" Card** (appears before main form)
   ```
   ┌─────────────────────────────────────────┐
   │ 🎯 Ready to See Your Retirement Plan?   │
   │                                         │
   │ We've loaded your data from your        │
   │ profile. Click below to run a quick     │
   │ simulation with smart defaults.         │
   │                                         │
   │  [🚀 Run Quick Simulation]              │
   │  [⚙️ Customize Settings First]          │
   └─────────────────────────────────────────┘
   ```

2. **Data Quality Indicator**
   - Show completeness percentage badge
   - "Your plan is 95% complete - Great job!"
   - Color-coded: Green (80-100%), Yellow (50-79%), Orange (<50%)

3. **Auto-Collapse Advanced Sections by Default**
   - Keep only "Account Balances" open
   - Add "(Optional)" labels to advanced sections
   - Show completion checkmarks on completed sections

#### Implementation:
- File: `app/(dashboard)/simulation/page.tsx`
- Add `<SmartStartCard>` component above current tabs
- Modify collapsible sections `defaultOpen` logic
- Add data quality badge to header

---

### 1.2 Inline Results Preview

**Problem:** Results hidden in separate tab
**Solution:** Show mini-preview while editing

#### Changes:
1. **Sticky Results Summary Card**
   ```
   ┌─────────────────────────────────────────┐
   │ 📊 Plan Snapshot                        │
   │                                         │
   │ Retirement Age: 65                      │
   │ Total Assets: $847,500                  │
   │ Est. Annual Income: $52,000             │
   │                                         │
   │ [Run Full Simulation →]                 │
   └─────────────────────────────────────────┘
   ```
   - Appears in right sidebar on desktop
   - Sticky at top on mobile
   - Updates when key fields change
   - Shows basic calculations (no API call needed)

2. **Real-time Validation Indicators**
   - Green checkmark next to completed sections
   - Yellow warning for recommended values to review
   - Inline tooltips for common mistakes

#### Implementation:
- Create `<PlanSnapshotCard>` component
- Add to `SimulationPage` layout (right column on lg+ screens)
- Calculate basic metrics client-side
- Position: sticky on scroll

---

### 1.3 Contextual Help & Tooltips

**Problem:** No guidance on what values mean
**Solution:** Add helpful tooltips everywhere

#### Changes:
1. **Enhanced Tooltips**
   - Add `<HelpTooltip>` to all major fields
   - Include examples: "e.g., $15,000 for maximum CPP"
   - Add "Why this matters" explanations

2. **Smart Defaults Indicator**
   - Show blue info icon for prefilled values
   - Tooltip: "✓ This value was loaded from your profile"
   - Highlight estimated values in orange

3. **Field-Level Help Text**
   - Under complex inputs, add gray help text
   - Example: "Adjusted Cost Base is typically 70-90% of current balance"

#### Implementation:
- Extend `HelpTooltip` component with better styling
- Add tooltip content to `PersonForm.tsx` and `HouseholdForm.tsx`
- Create tooltip content library: `lib/help-text/simulation-tooltips.ts`

---

### 1.4 Improved Call-to-Action

**Problem:** "Run Simulation" button buried in form
**Solution:** Multiple strategic CTAs

#### Changes:
1. **Primary CTA Placement**
   - Floating action button (mobile)
   - Sticky button bar at bottom (desktop)
   - Always visible while scrolling

2. **CTA Variations by Context**
   - First-time users: "🚀 Run Your First Simulation"
   - Returning users: "▶️ Run Updated Simulation"
   - After data change: "🔄 Recalculate with New Values"

3. **Progress Indicator**
   - Show "3 of 5 sections completed" before CTA
   - Disable CTA until minimum data present
   - Show what's missing: "Add retirement age to continue"

#### Implementation:
- Add `<FloatingCTA>` component
- Implement completion tracking logic
- Add conditional messaging based on user state

---

## PHASE 2: Enhanced User Experience (2-3 weeks)
*Focus: Guided experience and confidence building*

### 2.1 Simulation Wizard Mode

**Problem:** Too many options at once
**Solution:** Optional step-by-step guided mode

#### Changes:
1. **Two-Path Entry**
   - **Express Mode** (default): Current interface with Phase 1 improvements
   - **Guided Mode**: Step-by-step wizard

2. **Wizard Steps**
   ```
   Step 1: Verify Your Profile
   - Name, age, province (pre-filled)
   - [Next: Review Assets →]

   Step 2: Review Asset Balances
   - TFSA, RRSP, RRIF, Non-reg (pre-filled)
   - [← Back] [Next: Government Benefits →]

   Step 3: Government Benefits
   - CPP/OAS start ages and amounts
   - Link to benefits calculator
   - [← Back] [Next: Spending Plan →]

   Step 4: Retirement Spending
   - Three-phase spending (go-go, slow-go, no-go)
   - Visual timeline
   - [← Back] [Next: Review & Run →]

   Step 5: Review & Run
   - Summary of all inputs
   - Data quality score
   - [← Back] [🚀 Run Simulation]
   ```

3. **Progress Bar**
   - Visual indicator: "Step 2 of 5"
   - Estimated time remaining: "~2 minutes left"
   - Allow jumping between completed steps

#### Implementation:
- Create `WizardMode` component
- Add wizard toggle at top of page
- Persist wizard progress in localStorage
- Track wizard completion in analytics

---

### 2.2 Interactive Results Dashboard

**Problem:** Static results, no exploration
**Solution:** Interactive, explorable results

#### Changes:
1. **Results Hero Section**
   ```
   ┌──────────────────────────────────────────────────┐
   │                                                  │
   │        Your Retirement Plan Health Score         │
   │                                                  │
   │                    87/100                        │
   │               ███████████░░                      │
   │                  STRONG                          │
   │                                                  │
   │  ✅ Your assets will last to age 95             │
   │  ✅ Consistent income throughout retirement      │
   │  ⚠️  Consider delaying CPP to age 70            │
   │                                                  │
   │         [View Detailed Breakdown ↓]              │
   └──────────────────────────────────────────────────┘
   ```

2. **What-If Sliders**
   - Retirement age slider: "What if I retire at 67 instead?"
   - Spending slider: "What if I reduce spending by 10%?"
   - Instant visual feedback on charts
   - No need to re-run full simulation

3. **Key Insights Callouts**
   - Auto-generated observations
   - "💡 Retiring 2 years later would increase your final estate by $125,000"
   - "⚠️ Your plan runs out of money at age 87 - consider these options..."
   - "✅ You have $450,000 left at age 95 - you may be able to spend more!"

4. **Comparison View**
   - Side-by-side before/after when making changes
   - Highlight differences in charts
   - "Show me the impact of this change"

#### Implementation:
- Enhance `ResultsDashboard.tsx` with hero section
- Add what-if calculator (client-side for instant feedback)
- Create `InsightsEngine` to generate contextual recommendations
- Add comparison mode to charts

---

### 2.3 Mobile-First Redesign

**Problem:** Poor mobile experience
**Solution:** Mobile-optimized interface

#### Changes:
1. **Mobile Input Optimization**
   - One section visible at a time (accordion)
   - Large touch targets (min 44px)
   - Bottom sheet for advanced options
   - Numeric keypad for currency inputs

2. **Swipeable Sections**
   - Swipe left/right between sections
   - Progress dots at bottom
   - "Tap to edit" collapsed sections

3. **Mobile Results View**
   - Vertical scrolling instead of tabs
   - Thumb-friendly chart interactions
   - Summary cards before detailed charts
   - "Tap chart to expand" for details

#### Implementation:
- Add responsive breakpoints in `simulation/page.tsx`
- Use Shadcn drawer component for mobile
- Implement touch gestures with react-swipeable
- Test on iOS and Android devices

---

### 2.4 Prefill Intelligence Improvements

**Problem:** Users don't trust prefilled data
**Solution:** Transparent, intelligent prefilling

#### Changes:
1. **Visual Prefill Indicators**
   - Blue highlight on prefilled fields
   - Timestamp: "Updated from profile 2 hours ago"
   - Source indicator: "From your Assets page"

2. **Prefill Confidence Scores**
   - Show certainty: "✅ Confirmed" vs "⚠️ Estimated"
   - Explain estimates: "ACB estimated at 80% of balance - Update in Assets"
   - Link to source pages for corrections

3. **Smart Refresh Prompts**
   - Detect stale data: "Your profile was updated 3 days ago. Reload?"
   - Auto-detect conflicts: "You deleted an asset - update simulation?"
   - One-click refresh button

4. **Prefill Success Stories**
   - After successful prefill: "✅ Loaded $847,500 in assets from your profile"
   - Show what was loaded in an expandable summary
   - Build user confidence

#### Implementation:
- Enhance prefill logic in `simulation/page.tsx` lines 230-346
- Add metadata tracking to localStorage
- Create `PrefillStatus` component
- Implement conflict detection algorithm

---

## PHASE 3: Advanced Features (3-4 weeks)
*Focus: Power users and engagement*

### 3.1 Simulation Templates & Presets

**Problem:** Starting from scratch is intimidating
**Solution:** Pre-configured templates

#### Templates:
1. **Conservative Retirement (Age 65)**
   - Late CPP/OAS (70)
   - Minimize-income tax strategy
   - Lower spending assumptions

2. **Early Retirement (Age 55)**
   - Early drawdown strategy
   - Bridge income planning
   - Higher initial spending

3. **Maximize Estate**
   - TFSA prioritization
   - Delayed benefits
   - Tax-efficient withdrawals

4. **Quick Estimate**
   - Minimal inputs required
   - Smart defaults for everything
   - 30-second simulation

#### Implementation:
- Create `templates/` directory with preset configurations
- Add template selector card on simulation page
- Store templates in `lib/simulation-templates.ts`
- Allow saving custom templates

---

### 3.2 Guided Optimization Suggestions

**Problem:** Users don't know how to improve their plan
**Solution:** AI-powered recommendations

#### Features:
1. **Optimization Wizard**
   - Analyze current plan
   - Identify inefficiencies
   - Suggest 3-5 concrete improvements
   - Show potential dollar impact

2. **Example Suggestions**
   - "💡 Delaying CPP to age 70 could increase lifetime benefits by $47,000"
   - "💡 Your TFSA is underutilized - consider moving $50K from non-reg"
   - "💡 Current strategy may trigger OAS clawback - try minimize-income"

3. **One-Click Apply**
   - "Apply this suggestion" button
   - Preview impact before committing
   - Undo changes easily

4. **Improvement Tracking**
   - Show score before/after
   - "You've improved your plan by 12 points!"
   - Save optimization history

#### Implementation:
- Create `OptimizationEngine` class
- Define optimization rules in `lib/optimization-rules.ts`
- Add `SuggestionCard` component to results
- Integrate with simulation API

---

### 3.3 Save & Compare Scenarios

**Problem:** Users can't explore alternatives easily
**Solution:** Enhanced scenario management

#### Features:
1. **Quick Save**
   - "Save this scenario" button on results
   - Name and describe scenario
   - Auto-save timestamp

2. **Scenario Library**
   - Grid view of all saved scenarios
   - Visual preview cards with key metrics
   - Sort by date, score, or custom

3. **Side-by-Side Comparison**
   - Select 2-3 scenarios to compare
   - Synchronized chart views
   - Difference highlighting
   - "Which scenario is better for me?"

4. **Scenario Sharing** (Future)
   - Generate shareable link
   - Advisor collaboration
   - Family planning

#### Implementation:
- Enhance existing `scenarios/page.tsx`
- Add scenario metadata to database schema
- Create `ScenarioComparison` component
- Implement diff algorithm for highlighting changes

---

### 3.4 Educational Overlays & Tooltips

**Problem:** Users don't understand retirement concepts
**Solution:** In-context education

#### Features:
1. **First-Time User Tour**
   - Automatic on first visit
   - 5-step introduction
   - Highlight key features
   - Can skip or replay anytime

2. **Contextual Learning Modules**
   - Click "Learn more" links
   - Pop-up mini-articles
   - Example: "What is RRIF minimum withdrawal?"
   - Video tutorials embedded

3. **Glossary Integration**
   - Hover over terms to see definitions
   - "CPP", "OAS", "ACB", etc.
   - Link to full glossary page

4. **Best Practices Guide**
   - "💡 Pro Tip" callouts
   - Common mistakes to avoid
   - Industry standard assumptions

#### Implementation:
- Add Shepherd.js or Intro.js for tours
- Create `EducationModal` component
- Build glossary database: `lib/glossary.ts`
- Add contextual tips throughout interface

---

## PHASE 4: Metrics & Iteration (Ongoing)

### 4.1 Analytics Implementation

**Track:**
- Simulation completion rate (goal: 50%+)
- Time to first simulation (goal: <5 minutes)
- Wizard vs Express mode usage
- Most edited fields
- Abandonment points
- Mobile vs desktop conversion
- Template usage
- Suggestion acceptance rate

**Tools:**
- Plausible Analytics (privacy-friendly)
- Custom event tracking
- Heatmap analysis
- Session recordings (with consent)

### 4.2 User Feedback Loop

**Mechanisms:**
- Post-simulation survey (optional)
- "Was this helpful?" buttons
- NPS score after 3 simulations
- Suggestion box
- Beta tester program

### 4.3 A/B Testing Plan

**Tests:**
1. Smart Start Card vs No Card
2. Wizard vs Express default
3. CTA button text variations
4. Results layout variations
5. Tooltip vs no tooltip on key fields

---

## Success Metrics

### Primary KPIs
- **Simulation Conversion Rate**: 14% → 50% (users who run ≥1 simulation)
- **Time to First Simulation**: Reduce from unknown → <3 minutes
- **Simulation Completion Rate**: Increase to 80%+ (users who complete full simulation)
- **User Satisfaction**: NPS score >50

### Secondary Metrics
- Mobile completion rate: 40%+
- Template usage: 30% of new users
- Suggestion acceptance: 25%+
- Scenario saving: 20% of active users
- Return simulation rate: 60% (users who run 2+ simulations)

---

## Implementation Priority Matrix

### Must Have (Phase 1)
1. Smart Start Card with quick simulation CTA
2. Inline results preview card
3. Enhanced tooltips on all major fields
4. Improved CTA visibility
5. Data quality indicators

### Should Have (Phase 2)
6. Wizard mode for guided experience
7. Interactive what-if sliders
8. Mobile-optimized interface
9. Prefill transparency improvements

### Nice to Have (Phase 3)
10. Simulation templates
11. Optimization suggestions
12. Enhanced scenario comparison
13. Educational overlays

### Future Considerations
14. AI-powered plan analysis
15. Collaborative planning (couples/advisors)
16. Monte Carlo simulations
17. Retirement income product recommendations
18. Integration with real financial accounts

---

## Technical Considerations

### Performance
- Lazy load chart components (already implemented)
- Debounce API calls for what-if sliders (500ms)
- Cache simulation results in localStorage
- Optimize prefill API queries
- Consider WebWorkers for heavy calculations

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader optimization
- High contrast mode
- Focus management in wizard

### Browser Compatibility
- Target: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Progressive enhancement for older browsers
- Polyfills for necessary features

### Mobile Considerations
- iOS 13+ and Android 9+
- Touch gesture support
- Reduced motion preferences
- Offline capability (future)

---

## Resource Requirements

### Development Time Estimates
- **Phase 1**: 1-2 weeks (40-80 hours)
- **Phase 2**: 2-3 weeks (80-120 hours)
- **Phase 3**: 3-4 weeks (120-160 hours)
- **Phase 4**: Ongoing (20 hours/month)

**Total Initial Investment**: 8-10 weeks (320-400 hours)

### Team Composition
- 1 Frontend Developer (primary)
- 1 UX Designer (consultation, 20% time)
- 1 Financial Domain Expert (validation, 10% time)
- 1 QA/Tester (20% time)

### Tools & Services
- Analytics: Plausible (~$10/month)
- User testing: UserTesting.com (~$200/month, optional)
- Design: Figma (existing)
- Development: Existing stack (Next.js, React, Tailwind)

---

## Risk Mitigation

### Risks
1. **Complexity Creep**: Too many features overwhelm users
   - **Mitigation**: Strict progressive disclosure, feature flags

2. **Performance Degradation**: Heavy UI slows down app
   - **Mitigation**: Performance budgets, lazy loading, monitoring

3. **User Resistance to Change**: Existing users dislike new UI
   - **Mitigation**: Gradual rollout, legacy mode option, clear communication

4. **Mobile Testing Gaps**: Issues on specific devices
   - **Mitigation**: Device lab testing, beta program, error monitoring

5. **Scope Creep**: Phases expand beyond estimates
   - **Mitigation**: Strict phase gates, MVP approach, prioritization framework

---

## Rollout Strategy

### Phase 1 Launch
1. Internal testing (1 week)
2. Beta group (10 power users, 1 week)
3. Soft launch (25% of traffic, 1 week)
4. Full rollout (monitor for 2 weeks)

### Gradual Feature Release
- Week 1-2: Smart Start + Tooltips
- Week 3-4: Results preview + CTA improvements
- Week 5-6: Wizard mode (opt-in)
- Week 7-8: Mobile optimization
- Week 9-10: Templates + Advanced features

### User Communication
- In-app announcement banner
- Email to registered users
- "What's New" modal on first visit
- Help documentation updates
- Tutorial videos

---

## Appendix: Competitive Analysis

### Competitor Comparison

**1. Wealthsimple Retirement Calculator**
- Strengths: Very simple, mobile-first
- Weaknesses: Limited customization
- Lesson: Simplicity wins for initial engagement

**2. FP Canada Retirement Calculator**
- Strengths: Comprehensive, professional
- Weaknesses: Complex, intimidating
- Lesson: Balance depth with accessibility

**3. Fidelity Retirement Planner**
- Strengths: Guided wizard, great visualizations
- Weaknesses: Account linking required
- Lesson: Wizard + visual feedback = higher completion

**RetireZest Opportunity**: Combine simplicity of Wealthsimple with depth of FP Canada and guidance of Fidelity.

---

## Conclusion

The current simulation interface is feature-rich but suffers from poor user experience that prevents 86% of users from running even a single simulation. By implementing these three phases of improvements, we can:

1. **Reduce friction** through progressive disclosure and smart defaults (Phase 1)
2. **Build confidence** through guided experiences and transparent data (Phase 2)
3. **Drive engagement** through templates, suggestions, and scenarios (Phase 3)

The goal is to transform the simulation from a complex professional tool into an accessible, confidence-building experience that any Canadian can use to plan their retirement - while maintaining the sophisticated calculation engine that makes RetireZest valuable.

**Next Steps:**
1. Review and approve this plan
2. Design mockups for Phase 1 changes
3. User testing on proposed improvements
4. Begin Phase 1 implementation
5. Set up analytics tracking
6. Launch beta program

---

*Document prepared: January 2026*
*Version: 1.0*
*Status: Awaiting Review*
