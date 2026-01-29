# Definition of Ready (DoR) - RetireZest

**Last Updated**: January 29, 2026 (Added AI-2.1: Git history check)
**Owner**: Development Team

---

## Purpose

The Definition of Ready ensures that user stories are properly prepared before being committed to a sprint. A story that meets the DoR is ready to be worked on immediately without blockers or ambiguity.

---

## Checklist: Is This Story Ready?

A user story is considered **"Ready"** when ALL of the following criteria are met:

### 1. ✅ Story Basics

- [ ] **Story has a unique ID** (e.g., US-XXX, BUILD-FIX)
- [ ] **Story has a clear title** (descriptive, action-oriented)
- [ ] **Story follows user story format**: "As a [role], I want [feature] so that [benefit]"
- [ ] **Story has story point estimate** (using Fibonacci: 1, 2, 3, 5, 8, 13)
- [ ] **Story has priority** (P0/P1/P2/P3)
- [ ] **Story is appropriately sized** (≤8 story points; if >8, break it down)

### 2. ✅ Acceptance Criteria

- [ ] **Story has clear, testable acceptance criteria** (3-7 criteria)
- [ ] **Acceptance criteria use** "Given/When/Then" **or checklist format**
- [ ] **Each criterion is measurable** (no ambiguity about "done")
- [ ] **Success and failure cases defined** (edge cases considered)
- [ ] **Acceptance criteria reviewed by product owner**

### 3. ✅ Technical Details

- [ ] **Technical approach discussed and agreed upon**
- [ ] **Files to modify identified** (or discovery task included)
- [ ] **Dependencies identified** (other stories, APIs, services)
- [ ] **Potential risks documented** (technical complexity, unknowns)
- [ ] **Estimated effort is realistic** (based on team velocity)

### 4. ✅ Context & Documentation

- [ ] **User problem or pain point clearly described**
- [ ] **Business value articulated** (why are we doing this?)
- [ ] **Related stories linked** (dependencies, blockers)
- [ ] **References provided** (screenshots, mockups, docs)
- [ ] **Examples included** (if applicable, show expected behavior)

### 5. ✅ Pre-Sprint Verification (AI-2.1) 🆕

- [ ] **Git history checked** for similar or duplicate work
  ```bash
  git log --oneline --grep="US-XXX"
  git log --oneline --all -- path/to/relevant/file.tsx
  ```
- [ ] **Codebase searched** for existing implementations
  ```bash
  grep -r "feature_name" webapp/
  ```
