# 🏢 Merchants Tab - Show Business Names from Merchant Table

## ✅ Issue Fixed

### **Problem:**
1. ❌ Merchants tab showed individual user names (e.g., "Ngabo Sevelin") instead of business names
2. ❌ Search was finding users by personal name, not business name
3. ❌ Data was coming from `users` table filtered by `merchantCode` instead of `merchants` table

### **Solution:**
1. ✅ Merchants tab now fetches from `/merchant-kyc/all` API (merchants table)
2. ✅ Shows business names (e.g., "John's Shop Ltd")
3. ✅ Shows owner name below business name
4. ✅ Search works on business names, not personal names

---

## 🔧 Changes Made

### **1. Customers Page - Fetch from Merchants API**

#### **Before (❌):**
```typescript
// Only fetched users
const { data: usersData, isLoading: usersLoading } = useUsers()
const users = Array.isArray(usersData) ? usersData : (usersData?.data || [])

// Filtered users by merchantCode
if (activeTab === 'merchants') {
  filtered = filtered.filter(user => user.merchantCode)
}
```

#### **After (✅):**
```typescript
// Fetch BOTH users AND merchants
const { data: usersData, isLoading: usersLoading } = useUsers()
const { data: merchantsData, isLoading: merchantsLoading } = useMerchants({
  search: searchTerm,
  page: currentPage,
  pageSize: itemsPerPage
})

const users = Array.isArray(usersData) ? usersData : (usersData?.data || [])
const merchants = merchantsData?.merchants || []
const merchantsTotal = merchantsData?.pagination?.total || 0
```

**Benefits:**
- ✅ Merchants data comes from `merchants` table
- ✅ Search built into API (searches business names, codes, emails)
- ✅ Pagination handled by backend
- ✅ Separate loading states

---

### **2. CustomerTable - Merchant-Specific Display**

#### **New Props:**
```typescript
interface CustomerTableProps {
  customers: User[] | any[]  // Can be User[] or Merchant[]
  // ... other props ...
  isMerchantTab?: boolean  // ✅ NEW: Flag to render merchant columns
}
```

#### **Merchant Display:**

**Customer Name Column:**
```typescript
{isMerchantTab ? (
  // Show business name
  <div>
    <Building2 icon />
    <div className="font-medium">John's Shop Ltd</div>
    <div className="text-xs">Owner: John Doe</div>
    <div className="text-xs">Code: MERCH-12345</div>
  </div>
) : (
  // Show user name
  <div>
    John Doe
    <div>ID: abc12345</div>
  </div>
)}
```

**Contact Column:**
```typescript
{isMerchantTab ? (
  // Show business contact
  <div>
    <Mail /> business@shop.com
    <Phone /> +256709876543
  </div>
) : (
  // Show personal contact
  <div>
    <Mail /> john@email.com
    <Phone /> +256701234567
  </div>
)}
```

**Type Column:**
```typescript
{isMerchantTab ? (
  <Badge>MERCHANT</Badge>
) : (
  getUserTypeBadge(customer)  // SUBSCRIBER, AGENT, etc.
)}
```

**Status Column:**
```typescript
{isMerchantTab ? (
  customer.isVerified ? (
    <Badge>Verified</Badge>
  ) : (
    <Badge>Pending</Badge>
  )
) : (
  getStatusBadge(customer.status)  // ACTIVE, INACTIVE, etc.
)}
```

**Location Column:**
```typescript
{isMerchantTab ? (
  <MapPin /> {customer.businessCity}  // Kampala
) : (
  <MapPin /> {customer.country}  // UG
)}
```

**Joined Column:**
```typescript
<Calendar /> {formatDate(
  isMerchantTab ? customer.onboardedAt : customer.createdAt
)}
```

---

## 📊 Data Structure

### **User (from /admin/users):**
```json
{
  "id": "user-123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@email.com",
  "phone": "+256701234567",
  "merchantCode": "MERCH-12345",  // If they're a merchant
  "userType": "SUBSCRIBER",
  "status": "ACTIVE"
}
```

### **Merchant (from /merchant-kyc/all):**
```json
{
  "id": "merchant-456",
  "merchantCode": "MERCH-12345",
  "businessTradeName": "John's Shop Ltd",
  "registeredBusinessName": "John's Shop Limited",
  "businessType": "LIMITED_COMPANY",
  "businessEmail": "business@shop.com",
  "registeredPhoneNumber": "+256709876543",
  "businessCity": "Kampala",
  "businessAddress": "Plot 123, Main Street",
  "ownerFirstName": "John",
  "ownerLastName": "Doe",
  "ownerNationalId": "CM1234567890",
  "certificateOfIncorporation": "12345/2020",
  "taxIdentificationNumber": "1234567890",
  "bankName": "Standard Bank",
  "bankAccountNumber": "1234567890",
  "isVerified": false,
  "isActive": true,
  "onboardedAt": "2025-10-21T10:00:00Z"
}
```

