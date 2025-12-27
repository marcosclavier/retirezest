# Cloudflare & Domain Setup Guide for retirezest.com

## Current Status: ⏳ Waiting for DNS Propagation

**Nameservers configured:**
- fay.ns.cloudflare.com
- vick.ns.cloudflare.com

**Propagation status:** Not yet active (can take 24-48 hours)

Check status: https://www.whatsmydns.net/#NS/retirezest.com

---

## Step 1: Wait for Cloudflare Activation ⏳

### How to Check:
1. Go to https://dash.cloudflare.com
2. Look for `retirezest.com`
3. Wait for status to change from "Pending Nameserver Update" to "✅ Active"
4. Cloudflare will send you an email when ready

**Current nameservers (old - Namecheap):**
- dns1.registrar-servers.com
- dns2.registrar-servers.com

**Target nameservers (new - Cloudflare):**
- fay.ns.cloudflare.com ✅
- vick.ns.cloudflare.com ✅

---

## Step 2: Configure DNS Records in Cloudflare

**Once Cloudflare is active**, add these DNS records:

### Go to: Cloudflare Dashboard → retirezest.com → DNS → Records

### Add These Records:

#### 1. Root Domain (@)
```
Type: A
Name: @ (or retirezest.com)
IPv4 address: 76.76.21.21
Proxy status: ✅ Proxied (orange cloud icon)
TTL: Auto
```

#### 2. WWW Subdomain
```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy status: ✅ Proxied (orange cloud icon)
TTL: Auto
```

#### 3. (Optional) App Subdomain
If you want to use `app.retirezest.com`:
```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy status: ✅ Proxied (orange cloud icon)
TTL: Auto
```

**Screenshot for reference:**
The Proxy status should show an orange cloud (proxied through Cloudflare).

---

## Step 3: Configure SSL/TLS Settings

### Go to: Cloudflare Dashboard → SSL/TLS

1. **SSL/TLS encryption mode:** Full (strict)
   - This ensures end-to-end encryption between Cloudflare and Vercel

2. **Edge Certificates:**
   - ✅ Always Use HTTPS: ON
   - ✅ Automatic HTTPS Rewrites: ON
   - Minimum TLS Version: 1.2 (recommended)

---

## Step 4: Add Domain to Vercel

### Go to: https://vercel.com/your-project/settings/domains

1. Click "Add Domain"
2. Enter: `retirezest.com`
3. Click "Add"
4. Vercel will verify DNS records (may take a few minutes)

5. Repeat for `www.retirezest.com`:
   - Click "Add Domain"
   - Enter: `www.retirezest.com`
   - Click "Add"

**Vercel will show:**
- ✅ Valid Configuration (once DNS records are detected)

**Note:** Make sure to set one as the primary domain (usually the root domain `retirezest.com`).

---

## Step 5: Update Environment Variables

### Update Production Environment Variables in Vercel:

Go to: Vercel → Your Project → Settings → Environment Variables

Add/Update these variables for **Production**:

```env
# Application URL
NEXT_PUBLIC_APP_URL="https://retirezest.com"

# Database (use your production Neon database)
DATABASE_URL="postgresql://neondb_owner:npg_KEgfJlvIM27u@ep-muddy-band-adte7s70.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT Secret (generate new one for production)
JWT_SECRET="<generate-new-secret-with-openssl-rand-base64-32>"

# Email (Resend)
RESEND_API_KEY="re_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A"
EMAIL_FROM="noreply@retirezest.com"

# Cloudflare Turnstile (production keys - see Step 6)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="<your-production-site-key>"
TURNSTILE_SECRET_KEY="<your-production-secret-key>"

# Sentry (optional - for error monitoring)
SENTRY_DSN="<your-sentry-dsn>"
NEXT_PUBLIC_SENTRY_DSN="<your-sentry-dsn>"
```

**Important:** After updating environment variables, redeploy your app!

---

## Step 6: Configure Production Cloudflare Turnstile

### Create Production Turnstile Site:

1. Go to: https://dash.cloudflare.com
2. Navigate to: Turnstile
3. Click "Add Site"

**Configuration:**
- **Site name:** RetireZest Production
- **Domain:** `retirezest.com`
- **Widget Mode:** Managed
- **Pre-Clearance:** Optional

