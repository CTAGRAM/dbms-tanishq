-- Drop existing policies and create owner-based policies

-- PROPERTY TABLE
DROP POLICY IF EXISTS "Admins and owners can view properties" ON public.property;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.property;

CREATE POLICY "Users can view their own properties"
ON public.property
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can manage their own properties"
ON public.property
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- UNIT TABLE
DROP POLICY IF EXISTS "Admins and ops can manage units" ON public.unit;
DROP POLICY IF EXISTS "Authenticated users can view available units" ON public.unit;

CREATE POLICY "Users can view units in their properties"
ON public.unit
FOR SELECT
TO authenticated
USING (
  property_id IN (
    SELECT property_id FROM public.property WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage units in their properties"
ON public.unit
FOR ALL
TO authenticated
USING (
  property_id IN (
    SELECT property_id FROM public.property WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  property_id IN (
    SELECT property_id FROM public.property WHERE owner_id = auth.uid()
  )
);

-- TENANT TABLE
DROP POLICY IF EXISTS "Admins can insert tenants" ON public.tenant;
DROP POLICY IF EXISTS "Admins can update tenants" ON public.tenant;
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenant;
DROP POLICY IF EXISTS "Tenants can view their own data" ON public.tenant;

CREATE POLICY "Users can view tenants with leases in their properties"
ON public.tenant
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT l.tenant_id 
    FROM public.lease l
    JOIN public.unit u ON l.unit_id = u.unit_id
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage tenants"
ON public.tenant
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- LEASE TABLE
DROP POLICY IF EXISTS "Admins can manage leases" ON public.lease;
DROP POLICY IF EXISTS "Tenants can view their own leases" ON public.lease;

CREATE POLICY "Users can view leases in their properties"
ON public.lease
FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT u.unit_id
    FROM public.unit u
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage leases in their properties"
ON public.lease
FOR ALL
TO authenticated
USING (
  unit_id IN (
    SELECT u.unit_id
    FROM public.unit u
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
)
WITH CHECK (
  unit_id IN (
    SELECT u.unit_id
    FROM public.unit u
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

-- PAYMENT TABLE
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payment;
DROP POLICY IF EXISTS "Tenants can view their own payments" ON public.payment;

CREATE POLICY "Users can view payments for their properties"
ON public.payment
FOR SELECT
TO authenticated
USING (
  lease_id IN (
    SELECT l.lease_id
    FROM public.lease l
    JOIN public.unit u ON l.unit_id = u.unit_id
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage payments for their properties"
ON public.payment
FOR ALL
TO authenticated
USING (
  lease_id IN (
    SELECT l.lease_id
    FROM public.lease l
    JOIN public.unit u ON l.unit_id = u.unit_id
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
)
WITH CHECK (
  lease_id IN (
    SELECT l.lease_id
    FROM public.lease l
    JOIN public.unit u ON l.unit_id = u.unit_id
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

-- MAINTENANCE_REQUEST TABLE
DROP POLICY IF EXISTS "Admins and ops can manage maintenance" ON public.maintenance_request;
DROP POLICY IF EXISTS "Authenticated users can create maintenance requests" ON public.maintenance_request;
DROP POLICY IF EXISTS "Tenants can view and create requests for their units" ON public.maintenance_request;

CREATE POLICY "Users can view maintenance for their properties"
ON public.maintenance_request
FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT u.unit_id
    FROM public.unit u
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage maintenance for their properties"
ON public.maintenance_request
FOR ALL
TO authenticated
USING (
  unit_id IN (
    SELECT u.unit_id
    FROM public.unit u
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
)
WITH CHECK (
  unit_id IN (
    SELECT u.unit_id
    FROM public.unit u
    JOIN public.property p ON u.property_id = p.property_id
    WHERE p.owner_id = auth.uid()
  )
);