"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Shield,
  Ban,
  CheckCircle,
  DollarSign,
  Plus,
  AlertTriangle,
  CreditCard,
  UserX,
  UserCheck,
  Wallet,
  Key,
  LayoutDashboard,
  Phone,
  Droplets,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { extractErrorMessage } from '@/lib/utils'
import { BankSortCodeSelect } from '@/components/dashboard/finance/BankSortCodeSelect'
import { useUgandaBanks } from '@/lib/hooks/useUgandaBanks'

interface WalletItem {
  id: string
  walletType?: string
  balance?: number | string
  currency?: string
}

interface MerchantPaymentSmsTeamMember {
  id: string
  walletId: string
  walletType?: string | null
  userId: string
  email: string
  userEmail?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  role: string
  status: string
  paymentSmsNotificationsEnabled: boolean
}

interface MerchantPaymentSmsRecipients {
  merchantPaymentSmsEnabled?: boolean
  customerCollectionSuccessSmsEnabled?: boolean
  owner?: {
    userId: string
    phone?: string | null
    email?: string | null
    paymentSmsNotificationsEnabled: boolean
    locked?: boolean
  }
  teamMembers: MerchantPaymentSmsTeamMember[]
}

interface MerchantUssdEntryPointConfig {
  merchantId: string
  merchantCode: string
  merchantName: string
  ussdEntryCode: string | null
  isEnabled: boolean
  minimumAmount: number
  maximumAmount: number
  dialPattern: string | null
}

interface MerchantLiquidationOnlySettings {
  merchantId: string
  merchantCode: string
  merchantName: string
  liquidationOnlyMode: boolean
  liquidationDestinationType: 'MOBILE_MONEY' | 'BANK' | null
  liquidationMomoProvider: string | null
  liquidationMomoPhone: string | null
  liquidationMomoAccountName: string | null
  liquidationBankName: string | null
  liquidationBankCode: string | null
  liquidationBankAccountNumber: string | null
  liquidationBankAccountName: string | null
  liquidationBankBranch: string | null
}

interface CustomerSettingsProps {
  type: string
  customerId: string
  customerStatus: string
  customerPhone?: string
  walletBalance?: number
  walletId?: string
  currency?: string
  merchantId?: string
  onActionComplete?: () => void
  merchantCode?: string
  collectionFeeMode?: 'CUSTOMER_PAYS_ALL' | 'CUSTOMER_PAYS_PARTIAL' | 'CUSTOMER_PAYS_NONE'
  collectionCustomerSharePercent?: number
  collectionTotalFeePercent?: number | null
  collectionMnoPartnerFeePercent?: number | null
  /** All wallets for this user (from wallet service). When set, Wallet Management shows each wallet and manual tx can target a chosen wallet. */
  allUserWallets?: WalletItem[]
  /** When false, wallet creation is disabled for this user. */
  canHaveWallet?: boolean
}

function walletTypeLabel(wt: string | undefined): string {
  if (!wt) return 'Wallet'
  const t = wt.toUpperCase()
  if (t === 'PERSONAL') return 'Personal'
  if (t === 'BUSINESS') return 'Business'
  if (t === 'BUSINESS_COLLECTION') return 'Collection'
  if (t === 'BUSINESS_DISBURSEMENT' || t === 'BUSINESS_LIQUIDATION') return 'Disbursement'
  return wt.replace(/_/g, ' ')
}