- [ ] **Story is not already complete** (verify implementation doesn't exist)
- [ ] **If work exists, document findings** in story notes

**Why this matters**: In Sprint 2, we discovered US-025 and US-022 were already
complete, wasting investigation time. Always check git history first!

### 6. ✅ Team Readiness

- [ ] **Team has necessary skills** to complete story
- [ ] **Team has necessary access** (credentials, permissions)
- [ ] **No blockers or dependencies** preventing immediate start
- [ ] **Story can be completed within sprint** (not dependent on external factors)

---

## Story Size Guidelines

| Story Points | Ideal Use Case | Max Complexity | Example |
|--------------|----------------|----------------|---------|
| **1 pt** | Trivial change, <30 min work | Single file, 1-10 lines | Fix typo, update constant |
| **2 pts** | Small feature or fix, 1-3 hours | 1-2 files, <100 lines | Add validation, update UI label |
| **3 pts** | Medium feature, 3-6 hours | 2-3 files, 100-300 lines | New component, API integration |
| **5 pts** | Large feature, 1-2 days | 3-5 files, 300-500 lines | Complex UI, business logic |
| **8 pts** | Very large feature, 2-3 days | 5+ files, 500-1000 lines | Major feature, requires design |
| **13 pts** | Epic-level, 3-5 days | Multiple modules | Should be broken down into smaller stories |

**Sprint 2 Learning**: Stories sized 1-3 pts had 100% completion rate and accurate estimates.
Stories sized 5+ pts had delays and scope creep. **Prefer smaller stories.**

---

## Red Flags: Story NOT Ready

If ANY of the following are true, the story is **NOT READY**:

❌ **"We'll figure it out as we go"** → Technical approach unclear
❌ **"Just make it better"** → Acceptance criteria too vague
❌ **"Should only take a few hours... maybe"** → Estimate is a guess
❌ **"Need to check with [person] first"** → Dependency blocking start
❌ **"I think this was already done?"** → Git history not checked
❌ **"Not sure which files to modify"** → Technical discovery needed
❌ **"What does the user actually want?"** → User need unclear

**Action**: Send story back to backlog for refinement.

---

## Example: Ready vs Not Ready

### ❌ NOT READY

**US-XXX: Improve performance**

*Description*: The app is slow, make it faster.

*Acceptance Criteria*:
- [ ] App is faster

**Problems**:
- ❌ No specific user story format
- ❌ Vague acceptance criteria (how much faster?)
- ❌ No technical approach
- ❌ No measurable success metric
- ❌ No context about which part is slow

---

### ✅ READY

**US-037: Optimize Simulation Results Rendering (Reduce Load Time by 50%)**

**User Story**: As a user, I want simulation results to load faster so that I can review my retirement plan without waiting.

**Acceptance Criteria**:
- [ ] Results page loads in <2 seconds (currently 4+ seconds)
- [ ] Health score chart renders in <500ms (currently 1.5s)
- [ ] Cash flow table renders in <1 second (currently 2s)
- [ ] No console errors or warnings
- [ ] All existing functionality preserved
- [ ] Performance measured with Chrome DevTools
- [ ] Regression tests added to prevent future slowdowns

**Technical Approach**:
- Lazy load chart components (React.lazy)
- Memoize expensive calculations (useMemo)
- Paginate cash flow table (show 10 years at a time)
- Use virtualization for long lists (react-window)

**Files to Modify**:
- `components/simulation/ResultsDashboard.tsx`
- `components/simulation/HealthScoreChart.tsx`
- `components/simulation/CashFlowTable.tsx`

**Git History Check**:
```bash
git log --oneline --grep="performance\|optimization"
# Result: No existing optimization work found
```

**References**:
- Screenshot of slow load time (4.2 seconds)
- Chrome DevTools profiler screenshot showing bottlenecks

**Story Points**: 5 pts (2 days)
**Priority**: P1
**Dependencies**: None

---

## Definition of Ready Review Process

### Step 1: Self-Review (Story Author)
- Author completes DoR checklist
- Marks each item as complete
- Documents any open questions

### Step 2: Peer Review (Team Member)
- Another team member reviews story
- Validates acceptance criteria are clear
- Confirms technical approach is sound
- **Checks git history for duplicate work** (AI-2.1)

### Step 3: Product Owner Review
- PO confirms business value
- PO validates acceptance criteria
- PO prioritizes story

### Step 4: Team Acceptance
- Story presented in backlog refinement
- Team asks clarifying questions
- Team agrees story is ready
- Story moved to "Ready for Sprint Planning"

---

## Sprint Planning Pre-Check (AI-2.3) 🆕

Before committing stories to a sprint, perform this verification:

### Pre-Sprint Verification Checklist

For each story being considered for the sprint:

1. **Git History Check** (AI-2.1)
   ```bash
   git log --oneline --grep="US-XXX" -n 10
   git log --oneline --all -- [relevant_files] -n 10
   ```

2. **Codebase Search**
   ```bash
   grep -r "feature_keyword" webapp/
   find . -name "*feature_name*"
   ```

3. **Backlog Status Verification**
   - Check if story is marked ✅ Done but not removed from sprint
   - Check if completion report exists (US-XXX_COMPLETION_REPORT.md)
   - Check AGILE_BACKLOG.md for completion notes

4. **Team Confirmation**
   - Ask: "Has anyone already worked on this?"
   - Review recent commit messages
   - Check if completion reports were written

5. **Document Findings**
   - If already complete: Mark as ✅ Done, remove from sprint candidates
   - If partially complete: Document what's done, adjust story scope
   - If not started: Proceed with sprint commitment

**Why this matters**: Sprint 2 committed 20 pts, but 13 pts were already complete.
Pre-sprint verification prevents wasted effort and inaccurate velocity metrics.

---

## Common DoR Violations

### 1. **Story Too Large** (>8 pts)
**Problem**: Epic-sized stories (13+ pts) are hard to estimate and complete.

**Solution**: Break into smaller stories (1-3 pts each).

**Example**:
- ❌ US-XXX: Implement complete help system [13 pts]
- ✅ US-XXX-1: Create help center navigation [3 pts]
- ✅ US-XXX-2: Write getting started articles [5 pts]
- ✅ US-XXX-3: Add contextual help tooltips [3 pts]
- ✅ US-XXX-4: Implement help search [5 pts]

### 2. **Vague Acceptance Criteria**
**Problem**: "Make it better" or "Improve UX" are not measurable.

**Solution**: Use specific, measurable criteria.

**Example**:
- ❌ "User experience is improved"
- ✅ "User can complete task in <3 clicks (currently 7 clicks)"
- ✅ "Form validation shows errors inline (not alert box)"
- ✅ "Mobile layout uses responsive grid (no horizontal scroll)"

### 3. **Missing Git History Check** (AI-2.1)
**Problem**: Starting work on already-complete features wastes time.

**Solution**: Always run `git log --grep` before starting.

**Example**: Sprint 2 discovered US-025 was complete after investigation.
Git history check would have shown commit 0a4dc70 immediately.

---

## Tools & Commands

### Git History Check (AI-2.1)
```bash
# Check for story by ID
git log --oneline --grep="US-XXX" -n 20

# Check for story by keywords
git log --oneline --grep="feature_name\|keyword" -n 20

# Check file history
git log --oneline --all -- path/to/file.tsx -n 20

# Check recent commits (last 30 days)
git log --oneline --since="30 days ago" --grep="keyword"

# Show commit details
git show [commit_hash]
```

### Codebase Search
```bash
# Search for feature implementation
grep -r "feature_name" webapp/

# Find files by name
find . -name "*feature*" -type f

# Search for function/component
grep -r "function ComponentName" webapp/
```

### Backlog Status Check
```bash
# Check if completion report exists
ls *COMPLETION_REPORT.md

# Check backlog for story
grep "US-XXX" AGILE_BACKLOG.md
```

---

## Continuous Improvement

This Definition of Ready is a living document. Update it based on:
- Sprint retrospective learnings
- Team feedback
- New tools or processes
- Recurring DoR violations

**Recent Updates**:
- **Jan 29, 2026**: Added AI-2.1 (Git history check) from Sprint 2 retrospective
- **Jan 29, 2026**: Added AI-2.3 (Pre-sprint verification checklist)
- **Jan 29, 2026**: Added story size guidelines based on Sprint 2 learnings

---

## References

- **Definition of Done**: [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)
- **Sprint 2 Retrospective**: [SPRINT_2_RETROSPECTIVE.md](SPRINT_2_RETROSPECTIVE.md)
- **Agile Backlog**: [AGILE_BACKLOG.md](AGILE_BACKLOG.md)
- **User Story Template**: See AGILE_BACKLOG.md

---

**Document Owner**: Development Team
**Review Frequency**: After each sprint retrospective
**Next Review**: Sprint 3 Retrospective (February 26, 2026)
