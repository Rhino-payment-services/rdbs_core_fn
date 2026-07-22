import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const backendBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    const challengeToken = body?.challengeToken

    if (!challengeToken) {
      return NextResponse.json(
        { message: 'Challenge token is required' },
        { status: 400 },
      )
    }

    const { ipAddress, userAgent } = clientMeta(req)

    const response = await axios.post(
      `${backendBase()}/auth/login/resend-otp`,
      { challengeToken, ipAddress, userAgent },
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
    console.error('staff-resend-otp proxy error:', error?.message)
    return NextResponse.json(
      { message: 'OTP resend service unavailable. Please try again.' },
      { status: 502 },
    )
  }
}
