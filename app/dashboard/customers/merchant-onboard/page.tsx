"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PhoneSearchForm } from '@/components/dashboard/customers/PhoneSearchForm'
import { ArrowLeft, User, Building2, CheckCircle, Search, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useSession } from 'next-auth/react'
import api from '@/lib/axios'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  
  // Contact Information (essential only)
  registeredPhoneNumber: string
  businessEmail: string
  
  // Additional
  referralCode: string
  country: string
}

const MerchantOnboardingPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("search")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(true)
  const [existingUserId, setExistingUserId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
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
    
    // Contact Information
    registeredPhoneNumber: '',
    businessEmail: '',
    
    // Additional
    referralCode: '',
    country: 'UG'
  })

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when field is changed
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleUserFound = (user: any) => {
    // Pre-fill form data with existing user information
    const userProfile = user.profile || {}
    
    const firstName = userProfile.firstName || user.firstName || ''
    const lastName = userProfile.lastName || user.lastName || ''
    const middleName = userProfile.middleName || user.middleName || ''
    
    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      middleName,
      dateOfBirth: userProfile.dateOfBirth || user.dateOfBirth || '',
      gender: userProfile.gender || user.gender || '',
      nationalId: userProfile.nationalId || user.nationalId || '',
      registeredPhoneNumber: user.phone || '',
      businessEmail: user.email || ''
    }))
    
    setExistingUserId(user.id)
    setIsSearchMode(false)
    setActiveTab("personal")
    toast.success('User information pre-filled successfully!')
  }

  const handleProceedWithoutUser = () => {
    setExistingUserId(null)
    setIsSearchMode(false)
    setActiveTab("personal")
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Personal Information validation
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
    if (!formData.gender) errors.gender = 'Gender is required'
    if (!formData.nationalId.trim()) errors.nationalId = 'National ID is required'
    
    // Business Information validation
    if (!formData.businessTradeName.trim()) errors.businessTradeName = 'Business trade name is required'
    if (!formData.registeredBusinessName.trim()) errors.registeredBusinessName = 'Registered business name is required'
    if (!formData.businessType) errors.businessType = 'Business type is required'
    if (!formData.businessAddress.trim()) errors.businessAddress = 'Business address is required'
    if (!formData.businessCity.trim()) errors.businessCity = 'Business city is required'
    
    // Contact validation
    if (!formData.registeredPhoneNumber.trim()) errors.registeredPhoneNumber = 'Phone number is required'
    if (!formData.businessEmail.trim()) {
      errors.businessEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
      errors.businessEmail = 'Invalid email format'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    setFormErrors({})
    
    try {
      if (!session?.user?.id) {
        toast.error('You must be logged in to onboard merchants')
        return
      }

      // Prepare the submission data - simplified without KYC documents
      const submissionData = {
        // Personal Information
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationalId: formData.nationalId,
        
        // Business Information
        businessInfo: {
          businessTradeName: formData.businessTradeName,
          registeredBusinessName: formData.registeredBusinessName,
          certificateOfIncorporation: formData.certificateOfIncorporation || undefined,
          taxIdentificationNumber: formData.taxIdentificationNumber || undefined,
          businessType: formData.businessType,
          businessRegistrationDate: formData.businessRegistrationDate || undefined,
          businessAddress: formData.businessAddress,
          businessCity: formData.businessCity,
          businessCountry: formData.businessCountry
        },
        
        // Contact Information
        contactInfo: {
          registeredPhoneNumber: formData.registeredPhoneNumber,
          businessEmail: formData.businessEmail
        },
        
        // Additional Information
        referralCode: formData.referralCode || undefined,
        country: formData.country,
        onboardedBy: session.user.id,
        existingUserId: existingUserId || undefined,
        // Skip KYC document requirement - merchant will upload later
        skipKycDocuments: true
      }

      // Submit to API
      const response = await api.post('/merchant-kyc/create', submissionData)
      
      if (response.data.merchantId) {
        toast.success(response.data.message || 'Merchant created successfully! They can complete KYC from their dashboard.')
        router.push('/dashboard/customers')
      } else {
        toast.error(response.data.message || 'Failed to submit application')
      }
    } catch (error: any) {
      console.error('Submission error:', error)
      
      // Extract error message from response
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.data?.message ||
                          error?.message || 
                          'Failed to create merchant. Please try again.'
      const errorStatus = error?.response?.status
      const errorData = error?.response?.data?.data || error?.response?.data
      
      // Handle validation errors (400)
      if (errorStatus === 400) {
        // Check if it's a validation error with field details
        if (Array.isArray(errorData?.message)) {
          const validationErrors = errorData.message.join(', ')
          toast.error(`Validation Error: ${validationErrors}`)
        } else {
          toast.error(errorMessage)
        }
      }
      // Handle specific conflict errors (409)
      else if (errorStatus === 409 || errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
        // Parse the conflict error for specific field
        if (errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('mobile')) {
          setFormErrors(prev => ({ ...prev, registeredPhoneNumber: 'This phone number is already registered with another merchant' }))
          toast.error('Phone number conflict: This phone number is already registered with another merchant. Please use a different phone number or search for the existing account.')
        } else if (errorMessage.toLowerCase().includes('email')) {
          setFormErrors(prev => ({ ...prev, businessEmail: 'This email is already registered with another merchant' }))
          toast.error('Email conflict: This email is already registered with another merchant. Please use a different email or search for the existing account.')
        } else if (errorMessage.toLowerCase().includes('national') || errorMessage.toLowerCase().includes('nin')) {
          setFormErrors(prev => ({ ...prev, nationalId: 'This National ID is already registered with another merchant' }))
          toast.error('National ID conflict: This National ID is already registered with another merchant.')
        } else if (errorMessage.toLowerCase().includes('business') || errorMessage.toLowerCase().includes('trade')) {
          setFormErrors(prev => ({ ...prev, businessTradeName: 'This business name is already registered' }))
          toast.error('Business conflict: This business is already registered.')
        } else {
          // Generic conflict error
          toast.error(errorMessage || 'This merchant already exists. Please check the details and try again.')
        }
      }
      // Handle permission errors (403)
      else if (errorStatus === 403) {
        toast.error('Permission denied: You do not have permission to create merchants.')
      }
      // Handle server errors (500)
      else if (errorStatus === 500) {
        toast.error('Server error: Please try again later or contact support.')
      }
      // Handle all other errors - ALWAYS show toast
      else {
        toast.error(errorMessage || 'Failed to create merchant. Please check your input and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    ...(isSearchMode ? [{ id: 'search', label: 'Search', icon: Search }] : []),
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'review', label: 'Review & Submit', icon: CheckCircle }
  ]

  const canProceedToNext = (currentTab: string): boolean => {
    switch (currentTab) {
      case 'personal':
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender && formData.nationalId && formData.registeredPhoneNumber && formData.businessEmail)
      case 'business':
        return !!(formData.businessTradeName && formData.registeredBusinessName && formData.businessType && formData.businessAddress && formData.businessCity)
      default:
        return true
    }
  }

  const goToNextTab = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id)
    }
  }

  const goToPrevTab = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id)
    }
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MERCHANT_KYC_CREATE}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        <main className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
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
                <p className="text-gray-600 mt-2">Register a new merchant. KYC documents will be uploaded by the merchant from their dashboard.</p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
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

                {isSearchMode && (
                  <TabsContent value="search">
                    <PhoneSearchForm
                      onUserFound={handleUserFound}
                      onProceedWithoutUser={handleProceedWithoutUser}
                    />
                  </TabsContent>
                )}

                {/* Personal Information Tab */}
                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal & Contact Information</CardTitle>
                      <CardDescription>Enter the merchant's personal details and contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleFormDataChange('firstName', e.target.value)}
                            placeholder="Enter first name"
                            className={formErrors.firstName ? 'border-red-500' : ''}
                          />
                          {formErrors.firstName && <p className="text-sm text-red-500">{formErrors.firstName}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleFormDataChange('lastName', e.target.value)}
                            placeholder="Enter last name"
                            className={formErrors.lastName ? 'border-red-500' : ''}
                          />
                          {formErrors.lastName && <p className="text-sm text-red-500">{formErrors.lastName}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input
                            id="middleName"
                            value={formData.middleName}
                            onChange={(e) => handleFormDataChange('middleName', e.target.value)}
                            placeholder="Enter middle name (optional)"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleFormDataChange('dateOfBirth', e.target.value)}
                            className={formErrors.dateOfBirth ? 'border-red-500' : ''}
                          />
                          {formErrors.dateOfBirth && <p className="text-sm text-red-500">{formErrors.dateOfBirth}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender *</Label>
                          <Select value={formData.gender} onValueChange={(value) => handleFormDataChange('gender', value)}>
                            <SelectTrigger className={formErrors.gender ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {formErrors.gender && <p className="text-sm text-red-500">{formErrors.gender}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="nationalId">National ID *</Label>
                          <Input
                            id="nationalId"
                            value={formData.nationalId}
                            onChange={(e) => handleFormDataChange('nationalId', e.target.value)}
                            placeholder="Enter National ID"
                            className={formErrors.nationalId ? 'border-red-500' : ''}
                          />
                          {formErrors.nationalId && <p className="text-sm text-red-500">{formErrors.nationalId}</p>}
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="registeredPhoneNumber">Phone Number *</Label>
                            <Input
                              id="registeredPhoneNumber"
                              value={formData.registeredPhoneNumber}
                              onChange={(e) => handleFormDataChange('registeredPhoneNumber', e.target.value)}
                              placeholder="+256700000000"
                              className={formErrors.registeredPhoneNumber ? 'border-red-500' : ''}
                            />
                            {formErrors.registeredPhoneNumber && <p className="text-sm text-red-500">{formErrors.registeredPhoneNumber}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="businessEmail">Business Email *</Label>
                            <Input
                              id="businessEmail"
                              type="email"
                              value={formData.businessEmail}
                              onChange={(e) => handleFormDataChange('businessEmail', e.target.value)}
                              placeholder="merchant@example.com"
                              className={formErrors.businessEmail ? 'border-red-500' : ''}
                            />
                            {formErrors.businessEmail && <p className="text-sm text-red-500">{formErrors.businessEmail}</p>}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={goToNextTab} disabled={!canProceedToNext('personal')}>
                          Next: Business Info
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Information Tab */}
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Information</CardTitle>
                      <CardDescription>Enter the merchant's business details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessTradeName">Business Trade Name *</Label>
                          <Input
                            id="businessTradeName"
                            value={formData.businessTradeName}
                            onChange={(e) => handleFormDataChange('businessTradeName', e.target.value)}
                            placeholder="Enter trade name"
                            className={formErrors.businessTradeName ? 'border-red-500' : ''}
                          />
                          {formErrors.businessTradeName && <p className="text-sm text-red-500">{formErrors.businessTradeName}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="registeredBusinessName">Registered Business Name *</Label>
                          <Input
                            id="registeredBusinessName"
                            value={formData.registeredBusinessName}
                            onChange={(e) => handleFormDataChange('registeredBusinessName', e.target.value)}
                            placeholder="Enter registered name"
                            className={formErrors.registeredBusinessName ? 'border-red-500' : ''}
                          />
                          {formErrors.registeredBusinessName && <p className="text-sm text-red-500">{formErrors.registeredBusinessName}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="businessType">Business Type *</Label>
                          <Select value={formData.businessType} onValueChange={(value) => handleFormDataChange('businessType', value)}>
                            <SelectTrigger className={formErrors.businessType ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                              <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                              <SelectItem value="LIMITED_LIABILITY">Limited Liability Company</SelectItem>
                              <SelectItem value="CORPORATION">Corporation</SelectItem>
                              <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
                              <SelectItem value="NGO">NGO</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {formErrors.businessType && <p className="text-sm text-red-500">{formErrors.businessType}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessRegistrationDate">Registration Date</Label>
                          <Input
                            id="businessRegistrationDate"
                            type="date"
                            value={formData.businessRegistrationDate}
                            onChange={(e) => handleFormDataChange('businessRegistrationDate', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="certificateOfIncorporation">Certificate of Incorporation</Label>
                          <Input
                            id="certificateOfIncorporation"
                            value={formData.certificateOfIncorporation}
                            onChange={(e) => handleFormDataChange('certificateOfIncorporation', e.target.value)}
                            placeholder="Enter certificate number (optional)"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="taxIdentificationNumber">Tax ID / TIN</Label>
                          <Input
                            id="taxIdentificationNumber"
                            value={formData.taxIdentificationNumber}
                            onChange={(e) => handleFormDataChange('taxIdentificationNumber', e.target.value)}
                            placeholder="Enter TIN (optional)"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Business Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="businessAddress">Street Address *</Label>
                            <Input
                              id="businessAddress"
                              value={formData.businessAddress}
                              onChange={(e) => handleFormDataChange('businessAddress', e.target.value)}
                              placeholder="Enter business address"
                              className={formErrors.businessAddress ? 'border-red-500' : ''}
                            />
                            {formErrors.businessAddress && <p className="text-sm text-red-500">{formErrors.businessAddress}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="businessCity">City *</Label>
                            <Input
                              id="businessCity"
                              value={formData.businessCity}
                              onChange={(e) => handleFormDataChange('businessCity', e.target.value)}
                              placeholder="Enter city"
                              className={formErrors.businessCity ? 'border-red-500' : ''}
                            />
                            {formErrors.businessCity && <p className="text-sm text-red-500">{formErrors.businessCity}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="businessCountry">Country</Label>
                            <Select value={formData.businessCountry} onValueChange={(value) => handleFormDataChange('businessCountry', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UG">Uganda</SelectItem>
                                <SelectItem value="KE">Kenya</SelectItem>
                                <SelectItem value="TZ">Tanzania</SelectItem>
                                <SelectItem value="RW">Rwanda</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={goToPrevTab}>
                          Back
                        </Button>
                        <Button onClick={goToNextTab} disabled={!canProceedToNext('business')}>
                          Next: Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review">
                  <Card>
                    <CardHeader>
                      <CardTitle>Review & Submit</CardTitle>
                      <CardDescription>Review the merchant information before submitting</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The merchant will need to complete their KYC verification by uploading required documents from their merchant dashboard after registration.
                        </AlertDescription>
                      </Alert>

                      {/* Personal Information Summary */}
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-500">Name:</span> {formData.firstName} {formData.middleName} {formData.lastName}</div>
                          <div><span className="text-gray-500">Date of Birth:</span> {formData.dateOfBirth}</div>
                          <div><span className="text-gray-500">Gender:</span> {formData.gender}</div>
                          <div><span className="text-gray-500">National ID:</span> {formData.nationalId}</div>
                          <div><span className="text-gray-500">Phone:</span> {formData.registeredPhoneNumber}</div>
                          <div><span className="text-gray-500">Email:</span> {formData.businessEmail}</div>
                        </div>
                      </div>

                      {/* Business Information Summary */}
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Business Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-500">Trade Name:</span> {formData.businessTradeName}</div>
                          <div><span className="text-gray-500">Registered Name:</span> {formData.registeredBusinessName}</div>
                          <div><span className="text-gray-500">Business Type:</span> {formData.businessType}</div>
                          <div><span className="text-gray-500">Registration Date:</span> {formData.businessRegistrationDate || 'Not provided'}</div>
                          <div><span className="text-gray-500">Certificate:</span> {formData.certificateOfIncorporation || 'Not provided'}</div>
                          <div><span className="text-gray-500">TIN:</span> {formData.taxIdentificationNumber || 'Not provided'}</div>
                          <div className="col-span-2"><span className="text-gray-500">Address:</span> {formData.businessAddress}, {formData.businessCity}, {formData.businessCountry}</div>
                        </div>
                      </div>

                      {Object.keys(formErrors).length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Please fix the errors above before submitting.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={goToPrevTab}>
                          Back
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Merchant...
                            </>
                          ) : (
                            'Create Merchant'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
