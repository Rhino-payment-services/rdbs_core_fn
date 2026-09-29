import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function normalizeItems(payload: any): any[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.reversals)) return payload.reversals
  return []
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const status = searchParams.get('status')

    const response = await axios.get(`${API_URL}/transactions/reversals`, {
      params: {
        ...(limit ? { limit } : {}),
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const items = normalizeItems(response.data)
    const total = Number(response.data?.total ?? items.length)

    return NextResponse.json({
      success: true,
      data: items,
      total,
      meta: { total },
    })
  } catch (error: any) {
    console.error('Reversals API Error:', error.response?.data || error.message)
    return NextResponse.json(
      {
        error: error.response?.data?.message || 'Failed to load reversals',
        details: error.response?.data,
      },
      { status: error.response?.status || 500 },
    )
  }
}
