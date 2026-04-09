import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reversalId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    const { reversalId } = await context.params
    const body = await request.json().catch(() => ({}))

    const response = await axios.post(
      `${API_URL}/transactions/reversals/${reversalId}/approve`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Approve Reversal API Error:', error.response?.data || error.message)
    return NextResponse.json(
      {
        error: error.response?.data?.message || 'Failed to approve reversal',
        details: error.response?.data,
      },
      { status: error.response?.status || 500 },
    )
  }
}

