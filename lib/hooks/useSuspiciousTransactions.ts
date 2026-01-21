"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../axios'
import toast from 'react-hot-toast'

export interface SuspiciousTransaction {
  id: string
  transactionId: string
  reference: string
  userId: string
  userEmail?: string
  userPhone?: string
  userName?: string
  amount: number
  currency: string
  type: string
  mode: string
  status: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  flags: string[]
  reason: string
  ip?: string
  location?: string
  device?: string
  createdAt: string
  metadata?: Record<string, any>
}

export interface SuspiciousUser {
  userId: string
  email?: string
  phone: string
  name?: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  suspiciousTransactionCount: number
  failedTransactionCount: number
  totalAmount: number
  flags: string[]
  lastSuspiciousActivity: string
  transactions: SuspiciousTransaction[]
  isBlocked: boolean
  blockedAt?: string
}

export interface SuspiciousPattern {
  pattern: string
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  count: number
}

// Detect suspicious transaction patterns
function detectSuspiciousPatterns(transactions: any[]): SuspiciousTransaction[] {
  const suspicious: SuspiciousTransaction[] = []
  
  // Group transactions by user
  const userTransactions = new Map<string, any[]>()
  transactions.forEach(tx => {
    if (!userTransactions.has(tx.userId)) {
      userTransactions.set(tx.userId, [])
    }
    userTransactions.get(tx.userId)!.push(tx)
  })

  userTransactions.forEach((userTxs, userId) => {
    const failedTxs = userTxs.filter(tx => tx.status === 'FAILED')
    const successfulTxs = userTxs.filter(tx => tx.status === 'SUCCESS')
    const totalAmount = userTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
    const avgAmount = totalAmount / userTxs.length
    
    // Pattern 1: Multiple failed transactions in short time
    if (failedTxs.length >= 5) {
      const recentFailed = failedTxs
        .filter(tx => {
          const txTime = new Date(tx.createdAt).getTime()
          const oneHourAgo = Date.now() - 60 * 60 * 1000
          return txTime > oneHourAgo
        })
      
      if (recentFailed.length >= 5) {
        recentFailed.forEach(tx => {
          suspicious.push({
            id: tx.id,
            transactionId: tx.id,
            reference: tx.reference || tx.id,
            userId: tx.userId,
            userEmail: tx.user?.email,
            userPhone: tx.user?.phone,
            userName: tx.user?.firstName ? `${tx.user.firstName} ${tx.user.lastName || ''}`.trim() : undefined,
            amount: Number(tx.amount) || 0,
            currency: tx.currency || 'UGX',
            type: tx.type,
            mode: tx.mode,
            status: tx.status,
            riskScore: 85,
            riskLevel: 'high',
            flags: ['multiple_failed_transactions', 'rapid_failures'],
            reason: `User has ${recentFailed.length} failed transactions in the last hour`,
            ip: tx.metadata?.ipAddress,
            location: tx.metadata?.location,
            device: tx.metadata?.device,
            createdAt: tx.createdAt,
            metadata: tx.metadata
          })
        })
      }
    }

    // Pattern 2: Unusually large amounts
    const largeAmountThreshold = 10000000 // 10M UGX
    userTxs.forEach(tx => {
      const amount = Number(tx.amount) || 0
      if (amount > largeAmountThreshold && tx.status === 'FAILED') {
        suspicious.push({
          id: tx.id,
          transactionId: tx.id,
          reference: tx.reference || tx.id,
          userId: tx.userId,
          userEmail: tx.user?.email,
          userPhone: tx.user?.phone,
          userName: tx.user?.firstName ? `${tx.user.firstName} ${tx.user.lastName || ''}`.trim() : undefined,
          amount,
          currency: tx.currency || 'UGX',
          type: tx.type,
          mode: tx.mode,
          status: tx.status,
          riskScore: 90,
          riskLevel: 'critical',
          flags: ['large_amount', 'failed_large_transaction'],
          reason: `Failed transaction with unusually large amount: ${amount.toLocaleString()} ${tx.currency || 'UGX'}`,
          ip: tx.metadata?.ipAddress,
          location: tx.metadata?.location,
          device: tx.metadata?.device,
          createdAt: tx.createdAt,
          metadata: tx.metadata
        })
      }
    })

    // Pattern 3: Rapid successive transactions
    const sortedTxs = [...userTxs].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    for (let i = 0; i < sortedTxs.length - 4; i++) {
      const batch = sortedTxs.slice(i, i + 5)
      const timeDiff = new Date(batch[4].createdAt).getTime() - new Date(batch[0].createdAt).getTime()
      const fiveMinutes = 5 * 60 * 1000
      
      if (timeDiff < fiveMinutes) {
        batch.forEach(tx => {
          if (!suspicious.find(s => s.id === tx.id)) {
            suspicious.push({
              id: tx.id,
              transactionId: tx.id,
              reference: tx.reference || tx.id,
              userId: tx.userId,
              userEmail: tx.user?.email,
              userPhone: tx.user?.phone,
              userName: tx.user?.firstName ? `${tx.user.firstName} ${tx.user.lastName || ''}`.trim() : undefined,
              amount: Number(tx.amount) || 0,
              currency: tx.currency || 'UGX',
              type: tx.type,
              mode: tx.mode,
              status: tx.status,
              riskScore: 75,
              riskLevel: 'high',
              flags: ['rapid_transactions', 'velocity_check'],
              reason: '5+ transactions within 5 minutes',
              ip: tx.metadata?.ipAddress,
              location: tx.metadata?.location,
              device: tx.metadata?.device,
              createdAt: tx.createdAt,
              metadata: tx.metadata
            })
          }
        })
      }
    }

    // Pattern 4: High failure rate
    const failureRate = failedTxs.length / userTxs.length
    if (userTxs.length >= 10 && failureRate > 0.7) {
      failedTxs.forEach(tx => {
        if (!suspicious.find(s => s.id === tx.id)) {
          suspicious.push({
            id: tx.id,
            transactionId: tx.id,
            reference: tx.reference || tx.id,
            userId: tx.userId,
            userEmail: tx.user?.email,
            userPhone: tx.user?.phone,
            userName: tx.user?.firstName ? `${tx.user.firstName} ${tx.user.lastName || ''}`.trim() : undefined,
            amount: Number(tx.amount) || 0,
            currency: tx.currency || 'UGX',
            type: tx.type,
            mode: tx.mode,
            status: tx.status,
            riskScore: 80,
            riskLevel: 'high',
            flags: ['high_failure_rate'],
            reason: `User has ${(failureRate * 100).toFixed(0)}% failure rate (${failedTxs.length}/${userTxs.length} transactions)`,
            ip: tx.metadata?.ipAddress,
            location: tx.metadata?.location,
            device: tx.metadata?.device,
            createdAt: tx.createdAt,
            metadata: tx.metadata
          })
        }
      })
    }
  })

  return suspicious
}

