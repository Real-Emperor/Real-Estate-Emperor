-- CreateTable
CREATE TABLE "bill_cycles" (
    "id" TEXT NOT NULL,
    "recurringBillId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cycleNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bill_cycles_recurringBillId_idx" ON "bill_cycles"("recurringBillId");

-- CreateIndex
CREATE INDEX "bill_cycles_companyId_idx" ON "bill_cycles"("companyId");

-- CreateIndex
CREATE INDEX "bill_cycles_status_idx" ON "bill_cycles"("status");

-- CreateIndex
CREATE INDEX "bill_cycles_dueDate_idx" ON "bill_cycles"("dueDate");

-- CreateIndex
CREATE INDEX "bill_cycles_periodStart_periodEnd_idx" ON "bill_cycles"("periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "bill_cycles" ADD CONSTRAINT "bill_cycles_recurringBillId_fkey" FOREIGN KEY ("recurringBillId") REFERENCES "recurring_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_cycles" ADD CONSTRAINT "bill_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add billCycleId column to recurring_bill_payments
ALTER TABLE "recurring_bill_payments" ADD COLUMN "billCycleId" TEXT;

-- CreateIndex
CREATE INDEX "recurring_bill_payments_billCycleId_idx" ON "recurring_bill_payments"("billCycleId");

-- AddForeignKey
ALTER TABLE "recurring_bill_payments" ADD CONSTRAINT "recurring_bill_payments_billCycleId_fkey" FOREIGN KEY ("billCycleId") REFERENCES "bill_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
