# 🎨 Merchant KYC UI - Display Business Names & Separate Views

## ✅ Issue Fixed

### **Problem:** 
1. ❌ Business name not showing in KYC Management table
2. ❌ Type showing "Unknown" instead of "Merchant"
3. ❌ National ID showing "N/A" for merchants
4. ❌ KYC details view not showing merchant-specific information

---

## 🎯 Solution: Separate UI for Merchants vs Individuals

### **What Changed:**

#### 1. **Updated Interface** (`PendingKycUser`)
Added merchant-specific fields to the TypeScript interface:

```typescript
interface PendingKycUser {
  // ... existing fields ...
  
  // NEW: Merchant-specific fields
  isMerchant?: boolean
  displayName?: string        // Business name for merchants
  businessName?: string       // Business trade name
  ownerName?: string          // Owner's full name
  merchantInfo?: {
    merchantId: string
    merchantCode: string
    businessTradeName: string
    registeredBusinessName: string
    businessType: string
    // ... all other merchant fields
  }
}
```

---

#### 2. **KYC Table View** - Now Shows Different Info for Merchants

##### **Before (❌):**
```
User: N/A
Type: Unknown
National ID: N/A
```

##### **After (✅):**
```
🏢 Business Name (bold)
   Owner: John Doe (smaller text)
   
Type: Merchant (badge)
National ID: 12345 (owner's national ID)
```

**Code:**
```typescript
// Table rendering
<TableCell>
  <div className="flex items-center">
    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
      {kyc.isMerchant ? (
        <Building2 className="h-4 w-4 text-blue-600" />  // 🏢 Blue building icon
      ) : (
        <User className="h-4 w-4 text-gray-600" />       // 👤 Gray user icon
      )}
    </div>
    <div className="ml-3">
      <div className="text-sm font-medium text-gray-900">
        {kyc.isMerchant ? (
          <div>
            <div className="font-semibold">{kyc.displayName || kyc.businessName}</div>
            <div className="text-xs text-gray-500 font-normal">
              Owner: {kyc.ownerName || 'N/A'}
            </div>
          </div>
        ) : (
          `${kyc.profile?.firstName} ${kyc.profile?.lastName}`
        )}
      </div>
      <div className="text-sm text-gray-500">
        {kyc.email || kyc.merchantInfo?.businessEmail}
      </div>
      <div className="text-xs text-gray-400">
        {kyc.phone || kyc.merchantInfo?.registeredPhoneNumber}
      </div>
    </div>
  </div>
</TableCell>

// Type badge
<TableCell>
  <Badge className={getTypeColor(kyc.isMerchant ? 'MERCHANT' : kyc.profile?.subscriberType)}>
    {kyc.isMerchant ? 'Merchant' : (kyc.profile?.subscriberType || 'Unknown')}
  </Badge>
</TableCell>

// National ID
<TableCell>
  {kyc.isMerchant ? (
    kyc.merchantInfo?.ownerNationalId || 'N/A'
  ) : (
    kyc.profile?.nationalId || 'N/A'
  )}
</TableCell>
```

---

#### 3. **KYC Details Dialog** - Completely Different for Merchants

##### **Merchant View Shows:**

**Business Information Section:**
- 🏢 Business Trade Name (bold)
- Registered Business Name
- Business Type (e.g., "Limited Company")
- Merchant Code
- Certificate of Incorporation
- Tax Identification Number
- Business Email
- Registered Phone
- Business Address
- Website (if provided)

**Business Owner Information Section:**
- Owner Name
- Owner National ID
- Date of Birth
- Gender

**Financial Information Section:**
- Bank Name
- Account Name
- Account Number
- Mobile Money Number (if provided)

**Code:**
```typescript
<DialogHeader>
  <DialogTitle className="flex items-center gap-2">
    {selectedKycRequest?.isMerchant ? (
      <>
        <Building2 className="h-5 w-5 text-blue-600" />
        Merchant KYC Request Details
      </>
    ) : (
      <>
        <User className="h-5 w-5 text-gray-600" />
        KYC Request Details
      </>
    )}
  </DialogTitle>
  <DialogDescription>
    {selectedKycRequest?.isMerchant 
      ? 'Review the complete merchant KYC submission for this business'
      : 'Review the complete KYC submission for this user'}
  </DialogDescription>
</DialogHeader>

{selectedKycRequest?.isMerchant ? (
  // Show Business Info, Owner Info, Financial Info sections
) : (
  // Show Personal Information section
)}
```

---

## 📊 Visual Comparison

### **KYC Table:**

#### **Individual User Row:**
```
┌─────────────────────────────────────────────────────────────┐
│ 👤  John Doe                    │ Individual │ 1234567890  │
│     john@email.com               │            │             │
│     +256701234567                │            │             │
└─────────────────────────────────────────────────────────────┘
```

