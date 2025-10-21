# 🧪 Test Merchants Tab Display

## Quick Test Steps

### 1. Refresh Browser
**Hard refresh to get latest code:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 2. Login
Use: `superadmin@rukapay.co.ug` / `superAdmin@RukA2025`

### 3. Go to Customers Page
Dashboard → Customers

### 4. Check Tabs

#### Subscribers Tab:
✅ Expected: **Subscribers (1419)**
- Should see list of subscribers
- Search by name should work

#### Merchants Tab:
✅ Expected: **Merchants (1)**
- Should see merchant with business name "taadfasdfa"
- Should show:
  - Business Name: taadfasdfa
  - Merchant Code: 4643
  - Business Type: PARTNERSHIP
  - City: Kampala
  - Wallet Balance: 1000 UGX

### 5. If Not Showing

**Check Browser Console (F12):**
```javascript
// Check if data loaded
console.log('merchantsData:', merchantsData)

// Should show:
{
  merchants: [{ businessTradeName: "taadfasdfa", ... }],
  total: 1,
  page: 1,
  totalPages: 1
}
```

**Check Network Tab:**
- Look for request: `GET /merchant-kyc/all?page=1&pageSize=10`
- Response should have `merchants` array with 1 item

---

## Expected vs Actual

| Item | Expected | What You Should See |
|------|----------|-------------------|
| Subscribers Count | 1419 | "Subscribers (1419)" |
| Merchants Count | 1 | "Merchants (1)" |
| Merchant Name | taadfasdfa | In table as business name |
| Dual Account User | In both tabs | Same user in subscribers & merchants |

---

**All fixed! Should work after browser refresh.** 🎉
