import type {
  AmountRoutingRule,
  CreateAmountRoutingRuleRequest,
  UpdateAmountRoutingRuleRequest,
} from '@/lib/hooks/useAmountRoutingRules';

export const AMOUNT_ROUTING_TRANSACTION_TYPES = [
  { value: '', label: 'Any transaction type' },
  { value: 'WALLET_TO_MNO', label: 'Send (Wallet → MNO)' },
  { value: 'MNO_TO_WALLET', label: 'Collect (MNO → Wallet)' },
] as const;

export const AMOUNT_ROUTING_NETWORKS = [
  { value: '', label: 'Any network' },
  { value: 'MTN', label: 'MTN' },
  { value: 'AIRTEL', label: 'Airtel' },
] as const;

const MNO_TRANSACTION_TYPES = new Set(['WALLET_TO_MNO', 'MNO_TO_WALLET']);

export function isMnoAmountRoutingType(transactionType: string): boolean {
  return MNO_TRANSACTION_TYPES.has(transactionType);
}

export function formatRoutingTransactionType(value: string | null | undefined): string {
  if (!value) return 'Any';
  const match = AMOUNT_ROUTING_TRANSACTION_TYPES.find((t) => t.value === value);
  return match?.label ?? value.replace(/_/g, ' ');
}

export function formatRoutingNetwork(value: string | null | undefined): string {
  if (!value) return 'Any';
  return value.toUpperCase() === 'AIRTEL' ? 'Airtel' : value.toUpperCase();
}

export interface AmountBandFormValues {
  currency: string;
  minAmount: string;
  maxAmount: string;
  partnerId: string;
  apiPartnerId: string;
  priority: string;
  transactionType: string;
  geographicRegion: string;
  network: string;
}

export function bandsOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number },
): boolean {
  return a.min <= b.max && b.min <= a.max;
}

export function formatAmountBand(
  currency: string,
  minAmount: number,
  maxAmount: number,
): string {
  const cur = (currency || 'UGX').toUpperCase();
  const min = Number(minAmount).toLocaleString('en-UG');
  const max = Number(maxAmount).toLocaleString('en-UG');
  return `${min} – ${max} ${cur}`;
}

export function formatAmountValue(amount: number, currency?: string): string {
  const formatted = Number(amount).toLocaleString('en-UG');
  return currency ? `${formatted} ${currency.toUpperCase()}` : formatted;
}

export function findOverlappingRules(
  rules: AmountRoutingRule[],
  draft: {
    min: number;
    max: number;
    currency: string;
    apiPartnerId: string;
    transactionType?: string;
    geographicRegion?: string;
    network?: string;
  },
  excludeId?: string,
): AmountRoutingRule[] {
  const currency = draft.currency.toUpperCase();
  const draftScope = {
    transactionType: draft.transactionType || null,
    geographicRegion: draft.geographicRegion || null,
    network: draft.network || null,
  };

  return rules.filter((rule) => {
    if (!rule.isActive) return false;
    if (excludeId && rule.id === excludeId) return false;
    if (rule.currency.toUpperCase() !== currency) return false;
    if ((rule.apiPartnerId || '') !== draft.apiPartnerId) return false;
    if (
      !routingScopesCollide(draftScope, {
        transactionType: rule.transactionType,
        geographicRegion: rule.geographicRegion,
        network: rule.network,
      })
    ) {
      return false;
    }
    return bandsOverlap(
      { min: draft.min, max: draft.max },
      { min: rule.minAmount, max: rule.maxAmount },
    );
  });
}

/** Null/empty = any. Scopes collide when every dimension is wildcard or equal. */
export function routingScopesCollide(
  a: {
    transactionType?: string | null;
    geographicRegion?: string | null;
    network?: string | null;
  },
  b: {
    transactionType?: string | null;
    geographicRegion?: string | null;
    network?: string | null;
  },
): boolean {
  return (
    scopeDimensionCollides(a.transactionType, b.transactionType) &&
    scopeDimensionCollides(a.geographicRegion, b.geographicRegion) &&
    scopeDimensionCollides(a.network, b.network)
  );
}

function scopeDimensionCollides(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeScopeDimension(a);
  const right = normalizeScopeDimension(b);
  if (!left || !right) return true;
  return left === right;
}

