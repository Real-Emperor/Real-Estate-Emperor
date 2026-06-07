-- AlterTable: Add Phase 1 Rental Accounting fields to tenants
ALTER TABLE "tenants" ADD COLUMN "openingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "tenants" ADD COLUMN "creditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "tenants" ADD COLUMN "legalCase" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN "legalCaseNumber" TEXT;
ALTER TABLE "tenants" ADD COLUMN "legalCaseNotes" TEXT;

-- AlterTable: Add allocation type to payments
ALTER TABLE "payments" ADD COLUMN "allocationType" TEXT;

-- CreateIndex
CREATE INDEX "tenants_legalCase_idx" ON "tenants"("legalCase");
CREATE INDEX "payments_allocationType_idx" ON "payments"("allocationType");

-- Backfill: Set default allocation type for existing payments
UPDATE "payments" SET "allocationType" = 'CURRENT_RENT' WHERE "allocationType" IS NULL;
