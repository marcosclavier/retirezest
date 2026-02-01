# Email Implementation Guide - Privacy-Safe Practices

**Purpose**: Developer guide for implementing privacy-compliant email communications
**Last Updated**: January 31, 2026
**Priority**: P0 (Critical - Privacy Compliance)

---

## Table of Contents

1. [Privacy Incident Alert](#privacy-incident-alert)
2. [Mandatory Privacy Rules](#mandatory-privacy-rules)
3. [Email System Architecture](#email-system-architecture)
4. [Implementation Patterns](#implementation-patterns)
5. [Code Examples](#code-examples)
6. [Testing Checklist](#testing-checklist)
7. [Deployment Guidelines](#deployment-guidelines)

---

## Privacy Incident Alert

**Date**: January 30, 2026
**Incident**: Personal financial information (PII) sent via email
**User Affected**: rightfooty218@gmail.com
**Data Exposed**: Age (67), assets ($303K), income, expenses, province (QC)
**Severity**: HIGH - PIPEDA compliance violation

### What Happened

An email was sent to a user containing:
- Personal age
- Asset balances (RRSP, TFSA, Non-Reg amounts)
- Income and expense figures
- Province of residence

### Why This Is Critical

- **PIPEDA Violation**: Sending PII via unencrypted email violates Canadian privacy laws
- **Security Risk**: Email is not a secure communication channel
- **User Trust**: Users expect their financial data to remain confidential
- **Legal Liability**: Privacy breaches can result in fines and legal action

### Corrective Actions

1. ✅ All existing email templates reviewed and sanitized
2. ✅ Privacy-safe email templates created (`PRIVACY_SAFE_EMAIL_TEMPLATES.md`)
3. ✅ Team training guidelines created (`EMAIL_PRIVACY_GUIDELINES.md`)
4. ⏳ This implementation guide created for future development
5. ⏳ Code review required for all email-related changes

---

## Mandatory Privacy Rules

### NEVER Include in Emails (Blacklist)

❌ **Personal Financial Data**:
- Account balances (RRSP, TFSA, Non-Reg, LIRA, Corporate)
- Income amounts (employment, pension, investment, rental)
- Expense amounts (housing, food, transportation)
- Debt balances (mortgage, loans, credit cards)
- Net worth calculations
- Tax amounts (federal, provincial, total)

❌ **Personal Identifiable Information (PII)**:
- Date of birth or exact age
- Province of residence
- Home address
- Phone number
- Sin (Social Insurance Number)
- Marital status details
- Full legal name (use first name only)

❌ **Financial Planning Details**:
- CPP amounts
- OAS amounts
- GIS eligibility or amounts
- Retirement age targets
- Life expectancy assumptions
- Investment return rates
- Withdrawal strategies

❌ **Simulation Results**:
- Success rates
- Estate values
- Shortfall years
- Year-by-year projections
- Government benefit projections
- Tax projections

### ALWAYS Safe to Include (Whitelist)

✅ **General Information**:
- First name only
- Account status (active, premium, free)
- Generic feature descriptions
- Help documentation links
- Contact information (contact@retirezest.com)

✅ **Secure Links**:
- Links to dashboard (user logs in to view data)
- Links to help pages (public information)
- Links to feedback forms (secure submission)

✅ **Non-Sensitive Notifications**:
- "Your simulation is complete" (no results)
- "Your account has been updated" (no specifics)
- "New feature available" (feature description only)

---

## Email System Architecture

### Current Stack

**Email Service**: Resend API (https://resend.com)
**From Address**: contact@retirezest.com
**Domain**: retirezest.com (verified with Resend)
**Templates**: Stored in `/Users/jrcb/Documents/GitHub/retirezest/PRIVACY_SAFE_EMAIL_TEMPLATES.md`

### Email Flow

```
┌─────────────────────────────────────────────────────────┐
│  Trigger Event (e.g., feedback submitted, feature released) │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Email Service Function (e.g., sendFeedbackEmail)       │
│  - Validates input (no PII)                              │
│  - Loads template                                        │
│  - Substitutes safe variables only                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Resend API Client                                       │
│  - Sends email via HTTPS                                 │
│  - Returns delivery status                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  User's Email Inbox                                      │
│  - Contains ONLY safe information                        │
│  - Links to secure dashboard for details                 │
└─────────────────────────────────────────────────────────┘
```

### File Locations

| File | Purpose |
|------|---------|
| `webapp/lib/email.ts` | Resend client configuration |
| `webapp/app/api/email/send/route.ts` | Email sending API route (if exists) |
| `PRIVACY_SAFE_EMAIL_TEMPLATES.md` | Approved email templates |
| `EMAIL_PRIVACY_GUIDELINES.md` | Team training document |

---

## Implementation Patterns

### Pattern 1: Feedback Clarification Email

**Trigger**: User submits feedback with low satisfaction score
**Purpose**: Request more details to understand the issue
**Privacy Requirement**: NO personal data included

**Safe Implementation**:

```typescript
// webapp/lib/email/sendFeedbackClarificationEmail.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface FeedbackClarificationInput {
  userEmail: string;
  userFirstName: string;
  satisfactionScore: number;  // SAFE: Just the score (1-5)
  // NO: age, income, assets, province, etc.
}

export async function sendFeedbackClarificationEmail(
  input: FeedbackClarificationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input - ensure no PII
    if (!input.userEmail || !input.userFirstName) {
      throw new Error('Missing required fields');
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'RetireZest <contact@retirezest.com>',
      to: [input.userEmail],
      subject: 'Re: Your RetireZest Feedback - We\'d Love More Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Thank you for your feedback!</h2>

          <p>Hi ${input.userFirstName},</p>

          <p>Thank you for taking the time to rate your RetireZest experience (${input.satisfactionScore}/5 stars).</p>

          <p>We're committed to improving, and we'd love to understand more about your experience. Could you help us by sharing:</p>

          <ul>
            <li>What specific features or calculations didn't meet your expectations?</li>
            <li>Were there any errors or unexpected results?</li>
            <li>What would make RetireZest more useful for your retirement planning?</li>
          </ul>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>🔒 Privacy Note:</strong> For your security, please do NOT include specific financial details (account balances, income amounts, etc.) in your reply. General descriptions are perfect!</p>
          </div>

          <p>You can reply directly to this email, or share more details securely through your dashboard:</p>

          <p style="text-align: center;">
            <a href="https://www.retirezest.com/feedback" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Share Feedback Securely</a>
          </p>

          <p>Thank you for helping us improve RetireZest!</p>

          <p>Best regards,<br>
          The RetireZest Team<br>
          contact@retirezest.com</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #6b7280;">
            You received this email because you submitted feedback on RetireZest. If you have questions, contact us at contact@retirezest.com.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending feedback clarification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Key Points**:
- ✅ Only uses first name and satisfaction score
- ✅ Explicitly warns user NOT to include financial details in reply
- ✅ Provides link to secure dashboard for detailed feedback
- ✅ From address is contact@retirezest.com
- ❌ NO age, province, account balances, income, or expenses

---

### Pattern 2: Feature Update Notification

**Trigger**: New feature released that affects user's plan
**Purpose**: Notify user about feature and encourage re-simulation
**Privacy Requirement**: NO personal data or results

**Safe Implementation**:

```typescript
// webapp/lib/email/sendFeatureUpdateEmail.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface FeatureUpdateInput {
  userEmail: string;
  userFirstName: string;
  featureName: string;
  featureDescription: string;
  // NO: current results, simulation data, financial information
}

export async function sendFeatureUpdateEmail(
  input: FeatureUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'RetireZest <contact@retirezest.com>',
      to: [input.userEmail],
      subject: `New Feature: ${input.featureName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Exciting Update to Your Retirement Planning Tool</h2>

          <p>Hi ${input.userFirstName},</p>

          <p>We're excited to announce a new feature that can improve your retirement planning accuracy:</p>

          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">${input.featureName}</h3>
            <p style="margin-bottom: 0;">${input.featureDescription}</p>
          </div>

          <p><strong>Why This Matters:</strong> This update ensures your retirement projections follow the latest Canadian tax regulations and provide more accurate results.</p>

          <p><strong>What You Should Do:</strong> We recommend re-running your retirement simulations to get the most up-to-date projections.</p>

          <p style="text-align: center;">
            <a href="https://www.retirezest.com/simulation" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Re-Run Your Simulation</a>
          </p>

          <p>As always, if you have questions or feedback, please don't hesitate to reach out.</p>

          <p>Happy planning!</p>

          <p>Best regards,<br>
          The RetireZest Team<br>
          contact@retirezest.com</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #6b7280;">
            You received this email because you have an active RetireZest account. To unsubscribe from feature updates, visit your account settings.
          </p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Key Points**:
- ✅ Generic feature description (no specific impact on user's plan)
- ✅ Call-to-action links to dashboard (secure area)
- ✅ Professional, friendly tone
- ❌ NO simulation results, success rates, or financial projections

---

### Pattern 3: Simulation Complete Notification

**Trigger**: Async simulation finishes processing
**Purpose**: Notify user that results are ready
**Privacy Requirement**: NO results included - just notification

**Safe Implementation**:

```typescript
// webapp/lib/email/sendSimulationCompleteEmail.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SimulationCompleteInput {
  userEmail: string;
  userFirstName: string;
  simulationId: string;
  strategy: string;  // SAFE: Strategy name only
  // NO: successRate, estateValue, shortfallYears, yearByYear data
}

export async function sendSimulationCompleteEmail(
  input: SimulationCompleteInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const dashboardUrl = `https://www.retirezest.com/simulation/results/${input.simulationId}`;

    const { data, error } = await resend.emails.send({
      from: 'RetireZest <contact@retirezest.com>',
      to: [input.userEmail],
      subject: 'Your Retirement Simulation is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Your Simulation is Complete</h2>

          <p>Hi ${input.userFirstName},</p>

          <p>Great news! Your retirement simulation using the <strong>${input.strategy}</strong> strategy has finished processing.</p>

          <p>Your detailed results are now available in your dashboard, including:</p>

          <ul>
            <li>Year-by-year retirement projections</li>
            <li>Government benefits timeline (CPP, OAS, GIS)</li>
            <li>Tax analysis and optimization opportunities</li>
            <li>Account balance trajectories</li>
            <li>Downloadable PDF report</li>
          </ul>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>🔒 Privacy & Security:</strong> Your financial data is stored securely and never shared via email. Always log in to your dashboard to view sensitive information.</p>
          </div>

          <p style="text-align: center;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Results</a>
          </p>

          <p>Questions or need help interpreting your results? We're here to help at contact@retirezest.com.</p>

          <p>Best regards,<br>
          The RetireZest Team<br>
          contact@retirezest.com</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #6b7280;">
            You received this email because you ran a retirement simulation on RetireZest. If you didn't request this, please contact us immediately.
          </p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Key Points**:
- ✅ Only includes strategy name (generic, not PII)
- ✅ Link to secure dashboard with authentication required
- ✅ Privacy reminder explicitly shown
- ❌ NO success rate, estate value, or any financial results

---

## Code Examples

### Example 1: DO NOT DO THIS ❌

**BAD - Includes PII and Financial Data**:

```typescript
// ❌ WRONG - Privacy violation
const { data, error } = await resend.emails.send({
  from: 'contact@retirezest.com',
  to: [user.email],
  subject: 'Your Retirement Plan Analysis',
  html: `
    <p>Hi ${user.firstName},</p>
    <p>Your retirement plan for age ${user.age} in ${user.province} is ready!</p>
    <p><strong>Your Financial Summary:</strong></p>
    <ul>
      <li>RRSP: $${user.rrspBalance.toLocaleString()}</li>
      <li>TFSA: $${user.tfsaBalance.toLocaleString()}</li>
      <li>Non-Registered: $${user.nonRegBalance.toLocaleString()}</li>
      <li>Annual Income: $${user.income.toLocaleString()}</li>
      <li>Annual Expenses: $${user.expenses.toLocaleString()}</li>
    </ul>
    <p>Success Rate: ${simulationResult.successRate}%</p>
    <p>Estate Value at Age 95: $${simulationResult.estateValue.toLocaleString()}</p>
  `,
});
```

**Why This Is Wrong**:
- ❌ Exposes age, province (PII)
- ❌ Shows all account balances (financial data)
- ❌ Includes income and expenses (sensitive)
- ❌ Reveals simulation results in plaintext email
- ❌ Violates PIPEDA privacy regulations
- ❌ Creates security risk if email is intercepted

---

### Example 2: DO THIS INSTEAD ✅

**GOOD - Privacy-Safe Notification**:

```typescript
// ✅ CORRECT - Privacy compliant
const { data, error } = await resend.emails.send({
  from: 'RetireZest <contact@retirezest.com>',
  to: [user.email],
  subject: 'Your Retirement Simulation is Ready',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Hi ${user.firstName},</h2>
      <p>Great news! Your retirement simulation is complete.</p>
      <p>Log in to your secure dashboard to view your detailed results:</p>
      <p style="text-align: center;">
        <a href="https://www.retirezest.com/dashboard"
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Results
        </a>
      </p>
      <p><strong>🔒 Privacy Note:</strong> Your financial data is never sent via email. Always log in to view sensitive information.</p>
      <p>Best regards,<br>The RetireZest Team</p>
    </div>
  `,
});
```

**Why This Is Correct**:
- ✅ Only uses first name (safe)
- ✅ NO financial data included
- ✅ Links to secure dashboard (requires authentication)
- ✅ Privacy reminder included
- ✅ Professional and user-friendly

---

## Testing Checklist

### Before Sending ANY Email

- [ ] **Manual Review**: Read the entire email content line by line
- [ ] **PII Check**: Confirm NO age, province, address, phone, or full name
- [ ] **Financial Data Check**: Confirm NO balances, income, expenses, debts, or tax amounts
- [ ] **Simulation Results Check**: Confirm NO success rates, estate values, or projections
- [ ] **Link Verification**: All links point to secure dashboard or help pages
- [ ] **Privacy Notice**: Email includes privacy reminder about NOT sending data via email
- [ ] **From Address**: Email uses contact@retirezest.com (NOT noreply@)
- [ ] **Test Send**: Send test email to yourself and review in inbox
- [ ] **Mobile Check**: View email on mobile device (responsive layout)
- [ ] **Spam Check**: Ensure email doesn't trigger spam filters (avoid all-caps, excessive links)

### Code Review Checklist

When reviewing pull requests that add/modify email functionality:

- [ ] **Template Inspection**: Email template reviewed against whitelist/blacklist
- [ ] **Variable Validation**: Only safe variables (firstName, accountStatus) are substituted
- [ ] **No Dynamic PII**: No loops that could leak PII (e.g., listing all user assets)
- [ ] **Secure Links Only**: All links require authentication to view sensitive data
- [ ] **Error Handling**: Email failures logged but don't expose user data
- [ ] **Compliance Sign-off**: Privacy lead approves email content (for production)

---

## Deployment Guidelines

### Development Environment

**Test Email Recipients**: Use test accounts only
- test1@retirezest.com
- test2@retirezest.com
- Do NOT send to real user emails during development

**Resend API**: Use test API key
```bash
RESEND_API_KEY=re_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Staging Environment

**Email Interception**: Use email capture service (e.g., Mailtrap)
- All emails sent to Mailtrap inbox (NOT real users)
- Review emails before production deployment

### Production Environment

**Resend API**: Use production API key (stored in Vercel environment variables)
```bash
RESEND_API_KEY=re_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Pre-Deployment Steps**:
1. Privacy review completed ✅
2. Test emails sent to internal team ✅
3. Mobile responsiveness verified ✅
4. Spam filter testing complete ✅
5. Compliance sign-off obtained ✅

**Post-Deployment Monitoring**:
- Monitor Resend dashboard for delivery failures
- Check for bounce rates (> 5% = investigate)
- Review user feedback for email-related issues

---

## Emergency Procedures

### If You Discover PII in an Email

1. **Immediate Action**:
   - Stop all email sending immediately
   - Disable email API route if needed (set environment variable `EMAIL_ENABLED=false`)

2. **Incident Response** (within 1 hour):
   - Notify privacy lead and engineering manager
   - Document what PII was sent, to whom, and when
   - Assess impact (number of users affected)

3. **Mitigation** (within 24 hours):
   - Contact affected users via secure channel (dashboard notification)
   - Offer guidance on privacy protection (e.g., delete email)
   - File privacy incident report (as required by PIPEDA)

4. **Prevention** (within 1 week):
   - Fix code to prevent recurrence
   - Add automated PII detection tests
   - Update training materials
   - Conduct team retrospective

### Contact Information

**Privacy Lead**: [To be assigned]
**Engineering Manager**: [To be assigned]
**Incident Reporting Email**: security@retirezest.com

---

## References

- **Privacy-Safe Email Templates**: `/Users/jrcb/Documents/GitHub/retirezest/PRIVACY_SAFE_EMAIL_TEMPLATES.md`
- **Team Training Guidelines**: `/Users/jrcb/Documents/GitHub/retirezest/EMAIL_PRIVACY_GUIDELINES.md`
- **PIPEDA Overview**: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
- **Resend Documentation**: https://resend.com/docs

---

**Last Updated**: January 31, 2026
**Next Review**: After each email-related feature is deployed
**Maintained By**: Engineering Team & Privacy Lead
