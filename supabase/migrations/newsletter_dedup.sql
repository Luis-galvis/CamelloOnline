-- Dedup del newsletter: guarda cuándo se envió el último newsletter a cada suscriptor.
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS last_newsletter_sent_at TIMESTAMPTZ;
NOTIFY pgrst, 'reload schema';
