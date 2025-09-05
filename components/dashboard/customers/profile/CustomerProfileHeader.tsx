"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Download,
  Edit,
  MoreHorizontal
} from 'lucide-react'

interface CustomerProfileHeaderProps {
  customer: {
    id: string
    name: string
    type: string
  }
  onBack: () => void
  onExport: () => void
  onEdit: () => void
  onActions: () => void
}

const CustomerProfileHeader = ({ 
  customer, 
  onBack, 
  onExport, 
  onEdit, 
  onActions 
}: CustomerProfileHeaderProps) => {
  const getCustomerTypeBadge = (type: string) => {
    switch (type) {
      case 'subscribers':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Subscriber</Badge>
      case 'merchants':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Merchant</Badge>
      case 'partners':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Partner</Badge>
      case 'agents':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Agent</Badge>
      case 'superAgents':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Super Agent</Badge>
      case 'banks':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Bank</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">ID: {customer.id}</span>
            {getCustomerTypeBadge(customer.type)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onActions} className="flex items-center gap-2">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </Button>
      </div>
    </div>
  )
}

export default CustomerProfileHeader 