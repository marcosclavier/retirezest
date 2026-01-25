# Real Estate Assets Implementation Plan

**Date:** 2026-01-24
**Priority:** HIGH - Critical for accurate retirement planning
**Estimated Effort:** 2-3 days

---

## Executive Summary

Real estate assets are currently **missing** from RetireZest, which is a significant gap since:
- 70%+ of Canadian households own their principal residence
- Principal residence is often the largest asset
- Principal Residence Exemption (PRE) is a major tax planning tool
- Rental properties provide retirement income
- Downsizing strategies are common in retirement

---

## Current State

### Assets Currently Supported
✅ TFSA
✅ RRSP/RRIF
✅ Non-Registered Accounts
✅ Corporate Accounts

### Assets Missing
❌ Principal Residence
❌ Rental Properties
❌ Vacation Properties
❌ Commercial Real Estate

---

## Real Estate Tax Rules (CRA)

### 1. Principal Residence Exemption (PRE)
**Rule:** Capital gains on principal residence are **100% tax-free**
**Source:** [CRA Principal Residence](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12700-capital-gains/principal-residence-other-real-estate/principal-residence.html)

**Key Points:**
- Must be designated as principal residence
- Can only have ONE principal residence per family
- Must report sale on T1 (even if tax-free)
- "1 + 1 rule" for years owned

**Example:**
- Purchase: $500,000 (2010)
- Sale: $1,200,000 (2026)
- Capital Gain: $700,000
- Tax: $0 (if designated as principal residence)

### 2. Rental Properties
**Rule:** Capital gains are taxable, rental income is taxable
**Source:** [CRA Rental Income](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12600-rental-income.html)

**Taxable Events:**
- Rental income: Fully taxable as ordinary income
- Capital gains on sale: 50% or 66.67% inclusion (same as stocks)
- Depreciation recapture: Fully taxable

**Example:**
- Purchase: $400,000
- Current value: $600,000
- Rental income: $24,000/year
- Capital gain (unrealized): $200,000
- Future tax on sale: ~$26,000-$40,000 (depending on tax bracket)

### 3. Vacation Properties (Cottage, Cabin)
**Rule:** Capital gains are taxable (no principal residence exemption)
**Exception:** Can designate vacation property as principal residence if you live there primarily

### 4. Downsizing Strategy
**Common Retirement Strategy:**
- Sell large family home (tax-free)
- Buy smaller condo/townhouse
- Use excess cash for retirement income

**Example:**
- Sell house: $1,200,000 (tax-free)
- Buy condo: $500,000
- Retirement fund: $700,000 (tax-free cash)

---

## Database Schema Changes

### New Table: `RealEstateAsset`

```prisma
model RealEstateAsset {
  id                String    @id @default(uuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Property identification
  propertyType      String    // "principal_residence", "rental", "vacation", "commercial"
  address           String?   // Optional for privacy
  city              String?
  province          String?

  // Financial details
  purchasePrice     Float     // Original purchase price
  purchaseDate      DateTime  // When acquired
  currentValue      Float     // Current market value
  mortgageBalance   Float     @default(0) // Outstanding mortgage

  // Rental property specifics
  monthlyRentalIncome Float  @default(0) // Gross rental income
  monthlyExpenses   Float     @default(0) // Property taxes, maintenance, insurance

  // Ownership
  owner             String    @default("person1") // "person1" | "person2" | "joint"
  ownershipPercent  Float     @default(100) // For joint ownership

  // Principal residence designation
  isPrincipalResidence Boolean @default(false)
  principalResidenceYears Float @default(0) // Years designated as principal residence

  // Retirement strategy
  planToSell        Boolean   @default(false)
  plannedSaleYear   Int?      // Year planning to sell
  plannedSalePrice  Float?    // Expected sale price
  downsizeTo        Float?    // If downsizing, what's the target purchase price

  // Metadata
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([propertyType])
}
```

---

## UI Implementation

