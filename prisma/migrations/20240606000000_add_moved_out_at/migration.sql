-- Add movedOutAt column to Tenant table for Move Out feature
-- Records the timestamp when a tenant moves out
ALTER TABLE "tenants" ADD COLUMN "movedOutAt" TIMESTAMP(3);
