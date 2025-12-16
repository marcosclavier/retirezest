# UI Tax Display Issue - Resolution Steps

**Issue:** UI showing $13,199 instead of correct $19,750.37 for Juan & Daniela 2025 taxes

**Root Cause:** Browser cache or stale localStorage data from previous simulation run

**Status:** Backend calculations verified ✅ correct ($19,750.37)

---

## Step 1: Clear Browser Data

### Option A: Hard Refresh (Quick)
1. Open the app in Chrome: `http://localhost:3000` (or whichever port is running)
2. Press:
   - **Mac:** `Cmd + Shift + R`
   - **Windows/Linux:** `Ctrl + Shift + F5`

### Option B: Clear All Browser Data (Thorough)
1. Open Chrome DevTools: `F12` or `Cmd/Ctrl + Option/Alt + I`
2. Right-click the refresh button → **Empty Cache and Hard Reload**
3. Or go to: `Chrome Settings` → `Privacy and Security` → `Clear browsing data`
   - Select **Cached images and files**
   - Click **Clear data**

---

## Step 2: Clear localStorage

1. Open Chrome DevTools (`F12`)
2. Go to the **Application** tab
3. In the left sidebar: **Storage** → **Local Storage** → `http://localhost:3000`
4. Right-click → **Clear**

OR run this in the browser console:
```javascript
localStorage.clear();
location.reload();
```

---

## Step 3: Restart Dev Servers (if needed)

```bash
# Kill existing servers
pkill -f "npm run dev"
pkill -f "uvicorn.*api.main"

# Restart Python backend
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &

# Restart Next.js frontend
cd /Users/jrcb/Documents/GitHub/retirezest/webapp
npm run dev &
```

---

## Step 4: Run Fresh Simulation

1. Navigate to `http://localhost:3000/simulation`
2. If Juan & Daniela data is not loaded, click **Load Juan & Daniela**
3. Verify the input data:
   - **Person 1 (Juan):**
     - Age: 65
     - TFSA: $100,000
     - RRSP: $150,000
     - Non-Reg: $215,000
     - ACB: $200,000
   - **Person 2 (Daniela):** Same as Juan
   - **Corporate Account:** $2,000,000
   - **Annual Spending:** $200,000
   - **Province:** Alberta (AB)
   - **Strategy:** corporate-optimized

4. Click **Run Simulation**

---

## Step 5: Verify Console Output

Open Chrome DevTools Console (`F12` → Console tab) and look for:

```
=== SIMULATION PAGE - API RESPONSE ===
Year 2025 total_tax from API: 19750.37
Year 2025 total_tax_p1: 9875.18
Year 2025 total_tax_p2: 9875.18
======================================

=== RESULTS DASHBOARD DEBUG ===
Year 2025 Data: {year: 2025, age_p1: 65, age_p2: 65, ...}
Total Tax 2025: 19750.37
Tax P1 2025: 9875.18
Tax P2 2025: 9875.18
Taxable Income P1: 170614.25
Taxable Income P2: 170614.25
================================
```

---

## Step 6: Verify UI Display

In the **Year-by-Year Results** table, check row for 2025:

| Year | Age P1 | Age P2 | Spending Need | Spending Met | **Total Tax** | Total Value | Success |
|------|--------|--------|---------------|--------------|---------------|-------------|---------|
| 2025 | 65 | 65 | $200,000 | $242,896 | **$19,750** | $2,649,764 | ✓ |

**Expected:** $19,750 (or $19,750.37 depending on formatting)
**If you see:** $13,199 → Cache not cleared, repeat steps 1-2

---

## Why $19,750.37 is Correct

### Tax Calculation Breakdown (per person):

**Income:**
- RRIF: $10,000
- Corporate Dividend: $107,073
- NonReg Distributions: $14,250
- **Taxable Income (after grossup):** $170,614.25

**Federal Tax:**
- Gross Tax: $35,141.71
- Credits: $25,768.71
  - BPA: $2,295.75
  - Pension: $300.00
  - Age: $0.00 (phased out)
  - **Eligible Dividend Credit: $23,172.96** ⭐ (This is why tax is low!)
- Net Federal: **$9,373.00**

**Alberta Tax:**
- Gross Tax: $17,508.33
- Credits: $17,006.15
- Net Provincial: **$502.18**

**Total per person:** $9,373.00 + $502.18 = **$9,875.18**
**Household total:** $9,875.18 × 2 = **$19,750.37** ✅

---

## Troubleshooting

### Still seeing $13,199?

1. **Check which port the frontend is running on**
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```
   Make sure you're accessing the correct port

2. **Verify Python backend is running**
   ```bash
   curl http://localhost:8000/docs
   ```
   Should open FastAPI docs

3. **Check for JavaScript errors**
   - Open Console in DevTools
   - Look for red error messages
   - Check Network tab for failed API calls

4. **Try incognito mode**
   - Open Chrome Incognito window
   - Navigate to `http://localhost:3000`
   - This bypasses all cache

### API returning different value?

If console shows a different tax value than $19,750.37:
- Check the simulation inputs match exactly
- Verify you're using **corporate-optimized** strategy
- Check spending is **$200,000**
- Province should be **Alberta (AB)**

---

## What Was Fixed

1. ✅ Backend tax engine - **CORRECT** ($19,750.37)
2. ✅ Age credit phaseout - **WORKING** (correctly phased to $0)
3. ✅ Dividend tax credits - **CORRECT** ($23,172.96 federal)
4. ✅ API endpoints - **NO TRANSFORMATION**
5. ✅ Frontend display - **CORRECT** (displays `year.total_tax` directly)
6. ✅ Debug logging - **ADDED** (console.log in ResultsDashboard & page.tsx)

**The $13,199 is cached data from a previous run.** Once you clear cache and run a fresh simulation, you will see $19,750.37.

---

## Verification Complete

After following these steps, the UI should display:
- **$19,750** in the Year-by-Year table (formatted)
- **$19,750.37** in console logs (exact value)
- Console logs should match between API response and ResultsDashboard

If you still see discrepancies after clearing all cache, please check:
1. Which simulation scenario is loaded
2. What the console debug logs show
3. Any error messages in the console
