-- Enum: request type
CREATE TYPE public.request_type AS ENUM ('dmca', 'defamation', 'gdpr', 'platform_report');

-- Enum: request status
CREATE TYPE public.request_status AS ENUM ('pending', 'submitted', 'resolved', 'denied');

-- =============== remediation_requests ===============
CREATE TABLE public.remediation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_result_id UUID NOT NULL REFERENCES public.screening_results(id) ON DELETE CASCADE,
  request_type public.request_type NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  request_body TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.remediation_requests TO authenticated;
GRANT ALL ON public.remediation_requests TO service_role;
ALTER TABLE public.remediation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "remediation_owner_all" ON public.remediation_requests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_remediation_user ON public.remediation_requests(user_id, created_at DESC);
CREATE INDEX idx_remediation_status ON public.remediation_requests(user_id, status);