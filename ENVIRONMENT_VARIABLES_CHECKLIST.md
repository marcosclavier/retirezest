# Environment Variables Configuration Checklist

## Railway (Python API) - Production
**Service**: astonishing-learning-production

### Required Variables:
- [ ] **ENVIRONMENT** = `production`
  - Critical for CORS configuration
  - Must be set to "production" for production deployment
- [ ] **PORT** = `$PORT` (Railway provides this automatically)

### Deployment URL:
- Production: https://astonishing-learning-production.up.railway.app

---

## Vercel (Next.js Frontend) - Production

### Required Variables:
- [ ] **NODE_ENV** = `production`
- [ ] **DATABASE_URL** = PostgreSQL connection string with SSL
  - Format: `postgresql://user:password@host:5432/database?sslmode=require`
- [ ] **JWT_SECRET** = 32+ character secret key
- [ ] **PYTHON_API_URL** = `https://astonishing-learning-production.up.railway.app`
  - Used by server-side API routes to call Python backend
- [ ] **NEXT_PUBLIC_API_URL** = `https://www.retirezest.com`
  - Used by client-side code (if any)

### Optional but Recommended:
- [ ] **RESEND_API_KEY** = Your Resend API key (for email functionality)
- [ ] **EMAIL_FROM** = noreply@retirezest.com
- [ ] **SENTRY_DSN** = Your Sentry DSN (for error tracking)
- [ ] **RATE_LIMIT_MAX** = 100
- [ ] **RATE_LIMIT_WINDOW** = 60000

---

## Vercel (Next.js Frontend) - Development/Preview

### Required Variables:
- [ ] **NODE_ENV** = `development`
- [ ] **DATABASE_URL** = Development PostgreSQL connection
- [ ] **JWT_SECRET** = Development secret (still 32+ chars)
- [ ] **PYTHON_API_URL** = `http://localhost:8000` or preview Railway URL
- [ ] **NEXT_PUBLIC_API_URL** = Preview URL or `http://localhost:3000`

---

## Critical Security Notes:

1. **NEVER** expose production secrets in:
   - Code files
   - Git commits
   - Log outputs
   - Error messages

2. **CORS Configuration**:
   - Production Python API should ONLY allow:
     - https://www.retirezest.com
     - https://retirezest.com
   - Development can allow:
     - localhost:*
     - Vercel preview URLs

3. **Environment Separation**:
   - Production MUST NOT accept requests from localhost
   - Development MUST NOT connect to production database
   - Each environment should have separate:
     - Database
     - JWT secrets
     - API keys

---

## Validation Steps:

1. **After Setting Variables in Railway:**
   ```bash
   curl https://astonishing-learning-production.up.railway.app/api/health
   ```
   Should show: `"environment": "production"`

2. **After Setting Variables in Vercel:**
   - Trigger a new deployment
   - Check /api/health endpoint
   - Verify it can reach Python API

3. **Run Validation Script:**
   ```bash
   cd webapp
   NODE_ENV=production ./scripts/validate-deployment.sh
   ```

4. **Test Pension Flow:**
   - Create test account
   - Add pension data
   - Run simulation
   - Verify pension calculations

---

## Common Issues:

### Railway not detecting Python:
- Solution: Using Dockerfile deployment

### Vercel not finding Next.js:
- Solution: vercel.json with rootDirectory: "webapp"

### CORS errors in production:
- Check ENVIRONMENT variable in Railway
- Verify domain in CORS whitelist

### API connection failures:
- Check PYTHON_API_URL in Vercel
- Verify Railway service is running
- Check CORS configuration