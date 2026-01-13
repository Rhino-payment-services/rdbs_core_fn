"use client"

import { useQuery } from '@tanstack/react-query'
import api from '../axios'

export interface SecurityStats {
  flaggedTransactions: number
  highRiskTransactions: number
  activeIncidents: number
  criticalIncidents: number
  pendingReview: number
  blockedUsers: number
  policyCompliance: number
}

export interface FlaggedTransaction {
  id: string
  transactionId: string
  reference: string
  userId: string
  userEmail?: string
  userPhone?: string
  amount: number
  currency: string
  type: string
  mode: string
  status: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  flags: string[]
  reason: string
  ip?: string
  location?: string
  device?: string
  createdAt: string
  metadata?: Record<string, any>
}

export interface SecurityIncident {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'investigating' | 'resolved' | 'dismissed'
  description: string
  affectedUsers: number
  ipAddresses: string[]
  location: string
  action: string
  createdAt: string
  metadata?: Record<string, any>
}

// Fetch security overview stats
async function getSecurityStats(): Promise<SecurityStats> {
  try {
    // Try to get from transactions and users endpoints - silently handle errors
    const [transactionsResponse, usersResponse] = await Promise.all([
      api.get('/transactions?limit=100').catch(() => ({ data: { data: [], total: 0 } })),
      api.get('/users?limit=200').catch(() => ({ data: { data: [], total: 0 } }))
    ])
    
    const allTransactions = transactionsResponse.data?.data || transactionsResponse.data?.transactions || []
    const allUsers = usersResponse.data?.data || usersResponse.data?.users || []
    
    // Filter for failed transactions and suspended users client-side
    const failedTransactions = Array.isArray(allTransactions) 
      ? allTransactions.filter((t: any) => t.status === 'FAILED') 
      : []
    
    // Count suspended/blocked users - SUSPENDED is the status for blocked users
    let blockedUsers = 0
    if (Array.isArray(allUsers)) {
      blockedUsers = allUsers.filter((u: any) => 
        u.status === 'SUSPENDED' || u.status === 'BLOCKED'
      ).length
    }
    
    // Calculate high risk transactions (failed with large amounts)
    const highRiskTransactions = failedTransactions.filter((t: any) => {
      const amount = Number(t.amount) || 0
      return amount > 1000000 // Over 1M UGX
    }).length

    const flaggedCount = failedTransactions.length

    return {
      flaggedTransactions: flaggedCount,
      highRiskTransactions,
      activeIncidents: Math.max(0, Math.floor(flaggedCount / 10)), // Approximate
      criticalIncidents: Math.max(0, Math.floor(highRiskTransactions / 5)),
      pendingReview: Math.floor(flaggedCount / 3),
      blockedUsers,
      policyCompliance: flaggedCount > 0 ? Math.max(85, 100 - flaggedCount) : 100
    }
  } catch (error: any) {
    // Silently return defaults - no need to log errors
    return {
      flaggedTransactions: 0,
      highRiskTransactions: 0,
      activeIncidents: 0,
      criticalIncidents: 0,
      pendingReview: 0,
      blockedUsers: 0,
      policyCompliance: 100
    }
  }
}

// Fetch flagged/failed transactions
async function getFlaggedTransactions(limit: number = 50): Promise<FlaggedTransaction[]> {
  try {
    // Try without status filter first, then filter client-side
    const { data } = await api.get(`/transactions?limit=${limit}`)
    
    const transactions = data?.data || data?.transactions || []
    if (!Array.isArray(transactions) || transactions.length === 0) return []
    
    // Filter for failed transactions client-side
    const failedTransactions = transactions.filter((tx: any) => tx.status === 'FAILED')
    
    return failedTransactions.map((tx: any) => {
      const amount = Number(tx.amount) || 0
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      let riskScore = 25
      const flags: string[] = []
      
      // Calculate risk based on amount and other factors
      if (amount > 5000000) {
        riskLevel = 'critical'
        riskScore = 90
        flags.push('large_amount')
      } else if (amount > 1000000) {
        riskLevel = 'high'
        riskScore = 75
        flags.push('significant_amount')
      } else if (amount > 500000) {
        riskLevel = 'medium'
        riskScore = 50
        flags.push('moderate_amount')
      }
      
      if (tx.errorMessage) {
        flags.push('has_error')
      }
      
      return {
        id: tx.id,
        transactionId: tx.id,
        reference: tx.reference || tx.id,
        userId: tx.userId,
        userEmail: tx.user?.email,
        userPhone: tx.user?.phone,
        amount,
        currency: tx.currency || 'UGX',
        type: tx.type,
        mode: tx.mode,
        status: tx.status,
        riskLevel,
        riskScore,
        flags,
        reason: tx.errorMessage || 'Transaction failed',
        ip: tx.metadata?.ipAddress,
        location: tx.metadata?.location || 'Unknown',
        device: tx.metadata?.device || 'Unknown',
        createdAt: tx.createdAt,
        metadata: tx.metadata
      }
    })
  } catch (error: any) {
    // Silently return empty array - no need to log errors
    return []
  }
}

