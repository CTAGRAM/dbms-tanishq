-- Phase 1: Fix existing data inconsistencies
-- Synchronize unit statuses with lease statuses

-- Update units with active leases to LEASED status
UPDATE public.unit
SET status = 'LEASED', updated_at = now()
WHERE unit_id IN (
  SELECT DISTINCT unit_id 
  FROM public.lease 
  WHERE status = 'active'
)
AND status != 'LEASED';

-- Update units without active leases to AVAILABLE status
UPDATE public.unit
SET status = 'AVAILABLE', updated_at = now()
WHERE unit_id NOT IN (
  SELECT DISTINCT unit_id 
  FROM public.lease 
  WHERE status = 'active'
)
AND status = 'LEASED';

-- Phase 3: Create trigger to prevent future inconsistencies
-- Function to sync unit status when lease changes
CREATE OR REPLACE FUNCTION public.sync_unit_status_on_lease_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When lease becomes active, set unit to LEASED
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'active' THEN
    UPDATE public.unit
    SET status = 'LEASED', updated_at = now()
    WHERE unit_id = NEW.unit_id;
    
    PERFORM log_operation(
      'trigger', 'UPDATE', 'unit', NEW.unit_id,
      'Unit status synced to LEASED on lease activation',
      jsonb_build_object('lease_id', NEW.lease_id),
      1, 'success', NULL, gen_random_uuid()
    );
  END IF;
  
  -- When lease becomes terminated/draft, check if unit should be AVAILABLE
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
    -- Only set to AVAILABLE if no other active leases exist for this unit
    IF NOT EXISTS (
      SELECT 1 FROM public.lease 
      WHERE unit_id = NEW.unit_id 
      AND status = 'active' 
      AND lease_id != NEW.lease_id
    ) THEN
      UPDATE public.unit
      SET status = 'AVAILABLE', updated_at = now()
      WHERE unit_id = NEW.unit_id;
      
      PERFORM log_operation(
        'trigger', 'UPDATE', 'unit', NEW.unit_id,
        'Unit status synced to AVAILABLE on lease termination',
        jsonb_build_object('lease_id', NEW.lease_id),
        1, 'success', NULL, gen_random_uuid()
      );
    END IF;
  END IF;
  
  -- When lease is deleted, check if unit should be AVAILABLE
  IF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lease 
      WHERE unit_id = OLD.unit_id 
      AND status = 'active' 
      AND lease_id != OLD.lease_id
    ) THEN
      UPDATE public.unit
      SET status = 'AVAILABLE', updated_at = now()
      WHERE unit_id = OLD.unit_id;
      
      PERFORM log_operation(
        'trigger', 'UPDATE', 'unit', OLD.unit_id,
        'Unit status synced to AVAILABLE on lease deletion',
        jsonb_build_object('lease_id', OLD.lease_id),
        1, 'success', NULL, gen_random_uuid()
      );
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_unit_lease_status_sync ON public.lease;
CREATE TRIGGER enforce_unit_lease_status_sync
AFTER INSERT OR UPDATE OR DELETE ON public.lease
FOR EACH ROW
EXECUTE FUNCTION public.sync_unit_status_on_lease_change();

-- Phase 7: Create data integrity view for monitoring
CREATE OR REPLACE VIEW public.lease_unit_status_mismatches AS
SELECT 
  l.lease_id,
  l.unit_id,
  u.name as unit_name,
  l.status as lease_status,
  u.status as unit_status,
  l.start_date,
  l.end_date,
  'Active lease but unit not LEASED' as issue_type
FROM public.lease l
JOIN public.unit u ON l.unit_id = u.unit_id
WHERE l.status = 'active' AND u.status != 'LEASED'

UNION ALL

SELECT 
  l.lease_id,
  l.unit_id,
  u.name as unit_name,
  l.status as lease_status,
  u.status as unit_status,
  l.start_date,
  l.end_date,
  'Unit LEASED but no active lease' as issue_type
FROM public.unit u
LEFT JOIN public.lease l ON u.unit_id = l.unit_id AND l.status = 'active'
WHERE u.status = 'LEASED' AND l.lease_id IS NULL;