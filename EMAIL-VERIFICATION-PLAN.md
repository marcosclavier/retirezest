# Email Verification Plan for RetireZest

## Executive Summary

Implement email verification during registration to:
- Reduce fake/spam accounts
- Ensure users have access to password recovery
- Improve data quality for future email communications
- Comply with email marketing best practices

**Strategy**: Soft verification with grace period - users can explore the app immediately but must verify within 7 days for full access.

---

## Current State Analysis

### Existing Infrastructure ✅
- **Email Service**: Resend API already integrated (lib/email.ts)
- **Email Templates**: HTML templates with RetireZest branding already exist
- **Database**: PostgreSQL via Neon with Prisma ORM
- **Authentication**: Custom JWT-based auth (lib/auth.ts)
- **Security**: Turnstile (Cloudflare) already protecting registration

### Database Schema (Current)
```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String

  // Password reset tokens (already exists)
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?

  // ... other fields
}
```

---

## Implementation Plan

### Phase 1: Database Schema Changes

**Add to User model:**
```prisma
model User {
  // ... existing fields

  // Email verification
  emailVerified          Boolean   @default(false)
  emailVerificationToken String?   @unique
  emailVerificationExpiry DateTime?
  verificationEmailSentAt DateTime?

  // ... rest of fields

  @@index([emailVerificationToken])
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_email_verification
```

---

### Phase 2: Email Template

**New function in lib/email.ts:**

```typescript
interface SendVerificationEmailParams {
  to: string;
  verificationUrl: string;
  userName?: string;
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
  userName,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }>
```

**Email design:**
- Subject: "Welcome to RetireZest! Verify your email"
- Branded HTML template matching password reset style
- Clear CTA button: "Verify Email Address"
- Link expires in 7 days
- Friendly welcome message
- Option to copy/paste link if button doesn't work

---

### Phase 3: Registration Flow Changes

**app/api/auth/register/route.ts modifications:**

1. After user creation (line 86-93):
   ```typescript
   // Generate verification token
   const verificationToken = crypto.randomBytes(32).toString('hex');
   const verificationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

   const user = await prisma.user.create({
     data: {
       email: email.toLowerCase(),
       passwordHash,
       firstName: firstName || null,
       lastName: lastName || null,
       emailVerified: false,
       emailVerificationToken: verificationToken,
       emailVerificationExpiry: verificationExpiry,
       verificationEmailSentAt: new Date(),
     },
   });
   ```

2. Send verification email (non-blocking):
   ```typescript
   const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

   sendVerificationEmail({
     to: user.email,
     verificationUrl,
     userName: [user.firstName, user.lastName].filter(Boolean).join(' '),
   }).catch((error) => {
     logger.error('Failed to send verification email', error, {
       userId: user.id,
       userEmail: user.email,
     });
   });
   ```

3. Still log user in immediately (no change to current behavior)

---

### Phase 4: Verification Endpoint

**New file: app/api/auth/verify-email/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Check if expired
    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired', expired: true },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    logger.info('Email verified successfully', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification failed', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

### Phase 5: Verification Page UI

**New file: app/verify-email/page.tsx**

```typescript
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus('already-verified');
          } else {
            setStatus('success');
            // Redirect to dashboard after 3 seconds
            setTimeout(() => router.push('/dashboard'), 3000);
          }
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('An error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        {status === 'loading' && (
          <>
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Verifying Your Email
            </h1>
            <p className="text-gray-600 text-center">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-center mb-6">
              <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Your email has been successfully verified. You now have full access to all features.
            </p>
            <p className="text-sm text-gray-500 text-center">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'already-verified' && (
          <>
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Already Verified
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Your email was already verified. You have full access to all features.
            </p>
            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-center mb-6">
              <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Link
                href="/resend-verification"
                className="block w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 text-center"
              >
                Resend Verification Email
              </Link>
              <Link
                href="/dashboard"
                className="block w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
```

---

### Phase 6: Resend Verification Endpoint

