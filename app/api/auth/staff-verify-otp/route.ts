import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const backendBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const channel = () => process.env.NEXT_PUBLIC_CHANNEL || 'BACKOFFICE'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { challengeToken, otp } = body || {}

    if (!challengeToken || !otp) {
      return NextResponse.json(
        { message: 'Challenge token and OTP are required' },
        { status: 400 },
      )
    }

    const response = await axios.post(
      `${backendBase()}/auth/login/verify-otp`,
      { challengeToken, otp, channel: channel() },
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      },
    )

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: any) {
    console.error('staff-verify-otp proxy error:', error?.message)
    return NextResponse.json(
      { message: 'OTP verification service unavailable. Please try again.' },
      { status: 502 },
    )
  }
}
