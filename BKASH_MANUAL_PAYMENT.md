# bKash Manual Payment Integration

## Overview

bKash manual payment support has been added to MediStore Lite subscription system. This allows users to send money via bKash and submit their transaction ID for verification.

**Features:**
- ✅ User submits bKash transaction ID from dashboard
- ✅ Admin verifies and confirms payment
- ✅ Automatic subscription activation after verification
- ✅ Payment history tracking
- ✅ Failed payment rejection with reasons

---

## How It Works

### User Flow

1. **User sees payment options** on `/dashboard/billing`
   - SSLCommerz option (Card/Online)
   - bKash option (Manual transfer)

2. **User clicks bKash button** on unpaid invoice
   - Modal opens with step-by-step instructions
   - Shows amount: ৳1,000

3. **Instructions shown:**
   ```
   1. Open bKash app or dial *247#
   2. Select Send Money
   3. Enter receiver number: 01720XXXXXX
   4. Amount: ৳1,000
   5. Complete transaction
   6. Copy Transaction ID
   7. Paste below and submit
   ```

4. **User enters:**
   - bKash Transaction ID (from confirmation message)
   - bKash Phone Number (their registered number)

5. **Payment submitted to system**
   - Status: PENDING
   - Admin notified

6. **Admin verifies payment**
   - Checks bKash transaction in their account
   - Confirms amount is correct (৳1,000)
   - Clicks "Verify" button

7. **Subscription activated**
   - Invoice marked PAID
   - Subscription status: ACTIVE
   - User gets success notification

---

## Database Changes

### Payment Record Structure

```json
{
  "id": "uuid",
  "subscriptionId": "uuid",
  "invoiceId": "uuid",
  "referenceId": "BKASH-1234567890",
  "amount": 1000.00,
  "currency": "BDT",
  "paymentMethod": "BKASH",
  "status": "PENDING",  // or SUCCESS, FAILED
  "paymentGatewayResponse": {
    "method": "BKASH",
    "transactionId": "1234567890",
    "phoneNumber": "01720000000",
    "submittedAt": "2026-04-15T10:00:00Z",
    "verificationStatus": "AWAITING_VERIFICATION",
    "invoiceId": "uuid",
    "invoiceAmount": "1000"
  }
}
```

After verification:
```json
{
  "status": "SUCCESS",
  "paymentGatewayResponse": {
    ...previous_data,
    "verificationStatus": "VERIFIED",
    "verifiedBy": "admin_user_id",
    "verifiedAt": "2026-04-15T10:05:00Z"
  }
}
```

---

## API Endpoints

### 1. Submit bKash Payment
**POST** `/api/payment/bkash`

**Request:**
```json
{
  "invoiceId": "uuid",
  "subscriptionId": "uuid",
  "bkashTransactionId": "1234567890",
  "bkashPhoneNumber": "01720000000"
}
```

**Response - Success:**
```json
{
  "success": true,
  "payment": { ...payment_object },
  "message": "Payment submitted successfully! Please wait for admin verification (usually within 1-2 hours)."
}
```

**Response - Error:**
```json
{
  "error": "This bKash transaction ID has already been submitted"
}
```

### 2. Get Pending Payments (Admin)
**GET** `/api/admin/bkash/pending`

**Response:**
```json
{
  "success": true,
  "totalPending": 5,
  "payments": [
    {
      "id": "uuid",
      "referenceId": "BKASH-1234567890",
      "amount": 1000,
      "createdAt": "2026-04-15T10:00:00Z",
      "details": {
        "transactionId": "1234567890",
        "phoneNumber": "01720000000",
        "invoiceId": "uuid"
      },
      "invoice": { ...invoice_object },
      "subscription": { ...subscription_object }
    }
  ]
}
```

### 3. Verify bKash Payment (Admin)
**POST** `/api/admin/bkash/pending`

**Request - Verify:**
```json
{
  "paymentId": "uuid",
  "action": "verify"
}
```

**Request - Reject:**
```json
{
  "paymentId": "uuid",
  "action": "reject",
  "reason": "bKash account not matching invoice details"
}
```

**Response - Success:**
```json
{
  "success": true,
  "payment": { ...payment_object_with_success_status },
  "message": "bKash payment verified and confirmed"
}
```

---

## Server Actions