#### **Merchant Row:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢  John's Shop Ltd              │ Merchant   │ 0987654321  │
│     Owner: John Doe (smaller)    │            │ (Owner ID)  │
│     business@shop.com            │            │             │
│     +256709876543                │            │             │
└─────────────────────────────────────────────────────────────┘
```

---

### **KYC Details Dialog:**

#### **Individual View:**
```
┌────────────────────────────────────┐
│ 👤 KYC Request Details             │
├────────────────────────────────────┤
│ Personal Information               │
│ ├─ Full Name: John Doe             │
│ ├─ Email: john@email.com           │
│ ├─ Phone: +256701234567            │
│ ├─ National ID: 1234567890         │
│ └─ Date of Birth: 1990-01-01       │
│                                    │
│ Submitted Documents                │
│ ├─ National ID                     │
│ └─ Passport                        │
└────────────────────────────────────┘
```

#### **Merchant View:**
```
┌────────────────────────────────────────────────────────────┐
│ 🏢 Merchant KYC Request Details                            │
├────────────────────────────────────────────────────────────┤
│ Business Information                                       │
│ ├─ Business Trade Name: John's Shop Ltd (bold)            │
│ ├─ Registered Name: John's Shop Limited                   │
│ ├─ Business Type: Limited Company                         │
│ ├─ Merchant Code: MERCH-12345                             │
│ ├─ Certificate: 12345/2020                                │
│ ├─ Tax ID: 1234567890                                     │
│ ├─ Business Email: business@shop.com                      │
│ ├─ Phone: +256709876543                                   │
│ └─ Address: Plot 123, Main St, Kampala                    │
│                                                            │
│ Business Owner Information                                 │
│ ├─ Owner Name: John Doe                                   │
│ ├─ Owner National ID: 0987654321                          │
│ ├─ Date of Birth: 1985-05-15                              │
│ └─ Gender: Male                                            │
│                                                            │
│ Financial Information                                      │
│ ├─ Bank Name: Standard Bank                               │
│ ├─ Account Name: John's Shop Ltd                          │
│ ├─ Account Number: 1234567890                             │
│ └─ Mobile Money: +256709876543                            │
│                                                            │
│ Submitted Documents                                        │
│ ├─ Certificate of Incorporation                           │
│ ├─ Tax Registration Certificate                           │
│ ├─ Business Permit                                        │
│ └─ Bank Statement                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Indicators

| Element | Individual | Merchant |
|---------|-----------|----------|
| **Icon** | 👤 Gray user icon | 🏢 Blue building icon |
| **Type Badge** | "Individual" / "Agent" | "Merchant" (highlighted) |
| **Name Display** | User's full name | Business name (bold) + Owner name (small) |
| **Email** | Personal email | Business email |
| **Phone** | Personal phone | Registered business phone |
| **National ID** | User's national ID | Owner's national ID |
| **Dialog Title** | "KYC Request Details" | "Merchant KYC Request Details" |
| **Information Sections** | 1 section (Personal) | 3 sections (Business, Owner, Financial) |

---

## ✅ What's Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Business Name** | ❌ "N/A" | ✅ "John's Shop Ltd" (bold) |
| **Owner Name** | ❌ Not shown | ✅ "Owner: John Doe" (under business name) |
| **Type** | ❌ "Unknown" | ✅ "Merchant" (badge) |
| **National ID** | ❌ "N/A" | ✅ Owner's National ID |
| **Icon** | ❌ Generic user | ✅ 🏢 Blue building icon |
| **KYC Details** | ❌ Personal fields only | ✅ Business, Owner, Financial sections |
| **Email/Phone** | ❌ Personal (N/A) | ✅ Business contact info |

---

## 🧪 Testing Checklist

### **Test 1: Merchant in KYC Table**
```bash
# When viewing KYC Management:
✅ Merchant row shows business name (bold)
✅ "Owner: [Name]" shown below business name
✅ Type badge shows "Merchant"
✅ Blue building icon (🏢) displayed
✅ Business email and phone shown
✅ Owner's national ID displayed (not business registration)
```

### **Test 2: Individual in KYC Table**
```bash
# When viewing KYC Management:
✅ Individual row shows user's full name
✅ Type badge shows "Individual" or "Agent"
✅ Gray user icon (👤) displayed
✅ Personal email and phone shown
✅ User's national ID displayed
```

### **Test 3: Merchant KYC Details Dialog**
```bash
# When clicking "View" on merchant:
✅ Dialog title: "Merchant KYC Request Details"
✅ Blue building icon in title
✅ Business Information section shown
✅ Business Owner Information section shown
✅ Financial Information section shown
✅ All merchant-specific fields populated
✅ Documents section shows business documents
```

### **Test 4: Individual KYC Details Dialog**
```bash
# When clicking "View" on individual:
✅ Dialog title: "KYC Request Details"
✅ Gray user icon in title
✅ Personal Information section shown
✅ All personal fields populated
✅ Documents section shows personal documents
```

---

## 📝 Files Modified

1. **`rdbs_core_fn/app/dashboard/kyc/page.tsx`**
   - Updated `PendingKycUser` interface
   - Updated table row rendering (lines 608-652)
   - Updated KYC details dialog (lines 820-1000+)
   - Added merchant-specific sections

---

## 🚀 What the User Sees Now

### **Before:**
```
User: N/A
Type: Unknown
National ID: N/A
```
😕 Confusing - no idea who this is or what type

### **After:**
```
🏢 John's Shop Ltd
   Owner: John Doe
   business@shop.com
   +256709876543

Type: Merchant
National ID: 0987654321 (Owner ID)
```
😄 Clear business identity with owner information!

---

## 🎯 Summary

### **The Problem:**
Merchants were showing as "N/A" with "Unknown" type, making it impossible to identify them in the KYC queue.

### **The Solution:**
- ✅ Show business name (bold) with owner name below
- ✅ Display "Merchant" type badge
- ✅ Show owner's national ID (not business registration)
- ✅ Use blue building icon (🏢) to distinguish merchants
- ✅ Separate KYC details view with 3 sections (Business, Owner, Financial)
- ✅ Show all merchant-specific information

### **Impact:**
- ✅ Admins can easily identify merchants in KYC queue
- ✅ Clear distinction between merchant and individual accounts
- ✅ Complete merchant information displayed
- ✅ Better UX for KYC approval process

---

**Status: 🎉 FIXED - Merchant KYC UI Shows Business Names!** 🚀

