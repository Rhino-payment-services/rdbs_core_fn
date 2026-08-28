"use client"

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Phone, Users, ExternalLink, Loader2 } from 'lucide-react'
import api from '@/lib/axios'

interface MerchantHierarchyPanelProps {
  merchant: {
    id: string
    isSuperMerchant?: boolean
    parentMerchantId?: string | null
    parentMerchant?: {
      id: string
      merchantCode: string
      businessTradeName: string
    } | null
    childMerchantsCount?: number
    registeredPhoneNumber?: string | null
    phone?: string | null
    ownerLoginPhone?: string | null
  }
}

const merchantProfileHref = (merchantId: string) =>
  `/dashboard/customers/merchant/${merchantId}`

export const MerchantHierarchyPanel: React.FC<MerchantHierarchyPanelProps> = ({
  merchant,
}) => {
  const registeredPhone =
    merchant.registeredPhoneNumber || merchant.phone || null
  const ownerLoginPhone = merchant.ownerLoginPhone || null
  const phonesDiffer =
    registeredPhone &&
    ownerLoginPhone &&
    registeredPhone.replace(/\D/g, '') !== ownerLoginPhone.replace(/\D/g, '')

  const shouldFetchChildren =
    Boolean(merchant.isSuperMerchant) &&
    (merchant.childMerchantsCount ?? 0) > 0

  const { data: childData, isLoading: childrenLoading } = useQuery({
    queryKey: ['super-merchant-children', merchant.id],
    queryFn: async () => {
      const response = await api.get(
        `/super-merchant/child-merchants/${merchant.id}`,
      )
      return response.data as {
        childMerchants: Array<{
          id: string
          merchantCode: string
          businessTradeName: string
          isActive: boolean
          isVerified: boolean
          businessCity?: string
          registeredPhoneNumber?: string
          ownerLoginPhone?: string | null
        }>
        total: number
      }
    },
    enabled: shouldFetchChildren,
  })

  const childMerchants = childData?.childMerchants ?? []
  const showHierarchy =
    merchant.isSuperMerchant ||
    merchant.parentMerchantId ||
    registeredPhone ||
    ownerLoginPhone

  if (!showHierarchy) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Merchant hierarchy & login
        </CardTitle>
        <CardDescription>
          Super-merchant assignment and portal login numbers for support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-gray-500" />
              Portal login phone (owner account)
            </div>
            <div className="text-sm text-gray-700">
              {ownerLoginPhone || 'Not set'}
            </div>
            <p className="text-xs text-gray-500">
              Phone on the user account — used to sign into the merchant dashboard.
            </p>
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-gray-500" />
              Registered business phone
            </div>
            <div className="text-sm text-gray-700">
              {registeredPhone || 'Not set'}
            </div>
            <p className="text-xs text-gray-500">
              Business phone on the merchant record — USSD and customer-facing lookup.
            </p>
          </div>
        </div>

        {phonesDiffer && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Owner login phone and registered business phone differ. Child merchants
            under a super merchant keep their original login numbers after assignment.
          </p>
        )}

        {merchant.isSuperMerchant && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Super merchant</span>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {merchant.childMerchantsCount ?? childMerchants.length} child
                {(merchant.childMerchantsCount ?? childMerchants.length) === 1
                  ? ''
                  : 'ren'}
              </Badge>
            </div>

            {shouldFetchChildren && childrenLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading child merchants…
              </div>
            )}

            {!childrenLoading && childMerchants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Business</th>
                      <th className="py-2 pr-4 font-medium">Code</th>
                      <th className="py-2 pr-4 font-medium">Login phone</th>
                      <th className="py-2 pr-4 font-medium">Registered phone</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childMerchants.map((child) => (
                      <tr key={child.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link
                            href={merchantProfileHref(child.id)}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {child.businessTradeName}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          {child.merchantCode}
                        </td>
                        <td className="py-2 pr-4">
                          {child.ownerLoginPhone || '—'}
                        </td>
                        <td className="py-2 pr-4">
                          {child.registeredPhoneNumber || '—'}
                        </td>
                        <td className="py-2">
                          <Badge
                            variant="outline"
                            className={
                              child.isActive
                                ? 'text-green-700 border-green-200'
                                : 'text-gray-600'
                            }
                          >
                            {child.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!childrenLoading &&
              (merchant.childMerchantsCount ?? 0) === 0 &&
              childMerchants.length === 0 && (
                <p className="text-sm text-gray-500">No child merchants assigned.</p>
              )}

            <Link
              href="/dashboard/customers/super-merchants"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Manage super merchants
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {merchant.parentMerchant && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="text-sm font-medium">Assigned under super merchant</div>
            <Link
              href={merchantProfileHref(merchant.parentMerchant.id)}
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              {merchant.parentMerchant.businessTradeName} (
              {merchant.parentMerchant.merchantCode})
              <ExternalLink className="h-3 w-3" />
            </Link>
            <p className="text-xs text-gray-500">
              This merchant operates under the super merchant above. Portal login
              remains on the owner&apos;s original phone number.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MerchantHierarchyPanel
