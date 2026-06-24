import axios from 'axios'

const PAGE_SIZE = 100

export function partnerReversalRequestsUrl(apiUrl: string): string {
  const trimmed = apiUrl.replace(/\/$/, '')
  if (trimmed.endsWith('/api/v1')) {
    return `${trimmed}/admin/gateway-partners/reversal-requests`
  }
  return `${trimmed}/api/v1/admin/gateway-partners/reversal-requests`
}

export function mapUiStatusToPartnerStatus(status?: string | null): string | undefined {
  if (!status || status === 'ALL') return undefined
  if (status === 'COMPLETED') return 'APPROVED'
  return status
}

export async function fetchPartnerReversalRequests(
  apiUrl: string,
  accessToken: string,
  options?: { status?: string; limit?: number },
): Promise<{ items: any[]; total: number }> {
  const url = partnerReversalRequestsUrl(apiUrl)
  const partnerStatus = mapUiStatusToPartnerStatus(options?.status)
  const requestedLimit = Math.min(Math.max(options?.limit ?? 50, 1), 500)

  const allItems: any[] = []
  let page = 1
  let total = 0

  while (allItems.length < requestedLimit) {
    const response = await axios.get(url, {
      params: {
        page,
        limit: PAGE_SIZE,
        ...(partnerStatus ? { status: partnerStatus } : {}),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const batch = Array.isArray(response.data?.data) ? response.data.data : []
    total = Number(response.data?.meta?.total ?? batch.length)

    allItems.push(...batch)

    if (batch.length === 0 || allItems.length >= total) {
      break
    }
    page += 1
  }

  return {
    items: allItems.slice(0, requestedLimit),
    total,
  }
}
