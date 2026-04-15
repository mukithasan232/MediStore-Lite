import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/prisma';

/**
 * Initialize SSLCommerz payment session
 * POST /api/payment/init
 * Body: { invoiceId, subscriptionId, userId }
 */
export async function POST(request: NextRequest) {
  try {
    const { invoiceId, subscriptionId, userId } = await request.json();

    // Validate input
    if (!invoiceId || !subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.status !== 'UNPAID') {
      return NextResponse.json(
        { error: 'Invoice already paid' },
        { status: 400 }
      );
    }

    // SSLCommerz Configuration
    const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || '';
    const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD || '';
    const SSLCOMMERZ_ENDPOINT = process.env.NODE_ENV === 'production'
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    if (!SSLCOMMERZ_STORE_ID || !SSLCOMMERZ_STORE_PASSWORD) {
      console.error('SSLCommerz credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Prepare SSLCommerz data
    const uniqueId = `${invoiceId}-${Date.now()}`;
    const sslCommerzData = {
      store_id: SSLCOMMERZ_STORE_ID,
      store_passwd: SSLCOMMERZ_STORE_PASSWORD,
      total_amount: invoice.amount.toString(),
      currency: invoice.currency,
      tran_id: uniqueId,
      
      // Customer info
      cus_name: 'MediStore User',
      cus_email: invoice.subscription?.billingEmail || '',
      cus_phone: invoice.subscription?.billingPhone || '',
      cus_add1: invoice.subscription?.billingAddress || 'Dhaka, Bangladesh',
      
      // Shipping info
      ship_name: 'MediStore User',
      ship_email: invoice.subscription?.billingEmail || '',
      ship_add1: invoice.subscription?.billingAddress || 'Dhaka, Bangladesh',
      
      // Product info
      product_name: 'MediStore Lite Subscription',
      product_category: 'Software Service',
      product_profile: 'service',
      
      // Callbacks
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?status=success`,
      fail_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?status=fail`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?status=cancel`,
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/ipn`,
      
      // Custom meta
      invoice_id: invoiceId,
      subscription_id: subscriptionId,
      user_id: userId,
    };

    // Store transaction record (for verification)
    await db.payment.create({
      data: {
        subscriptionId,
        invoiceId,
        referenceId: uniqueId,
        amount: Number(invoice.amount),
        currency: 'BDT',
        paymentMethod: 'SSLCOMMERZ',
        status: 'PENDING',
        paymentGatewayResponse: JSON.stringify(sslCommerzData),
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: SSLCOMMERZ_ENDPOINT,
      data: sslCommerzData,
      redirectUrl: `${SSLCOMMERZ_ENDPOINT}?${new URLSearchParams(
        Object.entries(sslCommerzData).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value?.toString() || '',
        }), {} as Record<string, string>)
      )}`,
    });
  } catch (error: any) {
    console.error('Payment init error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
