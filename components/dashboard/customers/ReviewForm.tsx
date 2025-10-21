"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, FileText, User, Building2, CreditCard, Phone } from 'lucide-react'

interface DocumentUpload {
  id: string
  documentType: string
  documentNumber: string
  documentUrl: string
  originalName: string
  fileSize: number
  mimeType: string
  status: string
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
}

interface MerchantFormData {
  firstName: string
  lastName: string
  middleName: string
  dateOfBirth: string
  gender: string
  nationalId: string
  businessTradeName: string
  registeredBusinessName: string
  certificateOfIncorporation: string
  taxIdentificationNumber: string
  businessType: string
  businessRegistrationDate: string
  businessAddress: string
  businessCity: string
  businessCountry: string
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  mobileMoneyNumber: string
  mobileMoneyProvider: string
  registeredPhoneNumber: string
  businessEmail: string
  website: string
  referralCode: string
  country: string
}

interface ReviewFormProps {
  formData: MerchantFormData
  uploadedDocuments: DocumentUpload[]
  onSubmit: () => void
  isSubmitting: boolean
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  formData,
  uploadedDocuments,
  onSubmit,
  isSubmitting
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatBusinessType = (type: string) => {
    const typeMap: Record<string, string> = {
      'SOLE_PROPRIETORSHIP': 'Sole Proprietorship',
      'PARTNERSHIP': 'Partnership',
      'LIMITED_COMPANY': 'Limited Company',
      'PUBLIC_COMPANY': 'Public Company',
      'COOPERATIVE': 'Cooperative',
      'NGO': 'NGO',
      'OTHER': 'Other'
    }
    return typeMap[type] || type
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><FileText className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">Uploaded</Badge>
    }
  }

  const getMissingFields = () => {
    const requiredFieldsConfig = [
      { field: 'firstName', label: 'First Name', section: 'Personal' },
      { field: 'lastName', label: 'Last Name', section: 'Personal' },
      { field: 'dateOfBirth', label: 'Date of Birth', section: 'Personal' },
      { field: 'gender', label: 'Gender', section: 'Personal' },
      { field: 'nationalId', label: 'National ID', section: 'Personal' },
      { field: 'businessTradeName', label: 'Business Trade Name', section: 'Business' },
      { field: 'registeredBusinessName', label: 'Registered Business Name', section: 'Business' },
      { field: 'certificateOfIncorporation', label: 'Certificate of Incorporation', section: 'Business' },
      { field: 'taxIdentificationNumber', label: 'Tax Identification Number', section: 'Business' },
      { field: 'businessType', label: 'Business Type', section: 'Business' },
      { field: 'businessRegistrationDate', label: 'Business Registration Date', section: 'Business' },
      { field: 'businessAddress', label: 'Business Address', section: 'Business' },
      { field: 'businessCity', label: 'Business City', section: 'Business' },
      { field: 'businessCountry', label: 'Business Country', section: 'Business' },
      { field: 'bankName', label: 'Bank Name', section: 'Financial' },
      { field: 'bankAccountName', label: 'Bank Account Name', section: 'Financial' },
      { field: 'bankAccountNumber', label: 'Bank Account Number', section: 'Financial' },
      { field: 'mobileMoneyProvider', label: 'Mobile Money Provider', section: 'Financial' },
      { field: 'mobileMoneyNumber', label: 'Mobile Money Number', section: 'Financial' },
      { field: 'registeredPhoneNumber', label: 'Registered Phone Number', section: 'Contact' },
      { field: 'businessEmail', label: 'Business Email', section: 'Contact' },
    ]

    return requiredFieldsConfig.filter(({ field }) => 
      !formData[field as keyof MerchantFormData] || 
      String(formData[field as keyof MerchantFormData]).trim() === ''
    )
  }

  const getMissingDocuments = () => {
    const requiredDocsConfig = [
      { type: 'NATIONAL_ID', label: 'National ID Document' },
      { type: 'UTILITY_BILL', label: 'Utility Bill or Proof of Address' },
      { type: 'BANK_STATEMENT', label: 'Bank Statement' },
    ]

    return requiredDocsConfig.filter(({ type }) => 
      !uploadedDocuments.some(doc => doc.documentType === type)
    )
  }

  const missingFields = getMissingFields()
  const missingDocuments = getMissingDocuments()
  const isFormComplete = missingFields.length === 0
  const hasAllRequiredDocuments = missingDocuments.length === 0

  const canSubmit = isFormComplete && hasAllRequiredDocuments

  console.log('Can submit:', canSubmit)
  console.log('Missing fields:', missingFields)
  console.log('Missing documents:', missingDocuments)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Review & Submit
          </CardTitle>
          <CardDescription>
            Review all information before submitting the merchant application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {formData.firstName} {formData.middleName} {formData.lastName}
              </div>
              <div>
                <span className="font-medium">Date of Birth:</span> {formatDate(formData.dateOfBirth)}
              </div>
              <div>
                <span className="font-medium">Gender:</span> {formData.gender}
              </div>
              <div>
                <span className="font-medium">National ID:</span> {formData.nationalId}
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Trade Name:</span> {formData.businessTradeName}
              </div>
              <div>
                <span className="font-medium">Registered Name:</span> {formData.registeredBusinessName}
              </div>
              <div>
                <span className="font-medium">Business Type:</span> {formatBusinessType(formData.businessType)}
              </div>
              <div>
                <span className="font-medium">Registration Date:</span> {formatDate(formData.businessRegistrationDate)}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Address:</span> {formData.businessAddress}, {formData.businessCity}, {formData.businessCountry}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Bank:</span> {formData.bankName}
              </div>
              <div>
                <span className="font-medium">Account Name:</span> {formData.bankAccountName}
              </div>
              <div>
                <span className="font-medium">Account Number:</span> {formData.bankAccountNumber}
              </div>
              <div>
                <span className="font-medium">Mobile Money:</span> {formData.mobileMoneyProvider} - {formData.mobileMoneyNumber}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Phone:</span> {formData.registeredPhoneNumber}
              </div>
              <div>
                <span className="font-medium">Email:</span> {formData.businessEmail}
              </div>
              {formData.website && (
                <div className="md:col-span-2">
                  <span className="font-medium">Website:</span> {formData.website}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({uploadedDocuments.length})
            </h3>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Validation Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isFormComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  {isFormComplete ? 'All required fields completed' : 'Some required fields are missing'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasAllRequiredDocuments ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  {hasAllRequiredDocuments ? 'All required documents uploaded' : 'Some required documents are missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>

          {!canSubmit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 mb-3">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-base font-semibold">Cannot Submit Application</span>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Please complete the following before submitting:
              </p>

              {/* Missing Fields */}
              {missingFields.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    ❌ Missing Required Fields ({missingFields.length}):
                  </p>
                  <div className="space-y-1 ml-4">
                    {missingFields.map(({ field, label, section }) => (
                      <div key={field} className="text-sm text-red-700">
                        • <span className="font-medium">{label}</span> 
                        <span className="text-xs text-red-600 ml-1">({section} tab)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Documents */}
              {missingDocuments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    ❌ Missing Required Documents ({missingDocuments.length}):
                  </p>
                  <div className="space-y-1 ml-4">
                    {missingDocuments.map(({ type, label }) => (
                      <div key={type} className="text-sm text-red-700">
                        • <span className="font-medium">{label}</span>
                        <span className="text-xs text-red-600 ml-1">(Documents tab)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex items-center justify-between text-xs text-red-700">
                  <span>Completion Progress:</span>
                  <span className="font-semibold">
                    {Math.round(((21 - missingFields.length) / 21) * 100)}% Fields • 
                    {Math.round(((3 - missingDocuments.length) / 3) * 100)}% Documents
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
