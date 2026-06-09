# Task: Recurring Bills & Utilities Module + Fix Authentication + Data Integrity

## Summary of All Changes

### Files Modified:

1. **`prisma/schema.prisma`** — Added 3 new models: `RecurringBill`, `RecurringBillPayment`, `BillReminder` with full field definitions, indexes, and table mappings. Added relations to `Company` and `Property` models.

2. **`src/app/api/setup/route.ts`** — 
   - Fixed owner email from `demoo@realestate.ae` to `demoO@realestate.ae`
   - Added accountant user creation (role: 'accountant', email: demoA@realestate.ae)
   - Updated password hashing array, user creation array, audit log details, and response

3. **`src/lib/store.ts`** — Added `'recurring-bills'` to PageType union

4. **`src/lib/types.ts`** — Added `'recurring-bills'` to PageType, added `RecurringBillData`, `RecurringBillPaymentData`, `BillReminderData` interfaces

5. **`src/components/sidebar.tsx`** — Added `Zap` icon import, added recurring-bills nav item between expenses and daily-report

6. **`src/app/page.tsx`** — Imported RecurringBills component, added case 'recurring-bills' in switch statement

7. **`src/lib/data-store.ts`** — 
   - Added `recurringBills` and `billPayments` to state
   - Added `addRecurringBill`, `updateRecurringBill`, `deleteRecurringBill`, `payRecurringBill` methods
   - Added recurring bills to fetchAllData and refreshAllData
   - Added to clearData

8. **`src/lib/i18n.ts`** — Added 30+ translation keys for recurring bills (en, ar, bn, ur)

9. **`src/app/api/dashboard/route.ts`** — Added recurring bills summary (totalRecurringBills, outstandingBillsBalance, overdueBillsCount, upcomingBillsCount, paidBillsThisMonth)

10. **`src/app/api/reports/route.ts`** — Added utility expenses breakdown, outstanding utilities summary, bill payment history

11. **`src/app/api/backup/route.ts`** — Added recurringBills, recurringBillPayments, billReminders to export and restore logic

### Files Created:

1. **`src/app/api/recurring-bills/route.ts`** — GET (list with filters), POST (create with audit log)

2. **`src/app/api/recurring-bills/[id]/route.ts`** — GET (single with payments), PUT (update with before/after audit), DELETE (soft delete)

3. **`src/app/api/recurring-bills/pay/route.ts`** — POST (record payment, create expense, advance nextDueDate, transaction-protected)

4. **`src/app/api/recurring-bills/export/route.ts`** — GET (export as XLSX or PDF with company branding and summary stats)

5. **`src/components/recurring-bills.tsx`** — Full UI component with:
   - Search bar, filter tabs, property filter
   - Summary cards (Total Bills, Outstanding Balance, Paid This Month, Overdue Count)
   - Table with all columns
   - Add/Edit Bill Dialog
   - Record Payment Dialog
   - Bill Detail Dialog with payment history
   - Export buttons (PDF/XLSX)
   - Staff financial amount masking

### Authentication Fixes:
- Owner email corrected from `demoo@realestate.ae` to `demoO@realestate.ae`
- auth.ts already lowercases emails (line 111: `const email = (credentials.email as string).trim().toLowerCase()`)
- Accountant user added to setup

### Role Visibility:
- Recurring bills visible to all roles (no financialOnly/adminOnly flags)
- Staff sees masked amounts (isStaff check in component)
- Owner/Admin/Accountant have full CRUD + financial access
- Staff can view but not modify

### Build Status:
- `prisma generate` — ✅ Success
- `next build` — ✅ Success (all API routes and pages compiled)
- `bun run lint` — ✅ Clean (excluding pre-existing scripts/download errors)
- Migration not applied locally (environment uses SQLite, schema targets PostgreSQL/Neon)
