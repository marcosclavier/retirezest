# Feedback Module Documentation

## Overview

The feedback module allows users to provide structured and open-ended feedback throughout their experience with RetireZest. This helps the product team understand user satisfaction, identify pain points, and prioritize feature development.

**Implementation Date:** January 19, 2026
**Status:** ✅ Complete and Production-Ready

---

## Architecture

### Database Schema

The feedback system uses a single table `user_feedback` (Prisma model: `UserFeedback`) that captures:

**Core Feedback Data:**
- `feedbackType`: Type of feedback (post_simulation, dashboard, improvement_suggestion, feature_request, general)
- `triggerContext`: What triggered the feedback (e.g., "after_first_simulation", "dashboard_panel")
- Multiple satisfaction metrics (satisfactionScore, npsScore, helpfulnessScore)
- Structured responses (didSimulationHelp, missingFeatures, improvementAreas)
- Open-ended responses (whatWouldMakeUseful, whatIsConfusing, improvementSuggestion, additionalComments)

**User Context (Auto-captured):**
- User demographics (age, province, includesPartner)
- Subscription tier (free/premium)
- Usage metrics (simulationCount, daysSinceSignup)
- Technical context (pageUrl, referrerUrl, userAgent)

**Response Tracking:**
- Priority scoring (1-5, auto-calculated)
- Status management (new, reviewed, actioned, closed)
- Response tracking (responded, respondedAt, respondedBy, responseNotes)

---

## Components

### 1. PostSimulationFeedbackModal

**Location:** `/components/feedback/PostSimulationFeedbackModal.tsx`

**Purpose:** Collect feedback immediately after a user completes their first simulation

**Features:**
- Simple 3-option helpfulness rating (Yes, Somewhat, No)
- Optional open-ended feedback field
- "Skip" option to dismiss (saved to localStorage)
- Auto-closes after submission
- Shown 2 seconds after simulation results appear

**Integration:**
```tsx
import { PostSimulationFeedbackModal } from '@/components/feedback/PostSimulationFeedbackModal';

<PostSimulationFeedbackModal
  isOpen={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
  onSubmit={() => {
    // Handle post-submission logic
    localStorage.setItem('post_simulation_feedback_submitted', 'true');
  }}
/>
```

**User Experience:**
1. User runs simulation
2. Results appear
3. After 2-second delay, feedback modal appears
4. User selects helpfulness rating (required)
5. User optionally provides suggestions
6. Clicks "Send Feedback" or "Skip"
7. Modal closes automatically

**localStorage Keys:**
- `post_simulation_feedback_skipped`: Set to "true" when user clicks Skip
- `post_simulation_feedback_submitted`: Set to "true" when user submits feedback

---

### 2. DashboardFeedbackPanel

**Location:** `/components/feedback/DashboardFeedbackPanel.tsx`

**Purpose:** Collect comprehensive feedback from the dashboard

**Features:**
- Satisfaction rating (1-5 scale with emojis)
- Feature request checklist (8 predefined features)
- Open-ended improvement suggestions
- Success confirmation with auto-reset

**Integration:**
```tsx
import { DashboardFeedbackPanel } from '@/components/feedback/DashboardFeedbackPanel';

// In dashboard page:
<DashboardFeedbackPanel />
```

**Feature Options (Customizable):**
- Advanced tax optimization strategies
- Estate planning tools
- Healthcare cost planning
- Investment recommendations
- Side-by-side scenario comparisons
- Monte Carlo analysis
- Multiple inflation scenarios
- Pension income splitting strategies

---

## API Endpoint

### POST /api/feedback/submit

**Location:** `/app/api/feedback/submit/route.ts`

**Authentication:** Optional (supports anonymous feedback)

**Request Body:**
```typescript
interface FeedbackSubmission {
  // Required
  feedbackType: 'post_simulation' | 'dashboard' | 'improvement_suggestion' | 'feature_request' | 'general';

  // Optional
  triggerContext?: string;
  satisfactionScore?: number; // 1-5
  npsScore?: number; // 0-10
  helpfulnessScore?: number; // 1-5
  didSimulationHelp?: 'yes' | 'somewhat' | 'no';
  missingFeatures?: string[]; // Array of feature IDs
  improvementAreas?: string[];
  whatWouldMakeUseful?: string;
  whatIsConfusing?: string;
  improvementSuggestion?: string;
  additionalComments?: string;
  pageUrl?: string;
  referrerUrl?: string;
  userAgent?: string;
  sessionId?: string;
}
```

