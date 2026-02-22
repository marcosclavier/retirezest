# Changes to Promote to Production

## Summary
This document lists all changes made in the development environment that need to be promoted to production.

## Date: February 12, 2026

### 1. Critical Bug Fixes

#### Simulation API Data Format Issues
**Files Modified:**
- `app/api/simulation/run/route.ts`
- `app/api/simulation/quick-start/route.ts`

**Changes:**
- Fixed data format mismatch between frontend and Python API
- Frontend sends data wrapped in `household_input` object, but Python API expects it at root level
- Added transformation logic to extract and restructure data before forwarding to Python API
- Fixed validation errors for partner (p2) data when no partner exists:
  - Set proper default values: `birth_year: 1960`, `start_age: 60`, `cpp_start_age: 65`, `oas_start_age: 65`
  - Previously these were set to 0, causing Python API validation failures
- Added `success` field to response for proper frontend error handling

**Impact:** Fixes "SIMULATION FAILED" errors that prevented users from running retirement simulations

### 2. Early Access Notice Addition

#### UI Components Updated
**Files Modified:**
- `components/landing/HeroSection.tsx`
- `components/landing/LandingNav.tsx`
- `app/(dashboard)/layout.tsx`

**Changes:**
- Added prominent early access notice on home page hero section
- Added "EARLY ACCESS" badge next to logo in navigation (both landing and dashboard)
- Text: "Get exclusive early access to Canada's most comprehensive retirement planning platform."

**Impact:** Positions the application as an exclusive early access platform with a more positive, premium positioning

### 3. Database Schema Updates

**Files Modified:**
- `prisma/schema.prisma` (minor version update)
- `lib/prisma.ts` (minor update for build time handling)

**Deleted Migration Files:**
- Multiple migration files were removed (these appear to have already been applied to production)
- Files deleted were intermediate development migrations

### 4. Package Updates

**Files Modified:**
- `package.json`
- `package-lock.json`

**Changes:** Minor version update (likely dependency updates)

## Deployment Steps

### 1. Code Deployment
```bash
# Commit all changes
git add .
git commit -m "Fix simulation API data format issues and add early access notices"
git push origin main

# Deploy to production (assuming Vercel or similar)
# The deployment will automatically trigger on push to main
```

### 2. Environment Variables
No new environment variables were added. Existing production environment should have:
- `DATABASE_URL` pointing to production PostgreSQL
- `JWT_SECRET` (keep existing)
- `PYTHON_API_URL` pointing to production Python API
- `NEXT_PUBLIC_APP_URL` set to production URL
- `NODE_ENV=production`
- Valid Cloudflare Turnstile keys for production
- Valid Resend API key for email

### 3. Python API
Ensure the Python API is running in production with the latest version that accepts the data format being sent.

### 4. Post-Deployment Testing
1. Test user registration and login
2. Test running a simulation (both quick and custom)
3. Verify early access notices appear correctly
4. Check that simulation results display properly

## Critical Notes

1. **Python API Stability**: The Python API had a "BrokenPipeError" during testing. Ensure the production Python API has adequate resources and error handling.

2. **Data Format Compatibility**: The fix assumes the Python API expects data at root level (not wrapped in `household_input`). Verify this matches production Python API expectations.

3. **Database Migrations**: The deleted migration files suggest database schema is already up to date in production. No new migrations need to be run.

## Rollback Plan

If issues occur after deployment:
1. Revert the git commit
2. Redeploy previous version
3. The changes are isolated to simulation API routes and UI components, making rollback low-risk

## Files Changed Summary

### Modified (8 files):
- webapp/app/(dashboard)/layout.tsx
- webapp/app/api/simulation/quick-start/route.ts
- webapp/app/api/simulation/run/route.ts
- webapp/components/landing/HeroSection.tsx
- webapp/components/landing/LandingNav.tsx
- webapp/lib/prisma.ts
- webapp/package-lock.json
- webapp/package.json
- webapp/prisma/schema.prisma

### Deleted (8 migration files):
- Various migration files from prisma/migrations/

### New Test Files (not for production):
- test-simulation-correct.json
- test-simulation.json
- Various migration scripts in scripts/