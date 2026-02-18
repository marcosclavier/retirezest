# 🚀 ACTION ITEMS FOR PRODUCTION DEPLOYMENT

## ✅ Completed:
1. **Fixed Railway Python deployment** - Now using Docker
2. **Fixed Vercel Next.js detection** - Added vercel.json
3. **Added environment detection to Python API**
4. **Implemented strict CORS configuration**
5. **Created validation script**
6. **Pushed all changes to GitHub**

---

## 🔴 URGENT: Manual Actions Required

### 1. Railway Dashboard - Set Environment Variable
**Go to Railway Dashboard → astonishing-learning service → Variables**

Add this variable:
```
ENVIRONMENT=production
```

This is CRITICAL for security - without this, the API will accept requests from localhost!

### 2. Vercel Dashboard - Set Production Variables
**Go to Vercel Dashboard → Settings → Environment Variables**

For **Production** environment, set:
```
NODE_ENV=production
DATABASE_URL=[Your PostgreSQL connection string with SSL]
JWT_SECRET=[Your 32+ character secret]
PYTHON_API_URL=https://astonishing-learning-production.up.railway.app
NEXT_PUBLIC_API_URL=https://www.retirezest.com
```

Optional but recommended:
```
RESEND_API_KEY=[Your Resend API key]
EMAIL_FROM=noreply@retirezest.com
```

### 3. Trigger New Deployments
After setting variables:
1. **Railway**: Should auto-deploy when variable is added
2. **Vercel**: Trigger a new production deployment

---

## 🧪 Validation Steps

### Step 1: Verify Railway API (wait 2 minutes after setting ENVIRONMENT)
```bash
curl https://astonishing-learning-production.up.railway.app/api/health
```

Should return:
```json
{
  "environment": "production",  // ← MUST say "production"
  "status": "ok",
  "ready": true
}
```

### Step 2: Test CORS Security
```bash
# This should FAIL (no access-control-allow-origin header)
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  https://astonishing-learning-production.up.railway.app/api/health
```

### Step 3: Run Validation Script
```bash
cd webapp
NODE_ENV=production ./scripts/validate-deployment.sh
```

All checks should pass ✅

### Step 4: Test End-to-End Flow
1. Go to https://www.retirezest.com
2. Create a test account
3. Add profile with pension data:
   - CPP/QPP amounts
   - OAS amounts
   - Start ages
4. Run a simulation
5. Verify:
   - Simulation completes without errors
   - Pension income appears in results
   - Withdrawal strategies include pension

---

## 🚨 Security Checklist

- [ ] Railway ENVIRONMENT=production is set
- [ ] CORS rejects localhost in production
- [ ] JWT_SECRET is unique and 32+ chars
- [ ] DATABASE_URL uses SSL (sslmode=require)
- [ ] No secrets in code or logs

---

## 📊 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Railway API | ✅ Deployed | https://astonishing-learning-production.up.railway.app |
| | ⚠️ Needs ENVIRONMENT var | |
| Vercel Frontend | ✅ Deployed | https://www.retirezest.com |
| | ⚠️ Needs env vars | |

---

## 🆘 Troubleshooting

**If Railway health check shows "environment": "development":**
- ENVIRONMENT variable not set in Railway
- Wait 2 minutes after setting for deployment

**If Vercel can't connect to Python API:**
- Check PYTHON_API_URL is set correctly
- Verify Railway is running
- Check CORS configuration

**If pension calculations don't work:**
- Check browser console for API errors
- Verify all environment variables
- Check Railway logs for errors

---

## 📝 Notes

The strict validation script provided requires:
1. ✅ No localhost access in production (implemented)
2. ✅ Environment detection (implemented)
3. ⚠️ Environment variables (needs manual setup)
4. ⚠️ End-to-end testing (needs manual testing)

Once you complete the manual steps above, the deployment will be fully secure and production-ready!