-- Dedup de emails de candidatos (evita duplicados por rate limit de Resend).
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS last_jobs_email_sent_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_invite_sent_at TIMESTAMPTZ;
NOTIFY pgrst, 'reload schema';
