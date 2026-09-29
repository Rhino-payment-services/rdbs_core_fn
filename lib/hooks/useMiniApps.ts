'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { getMiniAppApiError } from '@/lib/mini-apps-upload';

export type MiniAppStatus = 'ACTIVE' | 'INACTIVE';
export type MiniAppAuthType =
  | 'RUKAPAY_SESSION'
  | 'RUKASENTE_SESSION'
  | 'REDIRECT_ONLY'
  | 'BASIC_USER_INFO';

export interface MiniAppPermission {
  id: string;
  code: string;
  label: string;
  description?: string | null;
  isActive: boolean;
}

export interface MiniAppRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  category: string;
  redirectUrl: string;
  status: MiniAppStatus;
  isFeatured: boolean;
  sortOrder: number;
  authenticationType: MiniAppAuthType;
  permissions: string[];
  allowedUserData: string[];
  config?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MiniAppCatalogPreview {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  category: string;
  isFeatured: boolean;
  sortOrder: number;
  authenticationType: MiniAppAuthType;
  redirectUrl: string;
}

export interface MiniAppWriteDto {
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  category: string;
  redirectUrl: string;
  status?: MiniAppStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  authenticationType: MiniAppAuthType;
  permissions?: string[];
  allowedUserData?: string[];
  config?: Record<string, unknown>;
}

export interface MiniAppFilters {
  status?: MiniAppStatus;
  category?: string;
  featured?: boolean;
  search?: string;
}

export function useMiniAppPermissions() {
  return useQuery({
    queryKey: ['mini-app-permissions'],
    queryFn: async () => {
      const { data } = await axios.get<MiniAppPermission[]>(
        '/admin/mini-apps/permissions',
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMiniApps(filters?: MiniAppFilters) {
  return useQuery({
    queryKey: ['mini-apps', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.featured !== undefined) {
        params.append('featured', String(filters.featured));
      }
      if (filters?.search) params.append('search', filters.search);
      const { data } = await axios.get<MiniAppRecord[]>(
        `/admin/mini-apps${params.toString() ? `?${params.toString()}` : ''}`,
      );
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useMiniAppPreview(id: string | null) {
  return useQuery({
    queryKey: ['mini-app-preview', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await axios.get<MiniAppCatalogPreview>(
        `/admin/mini-apps/${id}/preview`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMiniApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: MiniAppWriteDto) => {
      const { data } = await axios.post<MiniAppRecord>('/admin/mini-apps', dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mini-apps'] });
      toast.success(`Mini App "${data.name}" created`);
    },
    onError: (error: unknown) => {
      toast.error(getMiniAppApiError(error, 'Failed to create Mini App'));
    },
  });
}

export function useUpdateMiniApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<MiniAppWriteDto> }) => {
      const { data } = await axios.patch<MiniAppRecord>(
        `/admin/mini-apps/${id}`,
        dto,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mini-apps'] });
      toast.success(`Mini App "${data.name}" updated`);
    },
    onError: (error: unknown) => {
      toast.error(getMiniAppApiError(error, 'Failed to update Mini App'));
    },
  });
}

export function useActivateMiniApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<MiniAppRecord>(
        `/admin/mini-apps/${id}/activate`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mini-apps'] });
      toast.success(`Mini App "${data.name}" activated`);
    },
    onError: (error: unknown) => {
      toast.error(getMiniAppApiError(error, 'Failed to activate Mini App'));
    },
  });
}

export function useDeactivateMiniApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<MiniAppRecord>(
        `/admin/mini-apps/${id}/deactivate`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mini-apps'] });
      toast.success(`Mini App "${data.name}" deactivated`);
    },
    onError: (error: unknown) => {
      toast.error(getMiniAppApiError(error, 'Failed to deactivate Mini App'));
    },
  });
}