---

## 🎯 What You'll See Now

### **Subscribers Tab:**
```
┌─────────────────────────────────────────────┐
│ 👤 John Doe                                 │
│    john@email.com                           │
│    +256701234567                            │
│    Type: SUBSCRIBER                         │
│    Status: ACTIVE                           │
└─────────────────────────────────────────────┘
```

### **Merchants Tab:**
```
┌─────────────────────────────────────────────┐
│ 🏢 John's Shop Ltd                          │
│    Owner: John Doe                          │
│    Code: MERCH-12345                        │
│    business@shop.com                        │
│    +256709876543                            │
│    Type: MERCHANT                           │
│    Status: Verified / Pending               │
│    Location: Kampala                        │
└─────────────────────────────────────────────┘
```

---

## 🔍 Search Functionality

### **Subscribers Tab:**
- Searches: firstName, lastName, email, phone (from users table)

### **Merchants Tab:**
- Searches: 
  - businessTradeName
  - registeredBusinessName
  - businessEmail
  - registeredPhoneNumber
  - merchantCode
  - ownerFirstName
  - ownerLastName
  - certificateOfIncorporation
  - taxIdentificationNumber

**Example:**
```
Search: "agabo" or "John's Shop" or "MERCH-12345"
→ Finds: John's Shop Ltd (from merchants table)
```

---

## 🚀 Deployment

### **Step 1: Build Frontend**
```bash
cd /Users/jimntare/Documents/code/rdbs_core_fn
npm run build
```

### **Step 2: Test Locally (Optional)**
```bash
npm run dev
# Navigate to /dashboard/customers
# Click Merchants tab
# Should see business names now!
```

### **Step 3: Deploy**
Deploy the built frontend to your hosting environment.

---

## 🧪 Testing

### **Test 1: Merchants Tab Shows Business Names**
```bash
# 1. Navigate to Customers page
# 2. Click Merchants tab
# Expected:
✅ Shows "John's Shop Ltd" (not "John Doe")
✅ Shows "Owner: John Doe" below business name
✅ Shows merchant code
✅ Count shows correct number
```

### **Test 2: Search Works on Business Names**
```bash
# 1. In Merchants tab, search "Shop"
# Expected:
✅ Finds merchants with "Shop" in business name
✅ Shows filtered results
✅ Count updates
```

### **Test 3: Subscribers Tab Still Works**
```bash
# 1. Click Subscribers tab
# Expected:
✅ Shows individual user names
✅ Does NOT show merchants
✅ Search works on personal names
```

### **Test 4: Individual becomes Merchant**
```bash
# 1. Create merchant for existing user "Ngabo Sevelin"
# 2. Refresh Customers page

# Subscribers Tab:
❌ "Ngabo Sevelin" no longer appears (moved to merchants)

# Merchants Tab:
✅ Shows business name (e.g., "Ngabo's Business")
✅ Shows "Owner: Ngabo Sevelin"
```

---

## 📝 Files Modified

### **Frontend:**
1. **`app/dashboard/customers/page.tsx`**
   - Added `useMerchants` hook
   - Merchants tab now uses `merchantsData`
   - Passes `isMerchantTab={true}` flag
   
2. **`components/dashboard/customers/CustomerTable.tsx`**
   - Added `isMerchantTab` prop
   - Conditional rendering for merchant columns
   - Shows business names for merchants

---

## 🎯 Summary

### **The Problem:**
Merchants tab showed personal names (from users table) instead of business names (from merchants table). Search found users by personal name, not business name.

### **The Solution:**
- ✅ Fetch merchants from `/merchant-kyc/all` API
- ✅ Display business names, owner names, merchant codes
- ✅ Search on business names and merchant data
- ✅ Separate merchants from subscribers

### **Impact:**
- ✅ Merchants show business names (e.g., "John's Shop Ltd")
- ✅ Search finds businesses by name, code, email
- ✅ Clear separation between personal and business accounts
- ✅ Professional merchant listing

---

**Status: 🎉 FIXED - Merchants Show Business Names!** 🚀

