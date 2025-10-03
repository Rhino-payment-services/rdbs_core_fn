# Merchant Onboard Document Upload Enum Fix

## ✅ Issue Fixed

**Problem:** Frontend was sending document types that don't match backend enum values, causing validation errors:
```
Error: Validation failed: [{"property":"documentType","value":"CERTIFICATE_OF_INCORPORATION","constraints":{"isEnum":"documentType must be one of the following values: "}}]
```

**Root Cause:** Frontend was using custom document types that don't exist in the backend enum.

---

## 🔧 Solution Implemented

### **1. Updated Document Types to Match Backend Enum**

**Backend Enum Values (from `UploadDocumentDto`):**
```typescript
enum: ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'UTILITY_BILL', 'BANK_STATEMENT']
```

**Frontend Document Types (Updated):**
```typescript
const documentTypes = [
  { id: 'NATIONAL_ID', name: 'National ID', required: true },
  { id: 'PASSPORT', name: 'Passport', required: false },
  { id: 'DRIVING_LICENSE', name: 'Driving License', required: false },
  { id: 'UTILITY_BILL', name: 'Utility Bill', required: true },
  { id: 'BANK_STATEMENT', name: 'Bank Statement', required: true }
]
```

### **2. Updated Required Documents Validation**

**Before:**
```typescript
const requiredDocuments = [
  'CERTIFICATE_OF_INCORPORATION',
  'TAX_REGISTRATION_CERTIFICATE', 
  'BUSINESS_PERMIT',
  'BANK_STATEMENT'
]
```

**After:**
```typescript
const requiredDocuments = [
  'NATIONAL_ID',
  'UTILITY_BILL',
  'BANK_STATEMENT'
]
```

### **3. Updated Document URL Mapping**

**Document Mapping for DTO:**
```typescript
documentInfo: {
  certificateOfIncorporationUrl: uploadedDocuments.find(doc => doc.documentType === 'NATIONAL_ID')?.documentUrl || '',
  taxRegistrationCertificateUrl: uploadedDocuments.find(doc => doc.documentType === 'UTILITY_BILL')?.documentUrl || '',
  businessPermitUrl: uploadedDocuments.find(doc => doc.documentType === 'PASSPORT')?.documentUrl || '',
  bankStatementUrl: uploadedDocuments.find(doc => doc.documentType === 'BANK_STATEMENT')?.documentUrl || ''
}
```

---

## 📊 Document Type Mapping

| Frontend Display | Backend Enum | DTO Field | Required |
|------------------|--------------|-----------|----------|
| National ID | `NATIONAL_ID` | `certificateOfIncorporationUrl` | ✅ Yes |
| Passport | `PASSPORT` | `businessPermitUrl` | ❌ No |
| Driving License | `DRIVING_LICENSE` | - | ❌ No |
| Utility Bill | `UTILITY_BILL` | `taxRegistrationCertificateUrl` | ✅ Yes |
| Bank Statement | `BANK_STATEMENT` | `bankStatementUrl` | ✅ Yes |

---

## 🧪 Testing

### **Test Document Upload:**
1. Navigate to Documents tab
2. Upload each document type:
   - National ID (Required)
   - Utility Bill (Required)
   - Bank Statement (Required)
   - Passport (Optional)
   - Driving License (Optional)
3. Verify no validation errors
4. Check document appears in uploaded list

### **Test Validation:**
1. Try to submit without required documents
2. Verify error message shows correct document names
3. Upload all required documents
4. Verify submit button enables

### **Test Submission:**
1. Complete all required fields
2. Upload all required documents
3. Submit application
4. Verify successful submission

---

## 🔐 Backend Integration

### **Document Upload API:**
```typescript
POST /documents/upload
Content-Type: multipart/form-data

FormData:
- file: File
- documentType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVING_LICENSE' | 'UTILITY_BILL' | 'BANK_STATEMENT'
- documentNumber?: string
- description?: string
```

### **Validation:**
- ✅ File type validation (PDF, JPG, PNG, WebP)
- ✅ File size validation (2MB max)
- ✅ Document type enum validation
- ✅ Required field validation

---

## 🚀 Key Changes

### **DocumentUploadForm.tsx:**
- ✅ Updated `documentTypes` array to use backend enum values
- ✅ Updated required documents validation
- ✅ Updated document type mapping

### **page.tsx (Merchant Onboard):**
- ✅ Updated required documents validation
- ✅ Updated document URL mapping for DTO
- ✅ Updated error messages

### **ReviewForm.tsx:**
- ✅ Updated required documents validation
- ✅ Updated document type references

---

## 📋 Backend Enum Reference

**Source:** `src/documents/dto/document.dto.ts`
```typescript
@IsEnum(['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'UTILITY_BILL', 'BANK_STATEMENT'])
documentType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVING_LICENSE' | 'UTILITY_BILL' | 'BANK_STATEMENT';
```

**API Documentation:** `src/documents/controllers/documents.controller.ts`
```typescript
enum: ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'UTILITY_BILL', 'BANK_STATEMENT']
```

---

**Date:** October 1, 2025  
**Status:** ✅ Fixed - Document upload now uses correct backend enum values  
**Result:** No more validation errors when uploading documents
