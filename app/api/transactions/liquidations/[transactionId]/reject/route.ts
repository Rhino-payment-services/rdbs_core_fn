import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    const { transactionId } = await context.params
    const body = await request.json().catch(() => ({}))

    const response = await axios.post(
      `${API_URL}/transactions/liquidation/${transactionId}/reject`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number }; message?: string }
    console.error('Reject Liquidation API Error:', err.response?.data || err.message)
    const data = err.response?.data as { message?: string } | undefined
    return NextResponse.json(
      {
        error: data?.message || 'Failed to reject liquidation',
        details: err.response?.data,
      },
      { status: err.response?.status || 500 },
    )
  }
}
