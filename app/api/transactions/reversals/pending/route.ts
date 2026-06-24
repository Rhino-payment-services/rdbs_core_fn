import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { fetchPartnerReversalRequests } from '@/lib/server/partner-reversal-api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')

    const { items, total } = await fetchPartnerReversalRequests(
      API_URL,
      session.accessToken,
      {
        status: 'PENDING',
        limit: limit ? Number(limit) : undefined,
      },
    )

    return NextResponse.json({
      success: true,
      data: items,
      total,
      meta: { total },
    })
  } catch (error: any) {
    console.error('Pending Reversals API Error:', error.response?.data || error.message)
    return NextResponse.json(
      {
        error: error.response?.data?.message || 'Failed to load pending reversals',
        details: error.response?.data,
      },
      { status: error.response?.status || 500 },
    )
  }
}
