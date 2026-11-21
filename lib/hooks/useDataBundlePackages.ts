'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';

export type DataBundleNetwork = 'MTN' | 'AIRTEL' | 'LYCA';
export type DataBundleUnit = 'MB' | 'GB';
export type DataBundleValidity = 'Day' | 'Week' | 'Month';

export interface DataBundlePackage {
  id: string;
  bundleCode: string;
  country: string;
  network: DataBundleNetwork;
  displayName: string;
  productName: string;
  quantity: string | number;
  unit: DataBundleUnit;
  validity: DataBundleValidity;
  providerCost: string | number;
  sellingPrice: string | number;
  currency: string;
  isActive: boolean;
  isPromoBundle: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataBundlePackageInput {
  bundleCode: string;
  country: string;
  network: DataBundleNetwork;
  displayName: string;
  productName?: string;
  quantity: number;
  unit: DataBundleUnit;
  validity: DataBundleValidity;
  providerCost: number;
  sellingPrice: number;
  isActive?: boolean;
  isPromoBundle?: boolean;
}

export type DataBundlePackageUpdate = Partial<Omit<DataBundlePackageInput, 'bundleCode' | 'country'>>;

const KEY = ['admin-data-bundle-packages'];

function apiError(error: unknown, fallback: string) {
  const axiosLike = error as { response?: { data?: { message?: string | string[] } } };
  const message = axiosLike.response?.data?.message;
  if (Array.isArray(message) && message[0]) return message[0];
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export function useDataBundlePackages(includeInactive = true) {
  return useQuery({
    queryKey: [...KEY, includeInactive],
    queryFn: async () => {
      const { data } = await axios.get<DataBundlePackage[]>(
        `/admin/data-bundle-packages?includeInactive=${includeInactive}`,
      );
      return data;
    },
  });
}

export function useCreateDataBundlePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DataBundlePackageInput) => {
      const { data } = await axios.post<DataBundlePackage>('/admin/data-bundle-packages', input);
      return data;
    },
    onSuccess: () => {
      toast.success('Bundle package created');
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (error) => toast.error(apiError(error, 'Failed to create bundle package')),
  });
}

export function useUpdateDataBundlePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DataBundlePackageUpdate }) => {
      const { data } = await axios.patch<DataBundlePackage>(
        `/admin/data-bundle-packages/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Bundle package updated');
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (error) => toast.error(apiError(error, 'Failed to update bundle package')),
  });
}
