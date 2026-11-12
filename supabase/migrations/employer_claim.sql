-- ==============================================================================
-- CAMELLO ONLINE - RECLAMO DE EMPRESA (token por email)
-- Una empresa debe reclamar su perfil (verificar su email) antes de publicar.
-- ==============================================================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS claim_token TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;

-- Solicita reclamo: genera un token (7 días) para la empresa y lo devuelve a la API
-- para que se lo envíe por email. Solo service_role puede ejecutarla.
CREATE OR REPLACE FUNCTION public.request_company_claim(p_email text, p_company_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_slug text;
    v_id uuid;
    v_token text;
BEGIN
    v_slug := lower(regexp_replace(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));
    INSERT INTO public.companies (name, slug, contact_email, is_verified, is_auto_ingested, country_code)
    VALUES (p_company_name, v_slug, p_email, false, false, 'CO')
    ON CONFLICT (slug) DO UPDATE SET contact_email = COALESCE(EXCLUDED.contact_email, public.companies.contact_email)
    RETURNING id INTO v_id;

    v_token := encode(gen_random_bytes(18), 'hex');
    UPDATE public.companies SET claim_token = v_token, claim_token_expires_at = now() + interval '7 days' WHERE id = v_id;
    RETURN jsonb_build_object('company_id', v_id, 'token', v_token);
END;
$$;

-- Verifica el token y marca la empresa como reclamada/verificada. Devuelve la empresa o NULL.
CREATE OR REPLACE FUNCTION public.verify_company_claim(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_id uuid;
    v_name text;
BEGIN
    SELECT id, name INTO v_id, v_name FROM public.companies WHERE claim_token = p_token AND claim_token_expires_at > now();
    IF v_id IS NULL THEN RETURN NULL; END IF;
    UPDATE public.companies SET is_claimed = true, is_verified = true WHERE id = v_id;
    RETURN jsonb_build_object('company_id', v_id, 'name', v_name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_company_claim(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_company_claim(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_company_claim(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_company_claim(text) TO service_role;

NOTIFY pgrst, 'reload schema';
