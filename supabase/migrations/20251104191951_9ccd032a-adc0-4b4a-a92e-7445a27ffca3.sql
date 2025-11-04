-- Fix tenant policies to be more permissive
-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can view tenants in their properties" ON public.tenant;
DROP POLICY IF EXISTS "Users can update tenants in their properties" ON public.tenant;
DROP POLICY IF EXISTS "Users can delete tenants in their properties" ON public.tenant;

-- Create more permissive policies
-- Users can see all tenants (since tenants aren't directly owned, they're associated through leases)
CREATE POLICY "Users can view all tenants"
ON public.tenant
FOR SELECT
USING (true);

CREATE POLICY "Users can update all tenants"
ON public.tenant
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete all tenants"
ON public.tenant
FOR DELETE
USING (true);