### Submit Payment
```typescript
import { submitBKashPayment } from '@/actions/bkash';

const result = await submitBKashPayment(
  invoiceId,
  subscriptionId,
  '1234567890',    // Transaction ID
  '01720000000'    // Phone number
);
```

### Get Pending Payments (Admin)
```typescript
import { getPendingBKashPayments } from '@/actions/bkash';

const result = await getPendingBKashPayments();
// Returns all PENDING bKash payments
```

### Verify Payment (Admin)
```typescript
import { verifyBKashPayment } from '@/actions/bkash';

const result = await verifyBKashPayment(paymentId, adminUserId);
// Updates payment status to SUCCESS
// Marks invoice as PAID
// Activates subscription
```

### Reject Payment (Admin)
```typescript
import { rejectBKashPayment } from '@/actions/bkash';

const result = await rejectBKashPayment(
  paymentId,
  'Transaction not found in bKash account'
);
// Updates payment status to FAILED
// Keeps invoice UNPAID
```

---

## Frontend Components

### bKash Modal
**File:** `src/app/dashboard/billing/page.tsx`

**Features:**
- Step-by-step instructions
- Transaction ID input field
- Phone number input field
- Amount display (৳1,000)
- Submit button
- Verification warning

**Triggers:**
- Click green phone icon on unpaid invoice
- Modal opens with bKash form

**State Management:**
```typescript
const [showBKashModal, setShowBKashModal] = useState(false);
const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
const [bkashForm, setBkashForm] = useState({
  transactionId: '',
  phoneNumber: '',
});
```

---

## Admin Verification Process

### Step 1: Check Pending Payments
```bash
curl http://localhost:3000/api/admin/bkash/pending
```

### Step 2: Verify Payment Details
- Check transaction ID in bKash app
- Confirm sender phone number
- Confirm amount received (৳1,000)
- Check receiving account matches merchant account

### Step 3: Confirm Payment
```bash
curl -X POST http://localhost:3000/api/admin/bkash/pending \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "uuid",
    "action": "verify"
  }'
```

### Step 4: Rejection (If Invalid)
```bash
curl -X POST http://localhost:3000/api/admin/bkash/pending \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "uuid",
    "action": "reject",
    "reason": "Transaction not found in merchant account"
  }'
```

---

## Validation Rules

### Transaction ID
- Minimum 8 characters
- Maximum 15 characters
- alphanumeric

### Phone Number
- Format: `01XXXXXXXXX` or `+880XXXXXXXXX`
- Must be valid Bangladeshi number
- Required field

### Duplicate Prevention
- Checks if transaction ID already submitted
- Prevents duplicate payments

### Status Checks
- Invoice must be UNPAID
- Cannot pay already PAID invoices

---

## Security Considerations

### Frontend
- ✅ Form validation before submission
- ✅ Phone number format validation
- ✅ Transaction ID length validation

### Backend
- ✅ User authentication required
- ✅ Invoice verification
- ✅ Duplicate transaction prevention
- ✅ Admin verification required before activation
- ✅ Payment status tracking
- ✅ Audit trail (who verified, when)

### Payment Verification
- ✅ Manual human verification by admin
- ✅ Admin checks bKash account
- ✅ Cross-reference with invoice details
- ✅ Log all verification actions

---

## Integration with Subscription System

### Payment Status Flow
```
User Submits
   ↓
Payment created with status: PENDING
   ↓
Admin Reviews
   ↓
   ├→ VERIFY
   │   ↓
   │   Update to SUCCESS
   │   ↓
   │   Mark Invoice: PAID
   │   ↓
   │   Activate Subscription
   │   ↓
   │   User Gets Access
   │
   └→ REJECT
       ↓
       Update to FAILED
       ↓
       Mark Invoice: UNPAID
       ↓
       Keep Subscription: TRIAL
       ↓
       User Can Retry
```

### Subscription Activation
When payment verified:
```typescript
// Update subscription to ACTIVE
await db.subscription.update({
  where: { id: subscriptionId },
  data: {
    status: 'ACTIVE',
    currentPeriodStart: now,
    currentPeriodEnd: addDays(now, 30),
    nextBillingDate: addDays(now, 30),
  },
});
```

---

## Usage Example

