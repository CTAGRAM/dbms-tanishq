-- Add INSERT policy for authenticated users to create properties
CREATE POLICY "Authenticated users can insert properties"
ON public.property
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);