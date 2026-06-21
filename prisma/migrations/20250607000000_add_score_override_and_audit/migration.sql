-- AlterTable: Add score override fields to tenants
ALTER TABLE "tenants" ADD COLUMN "systemScore" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "tenants" ADD COLUMN "manualScoreOverride" INTEGER;
ALTER TABLE "tenants" ADD COLUMN "manualScoreReason" TEXT;
ALTER TABLE "tenants" ADD COLUMN "manualOverrideBy" TEXT;
ALTER TABLE "tenants" ADD COLUMN "manualOverrideById" TEXT;
ALTER TABLE "tenants" ADD COLUMN "manualOverrideAt" TIMESTAMP(3);

-- Backfill systemScore to match tenantScore for existing records
UPDATE "tenants" SET "systemScore" = "tenantScore" WHERE "systemScore" = 100 AND "tenantScore" != 100;

-- CreateTable: ScoreAuditLog
CREATE TABLE "score_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "previousScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "score_audit_logs_tenantId_idx" ON "score_audit_logs"("tenantId");
CREATE INDEX "score_audit_logs_changeType_idx" ON "score_audit_logs"("changeType");
CREATE INDEX "score_audit_logs_createdAt_idx" ON "score_audit_logs"("createdAt");
CREATE INDEX "score_audit_logs_companyId_idx" ON "score_audit_logs"("companyId");

-- AddForeignKey
ALTER TABLE "score_audit_logs" ADD CONSTRAINT "score_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
