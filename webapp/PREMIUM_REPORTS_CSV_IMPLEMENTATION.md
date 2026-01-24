# Premium-Only Reports & CSV Export Implementation - COMPLETE

## Date: January 17, 2026

## Summary

Reporting and CSV download features have been successfully gated behind **Premium subscriptions**. Free users will see upgrade prompts when attempting to use these premium features, while premium users have unrestricted access to all export functionality.

---

## Features Gated

### 1. CSV Export (Year-by-Year Simulation Data)
**File**: `/webapp/components/simulation/YearByYearTable.tsx`
**Feature**: Export detailed year-by-year simulation results to CSV

### 2. PDF Report Generation
**File**: `/webapp/components/simulation/ResultsDashboard.tsx`
**Feature**: Generate comprehensive retirement planning PDF report

### 3. Data Export API (Complete User Data)
**File**: `/webapp/app/api/account/export/route.ts`
**Feature**: Export all user data (financial profile, scenarios, projections) as JSON

---

## Implementation Details

### 1. CSV Export Feature Gating

#### Component Props Added
```typescript
interface YearByYearTableProps {
  yearByYear: YearResult[];
  initialRowsToShow?: number;
  reinvestNonregDist?: boolean;
  isPremium?: boolean;           // NEW: Subscription status
  onUpgradeClick?: () => void;   // NEW: Callback for upgrade prompt
}
```

#### Export Function Modification
**Lines 84-91**: Added premium check before CSV generation
```typescript
const exportToCSV = () => {
  // Check if user is premium
  if (!isPremium) {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
    return;
  }

  // ... existing CSV export logic ...
};
```

#### Button UI Update
**Lines 194-203**: Updated export button with premium indicator
```typescript
<Button
  variant={isPremium ? "outline" : "default"}
  size="sm"
  onClick={exportToCSV}
  className={!isPremium ? "bg-blue-600 hover:bg-blue-700" : ""}
>
  {!isPremium && <Lock className="h-4 w-4 mr-2" />}
  {isPremium && <Download className="h-4 w-4 mr-2" />}
  Export CSV {!isPremium && "(Premium)"}
</Button>
```

**Free User Experience**:
- Button shows "Export CSV (Premium)" with lock icon
- Clicking triggers upgrade modal (via `onUpgradeClick` callback)
- Blue background to indicate premium feature

**Premium User Experience**:
- Button shows "Export CSV" with download icon
- Clicking exports CSV immediately
- Standard outline style

---

### 2. PDF Report Feature Gating

#### Component Props Added
```typescript
interface ResultsDashboardProps {
  result: SimulationResponse;
  isPremium?: boolean;           // NEW: Subscription status
  onUpgradeClick?: () => void;   // NEW: Callback for upgrade prompt
}
```

#### PDF Generation Function Modification
**Lines 87-104**: Added premium check before PDF generation
```typescript
const handleExportPDF = async () => {
  // Check if user is premium
  if (!isPremium) {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
    return;
  }

  setIsGeneratingPDF(true);
  try {
    await generatePDF('retirement-report', 'RetireZest-Retirement-Report.pdf');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  } finally {
    setIsGeneratingPDF(false);
  }
};
```

#### PDF Report Card UI Update
**Lines 178-216**: Updated PDF export card with premium messaging
```typescript
<Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
    <div className="flex-1">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        Professional Retirement Report
        {!isPremium && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">Premium</span>}
      </h3>
      <p className="text-xs sm:text-sm text-gray-700 mt-1">
        Download a comprehensive PDF report with detailed analysis, tax breakdown, estate planning, and
        year-by-year projections.
        {!isPremium && <span className="block mt-1 text-blue-600 font-medium">Upgrade to Premium to unlock PDF reports</span>}
      </p>
    </div>
    <Button
      onClick={handleExportPDF}
      disabled={isGeneratingPDF}
      size="lg"
      className="w-full sm:w-auto sm:ml-4 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
    >
      {isGeneratingPDF ? (
        // ... loading state ...
      ) : (
        <>
          {!isPremium && <Lock className="h-5 w-5 mr-2" />}
          {isPremium && <FileDown className="h-5 w-5 mr-2" />}
          <span className="hidden sm:inline">{isPremium ? 'Download PDF Report' : 'Upgrade for PDF'}</span>
          <span className="sm:hidden">{isPremium ? 'Download PDF' : 'Upgrade'}</span>
        </>
      )}
    </Button>
  </CardContent>
</Card>
```

