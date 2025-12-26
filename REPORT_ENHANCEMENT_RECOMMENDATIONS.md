# RetireZest Professional Report Enhancement Recommendations

## Executive Summary

Based on the review of the sample professional retirement report, RetireZest needs significant enhancements to match the professional quality and comprehensiveness of the reference document. This document outlines all required changes organized by priority.

---

## Current State Analysis

### What RetireZest Currently Has ✅
- Basic executive summary with age/retirement info
- Simple key findings section
- Current financial position breakdown
- Key retirement milestones
- Basic year-by-year summary table
- Disclaimer section
- PDF generation capability (html2canvas + jsPDF)

### What's Missing ❌
- Plan Health Score & Rating System
- Comprehensive tax analysis (including OAS clawback)
- Estate/death tax calculations
- Visual charts and gauges (12+ visualizations needed)
- Detailed 5-year withdrawal plan
- Government benefits breakdown by type
- Withdrawal strategy explanation
- Account depletion timeline
- Income composition analysis
- Tax efficiency metrics
- Much more comprehensive data presentation

---

## Priority 1: Critical Data & Calculations (Backend/API)

These calculations must be available from the API before frontend improvements can be made.

### 1.1 Plan Health Score System
**Location:** Python API calculation engine

**Required Calculations:**
```python
# Health criteria (0-100 score)
criteria = {
    "full_period_funded": 20 points,      # 100% of years funded
    "adequate_reserve": 20 points,         # 80%+ funded
    "tax_efficiency": 20 points,           # <25% effective rate
    "government_benefits": 20 points,      # CPP/OAS/GIS available
    "growing_net_worth": 20 points         # Not declining
}

# Rating scale
# 80-100: Excellent
# 60-79:  Good
# 40-59:  Fair
# 0-39:   At Risk
```

**New Fields to Add to API Response:**
- `plan_health_score: number` (0-100)
- `plan_health_rating: string` ("Excellent" | "Good" | "Fair" | "At Risk")
- `health_criteria: object` with individual criterion results
- `years_funded: number`
- `years_funded_percentage: number`
- `net_worth_trend: string` ("Growing" | "Declining" | "Stable")

### 1.2 Tax Analysis Enhancements
**Location:** Tax calculation module

**New Calculations Needed:**
- Total cumulative taxes over lifetime
- Average annual tax
- Highest/lowest annual tax years
- Effective tax rate on withdrawals only (vs all income)
- Tax efficiency percentage (tax/total income)
- **OAS Clawback (Recovery Tax)**:
  - Track when net income > $80,000
  - Calculate 15% clawback on excess
  - Total OAS clawback over lifetime
  - Years with clawback

**New Fields:**
- `total_cumulative_tax: number`
- `average_annual_tax: number`
- `highest_annual_tax: number`
- `lowest_annual_tax: number`
- `effective_tax_rate_withdrawals: number` (tax on withdrawals only)
- `tax_efficiency_all_sources: number` (tax on all income)
- `total_oas_clawback: number`
- `oas_clawback_by_year: Array<{year, amount}>`

### 1.3 Estate/Death Tax Calculations
**Location:** New estate planning module

**Required:**
- Gross estate value at death
- Taxes due at death by account type:
  - RRIF: 100% taxable inclusion
  - Non-Reg: ~50% capital gains inclusion
  - TFSA: Tax-free
  - Corporate: Treated as dividend
- Total death tax liability
- After-tax legacy amount
- Effective tax rate at death

**New Fields:**
- `estate: {
    gross_value: number,
    rrif_balance: number,
    tfsa_balance: number,
    nonreg_balance: number,
    corporate_balance: number,
    total_death_tax: number,
    after_tax_legacy: number,
    effective_death_tax_rate: number
  }`

### 1.4 Withdrawal Strategy Details
**Location:** Withdrawal strategy module

**Required:**
- Total withdrawn by account type over lifetime
- Percentage breakdown by source
- Withdrawal order explanation
- Account depletion timeline (year each account hits $0)

**New Fields:**
- `withdrawal_breakdown: {
    rrif_total: number,
    rrif_percentage: number,
    nonreg_total: number,
    nonreg_percentage: number,
    tfsa_total: number,
    tfsa_percentage: number,
    corporate_total: number,
    corporate_percentage: number
  }`
