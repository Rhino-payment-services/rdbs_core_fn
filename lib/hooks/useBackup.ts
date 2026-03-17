import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface BackupResponse {
  success: boolean
  filePath?: string
  fileName?: string
  size?: number
  error?: string
  duration?: number
}

export interface DatabaseBackupResponse {
  mongodb?: BackupResponse
  postgres?: BackupResponse
}

export interface BackupStats {
  totalFiles: number
  totalSize: number
  mongodbFiles: number
  postgresFiles: number
  archiveFiles: number
  oldestBackup?: string | null
  newestBackup?: string | null
}

export interface CleanupResponse {
  deleted: number
  freedSpace: number
  deletedFiles: string[]
}

const apiFetch = async (endpoint: string, options: any = {}) => {
  const response = await api({
    url: endpoint,
    method: options.method || 'GET',
    data: options.data,
    ...options,
  })

  return response.data
}

export const backupQueryKeys = {
  stats: ['backup', 'stats'] as const,
}

export const useBackupStats = () => {
  return useQuery<BackupStats>({
    queryKey: backupQueryKeys.stats,
    queryFn: () => apiFetch('/api/v1/admin/backup/stats'),
    staleTime: 60_000,
  })
}

export const useBackupMongo = () => {
  const queryClient = useQueryClient()
  return useMutation<BackupResponse>({
    mutationFn: () => apiFetch('/api/v1/admin/backup/mongodb', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.stats })
    },
  })
}

export const useBackupPostgres = () => {
  const queryClient = useQueryClient()
  return useMutation<BackupResponse>({
    mutationFn: () => apiFetch('/api/v1/admin/backup/postgres', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.stats })
    },
  })
}

export const useBackupBoth = () => {
  const queryClient = useQueryClient()
  return useMutation<DatabaseBackupResponse>({
    mutationFn: () => apiFetch('/api/v1/admin/backup/both', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.stats })
    },
  })
}

export const useBackupCleanup = () => {
  const queryClient = useQueryClient()
  return useMutation<CleanupResponse, unknown, { olderThanDays?: number; keepCount?: number; type?: 'mongodb' | 'postgres' | 'both'; deleteArchives?: boolean }>({
    mutationFn: (payload) =>
      apiFetch('/api/v1/admin/backup/cleanup', {
        method: 'POST',
        data: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.stats })
    },
  })
}

