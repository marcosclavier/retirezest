# Email Privacy Guidelines for RetireZest Team

**Created**: January 30, 2026
**Last Updated**: January 30, 2026
**Applies to**: All team members sending user-facing emails
**Compliance**: PIPEDA (Canada), Privacy best practices

---

## 🚨 Privacy Incident Alert

**Date**: January 30, 2026
**Incident**: Email sent to user containing their personal financial information (account balances, income, expenses, age, province)
**Impact**: Privacy protocol violation - user's PII sent via unencrypted email
**Status**: Incident documented, preventive measures implemented

---

## Mandatory Privacy Rules

### ❌ NEVER Send via Email:

1. **Financial Data**:
   - Account balances (RRSP, TFSA, LIRA, Non-Reg, Corporate)
   - Income amounts (CPP, OAS, pension, employment, rental)
   - Expense amounts
   - Tax amounts or marginal tax rates
   - Simulation results with dollar amounts

2. **Personal Information**:
   - Age (exact age - ranges like "60s" are acceptable if needed)
   - Province or city of residence
   - Marital status
   - Number of children or dependents
   - Health information

3. **Identifiable Data**:
   - User ID numbers
   - Email tracking IDs (in user-facing content)
   - Database record IDs
   - Session tokens or auth credentials

### ✅ SAFE to Send via Email:

1. **Generic Information**:
   - Feature descriptions
   - Product updates
   - Help documentation links
   - General guidance

2. **Minimal User Info**:
   - First name only
   - "Your retirement plan" (without specifics)
   - Account types (RRSP, TFSA) without amounts

3. **Secure Links**:
   - Links to authenticated dashboard
   - "Log in to see your results"
   - Password reset links (token-based)

---

## Email Approval Process

### Before Sending ANY User-Facing Email:

1. **Use Pre-Approved Templates**:
   - See `/webapp/email-templates/PRIVACY_SAFE_EMAIL_TEMPLATES.md`
   - Do not create new templates without review

2. **Review Checklist** (Complete EVERY time):
   - [ ] No dollar amounts included
   - [ ] No age/province/demographic data
   - [ ] No account balances or simulation results
   - [ ] User must log in to see their data
   - [ ] Using correct email: contact@retirezest.com
   - [ ] Only first name used (no last name in email body)

3. **Peer Review** (Required for new templates):
   - Have another team member review
   - Document approval in Slack/email
   - Add to template library if reusable

4. **Test Send**:
   - Send to yourself first
   - Check HTML and plain text versions
   - Verify all placeholders are replaced
   - Confirm no PII leaked through

---

## Correct vs. Incorrect Examples

### ❌ INCORRECT - Privacy Violation

```javascript
// BAD: Includes user's financial data
const email = {
  to: user.email,
  subject: 'Your Simulation Results',
  html: `
    <p>Hi ${user.firstName},</p>
    <p>Your simulation shows:</p>
    <ul>
      <li>Age: ${user.age}</li>
      <li>RRSP Balance: $${simulation.rrsp}</li>
      <li>Annual Income: $${simulation.income}</li>
      <li>Province: ${user.province}</li>
    </ul>
    <p>You'll have $${simulation.balanceAtAge90} at age 90.</p>
  `
};
// ❌ VIOLATES PRIVACY - User PII sent via email!
```

### ✅ CORRECT - Privacy Safe

```javascript
// GOOD: No PII, links to secure dashboard
const email = {
  to: user.email,
  subject: 'Your RetireZest Simulation is Ready',
  html: `
    <p>Hi ${user.firstName},</p>
    <p>Your retirement simulation is complete and ready to view.</p>
    <p>Your personalized plan includes:</p>
    <ul>
      <li>Year-by-year projections</li>
      <li>Tax optimization strategies</li>
      <li>Government benefit estimates</li>
    </ul>
    <p><strong>View your results securely:</strong></p>
    <a href="https://www.retirezest.com/simulation">
      Log In to See Your Plan
    </a>
    <p>🔒 Your data is only accessible through your secure dashboard.</p>
  `
};
// ✅ PRIVACY SAFE - No PII, user logs in to see data
```

---

## User Communication Scenarios

### Scenario 1: User Reports a Bug

**User says**: "My simulation shows $1M at age 90, that's wrong!"

❌ **WRONG Response**:
```
Hi John,

I checked your profile and see you have:
- Age: 67
- RRSP: $119,000
- TFSA: $90,000
- Income: $22,000/year

The simulation is correct - your $303K grows to $1M due to
5% returns exceeding your withdrawals.
```

