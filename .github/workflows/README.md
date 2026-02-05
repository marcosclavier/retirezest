# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for automated testing and quality assurance.

## Available Workflows

### Regression Tests (`regression-tests.yml`)

**Purpose**: Automatically run regression tests on every pull request and push to main branch to prevent bugs like the US-077 exponential growth issue.

**Triggers**:
- Pull requests to `main` or `develop` branches
- Pushes to `main` branch
- Manual dispatch via GitHub UI

**What it does**:
1. Sets up Python 3.11 environment
2. Installs dependencies from `juan-retirement-app/requirements.txt`
3. Verifies baseline files exist in `juan-retirement-app/baselines/`
4. Runs `test_regression_phase1_v2.py` regression test suite
5. Analyzes test results and reports summary
6. Uploads test results as artifacts (retained for 30 days)
7. Comments on PRs with test results

**Test Coverage**:
- test@example.com (181 historical simulations)
- claire.conservative@test.com (conservative investor)
- alex.aggressive@test.com (aggressive investor)
- mike.moderate@test.com (moderate investor)
- sarah.struggling@test.com (insufficient assets)
- helen.highincome@test.com (high-income tax optimization)

**Success Criteria**:
- All tests must pass or be skipped (baseline not yet established)
- Zero failed tests
- Zero errors

**Failure Handling**:
- Workflow fails if any test fails or encounters an error
- PR is blocked from merging if regression tests fail
- Test results are commented on the PR automatically
- Full test output is uploaded as an artifact

**Path Filters**:
The workflow only runs when these files/directories change:
- `juan-retirement-app/modules/**` (simulation engine code)
- `juan-retirement-app/test_regression_phase1_v2.py` (test script)
- `juan-retirement-app/baselines/**` (baseline data)
- `juan-retirement-app/requirements.txt` (dependencies)

**Manual Trigger**:
You can manually trigger regression tests from the GitHub Actions tab:
1. Go to "Actions" tab in GitHub
2. Select "Regression Tests" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow" button

---

## Test Results

### Viewing Test Results

**In PR comments**:
- Workflow automatically comments on PRs with a summary table
- Shows passed/failed/errors/skipped counts
- Lists any failed tests with details

**In workflow logs**:
- Click on the workflow run in the "Actions" tab
- Expand "Run regression tests" step for full output
- Expand "Check regression test results" for summary

**As artifacts**:
- Test results are uploaded as artifacts and retained for 30 days
- Download from the workflow run page under "Artifacts"
- Includes `phase1_regression_results_v2.json` and test output logs

### Understanding Test Results

**Test Statuses**:
- ✅ **Passed**: Regression test passed (success rate within ±5% of baseline)
- ❌ **Failed**: Regression detected (success rate differs by >5%)
- ⚠️ **Error**: Test encountered an error (code issue or missing data)
- ⏭️ **Skipped**: No historical simulations found (baseline established for future)

**Example Summary**:
```
✅ Passed:  1
❌ Failed:  0
⚠️  Errors:  0
⏭️  Skipped: 5
📊 Total:   6
```

---

## Baseline Management

### Baseline Files Location
`juan-retirement-app/baselines/`

### Current Baseline Files
1. `baseline_test_example_com_1770308061217.json` (7.8 KB) - Has historical InputData
2. `baseline_claire_conservative_test_com_1770308070625.json` (6.1 KB)
3. `baseline_alex_aggressive_test_com_1770308072152.json` (6.1 KB)
4. `baseline_mike_moderate_test_com_1770308073673.json` (7.5 KB)
5. `baseline_sarah_struggling_test_com_1770308075221.json` (5.2 KB)
6. `baseline_helen_highincome_test_com_1770308078028.json` (6.6 KB)

### Updating Baselines

**When to update**:
- After intentional changes to simulation logic that affect results
- When adding new test accounts
- After fixing bugs that restore correct behavior (like US-077)

**How to update**:
1. Run `node scripts/extract_user_baseline.js` to generate new baselines
2. Review the new baseline files to ensure they're correct
3. Commit the updated baseline files
4. Future PRs will compare against the new baselines

**⚠️ Important**: Only update baselines when you're confident the new results are correct. Updating baselines to make failing tests pass defeats the purpose of regression testing!

---

## Troubleshooting

### Workflow Fails to Run

**Symptom**: Workflow doesn't trigger on PR
**Possible causes**:
- Changes don't affect monitored paths (see "Path Filters" above)
- GitHub Actions is disabled for the repository
- Branch protection rules prevent workflow execution

**Solution**:
- Verify changed files match path filters
- Check repository settings > Actions > General
- Review branch protection rules

### Tests Fail with "Baseline file not found"

**Symptom**: Error message about missing baseline files
**Cause**: Baseline files are not committed or in wrong location

**Solution**:
```bash
# Verify baseline files exist
ls juan-retirement-app/baselines/

# If missing, extract baselines
cd juan-retirement-app
node scripts/extract_user_baseline.js

# Commit baseline files
git add baselines/
git commit -m "Add baseline files for regression testing"
```

### Tests Fail with "Module not found"

**Symptom**: ImportError or ModuleNotFoundError
**Cause**: Missing dependencies in requirements.txt

**Solution**:
```bash
# Update requirements.txt
cd juan-retirement-app
pip freeze > requirements.txt

# Commit updated requirements
git add requirements.txt
git commit -m "Update Python dependencies"
```

