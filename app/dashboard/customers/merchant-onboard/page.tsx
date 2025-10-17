"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PersonalInfoForm } from '@/components/dashboard/customers/PersonalInfoForm'
import { BusinessInfoForm } from '@/components/dashboard/customers/BusinessInfoForm'
import { FinancialInfoForm } from '@/components/dashboard/customers/FinancialInfoForm'
import { ContactInfoForm } from '@/components/dashboard/customers/ContactInfoForm'
import { DocumentUploadForm } from '@/components/dashboard/customers/DocumentUploadForm'
import { ReviewForm } from '@/components/dashboard/customers/ReviewForm'
import { ArrowLeft, User, Building2, CreditCard, Phone, Upload, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useSession } from 'next-auth/react'
import api from '@/lib/axios'

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
  // Personal Information
  firstName: string
  lastName: string
  middleName: string
  dateOfBirth: string
  gender: string
  nationalId: string
  
  // Business Information
  businessTradeName: string
  registeredBusinessName: string
  certificateOfIncorporation: string
  taxIdentificationNumber: string
  businessType: string
  businessRegistrationDate: string
  businessAddress: string
  businessCity: string
  businessCountry: string
  
  // Financial Information
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  mobileMoneyNumber: string
  mobileMoneyProvider: string
  
  // Contact Information
  registeredPhoneNumber: string
  businessEmail: string
  website: string
  
  // Additional
  referralCode: string
  country: string
}

const MerchantOnboardingPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("personal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUpload[]>([])
  
  // Form data
  const [formData, setFormData] = useState<MerchantFormData>({
    // Personal Information
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    
    // Business Information
    businessTradeName: '',
    registeredBusinessName: '',
    certificateOfIncorporation: '',
    taxIdentificationNumber: '',
    businessType: '',
    businessRegistrationDate: '',
    businessAddress: '',
    businessCity: '',
    businessCountry: 'UG',
    
    // Financial Information
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    mobileMoneyNumber: '',
    mobileMoneyProvider: '',
    
    // Contact Information
    registeredPhoneNumber: '',
    businessEmail: '',
    website: '',
    
    // Additional
    referralCode: '',
    country: 'UG'
  })

  const handleFormDataChange = (sectionData: any) => {
    setFormData(prev => ({
      ...prev,
      ...sectionData
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Check if user is authenticated
      if (!session?.user?.id) {
        toast.error('You must be logged in to onboard merchants')
        return
      }

      // Debug: Log form data and uploaded documents
      console.log('Form data:', formData)
      console.log('Uploaded documents:', uploadedDocuments)
      console.log('Current user ID:', session.user.id)
      
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationalId',
        'businessTradeName', 'registeredBusinessName', 'certificateOfIncorporation',
        'taxIdentificationNumber', 'businessType', 'businessRegistrationDate',
        'businessAddress', 'businessCity', 'businessCountry',
        'bankName', 'bankAccountName', 'bankAccountNumber',
        'mobileMoneyProvider', 'mobileMoneyNumber',
        'registeredPhoneNumber', 'businessEmail'
      ]

      const missingFields = requiredFields.filter(field => !formData[field as keyof MerchantFormData])
      console.log('Missing fields:', missingFields)
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`)
        return
      }

      // Validate required documents using backend enum values
      const requiredDocuments = [
        'NATIONAL_ID',
        'UTILITY_BILL',
        'BANK_STATEMENT'
      ]

      console.log('Required documents:', requiredDocuments)
      console.log('Uploaded document types:', uploadedDocuments.map(doc => doc.documentType))

      const missingDocuments = requiredDocuments.filter(docType => 
        !uploadedDocuments.some(doc => doc.documentType === docType)
      )

      console.log('Missing documents:', missingDocuments)

      if (missingDocuments.length > 0) {
        toast.error(`Please upload all required documents: ${missingDocuments.join(', ')}`)
        return
      }

      // Prepare the submission data according to backend DTO structure
      const submissionData = {
        // Personal Information
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationalId: formData.nationalId,
        
        // Business Information
        businessInfo: {
          businessTradeName: formData.businessTradeName,
          registeredBusinessName: formData.registeredBusinessName,
          certificateOfIncorporation: formData.certificateOfIncorporation,
          taxIdentificationNumber: formData.taxIdentificationNumber,
          businessType: formData.businessType,
          businessRegistrationDate: formData.businessRegistrationDate,
          businessAddress: formData.businessAddress,
          businessCity: formData.businessCity,
          businessCountry: formData.businessCountry
        },
        
        // Financial Information
        financialInfo: {
          bankName: formData.bankName,
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          mobileMoneyNumber: formData.mobileMoneyNumber,
          mobileMoneyProvider: formData.mobileMoneyProvider
        },
        
        // Contact Information
        contactInfo: {
          registeredPhoneNumber: formData.registeredPhoneNumber,
          businessEmail: formData.businessEmail,
          website: formData.website
        },
        
        // Document Information - Map uploaded documents to DTO fields
        documentInfo: {
          certificateOfIncorporationUrl: uploadedDocuments.find(doc => doc.documentType === 'NATIONAL_ID')?.documentUrl || '',
          taxRegistrationCertificateUrl: uploadedDocuments.find(doc => doc.documentType === 'UTILITY_BILL')?.documentUrl || '',
          businessPermitUrl: uploadedDocuments.find(doc => doc.documentType === 'PASSPORT')?.documentUrl || '',
          bankStatementUrl: uploadedDocuments.find(doc => doc.documentType === 'BANK_STATEMENT')?.documentUrl || ''
        },
        
        // Additional Information
        referralCode: formData.referralCode,
        country: formData.country,
        onboardedBy: session.user.id // Use actual authenticated user ID
      }

      console.log('Submission data:', submissionData)

      // Submit to API
      const response = await api.post('/merchant-kyc/create', submissionData)
      
      if (response.data.merchantId) {
        toast.success(response.data.message || 'Merchant created successfully!')
        router.push('/dashboard/customers')
      } else {
        toast.error(response.data.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(extractErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'financial', label: 'Financial', icon: CreditCard },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'review', label: 'Review', icon: CheckCircle }
  ]

  return (
    <PermissionGuard permission={PERMISSIONS.MERCHANT_KYC_CREATE}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        <main className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Merchant Onboarding</h1>
            <p className="text-gray-600 mt-2">Complete the merchant registration process</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value="personal">
              <PersonalInfoForm
                formData={{
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  middleName: formData.middleName,
                  dateOfBirth: formData.dateOfBirth,
                  gender: formData.gender,
                  nationalId: formData.nationalId
                }}
                onFormDataChange={(data) => handleFormDataChange(data)}
              />
            </TabsContent>

            <TabsContent value="business">
              <BusinessInfoForm
                formData={{
                  businessTradeName: formData.businessTradeName,
                  registeredBusinessName: formData.registeredBusinessName,
                  certificateOfIncorporation: formData.certificateOfIncorporation,
                 taxIdentificationNumber: formData.taxIdentificationNumber,
                  businessType: formData.businessType,
                  businessRegistrationDate: formData.businessRegistrationDate,
                  businessAddress: formData.businessAddress,
                  businessCity: formData.businessCity,
                  businessCountry: formData.businessCountry
                }}
                onFormDataChange={(data) => handleFormDataChange(data)}
              />
            </TabsContent>

            <TabsContent value="financial">
              <FinancialInfoForm
                formData={{
                  bankName: formData.bankName,
                  bankAccountName: formData.bankAccountName,
                  bankAccountNumber: formData.bankAccountNumber,
                  mobileMoneyNumber: formData.mobileMoneyNumber,
                  mobileMoneyProvider: formData.mobileMoneyProvider
                }}
                onFormDataChange={(data) => handleFormDataChange(data)}
              />
            </TabsContent>

            <TabsContent value="contact">
              <ContactInfoForm
                formData={{
                  registeredPhoneNumber: formData.registeredPhoneNumber,
                  businessEmail: formData.businessEmail,
                  website: formData.website
                }}
                onFormDataChange={(data) => handleFormDataChange(data)}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentUploadForm
                uploadedDocuments={uploadedDocuments}
                onDocumentsChange={setUploadedDocuments}
              />
            </TabsContent>

            <TabsContent value="review">
              <ReviewForm
                formData={formData}
                uploadedDocuments={uploadedDocuments}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
            </div>
          </div>
        </main>
      </div>
    </PermissionGuard>
  )
}

export default MerchantOnboardingPage
