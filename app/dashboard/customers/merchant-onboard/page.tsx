"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  ArrowLeft,
  CreditCard,
  Globe
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
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
  
  // Document URLs
  certificateOfIncorporationUrl: string
  taxRegistrationCertificateUrl: string
  businessPermitUrl: string
  bankStatementUrl: string
  
  // Additional
  referralCode: string
  country: string
}

const MerchantOnboardingPage = () => {
  const router = useRouter()
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
    businessCountry: '',
    
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
    
    // Document URLs
    certificateOfIncorporationUrl: '',
    taxRegistrationCertificateUrl: '',
    businessPermitUrl: '',
    bankStatementUrl: '',
    
    // Additional
    referralCode: '',
    country: 'UG',
  })

  // Document upload states
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('CERTIFICATE_OF_INCORPORATION')
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Get permissions
  // const { canCreateMerchant } = usePermissions() // Remove unused variable

  const businessTypes = [
    'LIMITED_COMPANY',
    'PRIVATE_LIMITED_COMPANY',
    'PUBLIC_LIMITED_COMPANY',
    'PARTNERSHIP',
    'SOLE_PROPRIETORSHIP',
    'NON_PROFIT_ORGANIZATION',
    'COOPERATIVE',
    'OTHER'
  ]

  const genders = ['MALE', 'FEMALE', 'OTHER']

  const mobileMoneyProviders = ['MTN', 'AIRTEL', 'AFRICELL', 'UTL']

  const documentTypes = [
    'CERTIFICATE_OF_INCORPORATION',
    'TAX_REGISTRATION_CERTIFICATE',
    'BUSINESS_PERMIT',
    'BANK_STATEMENT',
    'NATIONAL_ID',
    'PASSPORT',
    'OTHER'
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid file type (JPEG, PNG, WebP, PDF)')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setDocumentFile(file)
    }
  }

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', documentFile)
      formData.append('documentType', documentType)
      formData.append('documentNumber', documentNumber)
      formData.append('description', documentDescription)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.document) {
        setUploadedDocuments(prev => [...prev, data.document])
        
        // Map document to form data based on type
        const documentUrl = data.document.documentUrl
        switch (documentType) {
          case 'CERTIFICATE_OF_INCORPORATION':
            setFormData(prev => ({ ...prev, certificateOfIncorporationUrl: documentUrl }))
            break
          case 'TAX_REGISTRATION_CERTIFICATE':
            setFormData(prev => ({ ...prev, taxRegistrationCertificateUrl: documentUrl }))
            break
          case 'BUSINESS_PERMIT':
            setFormData(prev => ({ ...prev, businessPermitUrl: documentUrl }))
            break
          case 'BANK_STATEMENT':
            setFormData(prev => ({ ...prev, bankStatementUrl: documentUrl }))
            break
        }
        
        toast.success('Document uploaded successfully!')
        
        // Reset form
        setDocumentFile(null)
        setDocumentNumber('')
        setDocumentDescription('')
        if (documentFile) {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        }
      }
    } catch (error) {
      console.error('Document upload error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare the payload according to the backend API
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationalId: formData.nationalId,
        businessInfo: {
          businessTradeName: formData.businessTradeName,
          registeredBusinessName: formData.registeredBusinessName,
          certificateOfIncorporation: formData.certificateOfIncorporation,
          taxIdentificationNumber: formData.taxIdentificationNumber,
          businessType: formData.businessType,
          businessRegistrationDate: formData.businessRegistrationDate,
          businessAddress: formData.businessAddress,
          businessCity: formData.businessCity,
          businessCountry: formData.businessCountry,
        },
        financialInfo: {
          bankName: formData.bankName,
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          mobileMoneyNumber: formData.mobileMoneyNumber,
          mobileMoneyProvider: formData.mobileMoneyProvider,
          additionalBankAccounts: [],
        },
        contactInfo: {
          registeredPhoneNumber: formData.registeredPhoneNumber,
          businessEmail: formData.businessEmail,
          website: formData.website,
        },
        documentInfo: {
          certificateOfIncorporationUrl: formData.certificateOfIncorporationUrl,
          taxRegistrationCertificateUrl: formData.taxRegistrationCertificateUrl,
          businessPermitUrl: formData.businessPermitUrl,
          bankStatementUrl: formData.bankStatementUrl,
        },
        referralCode: formData.referralCode,
        country: formData.country,
        onboardedBy: 'current-user-id', // This should be the current user's ID
      }

      const response = await api.post('/merchant-kyc/create', payload)
      
      if (response.data) {
        toast.success('Merchant onboarded successfully!')
        router.push('/dashboard/customers')
      }
    } catch (error) {
      console.error('Merchant onboarding error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
    toast.success('Document removed')
  }

  const isPersonalInfoComplete = () => {
    return formData.firstName && formData.lastName && formData.dateOfBirth && 
           formData.gender && formData.nationalId
  }

  const isBusinessInfoComplete = () => {
    return formData.businessTradeName && formData.registeredBusinessName && 
           formData.businessType && formData.businessAddress && 
           formData.businessCity && formData.businessCountry
  }

  const isFinancialInfoComplete = () => {
    return formData.bankName && formData.bankAccountName && 
           formData.bankAccountNumber && formData.mobileMoneyNumber && 
           formData.mobileMoneyProvider
  }

  const isContactInfoComplete = () => {
    return formData.registeredPhoneNumber && formData.businessEmail
  }

  return (
    <PermissionGuard 
      permission={PERMISSIONS.CREATE_MERCHANT} 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to onboard merchants.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Merchant Onboarding</h1>
                  <p className="text-gray-600 mt-2">Register a new merchant with complete KYC information</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Financial
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Review
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Enter the merchant&apos;s personal details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Enter first name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Enter last name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input
                            id="middleName"
                            value={formData.middleName}
                            onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                            placeholder="Enter middle name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender *</Label>
                          <Select value={formData.gender} onValueChange={(value: string) => setFormData(prev => ({ ...prev, gender: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              {genders.map((gender) => (
                                <SelectItem key={gender} value={gender}>
                                  {gender}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="nationalId">National ID *</Label>
                        <Input
                          id="nationalId"
                          value={formData.nationalId}
                          onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                          placeholder="Enter national ID number"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("business")}
                          disabled={!isPersonalInfoComplete()}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          Next: Business Info
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Information Tab */}
              <TabsContent value="business" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Business Information
                    </CardTitle>
                    <CardDescription>Enter the merchant&apos;s business details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessTradeName">Business Trade Name *</Label>
                          <Input
                            id="businessTradeName"
                            value={formData.businessTradeName}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessTradeName: e.target.value }))}
                            placeholder="Enter business trade name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="registeredBusinessName">Registered Business Name *</Label>
                          <Input
                            id="registeredBusinessName"
                            value={formData.registeredBusinessName}
                            onChange={(e) => setFormData(prev => ({ ...prev, registeredBusinessName: e.target.value }))}
                            placeholder="Enter registered business name"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="certificateOfIncorporation">Certificate of Incorporation *</Label>
                          <Input
                            id="certificateOfIncorporation"
                            value={formData.certificateOfIncorporation}
                            onChange={(e) => setFormData(prev => ({ ...prev, certificateOfIncorporation: e.target.value }))}
                            placeholder="Enter certificate number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="taxIdentificationNumber">Tax Identification Number *</Label>
                          <Input
                            id="taxIdentificationNumber"
                            value={formData.taxIdentificationNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, taxIdentificationNumber: e.target.value }))}
                            placeholder="Enter TIN"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessType">Business Type *</Label>
                          <Select value={formData.businessType} onValueChange={(value: string) => setFormData(prev => ({ ...prev, businessType: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="businessRegistrationDate">Business Registration Date *</Label>
                          <Input
                            id="businessRegistrationDate"
                            type="date"
                            value={formData.businessRegistrationDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessRegistrationDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="businessAddress">Business Address *</Label>
                        <Input
                          id="businessAddress"
                          value={formData.businessAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                          placeholder="Enter business address"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessCity">Business City *</Label>
                          <Input
                            id="businessCity"
                            value={formData.businessCity}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessCity: e.target.value }))}
                            placeholder="Enter city"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessCountry">Business Country *</Label>
                          <Input
                            id="businessCountry"
                            value={formData.businessCountry}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessCountry: e.target.value }))}
                            placeholder="Enter country"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("personal")}
                        >
                          Previous: Personal Info
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("financial")}
                          disabled={!isBusinessInfoComplete()}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          Next: Financial Info
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Information Tab */}
              <TabsContent value="financial" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Financial Information
                    </CardTitle>
                    <CardDescription>Enter banking and mobile money details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bankName">Bank Name *</Label>
                          <Input
                            id="bankName"
                            value={formData.bankName}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                            placeholder="Enter bank name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="bankAccountName">Bank Account Name *</Label>
                          <Input
                            id="bankAccountName"
                            value={formData.bankAccountName}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankAccountName: e.target.value }))}
                            placeholder="Enter account name"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                        <Input
                          id="bankAccountNumber"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                          placeholder="Enter account number"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mobileMoneyNumber">Mobile Money Number *</Label>
                          <Input
                            id="mobileMoneyNumber"
                            value={formData.mobileMoneyNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, mobileMoneyNumber: e.target.value }))}
                            placeholder="Enter mobile money number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="mobileMoneyProvider">Mobile Money Provider *</Label>
                          <Select value={formData.mobileMoneyProvider} onValueChange={(value: string) => setFormData(prev => ({ ...prev, mobileMoneyProvider: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {mobileMoneyProviders.map((provider) => (
                                <SelectItem key={provider} value={provider}>
                                  {provider}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("business")}
                        >
                          Previous: Business Info
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("contact")}
                          disabled={!isFinancialInfoComplete()}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          Next: Contact Info
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>Enter contact details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="registeredPhoneNumber">Registered Phone Number *</Label>
                          <Input
                            id="registeredPhoneNumber"
                            value={formData.registeredPhoneNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, registeredPhoneNumber: e.target.value }))}
                            placeholder="Enter phone number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessEmail">Business Email *</Label>
                          <Input
                            id="businessEmail"
                            type="email"
                            value={formData.businessEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                            placeholder="Enter business email"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="Enter website URL"
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("financial")}
                        >
                          Previous: Financial Info
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("documents")}
                          disabled={!isContactInfoComplete()}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          Next: Documents
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Upload
                    </CardTitle>
                    <CardDescription>Upload required KYC documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Document Upload Form */}
                      <div className="border rounded-lg p-6 bg-gray-50">
                        <h3 className="text-lg font-medium mb-4">Upload Document</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="file">Document File *</Label>
                            <Input
                              id="file"
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf"
                              onChange={handleFileChange}
                              className="mt-1"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Accepted formats: JPEG, PNG, WebP, PDF (Max 5MB)
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="documentType">Document Type *</Label>
                              <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {documentTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type.replace('_', ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="documentNumber">Document Number</Label>
                              <Input
                                id="documentNumber"
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                                placeholder="Enter document number"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="documentDescription">Description</Label>
                            <Textarea
                              id="documentDescription"
                              value={documentDescription}
                              onChange={(e) => setDocumentDescription(e.target.value)}
                              placeholder="Additional description (optional)"
                              rows={3}
                            />
                          </div>

                          <Button
                            onClick={handleDocumentUpload}
                            disabled={!documentFile || isUploading}
                            className="bg-[#08163d] hover:bg-[#0a1f4f]"
                          >
                            {isUploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Document
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Uploaded Documents List */}
                      {uploadedDocuments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
                          <div className="space-y-3">
                            {uploadedDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium">{doc.originalName}</p>
                                    <p className="text-sm text-gray-500">
                                      {doc.documentType} • {doc.fileSize} bytes • {getStatusBadge(doc.status)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDocument(doc.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("contact")}
                        >
                          Previous: Contact Info
                        </Button>
                        <Button 
                          onClick={() => setActiveTab("review")}
                          disabled={uploadedDocuments.length === 0}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          Next: Review & Submit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review & Submit Tab */}
              <TabsContent value="review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Review & Submit
                    </CardTitle>
                    <CardDescription>Review all information before submitting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Personal Information Review */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                          <div>
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="font-medium">{formData.firstName} {formData.middleName} {formData.lastName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date of Birth</p>
                            <p className="font-medium">{formData.dateOfBirth}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Gender</p>
                            <p className="font-medium">{formData.gender}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">National ID</p>
                            <p className="font-medium">{formData.nationalId}</p>
                          </div>
                        </div>
                      </div>

                      {/* Business Information Review */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Business Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                          <div>
                            <p className="text-sm text-gray-600">Business Trade Name</p>
                            <p className="font-medium">{formData.businessTradeName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Registered Business Name</p>
                            <p className="font-medium">{formData.registeredBusinessName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Business Type</p>
                            <p className="font-medium">{formData.businessType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Business Address</p>
                            <p className="font-medium">{formData.businessAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Financial Information Review */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                          <div>
                            <p className="text-sm text-gray-600">Bank Name</p>
                            <p className="font-medium">{formData.bankName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Account Name</p>
                            <p className="font-medium">{formData.bankAccountName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Account Number</p>
                            <p className="font-medium">{formData.bankAccountNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Mobile Money</p>
                            <p className="font-medium">{formData.mobileMoneyNumber} ({formData.mobileMoneyProvider})</p>
                          </div>
                        </div>
                      </div>

                      {/* Documents Review */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Uploaded Documents ({uploadedDocuments.length})</h3>
                        <div className="space-y-2">
                          {uploadedDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div className="flex-1">
                                <p className="font-medium">{doc.originalName}</p>
                                <p className="text-sm text-gray-500">{doc.documentType}</p>
                              </div>
                              {getStatusBadge(doc.status)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("documents")}
                        >
                          Previous: Documents
                        </Button>
                        <Button
                          onClick={handleFormSubmit}
                          disabled={isSubmitting}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Submit Application
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PermissionGuard>
  )
}

export default MerchantOnboardingPage 