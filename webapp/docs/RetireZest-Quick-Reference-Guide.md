# RetireZest Quick Reference Guide
## Your Canadian Retirement Planning Companion

**Version 1.1** | Last Updated: December 2024 (Updated with 2026 data)

---

## Table of Contents

1. [Welcome to RetireZest](#welcome-to-retirezest)
2. [Getting Started](#getting-started)
3. [Where to Find Your Information](#where-to-find-your-information)
4. [Key Concepts Explained](#key-concepts-explained)
5. [Step-by-Step: Your First Simulation](#step-by-step-your-first-simulation)
6. [Understanding Your Results](#understanding-your-results)
7. [Common Scenarios & Tips](#common-scenarios--tips)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference Tables](#quick-reference-tables)

---

## Welcome to RetireZest

RetireZest helps you plan your retirement by simulating how your savings, investments, and government benefits will support you throughout retirement.

### What RetireZest Does

- **Simulates** your retirement year-by-year from now until age 95
- **Calculates** taxes, government benefits (CPP, OAS, GIS)
- **Tracks** withdrawals from your accounts (RRSP/RRIF, TFSA, Non-Registered)
- **Shows** if your money will last through retirement

### What You'll Need

Before starting, gather information about:
- Your current age and retirement date
- Account balances (RRSP, TFSA, Non-Registered savings)
- Expected government benefits (CPP, OAS)
- Annual spending needs in retirement

---

## Getting Started

### 1. Create Your Profile

Navigate to: **Profile** → **Personal Information**

- Enter your name, date of birth, and province
- Add partner information if married/common-law
- Set your marital status

**Why this matters:** Your age determines when you can access government benefits. Your province affects tax calculations.

### 2. Add Your Assets

Navigate to: **Profile** → **Assets**

For each account you have, add:

**RRSP/RRIF:**
- Current balance
- Owner (you or partner)
- This grows tax-deferred; you pay tax when you withdraw

**TFSA:**
- Current balance
- Available contribution room
- Owner (you or partner)
- Grows tax-free; no tax when you withdraw

**Non-Registered:**
- Current balance
- Original cost (for capital gains calculation)
- Owner (you, partner, or joint)
- You pay tax on growth/dividends each year

**Tip:** If you don't know exact amounts, use estimates. You can refine later.

### 3. Set Up Government Benefits

Navigate to: **Benefits**

**CPP (Canada Pension Plan):**
- Maximum at age 65: ~$17,640/year (2026)
- Check your estimate at: canada.ca/cpp
- Can start as early as 60 or delay to 70

**OAS (Old Age Security):**
- Maximum at age 65-74: ~$8,904/year (2026)
- Maximum at age 75+: ~$9,804/year (2026)
- Available from age 65 onward
- Can delay to age 70 for 36% higher payments

**Tip:** If unsure, use the default amounts. The simulation uses realistic estimates.

---

## Where to Find Your Information

Before running your simulation, you'll want accurate data about your accounts and benefits. Here's where to find everything:

### Finding Your TFSA Contribution Room

**What is TFSA?**
A **Tax-Free Savings Account (TFSA)** is a registered account where your investments grow tax-free. You never pay tax on withdrawals. The government sets an annual contribution limit ($7,000 in 2026), and unused room carries forward.

**CRA My Account (Official Source):**
1. Visit: **canada.ca/my-cra-account**
2. Sign in with your CRA credentials (or create an account)
3. Navigate to **"RRSP and TFSA"** section
4. Look for **"TFSA contribution room"**
5. This shows your total available room as of January 1 this year

**What You'll See:**
- Total TFSA contribution room available
- This includes unused room from previous years
- Does NOT include contributions made this year yet

**In RetireZest:**
- Enter this amount in **Assets → TFSA → Contribution Room**
- The simulation will track room usage year-by-year

**Note:** If you've already maxed out your TFSA, your contribution room will be $0 or very low. The annual TFSA limit for 2026 is $7,000.

### Finding Your CPP Estimate

**What is CPP?**
The **Canada Pension Plan (CPP)** is a government retirement pension that you earn by working and making contributions throughout your career. The amount you receive is based on how much and how long you contributed. Maximum benefit at age 65 is approximately $17,640/year (2026 projection).

**My Service Canada Account (Official Source):**
1. Visit: **canada.ca/my-service-canada-account**
2. Sign in with your GCKey or Sign-In Partner
3. Navigate to **"CPP and OAS"** section
4. Click **"CPP Statement of Contributions"**
5. View your **estimated monthly CPP retirement pension**

**What You'll See:**
- **Estimated monthly payment at age 65** (this is the most accurate)
- Payment estimates if you start at 60 or delay to 70
- Based on your actual work history and contributions

**Converting to Annual:**
- Multiply monthly amount by 12
- Example: $1,200/month × 12 = $14,400/year

**In RetireZest:**
- Enter the **annual amount** in **Person Details → CPP Annual at Start**
- Choose your preferred **CPP Start Age** (60-70)
- Default is age 65

**Note:** If you're not yet working or have limited contributions, your estimate will be lower than the maximum (~$17,640/year in 2026).

### Finding Your OAS Estimate

**What is OAS?**
**Old Age Security (OAS)** is a monthly government benefit available to Canadians aged 65 and older. Unlike CPP, OAS is **not** based on work history - it's based on how many years you've lived in Canada after age 18. You need at least 10 years of Canadian residence to qualify, and 40 years for the full amount (~$8,904/year for ages 65-74 in 2026).

**Service Canada (Official Source):**
1. Visit: **canada.ca/en/services/benefits/publicpensions/cpp/old-age-security**
2. OAS is **not** based on work history - it's based on years lived in Canada
3. Check the **"OAS Payment Amounts"** page for current maximum

**Eligibility Requirements:**
- Must be 65+ years old
- Must be a Canadian citizen or legal resident
- Must have lived in Canada for at least 10 years after age 18

**Full OAS Eligibility:**
- Need 40 years of Canadian residence after age 18
- If less, OAS is prorated (e.g., 30 years = 75% of maximum)

**Current Maximum (2026):**
- Approximately **$8,904/year** for ages 65-74 (~$742/month)
- Approximately **$9,804/year** for ages 75+ (~$817/month)
- **Delaying to age 70:** Up to 36% more than starting at 65

**In RetireZest:**
- Enter the **annual maximum** ($8,904 for ages 65-74) if you have 40+ years residence
- If less than 40 years, calculate: ($8,904 × years_in_canada / 40)
- Choose your preferred **OAS Start Age** (65-70)
- Default is age 65
- **Note:** At age 75+, OAS automatically increases to ~$9,804/year

**Note:** OAS is subject to clawback if your income exceeds ~$86,000/year. The simulation accounts for this automatically.

### Finding Your Account Balances

**What is RRSP?**
A **Registered Retirement Savings Plan (RRSP)** is a tax-deferred retirement account. You contribute pre-tax dollars (get a tax deduction now), and your investments grow tax-free until withdrawal. You pay income tax when you withdraw the money in retirement.

**What is RRIF?**
A **Registered Retirement Income Fund (RRIF)** is what your RRSP becomes when you convert it (required by age 71). With a RRIF, you must withdraw a minimum percentage each year (starting at ~5% at age 71, increasing to 20% at age 95). These withdrawals are taxed as income.

**RRSP/RRIF:**
- Check your financial institution's online banking
- Look for **"RRSP"** or **"RRIF"** account balances
- Add up balances from all institutions if you have multiple
- Can also check CRA My Account for total RRSP room (indirect indicator)

**TFSA:**
- Check your financial institution's online banking
- Look for **"TFSA"** account balances
- Add up balances from all institutions if you have multiple

**What is a Non-Registered Account?**
A **Non-Registered** (or taxable) account is a regular investment account with no special tax treatment. You pay tax annually on interest, dividends, and capital gains earned. There are no contribution limits, making it useful when you've maxed out your RRSP and TFSA.

**Non-Registered Investments:**
- Check your investment account statements
- These are regular taxable investment accounts
- **Balance:** Current market value
- **ACB (Adjusted Cost Base):** What you originally paid (check tax documents or statement)

**Corporate Accounts (Business Owners):**
- Check your business bank/investment accounts
- Funds held inside your corporation

### Quick Checklist

Before running your first simulation, gather:

- ✅ **TFSA Room:** From CRA My Account (annual limit: $7,000 for 2026)
- ✅ **CPP Estimate:** From My Service Canada Account (monthly amount × 12, max ~$17,640/year in 2026)
- ✅ **OAS Eligibility:** Based on years in Canada (max ~$8,904/year for ages 65-74, ~$9,804/year for 75+ in 2026)
- ✅ **RRSP/RRIF Balance:** From your bank/investment accounts
- ✅ **TFSA Balance:** From your bank/investment accounts
- ✅ **Non-Registered Balance:** From investment statements
- ✅ **Current Age:** Your date of birth (calculate from profile)

**Don't have exact numbers?** That's okay! Use estimates for your first simulation, then refine as you gather more accurate data.

---

## Key Concepts Explained

### Account Types

| Account Type | Tax Treatment | Best For |
|-------------|---------------|----------|
| **RRSP/RRIF** | Tax-deferred. You contribute pre-tax dollars. Pay tax when you withdraw. Converts to RRIF at age 71 with mandatory minimums. | Building large retirement savings |
| **TFSA** | Tax-free. No tax on growth or withdrawals. | Emergency fund, flexible savings |
| **Non-Registered** | Taxable. Pay tax on interest, dividends, capital gains annually. | Savings beyond RRSP/TFSA limits |
| **Corporate** | For business owners. Complex tax treatment with dividend tax credits. | Business owners only |

### Retirement Phases

**Go-Go Years (Typically 60-74):**
- Active retirement
- Higher spending (travel, hobbies, activities)
- Default: $120,000/year

**Slow-Go Years (Typically 75-84):**
- Less active
- Moderate spending
- Default: $90,000/year

**No-Go Years (Typically 85+):**
- Limited mobility
- Lower spending (but possible higher care costs)
- Default: $70,000/year

**Tip:** Adjust these to match YOUR lifestyle. These are household totals (you + partner combined).

### Withdrawal Strategies

| Strategy | Best For | Description |
|----------|----------|-------------|
| **Corporate-Optimized** | Business owners | Prioritizes corporate dividends for tax efficiency |
| **RRIF Front-Load** | Most retirees | Withdraws more RRIF before age 65 to avoid tax spikes later |
| **Balanced** | General use | Balanced approach across all accounts |
| **TFSA-First** | Flexibility | Preserves TFSA for last (tax-free emergency fund) |
| **Minimize Income** | Low income | Minimizes taxable income to preserve GIS benefits |

**Recommended for beginners:** Start with **"RRIF Front-Load"** - it smooths your tax curve.

### Inflation

**Spending Inflation:** How much your spending increases each year
- Default: 2.0%
- At 2%, $100k today = $122k in 10 years

**General Inflation:** How much investments/benefits grow
- Default: 2.0%
- CPP and OAS are indexed to inflation

**Tip:** Keep these at 2% unless you have specific reasons to change.

---

## Step-by-Step: Your First Simulation

### Step 1: Navigate to Simulation Page

Click **"Simulation"** in the main menu.

### Step 2: Review Pre-Filled Data

The simulation automatically loads data from your profile:
- Your age and partner's age
- Account balances from Assets page
- Government benefits from Benefits page

**Blue highlighted fields** = data from your profile

### Step 3: Configure Household Settings

**Province:** Should match your profile (already set)

**Start Year:** Current year (already set)

**End Age:** Age to simulate until (default: 95)

**Withdrawal Strategy:** Choose **"RRIF Front-Load"** (recommended for beginners)

### Step 4: Set Spending Targets

Think about your annual household spending in retirement:

**Go-Go Years (Active Retirement):**
- Include: housing, food, utilities, travel, hobbies, entertainment
- Typical range: $60,000 - $150,000/year
- Enter your estimate

**Slow-Go Years (Less Active):**
- Usually 70-80% of Go-Go spending
- Less travel, fewer activities
- Enter your estimate

**No-Go Years (Advanced Age):**
- Usually 60-70% of Go-Go spending
- May include higher care costs
- Enter your estimate

**Example for moderate lifestyle:**
- Go-Go: $85,000
- Slow-Go: $65,000
- No-Go: $55,000

### Step 5: Configure Person Details

Expand **"Person 1 (Me)"** and **"Person 2 (Partner)"** sections.

**For each person, verify:**

**Government Benefits:**
- CPP Start Age (60-70, default 65)
- CPP Annual Amount (~$17,640 at age 65 in 2026)
- OAS Start Age (65-70, default 65)
- OAS Annual Amount (~$8,904 at age 65-74 in 2026)

**Account Balances:**
- Should be pre-filled from your Assets page
- Verify they're correct

**TFSA Contribution Annual:**
- **Set to $0** (don't contribute during retirement unless you have surplus)

**Tip:** Leave yields and percentages at defaults unless you're experienced.

### Step 6: Review Advanced Options

Scroll to **"Advanced Options"**:

**Gap Tolerance:** $5,000-$10,000
- Small shortfalls under this amount are acceptable

**Stop Simulation on Failure:** **Turn ON**
- Simulation stops when accounts are depleted (= $0)

**Reinvest Non-Registered Distributions:** **Turn OFF**
- Dividends/interest should be available for spending

**Tip:** Use the settings above for most realistic results.

### Step 7: Run the Simulation

Click the big blue **"Run Simulation"** button.

Wait 5-10 seconds for results.

---

## Understanding Your Results

### Results Dashboard

After running the simulation, you'll see several sections:

### 1. Summary Cards

**Years Funded:**
- How many years your money lasts
- Goal: Match or exceed your expected lifespan
- Example: "30/30 years" = fully funded

**Total Tax Paid:**
- All taxes over retirement
- Lower is better (but balance with other goals)

**Final Estate:**
- Money left at end of simulation
- After-tax value for beneficiaries

**Health Score:**
- Overall plan rating (0-100)
- 80+: Excellent
- 60-79: Good
- Below 60: Needs improvement

### 2. Net Worth Chart

Shows your total assets over time:
- Should generally decline (you're spending it)
- Steep decline = aggressive spending
- Flat line = not spending enough or too conservative

### 3. Government Benefits Chart

Shows CPP, OAS, GIS over time:
- CPP: Starts at your chosen age
- OAS: Starts at 65 (or delayed to 70)
- GIS: Extra benefit if low income

### 4. Tax Chart

Shows annual taxes:
- Watch for spikes (indicates tax inefficiency)
- Smooth curve = good tax planning
- Spike at age 65-71 = common (RRIF minimums + benefits starting)

### 5. Year-by-Year Retirement Plan Table

**Main Table Columns:**

| Column | What It Means |
|--------|---------------|
| **Year** | Calendar year |
| **Ages** | Your age / Partner's age |
| **Spending Target** | How much you planned to spend (inflated) |
| **Total Inflows** | Gov benefits + withdrawals + distributions |
| **Total Withdrawals** | Money taken from accounts |
| **TFSA Contrib** | Money moved from Non-Reg to TFSA |
| **NonReg Dist** | Dividends/interest from investments |
| **Tax Paid** | Total federal + provincial tax |
| **Net Worth** | Total value of all accounts |
| **Status** | OK = funded, Gap = shortfall |

**Click ▶️ to expand a year for detailed breakdown:**

**Column 1 - Inflows (per person):**
- CPP, OAS payments
- NonReg Distributions (dividends/interest)

**Column 2 - Withdrawals (per person):**
- RRIF, Corporate, TFSA, Non-Reg withdrawals
- Gross Cash Inflows total

**Column 3 - Outflows (per person):**
- TFSA Contributions
- Taxes Paid
- **Net for Spending** = money available after taxes/contributions
- **Spending Target** = your goal
- **Surplus/Shortfall** = difference

**Column 4 - End Balances (per person):**
- RRIF, TFSA, Non-Reg, Corporate balances
- Net Worth total

### Interpreting Status Badges

**Green "OK":**
- Year is fully funded
- Net for Spending ≥ Spending Target

**Red "Gap":**
- Year has a shortfall
- Net for Spending < Spending Target
- Check expanded details to see why

---

## Common Scenarios & Tips

### Scenario 1: "I See Red 'Gap' Badges Starting Around Age 65-70"

**Likely Cause:** Tax spike from multiple income sources starting simultaneously
- RRIF mandatory minimums (start at age 71, or earlier if you choose)
- CPP benefits starting (age 60-70)
- OAS benefits starting (age 65-70)

**Solution:**
1. Switch to **"RRIF Front-Load"** strategy
2. This withdraws more RRIF BEFORE age 65
3. Reduces tax spike when benefits start

### Scenario 2: "Shortfalls Even Though I Have $1M+ in Accounts"

**Likely Cause:** TFSA contributions eating into spending cash

**Check:**
1. Look at expanded year details
2. Check "TFSA Contrib" under Outflows
3. If it's $7,000/person/year ($14,000 total), that's the problem

**Solution:**
1. Set **TFSA Contribution Annual to $0** for both persons
2. You're funding retirement, not saving more

### Scenario 3: "Money Runs Out at Age 80"

**Likely Causes:**
- Spending too high for portfolio size
- Not enough government benefits
- Poor withdrawal strategy

**Solutions:**
1. Reduce spending targets by 10-20%:
   - Go-Go: $120k → $100k
   - Slow-Go: $90k → $75k
   - No-Go: $70k → $60k
2. Delay CPP to age 70 for 42% more benefits
3. Delay OAS to age 70 for 36% more benefits
4. Try different withdrawal strategies

### Scenario 4: "Too Much Money Left at Age 95 ($500k+ Estate)"

**Interpretation:** You're being too conservative - you could spend more

**Solutions:**
1. Increase spending targets by 10-20%
2. Take CPP/OAS earlier (more money when you're younger/healthier)
3. Plan for larger one-time expenses (travel, home renovations)

### Scenario 5: "I'm a Business Owner with Corporate Assets"

**Setup:**
1. Use **"Corporate-Optimized"** strategy
2. Set your corporate balance and dividend type
3. Corporate dividends get special tax treatment (dividend tax credits)
4. Strategy prioritizes corporate withdrawals for tax efficiency

---

## Troubleshooting

### Problem: "Simulation Shows Errors"

**Check:**
- All required fields are filled
- Account balances are positive numbers
- Ages make sense (start age ≤ end age)
- CPP/OAS start ages are 60-70 and 65-70 respectively

### Problem: "Results Don't Match My Expectations"

**Common Issues:**
1. **TFSA contributions** reducing available cash (set to $0)
2. **Reinvest distributions** is ON (turn it OFF)
3. **Stop on Fail** is OFF (turn it ON)
4. **Spending targets** too high for portfolio size

### Problem: "Tax Spike at Age 71"

**This is Normal:**
- RRIF becomes mandatory at age 71
- Minimum withdrawal: 5.28% at age 71, increasing to 20% at age 95
- Combined with CPP/OAS, creates taxable income spike

**Solutions:**
- Use **"RRIF Front-Load"** strategy to smooth this out
- Make large RRSP withdrawals before age 71
- Consider pension income splitting with spouse

### Problem: "Can't Find My Saved Simulation"

**How Saving Works:**
- Simulations are saved in your browser's local storage
- If you clear browser data, simulations are lost
- Use **"Export CSV"** to save detailed results

**Tip:** Run simulations frequently and compare results.

---

## Quick Reference Tables

### CPP Benefits by Start Age

| Start Age | % of Max | Annual Amount* |
|-----------|----------|----------------|
| 60 | 64% | $11,290 |
| 61 | 71% | $12,524 |
| 62 | 78% | $13,759 |
| 63 | 85% | $14,994 |
| 64 | 92% | $16,229 |
| **65** | **100%** | **$17,640** |
| 66 | 108% | $19,051 |
| 67 | 116% | $20,462 |
| 68 | 124% | $21,874 |
| 69 | 132% | $23,285 |
| 70 | 142% | $25,049 |

*Approximate projected amounts for 2026

### OAS Benefits by Start Age

| Start Age | % of Max | Annual Amount (Ages 65-74)* | Annual Amount (Ages 75+)* |
|-----------|----------|----------------------------|---------------------------|
| **65** | **100%** | **$8,904** | **$9,804** |
| 66 | 107% | $9,527 | $10,490 |
| 67 | 114% | $10,150 | $11,176 |
| 68 | 121% | $10,774 | $11,862 |
| 69 | 128% | $11,397 | $12,549 |
| 70 | 136% | $12,109 | $13,333 |

*Approximate amounts for 2026 (OAS increased by 10% for ages 75+)

### RRIF Minimum Withdrawal Rates

| Age | Minimum % | Example ($500k balance) |
|-----|-----------|-------------------------|
| 65 | 4.00% | $20,000 |
| 70 | 4.47% | $22,350 |
| 71 | 5.28% | $26,400 |
| 75 | 5.82% | $29,100 |
| 80 | 6.82% | $34,100 |
| 85 | 8.51% | $42,550 |
| 90 | 11.92% | $59,600 |
| 95 | 20.00% | $100,000 |

### Safe Withdrawal Rates

| Portfolio Size | Conservative (3%) | Moderate (3.5%) | Aggressive (4%) |
|----------------|-------------------|-----------------|-----------------|
| $500,000 | $15,000/year | $17,500/year | $20,000/year |
| $1,000,000 | $30,000/year | $35,000/year | $40,000/year |
| $1,500,000 | $45,000/year | $52,500/year | $60,000/year |
| $2,000,000 | $60,000/year | $70,000/year | $80,000/year |

**Plus government benefits:** Add $35k-53k/year for CPP+OAS at age 65-74 (couple with maximum benefits). Individual: $17,640 CPP + $8,904 OAS = $26,544/year.

---

## Tips for Success

### 1. Start with Conservative Estimates

- Use lower spending targets initially
- Use default government benefit amounts
- Run simulation first, then adjust

### 2. Run Multiple Scenarios

Use the **"What-If Scenarios"** page to compare:
- Taking CPP at 60 vs 65 vs 70
- Different spending levels
- Different withdrawal strategies

### 3. Update Annually

- Run a new simulation each year
- Update account balances
- Adjust for life changes (moving, health, etc.)

### 4. Focus on Key Metrics

**Most Important:**
1. Years Funded (should match expected lifespan)
2. Health Score (aim for 70+)
3. First year with shortfall (if any)

**Less Important:**
1. Final estate value (nice to have, but not the goal)
2. Exact tax amounts (ballpark is fine)

### 5. Don't Panic About Small Shortfalls

- A $2,000 shortfall in one year is not a crisis
- Set Gap Tolerance to $5,000-$10,000
- Real life has flexibility that simulations don't

### 6. Remember: It's a Simulation

- Real returns will vary from assumptions
- Real spending will vary from plan
- Adjust course as needed

---

## Getting Help

### In-App Resources

- **Help Page:** General guidance and FAQs
- **Benefits Pages:** Detailed info on CPP, OAS, GIS
- **Export CSV:** Download detailed results for review

### External Resources

**Government of Canada:**
- CPP: canada.ca/cpp
- OAS: canada.ca/oas
- GIS: canada.ca/gis

**Retirement Planning:**
- Talk to a financial advisor for personalized advice
- Consider a fee-only planner for unbiased guidance

---

## Glossary

**ACB (Adjusted Cost Base):** Original cost of non-registered investments, used to calculate capital gains.

**Capital Gains:** Profit from selling an investment. 50% is taxable in Canada.

**CPP (Canada Pension Plan):** Government retirement pension based on work history. Maximum ~$17,640/year at age 65 (2026).

**Clawback:** Reduction of OAS benefits if income exceeds ~$86,000/year.

**Dividend:** Payment from a company to shareholders. Gets special tax treatment.

**GIS (Guaranteed Income Supplement):** Extra benefit for low-income seniors receiving OAS.

**OAS (Old Age Security):** Government benefit for all Canadians 65+. Maximum ~$8,904/year for ages 65-74, ~$9,804/year for ages 75+ (2026).

**RRIF (Registered Retirement Income Fund):** RRSP converts to RRIF at age 71. Mandatory minimum withdrawals.

**RRSP (Registered Retirement Savings Plan):** Tax-deferred retirement savings. Contribute pre-tax, pay tax on withdrawal.

**TFSA (Tax-Free Savings Account):** Tax-free savings. No tax on growth or withdrawals.

**Taxable Income:** Income that is subject to tax (employment, RRIF withdrawals, CPP, OAS, interest, dividends, capital gains).

**Withdrawal Strategy:** The order in which you withdraw from different account types to minimize taxes.

---

## Version History

**Version 1.1 - December 2024**
- Updated all amounts to 2026 values
- Added "Where to Find Your Information" section with definitions
- Updated TFSA limit: $7,000 (2026)
- Updated CPP maximum: ~$17,640/year at age 65 (2026)
- Updated OAS maximum: ~$8,904/year for ages 65-74, ~$9,804/year for ages 75+ (2026)
- Updated all Quick Reference Tables with 2026 projections

**Version 1.0 - December 2024**
- Initial release
- Comprehensive beginner's guide
- Step-by-step instructions
- Common scenarios and troubleshooting

---

**RetireZest** - Plan Your Retirement with Confidence

*This guide is for educational purposes only and does not constitute financial advice. Consult a qualified financial advisor for personalized retirement planning.*
