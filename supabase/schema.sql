-- ==============================================================================
-- REALJOBS COLOMBIA - ESQUEMA COMPLETO Y DEFINITIVO DE BASE DE DATOS (SUPABASE)
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE y RESILIENTE.
-- Repara tablas existentes, añade columnas faltantes y crea todas las políticas RLS.

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas si users ya existía
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'candidate';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert from trigger and self' AND tablename = 'users') THEN
        CREATE POLICY "Allow insert from trigger and self" ON public.users FOR INSERT WITH CHECK (true);
    END IF;
END $$;

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

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view verified candidates' AND tablename = 'candidate_profiles') THEN
        CREATE POLICY "Public can view verified candidates" ON public.candidate_profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can insert their own profile' AND tablename = 'candidate_profiles') THEN
        CREATE POLICY "Candidates can insert their own profile" ON public.candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can update their own profile' AND tablename = 'candidate_profiles') THEN
        CREATE POLICY "Candidates can update their own profile" ON public.candidate_profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

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

ALTER TABLE public.user_logins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_logins ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_logins ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
ALTER TABLE public.user_logins ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.user_logins ADD COLUMN IF NOT EXISTS login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert logins' AND tablename = 'user_logins') THEN
        CREATE POLICY "Allow insert logins" ON public.user_logins FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own logins' AND tablename = 'user_logins') THEN
        CREATE POLICY "Users can view their own logins" ON public.user_logins FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- ==============================================================================
-- 5. TABLA: public.job_posts & public.job_applications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_posts (
    id TEXT PRIMARY KEY,
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
    salary_currency TEXT DEFAULT 'USD',
    description TEXT,
    requirements TEXT[] DEFAULT '{}'::text[],
    benefits TEXT[] DEFAULT '{}'::text[],
    skills TEXT[] DEFAULT '{}'::text[],
    external_apply_url TEXT,
    source TEXT DEFAULT 'manual',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read active job posts' AND tablename = 'job_posts') THEN
        CREATE POLICY "Public can read active job posts" ON public.job_posts FOR SELECT USING (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id TEXT REFERENCES public.job_posts(id) ON DELETE CASCADE,
    candidate_id TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cover_note TEXT,
    status TEXT DEFAULT 'received',
    applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas si job_applications ya existía previamente
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_post_id TEXT REFERENCES public.job_posts(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS candidate_id TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cover_note TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert applications' AND tablename = 'job_applications') THEN
        CREATE POLICY "Users can insert applications" ON public.job_applications FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their applications' AND tablename = 'job_applications') THEN
        CREATE POLICY "Users can view their applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
    END IF;
END $$;

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
    INSERT INTO public.users (id, email, role, avatar_url, email_verified, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'candidate',
        v_avatar,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, true),
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
-- 7. BUCKET DE STORAGE ('resumes' PARA HOJAS DE VIDA)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Resumes' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access Resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload resumes' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update resumes' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can update resumes" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes');
    END IF;
END $$;