const CustomerSettings = ({ 
  type,
  customerId, 
  customerStatus,
  customerPhone = '',
  walletBalance = 0,
  walletId,
  currency = 'UGX',
  onActionComplete,
  merchantId,
  merchantCode,
  collectionFeeMode = 'CUSTOMER_PAYS_NONE',
  collectionCustomerSharePercent = 0,
  collectionTotalFeePercent = null,
  collectionMnoPartnerFeePercent = null,
  allUserWallets = [],
  canHaveWallet = true,
}: CustomerSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false)
  const [manualTransactionDialogOpen, setManualTransactionDialogOpen] = useState(false)
  const [resetPinDialogOpen, setResetPinDialogOpen] = useState(false)
  const [isResettingPin, setIsResettingPin] = useState(false)
  const [resetPortalPinDialogOpen, setResetPortalPinDialogOpen] = useState(false)
  const [isResettingPortalPin, setIsResettingPortalPin] = useState(false)
  const [isSavingFeeMode, setIsSavingFeeMode] = useState(false)
  
  // Suspend form state
  const [suspendForm, setSuspendForm] = useState({
    reason: '',
    duration: '',
    blockMoney: false,
    amount: '' // Add amount field
  })
  
  // Manual transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'CREDIT',
    amount: '',
    description: '',
    reference: ''
  })
  // When customer has multiple wallets, which wallet to credit/debit
  const effectiveWallets = Array.isArray(allUserWallets) && allUserWallets.length > 0 ? allUserWallets : (walletId ? [{ id: walletId, walletType: undefined, balance: walletBalance, currency }] : [])
  const defaultWalletIdForTx = walletId || effectiveWallets[0]?.id || ''
  const [selectedWalletIdForTx, setSelectedWalletIdForTx] = useState<string>(defaultWalletIdForTx)
  const walletIdsStr = effectiveWallets.map(w => w.id).join(',')
  React.useEffect(() => {
    const ids = walletIdsStr ? walletIdsStr.split(',') : []
    if (defaultWalletIdForTx && ids.length > 0 && !ids.includes(selectedWalletIdForTx)) {
      setSelectedWalletIdForTx(defaultWalletIdForTx)
    }
  }, [defaultWalletIdForTx, walletIdsStr, selectedWalletIdForTx])
  const effectiveWalletId = selectedWalletIdForTx || walletId || effectiveWallets[0]?.id
  const effectiveBalance = effectiveWalletId ? (effectiveWallets.find(w => w.id === effectiveWalletId)?.balance ?? walletBalance) : walletBalance
  const effectiveBalanceNum = typeof effectiveBalance === 'number' ? effectiveBalance : parseFloat(String(effectiveBalance ?? 0)) || 0
  const hasWallet = effectiveWallets.length > 0

  const handleCreateWallet = async () => {
    if (!customerId) {
      toast.error('Customer ID is not available.')
      return
    }
    if (!canHaveWallet) {
      toast.error('This user is not allowed to have a wallet.')
      return
    }

    setIsCreatingWallet(true)
    try {
      await api.post('/wallet', {
        userId: customerId,
        currency: currency || 'UGX',
      })
      toast.success('Wallet created successfully.')
      onActionComplete?.()
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error) || 'Failed to create wallet. Please try again.')
    } finally {
      setIsCreatingWallet(false)
    }
  }

  // Merchant collection fee configuration state (synced from props when merchant data is refetched)
  const [collectionMode, setCollectionMode] = useState<
    'CUSTOMER_PAYS_ALL' | 'CUSTOMER_PAYS_PARTIAL' | 'CUSTOMER_PAYS_NONE'
  >(collectionFeeMode ?? 'CUSTOMER_PAYS_NONE')
  const [customerSharePercent, setCustomerSharePercent] = useState<number>(collectionCustomerSharePercent ?? 0)
  const [totalFeePercent, setTotalFeePercent] = useState<string>(
    collectionTotalFeePercent != null ? String(collectionTotalFeePercent) : '',
  )
  const [mnoFeePercent, setMnoFeePercent] = useState<string>(
    collectionMnoPartnerFeePercent != null ? String(collectionMnoPartnerFeePercent) : '',
  )

  useEffect(() => {
    if (collectionFeeMode) setCollectionMode(collectionFeeMode)
    if (collectionCustomerSharePercent != null) setCustomerSharePercent(Number(collectionCustomerSharePercent))
    setTotalFeePercent(collectionTotalFeePercent != null ? String(collectionTotalFeePercent) : '')
    setMnoFeePercent(collectionMnoPartnerFeePercent != null ? String(collectionMnoPartnerFeePercent) : '')
  }, [collectionFeeMode, collectionCustomerSharePercent, collectionTotalFeePercent, collectionMnoPartnerFeePercent])

  // Merchant feature flags state
  const [featureFlags, setFeatureFlags] = useState({
    featureBulkPayments: false,
    featureLiquidation: false,
    featurePayroll: false,
    featurePayrollApprovals: false,
    featurePinLogin: false,
  })
  const [featureFlagsLoading, setFeatureFlagsLoading] = useState(false)
  const [savingFlag, setSavingFlag] = useState<string | null>(null)
  const [paymentSmsRecipients, setPaymentSmsRecipients] =
    useState<MerchantPaymentSmsRecipients | null>(null)
  const [paymentSmsRecipientsLoading, setPaymentSmsRecipientsLoading] =
    useState(false)
  const [savingPaymentSmsMember, setSavingPaymentSmsMember] =
    useState<string | null>(null)
  const [savingMerchantPaymentSmsSetting, setSavingMerchantPaymentSmsSetting] =
    useState<'merchant' | 'customer' | null>(null)
  const [ussdEntryPoint, setUssdEntryPoint] =
    useState<MerchantUssdEntryPointConfig | null>(null)
  const [ussdEntryPointLoading, setUssdEntryPointLoading] = useState(false)
  const [isSavingUssdEntryPoint, setIsSavingUssdEntryPoint] = useState(false)
  const [ussdEntryCodeInput, setUssdEntryCodeInput] = useState('')
  const [ussdEntryEnabled, setUssdEntryEnabled] = useState(false)
  const [ussdMinimumAmount, setUssdMinimumAmount] = useState(500)
  const [ussdMaximumAmount, setUssdMaximumAmount] = useState(5000000)

  const { data: ugandaBanks = [] } = useUgandaBanks({
    enabled: type === 'merchant' && !!merchantId,
  })
  const [liquidationOnlyLoading, setLiquidationOnlyLoading] = useState(false)
  const [isSavingLiquidationOnly, setIsSavingLiquidationOnly] = useState(false)
  const [liquidationOnlyMode, setLiquidationOnlyMode] = useState(false)
  const [liquidationDestinationType, setLiquidationDestinationType] = useState<
    'MOBILE_MONEY' | 'BANK'
  >('MOBILE_MONEY')
  const [liquidationMomoProvider, setLiquidationMomoProvider] = useState('MTN')
  const [liquidationMomoPhone, setLiquidationMomoPhone] = useState('')
  const [liquidationMomoAccountName, setLiquidationMomoAccountName] = useState('')
  const [liquidationBankCode, setLiquidationBankCode] = useState('')
  const [liquidationBankAccountNumber, setLiquidationBankAccountNumber] = useState('')
  const [liquidationBankAccountName, setLiquidationBankAccountName] = useState('')
  const [liquidationBankBranch, setLiquidationBankBranch] = useState('')

  const applyLiquidationOnlySettings = (data: MerchantLiquidationOnlySettings) => {
    setLiquidationOnlyMode(!!data.liquidationOnlyMode)
    setLiquidationDestinationType(
      data.liquidationDestinationType === 'BANK' ? 'BANK' : 'MOBILE_MONEY',
    )
    setLiquidationMomoProvider(data.liquidationMomoProvider || 'MTN')
    setLiquidationMomoPhone(data.liquidationMomoPhone || '')
    setLiquidationMomoAccountName(data.liquidationMomoAccountName || '')
    setLiquidationBankCode(data.liquidationBankCode || '')
    setLiquidationBankAccountNumber(data.liquidationBankAccountNumber || '')
    setLiquidationBankAccountName(data.liquidationBankAccountName || '')
    setLiquidationBankBranch(data.liquidationBankBranch || '')
  }

  useEffect(() => {
    if (type === 'merchant' && merchantId) {
      setFeatureFlagsLoading(true)
      api.get(`/merchants/${merchantId}/feature-flags`)
        .then(res => setFeatureFlags(res.data))
        .catch(() => toast.error('Failed to load feature flags'))
        .finally(() => setFeatureFlagsLoading(false))
    }
  }, [type, merchantId])

  useEffect(() => {
    if (type === 'merchant' && merchantId) {
      setPaymentSmsRecipientsLoading(true)
      api.get(`/merchant-kyc/${merchantId}/payment-sms-recipients`)
        .then(res => setPaymentSmsRecipients(res.data))
        .catch(() => toast.error('Failed to load payment SMS recipients'))
        .finally(() => setPaymentSmsRecipientsLoading(false))
    } else {
      setPaymentSmsRecipients(null)
    }
  }, [type, merchantId])

  useEffect(() => {
    if (type === 'merchant' && merchantId) {
      setUssdEntryPointLoading(true)
      api.get(`/merchant-kyc/${merchantId}/ussd-entry-point`)
        .then(res => {
          const data = res.data as MerchantUssdEntryPointConfig
          setUssdEntryPoint(data)
          setUssdEntryCodeInput(data.ussdEntryCode || '')
          setUssdEntryEnabled(data.isEnabled)
          setUssdMinimumAmount(data.minimumAmount || 500)
          setUssdMaximumAmount(data.maximumAmount || 5000000)
        })
        .catch(() => toast.error('Failed to load USSD entry point'))
        .finally(() => setUssdEntryPointLoading(false))
    } else {
      setUssdEntryPoint(null)
    }
  }, [type, merchantId])

  useEffect(() => {
    if (type === 'merchant' && merchantId) {
      setLiquidationOnlyLoading(true)
      api
        .get(`/merchant-kyc/${merchantId}/liquidation-only-settings`)
        .then((res) => applyLiquidationOnlySettings(res.data as MerchantLiquidationOnlySettings))
        .catch(() => toast.error('Failed to load liquidation-only settings'))
        .finally(() => setLiquidationOnlyLoading(false))
    }
  }, [type, merchantId])

  const handleSaveLiquidationOnlySettings = async () => {
    if (!merchantId) return

    if (liquidationOnlyMode) {
      if (liquidationDestinationType === 'MOBILE_MONEY') {
        if (!liquidationMomoProvider.trim() || !liquidationMomoPhone.trim()) {
          toast.error('Mobile money provider and phone number are required')
          return
        }
      } else {
        if (
          !liquidationBankCode.trim() ||
          !liquidationBankAccountNumber.trim() ||
          !liquidationBankAccountName.trim()
        ) {
          toast.error('Bank, account number, and account name are required')
          return
        }
      }
    }

    const selectedBank = ugandaBanks.find((b) => b.bankSortCode === liquidationBankCode)

    setIsSavingLiquidationOnly(true)
    try {
      const payload: Record<string, unknown> = {
        liquidationOnlyMode,
        liquidationDestinationType,
      }
      if (liquidationDestinationType === 'MOBILE_MONEY') {
        payload.liquidationMomoProvider = liquidationMomoProvider.trim()
        payload.liquidationMomoPhone = liquidationMomoPhone.trim()
        payload.liquidationMomoAccountName =
          liquidationMomoAccountName.trim() || null
        payload.liquidationBankName = null
        payload.liquidationBankCode = null
        payload.liquidationBankAccountNumber = null
        payload.liquidationBankAccountName = null
        payload.liquidationBankBranch = null
      } else {
        payload.liquidationBankName =
          selectedBank?.bankName || liquidationBankCode.trim()
        payload.liquidationBankCode = liquidationBankCode.trim()
        payload.liquidationBankAccountNumber =
          liquidationBankAccountNumber.trim()
        payload.liquidationBankAccountName = liquidationBankAccountName.trim()
        payload.liquidationBankBranch = liquidationBankBranch.trim() || null
        payload.liquidationMomoProvider = null
        payload.liquidationMomoPhone = null
        payload.liquidationMomoAccountName = null
      }

      const res = await api.patch(
        `/merchant-kyc/${merchantId}/liquidation-only-settings`,
        payload,
      )
      applyLiquidationOnlySettings(res.data as MerchantLiquidationOnlySettings)
      if (liquidationOnlyMode) {
        setFeatureFlags((prev) => ({ ...prev, featureLiquidation: true }))
      }
      toast.success('Liquidation-Only Mode settings updated')
    } catch (error: unknown) {
      toast.error(
        extractErrorMessage(error) || 'Failed to update liquidation-only settings',
      )
    } finally {
      setIsSavingLiquidationOnly(false)
    }
  }

  const handleSaveUssdEntryPoint = async () => {
    if (!merchantId) return

    const normalizedCode = ussdEntryCodeInput.trim()
    if (ussdEntryEnabled && !normalizedCode) {
      toast.error('USSD entry code is required when enabled')
      return
    }
    if (normalizedCode && !/^\d+$/.test(normalizedCode)) {
      toast.error('USSD entry code must contain digits only')
      return
    }
    if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(normalizedCode)) {
      toast.error('Codes 1-8 are reserved by the main RukaPay USSD menu')
      return
    }
    if (ussdMaximumAmount < ussdMinimumAmount) {
      toast.error('Maximum amount must be greater than or equal to minimum amount')
      return
    }

    setIsSavingUssdEntryPoint(true)
    try {
      const res = await api.patch(`/merchant-kyc/${merchantId}/ussd-entry-point`, {
        ussdEntryCode: normalizedCode || undefined,
        isEnabled: ussdEntryEnabled,
        minimumAmount: ussdMinimumAmount,
        maximumAmount: ussdMaximumAmount,
      })
      const data = res.data as MerchantUssdEntryPointConfig
      setUssdEntryPoint(data)
      setUssdEntryCodeInput(data.ussdEntryCode || '')
      setUssdEntryEnabled(data.isEnabled)
      setUssdMinimumAmount(data.minimumAmount || 500)
      setUssdMaximumAmount(data.maximumAmount || 5000000)
      toast.success('USSD entry point updated')
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error) || 'Failed to update USSD entry point')
    } finally {
      setIsSavingUssdEntryPoint(false)
    }
  }

  const handleFeatureFlagToggle = async (flag: keyof typeof featureFlags, value: boolean) => {
    if (!merchantId) return
    setSavingFlag(flag)
    const previous = featureFlags[flag]
    setFeatureFlags(prev => ({ ...prev, [flag]: value }))
    try {
      await api.patch(`/merchants/${merchantId}/feature-flags`, { [flag]: value })
      toast.success('Feature flag updated')
    } catch {
      setFeatureFlags(prev => ({ ...prev, [flag]: previous }))
      toast.error('Failed to update feature flag')
    } finally {
      setSavingFlag(null)
    }
  }

  const handleMerchantPaymentSmsSettingToggle = async (
    field: 'merchantPaymentSmsEnabled' | 'customerCollectionSuccessSmsEnabled',
    enabled: boolean,
  ) => {
    if (!merchantId) return

    const previous = paymentSmsRecipients
    const savingKey = field === 'merchantPaymentSmsEnabled' ? 'merchant' : 'customer'
    setSavingMerchantPaymentSmsSetting(savingKey)
    setPaymentSmsRecipients(current => current ? {
      ...current,
      [field]: enabled,
      ...(field === 'merchantPaymentSmsEnabled' && current.owner
        ? {
            owner: {
              ...current.owner,
              paymentSmsNotificationsEnabled: enabled,
            },
          }
        : {}),
    } : current)

    try {
      const res = await api.patch(`/merchant-kyc/${merchantId}/payment-sms-settings`, {
        [field]: enabled,
      })
      const data = res.data
      setPaymentSmsRecipients(current => current ? {
        ...current,
        merchantPaymentSmsEnabled: data.merchantPaymentSmsEnabled,
        customerCollectionSuccessSmsEnabled: data.customerCollectionSuccessSmsEnabled,
        owner: current.owner ? {
          ...current.owner,
          paymentSmsNotificationsEnabled: data.merchantPaymentSmsEnabled,
        } : current.owner,
      } : current)
      toast.success(
        field === 'merchantPaymentSmsEnabled'
          ? enabled
            ? 'Merchant payment SMS enabled'
            : 'Merchant payment SMS disabled'
          : enabled
            ? 'Customer payment success SMS enabled'
            : 'Customer payment success SMS disabled',
      )
    } catch (error: unknown) {
      setPaymentSmsRecipients(previous)
      toast.error(extractErrorMessage(error) || 'Failed to update payment SMS setting')
    } finally {
      setSavingMerchantPaymentSmsSetting(null)
    }
  }

  const handlePaymentSmsToggle = async (memberId: string, enabled: boolean) => {
    if (!merchantId) return
    const previous = paymentSmsRecipients
    setSavingPaymentSmsMember(memberId)
    setPaymentSmsRecipients(current => current ? {
      ...current,
      teamMembers: current.teamMembers.map(member =>
        member.id === memberId
          ? { ...member, paymentSmsNotificationsEnabled: enabled }
          : member,
      ),
    } : current)

    try {
      const res = await api.patch(
        `/merchant-kyc/${merchantId}/team-members/${memberId}/payment-sms`,
        { enabled },
      )
      const updated = res.data?.teamMember
      if (updated) {
        setPaymentSmsRecipients(current => current ? {
          ...current,
          teamMembers: current.teamMembers.map(member =>
            member.id === memberId ? { ...member, ...updated } : member,
          ),
        } : current)
      }
      toast.success(enabled ? 'Payment SMS enabled for team member' : 'Payment SMS disabled for team member')
    } catch (error: unknown) {
      setPaymentSmsRecipients(previous)
      toast.error(extractErrorMessage(error) || 'Failed to update payment SMS setting')
    } finally {
      setSavingPaymentSmsMember(null)
    }
  }

  const handleSuspend = async () => {
    if (!suspendForm.reason) {
      toast.error('Please provide a suspension reason')
      return
    }

    if (!suspendForm.amount) {
      toast.error('Please specify the amount to suspend')
      return
    }

    setIsLoading(true)
    try {
      // API call to suspend user
      const response = await fetch(`/api/users/${customerId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: suspendForm.reason,
          duration: suspendForm.duration,
          blockMoney: suspendForm.blockMoney,
          amount: parseFloat(suspendForm.amount) // Include amount in API call
        })
      })

      if (response.ok) {
        toast.success(`User suspended with ${suspendForm.amount} ${currency} blocked`)
        setSuspendDialogOpen(false)
        setSuspendForm({ reason: '', duration: '', blockMoney: false, amount: '' })
        onActionComplete?.()
      } else {
        throw new Error('Failed to suspend user')
      }
    } catch (error) {
      toast.error('Failed to suspend user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setIsLoading(true)
    try {
      // API call to unsuspend user
      const response = await fetch(`/api/users/${customerId}/unsuspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('User unsuspended successfully')
        setUnsuspendDialogOpen(false)
        onActionComplete?.()
      } else {
        throw new Error('Failed to unsuspend user')
      }
    } catch (error) {
      toast.error('Failed to unsuspend user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualTransaction = async () => {
    const parsedAmount = parseFloat(transactionForm.amount)
    if (!transactionForm.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount')
      return
    }
    if (!transactionForm.description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (!effectiveWalletId) {
      toast.error('Wallet ID is not available for this customer. Cannot process transaction.')
      return
    }

    // CREDIT → positive amount; DEBIT → negative amount (fund endpoint accepts both)
    const signedAmount = transactionForm.type === 'DEBIT' ? -parsedAmount : parsedAmount

    setIsLoading(true)
    try {
      const res = await api.post(`/wallet/admin/${effectiveWalletId}/fund`, {
        amount: signedAmount,
        reason: transactionForm.description.trim(),
        reference: transactionForm.reference.trim() || `MANUAL_${Date.now()}`,
      })

      const data = res.data
      const newBalance = data?.balanceAfter ?? data?.wallet?.balance
      const balMsg = newBalance != null
        ? ` New balance: ${Number(newBalance).toLocaleString()} ${currency}`
        : ''

      toast.success(
        `${transactionForm.type === 'CREDIT' ? 'Credit' : 'Debit'} of ${parsedAmount.toLocaleString()} ${currency} applied.${balMsg}`
      )
      setManualTransactionDialogOpen(false)
      setTransactionForm({ type: 'CREDIT', amount: '', description: '', reference: '' })
      onActionComplete?.()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create manual transaction'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPin = async () => {
    if (!customerPhone) {
      toast.error('Customer phone number not found. Cannot reset PIN.')
      return
    }

    setIsResettingPin(true)
    try {
      const response = await api.post('/auth/reset-pin-by-phone', { phone: customerPhone })
      const data = response.data

      if (data?.success) {
        toast.success(data?.message || 'PIN has been reset successfully. A temporary PIN has been sent to the customer\'s phone number.')
        setResetPinDialogOpen(false)
        onActionComplete?.()
      } else {
        throw new Error(data?.message || 'Failed to reset PIN')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset PIN. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsResettingPin(false)
    }
  }

  const handleResetMerchantPortalPin = async () => {
    if (!merchantId) {
      toast.error('Merchant information not available.')
      return
    }

    setIsResettingPortalPin(true)
    try {
      const response = await api.post('/auth/merchant/admin/reset-portal-pin', {
        merchantId,
      })
      const data = response.data
      if (data?.success) {
        toast.success(
          data?.message ||
            'Merchant portal PIN reset. A temporary PIN was sent via SMS.',
        )
        setResetPortalPinDialogOpen(false)
        onActionComplete?.()
      } else {
        throw new Error(data?.message || 'Failed to reset merchant portal PIN')
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to reset merchant portal PIN.'
      toast.error(errorMessage)
    } finally {
      setIsResettingPortalPin(false)
    }
  }

  const handleSaveCollectionFeeMode = async () => {
    if (type !== 'merchant' || !merchantId) {
      toast.error('Merchant information not available for fee configuration.')
      return
    }

    if (collectionMode === 'CUSTOMER_PAYS_PARTIAL') {
      if (customerSharePercent <= 0 || customerSharePercent > 100) {
        toast.error('Customer share percent must be between 1 and 100.')
        return
      }
    }

    const parsedTotal = totalFeePercent.trim() === '' ? null : Number(totalFeePercent)
    const parsedMno = mnoFeePercent.trim() === '' ? null : Number(mnoFeePercent)
    if (parsedTotal != null && (Number.isNaN(parsedTotal) || parsedTotal <= 0 || parsedTotal > 50)) {
      toast.error('Total collection fee % must be between 0.01 and 50.')
      return
    }
    if (parsedMno != null && (Number.isNaN(parsedMno) || parsedMno < 0 || parsedMno > 50)) {
      toast.error('MNO fee % must be between 0 and 50.')
      return
    }
    if (parsedTotal != null && parsedMno != null && parsedMno > parsedTotal) {
      toast.error('MNO fee % cannot exceed total collection fee %.')
      return
    }

    setIsSavingFeeMode(true)
    try {
      const payload: Record<string, unknown> = {
        collectionFeeMode: collectionMode,
        collectionTotalFeePercent: parsedTotal,
        collectionMnoPartnerFeePercent: parsedMno,
      }
      if (collectionMode === 'CUSTOMER_PAYS_PARTIAL') {
        payload.collectionCustomerSharePercent = customerSharePercent
      }

      const res = await api.patch(`/merchant-kyc/${merchantId}/fee-mode`, payload)
      const data = res?.data

      // Persist on frontend: update local state so the dropdown reflects the saved value immediately
      if (data?.collectionFeeMode) setCollectionMode(data.collectionFeeMode)
      if (data?.collectionCustomerSharePercent != null) setCustomerSharePercent(Number(data.collectionCustomerSharePercent))
      if (data?.collectionTotalFeePercent != null) setTotalFeePercent(String(data.collectionTotalFeePercent))
      else if (parsedTotal === null) setTotalFeePercent('')
      if (data?.collectionMnoPartnerFeePercent != null) setMnoFeePercent(String(data.collectionMnoPartnerFeePercent))
      else if (parsedMno === null) setMnoFeePercent('')

      toast.success('Merchant collection fee mode updated successfully.')
      onActionComplete?.()
    } catch (error: any) {
      toast.error(extractErrorMessage(error) || 'Failed to update collection fee mode.')
    } finally {
      setIsSavingFeeMode(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Current account status and management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${customerStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="text-sm font-medium">Account Status</div>
                  <div className="text-sm text-gray-600 capitalize">{customerStatus.toLowerCase()}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {customerStatus === 'ACTIVE' ? (
                  <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Suspend Money
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Suspend User Account</DialogTitle>
                        <DialogDescription>
                          Suspend this user's account and optionally block their money
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">Suspension Reason *</Label>
                          <Textarea
                            id="reason"
                            placeholder="Enter reason for suspension..."
                            value={suspendForm.reason}
                            onChange={(e) => setSuspendForm({...suspendForm, reason: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount to Suspend *</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder={`Enter amount in ${currency}`}
                            value={suspendForm.amount}
                            onChange={(e) => setSuspendForm({...suspendForm, amount: e.target.value})}
                          />
                          <p className="text-xs text-gray-500">
                            This amount will be blocked from the user's wallet
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration</Label>
                          <Select value={suspendForm.duration} onValueChange={(value) => setSuspendForm({...suspendForm, duration: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1d">1 Day</SelectItem>
                              <SelectItem value="7d">7 Days</SelectItem>
                              <SelectItem value="30d">30 Days</SelectItem>
                              <SelectItem value="indefinite">Indefinite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="blockMoney"
                            checked={suspendForm.blockMoney}
                            onChange={(e) => setSuspendForm({...suspendForm, blockMoney: e.target.checked})}
                          />
                          <Label htmlFor="blockMoney">Block all money transactions</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleSuspend} disabled={isLoading}>
                          {isLoading ? 'Suspending...' : 'Suspend User'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Unsuspend
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Unsuspend User Account</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to unsuspend this user's account?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUnsuspendDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUnsuspend} disabled={isLoading}>
                          {isLoading ? 'Unsuspending...' : 'Unsuspend User'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Merchant collection fee configuration (for merchant profiles only) */}
      {type === 'merchant' && merchantId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Merchant Collection Fee Mode
            </CardTitle>
            <CardDescription>
              Configure how external collection fees are shared between the merchant and their customers
              {merchantCode ? ` (Merchant Code: ${merchantCode})` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer fee mode</Label>
                <Select
                  value={collectionMode}
                  onValueChange={(value) =>
                    setCollectionMode(
                      value as 'CUSTOMER_PAYS_ALL' | 'CUSTOMER_PAYS_PARTIAL' | 'CUSTOMER_PAYS_NONE',
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER_PAYS_ALL">
                      Customer pays all external fee
                    </SelectItem>
                    <SelectItem value="CUSTOMER_PAYS_PARTIAL">
                      Customer pays partial external fee
                    </SelectItem>
                    <SelectItem value="CUSTOMER_PAYS_NONE">
                      Merchant pays fee (deducted from collection)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalFeePercent">Total collection fee (%)</Label>
                  <Input
                    id="totalFeePercent"
                    type="number"
                    min={0.01}
                    max={50}
                    step={0.01}
                    value={totalFeePercent}
                    onChange={(e) => setTotalFeePercent(e.target.value)}
                    placeholder="Default 2.5"
                  />
                  <p className="text-xs text-gray-500">
                    Custom rate for this merchant (e.g. 2.8). Leave empty for platform default.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mnoFeePercent">MNO / partner share (%)</Label>
                  <Input
                    id="mnoFeePercent"
                    type="number"
                    min={0}
                    max={50}
                    step={0.01}
                    value={mnoFeePercent}
                    onChange={(e) => setMnoFeePercent(e.target.value)}
                    placeholder="Default 2.0"
                  />
                  <p className="text-xs text-gray-500">
                    Rukapay share = total − MNO. Leave empty to scale from default ratio.
                  </p>
                </div>
              </div>

              {collectionMode === 'CUSTOMER_PAYS_PARTIAL' && (
                <div className="space-y-2">
                  <Label htmlFor="customerSharePercent">Customer share of external fee (%)</Label>
                  <Input
                    id="customerSharePercent"
                    type="number"
                    min={0}
                    max={100}
                    value={Number.isFinite(customerSharePercent) ? customerSharePercent : 0}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setCustomerSharePercent(Number.isNaN(value) ? 0 : value)
                    }}
                    placeholder="Enter percentage (e.g. 50)"
                  />
                  <p className="text-xs text-gray-500">
                    Example: if external fee is 2% and you set 50%, customer pays 1% and RukaPay absorbs 1%.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={handleSaveCollectionFeeMode}
                  disabled={isSavingFeeMode}
                  className="flex items-center gap-2"
                >
                  {isSavingFeeMode ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Save fee configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merchant payment SMS recipients (for merchant profiles only) */}
      {type === 'merchant' && merchantId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Payment SMS Recipients
            </CardTitle>
            <CardDescription>
              Control who receives SMS after successful MNO-to-wallet payments to this merchant. Customer SMS is off by default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">Customer payment success SMS</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sends &quot;Paid UGX X to merchant&quot; to the customer after a successful MNO collection.
                  </p>
                </div>
                <Switch
                  checked={paymentSmsRecipients?.customerCollectionSuccessSmsEnabled ?? false}
                  disabled={
                    paymentSmsRecipientsLoading ||
                    savingMerchantPaymentSmsSetting === 'customer'
                  }
                  onCheckedChange={(checked) =>
                    handleMerchantPaymentSmsSettingToggle(
                      'customerCollectionSuccessSmsEnabled',
                      checked,
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-100">
                <div>
                  <div className="text-sm font-medium">Merchant owner</div>
                  <div className="text-sm text-gray-600">
                    {paymentSmsRecipients?.owner?.phone || customerPhone || 'No phone found'}
                    {paymentSmsRecipients?.owner?.email ? ` • ${paymentSmsRecipients.owner.email}` : ''}
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Receives successful merchant payment SMS when enabled.
                  </p>
                </div>
                <Switch
                  checked={paymentSmsRecipients?.merchantPaymentSmsEnabled ?? true}
                  disabled={
                    paymentSmsRecipientsLoading ||
                    savingMerchantPaymentSmsSetting === 'merchant'
                  }
                  onCheckedChange={(checked) =>
                    handleMerchantPaymentSmsSettingToggle(
                      'merchantPaymentSmsEnabled',
                      checked,
                    )
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Team members</Label>
                  {paymentSmsRecipientsLoading && (
                    <span className="text-xs text-gray-500">Loading...</span>
                  )}
                </div>

                {paymentSmsRecipients?.merchantPaymentSmsEnabled === false && (
                  <p className="text-xs text-gray-500">
                    Enable merchant owner SMS above to allow team member payment notifications.
                  </p>
                )}

                {!paymentSmsRecipientsLoading && (paymentSmsRecipients?.teamMembers?.length || 0) === 0 ? (
                  <div className="text-sm text-gray-500 border rounded-lg p-4">
                    No active merchant team members found for the business/collection wallet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentSmsRecipients?.teamMembers?.map(member => {
                      const displayName =
                        `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                        member.email ||
                        member.userEmail ||
                        'Team member'
                      const disabled =
                        savingPaymentSmsMember === member.id ||
                        !member.phone ||
                        paymentSmsRecipients?.merchantPaymentSmsEnabled === false

                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="text-sm font-medium">{displayName}</div>
                            <div className="text-sm text-gray-600">
                              {member.phone || 'No registration phone'}
                              {member.email ? ` • ${member.email}` : ''}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {member.role} • {walletTypeLabel(member.walletType || undefined)} wallet
                              {!member.phone ? ' • Add a phone number before enabling SMS' : ''}
                            </p>
                          </div>
                          <Switch
                            checked={member.paymentSmsNotificationsEnabled}
                            disabled={disabled}
                            onCheckedChange={(checked) =>
                              handlePaymentSmsToggle(member.id, checked)
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'merchant' && merchantId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              USSD Entry Point
            </CardTitle>
            <CardDescription>
              Assign a merchant-specific shortcut after the main RukaPay shortcode. Example: code <strong>9</strong> becomes <strong>*289*9*{'{amount}'}#</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ussdEntryPointLoading ? (
                <div className="text-sm text-gray-500">Loading USSD entry point...</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ussdEntryCode">USSD entry code</Label>
                      <Input
                        id="ussdEntryCode"
                        value={ussdEntryCodeInput}
                        onChange={(e) => setUssdEntryCodeInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 9"
                      />
                      <p className="text-xs text-gray-500">
                        Use digits only. Codes 1-8 are reserved by the main RukaPay menu.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Merchant code</Label>
                      <Input value={merchantCode || ussdEntryPoint?.merchantCode || ''} disabled />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ussdMinimumAmount">Minimum amount (UGX)</Label>
                      <Input
                        id="ussdMinimumAmount"
                        type="number"
                        min={500}
                        value={ussdMinimumAmount}
                        onChange={(e) => setUssdMinimumAmount(Number(e.target.value) || 500)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ussdMaximumAmount">Maximum amount (UGX)</Label>
                      <Input
                        id="ussdMaximumAmount"
                        type="number"
                        min={500}
                        value={ussdMaximumAmount}
                        onChange={(e) => setUssdMaximumAmount(Number(e.target.value) || 5000000)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Enable USSD entry point</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Merchant must be active and verified before enabling.
                      </p>
                    </div>
                    <Switch
                      checked={ussdEntryEnabled}
                      onCheckedChange={setUssdEntryEnabled}
                    />
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
                    <div className="font-medium">Dial pattern preview</div>
                    <div className="mt-1 font-mono">
                      {ussdEntryCodeInput.trim()
                        ? `*289*${ussdEntryCodeInput.trim()}*{amount}#`
                        : '*289*{code}*{amount}#' }
                    </div>
                    {ussdEntryPoint?.dialPattern && ussdEntryPoint.ussdEntryCode && (
                      <div className="mt-2 text-xs text-gray-500">
                        Saved pattern: {ussdEntryPoint.dialPattern}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="default"
                      onClick={handleSaveUssdEntryPoint}
                      disabled={isSavingUssdEntryPoint}
                      className="flex items-center gap-2"
                    >
                      {isSavingUssdEntryPoint ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Save USSD entry point
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Management
          </CardTitle>
          <CardDescription>
            {effectiveWallets.length > 1 ? 'All wallet balances and manual transaction management' : 'Current wallet balance and manual transaction management'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!hasWallet ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
                <Wallet className="mx-auto mb-3 h-12 w-12 text-yellow-500" />
                <p className="mb-1 text-base font-semibold text-gray-900">No wallet found</p>
                <p className="mb-4 text-sm text-gray-600">
                  {canHaveWallet
                    ? 'This customer registered without a wallet. Create one to enable funding and transactions.'
                    : 'This user is not allowed to have a wallet.'}
                </p>
                {canHaveWallet && (
                  <Button
                    onClick={handleCreateWallet}
                    disabled={isCreatingWallet}
                    className="gap-2"
                  >
                    {isCreatingWallet ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating wallet...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Wallet
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : effectiveWallets.length > 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {effectiveWallets.map((w) => {
                  const bal = w.balance != null ? Number(w.balance) : 0
                  const curr = w.currency || currency
                  return (
                    <div key={w.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">{walletTypeLabel(w.walletType)}</div>
                          <div className="text-sm text-gray-600">{Number.isNaN(bal) ? '0' : bal.toLocaleString()} {curr}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Current Balance</div>
                    <div className="text-sm text-gray-600">{(effectiveBalanceNum ?? 0).toLocaleString()} {currency}</div>
                  </div>
                </div>
              </div>
            )}

            {hasWallet && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Manual Transaction</div>
                  <div className="text-sm text-gray-600">Create manual credit/debit transaction</div>
                </div>
              </div>
              <Dialog open={manualTransactionDialogOpen} onOpenChange={setManualTransactionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Create Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Manual Transaction</DialogTitle>
                    <DialogDescription>
                      Directly credit or debit this wallet. The change is recorded in the ledger.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {effectiveWallets.length > 1 && (
                      <div>
                        <Label>Wallet *</Label>
                        <Select value={selectedWalletIdForTx} onValueChange={setSelectedWalletIdForTx}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select wallet" />
                          </SelectTrigger>
                          <SelectContent>
                            {effectiveWallets.map((w) => {
                              const bal = w.balance != null ? Number(w.balance) : 0
                              return (
                                <SelectItem key={w.id} value={w.id}>
                                  {walletTypeLabel(w.walletType)} — {Number.isNaN(bal) ? '0' : bal.toLocaleString()} {currency}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Current balance context */}
                    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2 text-sm">
                      <span className="text-gray-500">Current balance{effectiveWallets.length > 1 ? ` (${walletTypeLabel(effectiveWallets.find(w => w.id === effectiveWalletId)?.walletType)})` : ''}</span>
                      <span className="font-semibold text-gray-800">
                        {effectiveBalanceNum.toLocaleString()} {currency}
                      </span>
                    </div>

                    <div>
                      <Label htmlFor="type">Transaction Type *</Label>
                      <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm({...transactionForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT">Credit (Add Money)</SelectItem>
                          <SelectItem value="DEBIT">Debit (Remove Money)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount ({currency}) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min={1}
                        placeholder="Enter amount"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                      />
                      {/* Balance preview */}
                      {transactionForm.amount && !Number.isNaN(parseFloat(transactionForm.amount)) && parseFloat(transactionForm.amount) > 0 && (
                        <div className="mt-1 flex items-center justify-between rounded border border-dashed px-3 py-1.5 text-xs text-gray-600">
                          <span>Balance after this transaction</span>
                          <span className={`font-semibold ${transactionForm.type === 'CREDIT' ? 'text-green-700' : 'text-red-600'}`}>
                            {(transactionForm.type === 'CREDIT'
                              ? effectiveBalanceNum + parseFloat(transactionForm.amount)
                              : effectiveBalanceNum - parseFloat(transactionForm.amount)
                            ).toLocaleString()} {currency}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description">Description / Reason *</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter reason for this adjustment..."
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">Reference (Optional)</Label>
                      <Input
                        id="reference"
                        placeholder="Auto-generated if left blank"
                        value={transactionForm.reference}
                        onChange={(e) => setTransactionForm({...transactionForm, reference: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManualTransactionDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleManualTransaction}
                      disabled={isLoading || !effectiveWalletId}
                      className={transactionForm.type === 'DEBIT' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      {isLoading ? 'Processing...' : transactionForm.type === 'CREDIT' ? 'Credit Wallet' : 'Debit Wallet'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Actions
          </CardTitle>
          <CardDescription>
            Security-related actions for this customer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Reset Mobile App PIN</div>
                  <div className="text-sm text-gray-600">
                    Resets the customer&apos;s mobile app PIN and sends a temporary PIN via SMS
                  </div>
                  {customerPhone && (
                    <div className="text-xs text-gray-500 mt-1">
                      Phone: {customerPhone}
                    </div>
                  )}
                </div>
              </div>
              <Dialog open={resetPinDialogOpen} onOpenChange={setResetPinDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    disabled={!customerPhone}
                  >
                    <Key className="h-4 w-4" />
                    Reset PIN
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Mobile App PIN</DialogTitle>
                    <DialogDescription>
                      This resets the customer&apos;s mobile app PIN (not the merchant dashboard PIN) and sends a temporary 5-digit PIN via SMS.
                    </DialogDescription>
                  </DialogHeader>
                  {customerPhone ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">Customer Phone Number</div>
                        <div className="text-sm text-blue-700">{customerPhone}</div>
                      </div>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm font-medium text-yellow-900 mb-1">⚠️ Important</div>
                        <div className="text-sm text-yellow-700">
                          A temporary 5-digit PIN will be sent to this phone number. The customer must change it after login.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-900">Phone Number Not Found</div>
                      <div className="text-sm text-red-700 mt-1">
                        Cannot reset PIN without a phone number for this customer.
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResetPinDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleResetPin} 
                      disabled={isResettingPin || !customerPhone}
                      className="flex items-center gap-2"
                    >
                      {isResettingPin ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Resetting PIN...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          Reset PIN & Send SMS
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {type === 'merchant' && merchantId && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Enable PIN login (merchant dashboard)</div>
                    <div className="text-sm text-gray-600">
                      Allow the business owner to sign in with phone + portal PIN (OTP remains available)
                    </div>
                  </div>
                </div>
                <Switch
                  checked={featureFlags.featurePinLogin}
                  onCheckedChange={(val) => handleFeatureFlagToggle('featurePinLogin', val)}
                  disabled={savingFlag === 'featurePinLogin'}
                />
              </div>
            )}

            {type === 'merchant' && merchantId && featureFlags.featurePinLogin && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Reset Merchant Portal PIN</div>
                    <div className="text-sm text-gray-600">
                      Resets the merchant dashboard login PIN only — not the mobile app PIN
                    </div>
                    {customerPhone && (
                      <div className="text-xs text-gray-500 mt-1">
                        SMS to: {customerPhone}
                      </div>
                    )}
                  </div>
                </div>
                <Dialog open={resetPortalPinDialogOpen} onOpenChange={setResetPortalPinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={!customerPhone}
                    >
                      <Key className="h-4 w-4" />
                      Reset Portal PIN
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Merchant Portal PIN</DialogTitle>
                      <DialogDescription>
                        Sends a temporary PIN for the merchant dashboard login. This does not change the mobile app PIN.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setResetPortalPinDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleResetMerchantPortalPin}
                        disabled={isResettingPortalPin || !customerPhone}
                      >
                        {isResettingPortalPin ? 'Resetting…' : 'Reset & Send SMS'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Emergency actions for account management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Block Account
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Verify Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Feature Flags — merchants only */}
      {type === 'merchant' && merchantId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard Features
            </CardTitle>
            <CardDescription>
              Control which tabs are visible in this merchant&apos;s dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featureFlagsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Payment (Bulk Payments)</div>
                    <div className="text-sm text-gray-500">Show the bulk payments tab in the dashboard</div>
                  </div>
                  <Switch
                    checked={featureFlags.featureBulkPayments}
                    onCheckedChange={(val) => handleFeatureFlagToggle('featureBulkPayments', val)}
                    disabled={savingFlag === 'featureBulkPayments' || liquidationOnlyMode}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Disbursement (Bulk pay, Payroll, Withdrawal)</div>
                    <div className="text-sm text-gray-500">Enable separate disbursement wallet for bulk payments, payroll, and withdrawals. Creates DISBURSEMENT wallet when enabled.</div>
                  </div>
                  <Switch
                    checked={featureFlags.featureLiquidation}
                    onCheckedChange={(val) => handleFeatureFlagToggle('featureLiquidation', val)}
                    disabled={savingFlag === 'featureLiquidation' || liquidationOnlyMode}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Payroll</div>
                    <div className="text-sm text-gray-500">Show the payroll tab in the dashboard</div>
                  </div>
                  <Switch
                    checked={featureFlags.featurePayroll}
                    onCheckedChange={(val) => handleFeatureFlagToggle('featurePayroll', val)}
                    disabled={savingFlag === 'featurePayroll' || liquidationOnlyMode}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Payroll Approvals</div>
                    <div className="text-sm text-gray-500">Show the payroll approvals tab in the dashboard</div>
                  </div>
                  <Switch
                    checked={featureFlags.featurePayrollApprovals}
                    onCheckedChange={(val) => handleFeatureFlagToggle('featurePayrollApprovals', val)}
                    disabled={savingFlag === 'featurePayrollApprovals' || liquidationOnlyMode}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Liquidation-Only Mode — merchants only, admin-configured */}
      {type === 'merchant' && merchantId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Liquidation-Only Mode
            </CardTitle>
            <CardDescription>
              Restrict this merchant to liquidating only to a single admin-configured bank or mobile money destination. Merchants cannot edit these details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {liquidationOnlyLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Enable Liquidation-Only Mode</div>
                    <div className="text-sm text-gray-500">
                      Blocks send money, bills, airtime, bulk, payroll, sweep, and RukaPay payouts. Collections remain allowed.
                    </div>
                  </div>
                  <Switch
                    checked={liquidationOnlyMode}
                    onCheckedChange={setLiquidationOnlyMode}
                    disabled={isSavingLiquidationOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destination type</Label>
                  <Select
                    value={liquidationDestinationType}
                    onValueChange={(val) =>
                      setLiquidationDestinationType(val as 'MOBILE_MONEY' | 'BANK')
                    }
                    disabled={isSavingLiquidationOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="BANK">Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {liquidationDestinationType === 'MOBILE_MONEY' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telecom provider</Label>
                      <Select
                        value={liquidationMomoProvider}
                        onValueChange={setLiquidationMomoProvider}
                        disabled={isSavingLiquidationOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTN">MTN</SelectItem>
                          <SelectItem value="AIRTEL">Airtel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone number</Label>
                      <Input
                        value={liquidationMomoPhone}
                        onChange={(e) => setLiquidationMomoPhone(e.target.value)}
                        placeholder="2567XXXXXXXX"
                        disabled={isSavingLiquidationOnly}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Account name (optional)</Label>
                      <Input
                        value={liquidationMomoAccountName}
                        onChange={(e) => setLiquidationMomoAccountName(e.target.value)}
                        placeholder="Account holder name"
                        disabled={isSavingLiquidationOnly}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Bank</Label>
                      <BankSortCodeSelect
                        value={liquidationBankCode}
                        onValueChange={setLiquidationBankCode}
                        disabled={isSavingLiquidationOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account number</Label>
                      <Input
                        value={liquidationBankAccountNumber}
                        onChange={(e) => setLiquidationBankAccountNumber(e.target.value)}
                        disabled={isSavingLiquidationOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account name</Label>
                      <Input
                        value={liquidationBankAccountName}
                        onChange={(e) => setLiquidationBankAccountName(e.target.value)}
                        disabled={isSavingLiquidationOnly}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Branch (optional)</Label>
                      <Input
                        value={liquidationBankBranch}
                        onChange={(e) => setLiquidationBankBranch(e.target.value)}
                        disabled={isSavingLiquidationOnly}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveLiquidationOnlySettings}
                  disabled={isSavingLiquidationOnly}
                >
                  {isSavingLiquidationOnly ? 'Saving...' : 'Save Liquidation-Only Settings'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CustomerSettings 