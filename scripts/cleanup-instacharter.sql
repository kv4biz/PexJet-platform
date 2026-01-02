-- First, remove all existing InstaCharter deals
DELETE FROM "EmptyLeg" WHERE "source" = 'INSTACHARTER';

-- Remove the originalPriceUsd column if it exists
ALTER TABLE "EmptyLeg" DROP COLUMN IF EXISTS "originalPriceUsd";

-- Add operator details fields if they don't exist
ALTER TABLE "EmptyLeg" 
ADD COLUMN IF NOT EXISTS "operatorCompanyId" INTEGER,
ADD COLUMN IF NOT EXISTS "operatorWebsite" TEXT,
ADD COLUMN IF NOT EXISTS "operatorRating" DECIMAL(3,2);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_empty_leg_source" ON "EmptyLeg"("source");
CREATE INDEX IF NOT EXISTS "idx_empty_leg_external_id" ON "EmptyLeg"("externalId");
