-- Run this in Supabase SQL editor to add customer tracking

ALTER TABLE sales
ADD COLUMN customer_name TEXT;

-- Create an admin role functionality (Optional step for Admin Access setup)
-- ALTER TABLE auth.users ADD COLUMN role TEXT DEFAULT 'user';