// Fetch security incidents from activity logs
async function getSecurityIncidents(): Promise<SecurityIncident[]> {
  try {
    // Try to fetch activity logs with proper pagination parameters
    const { data } = await api.get('/activity-logs?page=1&limit=100').catch(() => ({ data: { logs: [] } }))
    
    const logs = data?.logs || []
    if (!Array.isArray(logs) || logs.length === 0) return []
    
    // Filter for security-related logs
    const securityLogs = logs.filter((log: any) => 
      log.category === 'SECURITY' || 
      log.action?.includes('BLOCK') || 
      log.action?.includes('SUSPEND') ||
      log.action?.includes('FAILED') ||
      log.action?.includes('SECURITY') ||
      log.status === 'FAILED'
    )
    
    if (securityLogs.length === 0) return []
    
    // Group logs into incidents by type and time
    const incidentMap = new Map<string, SecurityIncident>()
    
    securityLogs.forEach((log: any) => {
      const key = `${log.action}_${new Date(log.createdAt).toDateString()}`
      
      if (!incidentMap.has(key)) {
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
        if (log.action?.includes('BLOCK') || log.action?.includes('SUSPEND')) {
          severity = 'high'
        }
        if (log.action?.includes('BRUTE_FORCE') || log.status === 'FAILED') {
          severity = 'critical'
        }
        
        incidentMap.set(key, {
          id: log._id,
          type: (log.action || 'unknown').toLowerCase().replace(/_/g, '_'),
          severity,
          status: log.status === 'SUCCESS' ? 'resolved' : 'active',
          description: log.description || 'Security event',
          affectedUsers: 1,
          ipAddresses: log.ipAddress ? [log.ipAddress] : [],
          location: log.metadata?.location || 'Unknown',
          action: log.action || 'unknown',
          createdAt: log.createdAt,
          metadata: log.metadata
        })
      } else {
        const incident = incidentMap.get(key)!
        incident.affectedUsers++
        if (log.ipAddress && !incident.ipAddresses.includes(log.ipAddress)) {
          incident.ipAddresses.push(log.ipAddress)
        }
      }
    })
    
    return Array.from(incidentMap.values()).slice(0, 20)
  } catch (error: any) {
    // Silently return empty array - no need to log errors
    return []
  }
}

// Hooks
export function useSecurityStats() {
  return useQuery({
    queryKey: ['security-stats'],
    queryFn: getSecurityStats,
    placeholderData: {
      flaggedTransactions: 0,
      highRiskTransactions: 0,
      activeIncidents: 0,
      criticalIncidents: 0,
      pendingReview: 0,
      blockedUsers: 0,
      policyCompliance: 100
    },
    retry: false,
    staleTime: 60000, // 1 minute
  })
}

export function useFlaggedTransactions(limit: number = 50) {
  return useQuery({
    queryKey: ['flagged-transactions', limit],
    queryFn: () => getFlaggedTransactions(limit),
    placeholderData: [],
    retry: false,
    staleTime: 30000,
  })
}

export function useSecurityIncidents() {
  return useQuery({
    queryKey: ['security-incidents'],
    queryFn: getSecurityIncidents,
    placeholderData: [],
    retry: false,
    staleTime: 30000,
  })
}
