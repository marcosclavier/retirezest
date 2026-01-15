# User Feedback and Bug Reporting System Plan

**Document Version:** 1.0
**Date:** January 15, 2025
**Purpose:** Comprehensive plan for implementing an enhanced user feedback and bug reporting system for RetireZest

---

## Executive Summary

This plan outlines a multi-tiered approach to collecting user feedback and bug reports by enhancing existing infrastructure (contact form, Sentry, Resend email) and adding new capabilities for better user engagement and issue tracking.

### Key Objectives
1. Make it easier for users to report bugs and provide feedback
2. Capture rich context automatically (page, user info, browser, errors)
3. Integrate feedback with error monitoring (Sentry)
4. Route and categorize feedback efficiently
5. Track and prioritize user-reported issues

---

## Current Infrastructure Analysis

### ✅ Existing Assets

#### 1. Contact Form (`/contact`)
- **Location:** `app/contact/page.tsx`
- **Features:**
  - Email, name, subject, message fields
  - Categories: General, Technical Support, Calculations, Account Help, Feature Request, **Bug Report**, Other
  - Client-side validation with react-hook-form + zod
- **Limitations:**
  - No file/screenshot upload
  - No automatic context capture (URL, browser, user session)
  - No integration with error tracking

#### 2. Contact API Endpoint
- **Location:** `app/api/contact/route.ts`
- **Current Status:** Only logs to console (not functional)
- **Needs:** Email integration via Resend API

#### 3. Sentry Error Monitoring
- **Status:** ✅ Fully configured
- **Capabilities:**
  - Client-side error tracking (`sentry.client.config.ts`)
  - Session replay (10% sample rate in production)
  - Performance monitoring
  - Sensitive data filtering
  - User context tracking
- **Configuration:**
  - Environment: development/production
  - Sample rates: 10% traces, 100% errors, 10% replays
  - Privacy: Masks all text and media in replays

#### 4. Email Service (Resend)
- **Status:** ✅ Configured
- **API Key:** Available in `.env.local`
- **From Address:** `contact@retirezest.com`
- **Dependencies:** `resend` package (v6.6.0) installed

#### 5. Form Validation
- **Libraries:** react-hook-form (v7.66.0), zod (v4.1.12)
- **Status:** ✅ Already in use

---

## Proposed System Architecture

### 3-Tier Feedback Collection System

```
┌─────────────────────────────────────────────────────────┐
│           Tier 1: In-App Feedback Widget                │
│  (Quick feedback button on every page)                   │
│  - Screenshot capture                                     │
│  - Auto context (URL, user, browser)                     │
│  - Link to Sentry errors                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│        Tier 2: Enhanced Contact Form                     │
│  (Dedicated feedback page with rich features)            │
│  - File/screenshot upload                                 │
│  - Auto-populated context                                │
│  - Better categorization                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Tier 3: Sentry Error Reporting                   │
│  (Automatic error tracking and monitoring)               │
│  - Session replays                                        │
│  - Stack traces                                           │
│  - User context                                           │
└─────────────────────────────────────────────────────────┘
                        ↓
         ┌──────────────────────────────┐
         │   Feedback Processing Hub    │
         │                              │
         │  - Email notifications       │
         │  - GitHub Issues (optional)  │
         │  - Analytics dashboard       │
         │  - Priority scoring          │
         └──────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Enhance Contact Form (Priority: HIGH)

#### 1.1 Add Email Integration to Contact API
**File:** `app/api/contact/route.ts`

**Changes:**
- Integrate Resend API to send emails
- Format email template with all submission details
- Add error handling and logging
- Return proper success/error responses

**Email Template:**
```
Subject: [RetireZest Feedback] {category} - {subject}

From: {name} ({email})
Category: {category}
Page URL: {url}
Browser: {userAgent}
Timestamp: {timestamp}

Message:
{message}

---
User ID: {userId} (if authenticated)
Session ID: {sessionId}
```

#### 1.2 Add Screenshot/File Upload
**Technology:** File upload via API route

**Implementation:**
- Add file input to contact form (accept: image/*, .pdf)
- Validate file size (max 5MB) and type
- Upload to temporary storage or encode as base64 in email
- Consider using Vercel Blob storage for attachments

**UI Update:**
```tsx
<input
  type="file"
  accept="image/*,.pdf"
  multiple
  onChange={handleFileUpload}
