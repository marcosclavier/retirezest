# Fix Single/Couple Labels in UI Components

## Summary
Need to update all UI components to properly display labels based on whether it's a single or couple retirement scenario.

## Key Changes Required:

### 1. ✅ Fixed - RetirementReport.tsx
- Changed `isSinglePerson` logic from checking `p2.start_age === 0` to using `!household_input.include_partner`

### 2. ✅ Fixed - FiveYearPlanSection.tsx
- Already has single/couple logic built in with `isSinglePerson` prop
- Uses different column layouts for single vs couple

### 3. ✅ Fixed - YearByYearTable.tsx
- Added props: `isSinglePerson`, `personOneName`, `personTwoName`
- Updated CSV export headers to be dynamic
- Updated CSV data rows to exclude P2 data for single person

### 4. 🔄 Need to Fix - Chart Components:
All these need to accept `isSinglePerson`, `personOneName`, `personTwoName` props:
- TaxChart.tsx - Shows "Person 1" and "Person 2"
- GovernmentBenefitsChart.tsx
- WithdrawalsBySourceChart.tsx
- PortfolioChart.tsx
- IncomeCompositionChart.tsx
- SpendingChart.tsx

### 5. 🔄 Need to Fix - Other Tables/Reports:
- YearByYearSection.tsx (in reports)
- ComprehensiveYearByYearSection.tsx (in reports)

## Pattern to Apply:

1. Add props to component interface:
```typescript
interface ComponentProps {
  // ... existing props
  isSinglePerson?: boolean;
  personOneName?: string;
  personTwoName?: string;
}
```

2. Use conditional rendering:
```typescript
// For chart data keys
const chartData = yearByYear.map((year) =>
  isSinglePerson ? {
    year: year.year,
    [personOneName]: year.value_p1,
    'Total': year.total,
  } : {
    year: year.year,
    [personOneName]: year.value_p1,
    [personTwoName]: year.value_p2,
    'Total': year.total,
  }
);

// For table headers
const headers = isSinglePerson
  ? ['Year', `Age ${p1Name}`, `CPP ${p1Name}`, ...]
  : ['Year', `Age ${p1Name}`, `Age ${p2Name}`, ...];
```

3. Pass props from parent components (simulation page and report page)

## Files to Update:
1. /components/simulation/TaxChart.tsx
2. /components/simulation/GovernmentBenefitsChart.tsx
3. /components/simulation/WithdrawalsBySourceChart.tsx
4. /components/simulation/PortfolioChart.tsx
5. /components/simulation/IncomeCompositionChart.tsx
6. /components/simulation/SpendingChart.tsx
7. /components/reports/sections/YearByYearSection.tsx
8. /components/reports/sections/ComprehensiveYearByYearSection.tsx
9. /app/(dashboard)/simulation/page.tsx (to pass props to charts)