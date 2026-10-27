-- ==============================================================================
-- CAMELLO ONLINE - MIGRACIÓN: URLs ESTABLES + ÍNDICES DE RENDIMIENTO (job_posts)
-- ==============================================================================
-- Objetivo:
--   1. Garantizar que cada vacante tenga un slug (URL) ÚNICO y estable entre corridas.
--      El scraper ahora genera slugs determinísticos (sin sufijo aleatorio) y hace
--      UPSERT por source_job_id; estos índices evitan duplicados futuros.
--   2. Mejorar el rendimiento de las consultas de listado, filtros y sitemap.
--
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor (o vía `supabase db push`).
-- Es idempotente (IF NOT EXISTS).

-- 1. Slugs únicos (clave de URL estable para SEO)
CREATE UNIQUE INDEX IF NOT EXISTS job_posts_slug_key ON public.job_posts(slug);

-- 2. Dedup por fuente: un mismo job (misma fuente + id) no puede existir dos veces
CREATE UNIQUE INDEX IF NOT EXISTS job_posts_source_job_id_key
    ON public.job_posts(source_job_id)
    WHERE source_job_id IS NOT NULL;

-- 3. Índices de consulta para listados, filtros y sitemap
CREATE INDEX IF NOT EXISTS job_posts_status_idx ON public.job_posts(status);
CREATE INDEX IF NOT EXISTS job_posts_work_modality_idx ON public.job_posts(work_modality);
CREATE INDEX IF NOT EXISTS job_posts_is_zero_experience_idx ON public.job_posts(is_zero_experience);
CREATE INDEX IF NOT EXISTS job_posts_created_at_idx ON public.job_posts(created_at DESC);

-- Recargar caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
