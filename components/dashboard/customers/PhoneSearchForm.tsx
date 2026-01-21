"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Search, User, CheckCircle, AlertCircle } from 'lucide-react'
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
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const { data: user, isLoading, error, refetch } = useUserSearch({
    phone: phoneNumber,
    enabled: false // We'll trigger it manually
  })

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    setHasSearched(true)
    try {
      await refetch()
    } catch (err: any) {
      // Extract and show error message
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.data?.message ||
                          err?.message || 
                          'Failed to search for user. Please try again.'
      
      // Show toast error notification
      toast.error(errorMessage || 'User not found. You can proceed to create a new merchant account.')
      console.error('User search error:', err)
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
          Search for an existing user by phone number to pre-fill their information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phoneSearch">Phone Number</Label>
          <div className="flex gap-2">
            <Input
              id="phoneSearch"
              placeholder="Enter phone number (e.g., +256700000000)"
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
        </div>

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
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      No user found with this phone number. You can proceed to create a new merchant account.
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
