-- Create custom enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'tenant', 'ops');
CREATE TYPE public.property_type AS ENUM ('residential', 'commercial', 'industrial');
CREATE TYPE public.property_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE public.unit_status AS ENUM ('AVAILABLE', 'HOLD', 'LEASED', 'INACTIVE');
CREATE TYPE public.lease_status AS ENUM ('draft', 'active', 'ended', 'terminated');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'online', 'check');
CREATE TYPE public.maintenance_category AS ENUM ('plumbing', 'electrical', 'hvac', 'general');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'cancelled');

-- Create profiles table (for auth users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create properties table
CREATE TABLE public.property (
  property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  type public.property_type NOT NULL,
  status public.property_status DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create units table
CREATE TABLE public.unit (
  unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.property(property_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rent_amount NUMERIC(12,2) NOT NULL CHECK (rent_amount >= 0),
  bedrooms INT,
  bathrooms NUMERIC(3,1),
  square_feet INT,
  status public.unit_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenants table (additional tenant info beyond profile)
CREATE TABLE public.tenant (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  occupation TEXT,
  annual_income NUMERIC(12,2),
  credit_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create leases table
CREATE TABLE public.lease (
  lease_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.unit(unit_id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  monthly_rent NUMERIC(12,2) NOT NULL CHECK (monthly_rent >= 0),
  deposit NUMERIC(12,2) DEFAULT 0,
  status public.lease_status DEFAULT 'draft',
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payment (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.lease(lease_id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK(amount >= 0),
  due_date DATE NOT NULL,
  method public.payment_method,
  status public.payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  late_fee NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create maintenance_request table
CREATE TABLE public.maintenance_request (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.unit(unit_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenant(tenant_id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category public.maintenance_category NOT NULL,
  description TEXT NOT NULL,
  priority INT NOT NULL CHECK(priority BETWEEN 1 AND 5) DEFAULT 3,
  status public.maintenance_status DEFAULT 'open',
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create holds table
CREATE TABLE public.hold (
  hold_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.unit(unit_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_log table for Operations Console
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor UUID REFERENCES public.profiles(id),
  txid BIGINT,
  correlation_id UUID,
  scope TEXT NOT NULL,
  op TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id UUID,
  sql_statement TEXT,
  params JSONB,
  rows_affected INT,
  duration_ms INT,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_property_owner ON public.property(owner_id);
CREATE INDEX idx_property_status ON public.property(status);
CREATE INDEX idx_unit_property ON public.unit(property_id);
CREATE INDEX idx_unit_status ON public.unit(status);
CREATE INDEX idx_tenant_profile ON public.tenant(profile_id);
CREATE INDEX idx_lease_unit ON public.lease(unit_id);
CREATE INDEX idx_lease_tenant ON public.lease(tenant_id);
CREATE INDEX idx_lease_status ON public.lease(tenant_id, status);
CREATE INDEX idx_payment_lease ON public.payment(lease_id);
CREATE INDEX idx_payment_status ON public.payment(lease_id, status);
CREATE INDEX idx_maintenance_unit ON public.maintenance_request(unit_id);
CREATE INDEX idx_maintenance_status_priority ON public.maintenance_request(status, priority);
CREATE INDEX idx_hold_unit ON public.hold(unit_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_correlation ON public.audit_log(correlation_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hold ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for properties
CREATE POLICY "Admins and owners can view properties"
  ON public.property FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'owner') OR
    owner_id = auth.uid()
  );

CREATE POLICY "Admins can manage properties"
  ON public.property FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for units
CREATE POLICY "Authenticated users can view available units"
  ON public.unit FOR SELECT
  USING (true);

CREATE POLICY "Admins and ops can manage units"
  ON public.unit FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ops')
  );

-- RLS Policies for tenants
CREATE POLICY "Tenants can view their own data"
  ON public.tenant FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all tenants"
  ON public.tenant FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leases
CREATE POLICY "Tenants can view their own leases"
  ON public.lease FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admins can manage leases"
  ON public.lease FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payments
CREATE POLICY "Tenants can view their own payments"
  ON public.payment FOR SELECT
  USING (
    lease_id IN (
      SELECT lease_id FROM public.lease 
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.tenant WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage payments"
  ON public.payment FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for maintenance
CREATE POLICY "Tenants can view and create requests for their units"
  ON public.maintenance_request FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant WHERE profile_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ops')
  );

CREATE POLICY "Authenticated users can create maintenance requests"
  ON public.maintenance_request FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and ops can manage maintenance"
  ON public.maintenance_request FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ops')
  );

-- RLS Policies for audit_log
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_updated_at
  BEFORE UPDATE ON public.property
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unit_updated_at
  BEFORE UPDATE ON public.unit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_updated_at
  BEFORE UPDATE ON public.tenant
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lease_updated_at
  BEFORE UPDATE ON public.lease
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_updated_at
  BEFORE UPDATE ON public.payment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance_request
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION public.log_operation(
  p_scope TEXT,
  p_op TEXT,
  p_object_type TEXT,
  p_object_id UUID,
  p_sql TEXT DEFAULT NULL,
  p_params JSONB DEFAULT NULL,
  p_rows_affected INT DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id BIGINT;
BEGIN
  INSERT INTO public.audit_log (
    actor, txid, correlation_id, scope, op, object_type, object_id,
    sql_statement, params, rows_affected, status, error
  ) VALUES (
    auth.uid(),
    txid_current(),
    p_correlation_id,
    p_scope,
    p_op,
    p_object_type,
    p_object_id,
    p_sql,
    p_params,
    p_rows_affected,
    p_status,
    p_error
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to place a hold on a unit
CREATE OR REPLACE FUNCTION public.sp_place_hold(
  p_unit_id UUID,
  p_user_id UUID,
  p_minutes INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correlation_id UUID := gen_random_uuid();
  v_unit_status unit_status;
  v_hold_id UUID;
BEGIN
  -- Log transaction start
  PERFORM public.log_operation('transaction', 'BEGIN', 'hold', NULL, NULL, 
    jsonb_build_object('unit_id', p_unit_id, 'user_id', p_user_id, 'minutes', p_minutes),
    NULL, 'pending', NULL, v_correlation_id);

  -- Lock the unit row
  SELECT status INTO v_unit_status FROM public.unit WHERE unit_id = p_unit_id FOR UPDATE;
  
  -- Check if unit is available
  IF v_unit_status IS NULL THEN
    PERFORM public.log_operation('transaction', 'ROLLBACK', 'hold', NULL, NULL, NULL, NULL, 'error', 'Unit not found', v_correlation_id);
    RAISE EXCEPTION 'Unit not found';
  END IF;
  
  IF v_unit_status != 'AVAILABLE' THEN
    PERFORM public.log_operation('transaction', 'ROLLBACK', 'hold', NULL, NULL, NULL, NULL, 'error', 'Unit not available', v_correlation_id);
    RAISE EXCEPTION 'Unit is not available for hold';
  END IF;
  
  -- Create hold
  INSERT INTO public.hold (unit_id, user_id, expires_at)
  VALUES (p_unit_id, p_user_id, now() + (p_minutes || ' minutes')::INTERVAL)
  RETURNING hold_id INTO v_hold_id;
  
  PERFORM public.log_operation('hold', 'INSERT', 'hold', v_hold_id, 
    'INSERT INTO hold', jsonb_build_object('unit_id', p_unit_id), 1, 'success', NULL, v_correlation_id);
  
  -- Update unit status
  UPDATE public.unit SET status = 'HOLD', updated_at = now() WHERE unit_id = p_unit_id;
  
  PERFORM public.log_operation('hold', 'UPDATE', 'unit', p_unit_id,
    'UPDATE unit SET status = HOLD', NULL, 1, 'success', NULL, v_correlation_id);
  
  -- Log transaction commit
  PERFORM public.log_operation('transaction', 'COMMIT', 'hold', v_hold_id, NULL, NULL, NULL, 'success', NULL, v_correlation_id);
  
  RETURN jsonb_build_object('hold_id', v_hold_id, 'expires_at', now() + (p_minutes || ' minutes')::INTERVAL);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_operation('transaction', 'ROLLBACK', 'hold', NULL, NULL, NULL, NULL, 'error', SQLERRM, v_correlation_id);
    RAISE;
END;
$$;

-- Function to confirm a lease
CREATE OR REPLACE FUNCTION public.sp_confirm_lease(
  p_unit_id UUID,
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_deposit NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correlation_id UUID := gen_random_uuid();
  v_lease_id UUID;
  v_monthly_rent NUMERIC;
  v_payment_date DATE;
  v_months INT;
BEGIN
  -- Log transaction start
  PERFORM public.log_operation('transaction', 'BEGIN', 'lease', NULL, NULL,
    jsonb_build_object('unit_id', p_unit_id, 'tenant_id', p_tenant_id),
    NULL, 'pending', NULL, v_correlation_id);
  
  -- Get unit rent amount
  SELECT rent_amount INTO v_monthly_rent FROM public.unit WHERE unit_id = p_unit_id;
  
  -- Create lease
  INSERT INTO public.lease (unit_id, tenant_id, start_date, end_date, monthly_rent, deposit, status)
  VALUES (p_unit_id, p_tenant_id, p_start_date, p_end_date, v_monthly_rent, p_deposit, 'active')
  RETURNING lease_id INTO v_lease_id;
  
  PERFORM public.log_operation('lease', 'INSERT', 'lease', v_lease_id,
    'INSERT INTO lease', jsonb_build_object('monthly_rent', v_monthly_rent), 1, 'success', NULL, v_correlation_id);
  
  -- Update unit to LEASED
  UPDATE public.unit SET status = 'LEASED', updated_at = now() WHERE unit_id = p_unit_id;
  
  PERFORM public.log_operation('lease', 'UPDATE', 'unit', p_unit_id,
    'UPDATE unit SET status = LEASED', NULL, 1, 'success', NULL, v_correlation_id);
  
  -- Generate payment schedule
  v_months := EXTRACT(YEAR FROM AGE(p_end_date, p_start_date)) * 12 + 
              EXTRACT(MONTH FROM AGE(p_end_date, p_start_date));
  
  FOR i IN 0..v_months LOOP
    v_payment_date := p_start_date + (i || ' months')::INTERVAL;
    INSERT INTO public.payment (lease_id, amount, due_date, status)
    VALUES (v_lease_id, v_monthly_rent, v_payment_date, 'pending');
  END LOOP;
  
  PERFORM public.log_operation('lease', 'INSERT', 'payment', v_lease_id,
    'INSERT INTO payment (schedule)', jsonb_build_object('count', v_months + 1),
    v_months + 1, 'success', NULL, v_correlation_id);
  
  -- Log transaction commit
  PERFORM public.log_operation('transaction', 'COMMIT', 'lease', v_lease_id, NULL, NULL, NULL, 'success', NULL, v_correlation_id);
  
  RETURN jsonb_build_object('lease_id', v_lease_id, 'payments_created', v_months + 1);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_operation('transaction', 'ROLLBACK', 'lease', NULL, NULL, NULL, NULL, 'error', SQLERRM, v_correlation_id);
    RAISE;
END;
$$;

-- Function to post a payment
CREATE OR REPLACE FUNCTION public.sp_post_payment(
  p_payment_id UUID,
  p_amount NUMERIC,
  p_method payment_method
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correlation_id UUID := gen_random_uuid();
  v_due_date DATE;
  v_late_fee NUMERIC := 0;
BEGIN
  PERFORM public.log_operation('transaction', 'BEGIN', 'payment', p_payment_id, NULL,
    jsonb_build_object('amount', p_amount, 'method', p_method),
    NULL, 'pending', NULL, v_correlation_id);
  
  -- Get payment due date
  SELECT due_date INTO v_due_date FROM public.payment WHERE payment_id = p_payment_id;
  
  -- Calculate late fee (5% if overdue by more than 5 days)
  IF CURRENT_DATE > v_due_date + INTERVAL '5 days' THEN
    v_late_fee := p_amount * 0.05;
  END IF;
  
  -- Update payment
  UPDATE public.payment 
  SET amount = p_amount, 
      method = p_method,
      late_fee = v_late_fee,
      status = 'paid',
      paid_at = now(),
      updated_at = now()
  WHERE payment_id = p_payment_id;
  
  PERFORM public.log_operation('payment', 'UPDATE', 'payment', p_payment_id,
    'UPDATE payment SET status = paid',
    jsonb_build_object('late_fee', v_late_fee),
    1, 'success', NULL, v_correlation_id);
  
  PERFORM public.log_operation('transaction', 'COMMIT', 'payment', p_payment_id, NULL, NULL, NULL, 'success', NULL, v_correlation_id);
  
  RETURN jsonb_build_object('payment_id', p_payment_id, 'late_fee', v_late_fee);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_operation('transaction', 'ROLLBACK', 'payment', p_payment_id, NULL, NULL, NULL, 'error', SQLERRM, v_correlation_id);
    RAISE;
END;
$$;

-- Enable realtime for audit_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;