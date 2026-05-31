'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  Search,
  Shield,
  User,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCreateUser, useSendWelcomeEmail } from '@/lib/hooks/useApi'
import { useUserAvailabilityCheck } from '@/lib/hooks/useUserAvailabilityCheck'
import { extractErrorMessage } from '@/lib/utils'
import { formatUgandaPhoneDisplay, isMeaningfulUgandaPhone } from '@/lib/utils/uganda-phone'

const STEPS = [
  { id: 1, title: 'Verify contact', description: 'Check email and phone before creating' },
  { id: 2, title: 'Staff details', description: 'Name, department, and role' },
  { id: 3, title: 'Review', description: 'Confirm and create account' },
] as const

const countries = [
  { value: 'UG', label: 'Uganda' },
  { value: 'KE', label: 'Kenya' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'RW', label: 'Rwanda' },
]

const departments = [
  'IT',
  'Operations',
  'Support',
  'Analytics',
  'Security',
  'Finance',
  'Marketing',
  'HR',
  'Customer Service',
  'Product Management',
]

const positions = [
  'System Administrator',
  'Transaction Manager',
  'Customer Support',
  'Data Analyst',
  'Security Officer',
  'Finance Manager',
  'Developer',
  'QA Engineer',
]

function StatusBanner({
  status,
  message,
  variant,
}: {
  status: string
  message?: string
  variant: 'success' | 'error' | 'warning' | 'muted'
}) {
  if (status === 'idle' || status === 'checking' || !message) return null

  const styles = {
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    muted: 'border-slate-200 bg-slate-50 text-slate-700',
  }[variant]

  const Icon =
    variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : AlertCircle

  return (
    <div className={`flex gap-2 rounded-lg border p-3 text-sm ${styles}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

export function CreateStaffUserWizard() {
  const router = useRouter()
  const createUserMutation = useCreateUser()
  const sendWelcomeEmailMutation = useSendWelcomeEmail()
  const { emailResult, phoneResult, checkEmail, checkPhone } = useUserAvailabilityCheck()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    country: 'UG',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)

  const phoneEntered = phone.trim().length > 0 && phone.trim() !== '+256'

  const phoneOk =
    !phoneEntered ||
    (phoneVerified &&
      !phoneResult.isSubscriberConflict &&
      phoneResult.status !== 'invalid' &&
      phoneResult.status !== 'error')

  const canProceedStep1 = emailVerified && emailResult.status === 'available' && phoneOk

  const handleVerifyEmail = async () => {
    setEmailVerified(false)
    const result = await checkEmail(email)
    setEmailVerified(result.status === 'available')
  }

  const handleVerifyPhone = async () => {
    setPhoneVerified(false)
    if (!phoneEntered) {
      setPhoneVerified(true)
      return
    }
    const result = await checkPhone(phone)
    if (result.isSubscriberConflict || result.status === 'invalid' || result.status === 'error') {
      setPhoneVerified(false)
      return
    }
    setPhoneVerified(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep2 = () => {
    const next: Record<string, string> = {}
    if (!formData.firstName.trim()) next.firstName = 'First name is required'
    if (!formData.lastName.trim()) next.lastName = 'Last name is required'
    if (!formData.department) next.department = 'Department is required'
    if (!formData.position) next.position = 'Position is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!canProceedStep1) {
      toast.error('Complete contact verification first')
      setStep(1)
      return
    }
    if (!validateStep2()) {
      setStep(2)
      return
    }

    try {
      const userResponse = await createUserMutation.mutateAsync({
        email: email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        department: formData.department,
        position: formData.position,
        country: formData.country,
        role: 'ADMIN',
        userType: 'STAFF_USER',
        password: 'temp-password-will-be-set-via-otp',
      })
      const createdUser = (userResponse.data || userResponse) as { id: string }

      if (sendWelcomeEmail) {
        try {
          await sendWelcomeEmailMutation.mutateAsync({
            email: email.trim(),
            userName: `${formData.firstName} ${formData.lastName}`,
            userId: createdUser.id,
            metadata: { channel: 'BACKOFFICE', referralCode: `REF${Date.now()}` },
          })
          toast.success('Staff user created. They will receive an email to set their password.')
        } catch (emailError: unknown) {
          toast.error(
            `Staff user created, but welcome email failed: ${extractErrorMessage(emailError)}`,
          )
        }
      } else {
        toast.success('Staff user created successfully.')
      }

      router.push('/dashboard/users')
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                step === s.id
                  ? 'bg-blue-600 text-white'
                  : step > s.id
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                {step > s.id ? '✓' : s.id}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-gray-200 min-w-[24px]" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Step 1 — Verify contact details
            </CardTitle>
            <CardDescription>
              Check that the email is free and that the phone is not already a customer wallet.
              Staff sign in with email only; phone is not stored on the account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Work email *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="staff-email"
                    type="email"
                    className="pl-9"
                    placeholder="staff@rukapay.co.ug"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailVerified(false)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmail()}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleVerifyEmail}
                  disabled={emailResult.status === 'checking' || !email.trim()}
                >
                  {emailResult.status === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Check'
                  )}
                </Button>
              </div>
              <StatusBanner
                status={emailResult.status}
                message={emailResult.message}
                variant={
                  emailResult.status === 'available'
                    ? 'success'
                    : emailResult.status === 'taken' || emailResult.status === 'invalid'
                      ? 'error'
                      : emailResult.status === 'error'
                        ? 'error'
                        : 'muted'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone (optional — conflict check only)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="staff-phone"
                    type="tel"
                    className="pl-9"
                    placeholder="0700123456 or +256700123456"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setPhoneVerified(false)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyPhone()}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleVerifyPhone}
                  disabled={phoneResult.status === 'checking'}
                >
                  {phoneResult.status === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Check'
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Optional. We verify the number is not tied to an existing customer wallet. It will
                not be saved on the staff profile.
              </p>
              {phoneEntered && !isMeaningfulUgandaPhone(phone) && (
                <p className="text-xs text-amber-700">Enter a complete Uganda mobile number before checking.</p>
              )}
              <StatusBanner
                status={phoneResult.status}
                message={phoneResult.message}
                variant={
                  phoneResult.status === 'available'
                    ? 'success'
                    : phoneResult.isSubscriberConflict
                      ? 'error'
                      : phoneResult.status === 'taken'
                        ? 'warning'
                        : phoneResult.status === 'invalid' || phoneResult.status === 'error'
                          ? 'error'
                          : 'muted'
                }
              />
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-blue-900">Staff login policy</AlertTitle>
              <AlertDescription className="text-blue-800 text-sm">
                Internal staff use email and a password setup link. Customer phone numbers cannot be
                reused for staff accounts.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Step 2 — Staff details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => handleInputChange('department', v)}
                >
                  <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Position *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(v) => handleInputChange('position', v)}
                >
                  <SelectTrigger className={errors.position ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(v) => handleInputChange('country', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3 — Review</CardTitle>
            <CardDescription>Confirm details before creating the staff account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium">{email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone check</dt>
                <dd className="font-medium">
                  {phoneEntered ? formatUgandaPhoneDisplay(phone) : 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium">
                  {formData.firstName} {formData.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Department / position</dt>
                <dd className="font-medium">
                  {formData.department} · {formData.position}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="font-medium">Administrator (Staff)</dd>
              </div>
            </dl>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="sendWelcomeEmail"
                checked={sendWelcomeEmail}
                onCheckedChange={(c) => setSendWelcomeEmail(c === true)}
              />
              <Label htmlFor="sendWelcomeEmail" className="text-sm font-normal">
                Send welcome email with password setup link
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Link href="/dashboard/users">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button
              type="button"
              disabled={step === 1 && !canProceedStep1}
              onClick={async () => {
                if (step === 1) {
                  const emailRes = emailVerified ? emailResult : await checkEmail(email)
                  if (emailRes.status !== 'available') {
                    setEmailVerified(false)
                    toast.error(emailRes.message || 'Email is not available')
                    return
                  }
                  setEmailVerified(true)

                  if (phoneEntered) {
                    const phoneRes = phoneVerified ? phoneResult : await checkPhone(phone)
                    if (
                      phoneRes.isSubscriberConflict ||
                      phoneRes.status === 'invalid' ||
                      phoneRes.status === 'error'
                    ) {
                      setPhoneVerified(false)
                      toast.error(phoneRes.message || 'Phone check failed')
                      return
                    }
                    setPhoneVerified(true)
                  }
                }
                if (step === 2 && !validateStep2()) return
                setStep((s) => (s + 1) as 1 | 2 | 3)
              }}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createUserMutation.isPending || sendWelcomeEmailMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create staff user
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
