-- Drop overly permissive tenant policy
DROP POLICY IF EXISTS "Users can manage tenants" ON public.tenant;

-- Create proper tenant policies
CREATE POLICY "Users can view tenants in their properties"
ON public.tenant
FOR SELECT
USING (
  tenant_id IN (
    SELECT l.tenant_id
    FROM lease l
    JOIN unit u ON l.unit_id = u.unit_id
    JOIN property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tenants"
ON public.tenant
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update tenants in their properties"
ON public.tenant
FOR UPDATE
USING (
  tenant_id IN (
    SELECT l.tenant_id
    FROM lease l
    JOIN unit u ON l.unit_id = u.unit_id
    JOIN property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tenants in their properties"
ON public.tenant
FOR DELETE
USING (
  tenant_id IN (
    SELECT l.tenant_id
    FROM lease l
    JOIN unit u ON l.unit_id = u.unit_id
    JOIN property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);