### 1. New Page: `/app/(dashboard)/profile/real-estate/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Real Estate Assets                         │
│  ─────────────────────────────────────────  │
│                                             │
│  [+ Add Property]                           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🏠 Principal Residence              │   │
│  │ ─────────────────────────────────── │   │
│  │ Current Value: $1,200,000           │   │
│  │ Purchase Price: $500,000 (2010)     │   │
│  │ Unrealized Gain: $700,000 (TAX-FREE)│   │
│  │ Mortgage: $0                        │   │
│  │                                     │   │
│  │ [Edit] [Delete]                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🏢 Rental Property                  │   │
│  │ ─────────────────────────────────── │   │
│  │ Current Value: $600,000             │   │
│  │ Purchase Price: $400,000 (2015)     │   │
│  │ Rental Income: $2,000/mo            │   │
│  │ Unrealized Gain: $200,000 (TAXABLE) │   │
│  │ Estimated Tax on Sale: ~$32,000     │   │
│  │                                     │   │
│  │ [Edit] [Delete]                     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2. Add Property Form (Modal or Separate Page)

**Fields:**
1. **Property Type** (Dropdown)
   - Principal Residence
   - Rental Property
   - Vacation Property
   - Commercial Property

2. **Purchase Details**
   - Purchase Price
   - Purchase Date
   - Current Market Value

3. **Mortgage** (if applicable)
   - Outstanding Balance
   - Interest Rate
   - Monthly Payment

4. **Rental Income** (for rental properties)
   - Monthly Rental Income (gross)
   - Monthly Expenses (property tax, insurance, maintenance)
   - Net Monthly Income (auto-calculated)

5. **Ownership**
   - Owner: Me / Partner / Joint
   - Ownership Percentage (if joint)

6. **Retirement Strategy**
   - Plan to sell in retirement? (Yes/No)
   - If yes, what year?
   - Expected sale price
   - Planning to downsize? (Yes/No)
   - If yes, target purchase price for new property

### 3. Integration with Dashboard

**Update:** `app/(dashboard)/dashboard/page.tsx`

**Add Real Estate Summary Card:**
```typescript
┌─────────────────────────────────────┐
│ 🏠 Real Estate                      │
│ ─────────────────────────────────── │
│ Total Value: $1,800,000             │
│ Mortgages: -$250,000                │
│ Net Equity: $1,550,000              │
│                                     │
│ Principal Residence: $1,200,000     │
│ Rental Properties: $600,000         │
│ [View Details]                      │
└─────────────────────────────────────┘
```

---

## Simulation Integration

### Simulation Input Changes

**Add to `PersonInput` in `lib/types/simulation.ts`:**

```typescript
export interface PersonInput {
  // ... existing fields ...

  // Real Estate
  principal_residence_value: number;
  principal_residence_cost_base: number; // For tracking even though tax-free
  rental_property_value: number;
  rental_property_cost_base: number;
  rental_monthly_income: number; // Net rental income

  // Retirement strategy
  plan_to_downsize: boolean;
  downsize_year: number;
  downsize_sale_price: number;
  downsize_purchase_price: number;
}
```

### Calculation Logic

**1. Principal Residence Strategy**

```typescript
// Year user plans to downsize (e.g., age 70)
if (currentYear === downsizeYear) {
  // Sell principal residence (tax-free)
  const saleProceeds = principal_residence_sale_price;

  // Buy smaller property
  const newPropertyCost = downsize_purchase_price;

  // Add difference to Non-Registered account
  const cashFromDownsize = saleProceeds - newPropertyCost;
  nonreg_balance += cashFromDownsize; // Tax-free cash!

  // No capital gains tax (Principal Residence Exemption)
  // Update principal residence value
  principal_residence_value = newPropertyCost;
}
```

**2. Rental Property Strategy**

```typescript
// Each year: Add rental income
const netRentalIncome = rental_monthly_income * 12;
rental_income_annual = netRentalIncome; // Fully taxable

// If selling rental property in retirement
if (currentYear === rental_sale_year) {
  const salePrice = rental_property_sale_price;
  const capitalGain = salePrice - rental_property_cost_base;

  // Calculate capital gains tax
  const { includedAmount } = calculateCapitalGainsInclusion(capitalGain);
  const capitalGainsTax = includedAmount * marginalTaxRate;

  // Net proceeds after tax
  const netProceeds = salePrice - capitalGainsTax;
  nonreg_balance += netProceeds;

  // Remove rental income going forward
  rental_income_annual = 0;
}
```

