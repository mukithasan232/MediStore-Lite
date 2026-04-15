import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { recordPayment, activatePaidSubscription } from '@/actions/subscription';

/**
 * SSLCommerz Callback Handler
 * GET /api/payment/callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Extract transaction ID from session or stored data
    const tran_id = searchParams.get('tran_id') || '';

    if (!status || !['success', 'fail', 'cancel'].includes(status)) {
      return NextResponse.redirect(new URL('/billing?payment=cancelled', process.env.NEXT_PUBLIC_APP_URL!));
    }

    if (status === 'success') {
      // Verify with SSLCommerz IPN endpoint
      return NextResponse.redirect(new URL('/billing?payment=success', process.env.NEXT_PUBLIC_APP_URL!));
    }

    if (status === 'fail') {
      return NextResponse.redirect(new URL('/billing?payment=failed', process.env.NEXT_PUBLIC_APP_URL!));
    }

    return NextResponse.redirect(new URL('/billing?payment=cancelled', process.env.NEXT_PUBLIC_APP_URL!));
  } catch (error: any) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(new URL('/billing?payment=error', process.env.NEXT_PUBLIC_APP_URL!));
  }
}

/**
 * SSLCommerz POST Callback Handler
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tran_id = formData.get('tran_id') as string;
    const status = formData.get('status') as string;
    const invoiceId = formData.get('invoice_id') as string;
    const subscriptionId = formData.get('subscription_id') as string;

    if (!tran_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await db.payment.findUnique({
      where: { referenceId: tran_id },
      include: { invoice: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment status
    if (status === '0' || status === 'VERIFIED') {
      // Payment successful
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paymentGatewayResponse: JSON.stringify(Object.fromEntries(formData)),
        },
      });

      // Update invoice as paid
      if (payment.invoiceId) {
        await db.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
        });
      }

      // Activate subscription if in trial
      const subscription = await db.subscription.findUnique({
        where: { id: payment.subscriptionId },
      });

      if (subscription && subscription.status === 'TRIAL') {
        await activatePaidSubscription(payment.subscriptionId);
      }

      return NextResponse.json({ success: true, message: 'Payment verified' });
    } else {
      // Payment failed
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          paymentGatewayResponse: JSON.stringify(Object.fromEntries(formData)),
        },
      });

      return NextResponse.json({ success: false, message: 'Payment failed' });
    }
  } catch (error: any) {
    console.error('IPN callback error:', error);
    return NextResponse.json(
      { error: error.message || 'IPN processing failed' },
      { status: 500 }
    );
  }
}
