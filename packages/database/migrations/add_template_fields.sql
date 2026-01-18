-- Add missing fields for template generation
ALTER TABLE "EmptyLegBooking" 
ADD COLUMN "eTicketNumber" TEXT,
ADD COLUMN "crewInformation" TEXT,
ADD COLUMN "luggageInformation" TEXT,
ADD COLUMN "paymentDate" TIMESTAMP(3),
ADD COLUMN "boardingTime" TIMESTAMP(3);

-- Add comment for clarity
COMMENT ON COLUMN "EmptyLegBooking"."crewInformation" IS 'Multi-line crew information for flight confirmation template';
COMMENT ON COLUMN "EmptyLegBooking"."luggageInformation" IS 'Multi-line luggage information for flight confirmation template';
COMMENT ON COLUMN "EmptyLegBooking"."eTicketNumber" IS 'E-ticket number for flight confirmation';
COMMENT ON COLUMN "EmptyLegBooking"."paymentDate" IS 'Date when payment was confirmed';
COMMENT ON COLUMN "EmptyLegBooking"."boardingTime" IS 'Boarding time for flight confirmation';
