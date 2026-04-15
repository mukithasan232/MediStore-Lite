import { NextRequest, NextResponse } from 'next/server';
import { verifyBKashPayment, getPendingBKashPayments } from '@/actions/bkash';
import { supabase } from '@/lib/supabase';

/**
 * Get Pending bKash Payments
 * GET /api/admin/bkash/pending
 * Returns all pending bKash payments for admin verification
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add role check for admin
    // For now, only allow query from authenticated users

    const result = await getPendingBKashPayments();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payments: result.payments,
      totalPending: result.payments.length,
    });
  } catch (error: any) {
    console.error('Get pending payments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}

/**
 * Verify and Confirm bKash Payment
 * POST /api/admin/bkash/verify
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

    const { paymentId, action, reason } = await request.json();

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "verify" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'verify') {
      const result = await verifyBKashPayment(paymentId, user.id);
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
    } else {
      // Reject payment
      if (!reason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const { rejectBKashPayment } = await import('@/actions/bkash');
      const result = await rejectBKashPayment(paymentId, reason);
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
    }
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
