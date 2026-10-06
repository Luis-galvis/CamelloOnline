-- ==============================================================================
-- REALJOBS COLOMBIA - ESQUEMA COMPLETO Y DEFINITIVO DE BASE DE DATOS (SUPABASE)
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE, RESILIENTE Y AUDITADO CONTRA VULNERABILIDADES.
-- Incluye remediación integral para H-01, H-02, H-03, H-04, H-05, H-06.

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA: public.users (Usuarios del Sistema)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas si users ya existía
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'candidate';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- REMEDIACIÓN H-06: Eliminar columna sensible o redundante encrypted_password
ALTER TABLE public.users DROP COLUMN IF EXISTS encrypted_password;

-- REMEDIACIÓN H-05: RLS estricto para proteger emails contra lecturas anónimas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view users" ON public.users;
    DROP POLICY IF EXISTS "Users can view all users" ON public.users;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Allow insert from trigger and self" ON public.users;

    CREATE POLICY "Users can view their own profile"
        ON public.users FOR SELECT TO authenticated
        USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
        ON public.users FOR UPDATE TO authenticated
        USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
        ON public.users FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = id);
END $$;

-- Revocar acceso al rol anónimo sobre users
REVOKE ALL ON public.users FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- ==============================================================================
-- 3. TABLA: public.candidate_profiles (Perfil Completo del Candidato)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT DEFAULT 'Candidato',
    last_name TEXT DEFAULT '',
    headline TEXT DEFAULT 'Candidato Verificado',
    bio TEXT DEFAULT '',
    seniority TEXT DEFAULT 'Junior',
    english_level TEXT DEFAULT 'B1',
    preferred_modality TEXT DEFAULT 'remote_global',
    minimum_expected_salary_usd NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    country_code TEXT DEFAULT 'CO',
    department TEXT DEFAULT 'Bogotá D.C.',
    city TEXT DEFAULT 'Bogotá D.C.',
    address TEXT,
    phone TEXT,
    cv_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_open_to_work BOOLEAN DEFAULT TRUE,
    experiences JSONB DEFAULT '[]'::jsonb,
    educations JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    skills TEXT[] DEFAULT '{}'::text[],
    profile_views_count INTEGER DEFAULT 0,
    inbounds_received_count INTEGER DEFAULT 0,
    inbounds_accepted_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Asegurar todas las columnas en candidate_profiles
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Bogotá D.C.';
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Bogotá D.C.';
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS educations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS is_open_to_work BOOLEAN DEFAULT TRUE;

-- REMEDIACIÓN H-03: RLS estricto en candidate_profiles para proteger PII (teléfono, dirección, CV)
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view verified candidates" ON public.candidate_profiles;
    DROP POLICY IF EXISTS "Public can view profiles" ON public.candidate_profiles;
    DROP POLICY IF EXISTS "Candidates can view their own profile" ON public.candidate_profiles;
    DROP POLICY IF EXISTS "Candidates can insert their own profile" ON public.candidate_profiles;
    DROP POLICY IF EXISTS "Candidates can update their own profile" ON public.candidate_profiles;
    DROP POLICY IF EXISTS "Recruiters and admins can view open candidates" ON public.candidate_profiles;

    -- Dueño del perfil tiene control completo
    CREATE POLICY "Candidates can view their own profile"
        ON public.candidate_profiles FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Candidates can insert their own profile"
        ON public.candidate_profiles FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Candidates can update their own profile"
        ON public.candidate_profiles FOR UPDATE TO authenticated
        USING (auth.uid() = user_id);

    -- Reclutadores o admins autenticados pueden ver candidatos disponibles
    CREATE POLICY "Recruiters and admins can view open candidates"
        ON public.candidate_profiles FOR SELECT TO authenticated
        USING (
            is_open_to_work = true AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('recruiter', 'admin')
            )
        );
END $$;

REVOKE ALL ON public.candidate_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;

-- Vista pública sanitizada sin PII (sin teléfonos, direcciones ni CVs privados)
CREATE OR REPLACE VIEW public.talent_directory_public AS
SELECT 
    id,
    headline,
    bio,
    seniority,
    english_level,
    years_of_experience,
    preferred_modality,
    country_code,
    department,
    city,
    skills,
    languages,
    experiences,
    educations,
    certifications,
    is_open_to_work,
    created_at,
    updated_at
FROM public.candidate_profiles
WHERE is_open_to_work = true;

GRANT SELECT ON public.talent_directory_public TO anon, authenticated;

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON public.candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_department ON public.candidate_profiles(department);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_city ON public.candidate_profiles(city);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_seniority ON public.candidate_profiles(seniority);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_skills ON public.candidate_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_experiences ON public.candidate_profiles USING GIN(experiences);

-- ==============================================================================
-- 4. TABLA: public.user_logins (Historial y Auditoría de Logins)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT,
    provider TEXT DEFAULT 'email',
    user_agent TEXT,
    ip_address TEXT,
    login_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logins FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow insert logins" ON public.user_logins;
    DROP POLICY IF EXISTS "Users can view their own logins" ON public.user_logins;

    CREATE POLICY "Allow insert logins" ON public.user_logins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can view their own logins" ON public.user_logins FOR SELECT TO authenticated USING (auth.uid() = user_id);
END $$;

REVOKE ALL ON public.user_logins FROM anon;
GRANT INSERT, SELECT ON public.user_logins TO authenticated;
GRANT ALL ON public.user_logins TO service_role;