✅ **CORRECT Response**:
```
Hi John,

Thank you for reporting this! To help investigate, could you:
1. Take a screenshot of the page showing the figure
2. Let me know which account type you're referring to
3. Describe what you expected to see

Alternatively, log in to your dashboard at retirezest.com/simulation
and we can schedule a quick call to walk through it together.

Best regards,
RetireZest Team
contact@retirezest.com
```

---

### Scenario 2: Announcing New Features

**Goal**: Tell users about new features (US-040, US-041 from Sprint 5)

❌ **WRONG Approach**:
```
Hi Sarah,

Based on your feedback about your $303K investment not showing
when it depletes, we've added a timeline feature. Your LIRA
converts to LRIF at age 71 (2030) and your non-reg account
depletes at age 78.
```

✅ **CORRECT Approach**:
```
Hi Sarah,

Thank you for your feedback! We've released new features:

📅 Investment Timeline Display
- See when RRSP/LIRA converts to RRIF/LRIF
- View projected account depletion dates
- Understand investment lifespan

📈 Growth Explanations
- Tooltips explaining compound interest
- Clearer balance projections

Log in to see these features with your retirement plan:
retirezest.com/simulation

Best regards,
RetireZest Team
```

---

## Email Template Usage

### Available Templates

All templates are in: `/webapp/email-templates/PRIVACY_SAFE_EMAIL_TEMPLATES.md`

1. **Feedback Clarification** - When user reports an issue
2. **Feature Update** - Announcing new features
3. **Simulation Complete** - Async simulation finished
4. **General Support** - Responding to questions

### How to Use Templates

```javascript
// 1. Import the template
const { feedbackClarificationEmail } = require('./email-templates');

// 2. Fetch user data from database
const user = await db.users.findById(userId);

// 3. Replace placeholders (ONLY first name!)
const emailHtml = feedbackClarificationEmail.html
  .replace('[FIRST_NAME]', user.firstName || 'there');

const emailText = feedbackClarificationEmail.text
  .replace('[FIRST_NAME]', user.firstName || 'there');

// 4. Send via Resend
const emailData = {
  from: 'RetireZest <contact@retirezest.com>',
  to: [user.email],
  subject: feedbackClarificationEmail.subject,
  html: emailHtml,
  text: emailText
};

await resend.emails.send(emailData);
```

---

## What To Do If You Accidentally Send PII

### Immediate Actions:

1. **Stop**: Don't send more emails with PII
2. **Document**: Record what was sent, to whom, when
3. **Notify**: Inform team lead immediately
4. **Assess**: Determine scope of breach
   - How many users affected?
   - What specific PII was included?
   - Was email encrypted?

### Incident Report Template:

```
PRIVACY INCIDENT REPORT

Date/Time: [When email was sent]
Affected Users: [Number of users, or specific user ID if single]
PII Disclosed: [List what was included: balances, age, province, etc.]
Email Subject: [Subject line]
Email Script: [File name if automated, or "manual" if one-off]
Discovery Method: [How was breach discovered]
Immediate Actions Taken: [What you did to prevent further issues]

Reported by: [Your name]
Reported to: [Team lead name]
Report Date: [Date of this report]
```

### Follow-Up Actions:

1. **Review existing scripts**: Check all email code for similar issues
2. **Update templates**: Use privacy-safe templates going forward
3. **Team training**: Share learnings with entire team
4. **Consider user notification**: Depending on severity, may need to inform affected users

---

## Privacy Training

### Required for All Team Members:

1. **Read this document** (annually or when updated)
2. **Review PIPEDA basics**: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
3. **Use approved templates**: Never create ad-hoc user emails
4. **When in doubt**: Ask team lead before sending

### Key Principles:

1. **Minimize Data Sharing**: Only share what's absolutely necessary
2. **Secure by Default**: Assume email is not secure
3. **User Control**: Let users access their data via authenticated dashboard
4. **Transparency**: Be clear about what data we collect and how we use it

---

## Contact Information

**Privacy Questions**: contact@retirezest.com
**Email Templates**: `/webapp/email-templates/PRIVACY_SAFE_EMAIL_TEMPLATES.md`
**Incident Reports**: [Team lead / Privacy officer]

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-30 | Initial version created after privacy incident | Team |

---

**Remember**: When in doubt, don't send user data via email. Link to secure dashboard instead!
