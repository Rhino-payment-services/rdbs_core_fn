"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle2, Database, DownloadCloud, HardDrive, RefreshCw, Trash2, XCircle } from 'lucide-react'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import {
  useBackupStats,
  useBackupMongo,
  useBackupPostgres,
  useBackupBoth,
  useBackupCleanup,
  useStartBackupJob,
  useBackupJobStatus,
  downloadJobFile,
  BackupDownloadTarget,
} from '@/lib/hooks/useApi'
import toast from 'react-hot-toast'

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(1)} ${sizes[i]}`
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const BackupSettings: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useBackupStats()
  const backupMongo = useBackupMongo()
  const backupPostgres = useBackupPostgres()
  const backupBoth = useBackupBoth()
  const cleanup = useBackupCleanup()
  const startJob = useStartBackupJob()

  const [cleanupDays, setCleanupDays] = useState<string>('30')
  const [cleanupKeepCount, setCleanupKeepCount] = useState<string>('10')
  const [cleanupType, setCleanupType] = useState<'mongodb' | 'postgres' | 'both'>('both')

  // Active download job ID drives the progress panel
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [downloadTriggered, setDownloadTriggered] = useState(false)

  const { data: jobStatus } = useBackupJobStatus(activeJobId)

  // When job finishes, trigger browser download once
  useEffect(() => {
    if (!jobStatus || downloadTriggered) return
    if (jobStatus.status === 'done') {
      setDownloadTriggered(true)
      downloadJobFile(jobStatus)
        .then(() => {
          toast.success(
            jobStatus.target === 'both'
              ? 'Full backup created and downloaded'
              : `${jobStatus.target.toUpperCase()} backup created and downloaded`,
          )
          refetchStats()
        })
        .catch((err: any) => {
          toast.error(err?.message || 'Download failed')
        })
    } else if (jobStatus.status === 'failed') {
      toast.error(jobStatus.error || 'Backup job failed')
    }
  }, [jobStatus, downloadTriggered, refetchStats])

  const totalSizeFormatted = useMemo(() => formatBytes(stats?.totalSize), [stats?.totalSize])

  const handleRunBackup = async (target: 'mongodb' | 'postgres' | 'both') => {
    try {
      switch (target) {
        case 'mongodb': {
          const result = await backupMongo.mutateAsync()
          if (result.success) {
            toast.success(`MongoDB backup created (${formatBytes(result.size)})`)
          } else {
            toast.error(result.error || 'MongoDB backup failed')
          }
          break
        }
        case 'postgres': {
          const result = await backupPostgres.mutateAsync()
          if (result.success) {
            toast.success(`PostgreSQL backup created (${formatBytes(result.size)})`)
          } else {
            toast.error(result.error || 'PostgreSQL backup failed')
          }
          break
        }
        case 'both': {
          const result = await backupBoth.mutateAsync()
          const mongoOk = result.mongodb?.success
          const pgOk = result.postgres?.success
          if (mongoOk && pgOk) {
            toast.success('MongoDB + PostgreSQL backups created.')
          } else {
            toast.error('One or more database backups failed – check server logs')
          }
          break
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Backup failed')
    }
  }

  const handleDownloadBackup = async (target: BackupDownloadTarget) => {
    // Reset any previous job state
    setActiveJobId(null)
    setDownloadTriggered(false)

    try {
      const job = await startJob.mutateAsync(target)
      setActiveJobId(job.id)
    } catch (error: any) {
      toast.error(error?.message || 'Could not start backup job')
    }
  }

  const handleCleanup = async () => {
    const olderThanDays = cleanupDays.trim() ? parseInt(cleanupDays, 10) : undefined
    const keepCount = cleanupKeepCount.trim() ? parseInt(cleanupKeepCount, 10) : undefined

    if ((!olderThanDays || Number.isNaN(olderThanDays)) && (!keepCount || Number.isNaN(keepCount))) {
      toast.error('Specify at least days or keep count')
      return
    }

    const confirmed = window.confirm(
      'This will permanently delete old backup files. Are you sure you want to continue?',
    )
    if (!confirmed) return

    try {
      const result = await cleanup.mutateAsync({
        olderThanDays: olderThanDays && !Number.isNaN(olderThanDays) ? olderThanDays : undefined,
        keepCount: keepCount && !Number.isNaN(keepCount) ? keepCount : undefined,
        type: cleanupType,
        deleteArchives: true,
      })
      toast.success(
        `Deleted ${result.deleted} file(s) and freed ${formatBytes(result.freedSpace)} of space`,
      )
    } catch (error: any) {
      toast.error(error?.message || 'Backup cleanup failed')
    }
  }

  const isDownloadRunning =
    startJob.isPending ||
    (jobStatus?.status === 'pending' || jobStatus?.status === 'running')

  const anyBackupLoading =
    backupMongo.isPending ||
    backupPostgres.isPending ||
    backupBoth.isPending ||
    cleanup.isPending ||
    isDownloadRunning

  return (
    <PermissionGuard permission={PERMISSIONS.BACKUP_VIEW}>
      <div className="space-y-6">

        {/* ── Download progress panel ── */}
        {jobStatus && (
          <Card
            className={
              jobStatus.status === 'failed'
                ? 'border-red-200 bg-red-50/60'
                : jobStatus.status === 'done'
                  ? 'border-green-200 bg-green-50/60'
                  : 'border-blue-200 bg-blue-50/60'
            }
          >
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  {jobStatus.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : jobStatus.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  <span
                    className={
                      jobStatus.status === 'failed'
                        ? 'text-red-800'
                        : jobStatus.status === 'done'
                          ? 'text-green-800'
                          : 'text-blue-800'
                    }
                  >
                    {jobStatus.status === 'failed'
                      ? 'Backup failed'
                      : jobStatus.status === 'done'
                        ? 'Backup complete — file downloaded'
                        : `Creating ${jobStatus.target === 'both' ? 'full' : jobStatus.target.toUpperCase()} backup…`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{jobStatus.step}</span>
                  {(jobStatus.status === 'done' || jobStatus.status === 'failed') && (
                    <button
                      onClick={() => setActiveJobId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {jobStatus.status !== 'failed' && (
                <div className="space-y-1">
                  <Progress value={jobStatus.progress} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">{jobStatus.progress}%</p>
                </div>
              )}

              {jobStatus.status === 'failed' && jobStatus.error && (
                <p className="text-xs text-red-700 mt-1">{jobStatus.error}</p>
              )}
              {jobStatus.status === 'done' && jobStatus.fileSize && (
                <p className="text-xs text-green-700">{formatBytes(jobStatus.fileSize)} downloaded</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-blue-100 bg-blue-50/60">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="mt-1 rounded-full bg-blue-100 p-2">
              <Database className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-base">Database Backups</CardTitle>
              <CardDescription className="mt-1 text-xs text-blue-900">
                Run on-demand backups for MongoDB and PostgreSQL. Use this page during deployments or
                before running risky migrations.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PermissionGuard permission={PERMISSIONS.BACKUP_CREATE}>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4" />
                Run backup
              </CardTitle>
              <CardDescription>
                Choose whether to create backups only, or create and download in one step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">MongoDB only</p>
                  <Button
                    onClick={() => handleRunBackup('mongodb')}
                    disabled={anyBackupLoading}
                    className="w-full justify-center"
                  >
                    {backupMongo.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Create backup only
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleDownloadBackup('mongodb')}
                    disabled={anyBackupLoading}
                    className="w-full justify-center text-xs"
                  >
                    <DownloadCloud className="h-4 w-4 mr-1" />
                    Create + download
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">PostgreSQL only</p>
                  <Button
                    onClick={() => handleRunBackup('postgres')}
                    disabled={anyBackupLoading}
                    className="w-full justify-center"
                  >
                    {backupPostgres.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Create backup only
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleDownloadBackup('postgres')}
                    disabled={anyBackupLoading}
                    className="w-full justify-center text-xs"
                  >
                    <DownloadCloud className="h-4 w-4 mr-1" />
                    Create + download
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Full backup (recommended)</p>
                  <Button
                    onClick={() => handleRunBackup('both')}
                    disabled={anyBackupLoading}
                    className="w-full justify-center"
                  >
                    {backupBoth.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Create backups only
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleDownloadBackup('both')}
                    disabled={anyBackupLoading}
                    className="w-full justify-center text-xs"
                  >
                    {isDownloadRunning && jobStatus?.target === 'both' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        {jobStatus.progress}%…
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="h-4 w-4 mr-1" />
                        Create + download archive
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                "Create + download" triggers backup generation first, then downloads the generated file. A live progress bar will appear above.
              </p>
            </CardContent>
          </Card>
          </PermissionGuard>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-4 w-4" />
                Backup stats
              </CardTitle>
              <CardDescription>High‑level view of backup storage usage.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading stats...
                </div>
              ) : stats ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Total files</dt>
                    <dd className="font-medium">{stats.totalFiles}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Total size</dt>
                    <dd className="font-medium">{totalSizeFormatted}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">MongoDB files</dt>
                    <dd className="font-medium">{stats.mongodbFiles}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Postgres files</dt>
                    <dd className="font-medium">{stats.postgresFiles}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Archives (zip / tar.gz)</dt>
                    <dd className="font-medium">{stats.archiveFiles}</dd>
                  </div>
                  <div className="mt-3 border-t pt-3 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Oldest backup</span>
                      <span className="font-medium">{formatDateTime(stats.oldestBackup as any)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Newest backup</span>
                      <span className="font-medium">{formatDateTime(stats.newestBackup as any)}</span>
                    </div>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No backup stats available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <PermissionGuard permission={PERMISSIONS.BACKUP_CREATE}>
        <Card className="border-red-100 bg-red-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-800">
              <Trash2 className="h-4 w-4" />
              Cleanup old backups
            </CardTitle>
            <CardDescription className="text-xs text-red-900">
              Use cautiously. These operations permanently delete backup files from disk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cleanupType">Backup type</Label>
                <Select
                  value={cleanupType}
                  onValueChange={(value: 'mongodb' | 'postgres' | 'both') => setCleanupType(value)}
                >
                  <SelectTrigger id="cleanupType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">MongoDB + Postgres</SelectItem>
                    <SelectItem value="mongodb">MongoDB only</SelectItem>
                    <SelectItem value="postgres">Postgres only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanupDays">Delete older than (days)</Label>
                <Input
                  id="cleanupDays"
                  type="number"
                  min={0}
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(e.target.value)}
                  placeholder="e.g. 30"
                />
                <p className="text-[11px] text-gray-500">
                  Leave blank to skip age‑based cleanup.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cleanupKeepCount">Keep latest N backups</Label>
                <Input
                  id="cleanupKeepCount"
                  type="number"
                  min={0}
                  value={cleanupKeepCount}
                  onChange={(e) => setCleanupKeepCount(e.target.value)}
                  placeholder="e.g. 10"
                />
                <p className="text-[11px] text-gray-500">
                  Leave blank to skip count‑based cleanup.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-red-800">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <p>
                These actions cannot be undone. Always ensure you have recent off‑site backups before
                deleting older files.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleCleanup}
                disabled={cleanup.isPending}
                className="flex items-center gap-2"
              >
                {cleanup.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Cleaning up...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Run cleanup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        </PermissionGuard>
      </div>
    </PermissionGuard>
  )
}
