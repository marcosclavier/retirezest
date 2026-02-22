# TFSA CRA Compliance Rules

## Key CRA Rules for TFSA

### 1. Annual Contribution Limit (2025-2026)
- **$7,000** per year for 2025 and 2026
- Indexed to inflation in $500 increments

### 2. Contribution Room Calculation
```
New Contribution Room =
    + Annual TFSA dollar limit ($7,000 for 2025/2026)
    + Withdrawals made in previous year
    + Unused contribution room from previous years
```

### 3. Withdrawal Rules
- **Withdrawals are tax-free** at any time
- **Withdrawal amounts are added back to contribution room** in the following calendar year
- No limit on withdrawal amounts

### 4. Re-contribution Rules
- **Cannot re-contribute withdrawn amounts in the same calendar year** (unless you have unused room)
- Withdrawn amounts become available as contribution room on January 1st of the following year
- Over-contributions are subject to 1% per month penalty tax

### 5. Important Timing Rules
- Contributions and withdrawals are tracked by calendar year
- Room accumulates from age 18+ for Canadian residents
- No contribution room earned while non-resident

## Implementation Requirements

### Current Implementation Status ✅
1. **Annual limit**: Set to $7,000 ✅
2. **Room growth**: Annual limit + previous year withdrawals ✅
3. **Contribution constraints**: Limited by available room ✅

### Potential Issues to Address
1. **Same-year re-contribution**: The system should prevent re-contributing withdrawn amounts in the same year unless there's existing unused room
2. **Over-contribution prevention**: Must strictly enforce contribution limits to avoid penalty tax
3. **Smoothing vs compliance**: While smoothing contributions for tax efficiency, must respect annual limits

## Code Locations
- Annual limit: `modules/models.py` line 84 and 230
- Room tracking: `modules/simulation.py` lines 2630-2632
- Contribution logic: `modules/simulation.py` lines 3379-3380