**Free User Experience**:
- Card shows "Premium" badge next to title
- Message states "Upgrade to Premium to unlock PDF reports"
- Button shows "Upgrade for PDF" with lock icon
- Clicking triggers upgrade modal

**Premium User Experience**:
- No "Premium" badge shown
- Standard messaging about PDF content
- Button shows "Download PDF Report" with download icon
- Clicking generates PDF immediately

---

### 3. Data Export API Feature Gating

#### Import Added
**Line 5**: Added subscription helper import
```typescript
import { getUserSubscription } from '@/lib/subscription';
```

#### Subscription Check Added
**Lines 33-51**: Added premium verification before data export
```typescript
// 2. Check subscription status - data export is premium-only
const subscription = await getUserSubscription(session.email);
if (!subscription) {
  return NextResponse.json(
    { success: false, error: 'User not found' },
    { status: 404 }
  );
}

if (!subscription.isPremium) {
  return NextResponse.json(
    {
      success: false,
      error: 'Data export is a Premium feature. Upgrade to Premium to export your complete data.',
      upgradeRequired: true,
    },
    { status: 403 }
  );
}
```

#### Error Response Format (403 Forbidden)
```json
{
  "success": false,
  "error": "Data export is a Premium feature. Upgrade to Premium to export your complete data.",
  "upgradeRequired": true
}
```

**Free User Experience**:
- API returns 403 Forbidden status
- Error message explains premium requirement
- `upgradeRequired: true` flag signals frontend to show upgrade modal

**Premium User Experience**:
- API returns 200 OK with complete data export
- JSON file downloads with all financial data
- Full audit log created for GDPR compliance

---

## User Experience Flow

### Free User Journey

1. **Simulation Results Page**
   - Sees year-by-year table with "Export CSV (Premium)" button (lock icon)
   - Sees PDF export card with "Premium" badge and "Upgrade for PDF" button

2. **Clicks CSV Export**
   - Button click triggers `onUpgradeClick()` callback
   - Upgrade modal opens (to be implemented)
   - Modal shows pricing and feature comparison
   - "Upgrade Now" CTA redirects to subscription page

3. **Clicks PDF Export**
   - Button click triggers `onUpgradeClick()` callback
   - Same upgrade modal flow

4. **Account Settings - Data Export**
   - Clicks "Export Data" button
   - API returns 403 error with `upgradeRequired: true`
   - Frontend shows upgrade prompt

### Premium User Journey

1. **Simulation Results Page**
   - Sees "Export CSV" button (download icon)
   - Sees "Download PDF Report" button

2. **Clicks CSV Export**
   - CSV file downloads immediately
   - Contains all year-by-year simulation data (38 columns)

3. **Clicks PDF Export**
   - Professional PDF report generates
   - Multi-page report with charts, tables, analysis
   - Downloads as "RetireZest-Retirement-Report.pdf"

4. **Account Settings - Data Export**
   - Clicks "Export Data" button
   - JSON file downloads immediately
   - Contains complete financial profile and scenarios

---

## API Response Differences

### CSV Export (Client-Side)
**Free Users**: Button click shows upgrade modal
**Premium Users**: Immediate CSV download

### PDF Report (Client-Side)
**Free Users**: Button click shows upgrade modal
**Premium Users**: Immediate PDF generation and download

### Data Export API (Server-Side)

#### Free User Response (403)
```json
{
  "success": false,
  "error": "Data export is a Premium feature. Upgrade to Premium to export your complete data.",
  "upgradeRequired": true
}
```

#### Premium User Response (200)
```json
{
  "exportDate": "2026-01-17T10:30:00.000Z",
  "exportType": "complete_user_data",
  "user": {
    "personal": { "id": "...", "email": "...", "firstName": "..." },
    "partner": { ... },
    "retirement": { ... },
    "account": { ... },
    "settings": { ... }
  },
  "financialData": {
    "incomeSources": [...],
    "assets": [...],
    "expenses": [...],
    "debts": [...]
  },
  "scenarios": [...],
  "usage": { ... }
}
```

---

## Files Modified

### 1. `/webapp/components/simulation/YearByYearTable.tsx`
**Purpose**: Year-by-year simulation table with CSV export
**Changes**:
- Added `isPremium` and `onUpgradeClick` props
- Added premium check in `exportToCSV()` function
- Updated export button with premium indicator
- Added `Lock` icon import

**Lines Changed**: ~25 lines
**Breaking Changes**: None (backwards compatible with default values)

