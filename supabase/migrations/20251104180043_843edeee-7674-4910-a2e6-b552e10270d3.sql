-- Create audit logger function that captures database operations
CREATE OR REPLACE FUNCTION public.audit_logger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op TEXT;
  v_params JSONB;
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    v_op := 'INSERT';
    v_params := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_op := 'UPDATE';
    v_params := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_op := 'DELETE';
    v_params := to_jsonb(OLD);
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_log (
    actor,
    txid,
    correlation_id,
    scope,
    op,
    object_type,
    object_id,
    sql_statement,
    params,
    rows_affected,
    status
  ) VALUES (
    auth.uid(),
    txid_current(),
    gen_random_uuid(),
    TG_TABLE_NAME,
    v_op,
    TG_TABLE_NAME,
    COALESCE((to_jsonb(NEW)->>(TG_TABLE_NAME || '_id'))::uuid, (to_jsonb(OLD)->>(TG_TABLE_NAME || '_id'))::uuid),
    format('%s %s', v_op, TG_TABLE_NAME),
    v_params,
    1,
    'success'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for all main tables
CREATE TRIGGER audit_property_changes
AFTER INSERT OR UPDATE OR DELETE ON public.property
FOR EACH ROW EXECUTE FUNCTION public.audit_logger();

CREATE TRIGGER audit_unit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.unit
FOR EACH ROW EXECUTE FUNCTION public.audit_logger();

CREATE TRIGGER audit_tenant_changes
AFTER INSERT OR UPDATE OR DELETE ON public.tenant
FOR EACH ROW EXECUTE FUNCTION public.audit_logger();

CREATE TRIGGER audit_lease_changes
AFTER INSERT OR UPDATE OR DELETE ON public.lease
FOR EACH ROW EXECUTE FUNCTION public.audit_logger();

CREATE TRIGGER audit_payment_changes
AFTER INSERT OR UPDATE OR DELETE ON public.payment
FOR EACH ROW EXECUTE FUNCTION public.audit_logger();

CREATE TRIGGER audit_maintenance_changes
AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_request
FOR EACH ROW EXECUTE FUNCTION public.audit_logger();