**Response:**
```typescript
// Success
{
  success: true,
  feedbackId: string,
  message: "Thank you for your feedback!"
}

// Error
{
  success: false,
  error: string,
  message: string
}
```

**Priority Calculation:**

The system automatically calculates priority (1-5 scale) based on:
- Low satisfaction scores (+1 priority)
- Low NPS scores/detractors (+1 priority)
- Premium users (+1 priority)
- Feature requests (+0.5 priority)
- Post-simulation feedback (+0.5 priority)

**High-Priority Notifications:**

Feedback with priority ≥4 triggers an email notification to the contact team with:
- Priority badge
- Full feedback details
- User context and metrics
- Technical information

---

## Email Notifications

**Trigger:** Priority ≥4 feedback submissions

**Recipient:** Configured via `CONTACT_EMAIL` environment variable

**Content Includes:**
- Priority level and type
- Satisfaction metrics
- Missing features
- Open-ended responses
- User demographics and subscription tier
- Usage statistics
- Technical context

**Email Template:** HTML-formatted with color-coded priority badges

---

## Database Migration

**Migration File:** `prisma/migrations/20260119172030_add_user_feedback_table/migration.sql`

**Schema:**
```prisma
model UserFeedback {
  id                    String    @id @default(uuid())
  userId                String?   // Nullable for anonymous feedback
  user                  User?     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Feedback data
  feedbackType          String
  triggerContext        String?
  satisfactionScore     Int?
  npsScore              Int?
  helpfulnessScore      Int?
  didSimulationHelp     String?
  missingFeatures       String?   // JSON array
  improvementAreas      String?   // JSON array
  whatWouldMakeUseful   String?
  whatIsConfusing       String?
  improvementSuggestion String?
  additionalComments    String?

  // Context
  pageUrl               String?
  referrerUrl           String?
  userAgent             String?
  sessionId             String?

  // User segment
  userAge               Int?
  userProvince          String?
  includesPartner       Boolean?
  subscriptionTier      String?
  simulationCount       Int?
  daysSinceSignup       Int?

  // Response tracking
  responded             Boolean   @default(false)
  respondedAt           DateTime?
  respondedBy           String?
  responseNotes         String?

  // Management
  priority              Int       @default(3)
  status                String    @default("new")
  tags                  String?   // JSON array

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@index([feedbackType])
  @@index([status])
  @@index([priority])
  @@index([createdAt])
  @@index([satisfactionScore])
  @@index([npsScore])
  @@map("user_feedback")
}
```

**To Apply Migration:**
```bash
npx prisma db push
# or
npx prisma migrate deploy
```

---

## Integration Points

### 1. Simulation Page
**File:** `/app/(dashboard)/simulation/page.tsx`

**Integration:**
```typescript
// State management
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [hasShownFeedback, setHasShownFeedback] = useState(false);

// Check localStorage on mount
useEffect(() => {
  const hasSkipped = localStorage.getItem('post_simulation_feedback_skipped') === 'true';
  const hasSubmitted = localStorage.getItem('post_simulation_feedback_submitted') === 'true';
  if (hasSkipped || hasSubmitted) {
    setHasShownFeedback(true);
  }
}, []);

// Show modal after successful simulation
if (response.success && !hasShownFeedback) {
  setTimeout(() => {
    setShowFeedbackModal(true);
  }, 2000);
}
```

### 2. Dashboard Page
**File:** `/app/(dashboard)/dashboard/page.tsx`

**Integration:**
```tsx
import { DashboardFeedbackPanel } from '@/components/feedback/DashboardFeedbackPanel';

// Render at bottom of dashboard
<div className="mb-8">
  <DashboardFeedbackPanel />
</div>
```

---

## Testing

