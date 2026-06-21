-- AlterTable
ALTER TABLE "backup_records" ADD COLUMN "dataHash" TEXT;
ALTER TABLE "backup_records" ADD COLUMN "storageUrl" TEXT;
ALTER TABLE "backup_records" ADD COLUMN "triggeredBy" TEXT;

-- CreateIndex
CREATE INDEX "backup_records_status_idx" ON "backup_records"("status");