### Regression Test Fails After Code Change

**Symptom**: Previously passing test now fails
**Cause**: Code change introduced a regression

**Solution**:
1. Review the PR changes and test output
2. Determine if the change was intentional:
   - **Intentional**: Update baseline files (see "Updating Baselines")
   - **Unintentional**: Fix the bug and re-run tests
3. Never update baselines just to make tests pass without understanding why they failed!

---

## Best Practices

### For Developers

1. **Run tests locally before pushing**:
   ```bash
   cd juan-retirement-app
   python3 test_regression_phase1_v2.py
   ```

2. **Review test results in PRs**:
   - Check the automated PR comment for test results
   - Review full test output if any tests fail
   - Investigate any unexpected failures

3. **Don't bypass failing tests**:
   - Fix the issue or update baselines (if intentional)
   - Never merge PRs with failing regression tests

4. **Keep baselines up-to-date**:
   - Update baselines when simulation logic intentionally changes
   - Document why baselines were updated in commit message

### For Reviewers

1. **Verify test results**:
   - Check that all regression tests pass in the PR
   - Review test output for any warnings or anomalies

2. **Question baseline updates**:
   - If PR updates baseline files, verify it's justified
   - Ensure the change is intentional, not masking a bug

3. **Enforce test requirements**:
   - Don't approve PRs with failing regression tests
   - Require explanation for any baseline updates

---

## Historical Context

### US-077: The Exponential Growth Bug

**Date**: February 5, 2026
**Issue**: Percentage values (6 = 6%) were treated as decimals (6 = 600%), causing:
- Non-registered account balances to grow exponentially
- Final estate values reaching $10³¹ (should be ~$2M)
- Success rates dropping from 100% → 35.5%
- Tax calculations producing absurd values ($10³⁰)

**Fix**: Added conditional conversion in 5 locations:
```python
value = raw / 100.0 if raw > 1.0 else raw
```

**Impact**: Success rate restored to 96.8% (within 5% of baseline)

**Lessons Learned**:
- Need automated regression testing in CI/CD (US-079)
- Percentage vs decimal confusion is a recurring risk
- Comprehensive documentation prevents similar bugs

**Related Documentation**:
- ROOT_CAUSE_ANALYSIS_EXPONENTIAL_GROWTH.md
- US-077_BUG_FIX_COMPLETE.md
- DATA_FORMAT_CONVENTIONS.md

### US-078: Test Coverage Expansion

**Date**: February 5, 2026
**Achievement**: Expanded test coverage from 1 → 6 accounts (100% coverage)

**Test Accounts**:
1. test@example.com - Standard profile (✅ has historical data)
2. claire.conservative@test.com - Conservative investor (⏭️ baseline established)
3. alex.aggressive@test.com - Aggressive investor (⏭️ baseline established)
4. mike.moderate@test.com - Moderate investor (⏭️ baseline established)
5. sarah.struggling@test.com - Insufficient assets (⏭️ baseline established)
6. helen.highincome@test.com - High-income tax (⏭️ baseline established)

**Related Documentation**:
- US-078_TEST_COVERAGE_COMPLETE.md

### US-079: CI/CD Regression Testing

**Date**: February 5, 2026 (Sprint 9 Day 1)
**Purpose**: Prevent future bugs like US-077 through automated regression testing in CI/CD pipeline

**What was added**:
- GitHub Actions workflow (`regression-tests.yml`)
- Automatic test execution on every PR and push to main
- PR blocking if regression tests fail
- Automated PR comments with test results
- Test result artifacts (retained 30 days)

**Impact**: Future code changes automatically tested against 6 baseline accounts, preventing regressions before they reach production.

**Related Documentation**:
- US-079_CICD_COMPLETE.md (Sprint 9 Day 1 completion summary)
- SPRINT_9_DAY_1_COMPLETE.md (Sprint 9 summary with all 3 user stories)

---

## Contributing

### Adding New Tests

1. Create new test script in `juan-retirement-app/`
2. Update workflow to run the new test
3. Add test results to summary
4. Document the new test in this README

### Modifying Workflows

1. Edit the workflow file (`.github/workflows/regression-tests.yml`)
2. Test locally using `act` (https://github.com/nektos/act) if possible
3. Create PR and verify workflow runs correctly
4. Update this README with any changes

---

## Related Documentation

### Sprint 9 Documentation
- SPRINT_9_PLAN.md - Sprint 9 plan and tracking
- SPRINT_9_DAY_1_COMPLETE.md - Day 1 completion summary (US-077, US-078, US-079)
- US-079_CICD_COMPLETE.md - US-079 completion details

### Bug Fix Documentation
- ROOT_CAUSE_ANALYSIS_EXPONENTIAL_GROWTH.md - US-077 investigation
- US-077_BUG_FIX_COMPLETE.md - Bug fix implementation
- US-077_DEPLOYMENT_COMPLETE.md - Deployment verification

### Test Coverage Documentation
- US-078_TEST_COVERAGE_COMPLETE.md - Test coverage expansion

### Standards Documentation
- DATA_FORMAT_CONVENTIONS.md - Percentage vs decimal standards
- DEVELOPER_GUIDE.md - Developer reference with critical warnings

---

**Last Updated**: February 5, 2026 (Sprint 9 Day 1)
**Maintainer**: RetireZest Development Team
**Status**: ✅ Active and monitoring