**New file: app/api/auth/resend-verification/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Rate limit: Only allow resending once every 60 seconds
    if (user.verificationEmailSentAt) {
      const timeSinceLastSent = Date.now() - user.verificationEmailSentAt.getTime();
      const oneMinute = 60 * 1000;

      if (timeSinceLastSent < oneMinute) {
        const secondsRemaining = Math.ceil((oneMinute - timeSinceLastSent) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${secondsRemaining} seconds before requesting another verification email`,
            retryAfter: secondsRemaining
          },
          { status: 429 }
        );
      }
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        verificationEmailSentAt: new Date(),
      },
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    const result = await sendVerificationEmail({
      to: user.email,
      verificationUrl,
      userName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    logger.info('Verification email resent', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    logger.error('Failed to resend verification email', error);
    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

### Phase 7: Resend Verification UI

**New file: app/resend-verification/page.tsx**

Simple page with:
- Explanation that verification email was sent
- Button to resend
- Link back to dashboard
- Auto-detects if user is logged in
- Shows rate limit message if user clicks too fast

---

### Phase 8: Verification Banner/Reminder

**New component: components/VerificationBanner.tsx**

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface VerificationBannerProps {
  userEmail: string;
}

export function VerificationBanner({ userEmail }: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  if (dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Check your inbox.');
      } else {
        setMessage(data.error || 'Failed to send email');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Please verify your email address ({userEmail})</strong> to ensure full access to all features.
            </p>
            {message && <p className="text-sm text-yellow-700 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-semibold text-yellow-800 hover:text-yellow-900 disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Add to app/(dashboard)/layout.tsx:**

```typescript
import { VerificationBanner } from '@/components/VerificationBanner';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// In the layout component, fetch user and show banner if not verified
const session = await getSession();
const user = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;

// Then in JSX:
{user && !user.emailVerified && <VerificationBanner userEmail={user.email} />}
```

---

### Phase 9: Access Restrictions (Optional - Soft Enforcement)

**Middleware update (middleware.ts):**

Option 1: **Soft restriction** (Recommended for launch)
- Show banner on all pages
- No blocking
- Just reminders

Option 2: **Grace period** (7 days)
- Allow full access for 7 days
- After 7 days, redirect unverified users to /verify-email-required page
- Users can still resend verification

Option 3: **Hard restriction** (Not recommended)
- Block access to simulation/advanced features immediately
- Only allow profile editing
- Too aggressive for user experience

**Recommended: Start with Option 1 (soft), monitor adoption, potentially move to Option 2 after 30 days.**

---

## User Experience Flow

### Happy Path
1. User registers → Sees "Check your email" message on dashboard
2. User clicks link in email → Redirected to /verify-email?token=xxx
3. Token validated → Success page shown
4. Auto-redirect to dashboard after 3 seconds
5. Banner disappears

### Edge Cases

**Already verified:**
- Click old verification link → "Already verified" message
- Button to go to dashboard

**Expired token (after 7 days):**
- Click link → "Token expired" error
- Button to resend verification email

**Lost email:**
- User clicks "Resend Email" in banner
- New email sent (rate limited to 1/minute)

**Never verified (after 7 days):**
- Soft: Just show banner
- Grace period: Show modal explaining verification needed
- Hard: Block features (not recommended)

---

## Testing Checklist

### Unit Tests
- [ ] Email template renders correctly
- [ ] Token generation is unique
- [ ] Token expiry calculation is correct
- [ ] Rate limiting works (60 seconds)

### Integration Tests
- [ ] Register → Verification email sent
- [ ] Click verification link → Email verified
- [ ] Click expired link → Appropriate error
- [ ] Click used/invalid token → Appropriate error
- [ ] Resend email → New token generated
- [ ] Resend too fast → Rate limit error

### UI Tests
- [ ] Banner shows for unverified users
- [ ] Banner hides for verified users
- [ ] Banner dismissible
- [ ] Resend button works
- [ ] Success states display correctly
- [ ] Error states display correctly

### Production Testing
- [ ] Email deliverability (check spam folders)
- [ ] Links work from Gmail, Outlook, Apple Mail
- [ ] Mobile responsive
- [ ] Works with ad blockers
- [ ] Analytics tracking (if implemented)

---

## Security Considerations

1. **Token Security**
   - Use crypto.randomBytes(32) for token generation
   - Store token hashed in database (optional but recommended)
   - 7-day expiry
   - Single-use tokens (deleted after verification)

2. **Rate Limiting**
   - 1 resend per minute per user
   - Prevents spam/abuse

3. **Email Spoofing Prevention**
   - Use verified domain in Resend
   - SPF/DKIM/DMARC records configured

4. **Token Leakage**
   - Tokens in URL (acceptable for this use case)
   - HTTPS only in production
   - Tokens expire after use

---

## Rollout Strategy

### Week 1: Soft Launch (New Users Only)
- Deploy verification for new registrations
- Existing users: no change
- Monitor email deliverability
- Track verification rate

**Success Metrics:**
- Email delivery rate > 95%
- Verification rate within 24 hours > 60%
- Verification rate within 7 days > 80%

### Week 2-4: Monitor & Iterate
- Adjust email copy if verification rate < 60%
- Fix any deliverability issues
- Collect user feedback
- Add analytics if needed

### Month 2: Backfill Existing Users (Optional)
- Send verification email to existing unverified users
- Grandfather in users created before date X (auto-verify)
- OR: Only verify new users, leave old users as-is

### Month 3: Consider Grace Period
- If verification rate is high (>80%), consider adding grace period
- After 7 days, show modal/page requiring verification
- Still allow quick-start and simulation view
- Restrict saving new data until verified

---

## Environment Variables

**Add to .env.example:**
```bash
# Email verification settings
EMAIL_VERIFICATION_EXPIRY_DAYS=7  # Optional, defaults to 7
SKIP_EMAIL_VERIFICATION=false     # For local dev testing
```

---

## Monitoring & Analytics

### Email Metrics (via Resend Dashboard)
- Delivery rate
- Open rate
- Click rate (verification link)
- Bounce rate
- Spam complaints

### Application Metrics
- Verification rate (% of users who verify)
- Time to verification (median/average)
- Resend requests per user
- Failed verification attempts
- Expired token clicks

### Database Queries for Monitoring
```sql
-- Verification rate in last 7 days
SELECT
  COUNT(*) as total_users,
  SUM(CASE WHEN "emailVerified" = true THEN 1 ELSE 0 END) as verified_users,
  ROUND(100.0 * SUM(CASE WHEN "emailVerified" = true THEN 1 ELSE 0 END) / COUNT(*), 2) as verification_rate
FROM "User"
WHERE "createdAt" >= NOW() - INTERVAL '7 days';

-- Average time to verification
SELECT
  AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 3600) as avg_hours_to_verify
FROM "User"
WHERE "emailVerified" = true
AND "createdAt" >= NOW() - INTERVAL '30 days';
```

---

## Future Enhancements

### Phase 10+: Nice-to-Haves
1. **Email preferences page**
   - Allow users to unsubscribe from certain emails
   - Still require verification for account security

2. **Email change workflow**
   - If user changes email, require re-verification
   - Keep old email until new one verified

3. **Two-factor authentication**
   - Build on email verification infrastructure
   - SMS or TOTP options

4. **Email notifications**
   - "Your simulation is ready" emails
   - Monthly retirement planning tips
   - Changes to CPP/OAS rates

5. **Better analytics**
   - Track which email clients users use
   - A/B test email subject lines
   - Track verification link clicks vs manual copy/paste

---

## Cost Estimates

**Resend Pricing:**
- Free tier: 100 emails/day, 3,000/month
- Growth tier: $20/month for 50,000 emails
- Pro tier: $85/month for 1M emails

**Expected costs (first month):**
- Assuming 100 new users/month
- 2 emails per user (initial + 1 resend average) = 200 emails
- **Cost: $0 (free tier)**

**At scale (1,000 users/month):**
- 2,000 emails/month
- **Cost: $0 (free tier)**

**At 10,000 users/month:**
- 20,000 emails/month
- **Cost: $20/month (Growth tier)**

---

## Implementation Timeline

**Week 1:**
- [ ] Day 1-2: Database schema changes + migration
- [ ] Day 3-4: Email template + verification endpoint
- [ ] Day 5: Verification page UI
- [ ] Day 6-7: Testing + bug fixes

**Week 2:**
- [ ] Day 1-2: Resend endpoint + UI
- [ ] Day 3-4: Verification banner component
- [ ] Day 5: Integration with registration flow
- [ ] Day 6-7: End-to-end testing

**Week 3:**
- [ ] Day 1-3: Production deployment
- [ ] Day 4-7: Monitor + iterate

**Total: 3 weeks to full deployment**

---

## Success Criteria

✅ **Launch Ready When:**
1. Email delivery rate > 95%
2. Verification flow works in all major email clients
3. Error handling covers all edge cases
4. Rate limiting prevents abuse
5. UI is mobile responsive
6. No P0/P1 bugs in testing

✅ **Long-term Success:**
1. 60%+ verification rate within 24 hours
2. 80%+ verification rate within 7 days
3. < 1% spam complaints
4. < 5% bounce rate
5. Positive user feedback on email clarity

---

## Files to Create/Modify

### New Files
1. `app/verify-email/page.tsx` - Verification page
2. `app/resend-verification/page.tsx` - Resend page
3. `app/api/auth/verify-email/route.ts` - Verification endpoint
4. `app/api/auth/resend-verification/route.ts` - Resend endpoint
5. `components/VerificationBanner.tsx` - Banner component
6. `prisma/migrations/XXX_add_email_verification.sql` - Migration

### Modified Files
1. `prisma/schema.prisma` - Add verification fields
2. `lib/email.ts` - Add sendVerificationEmail function
3. `app/api/auth/register/route.ts` - Send verification on registration
4. `app/(dashboard)/layout.tsx` - Add verification banner
5. `.env.example` - Document new env vars (optional)

**Total: 11 files (6 new, 5 modified)**

---

## Questions & Decisions Needed

1. **Soft vs. hard verification?**
   - **Recommendation**: Start soft (banner only), no blocking

2. **Verification expiry time?**
   - **Recommendation**: 7 days (standard industry practice)

3. **Backfill existing users?**
   - **Recommendation**: No, only new users. Grandfather existing users.

4. **Grace period before restrictions?**
   - **Recommendation**: No restrictions initially, monitor adoption

5. **Resend rate limit?**
   - **Recommendation**: 1 email per minute per user

6. **Email "from" address?**
   - **Recommendation**: Use `noreply@retirezest.com` (requires domain verification in Resend)
   - Fallback: `onboarding@resend.dev` (works immediately but looks less professional)

---

## Appendix: Email Template Preview

**Subject:** Welcome to RetireZest! Verify your email

**Preview Text:** Click here to verify your email and unlock full access to your retirement planning tools.

**Body:**
```
[RetireZest Logo/Header]

Welcome to RetireZest, [FirstName]!

We're excited to have you start planning your retirement with us. To ensure you have full access to all features and can recover your account if needed, please verify your email address.

[Verify Email Address Button]

This link will expire in 7 days for security reasons.

If the button doesn't work, copy and paste this link into your browser:
https://retirezest.com/verify-email?token=xxxxx

---

Need help? Contact our support team or visit our help center.

© 2025 RetireZest. All rights reserved.
```

---

## Risk Assessment

**Low Risk ✅**
- Email deliverability (using Resend, proven service)
- Database performance (minimal new queries)
- User experience (soft verification, no blocking)

**Medium Risk ⚠️**
- Email going to spam (mitigated by domain verification)
- Users not checking email (mitigated by banner reminders)
- Token security (mitigated by crypto.randomBytes + expiry)

**High Risk ❌**
- None identified

**Overall Risk: LOW** ✅

---

## Conclusion

This plan provides a comprehensive, production-ready email verification system that:
- ✅ Reduces spam/fake accounts
- ✅ Improves data quality
- ✅ Enables future email communications
- ✅ Minimal user friction (soft verification)
- ✅ Leverages existing infrastructure (Resend)
- ✅ Can be implemented in 2-3 weeks
- ✅ Low cost (free tier for months)
- ✅ Scalable to 10,000+ users

**Ready to implement when you are!**
