import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const backendBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const channel = () => process.env.NEXT_PUBLIC_CHANNEL || 'BACKOFFICE'

function clientMeta(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ipAddress =
    forwarded?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const userAgent = req.headers.get('user-agent') || undefined
  return { ipAddress, userAgent }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body?.email
    const password = body?.password

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 },
      )
    }

    const { ipAddress, userAgent } = clientMeta(req)

    const response = await axios.post(
      `${backendBase()}/auth/login`,
      {
        email,
        password,
        channel: channel(),
        ipAddress,
        userAgent,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(ipAddress ? { 'x-forwarded-for': ipAddress } : {}),
          ...(userAgent ? { 'user-agent': userAgent } : {}),
        },
        validateStatus: () => true,
      },
    )

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: any) {
    console.error('staff-login proxy error:', error?.message)
    return NextResponse.json(
      { message: 'Login service unavailable. Please try again.' },
      { status: 502 },
    )
  }
}
