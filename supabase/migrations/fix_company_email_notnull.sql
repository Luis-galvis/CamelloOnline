-- ==============================================================================
-- FIX: domain_email de companies es NOT NULL pero las funciones de reclamo/publicación
-- no lo setean, causando "null value in column domain_email violates not-null constraint".
-- Lo hacemos opcional (el email real de contacto vive en contact_email).
-- ==============================================================================

ALTER TABLE public.companies ALTER COLUMN domain_email DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
