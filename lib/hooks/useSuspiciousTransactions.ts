"use client"

import { useQuery } from '@tanstack/react-query'
import api from '../axios'
import {
  detectSuspiciousPatterns,
  type SuspiciousTransactionPattern,
} from '@/lib/utils/suspiciousTransactionPatterns'

export type SuspiciousTransaction = SuspiciousTransactionPattern

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

async function getSuspiciousTransactions(limit: number = 100): Promise<SuspiciousTransaction[]> {
  try {
    const { data } = await api.get(`/transactions?limit=${limit}`)
    const transactions = data?.data || data?.transactions || []

    if (!Array.isArray(transactions) || transactions.length === 0) return []

    return detectSuspiciousPatterns(transactions)
  } catch (error: unknown) {
    console.error('Error fetching suspicious transactions:', error)
    return []
  }
}

function groupByUser(suspiciousTxs: SuspiciousTransaction[]): SuspiciousUser[] {
  const userMap = new Map<string, SuspiciousUser>()

  suspiciousTxs.forEach((tx) => {
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
        isBlocked: false,
      })
    }

    const user = userMap.get(tx.userId)!
    user.suspiciousTransactionCount++
    user.totalAmount += tx.amount
    user.transactions.push(tx)

    if (tx.status === 'FAILED') {
      user.failedTransactionCount++
    }

    if (tx.riskScore > user.riskScore) {
      user.riskScore = tx.riskScore
      user.riskLevel = tx.riskLevel
    }

    tx.flags.forEach((flag) => {
      if (!user.flags.includes(flag)) {
        user.flags.push(flag)
      }
    })

    if (new Date(tx.createdAt) > new Date(user.lastSuspiciousActivity)) {
      user.lastSuspiciousActivity = tx.createdAt
    }
  })

  return Array.from(userMap.values()).sort((a, b) => b.riskScore - a.riskScore)
}

async function getSuspiciousUsers(): Promise<SuspiciousUser[]> {
  try {
    const suspiciousTxs = await getSuspiciousTransactions(200)
    const users = groupByUser(suspiciousTxs)

    if (users.length === 0) return users

    try {
      const { data: usersData } = await api.get('/admin/users')
      const userList = Array.isArray(usersData)
        ? usersData
        : usersData?.data || usersData?.users || []

      users.forEach((suspiciousUser) => {
        const user = userList.find((u: Record<string, unknown>) => u.id === suspiciousUser.userId)
        if (!user) return

        suspiciousUser.isBlocked = user.status === 'SUSPENDED'
        suspiciousUser.blockedAt = user.suspendedAt || user.blockedAt
        if (!suspiciousUser.email && user.email) suspiciousUser.email = user.email
        if (!suspiciousUser.phone && user.phone) suspiciousUser.phone = user.phone
        if (!suspiciousUser.name) {
          const fullName =
            user.profile?.firstName && user.profile?.lastName
              ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
              : user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.profile?.firstName || user.firstName
          if (fullName) suspiciousUser.name = fullName
        }
      })
    } catch (error) {
      console.warn('Could not fetch user status:', error)
    }

    return users
  } catch (error: unknown) {
    console.error('Error fetching suspicious users:', error)
    return []
  }
}

export function useSuspiciousTransactions(limit: number = 100) {
  return useQuery({
    queryKey: ['suspicious-transactions', limit],
    queryFn: () => getSuspiciousTransactions(limit),
    placeholderData: [],
    retry: false,
    staleTime: 30000,
  })
}

export function useSuspiciousUsers() {
  return useQuery({
    queryKey: ['suspicious-users'],
    queryFn: getSuspiciousUsers,
    placeholderData: [],
    retry: false,
    staleTime: 30000,
  })
}

// ---------------------------------------------------------------------------
// Date-range aware hooks for the Suspicious Transactions tab
// ---------------------------------------------------------------------------

export interface SuspiciousLogsParams {
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface ActivityLogEntry {
  _id: string
  userId?: string
  userEmail?: string
  userPhone?: string
  userDetails?: {
    fullName?: string
    email?: string
    phone?: string
  }
  action: string
  category: string
  description?: string
  status: string
  metadata?: Record<string, unknown>
  channel?: string
  ipAddress?: string
  endpoint?: string
  createdAt: string
}

export interface FlaggedTransactionLogEntry {
  _id: string
  transactionId?: string
  userId?: string
  amount?: number
  currency?: string
  transactionStatus: string
  transactionType?: string
  channel?: string
  riskIndicators?: string[]
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PaginatedResponse<T> {
  logs: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useSuspiciousActivityLogs(params: SuspiciousLogsParams) {
  return useQuery<PaginatedResponse<ActivityLogEntry>>({
    queryKey: ['suspicious-activity-logs', params],
    queryFn: () =>
      api
        .get('/activity-logs', {
          params: { category: 'SUSPICIOUS_TRANSACTION', ...params },
        })
        .then((r) => r.data),
    enabled: !!(params.startDate && params.endDate),
    staleTime: 30_000,
    placeholderData: { logs: [], total: 0, page: 1, limit: 50, totalPages: 0 },
  })
}

export function useFlaggedTransactionLogs(params: SuspiciousLogsParams) {
  return useQuery<PaginatedResponse<FlaggedTransactionLogEntry>>({
    queryKey: ['flagged-transaction-logs', params],
    queryFn: () =>
      api
        .get('/transaction-logs/system', {
          params: { status: 'FLAGGED', ...params },
        })
        .then((r) => r.data),
    enabled: !!(params.startDate && params.endDate),
    staleTime: 30_000,
    placeholderData: { logs: [], total: 0, page: 1, limit: 50, totalPages: 0 },
  })
}
