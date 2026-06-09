# BillCycle-Centric Architecture Implementation

## Task Summary
Implemented the complete BillCycle-centric architecture for the Real Estate SaaS platform.

## Files Modified

### 1. `/src/lib/types.ts`
- Added `RecurringBillWithCycles` type (extends RecurringBillData with cycles and payments)
- Added `PaymentWithCycle` type (extends RecurringBillPaymentData with billCycle and recurringBill)
- Added `FlatPaymentEntry` type (for all-payments tab with enriched data)

### 2. `/src/lib/i18n.ts`
- Added 12 new translation keys (all 4 languages: en, ar, bn, ur):
  - allPayments, editPayment, deletePayment, deletePaymentConfirm
  - paymentUpdated, paymentDeleted, amountDue, selectCycle
  - currentCycle, noPaymentsYet, paymentAmount, referenceNumber
- Fixed duplicate key names: `lastPayment` → `billLastPayment`, `recordPayment` → `billRecordPayment`, `paymentHistory` → `billPaymentHistory`, `completed` → `completedBackup`

### 3. `/src/app/api/recurring-bills/payments/[paymentId]/route.ts` (NEW)
- **PUT**: Edit payment (amount, paymentDate, method, reference, notes)
  - Recalculates parent BillCycle's paidAmount, outstandingAmount, status
  - Updates parent RecurringBill's currentOutstandingBalance, status
  - Updates linked Expense record
  - Audit log
- **DELETE**: Delete payment with same recalculation logic

### 4. `/src/app/api/recurring-bills/route.ts` (MODIFIED)
- GET handler now derives effective status from LATEST cycle, not bill's top-level status field
- No longer filters by status at DB level; filters in JS after deriving from cycles
- Returns `effectiveStatus` and `latestCycle` fields on each bill

### 5. `/src/app/api/recurring-bills/pay/route.ts` (MODIFIED)
- Now uses CYCLE's outstandingAmount (not bill.currentOutstandingBalance) as source of truth
- Automatically creates a new cycle if no active cycle exists
- Derives bill status from latest cycle's status
- Updates bill's currentOutstandingBalance to match latest cycle's outstandingAmount

### 6. `/src/app/api/recurring-bills/[id]/advance-cycle/route.ts` (MODIFIED)
- After creating new cycle, updates bill's status to 'pending' (matching the new cycle)
- Fixed Decimal type issue with totalAmountDue calculation

### 7. `/src/app/api/recurring-bills/cycles/[cycleId]/payments/route.ts` (NEW)
- POST endpoint to record a payment against a specific BillCycle
- Accepts: amount, paymentDate, method, reference, notes
- Validates cycle exists and belongs to user's company
- Recalculates cycle's paidAmount, outstandingAmount, status
- Updates parent bill's currentOutstandingBalance and status
- Creates Expense record and audit log

### 8. `/src/lib/data-store.ts` (MODIFIED)
- Added `editBillPayment(paymentId, data)` method
- Added `deleteBillPayment(paymentId)` method
- Added `payRecurringBillCycle(cycleId, data)` method

### 9. `/src/components/recurring-bills.tsx` (REDESIGNED)
- **New Tab System**: 'all', 'active', 'paid', 'partially_paid', 'overdue', 'all_payments'
- **Bill List View**: Shows latest cycle's amount, paid, outstanding, and status
- **All Payments Tab**: Flat table of all payments across all bills with Edit/Delete actions
- **Bill Detail Dialog**: Cycle history with expandable payment lists, Edit/Delete buttons per payment
- **Payment Edit Dialog**: Full edit form with amount, date, method, reference, notes
- **Payment Delete Dialog**: Confirmation with cycle balance recalculation warning
- **Record Payment**: Shows current cycle info and outstanding amount
- **Summary Cards**: Derived from cycle data (outstanding from latest cycle's outstandingAmount)
- **i18n**: Uses t() for all visible text, supporting all 4 languages
- **RTL Support**: dir="rtl" for Arabic/Urdu
- **Staff Masking**: maskedAmount() function preserved

## Key Architecture Decisions
1. BillCycle is the source of truth for financial data
2. RecurringBill's top-level fields (currentOutstandingBalance, status) are cached/derived values
3. Bill status always matches the latest cycle's status
4. Status derivation: paidAmount === 0 → pending, > 0 && < amount → partially_paid, >= amount → paid
5. All monetary calculations use safeDecimal() for precision
6. All mutations use transactions for data integrity
7. Audit logs for all write operations
