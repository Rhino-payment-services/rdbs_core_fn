"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Save, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateSystemCard } from '@/lib/hooks/useCards'
import Navbar from '@/components/dashboard/Navbar'
import toast from 'react-hot-toast'

export default function RegisterCardPage() {
  const router = useRouter()
  const createCard = useCreateSystemCard()
  
  const [formData, setFormData] = useState({
    serialNumber: '',
    cardLast4: '',
    expiryMonth: '',
    expiryYear: '',
    cardType: 'PHYSICAL' as 'PHYSICAL' | 'VIRTUAL',
    cardTier: 'STANDARD' as 'STANDARD' | 'PREMIUM' | 'GOLD' | 'PLATINUM',
    partnerCode: '',
    externalId: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSerialNumberChange = (value: string) => {
    handleInputChange('serialNumber', value)
    
    // Auto-generate cardLast4 from serial number (hex format: 07:c6:31:03 -> 31:03)
    if (value.includes(':')) {
      const parts = value.split(':')
      if (parts.length >= 2) {
        const last4 = parts.slice(-2).join(':')
        handleInputChange('cardLast4', last4)
      }
    } else if (value.length >= 4) {
      // If no colons, use last 4 characters
      handleInputChange('cardLast4', value.slice(-4))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createCard.mutateAsync(formData)
      toast.success("✅ Card registered successfully!")
      setTimeout(() => {
        router.push('/dashboard/cards')
      }, 1000)
    } catch (error: any) {
      console.error('Card registration error:', error)
      // Handle both axios error format and Error object format
      const errorMessage = error?.response?.data?.message || 
                          error?.data?.message || 
                          error?.message || 
                          "❌ Failed to register card"
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-[#08163d]" />
            Register New Card
          </h1>
          <p className="text-gray-600 mt-2">Register a physical or virtual card in the system</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Card Information</CardTitle>
              <CardDescription>Enter card details to register in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number (Hex Format) *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleSerialNumberChange(e.target.value)}
                  placeholder="07:c6:31:03"
                  required
                />
                <p className="text-sm text-gray-500">Enter serial number in hexadecimal format (e.g., 07:c6:31:03)</p>
              </div>

              {/* Card Last 4 */}
              <div className="space-y-2">
                <Label htmlFor="cardLast4">Card Last 4</Label>
                <Input
                  id="cardLast4"
                  value={formData.cardLast4}
                  onChange={(e) => handleInputChange('cardLast4', e.target.value)}
                  placeholder="31:03"
                />
                <p className="text-sm text-gray-500">Auto-generated from serial number</p>
              </div>

              {/* Expiry Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Expiry Month *</Label>
                  <Input
                    id="expiryMonth"
                    value={formData.expiryMonth}
                    onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                    placeholder="12"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Expiry Year *</Label>
                  <Input
                    id="expiryYear"
                    value={formData.expiryYear}
                    onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                    placeholder="2025"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {/* Card Type */}
              <div className="space-y-2">
                <Label htmlFor="cardType">Card Type *</Label>
                <Select value={formData.cardType} onValueChange={(value) => handleInputChange('cardType', value)}>
                  <SelectTrigger id="cardType">
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHYSICAL">Physical Card</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Card Tier */}
              <div className="space-y-2">
                <Label htmlFor="cardTier">Card Tier *</Label>
                <Select value={formData.cardTier} onValueChange={(value) => handleInputChange('cardTier', value)}>
                  <SelectTrigger id="cardTier">
                    <SelectValue placeholder="Select card tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Partner Code (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="partnerCode">Partner Code</Label>
                <Input
                  id="partnerCode"
                  value={formData.partnerCode}
                  onChange={(e) => handleInputChange('partnerCode', e.target.value)}
                  placeholder="ABC"
                />
                <p className="text-sm text-gray-500">Optional: Partner who issued the card</p>
              </div>

              {/* External ID (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="externalId">External ID</Label>
                <Input
                  id="externalId"
                  value={formData.externalId}
                  onChange={(e) => handleInputChange('externalId', e.target.value)}
                  placeholder="Partner's card ID"
                />
                <p className="text-sm text-gray-500">Optional: Partner's internal card ID</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createCard.isPending}
                  className="flex-1"
                >
                  {createCard.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Register Card
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createCard.isPending}
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

