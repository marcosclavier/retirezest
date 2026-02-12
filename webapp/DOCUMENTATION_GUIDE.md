# RetireZest Documentation Guide

## What to Document (MUST)

### 1. API Changes
```markdown
## [Date] API: [Endpoint]
Breaking: Yes/No
Change: [What changed]
Migration: [If breaking, how to update]
```

### 2. Database Changes
```markdown
## [Date] DB: [Table/Field]
Change: [Added/Modified/Deleted]
Migration: [Command if needed]
```

### 3. Environment Variables
```markdown
## [Date] ENV: [Variable Name]
Purpose: [Why needed]
Default: [Value or "required"]
```

### 4. Security/Auth Changes
```markdown
## [Date] Security: [Feature]
Impact: [What it affects]
Testing: [How to verify]
```

## What NOT to Document

- ❌ UI/styling changes
- ❌ Bug fixes (unless pattern-revealing)
- ❌ Internal refactoring
- ❌ Code cleanup
- ❌ Package updates (unless breaking)
- ❌ Temporary fixes
- ❌ Development-only changes

## Quick Log Format

Use `CHANGELOG.md` for critical changes only:

```markdown
## 2026-02-12
- **API:** Added calculatedStartYear to /api/simulation/prefill
- **Breaking:** Planning age now read-only in simulation (edit in profile)
- **DB:** No changes

## 2026-02-11
- **Security:** Added CSRF protection to simulation endpoints
- **ENV:** Added PYTHON_API_URL (required, no default)
```

## Code Comments Rules

### DO Comment:
```typescript
// Uses targetRetirementAge from profile as single source (fixes #234)
// HACK: Temporary fix until Python API v2 deployed
// TODO: Remove after 2026-Q3 when all users migrated
// SECURITY: Validates to prevent SQL injection
```

### DON'T Comment:
```typescript
// Sets the age
// Loops through array
// Returns user data
// Checks if valid
```

## Commit Message Format

```
type(scope): brief description

- Bullet points only if breaking/complex
- Breaking: description (if applicable)
```

Examples:
```
fix(simulation): use single retirement age from profile
feat(api): add calculated start year to prefill
breaking(auth): require CSRF token for mutations
```

## Decision Tree

```
Is it a breaking change? → Document
Does it change the API? → Document
Does it change the database? → Document
Does it add/change env vars? → Document
Is it a security change? → Document
Everything else → Don't document
```

## File Structure

```
/webapp
  CHANGELOG.md         (Critical changes only)
  .env.example        (Environment variables)
  README.md           (Setup & deployment only)

  /docs (OPTIONAL - only if truly needed)
    api.md            (Endpoint reference)
    deployment.md     (Production setup)
```

## Templates

### For Issues/PRs:
```markdown
**Type:** Bug/Feature/Breaking
**Impact:** Low/Medium/High
**Needs Doc:** Yes/No
```

### For Breaking Changes:
```markdown
⚠️ BREAKING: [What breaks]
Migration: [Steps to fix]
Deadline: [When old way stops working]
```

## Monthly Cleanup

Every month, delete:
- Completed TODO comments
- Outdated HACK comments
- Documentation for removed features
- Old migration notes (>6 months)

## Remember

> "If the code doesn't explain WHAT it does, refactor the code.
> If the code doesn't explain WHY it does it, add a comment.
> Everything else is probably unnecessary."

---

*Last updated: 2026-02-12*
*Keep this guide under 2 pages. If it grows, you're over-documenting.*