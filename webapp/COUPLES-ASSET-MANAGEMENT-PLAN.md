# Couples Asset Management Plan

## Date: 2025-12-07

## Current Issue Identified

### Critical Bug: Non-Registered Assets Not Loading

**Problem**: User has $830,000 in Non-Registered assets, but simulation shows 0.0%

**Root Cause**: Asset type mismatch between asset form and prefill logic

**Asset Form** (`profile/assets/page.tsx:252`):
```typescript
<option value="nonreg">Non-Registered</option>
```
Assets are saved with type: `"nonreg"` (lowercase, no separators)

**Prefill Route** (`api/simulation/prefill/route.ts:64-68`):
```typescript
case 'NON-REGISTERED':
case 'NONREGISTERED':
case 'NON_REGISTERED':
  acc.nonreg_balance += balance;
  break;
```
Checks for uppercase variants but NOT for `"nonreg"`!

**Impact**:
- $830,000 in Non-Registered assets (23% of portfolio) being ignored
- Incorrect tax calculations (missing capital gains)
- Wrong withdrawal strategy
- Misleading retirement projections

**Fix Required**: Add `"NONREG"` to the prefill route case statement.

---

## User Question: How to Add Couple/Partner Assets?

The user asked: *"how do you suggest if the plan is for a couple to add the assets, income for the other person?"*

### Current System Capabilities

#### 1. Simulation Already Supports Partners ✅

The simulation page (`app/(dashboard)/simulation/page.tsx`) has:
- **"Add Spouse/Partner" button** (line 347-354)
- **Person 2 (p2) input fields** - complete set of asset/income fields
- **Income splitting** - tax optimization for married couples
- **Combined household analysis**

**How it works now**:
1. User clicks "Add Spouse/Partner" button
2. Second form appears with all same fields as Person 1
3. User enters partner's assets, income, CPP, OAS, etc.
4. Simulation runs combined household analysis
5. Results show optimal withdrawal strategy for both

#### 2. Current Asset Management Limitation ❌

The **Assets page** (`profile/assets/page.tsx`) does NOT support couples:
- Single list of assets (all treated as belonging to one person)
- No "owner" field (Person 1 vs Person 2)
- Auto-population assigns ALL assets to Person 1
- Partner's assets must be manually entered in simulation

### Recommended Approach for Couples

## Option 1: Simple Approach (Quick Implementation)

**Keep assets combined, manually separate in simulation**

**How it works**:
1. **Profile/Assets page**: Track all household assets together (current behavior)
2. **Simulation page**: Manually allocate assets to Person 1 vs Person 2
3. **Auto-populate**: Load total assets into Person 1 by default
4. **User action**: Manually move partner's assets to Person 2 fields

**Pros**:
- No database changes required
- Quick to implement
- Works for couples with combined finances
- User has full control over allocation

**Cons**:
- Manual work each simulation
- No memory of who owns what
- Risk of errors in asset allocation
- Not ideal for couples with separate finances

**User Workflow**:
```
1. Add all assets on Assets page (both yours and partner's)
2. Go to Simulation page
3. Click "Add Spouse/Partner"
4. In Person 1 section: Enter YOUR assets (TFSA, RRSP, etc.)
5. In Person 2 section: Enter PARTNER's assets
6. Run simulation
```

**Example**:
- Total household: TFSA $183k, Corporate $2.36M, Non-Reg $830k
- Person 1 (You): TFSA $100k, Corporate $2.36M, Non-Reg $500k
- Person 2 (Partner): TFSA $83k, Non-Reg $330k

---

## Option 2: Advanced Approach (Better Long-Term)

**Track asset ownership in database**

**Database Changes**:
```prisma
model Asset {
  id          String   @id @default(cuid())
  userId      String
  type        String   // tfsa, rrsp, rrif, nonreg, corporate
  owner       String?  // "person1" | "person2" | "joint"
  name        String
  balance     Float
  // ... other fields
}
```

**UI Changes**:

