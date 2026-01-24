# Resend Domain Verification Setup for retirezest.com

## Current Issue
Admin notification emails to `contact@retirezest.com` are not being delivered because the Resend account is in testing/sandbox mode.

**Error Message:**
```
You can only send testing emails to your own email address (marcos.clavier33@gmail.com).
To send emails to other recipients, please verify a domain at resend.com/domains.
```

## Solution: Verify retirezest.com Domain

### Step 1: Add Domain in Resend Dashboard

1. Login to Resend: https://resend.com/login
2. Navigate to: https://resend.com/domains
3. Click **"Add Domain"** button
4. Enter: `retirezest.com`
5. Click **"Add"**

### Step 2: Add DNS Records

After adding the domain, Resend will provide specific DNS records. You need to add these to your DNS provider (where retirezest.com is hosted).

#### Example DNS Records (Resend will provide exact values):

**1. SPF Record (Required)**
```
Type: TXT
Name: @ (or retirezest.com)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600 (or Auto)
```

**2. DKIM Record (Required)**
```
Type: TXT
Name: resend._domainkey (exact name will be provided by Resend)
Value: p=MIGfMA0GCS... (long string provided by Resend)
TTL: 3600 (or Auto)
```

**3. DMARC Record (Recommended)**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:contact@retirezest.com
TTL: 3600 (or Auto)
```

#### How to Add DNS Records:

**If using Cloudflare:**
1. Login to Cloudflare
2. Select retirezest.com domain
3. Go to DNS section
4. Click "Add record"
5. Add each TXT record as shown above

**If using GoDaddy:**
1. Login to GoDaddy
2. My Products → DNS
3. Click "Add" under Records section
4. Select TXT type
5. Add each record

**If using Namecheap:**
1. Login to Namecheap
2. Domain List → Manage → Advanced DNS
3. Add New Record → TXT Record
4. Add each record

### Step 3: Wait for DNS Propagation

- DNS changes typically propagate within 5-15 minutes
- Can take up to 48 hours in rare cases
- Check propagation status: https://dnschecker.org

### Step 4: Verify Domain in Resend

1. Go back to https://resend.com/domains
2. Find your retirezest.com domain
3. Click **"Verify"** button
4. If DNS records are correct, status will change to "Verified" ✅

### Step 5: Update Environment Variables

After domain verification is successful, update your `.env.local` file:

**Current configuration:**
```bash
EMAIL_FROM="onboarding@resend.dev"
```

**Update to:**
```bash
EMAIL_FROM="notifications@retirezest.com"
# or
EMAIL_FROM="noreply@retirezest.com"
# or
EMAIL_FROM="contact@retirezest.com"
```

Choose any email address using your verified domain (@retirezest.com).

**Also update production environment variables:**
1. Go to Vercel dashboard
2. Select webapp project
3. Settings → Environment Variables
4. Update `EMAIL_FROM` variable for Production
5. Redeploy the application

### Step 6: Test Email Delivery

Run the test script to verify emails are working:

```bash
npx tsx scripts/test-admin-notification.ts
```

Expected output:
```
✅ SUCCESS: Admin notification email sent successfully!
Check the inbox of contact@retirezest.com
```

## What This Fixes

Once domain verification is complete:
- ✅ Admin notifications will be sent to `contact@retirezest.com` when users register
- ✅ Password reset emails will be sent to users from your domain
- ✅ Email verification emails will be sent to new users
- ✅ All emails will appear more professional (from @retirezest.com instead of @resend.dev)
- ✅ Better email deliverability and inbox placement

## Current Configuration

**Admin notification recipient:** `contact@retirezest.com` (hardcoded in `lib/email.ts:188`)

**Email functions:**
- Registration → sends verification email to user + admin notification to contact@retirezest.com
- Password reset → sends reset email to user
- Email verification → sends verification link to user

## Alternative Temporary Solution

If you need to receive notifications immediately while waiting for domain verification:

Change admin email in `lib/email.ts` to the verified account email:
```typescript
const adminEmail = 'marcos.clavier33@gmail.com'; // Temporary - change back after domain verification
```

This is NOT recommended for production but can work for immediate testing.

## Support

If you encounter issues:
- Resend Documentation: https://resend.com/docs/send-with-nextjs
- Resend Domain Setup: https://resend.com/docs/dashboard/domains/introduction
- Contact Resend Support: https://resend.com/support

## Verification Checklist

- [ ] Add domain in Resend dashboard
- [ ] Get DNS records from Resend
- [ ] Add SPF record to DNS
- [ ] Add DKIM record to DNS
- [ ] Add DMARC record to DNS (optional but recommended)
- [ ] Wait for DNS propagation (5-15 minutes)
- [ ] Verify domain in Resend dashboard
- [ ] Update EMAIL_FROM in .env.local
- [ ] Update EMAIL_FROM in Vercel production environment
- [ ] Test with `npx tsx scripts/test-admin-notification.ts`
- [ ] Verify email received at contact@retirezest.com
- [ ] Check spam folder if not in inbox
- [ ] Redeploy application in Vercel

---

**Created:** 2026-01-14
**Issue:** Admin registration emails not being delivered to contact@retirezest.com
**Root Cause:** Resend account in sandbox mode, domain not verified
**Solution:** Complete domain verification following steps above
