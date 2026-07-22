import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const backendBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

    const response = await axios.post(
      `${backendBase()}/auth/login/resend-otp`,
      { challengeToken },
      {
        headers: { 'Content-Type': 'application/json' },
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