### 2. `/webapp/components/simulation/ResultsDashboard.tsx`
**Purpose**: Main simulation results dashboard with PDF export
**Changes**:
- Added `isPremium` and `onUpgradeClick` props
- Added premium check in `handleExportPDF()` function
- Updated PDF export card with premium messaging
- Added `Lock` icon import

**Lines Changed**: ~40 lines
**Breaking Changes**: None (backwards compatible with default values)

### 3. `/webapp/app/api/account/export/route.ts`
**Purpose**: API endpoint for exporting complete user data
**Changes**:
- Added `getUserSubscription` import
- Added subscription verification
- Added 403 error response for free users
- Updated comment numbering

**Lines Changed**: ~30 lines
**Breaking Changes**: Free users can no longer access this endpoint (intended behavior change)

---

## Testing Checklist

### Manual Testing

#### CSV Export
- [ ] Free user sees "Export CSV (Premium)" button with lock icon
- [ ] Free user clicking CSV button triggers upgrade callback
- [ ] Premium user sees "Export CSV" button with download icon
- [ ] Premium user can export CSV successfully
- [ ] CSV contains all 38 columns of year-by-year data

#### PDF Report
- [ ] Free user sees "Premium" badge on PDF card
- [ ] Free user sees "Upgrade for PDF" button with lock icon
- [ ] Free user clicking PDF button triggers upgrade callback
- [ ] Premium user sees no "Premium" badge
- [ ] Premium user sees "Download PDF Report" button
- [ ] Premium user can generate PDF successfully
- [ ] PDF contains all sections (summary, health, tax, estate, year-by-year)

#### Data Export API
- [ ] Free user receives 403 error with `upgradeRequired: true`
- [ ] Premium user receives 200 with complete data export
- [ ] Audit log created for premium user exports
- [ ] JSON file contains all user data

### API Testing with curl

**Test as Free User (Data Export)**:
```bash
curl -X GET http://localhost:3000/api/account/export \
  -H "Cookie: token=YOUR_FREE_USER_TOKEN"
```

**Expected Response**: 403 Forbidden
```json
{
  "success": false,
  "error": "Data export is a Premium feature. Upgrade to Premium to export your complete data.",
  "upgradeRequired": true
}
```

**Test as Premium User (Data Export)**:
```bash
curl -X GET http://localhost:3000/api/account/export \
  -H "Cookie: token=YOUR_PREMIUM_USER_TOKEN"
```

**Expected Response**: 200 OK with JSON file download

---

## Integration Requirements

### Frontend Pages/Components Needing Updates

1. **Simulation Results Page**
   - Pass `isPremium` prop to `ResultsDashboard` component
   - Pass `onUpgradeClick` callback to both `ResultsDashboard` and `YearByYearTable`
   - Implement `UpgradeModal` component (to be created)

2. **Account Settings Page**
   - Handle 403 error from `/api/account/export` endpoint
   - Show upgrade modal when `upgradeRequired: true` received

3. **Subscription Status Helper**
   - Fetch subscription status on page load
   - Pass `isPremium` boolean to child components

### Example Integration Code

```typescript
// Simulation results page
'use client';

import { useState, useEffect } from 'react';
import { ResultsDashboard } from '@/components/simulation/ResultsDashboard';
import { YearByYearTable } from '@/components/simulation/YearByYearTable';
import { UpgradeModal } from '@/components/modals/UpgradeModal'; // To be created

export default function SimulationPage({ result }) {
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    // Fetch subscription status
    fetch('/api/user/subscription')
      .then(res => res.json())
      .then(data => setIsPremium(data.isPremium))
      .catch(err => console.error('Failed to fetch subscription status:', err));
  }, []);

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  return (
    <>
      <ResultsDashboard
        result={result}
        isPremium={isPremium}
        onUpgradeClick={handleUpgradeClick}
      />

      <YearByYearTable
        yearByYear={result.year_by_year}
        isPremium={isPremium}
        onUpgradeClick={handleUpgradeClick}
      />

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          feature="reporting"
        />
      )}
    </>
  );
}
```

---

## Next Steps

### Immediate (Frontend Integration)
1. **Create subscription status endpoint** (`/api/user/subscription`)
   - Returns `{ isPremium: boolean, tier: string, status: string }`

2. **Create UpgradeModal component** (`/components/modals/UpgradeModal.tsx`)
   - Modal dialog with pricing ($9.99/month)
   - Feature comparison list
   - "Upgrade Now" CTA
   - Track which feature triggered modal (analytics)

3. **Update simulation pages**
   - Pass `isPremium` and `onUpgradeClick` to components
   - Implement upgrade modal state management

