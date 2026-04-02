import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized — no session found' }, { status: 401 });
    }

    if ((session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only SUPER_ADMIN can override transaction status' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { transactionId, reason } = body;

    if (!transactionId || !reason?.trim()) {
      return NextResponse.json(
        { error: 'transactionId and reason are required' },
        { status: 400 },
      );
    }

    const response = await axios.patch(
      `${API_URL}/transactions/${transactionId}/status-override`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Status override API error:', error.response?.data || error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to override transaction status';

    return NextResponse.json({ error: message }, { status });
  }
}
