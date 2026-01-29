import { useMemo } from 'react'

const EMPTY_ARRAY: any[] = []

export const useCustomerActivities = ({
  type,
  partnerWalletIds,
  partnerActivityLogsData,
  activityLogsData
}: {
  type: string
  partnerWalletIds: string[]
  partnerActivityLogsData: any
  activityLogsData: any
}) => {
  // Process activity log arrays
  const partnerLogsArray = useMemo(() => {
    return Array.isArray(partnerActivityLogsData?.logs) ? partnerActivityLogsData.logs : EMPTY_ARRAY
  }, [partnerActivityLogsData])

  const userLogsArray = useMemo(() => {
    return Array.isArray(activityLogsData?.logs) ? activityLogsData.logs : EMPTY_ARRAY
  }, [activityLogsData])

  // Filter partner activities
  const filteredPartnerActivities = useMemo(() => {
    if (type !== 'partner' || partnerWalletIds.length === 0) {
      return EMPTY_ARRAY
    }
    if (partnerLogsArray.length === 0) {
      return EMPTY_ARRAY
    }
    return partnerLogsArray.filter((log: any) => {
      if (!log) return false
      const logStr = JSON.stringify(log).toLowerCase()
      return partnerWalletIds.some(walletId => logStr.includes(walletId.toLowerCase()))
    })
  }, [type, partnerWalletIds, partnerLogsArray])

  // Final activities array
  const activities = useMemo(() => {
    if (type === 'partner') {
      return filteredPartnerActivities
    }
    return userLogsArray
  }, [type, filteredPartnerActivities, userLogsArray])

  const totalActivities = useMemo(() => {
    return type === 'partner'
      ? filteredPartnerActivities.length
      : (activityLogsData?.total || 0)
  }, [type, filteredPartnerActivities.length, activityLogsData?.total])

  return {
    activities,
    totalActivities
  }
}
