# Resend Domain Verification Guide

This guide will help you verify your domain (retirezest.com) with Resend so you can send password reset emails to any email address.

## Why Domain Verification is Needed

Currently, your Resend API key can only send emails to the account owner's email (`marcos.clavier33@gmail.com`). To send emails to all users (like `jrcb@hotmail.com`), you need to verify that you own the domain `retirezest.com`.

## Step 1: Access Resend Dashboard

1. Go to **https://resend.com/login**
2. Log in with the account that created the API key
3. Navigate to **Domains** section: https://resend.com/domains

## Step 2: Add Your Domain

1. Click the **"Add Domain"** button
2. Enter: `retirezest.com` (without www)
3. Click **"Add"** or **"Continue"**

## Step 3: Get DNS Records

After adding the domain, Resend will show you **DNS records** that need to be added. You'll see something like:

### Example DNS Records (yours will be different):

| Type | Name | Value |
|------|------|-------|
| TXT | `@` or `retirezest.com` | `v=spf1 include:_spf.resend.com ~all` |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA...` (long key) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

**IMPORTANT:** Copy these records somewhere safe. You'll need them in the next step.

## Step 4: Add DNS Records to Your Domain

You need to add these DNS records where your domain is hosted. Common domain registrars:

### Where is retirezest.com registered?

Check one of these popular registrars:

#### **Option A: GoDaddy**
1. Log in to https://godaddy.com
2. Go to "My Products" → "DNS"
3. Find `retirezest.com` and click "Manage DNS"
4. Scroll to "Records" section
5. Click "Add" for each record type (TXT)
6. Add all three TXT records from Resend

#### **Option B: Namecheap**
1. Log in to https://namecheap.com
2. Go to "Domain List"
3. Click "Manage" next to retirezest.com
4. Go to "Advanced DNS" tab
5. Click "Add New Record"
6. Add all TXT records from Resend

#### **Option C: Cloudflare**
1. Log in to https://dash.cloudflare.com
2. Select `retirezest.com`
3. Go to "DNS" → "Records"
4. Click "Add record"
5. Add all TXT records from Resend

#### **Option D: Google Domains**
1. Log in to https://domains.google.com
2. Find retirezest.com
3. Click "DNS"
4. Scroll to "Custom records"
5. Add all TXT records from Resend

#### **Option E: Vercel**
If you're using Vercel for your domain:
1. Go to https://vercel.com
2. Select your project
3. Go to "Settings" → "Domains"
4. Find retirezest.com
5. Click "Edit" → "DNS Records"
6. Add all TXT records from Resend

### How to Add TXT Records

For each record Resend gives you:

1. **Type**: Select `TXT`
2. **Name/Host**:
   - If Resend shows `@` → use `@` or leave blank
   - If Resend shows `resend._domainkey` → use exactly that
   - If Resend shows `_dmarc` → use exactly that
3. **Value/Data**: Copy-paste the exact value from Resend
4. **TTL**: Use default (usually 3600 or "Automatic")

## Step 5: Verify Domain in Resend

1. After adding all DNS records, go back to Resend dashboard
2. Click **"Verify"** or **"Check DNS Records"**
3. Wait 5-30 minutes if verification fails (DNS propagation time)
4. You can click "Verify" again after waiting

### Checking DNS Propagation

You can check if your DNS records are live:
- Visit: https://dnschecker.org
- Select "TXT" record type
- Enter: `retirezest.com`
- Look for the SPF record with "resend.com"

## Step 6: Update Email Configuration

Once verified, update your environment variables:

### Local Development (.env.local)
```bash
EMAIL_FROM="noreply@retirezest.com"
# or
EMAIL_FROM="support@retirezest.com"
```

### Production (Vercel)
1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add or update:
   - `EMAIL_FROM` = `noreply@retirezest.com`
5. Redeploy your application

## Step 7: Test Email Sending

After verification and updating configuration:

```bash
cd webapp
npx tsx -r dotenv/config test-email-direct.ts dotenv_config_path=.env.local
```

The email should now be sent successfully to any email address!

## Troubleshooting

### DNS Records Not Found
- **Wait longer**: DNS can take up to 48 hours (usually 5-30 minutes)
- **Check record names**: Make sure you copied them exactly
- **Check for typos**: Even a small typo will break verification

### Still Can't Send Emails
- Verify the domain shows as "Verified" in Resend dashboard
- Make sure `EMAIL_FROM` uses your verified domain
- Restart your development server after updating .env.local
- Check Resend logs: https://resend.com/emails

### Need Help?
- Resend Documentation: https://resend.com/docs/dashboard/domains/introduction
- Resend Support: https://resend.com/support

## Summary Checklist

- [ ] Log in to Resend dashboard
- [ ] Add domain `retirezest.com`
- [ ] Copy all DNS records (TXT records)
- [ ] Log in to your domain registrar
- [ ] Add all TXT records to your domain
- [ ] Wait 5-30 minutes for DNS propagation
- [ ] Click "Verify" in Resend dashboard
- [ ] Update `EMAIL_FROM` in .env.local
- [ ] Update `EMAIL_FROM` in Vercel environment variables
- [ ] Test sending email
- [ ] Deploy to production

---

**Once complete, password reset emails will be sent from `noreply@retirezest.com` to any user's email address!**
