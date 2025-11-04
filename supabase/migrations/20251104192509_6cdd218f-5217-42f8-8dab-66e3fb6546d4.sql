-- Remove foreign key constraint from profiles table
-- Tenant profiles don't need to be auth users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;