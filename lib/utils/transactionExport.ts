import api from '@/lib/axios'

function parseContentDispositionFilename(header?: string): string | null {
  if (!header) return null
  const match = /filename="([^"]+)"/i.exec(header)
  return match?.[1] ?? null
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function parseBlobError(error: unknown): Promise<Error> {
  const ax = error as {
    response?: { data?: Blob | { message?: string }; status?: number }
    message?: string
  }
  if (ax?.response?.data instanceof Blob) {
    try {
      const text = await ax.response.data.text()
      const body = JSON.parse(text) as {
        message?: string
        error?: string | { message?: string }
      }
      const msg =
        body.message ||
        (typeof body.error === 'string' ? body.error : body.error?.message)
      if (msg) return new Error(msg)
    } catch {
      // fall through
    }
  }
  if (ax?.response?.data && typeof ax.response.data === 'object') {
    const body = ax.response.data as { message?: string }
    if (body.message) return new Error(body.message)
  }
  if (error instanceof Error) return error
  return new Error('Transaction export failed')
}

export type TransactionExportFilters = {
  startDate?: string
  endDate?: string
  status?: string
  type?: string
  direction?: string
  currency?: string
  userId?: string
}

/**
 * Download admin transactions CSV from GET /transactions/export
 * (server-chunked stream — same blob pattern as RukaSente loan exports).
 */
export async function downloadTransactionsExport(
  params: TransactionExportFilters,
): Promise<void> {
  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    const v = String(value ?? '').trim()
    if (v) cleaned[key] = v
  }

  try {
    const res = await api.get('/transactions/export', {
      params: cleaned,
      responseType: 'blob',
      timeout: 600_000, // 10 minutes for large ranges
    })
    const blob = res.data as Blob
    // Nest may return JSON error with 4xx still as blob
    if (blob.type && blob.type.includes('application/json')) {
      const text = await blob.text()
      try {
        const body = JSON.parse(text) as { message?: string }
        throw new Error(body.message || 'Transaction export failed')
      } catch (e) {
        if (e instanceof Error && e.message !== 'Transaction export failed') {
          throw e
        }
        throw new Error(text || 'Transaction export failed')
      }
    }

    const fallback = `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`
    const filename =
      parseContentDispositionFilename(
        res.headers['content-disposition'] as string | undefined,
      ) ?? fallback
    triggerBlobDownload(blob, filename)
  } catch (error) {
    throw await parseBlobError(error)
  }
}
