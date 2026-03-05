import type { PartyDisplayProps } from './types'

export const PartyDisplay = ({ info, nameClassName, extras }: PartyDisplayProps) => (
  <>
    <span className={`font-medium ${nameClassName || ''}`}>{info.name}</span>
    {info.contact && (
      <span className="text-xs text-gray-500">📱 {info.contact}</span>
    )}
    {info.merchantCode && (
      <span className="text-xs text-gray-500">🏪 Code: {info.merchantCode}</span>
    )}
    <span className={`text-xs font-medium ${
      info.type === 'MERCHANT' || info.type === 'SUBSCRIBER' || info.type === 'PARTNER' ? 'text-blue-600' :
      info.type === 'ADMIN' ? 'text-purple-600' :
      'text-gray-500'
    }`}>
      {info.type === 'MERCHANT' ? '🏦 Merchant Account' :
       info.type === 'PARTNER' ? 'API Partner' :
       info.type === 'ADMIN' ? '👨‍💼 Admin Funding' :
       info.type === 'SUBSCRIBER' ? '🏦 RukaPay Subscriber' :
       info.type === 'EXTERNAL_MNO' ? '📱 Mobile Money' :
       info.type === 'EXTERNAL_BANK' ? '🏦 Bank Account' :
       info.type === 'UTILITY' ? '⚡ Utility' :
       'External'}
    </span>
    {extras}
  </>
)
