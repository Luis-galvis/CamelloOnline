-- ==============================================================================
-- CAMELLO ONLINE - MIGRACIÓN: EMPLEADORES + ENGAGEMENT
-- Favoritos, Newsletter, y publicación de vacantes por empresas.
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor. Idempotente.
-- NOTA: job_posts.id es UUID (no TEXT).
-- ==============================================================================

-- 1. FAVORITOS (guardar vacantes)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT saved_jobs_user_job_unique UNIQUE (user_id, job_post_id)
);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users manage own saved jobs"
    ON public.saved_jobs FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.saved_jobs TO service_role;
GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);

-- 2. NEWSLETTER (suscripción semanal "los mejores camellos")
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anon can subscribe to newsletter"
    ON public.newsletter_subscribers FOR INSERT TO anon
    WITH CHECK (true);
GRANT ALL ON public.newsletter_subscribers TO service_role;
GRANT INSERT ON public.newsletter_subscribers TO anon;

-- 3. EMPRESAS: campos de perfil de empleador (para registro/publicación)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS size TEXT;

-- 4. VACANTES PUBLICADAS POR EMPRESAS
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS contact_email TEXT;

DROP POLICY IF EXISTS "Recruiters can insert job posts" ON public.job_posts;
CREATE POLICY "Recruiters can insert job posts"
    ON public.job_posts FOR INSERT TO authenticated
    WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS "Recruiters can update own job posts" ON public.job_posts;
CREATE POLICY "Recruiters can update own job posts"
    ON public.job_posts FOR UPDATE TO authenticated
    USING (recruiter_id = auth.uid())
    WITH CHECK (recruiter_id = auth.uid());

-- 5. Función para registrar empresa + publicar vacante de una sola vez (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.publish_company_job(
    p_company_name text,
    p_company_website text,
    p_contact_email text,
    p_title text,
    p_description text,
    p_work_modality text,
    p_location_city text,
    p_salary_min_usd numeric,
    p_salary_max_usd numeric,
    p_currency text,
    p_is_zero_experience boolean,
    p_english_required text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_company_id uuid;
    v_slug text;
    v_job_id uuid;
BEGIN
    v_slug := lower(regexp_replace(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));

    INSERT INTO public.companies (name, slug, website, contact_email, is_verified, is_auto_ingested, country_code, city)
    VALUES (p_company_name, v_slug, p_company_website, p_contact_email, false, false, 'CO', p_location_city)
    ON CONFLICT (slug) DO UPDATE
        SET contact_email = COALESCE(EXCLUDED.contact_email, public.companies.contact_email),
            website = COALESCE(NULLIF(EXCLUDED.website, ''), public.companies.website)
    RETURNING id INTO v_company_id;

    INSERT INTO public.job_posts (
        id, company_id, title, slug, description, work_modality,
        location_country, location_city, salary_min_usd, salary_max_usd, currency,
        seniority_required, english_required, max_years_experience_required,
        is_zero_experience, status, is_auto_ingested, source_ats, contact_email, is_claimed
    )
    VALUES (
        gen_random_uuid(), v_company_id, p_title, gen_random_uuid()::text, p_description, p_work_modality,
        'CO', p_location_city, p_salary_min_usd, p_salary_max_usd, p_currency,
        CASE WHEN p_is_zero_experience THEN 'trainee' ELSE 'junior' END,
        COALESCE(p_english_required, 'no_english'), CASE WHEN p_is_zero_experience THEN 0 ELSE 1 END,
        p_is_zero_experience, 'active', false, 'manual', p_contact_email, false
    )
    RETURNING id INTO v_job_id;

    RETURN jsonb_build_object('company_id', v_company_id, 'job_id', v_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_company_job(text, text, text, text, text, text, text, numeric, numeric, text, boolean, text) TO anon;

-- Recargar caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
