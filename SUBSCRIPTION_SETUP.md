# MediStore Lite - Subscription System Setup Guide

## Overview

This document explains the production-ready subscription system implemented for MediStore Lite:
- **Free Trial**: 30 days
- **Paid Tier**: ৳1,000 per month
- **Payment Gateway**: SSLCommerz
- **Auto-renewal**: Enabled by default

---

## 📋 Table of Contents

1. [Database Schema](#database-schema)
2. [Environment Setup](#environment-setup)
3. [API Endpoints](#api-endpoints)
4. [Payment Flow](#payment-flow)
5. [Admin Operations](#admin-operations)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Database Schema

### New Tables Added

#### `subscription`
Tracks user subscription status and plan details.

```sql
- id (UUID): Primary key
- userId (UUID): Reference to User
- plan (SubscriptionPlan): STARTER
- status (SubscriptionStatus): TRIAL | ACTIVE | PAUSED | CANCELLED | EXPIRED | PENDING_PAYMENT
- trialStartDate (DateTime): When trial started
- trialEndDate (DateTime): When trial expires (30 days from signup)
- currentPeriodStart (DateTime): Paid subscription start date
- currentPeriodEnd (DateTime): Paid subscription expiry
- nextBillingDate (DateTime): Next billing date
- lastBillingDate (DateTime): Last billing date
- paymentMethod (String): SSLCOMMERZ, etc.
- autoRenew (Boolean): Auto-renewal enabled
- billingEmail (String): Email for invoices
- billingPhone (String): Phone for billing
- billingAddress (String): Billing address
```

#### `invoice`
Monthly billing invoices.

```sql
- id (UUID): Primary key
- subscriptionId (UUID): Reference to Subscription
- invoiceNumber (String): Unique invoice ID (INV-2026-0001)
- amount (Decimal): 1000.00 BDT
- currency (String): BDT
- billingPeriodStart (DateTime): Period start
- billingPeriodEnd (DateTime): Period end
- dueDate (DateTime): Payment due date
- status (String): UNPAID | PAID | OVERDUE | CANCELLED
- paidDate (DateTime): When payment was received
- description (String): Invoice description
```

#### `payment`
Payment transaction records.

```sql
- id (UUID): Primary key
- subscriptionId (UUID): Reference to Subscription
- invoiceId (UUID): Reference to Invoice
- referenceId (String): SSLCommerz transaction ID
- amount (Decimal): Payment amount
- currency (String): BDT
- paymentMethod (String): SSLCOMMERZ
- status (String): PENDING | SUCCESS | FAILED | REFUNDED
- paymentGatewayResponse (JSON): Full gateway response
```

---

## Environment Setup

### 1. Add SSLCommerz Credentials

Get merchant credentials from https://www.sslcommerzmart.com/

Add to `.env.local`:

```env
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run Prisma Migration

```bash
npx prisma db push
# or
npx prisma migrate dev --name add_subscriptions
```

### 3. Regenerate Prisma Client

```bash
npx prisma generate
```

---

## API Endpoints

### 1. Payment Initialization
**POST** `/api/payment/init`

Initializes SSLCommerz payment session.

**Request:**
```json
{
  "invoiceId": "uuid",
  "subscriptionId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://securepay.sslcommerz.com/gwprocess/v4/api.php",
  "redirectUrl": "https://securepay.sslcommerz.com/gwprocess/v4/api.php?store_id=...",
  "data": { ...sslcommerz_params }
}
```

### 2. Payment Callback
**GET/POST** `/api/payment/callback`

Handles redirect from SSLCommerz after payment.

### 3. Payment IPN
**POST** `/api/payment/ipn`

Instant Payment Notification webhook from SSLCommerz. Verifies payment and updates invoice status.

### 4. Get Subscription Status
**GET** `/api/subscription/status`

Returns current subscription details.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "status": "TRIAL",
    "plan": "STARTER",
    "isTrialActive": true,
    "daysRemainingInTrial": 15,
    "nextBillingDate": "2026-05-15T00:00:00Z",
    "hasUnpaidInvoice": false,
    "lastPayment": null,
    "autoRenew": true
  }
}
```

### 5. Get Invoices
**GET** `/api/subscription/invoices?limit=12`

Returns user's invoices.

---

## Payment Flow

### User Signup Flow
```
1. User registers → 30-day free trial created
2. Subscription status: TRIAL
3. Trial period: 30 days
4. nextBillingDate: 30 days from signup
```

### Free Trial → Paid Conversion
```
1. Trial expires (30 days later)
2. System prompts user to upgrade
3. User clicks "Upgrade to Paid"
4. Invoice generated for ৳1,000
5. User redirected to SSLCommerz payment gateway
6. User pays via SSLCommerz
7. Webhook confirms payment
8. Invoice marked PAID
9. Subscription status: ACTIVE
```

### Recurring Monthly Billing
```
1. Each month on subscription renewal date
2. Invoice automatically generated
3. User receives email with invoice
4. User pays via dashboard or email link
5. Payment confirmed → subscription extended
```

---

## Server Actions

### Create Initial Subscription
**File**: `src/actions/subscription.ts`

```typescript
createInitialSubscription(userId: string)
```
Auto-called when user registers. Creates 30-day trial.

### Get Subscription Status
```typescript
getSubscriptionStatus(userId: string)
```
Returns detailed subscription info with trial days remaining.

### Generate Invoice
```typescript
generateInvoice(subscriptionId: string)
```
Creates invoice for upcoming billing period. Only creates one pending invoice per subscription.

### Activate Paid Subscription
```typescript
activatePaidSubscription(subscriptionId: string)
```
Called after successful payment. Activates subscription for 30 days.

### Record Payment
```typescript
recordPayment(subscriptionId, invoiceId, referenceId, amount)
```
Records successful payment and marks invoice as PAID.

### Cancel Subscription
```typescript
cancelSubscription(userId: string, reason?: string)
```
Cancels subscription and disables auto-renewal.

### Check Active Subscription
```typescript
hasActiveSubscription(userId: string): Promise<boolean>
```
Returns true if user has active trial or paid subscription.

---

## Subscription UI

### Billing Dashboard
**File**: `src/app/dashboard/billing/page.tsx`

Features:
- Trial status with countdown
- Next billing date
- Monthly cost display
- Invoice history table
- Payment buttons
- Auto-renewal status
- Subscription details

### Key Components

1. **Trial Status Card** - Shows days remaining in trial
2. **Billing Information** - Next billing date, monthly cost
3. **Invoices Table** - All invoices with payment status
4. **Action Buttons** - Upgrade, Pay Invoice, Manage Billing

---

## Admin Operations

### Check User Subscription Status

```typescript
import { getSubscriptionStatus, hasActiveSubscription } from '@/actions/subscription';

// Get full subscription details
const result = await getSubscriptionStatus(userId);

// Check if user has active subscription
const isActive = await hasActiveSubscription(userId);
```

### Manually Create Invoice

```typescript
import { generateInvoice } from '@/actions/subscription';

const result = await generateInvoice(subscriptionId);
if (result.success) {
  console.log('Invoice created:', result.invoice);
}
```

### Check Payment Status

```typescript
const payment = await db.payment.findUnique({
  where: { referenceId: transactionId },
  include: { invoice: true, subscription: true }
});
```

---

## Testing

### 1. Test Trial Period
```
1. Register new account
2. Verify subscription created with TRIAL status
3. Verify trialEndDate is 30 days from now
```

### 2. Test Payment (SSLCommerz Sandbox)

```env
SSLCOMMERZ_STORE_ID=testbox  # SSLCommerz test credentials
SSLCOMMERZ_STORE_PASSWORD=qwerty
NODE_ENV=development  # Uses sandbox
```

SSLCommerz provides test card numbers in sandbox. Check their documentation.

### 3. Test Payment Callback

Use curl to simulate webhook:

```bash
curl -X POST http://localhost:3000/api/payment/ipn \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "status=VERIFIED&tran_id=TXN12345&amount=1000&currency=BDT&store_amount=1000"
```

### 4. Test Subscription Expiry

Manually update `trialEndDate` in database to past date and check if status changes.

---

## Deployment

### 1. Production SSLCommerz Setup

Get production credentials from SSLCommerz merchant dashboard.

```env
SSLCOMMERZ_STORE_ID=your_production_store_id
SSLCOMMERZ_STORE_PASSWORD=your_production_password
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### 2. Database Migrations

```bash
# Run migrations on production
npx prisma migrate deploy
```

### 3. Verify Endpoints

Test payment flows in production environment:
```
✓ POST /api/payment/init
✓ GET /api/payment/callback
✓ POST /api/payment/ipn
✓ GET /api/subscription/status
✓ GET /api/subscription/invoices
```

### 4. Configure IPN Webhook

In SSLCommerz merchant panel:
- Set IPN URL: `https://yourdomain.com/api/payment/ipn`
- Enable IPN notifications
- Test IPN delivery

### 5. Monitor Subscriptions

Set up cron jobs for:
- Daily: Check expired trials → remind users to upgrade
- Daily: Check overdue invoices → send reminders
- Monthly: Generate recurring invoices for active subscriptions

---

## Security Considerations

### 1. MD5 Hash Verification (Optional)
Can enable MD5 verification in IPN endpoint for additional security:

```typescript
// Uncomment in /api/payment/ipn route
const md5_hash = formData.get('md5');
const expectedHash = crypto.createHash('md5')
  .update(`${password}${tran_id}${amount}${currency}${status}`)
  .digest('hex');
if (md5_hash !== expectedHash) {
  throw new Error('Invalid hash');
}
```

### 2. Webhook Verification
- Validate all webhook payments in database before processing
- Prevent duplicate payment processing with idempotency keys
- Log all payment attempts for audit trail

### 3. API Authentication
All subscription endpoints require Supabase auth:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Troubleshooting

### Issue: "Payment gateway not configured"
**Solution**: Check `.env.local` for `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`

### Issue: Payment button redirects to 404
**Solution**: Verify `NEXT_PUBLIC_APP_URL` is correct for payment callbacks

### Issue: Invoice not generating
**Solution**: 
- Check subscription exists in database
- Verify subscription status is not in CANCELLED state
- Check if unpaid invoice already exists

### Issue: Trial period not working
**Solution**:
- Verify subscription created on user registration
- Check `trialEndDate` is set correctly (30 days from signup)
- Confirm `hasActiveSubscription()` correctly evaluates trial status

---

## Future Enhancements

- [ ] Automatic monthly invoice generation via cron
- [ ] Email notifications for trial expiry
- [ ] Payment retry mechanism for failed transactions
- [ ] Subscription pause/resume functionality
- [ ] Tiered pricing plans (STARTER, PROFESSIONAL, ENTERPRISE)
- [ ] Custom branding for invoices
- [ ] Subscription cancellation feedback form
- [ ] Referral rewards program
- [ ] Payment method management (save cards)
- [ ] Tax calculation and compliance

---

## Support & Contact

For issues or questions about the subscription system:
- Email: support@medistore.com
- Documentation: [Online Docs]
- SSLCommerz API: https://developer.sslcommerz.com/

---

**Last Updated**: April 15, 2026
**Version**: 1.0.0
