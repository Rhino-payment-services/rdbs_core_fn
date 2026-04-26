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

export type BackupDownloadTarget = 'mongodb' | 'postgres' | 'both'

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

const resolveDownloadEndpoint = (target: BackupDownloadTarget) => {
  switch (target) {
    case 'mongodb':
      return '/api/v1/admin/backup/mongodb?download=true'
    case 'postgres':
      return '/api/v1/admin/backup/postgres?download=true'
    case 'both':
    default:
      return '/api/v1/admin/backup/both?download=true'
  }
}

const inferDownloadFileName = (contentDisposition?: string | null, fallback = 'backup') => {
  if (!contentDisposition) return fallback
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }
  const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return asciiMatch?.[1] || fallback
}

export const useBackupDownload = () => {
  return useMutation<void, unknown, BackupDownloadTarget>({
    mutationFn: async (target) => {
      const response = await api({
        url: resolveDownloadEndpoint(target),
        method: 'POST',
        responseType: 'blob',
        // Backup creation can take longer than regular API calls.
        // Override the global 10s timeout so the download request
        // can wait for the server to finish preparing the file.
        timeout: 10 * 60 * 1000,
      })

      const contentType = response.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        let message = 'Backup download failed'
        try {
          const text = await response.data.text()
          const parsed = JSON.parse(text)
          message = parsed?.message || parsed?.error || message
        } catch {
          // Ignore parsing errors and fall back to generic message.
        }
        throw new Error(message)
      }

      const fallbackName = target === 'both' ? 'backup-both.zip' : `backup-${target}`
      const filename = inferDownloadFileName(response.headers?.['content-disposition'], fallbackName)
      const blob = new Blob([response.data], {
        type: contentType || 'application/octet-stream',
      })

      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
    },
  })
}