// Fetch suspicious transactions
async function getSuspiciousTransactions(limit: number = 100): Promise<SuspiciousTransaction[]> {
  try {
    const { data } = await api.get(`/transactions?limit=${limit}`)
    const transactions = data?.data || data?.transactions || []
    
    if (!Array.isArray(transactions) || transactions.length === 0) return []
    
    return detectSuspiciousPatterns(transactions)
  } catch (error: any) {
    console.error('Error fetching suspicious transactions:', error)
    return []
  }
}

// Group suspicious transactions by user
function groupByUser(suspiciousTxs: SuspiciousTransaction[]): SuspiciousUser[] {
  const userMap = new Map<string, SuspiciousUser>()
  
  suspiciousTxs.forEach(tx => {
    if (!userMap.has(tx.userId)) {
      userMap.set(tx.userId, {
        userId: tx.userId,
        email: tx.userEmail,
        phone: tx.userPhone || '',
        name: tx.userName,
        riskScore: 0,
        riskLevel: 'low',
        suspiciousTransactionCount: 0,
        failedTransactionCount: 0,
        totalAmount: 0,
        flags: [],
        lastSuspiciousActivity: tx.createdAt,
        transactions: [],
        isBlocked: false
      })
    }
    
    const user = userMap.get(tx.userId)!
    user.suspiciousTransactionCount++
    user.totalAmount += tx.amount
    user.transactions.push(tx)
    
    if (tx.status === 'FAILED') {
      user.failedTransactionCount++
    }
    
    // Update risk score (highest risk score from transactions)
    if (tx.riskScore > user.riskScore) {
      user.riskScore = tx.riskScore
      user.riskLevel = tx.riskLevel
    }
    
    // Collect unique flags
    tx.flags.forEach(flag => {
      if (!user.flags.includes(flag)) {
        user.flags.push(flag)
      }
    })
    
    // Update last activity
    if (new Date(tx.createdAt) > new Date(user.lastSuspiciousActivity)) {
      user.lastSuspiciousActivity = tx.createdAt
    }
  })
  
  return Array.from(userMap.values())
    .sort((a, b) => b.riskScore - a.riskScore)
}

// Fetch suspicious users
async function getSuspiciousUsers(): Promise<SuspiciousUser[]> {
  try {
    const suspiciousTxs = await getSuspiciousTransactions(200)
    const users = groupByUser(suspiciousTxs)
    
    // Check if users are blocked
    const userIds = users.map(u => u.userId)
    if (userIds.length > 0) {
      try {
        // Fetch all users and filter by IDs client-side
        const { data: usersData } = await api.get(`/admin/users`)
        const userList = usersData?.data || usersData?.users || []
        
        users.forEach(suspiciousUser => {
          const user = userList.find((u: any) => u.id === suspiciousUser.userId)
          if (user) {
            suspiciousUser.isBlocked = user.status === 'SUSPENDED'
            suspiciousUser.blockedAt = user.suspendedAt || user.blockedAt
          }
        })
      } catch (error) {
        // Silently fail - we'll just not show blocked status
        console.warn('Could not fetch user status:', error)
      }
    }
    
    return users
  } catch (error: any) {
    console.error('Error fetching suspicious users:', error)
    return []
  }
}

// Hooks
export function useSuspiciousTransactions(limit: number = 100) {
  return useQuery({
    queryKey: ['suspicious-transactions', limit],
    queryFn: () => getSuspiciousTransactions(limit),
    placeholderData: [],
    retry: false,
    staleTime: 30000, // 30 seconds
  })
}

export function useSuspiciousUsers() {
  return useQuery({
    queryKey: ['suspicious-users'],
    queryFn: getSuspiciousUsers,
    placeholderData: [],
    retry: false,
    staleTime: 30000, // 30 seconds
  })
}
