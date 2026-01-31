"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Search, User, CheckCircle, Mail, Phone } from 'lucide-react'
import { useUserSearch } from '@/lib/hooks/useUserSearch'
import toast from 'react-hot-toast'

interface PhoneSearchFormProps {
  onUserFound: (user: any) => void
  onProceedWithoutUser: () => void
}

export const PhoneSearchForm: React.FC<PhoneSearchFormProps> = ({
  onUserFound,
  onProceedWithoutUser
}) => {
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const searchValue = searchType === 'phone' ? phoneNumber : email

  const { data: user, isLoading, error, refetch } = useUserSearch({
    phone: searchType === 'phone' ? searchValue : undefined,
    email: searchType === 'email' ? searchValue : undefined,
    enabled: false // We'll trigger it manually
  })

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error(searchType === 'phone' ? 'Please enter a phone number' : 'Please enter an email address')
      return
    }

    if (searchType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchValue)) {
      toast.error('Please enter a valid email address')
      return
    }

    setHasSearched(true)
    try {
      await refetch()
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      const isNotFound = status === 404

      // 404 is expected when user doesn't exist - inline UI handles it, no toast needed
      if (isNotFound) return

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        err?.message ||
        'Failed to search. Please check your connection and try again.'
      toast.error(errorMessage)
    }
  }

  const handleUseExistingUser = () => {
    if (user) {
      onUserFound(user)
    }
  }

  const handleProceedWithoutUser = () => {
    onProceedWithoutUser()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Existing User
        </CardTitle>
        <CardDescription>
          Search for an existing user by phone number or email to pre-fill their information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as 'phone' | 'email')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>
          <div className="space-y-2 mt-4">
            <TabsContent value="phone" className="mt-0">
              <Label htmlFor="phoneSearch">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phoneSearch"
                  placeholder="e.g., +256700000000 or 0742600203"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !phoneNumber.trim()}
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="email" className="mt-0">
              <Label htmlFor="emailSearch">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="emailSearch"
                  type="email"
                  placeholder="e.g., user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !email.trim()}
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {hasSearched && (
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Searching...</span>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Search className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="text-sm">
                      No existing user found {searchType === 'phone' ? 'with this phone number' : 'with this email'}. Proceed to register them as a new merchant.
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={handleProceedWithoutUser} 
                    className="w-full"
                  >
                    Proceed to Create New Merchant Account
                  </Button>
                </div>
              </div>
            )}

            {user && (
              <div className="space-y-4">
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      User found! You can use their existing information or proceed to create a new account.
                    </span>
                  </div>
                </div>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Found User
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-gray-700">
                          {(() => {
                            const firstName = user.profile?.firstName || user.firstName || ''
                            const lastName = user.profile?.lastName || user.lastName || ''
                            const middleName = user.profile?.middleName || user.middleName || ''
                            const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')
                            return fullName || 'Not provided'
                          })()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p className="text-gray-700">{user.phone}</p>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <p className="text-gray-700">{user.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-gray-700">{user.status}</p>
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>
                        <p className="text-gray-700">{user.subscriberType}</p>
                      </div>
                      <div>
                        <span className="font-medium">National ID:</span>
                        <p className="text-gray-700">{user.profile?.nationalId || user.nationalId || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button onClick={handleUseExistingUser} className="flex-1">
                    Use This User's Information
                  </Button>
                  <Button 
                    onClick={handleProceedWithoutUser} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Create New Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Or proceed without searching
            </p>
            <Button 
              onClick={handleProceedWithoutUser} 
              variant="outline"
            >
              Skip Search & Create New Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