4. **Update account settings page**
   - Handle 403 error from data export API
   - Show upgrade prompt for free users

### Future Enhancements
1. **Analytics Tracking**
   - Track which premium features are clicked by free users
   - Track conversion rate from upgrade prompts
   - A/B test different upgrade messaging

2. **User Communication**
   - Email campaign highlighting premium reporting features
   - In-app notifications about PDF reports
   - Success stories from premium users

3. **Feature Expansion**
   - Additional premium reports (tax planning, estate planning)
   - Scheduled report generation
   - Report sharing with advisors

---

## Security Considerations

### Implemented
- ✅ Client-side premium checks (UX optimization)
- ✅ Server-side premium verification (data export API)
- ✅ No client-side bypass possible for API endpoint
- ✅ Audit logging for premium data exports

### Additional Recommendations
- Monitor for abuse patterns (rapid clicking of upgrade buttons)
- Add rate limiting to upgrade modal displays (prevent spam)
- Log upgrade conversion sources for analytics
- Consider showing preview of PDF/CSV for free users (first page/10 rows)

---

## Success Metrics

### MVP Launch Success Criteria
- [ ] Free users see premium indicators on all export features
- [ ] Free users can trigger upgrade modal from all export buttons
- [ ] Premium users can export CSV, PDF, and JSON data
- [ ] No breaking changes to existing functionality
- [ ] Zero critical bugs in production

### Long-Term Success Metrics
- **Feature Engagement**: % of users attempting to use export features
- **Conversion Rate**: % of free users who upgrade after clicking export
- **Premium Retention**: % of premium users who use export features monthly
- **Revenue Impact**: $ revenue from users who upgraded for reports

---

## Completed Frontend Integration

### Simulation Page Integration
**File**: `/webapp/app/(dashboard)/simulation/page.tsx`

#### Changes Made:

1. **Imports Added**:
```typescript
import { UpgradeModal } from '@/components/modals/UpgradeModal';
```

2. **State Variables Added**:
```typescript
const [isPremium, setIsPremium] = useState(false);
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeFeature, setUpgradeFeature] = useState<'csv' | 'pdf' | 'export' | 'early-retirement' | 'general'>('general');
```

3. **Subscription Status Fetching**:
```typescript
// Fetch subscription status on mount
useEffect(() => {
  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.isPremium || false);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      setIsPremium(false);
    }
  };

  fetchSubscription();
}, []);
```

4. **Upgrade Click Handler**:
```typescript
const handleUpgradeClick = (feature: 'csv' | 'pdf' | 'export' | 'early-retirement' | 'general' = 'general') => {
  setUpgradeFeature(feature);
  setShowUpgradeModal(true);
};
```

5. **ResultsDashboard Component Updates** (3 instances):
```typescript
<ResultsDashboard
  result={result}
  isPremium={isPremium}
  onUpgradeClick={() => handleUpgradeClick('pdf')}
/>
```

6. **YearByYearTable Component Update**:
```typescript
<YearByYearTable
  yearByYear={result.year_by_year}
  reinvestNonregDist={result.household_input?.reinvest_nonreg_dist ?? true}
  isPremium={isPremium}
  onUpgradeClick={() => handleUpgradeClick('csv')}
/>
```

7. **UpgradeModal Rendering**:
```typescript
{/* Upgrade Modal */}
<UpgradeModal
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  feature={upgradeFeature}
/>
```

### Subscription Status API Endpoint
**File**: `/webapp/app/api/user/subscription/route.ts` (NEW)

**Purpose**: Returns current user's subscription status

**Response Format**:
```json
{
  "isPremium": boolean,
  "tier": "free" | "premium",
  "status": "active" | "trial" | "cancelled" | "expired" | null
}
```

**Authentication**: Requires valid session
**Error Handling**: Returns free tier on error (fail-safe)

---

## Status

**CSV Export Gating**: ✅ COMPLETE
**PDF Report Gating**: ✅ COMPLETE
**Data Export API Gating**: ✅ COMPLETE
**UpgradeModal Component**: ✅ COMPLETE
**Subscription Status API**: ✅ COMPLETE
**Frontend Integration**: ✅ COMPLETE (Simulation Page)
**Testing**: ⏳ Pending (manual testing needed)
**Deployment**: ⏳ Pending (after testing)

---

## Contact

**Implementation**: Claude Code
**Date Completed**: January 17, 2026
**Status**: Ready for frontend integration with UpgradeModal component
