# Fixed: Life Expectancy Validation Issue

## Problem
Simulations were failing with validation error: "End age must be between 85 and 100" when users set life expectancy to 80.

## Root Cause
The `.env.local` file had environment variables pointing to the production Railway server instead of localhost:
- `PYTHON_API_URL=https://retirezest-production.up.railway.app` (OLD)
- `NEXT_PUBLIC_PYTHON_API_URL=https://adequate-prosperity-production.up.railway.app` (OLD)

This meant:
- Browser requests → Next.js → Production Railway server (with old validation rules)
- Direct API tests → localhost:8000 (with updated validation rules)

## Solution
1. Updated `.env.local` to use localhost:
   - `PYTHON_API_URL=http://localhost:8000`
   - `NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000`

2. Confirmed validation rules in both frontend and backend allow end_age from 70-100:
   - `/webapp/python-api/api/models/requests.py`: `end_age: int = Field(default=95, ge=70, le=100, ...)`
   - `/webapp/lib/validation/simulation-validation.ts`: Allows `minEndAge` of 70 or start_age + 5

3. Restarted Python API server at localhost:8000

## Testing
- Direct API test with life expectancy 80: ✅ SUCCESS
- Browser should now work with life expectancy 70-100

## Next Steps for User
1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. Try running a simulation with life expectancy 80
3. It should work now!

## Important Note
When deploying to production, you'll need to update the Railway server's Python code to match these validation changes.