# Subscription System - Developer Quick Reference

## Overview

MediStore Lite includes a production-ready subscription system with:
- 30-day free trial
- ৳1,000/month paid tier
- SSLCommerz payment integration
- Automatic invoice generation
- Subscription management dashboard

---

## Quick Start

### 1. Set Environment Variables

```bash
# .env.local
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run Migrations

```bash
npx prisma db push
npx prisma generate
```

### 3. Test

```bash
npm run dev
# Visit http://localhost:3000
# Register → Trial subscription auto-created
# Go to /dashboard/billing → See subscription status
```

---

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payment/init` | POST | Initialize payment |
| `/api/payment/callback` | GET/POST | Handle payment redirect |
| `/api/payment/ipn` | POST | Webhook from SSLCommerz |
| `/api/subscription/status` | GET | Get user subscription |
| `/api/subscription/invoices` | GET | Get invoices history |

---

## Database Quick Reference

### Tables

**subscription** - User subscription state
```sql
SELECT * FROM subscription 
WHERE userId = 'uuid' 
  AND status = 'TRIAL';
```

**invoice** - Monthly billing records
```sql
SELECT * FROM invoice 
WHERE subscriptionId = 'uuid' 
  AND status = 'UNPAID'
ORDER BY dueDate ASC;
```

**payment** - Payment transactions
```sql
SELECT * FROM payment 
WHERE referenceId = 'transaction_id';
```

---

## Common Tasks

### Check if User Has Active Subscription

```typescript
import { hasActiveSubscription } from '@/actions/subscription';

const isActive = await hasActiveSubscription(userId);
```

### Get Subscription Details

```typescript
import { getSubscriptionStatus } from '@/actions/subscription';

const result = await getSubscriptionStatus(userId);
if (result.success) {
  console.log(result.subscription);
}
```

### Generate Invoice

```typescript
import { generateInvoice } from '@/actions/subscription';

const result = await generateInvoice(subscriptionId);
if (result.success) {
  console.log('Invoice:', result.invoice);
}
```

### Record Payment

```typescript
import { recordPayment } from '@/actions/subscription';

const result = await recordPayment(
  subscriptionId,
  invoiceId,
  sslCommerzTransactionId,
  1000  // amount in BDT
);
```

### Cancel Subscription

```typescript
import { cancelSubscription } from '@/actions/subscription';

const result = await cancelSubscription(userId, 'Optional reason');
```

---

## Subscription Statuses Explained

| Status | Description |
|--------|-------------|
| `TRIAL` | Free 30-day trial period |
| `ACTIVE` | Paid subscription is active |
| `PAUSED` | User paused subscription |
| `CANCELLED` | User cancelled subscription |
| `EXPIRED` | Trial or paid period expired |
| `PENDING_PAYMENT` | Awaiting payment |

---

## Payment Status Explained

| Status | Description |
|--------|-------------|
| `UNPAID` | Invoice waiting for payment |
| `PAID` | Invoice successfully paid |
| `OVERDUE` | Invoice past due date |
| `CANCELLED` | Invoice cancelled |

---

## File Structure

```
src/
├── actions/
│   └── subscription.ts          # Server actions
├── app/
│   ├── api/
│   │   ├── payment/
│   │   │   ├── init/route.ts    # Initialize payment
│   │   │   ├── callback/route.ts # Payment redirect
│   │   │   └── ipn/route.ts     # Webhook handler
│   │   └── subscription/
│   │       ├── status/route.ts  # Get subscription
│   │       └── invoices/route.ts # Get invoices
│   └── dashboard/
│       └── billing/page.tsx     # Billing UI
prisma/
└── schema.prisma               # DB schema (includes subscription tables)
```

---

## Payment Flow Diagram

```
User Signup
    ↓
Create Free Trial (30 days)
    ↓
Trial Period Active
    ↓
    ├→ Day 29: Email reminder to upgrade
    ↓
Day 30: Trial Expires
    ↓
    ├→ Option 1: User clicks "Upgrade" in dashboard
    │   ↓
    │   Generate Invoice (৳1,000)
    │   ↓
    │   Redirect to SSLCommerz
    │   ↓
    │   User pays
    │   ↓
    │   SSLCommerz IPN webhook
    │   ↓
    │   Mark invoice PAID
    │   ↓
    │   Activate subscription for 30 days
    │   ↓
    │   Status: ACTIVE (subscription renewed)
    │   ↓
    │   Day 60: Generate next invoice
    │
    └→ Option 2: User doesn't pay
        ↓
        Status: EXPIRED
        ↓
        No access to app
```