**3. Estate Value Calculation**

```typescript
// Include real estate in final estate
final_estate_gross += principal_residence_value; // Tax-free to heirs (usually)
final_estate_gross += rental_property_value;

// Calculate deemed disposition tax on rental property at death
const rentalGain = rental_property_value - rental_property_cost_base;
const rentalTax = calculateCapitalGainsTax(rentalGain, marginalTaxRate);
final_estate_after_tax = final_estate_gross - rentalTax;
```

---

## API Endpoints

### 1. GET `/api/real-estate`
**Purpose:** Fetch all real estate assets for user
**Response:**
```json
{
  "properties": [
    {
      "id": "uuid",
      "propertyType": "principal_residence",
      "currentValue": 1200000,
      "purchasePrice": 500000,
      "purchaseDate": "2010-06-15",
      "mortgageBalance": 0,
      "isPrincipalResidence": true,
      "unrealizedGain": 700000,
      "estimatedTaxOnSale": 0,
      "owner": "joint"
    },
    {
      "id": "uuid",
      "propertyType": "rental",
      "currentValue": 600000,
      "purchasePrice": 400000,
      "monthlyRentalIncome": 2000,
      "monthlyExpenses": 500,
      "netMonthlyIncome": 1500,
      "unrealizedGain": 200000,
      "estimatedTaxOnSale": 32000,
      "owner": "person1"
    }
  ],
  "summary": {
    "totalValue": 1800000,
    "totalMortgages": 0,
    "netEquity": 1800000,
    "monthlyRentalIncome": 1500,
    "unrealizedGains": 900000,
    "taxFreeGains": 700000,
    "taxableGains": 200000
  }
}
```

### 2. POST `/api/real-estate`
**Purpose:** Add new property
**Body:**
```json
{
  "propertyType": "principal_residence",
  "purchasePrice": 500000,
  "purchaseDate": "2010-06-15",
  "currentValue": 1200000,
  "mortgageBalance": 0,
  "isPrincipalResidence": true,
  "owner": "joint"
}
```

### 3. PUT `/api/real-estate/:id`
**Purpose:** Update property details

### 4. DELETE `/api/real-estate/:id`
**Purpose:** Delete property

---

## Python Backend Integration

**Add to simulation input:**

```python
class PersonInput(BaseModel):
    # ... existing fields ...

    # Real Estate
    principal_residence_value: float = 0
    principal_residence_cost_base: float = 0
    rental_property_value: float = 0
    rental_property_cost_base: float = 0
    rental_monthly_income: float = 0

    # Downsizing strategy
    plan_to_downsize: bool = False
    downsize_year: Optional[int] = None
    downsize_sale_price: float = 0
    downsize_purchase_price: float = 0
```

**Add to withdrawal logic:**

```python
# If downsizing year
if year == downsize_year and plan_to_downsize:
    # Tax-free sale of principal residence
    cash_from_downsize = downsize_sale_price - downsize_purchase_price
    nonreg_balance += cash_from_downsize
    principal_residence_value = downsize_purchase_price

    # Record in year results
    year_result.downsize_proceeds = cash_from_downsize
    year_result.principal_residence_value = downsize_purchase_price
```

---

## Implementation Phases

### Phase 1: Database & API (1 day)
- [ ] Add RealEstateAsset model to Prisma schema
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Create `/api/real-estate` endpoints (GET, POST, PUT, DELETE)
- [ ] Add real estate summary to `/api/profile` endpoint

### Phase 2: UI - Property Management (1 day)
- [ ] Create `/profile/real-estate` page
- [ ] Build property list component
- [ ] Build add/edit property form (modal or page)
- [ ] Add real estate card to dashboard
- [ ] Update navigation to include real estate

### Phase 3: Simulation Integration (0.5 day)
- [ ] Add real estate fields to simulation TypeScript types
- [ ] Update `/api/simulation/prefill` to include real estate
- [ ] Add real estate section to simulation input form
- [ ] Display real estate in simulation results (estate planning)

