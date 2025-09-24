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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'uploaded':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="h-3 w-3 mr-1" />Uploaded</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const requiredDocuments = [
    'certificate_of_incorporation',
    'tax_registration_certificate', 
    'business_permit',
    'bank_statement'
  ]

  const hasAllRequiredDocuments = requiredDocuments.every(docType => 
    uploadedDocuments.some(doc => doc.documentType === docType)
  )

  const isFormComplete = () => {
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationalId',
      'businessTradeName', 'registeredBusinessName', 'certificateOfIncorporation',
      'taxIdentificationNumber', 'businessType', 'businessRegistrationDate',
      'businessAddress', 'businessCity', 'businessCountry',
      'bankName', 'bankAccountName', 'bankAccountNumber',
      'mobileMoneyProvider', 'mobileMoneyNumber',
      'registeredPhoneNumber', 'businessEmail'
    ]

    return requiredFields.every(field => formData[field as keyof MerchantFormData])
  }

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
                <span className="font-medium">Business Type:</span> {formData.businessType}
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
                {isFormComplete() ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  {isFormComplete() ? 'All required fields completed' : 'Some required fields are missing'}
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
              disabled={!isFormComplete() || !hasAllRequiredDocuments || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
