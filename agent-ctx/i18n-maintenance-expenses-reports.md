# Task: Update Maintenance, Expenses, and Reports Components with 4-Language i18n

## Summary
Updated three components (maintenance, expenses, reports) and their API routes to use the new 4-language i18n system, and added new fields as requested.

## Changes Made

### 1. `/src/lib/i18n.ts` - Added translation keys and helper functions
- Added 20+ new translation keys: `invoiceNumber`, `printReport`, `thisMonthTotal`, `expenseDetails`, `noExpensesMonth`, `revenue`, `profitOrLoss`, `sixMonthTrend`, `date`, `noExpensesFound`, `expenseBreakdown`, `monthlyTrend`, `tasksCount`, `expensesCount`, `property`, `totalRevenue`, `operatingExpenses`, `grossProfit`, `netIncome`, `salary`, `yes`, `no`
- Added `getMaintenanceCategoryLabel(category, lang)` helper function
- Added `getExpenseCategoryLabel(category, lang)` helper function

### 2. `/src/app/api/maintenance/route.ts` - Updated for new fields
- POST: Added `category`, `vendor`, `estimatedCost`, `actualCost` fields
- PUT: Added `category`, `vendor`, `estimatedCost`, `actualCost` fields

### 3. `/src/app/api/expenses/route.ts` - Updated for new fields
- POST: Added `vendor`, `invoiceNumber`, `recurring`, `building` fields
- PUT: Added `vendor`, `invoiceNumber`, `recurring`, `building` fields

### 4. `/src/app/api/reports/route.ts` - Added P&L and Revenue Analysis data
- Added: `rentalIncome`, `otherIncome`, `grossRevenue`, `vacancyLoss`, `badDebt`, `grossProfit`, `costOfOperations`, `netIncome`

### 5. `/src/lib/types.ts` - Updated ReportData type
- Added P&L fields to ReportData interface

### 6. `/src/components/maintenance.tsx` - Full i18n rewrite
- Replaced inline `t(en, ar)` with `import { t } from '@/lib/i18n'`
- Replaced all `t('English', 'Arabic')` with `t('key', lang)`
- Added category dropdown (AC, Plumbing, Electrical, Lock/Door, Painting, Structural, Other)
- Added vendor text input field
- Replaced single `cost` with separate `estimatedCost` + `actualCost` fields
- Uses `getNameByLang()` for property names in the dialog
- Uses `getMaintenanceCategoryLabel()` for category display
- Kept all existing functionality (Kanban board, status transitions, CRUD)

### 7. `/src/components/expenses.tsx` - Full i18n rewrite
- Same i18n pattern replacement
- Added vendor, invoiceNumber, recurring (checkbox), building fields
- OWNER/ADMIN ONLY: imports `isOwnerOrAdmin` and shows access denied for staff
- Uses `getExpenseCategoryLabel()` for category display
- Expanded category filter to include all 8 categories
- Kept all existing functionality (CRUD, category breakdown, totals)

### 8. `/src/components/reports.tsx` - Full i18n rewrite + new sections
- Same i18n pattern replacement
- OWNER/ADMIN ONLY: imports `isOwnerOrAdmin` and shows access denied for staff
- Added **Profit & Loss** section with full breakdown: Rental Income, Other Income, Gross Revenue, Vacancy Loss, Bad Debt, Gross Profit, Operating Expenses, Net Income, with margin indicators
- Added **Revenue Analysis** section with monthly revenue trend (AreaChart) and revenue breakdown
- Kept all existing functionality (summary cards, trend chart, expense pie, expense details)

## Lint Results
All modified files pass lint with zero errors. Pre-existing errors in other files are unrelated.
