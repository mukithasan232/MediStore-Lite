# bKash Payment - Quick Setup Guide

## What's New?

Added manual bKash payment option alongside SSLCommerz. Users can now:
1. Click bKash button on unpaid invoice
2. Follow instructions to send ৳1,000 via bKash
3. Submit transaction ID for verification
4. Admin verifies within 1-2 hours
5. Subscription automatically activated after verification

---

## User-Facing Features

### Billing Page (`/dashboard/billing`)
- **Two payment options** on each unpaid invoice:
  - 💳 Blue button = SSLCommerz (Card/Online)
  - 📱 Green button = bKash (Manual transfer)

### bKash Payment Modal
When user clicks green phone button:
1. **Instructions** - Step-by-step guide (tap *247# → Send Money → etc)
2. **Amount** - Shows ৳1,000 to send
3. **Form Fields**:
   - bKash Transaction ID (required)
   - bKash Phone Number (required)
4. **Confirmation warning** - Reminds user to verify before submitting
5. **Submit button** - Sends payment data to API

---

## Admin Operations

### Check Pending Payments
```bash
GET /api/admin/bkash/pending
```
Returns all pending bKash payments waiting for verification

### Verify Payment
```bash
POST /api/admin/bkash/pending
Body: { "paymentId": "uuid", "action": "verify" }
```
Confirms payment → marks invoice PAID → activates subscription

### Reject Payment
```bash
POST /api/admin/bkash/pending
Body: { "paymentId": "uuid", "action": "reject", "reason": "..." }
```
Rejects invalid payment → keeps invoice UNPAID

---

## Files Added/Modified

**New Files:**
- ✅ `src/actions/bkash.ts` - Server actions for bKash
- ✅ `src/app/api/payment/bkash/route.ts` - bKash payment submission
- ✅ `src/app/api/admin/bkash/pending/route.ts` - Admin verification
- ✅ `BKASH_MANUAL_PAYMENT.md` - Full documentation

**Modified Files:**
- ✅ `src/app/dashboard/billing/page.tsx` - Added bKash button & modal

---

## Database Structure

### New Payment Status Flow
```
PENDING → (admin verifies) → SUCCESS
       → (admin rejects)   → FAILED
```

### Payment Gateway Response
Stores bKash details in JSON:
```json
{
  "method": "BKASH",
  "transactionId": "1234567890",
  "phoneNumber": "01720000000",
  "submittedAt": "2026-04-15T10:00:00Z",
  "verificationStatus": "AWAITING_VERIFICATION"
}
```

---

## How Payment Process Works

### User Journey
1. Sees unpaid invoice on `/dashboard/billing`
2. Clicks green phone button (bKash)
3. Modal opens with clear instructions
4. Sends ৳1,000 via bKash app
5. Gets transaction ID from SMS/app
6. Enters Transaction ID + Phone Number
7. Clicks "Submit Payment"
8. Gets message: "Awaiting verification (1-2 hours)"
9. Admin verifies within 2 hours
10. Invoice marked PAID automatically
11. Subscription activated automatically
12. Can use app immediately

### Admin Journey
1. Receives notification of pending payment
2. Calls API: `GET /api/admin/bkash/pending`
3. Reviews payment details:
   - Transaction ID
   - Phone number  
   - Amount (৳1,000)
   - Invoice reference
4. Opens bKash app
5. Searches for transaction
6. Verifies amount & sender match
7. Calls API: `POST /api/admin/bkash/pending` with action: "verify"
8. Payment automatically confirmed
9. Invoice automatically marked PAID
10. Subscription automatically activated
11. User gets full access

---

## Validation Rules

### Transaction ID
- Min 8 chars, Max 15 chars
- Alphanumeric
- No duplicates allowed

### Phone Number  
- Formats: `01720000000` or `+8801720000000`
- Must be valid BD number
- Required

### Amount
- Always ৳1,000 (hardcoded)
- Verified against invoice amount

---

## Payment Statuses

| Status | Meaning | Next Action |
|--------|---------|------------|
| PENDING | Awaiting admin verification | Admin verifies payment |
| SUCCESS | Payment verified and confirmed | None (complete) |
| FAILED | Payment rejected by admin | User can resubmit |

---

## Invoice Statuses After Payment

| Status | When | What Happens |
|--------|------|--------------|
| UNPAID | Initial | Show payment buttons (bKash + SSLCommerz) |
| PAID | After verified | Invoice marked complete, subscription active |
| OVERDUE | If unpaid past due date | Show urgent payment notice |

---

## Quick API Reference

### User APIs
```bash
# Submit bKash payment
POST /api/payment/bkash
{
  "invoiceId": "uuid",
  "subscriptionId": "uuid",
  "bkashTransactionId": "1234567890",
  "bkashPhoneNumber": "01720000000"
}

# Get subscription status
GET /api/subscription/status

# Get invoices
GET /api/subscription/invoices
```

### Admin APIs
```bash
# Get pending bKash payments
GET /api/admin/bkash/pending

# Verify payment
POST /api/admin/bkash/pending
{
  "paymentId": "uuid",
  "action": "verify"
}

# Reject payment  
POST /api/admin/bkash/pending
{
  "paymentId": "uuid",
  "action": "reject",
  "reason": "Transaction not found"
}
```

---

## Testing

### Test Flow
1. Register user → Trial created
2. Go to `/dashboard/billing`
3. Click "Upgrade to Paid" → Invoice generated
4. Click green phone button → Modal opens
5. Enter fake Transaction ID: `1234567890`
6. Enter Phone: `01720000000`
7. Submit → Payment created with PENDING status
8. Check API: `GET /api/admin/bkash/pending`
9. Verify payment: `POST /api/admin/bkash/pending` with action: "verify"
10. Check subscription status → Should be ACTIVE

---

## Error Handling

### Duplicate Transaction
```json
{
  "error": "This bKash transaction ID has already been submitted"
}
```
→ Solution: User needs different transaction ID

### Invalid Phone Number
```json
{
  "error": "Invalid phone number format"
}
```
→ Solution: Use format `01720000000` or `+8801720000000`

### Invoice Already Paid
```json
{
  "error": "Invoice already paid"  
}
```
→ Solution: Use a different unpaid invoice

---

## Database Queries

### Find Pending Payments
```sql
SELECT * FROM payment 
WHERE payment_method = 'BKASH' 
  AND status = 'PENDING'
ORDER BY created_at DESC;
```

### Find User's bKash Payments
```sql
SELECT p.* FROM payment p
JOIN subscription s ON p.subscription_id = s.id
WHERE s.user_id = 'uuid'
  AND p.payment_method = 'BKASH'
ORDER BY p.created_at DESC;
```

### Success Rate
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as verified,
  COUNT(*) FILTER (WHERE status = 'FAILED') as rejected
FROM payment
WHERE payment_method = 'BKASH';
```

---

## Configuration

**No environment variables needed** - bKash integration is built-in.

Just ensure:
- ✅ Database tables exist (run migrations)
- ✅ Admins know how to verify payments
- ✅ Have bKash merchant account for receiving payments
- ✅ Users know merchant number to send money to

---

## Monitoring

### What to Monitor
- Pending payment queue (should verify within 2 hours)
- Rejection rate (should be low)
- Average verification time
- User satisfaction with payment method

### Key Metrics
```
Total bKash payments submitted
Success rate (% verified)
Failure rate (% rejected)
Average time to verify
Pending queue size
```

---

## Troubleshooting

**Q: Payment stuck in PENDING?**  
A: Admin needs to verify. Check `/api/admin/bkash/pending`

**Q: Transaction ID already submitted?**  
A: Cannot reuse same transaction ID. Use different one.

**Q: User can't send money?**  
A: Verify they're using bKash correctly:
1. Open bKash app
2. Tap Send Money
3. Enter merchant number
4. Amount: ৳1,000
5. Complete transaction

**Q: How to reject payment?**  
A: Call POST `/api/admin/bkash/pending` with action: "reject" and reason

---

## Features Implemented

✅ User-facing bKash payment modal  
✅ Transaction ID + Phone number submission  
✅ Admin verification API  
✅ Automatic payment confirmation  
✅ Duplicate prevention  
✅ Proper status tracking  
✅ Subscription auto-activation  
✅ Full error handling  
✅ Audit trail (who verified, when)  
✅ Invoice auto-marking as PAID  

---

## What's Next?

Optional enhancements:
- [ ] Email notifications on payment submission
- [ ] Email confirmation when verified
- [ ] SMS alerts for admins
- [ ] Batch verification UI  
- [ ] bKash API integration (auto-verify)
- [ ] Payment receipts
- [ ] Refund handling

---

**Status**: ✅ READY TO USE  
**Date**: April 15, 2026  
**Version**: 1.0.0