4. Click "Create"
5. Copy the **Site Key** and **Secret Key**

### Update Vercel Environment Variables:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-production-site-key-here"
TURNSTILE_SECRET_KEY="your-production-secret-key-here"
```

### Update Local .env.local (for reference):

Keep test keys for local development:
```env
# Local development uses test keys
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

---

## Step 7: Configure Email Domain (Resend)

To send emails from `noreply@retirezest.com`:

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `retirezest.com`
4. Add the required DNS records to Cloudflare:

**DNS Records to add in Cloudflare:**
Resend will provide these (example format):
```
Type: TXT
Name: @ (or retirezest.com)
Value: resend-verification=<verification-code>

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none

Type: TXT
Name: @ (or retirezest.com)
Value: v=spf1 include:_spf.resend.com ~all

Type: CNAME
Name: resend._domainkey
Value: <provided-by-resend>
```

5. Verify domain in Resend dashboard

---

## Step 8: Recommended Cloudflare Settings

### Speed → Optimization
- ✅ Auto Minify: JavaScript, CSS, HTML
- ✅ Brotli: ON
- ✅ Early Hints: ON

### Caching → Configuration
- Caching Level: Standard
- Browser Cache TTL: Respect Existing Headers

### Security → Settings
- Security Level: Medium
- Bot Fight Mode: ON (optional)
- Challenge Passage: 30 minutes

### Security → WAF (Web Application Firewall)
- Enable managed rules (free plan has basic rules)

---

## Step 9: Test Your Deployment

After everything is configured:

1. **Test DNS Resolution:**
   ```bash
   nslookup retirezest.com
   # Should show Cloudflare IPs
   ```

2. **Test SSL:**
   ```bash
   curl -I https://retirezest.com
   # Should return 200 OK with SSL
   ```

3. **Test Application:**
   - Visit: https://retirezest.com
   - Try registration/login
   - Verify Turnstile is working
   - Check email functionality (password reset)

---

## Troubleshooting

### DNS Not Resolving
- Wait longer (up to 48 hours for full propagation)
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Check: https://www.whatsmydns.net/#A/retirezest.com

### SSL Certificate Error
- Make sure SSL/TLS mode is "Full (strict)" in Cloudflare
- Vercel automatically provisions SSL certificates (can take a few minutes)

### Turnstile Not Working
- Verify site key and secret key are correct
- Check domain matches in Turnstile dashboard
- Clear browser cache

### Email Not Sending
- Verify Resend domain is verified
- Check DNS records are correct
- Test with Resend's testing tools

---

## Quick Command Reference

### Check DNS Propagation:
```bash
# Check nameservers
nslookup -type=NS retirezest.com

# Check A record
nslookup retirezest.com

# Check global propagation
# Visit: https://www.whatsmydns.net/#NS/retirezest.com
```

### Test SSL:
```bash
curl -I https://retirezest.com
```

### Generate JWT Secret:
```bash
openssl rand -base64 32
```

---

## Timeline

- **Now:** ⏳ Waiting for nameserver propagation (24-48 hours)
- **After propagation:** Configure DNS records in Cloudflare (5 minutes)
- **After DNS:** Add domain to Vercel (5 minutes)
- **After Vercel:** Update environment variables (10 minutes)
- **After env vars:** Configure Turnstile (5 minutes)
- **After Turnstile:** Set up email domain (10 minutes)
- **After email:** Test deployment (10 minutes)

**Total estimated time after propagation:** ~45 minutes

---

## Support Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Resend Dashboard:** https://resend.com/overview
- **Check DNS Propagation:** https://www.whatsmydns.net

---

## Checklist

Use this checklist to track your progress:

- [x] Update Namecheap nameservers to Cloudflare
- [ ] Wait for Cloudflare activation (24-48 hours)
- [ ] Configure DNS records in Cloudflare (A, CNAME)
- [ ] Set SSL/TLS to "Full (strict)"
- [ ] Add retirezest.com to Vercel
- [ ] Add www.retirezest.com to Vercel
- [ ] Update production environment variables
- [ ] Create production Turnstile site
- [ ] Update Turnstile keys in Vercel
- [ ] Configure Resend email domain
- [ ] Add Resend DNS records
- [ ] Test deployment
- [ ] Test registration/login
- [ ] Test email functionality

---

**Last Updated:** December 27, 2025
