-- FIX: companies.website es NOT NULL pero request_company_claim no lo setea.
ALTER TABLE public.companies ALTER COLUMN website DROP NOT NULL;
NOTIFY pgrst, 'reload schema';