- `account_depletion_timeline: {
    rrif_depleted_age: number | null,
    nonreg_depleted_age: number | null,
    tfsa_depleted_age: number | null,
    corporate_depleted_age: number | null
  }`

### 1.5 Government Benefits Breakdown
**Location:** Government benefits calculation module

**Required:**
- Total CPP over lifetime (both spouses)
- Total OAS over lifetime (both spouses)
- Total GIS over lifetime (both spouses)
- Average annual benefits
- Year-by-year breakdown by benefit type

**New Fields:**
- `government_benefits: {
    total_cpp: number,
    total_oas: number,
    total_gis: number,
    total_all_benefits: number,
    average_annual: number,
    by_year: Array<{
      year: number,
      age_p1: number,
      age_p2: number,
      cpp_p1: number,
      cpp_p2: number,
      oas_p1: number,
      oas_p2: number,
      gis_p1: number,
      gis_p2: number,
      total: number
    }>
  }`

### 1.6 Spending Coverage Analysis
**Location:** Projection calculation module

**Required:**
- Year-by-year spending coverage percentage
- Portfolio withdrawals vs government benefits split
- Total spending available vs target

**New Fields:**
- `spending_analysis: {
    portfolio_withdrawals_total: number,
    government_benefits_total: number,
    total_available: number,
    spending_target: number,
    coverage_percentage: number,
    average_annual_spending: number,
    by_year: Array<{
      year: number,
      coverage_percentage: number
    }>
  }`

---

## Priority 2: Frontend Report Sections (High Impact)

### 2.1 Enhanced Cover Page
**File:** `RetirementReport.tsx`

**Changes:**
- Professional title with larger font
- Display both spouse names (if couple)
- **Add report generation date** (e.g., "Report Generated: November 26, 2025")
- Show projection period (e.g., "22 years")
- Display strategy name (e.g., "Dynamic Lifetime Optimization")
- Province/region
- **Optional company name/branding** (if user provides it)
  - Field in user settings: `company_name` (optional)
  - Display as subtitle if provided (e.g., "Prepared by: ABC Financial Planning")
- **Prominent disclaimer** in red at bottom

**Design Reference:** Page 1 of sample PDF

**New User Settings Required:**
```typescript
interface ReportSettings {
  company_name?: string;  // Optional: "ABC Financial Planning Inc."
  company_logo?: string;  // Optional: URL or base64 image for future
}
```

### 2.2 Retirement Health Metrics Section
**New Component:** `HealthMetricsSection.tsx`

**Content:**
1. **Plan Health Score Card**
   - Large score display (e.g., "80/100")
   - Rating label (e.g., "Excellent") with color coding

2. **Plan Sustainability Table**
   - Years Funded: "22/22 years (100%)"
   - Initial Net Worth: $X,XXX,XXX
   - Final Net Worth: $X,XXX,XXX
   - Net Worth Trend: "Growing" | "Declining" | "Stable"
   - RRIF Status: "Yes" | "No RRIF"

3. **Government Benefits Summary (Lifetime)**
   - Total CPP
   - Total OAS
   - Total GIS
   - Total All Benefits
   - Average Annual Benefits

4. **Withdrawal & Spending Analysis**
   - Portfolio Withdrawals Total
   - Government Benefits Total
   - Total Spending Available
   - Spending Target
   - Coverage % (e.g., "110%")
   - Average Annual Spending

5. **Tax Efficiency & OAS Clawback**
   - Total Taxes (lifetime)
   - OAS Clawback amount
   - Tax Efficiency (All Sources) %
   - Explanatory note about OAS clawback

6. **Health Check Summary**
   - Rating: "Excellent (Score: 80/100)"
   - List of 5 criteria with ✓/✗:
     - ✓ Full period funded (100%)
     - ✓ Adequate funding reserve (80%+ funded)
     - ✓ Good tax efficiency (<25% rate)
     - ✓ Government benefits available
     - ✗ Growing net worth
   - Key metrics summary
   - Rating scale explanation

**Design Reference:** Pages 2-4 of sample PDF

### 2.3 Year-by-Year Detailed Table
**Enhancement:** Expand existing table

**Columns Needed:**
- Year
- P1 Age / P2 Age (if couple)
- Spending Target
- RRIF P1 / RRIF P2 withdrawals
- NonReg P1 / NonReg P2 withdrawals
- TFSA P1 / TFSA P2 withdrawals
- Corp P1 / Corp P2 withdrawals
- Total Taxes
- Net Worth