/>
```

#### 1.3 Capture Page Context Automatically
**Auto-captured data:**
- Current page URL
- Referrer
- Browser/OS info (User-Agent)
- Screen resolution
- User ID (if logged in)
- Timestamp

**Implementation:**
- Add hidden fields to form
- Populate via JavaScript on mount
- Include in API payload

#### 1.4 Link to Sentry Errors
**Feature:** If user encountered an error, link feedback to Sentry event

**Implementation:**
- Check Sentry for recent errors from user's session
- Display error ID in feedback form
- Include Sentry event ID in feedback submission
- Add link to Sentry dashboard in email

---

### Phase 2: In-App Feedback Widget (Priority: MEDIUM)

#### 2.1 Floating Feedback Button Component
**Location:** `components/feedback/FeedbackWidget.tsx`

**Features:**
- Floating button in bottom-right corner
- Opens modal with quick feedback form
- Screenshot capture via browser API
- Auto-submits with context

**Visual Design:**
- Minimal, unobtrusive button
- Badge for "Give Feedback" or "Report Bug"
- Smooth slide-in modal

**Code Structure:**
```tsx
'use client';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureScreenshot = async () => {
    // Use html2canvas or browser screenshot API
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Feedback
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <FeedbackForm onScreenshot={captureScreenshot} />
      </Dialog>
    </>
  );
}
```

#### 2.2 Screenshot Capture
**Library:** `html2canvas` (for client-side screenshot)

**Installation:**
```bash
npm install html2canvas
```

**Implementation:**
```tsx
import html2canvas from 'html2canvas';

async function takeScreenshot() {
  const canvas = await html2canvas(document.body);
  return canvas.toDataURL('image/png');
}
```

#### 2.3 Quick Feedback Form
**Fields:**
- Feedback type: Bug / Feature / Question / Other
- Message (required, min 10 chars)
- Include screenshot: checkbox (auto-captured)
- Auto-context: URL, user, browser (hidden)

**Validation:**
- Required: feedback type, message
- Min length: 10 characters

---

### Phase 3: Feedback Processing Hub (Priority: MEDIUM)

#### 3.1 Email Notifications
**Implementation:**
- Send to `contact@retirezest.com`
- CC: dev team email (if configured)
- Format: HTML email with rich formatting
- Attachments: screenshots, files

#### 3.2 Categorization and Routing
**Categories:**
1. **Critical Bug** → Immediate Slack/Email alert
2. **Bug Report** → Email to dev team
3. **Feature Request** → Product backlog
4. **General Feedback** → Email to support team
5. **Question/Help** → Email to support team

**Auto-tagging:**
- Extract keywords from message
- Assign priority score (1-5)
- Detect urgency indicators ("urgent", "critical", "broken")

#### 3.3 Optional: GitHub Issues Integration
**Benefit:** Automatically create GitHub issues for bug reports

**Implementation:**
- Use GitHub API (`@octokit/rest`)
- Create issue with label: "user-reported"
- Include feedback details in issue body
- Link back to Sentry error (if available)

**Example:**
```typescript
import { Octokit } from '@octokit/rest';

async function createGitHubIssue(feedback: FeedbackSubmission) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  await octokit.issues.create({
    owner: 'yourusername',
    repo: 'retirezest',
    title: `[User Report] ${feedback.subject}`,
    body: formatIssueBody(feedback),
    labels: ['user-reported', 'bug'],
  });
}
```

---

### Phase 4: Analytics and Monitoring (Priority: LOW)

#### 4.1 Feedback Analytics Dashboard
**Metrics to Track:**
- Total submissions (by category)
- Response time
- Top reported issues
- User satisfaction trends
- Common feature requests

**Technology:**
- Store feedback in PostgreSQL database
- Create admin dashboard page (`/admin/feedback`)
- Charts: Recharts (already in use)

#### 4.2 Database Schema
**Table:** `user_feedback`

```sql
CREATE TABLE user_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'new', -- new, in_progress, resolved, closed
  page_url TEXT,
  user_agent TEXT,
  browser_info JSONB,
  sentry_event_id VARCHAR(100),
  github_issue_number INTEGER,
  attachments JSONB, -- array of file URLs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_feedback_user ON user_feedback(user_id);
