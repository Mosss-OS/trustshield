-- =============== audit_log ===============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_owner_all" ON public.audit_log
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id, created_at DESC);

-- Function to log audit events (called from server functions)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details);
$$;