### Phase 4: Python Backend (0.5 day)
- [ ] Update Python backend PersonInput model
- [ ] Add downsizing logic to simulation engine
- [ ] Add rental income to income calculations
- [ ] Include real estate in estate value calculations
- [ ] Add real estate to year-by-year results

---

## User Stories

### Story 1: Principal Residence Owner
**As a** homeowner planning to retire
**I want to** track my principal residence value
**So that** I can see how downsizing affects my retirement income

**Acceptance Criteria:**
- Can add principal residence with purchase price and current value
- Can see unrealized gain (marked as tax-free)
- Can plan downsizing strategy with target year and prices
- Simulation shows cash from downsizing added to retirement funds

### Story 2: Rental Property Owner
**As a** rental property owner
**I want to** track rental income and property value
**So that** I can optimize when to sell and the tax impact

**Acceptance Criteria:**
- Can add rental property with income/expenses
- Can see monthly net income
- Can see estimated capital gains tax on sale
- Simulation includes rental income in retirement projections

### Story 3: Couples with Multiple Properties
**As a** couple with a cottage and primary home
**I want to** track both properties separately
**So that** I can plan which to keep and which to sell

**Acceptance Criteria:**
- Can add multiple properties
- Can designate ownership (person1, person2, joint)
- Can mark only ONE as principal residence
- Can see tax implications of selling each property

---

## Tax Calculation Examples

### Example 1: Principal Residence Sale (Tax-Free)
```
Purchase Price (2010):    $500,000
Sale Price (2026):        $1,200,000
Capital Gain:             $700,000
Tax on Gain:              $0 (Principal Residence Exemption)
Net Proceeds:             $1,200,000
```

### Example 2: Rental Property Sale (Taxable)
```
Purchase Price (2015):    $400,000
Sale Price (2026):        $600,000
Capital Gain:             $200,000
Inclusion (50%):          $100,000
Tax (30% marginal rate):  $30,000
Net Proceeds:             $570,000
```

### Example 3: Downsizing Strategy
```
Current Home Value:       $1,200,000
Condo Purchase:           $500,000
Cash from Downsize:       $700,000 (tax-free!)
Added to TFSA/NonReg:     $700,000
Annual Income (5% yield): $35,000/year
```

---

## CRA References

1. **Principal Residence Exemption:**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12700-capital-gains/principal-residence-other-real-estate.html

2. **Rental Income:**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12600-rental-income.html

3. **Capital Gains on Real Estate:**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12700-capital-gains.html

---

## Success Criteria

✅ Users can add/edit/delete real estate properties
✅ Principal residence correctly marked as tax-free
✅ Rental properties show taxable capital gains
✅ Downsizing strategy integrated into simulation
✅ Rental income added to retirement income projections
✅ Real estate included in estate value calculations
✅ Dashboard shows real estate summary
✅ All calculations verified with CRA rules

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users have >1 principal residence | HIGH | Validate only ONE property can be marked as principal residence |
| Mortgage calculations complex | MEDIUM | Keep it simple - just track balance, don't calculate payments |
| Province-specific rules (BC foreign buyer tax) | LOW | Note as future enhancement, focus on federal CRA rules first |
| Users don't know current property value | MEDIUM | Add tooltip: "Use online tools like Zolo, HouseSigma for estimate" |

---

## Future Enhancements (Post-MVP)

1. **Mortgage Calculator** - Calculate remaining payments and payoff date
2. **Property Appreciation** - Model future appreciation rates
3. **Reverse Mortgage** - CHIP reverse mortgage strategy
4. **Real Estate in RRSP** - Some commercial properties held in self-directed RRSP
5. **HELOC Integration** - Home Equity Line of Credit as income source
6. **Provincial Variations** - BC Empty Home Tax, Toronto Land Transfer Tax

---

**Implementation Priority:** HIGH
**Target Completion:** 3 days
**Dependencies:** None - can start immediately

This is a critical feature for accurate Canadian retirement planning!
