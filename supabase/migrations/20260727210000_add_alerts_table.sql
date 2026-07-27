-- Enum: alert type
CREATE TYPE public.alert_type AS ENUM (
  'new_mention',
  'severity_change',
  'request_update',
  'brand_milestone'
);

-- =============== alerts ===============
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  alert_type public.alert_type NOT NULL,
  related_scan_result_id UUID REFERENCES public.screening_results(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_owner_all" ON public.alerts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_alerts_user ON public.alerts(user_id, created_at DESC);
CREATE INDEX idx_alerts_unread ON public.alerts(user_id, read) WHERE read = false;
