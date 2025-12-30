# Production Quick-Start Testing Guide

## Automated Browser Console Test

### Step 1: Login to Production
1. Open https://www.retirezest.com/login in your browser
2. Login with:
   - Email: juanclavierb@gmail.com
   - Password: andres2026

### Step 2: Navigate to Quick-Start
After logging in, open browser console (F12) and run:

```javascript
// Navigate to quick-start page
window.location.href = '/quick-start';
```

### Step 3: Verify Form Fields (Visual Check)

Once on the quick-start page, verify these fields are present:

**✅ Checklist:**
- [ ] Field 1: "How old are you?" (number input)
- [ ] Field 2: "What's your marital status?" (dropdown) ⭐ **NEW**
- [ ] Field 3: "When do you want to retire?" (dropdown)
- [ ] Field 4: "How much have you saved?" (optional)
- [ ] Field 5: "What's your monthly income?" (optional)

**Test Partner Toggle:**
1. Select "Married" from marital status dropdown
2. [ ] Blue box should appear with "Plan together with your partner?" checkbox ⭐ **NEW**
3. Select "Single"
4. [ ] Blue box should disappear

### Step 4: Auto-Fill and Submit Test

Run this in browser console to auto-fill the form:

```javascript
// Auto-fill the quick-start form
document.querySelector('#age').value = '45';

// Select marital status (Married)
const maritalStatusSelect = document.querySelector('#maritalStatus');
maritalStatusSelect.value = 'married';
maritalStatusSelect.dispatchEvent(new Event('change', { bubbles: true }));

// Wait for partner toggle to appear, then check it
setTimeout(() => {
  const partnerCheckbox = document.querySelector('#includePartner');
  if (partnerCheckbox) {
    partnerCheckbox.checked = true;
    partnerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Partner toggle checked');
  } else {
    console.error('❌ Partner toggle not found!');
  }
}, 500);

// Select retirement age
const retirementSelect = document.querySelector('#retirementAge');
retirementSelect.value = '65';

// Fill savings
document.querySelector('#savings').value = '100000';

// Fill income
document.querySelector('#income').value = '5000';

console.log('✅ Form auto-filled. Review the form and click "Show Me My Retirement Plan"');
```

### Step 5: Manual Submit
**Click the "Show Me My Retirement Plan" button**

Expected behavior:
- [ ] No errors in console
- [ ] Redirects to `/simulation` page
- [ ] Simulation loads successfully

### Step 6: Verify Data Saved

Navigate to profile to verify marital status:

```javascript
// Navigate to profile page
window.location.href = '/profile';
```

On the profile page, check:
- [ ] Marital status shows "Married"
- [ ] Partner planning is enabled

---

## Manual Testing Alternative

If you prefer manual testing:

1. **Login:** https://www.retirezest.com/login
2. **Go to Quick-Start:** Click dashboard, it should auto-redirect to `/quick-start` if `hasSeenWelcome` is false
3. **Fill Form Manually:**
   - Age: 45
   - Marital Status: Married ⭐
   - Partner: Checked ⭐
   - Retirement: 65
   - Savings: 100000
   - Income: 5000
4. **Submit:** Click "Show Me My Retirement Plan"
5. **Verify:** Should redirect to simulation

---

## What to Look For

### ✅ Success Indicators:
- Marital status dropdown appears with 5 options
- Partner toggle appears for married/common law
- Form submits without errors
- Redirects to /simulation
- Data saves to profile

### ❌ Failure Indicators:
- Marital status field missing
- Partner toggle doesn't appear/disappear correctly
- Console errors during submit
- Form doesn't redirect after submit
- Data doesn't save to database

---

## Quick Database Check

If you want to verify the data directly in the database:

```bash
# SSH into your database or run this query
SELECT email, "maritalStatus", "includePartner", "hasSeenWelcome"
FROM "User"
WHERE email = 'juanclavierb@gmail.com';
```

Expected result:
- maritalStatus: "married"
- includePartner: true
- hasSeenWelcome: true
