
-- 1. site_settings singleton-style key/value table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
CREATE POLICY "Public can read site_settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;
CREATE POLICY "Admins manage site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed default branding row
INSERT INTO public.site_settings (key, value) VALUES
  ('branding', '{"logo_url":"","header_bg":"","footer_bg":"","footer_text":"© AHAiWEB"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Tighten dictionary_words: remove any permissive auth-write policy, keep admin-only ALL
DROP POLICY IF EXISTS "Authenticated users can manage dictionary" ON public.dictionary_words;
DROP POLICY IF EXISTS "Authenticated write dictionary" ON public.dictionary_words;
DROP POLICY IF EXISTS "Anyone can insert dictionary" ON public.dictionary_words;
DROP POLICY IF EXISTS "Admins manage dictionary" ON public.dictionary_words;
CREATE POLICY "Admins manage dictionary" ON public.dictionary_words
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Tighten media storage bucket: uploads must be into user's own folder
DROP POLICY IF EXISTS "Auth users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete own media" ON storage.objects;

CREATE POLICY "Auth users can upload media to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth users can update own media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth users can delete own media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
