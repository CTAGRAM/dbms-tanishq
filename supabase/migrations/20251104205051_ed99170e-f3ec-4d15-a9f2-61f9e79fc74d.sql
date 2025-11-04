-- ============================================================================
-- DBMS Lab Database Migrations - Units I-V
-- ============================================================================

-- ----------------------------------------------------------------------------
-- UNIT I: Indexes for Performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lease_tenant_status ON public.lease(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_lease_status ON public.payment(lease_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status_priority ON public.maintenance_request(status, priority);
CREATE INDEX IF NOT EXISTS idx_unit_property_status ON public.unit(property_id, status);
CREATE INDEX IF NOT EXISTS idx_property_owner ON public.property(owner_id);

-- ----------------------------------------------------------------------------
-- UNIT IV: Role-Scoped Security Views
-- ----------------------------------------------------------------------------

-- Tenant view - shows only their leases
CREATE OR REPLACE VIEW public.tenant_lease_view AS 
SELECT 
  l.lease_id, 
  l.start_date, 
  l.end_date, 
  l.monthly_rent,
  l.status,
  u.name as unit_name, 
  u.bedrooms,
  u.bathrooms,
  p.address,
  p.city,
  p.state
FROM public.lease l
JOIN public.unit u ON l.unit_id = u.unit_id
JOIN public.property p ON u.property_id = p.property_id
JOIN public.tenant t ON l.tenant_id = t.tenant_id
WHERE t.profile_id = auth.uid();

-- Owner view - shows only their properties
CREATE OR REPLACE VIEW public.owner_property_view AS
SELECT 
  property_id, 
  address, 
  city, 
  state, 
  zip_code,
  type, 
  status,
  created_at
FROM public.property
WHERE owner_id = auth.uid();

-- Operations maintenance view - shows maintenance for owner's properties
CREATE OR REPLACE VIEW public.ops_maintenance_view AS
SELECT 
  mr.request_id,
  mr.description,
  mr.category,
  mr.priority,
  mr.status,
  mr.estimated_cost,
  mr.actual_cost,
  mr.created_at,
  mr.completed_at,
  u.name as unit_name, 
  p.address as property_address,
  p.city,
  p.state
FROM public.maintenance_request mr
JOIN public.unit u ON mr.unit_id = u.unit_id
JOIN public.property p ON u.property_id = p.property_id
WHERE p.owner_id = auth.uid();

-- ----------------------------------------------------------------------------
-- UNIT IV: Materialized View for Reporting
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.monthly_revenue_by_property AS
SELECT 
  p.property_id, 
  p.address,
  p.city,
  p.state,
  DATE_TRUNC('month', pay.paid_at) as month,
  SUM(pay.amount) as total_revenue,
  COUNT(DISTINCT l.lease_id) as lease_count,
  AVG(pay.amount) as avg_payment
FROM public.property p
JOIN public.unit u ON p.property_id = u.property_id
JOIN public.lease l ON u.unit_id = l.unit_id
JOIN public.payment pay ON l.lease_id = pay.lease_id
WHERE pay.status = 'paid' AND pay.paid_at IS NOT NULL
GROUP BY p.property_id, p.address, p.city, p.state, DATE_TRUNC('month', pay.paid_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_revenue_unique 
  ON public.monthly_revenue_by_property(property_id, month);

-- ----------------------------------------------------------------------------
-- UNIT IV: Scalar Function for Late Fee Calculation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_late_fee(due_date DATE, amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF CURRENT_DATE > due_date + INTERVAL '5 days' THEN
    RETURN amount * 0.05;
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- UNIT IV: Cursor-Based Procedure for Batch Processing
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_overdue_payments()
RETURNS TABLE(payment_id UUID, late_fee NUMERIC, status TEXT) AS $$
DECLARE
  payment_cursor CURSOR FOR 
    SELECT p.payment_id, p.amount, p.due_date
    FROM public.payment p
    WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE
    ORDER BY p.due_date;
  payment_rec RECORD;
  calculated_fee NUMERIC;
  v_correlation_id UUID;
BEGIN
  v_correlation_id := gen_random_uuid();
  
  PERFORM public.log_operation(
    'batch', 'BEGIN', 'payment', NULL,
    'Starting batch overdue payment processing',
    NULL, NULL, 'pending', NULL, v_correlation_id
  );
  
  OPEN payment_cursor;
  LOOP
    FETCH payment_cursor INTO payment_rec;
    EXIT WHEN NOT FOUND;
    
    BEGIN
      calculated_fee := public.calculate_late_fee(payment_rec.due_date, payment_rec.amount);
      
      UPDATE public.payment 
      SET late_fee = calculated_fee,
          updated_at = now()
      WHERE payment.payment_id = payment_rec.payment_id;
      
      PERFORM public.log_operation(
        'batch', 'UPDATE', 'payment', payment_rec.payment_id,
        'Applied late fee',
        jsonb_build_object('late_fee', calculated_fee),
        1, 'success', NULL, v_correlation_id
      );
      
      payment_id := payment_rec.payment_id;
      late_fee := calculated_fee;
      status := 'success';
      RETURN NEXT;
      
    EXCEPTION
      WHEN OTHERS THEN
        PERFORM public.log_operation(
          'batch', 'ERROR', 'payment', payment_rec.payment_id,
          'Failed to apply late fee',
          NULL, 0, 'error', SQLERRM, v_correlation_id
        );
        
        payment_id := payment_rec.payment_id;
        late_fee := 0;
        status := 'error: ' || SQLERRM;
        RETURN NEXT;
    END;
  END LOOP;
  CLOSE payment_cursor;
  
  PERFORM public.log_operation(
    'batch', 'COMMIT', 'payment', NULL,
    'Batch processing completed',
    NULL, NULL, 'success', NULL, v_correlation_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    IF payment_cursor%ISOPEN THEN
      CLOSE payment_cursor;
    END IF;
    
    PERFORM public.log_operation(
      'batch', 'ROLLBACK', 'payment', NULL,
      'Batch processing failed',
      NULL, NULL, 'error', SQLERRM, v_correlation_id
    );
    
    RAISE NOTICE 'Error processing payments: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- UNIT IV: BEFORE Trigger for Validation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_lease_dates()
RETURNS TRIGGER AS $$
DECLARE
  v_correlation_id UUID := gen_random_uuid();
BEGIN
  PERFORM public.log_operation(
    'validation', 'BEFORE_INSERT', 'lease', NEW.lease_id,
    'Validating lease dates',
    jsonb_build_object('start_date', NEW.start_date, 'end_date', NEW.end_date),
    0, 'pending', NULL, v_correlation_id
  );
  
  IF NEW.end_date <= NEW.start_date THEN
    PERFORM public.log_operation(
      'validation', 'BEFORE_INSERT', 'lease', NEW.lease_id,
      'Validation failed: End date must be after start date',
      NULL, 0, 'error', 'Invalid date range', v_correlation_id
    );
    RAISE EXCEPTION 'End date must be after start date';
  END IF;
  
  IF NEW.monthly_rent <= 0 THEN
    PERFORM public.log_operation(
      'validation', 'BEFORE_INSERT', 'lease', NEW.lease_id,
      'Validation failed: Monthly rent must be positive',
      NULL, 0, 'error', 'Invalid rent amount', v_correlation_id
    );
    RAISE EXCEPTION 'Monthly rent must be positive';
  END IF;
  
  PERFORM public.log_operation(
    'validation', 'BEFORE_INSERT', 'lease', NEW.lease_id,
    'Validation passed',
    NULL, 1, 'success', NULL, v_correlation_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_lease_dates ON public.lease;
CREATE TRIGGER trg_validate_lease_dates
  BEFORE INSERT OR UPDATE ON public.lease
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lease_dates();

-- ----------------------------------------------------------------------------
-- UNIT IV: AFTER Trigger for Notifications
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_maintenance_created()
RETURNS TRIGGER AS $$
DECLARE
  v_correlation_id UUID := gen_random_uuid();
BEGIN
  PERFORM public.log_operation(
    'notification', 'AFTER_INSERT', 'maintenance_request', NEW.request_id,
    'New maintenance request notification',
    jsonb_build_object(
      'priority', NEW.priority, 
      'category', NEW.category,
      'description', LEFT(NEW.description, 50)
    ),
    1, 'success', NULL, v_correlation_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_maintenance ON public.maintenance_request;
CREATE TRIGGER trg_notify_maintenance
  AFTER INSERT ON public.maintenance_request
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_maintenance_created();

-- ----------------------------------------------------------------------------
-- UNIT V: Helper function for isolation level demos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_isolation_level()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('transaction_isolation');
END;
$$ LANGUAGE plpgsql;