CREATE INDEX idx_feedback_category ON user_feedback(category);
CREATE INDEX idx_feedback_status ON user_feedback(status);
CREATE INDEX idx_feedback_created ON user_feedback(created_at DESC);
```

#### 4.3 Priority Scoring Algorithm
**Factors:**
- Category (Bug = 5, Feature = 3, Question = 1)
- Urgency keywords in message
- User tier (paid vs free)
- Frequency (multiple users reporting same issue)

**Formula:**
```typescript
function calculatePriority(feedback: Feedback): number {
  let score = 3; // Base priority

  // Category weight
  if (feedback.category === 'bug') score += 2;
  if (feedback.category === 'feature') score += 1;

  // Urgency keywords
  const urgentWords = ['critical', 'urgent', 'broken', 'crash'];
  if (urgentWords.some(word => feedback.message.toLowerCase().includes(word))) {
    score += 2;
  }

  // User tier (if premium user)
  if (feedback.user?.isPremium) score += 1;

  return Math.min(score, 5); // Cap at 5
}
```

---

## Technical Implementation Details

### API Routes Required

#### 1. `/api/feedback/submit` (NEW)
- Method: POST
- Purpose: Submit feedback from widget
- Payload: `{ type, message, screenshot, context }`
- Response: `{ success: true, id: string }`

#### 2. `/api/contact` (ENHANCE)
- Method: POST
- Purpose: Submit contact form
- Add: Email integration via Resend
- Add: File upload handling
- Add: Sentry event linking

#### 3. `/api/feedback/list` (NEW - Admin only)
- Method: GET
- Purpose: Get all feedback submissions
- Auth: Admin only
- Response: `{ feedback: Feedback[], total: number }`

### Frontend Components

```
components/
├── feedback/
│   ├── FeedbackWidget.tsx        # Floating feedback button
│   ├── FeedbackModal.tsx         # Quick feedback form modal
│   ├── FeedbackForm.tsx          # Reusable feedback form
│   └── ScreenshotCapture.tsx     # Screenshot utility
└── admin/
    └── FeedbackDashboard.tsx     # Admin analytics page
```

### Dependencies to Install

```bash
# Screenshot capture
npm install html2canvas

# GitHub integration (optional)
npm install @octokit/rest

