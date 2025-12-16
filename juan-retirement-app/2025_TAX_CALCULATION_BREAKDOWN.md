# Detailed 2025 Tax Calculation Breakdown

## Juan's Tax Calculation (Age 65)

### Step 1: Income Components (Before Grossup)

| Income Type | Amount | Notes |
|-------------|--------|-------|
| RRIF Withdrawal | $7,400 | Fully taxable as pension income |
| NonReg Interest | $3,735 | Fully taxable as ordinary income |
| Corporate Eligible Dividend | $80,288 | Subject to grossup and credit |
| NonReg Eligible Dividend | $5,810 | Subject to grossup and credit |
| NonReg Non-Eligible Dividend | $1,453 | Subject to grossup and credit |
| Capital Gains | $8,715 | Only 50% taxable = $4,358 |

### Step 2: Calculate Taxable Income (With Dividend Grossup)

**Dividend Grossup Rates (2025):**
- Eligible dividends: 38% grossup
- Non-eligible dividends: 15% grossup

**Calculation:**
```
Pension income:           $7,400
Ordinary income:          $3,735
Taxable capital gains:    $4,358    (50% of $8,715)

Eligible dividends:       $86,098   ($80,288 + $5,810)
  Grossup (38%):         +$32,717   ($86,098 × 0.38)
  Grossed-up amount:     $118,815

Non-eligible dividends:   $1,453
  Grossup (15%):         +$218      ($1,453 × 0.15)
  Grossed-up amount:     $1,671

────────────────────────────────────
TAXABLE INCOME:          $136,079
```

### Step 3: Federal Tax Calculation

**2025 Federal Tax Brackets:**
| Bracket | Rate |
|---------|------|
| $0 - $55,867 | 15% |
| $55,867 - $111,733 | 20.5% |
| $111,733 - $173,205 | 26% |
| $173,205+ | 29% |

**Tax on $136,079:**
```
First $55,867:           $55,867 × 15%    = $8,380
Next $55,866:            $55,866 × 20.5%  = $11,452
Next $24,346:            $24,346 × 26%    = $6,330
                                           ─────────
Gross Federal Tax:                         $26,162
```

### Step 4: Federal Tax Credits

**Basic Personal Amount (2025):** $15,705
- Credit: $15,705 × 15% = **$2,356**

**Age Amount (65+):** $8,790 (indexed)
- Credit: $8,790 × 15% = **$1,319**

**Pension Income Amount:** $2,000
- Credit: $2,000 × 15% = **$300**

**Eligible Dividend Tax Credit:**
- Grossup was: $32,717
- Credit rate: 15.0198% of grossup
- Credit: $32,717 × 0.150198 = **$4,913**

**Non-Eligible Dividend Tax Credit:**
- Grossup was: $218
- Credit rate: 9.0301% of grossup
- Credit: $218 × 0.090301 = **$20**

**Total Federal Credits:** $2,356 + $1,319 + $300 + $4,913 + $20 = **$8,908**

**Net Federal Tax:**
```
Gross Tax:        $26,162
Less Credits:     -$8,908
                  ─────────
Federal Tax:      $17,254
```

Wait, this doesn't match. Let me recalculate using the actual tax engine...

Actually, let me run a detailed trace through the actual tax engine to get the exact calculation:

