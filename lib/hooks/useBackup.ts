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
export type BackupJobStatus = 'pending' | 'running' | 'done' | 'failed'

export interface BackupJob {
  id: string
  target: BackupDownloadTarget
  status: BackupJobStatus
  /** 0–100 */
  progress: number
  step: string
  fileName?: string
  fileSize?: number
  error?: string
  startedAt: string
  finishedAt?: string
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
  job: (id: string) => ['backup', 'job', id] as const,
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

// ─── Job-based download with reactive progress polling ─────────────────────

const POLL_INTERVAL_MS = 1500

/**
 * Start a backup job — returns the initial BackupJob (with status "pending").
 * The component then polls via useBackupJobStatus for live progress.
 */
export const useStartBackupJob = () => {
  return useMutation<BackupJob, Error, BackupDownloadTarget>({
    mutationFn: (target) =>
      apiFetch('/api/v1/admin/backup/job/start', {
        method: 'POST',
        data: { target },
      }),
  })
}

/**
 * Reactively poll a running backup job's status.
 * Stops polling automatically once status is "done" or "failed".
 */
export const useBackupJobStatus = (jobId: string | null) => {
  return useQuery<BackupJob>({
    queryKey: backupQueryKeys.job(jobId ?? ''),
    queryFn: () => apiFetch(`/api/v1/admin/backup/job/${jobId}/status`),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return !status || status === 'pending' || status === 'running' ? POLL_INTERVAL_MS : false
    },
    staleTime: 0,
  })
}

/** Trigger a browser download for a completed job's file. */
export const downloadJobFile = async (job: BackupJob): Promise<void> => {
  const downloadResponse = await api({
    url: `/api/v1/admin/backup/job/${job.id}/download`,
    method: 'GET',
    responseType: 'blob',
    timeout: 5 * 60 * 1000,
  })

  const contentType = downloadResponse.headers?.['content-type'] || 'application/octet-stream'
  const disposition: string = downloadResponse.headers?.['content-disposition'] || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i)
  const filename =
    filenameMatch?.[1] ||
    (job.target === 'both'
      ? 'backup-both.zip'
      : job.target === 'postgres'
        ? 'backup-postgres.dump'
        : 'backup-mongodb.tar.gz')

  const blob = new Blob([downloadResponse.data], { type: contentType })
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

// Keep backwards-compatible export used by BackupSettings
export const useBackupDownload = useStartBackupJob
