"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Save,
  Shield,
  User,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useCreateUser, useSendWelcomeEmail } from '@/lib/hooks/useApi'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'

const CreateUserPage = () => {
  const router = useRouter()
  const createUserMutation = useCreateUser()
  const sendWelcomeEmailMutation = useSendWelcomeEmail()
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '+256',
    role: 'ADMIN', // Default to ADMIN for staff users
    userType: 'STAFF_USER', // Default to STAFF_USER for staff creation
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    country: 'UG' // Default to Uganda
  })

  // Removed showPassword state as password field is no longer needed
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  // Staff users are always ADMIN role and STAFF_USER type - no need for dropdowns

  // Countries
  const countries = [
    { value: "UG", label: "Uganda" },
    { value: "KE", label: "Kenya" },
    { value: "TZ", label: "Tanzania" },
    { value: "RW", label: "Rwanda" },
    { value: "NG", label: "Nigeria" },
    { value: "GH", label: "Ghana" },
    { value: "ZA", label: "South Africa" }
  ]

  // Departments
  const departments = [
    "IT",
    "Operations", 
    "Support",
    "Analytics",
    "Security",
    "Finance",
    "Marketing",
    "HR",
    "Customer Service",
    "Product Management"
  ]

  // Positions
  const positions = [
    "System Administrator",
    "Transaction Manager",
    "Customer Support",
    "Data Analyst",
    "Security Officer",
    "Finance Manager",
    "Marketing Specialist",
    "HR Manager",
    "Product Manager",
    "Business Analyst",
    "Developer",
    "QA Engineer"
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    
    // Optional fields - no validation required
    // Phone, role, userType, department, position, country have defaults
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // Create the user first - add a temporary password since it will be set via OTP
      const userResponse = await createUserMutation.mutateAsync({
        ...formData,
        password: 'temp-password-will-be-set-via-otp' // Temporary password, will be replaced via OTP flow
      })
      const createdUser = (userResponse.data || userResponse) as any
      console.log('Created user:', userResponse)
      
      // Send welcome email after successful user creation (if enabled)
      if (sendWelcomeEmail) {
        try {
          const emailData = {
            email: formData.email,
            userName: `${formData.firstName} ${formData.lastName}`,
            userId: createdUser.id,
            metadata: {
              channel: "BACKOFFICE",
              referralCode: `REF${Date.now()}` // Generate a simple referral code
            }
          }
          console.log('Sending welcome email with data:', emailData)
          console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL)
          await sendWelcomeEmailMutation.mutateAsync(emailData)
          toast.success('Staff user created successfully! They will receive an email to set their password.')
        } catch (emailError: unknown) {
          // User was created successfully, but email failed
          console.error('Failed to send welcome email:', emailError)
          const emailErrorMessage = extractErrorMessage(emailError)
          console.error('Email error details:', emailErrorMessage)
          toast.error(`Staff user created successfully, but email failed: ${emailErrorMessage}`)
        }
      } else {
        toast.success('Staff user created successfully!')
      }
      
      router.push('/dashboard/users')
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard/users">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Users
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Staff User</h1>
            <p className="text-gray-600">Add a new staff member to the system. They will receive an email to set their own password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Enter the user&apos;s personal and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.firstName}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.lastName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number with country code"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={formData.country} onValueChange={(value: string) => handleInputChange('country', value)}>
                      <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        {errors.country}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select value={formData.department} onValueChange={(value: string) => handleInputChange('department', value)}>
                      <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.department}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position *</Label>
                    <Select value={formData.position} onValueChange={(value: string) => handleInputChange('position', value)}>
                      <SelectTrigger className={errors.position ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.position && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.position}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Staff User Information
                </CardTitle>
                <CardDescription>This user will be created as an Administrator with Staff privileges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Staff User Configuration</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>• <strong>Role:</strong> Administrator</p>
                    <p>• <strong>User Type:</strong> Staff (Internal)</p>
                    <p>• <strong>Privileges:</strong> Determined by assigned role</p>
                  </div>
                </div>
                
                {/* Email Options */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendWelcomeEmail"
                      checked={sendWelcomeEmail}
                      onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
                    />
                    <Label htmlFor="sendWelcomeEmail" className="text-sm font-medium">
                      Send welcome email to the new user
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    A welcome email will be sent to the user with a password setup link. The user will set their own password.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Link href="/dashboard/users">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={createUserMutation.isPending || sendWelcomeEmailMutation.isPending}
              >
                {createUserMutation.isPending || sendWelcomeEmailMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Staff User...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Staff User
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default CreateUserPage 