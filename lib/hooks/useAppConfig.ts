'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';

export type AppConfigType =
  | 'ICON'
  | 'COLOR'
  | 'QUICK_ACTION'
  | 'BOTTOM_NAV'
  | 'HOME';
export type AppConfigStatus = 'ACTIVE' | 'INACTIVE';

export interface AppConfigRegistryItem {
  key: string;
  type: AppConfigType;
  category: string;
  label: string;
  description?: string;
  defaultValue: Record<string, unknown>;
  sortOrder: number;
}

export interface AppConfigEntry {
  id: string;
  key: string;
  type: AppConfigType;
  category: string;
  label: string;
  description?: string | null;
  value: Record<string, unknown>;
  status: AppConfigStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfigHistoryItem {
  id: string;
  entryId: string;
  key: string;
  previousValue?: Record<string, unknown> | null;
  newValue: Record<string, unknown>;
  changedBy: string;
  changedByEmail?: string | null;
  createdAt: string;
}

function apiError(error: unknown, fallback: string) {
  const axiosLike = error as { response?: { data?: { message?: string | string[] } } };
  const message = axiosLike.response?.data?.message;
  if (Array.isArray(message) && message[0]) return message[0];
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export function useAppConfigRegistry() {
  return useQuery({
    queryKey: ['app-config-registry'],
    queryFn: async () => {
      const { data } = await axios.get<AppConfigRegistryItem[]>(
        '/admin/app-config/registry',
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useAppConfigEntries(category?: string) {
  return useQuery({
    queryKey: ['app-config', category],
    queryFn: async () => {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      const { data } = await axios.get<AppConfigEntry[]>(
        `/admin/app-config${params}`,
      );
      return data;
    },
  });
}

export function useAppConfigHistory(key: string | null) {
  return useQuery({
    queryKey: ['app-config-history', key],
    queryFn: async () => {
      if (!key) return [];
      const { data } = await axios.get<AppConfigHistoryItem[]>(
        `/admin/app-config/history/${encodeURIComponent(key)}`,
      );
      return data;
    },
    enabled: !!key,
  });
}

export function useUpsertAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      key: string;
      value: Record<string, unknown>;
      status?: AppConfigStatus;
    }) => {
      const { data } = await axios.post<AppConfigEntry>('/admin/app-config', dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['app-config'] });
      queryClient.invalidateQueries({ queryKey: ['app-config-history', data.key] });
      toast.success(`Saved ${data.label}`);
    },
    onError: (error: unknown) => {
      toast.error(apiError(error, 'Failed to save configuration'));
    },
  });
}

export function useSetAppConfigStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      active,
    }: {
      id: string;
      active: boolean;
    }) => {
      const { data } = await axios.post<AppConfigEntry>(
        `/admin/app-config/${id}/${active ? 'activate' : 'deactivate'}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-config'] });
    },
    onError: (error: unknown) => {
      toast.error(apiError(error, 'Failed to update status'));
    },
  });
}

export const ICON_NAMES = [
  'add_circle_outline',
  'account_balance_outlined',
  'send_outlined',
  'swap_horiz_rounded',
  'phone_android_outlined',
  'account_balance_wallet_outlined',
  'storefront_outlined',
  'receipt_long_outlined',
  'wallet_outlined',
  'apps_rounded',
  'payments_outlined',
  'more_horiz_rounded',
  'home_outlined',
  'contactless_outlined',
  'public_outlined',
  'qr_code_scanner_outlined',
  'savings_rounded',
  'school_rounded',
  'shopping_cart_rounded',
] as const;