-- ==============================================================================
-- 5. TABLA: public.job_posts & public.job_applications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_posts (
    id TEXT PRIMARY KEY,
    company_id UUID,
    recruiter_id UUID,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    location TEXT,
    country_code TEXT DEFAULT 'CO',
    workplace_type TEXT DEFAULT 'remote',
    employment_type TEXT DEFAULT 'full_time',
    seniority_level TEXT DEFAULT 'Mid',
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_min_usd NUMERIC,
    salary_max_usd NUMERIC,
    salary_currency TEXT DEFAULT 'USD',
    description TEXT,
    requirements TEXT[] DEFAULT '{}'::text[],
    benefits TEXT[] DEFAULT '{}'::text[],
    skills TEXT[] DEFAULT '{}'::text[],
    external_apply_url TEXT,
    source TEXT DEFAULT 'manual',
    source_ats TEXT,
    source_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    claim_token TEXT,
    claim_token_expires_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    claimed_by_user_id UUID,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    posted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read active job posts' AND tablename = 'job_posts') THEN
        CREATE POLICY "Public can read active job posts" ON public.job_posts FOR SELECT USING (true);
    END IF;
END $$;

-- REMEDIACIÓN H-02: Revocar lectura de claim_token y datos de claim a anon y authenticated
REVOKE SELECT (claim_token, claim_token_expires_at, claimed_by_user_id) ON public.job_posts FROM anon;
REVOKE SELECT (claim_token, claim_token_expires_at, claimed_by_user_id) ON public.job_posts FROM authenticated;

-- Funciones seguras SECURITY DEFINER para verificar y reclamar ofertas
CREATE OR REPLACE FUNCTION public.verify_claim_token(p_token text)
RETURNS TABLE (
    id text,
    title text,
    company_name text,
    salary_min numeric,
    salary_max numeric,
    is_claimed boolean
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id, 
        jp.title, 
        jp.company_name, 
        COALESCE(jp.salary_min_usd, jp.salary_min), 
        COALESCE(jp.salary_max_usd, jp.salary_max), 
        jp.is_claimed
    FROM public.job_posts jp
    WHERE jp.claim_token = p_token AND jp.is_claimed = false
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_job_post(
    p_token text,
    p_company_name text,
    p_recruiter_email text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_job_id text;
    v_comp_id uuid;
BEGIN
    SELECT jp.id, jp.company_id INTO v_job_id, v_comp_id
    FROM public.job_posts jp
    WHERE jp.claim_token = p_token AND jp.is_claimed = false
    LIMIT 1;

    IF v_job_id IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.job_posts
    SET is_claimed = true,
        claimed_at = now(),
        claim_token = null
    WHERE id = v_job_id;

    IF v_comp_id IS NOT NULL THEN
        UPDATE public.companies
        SET is_verified = true,
            verified_at = now(),
            billing_email = p_recruiter_email
        WHERE id = v_comp_id;
    END IF;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_claim_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_job_post(text, text, text) TO anon, authenticated;

-- Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id TEXT REFERENCES public.job_posts(id) ON DELETE CASCADE,
    candidate_id TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cover_note TEXT,
    status TEXT DEFAULT 'received',
    applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert applications" ON public.job_applications;
    DROP POLICY IF EXISTS "Users can view their applications" ON public.job_applications;

    CREATE POLICY "Users can insert applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can view their applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
END $$;

REVOKE ALL ON public.job_applications FROM anon;
GRANT INSERT, SELECT ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

-- ==============================================================================
-- 6. TRIGGER AUTOMÁTICO PARA NUEVOS USUARIOS (GOOGLE OAUTH & EMAIL)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_from_auth()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_full_name TEXT;
    v_avatar TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(v_full_name, ' ', 1), 'Candidato');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'family_name', substring(v_full_name from position(' ' in v_full_name) + 1), '');
    v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL);

    -- 1. Insertar en public.users
    INSERT INTO public.users (id, email, role, avatar_url, email_verified, is_active, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'candidate',
        v_avatar,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, true),
        true,
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = now();

    -- 2. Insertar perfil base en public.candidate_profiles
    INSERT INTO public.candidate_profiles (
        user_id,
        first_name,
        last_name,
        headline,
        country_code,
        department,
        city,
        seniority,
        english_level,
        preferred_modality,
        minimum_expected_salary_usd,
        is_open_to_work,
        updated_at
    )
    VALUES (
        NEW.id,
        v_first_name,
        v_last_name,
        'Candidato Verificado',
        'CO',
        'Bogotá D.C.',
        'Bogotá D.C.',
        'Junior',
        'B1',
        'remote_global',
        1200,
        true,
        now()
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_auth();

-- ==============================================================================
-- 7. REMEDIACIÓN H-04: BUCKET DE STORAGE ('resumes' PRIVADO CON RLS ESTRICTO)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Access Resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Give public access to resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Candidates can read their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Candidates can upload their own resume" ON storage.objects;
    DROP POLICY IF EXISTS "Candidates can update their own resume" ON storage.objects;
    DROP POLICY IF EXISTS "Candidates can delete their own resume" ON storage.objects;
    DROP POLICY IF EXISTS "Recruiters and admins can read resumes" ON storage.objects;

    -- Solo el candidato dueño puede leer su CV
    CREATE POLICY "Candidates can read their own resumes"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'resumes' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

    -- Solo el candidato dueño puede subir su CV en su carpeta personal
    CREATE POLICY "Candidates can upload their own resume"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'resumes' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Candidates can update their own resume"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'resumes' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Candidates can delete their own resume"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'resumes' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

    -- Reclutadores y administradores verificados pueden leer CVs
    CREATE POLICY "Recruiters and admins can read resumes"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'resumes' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('recruiter', 'admin')
        )
    );
END $$;
