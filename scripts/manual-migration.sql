-- Manual migration script for InstaCharter improvements
-- Run this in your database admin panel or with psql

-- 1. Remove originalPriceUsd column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'EmptyLeg' 
        AND column_name = 'originalPriceUsd'
    ) THEN
        ALTER TABLE "EmptyLeg" DROP COLUMN "originalPriceUsd";
        RAISE NOTICE 'Removed originalPriceUsd column';
    ELSE
        RAISE NOTICE 'originalPriceUsd column does not exist';
    END IF;
END $$;

-- 2. Add operator details columns if they don't exist
DO $$
BEGIN
    -- Add operatorCompanyId
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'EmptyLeg' 
        AND column_name = 'operatorCompanyId'
    ) THEN
        ALTER TABLE "EmptyLeg" ADD COLUMN "operatorCompanyId" INTEGER;
        RAISE NOTICE 'Added operatorCompanyId column';
    END IF;

    -- Add operatorWebsite
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'EmptyLeg' 
        AND column_name = 'operatorWebsite'
    ) THEN
        ALTER TABLE "EmptyLeg" ADD COLUMN "operatorWebsite" TEXT;
        RAISE NOTICE 'Added operatorWebsite column';
    END IF;

    -- Add operatorRating
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'EmptyLeg' 
        AND column_name = 'operatorRating'
    ) THEN
        ALTER TABLE "EmptyLeg" ADD COLUMN "operatorRating" DECIMAL(3,2);
        RAISE NOTICE 'Added operatorRating column';
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_empty_leg_source" ON "EmptyLeg"("source");
CREATE INDEX IF NOT EXISTS "idx_empty_leg_external_id" ON "EmptyLeg"("externalId");

-- 4. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'EmptyLeg' 
AND column_name IN ('originalPriceUsd', 'operatorCompanyId', 'operatorWebsite', 'operatorRating')
ORDER BY column_name;