**Assets Page**:
- Add "Owner" dropdown: [Me, Partner, Joint]
- Filter/Group by owner
- Summary cards per person + joint

**Simulation Page**:
- Auto-populate Person 1 with "person1" + 50% of "joint" assets
- Auto-populate Person 2 with "person2" + 50% of "joint" assets
- Allow manual adjustment

**Pros**:
- Accurate tracking of who owns what
- Auto-population works correctly for couples
- Supports joint accounts (50/50 split)
- Historical record of asset ownership
- Better for tax planning

**Cons**:
- Requires database migration
- More complex UI
- Need to handle existing assets (default to "person1")

**User Workflow**:
```
1. Add assets on Assets page
2. For each asset, select owner: Me, Partner, or Joint
3. Go to Simulation page
4. Click "Add Spouse/Partner"
5. Assets auto-populate into correct person
6. Make any adjustments
7. Run simulation
```

---

## Option 3: Separate User Accounts (Most Accurate)

**Each partner has their own login**

**How it works**:
1. Person 1 creates account → adds their assets
2. Person 2 creates account → adds their assets
3. Link accounts as "Partners" in system
4. Simulation page can load both profiles

**Pros**:
- Complete separation of finances
- Each person manages their own data
- Accurate attribution
- Privacy for partners who want it
- Works for common-law, separated finances

**Cons**:
- Most complex implementation
- Requires account linking logic
- Two logins to manage
- Overhead for couples with combined finances

---

## Recommended Implementation Plan

### Phase 1: Fix Critical Bug (Immediate)
**Timeline**: 5 minutes

1. Fix Non-Registered asset type matching in prefill route
2. Test with user's actual data
3. Verify $830k shows up correctly

### Phase 2: Improve Couple Workflow (Short-term)
**Timeline**: 1-2 hours

1. Add documentation/help text on simulation page
2. Add warning if marital status = "Married" but no partner added
3. Improve auto-population for known couples:
   - If married, auto-add partner to simulation
   - Show suggested asset split (50/50 or based on pattern)
   - Let user adjust

### Phase 3: Add Asset Ownership (Medium-term)
**Timeline**: 1-2 days

1. Add `owner` field to Asset model
2. Update Assets page UI with owner dropdown
3. Modify prefill logic to split by owner
4. Add migration for existing assets

### Phase 4: Advanced Features (Long-term)
**Timeline**: 1-2 weeks

1. Separate partner profiles (optional)
2. Joint account handling
3. Asset sharing/transfer between partners
4. Individual vs. joint tax optimization

---

## Immediate Fix Code

### Fix 1: Non-Registered Asset Type Matching

**File**: `/app/api/simulation/prefill/route.ts`

**Change** (lines 64-72):
```typescript
// BEFORE:
case 'NON-REGISTERED':
case 'NONREGISTERED':
case 'NON_REGISTERED':
  acc.nonreg_balance += balance;
  break;

// AFTER:
case 'NONREG':           // ← ADD THIS
case 'NON-REGISTERED':
case 'NONREGISTERED':
case 'NON_REGISTERED':
  acc.nonreg_balance += balance;
  break;
```

### Fix 2: Standardize All Asset Types

Update the switch statement to handle all variants:

```typescript
const normalizedType = type.toUpperCase().replace(/[_-]/g, '');

switch (normalizedType) {
  case 'TFSA':
    acc.tfsa_balance += balance;
    break;
  case 'RRSP':
    acc.rrsp_balance += balance;
    break;
  case 'RRIF':
    acc.rrif_balance += balance;
    break;
  case 'NONREG':
  case 'NONREGISTERED':
    acc.nonreg_balance += balance;
    break;
  case 'CORPORATE':
  case 'CORP':
    acc.corporate_balance += balance;
    break;
  default:
    logger.warn(`Unknown asset type: ${asset.type}`);
}
```

This handles:
- `nonreg`, `NONREG`, `non-reg`, `NON-REG`
- `non_registered`, `NON_REGISTERED`, `non-registered`, `NON-REGISTERED`

