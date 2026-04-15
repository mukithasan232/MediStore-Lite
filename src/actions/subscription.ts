'use server';

import { db } from "@/lib/prisma";
import { SubscriptionStatus, SubscriptionPlan } from "@prisma/client";
import { addMonths, addDays, isBefore, isAfter } from 'date-fns';

const SUBSCRIPTION_PRICE = 1000; // BDT per month
const TRIAL_DAYS = 30;

/**
 * Create initial subscription for new user (with free trial)
 */
export async function createInitialSubscription(userId: string) {
  try {
    const trialStartDate = new Date();
    const trialEndDate = addDays(trialStartDate, TRIAL_DAYS);
    
    const subscription = await db.subscription.create({
      data: {
        userId,
        plan: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.TRIAL,
        trialStartDate,
        trialEndDate,
        nextBillingDate: trialEndDate,
      },
    });

    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get subscription with detailed status
 */
export async function getSubscriptionStatus(userId: string) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: {
        invoices: {
          where: { status: 'UNPAID' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
        payments: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!subscription) {
      return { success: false, error: "No subscription found" };
    }

    // Determine current status
    let currentStatus = subscription.status;
    const now = new Date();

    if (subscription.status === SubscriptionStatus.TRIAL) {
      if (isBefore(now, subscription.trialEndDate!)) {
        currentStatus = SubscriptionStatus.TRIAL;
      } else {
        // Trial expired, check if paid subscription started
        if (subscription.currentPeriodEnd && isAfter(now, subscription.currentPeriodEnd)) {
          currentStatus = SubscriptionStatus.EXPIRED;
        }
      }
    }

    return {
      success: true,
      subscription: {
        ...subscription,
        status: currentStatus,
        isTrialActive: isBefore(now, subscription.trialEndDate!),
        daysRemainingInTrial: Math.max(0, Math.ceil((subscription.trialEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
        hasUnpaidInvoice: subscription.invoices.length > 0,
        lastPayment: subscription.payments[0] || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate invoice for upcoming billing period
 */
export async function generateInvoice(subscriptionId: string) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    // Check for existing unpaid invoice
    const existingInvoice = await db.invoice.findFirst({
      where: {
        subscriptionId,
        status: 'UNPAID',
      },
    });

    if (existingInvoice) {
      return { success: true, invoice: existingInvoice, isNew: false };
    }

    // Generate invoice number
    const invoiceCount = await db.invoice.count({
      where: { subscriptionId },
    });
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const billingPeriodStart = new Date();
    const billingPeriodEnd = addMonths(billingPeriodStart, 1);
    const dueDate = addDays(billingPeriodStart, 7); // 7 days to pay

    const invoice = await db.invoice.create({
      data: {
        subscriptionId,
        invoiceNumber,
        amount: SUBSCRIPTION_PRICE,
        currency: 'BDT',
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        status: 'UNPAID',
        description: `MediStore Lite Subscription - ${billingPeriodStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
      },
    });

    // Update subscription's next billing date
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        nextBillingDate: billingPeriodEnd,
        lastBillingDate: new Date(),
      },
    });

    return { success: true, invoice, isNew: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Activate paid subscription (after successful payment)
 */
export async function activatePaidSubscription(subscriptionId: string) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    const now = new Date();
    const currentPeriodEnd = addMonths(now, 1);

    const updated = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
        nextBillingDate: currentPeriodEnd,
      },
    });

    return { success: true, subscription: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Record payment and update invoice
 */
export async function recordPayment(
  subscriptionId: string,
  invoiceId: string,
  referenceId: string,
  amount: number
) {
  try {
    // Create payment record
    const payment = await db.payment.create({
      data: {
        subscriptionId,
        invoiceId,
        referenceId,
        amount,
        currency: 'BDT',
        paymentMethod: 'SSLCOMMERZ',
        status: 'SUCCESS',
      },
    });

    // Update invoice as paid
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
    });

    // Activate subscription if in trial
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (subscription?.status === SubscriptionStatus.TRIAL) {
      await activatePaidSubscription(subscriptionId);
    }

    return { success: true, payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string, reason?: string) {
  try {
    const subscription = await db.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        autoRenew: false,
      },
    });

    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all invoices for a subscription
 */
export async function getSubscriptionInvoices(userId: string, limit = 12) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return { success: false, error: "No subscription found" };
    }

    const invoices = await db.invoice.findMany({
      where: { subscriptionId: subscription.id },
      include: {
        payments: {
          where: { status: { in: ['SUCCESS', 'FAILED'] } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    const now = new Date();

    // Check if trial is active
    if (subscription.status === SubscriptionStatus.TRIAL && isBefore(now, subscription.trialEndDate!)) {
      return true;
    }

    // Check if paid subscription is active
    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      isAfter(subscription.currentPeriodEnd, now)
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