**Should show ALL years (not just key years)**

**Design Reference:** Pages 8-9 of sample PDF

### 2.4 5-Year Detailed Withdrawal Plan
**New Component:** `FiveYearPlanSection.tsx`

**Content:**
Extremely detailed table showing first 5 years with:
- Year, Age P1, Age P2
- CPP P1, CPP P2
- OAS P1, OAS P2
- GIS P1, GIS P2
- RRIF P1, RRIF P2
- NonReg P1, NonReg P2
- TFSA P1, TFSA P2
- Corp P1, Corp P2
- Total Income P1, Total Income P2
- Tax P1, Tax P2
- Household Total Income
- Household Total Tax
- Household After-Tax Income

**Design Reference:** Page 11 of sample PDF

### 2.5 Tax Analysis Section
**New Component:** `TaxAnalysisSection.tsx`

**Content:**
1. **Tax Metrics Table**
   - Total Cumulative Tax (lifetime)
   - Average Annual Tax
   - Highest Annual Tax
   - Lowest Annual Tax

2. **Key Observations**
   - Tax trends bullet points
   - Notes about RRIF vs NonReg vs TFSA tax impacts

3. **OAS Clawback Explanation**
   - Total clawback amount
   - How clawback works ($80K threshold, 15% rate)
   - Years affected

**Design Reference:** Pages 3, 12 of sample PDF

### 2.6 Taxes at Death Section
**New Component:** `EstateAnalysisSection.tsx`

**Content:**
1. **Estate Tax Summary Table**
   - Gross Estate Value
   - Taxes at Death
   - After-Tax Legacy
   - Effective Tax Rate at Death

2. **Taxable Components at Death Table**
   - RRIF (100% taxable): Balance, Inclusion Rate
   - TFSA (tax-free): Balance, Inclusion Rate (0%)
   - Non-Registered (~50% cap gains): Balance, Inclusion Rate
   - Corporate (as dividend): Balance, Tax Treatment

3. **Key Observations**
   - RRIF strategy notes
   - TFSA legacy planning notes
   - Total death tax summary
   - Inheritance after tax
   - Planning tips

**Design Reference:** Page 13 of sample PDF

### 2.7 Withdrawal Source Analysis
**New Component:** `WithdrawalAnalysisSection.tsx`

**Content:**
1. **Withdrawal Breakdown Table**
   - Account Source | Total Withdrawn | % of Total
   - RRIF
   - Non-Registered
   - TFSA
   - Corporate

2. **Withdrawal Strategy Used**
   - Strategy name
   - Description of the strategy
   - Note about non-registered distributions

**Design Reference:** Page 10 of sample PDF

---

## Priority 3: Visual Charts & Graphs (High Impact)

