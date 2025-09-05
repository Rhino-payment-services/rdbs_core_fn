"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building,
  CreditCard,
  Shield
} from 'lucide-react'

interface CustomerOverviewProps {
  customer: {
    name: string
    email: string
    phone: string
    status: string
    joinDate: string
    location: string
    address: string
  }
  type: string
  profileDetails: any
}

const CustomerOverview = ({ customer, type, profileDetails }: CustomerOverviewProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderSubscriberDetails = (details: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Date of Birth</div>
            <div className="text-sm text-gray-600">{details.dateOfBirth}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Gender</div>
            <div className="text-sm text-gray-600">{details.gender}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Occupation</div>
            <div className="text-sm text-gray-600">{details.occupation}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Company</div>
            <div className="text-sm text-gray-600">{details.company}</div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Emergency Contact</div>
            <div className="text-sm text-gray-600">{details.emergencyContact}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Preferred Language</div>
            <div className="text-sm text-gray-600">{details.preferredLanguage}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Notification Preferences</div>
            <div className="text-sm text-gray-600">
              {Object.entries(details.notificationPreferences)
                .filter(([_, enabled]) => enabled)
                .map(([type, _]) => type)
                .join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMerchantDetails = (details: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Business Name</div>
            <div className="text-sm text-gray-600">{details.businessName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Business Type</div>
            <div className="text-sm text-gray-600">{details.businessType}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Registration Number</div>
            <div className="text-sm text-gray-600">{details.registrationNumber}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Tax Number</div>
            <div className="text-sm text-gray-600">{details.taxNumber}</div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Business Address</div>
            <div className="text-sm text-gray-600">{details.businessAddress}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Contact Person</div>
            <div className="text-sm text-gray-600">{details.contactPerson}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Contact Phone</div>
            <div className="text-sm text-gray-600">{details.contactPhone}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">Annual Revenue</div>
            <div className="text-sm text-gray-600">
              {new Intl.NumberFormat('en-UG', {
                style: 'currency',
                currency: 'UGX',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(details.annualRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTypeSpecificDetails = () => {
    const details = profileDetails[type]
    if (!details) return null

    switch (type) {
      case 'subscribers':
        return renderSubscriberDetails(details)
      case 'merchants':
        return renderMerchantDetails(details)
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Customer's basic contact and account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Full Name</div>
                  <div className="text-sm text-gray-600">{customer.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Email Address</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Phone Number</div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="text-sm text-gray-600">{customer.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div className="text-sm text-gray-600">{customer.address}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Join Date</div>
                  <div className="text-sm text-gray-600">{new Date(customer.joinDate).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Account Status</div>
                  <div className="text-sm text-gray-600">{getStatusBadge(customer.status)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-Specific Details */}
      {renderTypeSpecificDetails() && (
        <Card>
          <CardHeader>
            <CardTitle>{type.charAt(0).toUpperCase() + type.slice(1)} Details</CardTitle>
            <CardDescription>Specific information for this customer type</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTypeSpecificDetails()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CustomerOverview 