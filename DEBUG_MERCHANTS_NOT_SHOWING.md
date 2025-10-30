# 🐛 Debug: Merchants Not Showing on Customers Page

## Issue
Merchants tab shows "(0)" and no merchant accounts are displayed, even though they were visible before.

---

## 🔍 Step-by-Step Debugging

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab

**When on Merchants tab, look for these logs:**
```javascript
🏢 Merchants Tab Active - Data: {
  merchantsData: {...},
  merchantsLoading: false/true,
  merchantsError: null/error,
  merchantsCount: 0,
  total: 0
}

🏢 Fetching merchants from /merchant-kyc/all with filters: {...}
🏢 Merchants API response: {...}
🏢 Merchants count: X
```

**What to check:**
1. **If `merchantsError` has an error** → API call failed
2. **If `merchantsData` is null/undefined** → API not responding
3. **If `total: 0`** → No merchants in database
4. **If `merchants: []`** → Query returning empty

---

### Step 2: Check Network Tab
DevTools → Network tab → Filter by "merchant"

**Look for:**
```
GET /api/merchant-kyc/all?page=1&pageSize=10
```

**Check the response:**
- Status: Should be `200 OK`
- Response body: Should have `{ merchants: [...], total: X }`

**Possible Issues:**
- **404 Not Found** → Backend endpoint doesn't exist
- **401 Unauthorized** → Permission issue
- **500 Server Error** → Backend crash
- **Empty array** → No merchants in DB

---

### Step 3: Check Backend Logs
In your `rdbs_core` backend terminal, look for:

```
GET /merchant-kyc/all +0ms
Query returned X merchants
```

**If you see errors:**
- Check database connection
- Check Merchant table exists
- Check permissions on the endpoint

---

### Step 4: Check Database Directly

```sql
-- Check if merchants exist in database
SELECT COUNT(*) as merchant_count FROM merchants;

-- Check if users have merchantCode
SELECT COUNT(*) as users_with_merchant_code FROM users WHERE "merchantCode" IS NOT NULL;

-- See actual merchant data
SELECT id, "merchantCode", "businessTradeName", "isActive", "isVerified", "userId"
FROM merchants
LIMIT 5;
```

---

## 🔧 Possible Solutions

### Solution 1: Backend Not Running
**Symptom:** Network tab shows request pending or failed

**Fix:**
```bash
cd /Users/jimntare/Documents/code/rdbs_core
npm run start:dev
# or
yarn start:dev
```

---

### Solution 2: Permission Issue
**Symptom:** 401 or 403 error in Network tab

**Check:**
- Does user have required permissions?
- Is JWT token valid?
- Check `@Roles(UserRole.USER)` decorator allows your user

**Fix:** Login again to get fresh token

---

### Solution 3: API URL Misconfigured
**Symptom:** 404 errors or CORS errors

**Check file:** `.env.local`
```bash
# Should have:
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Current default:** `http://localhost:8000` (no `/api/v1`)

**Fix:** Update API URL in env file

---

### Solution 4: No Merchants in Database
**Symptom:** Response shows `{ merchants: [], total: 0 }`

**This means:** Merchants were cleared/deleted from database

**Fix:** Re-onboard some merchants:
1. Click "+ Add Merchant" button
2. Fill out merchant onboarding form
3. Submit

---

### Solution 5: Wrong Table Being Queried
**Symptom:** Backend returns success but empty

**Check:** Backend is querying `Merchant` table (not `User` table)

**Verify query:**
```typescript
await this.prisma.merchant.findMany({...})
```

Should be looking at `merchants` table, not just `users` with `merchantCode`.

---

## 🎯 Quick Test

### Test if Endpoint Works:

**Option A: Use Browser**
```
http://localhost:8000/api/v1/merchant-kyc/all?page=1&pageSize=10
```
Paste in browser (you'll need to be logged in)

**Option B: Use curl**
```bash
# Get your JWT token from browser (DevTools → Application → Cookies → next-auth.session-token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/merchant-kyc/all?page=1&pageSize=10"
```

**Expected Response:**
```json
{
  "merchants": [...],
  "total": X,
  "page": 1,
  "pageSize": 10,
  "totalPages": Y
}
```

---

## 🔍 Debugging Checklist

- [ ] Backend (`rdbs_core`) is running
- [ ] Frontend (`rdbs_core_fn`) is running
- [ ] Browser console shows merchant fetch logs
- [ ] Network tab shows `/merchant-kyc/all` request
- [ ] Request returns 200 status
- [ ] Response has `merchants` array
- [ ] Database has merchants (check SQL)
- [ ] User has required permissions
- [ ] API_URL is correctly configured

---

## 💡 Common Causes

### 1. **Session Caching Issue**
My recent fix added session caching to `lib/axios.ts`. If the cached session is stale:

**Fix:** Hard refresh browser (`Cmd+Shift+R`) or clear cache

### 2. **React Query Cache**
Merchants might be cached with old data:

**Fix in Console:**
```javascript
// Clear React Query cache
queryClient.clear()
```

### 3. **Tab Conditional Logic**
The `useMerchants` hook has `enabled` logic based on tab:

**Current issue:** It always fetches, even when not on merchants tab

**Better approach:**
```typescript
const { data: merchantsData } = useMerchants({
  ...filters
}, {
  enabled: activeTab === 'merchants' // Only fetch when on merchants tab
})
```

---

## 🚀 Immediate Actions

1. **Open browser DevTools**
2. **Go to Customers page**
3. **Click on "Merchants" tab**
4. **Check Console for logs:**
   - Should see "🏢 Fetching merchants..."
   - Should see "🏢 Merchants API response: ..."
5. **Check Network tab:**
   - Look for `/merchant-kyc/all` request
   - Check status code and response

6. **Share the logs** with me so I can help further

---

## 📊 What the Logs Tell Us

### Scenario A: API Call Succeeds
```
🏢 Fetching merchants from /merchant-kyc/all...
🏢 Merchants API response: { merchants: [], total: 0 }
🏢 Merchants count: 0
```
**Meaning:** No merchants in database → Need to onboard merchants

### Scenario B: API Call Fails
```
🏢 Fetching merchants from /merchant-kyc/all...
❌ API Error: 404
```
**Meaning:** Backend endpoint doesn't exist → Check backend is running

### Scenario C: Permission Denied
```
🏢 Fetching merchants from /merchant-kyc/all...
❌ API Error: 403 Forbidden
```
**Meaning:** User lacks permission → Check user role/permissions

### Scenario D: No Logs at All
**Meaning:** 
- Hook not running
- Component not mounting
- JavaScript error preventing execution

---

## 📝 Next Steps

**After checking the console/network:**
1. Share what you see in the logs
2. Share the Network tab response for `/merchant-kyc/all`
3. Let me know if backend is running
4. Let me know if you recently cleared the database

Then I can provide a specific fix! 🎯

