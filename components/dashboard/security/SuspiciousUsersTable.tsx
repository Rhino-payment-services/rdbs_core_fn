"use client"

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  AlertTriangle, 
  Shield, 
  ShieldOff, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Loader2
} from 'lucide-react'
import { useSuspiciousUsers, type SuspiciousUser } from '@/lib/hooks/useSuspiciousTransactions'
import { useBlockUser, useUnblockUser } from '@/lib/hooks/useUserBlocking'
import { formatDistanceToNow } from 'date-fns'

interface SuspiciousUsersTableProps {
  limit?: number
}

export function SuspiciousUsersTable({ limit = 50 }: SuspiciousUsersTableProps) {
  const { data: suspiciousUsers, isLoading, refetch } = useSuspiciousUsers()
  const blockUserMutation = useBlockUser()
  const unblockUserMutation = useUnblockUser()
  
  const [selectedUser, setSelectedUser] = useState<SuspiciousUser | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  const displayedUsers = suspiciousUsers?.slice(0, limit) || []

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleBlock = () => {
    if (!selectedUser || !blockReason.trim()) {
      return
    }

    blockUserMutation.mutate(
      {
        userId: selectedUser.userId,
        reason: blockReason,
        notifyUser: true
      },
      {
        onSuccess: () => {
          setBlockDialogOpen(false)
          setBlockReason('')
          setSelectedUser(null)
          refetch()
        }
      }
    )
  }

  const handleUnblock = () => {
    if (!selectedUser) {
      return
    }

    unblockUserMutation.mutate(
      {
        userId: selectedUser.userId,
        reason: 'Account restored after review'
      },
      {
        onSuccess: () => {
          setUnblockDialogOpen(false)
          setSelectedUser(null)
          refetch()
        }
      }
    )
  }

  const toggleExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!displayedUsers || displayedUsers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No suspicious users detected</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>User</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Suspicious Txs</TableHead>
              <TableHead>Failed Txs</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedUsers.map((user) => {
              const isExpanded = expandedUsers.has(user.userId)
              return (
                <React.Fragment key={user.userId}>
                  <TableRow className={user.riskLevel === 'critical' ? 'bg-red-50' : ''}>
                    <TableCell>
                      {user.transactions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(user.userId)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.name || user.email || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskBadgeColor(user.riskLevel)}>
                        {user.riskLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              user.riskScore >= 80
                                ? 'bg-red-500'
                                : user.riskScore >= 60
                                ? 'bg-orange-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${user.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{user.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.suspiciousTransactionCount}</TableCell>
                    <TableCell>{user.failedTransactionCount}</TableCell>
                    <TableCell>
                      {user.totalAmount.toLocaleString()} {user.transactions[0]?.currency || 'UGX'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.flags.slice(0, 2).map((flag) => (
                          <Badge key={flag} variant="outline" className="text-xs">
                            {flag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {user.flags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.flags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(user.lastSuspiciousActivity), {
                        addSuffix: true
                      })}
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setBlockDialogOpen(true)
                          }}
                          disabled={user.isBlocked || blockUserMutation.isPending}
                        >
                          <ShieldOff className="h-4 w-4 mr-1" />
                          Block
                        </Button>
                        {user.isBlocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setUnblockDialogOpen(true)
                            }}
                            disabled={unblockUserMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Unblock
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && user.transactions.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="bg-gray-50">
                        <div className="py-4">
                          <h4 className="font-semibold mb-3">Suspicious Transactions</h4>
                          <div className="space-y-2">
                            {user.transactions.map((tx) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{tx.reference}</span>
                                    <Badge className={getRiskBadgeColor(tx.riskLevel)}>
                                      {tx.riskLevel}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                      {tx.amount.toLocaleString()} {tx.currency}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {tx.reason}
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    {tx.flags.map((flag) => (
                                      <Badge key={flag} variant="outline" className="text-xs">
                                        {flag.replace(/_/g, ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(tx.createdAt), {
                                    addSuffix: true
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Block user {selectedUser?.name || selectedUser?.email || selectedUser?.phone} due to
              suspicious activity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="block-reason">Reason for blocking</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter reason for blocking this user..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
              />
            </div>
            {selectedUser && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Suspicious Activity Detected:</p>
                    <ul className="list-disc list-inside mt-1 text-yellow-800">
                      <li>{selectedUser.suspiciousTransactionCount} suspicious transactions</li>
                      <li>{selectedUser.failedTransactionCount} failed transactions</li>
                      <li>Risk Score: {selectedUser.riskScore}/100</li>
                      <li>Flags: {selectedUser.flags.join(', ')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBlockDialogOpen(false)
                setBlockReason('')
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={!blockReason.trim() || blockUserMutation.isPending}
            >
              {blockUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                'Block User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock User Dialog */}
      <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock User</DialogTitle>
            <DialogDescription>
              Restore access for user {selectedUser?.name || selectedUser?.email || selectedUser?.phone}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnblockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUnblock}
              disabled={unblockUserMutation.isPending}
            >
              {unblockUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unblocking...
                </>
              ) : (
                'Unblock User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
