
-- Table to store Stripe API keys per company
CREATE TABLE public.stripe_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id TEXT NOT NULL UNIQUE,
  stripe_publishable_key TEXT NOT NULL,
  stripe_secret_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

ALTER TABLE public.stripe_keys ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read keys for their company (we'll filter by empresa_id in app)
CREATE POLICY "Anyone can read stripe keys" ON public.stripe_keys FOR SELECT USING (true);
CREATE POLICY "Anyone can insert stripe keys" ON public.stripe_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stripe keys" ON public.stripe_keys FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_stripe_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stripe_keys_updated_at
BEFORE UPDATE ON public.stripe_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_stripe_keys_updated_at();
