-- Add INSERT policies for admins to create profiles and tenants
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert tenants"
ON public.tenant
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tenants"
ON public.tenant
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));