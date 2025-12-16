# Resend Domain Verification with Vercel - Step by Step

Your domain `retirezest.com` is hosted on Vercel. Follow these exact steps:

---

## Part 1: Get DNS Records from Resend (5 minutes)

### Step 1.1: Add Domain to Resend

1. **Open this link:** https://resend.com/domains
2. Click the **"Add Domain"** button (top right)
3. Enter: `retirezest.com`
4. Click **"Add"** or **"Continue"**

### Step 1.2: Copy DNS Records

Resend will show you **3 TXT records**. You'll see something like:

**Record 1 - SPF:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**Record 2 - DKIM:**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3... (very long string starting with p=)
```

**Record 3 - DMARC (optional but recommended):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

**⚠️ KEEP THIS RESEND PAGE OPEN!** You'll need to copy these exact values.

---

## Part 2: Add DNS Records to Vercel (10 minutes)

### Step 2.1: Open Vercel DNS Settings

1. **Go to:** https://vercel.com
2. Click on your project (probably called "webapp" or "retirezest")
3. Click **"Settings"** (top navigation)
4. Click **"Domains"** (left sidebar)
5. Find `retirezest.com` in the list
6. Click on `retirezest.com` to expand it

### Step 2.2: Access DNS Records

Look for one of these options:
- **"Edit DNS Records"** button
- **"DNS"** tab
- **"Manage DNS"** link

Click it to see the DNS records interface.

### Step 2.3: Add Record 1 - SPF

1. Click **"Add"** or **"Add Record"**
2. Fill in:
   - **Type:** `TXT`
   - **Name:** `@` (or leave blank if @ doesn't work)
   - **Value:** `v=spf1 include:_spf.resend.com ~all`
   - **TTL:** Leave default (or 3600)
3. Click **"Save"**

### Step 2.4: Add Record 2 - DKIM

1. Click **"Add"** or **"Add Record"** again
2. Fill in:
   - **Type:** `TXT`
   - **Name:** `resend._domainkey`
   - **Value:** (Copy the LONG string from Resend that starts with `p=`)
   - **TTL:** Leave default (or 3600)
3. Click **"Save"**

### Step 2.5: Add Record 3 - DMARC

1. Click **"Add"** or **"Add Record"** again
2. Fill in:
   - **Type:** `TXT`
   - **Name:** `_dmarc`
   - **Value:** `v=DMARC1; p=none;`
   - **TTL:** Leave default (or 3600)
3. Click **"Save"**

---

## Part 3: Verify Domain in Resend (5-30 minutes)

### Step 3.1: Wait for DNS Propagation

- **Minimum wait:** 5 minutes
- **Typical wait:** 10-15 minutes
- **Maximum wait:** Up to 2 hours (rare)

### Step 3.2: Verify in Resend

1. Go back to: https://resend.com/domains
2. Find `retirezest.com` in your domains list
3. Click **"Verify"** or **"Check DNS"**
4. You should see: ✅ **Status: Verified**

**If it says "Pending" or "Not Verified":**
- Wait another 10 minutes
- Click "Verify" again
- Check that you copied the DNS records exactly

---

## Part 4: Update Email Configuration (2 minutes)

### Step 4.1: Update Local Environment

Open the file: `/Users/jrcb/Documents/GitHub/retirezest/webapp/.env.local`

Change this line:
```bash
EMAIL_FROM="onboarding@resend.dev"
```

To:
```bash
EMAIL_FROM="noreply@retirezest.com"
```

Save the file.

### Step 4.2: Update Vercel Environment Variables

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Look for `EMAIL_FROM`
   - If it exists, click "Edit"
   - If not, click "Add New"
4. Set:
   - **Name:** `EMAIL_FROM`
   - **Value:** `noreply@retirezest.com`
   - **Environment:** Select **"Production"** (and Preview if you want)
5. Click **"Save"**

### Step 4.3: Redeploy

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Click **"Redeploy"** button
4. Wait for deployment to complete (~2 minutes)

---

## Part 5: Test Email Sending ✅

### Test Locally

```bash
cd /Users/jrcb/Documents/GitHub/retirezest/webapp
npx tsx -r dotenv/config test-email-direct.ts dotenv_config_path=.env.local
```

**Expected output:**
```
✅ SUCCESS! Email sent!
```

### Test on Production (retirezest.com)

1. Go to: https://retirezest.com/forgot-password
2. Enter: `jrcb@hotmail.com`
3. Click "Send Reset Link"
4. Check your email (and spam folder)

You should receive a beautiful password reset email from `noreply@retirezest.com`!

---

## Quick Reference Checklist

- [ ] 1. Add `retirezest.com` to Resend: https://resend.com/domains
- [ ] 2. Copy the 3 DNS records (SPF, DKIM, DMARC)
- [ ] 3. Open Vercel → Settings → Domains
- [ ] 4. Click on `retirezest.com` → Manage DNS
- [ ] 5. Add TXT record: `@` with SPF value
- [ ] 6. Add TXT record: `resend._domainkey` with DKIM value
- [ ] 7. Add TXT record: `_dmarc` with DMARC value
- [ ] 8. Wait 10 minutes
- [ ] 9. Verify domain in Resend (should show ✅ Verified)
- [ ] 10. Update `EMAIL_FROM` in `.env.local`
- [ ] 11. Update `EMAIL_FROM` in Vercel environment variables
- [ ] 12. Redeploy on Vercel
- [ ] 13. Test on https://retirezest.com/forgot-password

---

## Troubleshooting

### "Domain not verified" after 30 minutes

Check DNS records are live:
1. Go to: https://dnschecker.org
2. Select "TXT" type
3. Enter: `retirezest.com`
4. Look for records containing "resend"

### Can't find DNS settings in Vercel

Your domain might be managed externally. Check:
1. Vercel → Settings → Domains
2. Look for "DNS" or "Nameservers" info
3. If nameservers point elsewhere, add records there instead

### Still can't send emails after verification

1. Make sure domain shows "Verified" in Resend
2. Confirm `EMAIL_FROM` uses `@retirezest.com`
3. Check Vercel logs for errors
4. Restart your local dev server

---

**Once complete, password reset emails will work for ALL users! 🎉**
