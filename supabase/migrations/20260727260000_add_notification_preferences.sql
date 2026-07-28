-- =============== notification_preferences ===============
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_high_severity BOOLEAN NOT NULL DEFAULT true,
  email_medium_severity BOOLEAN NOT NULL DEFAULT true,
  email_low_severity BOOLEAN NOT NULL DEFAULT false,
  email_remediation_updates BOOLEAN NOT NULL DEFAULT true,
  email_weekly_summary BOOLEAN NOT NULL DEFAULT true,
  email_brand_health BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_prefs_owner_all" ON public.notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);