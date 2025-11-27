"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link, Save, X, UserSearch, Search, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useLinkCardToUser } from '@/lib/hooks/useCards'
import { useUsers as useUsersList } from '@/lib/hooks/useAuth'
import api from '@/lib/axios'
import Navbar from '@/components/dashboard/Navbar'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

function LinkCardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const linkCard = useLinkCardToUser()
  const { data: usersData } = useUsersList()
  
  const [formData, setFormData] = useState({
    serialNumber: '',
    userId: '',
    walletId: '',
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userWallets, setUserWallets] = useState<any[]>([])
  const [loadingWallets, setLoadingWallets] = useState(false)

  // Get serial number from URL query parameter
  useEffect(() => {
    const serialNumber = searchParams.get('serialNumber')
    if (serialNumber) {
      setFormData(prev => ({
        ...prev,
        serialNumber: decodeURIComponent(serialNumber)
      }))
    }
  }, [searchParams])

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    // Handle different data formats
    const users = Array.isArray(usersData) ? usersData : (usersData?.data || [])
    if (!users || users.length === 0) return []
    
    console.log('All users:', users)
    console.log('Search term:', searchTerm)
    
    if (!searchTerm.trim()) {
      console.log('No search term, showing first 10 users')
      return users.slice(0, 10)
    }
    
    const searchLower = searchTerm.toLowerCase()
    const filtered = users.filter((user: any) => {
      const email = user.email?.toLowerCase() || ''
      const phone = user.phone?.toLowerCase() || ''
      const firstName = user.profile?.firstName?.toLowerCase() || ''
      const lastName = user.profile?.lastName?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase()
      
      const matches = email.includes(searchLower) || 
                      phone.includes(searchLower) || 
                      firstName.includes(searchLower) ||
                      lastName.includes(searchLower) ||
                      fullName.includes(searchLower)
      
      if (matches) {
        console.log('User matched:', user.profile?.firstName, user.profile?.lastName)
      }
      
      return matches
    })
    
    console.log('Filtered users:', filtered.length)
    return filtered.slice(0, 10)
  }, [usersData, searchTerm])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUserSelect = async (user: any) => {
    setSelectedUser(user)
    handleInputChange('userId', user.id)
    setSearchTerm('') // Clear search
    setFormData(prev => ({ ...prev, walletId: '' })) // Reset wallet selection
    
    // Fetch user wallets
    if (user.id) {
      setLoadingWallets(true)
      try {
        // Use admin endpoint to get all wallets for the user
        const response = await api.get(`/wallet/user/${user.id}/all`)
        const wallets = response.data?.data || response.data || []
        setUserWallets(Array.isArray(wallets) ? wallets : [])
      } catch (error: any) {
        console.error('Error fetching user wallets:', error)
        // Try admin all wallets endpoint and filter as fallback
        try {
          const response = await api.get(`/wallet/admin/all`)
          const allWallets = response.data?.wallets || response.data?.data || response.data || []
          // Filter wallets by userId
          const userWallets = Array.isArray(allWallets) 
            ? allWallets.filter((w: any) => w.userId === user.id)
            : []
          setUserWallets(userWallets)
        } catch (err) {
          console.error('Error fetching wallets from admin endpoint:', err)
          setUserWallets([])
        }
      } finally {
        setLoadingWallets(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userId) {
      toast.error('Please select a user')
      return
    }
    
    if (!formData.walletId) {
      toast.error('Please select a wallet')
      return
    }
    
    try {
      await linkCard.mutateAsync(formData)
      toast.success("✅ Card linked successfully!")
      setTimeout(() => {
        router.push('/dashboard/cards')
      }, 1000)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "❌ Failed to link card")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Link className="h-8 w-8 text-[#08163d]" />
            Link Card to User
          </h1>
          <p className="text-gray-600 mt-2">Link a registered card to a user account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
              <CardHeader>
                <CardTitle>Link Card Details</CardTitle>
                <CardDescription>Enter card serial number and select the user</CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Card Serial Number (Hex) *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="07:c6:31:03"
                  disabled={!!formData.serialNumber}
                  className={formData.serialNumber ? 'bg-gray-100' : ''}
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.serialNumber 
                    ? 'Serial number is auto-filled from the card selection'
                    : 'Enter the card serial number in hexadecimal format'
                  }
                </p>
              </div>

              {/* User Search */}
              <div className="space-y-2">
                <Label htmlFor="userSearch">Search User *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="userSearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500">Search users by name, email, or phone number</p>
              </div>

              {/* User List */}
              {searchTerm && (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  <div className="p-2">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No users found matching "{searchTerm}"
                      </div>
                    ) : (
                      <>
                        <div className="px-2 py-1 text-xs text-gray-500 font-medium">
                          Found {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                        </div>
                        {filteredUsers.map((user: any) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedUser?.id === user.id
                                ? 'bg-[#08163d] text-white'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {user.profile?.firstName || ''} {user.profile?.lastName || ''}
                                  {!user.profile?.firstName && !user.profile?.lastName && 'Unknown User'}
                                </div>
                                <div className={`text-sm ${selectedUser?.id === user.id ? 'text-gray-200' : 'text-gray-500'}`}>
                                  {user.email || user.phone || 'No contact info'}
                                </div>
                              </div>
                              {selectedUser?.id === user.id && (
                                <CheckCircle className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Selected User Info */}
              {selectedUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <UserSearch className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-2">Selected User</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-700 font-medium">Name:</span>
                          <span className="text-sm text-blue-700">
                            {selectedUser.profile?.firstName} {selectedUser.profile?.lastName}
                          </span>
                        </div>
                        {selectedUser.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-700 font-medium">Email:</span>
                            <span className="text-sm text-blue-700">{selectedUser.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-700 font-medium">Phone:</span>
                          <span className="text-sm text-blue-700">{selectedUser.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-700 font-medium">Type:</span>
                          <Badge variant="outline" className="text-blue-700 border-blue-300">
                            {selectedUser.subscriberType || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null)
                        setUserWallets([])
                        handleInputChange('userId', '')
                        handleInputChange('walletId', '')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Wallet Selection */}
                  {selectedUser && (
                    <div className="space-y-2">
                      <Label htmlFor="walletId">Select Wallet *</Label>
                      {loadingWallets ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2" />
                          Loading wallets...
                        </div>
                      ) : userWallets.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm border border-gray-200 rounded-lg">
                          No wallets found for this user
                        </div>
                      ) : (
                        <select
                          id="walletId"
                          value={formData.walletId}
                          onChange={(e) => handleInputChange('walletId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent"
                          required
                        >
                          <option value="">-- Select a wallet --</option>
                          {userWallets.map((wallet: any) => (
                            <option key={wallet.id} value={wallet.id}>
                              {wallet.walletType} - {wallet.currency} {wallet.balance ? Number(wallet.balance).toLocaleString() : '0.00'}
                              {wallet.description ? ` (${wallet.description})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-sm text-gray-500">
                        Select the wallet this card will be linked to
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={linkCard.isPending || !selectedUser || !formData.walletId}
                  className="flex-1"
                >
                  {linkCard.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Link Card
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={linkCard.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}

export default function LinkCardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d] mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <LinkCardContent />
    </Suspense>
  )
}