### User Perspective
1. Goes to `/dashboard/billing`
2. Sees unpaid invoice
3. Hovers over invoice row
4. Clicks green phone button (bKash)
5. Modal opens with instructions
6. Follows steps to send ৳1,000 via bKash
7. Gets transaction ID from confirmation
8. Enters transaction ID and phone number
9. Clicks "Submit bKash Payment"
10. Gets message: "Payment submitted! Awaiting verification (1-2 hours)"
11. Admin verifies within 2 hours
12. User receives confirmation
13. Subscription becomes ACTIVE
14. User can access app

### Admin Perspective
1. Receives notification of pending payment
2. Opens `/api/admin/bkash/pending`
3. Reviews payment details:
   - Transaction ID
   - Phone number
   - Amount
   - Invoice details
4. Opens bKash app
5. Searches for transaction
6. Verifies:
   - Amount is ৳1,000
   - Phone number matches
   - Receiving account matches merchant
7. Clicks "Verify" button
8. System automatically:
   - Updates payment to SUCCESS
   - Marks invoice as PAID
   - Activates user subscription
9. User gets notified via email

---

## Testing bKash Flow

### Manual Test
```bash
# 1. Submit payment
curl -X POST http://localhost:3000/api/payment/bkash \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "test-invoice-id",
    "subscriptionId": "test-sub-id",
    "bkashTransactionId": "1234567890",
    "bkashPhoneNumber": "01720000000"
  }'

# 2. Check pending payments
curl http://localhost:3000/api/admin/bkash/pending

# 3. Verify payment
curl -X POST http://localhost:3000/api/admin/bkash/pending \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "test-payment-id",
    "action": "verify"
  }'

# 4. Check subscription status
curl http://localhost:3000/api/subscription/status
```

---

## Database Queries

### Get Pending bKash Payments
```sql
SELECT p.*, i.invoice_number, i.amount
FROM payment p
JOIN invoice i ON p.invoice_id = i.id
WHERE p.payment_method = 'BKASH'
  AND p.status = 'PENDING'
ORDER BY p.created_at DESC;
```

### Get All bKash Payments for User
```sql
SELECT p.*, i.invoice_number, i.status as invoice_status
FROM payment p
JOIN invoice i ON p.invoice_id = i.id
JOIN subscription s ON p.subscription_id = s.id
WHERE s.user_id = 'user_id'
  AND p.payment_method = 'BKASH'
ORDER BY p.created_at DESC;
```

### Verify Payment Amounts
```sql
SELECT 
  p.id, 
  p.reference_id, 
  p.amount, 
  i.amount as invoice_amount,
  p.status,
  (p.payment_gateway_response->>'phoneNumber') as bkash_phone
FROM payment p
JOIN invoice i ON p.invoice_id = i.id
WHERE p.payment_method = 'BKASH'
  AND p.status = 'PENDING';
```

---

## Configuration

### bKash Merchant Account
- Set up bKash merchant account: https://www.bkash.com
- Get merchant number (for receiving payments)
- Train admins on verification process

### Notification Settings
- Email admin when payment submitted
- Email user when payment verified
- SMS alerts (optional)

---

## Troubleshooting

### Issue: "bKash transaction ID has already been submitted"
**Solution**: Check if transaction was already submitted. Cannot reuse same transaction ID.

### Issue: Payment stuck in PENDING
**Solution**: Admin needs to verify. Contact admin to complete verification.

### Issue: Wrong amount sent via bKash
**Solution**: Admin will reject. User can resubmit with correct amount.

### Issue: Phone number validation error
**Solution**: Use format: `01720000000` or `+8801720000000`

---

## Future Enhancements

- [ ] Scheduled verification reminders for admins
- [ ] Email notifications for payment updates
- [ ] SMS verification code for added security
- [ ] Payment receipt download
- [ ] Batch verification UI for admins
- [ ] bKash API integration for automatic verification
- [ ] Payment dispute handling
- [ ] Refund processing for rejected payments

---

## Support

**For Users:**
- Contact: support@medistore.com
- Hours: 24/7

**For Admins:**
- Read above documentation
- Check pending payments: `/api/admin/bkash/pending`
- Verify transactions manually in bKash app

---

**Last Updated**: April 15, 2026  
**Status**: ✅ PRODUCTION READY  
**Version**: 1.0.0
