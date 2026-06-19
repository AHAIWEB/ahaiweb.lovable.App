
-- 1. Role system
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','moderator','user'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Grant admin to existing owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('b4be5bc6-790d-4780-8341-66db301fb4c9', 'admin')
ON CONFLICT DO NOTHING;

-- 2. Tighten policies: replace "auth.uid() IS NOT NULL" with admin-only
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('categories','historical_events','quotes_pool','site_sections','rss_feeds',
                        'tags','districts','divisions','upazilas','unions','daily_content',
                        'post_categories','post_locations','post_tags')
      AND (qual ILIKE '%auth.uid() IS NOT NULL%' OR with_check ILIKE '%auth.uid() IS NOT NULL%')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', rec.policyname, rec.tablename);
  END LOOP;
END $$;

CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage historical_events" ON public.historical_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage quotes_pool" ON public.quotes_pool FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage site_sections" ON public.site_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage rss_feeds" ON public.rss_feeds FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage tags" ON public.tags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage districts" ON public.districts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage divisions" ON public.divisions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage upazilas" ON public.upazilas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage unions" ON public.unions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage daily_content" ON public.daily_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage post_categories" ON public.post_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage post_locations" ON public.post_locations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage post_tags" ON public.post_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Ebooks: add file_path, backfill
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS file_path text;
UPDATE public.ebooks
   SET file_path = COALESCE(file_path,
     CASE WHEN pdf_url LIKE '%/ebooks/%'
          THEN substring(pdf_url FROM '/ebooks/(.+)$')
          ELSE pdf_url END)
 WHERE file_path IS NULL;

-- 4. Storage policy: lock ebooks bucket reads to owner or public flag
DROP POLICY IF EXISTS "ebooks read all" ON storage.objects;
CREATE POLICY "ebooks read owner or public" ON storage.objects FOR SELECT
USING (
  bucket_id = 'ebooks' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.ebooks e
      WHERE e.is_public = true
        AND (e.file_path = storage.objects.name OR e.pdf_url LIKE '%' || storage.objects.name)
    )
  )
);
