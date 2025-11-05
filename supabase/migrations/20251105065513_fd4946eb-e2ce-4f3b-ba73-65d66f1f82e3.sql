-- Create global search function for searching across all entities
CREATE OR REPLACE FUNCTION public.global_search(search_query TEXT, search_limit INT DEFAULT 20)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  title TEXT,
  subtitle TEXT,
  route TEXT,
  relevance INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  -- Search Properties
  SELECT 
    'property'::TEXT,
    p.property_id,
    p.address AS title,
    (p.city || ', ' || p.state) AS subtitle,
    '/properties'::TEXT AS route,
    CASE 
      WHEN p.address ILIKE '%' || search_query || '%' THEN 3
      WHEN p.city ILIKE '%' || search_query || '%' THEN 2
      ELSE 1
    END AS relevance
  FROM public.property p
  WHERE 
    p.owner_id = auth.uid() AND
    (
      p.address ILIKE '%' || search_query || '%' OR
      p.city ILIKE '%' || search_query || '%' OR
      p.state ILIKE '%' || search_query || '%' OR
      p.zip_code ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search Tenants
  SELECT 
    'tenant'::TEXT,
    t.tenant_id,
    prof.full_name AS title,
    COALESCE(prof.email, 'No email') AS subtitle,
    '/tenants'::TEXT AS route,
    CASE 
      WHEN prof.full_name ILIKE '%' || search_query || '%' THEN 3
      WHEN prof.email ILIKE '%' || search_query || '%' THEN 2
      ELSE 1
    END AS relevance
  FROM public.tenant t
  JOIN public.profiles prof ON t.profile_id = prof.id
  WHERE 
    prof.full_name ILIKE '%' || search_query || '%' OR
    prof.email ILIKE '%' || search_query || '%' OR
    prof.phone ILIKE '%' || search_query || '%'
  
  UNION ALL
  
  -- Search Leases
  SELECT 
    'lease'::TEXT,
    l.lease_id,
    ('Lease: ' || u.name) AS title,
    (prof.full_name || ' - $' || l.monthly_rent || '/mo') AS subtitle,
    '/leases'::TEXT AS route,
    CASE 
      WHEN u.name ILIKE '%' || search_query || '%' THEN 3
      WHEN prof.full_name ILIKE '%' || search_query || '%' THEN 2
      ELSE 1
    END AS relevance
  FROM public.lease l
  JOIN public.unit u ON l.unit_id = u.unit_id
  JOIN public.property p ON u.property_id = p.property_id
  JOIN public.tenant t ON l.tenant_id = t.tenant_id
  JOIN public.profiles prof ON t.profile_id = prof.id
  WHERE 
    p.owner_id = auth.uid() AND
    (
      u.name ILIKE '%' || search_query || '%' OR
      prof.full_name ILIKE '%' || search_query || '%' OR
      CAST(l.monthly_rent AS TEXT) ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search Payments
  SELECT 
    'payment'::TEXT,
    pay.payment_id,
    ('Payment: $' || pay.amount) AS title,
    (prof.full_name || ' - Due: ' || TO_CHAR(pay.due_date, 'MM/DD/YYYY')) AS subtitle,
    '/payments'::TEXT AS route,
    CASE 
      WHEN CAST(pay.amount AS TEXT) ILIKE '%' || search_query || '%' THEN 3
      WHEN prof.full_name ILIKE '%' || search_query || '%' THEN 2
      ELSE 1
    END AS relevance
  FROM public.payment pay
  JOIN public.lease l ON pay.lease_id = l.lease_id
  JOIN public.unit u ON l.unit_id = u.unit_id
  JOIN public.property p ON u.property_id = p.property_id
  JOIN public.tenant t ON l.tenant_id = t.tenant_id
  JOIN public.profiles prof ON t.profile_id = prof.id
  WHERE 
    p.owner_id = auth.uid() AND
    (
      CAST(pay.amount AS TEXT) ILIKE '%' || search_query || '%' OR
      prof.full_name ILIKE '%' || search_query || '%' OR
      TO_CHAR(pay.due_date, 'MM/DD/YYYY') ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search Maintenance Requests
  SELECT 
    'maintenance'::TEXT,
    mr.request_id,
    mr.description AS title,
    (u.name || ' - ' || mr.status::TEXT) AS subtitle,
    '/maintenance'::TEXT AS route,
    CASE 
      WHEN mr.description ILIKE '%' || search_query || '%' THEN 3
      WHEN u.name ILIKE '%' || search_query || '%' THEN 2
      ELSE 1
    END AS relevance
  FROM public.maintenance_request mr
  JOIN public.unit u ON mr.unit_id = u.unit_id
  JOIN public.property p ON u.property_id = p.property_id
  WHERE 
    p.owner_id = auth.uid() AND
    (
      mr.description ILIKE '%' || search_query || '%' OR
      u.name ILIKE '%' || search_query || '%' OR
      mr.status::TEXT ILIKE '%' || search_query || '%' OR
      mr.category::TEXT ILIKE '%' || search_query || '%'
    )
  
  ORDER BY relevance DESC, title ASC
  LIMIT search_limit;
END;
$$;