-- PHASE 2 + 3 Migration: Production Hardening
-- Adds: RateLimitEntry, PasswordResetToken, BackupRecord, Receipt, Notification tables
-- Alters: Float → Decimal for all monetary fields
-- Alters: Adds missing columns (mustChangePassword, plan, deletedAt on User, etc.)

-- ═══════════════════════════════════════════════════════
-- 1. FLOAT → DECIMAL migration for all monetary fields
-- ═══════════════════════════════════════════════════════

-- Tenant: monetary fields
ALTER TABLE "Tenant" ALTER COLUMN "sizeSqft" TYPE DECIMAL(10,2) USING "sizeSqft"::DECIMAL(10,2);
ALTER TABLE "Tenant" ALTER COLUMN "rentAmount" TYPE DECIMAL(10,2) USING "rentAmount"::DECIMAL(10,2);
ALTER TABLE "Tenant" ALTER COLUMN "municipalityFee" TYPE DECIMAL(10,2) USING "municipalityFee"::DECIMAL(10,2);
ALTER TABLE "Tenant" ALTER COLUMN "securityDeposit" TYPE DECIMAL(10,2) USING "securityDeposit"::DECIMAL(10,2);
ALTER TABLE "Tenant" ALTER COLUMN "newRent" TYPE DECIMAL(10,2) USING "newRent"::DECIMAL(10,2);

-- Payment: monetary field
ALTER TABLE "Payment" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);

-- Expense: monetary field
ALTER TABLE "Expense" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);

-- Maintenance: monetary fields
ALTER TABLE "Maintenance" ALTER COLUMN "estimatedCost" TYPE DECIMAL(10,2) USING "estimatedCost"::DECIMAL(10,2);
ALTER TABLE "Maintenance" ALTER COLUMN "actualCost" TYPE DECIMAL(10,2) USING "actualCost"::DECIMAL(10,2);

-- ═══════════════════════════════════════════════════════
-- 2. Company table: Add subscription and plan columns
-- ═══════════════════════════════════════════════════════

ALTER TABLE "Company" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "Company" ADD COLUMN "maxProperties" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Company" ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Company" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Company" ADD COLUMN "subscriptionStatus" TEXT;
ALTER TABLE "Company" ADD COLUMN "subscriptionEnd" TIMESTAMP(3);

-- ═══════════════════════════════════════════════════════
-- 3. User table: Add security and soft-delete columns
-- ═══════════════════════════════════════════════════════

ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT;
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- ═══════════════════════════════════════════════════════
-- 4. ResetRequest table: Add updatedAt and companyId
-- ═══════════════════════════════════════════════════════

ALTER TABLE "ResetRequest" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ResetRequest" ADD COLUMN "companyId" TEXT;

-- ═══════════════════════════════════════════════════════
-- 5. AuditLog table: Add companyId index, fix details type
-- ═══════════════════════════════════════════════════════

-- Change details from JSONB to TEXT (for consistent JSON.stringify serialization)
ALTER TABLE "AuditLog" ALTER COLUMN "details" TYPE TEXT USING "details"::TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- ═══════════════════════════════════════════════════════
-- 6. New Table: PasswordResetToken
-- ═══════════════════════════════════════════════════════

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- ═══════════════════════════════════════════════════════
-- 7. New Table: RateLimitEntry (DB-backed rate limiting)
-- ═══════════════════════════════════════════════════════

CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitEntry_identifier_key" ON "RateLimitEntry"("identifier");
CREATE INDEX "RateLimitEntry_lockedUntil_idx" ON "RateLimitEntry"("lockedUntil");

-- ═══════════════════════════════════════════════════════
-- 8. New Table: BackupRecord
-- ═══════════════════════════════════════════════════════

CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BackupRecord_companyId_idx" ON "BackupRecord"("companyId");
CREATE INDEX "BackupRecord_createdAt_idx" ON "BackupRecord"("createdAt");

ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════
-- 9. New Table: Receipt
-- ═══════════════════════════════════════════════════════

CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Receipt_companyId_idx" ON "Receipt"("companyId");
CREATE INDEX "Receipt_tenantId_idx" ON "Receipt"("tenantId");
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════
-- 10. New Table: Notification
-- ═══════════════════════════════════════════════════════

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════
-- 11. Fix ResetRequest foreign key for resolvedBy → User
-- ═══════════════════════════════════════════════════════

-- The init migration already has this FK, but now we need the relation name
-- No change needed if FK already exists

-- ═══════════════════════════════════════════════════════
-- 12. Add companyId to Payment table for direct company queries
-- ═══════════════════════════════════════════════════════

-- Add companyId column (nullable first to allow existing rows)
ALTER TABLE "payments" ADD COLUMN "companyId" TEXT;

-- Backfill companyId from tenant relation
UPDATE "payments" SET "companyId" = "tenants"."companyId"
FROM "tenants" WHERE "payments"."tenantId" = "tenants"."id";

-- Make companyId NOT NULL now that it's backfilled
ALTER TABLE "payments" ALTER COLUMN "companyId" SET NOT NULL;

-- Add foreign key and index
ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "payments_companyId_idx" ON "payments"("companyId");
