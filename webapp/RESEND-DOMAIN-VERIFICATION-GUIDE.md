# Resend Domain Verification Guide

## Step-by-Step Guide to Verify retirezest.com in Resend

### Step 1: Access Resend Domains Dashboard

1. Go to https://resend.com/login
2. Log in with your Resend account credentials
3. Navigate to **Domains** in the left sidebar (or go directly to https://resend.com/domains)

### Step 2: Add Your Domain

1. Click the **"Add Domain"** button
2. Enter your domain: `retirezest.com`
3. Click **"Add"** or **"Continue"**

### Step 3: Get DNS Records from Resend

After adding the domain, Resend will show you DNS records that need to be added to your domain. You'll typically see:

#### Required DNS Records:

**1. SPF Record (TXT Record)**
- **Type:** TXT
- **Name:** `@` or `retirezest.com`
- **Value:** Something like `v=spf1 include:_spf.resend.com ~all`

**2. DKIM Record (TXT Record)**
- **Type:** TXT
- **Name:** `resend._domainkey` or similar
- **Value:** A long string starting with `v=DKIM1; k=rsa; p=...`

**3. DMARC Record (TXT Record) - Optional but Recommended**
- **Type:** TXT
- **Name:** `_dmarc`
- **Value:** `v=DMARC1; p=none; rfo=afrf; pct=100; ri=86400`

### Step 4: Add DNS Records to Your Domain Registrar

You need to add these DNS records where you manage your domain. Common registrars:

#### If using **Namecheap**:
1. Go to https://www.namecheap.com/myaccount/login/
2. Click **Domain List**
3. Find `retirezest.com` and click **Manage**
4. Go to **Advanced DNS** tab
5. Click **Add New Record** for each DNS record
6. Fill in:
   - **Type:** TXT
   - **Host:** (the "Name" from Resend, e.g., `@`, `resend._domainkey`, `_dmarc`)
   - **Value:** (the "Value" from Resend)
   - **TTL:** Automatic or 300 seconds
7. Click the checkmark to save

#### If using **GoDaddy**:
1. Go to https://dcc.godaddy.com/manage/
2. Find `retirezest.com` and click **DNS**
3. Scroll to **Records** section
4. Click **Add Record**
5. Fill in:
   - **Type:** TXT
   - **Name:** (the "Name" from Resend)
   - **Value:** (the "Value" from Resend)
   - **TTL:** 600 seconds (default)
6. Click **Save**

#### If using **Cloudflare**:
1. Go to https://dash.cloudflare.com/
2. Select your domain `retirezest.com`
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Fill in:
   - **Type:** TXT
   - **Name:** (the "Name" from Resend, e.g., `@`, `resend._domainkey`, `_dmarc`)
   - **Content:** (the "Value" from Resend)
   - **TTL:** Auto
6. Click **Save**

#### If using **Google Domains** (now Squarespace):
1. Go to https://domains.google.com/registrar/
2. Click on `retirezest.com`
3. Go to **DNS** tab
4. Scroll to **Custom records**
5. Click **Manage custom records**
6. Click **Create new record**
7. Fill in:
   - **Host name:** (the "Name" from Resend, e.g., leave blank for `@`, or enter `resend._domainkey`, `_dmarc`)
   - **Type:** TXT
   - **TTL:** 3600 (default)
   - **Data:** (the "Value" from Resend)
8. Click **Save**

### Step 5: Verify in Resend

1. Go back to Resend Domains page (https://resend.com/domains)
2. Find your domain `retirezest.com`
3. Click **"Verify"** or **"Check DNS"** button
4. Resend will check if the DNS records are properly configured

**Note:** DNS propagation can take anywhere from **5 minutes to 48 hours**, but typically happens within **15-30 minutes**.

If verification fails:
- Wait 15-30 minutes and try again
- Double-check that you copied the DNS records exactly as shown
- Make sure there are no extra spaces or characters
- Check that you added the records to the correct domain

### Step 6: Update Environment Variables

Once the domain is verified:

1. Open `.env.local` in your project
2. Update the `EMAIL_FROM` variable:
   ```
   EMAIL_FROM="noreply@retirezest.com"
   ```
3. Commit and push to production
4. Restart your application (Vercel will auto-deploy)

### Step 7: Test Email Sending

After domain verification and deployment:

1. Go to https://retirezest.com/forgot-password
2. Enter any user's email (e.g., `jrcb@hotmail.com`)
3. Click "Send Reset Link"
4. Check the user's inbox for the password reset email

## Troubleshooting

### DNS Records Not Detected

**Problem:** Resend says it can't find the DNS records

**Solutions:**
1. Wait longer (up to 48 hours for full propagation)
2. Use an online DNS checker: https://dnschecker.org/
   - Enter your domain and select TXT records
   - Check if the records are visible globally
3. Clear your browser cache and try verifying again
4. Contact your domain registrar's support if records don't appear after 48 hours

### Wrong DNS Record Format

**Problem:** Verification fails due to format issues

**Solutions:**
1. Make sure you copied the entire value (some are very long)
2. Remove any quotes if your registrar adds them automatically
3. For the hostname/name field:
   - `@` means the root domain (retirezest.com)
   - `resend._domainkey` is a subdomain
   - Some registrars want just `resend._domainkey`, others want `resend._domainkey.retirezest.com`

### Still Getting "Domain Not Verified" Error

**Problem:** You verified the domain but still getting errors

**Solutions:**
1. Make sure you updated the `EMAIL_FROM` in `.env.local`
2. Restart your development server or redeploy to production
3. Check Resend dashboard shows domain status as "Verified" (green checkmark)
4. Wait a few minutes after verification for Resend's systems to update

## Current Status

- **Resend API Key:** ✅ Configured
- **Domain:** ❌ Not verified yet (using test domain `onboarding@resend.dev`)
- **Email Sending:** ✅ Works for `marcos.clavier33@gmail.com` only
- **Production Ready:** ⏸️ Waiting for domain verification

## After Verification

Once verified, password reset emails will work for:
- ✅ All registered users
- ✅ Any email address
- ✅ From `noreply@retirezest.com` (professional branded email)

---

**Need Help?**
- Resend Documentation: https://resend.com/docs/dashboard/domains/introduction
- Resend Support: https://resend.com/support
