-- ==============================================================================
-- CAMELLO ONLINE - HARDENING: quitar acceso anónimo a funciones privilegiadas
-- ==============================================================================
-- publish_company_job era SECURITY DEFINER y estaba expuesta a `anon`, permitiendo
-- a cualquiera crear empresas/vacantes sin login (spam). Se revoca de anon/authenticated
-- y se deja solo para service_role. La API /api/companies/publish usa la service_role
-- (supabaseAdmin), así que la publicación SEGUIRÁ FUNCIONANDO desde la web.

REVOKE EXECUTE ON FUNCTION public.publish_company_job(text, text, text, text, text, text, text, numeric, numeric, text, boolean, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_company_job(text, text, text, text, text, text, text, numeric, numeric, text, boolean, text) TO service_role;

NOTIFY pgrst, 'reload schema';