---

## User Guidance: How to Model Couples Today

### Scenario 1: Combined Finances (Most Common)

**If you share all assets and plan retirement together:**

1. **Assets Page**: Add all household assets (don't worry about who owns what)
2. **Profile**: Set marital status to "Married"
3. **Simulation**:
   - Click "Add Spouse/Partner"
   - Decide how to split assets:
     - **Option A**: All in Person 1 (simpler, works if income splitting)
     - **Option B**: Split 50/50 between persons
     - **Option C**: Split by actual ownership (if known)
4. **Enter both partners' info**:
   - Ages (for CPP/OAS timing)
   - Expected pension income
   - CPP/OAS start ages

**Example**:
```
Total household assets: $3,558,000
- Person 1 (age 65): TFSA $100k, Corporate $2.36M, Non-Reg $500k
- Person 2 (age 63): TFSA $83k, Non-Reg $330k, RRSP $185k

Simulation will optimize:
- Withdrawal sequence (TFSA first, RRSP later)
- Income splitting (dividends, pension)
- Timing (when to take CPP/OAS)
- Tax efficiency (keep both in lower brackets)
```

### Scenario 2: Separate Finances

**If you keep finances separate:**

1. **Assets Page**: Add YOUR assets only
2. **Profile**: Set marital status appropriately
3. **Simulation**:
   - Click "Add Spouse/Partner"
   - Person 1: Your assets
   - Person 2: Partner's assets (enter manually)
4. **Consider**:
   - Are you filing taxes jointly? (affects optimization)
   - Joint expenses? (affects spending needs)
   - Shared vs. separate retirement goals?

---

## Expected Results After Fix

**User's Actual Portfolio**:
- TFSA: $183,000 (5.1%)
- RRSP/RRIF: $185,000 (5.2%)
- Corporate: $2,360,000 (66.3%)
- Non-Registered: $830,000 (23.3%) ← **Now will show up!**
- **Total**: $3,558,000

**Impact on Simulation**:
1. **Capital Gains Tax**: Non-Reg withdrawals trigger capital gains
   - ACB estimated at $664,000 (80% of $830k)
   - $166,000 in unrealized gains
   - 50% inclusion = $83,000 taxable when withdrawn

2. **Withdrawal Strategy**:
   - TFSA first (tax-free): $183k
   - Non-Reg early (lower tax on cap gains): $830k
   - Corporate mid-retirement (dividends): $2.36M
   - RRSP/RRIF last (fully taxable): $185k

3. **Effective Tax Rate**:
   - Expected: 3-5% (was showing 1.7%, but missing $830k)
   - With Non-Reg: Likely 4-6% (more cap gains tax)

4. **Estate Value**:
   - Will be lower (paying more tax during life)
   - But more efficient (using up non-reg accounts)

---

## Questions for User

Before implementing Option 2 or 3, we should ask:

1. **Do you and your partner have separate or combined finances?**
   - Combined → Option 1 (simple) is fine
   - Separate → Consider Option 2 (ownership tracking)

2. **Do you need to track who owns which asset?**
   - For legal reasons (estate planning, separation)
   - For tax reasons (attribution rules)
   - For clarity (just prefer to know)

3. **How often does ownership change?**
   - Never → Simple split is fine
   - Occasionally → Need ownership tracking
   - Frequently → Need full system

4. **What's the priority?**
   - Quick simulation → Fix bug, use manual entry
   - Accurate long-term tracking → Implement ownership
   - Full financial planning → Separate profiles

---

## Next Steps

1. **Immediate**: Fix Non-Registered asset bug (5 min)
2. **Test**: Run simulation with corrected data
3. **Decide**: Which option for couples (based on user answer)
4. **Implement**: Chosen approach based on priority

---

**Prepared by**: Claude Code
**Date**: 2025-12-07
**Status**: Analysis complete, awaiting user decision on couples approach
**Critical Bug**: Non-Registered assets not loading - FIX READY
