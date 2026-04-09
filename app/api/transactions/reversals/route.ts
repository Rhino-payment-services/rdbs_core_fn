import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const userId = searchParams.get('userId')

    const response = await axios.get(`${API_URL}/transactions/reversals`, {
      params: {
        ...(limit ? { limit } : {}),
        ...(userId ? { userId } : {}),
      },
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data)
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

