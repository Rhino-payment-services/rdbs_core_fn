"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCard, 
  Plus, 
  Link as LinkIcon, 
  Shield, 
  ShieldOff, 
  Power,
  Edit,
  MoreVertical,
  Search,
  Filter,
  UserPlus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCards, useUpdateCardStatus, useActivateCard } from '@/lib/hooks/useCards'
import Navbar from '@/components/dashboard/Navbar'
import toast from 'react-hot-toast'

export default function CardsPage() {
  const router = useRouter()
  const { data: cardsData, isLoading } = useCards()
  const updateStatus = useUpdateCardStatus()
  const activateCard = useActivateCard()
  const [searchTerm, setSearchTerm] = useState('')

  // Get cards from the response
  const cards = cardsData?.data || []

  const handleBlockCard = async (cardId: string) => {
    try {
      await updateStatus.mutateAsync({ cardId, data: { status: 'BLOCKED' } })
      toast.success("✅ Card blocked successfully!")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "❌ Failed to block card")
    }
  }

  const handleUnblockCard = async (cardId: string) => {
    try {
      await updateStatus.mutateAsync({ cardId, data: { status: 'UNBLOCKED' } })
      toast.success("✅ Card unblocked successfully!")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "❌ Failed to unblock card")
    }
  }

  const handleActivateCard = async (cardId: string, activatedBy: string) => {
    try {
      await activateCard.mutateAsync({ cardId, data: { activatedBy } })
      toast.success("✅ Card activated successfully!")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "❌ Failed to activate card")
    }
  }

  const handleAssignCard = (serialNumber: string) => {
    // Navigate to link page with serial number as query parameter
    router.push(`/dashboard/cards/link?serialNumber=${encodeURIComponent(serialNumber)}`)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ACTIVE': <Badge className="bg-green-100 text-green-800">Active</Badge>,
      'INACTIVE': <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>,
      'BLOCKED': <Badge className="bg-red-100 text-red-800">Blocked</Badge>,
      'EXPIRED': <Badge className="bg-orange-100 text-orange-800">Expired</Badge>,
      'LOST': <Badge className="bg-yellow-100 text-yellow-800">Lost</Badge>,
      'STOLEN': <Badge className="bg-purple-100 text-purple-800">Stolen</Badge>,
    }
    return statusMap[status as keyof typeof statusMap] || <Badge>{status}</Badge>
  }

  const getTierBadge = (tier: string) => {
    const tierMap = {
      'STANDARD': <Badge variant="outline">Standard</Badge>,
      'PREMIUM': <Badge className="bg-blue-100 text-blue-800">Premium</Badge>,
      'GOLD': <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>,
      'PLATINUM': <Badge className="bg-purple-100 text-purple-800">Platinum</Badge>,
    }
    return tierMap[tier as keyof typeof tierMap] || <Badge>{tier}</Badge>
  }

  const filteredCards = cards.filter(card =>
    card.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.cardHolderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.cardLast4.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-[#08163d]" />
              Cards Management
            </h1>
            <p className="text-gray-600 mt-2">Manage physical and virtual cards</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/cards/link')}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Card
            </Button>
            <Button onClick={() => router.push('/dashboard/cards/register')}>
              <Plus className="h-4 w-4 mr-2" />
              Register Card
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cards</p>
                  <p className="text-2xl font-bold">{cards.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-[#08163d]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {cards.filter(c => c.status === 'ACTIVE').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {cards.filter(c => c.status === 'INACTIVE').length}
                  </p>
                </div>
                <ShieldOff className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">
                    {cards.filter(c => c.status === 'BLOCKED').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Cards</CardTitle>
                <CardDescription>View and manage all cards in the system</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d]" />
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No cards found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Card Last 4</TableHead>
                    <TableHead>Card Holder</TableHead>
                    <TableHead>Linked User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card: any) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.serialNumber}</TableCell>
                      <TableCell className="font-mono">{card.cardLast4}</TableCell>
                      <TableCell>{card.cardHolderName || <span className="text-gray-400">Not assigned</span>}</TableCell>
                      <TableCell>
                        {card.user ? (
                          <div>
                            <div className="font-medium">{card.user.name}</div>
                            <div className="text-sm text-gray-500">{card.user.email}</div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Unlinked</Badge>
                        )}
                      </TableCell>
                      <TableCell>{card.cardType}</TableCell>
                      <TableCell>{getTierBadge(card.cardTier)}</TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell>{card.expiryMonth}/{card.expiryYear}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!card.userId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignCard(card.serialNumber)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {card.status === 'BLOCKED' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnblockCard(card.id)}
                                  className="text-green-600"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Unblock Card
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleBlockCard(card.id)}
                                  className="text-red-600"
                                >
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Block Card
                                </DropdownMenuItem>
                              )}
                              {card.status === 'INACTIVE' && card.userId && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleActivateCard(card.id, card.userId!)}
                                    className="text-blue-600"
                                  >
                                    <Power className="h-4 w-4 mr-2" />
                                    Activate Card
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