function normalizeScopeDimension(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function validateAmountBandForm(values: AmountBandFormValues): string | null {
  const currency = values.currency.trim();
  if (!currency) return 'Currency is required';

  if (values.minAmount.trim() === '') return 'Minimum amount is required';
  if (values.maxAmount.trim() === '') return 'Maximum amount is required';
  if (!values.apiPartnerId) return 'API partner is required';
  if (!values.partnerId) return 'Partner is required';

  const minAmount = Number(values.minAmount);
  const maxAmount = Number(values.maxAmount);
  const priority = values.priority.trim() === '' ? 1 : Number(values.priority);

  if (!Number.isFinite(minAmount) || minAmount < 0) {
    return 'Minimum amount must be a number greater than or equal to 0';
  }
  if (!Number.isFinite(maxAmount) || maxAmount < 0) {
    return 'Maximum amount must be a number greater than or equal to 0';
  }
  if (minAmount >= maxAmount) {
    return 'Minimum amount must be less than maximum amount';
  }
  if (!Number.isInteger(priority) || priority < 1) {
    return 'Priority must be an integer of at least 1';
  }

  if (isMnoAmountRoutingType(values.transactionType) && !values.network) {
    return 'Network (MTN or Airtel) is required for MNO send/collect rules';
  }

  if (values.network && !['MTN', 'AIRTEL'].includes(values.network.toUpperCase())) {
    return 'Network must be MTN or Airtel';
  }

  return null;
}

function optionalScopeField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function buildCreatePayload(
  values: AmountBandFormValues,
): CreateAmountRoutingRuleRequest {
  const payload: CreateAmountRoutingRuleRequest = {
    currency: values.currency.trim().toUpperCase(),
    minAmount: Number(values.minAmount),
    maxAmount: Number(values.maxAmount),
    partnerId: values.partnerId,
    apiPartnerId: values.apiPartnerId,
    priority: values.priority.trim() === '' ? 1 : Number(values.priority),
  };

  const transactionType = optionalScopeField(values.transactionType);
  const geographicRegion = optionalScopeField(values.geographicRegion);
  const network = optionalScopeField(values.network);

  if (transactionType) payload.transactionType = transactionType;
  if (geographicRegion) payload.geographicRegion = geographicRegion;
  if (network) payload.network = network.toUpperCase();

  return payload;
}

export function buildUpdatePayload(
  values: AmountBandFormValues,
  original: AmountRoutingRule,
): UpdateAmountRoutingRuleRequest {
  const payload: UpdateAmountRoutingRuleRequest = {};
  const currency = values.currency.trim().toUpperCase();
  const minAmount = Number(values.minAmount);
  const maxAmount = Number(values.maxAmount);
  const priority = values.priority.trim() === '' ? 1 : Number(values.priority);
  const transactionType = values.transactionType.trim() || null;
  const geographicRegion = values.geographicRegion.trim() || null;
  const network = values.network.trim() ? values.network.trim().toUpperCase() : null;

  if (currency !== original.currency.toUpperCase()) payload.currency = currency;
  if (minAmount !== original.minAmount) payload.minAmount = minAmount;
  if (maxAmount !== original.maxAmount) payload.maxAmount = maxAmount;
  if (values.partnerId !== original.partnerId) payload.partnerId = values.partnerId;
  if (values.apiPartnerId !== (original.apiPartnerId || '')) {
    payload.apiPartnerId = values.apiPartnerId;
  }
  if (priority !== original.priority) payload.priority = priority;
  if (transactionType !== (original.transactionType || null)) {
    payload.transactionType = transactionType;
  }
  if (geographicRegion !== (original.geographicRegion || null)) {
    payload.geographicRegion = geographicRegion;
  }
  if (network !== (original.network?.toUpperCase() || null)) {
    payload.network = network;
  }

  return payload;
}

export const DEFAULT_AMOUNT_BAND_FORM: AmountBandFormValues = {
  currency: 'UGX',
  minAmount: '',
  maxAmount: '',
  partnerId: '',
  apiPartnerId: '',
  priority: '1',
  transactionType: '',
  geographicRegion: '',
  network: '',
};

export function ruleToFormValues(rule: AmountRoutingRule): AmountBandFormValues {
  return {
    currency: rule.currency,
    minAmount: String(rule.minAmount),
    maxAmount: String(rule.maxAmount),
    partnerId: rule.partnerId,
    apiPartnerId: rule.apiPartnerId || '',
    priority: String(rule.priority),
    transactionType: rule.transactionType || '',
    geographicRegion: rule.geographicRegion || '',
    network: rule.network?.toUpperCase() || '',
  };
}

export function partnerLabel(partner: {
  partnerCode: string;
  partnerName: string;
}): string {
  return `${partner.partnerCode} — ${partner.partnerName}`;
}
