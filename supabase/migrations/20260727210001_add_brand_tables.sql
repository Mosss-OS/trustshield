-- Enum: content type
CREATE TYPE public.content_type AS ENUM ('post', 'caption', 'script', 'bio');

-- Enum: content status
CREATE TYPE public.content_status AS ENUM ('draft', 'scheduled', 'published');

-- =============== brand_content ===============
CREATE TABLE public.brand_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  content_type public.content_type NOT NULL,
  content_text TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_content TO authenticated;
GRANT ALL ON public.brand_content TO service_role;
ALTER TABLE public.brand_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_content_owner_all" ON public.brand_content
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_brand_content_user ON public.brand_content(user_id, created_at DESC);
CREATE INDEX idx_brand_content_status ON public.brand_content(user_id, status) WHERE status IN ('scheduled', 'published');

-- =============== brand_health_scores ===============
CREATE TABLE public.brand_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  breakdown JSONB,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.brand_health_scores TO authenticated;
GRANT ALL ON public.brand_health_scores TO service_role;
ALTER TABLE public.brand_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_scores_owner_all" ON public.brand_health_scores
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_health_scores_user ON public.brand_health_scores(user_id, computed_at DESC);

-- =============== trigger: updated_at for brand_content ===============
CREATE TRIGGER trg_brand_content_updated_at BEFORE UPDATE ON public.brand_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();