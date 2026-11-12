-- ==============================================================================
-- CAMELLO ONLINE - REFERIDOS (incentivo "vacantes premium")
-- Cada persona invitada suma puntos; los referidores reciben las vacantes más nuevas.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_email TEXT NOT NULL,
    referred_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon can insert referrals" ON public.referrals;
CREATE POLICY "Anon can insert referrals"
    ON public.referrals FOR INSERT TO anon WITH CHECK (true);
GRANT ALL ON public.referrals TO service_role;
GRANT INSERT ON public.referrals TO anon;
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_email);

NOTIFY pgrst, 'reload schema';