All charts should use a consistent color scheme:
- Blues (#2563eb, #3b82f6)
- Purples (#7c3aed, #8b5cf6)
- Greens (#10b981, #34d399)
- Oranges (#f97316, #fb923c)
- Reds (#ef4444, #f87171)

### 3.1 Retirement Health Gauges
**Component:** `HealthGaugesChart.tsx`
**Library:** Recharts with custom circular gauges

**Charts:**
1. **Deterministic Success Rate Gauge**
   - Circular gauge showing 100%
   - Green fill for high success
   - Label: "Percentage of retirement years where your plan remains funded"

2. **Plan Capacity Gauge**
   - Circular gauge showing "100% (22/22 years)"
   - Green fill
   - Label: "Ratio of available funds to annual spending needs"

**Design Reference:** Page 16 of sample PDF

### 3.2 Spending Coverage Chart
**Component:** `SpendingCoverageChart.tsx`
**Type:** Line chart

**Data:**
- X-axis: Years (2025-2046)
- Y-axis: Annual Income / Spending Target (%)
- Line showing coverage over time
- Dashed line at 100% (fully funded threshold)
- Label "Surplus" when above 100%
- Label "Underfunded" when below 100%

**Design Reference:** Page 17 of sample PDF

### 3.3 Account Balance Depletion Timeline
**Component:** `AccountDepletionChart.tsx`
**Type:** Multi-line chart

**Data:**
- X-axis: Years
- Y-axis: Account Balance ($)
- Separate lines for:
  - RRIF (blue)
  - TFSA (green)
  - Non-Registered (orange)
  - RRSP (red)
  - Corporate (pink)
- Shows when each account depletes to $0

**Design Reference:** Page 18 of sample PDF

### 3.4 Government Benefits Over Time
**Component:** `GovBenefitsChart.tsx`
**Type:** Stacked area chart

**Data:**
- X-axis: Years
- Y-axis: Annual Benefits ($)
- Stacked areas for:
  - CPP (blue)
  - OAS (green)
  - GIS (orange)
- Shows total benefits increasing over time

**Design Reference:** Page 19 of sample PDF

### 3.5 Plan Funding Percentage
**Component:** `PlanFundingChart.tsx`
**Type:** Area chart

**Data:**
- X-axis: Years
- Y-axis: % of Plan Period Still Funded
- Shows progression from 0% to 100% funded
- Dashed line at 100% (fully funded)
- Dotted line at 80% (good threshold)
- Shaded area under curve

**Design Reference:** Page 20 of sample PDF

### 3.6 Marginal Tax Rate Progression
**Component:** `TaxRateChart.tsx`
**Type:** Line chart

**Data:**
- X-axis: Years
- Y-axis: Effective Tax Rate (%)
- Line showing tax rate over time
- Horizontal zones:
  - Low (<25%): Green
  - Moderate (25-50%): Yellow
  - High (>50%): Red

**Design Reference:** Page 21 of sample PDF

### 3.7 Income Composition (Taxable vs Tax-Free)
**Component:** `IncomeCompositionChart.tsx`
**Type:** Stacked area chart

**Data:**
- X-axis: Years
- Y-axis: Annual Income ($)
- Stacked areas:
  - TFSA (Tax-Free) - green
  - Benefits (Partially Taxable) - blue
  - Non-Reg (Partially Taxable) - orange
  - RRIF (Fully Taxable) - red

**Design Reference:** Page 22 of sample PDF

### 3.8 Household Inflows by Source
**Component:** `HouseholdInflowsChart.tsx`
**Type:** Stacked bar chart

**Data:**
- X-axis: Years
- Y-axis: Inflows ($)
- Stacked bars showing:
  - Non-Reg withdrawals (blue)
  - RRIF withdrawals (red)
  - TFSA withdrawals (green)
  - Corp withdrawals (orange)
  - CPP (purple)
  - OAS (teal)
  - GIS (pink)
  - NR Distributions (brown)
- Dashed line: Spending Target (after tax)

**Design Reference:** Page 23 of sample PDF

---

## Priority 4: Supporting Sections & Polish

### 4.1 Key Observations & Trends
**Component:** `KeyObservationsSection.tsx`

**Content:**
- Performance Analysis
  - Net worth trend summary (start to end, % change)
  - Tax trend summary (early avg vs late avg)

- Key Findings (bullet list)
  - Plan sustainability notes
  - Regular review recommendation
  - Life expectancy impact notes
  - Tax optimization opportunities
  - Government benefits impact

**Design Reference:** Page 14 of sample PDF

### 4.2 Assets & Allocation Section
**Component:** `AssetsAllocationSection.tsx`

**Content:**
1. **Assets by Account Type Table**
   - Rows: RRSP, RRIF, Non-Registered, TFSA, Corporate
   - Columns: Juan | Daniela | Total
   - Show $0 for accounts that don't exist

2. **Asset Allocation % Table**
   - Account Type | Percentage
   - Visual percentage bars

**Design Reference:** Page 6 of sample PDF

### 4.3 Household Summary
**Component:** `HouseholdSummarySection.tsx`

**Content:**
1. **Person 1 Profile**
   - Current Age
   - Retirement Age
   - CPP Start Age
   - OAS Start Age

2. **Person 2 Profile** (if couple)
   - Same fields

3. **Household Settings**
   - Withdrawal Strategy
   - Province
   - Total Household Spending
   - Income Splitting (RRIF) %
   - Reinvest NonReg Distributions (Yes/No)

**Design Reference:** Page 5 of sample PDF

### 4.4 Retirement Plan Overview
**Component:** `PlanOverviewSection.tsx`

**Content:**
1. **Annual Spending by Phase**
   - Go-Go Years (65-79): $XXX,XXX
   - Slow-Go Years (80-89): $XXX,XXX
   - No-Go Years (90+): $XX,XXX

2. **Key Assumptions**
   - General Inflation Rate: X.X%
   - Spending Inflation Rate: X.X%
   - CPP Indexing Rate: X.X%
   - OAS Indexing Rate: X.X%
   - Projection Period: XX years
   - Tax Year Basis: 2025 tax rates

**Design Reference:** Page 7 of sample PDF

### 4.5 Enhanced Disclaimer Section
**Component:** Update existing disclaimer

**Content:**
- Important Disclaimer heading
- Key Limitations (bullet list)
  - Projections based on assumptions
  - Tax rates may change
  - Market returns unpredictable
  - Circumstances change
  - Unforeseen expenses not included

- Recommended Actions (numbered list)
  1. Review assumptions annually
  2. Consult qualified financial advisor
  3. Consult tax professional
  4. Review benefit programs
  5. Keep documentation

- Data Accuracy statement
- For More Information links
  - CRA website
  - Service Canada website
  - Consult professional

**Footer on Each Page:**
- Bottom of each PDF page should include:
  - **Report generation date** (e.g., "Generated: November 26, 2025")
  - **Company name** if provided (e.g., "Prepared by ABC Financial Planning")
  - **Page numbers** (e.g., "Page 3 of 24")
  - **Disclaimer text** (smaller font): "This is an educational tool for projection purposes only. Not financial advice."

**Example Footer:**
```
Generated: December 21, 2025 | Prepared by ABC Financial Planning | Page 3 of 24
This is an educational tool for projection purposes only. It is not financial advice.
```

**Design Reference:** Page 24 of sample PDF

---

## Priority 5: PDF Generation Improvements

### 5.1 Better PDF Library
**Recommendation:** Consider switching from html2canvas to a proper PDF library

**Options:**
1. **Keep html2canvas + jsPDF** (current)
   - Pros: Works with existing React components
   - Cons: Large file sizes, quality issues, slow rendering

2. **Use @react-pdf/renderer**
   - Pros: Native PDF generation, smaller files, better quality
   - Cons: Requires rewriting components in PDF-specific syntax

3. **Server-side PDF generation (Puppeteer/Playwright)**
   - Pros: Best quality, most control
   - Cons: Requires backend infrastructure

**Recommendation for RetireZest:** Start with improving html2canvas approach, consider @react-pdf/renderer for future

### 5.2 PDF Styling Improvements
**File:** `RetirementReport.tsx`

**Changes:**
- Add print-specific CSS classes
- Ensure page breaks work correctly
- Add page numbers
- Add header/footer to each page
- Ensure colors print correctly
- Optimize table layouts for PDF

**CSS Classes Needed:**
```css
@media print {
  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  .print-header {
    /* Fixed header for each page */
  }

  .print-footer {
    /* Page numbers, disclaimer */
  }
}
```

### 5.3 PDF Generation Settings
**File:** `generatePDF.ts`

**Improvements:**
- Increase scale to 3 for better quality
- Add page numbering
- Add metadata (title, author, subject)
- Compress images
- Optimize for file size

---

## Implementation Roadmap

### Phase 0: User Settings Enhancement (1-2 days)
1. Add optional `report_settings` to user profile:
   - `company_name` (string, optional)
   - `company_logo` (string/URL, optional - future enhancement)
2. Add UI in settings page for users to enter company name
3. Pass settings to report generation

### Phase 1: Backend Calculations (1-2 weeks)
1. Implement Plan Health Score system
2. Add comprehensive tax calculations (OAS clawback)
3. Add estate/death tax calculations
4. Enhance withdrawal analysis
5. Add government benefits breakdown
6. Update API response schema

### Phase 2: Core Report Sections (2-3 weeks)
1. Enhanced cover page
2. Retirement Health Metrics section
3. Enhanced year-by-year table
4. 5-year detailed plan
5. Tax analysis section
6. Estate analysis section
7. Withdrawal analysis section

### Phase 3: Visual Charts (2-3 weeks)
1. Health gauges (2 charts)
2. Spending coverage chart
3. Account depletion timeline
4. Government benefits chart
5. Plan funding chart
6. Tax rate progression chart
7. Income composition chart
8. Household inflows chart

### Phase 4: Supporting Sections (1 week)
1. Key observations & trends
2. Assets & allocation
3. Household summary
4. Plan overview
5. Enhanced disclaimer

### Phase 5: PDF Polish & Testing (1 week)
1. PDF generation improvements
2. Print styling
3. Page breaks
4. Quality assurance
5. Testing with various scenarios

**Total Estimated Time: 7-10 weeks**

---

## Technical Dependencies

### NPM Packages to Add
```json
{
  "recharts": "^2.10.0",           // For charts
  "react-gauge-chart": "^0.4.1",   // For gauge charts (alternative: build custom)
  "date-fns": "^3.0.0",            // Date formatting
  "@react-pdf/renderer": "^3.4.0"  // Optional: For better PDF generation
}
```

### Component Structure
```
webapp/components/reports/
├── RetirementReport.tsx (main)
├── sections/
│   ├── CoverPage.tsx
│   ├── HealthMetricsSection.tsx
│   ├── HouseholdSummarySection.tsx
│   ├── AssetsAllocationSection.tsx
│   ├── PlanOverviewSection.tsx
│   ├── YearByYearSection.tsx
│   ├── FiveYearPlanSection.tsx
│   ├── WithdrawalAnalysisSection.tsx
│   ├── TaxAnalysisSection.tsx
│   ├── EstateAnalysisSection.tsx
│   ├── KeyObservationsSection.tsx
│   └── DisclaimerSection.tsx
├── charts/
│   ├── HealthGaugesChart.tsx
│   ├── SpendingCoverageChart.tsx
│   ├── AccountDepletionChart.tsx
│   ├── GovBenefitsChart.tsx
│   ├── PlanFundingChart.tsx
│   ├── TaxRateChart.tsx
│   ├── IncomeCompositionChart.tsx
│   └── HouseholdInflowsChart.tsx
└── shared/
    ├── ReportTable.tsx
    ├── SectionHeader.tsx
    └── MetricCard.tsx
```

---

## Design Guidelines

### Color Palette
- **Primary Blue:** #2563eb (headers, titles)
- **Secondary Purple:** #7c3aed (accents)
- **Success Green:** #10b981 (positive metrics)
- **Warning Orange:** #f97316 (alerts, attention)
- **Error Red:** #ef4444 (risks, problems)
- **Neutral Gray:** #64748b (body text)

### Typography
- **Headings:** Bold, Inter/Helvetica
- **Body:** Regular, Inter/Helvetica
- **Numbers:** Tabular figures for alignment

### Table Styling
- Alternating row colors (white/light gray)
- Header background: Light blue (#eff6ff)
- Borders: Light gray (#e5e7eb)
- Padding: Adequate spacing for readability

### Chart Styling
- Consistent color scheme across all charts
- Clear axis labels
- Gridlines: Light gray, subtle
- Tooltips: Show detailed info on hover
- Legends: Clear and positioned appropriately

---

## Testing Checklist

### Data Scenarios to Test
- [ ] Single person vs couple
- [ ] Young retirees (50s) vs older (70s)
- [ ] Various asset levels ($100K to $5M+)
- [ ] Different withdrawal strategies
- [ ] Plans that run out of money vs surplus
- [ ] High tax situations (OAS clawback triggers)
- [ ] Different provinces (tax rates)
- [ ] Plans with/without corporate accounts

### Quality Checks
- [ ] All numbers format correctly (commas, decimals)
- [ ] Percentages display properly
- [ ] Charts render without errors
- [ ] PDF generates successfully
- [ ] PDF is readable and properly formatted
- [ ] Page breaks work correctly
- [ ] Print version matches screen version
- [ ] Mobile responsiveness (view on screen)
- [ ] Accessibility (screen readers)

---

## Future Enhancements (Post-Launch)

1. **Interactive Reports**
   - Click on charts to drill down
   - Hover tooltips with detailed explanations
   - Toggle between different scenarios

2. **Comparison Reports**
   - Compare multiple strategies side-by-side
   - Before/after optimization comparison

3. **Downloadable Charts**
   - Export individual charts as PNG
   - Export data as CSV/Excel

4. **Report Customization**
   - Let users choose which sections to include
   - Customize branding (for advisors)

5. **AI-Generated Insights**
   - LLM-powered observations and recommendations
   - Plain-language explanations of complex metrics

---

## Contact for Questions

If you need clarification on any of these recommendations, please review:
- The sample PDF: `/Users/jrcb/OpenAI Retirement/retirement_report_Juan_Daniela_2025-11-26.pdf`
- Current report component: `webapp/components/reports/RetirementReport.tsx`
- Current PDF generator: `webapp/lib/reports/generatePDF.ts`

---

**Document Version:** 1.0
**Date:** December 21, 2025
**Prepared for:** RetireZest Development Team