# File upload (if using Vercel Blob)
npm install @vercel/blob
```

---

## User Experience Flow

### Flow 1: Quick Bug Report via Widget

1. User encounters bug on `/simulation` page
2. User clicks "Report Bug" floating button
3. Modal opens with auto-captured screenshot
4. User types: "Calculation shows NaN for corporate withdrawals"
5. User clicks "Submit"
6. System:
   - Captures context (URL, user, browser)
   - Links to Sentry error (if recent error detected)
   - Sends email to dev team
   - Creates GitHub issue (optional)
   - Shows "Thank you" message
7. Dev team receives email with screenshot, context, and Sentry link

### Flow 2: Detailed Feature Request via Contact Form

1. User navigates to `/contact`
2. User selects "Feature Request" category
3. User fills in subject: "Add export to Excel feature"
4. User writes detailed message
5. User uploads mockup screenshot (optional)
6. User submits form
7. System:
   - Sends formatted email to product team
   - Stores in database with priority = 3
   - Sends confirmation email to user
8. Product team reviews and adds to backlog

### Flow 3: Automatic Sentry Error with User Context

1. User triggers JavaScript error on page
2. Sentry captures error with:
   - Stack trace
   - User ID and email
   - Page URL and breadcrumbs
   - Session replay (if enabled)
3. Dev team sees error in Sentry dashboard
4. If user previously submitted feedback, Sentry event links to feedback ID
5. Dev team has full context to debug

---

## Privacy and Security Considerations

### Data Privacy
- **Screenshot masking:** Ensure sensitive data (passwords, financial info) is masked in screenshots
- **PII protection:** Don't include full financial data in feedback
- **User consent:** Add checkbox: "I consent to sharing this information with RetireZest team"

### Security
- **Rate limiting:** Max 5 submissions per user per hour (prevent spam)
- **File validation:** Validate file types and sizes
- **XSS prevention:** Sanitize user input before displaying in admin dashboard
- **Authentication:** Only authenticated users can submit feedback (or require email verification for anonymous)

### GDPR Compliance
- Allow users to delete their feedback submissions
- Include feedback data in user data export
- Add "Delete my feedback" option in user settings

---

## Success Metrics

### KPIs to Track

1. **Feedback Volume**
   - Target: 50+ submissions per month
   - Measure: Total submissions by category

2. **Response Time**
   - Target: 24 hours for bugs, 48 hours for features
   - Measure: Time from submission to first response

3. **Resolution Rate**
   - Target: 80% of bugs resolved within 7 days
   - Measure: Percentage of closed bugs

4. **User Satisfaction**
   - Target: 4.5/5 average rating
   - Measure: Post-resolution survey (optional)

5. **Feature Adoption**
   - Target: 20% of users submit feedback at least once
   - Measure: Unique users who submitted feedback / total active users

---

## Implementation Timeline

### Week 1-2: Phase 1 (Contact Form Enhancement)
- [ ] Integrate Resend API in contact form
- [ ] Add file upload capability
- [ ] Capture page context automatically
- [ ] Link to Sentry errors
- [ ] Test email delivery

### Week 3-4: Phase 2 (Feedback Widget)
- [ ] Build FeedbackWidget component
- [ ] Implement screenshot capture
- [ ] Create `/api/feedback/submit` endpoint
- [ ] Add widget to main layout
- [ ] Test cross-browser compatibility

### Week 5-6: Phase 3 (Processing Hub)
- [ ] Create feedback database table
- [ ] Build email notification system
- [ ] Implement categorization and routing
- [ ] (Optional) Add GitHub Issues integration
- [ ] Set up monitoring and alerts

### Week 7-8: Phase 4 (Analytics)
- [ ] Build admin feedback dashboard
- [ ] Implement analytics queries
- [ ] Add priority scoring algorithm
- [ ] Create charts and visualizations
- [ ] Set up automated reports

---

## Cost Analysis

### Infrastructure Costs

1. **Resend Email Service**
   - Free tier: 3,000 emails/month
   - Paid: $20/month for 50,000 emails
   - Expected: Free tier sufficient initially

2. **Vercel Blob Storage** (for file uploads)
   - Free tier: 1GB storage
   - Paid: $0.15/GB/month
   - Expected: ~$5-10/month

3. **Sentry**
   - Current: Already configured
   - Free tier: 5,000 errors/month
   - Paid: Starts at $26/month
   - Expected: Free tier sufficient

4. **GitHub API** (optional)
   - Free for public repos
   - Rate limit: 5,000 requests/hour

**Total Estimated Cost:** $0-15/month (depending on usage)

---

## Alternatives Considered

### Option 1: Third-Party Feedback Tools
**Examples:** Canny, UserVoice, Feedbear

**Pros:**
- Ready-made solution
- Built-in analytics
- User voting on features

**Cons:**
- Monthly cost ($50-200/month)
- Less control over data
- Additional integration complexity

**Decision:** Build in-house for better integration and cost savings

### Option 2: Discord/Slack Community
**Pros:**
- Real-time feedback
- Community building
- Free

**Cons:**
- Harder to track and organize
- Not all users want to join Discord
- Privacy concerns

**Decision:** Use as supplement, not primary channel

### Option 3: Intercom/Zendesk
**Pros:**
- Full support suite
- Live chat
- Knowledge base

**Cons:**
- Expensive ($79+/month)
- Overkill for current needs

**Decision:** Not cost-effective at current scale

---

## Maintenance Plan

### Ongoing Tasks
- **Weekly:** Review new feedback submissions
- **Monthly:** Analyze feedback trends
- **Quarterly:** Review and update priority scoring
- **Annually:** Survey users about feedback process

### Monitoring
- Set up alerts for:
  - Critical bugs (priority 5)
  - High volume of feedback (>10/hour)
  - Failed email deliveries
  - API errors

---

## Conclusion

This comprehensive plan provides a scalable, cost-effective solution for collecting user feedback and bug reports. By leveraging existing infrastructure (Sentry, Resend, Contact Form) and adding targeted enhancements (widget, analytics), RetireZest can:

1. ✅ Make it easy for users to report issues
2. ✅ Capture rich context automatically
3. ✅ Route feedback efficiently
4. ✅ Track and prioritize user-reported issues
5. ✅ Improve product based on user input

**Next Steps:**
1. Review and approve this plan
2. Prioritize phases based on immediate needs
3. Begin Phase 1 implementation
4. Iterate based on user feedback

---

**Questions or Feedback on This Plan?**
Contact: contact@retirezest.com
