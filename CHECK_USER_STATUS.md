# 🔍 How to Check User Status

If you can't find a user in either Subscribers or Merchants tab, follow these steps:

## Step 1: Check Database Directly

### **Option A: Check Users Table**
```sql
-- Find user by phone
SELECT 
  id,
  phone,
  email,
  "userType",
  "subscriberType",
  "merchantCode",
  status,
  "isVerified"
FROM "users"
WHERE phone = '+256YOUR_PHONE_NUMBER';

-- Or by name
SELECT 
  u.id,
  u.phone,
  u.email,
  u."userType",
  u."subscriberType",
  u."merchantCode",
  u.status,
  p."firstName",
  p."lastName"
FROM "users" u
LEFT JOIN "profiles" p ON u.id = p."userId"
WHERE p."firstName" ILIKE '%SEARCH_NAME%'
   OR p."lastName" ILIKE '%SEARCH_NAME%';
```

### **Option B: Check Merchants Table**
```sql
-- Find merchant by business name or owner name
SELECT 
  m.id as "merchantId",
  m."merchantCode",
  m."businessTradeName",
  m."ownerFirstName",
  m."ownerLastName",
  m."isActive",
  m."isVerified",
  u.phone,
  u.email,
  u."merchantCode" as "userMerchantCode"
FROM "merchants" m
JOIN "users" u ON m."userId" = u.id
WHERE m."businessTradeName" ILIKE '%BUSINESS_NAME%'
   OR m."ownerFirstName" ILIKE '%OWNER_NAME%'
   OR m."ownerLastName" ILIKE '%OWNER_NAME%';
```

---

## Step 2: Common Issues & Solutions

### **Issue 1: User Not Showing in Subscribers Tab**

**Possible Causes:**
1. ❌ User has `merchantCode` (merchants excluded from subscribers)
2. ❌ User is `userType: 'STAFF'` (staff excluded)
3. ❌ Search term doesn't match their data
4. ❌ User doesn't exist

**Check:**
```sql
SELECT 
  u.id,
  u.phone,
  u."userType",
  u."subscriberType",
  u."merchantCode",
  u.status,
  p."firstName",
  p."lastName"
FROM "users" u
LEFT JOIN "profiles" p ON u.id = p."userId"
WHERE u.phone = '+256YOUR_PHONE';
```

**If they have `merchantCode`:**
- They will appear in Merchants tab, NOT Subscribers tab
- To move them back to Subscribers: `UPDATE "users" SET "merchantCode" = NULL WHERE phone = '+256YOUR_PHONE';`

---

### **Issue 2: User Not Showing in Merchants Tab**

**Possible Causes:**
1. ❌ User doesn't have `merchantCode`
2. ❌ Merchant record doesn't exist
3. ❌ Merchant record has `isActive: false`
4. ❌ Search term doesn't match business name

**Check:**
```sql
-- Check if merchant record exists
SELECT 
  u.id as "userId",
  u.phone,
  u."merchantCode",
  m.id as "merchantId",
  m."businessTradeName",
  m."isActive",
  m."isVerified"
FROM "users" u
LEFT JOIN "merchants" m ON u.id = m."userId"
WHERE u.phone = '+256YOUR_PHONE';
```

**Fixes:**

**If `merchantCode` is NULL but merchant record exists:**
```sql
-- Add merchantCode back
UPDATE "users" u
SET "merchantCode" = m."merchantCode"
FROM "merchants" m
WHERE u.id = m."userId" AND u."merchantCode" IS NULL;
```

**If merchant record has `isActive: false`:**
```sql
-- Reactivate merchant
UPDATE "merchants"
SET "isActive" = true
WHERE "userId" = 'user-id-here';
```

---

### **Issue 3: User Was Deleted**

**Check if user exists:**
```sql
SELECT COUNT(*) FROM "users" WHERE phone = '+256YOUR_PHONE';
```

**If count = 0:** User was deleted from database

**Check deleted merchant records:**
```sql
-- Find orphaned merchant records
SELECT 
  m.id,
  m."merchantCode",
  m."businessTradeName",
  m."userId",
  m."isActive"
FROM "merchants" m
LEFT JOIN "users" u ON m."userId" = u.id
WHERE u.id IS NULL;
```

---

## Step 3: Fix Specific Scenarios

### **Scenario A: User was a merchant, merchant deleted, can't find user**

**Problem:** `merchantCode` still set, but merchant record gone

**Fix:**
```sql
-- Clear merchantCode for users without merchant records
UPDATE "users" u
SET "merchantCode" = NULL
WHERE u."merchantCode" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "merchants" m 
    WHERE m."userId" = u.id AND m."isActive" = true
  );
```

---

### **Scenario B: Merchant exists but not showing**

