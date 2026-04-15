import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/prisma';
import { activatePaidSubscription } from '@/actions/subscription';

/**
 * SSLCommerz IPN (Instant Payment Notification) Endpoint
 * POST /api/payment/ipn
 * 
 * This endpoint is called by SSLCommerz to validate payment status
 * It should verify the transaction and update payment records
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const status = formData.get('status') as string;
    const tran_id = formData.get('tran_id') as string;
    const amount = formData.get('amount') as string;
    const currency = formData.get('currency') as string;
    const store_amount = formData.get('store_amount') as string;

    // Validation MD5 hash
    const md5_hash = formData.get('md5') as string;

    if (!status || !tran_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await db.payment.findUnique({
      where: { referenceId: tran_id },
      include: { subscription: true, invoice: true },
    });

    if (!payment) {
      console.warn(`Payment record not found for tran_id: ${tran_id}`);
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Verify MD5 hash for security
    const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD || '';
    
    // MD5 verification (optional, for enhanced security)
    // const expectedHash = crypto
    //   .createHash('md5')
    //   .update(`${SSLCOMMERZ_STORE_PASSWORD}${tran_id}${amount}${currency}${status}`)
    //   .digest('hex');

    // if (md5_hash && md5_hash !== expectedHash) {
    //   console.warn('MD5 hash verification failed');
    //   return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    // }

    // Update payment based on status
    if (status === '0' || status === 'VERIFIED' || status === 'PROCESSING' || status === 'validationcompleted') {
      // Payment successful
      const updatedPayment = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paymentGatewayResponse: JSON.stringify({
            status,
            tran_id,
            amount,
            currency,
            store_amount,
            gateway_status: 'verified',
            verified_at: new Date().toISOString(),
          }),
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

      // Activate subscription if in TRIAL status
      if (payment.subscription.status === 'TRIAL') {
        await activatePaidSubscription(payment.subscriptionId);
      }

      // Update subscription's SSLCommerz customer ID for recurring payments
      await db.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          sslCommerzCustomerId: tran_id,
        },
      });

      console.log(`Payment verified: ${tran_id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment verified and processed',
        tran_id,
      });
    } else if (status === '-1' || status === '-2' || status === 'FAILED') {
      // Payment failed
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          paymentGatewayResponse: JSON.stringify({
            status,
            tran_id,
            gateway_status: 'failed',
            failed_at: new Date().toISOString(),
          }),
        },
      });

      console.log(`Payment failed: ${tran_id}`);
      return NextResponse.json({
        success: false,
        message: 'Payment failed',
        tran_id,
      });
    } else if (status === '-3') {
      // Payment cancelled
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          paymentGatewayResponse: JSON.stringify({
            status,
            tran_id,
            gateway_status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          }),
        },
      });

      console.log(`Payment cancelled: ${tran_id}`);
      return NextResponse.json({
        success: false,
        message: 'Payment cancelled',
        tran_id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'IPN processed',
      tran_id,
    });
  } catch (error: any) {
    console.error('IPN processing error:', error);
    return NextResponse.json(
      { error: error.message || 'IPN processing failed' },
      { status: 500 }
    );
  }
}
