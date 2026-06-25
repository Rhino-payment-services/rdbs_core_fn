import type { AmountRoutingRule } from '@/lib/hooks/useAmountRoutingRules';

export interface AmountBandFormValues {
  currency: string;
  minAmount: string;
  maxAmount: string;
  partnerId: string;
  priority: string;
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
  draft: { min: number; max: number; currency: string },
  excludeId?: string,
): AmountRoutingRule[] {
  const currency = draft.currency.toUpperCase();
  return rules.filter((rule) => {
    if (!rule.isActive) return false;
    if (excludeId && rule.id === excludeId) return false;
    if (rule.currency.toUpperCase() !== currency) return false;
    return bandsOverlap(
      { min: draft.min, max: draft.max },
      { min: rule.minAmount, max: rule.maxAmount },
    );
  });
}

export function validateAmountBandForm(values: AmountBandFormValues): string | null {
  const currency = values.currency.trim();
  if (!currency) return 'Currency is required';

  if (values.minAmount.trim() === '') return 'Minimum amount is required';
  if (values.maxAmount.trim() === '') return 'Maximum amount is required';
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

  return null;
}

export function buildCreatePayload(values: AmountBandFormValues) {
  return {
    currency: values.currency.trim().toUpperCase(),
    minAmount: Number(values.minAmount),
    maxAmount: Number(values.maxAmount),
    partnerId: values.partnerId,
    priority: values.priority.trim() === '' ? 1 : Number(values.priority),
  };
}

export function buildUpdatePayload(
  values: AmountBandFormValues,
  original: AmountRoutingRule,
) {
  const payload: Record<string, string | number> = {};
  const currency = values.currency.trim().toUpperCase();
  const minAmount = Number(values.minAmount);
  const maxAmount = Number(values.maxAmount);
  const priority = values.priority.trim() === '' ? 1 : Number(values.priority);

  if (currency !== original.currency.toUpperCase()) payload.currency = currency;
  if (minAmount !== original.minAmount) payload.minAmount = minAmount;
  if (maxAmount !== original.maxAmount) payload.maxAmount = maxAmount;
  if (values.partnerId !== original.partnerId) payload.partnerId = values.partnerId;
  if (priority !== original.priority) payload.priority = priority;

  return payload;
}

export const DEFAULT_AMOUNT_BAND_FORM: AmountBandFormValues = {
  currency: 'UGX',
  minAmount: '',
  maxAmount: '',
  partnerId: '',
  priority: '1',
};

export function ruleToFormValues(rule: AmountRoutingRule): AmountBandFormValues {
  return {
    currency: rule.currency,
    minAmount: String(rule.minAmount),
    maxAmount: String(rule.maxAmount),
    partnerId: rule.partnerId,
    priority: String(rule.priority),
  };
}

export function partnerLabel(partner: {
  partnerCode: string;
  partnerName: string;
}): string {
  return `${partner.partnerCode} — ${partner.partnerName}`;
}