**Check API Response:**
```bash
# Check what merchants API returns
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-api.com/merchant-kyc/all?search=SEARCH_TERM"
```

**Check Frontend Network Tab:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Search for "merchant-kyc"
4. Check the response

---

### **Scenario C: Search not working**

**Subscribers Tab Searches:**
- `firstName` (from profile)
- `lastName` (from profile)
- `email`
- `phone`

**Merchants Tab Searches (backend):**
- `businessTradeName`
- `registeredBusinessName`
- `businessEmail`
- `registeredPhoneNumber`
- `merchantCode`
- `ownerFirstName`
- `ownerLastName`
- `certificateOfIncorporation`
- `taxIdentificationNumber`

**Note:** If you search for a business name on Subscribers tab, it won't find them!

---

## Step 4: Quick Diagnostic Queries

### **Find ALL subscribers (excluding merchants and staff):**
```sql
SELECT 
  u.id,
  u.phone,
  u.email,
  u."merchantCode",
  p."firstName",
  p."lastName"
FROM "users" u
LEFT JOIN "profiles" p ON u.id = p."userId"
WHERE u."userType" = 'SUBSCRIBER'
  AND u."subscriberType" = 'INDIVIDUAL'
  AND u."merchantCode" IS NULL
ORDER BY u."createdAt" DESC
LIMIT 20;
```

### **Find ALL merchants:**
```sql
SELECT 
  m."businessTradeName",
  m."ownerFirstName",
  m."ownerLastName",
  m."merchantCode",
  m."isActive",
  u.phone,
  u.email
FROM "merchants" m
JOIN "users" u ON m."userId" = u.id
WHERE m."isActive" = true
ORDER BY m."onboardedAt" DESC
LIMIT 20;
```

### **Find user regardless of status:**
```sql
SELECT 
  u.id,
  u.phone,
  u.email,
  u."userType",
  u."subscriberType",
  u."merchantCode",
  u.status,
  p."firstName",
  p."lastName",
  m."businessTradeName",
  m."isActive" as "merchantActive"
FROM "users" u
LEFT JOIN "profiles" p ON u.id = p."userId"
LEFT JOIN "merchants" m ON u.id = m."userId"
WHERE u.phone LIKE '%PARTIAL_PHONE%'
   OR p."firstName" ILIKE '%NAME%'
   OR p."lastName" ILIKE '%NAME%'
   OR m."businessTradeName" ILIKE '%NAME%';
```

---

## Step 5: Common Fixes

### **Fix 1: User has merchantCode but no merchant record**
```sql
UPDATE "users" 
SET "merchantCode" = NULL 
WHERE phone = '+256YOUR_PHONE';
```

### **Fix 2: Merchant exists but isActive = false**
```sql
UPDATE "merchants" m
SET "isActive" = true
FROM "users" u
WHERE m."userId" = u.id 
  AND u.phone = '+256YOUR_PHONE';
```

### **Fix 3: Sync merchantCode between user and merchant**
```sql
-- Ensure user.merchantCode matches merchant.merchantCode
UPDATE "users" u
SET "merchantCode" = m."merchantCode"
FROM "merchants" m
WHERE u.id = m."userId"
  AND u."merchantCode" IS DISTINCT FROM m."merchantCode";
```

---

## 🚀 Quick Test

Run this comprehensive query to see the user's full status:

```sql
WITH user_info AS (
  SELECT 
    u.id,
    u.phone,
    u.email,
    u."userType",
    u."subscriberType",
    u."merchantCode" as "userMerchantCode",
    u.status as "userStatus",
    u."isVerified" as "userVerified",
    p."firstName",
    p."lastName",
    m.id as "merchantId",
    m."merchantCode" as "merchantMerchantCode",
    m."businessTradeName",
    m."isActive" as "merchantActive",
    m."isVerified" as "merchantVerified",
    CASE 
      WHEN u."userType" = 'STAFF' THEN 'STAFF (Hidden from Customers page)'
      WHEN u."merchantCode" IS NOT NULL THEN 'MERCHANT (Shows in Merchants tab)'
      WHEN u."subscriberType" = 'INDIVIDUAL' THEN 'SUBSCRIBER (Shows in Subscribers tab)'
      WHEN u."subscriberType" = 'AGENT' THEN 'PARTNER (Shows in Partners tab)'
      ELSE 'UNKNOWN'
    END as "expectedTab"
  FROM "users" u
  LEFT JOIN "profiles" p ON u.id = p."userId"
  LEFT JOIN "merchants" m ON u.id = m."userId"
  WHERE u.phone = '+256YOUR_PHONE_HERE'  -- Replace with actual phone
)
SELECT * FROM user_info;
```

This will tell you EXACTLY where the user should appear and their current status!