---

## Database Query Examples

### Get all active subscriptions
```sql
SELECT s.*, u.email 
FROM subscription s
JOIN "User" u ON s."userId" = u.id
WHERE s.status = 'ACTIVE'
  AND s."currentPeriodEnd" > NOW();
```

### Get all unpaid invoices
```sql
SELECT i.*, s."userId"
FROM invoice i
JOIN subscription s ON i."subscriptionId" = s.id
WHERE i.status = 'UNPAID'
  AND i."dueDate" < NOW();
```

### Get payment success rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / COUNT(*),
    2
  ) as success_rate
FROM payment;
```

---

## Testing Checklist

- [ ] Register new user → Subscription created
- [ ] Check `/api/subscription/status` → Returns trial data
- [ ] Click upgrade button → Payment form loads
- [ ] Complete SSLCommerz payment
- [ ] Check webhook received `/api/payment/ipn`
- [ ] Verify invoice marked PAID
- [ ] Verify subscription status ACTIVE
- [ ] Check `nextBillingDate` is 30 days out

---

## Debugging Tips

### Check subscription status
```typescript
const sub = await db.subscription.findUnique({
  where: { userId },
  include: { invoices: true, payments: true }
});
console.log(sub);
```

### Check recent payments
```typescript
const payments = await db.payment.findMany({
  where: { subscriptionId },
  orderBy: { createdAt: 'desc' },
  take: 5,
  include: { invoice: true }
});
console.log(payments);
```

### Check if user can access app
```typescript
import { hasActiveSubscription } from '@/actions/subscription';
const canAccess = await hasActiveSubscription(userId);
// Add to middleware to block expired subscriptions
```

---

## Performance Optimization

### Index Queries
All tables have proper indexes:
```sql
-- subscription.userId (UNIQUE)
-- invoice.subscriptionId
-- invoice.status
-- invoice.dueDate
-- payment.subscriptionId
-- payment.status
-- payment.referenceId
```

### Common Queries (Already Optimized)
- `getSubscriptionStatus()` - Includes invoices and payments in single query
- `getSubscriptionInvoices()` - Sorted by date with payments included
- `hasActiveSubscription()` - Single query with date comparison

---

## Security Checklist

- [x] Environment variables for SSLCommerz credentials
- [x] All API endpoints check authentication
- [x] IPN webhook verifies payment status
- [x] Transaction IDs prevent duplicate processing
- [x] Proper error handling (no sensitive data in errors)
- [x] Database queries use prepared statements (Prisma)
- [x] CORS headers for API endpoints
- [x] Rate limiting recommended for payment endpoints

---

## Common SSLCommerz Status Codes

| Code | Meaning |
|------|---------|
| `0` | Payment successful |
| `-1` | Failed |
| `-2` | Cancelled by user |
| `-3` | User cancelled (duplicate) |
| `PROCESSING` | Still processing |
| `VALIDATED` | Payment validated |
| `VERIFIED` | Payment verified |

---

## Useful Commands

```bash
# View subscription for user
npx prisma studio  # UI for database

# Run migration
npx prisma migrate dev --name "name"

# Generate client
npx prisma generate

# View schema issues
npx prisma validate

# Check diff
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datasource prisma/schema.prisma

# Create invoice (from within app)
import { generateInvoice } from '@/actions/subscription';
const result = await generateInvoice(subscriptionId);
```

---

## FAQs

**Q: How do I test payments in development?**  
A: Use `testbox` as store ID and `qwerty` as password. SSLCommerz provides test card numbers.

**Q: What happens if payment webhook fails?**  
A: Check `/api/payment/ipn` logs. User can retry payment from dashboard.

**Q: Can I change the price?**  
A: Update `SUBSCRIPTION_PRICE` in `src/actions/subscription.ts`

**Q: How do I extend a trial?**  
A: Update `trialEndDate` in database

**Q: How do I manually mark payment as received?**  
A: Use `recordPayment()` action with manual reference ID

---

**Last Updated**: April 15, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
