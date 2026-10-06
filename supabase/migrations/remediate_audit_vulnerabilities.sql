-- ==============================================================================
-- REALJOBS / CAMELLO ONLINE - REMEDIACIÓN INTEGRAL DE VULNERABILIDADES DE SEGURIDAD
-- Basado en informe de auditoría: H-01, H-02, H-03, H-04, H-05, H-06
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REMEDIACIÓN H-06: Eliminar columna sensible encrypted_password de public.users
-- Supabase gestiona contraseñas en el esquema auth.users, nunca en public.users.
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.users DROP COLUMN IF EXISTS encrypted_password;

-- ------------------------------------------------------------------------------
-- 2. REMEDIACIÓN H-05: Restricción estricta de RLS en public.users (Emails protegidos)
-- Anon ya NO puede consultar emails de usuarios vía API de PostgREST.
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores permisivas si existen
DROP POLICY IF EXISTS "Public can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert from trigger and self" ON public.users;

-- Solo el propio usuario autenticado puede leer su propio registro
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Solo el propio usuario autenticado puede actualizar su perfil
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Permitir inserción desde trigger (SECURITY DEFINER) y por el propio usuario autenticado
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Revocar permisos SELECT a rol anon
REVOKE ALL ON public.users FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- ------------------------------------------------------------------------------
-- 3. REMEDIACIÓN H-03: Proteger PII de candidatos en public.candidate_profiles
-- Oculta teléfono, dirección física, salario y CV a usuarios anónimos.
-- ------------------------------------------------------------------------------
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles FORCE ROW LEVEL SECURITY;

-- Eliminar la política insegura previa que exponía todos los datos a anon
DROP POLICY IF EXISTS "Public can view verified candidates" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Candidates can view their own profile" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Candidates can insert their own profile" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Candidates can update their own profile" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Recruiters and admins can view open candidates" ON public.candidate_profiles;

-- El candidato autenticado puede ver y editar su perfil completo
CREATE POLICY "Candidates can view their own profile"
ON public.candidate_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Candidates can insert their own profile"
ON public.candidate_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update their own profile"
ON public.candidate_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Reclutadores o administradores autenticados pueden ver candidatos abiertos a trabajar
CREATE POLICY "Recruiters and admins can view open candidates"
ON public.candidate_profiles
FOR SELECT
TO authenticated
USING (
  is_open_to_work = true AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('recruiter', 'admin')
  )
);

-- Revocar acceso directo de anon a candidate_profiles
REVOKE ALL ON public.candidate_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;

-- Vista pública desinfectada sin PII para el directorio de talento anónimo
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

-- ------------------------------------------------------------------------------
-- 4. REMEDIACIÓN H-02: Ocultar claim_token de ofertas en public.job_posts
-- Revocar selección de claim_token y claim_token_expires_at a anon y authenticated.
-- ------------------------------------------------------------------------------
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Revocar explícitamente lectura de claim_token a los roles públicos
REVOKE SELECT (claim_token, claim_token_expires_at, claimed_by_user_id) ON public.job_posts FROM anon;
REVOKE SELECT (claim_token, claim_token_expires_at, claimed_by_user_id) ON public.job_posts FROM authenticated;

-- Función segura SECURITY DEFINER para verificar si un token de reclamo es válido
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

-- Función segura SECURITY DEFINER para reclamar una vacante sin exponer tokens
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

-- ------------------------------------------------------------------------------
-- 5. REMEDIACIÓN H-04: Storage Bucket resumes privado y RLS estricto
-- ------------------------------------------------------------------------------
-- Asegurar que el bucket sea privado
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

-- Eliminar políticas públicas del bucket resumes
DROP POLICY IF EXISTS "Public Access Resumes" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can read their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can upload their own resume" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update their own resume" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete their own resume" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters and admins can read resumes" ON storage.objects;

-- El candidato puede leer sus propios archivos de CV
CREATE POLICY "Candidates can read their own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- El candidato puede subir su propio archivo de CV a su carpeta
CREATE POLICY "Candidates can upload their own resume"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- El candidato puede actualizar su propio archivo de CV
CREATE POLICY "Candidates can update their own resume"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- El candidato puede eliminar su propio archivo de CV
CREATE POLICY "Candidates can delete their own resume"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Reclutadores y administradores autorizados pueden leer CVs
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
