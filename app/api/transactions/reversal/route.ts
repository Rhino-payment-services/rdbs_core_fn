import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId, reason, details, ticketReference } = body;

    if (!transactionId || !reason || !details) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, reason, and details are required' },
        { status: 400 }
      );
    }

    // Call backend reversal API
    const response = await axios.post(
      `${API_URL}/transactions/reversals`,
      {
        transactionId,
        reason,
        details,
        ticketReference
      },
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Reversal API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'You do not have permission to reverse transactions' },
        { status: 403 }
      );
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Transaction not found or cannot be reversed' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: error.response?.data?.message || 'Failed to submit reversal request',
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}

