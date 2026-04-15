'use server';

import { db } from "@/lib/prisma";

/**
 * Submit bKash payment manually
 * User enters bKash Transaction ID
 * Admin verifies and confirms
 */
export async function submitBKashPayment(
  invoiceId: string,
  subscriptionId: string,
  bkashTransactionId: string,
  bkashPhoneNumber: string
) {
  try {
    // Validate inputs
    if (!bkashTransactionId || !bkashPhoneNumber) {
      return {
        success: false,
        error: "bKash Transaction ID and Phone Number are required"
      };
    }

    // Find related invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (invoice.status !== 'UNPAID') {
      return { success: false, error: "Invoice already paid" };
    }

    // Check for duplicate transaction ID
    const existingPayment = await db.payment.findFirst({
      where: {
        referenceId: `BKASH-${bkashTransactionId}`,
      },
    });

    if (existingPayment) {
      return {
        success: false,
        error: "This bKash transaction ID has already been submitted"
      };
    }

    // Create payment record with PENDING status
    const payment = await db.payment.create({
      data: {
        subscriptionId,
        invoiceId,
        referenceId: `BKASH-${bkashTransactionId}`,
        amount: invoice.amount,
        currency: 'BDT',
        paymentMethod: 'BKASH',
        status: 'PENDING',
        paymentGatewayResponse: JSON.stringify({
          method: 'BKASH',
          transactionId: bkashTransactionId,
          phoneNumber: bkashPhoneNumber,
          submittedAt: new Date().toISOString(),
          verificationStatus: 'AWAITING_VERIFICATION',
          invoiceId,
          invoiceAmount: invoice.amount.toString(),
        }),
      },
    });

    return {
      success: true,
      payment,
      message: "Payment submitted successfully! Please wait for admin verification (usually within 1-2 hours).",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get pending bKash payments (for admin)
 */
export async function getPendingBKashPayments() {
  try {
    const payments = await db.payment.findMany({
      where: {
        paymentMethod: 'BKASH',
        status: 'PENDING',
      },
      include: {
        invoice: true,
        subscription: {
          include: {
            userId: false, // Don't include full user for security
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      payments: payments.map((p) => ({
        ...p,
        details: JSON.parse(p.paymentGatewayResponse || '{}'),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify and confirm bKash payment (admin only)
 */
export async function verifyBKashPayment(paymentId: string, adminId: string) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true, subscription: true },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.status !== 'PENDING') {
      return {
        success: false,
        error: "Payment is not in PENDING status"
      };
    }

    // Update payment status to SUCCESS
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCESS',
        paymentGatewayResponse: JSON.stringify({
          ...JSON.parse(payment.paymentGatewayResponse || '{}'),
          verificationStatus: 'VERIFIED',
          verifiedBy: adminId,
          verifiedAt: new Date().toISOString(),
        }),
      },
    });

    // Update invoice as PAID
    const updatedInvoice = await db.invoice.update({
      where: { id: payment.invoiceId! },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
    });

    // If subscription is in TRIAL, activate it
    if (payment.subscription.status === 'TRIAL') {
      const now = new Date();
      const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: currentPeriodEnd,
          nextBillingDate: currentPeriodEnd,
        },
      });
    }

    return {
      success: true,
      payment: updatedPayment,
      message: "bKash payment verified and confirmed",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Reject bKash payment (admin)
 */
export async function rejectBKashPayment(paymentId: string, reason: string) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        paymentGatewayResponse: JSON.stringify({
          ...JSON.parse(payment.paymentGatewayResponse || '{}'),
          verificationStatus: 'REJECTED',
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      payment: updatedPayment,
      message: "bKash payment rejected",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get bKash payment details
 */
export async function getBKashPaymentDetails(paymentId: string) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
        subscription: true,
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    return {
      success: true,
      payment: {
        ...payment,
        details: JSON.parse(payment.paymentGatewayResponse || '{}'),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
