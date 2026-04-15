import { NextRequest, NextResponse } from 'next/server';
import { submitBKashPayment } from '@/actions/bkash';
import { supabase } from '@/lib/supabase';

/**
 * Submit bKash Payment
 * POST /api/payment/bkash
 */
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { invoiceId, subscriptionId, bkashTransactionId, bkashPhoneNumber } = await request.json();

    // Validate input
    if (!invoiceId || !subscriptionId || !bkashTransactionId || !bkashPhoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number format (bKash numbers are typically 11 digits or +880...)
    const phoneRegex = /^(?:\+880|0)?\d{10,11}$/;
    if (!phoneRegex.test(bkashPhoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate transaction ID length (bKash IDs are typically 10-12 digits)
    if (bkashTransactionId.length < 8 || bkashTransactionId.length > 15) {
      return NextResponse.json(
        { error: 'Invalid bKash transaction ID format' },
        { status: 400 }
      );
    }

    const result = await submitBKashPayment(
      invoiceId,
      subscriptionId,
      bkashTransactionId.trim(),
      bkashPhoneNumber.trim()
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      message: result.message,
    });
  } catch (error: any) {
    console.error('bKash payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit bKash payment' },
      { status: 500 }
    );
  }
}
