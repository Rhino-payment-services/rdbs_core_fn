/**
 * Channels available for channel-specific tariff configuration.
 * Aligns with rdbs_core SystemChannel (src/common/constants/channels.ts).
 */
/** Sentinel for “all channels” in Select components (empty string is invalid in Radix Select). */
export const TARIFF_CHANNEL_ALL = '__ALL__';

export const TARIFF_CHANNEL_OPTIONS = [
  { value: TARIFF_CHANNEL_ALL, label: 'All channels (default)' },
  { value: 'USSD', label: 'USSD' },
  { value: 'APP', label: 'Mobile App' },
  { value: 'CARD', label: 'Card / NFC' },
  { value: 'POS', label: 'POS' },
  { value: 'WEB', label: 'Web' },
  { value: 'MERCHANT_PORTAL', label: 'Merchant Portal' },
  { value: 'AGENT_PORTAL', label: 'Agent Portal' },
  { value: 'PARTNER_PORTAL', label: 'Partner Portal' },
  { value: 'API', label: 'API' },
  { value: 'BACKOFFICE', label: 'Backoffice' },
  { value: 'SHULE', label: 'Shule (School fees)' },
] as const;

export function formatTariffChannel(channel?: string | null): string {
  if (!channel) return 'All channels';
  const found = TARIFF_CHANNEL_OPTIONS.find((o) => o.value === channel);
  return found?.label ?? channel;
}