### Manual Testing Checklist

**Post-Simulation Feedback:**
- [ ] Modal appears 2 seconds after first simulation completes
- [ ] Selecting helpfulness rating enables Submit button
- [ ] Optional text field works correctly
- [ ] Skip button dismisses modal permanently
- [ ] Submit button sends feedback and closes modal
- [ ] Modal doesn't appear on subsequent simulations
- [ ] Success animation displays before closing

**Dashboard Feedback:**
- [ ] Satisfaction rating buttons work (1-5)
- [ ] Feature checkboxes can be selected/deselected
- [ ] Improvement text area accepts input
- [ ] Submit requires satisfaction rating
- [ ] Success state displays correctly
- [ ] Form resets after 3 seconds
- [ ] Can submit multiple times

**API Testing:**
- [ ] Authenticated users have userId captured
- [ ] Anonymous submissions work (userId is null)
- [ ] Priority is calculated correctly
- [ ] High-priority feedback triggers email
- [ ] User context is captured (age, province, tier)
- [ ] Usage metrics are recorded
- [ ] Technical context is captured

### API Test Script

```typescript
// Test authenticated feedback
const response = await fetch('/api/feedback/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    feedbackType: 'post_simulation',
    triggerContext: 'after_first_simulation',
    didSimulationHelp: 'yes',
    whatWouldMakeUseful: 'More detailed tax breakdown',
    helpfulnessScore: 5,
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
  }),
});

const data = await response.json();
console.log('Feedback submitted:', data);
```

---

## Analytics & Reporting

### Key Metrics to Track

**Satisfaction Metrics:**
- Average satisfaction score by user segment
- NPS score distribution (Promoters, Passives, Detractors)
- Helpfulness rating trends

**Feature Requests:**
- Most requested features
- Feature request volume over time
- Correlation between requests and user demographics

**Engagement:**
- Feedback submission rate
- Modal skip rate vs submission rate
- Time to first feedback submission

**User Segments:**
- Satisfaction by age group
- Satisfaction by province
- Free vs Premium user feedback differences
- Couples vs individuals

### Sample Queries

**Top 10 Most Requested Features:**
```sql
SELECT
  jsonb_array_elements_text(missing_features::jsonb) as feature,
  COUNT(*) as request_count
FROM user_feedback
WHERE missing_features IS NOT NULL
GROUP BY feature
ORDER BY request_count DESC
LIMIT 10;
```

**Average Satisfaction by Subscription Tier:**
```sql
SELECT
  subscription_tier,
  AVG(satisfaction_score) as avg_satisfaction,
  COUNT(*) as feedback_count
FROM user_feedback
WHERE satisfaction_score IS NOT NULL
GROUP BY subscription_tier;
```

**High-Priority Feedback Requiring Attention:**
```sql
SELECT
  id,
  feedback_type,
  priority,
  satisfaction_score,
  nps_score,
  created_at,
  what_would_make_useful,
  improvement_suggestion
FROM user_feedback
WHERE priority >= 4
  AND status = 'new'
ORDER BY priority DESC, created_at DESC;
```

**NPS Score Calculation:**
```sql
WITH nps_segments AS (
  SELECT
    CASE
      WHEN nps_score >= 9 THEN 'promoter'
      WHEN nps_score >= 7 THEN 'passive'
      ELSE 'detractor'
    END as segment
  FROM user_feedback
  WHERE nps_score IS NOT NULL
)
SELECT
  segment,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM nps_segments
GROUP BY segment;
```

---

## Maintenance

### Admin Dashboard (Future Enhancement)

**Recommended Features:**
- View all feedback with filtering by status, priority, type
- Mark feedback as reviewed/actioned/closed
- Add internal notes and tags
- Assign feedback to team members
- Email response to users (if authenticated)
- Export feedback to CSV
- Analytics dashboard with charts

### Regular Tasks

**Weekly:**
- Review high-priority feedback (priority ≥4)
- Respond to user feedback (if contact info available)
- Update status of actioned items

**Monthly:**
- Analyze satisfaction trends
- Generate NPS report
- Review most requested features
- Update feature roadmap based on feedback

