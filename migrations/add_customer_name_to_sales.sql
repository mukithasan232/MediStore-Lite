-- AddCustomerNameToSales migration
-- Adds the customer_name column to the sales table if it doesn't exist

-- Check if column exists, if not add it
ALTER TABLE "sales" 
ADD COLUMN IF NOT EXISTS "customer_name" VARCHAR(255) DEFAULT 'Walk-in Customer';
