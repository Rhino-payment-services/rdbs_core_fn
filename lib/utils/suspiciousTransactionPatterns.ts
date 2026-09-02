export interface SuspiciousTransactionPattern {
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
  metadata?: Record<string, unknown>
}

function riskLevelFromScore(score: number): SuspiciousTransactionPattern['riskLevel'] {
  if (score >= 90) return 'critical'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

function readUserName(tx: Record<string, unknown>): string | undefined {
  const user = tx.user as Record<string, unknown> | undefined
  if (!user) return undefined
  const profile =
    user.profile && typeof user.profile === 'object'
      ? (user.profile as Record<string, unknown>)
      : undefined
  const first = user.firstName ?? profile?.firstName
  const last = user.lastName ?? profile?.lastName
  if (first || last) return `${first ?? ''} ${last ?? ''}`.trim()
  return undefined
}

function pushSuspicious(
  suspicious: SuspiciousTransactionPattern[],
  tx: Record<string, unknown>,
  flags: string[],
  riskScore: number,
  reason: string,
) {
  const user = tx.user as Record<string, unknown> | undefined
  suspicious.push({
    id: String(tx.id),
    transactionId: String(tx.id),
    reference: String(tx.reference ?? tx.id),
    userId: String(tx.userId),
    userEmail: user?.email as string | undefined,
    userPhone: user?.phone as string | undefined,
    userName: readUserName(tx),
    amount: Number(tx.amount) || 0,
    currency: String(tx.currency ?? 'UGX'),
    type: String(tx.type ?? ''),
    mode: String(tx.mode ?? ''),
    status: String(tx.status ?? ''),
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    flags,
    reason,
    ip: (tx.metadata as Record<string, unknown> | undefined)?.ipAddress as string | undefined,
    location: (tx.metadata as Record<string, unknown> | undefined)?.location as string | undefined,
    device: (tx.metadata as Record<string, unknown> | undefined)?.device as string | undefined,
    createdAt: String(tx.createdAt),
    metadata: (tx.metadata as Record<string, unknown> | undefined) ?? undefined,
  })
}

export function mergeSuspiciousByTransactionId(
  items: SuspiciousTransactionPattern[],
): SuspiciousTransactionPattern[] {
  const map = new Map<string, SuspiciousTransactionPattern>()

  items.forEach((item) => {
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, { ...item, flags: [...item.flags] })
      return
    }

    item.flags.forEach((flag) => {
      if (!existing.flags.includes(flag)) existing.flags.push(flag)
    })

    if (item.riskScore > existing.riskScore) {
      existing.riskScore = item.riskScore
      existing.riskLevel = item.riskLevel
      existing.reason = item.reason
    } else if (item.reason && !existing.reason.includes(item.reason)) {
      existing.reason = `${existing.reason}; ${item.reason}`
    }
  })

  return Array.from(map.values())
}

/** Same heuristics as the Security dashboard Suspicious Users tab. */
export function detectSuspiciousPatterns(
  transactions: Record<string, unknown>[],
): SuspiciousTransactionPattern[] {
  const suspicious: SuspiciousTransactionPattern[] = []
  const userTransactions = new Map<string, Record<string, unknown>[]>()

  transactions.forEach((tx) => {
    const userId = String(tx.userId ?? '')
    if (!userId) return
    if (!userTransactions.has(userId)) userTransactions.set(userId, [])
    userTransactions.get(userId)!.push(tx)
  })

  userTransactions.forEach((userTxs) => {
    const failedTxs = userTxs.filter((tx) => tx.status === 'FAILED')

    // Pattern 1: 5+ failed transactions within any 1-hour window
    if (failedTxs.length >= 5) {
      const sortedFailed = [...failedTxs].sort(
        (a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime(),
      )
      const flaggedIds = new Set<string>()

      for (let i = 0; i <= sortedFailed.length - 5; i++) {
        const windowStart = new Date(String(sortedFailed[i].createdAt)).getTime()
        const windowEnd = windowStart + 60 * 60 * 1000
        const inWindow = sortedFailed.filter((tx) => {
          const t = new Date(String(tx.createdAt)).getTime()
          return t >= windowStart && t <= windowEnd
        })
        if (inWindow.length >= 5) {
          inWindow.forEach((tx) => flaggedIds.add(String(tx.id)))
        }
      }

      sortedFailed
        .filter((tx) => flaggedIds.has(String(tx.id)))
        .forEach((tx) => {
          pushSuspicious(
            suspicious,
            tx,
            ['multiple_failed_transactions', 'rapid_failures'],
            85,
            `User has 5+ failed transactions within a 1-hour window`,
          )
        })
    }

    // Pattern 2: Failed transaction over 10M UGX
    const largeAmountThreshold = 10_000_000
    userTxs.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      if (amount > largeAmountThreshold && tx.status === 'FAILED') {
        pushSuspicious(
          suspicious,
          tx,
          ['large_amount', 'failed_large_transaction'],
          90,
          `Failed transaction with unusually large amount: ${amount.toLocaleString()} ${tx.currency ?? 'UGX'}`,
        )
      }
    })

    // Pattern 3: 5+ transactions within 5 minutes
    const sortedTxs = [...userTxs].sort(
      (a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime(),
    )

    for (let i = 0; i < sortedTxs.length - 4; i++) {
      const batch = sortedTxs.slice(i, i + 5)
      const timeDiff =
        new Date(String(batch[4].createdAt)).getTime() -
        new Date(String(batch[0].createdAt)).getTime()
      if (timeDiff < 5 * 60 * 1000) {
        batch.forEach((tx) => {
          if (!suspicious.some((s) => s.id === tx.id)) {
            pushSuspicious(
              suspicious,
              tx,
              ['rapid_transactions', 'velocity_check'],
              75,
              '5+ transactions within 5 minutes',
            )
          }
        })
      }
    }

    // Pattern 4: High failure rate (10+ txs, >70% failed)
    const failureRate = failedTxs.length / userTxs.length
    if (userTxs.length >= 10 && failureRate > 0.7) {
      failedTxs.forEach((tx) => {
        if (!suspicious.some((s) => s.id === tx.id)) {
          pushSuspicious(
            suspicious,
            tx,
            ['high_failure_rate'],
            80,
            `User has ${(failureRate * 100).toFixed(0)}% failure rate (${failedTxs.length}/${userTxs.length} transactions)`,
          )
        }
      })
    }
  })

  return mergeSuspiciousByTransactionId(suspicious)
}