**Quarterly:**
- Comprehensive feedback analysis
- User segment comparison
- Product improvements retrospective

---

## Environment Variables

Required variables in `.env.local` or production environment:

```bash
# Database
DATABASE_URL="postgresql://..."

# Email (for high-priority notifications)
RESEND_API_KEY="re_..."
EMAIL_FROM="contact@retirezest.com"
CONTACT_EMAIL="contact@retirezest.com"
```

---

## Security & Privacy

**Data Protection:**
- All feedback is associated with authenticated users when possible
- Anonymous feedback is supported (userId is nullable)
- Personal data is encrypted at rest (database-level)
- CSRF protection enabled on all POST requests

**GDPR Compliance:**
- Feedback data is deleted when user deletes account (CASCADE)
- User can request all feedback data via data export
- Feedback contains no payment information

**PII Considerations:**
- UserAgent strings may contain identifying information
- IP addresses are NOT captured
- Email addresses come from authenticated sessions only

---

## Troubleshooting

### Issue: Feedback modal doesn't appear after simulation

**Check:**
1. localStorage keys (`post_simulation_feedback_skipped`, `post_simulation_feedback_submitted`)
2. `hasShownFeedback` state
3. Simulation response has `success: true`
4. Browser console for errors

**Solution:**
```javascript
// Clear localStorage to test again
localStorage.removeItem('post_simulation_feedback_skipped');
localStorage.removeItem('post_simulation_feedback_submitted');
```

### Issue: API returns 400 "Feedback type is required"

**Check:**
- Request body includes `feedbackType` field
- Value is one of: post_simulation, dashboard, improvement_suggestion, feature_request, general

### Issue: Email notifications not sending

**Check:**
1. `RESEND_API_KEY` environment variable is set
2. Feedback priority is ≥4
3. Resend API quota/status
4. Check server logs for email errors

### Issue: Database migration fails

**Solution:**
```bash
# Check database connection
DATABASE_URL="..." npx prisma db pull

# Force push schema
DATABASE_URL="..." npx prisma db push --accept-data-loss
```

---

## Future Enhancements

### Phase 2 (Recommended)

1. **Admin Dashboard**
   - View/filter/search feedback
   - Respond to users
   - Bulk actions (status updates, tags)

2. **In-App Feedback Widget**
   - Floating button on all pages
   - Quick feedback without interrupting flow

3. **Follow-Up Surveys**
   - Email surveys to specific user segments
   - Targeted feature feedback

4. **Sentiment Analysis**
   - Automatic tagging of feedback sentiment
   - Trend analysis over time

5. **Integration with Issue Tracker**
   - Auto-create GitHub issues from feedback
   - Link feedback to feature development

### Phase 3 (Advanced)

1. **AI-Powered Insights**
   - Automatic categorization
   - Theme extraction from open-ended responses
   - Anomaly detection (sudden satisfaction drops)

2. **User Interviews**
   - Identify users willing to provide detailed feedback
   - Schedule interviews directly from dashboard

3. **Feature Voting**
   - Public roadmap with upvoting
   - Transparency in feature prioritization

---

## Support

**Issues & Questions:**
- GitHub Issues: [retirezest/webapp/issues](https://github.com/juancb/retirezest/issues)
- Email: contact@retirezest.com

**Documentation:**
- This document: `/webapp/FEEDBACK_MODULE_DOCUMENTATION.md`
- Prisma schema: `/webapp/prisma/schema.prisma`
- API routes: `/webapp/app/api/feedback/`

---

## Changelog

**v1.0.0 - January 19, 2026**
- ✅ Initial implementation complete
- ✅ PostSimulationFeedbackModal component
- ✅ DashboardFeedbackPanel component
- ✅ API endpoint with priority calculation
- ✅ Email notifications for high-priority feedback
- ✅ Database schema and migration
- ✅ Full integration with simulation and dashboard pages
- ✅ TypeScript compilation successful
- ✅ Production build successful
- ✅ Documentation complete

---

**Module Status:** ✅ Production-Ready

All components have been implemented, tested for compilation, and integrated into the application. The feedback module is ready for production deployment.
