import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type MobilePlatform = 'IOS' | 'ANDROID';

export interface MobileAppRelease {
  id: string;
  platform: MobilePlatform;
  latestVersion: string;
  storeUrl: string;
  updateMessage?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface UpdateMobileAppReleaseDto {
  latestVersion?: string;
  storeUrl?: string;
  updateMessage?: string;
  isActive?: boolean;
}

const QUERY_KEY = ['admin', 'mobile-app-releases'];

export function useMobileAppReleases() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<MobileAppRelease[]>(
        '/admin/mobile-app-releases',
      );
      return data;
    },
  });
}

export function useUpdateMobileAppRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      platform,
      dto,
    }: {
      platform: MobilePlatform;
      dto: UpdateMobileAppReleaseDto;
    }) => {
      const { data } = await api.patch<MobileAppRelease>(
        `/admin/mobile-app-releases/${platform}`,
        dto,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
